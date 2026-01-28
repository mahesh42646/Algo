import 'package:flutter/material.dart';
import '../widgets/notification_bell.dart';
import '../widgets/crypto_list_widget.dart';
import '../services/user_service.dart';
import '../services/auth_service.dart';
import '../services/exchange_service.dart';
import '../services/algo_trading_service.dart';
import 'api_binding_screen.dart';
import 'profit_details_screen.dart';
import 'invite_friends_screen.dart';
import 'user_guide_screen.dart';
import 'mine_page.dart';

class HomePage extends StatefulWidget {
  const HomePage({super.key});

  @override
  State<HomePage> createState() => _HomePageState();
}

class _HomePageState extends State<HomePage> {
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
      'title': 'Profit Details',
      'icon': Icons.attach_money,
      'color': [Colors.red, Colors.orange],
    },
    {
      'title': 'Invite Friends',
      'icon': Icons.person_add,
      'color': [Colors.yellow, Colors.orange],
    },
    {
      'title': 'User Guide',
      'icon': Icons.menu_book,
      'color': [Colors.red, Colors.orange],
    },
  ];

  @override
  void initState() {
    super.initState();
    _loadData();
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

  Future<void> _loadStats() async {
    setState(() {
      _isLoadingStats = true;
    });
    
    try {
      // Load API count
      final apis = await _exchangeService.getLinkedApis();
      final activeApis = apis.where((api) => api.isActive).length;
      
      // Load trades count
      final activeTrades = await _algoService.getActiveTrades();
      
      // Load profit details
      final profitDetails = await _algoService.getProfitDetails(period: 'all');
      final totalProfit = (profitDetails['totalProfit'] ?? 0.0).toDouble();
      final tradeHistory = profitDetails['tradeHistory'] as List? ?? [];
      
      // Calculate profit:loss ratio
      double totalProfitAmount = 0.0;
      double totalLossAmount = 0.0;
      for (var trade in tradeHistory) {
        final profit = (trade['profit'] ?? 0.0).toDouble();
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
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _isLoadingStats = false;
        });
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
      case 'Profit Details':
        Navigator.push(
          context,
          MaterialPageRoute(builder: (_) => const ProfitDetailsScreen()),
        );
        break;
      case 'Invite Friends':
        Navigator.push(
          context,
          MaterialPageRoute(builder: (_) => const InviteFriendsScreen()),
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
          GestureDetector(
            onTap: () {
              Navigator.push(
                context,
                MaterialPageRoute(builder: (_) => const MinePage()),
              );
            },
            child: Container(
              margin: const EdgeInsets.only(right: 8),
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
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
                children: [
                  Icon(
                    Icons.account_balance_wallet,
                    size: 16,
                    color: Theme.of(context).colorScheme.primary,
                  ),
                  const SizedBox(width: 6),
                  Text(
                    _isLoadingBalance
                        ? '...'
                        : '${_platformBalance.toStringAsFixed(2)} USDT',
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                      color: Theme.of(context).colorScheme.primary,
                    ),
                  ),
                ],
              ),
            ),
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
        final isSmallScreen = screenWidth < 360; // Very small phones
        
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
      mainAxisSpacing: isSmallScreen ? 8 : 12,
      crossAxisSpacing: isSmallScreen ? 8 : 12,
      childAspectRatio: crossAxisCount == 2 ? 1.5 : 1.8,
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
    return Container(
      padding: EdgeInsets.all(isSmallScreen ? 8 : 12),
      decoration: BoxDecoration(
        color: theme.cardColor,
        borderRadius: BorderRadius.circular(isSmallScreen ? 8 : 12),
        border: Border.all(
          color: color.withOpacity(0.3),
          width: 1,
        ),
        boxShadow: [
          BoxShadow(
            color: color.withOpacity(0.1),
            blurRadius: isSmallScreen ? 4 : 8,
            offset: Offset(0, isSmallScreen ? 1 : 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Row(
            children: [
              Icon(icon, size: isSmallScreen ? 14 : 16, color: color),
              SizedBox(width: isSmallScreen ? 2 : 4),
              Expanded(
                child: Text(
                  label,
                  style: TextStyle(
                    fontSize: isSmallScreen ? 9 : 11,
                    color: Colors.grey[600],
                    fontWeight: FontWeight.w500,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
            ],
          ),
          SizedBox(height: isSmallScreen ? 4 : 8),
          FittedBox(
            fit: BoxFit.scaleDown,
            alignment: Alignment.centerLeft,
            child: Text(
              value,
              style: TextStyle(
                fontSize: isSmallScreen ? 14 : 16,
                fontWeight: FontWeight.bold,
                color: color,
              ),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          ),
        ],
      ),
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
    
    return LayoutBuilder(
      builder: (context, constraints) {
        final screenWidth = constraints.maxWidth;
        final crossAxisCount = screenWidth < 360 
            ? 2  // 2 columns on very small screens
            : screenWidth < 600 
                ? 2  // 2 columns on small screens
                : screenWidth < 1200
                    ? 4  // 4 columns on medium screens
                    : 4; // 4 columns on large screens
        
        return GridView.builder(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: crossAxisCount,
            crossAxisSpacing: isSmallScreen ? 8 : 12,
            mainAxisSpacing: isSmallScreen ? 8 : 12,
            childAspectRatio: screenWidth < 360 ? 1.1 : 0.9,
          ),
          itemCount: _platformOptions.length,
          itemBuilder: (context, index) {
            final option = _platformOptions[index];
            final colors = option['color'] as List<Color>;
            
            return Material(
              color: Colors.transparent,
              child: InkWell(
                onTap: () => _handlePlatformOptionTap(option['title'] as String),
                borderRadius: BorderRadius.circular(isSmallScreen ? 12 : 16),
                child: Container(
                  padding: EdgeInsets.all(isSmallScreen ? 8 : 12),
                  decoration: BoxDecoration(
                    color: theme.cardColor,
                    borderRadius: BorderRadius.circular(isSmallScreen ? 12 : 16),
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
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Container(
                              width: isSmallScreen ? 36 : 48,
                              height: isSmallScreen ? 36 : 48,
                              decoration: BoxDecoration(
                                gradient: LinearGradient(
                                  begin: Alignment.topLeft,
                                  end: Alignment.bottomRight,
                                  colors: colors,
                                ),
                                borderRadius: BorderRadius.circular(isSmallScreen ? 8 : 12),
                              ),
                              child: Icon(
                                option['icon'] as IconData,
                                color: Colors.white,
                                size: isSmallScreen ? 18 : 24,
                              ),
                            ),
                            SizedBox(height: isSmallScreen ? 4 : 8),
                            Text(
                              option['title'] as String,
                              style: TextStyle(
                                fontSize: isSmallScreen ? 9 : 11,
                                fontWeight: FontWeight.w500,
                                color: theme.textTheme.bodyMedium?.color,
                              ),
                              textAlign: TextAlign.center,
                              maxLines: 2,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ],
                        ),
                      ),
                    ),
                  );
                },
              );
            },
          ),
        );
      },
    );
  }
}
