import 'package:flutter/material.dart';
import '../models/crypto_coin.dart';
import '../services/crypto_service.dart';
import '../services/favorites_service.dart';
import '../screens/coin_detail_screen.dart';

enum SearchSortType { volume, price, change }

class CoinSearchPopup extends StatefulWidget {
  const CoinSearchPopup({
    super.key,
    required this.initialQuote,
    required this.initialCoins,
    required this.favorites,
    required this.onClosed,
  });

  final String initialQuote;
  final List<CryptoCoin> initialCoins;
  final Set<String> favorites;
  final VoidCallback onClosed;

  @override
  State<CoinSearchPopup> createState() => _CoinSearchPopupState();
}

class _CoinSearchPopupState extends State<CoinSearchPopup> {
  final CryptoService _cryptoService = CryptoService();
  final FavoritesService _favoritesService = FavoritesService();
  final TextEditingController _searchController = TextEditingController();
  final FocusNode _focusNode = FocusNode();

  List<String> _quoteCurrencies = ['USDT', 'BTC', 'ETH', 'USDC'];
  late String _selectedQuote;
  List<CryptoCoin> _allCoins = [];
  bool _loading = false;
  SearchSortType _sortType = SearchSortType.volume;
  bool _sortAsc = false;
  Set<String> _favorites = {};

  @override
  void initState() {
    super.initState();
    _selectedQuote = widget.initialQuote;
    _allCoins = List.from(widget.initialCoins);
    _favorites = Set.from(widget.favorites);
    _applySort();
  }

  @override
  void dispose() {
    _searchController.dispose();
    _focusNode.dispose();
    super.dispose();
  }

  List<CryptoCoin> get _filteredCoins {
    final query = _searchController.text.trim().toLowerCase();
    var list = List<CryptoCoin>.from(_allCoins);
    if (query.isNotEmpty) {
      list = list.where((c) {
        return c.symbol.toLowerCase().contains(query) ||
            c.name.toLowerCase().contains(query);
      }).toList();
    }
    list.sort((a, b) {
      int cmp;
      switch (_sortType) {
        case SearchSortType.volume:
          cmp = b.volume24h.compareTo(a.volume24h);
          break;
        case SearchSortType.price:
          cmp = a.currentPrice.compareTo(b.currentPrice);
          break;
        case SearchSortType.change:
          cmp = a.priceChangePercentage24h.compareTo(b.priceChangePercentage24h);
          break;
      }
      return _sortAsc ? -cmp : cmp;
    });
    return list;
  }

  void _applySort() => setState(() {});

  Future<void> _loadForQuote(String quote) async {
    setState(() => _loading = true);
    try {
      final coins = await _cryptoService.getCoinsByQuoteCurrency(quote);
      if (mounted) setState(() {
        _allCoins = coins;
        _loading = false;
      });
    } catch (_) {
      if (mounted) setState(() => _loading = false);
    }
  }

  void _filterByQuote(String quote) {
    if (quote == _selectedQuote) return;
    setState(() => _selectedQuote = quote);
    _loadForQuote(quote);
  }

  bool _isFavorite(CryptoCoin coin) {
    return _favorites.contains('${coin.symbol.toUpperCase()}$_selectedQuote');
  }

  Future<void> _toggleFavorite(CryptoCoin coin) async {
    await _favoritesService.toggleFavorite(coin.symbol, _selectedQuote);
    final pair = '${coin.symbol.toUpperCase()}$_selectedQuote';
    if (mounted) setState(() {
      if (_favorites.contains(pair)) {
        _favorites = Set.from(_favorites)..remove(pair);
      } else {
        _favorites = Set.from(_favorites)..add(pair);
      }
    });
  }

  void _openDetail(CryptoCoin coin) {
    widget.onClosed();
    Navigator.of(context).pop();
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (_) => CoinDetailScreen(
          coin: coin,
          quoteCurrency: _selectedQuote,
        ),
      ),
    );
  }

  String _formatPrice(double price) {
    if (price >= 1000) {
      return price.toStringAsFixed(2).replaceAllMapped(
          RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'), (Match m) => '${m[1]},');
    } else if (price >= 1) {
      return price.toStringAsFixed(2);
    }
    return price.toStringAsFixed(6);
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final list = _filteredCoins;
    final isDark = theme.brightness == Brightness.dark;

    return Material(
      color: theme.scaffoldBackgroundColor,
      child: SafeArea(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 12, 8, 8),
              child: Row(
                children: [
                  Expanded(
                    child: TextField(
                      controller: _searchController,
                      focusNode: _focusNode,
                      autofocus: true,
                      onChanged: (_) => _applySort(),
                      decoration: InputDecoration(
                        hintText: 'Search by symbol or name',
                        prefixIcon: const Icon(Icons.search),
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                        filled: true,
                        fillColor: isDark ? Colors.grey[850] : Colors.grey[100],
                        contentPadding: const EdgeInsets.symmetric(
                          horizontal: 16,
                          vertical: 12,
                        ),
                      ),
                    ),
                  ),
                  IconButton(
                    icon: const Icon(Icons.close),
                    onPressed: () {
                      widget.onClosed();
                      Navigator.of(context).pop();
                    },
                  ),
                ],
              ),
            ),
            SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              child: Row(
                children: [
                  ..._quoteCurrencies.map((q) {
                    final selected = _selectedQuote == q;
                    return Padding(
                      padding: const EdgeInsets.only(right: 8),
                      child: FilterChip(
                        label: Text(q),
                        selected: selected,
                        onSelected: (_) => _filterByQuote(q),
                        selectedColor: theme.colorScheme.primaryContainer,
                      ),
                    );
                  }),
                  const SizedBox(width: 16),
                  FilterChip(
                    label: const Text('Vol'),
                    selected: _sortType == SearchSortType.volume,
                    onSelected: (_) {
                      setState(() {
                        _sortType = SearchSortType.volume;
                        _sortAsc = false;
                      });
                    },
                    selectedColor: theme.colorScheme.primaryContainer,
                  ),
                  const SizedBox(width: 8),
                  FilterChip(
                    label: const Text('Price'),
                    selected: _sortType == SearchSortType.price,
                    onSelected: (_) {
                      setState(() {
                        _sortType = SearchSortType.price;
                        _sortAsc = _sortType == SearchSortType.price && !_sortAsc;
                      });
                    },
                    selectedColor: theme.colorScheme.primaryContainer,
                  ),
                  const SizedBox(width: 8),
                  FilterChip(
                    label: const Text('24h%'),
                    selected: _sortType == SearchSortType.change,
                    onSelected: (_) {
                      setState(() {
                        _sortType = SearchSortType.change;
                        _sortAsc = false;
                      });
                    },
                    selectedColor: theme.colorScheme.primaryContainer,
                  ),
                ],
              ),
            ),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
              child: Text(
                _searchController.text.isEmpty
                    ? 'Top by volume · $_selectedQuote'
                    : '${list.length} results',
                style: theme.textTheme.bodySmall?.copyWith(
                  color: theme.colorScheme.onSurfaceVariant,
                ),
              ),
            ),
            const Divider(height: 1),
            Expanded(
              child: _loading
                  ? const Center(child: CircularProgressIndicator())
                  : list.isEmpty
                      ? Center(
                          child: Column(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(
                                Icons.search_off,
                                size: 48,
                                color: theme.colorScheme.outline,
                              ),
                              const SizedBox(height: 16),
                              Text(
                                _searchController.text.isEmpty
                                    ? 'No coins for $_selectedQuote'
                                    : 'No matches',
                                style: theme.textTheme.bodyLarge?.copyWith(
                                  color: theme.colorScheme.onSurfaceVariant,
                                ),
                              ),
                            ],
                          ),
                        )
                      : ListView.builder(
                          padding: EdgeInsets.zero,
                          itemCount: list.length,
                          itemBuilder: (context, index) {
                            final coin = list[index];
                            final isPos = coin.priceChangePercentage24h >= 0;
                            final changeColor =
                                isPos ? Colors.green : Colors.red;
                            final isFav = _isFavorite(coin);

                            return Material(
                              color: Colors.transparent,
                              child: InkWell(
                                onTap: () => _openDetail(coin),
                                child: Padding(
                                  padding: const EdgeInsets.symmetric(
                                    horizontal: 16,
                                    vertical: 12,
                                  ),
                                  child: Row(
                                    children: [
                                      Expanded(
                                        flex: 2,
                                        child: Column(
                                          crossAxisAlignment:
                                              CrossAxisAlignment.start,
                                          mainAxisSize: MainAxisSize.min,
                                          children: [
                                            Text(
                                              '${coin.symbol}/$_selectedQuote',
                                              style: theme.textTheme
                                                  .bodyMedium
                                                  ?.copyWith(
                                                    fontWeight:
                                                        FontWeight.w600,
                                                  ),
                                              maxLines: 1,
                                              overflow: TextOverflow.ellipsis,
                                            ),
                                            Text(
                                              _formatPrice(coin.currentPrice),
                                              style: theme.textTheme
                                                  .bodySmall
                                                  ?.copyWith(
                                                    color: theme
                                                        .colorScheme
                                                        .onSurfaceVariant,
                                                  ),
                                              maxLines: 1,
                                              overflow: TextOverflow.ellipsis,
                                            ),
                                          ],
                                        ),
                                      ),
                                      Container(
                                        padding: const EdgeInsets.symmetric(
                                          horizontal: 8,
                                          vertical: 4,
                                        ),
                                        decoration: BoxDecoration(
                                          color: changeColor.withOpacity(0.15),
                                          borderRadius:
                                              BorderRadius.circular(8),
                                        ),
                                        child: Text(
                                          '${isPos ? '+' : ''}${coin.priceChangePercentage24h.toStringAsFixed(2)}%',
                                          style: TextStyle(
                                            color: changeColor,
                                            fontWeight: FontWeight.w600,
                                            fontSize: 12,
                                          ),
                                        ),
                                      ),
                                      const SizedBox(width: 8),
                                      IconButton(
                                        icon: Icon(
                                          isFav
                                              ? Icons.star
                                              : Icons.star_border,
                                          color: isFav
                                              ? Colors.amber
                                              : theme.colorScheme
                                                  .onSurfaceVariant,
                                          size: 22,
                                        ),
                                        onPressed: () => _toggleFavorite(coin),
                                        tooltip: isFav
                                            ? 'Remove from favorites'
                                            : 'Add to favorites',
                                      ),
                                    ],
                                  ),
                                ),
                              ),
                            );
                          },
                        ),
            ),
          ],
        ),
      ),
    );
  }
}
