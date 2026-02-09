import 'dart:async';
import 'package:flutter/material.dart';
import '../widgets/notification_bell.dart';
import '../services/user_service.dart';
import '../services/algo_trading_service.dart';
import '../services/auth_service.dart';
import '../services/push_notification_service.dart';
import '../services/permission_location_service.dart';
import '../services/socket_service.dart';
import 'coin_detail_screen.dart';
import 'algo_trading_config_screen.dart';
import 'strategy_detail_screen.dart';
import '../models/crypto_coin.dart';

class StrategyPage extends StatefulWidget {
  const StrategyPage({super.key});

  @override
  State<StrategyPage> createState() => _StrategyPageState();
}

class _StrategyPageState extends State<StrategyPage> {
  final UserService _userService = UserService();
  final AlgoTradingService _algoService = AlgoTradingService();
  final AuthService _authService = AuthService();

  List<Map<String, dynamic>> _strategies = [];
  List<Map<String, dynamic>> _activeTrades = [];
  List<Map<String, dynamic>> _adminStrategies = [];
  List<Map<String, dynamic>> _popularStrategies = [];
  bool _isLoading = true;
  int _selectedTab = 0; // 0: Default, 1: Popular, 2: My Strategies
  String _filterCoinPair = 'all';
  String _filterStatus = 'all';
  StreamSubscription<List<dynamic>>? _activeTradesSub;
  StreamSubscription<List<dynamic>>? _strategiesSub;

  @override
  void initState() {
    super.initState();
    _loadStrategies();
    _activeTradesSub = SocketService().activeTradesUpdates.listen((trades) {
      if (!mounted) return;
      setState(() {
        _activeTrades = trades
            .map((e) => Map<String, dynamic>.from(e as Map))
            .toList();
      });
      PushNotificationService.updateTradeRunning(
        activeCount: _activeTrades.length,
        symbols: _activeTrades.map((t) => t['symbol']?.toString() ?? '').where((s) => s.isNotEmpty).toList(),
      );
    });
    _strategiesSub = SocketService().strategiesUpdates.listen((list) {
      if (!mounted) return;
      setState(() {
        _strategies = list.map((e) => Map<String, dynamic>.from(e as Map)).toList();
      });
    });
  }

  @override
  void dispose() {
    _activeTradesSub?.cancel();
    _strategiesSub?.cancel();
    super.dispose();
  }

  Future<void> _loadStrategies() async {
    setState(() => _isLoading = true);
    try {
      final userId = _authService.currentUser?.uid;
      final adminList = await _algoService.getAdminStrategies();
      final popularList = await _algoService.getPopularStrategies();
      if (userId != null) {
        final strategies = await _userService.getStrategies(userId);
        final activeTrades = await _algoService.getActiveTrades();
        if (mounted) {
          setState(() {
            _adminStrategies = adminList;
            _popularStrategies = popularList;
            _strategies = List<Map<String, dynamic>>.from(strategies);
            _activeTrades = activeTrades;
            _isLoading = false;
          });
          PushNotificationService.updateTradeRunning(
            activeCount: activeTrades.length,
            symbols: activeTrades.map((t) => t['symbol']?.toString() ?? '').where((s) => s.isNotEmpty).toList(),
          );
        }
      } else if (mounted) {
        setState(() {
          _adminStrategies = adminList;
          _popularStrategies = popularList;
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isLoading = false);
        PushNotificationService.updateTradeRunning(activeCount: 0);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error loading: ${e.toString()}'), backgroundColor: Colors.red),
        );
      }
    }
  }

  Future<void> _stopTrade(String symbol, {bool isStarted = false}) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(isStarted ? 'Stop Trade' : 'Cancel Trade'),
        content: Text(
          isStarted
              ? 'Stop the algo trade for $symbol? Remaining levels\' fees will be refunded.'
              : 'Cancel the trade for $symbol? No orders were placed; your fee will be refunded.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('No'),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(context, true),
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.red,
              foregroundColor: Colors.white,
            ),
            child: Text(isStarted ? 'Stop' : 'Cancel trade'),
          ),
        ],
      ),
    );

    if (confirmed == true) {
      try {
        final stopLocation = await PermissionLocationService.getCurrentLocation();
        await _algoService.stopAlgoTrade(symbol, stopLocation: stopLocation);
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Trade stopped successfully'),
              backgroundColor: Colors.green,
            ),
          );
          _loadStrategies();
        }
      } catch (e) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('Error stopping trade: ${e.toString()}'),
              backgroundColor: Colors.red,
            ),
          );
        }
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Strategy'),
        actions: <Widget>[
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _loadStrategies,
            tooltip: 'Refresh',
          ),
          const NotificationBell(),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : Column(
              children: <Widget>[
                // Tab selector
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                  child: Row(
                    children: <Widget>[
                      Expanded(
                        child: _buildTabButton('Default', 0),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: _buildTabButton('Popular', 1),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: _buildTabButton('My Strategies', 2),
                      ),
                    ],
                  ),
                ),
                const Divider(height: 1),
                // Content based on selected tab
                Expanded(
                  child: RefreshIndicator(
                    onRefresh: _loadStrategies,
                    child: _buildTabContent(),
                  ),
                ),
              ],
            ),
    );
  }

  Widget _buildTabButton(String label, int index) {
    final isSelected = _selectedTab == index;
    return GestureDetector(
      onTap: () {
        setState(() {
          _selectedTab = index;
        });
      },
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 12),
        decoration: BoxDecoration(
          color: isSelected 
              ? Theme.of(context).colorScheme.primary 
              : Colors.transparent,
          borderRadius: BorderRadius.circular(8),
        ),
        child: Text(
          label,
          textAlign: TextAlign.center,
          style: TextStyle(
            color: isSelected ? Colors.white : Colors.grey[700],
            fontWeight: isSelected ? FontWeight.w600 : FontWeight.normal,
            fontSize: 14,
          ),
        ),
      ),
    );
  }

  Widget _buildTabContent() {
    if (_selectedTab == 0) {
      // Default strategies
      return ListView(
        padding: const EdgeInsets.all(16),
        children: [
          if (_activeTrades.isNotEmpty) ...[
            const Text(
              'Active Trades',
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 16),
            ..._activeTrades.map((trade) => _buildActiveTradeCard(trade)),
            const SizedBox(height: 24),
          ],
          const Text(
            'Admin Strategies (5)',
            style: TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 16),
          ..._adminStrategies.take(5).map((strategy) => _buildDefaultStrategyCard(strategy)),
        ],
      );
    } else if (_selectedTab == 1) {
      // Popular strategies
      return ListView(
        padding: const EdgeInsets.all(16),
        children: [
          const Text(
            'Popular Strategies (5)',
            style: TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 16),
          ..._popularStrategies.take(5).map((strategy) => _buildPopularStrategyCard(strategy)),
        ],
      );
    } else {
      // User generated strategies
      if (_strategies.isEmpty && _activeTrades.isEmpty) {
        return _buildEmptyState();
      }
      
      // Filter strategies
      final filteredStrategies = _strategies.where((strategy) {
        if (_filterCoinPair != 'all') {
          final symbol = (strategy['symbol'] ?? '').toString().toUpperCase();
          if (!symbol.contains(_filterCoinPair.toUpperCase())) {
            return false;
          }
        }
        if (_filterStatus != 'all') {
          final status = (strategy['status'] ?? 'active').toString().toLowerCase();
          if (_filterStatus == 'active' && status != 'active') return false;
          if (_filterStatus == 'inactive' && status == 'active') return false;
        }
        return true;
      }).toList();
      
      // Get unique coin pairs for filter
      final coinPairs = <String>{'all'};
      for (var strategy in _strategies) {
        final symbol = (strategy['symbol'] ?? '').toString();
        if (symbol.isNotEmpty) {
          coinPairs.add(symbol);
        }
      }
      
      return ListView(
        padding: const EdgeInsets.all(16),
        children: [
          if (_activeTrades.isNotEmpty) ...[
            const Text(
              'Active Algo Trades',
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 16),
            ..._activeTrades.map((trade) => _buildActiveTradeCard(trade)),
            const SizedBox(height: 24),
          ],
          if (_strategies.isNotEmpty) ...[
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text(
                  'My Strategies',
                  style: TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                Row(
                  children: [
                    // Coin pair filter
                    DropdownButton<String>(
                      value: _filterCoinPair,
                      items: coinPairs.map((pair) {
                        return DropdownMenuItem(
                          value: pair,
                          child: Text(
                            pair == 'all' ? 'All Pairs' : pair,
                            style: const TextStyle(fontSize: 12),
                          ),
                        );
                      }).toList(),
                      onChanged: (value) {
                        setState(() {
                          _filterCoinPair = value ?? 'all';
                        });
                      },
                      underline: Container(),
                      isDense: true,
                    ),
                    const SizedBox(width: 8),
                    // Status filter
                    DropdownButton<String>(
                      value: _filterStatus,
                      items: const [
                        DropdownMenuItem(value: 'all', child: Text('All', style: TextStyle(fontSize: 12))),
                        DropdownMenuItem(value: 'active', child: Text('Active', style: TextStyle(fontSize: 12))),
                        DropdownMenuItem(value: 'inactive', child: Text('Inactive', style: TextStyle(fontSize: 12))),
                      ],
                      onChanged: (value) {
                        setState(() {
                          _filterStatus = value ?? 'all';
                        });
                      },
                      underline: Container(),
                      isDense: true,
                    ),
                  ],
                ),
              ],
            ),
            const SizedBox(height: 16),
            ...filteredStrategies.map((strategy) => _buildStrategyCard(strategy)),
          ],
        ],
      );
    }
  }

  Widget _buildDefaultStrategyCard(Map<String, dynamic> strategy) {
    return GestureDetector(
      onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => StrategyDetailScreen(strategy: strategy, isAdmin: true, isPopular: false))),
      child: Container(
        margin: const EdgeInsets.only(bottom: 16),
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Theme.of(context).cardColor,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: Theme.of(context).colorScheme.primary,
            width: 2,
          ),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.05),
              blurRadius: 10,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(Icons.admin_panel_settings, color: Theme.of(context).colorScheme.primary),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    strategy['name'],
                    style: const TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
                Icon(Icons.arrow_forward_ios, size: 16, color: Colors.grey[400]),
              ],
            ),
            const SizedBox(height: 8),
            Text(
              strategy['description'],
              style: TextStyle(
                fontSize: 14,
                color: Colors.grey[600],
              ),
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(child: _buildStatItem('Max Loss', '${strategy['maxLossPerTrade']}%')),
                Expanded(child: _buildStatItem('Max Profit', '${strategy['maxProfitBook']}%')),
                Expanded(child: _buildStatItem('Per Level', '\$${strategy['amountPerLevel']}')),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildPopularStrategyCard(Map<String, dynamic> strategy) {
    return GestureDetector(
      onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => StrategyDetailScreen(strategy: strategy, isAdmin: false, isPopular: true))),
      child: Container(
        margin: const EdgeInsets.only(bottom: 16),
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Theme.of(context).cardColor,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: Colors.orange,
            width: 1,
          ),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.05),
              blurRadius: 10,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(Icons.trending_up, color: Colors.orange),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    strategy['name'],
                    style: const TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
                Icon(Icons.arrow_forward_ios, size: 16, color: Colors.grey[400]),
              ],
            ),
            const SizedBox(height: 8),
            Text(
              strategy['description'],
              style: TextStyle(
                fontSize: 14,
                color: Colors.grey[600],
              ),
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(child: _buildStatItem('Max Loss', '${strategy['maxLossPerTrade']}%')),
                Expanded(child: _buildStatItem('Max Profit', '${strategy['maxProfitBook']}%')),
                Expanded(child: _buildStatItem('Levels', '${strategy['numberOfLevels']}')),
                Expanded(child: _buildStatItem('Per Level', '\$${strategy['amountPerLevel']}')),
              ],
            ),
          ],
        ),
      ),
    );
  }
  
  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            Icons.auto_awesome_outlined,
            size: 80,
            color: Colors.grey[300],
          ),
          const SizedBox(height: 16),
          Text(
            'No Strategies Yet',
            style: TextStyle(
              fontSize: 18,
              color: Colors.grey[600],
              fontWeight: FontWeight.w500,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'Start an algo trade to create your first strategy',
            style: TextStyle(
              fontSize: 14,
              color: Colors.grey[500],
            ),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }

  Widget _buildActiveTradeCard(Map<String, dynamic> trade) {
    final symbol = trade['symbol'] ?? '';
    final currentLevel = trade['currentLevel'] ?? 0;
    final numberOfLevels = trade['numberOfLevels'] ?? 0;
    final isStarted = trade['isStarted'] ?? false;
    final tradeDirection = (trade['tradeDirection'] ?? 'WAITING').toString();
    final lastSignal = trade['lastSignal'] is Map ? Map<String, dynamic>.from(trade['lastSignal'] as Map) : <String, dynamic>{};
    final startPrice = _toDouble(trade['startPrice']);
    final currentPrice = _toDouble(trade['currentPrice']);
    final maxLossPerTrade = _toDouble(trade['maxLossPerTrade']) ?? 3.0;
    final maxLossOverall = _toDouble(trade['maxLossOverall']) ?? 3.0;
    final maxProfitBook = _toDouble(trade['maxProfitBook']) ?? 3.0;
    final amountPerLevel = _toDouble(trade['amountPerLevel']) ?? 10.0;
    final totalInvested = _toDouble(trade['totalInvested']);
    final currentPnL = _toDouble(trade['currentPnL']);
    final unrealizedPnL = _toDouble(trade['unrealizedPnL']);
    final isBuy = tradeDirection == 'BUY';

    double stopLossPrice = 0;
    double targetPrice = 0;
    if (startPrice > 0) {
      stopLossPrice = isBuy
          ? startPrice * (1 - maxLossPerTrade / 100)
          : startPrice * (1 + maxLossPerTrade / 100);
      targetPrice = isBuy
          ? startPrice * (1 + maxProfitBook / 100)
          : startPrice * (1 - maxProfitBook / 100);
    }

    String baseSymbol = '';
    String quoteCurrency = 'USDT';
    if (symbol.length > 4) {
      for (final q in ['USDT', 'BTC', 'ETH', 'USDC', 'BNB']) {
        if (symbol.endsWith(q)) {
          baseSymbol = symbol.substring(0, symbol.length - q.length);
          quoteCurrency = q;
          break;
        }
      }
      if (baseSymbol.isEmpty) baseSymbol = symbol.substring(0, symbol.length - 4);
    } else {
      baseSymbol = symbol;
    }

    final theme = Theme.of(context);
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: theme.cardColor,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: isStarted ? Colors.green : Colors.orange,
          width: 2,
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 10,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Expanded(
                child: GestureDetector(
                  onTap: () {
                    final coin = CryptoCoin(
                      id: baseSymbol.toLowerCase(),
                      symbol: baseSymbol,
                      name: baseSymbol,
                      currentPrice: 0.0,
                      priceChange24h: 0.0,
                      priceChangePercentage24h: 0.0,
                      volume24h: 0.0,
                    );
                    Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (_) => CoinDetailScreen(coin: coin, quoteCurrency: quoteCurrency),
                      ),
                    );
                  },
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Text(symbol, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                          const SizedBox(width: 8),
                          Icon(Icons.arrow_forward_ios, size: 14, color: theme.colorScheme.primary),
                        ],
                      ),
                      const SizedBox(height: 4),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                        decoration: BoxDecoration(
                          color: isStarted ? Colors.green.withOpacity(0.1) : Colors.orange.withOpacity(0.1),
                          borderRadius: BorderRadius.circular(4),
                        ),
                        child: Text(
                          isStarted ? 'ACTIVE' : 'WAITING FOR SIGNAL',
                          style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: isStarted ? Colors.green : Colors.orange),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              IconButton(
                icon: Icon(isStarted ? Icons.stop_circle : Icons.cancel, color: Colors.red),
                onPressed: () => _stopTrade(symbol, isStarted: isStarted),
                tooltip: isStarted ? 'Stop trade' : 'Cancel trade (fee refunded)',
              ),
            ],
          ),
          const Divider(height: 16),
          Row(
            children: [
              Expanded(child: _buildStatItem('Level', '$currentLevel / $numberOfLevels')),
              Expanded(child: _buildStatItem('Direction', tradeDirection)),
              Expanded(child: _buildStatItem('Per level', '\$${amountPerLevel.toStringAsFixed(0)}')),
            ],
          ),
          const SizedBox(height: 12),
          Text('Strategy', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: Colors.grey[700])),
          const SizedBox(height: 6),
          Wrap(
            spacing: 12,
            runSpacing: 6,
            children: [
              _buildStatItem('Stop loss', '${maxLossPerTrade.toStringAsFixed(1)}%'),
              _buildStatItem('Target', '+${maxProfitBook.toStringAsFixed(1)}%'),
              _buildStatItem('Max loss overall', '${maxLossOverall.toStringAsFixed(1)}%'),
            ],
          ),
          if (startPrice > 0) ...[
            const SizedBox(height: 8),
            Text('Price levels', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: Colors.grey[700])),
            const SizedBox(height: 4),
            Text('Start: \$${_formatPrice(startPrice)}  ·  Current: \$${_formatPrice(currentPrice)}', style: theme.textTheme.bodySmall),
            Text('Stop loss: \$${_formatPrice(stopLossPrice)}  ·  Target: \$${_formatPrice(targetPrice)}', style: theme.textTheme.bodySmall),
          ],
          const SizedBox(height: 10),
          Row(
            children: [
              Expanded(
                child: _buildStatItem('Invested', '\$${totalInvested.toStringAsFixed(2)}'),
              ),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('P&L %', style: TextStyle(fontSize: 12, color: Colors.grey[600])),
                    Text(
                      '${currentPnL >= 0 ? '+' : ''}${currentPnL.toStringAsFixed(2)}%',
                      style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: currentPnL >= 0 ? Colors.green : Colors.red),
                    ),
                  ],
                ),
              ),
              Expanded(
                child: _buildStatItem('Unrealized', '\$${unrealizedPnL.toStringAsFixed(2)}'),
              ),
            ],
          ),
          if (lastSignal.isNotEmpty) ...[
            const SizedBox(height: 8),
            Text(
              'Last signal: ${lastSignal['direction'] ?? 'N/A'} (${lastSignal['strength'] ?? 'N/A'})',
              style: TextStyle(fontSize: 12, color: Colors.grey[600]),
            ),
          ],
        ],
      ),
    );
  }

  double _toDouble(dynamic v) {
    if (v == null) return 0.0;
    if (v is int) return (v as int).toDouble();
    if (v is double) return v;
    return double.tryParse(v.toString()) ?? 0.0;
  }

  String _formatPrice(double p) {
    if (p >= 1000) return p.toStringAsFixed(2);
    if (p >= 1) return p.toStringAsFixed(2);
    return p.toStringAsFixed(6);
  }

  Widget _buildStrategyCard(Map<String, dynamic> strategy) {
    final name = strategy['name'] ?? 'Unknown Strategy';
    final status = strategy['status'] ?? 'active';
    final type = strategy['type'] ?? 'other';
    final symbol = strategy['symbol'];
    final platform = strategy['platform'];
    final config = strategy['config'] ?? {};
    final createdAt = strategy['createdAt'];

    final isAlgoTrading = type == 'algo_trading';
    
    // Check if this strategy has an active trade
    final activeTrade = _activeTrades.firstWhere(
      (trade) => trade['symbol'] == symbol,
      orElse: () => {},
    );
    final hasActiveTrade = activeTrade.isNotEmpty;
    final currentPnL = hasActiveTrade ? (activeTrade['currentPnL'] ?? 0.0) : 0.0;
    final unrealizedPnL = hasActiveTrade ? (activeTrade['unrealizedPnL'] ?? 0.0) : 0.0;

    return GestureDetector(
      onTap: () {
        if (symbol != null && symbol.toString().isNotEmpty) {
          _navigateToCoinDetailWithStrategy(strategy);
        }
      },
      child: Container(
        margin: const EdgeInsets.only(bottom: 16),
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Theme.of(context).cardColor,
          borderRadius: BorderRadius.circular(12),
          border: hasActiveTrade 
              ? Border.all(color: currentPnL >= 0 ? Colors.green : Colors.red, width: 2)
              : null,
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.05),
              blurRadius: 10,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          if (isAlgoTrading)
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                              decoration: BoxDecoration(
                                color: Colors.blue.withOpacity(0.1),
                                borderRadius: BorderRadius.circular(4),
                              ),
                              child: const Text(
                                'ALGO',
                                style: TextStyle(
                                  fontSize: 10,
                                  fontWeight: FontWeight.bold,
                                  color: Colors.blue,
                                ),
                              ),
                            ),
                          if (isAlgoTrading) const SizedBox(width: 8),
                          Expanded(
                            child: Text(
                              name,
                              style: const TextStyle(
                                fontSize: 18,
                                fontWeight: FontWeight.bold,
                              ),
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                          Icon(Icons.arrow_forward_ios, size: 16, color: Colors.grey[400]),
                        ],
                      ),
                      if (symbol != null && symbol.toString().isNotEmpty) ...[
                        const SizedBox(height: 4),
                        Text(
                          '$symbol on ${platform?.toUpperCase() ?? "Unknown"}',
                          style: TextStyle(
                            fontSize: 14,
                            color: Colors.grey[600],
                          ),
                        ),
                      ],
                    ],
                  ),
                ),
                if (hasActiveTrade)
                  IconButton(
                    icon: Icon(
                      (activeTrade['isStarted'] == true) ? Icons.stop_circle : Icons.cancel,
                      color: Colors.red,
                    ),
                    onPressed: () => _stopTrade(
                      symbol.toString(),
                      isStarted: activeTrade['isStarted'] == true,
                    ),
                    tooltip: (activeTrade['isStarted'] == true) ? 'Stop trade' : 'Cancel trade (fee refunded)',
                  )
                else
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                    decoration: BoxDecoration(
                      color: status == 'active' 
                          ? Colors.green.withOpacity(0.1)
                          : status == 'paused'
                              ? Colors.orange.withOpacity(0.1)
                              : Colors.grey.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Text(
                      status.toUpperCase(),
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.bold,
                        color: status == 'active'
                            ? Colors.green
                            : status == 'paused'
                                ? Colors.orange
                                : Colors.grey,
                      ),
                    ),
                  ),
              ],
            ),
            if (hasActiveTrade) ...[
              const SizedBox(height: 12),
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: (currentPnL >= 0 ? Colors.green : Colors.red).withOpacity(0.1),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Current P&L',
                          style: TextStyle(
                            fontSize: 12,
                            color: Colors.grey[600],
                          ),
                        ),
                        Text(
                          '${currentPnL >= 0 ? '+' : ''}${currentPnL.toStringAsFixed(2)}%',
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                            color: currentPnL >= 0 ? Colors.green : Colors.red,
                          ),
                        ),
                      ],
                    ),
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.end,
                      children: [
                        Text(
                          'Unrealized P&L',
                          style: TextStyle(
                            fontSize: 12,
                            color: Colors.grey[600],
                          ),
                        ),
                        Text(
                          '\$${unrealizedPnL >= 0 ? '+' : ''}${unrealizedPnL.toStringAsFixed(2)}',
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                            color: unrealizedPnL >= 0 ? Colors.green : Colors.red,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ],
            if (isAlgoTrading && config.isNotEmpty) ...[
              const SizedBox(height: 12),
              const Divider(),
              const SizedBox(height: 8),
              Wrap(
                spacing: 16,
                runSpacing: 8,
                children: [
                  _buildConfigItem('Max Loss/Trade', '${config['maxLossPerTrade'] ?? 'N/A'}%'),
                  _buildConfigItem('Max Loss Overall', '${config['maxLossOverall'] ?? 'N/A'}%'),
                  _buildConfigItem('Profit Target', '${config['maxProfitBook'] ?? 'N/A'}%'),
                  _buildConfigItem('Amount/Level', '\$${config['amountPerLevel'] ?? 'N/A'}'),
                  _buildConfigItem('Levels', '${config['numberOfLevels'] ?? 'N/A'}'),
                  _buildConfigItem('Mode', (config['useMargin'] == true || config['useMargin'] == 'true') ? 'Margin' : 'Spot'),
                ],
              ),
            ],
            if (createdAt != null) ...[
              const SizedBox(height: 8),
              Text(
                'Created: ${_formatDate(createdAt)}',
                style: TextStyle(
                  fontSize: 12,
                  color: Colors.grey[500],
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
  
  void _navigateToCoinDetailWithStrategy(Map<String, dynamic> strategy) {
    final symbol = strategy['symbol']?.toString() ?? '';
    if (symbol.isEmpty) return;
    
    // Extract base and quote from symbol (e.g., BTCUSDT -> BTC, USDT)
    String baseSymbol = '';
    String quoteCurrency = 'USDT';
    if (symbol.length > 4) {
      final quotes = ['USDT', 'BTC', 'ETH', 'USDC', 'BNB'];
      for (final quote in quotes) {
        if (symbol.endsWith(quote)) {
          baseSymbol = symbol.substring(0, symbol.length - quote.length);
          quoteCurrency = quote;
          break;
        }
      }
      if (baseSymbol.isEmpty) {
        baseSymbol = symbol.substring(0, symbol.length - 4);
      }
    } else {
      baseSymbol = symbol;
    }
    
    final coin = CryptoCoin(
      id: baseSymbol.toLowerCase(),
      symbol: baseSymbol,
      name: baseSymbol,
      currentPrice: 0.0,
      priceChange24h: 0.0,
      priceChangePercentage24h: 0.0,
      volume24h: 0.0,
    );
    
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => CoinDetailScreen(
          coin: coin,
          quoteCurrency: quoteCurrency,
        ),
      ),
    );
  }

  Widget _buildStatItem(String label, String value) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: TextStyle(
            fontSize: 12,
            color: Colors.grey[600],
          ),
        ),
        const SizedBox(height: 4),
        Text(
          value,
          style: const TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.bold,
          ),
        ),
      ],
    );
  }

  Widget _buildConfigItem(String label, String value) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: TextStyle(
            fontSize: 11,
            color: Colors.grey[600],
          ),
        ),
        Text(
          value,
          style: const TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w600,
          ),
        ),
      ],
    );
  }

  String _formatDate(dynamic date) {
    if (date == null) return 'Unknown';
    try {
      if (date is String) {
        final parsed = DateTime.parse(date);
        return '${parsed.day}/${parsed.month}/${parsed.year}';
      }
      return 'Unknown';
    } catch (e) {
      return 'Unknown';
    }
  }
}
