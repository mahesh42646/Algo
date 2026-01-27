import 'package:flutter/material.dart';
import '../config/env.dart';
import '../models/crypto_coin.dart';
import '../services/crypto_service.dart';
import '../services/favorites_service.dart';
import 'skeleton.dart';

enum SortType { currency, price, change }
enum SortOrder { ascending, descending }

class CryptoListWidget extends StatefulWidget {
  const CryptoListWidget({super.key});

  @override
  State<CryptoListWidget> createState() => _CryptoListWidgetState();
}

class _CryptoListWidgetState extends State<CryptoListWidget> {
  final CryptoService _cryptoService = CryptoService();
  final FavoritesService _favoritesService = FavoritesService();
  List<CryptoCoin> _allCoins = [];
  List<CryptoCoin> _filteredCoins = [];
  bool _isLoading = true;
  bool _isLoadingData = false; // Prevent duplicate calls
  String _selectedQuote = 'USDT';
  SortType _sortType = SortType.currency;
  SortOrder _sortOrder = SortOrder.ascending;
  String _searchQuery = '';
  Set<String> _favorites = {};

  final List<String> _quoteCurrencies = ['USDT', 'BTC', 'ETH', 'USDC'];

  @override
  void initState() {
    super.initState();
    // Load data after the first frame to ensure widget is fully built
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _loadFavorites();
      _loadCryptoData();
    });
  }
  
  Future<void> _loadFavorites() async {
    final favorites = await _favoritesService.getFavorites();
    if (mounted) {
      setState(() {
        _favorites = favorites.toSet();
      });
    }
  }
  
  Future<void> _toggleFavorite(CryptoCoin coin) async {
    await _favoritesService.toggleFavorite(coin.symbol, _selectedQuote);
    await _loadFavorites();
  }

  Future<void> _loadCryptoData({bool retry = false}) async {
    // Prevent duplicate simultaneous calls
    if (_isLoadingData && !retry) {
      return;
    }
    
    _isLoadingData = true;
    if (!retry) {
      setState(() => _isLoading = true);
    }
    
    try {
      if (Env.enableApiLogs) {
        print('[CRYPTO WIDGET] Loading data for quote: $_selectedQuote');
      }
      final coins = await _cryptoService.getCoinsByQuoteCurrency(_selectedQuote);
      if (mounted) {
        setState(() {
          _allCoins = coins;
          _filteredCoins = coins;
          _isLoading = false;
          _isLoadingData = false;
        });
        _applySort();
        if (Env.enableApiLogs) {
          print('[CRYPTO WIDGET] ✅ Successfully loaded ${coins.length} coins');
        }
      }
    } catch (e) {
      if (Env.enableApiLogs) {
        print('[CRYPTO WIDGET] ❌ Error loading data: $e');
      }
      if (mounted) {
        setState(() {
          _isLoading = false;
          _isLoadingData = false;
        });
        // Only show error on initial load, not on retry
        if (!retry) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('Error loading data: $e'),
              action: SnackBarAction(
                label: 'Retry',
                onPressed: () => _loadCryptoData(retry: true),
              ),
              duration: const Duration(seconds: 5),
            ),
          );
        }
      }
    }
  }

  void _filterByQuote(String quote) {
    if (!mounted) return;
    
    if (_selectedQuote == quote && _allCoins.isNotEmpty) {
      // Already selected and has data, just apply filter
      return;
    }
    
    setState(() {
      _selectedQuote = quote;
      _isLoading = true;
    });
    
    _loadCryptoData();
  }

  void _applySort() {
    setState(() {
      _filteredCoins = List.from(_allCoins);
      
      if (_searchQuery.isNotEmpty) {
        _filteredCoins = _filteredCoins.where((coin) {
          return coin.symbol.toLowerCase().contains(_searchQuery.toLowerCase()) ||
              coin.name.toLowerCase().contains(_searchQuery.toLowerCase());
        }).toList();
      }

      _filteredCoins.sort((a, b) {
        int comparison = 0;
        switch (_sortType) {
          case SortType.currency:
            comparison = a.symbol.compareTo(b.symbol);
            break;
          case SortType.price:
            comparison = a.currentPrice.compareTo(b.currentPrice);
            break;
          case SortType.change:
            comparison = a.priceChangePercentage24h
                .compareTo(b.priceChangePercentage24h);
            break;
        }
        return _sortOrder == SortOrder.ascending ? comparison : -comparison;
      });
    });
  }

  void _toggleSort(SortType type) {
    setState(() {
      if (_sortType == type) {
        _sortOrder = _sortOrder == SortOrder.ascending
            ? SortOrder.descending
            : SortOrder.ascending;
      } else {
        _sortType = type;
        _sortOrder = SortOrder.ascending;
      }
    });
    _applySort();
  }

  String _formatPrice(double price) {
    if (price >= 1000) {
      return price.toStringAsFixed(2).replaceAllMapped(
          RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'), (Match m) => '${m[1]},');
    } else if (price >= 1) {
      return price.toStringAsFixed(2);
    } else {
      return price.toStringAsFixed(6);
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        color: theme.cardColor,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: isDark ? Colors.grey[800]! : Colors.grey[200]!,
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
          _buildMarketFilters(),
          _buildTableHeader(),
          _buildCryptoList(),
        ],
      ),
    );
  }

  // Widget _buildHeader() {
  //   return Padding(
  //  padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 0),
  //     child: Row(
  //       mainAxisAlignment: MainAxisAlignment.spaceBetween,
  //       children: [
  //         const Text(
  //           'Spot',
  //           style: TextStyle(
  //             fontSize: 18,
  //             fontWeight: FontWeight.bold,
  //           ),
  //         ),
  //         TextButton(
  //           onPressed: () {},
  //           child: const Text('Manage +'),
  //         ),
  //       ],
  //     ),
  //   );
  // }

  Widget _buildMarketFilters() {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
      child: Row(
        children: [
          Expanded(
            child: SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              child: Row(
                children: _quoteCurrencies.map((quote) {
                  final isSelected = _selectedQuote == quote;
                  return Padding(
                    padding: const EdgeInsets.only(right: 8),
                    child: GestureDetector(
                      onTap: () => _filterByQuote(quote),
                      child: AnimatedContainer(
                        duration: const Duration(milliseconds: 200),
                        padding: const EdgeInsets.symmetric(
                          horizontal: 16,
                          vertical: 8,
                        ),
                        decoration: BoxDecoration(
                          color: isSelected
                              ? theme.colorScheme.primary
                              : isDark
                                  ? Colors.grey[800]
                                  : Colors.grey[100],
                          borderRadius: BorderRadius.circular(20),
                          border: Border.all(
                            color: isSelected
                                ? theme.colorScheme.primary
                                : isDark
                                    ? Colors.grey[700]!
                                    : Colors.grey[300]!,
                            width: 1,
                          ),
                        ),
                        child: Text(
                          quote,
                          textAlign: TextAlign.center,
                          style: TextStyle(
                            color: isSelected
                                ? Colors.white
                                : theme.textTheme.bodyMedium?.color,
                            fontWeight: isSelected
                                ? FontWeight.w600
                                : FontWeight.normal,
                            fontSize: 13,
                          ),
                        ),
                      ),
                    ),
                  );
                }).toList(),
              ),
            ),
          ),
          const SizedBox(width: 8),
          IconButton(
            icon: Icon(
              Icons.search,
              color: theme.textTheme.bodyMedium?.color,
            ),
            onPressed: () {
              showDialog(
                context: context,
                builder: (context) => AlertDialog(
                  title: const Text('Search'),
                  content: TextField(
                    autofocus: true,
                    decoration: const InputDecoration(
                      hintText: 'Search by symbol or name',
                      prefixIcon: Icon(Icons.search),
                    ),
                    onChanged: (value) {
                      if (mounted) {
                        setState(() {
                          _searchQuery = value;
                        });
                        _applySort();
                      }
                    },
                  ),
                  actions: [
                    TextButton(
                      onPressed: () {
                        if (mounted) {
                          setState(() {
                            _searchQuery = '';
                          });
                          _applySort();
                          Navigator.of(context).pop();
                        }
                      },
                      child: const Text('Clear'),
                    ),
                    TextButton(
                      onPressed: () => Navigator.of(context).pop(),
                      child: const Text('Done'),
                    ),
                  ],
                ),
              );
            },
          ),
        ],
      ),
    );
  }

  Widget _buildTableHeader() {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      decoration: BoxDecoration(
        color: isDark ? Colors.grey[900] : Colors.grey[50],
        border: Border(
          bottom: BorderSide(
            color: isDark ? Colors.grey[800]! : Colors.grey[200]!,
            width: 1,
          ),
        ),
      ),
      child: Row(
        children: [
          Expanded(
            flex: 2,
            child: GestureDetector(
              onTap: () => _toggleSort(SortType.currency),
              child: Row(
                children: [
                  Text(
                    'Currency',
                    style: TextStyle(
                      fontWeight: FontWeight.w600,
                      fontSize: 13,
                      color: theme.textTheme.bodySmall?.color,
                    ),
                  ),
                  const SizedBox(width: 4),
                  if (_sortType == SortType.currency)
                    Icon(
                      _sortOrder == SortOrder.ascending
                          ? Icons.arrow_upward
                          : Icons.arrow_downward,
                      size: 14,
                      color: theme.colorScheme.primary,
                    ),
                ],
              ),
            ),
          ),
          Expanded(
            flex: 2,
            child: GestureDetector(
              onTap: () => _toggleSort(SortType.price),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.end,
                children: [
                  Text(
                    'Price',
                    style: TextStyle(
                      fontWeight: FontWeight.w600,
                      fontSize: 13,
                      color: theme.textTheme.bodySmall?.color,
                    ),
                  ),
                  const SizedBox(width: 4),
                  if (_sortType == SortType.price)
                    Icon(
                      _sortOrder == SortOrder.ascending
                          ? Icons.arrow_upward
                          : Icons.arrow_downward,
                      size: 14,
                      color: theme.colorScheme.primary,
                    ),
                ],
              ),
            ),
          ),
          Expanded(
            flex: 2,
            child: GestureDetector(
              onTap: () => _toggleSort(SortType.change),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.end,
                children: [
                  Text(
                    '24h',
                    style: TextStyle(
                      fontWeight: FontWeight.w600,
                      fontSize: 13,
                      color: theme.textTheme.bodySmall?.color,
                    ),
                  ),
                  const SizedBox(width: 4),
                  if (_sortType == SortType.change)
                    Icon(
                      _sortOrder == SortOrder.ascending
                          ? Icons.arrow_upward
                          : Icons.arrow_downward,
                      size: 14,
                      color: theme.colorScheme.primary,
                    ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildCryptoList() {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    
    if (_isLoading) {
      return _buildSkeletonList();
    }

    if (_filteredCoins.isEmpty) {
      return SizedBox(
        height: 300,
        child: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(
                Icons.inbox_outlined,
                size: 48,
                color: theme.textTheme.bodySmall?.color,
              ),
              const SizedBox(height: 16),
              Text(
                'No coins found',
                style: TextStyle(
                  fontSize: 16,
                  color: theme.textTheme.bodySmall?.color,
                ),
              ),
            ],
          ),
        ),
      );
    }

    return ConstrainedBox(
      constraints: const BoxConstraints(maxHeight: 500),
      child: ListView.separated(
        shrinkWrap: true,
        physics: const AlwaysScrollableScrollPhysics(),
        itemCount: _filteredCoins.length,
        separatorBuilder: (context, index) => Divider(
          height: 1,
          thickness: 0.5,
          color: isDark ? Colors.grey[800] : Colors.grey[200],
        ),
        itemBuilder: (context, index) {
          final coin = _filteredCoins[index];
          final isPositive = coin.priceChangePercentage24h >= 0;
          final changeColor = isPositive 
              ? Colors.green 
              : Colors.red;

          return Material(
            color: Colors.transparent,
            child: InkWell(
              onTap: () {
                if (mounted) {
                  Navigator.of(context).pushNamed(
                    '/coin-detail',
                    arguments: {
                      'coin': coin,
                      'quoteCurrency': _selectedQuote,
                    },
                  );
                }
              },
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                child: Row(
                  children: [
                    IconButton(
                      icon: Icon(
                        _favorites.contains('${coin.symbol.toUpperCase()}$_selectedQuote')
                            ? Icons.star
                            : Icons.star_border,
                        color: _favorites.contains('${coin.symbol.toUpperCase()}$_selectedQuote')
                            ? Colors.amber
                            : Colors.grey,
                        size: 20,
                      ),
                      onPressed: () => _toggleFavorite(coin),
                      padding: EdgeInsets.zero,
                      constraints: const BoxConstraints(),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      flex: 2,
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            coin.getPair(_selectedQuote),
                            style: TextStyle(
                              fontWeight: FontWeight.w600,
                              fontSize: 14,
                              color: theme.textTheme.bodyLarge?.color,
                            ),
                          ),
                          if (coin.symbol == 'ZEC')
                            Padding(
                              padding: const EdgeInsets.only(top: 4),
                              child: Wrap(
                                spacing: 4,
                                children: [
                                  Container(
                                    padding: const EdgeInsets.symmetric(
                                      horizontal: 6,
                                      vertical: 2,
                                    ),
                                    decoration: BoxDecoration(
                                      color: Colors.orange.withOpacity(0.1),
                                      borderRadius: BorderRadius.circular(4),
                                    ),
                                    child: Text(
                                      'To be delisted',
                                      style: TextStyle(
                                        fontSize: 10,
                                        color: Colors.orange[700],
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                        ],
                      ),
                    ),
                    Expanded(
                      flex: 2,
                      child: Text(
                        _formatPrice(coin.currentPrice),
                        textAlign: TextAlign.end,
                        style: TextStyle(
                          color: theme.textTheme.bodyLarge?.color,
                          fontWeight: FontWeight.w500,
                          fontSize: 14,
                        ),
                      ),
                    ),
                    Expanded(
                      flex: 2,
                      child: Align(
                        alignment: Alignment.centerRight,
                        child: Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 10,
                            vertical: 5,
                          ),
                          decoration: BoxDecoration(
                            color: changeColor.withOpacity(0.1),
                            borderRadius: BorderRadius.circular(6),
                          ),
                          child: Text(
                            '${isPositive ? '+' : ''}${coin.priceChangePercentage24h.toStringAsFixed(2)}%',
                            textAlign: TextAlign.end,
                            style: TextStyle(
                              color: changeColor,
                              fontWeight: FontWeight.w600,
                              fontSize: 12,
                            ),
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _buildSkeletonList() {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    
    return ListView.separated(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      itemCount: 8,
      separatorBuilder: (context, index) => Divider(
        height: 1,
        thickness: 0.5,
        color: isDark ? Colors.grey[800] : Colors.grey[200],
      ),
      itemBuilder: (context, index) {
        return Container(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
          child: Row(
            children: [
              Expanded(
                flex: 2,
                child: SkeletonBox(width: double.infinity, height: 16),
              ),
              const SizedBox(width: 12),
              Expanded(
                flex: 2,
                child: SkeletonBox(width: double.infinity, height: 16),
              ),
              const SizedBox(width: 12),
              Expanded(
                flex: 2,
                child: SkeletonBox(width: double.infinity, height: 16),
              ),
            ],
          ),
        );
      },
    );
  }
}
