import 'dart:math' as math;
import 'package:flutter/material.dart';
import '../config/env.dart';
import '../models/crypto_coin.dart';
import '../models/candlestick.dart';
import '../services/chart_service.dart';
import '../services/technical_indicators.dart';
import '../services/exchange_service.dart';
import '../widgets/notification_bell.dart';
import '../widgets/tradingview_chart.dart';
import 'algo_trading_config_screen.dart';

class CoinDetailScreen extends StatefulWidget {
  final CryptoCoin coin;
  final String quoteCurrency;

  const CoinDetailScreen({
    super.key,
    required this.coin,
    required this.quoteCurrency,
  });

  @override
  State<CoinDetailScreen> createState() => _CoinDetailScreenState();
}

class _CoinDetailScreenState extends State<CoinDetailScreen> {
  final ChartService _chartService = ChartService();
  Map<String, int> _sentiment = {'buy': 0, 'sell': 0, 'neutral': 0};
  Map<String, dynamic> _stats24h = {};
  String _selectedInterval = '5';
  bool _isFullScreen = false;
  String _selectedTab = 'Market';
  String _selectedTableTab = 'Moving Average';
  Map<int, Map<String, double>> _maValues = {}; // Store calculated MA values
  bool _isLoadingMA = false;
  final Map<String, String> _intervalMap = {
    '1m': '1',
    '3m': '3',
    '5m': '5',
    '15m': '15',
    '30m': '30',
    '1h': '60',
    '4h': '240',
    '1d': 'D',
  };
  final Map<String, String> _binanceIntervalMap = {
    '1m': '1m',
    '3m': '3m',
    '5m': '5m',
    '15m': '15m',
    '30m': '30m',
    '1h': '1h',
    '4h': '4h',
    '1d': '1d',
  };
  final List<String> _intervals = ['1m', '3m', '5m', '15m', '30m', '1h', '4h', '1d'];

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    try {
      final symbol = '${widget.coin.symbol}${widget.quoteCurrency}';
      
      // Load 24h stats
      final stats = await _chartService.get24hStats(symbol);
      
      // Load and calculate MA data
      await _loadMAData(symbol);

      setState(() {
        _stats24h = stats;
      });
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error loading data: $e')),
        );
      }
    }
  }

  Future<void> _loadMAData(String symbol) async {
    setState(() {
      _isLoadingMA = true;
    });

    try {
      // Get current interval for Binance API
      final binanceInterval = _binanceIntervalMap[_intervals.firstWhere(
        (i) => _intervalMap[i] == _selectedInterval,
        orElse: () => '5m',
      )] ?? '5m';

      // Fetch candlestick data (need enough data for MA(200))
      final candles = await _chartService.getCandlesticks(
        symbol: symbol,
        interval: binanceInterval,
        limit: 500, // Get enough data for all MAs
      );

      if (candles.isEmpty) {
        setState(() {
          _isLoadingMA = false;
        });
        return;
      }

      // Calculate MA values for all periods
      final periods = [5, 10, 20, 30, 50, 100, 200];
      final maValues = TechnicalIndicators.calculateAllMAs(candles, periods);

      // Calculate sentiment from MA signals
      final currentPrice = widget.coin.currentPrice;
      final sentiment = TechnicalIndicators.calculateSentiment(currentPrice, maValues);

      setState(() {
        _maValues = maValues;
        _sentiment = sentiment;
        _isLoadingMA = false;
      });
    } catch (e) {
      if (Env.enableApiLogs) {
        print('Error loading MA data: $e');
      }
      setState(() {
        _isLoadingMA = false;
      });
    }
  }

  void _onIntervalChanged(String interval) {
    setState(() {
      _selectedInterval = _intervalMap[interval] ?? '5';
    });
    // Reload MA data when interval changes
    final symbol = '${widget.coin.symbol}${widget.quoteCurrency}';
    _loadMAData(symbol);
  }


  @override
  Widget build(BuildContext context) {
    if (_isFullScreen) {
      return _buildFullScreenView();
    }

    return Scaffold(
      appBar: AppBar(
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => Navigator.of(context).pop(),
        ),
        title: Text('${widget.coin.symbol} / ${widget.quoteCurrency}'),
        actions: [
          IconButton(
            icon: const Icon(Icons.fullscreen),
            onPressed: () {
              setState(() {
                _isFullScreen = true;
              });
            },
            tooltip: 'Full Screen',
          ),
          const NotificationBell(),
        ],
      ),
      body: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _buildTabSelector(),
            _buildPriceSection(),
            _build24hStats(),
            // _buildIntervalSelector(),
            _buildTradingViewChart(),
            _buildTechnicalIndicatorSection(),
            const SizedBox(height: 80),
          ],
        ),
      ),
      bottomNavigationBar: Container(
        padding: const EdgeInsets.all(16),
        child: ElevatedButton(
          onPressed: () => _showTradingModeDialog(context),
          style: ElevatedButton.styleFrom(
            backgroundColor: Theme.of(context).colorScheme.primary,
            padding: const EdgeInsets.symmetric(vertical: 16),
          ),
          child: const Text(
            'Start Trading',
            style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
          ),
        ),
      ),
    );
  }

  Widget _buildFullScreenView() {
    final screenHeight = MediaQuery.of(context).size.height;
    final screenWidth = MediaQuery.of(context).size.width;
    final topPadding = MediaQuery.of(context).padding.top;
    
    return Scaffold(
      backgroundColor: Colors.black,
      body: Stack(
        children: [
          // Full screen chart with padding for notch
          Padding(
            padding: EdgeInsets.only(top: topPadding + 8),
            child: SizedBox(
              width: screenWidth,
              height: screenHeight - topPadding - 8,
              child: _buildFullScreenChart(),
            ),
          ),
          // Floating minimize button
          Positioned(
            top: topPadding + 16,
            right: 16,
            child: FloatingActionButton(
              mini: true,
              backgroundColor: Colors.black54,
              onPressed: () {
                setState(() {
                  _isFullScreen = false;
                });
              },
              child: const Icon(Icons.fullscreen_exit, color: Colors.white),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildFullScreenChart() {
    // Convert symbol to TradingView format (e.g., BTCUSDT -> BINANCE:BTCUSDT)
    final tradingViewSymbol = 'BINANCE:${widget.coin.symbol}${widget.quoteCurrency}';
    
    return TradingViewChart(
      symbol: tradingViewSymbol,
      interval: _selectedInterval,
      theme: Theme.of(context).brightness == Brightness.dark ? 'dark' : 'light',
    );
  }

  Widget _buildTabSelector() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: Row(
        children: [
          _buildTabButton('Market', true),
          const SizedBox(width: 8),
          _buildTabButton('Bots', false),
        ],
      ),
    );
  }

  Widget _buildTabButton(String label, bool isSelected) {
    return Expanded(
      child: GestureDetector(
        onTap: () {
          setState(() {
            _selectedTab = label;
          });
        },
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 12),
          decoration: BoxDecoration(
            color: isSelected 
                ? Theme.of(context).colorScheme.primary 
                : Colors.grey[200],
            borderRadius: BorderRadius.circular(8),
          ),
          child: Text(
            label,
            textAlign: TextAlign.center,
            style: TextStyle(
              color: isSelected ? Colors.white : Colors.grey[700],
              fontWeight: isSelected ? FontWeight.w600 : FontWeight.normal,
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildPriceSection() {
    final isPositive = widget.coin.priceChangePercentage24h >= 0;
    return Padding(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            widget.coin.currentPrice.toStringAsFixed(4),
            style: TextStyle(
              fontSize: 32,
              fontWeight: FontWeight.bold,
              color: isPositive ? Colors.green : Colors.red,
            ),
          ),
          const SizedBox(height: 4),
          Row(
            children: [
              Text(
                '~ \$${widget.coin.currentPrice.toStringAsFixed(2)}',
                style: TextStyle(color: Colors.grey[600]),
              ),
              const SizedBox(width: 8),
              Text(
                '${isPositive ? '+' : ''}${widget.coin.priceChangePercentage24h.toStringAsFixed(2)}%',
                style: TextStyle(
                  color: isPositive ? Colors.green : Colors.red,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _build24hStats() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceAround,
        children: [
          _buildStatItem('24h High', _stats24h['highPrice']?.toStringAsFixed(4) ?? '0'),
          _buildStatItem('24h Low', _stats24h['lowPrice']?.toStringAsFixed(4) ?? '0'),
          _buildStatItem('24H Volume', _formatVolume(_stats24h['volume'] ?? 0.0)),
          _buildStatItem('24H Turnover', _formatVolume(_stats24h['quoteVolume'] ?? 0.0)),
        ],
      ),
    );
  }

  Widget _buildStatItem(String label, String value) {
    return Column(
      children: [
        Text(
          value,
          style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 12),
        ),
        Text(
          label,
          style: TextStyle(fontSize: 10, color: Colors.grey[600]),
        ),
      ],
    );
  }

  String _formatVolume(double volume) {
    if (volume >= 1000000) {
      return '${(volume / 1000000).toStringAsFixed(1)}M';
    } else if (volume >= 1000) {
      return '${(volume / 1000).toStringAsFixed(1)}K';
    }
    return volume.toStringAsFixed(0);
  }

  // Widget _buildIntervalSelector() {
  //   return Padding(
  //     padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
  //     child: Row(
  //       children: [
  //         _buildIntervalButton('Line'),
  //         ..._intervals.take(6).map((interval) => _buildIntervalButton(interval)),
  //         PopupMenuButton<String>(
  //           child: Container(
  //             padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
  //             child: const Text('More ▾'),
  //           ),
  //           onSelected: (value) {
  //             if (_intervalMap.containsKey(value)) {
  //               setState(() {
  //                 _selectedInterval = _intervalMap[value]!;
  //               });
  //             }
  //           },
  //           itemBuilder: (_) => _intervals.skip(6).map((interval) {
  //             return PopupMenuItem(
  //               value: interval,
  //               child: Text(interval),
  //             );
  //           }).toList(),
  //         ),
  //       ],
  //     ),
  //   );
  // }

  // Widget _buildIntervalButton(String label) {
  //   final isSelected = _selectedInterval == _intervalMap[label] || 
  //                      (label == '5m' && _selectedInterval == '5');
  //   return GestureDetector(
  //     onTap: () {
  //       if (label != 'Line' && label != 'More ▾' && _intervalMap.containsKey(label)) {
  //         setState(() {
  //           _selectedInterval = _intervalMap[label]!;
  //         });
  //       }
  //     },
  //     child: Container(
  //       margin: const EdgeInsets.only(right: 8),
  //       padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
  //       decoration: BoxDecoration(
  //         color: isSelected ? Theme.of(context).colorScheme.primary : Colors.transparent,
  //         borderRadius: BorderRadius.circular(8),
  //       ),
  //       child: Text(
  //         label,
  //         style: TextStyle(
  //           color: isSelected ? Colors.white : Colors.grey[700],
  //           fontWeight: isSelected ? FontWeight.w600 : FontWeight.normal,
  //         ),
  //       ),
  //     ),
  //   );
  // }

  Widget _buildTradingViewChart() {
    // Convert symbol to TradingView format (e.g., BTCUSDT -> BINANCE:BTCUSDT)
    final tradingViewSymbol = 'BINANCE:${widget.coin.symbol}${widget.quoteCurrency}';
    
    return SizedBox(
      height: MediaQuery.of(context).size.height * 0.5,
      child: TradingViewChart(
        symbol: tradingViewSymbol,
        interval: _selectedInterval,
        theme: Theme.of(context).brightness == Brightness.dark ? 'dark' : 'light',
      ),
    );
  }

  Widget _buildTechnicalIndicatorSection() {
    return Padding(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _buildTechnicalIndicatorHeader(),
          const SizedBox(height: 16),
          _buildSentimentGauge(),
          const SizedBox(height: 16),
          _buildSummaryBoxes(),
          const SizedBox(height: 16),
          _buildIndicatorSummary(),
          const SizedBox(height: 16),
          _buildMATable(),
        ],
      ),
    );
  }

  Widget _buildTechnicalIndicatorHeader() {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Row(
          children: [
            Icon(Icons.settings, color: Colors.grey[600]),
            const SizedBox(width: 8),
            const Text(
              '🛠️ Technical Indicator',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
          ],
        ),
        DropdownButton<String>(
          value: _intervals.firstWhere((i) => _intervalMap[i] == _selectedInterval, orElse: () => '5m'),
          items: _intervals.map((interval) {
            return DropdownMenuItem(value: interval, child: Text(interval));
          }).toList(),
          onChanged: (value) {
            if (value != null && _intervalMap.containsKey(value)) {
              _onIntervalChanged(value);
            }
          },
        ),
      ],
    );
  }

  Widget _buildSentimentGauge() {
    final total = _sentiment['buy']! + _sentiment['sell']! + _sentiment['neutral']!;
    final buyRatio = total > 0 ? _sentiment['buy']! / total : 0.0;
    final sellRatio = total > 0 ? _sentiment['sell']! / total : 0.0;
    final neutralRatio = total > 0 ? _sentiment['neutral']! / total : 0.0;
    
    String sentiment = 'Neutral';
    Color sentimentColor = Colors.grey;
    double needleAngle = 0.0; // 0 = center (Neutral), -1 = left (Sell), 1 = right (Buy)
    
    if (buyRatio > sellRatio && buyRatio > neutralRatio) {
      sentiment = buyRatio > 0.6 ? 'Strong Buy' : 'Buy';
      sentimentColor = Colors.blue;
      needleAngle = buyRatio * 0.5; // Point towards buy side
    } else if (sellRatio > buyRatio && sellRatio > neutralRatio) {
      sentiment = sellRatio > 0.6 ? 'Strong Sell' : 'Sell';
      sentimentColor = Colors.red;
      needleAngle = -sellRatio * 0.5; // Point towards sell side
    } else {
      sentiment = 'Neutral';
      sentimentColor = Colors.grey;
      needleAngle = 0.0;
    }

    return Column(
      children: [
        SizedBox(
          height: 120,
          child: Stack(
            alignment: Alignment.center,
            children: [
              CustomPaint(
                size: const Size(300, 120),
                painter: SentimentGaugePainter(
                  buyRatio: buyRatio,
                  sellRatio: sellRatio,
                  neutralRatio: neutralRatio,
                  sentiment: sentiment,
                  needleAngle: needleAngle,
                ),
              ),
              Positioned(
                bottom: 20,
                child: Text(
                  sentiment,
                  style: TextStyle(
                    fontSize: 28,
                    fontWeight: FontWeight.bold,
                    color: sentimentColor,
                  ),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildSummaryBoxes() {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceAround,
      children: [
        _buildSummaryBox('Sell', _sentiment['sell']!, Colors.red),
        _buildSummaryBox('Neutral', _sentiment['neutral']!, Colors.grey),
        _buildSummaryBox('Buy', _sentiment['buy']!, Colors.blue),
      ],
    );
  }

  Widget _buildSummaryBox(String label, int value, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: color.withValues(alpha: 0.3)),
      ),
      child: Column(
        children: [
          Text(
            label,
            style: TextStyle(color: color, fontWeight: FontWeight.w600),
          ),
          const SizedBox(height: 4),
          Text(
            '$value',
            style: TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.bold,
              color: color,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildIndicatorSummary() {
    final maBuy = _sentiment['buy']!;
    final maSell = _sentiment['sell']!;
    final maNeutral = _sentiment['neutral']!;
    
    String maSentiment = 'Neutral';
    Color maColor = Colors.orange;
    if (maBuy > maSell) {
      maSentiment = 'Buy';
      maColor = Colors.blue;
    } else if (maSell > maBuy) {
      maSentiment = 'Sell';
      maColor = Colors.red;
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Row(
              children: [
                const Text('Moving Average: '),
                Text(
                  maSentiment,
                  style: TextStyle(color: maColor, fontWeight: FontWeight.bold),
                ),
              ],
            ),
            Row(
              children: [
                Text(
                  'Sell$maSell',
                  style: const TextStyle(color: Colors.red, fontSize: 12),
                ),
                const SizedBox(width: 8),
                Text(
                  'Neutral$maNeutral',
                  style: TextStyle(color: Colors.grey[600], fontSize: 12),
                ),
                const SizedBox(width: 8),
                Text(
                  'Buy$maBuy',
                  style: const TextStyle(color: Colors.green, fontSize: 12),
                ),
              ],
            ),
          ],
        ),
        const SizedBox(height: 16),
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Row(
              children: [
                const Text('Technical Indicator: '),
                Text(
                  'Neutral',
                  style: TextStyle(color: Colors.orange, fontWeight: FontWeight.bold),
                ),
              ],
            ),
            Row(
              children: [
                const Text(
                  'Sell0',
                  style: TextStyle(color: Colors.red, fontSize: 12),
                ),
                const SizedBox(width: 8),
                Text(
                  'Neutral3',
                  style: TextStyle(color: Colors.grey[600], fontSize: 12),
                ),
                const SizedBox(width: 8),
                const Text(
                  'Buy1',
                  style: TextStyle(color: Colors.green, fontSize: 12),
                ),
              ],
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildMATable() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            _buildTableTab('Moving Average', 'Moving Average'),
            _buildTableTab('Technical Indicator', 'Technical Indicator'),
            _buildTableTab('Pivot Point', 'Pivot Point'),
          ],
        ),
        const SizedBox(height: 8),
        _buildMATableContent(),
      ],
    );
  }

  Widget _buildTableTab(String label, String value) {
    final isActive = _selectedTableTab == value;
    return GestureDetector(
      onTap: () {
        setState(() {
          _selectedTableTab = value;
        });
      },
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        decoration: BoxDecoration(
          border: Border(
            bottom: BorderSide(
              color: isActive ? Theme.of(context).colorScheme.primary : Colors.transparent,
              width: 2,
            ),
          ),
        ),
        child: Text(
          label,
          style: TextStyle(
            color: isActive ? Theme.of(context).colorScheme.primary : Colors.grey[600],
            fontWeight: isActive ? FontWeight.w600 : FontWeight.normal,
          ),
        ),
      ),
    );
  }

  Widget _buildMATableContent() {
    return Container(
      decoration: BoxDecoration(
        border: Border.all(color: Colors.grey[300]!),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Column(
        children: [
          _buildTableHeader(),
          ..._buildMATableRows(),
        ],
      ),
    );
  }

  Widget _buildTableHeader() {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.grey[100],
        border: Border(bottom: BorderSide(color: Colors.grey[300]!)),
      ),
      child: Row(
        children: [
          Expanded(flex: 2, child: Text('Name', style: TextStyle(fontWeight: FontWeight.bold))),
          Expanded(flex: 3, child: Text('Standard (SMA)', style: TextStyle(fontWeight: FontWeight.bold))),
          Expanded(flex: 3, child: Text('Move (EMA)', style: TextStyle(fontWeight: FontWeight.bold))),
        ],
      ),
    );
  }

  List<Widget> _buildMATableRows() {
    final periods = [5, 10, 20, 30, 50, 100, 200];
    final currentPrice = widget.coin.currentPrice;
    
    if (_isLoadingMA || _maValues.isEmpty) {
      return periods.map((period) {
        return Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            border: Border(bottom: BorderSide(color: Colors.grey[200]!)),
          ),
          child: Row(
            children: [
              Expanded(flex: 2, child: Text('MA($period)')),
              Expanded(
                flex: 3,
                child: _isLoadingMA 
                    ? const Center(child: CircularProgressIndicator())
                    : const Text('Loading...', style: TextStyle(color: Colors.grey)),
              ),
              Expanded(
                flex: 3,
                child: _isLoadingMA 
                    ? const SizedBox()
                    : const Text('Loading...', style: TextStyle(color: Colors.grey)),
              ),
            ],
          ),
        );
      }).toList();
    }
    
    return periods.map((period) {
      // Get real MA values from calculated data
      final maData = _maValues[period];
      
      if (maData == null) {
        return Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            border: Border(bottom: BorderSide(color: Colors.grey[200]!)),
          ),
          child: Row(
            children: [
              Expanded(flex: 2, child: Text('MA($period)')),
              Expanded(
                flex: 3,
                child: const Text('N/A', style: TextStyle(color: Colors.grey)),
              ),
              Expanded(
                flex: 3,
                child: const Text('N/A', style: TextStyle(color: Colors.grey)),
              ),
            ],
          ),
        );
      }

      final sma = maData['sma']!;
      final ema = maData['ema']!;
      
      final smaSignal = TechnicalIndicators.getMASignal(currentPrice, sma);
      final emaSignal = TechnicalIndicators.getMASignal(currentPrice, ema);

      return Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          border: Border(bottom: BorderSide(color: Colors.grey[200]!)),
        ),
        child: Row(
          children: [
            Expanded(flex: 2, child: Text('MA($period)')),
            Expanded(
              flex: 3,
              child: Row(
                children: [
                  Text(
                    smaSignal,
                    style: TextStyle(
                      color: smaSignal == 'Buy' ? Colors.green : smaSignal == 'Sell' ? Colors.red : Colors.grey,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  const SizedBox(width: 8),
                  Text(sma.toStringAsFixed(4)),
                ],
              ),
            ),
            Expanded(
              flex: 3,
              child: Row(
                children: [
                  Text(
                    emaSignal,
                    style: TextStyle(
                      color: emaSignal == 'Buy' ? Colors.green : emaSignal == 'Sell' ? Colors.red : Colors.grey,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  const SizedBox(width: 8),
                  Text(ema.toStringAsFixed(4)),
                ],
              ),
            ),
          ],
        ),
      );
    }).toList();
  }

  void _showTradingModeDialog(BuildContext context) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Select Trading Mode'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            ListTile(
              leading: const Icon(Icons.auto_awesome, color: Colors.blue),
              title: const Text('Algo Trading'),
              subtitle: const Text('Automated trading with technical indicators'),
              onTap: () {
                Navigator.pop(context);
                _navigateToAlgoConfig(context);
              },
            ),
            const Divider(),
            ListTile(
              leading: const Icon(Icons.touch_app, color: Colors.green),
              title: const Text('Manual Trade'),
              subtitle: const Text('Place orders manually'),
              onTap: () {
                Navigator.pop(context);
                _showManualTradeDialog(context);
              },
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
        ],
      ),
    );
  }

  void _navigateToAlgoConfig(BuildContext context) async {
    // Check if exchange is linked
    final exchangeService = ExchangeService();
    final isLinked = await exchangeService.isPlatformLinked('binance');
    
    if (!isLinked) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Please link your Binance API first'),
            backgroundColor: Colors.red,
          ),
        );
      }
      return;
    }

    if (context.mounted) {
      Navigator.push(
        context,
        MaterialPageRoute(
          builder: (context) => AlgoTradingConfigScreen(
            coin: widget.coin,
            quoteCurrency: widget.quoteCurrency,
          ),
        ),
      );
    }
  }

  void _showManualTradeDialog(BuildContext context) {
    // TODO: Implement manual trade dialog
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Manual trading coming soon'),
      ),
    );
  }
}

class SentimentGaugePainter extends CustomPainter {
  final double buyRatio;
  final double sellRatio;
  final double neutralRatio;
  final String sentiment;
  final double needleAngle;

  SentimentGaugePainter({
    required this.buyRatio,
    required this.sellRatio,
    required this.neutralRatio,
    required this.sentiment,
    required this.needleAngle,
  });

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..style = PaintingStyle.stroke
      ..strokeWidth = 20;

    final center = Offset(size.width / 2, size.height);
    final radius = size.width / 2;
    final pi = math.pi;

    // Draw arcs in 5 segments: Strong Sell, Sell, Neutral, Buy, Strong Buy
    final segmentLength = pi / 5; // Each segment is 36 degrees

    // Strong Sell (leftmost)
    paint.color = Colors.red[700]!;
    canvas.drawArc(
      Rect.fromCircle(center: center, radius: radius),
      pi,
      segmentLength,
      false,
      paint,
    );

    // Sell
    paint.color = Colors.red;
    canvas.drawArc(
      Rect.fromCircle(center: center, radius: radius),
      pi + segmentLength,
      segmentLength,
      false,
      paint,
    );

    // Neutral
    paint.color = Colors.grey;
    canvas.drawArc(
      Rect.fromCircle(center: center, radius: radius),
      pi + (segmentLength * 2),
      segmentLength,
      false,
      paint,
    );

    // Buy
    paint.color = Colors.blue;
    canvas.drawArc(
      Rect.fromCircle(center: center, radius: radius),
      pi + (segmentLength * 3),
      segmentLength,
      false,
      paint,
    );

    // Strong Buy (rightmost)
    paint.color = Colors.blue[700]!;
    canvas.drawArc(
      Rect.fromCircle(center: center, radius: radius),
      pi + (segmentLength * 4),
      segmentLength,
      false,
      paint,
    );

    // Draw labels
    final textPainter = TextPainter(
      textAlign: TextAlign.center,
      textDirection: TextDirection.ltr,
    );

    // Strong Sell label
    textPainter.text = const TextSpan(
      text: 'Strong Sell',
      style: TextStyle(color: Colors.red, fontSize: 10, fontWeight: FontWeight.w600),
    );
    textPainter.layout();
    textPainter.paint(canvas, Offset(size.width * 0.05, size.height - 25));

    // Sell label
    textPainter.text = const TextSpan(
      text: 'Sell',
      style: TextStyle(color: Colors.red, fontSize: 10),
    );
    textPainter.layout();
    textPainter.paint(canvas, Offset(size.width * 0.25, size.height - 25));

    // Neutral label
    textPainter.text = const TextSpan(
      text: 'Neutral',
      style: TextStyle(color: Colors.grey, fontSize: 10),
    );
    textPainter.layout();
    textPainter.paint(canvas, Offset(size.width * 0.45, size.height - 25));

    // Buy label
    textPainter.text = const TextSpan(
      text: 'Buy',
      style: TextStyle(color: Colors.blue, fontSize: 10),
    );
    textPainter.layout();
    textPainter.paint(canvas, Offset(size.width * 0.65, size.height - 25));

    // Strong Buy label
    textPainter.text = const TextSpan(
      text: 'Strong Buy',
      style: TextStyle(color: Colors.blue, fontSize: 10, fontWeight: FontWeight.w600),
    );
    textPainter.layout();
    textPainter.paint(canvas, Offset(size.width * 0.75, size.height - 25));

    // Draw needle based on sentiment
    final needlePaint = Paint()
      ..color = Colors.blue
      ..strokeWidth = 3
      ..style = PaintingStyle.stroke
      ..strokeCap = StrokeCap.round;

    // Calculate needle angle based on sentiment
    double angle = pi + (segmentLength * 2); // Default to Neutral (center)
    
    if (sentiment == 'Strong Sell') {
      angle = pi + (segmentLength * 0.5);
    } else if (sentiment == 'Sell') {
      angle = pi + (segmentLength * 1.5);
    } else if (sentiment == 'Neutral') {
      angle = pi + (segmentLength * 2.5);
    } else if (sentiment == 'Buy') {
      angle = pi + (segmentLength * 3.5);
    } else if (sentiment == 'Strong Buy') {
      angle = pi + (segmentLength * 4.5);
    }

    // Add fine-tuning based on ratios
    if (needleAngle != 0) {
      angle += needleAngle * segmentLength;
    }

    final needleLength = radius * 0.75;
    final needleEnd = Offset(
      center.dx + needleLength * math.cos(angle),
      center.dy + needleLength * math.sin(angle),
    );

    canvas.drawLine(center, needleEnd, needlePaint);

    // Draw needle circle at center
    final needleCirclePaint = Paint()
      ..color = Colors.blue
      ..style = PaintingStyle.fill;
    canvas.drawCircle(center, 6, needleCirclePaint);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => true;
}
