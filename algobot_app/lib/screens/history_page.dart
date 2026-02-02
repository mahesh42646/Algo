import 'package:flutter/material.dart';
import '../services/algo_trading_service.dart';

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
      final profitDetails = await _algoService.getProfitDetails(period: 'all');
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
            : SingleChildScrollView(
                physics: const AlwaysScrollableScrollPhysics(),
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _buildSummaryCards(theme),
                    const SizedBox(height: 24),
                    const Text(
                      'Active Trades',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 8),
                    if (_activeTrades.isEmpty)
                      _buildEmptyCard(theme, 'No active trades')
                    else
                      ..._activeTrades.map((t) => _buildActiveTradeTile(theme, t)),
                    const SizedBox(height: 24),
                    const Text(
                      'Completed Trades',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 8),
                    if (_completedTrades.isEmpty)
                      _buildEmptyCard(theme, 'No completed trades yet')
                    else
                      ..._completedTrades.map((t) => _buildCompletedTradeTile(theme, t)),
                    const SizedBox(height: 24),
                  ],
                ),
              ),
      ),
    );
  }

  Widget _buildSummaryCards(ThemeData theme) {
    return LayoutBuilder(
      builder: (context, constraints) {
        final w = constraints.maxWidth;
        final crossCount = w > 600 ? 4 : 2;
        return GridView.count(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          crossAxisCount: crossCount,
          mainAxisSpacing: 10,
          crossAxisSpacing: 10,
          childAspectRatio: crossCount == 4 ? 2.2 : 1.8,
          children: [
            _summaryCard(theme, 'Active', _activeTrades.length.toString(), Icons.trending_up, Colors.green),
            _summaryCard(theme, 'Completed', _completedTrades.length.toString(), Icons.check_circle, Colors.blue),
            _summaryCard(theme, 'P:L Ratio', _profitLossRatio.toStringAsFixed(2), Icons.balance, Colors.orange),
            _summaryCard(
              theme,
              'Total Profit',
              '\$${_totalProfit.toStringAsFixed(2)}',
              Icons.attach_money,
              _totalProfit >= 0 ? Colors.green : Colors.red,
            ),
          ],
        );
      },
    );
  }

  Widget _summaryCard(ThemeData theme, String label, String value, IconData icon, Color color) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: theme.cardColor,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: color.withOpacity(0.3)),
        boxShadow: [BoxShadow(color: color.withOpacity(0.08), blurRadius: 8, offset: const Offset(0, 2))],
      ),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(icon, size: 18, color: color),
              const SizedBox(width: 6),
              Text(label, style: TextStyle(fontSize: 12, color: theme.textTheme.bodySmall?.color)),
            ],
          ),
          const SizedBox(height: 6),
          FittedBox(
            fit: BoxFit.scaleDown,
            alignment: Alignment.centerLeft,
            child: Text(
              value,
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: color),
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
        style: TextStyle(color: theme.textTheme.bodySmall?.color, fontSize: 14),
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
          TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('No')),
          ElevatedButton(
            onPressed: () => Navigator.pop(context, true),
            style: ElevatedButton.styleFrom(backgroundColor: Colors.red, foregroundColor: Colors.white),
            child: Text(isStarted ? 'Stop' : 'Cancel trade'),
          ),
        ],
      ),
    );
    if (confirmed != true || !mounted) return;
    try {
      await _algoService.stopAlgoTrade(symbol);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Trade cancelled'), backgroundColor: Colors.green),
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
      margin: const EdgeInsets.only(bottom: 10),
      child: ListTile(
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        title: Text(symbol, style: const TextStyle(fontWeight: FontWeight.w600)),
        subtitle: Text('Level $level / $totalLevels · Balance: \$${totalBalance.toStringAsFixed(2)}'),
        trailing: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              '${pnl >= 0 ? '+' : ''}${pnl.toStringAsFixed(2)}',
              style: TextStyle(fontWeight: FontWeight.bold, color: isProfit ? Colors.green : Colors.red),
            ),
            IconButton(
              icon: Icon(isStarted ? Icons.stop_circle : Icons.cancel, color: Colors.red, size: 22),
              onPressed: () => _cancelOrStopTrade(trade),
              tooltip: isStarted ? 'Stop trade' : 'Cancel trade (fee refunded)',
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
    final isProfit = profit >= 0;
    return Card(
      margin: const EdgeInsets.only(bottom: 10),
      child: ListTile(
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        title: Text(symbol, style: const TextStyle(fontWeight: FontWeight.w600)),
        subtitle: Text(
          'Stopped ${_formatDate(trade['stoppedAt'])} · Levels: ${trade['levels'] ?? '—'}',
          style: TextStyle(fontSize: 12, color: theme.textTheme.bodySmall?.color),
        ),
        trailing: Text(
          '${profit >= 0 ? '+' : ''}${profit.toStringAsFixed(2)} USDT',
          style: TextStyle(fontWeight: FontWeight.bold, color: isProfit ? Colors.green : Colors.red),
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
    final totalBalance = _toDouble(trade['totalBalance'] ?? trade['totalInvested']);
    final direction = trade['tradeDirection'] ?? '—';
    final startPrice = _toDouble(trade['startPrice']);
    final currentPrice = _toDouble(trade['currentPrice']);
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      builder: (context) => DraggableScrollableSheet(
        initialChildSize: 0.5,
        minChildSize: 0.3,
        maxChildSize: 0.85,
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
              Text('Active Trade: $symbol', style: Theme.of(context).textTheme.titleLarge),
              const SizedBox(height: 12),
              _detailRow('Direction', direction),
              _detailRow('Level', '$level / $totalLevels'),
              _detailRow('Start Price', '\$${startPrice.toStringAsFixed(2)}'),
              _detailRow('Current Price', '\$${currentPrice.toStringAsFixed(2)}'),
              _detailRow('Total Balance', '\$${totalBalance.toStringAsFixed(2)}'),
              _detailRow('Unrealized P&L', '${pnl >= 0 ? '+' : ''}${pnl.toStringAsFixed(2)} USDT', color: pnl >= 0 ? Colors.green : Colors.red),
              _detailRow('P&L %', '${currentPnL >= 0 ? '+' : ''}${currentPnL.toStringAsFixed(2)}%', color: currentPnL >= 0 ? Colors.green : Colors.red),
              const SizedBox(height: 20),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton.icon(
                  onPressed: () {
                    Navigator.pop(context);
                    _cancelOrStopTrade(trade);
                  },
                  icon: Icon(trade['isStarted'] == true ? Icons.stop_circle : Icons.cancel),
                  label: Text(trade['isStarted'] == true ? 'Stop trade' : 'Cancel trade (fee refunded)'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.red,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 12),
                  ),
                ),
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
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      builder: (context) => DraggableScrollableSheet(
        initialChildSize: 0.45,
        minChildSize: 0.3,
        maxChildSize: 0.7,
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
              Text('Completed: $symbol', style: Theme.of(context).textTheme.titleLarge),
              const SizedBox(height: 12),
              _detailRow('Profit/Loss', '${profit >= 0 ? '+' : ''}${profit.toStringAsFixed(2)} USDT', color: profit >= 0 ? Colors.green : Colors.red),
              _detailRow('Levels', levels),
              _detailRow('Stopped', stoppedAt),
              _detailRow('Reason', reason),
              const SizedBox(height: 16),
              SizedBox(
                width: double.infinity,
                child: OutlinedButton.icon(
                  onPressed: () {
                    Navigator.pop(context);
                    _showTransactionHistory(symbol);
                  },
                  icon: const Icon(Icons.history, size: 18),
                  label: const Text('View transaction history'),
                ),
              ),
            ],
          ),
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
                child: Text('Transaction history: $symbol', style: Theme.of(context).textTheme.titleMedium),
              ),
              Expanded(
                child: history.isEmpty
                    ? const Center(child: Text('No transactions'))
                    : ListView.builder(
                        controller: scrollController,
                        itemCount: history.length,
                        itemBuilder: (context, i) {
                          final h = history[i] as Map<String, dynamic>;
                          final type = h['type'] ?? '—';
                          final desc = h['description'] ?? type;
                          final ts = h['timestamp'];
                          final balance = h['balance'];
                          return ListTile(
                            title: Text(desc.toString()),
                            subtitle: Text(ts != null ? _formatDate(ts) : ''),
                            trailing: balance != null ? Text('\$${_toDouble(balance).toStringAsFixed(2)}') : null,
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
          const SnackBar(content: Text('Could not load transaction history')),
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
          Text(label, style: TextStyle(color: Theme.of(context).textTheme.bodySmall?.color)),
          Text(value, style: TextStyle(fontWeight: FontWeight.w600, color: color)),
        ],
      ),
    );
  }
}
