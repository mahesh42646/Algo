import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:webview_flutter/webview_flutter.dart';

class TradingViewChart extends StatefulWidget {
  final String symbol;
  final String interval;
  final String theme;

  const TradingViewChart({
    super.key,
    required this.symbol,
    this.interval = '5',
    this.theme = 'light',
  });

  @override
  State<TradingViewChart> createState() => _TradingViewChartState();
}

class _TradingViewChartState extends State<TradingViewChart> {
  late final WebViewController _controller;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _initializeWebView();
  }

  void _initializeWebView() {
    _controller = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setNavigationDelegate(
        NavigationDelegate(
          onPageFinished: (String url) {
            setState(() => _isLoading = false);
          },
        ),
      )
      ..loadRequest(Uri.dataFromString(
        _getChartHtml(),
        mimeType: 'text/html',
        encoding: Encoding.getByName('utf-8'),
      ));
  }

  String _getChartHtml() {
    // TradingView Widget - Free lightweight chart with live data
    final symbol = widget.symbol;
    final interval = widget.interval;
    final theme = widget.theme;
    final bgColor = theme == 'dark' ? '#1e1e1e' : '#ffffff';
    final toolbarBg = theme == 'dark' ? '#1e1e1e' : '#f1f3f6';
    final gridColor = theme == 'dark' ? '#2a2a2a' : '#e0e3e9';
    
    return '''
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
  <title>TradingView Chart</title>
  <script type="text/javascript" src="https://s3.tradingview.com/tv.js"></script>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      margin: 0;
      padding: 0;
      background: $bgColor;
      overflow: hidden;
    }
    #tradingview_chart {
      width: 100%;
      height: 100vh;
    }
  </style>
</head>
<body>
  <div id="tradingview_chart"></div>
  <script type="text/javascript">
    new TradingView.widget({
      "autosize": true,
      "symbol": "$symbol",
      "interval": "$interval",
      "timezone": "Etc/UTC",
      "theme": "$theme",
      "style": "1",
      "locale": "en",
      "toolbar_bg": "$toolbarBg",
      "enable_publishing": false,
      "hide_top_toolbar": false,
      "hide_legend": false,
      "save_image": false,
      "container_id": "tradingview_chart",
      "withdateranges": true,
      "range": "1D",
      "hide_side_toolbar": false,
      "allow_symbol_change": true,
      "details": true,
      "hotlist": true,
      "calendar": false,
      "studies": [
        "MASimple@tv-basicstudies"
      ],
      "overrides": {
        "paneProperties.background": "$bgColor",
        "paneProperties.vertGridProperties.color": "$gridColor",
        "paneProperties.horzGridProperties.color": "$gridColor",
        "symbolWatermarkProperties.color": "rgba(0, 0, 0, 0.06)",
        "mainSeriesProperties.candleStyle.upColor": "#26a69a",
        "mainSeriesProperties.candleStyle.downColor": "#ef5350",
        "mainSeriesProperties.candleStyle.borderUpColor": "#26a69a",
        "mainSeriesProperties.candleStyle.borderDownColor": "#ef5350"
      }
    });
  </script>
</body>
</html>
''';
  }

  @override
  void didUpdateWidget(TradingViewChart oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.symbol != widget.symbol || 
        oldWidget.interval != widget.interval ||
        oldWidget.theme != widget.theme) {
      setState(() => _isLoading = true);
      _controller.loadRequest(Uri.dataFromString(
        _getChartHtml(),
        mimeType: 'text/html',
        encoding: Encoding.getByName('utf-8'),
      ));
    }
  }

  @override
  Widget build(BuildContext context) {
    return Stack(
      children: [
        WebViewWidget(controller: _controller),
        if (_isLoading)
          Container(
            color: Theme.of(context).scaffoldBackgroundColor,
            child: const Center(
              child: CircularProgressIndicator(),
            ),
          ),
      ],
    );
  }
}
