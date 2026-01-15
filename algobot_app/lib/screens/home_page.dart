import 'package:flutter/material.dart';
import '../widgets/notification_bell.dart';
import '../widgets/crypto_list_widget.dart';
import 'api_binding_screen.dart';

class HomePage extends StatefulWidget {
  const HomePage({super.key});

  @override
  State<HomePage> createState() => _HomePageState();
}

class _HomePageState extends State<HomePage> {
  final PageController _pageController = PageController();
  int _currentPage = 0;

  final List<Map<String, dynamic>> _carouselItems = [
    {
      'title': 'Don\'t trust anyone',
      'subtitle': 'Please keep your personal information safe and avoid false information',
      'color': Colors.red,
    },
    {
      'title': 'Welcome to AlgoBot',
      'subtitle': 'Start trading with our advanced strategies',
      'color': Colors.blue,
    },
    {
      'title': 'New Features Available',
      'subtitle': 'Check out our latest updates',
      'color': Colors.green,
    },
  ];

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
      'title': 'Reward Details',
      'icon': Icons.star,
      'color': [Colors.green, Colors.teal],
    },
    {
      'title': 'Assets',
      'icon': Icons.account_balance_wallet,
      'color': [Colors.orange, Colors.yellow],
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
    {
      'title': 'Mentor',
      'icon': Icons.school,
      'color': [Colors.purple, Colors.blue],
    },
    {
      'title': 'More',
      'icon': Icons.apps,
      'color': [Colors.green, Colors.teal],
    },
  ];

  @override
  void dispose() {
    _pageController.dispose();
    super.dispose();
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
        // TODO: Navigate to profit details
        break;
      case 'Reward Details':
        // TODO: Navigate to reward details
        break;
      case 'Assets':
        // TODO: Navigate to assets
        break;
      case 'Invite Friends':
        // TODO: Navigate to invite friends
        break;
      case 'User Guide':
        // TODO: Navigate to user guide
        break;
      case 'Mentor':
        // TODO: Navigate to mentor
        break;
      case 'More':
        // TODO: Show more options
        break;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Home'),
        actions: [
          const NotificationBell(),
        ],
      ),
      body: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _buildCarousel(),
            const SizedBox(height: 16),
            _buildNotificationBanner(),
            const SizedBox(height: 24),
            _buildPlatformOptions(),
            const CryptoListWidget(),
          ],
        ),
      ),
    );
  }

  Widget _buildCarousel() {
    return Column(
      children: [
        SizedBox(
          height: 180,
          child: PageView.builder(
            controller: _pageController,
            onPageChanged: (index) {
              setState(() {
                _currentPage = index;
              });
            },
            itemCount: _carouselItems.length,
            itemBuilder: (context, index) {
              final item = _carouselItems[index];
              return Container(
                margin: const EdgeInsets.symmetric(horizontal: 16),
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                    colors: [
                      item['color'] as Color,
                      (item['color'] as Color).withOpacity(0.7),
                    ],
                  ),
                  borderRadius: BorderRadius.circular(12),
                ),
                padding: const EdgeInsets.all(20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text(
                      item['title'] as String,
                      style: const TextStyle(
                        fontSize: 24,
                        fontWeight: FontWeight.bold,
                        color: Colors.white,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      item['subtitle'] as String,
                      style: const TextStyle(
                        fontSize: 14,
                        color: Colors.white70,
                      ),
                    ),
                  ],
                ),
              );
            },
          ),
        ),
        const SizedBox(height: 8),
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: List.generate(
            _carouselItems.length,
            (index) => Container(
              width: 8,
              height: 8,
              margin: const EdgeInsets.symmetric(horizontal: 4),
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: _currentPage == index
                    ? Theme.of(context).colorScheme.primary
                    : Colors.grey[300],
              ),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildNotificationBanner() {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16),
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: Colors.grey[200]!),
      ),
      child: Row(
        children: [
          Icon(Icons.notifications_outlined, color: Colors.grey[600]),
          const SizedBox(width: 12),
          const Expanded(
            child: Text(
              'Removing LGCT from Gate.io Spot Trading',
              style: TextStyle(fontSize: 14),
            ),
          ),
          Icon(Icons.menu, color: Colors.grey[600]),
        ],
      ),
    );
  }

  Widget _buildPlatformOptions() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: GridView.builder(
        shrinkWrap: true,
        physics: const NeverScrollableScrollPhysics(),
        gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
          crossAxisCount: 4,
          crossAxisSpacing: 16,
          mainAxisSpacing: 16,
          childAspectRatio: 0.85,
        ),
        itemCount: _platformOptions.length,
        itemBuilder: (context, index) {
          final option = _platformOptions[index];
          final colors = option['color'] as List<Color>;
          
          return GestureDetector(
            onTap: () => _handlePlatformOptionTap(option['title'] as String),
            child: Column(
              children: [
                Container(
                  width: 60,
                  height: 60,
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                      colors: colors,
                    ),
                    borderRadius: BorderRadius.circular(12),
                    boxShadow: [
                      BoxShadow(
                        color: colors[0].withOpacity(0.3),
                        blurRadius: 8,
                        offset: const Offset(0, 4),
                      ),
                    ],
                  ),
                  child: Icon(
                    option['icon'] as IconData,
                    color: Colors.white,
                    size: 28,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  option['title'] as String,
                  style: const TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w500,
                  ),
                  textAlign: TextAlign.center,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
          );
        },
      ),
    );
  }
}
