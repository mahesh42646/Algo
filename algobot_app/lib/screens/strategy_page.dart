import 'package:flutter/material.dart';
import '../widgets/notification_bell.dart';

class StrategyPage extends StatelessWidget {
  const StrategyPage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Strategy'),
        actions: [
          const NotificationBell(),
        ],
      ),
      body: const Center(
        child: Text(
          'Strategy Page',
          style: TextStyle(fontSize: 24),
        ),
      ),
    );
  }
}
