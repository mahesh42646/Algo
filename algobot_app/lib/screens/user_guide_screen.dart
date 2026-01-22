import 'package:flutter/material.dart';

class UserGuideScreen extends StatelessWidget {
  const UserGuideScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('User Guide'),
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          _buildGuideSection(
            context,
            icon: Icons.link,
            title: 'How to Add Exchange API',
            color: Colors.blue,
            steps: [
              'Go to Home → API Binding',
              'Select your exchange platform (e.g., Binance)',
              'Enter your API Key and Secret Key',
              'Enable required permissions: "Enable Reading" and "Enable Spot & Margin Trading"',
              'If using IP restrictions, add the server IP shown in the error message',
              'Click "Verify Connection" to test your API',
              'Wait 2-5 minutes after adding IP to Binance whitelist',
              'Once verified, your API is ready to use',
            ],
          ),
          const SizedBox(height: 24),
          _buildGuideSection(
            context,
            icon: Icons.auto_awesome,
            title: 'How to Trade with Algo Trading',
            color: Colors.orange,
            steps: [
              'Navigate to any coin detail page',
              'Click "Start Trading" button at the bottom',
              'Select "Algo Trading" option',
              'Select your exchange API from the dropdown',
              'Configure your trading parameters:',
              '  • Max Loss Per Trade: e.g., 3%',
              '  • Max Loss Overall: e.g., 3%',
              '  • Max Profit Book: e.g., 3%',
              '  • Amount Per Level: e.g., \$10',
              '  • Number of Levels: e.g., 10',
              'Enable Margin Trading if you want margin trading (requires margin permissions)',
              'Ensure you have:',
              '  • Sufficient exchange balance for all levels',
              '  • 3% of total trade amount in platform wallet',
              'Review all details in the confirmation dialog',
              'Accept terms and conditions',
              'Click "Confirm & Start"',
              'The algorithm will wait for a strong signal before starting',
              'Once started, it will automatically manage your trades',
            ],
          ),
          const SizedBox(height: 24),
          _buildGuideSection(
            context,
            icon: Icons.stop_circle,
            title: 'How to Stop Trade Anytime',
            color: Colors.red,
            steps: [
              'Go to Strategy page',
              'Find your active algo trade',
              'Tap on the trade to view details',
              'Click "Stop Trade" button',
              'Confirm the stop action',
              'Your trade will be stopped immediately',
              'All positions will be closed',
              'You will receive a notification about the stop',
            ],
          ),
          const SizedBox(height: 24),
          _buildGuideSection(
            context,
            icon: Icons.person,
            title: 'How to Update Profile Details',
            color: Colors.green,
            steps: [
              'Go to Mine/Profile page',
              'Tap on your profile section',
              'You can update:',
              '  • Nickname',
              '  • Avatar (profile picture)',
              '  • Location (Country, City)',
              '  • Language preference',
              'Tap "Save" to apply changes',
            ],
          ),
          const SizedBox(height: 24),
          _buildGuideSection(
            context,
            icon: Icons.palette,
            title: 'How to Change Theme and Settings',
            color: Colors.purple,
            steps: [
              'Go to Mine/Profile page',
              'Tap on Settings icon or Settings option',
              'In Theme section:',
              '  • Select "Light" for light theme',
              '  • Select "Dark" for dark theme',
              '  • Select "System" to follow device theme',
              'In Language section:',
              '  • Choose your preferred language',
              '  • Changes apply immediately',
              'Other settings:',
              '  • Notification preferences',
              '  • Privacy settings',
              '  • App preferences',
              'Changes are saved automatically',
            ],
          ),
          const SizedBox(height: 24),
          _buildInfoBox(context),
        ],
      ),
    );
  }

  Widget _buildGuideSection(
    BuildContext context, {
    required IconData icon,
    required String title,
    required Color color,
    required List<String> steps,
  }) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Theme.of(context).cardColor,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: color.withOpacity(0.3),
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 10,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: color.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Icon(icon, color: color, size: 24),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Text(
                  title,
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                    color: color,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          ...steps.asMap().entries.map((entry) {
            return Padding(
              padding: const EdgeInsets.only(bottom: 8),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    width: 24,
                    height: 24,
                    margin: const EdgeInsets.only(right: 12, top: 2),
                    decoration: BoxDecoration(
                      color: color.withOpacity(0.2),
                      shape: BoxShape.circle,
                    ),
                    child: Center(
                      child: Text(
                        '${entry.key + 1}',
                        style: TextStyle(
                          color: color,
                          fontSize: 12,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ),
                  Expanded(
                    child: Text(
                      entry.value,
                      style: TextStyle(
                        fontSize: 14,
                        color: Colors.grey[700],
                        height: 1.5,
                      ),
                    ),
                  ),
                ],
              ),
            );
          }).toList(),
        ],
      ),
    );
  }

  Widget _buildInfoBox(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.blue.withOpacity(0.1),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.blue.withOpacity(0.3)),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Icon(Icons.info_outline, color: Colors.blue),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Need More Help?',
                  style: TextStyle(
                    fontWeight: FontWeight.bold,
                    fontSize: 16,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  'If you encounter any issues or have questions, please contact our support team through the app or visit our help center.',
                  style: TextStyle(
                    fontSize: 14,
                    color: Colors.grey[700],
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
