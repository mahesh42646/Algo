import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../widgets/notification_bell.dart';
import '../config/env.dart';
import '../providers/app_state_provider.dart';

class CirclePage extends StatefulWidget {
  const CirclePage({super.key});

  @override
  State<CirclePage> createState() => _CirclePageState();
}

class _CirclePageState extends State<CirclePage> {
  int _selectedTab = 0;
  final PageController _bannerController = PageController();
  int _currentBannerPage = 0;
  
  final Map<String, String> _languageNames = {
    'en': 'English',
    'es': 'Spanish',
    'fr': 'French',
    'de': 'German',
    'zh': 'Chinese',
    'ja': 'Japanese',
    'ko': 'Korean',
    'hi': 'Hindi',
    'ar': 'Arabic',
  };

  final List<Map<String, dynamic>> _strategies = [
    {
      'name': 'RS trade',
      'members': 22,
      'profit7Days': 60.29,
      'profit7DaysUsdt': 18.85,
      'totalProfit': 6872.86,
      'syncedProfit': 2.16,
      'synced': true,
      'platforms': ['binance', 'gate'],
    },
    {
      'name': 'EngrLevels',
      'members': 15,
      'profit7Days': 164.09,
      'profit7DaysUsdt': 743.74,
      'totalProfit': 25495.88,
      'syncedProfit': 743.74,
      'synced': true,
      'platforms': ['binance', 'okx'],
    },
  ];

  @override
  void dispose() {
    _bannerController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            _buildTabButton('Circle', 0),
            const SizedBox(width: 24),
            _buildTabButton('Posts', 1),
            const SizedBox(width: 24),
            _buildTabButton('Manage', 2),
          ],
        ),
        actions: [
          IconButton(
            icon: Container(
              width: 36,
              height: 36,
              decoration: BoxDecoration(
                color: Theme.of(context).cardColor,
                shape: BoxShape.circle,
                border: Border.all(
                  color: Theme.of(context).dividerColor,
                ),
              ),
              child: Icon(
                Icons.add,
                color: Theme.of(context).textTheme.bodyLarge?.color,
                size: 20,
              ),
            ),
            onPressed: () {},
          ),
          const SizedBox(width: 8),
        ],
      ),
      body: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _buildSearchBar(),
            const SizedBox(height: 16),
            _buildHeroBanner(),
            const SizedBox(height: 24),
            _buildDiscoverSection(),
            const SizedBox(height: 16),
            _buildStrategyList(),
          ],
        ),
      ),
    );
  }

  Widget _buildTabButton(String label, int index) {
    final theme = Theme.of(context);
    final isSelected = _selectedTab == index;
    final isDark = theme.brightness == Brightness.dark;
    
    return GestureDetector(
      onTap: () => setState(() => _selectedTab = index),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        decoration: BoxDecoration(
          color: isSelected 
              ? theme.colorScheme.primary.withOpacity(0.1)
              : Colors.transparent,
          borderRadius: BorderRadius.circular(8),
        ),
        child: Text(
          label,
          style: TextStyle(
            fontSize: 15,
            fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
            color: isSelected 
                ? theme.colorScheme.primary
                : (isDark ? Colors.grey[400] : Colors.grey[600]),
          ),
        ),
      ),
    );
  }

  Widget _buildSearchBar() {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16),
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        color: isDark ? Colors.grey[800] : Colors.grey[100],
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: isDark ? Colors.grey[700]! : Colors.grey[200]!,
          width: 1,
        ),
      ),
      child: Row(
        children: [
          Icon(
            Icons.search,
            color: isDark ? Colors.grey[400] : Colors.grey[600],
          ),
          const SizedBox(width: 12),
          Text(
            'Search circle',
            style: TextStyle(
              color: isDark ? Colors.grey[400] : Colors.grey[600],
              fontSize: 14,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildHeroBanner() {
    return Column(
      children: [
        LayoutBuilder(
          builder: (context, constraints) {
            final screenWidth = constraints.maxWidth;
            final isSmallScreen = screenWidth < 380;
            return SizedBox(
              height: isSmallScreen ? 180 : 200,
              child: PageView.builder(
                controller: _bannerController,
                onPageChanged: (index) => setState(() => _currentBannerPage = index),
                itemCount: 3,
                itemBuilder: (context, index) {
                  return Container(
                    margin: const EdgeInsets.symmetric(horizontal: 16),
                    decoration: BoxDecoration(
                      gradient: const LinearGradient(
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                        colors: [Color(0xFF1A237E), Color(0xFF283593)],
                      ),
                      borderRadius: BorderRadius.circular(16),
                    ),
                    padding: EdgeInsets.all(isSmallScreen ? 16 : 24),
                    child: Row(
                      children: [
                        Expanded(
                          child: Column(
                            mainAxisSize: MainAxisSize.min,
                            crossAxisAlignment: CrossAxisAlignment.start,
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                decoration: BoxDecoration(
                                  color: Colors.blue[700],
                                  borderRadius: BorderRadius.circular(8),
                                ),
                                child: Text(
                                  Env.appName,
                                  style: TextStyle(
                                    color: Colors.white,
                                    fontSize: isSmallScreen ? 12 : 14,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                              ),
                              SizedBox(height: isSmallScreen ? 8 : 12),
                              Text(
                                'Users profit over',
                                style: TextStyle(
                                  color: Colors.white70,
                                  fontSize: isSmallScreen ? 13 : 16,
                                ),
                              ),
                              SizedBox(height: isSmallScreen ? 4 : 8),
                              FittedBox(
                                fit: BoxFit.scaleDown,
                                alignment: Alignment.centerLeft,
                                child: Text(
                                  '185,000,000 USDT',
                                  style: TextStyle(
                                    color: const Color(0xFFFFD700),
                                    fontSize: isSmallScreen ? 24 : 32,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                              ),
                              SizedBox(height: isSmallScreen ? 8 : 12),
                              OutlinedButton(
                                onPressed: () {},
                                style: OutlinedButton.styleFrom(
                                  side: const BorderSide(color: Colors.white),
                                  padding: EdgeInsets.symmetric(
                                    horizontal: isSmallScreen ? 12 : 16,
                                    vertical: isSmallScreen ? 6 : 8,
                                  ),
                                  shape: RoundedRectangleBorder(
                                    borderRadius: BorderRadius.circular(8),
                                  ),
                                ),
                                child: Text(
                                  'Enjoy daily profit',
                                  style: TextStyle(
                                    color: Colors.white,
                                    fontSize: isSmallScreen ? 12 : 14,
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                        SizedBox(width: isSmallScreen ? 8 : 16),
                        Container(
                          width: isSmallScreen ? 80 : 120,
                          height: isSmallScreen ? 80 : 120,
                          decoration: BoxDecoration(
                            color: Colors.amber[100],
                            shape: BoxShape.circle,
                          ),
                          child: Icon(
                            Icons.account_balance_wallet,
                            size: isSmallScreen ? 40 : 60,
                            color: const Color(0xFFFFD700),
                          ),
                        ),
                      ],
                    ),
                  );
                },
              ),
            );
          },
        ),
        const SizedBox(height: 12),
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: List.generate(
            3,
            (index) => Container(
              width: 8,
              height: 8,
              margin: const EdgeInsets.symmetric(horizontal: 4),
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: _currentBannerPage == index
                    ? Theme.of(context).colorScheme.primary
                    : Colors.grey[300],
              ),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildDiscoverSection() {
    return Consumer<AppStateProvider>(
      builder: (context, appState, _) {
        final currentLanguage = _languageNames[appState.language] ?? 'English';
        return Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          child: LayoutBuilder(
            builder: (context, constraints) {
              final isSmall = constraints.maxWidth < 380;
              
              return Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(
                    Icons.public,
                    color: Theme.of(context).colorScheme.primary,
                    size: isSmall ? 18 : 20,
                  ),
                  SizedBox(width: isSmall ? 4 : 8),
                  Flexible(
                    child: Text(
                      'Discover Circle',
                      style: TextStyle(
                        fontSize: isSmall ? 16 : 18,
                        fontWeight: FontWeight.bold,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                  const SizedBox(width: 8),
                  Container(
                    padding: EdgeInsets.symmetric(
                      horizontal: isSmall ? 8 : 12,
                      vertical: isSmall ? 4 : 6,
                    ),
                    decoration: BoxDecoration(
                      color: Theme.of(context).brightness == Brightness.dark
                          ? Colors.grey[800]
                          : Colors.grey[100],
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Flexible(
                          child: Text(
                            currentLanguage,
                            style: TextStyle(fontSize: isSmall ? 12 : 14),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                        const SizedBox(width: 4),
                        Icon(
                          Icons.arrow_drop_down,
                          size: isSmall ? 18 : 20,
                          color: Colors.grey[600],
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(width: 6),
                  Icon(
                    Icons.filter_list,
                    color: Colors.grey[600],
                    size: isSmall ? 18 : 20,
                  ),
                ],
              );
            },
          ),
        );
      },
    );
  }

  Widget _buildStrategyList() {
    return ListView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      padding: const EdgeInsets.symmetric(horizontal: 16),
      itemCount: _strategies.length,
      itemBuilder: (context, index) {
        final strategy = _strategies[index];
        return _buildStrategyCard(strategy);
      },
    );
  }

  Widget _buildStrategyCard(Map<String, dynamic> strategy) {
    return LayoutBuilder(
      builder: (context, constraints) {
        final isSmall = constraints.maxWidth < 380;
        
        return Container(
          margin: EdgeInsets.only(bottom: isSmall ? 12 : 16),
          padding: EdgeInsets.all(isSmall ? 12 : 16),
          decoration: BoxDecoration(
            color: Theme.of(context).cardColor,
            borderRadius: BorderRadius.circular(12),
            boxShadow: [
              BoxShadow(
                color: Theme.of(context).brightness == Brightness.dark
                    ? Colors.black.withOpacity(0.3)
                    : Colors.black.withOpacity(0.05),
                blurRadius: 10,
                offset: const Offset(0, 2),
              ),
            ],
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              Row(
                children: [
                  CircleAvatar(
                    radius: isSmall ? 20 : 24,
                    backgroundColor: Theme.of(context).brightness == Brightness.dark
                        ? Colors.grey[700]
                        : Colors.grey[300],
                    child: Icon(
                      Icons.person,
                      size: isSmall ? 18 : 22,
                      color: Theme.of(context).brightness == Brightness.dark
                          ? Colors.grey[400]
                          : Colors.grey,
                    ),
                  ),
                  SizedBox(width: isSmall ? 8 : 12),
                  Expanded(
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          strategy['name'] as String,
                          style: TextStyle(
                            fontSize: isSmall ? 14 : 16,
                            fontWeight: FontWeight.bold,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                        Text(
                          '${strategy['members']} people joined',
                          style: TextStyle(
                            fontSize: isSmall ? 11 : 12,
                            color: Colors.grey[600],
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ],
                    ),
                  ),
                  Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Container(
                        padding: const EdgeInsets.all(4),
                        decoration: BoxDecoration(
                          color: Colors.orange[100],
                          borderRadius: BorderRadius.circular(4),
                        ),
                        child: Icon(
                          Icons.local_fire_department,
                          size: isSmall ? 14 : 16,
                          color: Colors.orange,
                        ),
                      ),
                      const SizedBox(width: 4),
                      Container(
                        padding: const EdgeInsets.all(4),
                        decoration: BoxDecoration(
                          color: Colors.blue[100],
                          borderRadius: BorderRadius.circular(4),
                        ),
                        child: Icon(
                          Icons.account_balance,
                          size: isSmall ? 14 : 16,
                          color: Colors.blue,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
              SizedBox(height: isSmall ? 10 : 12),
              Row(
                children: [
                  Icon(
                    Icons.sync,
                    color: Theme.of(context).colorScheme.primary,
                    size: isSmall ? 14 : 16,
                  ),
                  const SizedBox(width: 4),
                  Flexible(
                    child: Text(
                      'Sync strategy is turned on',
                      style: TextStyle(
                        fontSize: isSmall ? 11 : 12,
                        color: Colors.grey[600],
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                  const SizedBox(width: 6),
                  ElevatedButton(
                    onPressed: () {},
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.orange,
                      foregroundColor: Colors.white,
                      padding: EdgeInsets.symmetric(
                        horizontal: isSmall ? 14 : 18,
                        vertical: isSmall ? 6 : 8,
                      ),
                      minimumSize: Size.zero,
                      tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(8),
                      ),
                    ),
                    child: Text(
                      'View',
                      style: TextStyle(fontSize: isSmall ? 11 : 12),
                    ),
                  ),
                ],
              ),
            ],
          ),
        );
      },
    );
  }
}