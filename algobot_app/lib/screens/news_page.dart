import 'package:flutter/material.dart';
import '../widgets/notification_bell.dart';

class NewsPage extends StatelessWidget {
  const NewsPage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('News'),
        actions: [
          const NotificationBell(),
        ],
      ),
      body: const Center(
        child: Text(
          'News Page',
          style: TextStyle(fontSize: 24),
        ),
      ),
    );
  }
}
