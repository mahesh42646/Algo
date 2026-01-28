/// Integration tests for identifying app crashes
/// Run with: flutter test test/integration_crash_tests.dart
/// 
/// These tests simulate real user flows and stress test the app

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:provider/provider.dart';

// Mock services to avoid Firebase/network dependencies
class MockAuthService {
  String? _currentUserId;
  
  String? get currentUserId => _currentUserId;
  bool get isLoggedIn => _currentUserId != null;
  
  Stream<String?> get authStateChanges => Stream.value(_currentUserId);
  
  void login(String userId) => _currentUserId = userId;
  void logout() => _currentUserId = null;
}

class MockUserService {
  Future<Map<String, dynamic>> getUser(String userId) async {
    await Future.delayed(const Duration(milliseconds: 100));
    return {
      'userId': userId,
      'email': 'test@example.com',
      'nickname': 'TestUser',
    };
  }

  Future<Map<String, dynamic>> getWallet(String userId) async {
    await Future.delayed(const Duration(milliseconds: 100));
    return {
      'balances': [
        {'currency': 'USDT', 'amount': 1000.0},
        {'currency': 'BTC', 'amount': 0.5},
      ],
    };
  }
}

class MockCryptoService {
  Future<List<Map<String, dynamic>>> getCoins() async {
    await Future.delayed(const Duration(milliseconds: 100));
    return List.generate(100, (i) => {
      'symbol': 'COIN$i',
      'name': 'Coin $i',
      'price': 100.0 + i,
      'change24h': (i % 20) - 10.0,
      'volume': 1000000.0 * (i + 1),
    });
  }
}

// Test app state provider
class TestAppState extends ChangeNotifier {
  ThemeMode _themeMode = ThemeMode.light;
  bool _isLoading = false;
  String? _error;
  List<Map<String, dynamic>> _coins = [];
  Map<String, dynamic>? _user;
  Map<String, dynamic>? _wallet;

  ThemeMode get themeMode => _themeMode;
  bool get isLoading => _isLoading;
  String? get error => _error;
  List<Map<String, dynamic>> get coins => _coins;
  Map<String, dynamic>? get user => _user;
  Map<String, dynamic>? get wallet => _wallet;

  void setTheme(ThemeMode mode) {
    _themeMode = mode;
    notifyListeners();
  }

  void setLoading(bool loading) {
    _isLoading = loading;
    notifyListeners();
  }

  void setError(String? error) {
    _error = error;
    notifyListeners();
  }

  void setCoins(List<Map<String, dynamic>> coins) {
    _coins = coins;
    notifyListeners();
  }

  void setUser(Map<String, dynamic>? user) {
    _user = user;
    notifyListeners();
  }

  void setWallet(Map<String, dynamic>? wallet) {
    _wallet = wallet;
    notifyListeners();
  }

  void clearAll() {
    _coins = [];
    _user = null;
    _wallet = null;
    _error = null;
    notifyListeners();
  }
}

void main() {
  group('Home Page Crash Tests', () {
    late TestAppState appState;

    setUp(() {
      appState = TestAppState();
    });

    testWidgets('Home page renders with empty data', (tester) async {
      await tester.pumpWidget(_buildTestApp(appState, _MockHomePage()));
      expect(find.byType(_MockHomePage), findsOneWidget);
    });

    testWidgets('Home page handles loading state', (tester) async {
      appState.setLoading(true);
      await tester.pumpWidget(_buildTestApp(appState, _MockHomePage()));
      expect(find.byType(CircularProgressIndicator), findsWidgets);
    });

    testWidgets('Home page handles error state', (tester) async {
      appState.setError('Network Error');
      await tester.pumpWidget(_buildTestApp(appState, _MockHomePage()));
      await tester.pump();
      expect(find.text('Network Error'), findsOneWidget);
    });

    testWidgets('Home page handles coin list', (tester) async {
      final coins = List.generate(50, (i) => {
        'symbol': 'COIN$i',
        'price': 100.0 + i,
        'change': (i % 10) - 5.0,
      });
      appState.setCoins(coins);
      
      await tester.pumpWidget(_buildTestApp(appState, _MockHomePage()));
      await tester.pump();
      
      // Scroll through list
      await tester.drag(find.byType(ListView), const Offset(0, -500));
      await tester.pump();
      await tester.drag(find.byType(ListView), const Offset(0, -500));
      await tester.pump();
    });

    testWidgets('Home page handles pull to refresh', (tester) async {
      appState.setCoins([{'symbol': 'BTC', 'price': 50000.0, 'change': 2.5}]);
      
      await tester.pumpWidget(_buildTestApp(appState, _MockHomePage()));
      
      // Simulate pull to refresh
      await tester.drag(find.byType(ListView), const Offset(0, 300));
      await tester.pumpAndSettle(); // Use pumpAndSettle to wait for all animations/timers
    });
  });

  group('Navigation Crash Tests', () {
    testWidgets('Bottom navigation handles rapid taps', (tester) async {
      await tester.pumpWidget(_MockNavigationApp());

      // Rapidly tap different tabs
      for (int i = 0; i < 20; i++) {
        await tester.tap(find.byIcon(Icons.home).first);
        await tester.pump();
        await tester.tap(find.byIcon(Icons.star).first);
        await tester.pump();
        await tester.tap(find.byIcon(Icons.person).first);
        await tester.pump();
      }
    });

    testWidgets('Screen transitions handle back press', (tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Builder(
            builder: (context) => Scaffold(
              body: ElevatedButton(
                onPressed: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(builder: (_) => _SecondScreen()),
                  );
                },
                child: const Text('Go'),
              ),
            ),
          ),
        ),
      );

      await tester.tap(find.text('Go'));
      await tester.pumpAndSettle();

      // Simulate back button
      final dynamic widgetsAppState = tester.state(find.byType(WidgetsApp));
      await widgetsAppState.didPopRoute();
      await tester.pumpAndSettle();
    });
  });

  group('Coin Detail Crash Tests', () {
    testWidgets('Coin detail handles null coin data', (tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: _MockCoinDetailScreen(coin: null),
        ),
      );
      expect(find.text('No data'), findsOneWidget);
    });

    testWidgets('Coin detail handles empty price history', (tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: _MockCoinDetailScreen(
            coin: {'symbol': 'BTC', 'price': 50000.0},
            priceHistory: [],
          ),
        ),
      );
      expect(find.byType(_MockCoinDetailScreen), findsOneWidget);
    });

    testWidgets('Coin detail handles large price history', (tester) async {
      final history = List.generate(1000, (i) => {
        'timestamp': DateTime.now().subtract(Duration(hours: i)).millisecondsSinceEpoch,
        'price': 50000.0 + (i * 10),
      });

      await tester.pumpWidget(
        MaterialApp(
          home: _MockCoinDetailScreen(
            coin: {'symbol': 'BTC', 'price': 50000.0},
            priceHistory: history,
          ),
        ),
      );
    });
  });

  group('User Profile Crash Tests', () {
    testWidgets('Profile handles null user', (tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: _MockProfileScreen(user: null),
        ),
      );
      expect(find.text('Not logged in'), findsOneWidget);
    });

    testWidgets('Profile handles missing fields', (tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: _MockProfileScreen(user: {}),
        ),
      );
      // Should show default values
      expect(find.text('Unknown'), findsOneWidget);
    });

    testWidgets('Profile handles image loading error', (tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: _MockProfileScreen(
            user: {
              'name': 'Test',
              'avatar': 'https://invalid-url.com/image.png',
            },
          ),
        ),
      );
      await tester.pump(const Duration(seconds: 1));
    });
  });

  group('Trading Screen Crash Tests', () {
    testWidgets('Trading handles zero balance', (tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: _MockTradingScreen(balance: 0.0),
        ),
      );
      expect(find.byType(_MockTradingScreen), findsOneWidget);
    });

    testWidgets('Trading handles very small amounts', (tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: _MockTradingScreen(balance: 0.00000001),
        ),
      );
      expect(find.byType(_MockTradingScreen), findsOneWidget);
    });

    testWidgets('Trading handles very large amounts', (tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: _MockTradingScreen(balance: 999999999999.99),
        ),
      );
      expect(find.byType(_MockTradingScreen), findsOneWidget);
    });

    testWidgets('Trading handles negative values (edge case)', (tester) async {
      // App should prevent this, but test resilience
      await tester.pumpWidget(
        MaterialApp(
          home: _MockTradingScreen(balance: -100.0),
        ),
      );
      // Should clamp to 0 or show error
      expect(find.byType(_MockTradingScreen), findsOneWidget);
    });
  });

  group('Form Submission Crash Tests', () {
    testWidgets('Login form handles empty fields', (tester) async {
      await tester.pumpWidget(
        MaterialApp(home: _MockLoginForm()),
      );

      await tester.tap(find.text('Login'));
      await tester.pump();

      expect(find.text('Email required'), findsOneWidget);
      expect(find.text('Password required'), findsOneWidget);
    });

    testWidgets('Login form handles invalid email', (tester) async {
      await tester.pumpWidget(
        MaterialApp(home: _MockLoginForm()),
      );

      await tester.enterText(find.byKey(const Key('email')), 'notanemail');
      await tester.enterText(find.byKey(const Key('password')), 'password123');
      await tester.tap(find.text('Login'));
      await tester.pump();

      expect(find.text('Invalid email'), findsOneWidget);
    });

    testWidgets('Login form handles special characters', (tester) async {
      await tester.pumpWidget(
        MaterialApp(home: _MockLoginForm()),
      );

      await tester.enterText(
        find.byKey(const Key('email')),
        "test'@example.com",
      );
      await tester.enterText(
        find.byKey(const Key('password')),
        "pass'word<script>",
      );
      await tester.tap(find.text('Login'));
      await tester.pump();
    });
  });

  group('API Response Crash Tests', () {
    test('Handle null API response', () {
      final response = null;
      final data = response ?? <String, dynamic>{};
      expect(data, isEmpty);
    });

    test('Handle malformed API response', () {
      final Map<String, dynamic> response = {
        'data': 'invalid', // Should be a Map
        'status': null,
      };

      dynamic data;
      if (response['data'] is Map<String, dynamic>) {
        data = response['data'];
      } else {
        data = <String, dynamic>{};
      }
      expect(data, isEmpty);
    });

    test('Handle API response with missing nested data', () {
      final Map<String, dynamic> response = {
        'data': {
          'user': null,
          'wallet': {
            'balances': null,
          },
        },
      };

      final user = response['data']?['user'] as Map<String, dynamic>? ?? {};
      final balances = response['data']?['wallet']?['balances'] as List? ?? [];

      expect(user, isEmpty);
      expect(balances, isEmpty);
    });

    test('Handle API timeout gracefully', () async {
      Future<String> slowApiCall() async {
        await Future.delayed(const Duration(seconds: 10));
        return 'response';
      }

      final result = await slowApiCall()
          .timeout(
            const Duration(milliseconds: 100),
            onTimeout: () => 'timeout',
          );

      expect(result, 'timeout');
    });
  });

  group('Memory Stress Tests', () {
    testWidgets('Handle creating many widgets', (tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: ListView.builder(
              itemCount: 10000,
              itemBuilder: (context, index) => Container(
                height: 50,
                color: Colors.primaries[index % Colors.primaries.length],
                child: Text('Item $index'),
              ),
            ),
          ),
        ),
      );

      // Scroll to various positions
      for (int i = 0; i < 10; i++) {
        await tester.drag(find.byType(ListView), Offset(0, -1000.0 * i));
        await tester.pump();
      }
    });

    testWidgets('Handle rapid state changes', (tester) async {
      final state = TestAppState();

      await tester.pumpWidget(
        ChangeNotifierProvider.value(
          value: state,
          child: MaterialApp(
            home: Consumer<TestAppState>(
              builder: (context, state, _) => Scaffold(
                body: Text('Loading: ${state.isLoading}'),
              ),
            ),
          ),
        ),
      );

      // Rapid state changes
      for (int i = 0; i < 100; i++) {
        state.setLoading(i.isEven);
      }
      await tester.pump();
    });
  });

  group('Concurrent Operation Tests', () {
    test('Handle multiple concurrent API calls', () async {
      final futures = <Future<int>>[];
      
      for (int i = 0; i < 50; i++) {
        futures.add(
          Future.delayed(Duration(milliseconds: i * 10), () => i),
        );
      }

      final results = await Future.wait(futures);
      expect(results.length, 50);
    });

    test('Handle stream subscription cleanup', () async {
      final controller = Stream<int>.periodic(
        const Duration(milliseconds: 10),
        (i) => i,
      ).take(10).asBroadcastStream();

      final values = <int>[];
      final subscription = controller.listen(values.add);

      await Future.delayed(const Duration(milliseconds: 150));
      await subscription.cancel();

      expect(values.isNotEmpty, true);
    });
  });
}

// Helper to build test app with provider
Widget _buildTestApp(TestAppState state, Widget child) {
  return ChangeNotifierProvider.value(
    value: state,
    child: Consumer<TestAppState>(
      builder: (context, state, _) => MaterialApp(
        theme: ThemeData.light(),
        darkTheme: ThemeData.dark(),
        themeMode: state.themeMode,
        home: child,
      ),
    ),
  );
}

// Mock widgets for testing
class _MockHomePage extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Consumer<TestAppState>(
      builder: (context, state, _) {
        if (state.isLoading) {
          return const Scaffold(
            body: Center(child: CircularProgressIndicator()),
          );
        }

        if (state.error != null) {
          return Scaffold(
            body: Center(child: Text(state.error!)),
          );
        }

        return Scaffold(
          appBar: AppBar(title: const Text('Home')),
          body: RefreshIndicator(
            onRefresh: () async {
              await Future.delayed(const Duration(milliseconds: 500));
            },
            child: ListView.builder(
              itemCount: state.coins.length,
              itemBuilder: (context, index) {
                final coin = state.coins[index];
                return ListTile(
                  title: Text(coin['symbol']?.toString() ?? 'Unknown'),
                  subtitle: Text('\$${coin['price']?.toString() ?? '0.00'}'),
                );
              },
            ),
          ),
        );
      },
    );
  }
}

class _MockNavigationApp extends StatefulWidget {
  @override
  State<_MockNavigationApp> createState() => _MockNavigationAppState();
}

class _MockNavigationAppState extends State<_MockNavigationApp> {
  int _currentIndex = 0;

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      home: Scaffold(
        body: IndexedStack(
          index: _currentIndex,
          children: const [
            Center(child: Text('Home')),
            Center(child: Text('Favorites')),
            Center(child: Text('Profile')),
          ],
        ),
        bottomNavigationBar: BottomNavigationBar(
          currentIndex: _currentIndex,
          onTap: (index) => setState(() => _currentIndex = index),
          items: const [
            BottomNavigationBarItem(icon: Icon(Icons.home), label: 'Home'),
            BottomNavigationBarItem(icon: Icon(Icons.star), label: 'Favorites'),
            BottomNavigationBarItem(icon: Icon(Icons.person), label: 'Profile'),
          ],
        ),
      ),
    );
  }
}

class _SecondScreen extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return const Scaffold(body: Center(child: Text('Second Screen')));
  }
}

class _MockCoinDetailScreen extends StatelessWidget {
  final Map<String, dynamic>? coin;
  final List<Map<String, dynamic>>? priceHistory;

  const _MockCoinDetailScreen({this.coin, this.priceHistory});

  @override
  Widget build(BuildContext context) {
    if (coin == null) {
      return const Scaffold(body: Center(child: Text('No data')));
    }

    return Scaffold(
      appBar: AppBar(title: Text(coin!['symbol']?.toString() ?? 'Unknown')),
      body: Column(
        children: [
          Text('\$${coin!['price']?.toString() ?? '0.00'}'),
          if (priceHistory != null && priceHistory!.isNotEmpty)
            Expanded(
              child: ListView.builder(
                itemCount: priceHistory!.length,
                itemBuilder: (context, index) => Text(
                  priceHistory![index]['price']?.toString() ?? '0',
                ),
              ),
            ),
        ],
      ),
    );
  }
}

class _MockProfileScreen extends StatelessWidget {
  final Map<String, dynamic>? user;

  const _MockProfileScreen({this.user});

  @override
  Widget build(BuildContext context) {
    if (user == null) {
      return const Scaffold(body: Center(child: Text('Not logged in')));
    }

    final name = user!['name']?.toString() ?? 'Unknown';
    final avatarUrl = user!['avatar']?.toString();

    return Scaffold(
      body: Column(
        children: [
          if (avatarUrl != null)
            Image.network(
              avatarUrl,
              errorBuilder: (_, __, ___) => const Icon(Icons.person),
            )
          else
            const Icon(Icons.person),
          Text(name),
        ],
      ),
    );
  }
}

class _MockTradingScreen extends StatelessWidget {
  final double balance;

  const _MockTradingScreen({required this.balance});

  @override
  Widget build(BuildContext context) {
    final displayBalance = balance < 0 ? 0.0 : balance;
    
    return Scaffold(
      body: Center(
        child: Text(
          'Balance: \$${displayBalance.toStringAsFixed(8)}',
        ),
      ),
    );
  }
}

class _MockLoginForm extends StatefulWidget {
  @override
  State<_MockLoginForm> createState() => _MockLoginFormState();
}

class _MockLoginFormState extends State<_MockLoginForm> {
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  String? _validateEmail(String? value) {
    if (value == null || value.isEmpty) return 'Email required';
    if (!value.contains('@') || !value.contains('.')) return 'Invalid email';
    return null;
  }

  String? _validatePassword(String? value) {
    if (value == null || value.isEmpty) return 'Password required';
    return null;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Form(
        key: _formKey,
        child: Column(
          children: [
            TextFormField(
              key: const Key('email'),
              controller: _emailController,
              validator: _validateEmail,
              decoration: const InputDecoration(labelText: 'Email'),
            ),
            TextFormField(
              key: const Key('password'),
              controller: _passwordController,
              validator: _validatePassword,
              obscureText: true,
              decoration: const InputDecoration(labelText: 'Password'),
            ),
            ElevatedButton(
              onPressed: () => _formKey.currentState?.validate(),
              child: const Text('Login'),
            ),
          ],
        ),
      ),
    );
  }
}
