class CryptoCoin {
  final String id;
  final String symbol;
  final String name;
  final double currentPrice;
  final double priceChange24h;
  final double priceChangePercentage24h;
  final String? image;
  final double volume24h;

  CryptoCoin({
    required this.id,
    required this.symbol,
    required this.name,
    required this.currentPrice,
    required this.priceChange24h,
    required this.priceChangePercentage24h,
    this.image,
    this.volume24h = 0.0,
  });

  // Factory constructor for Binance API data
  factory CryptoCoin.fromBinanceJson(Map<String, dynamic> json, String quoteCurrency) {
    final symbol = json['symbol'] as String? ?? '';
    final quoteUpper = quoteCurrency.toUpperCase();
    
    // Extract base currency from symbol (e.g., "BTCUSDT" -> "BTC")
    String baseSymbol = '';
    if (symbol.endsWith(quoteUpper)) {
      baseSymbol = symbol.substring(0, symbol.length - quoteUpper.length);
    } else {
      baseSymbol = symbol;
    }

    // Parse price change percentage (Binance returns as string)
    final priceChangePercentStr = json['priceChangePercent'] as String? ?? '0.0';
    final priceChangePercent = double.tryParse(priceChangePercentStr) ?? 0.0;

    // Parse price change 24h
    final priceChangeStr = json['priceChange'] as String? ?? '0.0';
    final priceChange = double.tryParse(priceChangeStr) ?? 0.0;

    // Parse last price (Binance spot API uses 'lastPrice', some endpoints use 'price')
    final lastPriceStr = json['lastPrice'] as String? ?? 
                        json['price'] as String? ?? 
                        '0.0';
    final lastPrice = double.tryParse(lastPriceStr) ?? 0.0;

    // Parse volume (quoteVolume is in quote currency, volume is in base currency)
    // Use quoteVolume for better comparison across different pairs
    final volumeStr = json['quoteVolume'] as String? ?? 
                     json['volume'] as String? ?? 
                     '0.0';
    final volume = double.tryParse(volumeStr) ?? 0.0;

    return CryptoCoin(
      id: symbol.toLowerCase(),
      symbol: baseSymbol,
      name: baseSymbol, // Use symbol as name for now
      currentPrice: lastPrice,
      priceChange24h: priceChange,
      priceChangePercentage24h: priceChangePercent,
      image: null,
      volume24h: volume,
    );
  }

  // Legacy factory for CoinGecko (kept for backward compatibility)
  factory CryptoCoin.fromJson(Map<String, dynamic> json) {
    return CryptoCoin(
      id: json['id'] ?? '',
      symbol: (json['symbol'] ?? '').toUpperCase(),
      name: json['name'] ?? '',
      currentPrice: (json['current_price'] ?? 0.0).toDouble(),
      priceChange24h: (json['price_change_24h'] ?? 0.0).toDouble(),
      priceChangePercentage24h:
          (json['price_change_percentage_24h'] ?? 0.0).toDouble(),
      image: json['image'],
      volume24h: 0.0,
    );
  }

  String getPair(String quoteCurrency) {
    return '$symbol/$quoteCurrency';
  }
}
