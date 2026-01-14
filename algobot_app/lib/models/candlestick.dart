class Candlestick {
  final DateTime time;
  final double open;
  final double high;
  final double low;
  final double close;
  final double volume;

  Candlestick({
    required this.time,
    required this.open,
    required this.high,
    required this.low,
    required this.close,
    required this.volume,
  });

  factory Candlestick.fromBinanceJson(List<dynamic> json) {
    return Candlestick(
      time: DateTime.fromMillisecondsSinceEpoch(json[0] as int),
      open: double.parse(json[1] as String),
      high: double.parse(json[2] as String),
      low: double.parse(json[3] as String),
      close: double.parse(json[4] as String),
      volume: double.parse(json[5] as String),
    );
  }
}
