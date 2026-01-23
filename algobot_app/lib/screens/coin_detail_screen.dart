import 'dart:math' as math;
import 'dart:async';
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
import '../services/algo_trading_service.dart';

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
  final AlgoTradingService _algoService = AlgoTradingService();
  Map<String, int> _sentiment = {'buy': 0, 'sell': 0, 'neutral': 0};
  Map<String, dynamic> _stats24h = {};
  String _selectedInterval = '5';
  bool _isFullScreen = false;
  String _selectedTab = 'Market';
  String _selectedTableTab = 'Moving Average';
  Map<int, Map<String, double>> _maValues = {}; // Store calculated MA values
  bool _isLoadingMA = false;
  Timer? _indicatorUpdateTimer;
  DateTime? _lastUpdateTime;
  Timer? _tradeUpdateTimer;
  Map<String, dynamic>? _activeTrade; // Current active trade for this symbol
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
    _startIndicatorUpdates();
    _startTradeUpdates();
  }
  
  void _startTradeUpdates() {
    // Update active trade data every 3 seconds for real-time P&L
    _tradeUpdateTimer = Timer.periodic(const Duration(seconds: 3), (timer) {
      if (mounted) {
        _loadActiveTrade();
      }
    });
    // Load immediately
    _loadActiveTrade();
  }
  
  Future<void> _loadActiveTrade() async {
    try {
      final symbol = '${widget.coin.symbol}${widget.quoteCurrency}';
      final trades = await _algoService.getActiveTrades();
      Map<String, dynamic>? trade;
      try {
        trade = trades.firstWhere(
          (t) => t['symbol'] == symbol && (t['isStarted'] == true || t['isStarted'] == 'true'),
        );
      } catch (e) {
        trade = null;
      }
      
      if (mounted) {
        setState(() {
          _activeTrade = trade;
        });
      }
    } catch (e) {
      // Silently fail - trade might not exist
      if (mounted) {
        setState(() {
          _activeTrade = null;
        });
      }
    }
  }

  @override
  void dispose() {
    _indicatorUpdateTimer?.cancel();
    _tradeUpdateTimer?.cancel();
    super.dispose();
  }

  void _startIndicatorUpdates() {
    // Update indicators every 5 seconds
    _indicatorUpdateTimer = Timer.periodic(const Duration(seconds: 5), (timer) {
      if (mounted) {
        final symbol = '${widget.coin.symbol}${widget.quoteCurrency}';
        _loadMAData(symbol, silent: true); // Silent update without showing loading
      }
    });
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

  Future<void> _loadMAData(String symbol, {bool silent = false}) async {
    // Throttle API calls - don't update more than once every 3 seconds
    if (_lastUpdateTime != null) {
      final timeSinceLastUpdate = DateTime.now().difference(_lastUpdateTime!);
      if (timeSinceLastUpdate.inSeconds < 3 && silent) {
        return; // Skip if updated recently and this is a silent update
      }
    }

    if (!silent) {
      setState(() {
        _isLoadingMA = true;
      });
    }

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
        if (!silent) {
          setState(() {
            _isLoadingMA = false;
          });
        }
        return;
      }

      // Calculate MA values for all periods
      final periods = [5, 10, 20, 30, 50, 100, 200];
      final maValues = TechnicalIndicators.calculateAllMAs(candles, periods);

      // Calculate sentiment from MA signals
      final currentPrice = widget.coin.currentPrice;
      final sentiment = TechnicalIndicators.calculateSentiment(currentPrice, maValues);

      if (mounted) {
        setState(() {
          _maValues = maValues;
          _sentiment = sentiment;
          _isLoadingMA = false;
          _lastUpdateTime = DateTime.now();
        });
      }
    } catch (e) {
      if (Env.enableApiLogs) {
        print('Error loading MA data: $e');
      }
      if (!silent && mounted) {
        setState(() {
          _isLoadingMA = false;
        });
      }
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
            // Show active trade info if exists
            if (_activeTrade != null) _buildActiveTradeCard(),
            // _buildIntervalSelector(),
            _buildTradingViewChart(),
            _buildTechnicalIndicatorSection(),
            const SizedBox(height: 80),
          ],
        ),
      ),
      bottomNavigationBar: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Theme.of(context).scaffoldBackgroundColor,
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.1),
              blurRadius: 4,
              offset: const Offset(0, -2),
            ),
          ],
        ),
        child: ElevatedButton(
          onPressed: () => _showTradingModeDialog(context),
          style: ElevatedButton.styleFrom(
            backgroundColor: Theme.of(context).colorScheme.primary,
            foregroundColor: Colors.white,
            padding: const EdgeInsets.symmetric(vertical: 16),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(8),
            ),
          ),
          child: const Text(
            'Start Trading',
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.bold,
              color: Colors.white,
            ),
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
    return Center(
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            _buildTechnicalIndicatorHeader(),
            const SizedBox(height: 24),
            _buildSentimentGaugeCard(),
            const SizedBox(height: 20),
            _buildSummaryBoxesCard(),
            const SizedBox(height: 20),
            _buildIndicatorSummaryCard(),
            const SizedBox(height: 20),
            _buildMATableCard(),
          ],
        ),
      ),
    );
  }

  Widget _buildTechnicalIndicatorHeader() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
      decoration: BoxDecoration(
        color: Theme.of(context).cardColor,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 10,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: Theme.of(context).colorScheme.primary.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Icon(
                  Icons.analytics,
                  color: Theme.of(context).colorScheme.primary,
                  size: 24,
                ),
              ),
              const SizedBox(width: 12),
              const Text(
                'Technical Indicators',
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
              ),
            ],
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            decoration: BoxDecoration(
              color: Theme.of(context).colorScheme.primary.withOpacity(0.1),
              borderRadius: BorderRadius.circular(8),
            ),
            child: DropdownButton<String>(
              value: _intervals.firstWhere((i) => _intervalMap[i] == _selectedInterval, orElse: () => '5m'),
              items: _intervals.map((interval) {
                return DropdownMenuItem(value: interval, child: Text(interval));
              }).toList(),
              onChanged: (value) {
                if (value != null && _intervalMap.containsKey(value)) {
                  _onIntervalChanged(value);
                }
              },
              underline: const SizedBox(),
              icon: Icon(
                Icons.arrow_drop_down,
                color: Theme.of(context).colorScheme.primary,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSentimentGaugeCard() {
    final total = _sentiment['buy']! + _sentiment['sell']! + _sentiment['neutral']!;
    final buyRatio = total > 0 ? _sentiment['buy']! / total : 0.0;
    final sellRatio = total > 0 ? _sentiment['sell']! / total : 0.0;
    final neutralRatio = total > 0 ? _sentiment['neutral']! / total : 0.0;
    
    String sentiment = 'Neutral';
    Color sentimentColor = Colors.grey;
    double needleAngle = 0.0;
    
    if (buyRatio > sellRatio && buyRatio > neutralRatio) {
      sentiment = buyRatio > 0.6 ? 'Strong Buy' : 'Buy';
      sentimentColor = Colors.blue;
      needleAngle = buyRatio * 0.5;
    } else if (sellRatio > buyRatio && sellRatio > neutralRatio) {
      sentiment = sellRatio > 0.6 ? 'Strong Sell' : 'Sell';
      sentimentColor = Colors.red;
      needleAngle = -sellRatio * 0.5;
    } else {
      sentiment = 'Neutral';
      sentimentColor = Colors.grey;
      needleAngle = 0.0;
    }

    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: Theme.of(context).cardColor,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.08),
            blurRadius: 15,
            offset: const Offset(0, 4),
          ),
        ],
        border: Border.all(
          color: sentimentColor.withOpacity(0.2),
          width: 2,
        ),
      ),
      child: Column(
        children: [
          Text(
            'Market Sentiment',
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w600,
              color: Colors.grey[600],
            ),
          ),
          const SizedBox(height: 20),
          SizedBox(
            height: 140,
            child: Stack(
              alignment: Alignment.center,
              children: [
                CustomPaint(
                  size: const Size(320, 140),
                  painter: SentimentGaugePainter(
                    buyRatio: buyRatio,
                    sellRatio: sellRatio,
                    neutralRatio: neutralRatio,
                    sentiment: sentiment,
                    needleAngle: needleAngle,
                  ),
                ),
                Positioned(
                  bottom: 30,
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                    decoration: BoxDecoration(
                      color: sentimentColor.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(
                        color: sentimentColor.withOpacity(0.3),
                        width: 1.5,
                      ),
                    ),
                    child: Text(
                      sentiment,
                      style: TextStyle(
                        fontSize: 24,
                        fontWeight: FontWeight.bold,
                        color: sentimentColor,
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSummaryBoxesCard() {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Theme.of(context).cardColor,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.08),
            blurRadius: 15,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        children: [
          Text(
            'Signal Summary',
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w600,
              color: Colors.grey[600],
            ),
          ),
          const SizedBox(height: 20),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceEvenly,
            children: [
              _buildSummaryBox('Sell', _sentiment['sell']!, Colors.red),
              _buildSummaryBox('Neutral', _sentiment['neutral']!, Colors.grey),
              _buildSummaryBox('Buy', _sentiment['buy']!, Colors.blue),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildSummaryBox(String label, int value, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: color.withOpacity(0.3), width: 1.5),
      ),
      child: Column(
        children: [
          Text(
            label,
            style: TextStyle(
              color: color,
              fontWeight: FontWeight.w600,
              fontSize: 14,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            '$value',
            style: TextStyle(
              fontSize: 28,
              fontWeight: FontWeight.bold,
              color: color,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildIndicatorSummaryCard() {
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

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Theme.of(context).cardColor,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.08),
            blurRadius: 15,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Indicator Analysis',
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w600,
              color: Colors.grey[600],
            ),
          ),
          const SizedBox(height: 20),
          _buildIndicatorRow(
            'Moving Average',
            maSentiment,
            maColor,
            maSell,
            maNeutral,
            maBuy,
          ),
          const SizedBox(height: 16),
          const Divider(),
          const SizedBox(height: 16),
          _buildIndicatorRow(
            'Technical Indicator',
            'Neutral',
            Colors.orange,
            0,
            3,
            1,
          ),
        ],
      ),
    );
  }

  Widget _buildIndicatorRow(String label, String sentiment, Color sentimentColor, int sell, int neutral, int buy) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      crossAxisAlignment: CrossAxisAlignment.center,
      children: [
        Flexible(
          flex: 2,
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Flexible(
                child: Text(
                  '$label: ',
                  style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w500),
                  overflow: TextOverflow.ellipsis,
                ),
              ),
              Flexible(
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                  decoration: BoxDecoration(
                    color: sentimentColor.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: sentimentColor.withOpacity(0.3)),
                  ),
                  child: Text(
                    sentiment,
                    style: TextStyle(
                      color: sentimentColor,
                      fontWeight: FontWeight.bold,
                      fontSize: 13,
                    ),
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
              ),
            ],
          ),
        ),
        Flexible(
          flex: 3,
          child: Row(
            mainAxisSize: MainAxisSize.min,
            mainAxisAlignment: MainAxisAlignment.end,
            children: [
              Flexible(
                child: _buildSignalBadge('Sell', sell, Colors.red),
              ),
              const SizedBox(width: 6),
              Flexible(
                child: _buildSignalBadge('Neutral', neutral, Colors.grey),
              ),
              const SizedBox(width: 6),
              Flexible(
                child: _buildSignalBadge('Buy', buy, Colors.green),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildSignalBadge(String label, int value, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Text(
        '$label$value',
        style: TextStyle(
          color: color,
          fontSize: 11,
          fontWeight: FontWeight.w600,
        ),
        overflow: TextOverflow.ellipsis,
      ),
    );
  }

  Widget _buildMATableCard() {
    return Container(
      decoration: BoxDecoration(
        color: Theme.of(context).cardColor,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.08),
            blurRadius: 15,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.all(20),
            child: Row(
              children: [
                _buildTableTab('Moving Average', 'Moving Average'),
                _buildTableTab('Technical Indicator', 'Technical Indicator'),
                _buildTableTab('Pivot Point', 'Pivot Point'),
              ],
            ),
          ),
          _buildMATableContent(),
        ],
      ),
    );
  }

  Widget _buildTableTab(String label, String value) {
    final isActive = _selectedTableTab == value;
    return Expanded(
      child: GestureDetector(
        onTap: () {
          setState(() {
            _selectedTableTab = value;
          });
        },
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
          margin: const EdgeInsets.only(right: 8),
          decoration: BoxDecoration(
            color: isActive
                ? Theme.of(context).colorScheme.primary.withOpacity(0.1)
                : Colors.transparent,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(
              color: isActive
                  ? Theme.of(context).colorScheme.primary
                  : Colors.transparent,
              width: 1.5,
            ),
          ),
          child: Text(
            label,
            textAlign: TextAlign.center,
            style: TextStyle(
              color: isActive
                  ? Theme.of(context).colorScheme.primary
                  : Colors.grey[600],
              fontWeight: isActive ? FontWeight.w600 : FontWeight.normal,
              fontSize: 13,
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildMATableContent() {
    return Container(
      decoration: BoxDecoration(
        border: Border(
          top: BorderSide(color: Colors.grey[300]!),
        ),
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
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.grey[100]!.withOpacity(0.5),
        border: Border(bottom: BorderSide(color: Colors.grey[300]!)),
      ),
      child: Row(
        children: [
          Expanded(
            flex: 2,
            child: Text(
              'Name',
              style: TextStyle(
                fontWeight: FontWeight.bold,
                fontSize: 14,
                color: Colors.grey[700],
              ),
            ),
          ),
          Expanded(
            flex: 3,
            child: Text(
              'Standard (SMA)',
              style: TextStyle(
                fontWeight: FontWeight.bold,
                fontSize: 14,
                color: Colors.grey[700],
              ),
            ),
          ),
          Expanded(
            flex: 3,
            child: Text(
              'Move (EMA)',
              style: TextStyle(
                fontWeight: FontWeight.bold,
                fontSize: 14,
                color: Colors.grey[700],
              ),
            ),
          ),
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
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        decoration: BoxDecoration(
          border: Border(bottom: BorderSide(color: Colors.grey[200]!)),
        ),
        child: Row(
          children: [
            Expanded(
              flex: 2,
              child: Text(
                'MA($period)',
                style: const TextStyle(fontWeight: FontWeight.w500),
              ),
            ),
            Expanded(
              flex: 3,
              child: _isLoadingMA
                  ? const Center(child: CircularProgressIndicator(strokeWidth: 2))
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
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        decoration: BoxDecoration(
          border: Border(bottom: BorderSide(color: Colors.grey[200]!)),
        ),
        child: Row(
          children: [
            Expanded(
              flex: 2,
              child: Text(
                'MA($period)',
                style: const TextStyle(fontWeight: FontWeight.w500),
              ),
            ),
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

      final smaColor = smaSignal == 'Buy' ? Colors.green : smaSignal == 'Sell' ? Colors.red : Colors.grey;
      final emaColor = emaSignal == 'Buy' ? Colors.green : emaSignal == 'Sell' ? Colors.red : Colors.grey;

      return Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        decoration: BoxDecoration(
          border: Border(bottom: BorderSide(color: Colors.grey[200]!)),
        ),
        child: Row(
          children: [
            Expanded(
              flex: 2,
              child: Text(
                'MA($period)',
                style: const TextStyle(fontWeight: FontWeight.w500),
              ),
            ),
            Expanded(
              flex: 3,
              child: Row(
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: smaColor.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(6),
                      border: Border.all(color: smaColor.withOpacity(0.3)),
                    ),
                    child: Text(
                      smaSignal,
                      style: TextStyle(
                        color: smaColor,
                        fontWeight: FontWeight.w600,
                        fontSize: 12,
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Text(
                      sma.toStringAsFixed(4),
                      style: const TextStyle(fontSize: 13),
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                ],
              ),
            ),
            Expanded(
              flex: 3,
              child: Row(
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: emaColor.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(6),
                      border: Border.all(color: emaColor.withOpacity(0.3)),
                    ),
                    child: Text(
                      emaSignal,
                      style: TextStyle(
                        color: emaColor,
                        fontWeight: FontWeight.w600,
                        fontSize: 12,
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Text(
                      ema.toStringAsFixed(4),
                      style: const TextStyle(fontSize: 13),
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
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
      barrierDismissible: true,
      builder: (dialogContext) => AlertDialog(
        title: const Text('Select Trading Mode'),
        content: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              InkWell(
                onTap: () async {
                  Navigator.pop(dialogContext);
                  // Small delay to ensure dialog is fully closed
                  await Future.delayed(const Duration(milliseconds: 100));
                  if (context.mounted) {
                    _navigateToAlgoConfig(context);
                  }
                },
                borderRadius: BorderRadius.circular(8),
                child: Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: Colors.blue.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: Colors.blue.withOpacity(0.3)),
                  ),
                  child: Row(
                    children: [
                      const Icon(Icons.auto_awesome, color: Colors.blue, size: 32),
                      const SizedBox(width: 16),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text(
                              'Algo Trading',
                              style: TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              'Automated trading with technical indicators',
                              style: TextStyle(
                                fontSize: 12,
                                color: Colors.grey[600],
                              ),
                            ),
                          ],
                        ),
                      ),
                      const Icon(Icons.arrow_forward_ios, size: 16, color: Colors.grey),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 16),
              InkWell(
                onTap: () {
                  Navigator.pop(dialogContext);
                  _showManualTradeDialog(context);
                },
                borderRadius: BorderRadius.circular(8),
                child: Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: Colors.green.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: Colors.green.withOpacity(0.3)),
                  ),
                  child: Row(
                    children: [
                      const Icon(Icons.touch_app, color: Colors.green, size: 32),
                      const SizedBox(width: 16),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text(
                              'Manual Trade',
                              style: TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              'Place orders manually',
                              style: TextStyle(
                                fontSize: 12,
                                color: Colors.grey[600],
                              ),
                            ),
                          ],
                        ),
                      ),
                      const Icon(Icons.arrow_forward_ios, size: 16, color: Colors.grey),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(dialogContext),
            child: const Text('Cancel'),
          ),
        ],
      ),
    );
  }

  void _navigateToAlgoConfig(BuildContext context) async {
    try {
      // Check if exchange is linked
      final exchangeService = ExchangeService();
      final isLinked = await exchangeService.isPlatformLinked('binance');
      
      if (!isLinked) {
        if (context.mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Please link your Binance API first'),
              backgroundColor: Colors.red,
              duration: Duration(seconds: 3),
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
    } catch (e) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error: ${e.toString()}'),
            backgroundColor: Colors.red,
            duration: const Duration(seconds: 3),
          ),
        );
      }
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

  Widget _buildActiveTradeCard() {
    if (_activeTrade == null) return const SizedBox.shrink();
    
    final currentPnL = _activeTrade!['currentPnL'] ?? 0.0;
    final unrealizedPnL = _activeTrade!['unrealizedPnL'] ?? 0.0;
    final totalBalance = _activeTrade!['totalBalance'] ?? _activeTrade!['totalInvested'] ?? 0.0;
    final currentLevel = _activeTrade!['currentLevel'] ?? 0;
    final numberOfLevels = _activeTrade!['numberOfLevels'] ?? 0;
    final tradeDirection = _activeTrade!['tradeDirection'] ?? 'N/A';
    final currentPrice = _activeTrade!['currentPrice'] ?? widget.coin.currentPrice;
    final startPrice = _activeTrade!['startPrice'] ?? 0.0;
    final leverage = _activeTrade!['leverage'] ?? 1;
    final useMargin = _activeTrade!['useMargin'] ?? false;
    
    final pnlColor = currentPnL >= 0 ? Colors.green : Colors.red;
    
    return Container(
      margin: const EdgeInsets.all(16),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Theme.of(context).cardColor,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: pnlColor.withOpacity(0.3),
          width: 2,
        ),
        boxShadow: [
          BoxShadow(
            color: pnlColor.withOpacity(0.1),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  Icon(
                    tradeDirection == 'BUY' ? Icons.trending_up : Icons.trending_down,
                    color: tradeDirection == 'BUY' ? Colors.green : Colors.red,
                    size: 24,
                  ),
                  const SizedBox(width: 8),
                  Text(
                    'Active Trade - $tradeDirection',
                    style: const TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ],
              ),
              if (useMargin && leverage > 1)
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: Colors.blue.withOpacity(0.2),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(
                    '${leverage}x',
                    style: const TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.bold,
                      color: Colors.blue,
                    ),
                  ),
                ),
            ],
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              Expanded(
                child: _buildTradeMetric(
                  'Current Price',
                  '\$${currentPrice.toStringAsFixed(2)}',
                  Colors.grey[700]!,
                ),
              ),
              Expanded(
                child: _buildTradeMetric(
                  'Entry Price',
                  '\$${startPrice.toStringAsFixed(2)}',
                  Colors.grey[700]!,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: _buildTradeMetric(
                  'P&L',
                  '${currentPnL >= 0 ? "+" : ""}${currentPnL.toStringAsFixed(2)}%',
                  pnlColor,
                  isBold: true,
                ),
              ),
              Expanded(
                child: _buildTradeMetric(
                  'Unrealized P&L',
                  '\$${unrealizedPnL >= 0 ? "+" : ""}${unrealizedPnL.toStringAsFixed(2)}',
                  pnlColor,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: _buildTradeMetric(
                  'Total Balance',
                  '\$${totalBalance.toStringAsFixed(2)}',
                  Colors.blue,
                  isBold: true,
                ),
              ),
              Expanded(
                child: _buildTradeMetric(
                  'Levels',
                  '$currentLevel / $numberOfLevels',
                  Colors.orange,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          // Progress bar for levels
          ClipRRect(
            borderRadius: BorderRadius.circular(4),
            child: LinearProgressIndicator(
              value: numberOfLevels > 0 ? currentLevel / numberOfLevels : 0,
              backgroundColor: Colors.grey[300],
              valueColor: AlwaysStoppedAnimation<Color>(
                currentLevel >= numberOfLevels ? Colors.green : Colors.blue,
              ),
              minHeight: 8,
            ),
          ),
          // Show orders/positions if available
          if (_activeTrade!['orders'] != null && (_activeTrade!['orders'] as List).isNotEmpty) ...[
            const SizedBox(height: 16),
            const Divider(),
            const SizedBox(height: 12),
            Text(
              'Positions',
              style: TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.bold,
                color: Colors.grey[700],
              ),
            ),
            const SizedBox(height: 8),
            ...(_activeTrade!['orders'] as List).take(5).map((order) {
              final orderPrice = double.tryParse(order['price']?.toString() ?? '0') ?? 0.0;
              final orderQty = double.tryParse(order['quantity']?.toString() ?? '0') ?? 0.0;
              final orderSide = order['side'] ?? 'N/A';
              final orderPnL = orderSide == 'BUY'
                ? (currentPrice - orderPrice) * orderQty
                : (orderPrice - currentPrice) * orderQty;
              final orderPnLPercent = orderPrice > 0
                ? ((currentPrice - orderPrice) / orderPrice) * 100
                : 0.0;
              
              return Container(
                margin: const EdgeInsets.only(bottom: 8),
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: orderPnL >= 0 
                    ? Colors.green.withOpacity(0.1)
                    : Colors.red.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(
                    color: orderPnL >= 0 ? Colors.green : Colors.red,
                    width: 1,
                  ),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                              decoration: BoxDecoration(
                                color: orderSide == 'BUY' ? Colors.green : Colors.red,
                                borderRadius: BorderRadius.circular(4),
                              ),
                              child: Text(
                                orderSide,
                                style: const TextStyle(
                                  color: Colors.white,
                                  fontSize: 10,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                            ),
                            const SizedBox(width: 8),
                            Text(
                              '${orderQty.toStringAsFixed(8)} @ \$${orderPrice.toStringAsFixed(2)}',
                              style: const TextStyle(
                                fontSize: 12,
                                fontWeight: FontWeight.w500,
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.end,
                      children: [
                        Text(
                          '${orderPnL >= 0 ? "+" : ""}\$${orderPnL.toStringAsFixed(2)}',
                          style: TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.bold,
                            color: orderPnL >= 0 ? Colors.green : Colors.red,
                          ),
                        ),
                        Text(
                          '${orderPnLPercent >= 0 ? "+" : ""}${orderPnLPercent.toStringAsFixed(2)}%',
                          style: TextStyle(
                            fontSize: 11,
                            color: orderPnL >= 0 ? Colors.green : Colors.red,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              );
            }).toList(),
          ],
        ],
      ),
    );
  }
  
  Widget _buildTradeMetric(String label, String value, Color color, {bool isBold = false}) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: TextStyle(
            fontSize: 12,
            color: Colors.grey[600],
          ),
        ),
        const SizedBox(height: 4),
        Text(
          value,
          style: TextStyle(
            fontSize: 16,
            fontWeight: isBold ? FontWeight.bold : FontWeight.w600,
            color: color,
          ),
        ),
      ],
    );
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
