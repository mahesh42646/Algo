import 'package:flutter/material.dart';
import '../widgets/notification_bell.dart';

class CirclePage extends StatelessWidget {
  const CirclePage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Circle'),
        actions: [
          const NotificationBell(),
        ],
      ),
      body: const Center(
        child: Text(
          'Circle Page',
          style: TextStyle(fontSize: 24),
        ),
      ),
    );
  }
}
