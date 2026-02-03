import 'package:flutter/material.dart';
import '../services/algo_trading_service.dart';
import '../services/push_notification_service.dart';
import '../services/permission_location_service.dart';
import '../models/crypto_coin.dart';
import 'coin_detail_screen.dart';

class HistoryPage extends StatefulWidget {
  const HistoryPage({super.key});

  @override
  State<HistoryPage> createState() => HistoryPageState();
}

class HistoryPageState extends State<HistoryPage> {
  void refresh() => _loadData();
  final AlgoTradingService _algoService = AlgoTradingService();

  List<Map<String, dynamic>> _activeTrades = [];
  List<Map<String, dynamic>> _completedTrades = [];
  double _totalProfit = 0.0;
  double _profitLossRatio = 0.0;
  bool _isLoading = true;

  String _periodFilter = 'all'; // 7d, 30d, 90d, all
  String? _symbolFilter; // null = All pairs
  List<String> _allSymbols = [];

  static double _toDouble(dynamic v) {
    if (v == null) return 0.0;
    if (v is int) return (v as int).toDouble();
    if (v is double) return v;
    return double.tryParse(v.toString()) ?? 0.0;
  }

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    setState(() => _isLoading = true);
    try {
      final activeTrades = await _algoService.getActiveTrades();
      final profitDetails = await _algoService.getProfitDetails(
        period: _periodFilter,
        symbol: _symbolFilter,
      );
      final totalProfit = _toDouble(profitDetails['totalProfit']);
      final tradeHistory = profitDetails['tradeHistory'] as List? ?? [];
      final completed = List<Map<String, dynamic>>.from(
        tradeHistory.map((e) => Map<String, dynamic>.from(e as Map)),
      );
      completed.sort((a, b) {
        final aDate = _parseDate(a['stoppedAt']);
        final bDate = _parseDate(b['stoppedAt']);
        return bDate.compareTo(aDate);
      });

      final symbols = <String>{};
      for (var t in activeTrades) {
        final s = t['symbol']?.toString();
        if (s != null && s.isNotEmpty) symbols.add(s);
      }
      for (var t in completed) {
        final s = t['symbol']?.toString();
        if (s != null && s.isNotEmpty) symbols.add(s);
      }
      _allSymbols = symbols.toList()..sort();

      double totalProfitAmount = 0.0;
      double totalLossAmount = 0.0;
      for (var t in completed) {
        final p = _toDouble(t['profit']);
        if (p > 0) totalProfitAmount += p;
        else totalLossAmount += p.abs();
      }
      final ratio = totalLossAmount > 0
          ? totalProfitAmount / totalLossAmount
          : (totalProfitAmount > 0 ? 999.0 : 0.0);

      if (mounted) {
        setState(() {
          _activeTrades = activeTrades;
          _completedTrades = completed;
          _totalProfit = totalProfit;
          _profitLossRatio = ratio;
          _isLoading = false;
        });
        final symbols = activeTrades
            .map((t) => t['symbol']?.toString() ?? '')
            .where((s) => s.isNotEmpty)
            .toList();
        PushNotificationService.updateTradeRunning(
          activeCount: activeTrades.length,
          symbols: symbols,
        );
      }
    } catch (_) {
      if (mounted) {
        setState(() {
          _activeTrades = [];
          _completedTrades = [];
          _totalProfit = 0.0;
          _profitLossRatio = 0.0;
          _isLoading = false;
        });
        PushNotificationService.updateTradeRunning(activeCount: 0);
      }
    }
  }

  DateTime _parseDate(dynamic v) {
    if (v == null) return DateTime(1970);
    if (v is DateTime) return v;
    try {
      return DateTime.parse(v.toString());
    } catch (_) {
      return DateTime(1970);
    }
  }

  String _formatDate(dynamic date) {
    if (date == null) return '—';
    try {
      final d = date is DateTime ? date : DateTime.parse(date.toString());
      return '${d.day}/${d.month}/${d.year} ${d.hour.toString().padLeft(2, '0')}:${d.minute.toString().padLeft(2, '0')}';
    } catch (_) {
      return '—';
    }
  }

  String? _formatLocation(dynamic loc) {
    if (loc == null || loc is! Map) return null;
    final lat = loc['latitude'];
    final lng = loc['longitude'];
    final address = loc['address']?.toString();
    if (lat == null && lng == null) return null;
    if (address != null && address.isNotEmpty) return address;
    final latNum = lat is num ? (lat as num).toDouble() : (lat != null ? double.tryParse(lat.toString()) : null);
    final lngNum = lng is num ? (lng as num).toDouble() : (lng != null ? double.tryParse(lng.toString()) : null);
    if (latNum != null && lngNum != null) return '${latNum.toStringAsFixed(4)}, ${lngNum.toStringAsFixed(4)}';
    return null;
  }

  static String _parseQuote(String symbol) {
    final u = symbol.toUpperCase();
    if (u.endsWith('USDT')) return 'USDT';
    if (u.endsWith('BUSD')) return 'BUSD';
    if (u.endsWith('USDC')) return 'USDC';
    if (u.endsWith('BTC')) return 'BTC';
    if (u.endsWith('ETH')) return 'ETH';
    return 'USDT';
  }

  static String _parseBase(String symbol) {
    final quote = _parseQuote(symbol);
    final u = symbol.toUpperCase();
    if (u.endsWith(quote)) return u.substring(0, u.length - quote.length);
    return u;
  }

  static CryptoCoin _coinFromSymbol(String symbol) {
    final base = _parseBase(symbol);
    return CryptoCoin(
      id: symbol.toLowerCase(),
      symbol: base,
      name: base,
      currentPrice: 0,
      priceChange24h: 0,
      priceChangePercentage24h: 0,
      volume24h: 0,
    );
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Scaffold(
      appBar: AppBar(
        title: const Text('History'),
        centerTitle: true,
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _isLoading ? null : _loadData,
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: _loadData,
        child: _isLoading
            ? const Center(child: CircularProgressIndicator())
            : CustomScrollView(
                physics: const AlwaysScrollableScrollPhysics(),
                slivers: [
                  SliverToBoxAdapter(child: _buildTopActions(theme)),
                  SliverToBoxAdapter(child: _buildFilters(theme)),
                  SliverToBoxAdapter(child: _buildSummaryCards(theme)),
                  const SliverToBoxAdapter(child: SizedBox(height: 16)),
                  SliverToBoxAdapter(
                    child: Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 16),
                      child: Text(
                        'Active Trades',
                        style: theme.textTheme.titleMedium?.copyWith(
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ),
                  const SliverToBoxAdapter(child: SizedBox(height: 8)),
                  if (_activeTrades.isEmpty)
                    SliverToBoxAdapter(
                      child: _buildEmptyCard(theme, 'No active trades'),
                    )
                  else
                    SliverList(
                      delegate: SliverChildBuilderDelegate(
                        (_, i) => _buildActiveTradeTile(theme, _activeTrades[i]),
                        childCount: _activeTrades.length,
                      ),
                    ),
                  const SliverToBoxAdapter(child: SizedBox(height: 24)),
                  SliverToBoxAdapter(
                    child: Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 16),
                      child: Text(
                        'Completed Trades',
                        style: theme.textTheme.titleMedium?.copyWith(
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ),
                  const SliverToBoxAdapter(child: SizedBox(height: 8)),
                  if (_completedTrades.isEmpty)
                    SliverToBoxAdapter(
                      child: _buildEmptyCard(theme, 'No completed trades yet'),
                    )
                  else
                    SliverList(
                      delegate: SliverChildBuilderDelegate(
                        (_, i) => _buildCompletedTradeTile(
                            theme, _completedTrades[i]),
                        childCount: _completedTrades.length,
                      ),
                    ),
                  const SliverToBoxAdapter(child: SizedBox(height: 24)),
                ],
              ),
      ),
    );
  }

  Widget _buildTopActions(ThemeData theme) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
      child: SingleChildScrollView(
        scrollDirection: Axis.horizontal,
        child: Row(
          children: [
            _actionChip(
              theme,
              label: 'MT5',
              icon: Icons.show_chart,
              onTap: () {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(
                      content: Text('MT5 integration coming soon'),
                      duration: Duration(seconds: 2)),
                );
              },
            ),
            const SizedBox(width: 8),
            _actionChip(
              theme,
              label: 'Close all',
              icon: Icons.stop_circle,
              onTap: _activeTrades.isEmpty
                  ? null
                  : () => _confirmBulkStop(
                        'Close all ${_activeTrades.length} trade(s)?',
                        () => _algoService.stopAllTrades(),
                      ),
            ),
            const SizedBox(width: 8),
            _actionChip(
              theme,
              label: 'Close profitable',
              icon: Icons.trending_up,
              onTap: () {
                final profitable = _activeTrades
                    .where((t) => _toDouble(t['unrealizedPnL']) > 0)
                    .length;
                if (profitable == 0) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(
                        content: Text('No profitable trades to close')),
                  );
                  return;
                }
                _confirmBulkStop(
                  'Close $profitable profitable trade(s)?',
                  () => _algoService.stopAllProfitableTrades(),
                );
              },
            ),
            const SizedBox(width: 8),
            _actionChip(
              theme,
              label: 'Close loss',
              icon: Icons.trending_down,
              onTap: () {
                final loss = _activeTrades
                    .where((t) => _toDouble(t['unrealizedPnL']) < 0)
                    .length;
                if (loss == 0) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(
                        content: Text('No loss trades to close')),
                  );
                  return;
                }
                _confirmBulkStop(
                  'Close $loss loss trade(s)?',
                  () => _algoService.stopAllLossTrades(),
                );
              },
            ),
          ],
        ),
      ),
    );
  }

  Widget _actionChip(
    ThemeData theme,
    {required String label,
    required IconData icon,
    VoidCallback? onTap}) {
    return Material(
      color: theme.cardColor,
      borderRadius: BorderRadius.circular(20),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(20),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(20),
            border: Border.all(
                color: theme.dividerColor.withOpacity(0.5)),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(icon, size: 18, color: theme.colorScheme.primary),
              const SizedBox(width: 6),
              Text(label, style: theme.textTheme.labelLarge),
            ],
          ),
        ),
      ),
    );
  }

  Future<void> _confirmBulkStop(String message, Future<int> Function() stopFn) async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Confirm'),
        content: Text(message),
        actions: [
          TextButton(
              onPressed: () => Navigator.pop(ctx, false),
              child: const Text('Cancel')),
          TextButton(
              onPressed: () => Navigator.pop(ctx, true),
              child: const Text('Close')),
        ],
      ),
    );
    if (ok != true || !mounted) return;
    try {
      final count = await stopFn();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
              content: Text('Closed $count trade(s)'),
              backgroundColor: Colors.green),
        );
        _loadData();
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: $e'), backgroundColor: Colors.red),
        );
      }
    }
  }

  Widget _buildFilters(ThemeData theme) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: Row(
        children: [
          Expanded(
            child: DropdownButtonFormField<String>(
              value: _periodFilter,
              decoration: InputDecoration(
                labelText: 'Time',
                isDense: true,
                contentPadding:
                    const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(8),
                ),
              ),
              items: const [
                DropdownMenuItem(value: '7d', child: Text('Last 7 days')),
                DropdownMenuItem(value: '30d', child: Text('Last 30 days')),
                DropdownMenuItem(value: '90d', child: Text('Last 90 days')),
                DropdownMenuItem(value: 'all', child: Text('All time')),
              ],
              onChanged: (v) {
                if (v != null) {
                  setState(() {
                    _periodFilter = v;
                    _loadData();
                  });
                }
              },
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: DropdownButtonFormField<String?>(
              value: _symbolFilter,
              decoration: InputDecoration(
                labelText: 'Pair',
                isDense: true,
                contentPadding:
                    const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(8),
                ),
              ),
              items: [
                const DropdownMenuItem<String?>(
                    value: null, child: Text('All pairs')),
                ..._allSymbols.map((s) => DropdownMenuItem<String?>(
                      value: s,
                      child: Text(s, overflow: TextOverflow.ellipsis),
                    )),
                if (_symbolFilter != null &&
                    _symbolFilter!.isNotEmpty &&
                    !_allSymbols.contains(_symbolFilter))
                  DropdownMenuItem<String?>(
                      value: _symbolFilter,
                      child: Text(_symbolFilter!,
                          overflow: TextOverflow.ellipsis)),
              ],
              onChanged: (v) {
                setState(() {
                  _symbolFilter = v;
                  _loadData();
                });
              },
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSummaryCards(ThemeData theme) {
    return LayoutBuilder(
      builder: (context, constraints) {
        final w = constraints.maxWidth;
        final crossCount = w > 600 ? 4 : 2;
        return Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          child: GridView.count(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            crossAxisCount: crossCount,
            mainAxisSpacing: 10,
            crossAxisSpacing: 10,
            childAspectRatio: crossCount == 4 ? 2.2 : 1.8,
            children: [
              _summaryCard(theme, 'Active', _activeTrades.length.toString(),
                  Icons.trending_up, Colors.green),
              _summaryCard(
                  theme,
                  'Completed',
                  _completedTrades.length.toString(),
                  Icons.check_circle,
                  Colors.blue),
              _summaryCard(theme, 'P:L Ratio', _profitLossRatio.toStringAsFixed(2),
                  Icons.balance, Colors.orange),
              _summaryCard(
                theme,
                'Total Profit',
                '\$${_totalProfit.toStringAsFixed(2)}',
                Icons.attach_money,
                _totalProfit >= 0 ? Colors.green : Colors.red,
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _summaryCard(
      ThemeData theme, String label, String value, IconData icon, Color color) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: theme.cardColor,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: color.withOpacity(0.3)),
        boxShadow: [
          BoxShadow(
              color: color.withOpacity(0.08),
              blurRadius: 8,
              offset: const Offset(0, 2)),
        ],
      ),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(icon, size: 18, color: color),
              const SizedBox(width: 6),
              Text(label,
                  style: TextStyle(
                      fontSize: 12,
                      color: theme.textTheme.bodySmall?.color)),
            ],
          ),
          const SizedBox(height: 6),
          FittedBox(
            fit: BoxFit.scaleDown,
            alignment: Alignment.centerLeft,
            child: Text(
              value,
              style: TextStyle(
                  fontSize: 16, fontWeight: FontWeight.bold, color: color),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildEmptyCard(ThemeData theme, String message) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 24),
      alignment: Alignment.center,
      child: Text(
        message,
        style: TextStyle(
            color: theme.textTheme.bodySmall?.color, fontSize: 14),
      ),
    );
  }

  Future<void> _cancelOrStopTrade(Map<String, dynamic> trade) async {
    final symbol = trade['symbol']?.toString() ?? '';
    if (symbol.isEmpty) return;
    final isStarted = trade['isStarted'] == true;
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(isStarted ? 'Stop trade' : 'Cancel trade'),
        content: Text(
          isStarted
              ? 'Stop the trade for $symbol? Remaining levels\' fees will be refunded.'
              : 'Cancel the trade for $symbol? No orders were placed; your fee will be refunded.',
        ),
        actions: [
          TextButton(
              onPressed: () => Navigator.pop(context, false),
              child: const Text('No')),
          ElevatedButton(
            onPressed: () => Navigator.pop(context, true),
            style: ElevatedButton.styleFrom(
                backgroundColor: Colors.red, foregroundColor: Colors.white),
            child: Text(isStarted ? 'Stop' : 'Cancel trade'),
          ),
        ],
      ),
    );
    if (confirmed != true || !mounted) return;
    try {
      final stopLocation = await PermissionLocationService.getCurrentLocation();
      await _algoService.stopAlgoTrade(symbol, stopLocation: stopLocation);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
              content: Text('Trade cancelled'),
              backgroundColor: Colors.green),
        );
        _loadData();
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: $e'), backgroundColor: Colors.red),
        );
      }
    }
  }

  Widget _buildActiveTradeTile(ThemeData theme, Map<String, dynamic> trade) {
    final symbol = trade['symbol']?.toString() ?? '—';
    final level = trade['currentLevel'];
    final totalLevels = trade['numberOfLevels'];
    final pnl = _toDouble(trade['unrealizedPnL']);
    final totalBalance = _toDouble(trade['totalBalance'] ?? trade['totalInvested']);
    final isProfit = pnl >= 0;
    final isStarted = trade['isStarted'] == true;
    return Card(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 5),
      child: ListTile(
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        title: Text(symbol, style: const TextStyle(fontWeight: FontWeight.w600)),
        subtitle: Text(
            'Level $level / $totalLevels · Balance: \$${totalBalance.toStringAsFixed(2)}'),
        trailing: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              '${pnl >= 0 ? '+' : ''}${pnl.toStringAsFixed(2)}',
              style: TextStyle(
                  fontWeight: FontWeight.bold,
                  color: isProfit ? Colors.green : Colors.red),
            ),
            IconButton(
              icon: Icon(
                  isStarted ? Icons.stop_circle : Icons.cancel,
                  color: Colors.red,
                  size: 22),
              onPressed: () => _cancelOrStopTrade(trade),
              tooltip:
                  isStarted ? 'Stop trade' : 'Cancel trade (fee refunded)',
            ),
          ],
        ),
        onTap: () => _showActiveTradeDetail(trade),
      ),
    );
  }

  Widget _buildCompletedTradeTile(ThemeData theme, Map<String, dynamic> trade) {
    final symbol = trade['symbol']?.toString() ?? '—';
    final profit = _toDouble(trade['profit']);
    final totalFees = _toDouble(trade['totalFees']);
    final isProfit = profit >= 0;
    return Card(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 5),
      child: ListTile(
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        title: Text(symbol, style: const TextStyle(fontWeight: FontWeight.w600)),
        subtitle: Text(
          'Stopped ${_formatDate(trade['stoppedAt'])} · Levels: ${trade['levels'] ?? '—'}${totalFees > 0 ? ' · Fees: \$${totalFees.toStringAsFixed(2)}' : ''}',
          style: TextStyle(
              fontSize: 12, color: theme.textTheme.bodySmall?.color),
        ),
        trailing: Text(
          '${profit >= 0 ? '+' : ''}${profit.toStringAsFixed(2)} USDT',
          style: TextStyle(
              fontWeight: FontWeight.bold,
              color: isProfit ? Colors.green : Colors.red),
        ),
        onTap: () => _showCompletedTradeDetail(trade),
      ),
    );
  }

  void _showActiveTradeDetail(Map<String, dynamic> trade) {
    final symbol = trade['symbol']?.toString() ?? '—';
    final level = trade['currentLevel'];
    final totalLevels = trade['numberOfLevels'];
    final pnl = _toDouble(trade['unrealizedPnL']);
    final currentPnL = _toDouble(trade['currentPnL']);
    final totalInvested = _toDouble(trade['totalInvested']);
    final totalBalance = _toDouble(trade['totalBalance'] ?? totalInvested);
    final direction = trade['tradeDirection'] ?? '—';
    final startPrice = _toDouble(trade['startPrice']);
    final currentPrice = _toDouble(trade['currentPrice']);
    final useMargin = trade['useMargin'] == true;
    final leverage = trade['leverage'] ?? 1;
    final fees = (trade['platformWalletFees'] as List?)
            ?.fold<double>(0, (s, e) => s + _toDouble(e)) ??
        0;
    final startedAt = trade['startedAt'];

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      builder: (context) => DraggableScrollableSheet(
        initialChildSize: 0.6,
        minChildSize: 0.3,
        maxChildSize: 0.9,
        expand: false,
        builder: (_, scrollController) => SingleChildScrollView(
          controller: scrollController,
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              Center(
                child: Container(
                  width: 40,
                  height: 4,
                  decoration: BoxDecoration(
                    color: Colors.grey[400],
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),
              const SizedBox(height: 16),
              Text('Active: $symbol',
                  style: Theme.of(context).textTheme.titleLarge),
              const SizedBox(height: 12),
              _detailRow('Pair', symbol),
              _detailRow('Direction', direction),
              _detailRow('Start time', _formatDate(startedAt)),
              _detailRow('Entry price', '\$${startPrice.toStringAsFixed(4)}'),
              _detailRow('Current price', '\$${currentPrice.toStringAsFixed(4)}'),
              _detailRow('Level', '$level / $totalLevels'),
              _detailRow('Initial balance', '\$${totalInvested.toStringAsFixed(2)}'),
              _detailRow('Current balance', '\$${totalBalance.toStringAsFixed(2)}'),
              _detailRow('Platform charges', '\$${fees.toStringAsFixed(2)}'),
              _detailRow('Margin', useMargin ? 'Yes (${leverage}x)' : 'No'),
              _detailRow(
                  'Unrealized P&L',
                  '${pnl >= 0 ? '+' : ''}${pnl.toStringAsFixed(2)} USDT',
                  color: pnl >= 0 ? Colors.green : Colors.red),
              _detailRow(
                  'P&L %',
                  '${currentPnL >= 0 ? '+' : ''}${currentPnL.toStringAsFixed(2)}%',
                  color: currentPnL >= 0 ? Colors.green : Colors.red),
              if (_formatLocation(trade['startLocation']) != null)
                _detailRow('Start location', _formatLocation(trade['startLocation'])!),
              const SizedBox(height: 20),
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton.icon(
                      onPressed: () {
                        Navigator.pop(context);
                        _openCoinAndStartAgain(symbol);
                      },
                      icon: const Icon(Icons.open_in_new, size: 18),
                      label: const Text('Open coin & start again'),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: ElevatedButton.icon(
                      onPressed: () {
                        Navigator.pop(context);
                        _cancelOrStopTrade(trade);
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.red,
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 12),
                      ),
                      icon: Icon(trade['isStarted'] == true
                          ? Icons.stop_circle
                          : Icons.cancel),
                      label: Text(trade['isStarted'] == true
                          ? 'Stop trade'
                          : 'Cancel trade'),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  void _showCompletedTradeDetail(Map<String, dynamic> trade) {
    final symbol = trade['symbol']?.toString() ?? '—';
    final profit = _toDouble(trade['profit']);
    final reason = trade['reason']?.toString() ?? '—';
    final levels = trade['levels']?.toString() ?? '—';
    final stoppedAt = _formatDate(trade['stoppedAt']);
    final startedAt = _formatDate(trade['startedAt']);
    final totalFees = _toDouble(trade['totalFees']);
    final platformWalletFees = trade['platformWalletFees'] as List? ?? [];
    final numberOfLevels = trade['numberOfLevels']?.toString() ?? '—';
    final totalInvested = _toDouble(trade['totalInvested']);
    final finalBalance = totalInvested + profit;
    final startPrice = _toDouble(trade['startPrice']);
    final useMargin = trade['useMargin'] == true;
    final leverage = trade['leverage'] ?? 1;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      builder: (context) => DraggableScrollableSheet(
        initialChildSize: 0.65,
        minChildSize: 0.3,
        maxChildSize: 0.9,
        expand: false,
        builder: (_, scrollController) => SingleChildScrollView(
          controller: scrollController,
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              Center(
                child: Container(
                  width: 40,
                  height: 4,
                  decoration: BoxDecoration(
                    color: Colors.grey[400],
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),
              const SizedBox(height: 16),
              Text('Completed: $symbol',
                  style: Theme.of(context).textTheme.titleLarge),
              const SizedBox(height: 12),
              _detailRow('Pair', symbol),
              _detailRow('Start time', startedAt),
              _detailRow('End time', stoppedAt),
              _detailRow('Entry price', '\$${startPrice.toStringAsFixed(4)}'),
              _detailRow('Exit price', '—'), // Backend doesn't store sell price
              _detailRow('Levels', '$levels / $numberOfLevels'),
              _detailRow('Initial balance', '\$${totalInvested.toStringAsFixed(2)}'),
              _detailRow('Final balance', '\$${finalBalance.toStringAsFixed(2)}'),
              _detailRow(
                  'Profit/Loss',
                  '${profit >= 0 ? '+' : ''}${profit.toStringAsFixed(2)} USDT',
                  color: profit >= 0 ? Colors.green : Colors.red),
              _detailRow('Platform charges', '\$${totalFees.toStringAsFixed(2)}'),
              _detailRow('Margin', useMargin ? 'Yes (${leverage}x)' : 'No'),
              if (_formatLocation(trade['startLocation']) != null)
                _detailRow('Start location', _formatLocation(trade['startLocation'])!),
              if (_formatLocation(trade['stopLocation']) != null)
                _detailRow('Stop location', _formatLocation(trade['stopLocation'])!),
              _detailRow('Reason', reason),
              if (platformWalletFees.isNotEmpty) ...[
                const SizedBox(height: 8),
                Text('Fees by level',
                    style: Theme.of(context).textTheme.titleSmall),
                ...platformWalletFees.asMap().entries.map((e) => Padding(
                      padding: const EdgeInsets.symmetric(vertical: 2),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(
                              'Level ${e.key + 1}',
                              style: TextStyle(
                                  fontSize: 12,
                                  color: Theme.of(context)
                                      .textTheme
                                      .bodySmall
                                      ?.color)),
                          Text(
                              '\$${_toDouble(e.value).toStringAsFixed(2)}',
                              style: const TextStyle(
                                  fontSize: 12,
                                  fontWeight: FontWeight.w600)),
                        ],
                      ),
                    )),
              ],
              const SizedBox(height: 16),
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton.icon(
                      onPressed: () {
                        Navigator.pop(context);
                        _openCoinAndStartAgain(symbol);
                      },
                      icon: const Icon(Icons.open_in_new, size: 18),
                      label: const Text('Open coin & start again'),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: OutlinedButton.icon(
                      onPressed: () {
                        Navigator.pop(context);
                        _showTransactionHistory(symbol);
                      },
                      icon: const Icon(Icons.history, size: 18),
                      label: const Text('Transactions'),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  void _openCoinAndStartAgain(String symbol) {
    final quote = _parseQuote(symbol);
    final coin = _coinFromSymbol(symbol);
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => CoinDetailScreen(
          coin: coin,
          quoteCurrency: quote,
        ),
      ),
    );
  }

  Future<void> _showTransactionHistory(String symbol) async {
    try {
      final data = await _algoService.getTradeHistory(symbol);
      final history = data['history'] as List? ?? [];
      if (!mounted) return;
      showModalBottomSheet(
        context: context,
        isScrollControlled: true,
        builder: (context) => DraggableScrollableSheet(
          initialChildSize: 0.6,
          minChildSize: 0.3,
          maxChildSize: 0.9,
          expand: false,
          builder: (_, scrollController) => Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Padding(
                padding: const EdgeInsets.all(16),
                child: Text('Transactions: $symbol',
                    style: Theme.of(context).textTheme.titleMedium),
              ),
              Expanded(
                child: history.isEmpty
                    ? const Center(child: Text('No transactions'))
                    : ListView.builder(
                        controller: scrollController,
                        itemCount: history.length,
                        itemBuilder: (context, i) {
                          final h =
                              history[i] as Map<String, dynamic>;
                          final type = h['type'] ?? '—';
                          final desc =
                              h['description'] ?? type;
                          final ts = h['timestamp'];
                          final balance = h['balance'];
                          return ListTile(
                            title: Text(desc.toString()),
                            subtitle: Text(
                                ts != null ? _formatDate(ts) : ''),
                            trailing: balance != null
                                ? Text(
                                    '\$${_toDouble(balance).toStringAsFixed(2)}')
                                : null,
                          );
                        },
                      ),
              ),
            ],
          ),
        ),
      );
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
              content: Text('Could not load transaction history')),
        );
      }
    }
  }

  Widget _detailRow(String label, String value, {Color? color}) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label,
              style: TextStyle(
                  color: Theme.of(context).textTheme.bodySmall?.color)),
          Flexible(
            child: Text(
              value,
              style: TextStyle(
                  fontWeight: FontWeight.w600,
                  color: color,
                  overflow: TextOverflow.ellipsis),
              textAlign: TextAlign.end,
            ),
          ),
        ],
      ),
    );
  }
}
