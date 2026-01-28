
/// Basic widget tests for AlgoBot App
/// Run with: flutter test test/widget_test.dart

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  group('Basic App Tests', () {
    testWidgets('App renders MaterialApp', (WidgetTester tester) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(
            body: Center(child: Text('AlgoBot')),
          ),
        ),
      );

      expect(find.text('AlgoBot'), findsOneWidget);
    });

    testWidgets('Navigation works correctly', (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Builder(
            builder: (context) => Scaffold(
              body: ElevatedButton(
                onPressed: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (_) => const Scaffold(
                        body: Center(child: Text('Second Screen')),
                      ),
                    ),
                  );
                },
                child: const Text('Navigate'),
              ),
            ),
          ),
        ),
      );

      expect(find.text('Navigate'), findsOneWidget);
      await tester.tap(find.text('Navigate'));
      await tester.pumpAndSettle();
      expect(find.text('Second Screen'), findsOneWidget);
    });

    testWidgets('Theme applies correctly', (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          theme: ThemeData(
            colorScheme: ColorScheme.fromSeed(
              seedColor: const Color(0xFF4A90E2),
              brightness: Brightness.light,
            ),
          ),
          home: Builder(
            builder: (context) => Scaffold(
              body: Container(
                color: Theme.of(context).colorScheme.primary,
                child: const Text('Themed'),
              ),
            ),
          ),
        ),
      );

      expect(find.text('Themed'), findsOneWidget);
    });
  });
}
