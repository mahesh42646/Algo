import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../services/exchange_service.dart';

class TradingWidget extends StatefulWidget {
  final String symbol;
  final String baseAsset;
  final String quoteAsset;
  final double currentPrice;

  const TradingWidget({
    super.key,
    required this.symbol,
    required this.baseAsset,
    required this.quoteAsset,
    required this.currentPrice,
  });

  @override
  State<TradingWidget> createState() => _TradingWidgetState();
}

class _TradingWidgetState extends State<TradingWidget> with SingleTickerProviderStateMixin {
  final ExchangeService _exchangeService = ExchangeService();
  late TabController _tabController;
  
  final TextEditingController _priceController = TextEditingController();
  final TextEditingController _amountController = TextEditingController();
  final TextEditingController _totalController = TextEditingController();
  
  String _orderType = 'LIMIT'; // LIMIT or MARKET
  bool _isLoading = false;
  bool _isApiLinked = false;
  List<ExchangeBalance> _balances = [];
  double _availableBase = 0;
  double _availableQuote = 0;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    _priceController.text = widget.currentPrice.toStringAsFixed(4);
    _checkApiStatus();
  }

  @override
  void dispose() {
    _tabController.dispose();
    _priceController.dispose();
    _amountController.dispose();
    _totalController.dispose();
    super.dispose();
  }

  Future<void> _checkApiStatus() async {
    try {
      final isLinked = await _exchangeService.isPlatformLinked('binance');
      setState(() => _isApiLinked = isLinked);
      
      if (isLinked) {
        await _loadBalances();
      }
    } catch (e) {
      print('Error checking API status: $e');
    }
  }

  Future<void> _loadBalances() async {
    try {
      final balances = await _exchangeService.getBalance('binance');
      setState(() {
        _balances = balances;
        _availableBase = balances
            .firstWhere((b) => b.asset == widget.baseAsset, 
                orElse: () => ExchangeBalance(asset: '', free: 0, locked: 0, total: 0))
            .free;
        _availableQuote = balances
            .firstWhere((b) => b.asset == widget.quoteAsset,
                orElse: () => ExchangeBalance(asset: '', free: 0, locked: 0, total: 0))
            .free;
      });
    } catch (e) {
      print('Error loading balances: $e');
    }
  }

  void _calculateTotal() {
    final price = double.tryParse(_priceController.text) ?? 0;
    final amount = double.tryParse(_amountController.text) ?? 0;
    _totalController.text = (price * amount).toStringAsFixed(4);
  }

  void _calculateAmount() {
    final price = double.tryParse(_priceController.text) ?? 0;
    final total = double.tryParse(_totalController.text) ?? 0;
    if (price > 0) {
      _amountController.text = (total / price).toStringAsFixed(6);
    }
  }

  void _setPercentage(double percentage, bool isBuy) {
    if (isBuy) {
      final total = _availableQuote * percentage;
      _totalController.text = total.toStringAsFixed(4);
      _calculateAmount();
    } else {
      final amount = _availableBase * percentage;
      _amountController.text = amount.toStringAsFixed(6);
      _calculateTotal();
    }
  }

  Future<void> _placeOrder(String side) async {
    if (!_isApiLinked) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please link your Binance API first'),
          backgroundColor: Colors.orange,
        ),
      );
      return;
    }

    final amount = double.tryParse(_amountController.text);
    final price = double.tryParse(_priceController.text);

    if (amount == null || amount <= 0) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please enter a valid amount')),
      );
      return;
    }

    if (_orderType == 'LIMIT' && (price == null || price <= 0)) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please enter a valid price')),
      );
      return;
    }

    setState(() => _isLoading = true);

    try {
      final result = await _exchangeService.placeOrder(
        platform: 'binance',
        symbol: widget.symbol,
        side: side,
        type: _orderType,
        quantity: amount,
        price: _orderType == 'LIMIT' ? price : null,
      );

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Order placed! ID: ${result.orderId}'),
            backgroundColor: Colors.green,
          ),
        );

        // Clear inputs
        _amountController.clear();
        _totalController.clear();
        
        // Reload balances
        await _loadBalances();
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Order failed: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    if (!_isApiLinked) {
      return _buildLinkApiPrompt();
    }

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Theme.of(context).cardColor,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.grey[300]!),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _buildHeader(),
          const SizedBox(height: 16),
          _buildOrderTypeSelector(),
          const SizedBox(height: 16),
          TabBar(
            controller: _tabController,
            tabs: [
              Tab(
                child: Text(
                  'Buy ${widget.baseAsset}',
                  style: const TextStyle(color: Colors.green, fontWeight: FontWeight.bold),
                ),
              ),
              Tab(
                child: Text(
                  'Sell ${widget.baseAsset}',
                  style: const TextStyle(color: Colors.red, fontWeight: FontWeight.bold),
                ),
              ),
            ],
            indicatorColor: _tabController.index == 0 ? Colors.green : Colors.red,
          ),
          const SizedBox(height: 16),
          SizedBox(
            height: 280,
            child: TabBarView(
              controller: _tabController,
              children: [
                _buildOrderForm(true),
                _buildOrderForm(false),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildLinkApiPrompt() {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: Colors.blue.withOpacity(0.1),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.blue.withOpacity(0.3)),
      ),
      child: Column(
        children: [
          const Icon(Icons.link_off, size: 48, color: Colors.blue),
          const SizedBox(height: 16),
          const Text(
            'Link Your Exchange API',
            style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 8),
          Text(
            'Connect your Binance account to start trading',
            style: TextStyle(color: Colors.grey[600]),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 16),
          ElevatedButton.icon(
            onPressed: () {
              Navigator.pushNamed(context, '/api-binding');
            },
            icon: const Icon(Icons.link),
            label: const Text('Link API'),
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.blue,
              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildHeader() {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          'Trade ${widget.baseAsset}/${widget.quoteAsset}',
          style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
        ),
        IconButton(
          icon: const Icon(Icons.refresh),
          onPressed: _loadBalances,
          tooltip: 'Refresh Balance',
        ),
      ],
    );
  }

  Widget _buildOrderTypeSelector() {
    return Row(
      children: [
        _buildOrderTypeButton('LIMIT', 'Limit'),
        const SizedBox(width: 8),
        _buildOrderTypeButton('MARKET', 'Market'),
      ],
    );
  }

  Widget _buildOrderTypeButton(String type, String label) {
    final isSelected = _orderType == type;
    return GestureDetector(
      onTap: () => setState(() => _orderType = type),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        decoration: BoxDecoration(
          color: isSelected ? Theme.of(context).colorScheme.primary : Colors.grey[200],
          borderRadius: BorderRadius.circular(8),
        ),
        child: Text(
          label,
          style: TextStyle(
            color: isSelected ? Colors.white : Colors.grey[700],
            fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
          ),
        ),
      ),
    );
  }

  Widget _buildOrderForm(bool isBuy) {
    final availableLabel = isBuy 
        ? 'Available: ${_availableQuote.toStringAsFixed(4)} ${widget.quoteAsset}'
        : 'Available: ${_availableBase.toStringAsFixed(6)} ${widget.baseAsset}';

    return SingleChildScrollView(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            availableLabel,
            style: TextStyle(color: Colors.grey[600], fontSize: 12),
          ),
          const SizedBox(height: 12),
          if (_orderType == 'LIMIT') ...[
            _buildInputField(
              controller: _priceController,
              label: 'Price',
              suffix: widget.quoteAsset,
              onChanged: (_) => _calculateTotal(),
            ),
            const SizedBox(height: 12),
          ],
          _buildInputField(
            controller: _amountController,
            label: 'Amount',
            suffix: widget.baseAsset,
            onChanged: (_) => _calculateTotal(),
          ),
          const SizedBox(height: 8),
          _buildPercentageButtons(isBuy),
          const SizedBox(height: 12),
          _buildInputField(
            controller: _totalController,
            label: 'Total',
            suffix: widget.quoteAsset,
            onChanged: (_) => _calculateAmount(),
          ),
          const SizedBox(height: 16),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: _isLoading ? null : () => _placeOrder(isBuy ? 'BUY' : 'SELL'),
              style: ElevatedButton.styleFrom(
                backgroundColor: isBuy ? Colors.green : Colors.red,
                padding: const EdgeInsets.symmetric(vertical: 16),
              ),
              child: _isLoading
                  ? const SizedBox(
                      width: 20,
                      height: 20,
                      child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                    )
                  : Text(
                      isBuy ? 'Buy ${widget.baseAsset}' : 'Sell ${widget.baseAsset}',
                      style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                    ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildInputField({
    required TextEditingController controller,
    required String label,
    required String suffix,
    required Function(String) onChanged,
  }) {
    return TextField(
      controller: controller,
      keyboardType: const TextInputType.numberWithOptions(decimal: true),
      inputFormatters: [
        FilteringTextInputFormatter.allow(RegExp(r'^\d*\.?\d*')),
      ],
      decoration: InputDecoration(
        labelText: label,
        suffixText: suffix,
        border: const OutlineInputBorder(),
        contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      ),
      onChanged: onChanged,
    );
  }

  Widget _buildPercentageButtons(bool isBuy) {
    return Row(
      children: [25, 50, 75, 100].map((percent) {
        return Expanded(
          child: GestureDetector(
            onTap: () => _setPercentage(percent / 100, isBuy),
            child: Container(
              margin: const EdgeInsets.symmetric(horizontal: 2),
              padding: const EdgeInsets.symmetric(vertical: 6),
              decoration: BoxDecoration(
                color: Colors.grey[200],
                borderRadius: BorderRadius.circular(4),
              ),
              child: Text(
                '$percent%',
                textAlign: TextAlign.center,
                style: TextStyle(fontSize: 12, color: Colors.grey[700]),
              ),
            ),
          ),
        );
      }).toList(),
    );
  }
}
