import 'package:flutter/material.dart';
import 'home_page.dart';
import 'strategy_page.dart';
import 'circle_page.dart';
import 'favorites_page.dart';
import 'mine_page.dart';

class MainNavigationScreen extends StatefulWidget {
  const MainNavigationScreen({super.key});

  @override
  State<MainNavigationScreen> createState() => _MainNavigationScreenState();
}

class _MainNavigationScreenState extends State<MainNavigationScreen> {
  int _currentIndex = 0;

  final List<Widget> _pages = const [
    HomePage(),
    StrategyPage(),
    CirclePage(),
    FavoritesPage(),
    MinePage(),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: IndexedStack(
        index: _currentIndex,
        children: _pages,
      ),
      bottomNavigationBar: Container(
        decoration: BoxDecoration(
          color: Theme.of(context).bottomNavigationBarTheme.backgroundColor ?? 
                 Theme.of(context).cardColor,
          borderRadius: const BorderRadius.only(
            topLeft: Radius.circular(20),
            topRight: Radius.circular(20),
          ),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.05),
              blurRadius: 10,
              offset: const Offset(0, -2),
            ),
          ],
        ),
        child: SafeArea(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 8),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              children: [
                _buildNavItem(
                  icon: Icons.home,
                  iconOutlined: Icons.home_outlined,
                  label: 'Home',
                  index: 0,
                ),
                _buildNavItem(
                  icon: Icons.swap_horiz,
                  iconOutlined: Icons.swap_horiz,
                  label: 'Strategy',
                  index: 1,
                ),
                _buildNavItem(
                  icon: Icons.public,
                  iconOutlined: Icons.public_outlined,
                  label: 'Circle',
                  index: 2,
                ),
                _buildNavItem(
                  icon: Icons.star,
                  iconOutlined: Icons.star_border,
                  label: 'Favorites',
                  index: 3,
                ),
                _buildNavItem(
                  icon: Icons.person,
                  iconOutlined: Icons.person_outline,
                  label: 'Mine',
                  index: 4,
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildNavItem({
    required IconData icon,
    required IconData iconOutlined,
    required String label,
    required int index,
  }) {
    final theme = Theme.of(context);
    final isSelected = _currentIndex == index;
    final primaryColor = theme.colorScheme.primary;
    final isDark = theme.brightness == Brightness.dark;
    
    return Expanded(
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: () {
            setState(() {
              _currentIndex = index;
            });
          },
          borderRadius: BorderRadius.circular(30),
          child: AnimatedContainer(
            duration: const Duration(milliseconds: 200),
            padding: EdgeInsets.symmetric(
              vertical: isSelected ? 10 : 8,
              horizontal: isSelected ? 16 : 8,
            ),
            decoration: isSelected
                ? BoxDecoration(
                    color: isDark 
                        ? Colors.grey[800] 
                        : Colors.grey[200],
                    borderRadius: BorderRadius.circular(30),
                  )
                : null,
            child: Column(
              mainAxisSize: MainAxisSize.min,
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(
                  isSelected ? icon : iconOutlined,
                  color: isSelected 
                      ? primaryColor 
                      : (isDark ? Colors.grey[400] : Colors.grey[600]),
                  size: 22,
                ),
                const SizedBox(height: 4),
                Text(
                  label,
                  style: TextStyle(
                    fontSize: 11,
                    color: isSelected 
                        ? primaryColor 
                        : (isDark ? Colors.grey[400] : Colors.grey[600]),
                    fontWeight: isSelected ? FontWeight.w600 : FontWeight.normal,
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
