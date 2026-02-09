import 'package:flutter/material.dart';
import '../models/crypto_coin.dart';
import '../services/algo_trading_service.dart';
import '../services/permission_location_service.dart';
import 'algo_trading_config_screen.dart';

/// Shows full strategy details and options: Select coin or Smart algo (admin only).
class StrategyDetailScreen extends StatelessWidget {
  const StrategyDetailScreen({
    super.key,
    required this.strategy,
    required this.isAdmin,
    required this.isPopular,
  });

  final Map<String, dynamic> strategy;
  final bool isAdmin;
  final bool isPopular;

  Map<String, dynamic> get _settings => {
        'maxLossPerTrade': strategy['maxLossPerTrade'] ?? 3.0,
        'maxLossOverall': strategy['maxLossOverall'] ?? 3.0,
        'maxProfitBook': strategy['maxProfitBook'] ?? 3.0,
        'amountPerLevel': strategy['amountPerLevel'] ?? 10.0,
        'numberOfLevels': strategy['numberOfLevels'] ?? 10,
        'useMargin': strategy['useMargin'] ?? false,
        'leverage': strategy['leverage'] ?? 1,
      };

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Scaffold(
      appBar: AppBar(
        title: Text(strategy['name'] ?? 'Strategy'),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      strategy['description'] ?? '',
                      style: theme.textTheme.bodyLarge?.copyWith(
                        color: theme.colorScheme.onSurfaceVariant,
                      ),
                    ),
                    const SizedBox(height: 16),
                    Wrap(
                      spacing: 16,
                      runSpacing: 12,
                      children: [
                        _paramChip('Max loss/trade', '${strategy['maxLossPerTrade'] ?? 3}%'),
                        _paramChip('Max loss overall', '${strategy['maxLossOverall'] ?? 3}%'),
                        _paramChip('Profit target', '${strategy['maxProfitBook'] ?? 3}%'),
                        _paramChip('Amount/level', '\$${strategy['amountPerLevel'] ?? 10}'),
                        _paramChip('Levels', '${strategy['numberOfLevels'] ?? 10}'),
                      ],
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 24),
            ListTile(
              leading: const Icon(Icons.search),
              title: const Text('Select coin pair'),
              subtitle: const Text('Choose a coin to apply this strategy'),
              onTap: () => _openCoinSelection(context),
            ),
            if (isAdmin) ...[
              const Divider(),
              ListTile(
                leading: const Icon(Icons.auto_awesome),
                title: const Text('Smart algo selection (default)'),
                subtitle: const Text('Let the system pick a pair with strong signal'),
                onTap: () => _startAdminStrategy(context),
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _paramChip(String label, String value) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: TextStyle(
            fontSize: 12,
            color: Colors.grey[600],
          ),
        ),
        Text(
          value,
          style: const TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.w600,
          ),
        ),
      ],
    );
  }

  void _openCoinSelection(BuildContext context) {
    _showSymbolDialog(context);
  }

  void _showSymbolDialog(BuildContext context) {
    final symbolController = TextEditingController();
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Apply strategy'),
        content: TextField(
          controller: symbolController,
          decoration: const InputDecoration(
            labelText: 'Coin symbol',
            hintText: 'e.g. BTC, ETH',
          ),
          textCapitalization: TextCapitalization.characters,
          onSubmitted: (v) {
            if (v.trim().isNotEmpty) {
              Navigator.pop(ctx);
              _applyToSymbol(context, v.trim().toUpperCase());
            }
          },
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Cancel'),
          ),
          FilledButton(
            onPressed: () {
              final s = symbolController.text.trim().toUpperCase();
              if (s.isNotEmpty) {
                Navigator.pop(ctx);
                _applyToSymbol(context, s);
              }
            },
            child: const Text('Apply'),
          ),
        ],
      ),
    );
  }

  void _applyToSymbol(BuildContext context, String baseSymbol) {
    final coin = CryptoCoin(
      id: baseSymbol.toLowerCase(),
      symbol: baseSymbol,
      name: baseSymbol,
      currentPrice: 0.0,
      priceChange24h: 0.0,
      priceChangePercentage24h: 0.0,
      volume24h: 0.0,
    );
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (_) => AlgoTradingConfigScreen(
          coin: coin,
          quoteCurrency: 'USDT',
          strategySettings: _settings,
        ),
      ),
    );
  }

  Future<void> _startAdminStrategy(BuildContext context) async {
    try {
      final startLocation = await PermissionLocationService.getCurrentLocation();
      await AlgoTradingService().startAdminStrategy(startLocation: startLocation);
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Admin strategy started'),
            backgroundColor: Colors.green,
          ),
        );
        Navigator.of(context).pop();
      }
    } catch (e) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error: ${e.toString()}'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }
}
