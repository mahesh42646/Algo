import 'package:flutter/material.dart';
import '../models/crypto_coin.dart';
import '../services/crypto_service.dart';

enum SortType { currency, price, change }
enum SortOrder { ascending, descending }

class CryptoListWidget extends StatefulWidget {
  const CryptoListWidget({super.key});

  @override
  State<CryptoListWidget> createState() => _CryptoListWidgetState();
}

class _CryptoListWidgetState extends State<CryptoListWidget> {
  final CryptoService _cryptoService = CryptoService();
  List<CryptoCoin> _allCoins = [];
  List<CryptoCoin> _filteredCoins = [];
  bool _isLoading = true;
  bool _isLoadingData = false; // Prevent duplicate calls
  String _selectedQuote = 'USDT';
  SortType _sortType = SortType.currency;
  SortOrder _sortOrder = SortOrder.ascending;
  String _searchQuery = '';

  final List<String> _quoteCurrencies = ['USDT', 'BTC', 'ETH', 'USDC'];

  @override
  void initState() {
    super.initState();
    // Load data after the first frame to ensure widget is fully built
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _loadCryptoData();
    });
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
      print('[CRYPTO WIDGET] Loading data for quote: $_selectedQuote');
      final coins = await _cryptoService.getCoinsByQuoteCurrency(_selectedQuote);
      if (mounted) {
        setState(() {
          _allCoins = coins;
          _filteredCoins = coins;
          _isLoading = false;
          _isLoadingData = false;
        });
        _applySort();
        print('[CRYPTO WIDGET] ✅ Successfully loaded ${coins.length} coins');
      }
    } catch (e) {
      print('[CRYPTO WIDGET] ❌ Error loading data: $e');
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
    if (_selectedQuote == quote && _allCoins.isNotEmpty) {
      // Already selected and has data, just apply filter
      return;
    }
    setState(() {
      _selectedQuote = quote;
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
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 10, vertical: 12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.grey[200]!),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // _buildHeader(),
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
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 0),
      child: Row(
        children: [
          ..._quoteCurrencies.map((quote) => Expanded(
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 4),
                  child: GestureDetector(
                    onTap: () => _filterByQuote(quote),
                    child: Container(
                      padding: const EdgeInsets.symmetric(vertical: 8),
                      decoration: BoxDecoration(
                        color: _selectedQuote == quote
                            ? Theme.of(context).colorScheme.primary
                            : Colors.transparent,
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Text(
                        quote,
                        textAlign: TextAlign.center,
                        style: TextStyle(
                          color: _selectedQuote == quote
                              ? Colors.white
                              : Colors.grey[700],
                          fontWeight: _selectedQuote == quote
                              ? FontWeight.w600
                              : FontWeight.normal,
                        ),
                      ),
                    ),
                  ),
                ),
              )),
          IconButton(
            icon: const Icon(Icons.search),
            onPressed: () {
              showDialog(
                context: context,
                builder: (context) => AlertDialog(
                  title: const Text('Search'),
                  content: TextField(
                    autofocus: true,
                    decoration: const InputDecoration(
                      hintText: 'Search by symbol or name',
                    ),
                    onChanged: (value) {
                      setState(() {
                        _searchQuery = value;
                      });
                      _applySort();
                    },
                  ),
                  actions: [
                    TextButton(
                      onPressed: () {
                        setState(() {
                          _searchQuery = '';
                        });
                        _applySort();
                        Navigator.of(context).pop();
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
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        border: Border(
          bottom: BorderSide(color: Colors.grey[200]!),
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
                  const Text(
                    'Currency',
                    style: TextStyle(
                      fontWeight: FontWeight.w600,
                      fontSize: 14,
                    ),
                  ),
                  if (_sortType == SortType.currency)
                    Icon(
                      _sortOrder == SortOrder.ascending
                          ? Icons.arrow_upward
                          : Icons.arrow_downward,
                      size: 16,
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
                  const Text(
                    'Last Price',
                    style: TextStyle(
                      fontWeight: FontWeight.w600,
                      fontSize: 14,
                    ),
                  ),
                  if (_sortType == SortType.price)
                    Icon(
                      _sortOrder == SortOrder.ascending
                          ? Icons.arrow_upward
                          : Icons.arrow_downward,
                      size: 16,
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
                  const Text(
                    '24h Change',
                    style: TextStyle(
                      fontWeight: FontWeight.w600,
                      fontSize: 14,
                    ),
                  ),
                  if (_sortType == SortType.change)
                    Icon(
                      _sortOrder == SortOrder.ascending
                          ? Icons.arrow_upward
                          : Icons.arrow_downward,
                      size: 16,
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
    if (_isLoading) {
      return const SizedBox(
        height: 200,
        child: Center(child: CircularProgressIndicator()),
      );
    }

    if (_filteredCoins.isEmpty) {
      return const SizedBox(
        height: 200,
        child: Center(child: Text('No coins found')),
      );
    }

    return SizedBox(
      height: 400,
      child: ListView.builder(
        itemCount: _filteredCoins.length,
        itemBuilder: (context, index) {
          final coin = _filteredCoins[index];
          final isPositive = coin.priceChangePercentage24h >= 0;
          final priceColor = isPositive ? Colors.green : Colors.red;
          final changeColor = isPositive ? Colors.green : Colors.red;

          return InkWell(
            onTap: () {
              Navigator.of(context).pushNamed(
                '/coin-detail',
                arguments: {
                  'coin': coin,
                  'quoteCurrency': _selectedQuote,
                },
              );
            },
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              decoration: BoxDecoration(
                border: Border(
                  bottom: BorderSide(
                    color: Colors.grey[100]!,
                    width: 0.5,
                  ),
                ),
              ),
              child: Row(
              children: [
                Expanded(
                  flex: 2,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        coin.getPair(_selectedQuote),
                        style: const TextStyle(
                          fontWeight: FontWeight.bold,
                          fontSize: 14,
                        ),
                      ),
                      if (coin.symbol == 'ZEC')
                        Wrap(
                          spacing: 4,
                          children: [
                            Container(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 6,
                                vertical: 2,
                              ),
                              decoration: BoxDecoration(
                                color: Colors.orange[50],
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
                            Container(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 6,
                                vertical: 2,
                              ),
                              decoration: BoxDecoration(
                                color: Colors.red[50],
                                borderRadius: BorderRadius.circular(4),
                              ),
                              child: Text(
                                'Monitoring',
                                style: TextStyle(
                                  fontSize: 10,
                                  color: Colors.red[700],
                                ),
                              ),
                            ),
                          ],
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
                      color: priceColor,
                      fontWeight: FontWeight.w500,
                      fontSize: 14,
                    ),
                  ),
                ),
                Expanded(
                  flex: 2,
                  child: Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 8,
                      vertical: 4,
                    ),
                    decoration: BoxDecoration(
                      color: isPositive ? Colors.green[50] : Colors.red[50],
                      borderRadius: BorderRadius.circular(4),
                    ),
                    child: Text(
                      '${isPositive ? '+' : ''}${coin.priceChangePercentage24h.toStringAsFixed(2)}%',
                      textAlign: TextAlign.end,
                      style: TextStyle(
                        color: isPositive ? Colors.green[700] : Colors.red[700],
                        fontWeight: FontWeight.w500,
                        fontSize: 12,
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
          );
        },
      ),
    );
  }
}
