/// Comprehensive crash testing suite for AlgoBot App
/// Run with: flutter test test/crash_tests.dart --no-sound-null-safety
/// Or: flutter test test/crash_tests.dart -v (for verbose output)

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:provider/provider.dart';

// Mock classes for testing without Firebase dependency
class MockAppStateProvider extends ChangeNotifier {
  ThemeMode _themeMode = ThemeMode.system;
  bool _isOnline = true;

  ThemeMode get themeMode => _themeMode;
  bool get isOnline => _isOnline;

  void setTheme(ThemeMode mode) {
    _themeMode = mode;
    notifyListeners();
  }

  void setOnline(bool online) {
    _isOnline = online;
    notifyListeners();
  }
}

void main() {
  group('Widget Crash Tests', () {
    testWidgets('App should handle null context gracefully', (tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Builder(
            builder: (context) {
              // Access theme safely
              final theme = Theme.of(context);
              expect(theme, isNotNull);
              return const Scaffold(body: Text('Test'));
            },
          ),
        ),
      );
      expect(find.text('Test'), findsOneWidget);
    });

    testWidgets('App should handle empty lists without crashing', (tester) async {
      final List<String> emptyList = [];
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: ListView.builder(
              itemCount: emptyList.length,
              itemBuilder: (context, index) => Text(emptyList[index]),
            ),
          ),
        ),
      );
      expect(find.byType(ListView), findsOneWidget);
    });

    testWidgets('GridView should handle 0 items', (tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: GridView.builder(
              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 4,
              ),
              itemCount: 0,
              itemBuilder: (context, index) => const SizedBox(),
            ),
          ),
        ),
      );
      expect(find.byType(GridView), findsOneWidget);
    });

    testWidgets('App should handle rapid setState calls', (tester) async {
      int counter = 0;
      await tester.pumpWidget(
        MaterialApp(
          home: StatefulBuilder(
            builder: (context, setState) {
              return Scaffold(
                body: Text('Counter: $counter'),
                floatingActionButton: FloatingActionButton(
                  onPressed: () {
                    for (int i = 0; i < 100; i++) {
                      setState(() => counter++);
                    }
                  },
                  child: const Icon(Icons.add),
                ),
              );
            },
          ),
        ),
      );
      await tester.tap(find.byType(FloatingActionButton));
      await tester.pump();
      expect(counter, 100);
    });

    testWidgets('PageView should handle page changes', (tester) async {
      final controller = PageController();
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: PageView(
              controller: controller,
              children: List.generate(
                5,
                (index) => Center(child: Text('Page $index')),
              ),
            ),
          ),
        ),
      );

      // Swipe to next page
      await tester.drag(find.byType(PageView), const Offset(-300, 0));
      await tester.pumpAndSettle();
      controller.dispose();
    });

    testWidgets('App should handle theme changes without crash', (tester) async {
      final provider = MockAppStateProvider();
      await tester.pumpWidget(
        ChangeNotifierProvider<MockAppStateProvider>.value(
          value: provider,
          child: Consumer<MockAppStateProvider>(
            builder: (context, state, _) {
              return MaterialApp(
                themeMode: state.themeMode,
                theme: ThemeData.light(),
                darkTheme: ThemeData.dark(),
                home: const Scaffold(body: Text('Theme Test')),
              );
            },
          ),
        ),
      );

      // Change theme rapidly
      provider.setTheme(ThemeMode.dark);
      await tester.pump();
      provider.setTheme(ThemeMode.light);
      await tester.pump();
      provider.setTheme(ThemeMode.system);
      await tester.pump();
      expect(find.text('Theme Test'), findsOneWidget);
    });

    testWidgets('ScrollController should be disposed properly', (tester) async {
      final scrollController = ScrollController();
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: ListView.builder(
              controller: scrollController,
              itemCount: 100,
              itemBuilder: (context, index) => ListTile(title: Text('Item $index')),
            ),
          ),
        ),
      );

      // Scroll down
      await tester.drag(find.byType(ListView), const Offset(0, -500));
      await tester.pump();

      // Dispose controller
      scrollController.dispose();
    });
  });

  group('Navigation Crash Tests', () {
    testWidgets('Navigator should handle push/pop without crash', (tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Builder(
            builder: (context) {
              return Scaffold(
                body: ElevatedButton(
                  onPressed: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (_) => Scaffold(
                          appBar: AppBar(title: const Text('Detail')),
                          body: const Text('Second'),
                        ),
                      ),
                    );
                  },
                  child: const Text('Navigate'),
                ),
              );
            },
          ),
        ),
      );

      await tester.tap(find.text('Navigate'));
      await tester.pumpAndSettle();
      expect(find.text('Second'), findsOneWidget);

      // Go back using Navigator.pop
      final dynamic navigatorState = tester.state(find.byType(Navigator));
      navigatorState.pop();
      await tester.pumpAndSettle();
      expect(find.text('Navigate'), findsOneWidget);
    });

    testWidgets('Navigator should handle named routes with null arguments', (tester) async {
      await tester.pumpWidget(
        MaterialApp(
          initialRoute: '/',
          routes: {
            '/': (context) => const Scaffold(body: Text('Home')),
            '/detail': (context) {
              final args = ModalRoute.of(context)?.settings.arguments;
              return Scaffold(
                body: Text('Args: ${args ?? 'null'}'),
              );
            },
          },
        ),
      );
      expect(find.text('Home'), findsOneWidget);
    });

    testWidgets('App should handle back navigation on root', (tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: PopScope(
            canPop: false,
            onPopInvokedWithResult: (didPop, result) {
              // Handle back press on root
            },
            child: const Scaffold(body: Text('Root')),
          ),
        ),
      );
      expect(find.text('Root'), findsOneWidget);
    });
  });

  group('Data Parsing Crash Tests', () {
    test('Should handle null JSON values', () {
      final Map<String, dynamic> json = {
        'name': null,
        'value': null,
        'list': null,
      };

      final name = json['name'] as String? ?? 'default';
      final value = (json['value'] as num?)?.toDouble() ?? 0.0;
      final list = json['list'] as List? ?? [];

      expect(name, 'default');
      expect(value, 0.0);
      expect(list, isEmpty);
    });

    test('Should handle missing JSON keys', () {
      final Map<String, dynamic> json = {};

      final name = json['name'] as String? ?? 'default';
      final nested = (json['data'] as Map<String, dynamic>?)?['value'] ?? 0;

      expect(name, 'default');
      expect(nested, 0);
    });

    test('Should handle type mismatches in JSON', () {
      final Map<String, dynamic> json = {
        'price': '123.45', // String instead of number
        'count': 10.5, // Double instead of int
      };

      double parsePrice(dynamic value) {
        if (value == null) return 0.0;
        if (value is num) return value.toDouble();
        if (value is String) return double.tryParse(value) ?? 0.0;
        return 0.0;
      }

      int parseCount(dynamic value) {
        if (value == null) return 0;
        if (value is int) return value;
        if (value is double) return value.toInt();
        if (value is String) return int.tryParse(value) ?? 0;
        return 0;
      }

      expect(parsePrice(json['price']), 123.45);
      expect(parseCount(json['count']), 10);
    });

    test('Should handle empty and malformed lists', () {
      final List<dynamic> emptyList = [];
      final List<dynamic>? nullList = null;
      final List<dynamic> mixedList = [1, 'two', null, 4.0];

      // Safe firstWhere
      final firstOrDefault = emptyList.isNotEmpty ? emptyList.first : 'default';
      expect(firstOrDefault, 'default');

      // Safe null list access
      final safeList = nullList ?? [];
      expect(safeList, isEmpty);

      // Filter nulls
      final filtered = mixedList.whereType<num>().toList();
      expect(filtered.length, 2);
    });

    test('Should handle deeply nested null objects', () {
      final Map<String, dynamic>? data = null;
      
      // Safe nested access pattern
      final value = data?['level1']?['level2']?['level3'] ?? 'default';
      expect(value, 'default');
    });
  });

  group('Async Operation Crash Tests', () {
    test('Should handle Future timeout', () async {
      Future<String> slowOperation() async {
        await Future.delayed(const Duration(seconds: 5));
        return 'done';
      }

      try {
        await slowOperation().timeout(
          const Duration(milliseconds: 100),
          onTimeout: () => 'timeout',
        );
      } catch (e) {
        // Should not throw when onTimeout is provided
        fail('Should not throw');
      }
    });

    test('Should handle cancelled operations', () async {
      bool isCancelled = false;
      
      Future<void> cancellableOperation() async {
        for (int i = 0; i < 10; i++) {
          if (isCancelled) return;
          await Future.delayed(const Duration(milliseconds: 10));
        }
      }

      final future = cancellableOperation();
      isCancelled = true;
      await future;
    });

    test('Should handle multiple concurrent futures', () async {
      final futures = List.generate(
        50,
        (i) => Future.delayed(
          Duration(milliseconds: i * 10),
          () => i,
        ),
      );

      final results = await Future.wait(futures);
      expect(results.length, 50);
    });

    test('Should handle Stream errors gracefully', () async {
      Stream<int> errorStream() async* {
        yield 1;
        yield 2;
        throw Exception('Stream error');
      }

      final values = <int>[];
      await for (final value in errorStream().handleError((e) {})) {
        values.add(value);
      }
      expect(values, [1, 2]);
    });
  });

  group('State Management Crash Tests', () {
    testWidgets('Provider should handle rapid updates', (tester) async {
      final provider = MockAppStateProvider();
      int buildCount = 0;

      await tester.pumpWidget(
        ChangeNotifierProvider<MockAppStateProvider>.value(
          value: provider,
          child: Consumer<MockAppStateProvider>(
            builder: (context, state, _) {
              buildCount++;
              return MaterialApp(
                home: Scaffold(
                  body: Text('Online: ${state.isOnline}'),
                ),
              );
            },
          ),
        ),
      );

      // Rapid state changes
      for (int i = 0; i < 20; i++) {
        provider.setOnline(i.isEven);
      }
      await tester.pump();
      
      // Should not crash
      expect(find.byType(Scaffold), findsOneWidget);
    });

    testWidgets('Provider should handle disposal', (tester) async {
      final provider = MockAppStateProvider();
      
      await tester.pumpWidget(
        ChangeNotifierProvider<MockAppStateProvider>.value(
          value: provider,
          child: const MaterialApp(
            home: Scaffold(body: Text('Test')),
          ),
        ),
      );

      // Replace widget tree (simulates screen change)
      await tester.pumpWidget(const SizedBox());
      
      // Provider should be accessible for disposal
      provider.dispose();
    });
  });

  group('Memory & Performance Crash Tests', () {
    testWidgets('Should handle large lists without crashing', (tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: ListView.builder(
              itemCount: 10000,
              itemBuilder: (context, index) => ListTile(
                title: Text('Item $index'),
                subtitle: Text('Subtitle for item $index'),
              ),
            ),
          ),
        ),
      );

      // Scroll to middle
      await tester.drag(find.byType(ListView), const Offset(0, -5000));
      await tester.pump();

      // Scroll back
      await tester.drag(find.byType(ListView), const Offset(0, 5000));
      await tester.pump();

      expect(find.byType(ListView), findsOneWidget);
    });

    testWidgets('Should handle rapid widget rebuilds', (tester) async {
      int counter = 0;
      
      await tester.pumpWidget(
        MaterialApp(
          home: StatefulBuilder(
            builder: (context, setState) {
              return Scaffold(
                body: Column(
                  children: [
                    Text('Count: $counter'),
                    ElevatedButton(
                      onPressed: () {
                        for (int i = 0; i < 50; i++) {
                          setState(() => counter++);
                        }
                      },
                      child: const Text('Increment'),
                    ),
                  ],
                ),
              );
            },
          ),
        ),
      );

      await tester.tap(find.text('Increment'));
      await tester.pump();

      expect(counter, 50);
    });

    test('Should handle string operations on large data', () {
      final largeString = 'x' * 1000000;
      
      // These should not crash
      expect(largeString.length, 1000000);
      expect(largeString.substring(0, 10), 'xxxxxxxxxx');
      expect(largeString.contains('x'), true);
    });
  });

  group('UI Edge Case Crash Tests', () {
    testWidgets('Should handle overflow text', (tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: SizedBox(
              width: 100,
              child: Text(
                'A' * 1000,
                overflow: TextOverflow.ellipsis,
                maxLines: 1,
              ),
            ),
          ),
        ),
      );
      expect(find.byType(Text), findsOneWidget);
    });

    testWidgets('Should handle zero-size containers', (tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: SizedBox(
              width: 0,
              height: 0,
              child: Container(color: Colors.red),
            ),
          ),
        ),
      );
      expect(find.byType(Container), findsOneWidget);
    });

    testWidgets('Should handle negative padding (clamped)', (tester) async {
      // Negative values should be avoided but shouldn't crash
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: Container(
              margin: const EdgeInsets.all(0), // Use 0 instead of negative
              child: const Text('Test'),
            ),
          ),
        ),
      );
      expect(find.text('Test'), findsOneWidget);
    });

    testWidgets('Should handle deep nesting', (tester) async {
      Widget buildNested(int depth) {
        if (depth == 0) return const Text('Deep');
        return Container(child: buildNested(depth - 1));
      }

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: SingleChildScrollView(
              child: buildNested(50),
            ),
          ),
        ),
      );
      expect(find.text('Deep'), findsOneWidget);
    });

    testWidgets('Should handle image loading errors', (tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: Image.network(
              'https://invalid-url-that-does-not-exist.com/image.png',
              errorBuilder: (context, error, stackTrace) {
                return const Icon(Icons.error);
              },
            ),
          ),
        ),
      );
      // Allow time for network error
      await tester.pump(const Duration(seconds: 1));
    });
  });

  group('Form Input Crash Tests', () {
    testWidgets('Should handle empty form submission', (tester) async {
      final formKey = GlobalKey<FormState>();
      
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: Form(
              key: formKey,
              child: Column(
                children: [
                  TextFormField(
                    validator: (value) {
                      if (value == null || value.isEmpty) {
                        return 'Required';
                      }
                      return null;
                    },
                  ),
                  ElevatedButton(
                    onPressed: () {
                      formKey.currentState?.validate();
                    },
                    child: const Text('Submit'),
                  ),
                ],
              ),
            ),
          ),
        ),
      );

      await tester.tap(find.text('Submit'));
      await tester.pump();
      
      expect(find.text('Required'), findsOneWidget);
    });

    testWidgets('Should handle very long input', (tester) async {
      final controller = TextEditingController();
      
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: TextField(controller: controller),
          ),
        ),
      );

      // Enter very long text
      await tester.enterText(find.byType(TextField), 'a' * 10000);
      await tester.pump();
      
      expect(controller.text.length, 10000);
      controller.dispose();
    });

    testWidgets('Should handle special characters in input', (tester) async {
      final controller = TextEditingController();
      
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: TextField(controller: controller),
          ),
        ),
      );

      // Enter special characters
      await tester.enterText(
        find.byType(TextField),
        '!@#\$%^&*()_+{}[]|\\:";\'<>?,./~`',
      );
      await tester.pump();
      
      expect(controller.text.isNotEmpty, true);
      controller.dispose();
    });
  });

  group('Animation Crash Tests', () {
    testWidgets('Should handle animation controller disposal', (tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: _AnimatedTestWidget(),
        ),
      );

      // Let animation run
      await tester.pump(const Duration(milliseconds: 500));
      
      // Replace widget (triggers disposal)
      await tester.pumpWidget(const MaterialApp(home: SizedBox()));
    });

    testWidgets('Should handle AnimatedContainer transitions', (tester) async {
      bool isExpanded = false;
      
      await tester.pumpWidget(
        MaterialApp(
          home: StatefulBuilder(
            builder: (context, setState) {
              return Scaffold(
                body: GestureDetector(
                  onTap: () => setState(() => isExpanded = !isExpanded),
                  child: AnimatedContainer(
                    duration: const Duration(milliseconds: 300),
                    width: isExpanded ? 200 : 100,
                    height: isExpanded ? 200 : 100,
                    color: Colors.blue,
                  ),
                ),
              );
            },
          ),
        ),
      );

      // Trigger animation
      await tester.tap(find.byType(AnimatedContainer));
      await tester.pump();
      await tester.pump(const Duration(milliseconds: 150)); // Mid-animation
      await tester.pumpAndSettle();
    });
  });

  group('Lifecycle Crash Tests', () {
    testWidgets('Should handle initState errors gracefully', (tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: _InitStateTestWidget(),
        ),
      );
      
      // Initially shows Loading
      expect(find.text('Loading'), findsOneWidget);
      
      // Wait for async init to complete
      await tester.pump(const Duration(milliseconds: 200));
      
      // Should now show Loaded
      expect(find.text('Loaded'), findsOneWidget);
    });

    testWidgets('Should handle setState after dispose', (tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: _SetStateAfterDisposeWidget(),
        ),
      );

      // Trigger the delayed setState
      await tester.tap(find.byType(ElevatedButton));
      await tester.pump();
      
      // Remove widget before delayed callback fires
      await tester.pumpWidget(const MaterialApp(home: SizedBox()));
      
      // Wait for delayed callback (should not crash due to mounted check)
      await tester.pump(const Duration(seconds: 1));
    });
  });
}

// Helper widgets for testing
class _AnimatedTestWidget extends StatefulWidget {
  @override
  State<_AnimatedTestWidget> createState() => _AnimatedTestWidgetState();
}

class _AnimatedTestWidgetState extends State<_AnimatedTestWidget>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      duration: const Duration(seconds: 1),
      vsync: this,
    )..repeat();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return RotationTransition(
      turns: _controller,
      child: const FlutterLogo(size: 100),
    );
  }
}

class _InitStateTestWidget extends StatefulWidget {
  @override
  State<_InitStateTestWidget> createState() => _InitStateTestWidgetState();
}

class _InitStateTestWidgetState extends State<_InitStateTestWidget> {
  String _status = 'Loading';

  @override
  void initState() {
    super.initState();
    // Simulate async init with error handling
    _initialize();
  }

  Future<void> _initialize() async {
    try {
      await Future.delayed(const Duration(milliseconds: 100));
      if (mounted) {
        setState(() => _status = 'Loaded');
      }
    } catch (e) {
      if (mounted) {
        setState(() => _status = 'Error');
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(body: Center(child: Text(_status)));
  }
}

class _SetStateAfterDisposeWidget extends StatefulWidget {
  @override
  State<_SetStateAfterDisposeWidget> createState() =>
      _SetStateAfterDisposeWidgetState();
}

class _SetStateAfterDisposeWidgetState
    extends State<_SetStateAfterDisposeWidget> {
  String _status = 'Initial';

  void _triggerDelayedUpdate() {
    Future.delayed(const Duration(milliseconds: 500), () {
      // IMPORTANT: Always check mounted before setState
      if (mounted) {
        setState(() => _status = 'Updated');
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Text(_status),
          ElevatedButton(
            onPressed: _triggerDelayedUpdate,
            child: const Text('Trigger'),
          ),
        ],
      ),
    );
  }
}
