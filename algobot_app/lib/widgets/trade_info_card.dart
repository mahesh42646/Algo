import 'package:flutter/material.dart';

class TradeInfoCard extends StatelessWidget {
  final String currentPrice;
  final int currentLevel;
  final int totalLevels;
  final double targetPercent;
  final String targetPrice;
  final String totalBalance;
  final double profitLoss;
  final double profitLossPercent;
  final String? binanceBalance;
  final Map<String, dynamic>? positionDetails;
  final bool isMargin;
  final int? leverage;

  const TradeInfoCard({
    super.key,
    required this.currentPrice,
    required this.currentLevel,
    required this.totalLevels,
    required this.targetPercent,
    required this.targetPrice,
    required this.totalBalance,
    required this.profitLoss,
    required this.profitLossPercent,
    this.binanceBalance,
    this.positionDetails,
    this.isMargin = false,
    this.leverage,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    final profitColor = profitLoss >= 0 ? Colors.green : Colors.red;
    
    return Container(
      margin: const EdgeInsets.all(16),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: theme.cardColor,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: isDark ? Colors.grey[800]! : Colors.grey[300]!,
          width: 1,
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
          // Header
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Trade Information',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                  color: theme.colorScheme.primary,
                ),
              ),
              if (isMargin && leverage != null)
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: Colors.orange.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(
                    '${leverage}x Margin',
                    style: const TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.bold,
                      color: Colors.orange,
                    ),
                  ),
                ),
            ],
          ),
          const SizedBox(height: 16),
          
          // Current Price & Level
          Row(
            children: [
              Expanded(
                child: _buildInfoItem(
                  context,
                  'Current Price',
                  currentPrice,
                  Icons.attach_money,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _buildInfoItem(
                  context,
                  'Level',
                  '$currentLevel / $totalLevels',
                  Icons.layers,
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          
          // Target % & Target Price
          Row(
            children: [
              Expanded(
                child: _buildInfoItem(
                  context,
                  'Target %',
                  '${targetPercent.toStringAsFixed(2)}%',
                  Icons.track_changes,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _buildInfoItem(
                  context,
                  'Target Price',
                  targetPrice,
                  Icons.price_change,
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          
          // Total Balance & Profit/Loss
          Row(
            children: [
              Expanded(
                child: _buildInfoItem(
                  context,
                  'Total Balance',
                  totalBalance,
                  Icons.account_balance_wallet,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: profitColor.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(
                      color: profitColor.withOpacity(0.3),
                      width: 1,
                    ),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Icon(
                            profitLoss >= 0 ? Icons.trending_up : Icons.trending_down,
                            size: 16,
                            color: profitColor,
                          ),
                          const SizedBox(width: 4),
                          Text(
                            'P&L',
                            style: TextStyle(
                              fontSize: 12,
                              color: Colors.grey[600],
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 4),
                      Text(
                        '${profitLoss >= 0 ? '+' : ''}${profitLoss.toStringAsFixed(2)}',
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                          color: profitColor,
                        ),
                      ),
                      Text(
                        '${profitLossPercent >= 0 ? '+' : ''}${profitLossPercent.toStringAsFixed(2)}%',
                        style: TextStyle(
                          fontSize: 12,
                          color: profitColor.withOpacity(0.8),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
          
          // Binance Balance
          if (binanceBalance != null) ...[
            const SizedBox(height: 16),
            const Divider(),
            const SizedBox(height: 8),
            _buildInfoItem(
              context,
              'Binance Balance',
              binanceBalance!,
              Icons.account_balance,
            ),
          ],
          
          // Position Details
          if (positionDetails != null && positionDetails!.isNotEmpty) ...[
            const SizedBox(height: 16),
            const Divider(),
            const SizedBox(height: 8),
            Text(
              'Position Details',
              style: TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.bold,
                color: Colors.grey[600],
              ),
            ),
            const SizedBox(height: 8),
            ...positionDetails!.entries.map((entry) => Padding(
              padding: const EdgeInsets.symmetric(vertical: 4),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    entry.key,
                    style: TextStyle(
                      fontSize: 12,
                      color: Colors.grey[600],
                    ),
                  ),
                  Text(
                    entry.value.toString(),
                    style: const TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ],
              ),
            )),
          ],
        ],
      ),
    );
  }

  Widget _buildInfoItem(BuildContext context, String label, String value, IconData icon) {
    final theme = Theme.of(context);
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: theme.brightness == Brightness.dark
            ? Colors.grey[900]
            : Colors.grey[100],
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(icon, size: 14, color: Colors.grey[600]),
              const SizedBox(width: 4),
              Text(
                label,
                style: TextStyle(
                  fontSize: 12,
                  color: Colors.grey[600],
                ),
              ),
            ],
          ),
          const SizedBox(height: 6),
          Text(
            value,
            style: const TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.bold,
            ),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
        ],
      ),
    );
  }
}
