import 'package:flutter/material.dart';
import '../models/crypto_coin.dart';
import '../services/crypto_service.dart';
import '../services/favorites_service.dart';
import '../widgets/notification_bell.dart';
import 'coin_detail_screen.dart';

class FavoritesPage extends StatefulWidget {
  const FavoritesPage({super.key});

  @override
  State<FavoritesPage> createState() => _FavoritesPageState();
}

class _FavoritesPageState extends State<FavoritesPage> {
  final CryptoService _cryptoService = CryptoService();
  final FavoritesService _favoritesService = FavoritesService();
  List<CryptoCoin> _favoriteCoins = [];
  bool _isLoading = true;
  Set<String> _favorites = {};

  @override
  void initState() {
    super.initState();
    _loadFavorites();
  }

  Future<void> _loadFavorites() async {
    setState(() {
      _isLoading = true;
    });

    try {
      final favorites = await _favoritesService.getFavorites();
      _favorites = favorites.toSet();
      
      if (favorites.isEmpty) {
        setState(() {
          _favoriteCoins = [];
          _isLoading = false;
        });
        return;
      }

      // Load all coins for all quote currencies
      final allCoins = <CryptoCoin>[];
      for (final quote in ['USDT', 'BTC', 'ETH', 'USDC']) {
        try {
          final coins = await _cryptoService.getCoinsByQuoteCurrency(quote);
          allCoins.addAll(coins);
        } catch (e) {
          // Ignore errors for specific quote currencies
        }
      }

      // Create a map of favorite pairs to their quote currencies
      final favoritePairs = <String, String>{}; // symbol -> quoteCurrency
      for (final fav in favorites) {
        // Try to extract symbol and quote from favorite string (e.g., "BTCUSDT" -> BTC, USDT)
        for (final quote in ['USDT', 'BTC', 'ETH', 'USDC', 'BNB']) {
          if (fav.endsWith(quote)) {
            final symbol = fav.substring(0, fav.length - quote.length);
            favoritePairs[symbol.toUpperCase()] = quote;
            break;
          }
        }
      }

      // Filter coins and match with their favorite quote currency
      final favoriteCoinsWithQuote = <Map<String, dynamic>>[];
      for (final coin in allCoins) {
        // Check if coin symbol matches any favorite (case-insensitive)
        final coinSymbolUpper = coin.symbol.toUpperCase();
        if (favoritePairs.containsKey(coinSymbolUpper)) {
          favoriteCoinsWithQuote.add({
            'coin': coin,
            'quote': favoritePairs[coinSymbolUpper]!,
            'favoriteKey': '${coinSymbolUpper}${favoritePairs[coinSymbolUpper]!}',
          });
        }
      }

      // Sort by favorite order
      favoriteCoinsWithQuote.sort((a, b) {
        final aKey = a['favoriteKey'] as String;
        final bKey = b['favoriteKey'] as String;
        final aIndex = favorites.indexWhere((fav) => fav.toUpperCase() == aKey);
        final bIndex = favorites.indexWhere((fav) => fav.toUpperCase() == bKey);
        if (aIndex == -1 && bIndex == -1) return 0;
        if (aIndex == -1) return 1;
        if (bIndex == -1) return -1;
        return aIndex.compareTo(bIndex);
      });

      final favoriteCoins = favoriteCoinsWithQuote.map((item) => item['coin'] as CryptoCoin).toList();

      if (mounted) {
        // Build quote currency map
        _coinQuoteMap.clear();
        for (final item in favoriteCoinsWithQuote) {
          _coinQuoteMap[(item['coin'] as CryptoCoin).symbol] = item['quote'] as String;
        }
        
        setState(() {
          _favoriteCoins = favoriteCoins;
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error loading favorites: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  Future<void> _removeFavorite(CryptoCoin coin) async {
    // Remove from all quote currencies
    for (final quote in ['USDT', 'BTC', 'ETH', 'USDC']) {
      if (_favorites.contains('${coin.symbol}$quote')) {
        await _favoritesService.removeFavorite(coin.symbol, quote);
      }
    }
    await _loadFavorites();
  }

  final Map<String, String> _coinQuoteMap = {}; // coin symbol -> quote currency
  
  String _getQuoteCurrency(CryptoCoin coin) {
    return _coinQuoteMap[coin.symbol] ?? 'USDT';
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Favorites'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _loadFavorites,
            tooltip: 'Refresh',
          ),
          const NotificationBell(),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _favoriteCoins.isEmpty
              ? _buildEmptyState()
              : RefreshIndicator(
                  onRefresh: _loadFavorites,
                  child: ListView.separated(
                    padding: const EdgeInsets.all(16),
                    itemCount: _favoriteCoins.length,
                    separatorBuilder: (context, index) => Divider(
                      height: 1,
                      color: isDark ? Colors.grey[800] : Colors.grey[200],
                    ),
                    itemBuilder: (context, index) {
                      final coin = _favoriteCoins[index];
                      final quoteCurrency = _getQuoteCurrency(coin);
                      final isPositive = coin.priceChangePercentage24h >= 0;
                      final changeColor = isPositive ? Colors.green : Colors.red;

                      return Material(
                        color: Colors.transparent,
                        child: InkWell(
                          onTap: () {
                            Navigator.push(
                              context,
                              MaterialPageRoute(
                                builder: (_) => CoinDetailScreen(
                                  coin: coin,
                                  quoteCurrency: quoteCurrency,
                                ),
                              ),
                            );
                          },
                          child: Container(
                            padding: const EdgeInsets.all(16),
                            decoration: BoxDecoration(
                              color: theme.cardColor,
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(
                                color: isDark ? Colors.grey[800]! : Colors.grey[300]!,
                                width: 1,
                              ),
                            ),
                            child: Row(
                              children: [
                                IconButton(
                                  icon: const Icon(Icons.star, color: Colors.amber),
                                  onPressed: () => _removeFavorite(coin),
                                ),
                                const SizedBox(width: 8),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        coin.getPair(quoteCurrency),
                                        style: const TextStyle(
                                          fontWeight: FontWeight.bold,
                                          fontSize: 16,
                                        ),
                                      ),
                                      const SizedBox(height: 4),
                                      Text(
                                        coin.name,
                                        style: TextStyle(
                                          fontSize: 12,
                                          color: Colors.grey[600],
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                                Column(
                                  crossAxisAlignment: CrossAxisAlignment.end,
                                  children: [
                                    Text(
                                      '\$${coin.currentPrice.toStringAsFixed(2)}',
                                      style: const TextStyle(
                                        fontWeight: FontWeight.bold,
                                        fontSize: 16,
                                      ),
                                    ),
                                    const SizedBox(height: 4),
                                    Container(
                                      padding: const EdgeInsets.symmetric(
                                        horizontal: 8,
                                        vertical: 4,
                                      ),
                                      decoration: BoxDecoration(
                                        color: changeColor.withOpacity(0.1),
                                        borderRadius: BorderRadius.circular(4),
                                      ),
                                      child: Text(
                                        '${isPositive ? '+' : ''}${coin.priceChangePercentage24h.toStringAsFixed(2)}%',
                                        style: TextStyle(
                                          color: changeColor,
                                          fontWeight: FontWeight.w600,
                                          fontSize: 12,
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                              ],
                            ),
                          ),
                        ),
                      );
                    },
                  ),
                ),
    );
  }

  Widget _buildEmptyState() {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            Icons.star_border,
            size: 80,
            color: isDark ? Colors.grey[600] : Colors.grey[400],
          ),
          const SizedBox(height: 16),
          Text(
            'No Favorites Yet',
            style: TextStyle(
              fontSize: 18,
              color: isDark ? Colors.grey[400] : Colors.grey[600],
              fontWeight: FontWeight.w500,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'Add coins to favorites from the home page',
            style: TextStyle(
              fontSize: 14,
              color: isDark ? Colors.grey[500] : Colors.grey[500],
            ),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }
}
