import '../models/candlestick.dart';

class TechnicalIndicators {
  // Simple Moving Average
  static List<double> calculateSMA(List<double> prices, int period) {
    if (prices.length < period) return [];
    
    List<double> sma = [];
    for (int i = period - 1; i < prices.length; i++) {
      double sum = 0;
      for (int j = i - period + 1; j <= i; j++) {
        sum += prices[j];
      }
      sma.add(sum / period);
    }
    return sma;
  }

  // Exponential Moving Average
  static List<double> calculateEMA(List<double> prices, int period) {
    if (prices.length < period) return [];
    
    List<double> ema = [];
    double multiplier = 2.0 / (period + 1);
    
    // First EMA value is SMA
    double sum = 0;
    for (int i = 0; i < period; i++) {
      sum += prices[i];
    }
    ema.add(sum / period);
    
    // Calculate subsequent EMA values
    for (int i = period; i < prices.length; i++) {
      double value = (prices[i] - ema.last) * multiplier + ema.last;
      ema.add(value);
    }
    return ema;
  }

  // Get MA signal (Buy/Sell/Neutral)
  static String getMASignal(double currentPrice, double maValue) {
    if (currentPrice > maValue) return 'Buy';
    if (currentPrice < maValue) return 'Sell';
    return 'Neutral';
  }

  // MACD Calculation
  static Map<String, List<double>> calculateMACD(List<double> prices, {
    int fastPeriod = 12,
    int slowPeriod = 26,
    int signalPeriod = 9,
  }) {
    final emaFast = calculateEMA(prices, fastPeriod);
    final emaSlow = calculateEMA(prices, slowPeriod);
    
    // Align lengths
    final minLength = emaFast.length < emaSlow.length ? emaFast.length : emaSlow.length;
    final fast = emaFast.sublist(emaFast.length - minLength);
    final slow = emaSlow.sublist(emaSlow.length - minLength);
    
    // Calculate MACD line (DIF)
    List<double> dif = [];
    for (int i = 0; i < minLength; i++) {
      dif.add(fast[i] - slow[i]);
    }
    
    // Calculate Signal line (DEA) - EMA of DIF
    final dea = calculateEMA(dif, signalPeriod);
    
    // Calculate Histogram (MACD)
    final macdLength = dif.length < dea.length ? dif.length : dea.length;
    List<double> macd = [];
    for (int i = 0; i < macdLength; i++) {
      final difIndex = dif.length - macdLength + i;
      final deaIndex = dea.length - macdLength + i;
      macd.add((dif[difIndex] - dea[deaIndex]) * 2);
    }
    
    return {
      'dif': dif.sublist(dif.length - macdLength),
      'dea': dea.sublist(dea.length - macdLength),
      'macd': macd,
    };
  }

  // Calculate all MAs for a given period list
  static Map<int, Map<String, double>> calculateAllMAs(
    List<Candlestick> candles,
    List<int> periods,
  ) {
    final closes = candles.map((c) => c.close).toList();
    final Map<int, Map<String, double>> result = {};
    
    for (final period in periods) {
      if (closes.length >= period) {
        final sma = calculateSMA(closes, period);
        final ema = calculateEMA(closes, period);
        
        if (sma.isNotEmpty && ema.isNotEmpty) {
          result[period] = {
            'sma': sma.last,
            'ema': ema.last,
          };
        }
      }
    }
    
    return result;
  }

  // Get overall sentiment from MA signals
  static Map<String, int> calculateSentiment(
    double currentPrice,
    Map<int, Map<String, double>> maValues,
  ) {
    int buyCount = 0;
    int sellCount = 0;
    int neutralCount = 0;
    
    for (final entry in maValues.entries) {
      final smaSignal = getMASignal(currentPrice, entry.value['sma']!);
      final emaSignal = getMASignal(currentPrice, entry.value['ema']!);
      
      if (smaSignal == 'Buy') buyCount++;
      else if (smaSignal == 'Sell') sellCount++;
      else neutralCount++;
      
      if (emaSignal == 'Buy') buyCount++;
      else if (emaSignal == 'Sell') sellCount++;
      else neutralCount++;
    }
    
    return {
      'buy': buyCount,
      'sell': sellCount,
      'neutral': neutralCount,
    };
  }
}
