import 'dart:async';
import 'package:flutter/material.dart';
import '../widgets/notification_bell.dart';
import '../widgets/crypto_list_widget.dart';
import '../services/user_service.dart';
import '../services/auth_service.dart';
import '../services/exchange_service.dart';
import '../services/algo_trading_service.dart';
import '../services/push_notification_service.dart';
import '../services/socket_service.dart';
import 'api_binding_screen.dart';
import 'user_guide_screen.dart';
import 'mine_page.dart';

class HomePage extends StatefulWidget {
  const HomePage({super.key});

  @override
  State<HomePage> createState() => HomePageState();
}

class HomePageState extends State<HomePage> {
  void refresh() => _loadData();
  final UserService _userService = UserService();
  final AuthService _authService = AuthService();
  final ExchangeService _exchangeService = ExchangeService();
  final AlgoTradingService _algoService = AlgoTradingService();
  
  double _platformBalance = 0.0;
  bool _isLoadingBalance = true;
  
  // Stats
  int _apiCount = 0;
  int _tradesCount = 0;
  double _profitLossRatio = 0.0;
  double _totalProfit = 0.0;
  bool _isLoadingStats = true;

  final List<Map<String, dynamic>> _platformOptions = [
    {
      'title': 'API Binding',
      'icon': Icons.link,
      'color': [Colors.lightBlue, Colors.purple],
    },
    {
      'title': 'User Guide',
      'icon': Icons.menu_book,
      'color': [Colors.red, Colors.orange],
    },
  ];

  StreamSubscription<Map<String, dynamic>>? _balanceSub;
  StreamSubscription<void>? _statsSub;

  @override
  void initState() {
    super.initState();
    _loadData();
    _balanceSub = SocketService().balanceUpdates.listen(_onBalanceUpdate);
    _statsSub = SocketService().statsUpdates.listen((_) => _loadStats());
  }

  @override
  void dispose() {
    _balanceSub?.cancel();
    _statsSub?.cancel();
    super.dispose();
  }

  void _onBalanceUpdate(Map<String, dynamic> payload) {
    if (!mounted) return;
    final balances = payload['balances'] as List?;
    if (balances == null) return;
    final usdt = balances.cast<Map<String, dynamic>>().firstWhere(
      (b) => (b['currency'] ?? '').toString().toUpperCase() == 'USDT',
      orElse: () => {'amount': 0.0},
    );
    setState(() {
      _platformBalance = _toDouble(usdt['amount']);
      _isLoadingBalance = false;
    });
  }

  Future<void> _loadData() async {
    await Future.wait([
      _loadPlatformBalance(),
      _loadStats(),
    ]);
  }

  Future<void> _loadPlatformBalance() async {
    try {
      final userId = _authService.currentUser?.uid;
      if (userId != null) {
        final wallet = await _userService.getWallet(userId);
        final balances = wallet['balances'] as List?;
        final usdtBalance = balances?.firstWhere(
          (b) => (b['currency'] ?? '').toString().toUpperCase() == 'USDT',
          orElse: () => {'amount': 0.0},
        );
        if (mounted) {
          setState(() {
            _platformBalance = (usdtBalance['amount'] ?? 0.0).toDouble();
            _isLoadingBalance = false;
          });
        }
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _isLoadingBalance = false;
        });
      }
    }
  }

  static double _toDouble(dynamic v) {
    if (v == null) return 0.0;
    if (v is int) return (v as int).toDouble();
    if (v is double) return v;
    return double.tryParse(v.toString()) ?? 0.0;
  }

  Future<void> _loadStats() async {
    setState(() {
      _isLoadingStats = true;
    });
    
    try {
      final apis = await _exchangeService.getLinkedApis();
      final activeApis = apis.where((api) => api.isActive).length;
      
      final activeTrades = await _algoService.getActiveTrades();
      
      final profitDetails = await _algoService.getProfitDetails(period: 'all');
      final totalProfit = _toDouble(profitDetails['totalProfit']);
      final tradeHistory = profitDetails['tradeHistory'] as List? ?? [];
      
      double totalProfitAmount = 0.0;
      double totalLossAmount = 0.0;
      for (var trade in tradeHistory) {
        final profit = _toDouble(trade is Map ? trade['profit'] : null);
        if (profit > 0) {
          totalProfitAmount += profit;
        } else {
          totalLossAmount += profit.abs();
        }
      }
      final ratio = totalLossAmount > 0 ? totalProfitAmount / totalLossAmount : (totalProfitAmount > 0 ? 999.0 : 0.0);
      
      if (mounted) {
        setState(() {
          _apiCount = activeApis;
          _tradesCount = activeTrades.length;
          _profitLossRatio = ratio;
          _totalProfit = totalProfit;
          _isLoadingStats = false;
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
    } catch (e) {
      if (mounted) {
        setState(() {
          _apiCount = 0;
          _tradesCount = 0;
          _profitLossRatio = 0.0;
          _totalProfit = 0.0;
          _isLoadingStats = false;
        });
        PushNotificationService.updateTradeRunning(activeCount: 0);
      }
    }
  }

  void _handlePlatformOptionTap(String title) {
    switch (title) {
      case 'API Binding':
        Navigator.push(
          context,
          MaterialPageRoute(builder: (_) => const ApiBindingScreen()),
        );
        break;
      case 'User Guide':
        Navigator.push(
          context,
          MaterialPageRoute(builder: (_) => const UserGuideScreen()),
        );
        break;
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    
    return Scaffold(
      backgroundColor: theme.scaffoldBackgroundColor,
      appBar: AppBar(
        elevation: 0,
        title: const Text('Home'),
        actions: [
          LayoutBuilder(
            builder: (context, constraints) {
              return GestureDetector(
                onTap: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(builder: (_) => const MinePage()),
                  );
                },
                child: Container(
                  margin: const EdgeInsets.only(right: 4),
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
                  constraints: const BoxConstraints(maxWidth: 140),
                  decoration: BoxDecoration(
                    color: Theme.of(context).colorScheme.primary.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(
                      color: Theme.of(context).colorScheme.primary.withOpacity(0.3),
                      width: 1,
                    ),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(
                        Icons.account_balance_wallet,
                        size: 14,
                        color: Theme.of(context).colorScheme.primary,
                      ),
                      const SizedBox(width: 4),
                      Flexible(
                        child: FittedBox(
                          fit: BoxFit.scaleDown,
                          alignment: Alignment.centerLeft,
                          child: Text(
                            _isLoadingBalance
                                ? '...'
                                : '${_platformBalance.toStringAsFixed(2)} USDT',
                            style: TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.w600,
                              color: Theme.of(context).colorScheme.primary,
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              );
            },
          ),
          const NotificationBell(),
        ],
      ),
      body: LayoutBuilder(
        builder: (context, constraints) {
          final screenWidth = constraints.maxWidth;
          final isSmallScreen = screenWidth < 360;
          
          return RefreshIndicator(
            onRefresh: _loadData,
            child: SingleChildScrollView(
              physics: const AlwaysScrollableScrollPhysics(),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _buildStatsCards(),
                  SizedBox(height: isSmallScreen ? 12 : 16),
                  _buildQuickActions(),
                  SizedBox(height: isSmallScreen ? 12 : 16),
                  const CryptoListWidget(),
                  SizedBox(height: isSmallScreen ? 12 : 20),
                ],
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _buildStatsCards() {
    return LayoutBuilder(
      builder: (context, constraints) {
        final screenWidth = constraints.maxWidth;
        final isSmallScreen = screenWidth < 380; // Small phones
        
        return Padding(
          padding: EdgeInsets.symmetric(
            horizontal: isSmallScreen ? 8 : 16,
            vertical: isSmallScreen ? 8 : 16,
          ),
          child: _isLoadingStats
              ? SizedBox(
                  height: isSmallScreen ? 100 : 120,
                  child: const Center(child: CircularProgressIndicator()),
                )
              : screenWidth < 600
                  ? _buildStatsGrid(isSmallScreen, 2) // 2 columns on small screens
                  : screenWidth < 1200
                      ? _buildStatsGrid(isSmallScreen, 4) // 4 columns on medium screens
                      : _buildStatsRow(), // Row on large screens
        );
      },
    );
  }
  
  Widget _buildStatsGrid(bool isSmallScreen, int crossAxisCount) {
    return GridView.count(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      crossAxisCount: crossAxisCount,
      mainAxisSpacing: isSmallScreen ? 8 : 8,
      crossAxisSpacing: isSmallScreen ? 8 : 8,
      // Taller cells to avoid bottom overflow; ratio = width/height (smaller = taller)
      childAspectRatio: crossAxisCount == 1 ? 1 : 2,
      children: [
        _buildStatCard(
          'APIs Bound',
          _apiCount.toString(),
          Icons.link,
          Colors.blue,
          isSmallScreen: isSmallScreen,
        ),
        _buildStatCard(
          'Active Trades',
          _tradesCount.toString(),
          Icons.trending_up,
          Colors.green,
          isSmallScreen: isSmallScreen,
        ),
        _buildStatCard(
          'P:L Ratio',
          _profitLossRatio.toStringAsFixed(2),
          Icons.balance,
          Colors.orange,
          isSmallScreen: isSmallScreen,
        ),
        _buildStatCard(
          'Total Profit',
          '\$${_totalProfit.toStringAsFixed(2)}',
          Icons.attach_money,
          _totalProfit >= 0 ? Colors.green : Colors.red,
          isSmallScreen: isSmallScreen,
        ),
      ],
    );
  }
  
  Widget _buildStatsRow() {
    return Row(
      children: [
        Expanded(
          child: _buildStatCard(
            'APIs Bound',
            _apiCount.toString(),
            Icons.link,
            Colors.blue,
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: _buildStatCard(
            'Active Trades',
            _tradesCount.toString(),
            Icons.trending_up,
            Colors.green,
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: _buildStatCard(
            'P:L Ratio',
            _profitLossRatio.toStringAsFixed(2),
            Icons.balance,
            Colors.orange,
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: _buildStatCard(
            'Total Profit',
            '\$${_totalProfit.toStringAsFixed(2)}',
            Icons.attach_money,
            _totalProfit >= 0 ? Colors.green : Colors.red,
          ),
        ),
      ],
    );
  }

  Widget _buildStatCard(String label, String value, IconData icon, Color color, {bool isSmallScreen = false}) {
    final theme = Theme.of(context);
    return LayoutBuilder(
      builder: (context, constraints) {
        return Container(
          padding: EdgeInsets.symmetric(
            horizontal: isSmallScreen ? 6 : 10,
            vertical: isSmallScreen ? 6 : 8,
          ),
          decoration: BoxDecoration(
            color: theme.cardColor,
            borderRadius: BorderRadius.circular(isSmallScreen ? 10 : 14),
            border: Border.all(
              color: color.withOpacity(0.3),
              width: 1,
            ),
            boxShadow: [
              BoxShadow(
                color: color.withOpacity(0.12),
                blurRadius: isSmallScreen ? 6 : 10,
                offset: Offset(0, isSmallScreen ? 1 : 3),
              ),
            ],
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(icon, size: isSmallScreen ? 16 : 18, color: color),
                  SizedBox(width: isSmallScreen ? 4 : 6),
                  Flexible(
                    child: Text(
                      label,
                      style: TextStyle(
                        fontSize: isSmallScreen ? 10 : 12,
                        color: Colors.grey[700],
                        fontWeight: FontWeight.w600,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                ],
              ),
              SizedBox(height: isSmallScreen ? 4 : 6),
              FittedBox(
                fit: BoxFit.scaleDown,
                alignment: Alignment.centerLeft,
                child: Text(
                  value,
                  style: TextStyle(
                    fontSize: isSmallScreen ? 14 : 16,
                    fontWeight: FontWeight.w700,
                    color: color,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildQuickActions() {
    return LayoutBuilder(
      builder: (context, constraints) {
        final screenWidth = constraints.maxWidth;
        final isSmallScreen = screenWidth < 360;
        
        return Padding(
          padding: EdgeInsets.symmetric(horizontal: isSmallScreen ? 8 : 16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Quick Actions',
                style: TextStyle(
                  fontSize: isSmallScreen ? 16 : 18,
                  fontWeight: FontWeight.bold,
                  color: Theme.of(context).textTheme.titleLarge?.color,
                ),
              ),
              SizedBox(height: isSmallScreen ? 8 : 12),
              _buildPlatformOptions(isSmallScreen: isSmallScreen),
            ],
          ),
        );
      },
    );
  }

  Widget _buildPlatformOptions({bool isSmallScreen = false}) {
    final theme = Theme.of(context);
    
    return Row(
      children: _platformOptions.map((option) {
        final colors = option['color'] as List<Color>;
        final title = option['title'] as String;
        
        return Expanded(
          child: Padding(
            padding: EdgeInsets.symmetric(horizontal: isSmallScreen ? 4 : 6),
            child: Material(
              color: Colors.transparent,
              child: InkWell(
                onTap: () => _handlePlatformOptionTap(title),
                borderRadius: BorderRadius.circular(isSmallScreen ? 10 : 12),
                child: Container(
                  padding: EdgeInsets.symmetric(
                    horizontal: isSmallScreen ? 4 : 8,
                    vertical: isSmallScreen ? 8 : 12,
                  ),
                  decoration: BoxDecoration(
                    color: theme.cardColor,
                    borderRadius: BorderRadius.circular(isSmallScreen ? 10 : 12),
                    border: Border.all(
                      color: theme.dividerColor.withOpacity(0.5),
                      width: 1,
                    ),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withOpacity(0.03),
                        blurRadius: isSmallScreen ? 4 : 8,
                        offset: Offset(0, isSmallScreen ? 1 : 2),
                      ),
                    ],
                  ),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Container(
                        width: isSmallScreen ? 32 : 40,
                        height: isSmallScreen ? 32 : 40,
                        decoration: BoxDecoration(
                          gradient: LinearGradient(
                            begin: Alignment.topLeft,
                            end: Alignment.bottomRight,
                            colors: colors,
                          ),
                          borderRadius: BorderRadius.circular(isSmallScreen ? 8 : 10),
                        ),
                        child: Icon(
                          option['icon'] as IconData,
                          color: Colors.white,
                          size: isSmallScreen ? 16 : 20,
                        ),
                      ),
                      SizedBox(height: isSmallScreen ? 6 : 8),
                      FittedBox(
                        fit: BoxFit.scaleDown,
                        child: Text(
                          title,
                          style: TextStyle(
                            fontSize: isSmallScreen ? 10 : 11,
                            fontWeight: FontWeight.w500,
                            color: theme.textTheme.bodyMedium?.color,
                          ),
                          textAlign: TextAlign.center,
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
        );
      }).toList(),
    );
  }
}
