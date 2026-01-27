import 'package:flutter/material.dart';
import '../widgets/notification_bell.dart';
import '../services/user_service.dart';
import '../services/algo_trading_service.dart';
import '../services/auth_service.dart';
import 'coin_detail_screen.dart';
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
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadStrategies();
  }

  Future<void> _loadStrategies() async {
    setState(() {
      _isLoading = true;
    });

    try {
      final userId = _authService.currentUser?.uid;
      if (userId != null) {
        // Load strategies from user profile
        final strategies = await _userService.getStrategies(userId);
        
        // Load active trades
        final activeTrades = await _algoService.getActiveTrades();
        
        if (mounted) {
          setState(() {
            _strategies = List<Map<String, dynamic>>.from(strategies);
            _activeTrades = activeTrades;
            _isLoading = false;
          });
        }
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error loading strategies: ${e.toString()}'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  Future<void> _stopTrade(String symbol) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Stop Trade'),
        content: Text('Are you sure you want to stop the algo trade for $symbol?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(context, true),
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.red,
              foregroundColor: Colors.white,
            ),
            child: const Text('Stop'),
          ),
        ],
      ),
    );

    if (confirmed == true) {
      try {
        await _algoService.stopAlgoTrade(symbol);
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
        actions: [
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
          : _strategies.isEmpty && _activeTrades.isEmpty
              ? _buildEmptyState()
              : RefreshIndicator(
                  onRefresh: _loadStrategies,
                  child: ListView(
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
                        const Text(
                          'My Strategies',
                          style: TextStyle(
                            fontSize: 20,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        const SizedBox(height: 16),
                        ..._strategies.map((strategy) => _buildStrategyCard(strategy)),
                      ],
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
    final tradeDirection = trade['tradeDirection'] ?? 'WAITING';
    final lastSignal = trade['lastSignal'] ?? {};

    // Extract base and quote from symbol (e.g., BTCUSDT -> BTC, USDT)
    String baseSymbol = '';
    String quoteCurrency = 'USDT';
    if (symbol.length > 4) {
      // Try common quote currencies
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

    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Theme.of(context).cardColor,
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
                    // Navigate to coin detail screen
                    final coin = CryptoCoin(
                      id: baseSymbol.toLowerCase(),
                      symbol: baseSymbol,
                      name: baseSymbol,
                      currentPrice: 0.0,
                      priceChangePercentage24h: 0.0,
                      marketCap: 0.0,
                      totalVolume: 0.0,
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
                  },
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Text(
                            symbol,
                            style: const TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          const SizedBox(width: 8),
                          Icon(
                            Icons.arrow_forward_ios,
                            size: 14,
                            color: Theme.of(context).colorScheme.primary,
                          ),
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
                        style: TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.bold,
                          color: isStarted ? Colors.green : Colors.orange,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              IconButton(
                icon: const Icon(Icons.stop_circle, color: Colors.red),
                onPressed: () => _stopTrade(symbol),
                tooltip: 'Stop Trade',
              ),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: _buildStatItem('Level', '$currentLevel / $numberOfLevels'),
              ),
              Expanded(
                child: _buildStatItem('Direction', tradeDirection.toString()),
              ),
            ],
          ),
          if (lastSignal.isNotEmpty) ...[
            const SizedBox(height: 8),
            Text(
              'Last Signal: ${lastSignal['direction'] ?? 'N/A'} (${lastSignal['strength'] ?? 'N/A'})',
              style: TextStyle(
                fontSize: 12,
                color: Colors.grey[600],
              ),
            ),
          ],
        ],
      ),
    );
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

    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Theme.of(context).cardColor,
        borderRadius: BorderRadius.circular(12),
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
