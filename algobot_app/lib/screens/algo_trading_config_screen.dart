import 'package:flutter/material.dart';
import '../models/crypto_coin.dart';
import '../services/algo_trading_service.dart';
import '../services/exchange_service.dart';

class AlgoTradingConfigScreen extends StatefulWidget {
  final CryptoCoin coin;
  final String quoteCurrency;

  const AlgoTradingConfigScreen({
    super.key,
    required this.coin,
    required this.quoteCurrency,
  });

  @override
  State<AlgoTradingConfigScreen> createState() => _AlgoTradingConfigScreenState();
}

class _AlgoTradingConfigScreenState extends State<AlgoTradingConfigScreen> {
  final _formKey = GlobalKey<FormState>();
  final AlgoTradingService _algoService = AlgoTradingService();
  final ExchangeService _exchangeService = ExchangeService();

  // Form controllers
  final TextEditingController _maxLossPerTradeController = TextEditingController(text: '3.0');
  final TextEditingController _maxLossOverallController = TextEditingController(text: '3.0');
  final TextEditingController _maxProfitBookController = TextEditingController(text: '3.0');
  final TextEditingController _amountPerLevelController = TextEditingController(text: '10.0');
  final TextEditingController _numberOfLevelsController = TextEditingController(text: '10');

  bool _acceptedTerms = false;
  bool _isLoading = false;
  bool _hasActiveTrade = false;

  @override
  void initState() {
    super.initState();
    _checkActiveTrade();
  }

  Future<void> _checkActiveTrade() async {
    try {
      final symbol = '${widget.coin.symbol}${widget.quoteCurrency}';
      final status = await _algoService.getTradeStatus(symbol);
      if (mounted) {
        setState(() {
          _hasActiveTrade = status['isActive'] == true;
        });
      }
    } catch (e) {
      // No active trade or error
    }
  }

  @override
  void dispose() {
    _maxLossPerTradeController.dispose();
    _maxLossOverallController.dispose();
    _maxProfitBookController.dispose();
    _amountPerLevelController.dispose();
    _numberOfLevelsController.dispose();
    super.dispose();
  }

  Future<void> _startAlgoTrading() async {
    if (!_formKey.currentState!.validate()) {
      return;
    }

    if (!_acceptedTerms) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please accept the terms and conditions'),
          backgroundColor: Colors.red,
        ),
      );
      return;
    }

    setState(() {
      _isLoading = true;
    });

    try {
      final symbol = '${widget.coin.symbol}${widget.quoteCurrency}';
      
      await _algoService.startAlgoTrade(
        symbol: symbol,
        maxLossPerTrade: double.parse(_maxLossPerTradeController.text),
        maxLossOverall: double.parse(_maxLossOverallController.text),
        maxProfitBook: double.parse(_maxProfitBookController.text),
        amountPerLevel: double.parse(_amountPerLevelController.text),
        numberOfLevels: int.parse(_numberOfLevelsController.text),
      );

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Algo trading started successfully!'),
            backgroundColor: Colors.green,
          ),
        );
        Navigator.pop(context);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error: ${e.toString()}'),
            backgroundColor: Colors.red,
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Algo Trading - ${widget.coin.symbol}/${widget.quoteCurrency}'),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              if (_hasActiveTrade)
                Container(
                  padding: const EdgeInsets.all(12),
                  margin: const EdgeInsets.only(bottom: 16),
                  decoration: BoxDecoration(
                    color: Colors.orange.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: Colors.orange),
                  ),
                  child: Row(
                    children: [
                      const Icon(Icons.warning, color: Colors.orange),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          'You have an active algo trade for this pair. Starting a new one will stop the existing trade.',
                          style: TextStyle(color: Colors.orange[800]),
                        ),
                      ),
                    ],
                  ),
                ),
              
              _buildInfoCard(),
              const SizedBox(height: 24),
              
              Text(
                'Trading Parameters',
                style: Theme.of(context).textTheme.titleLarge?.copyWith(
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 16),
              
              _buildTextField(
                controller: _maxLossPerTradeController,
                label: 'Max Loss Per Trade (%)',
                hint: 'e.g., 3.0',
                icon: Icons.trending_down,
                validator: (value) {
                  if (value == null || value.isEmpty) {
                    return 'Please enter max loss per trade';
                  }
                  final val = double.tryParse(value);
                  if (val == null || val <= 0 || val > 100) {
                    return 'Enter a value between 0.1 and 100';
                  }
                  return null;
                },
              ),
              const SizedBox(height: 16),
              
              _buildTextField(
                controller: _maxLossOverallController,
                label: 'Max Loss Overall (%)',
                hint: 'e.g., 3.0',
                icon: Icons.warning,
                validator: (value) {
                  if (value == null || value.isEmpty) {
                    return 'Please enter max loss overall';
                  }
                  final val = double.tryParse(value);
                  if (val == null || val <= 0 || val > 100) {
                    return 'Enter a value between 0.1 and 100';
                  }
                  return null;
                },
              ),
              const SizedBox(height: 16),
              
              _buildTextField(
                controller: _maxProfitBookController,
                label: 'Max Profit Book (%)',
                hint: 'e.g., 3.0',
                icon: Icons.trending_up,
                validator: (value) {
                  if (value == null || value.isEmpty) {
                    return 'Please enter max profit book';
                  }
                  final val = double.tryParse(value);
                  if (val == null || val <= 0 || val > 100) {
                    return 'Enter a value between 0.1 and 100';
                  }
                  return null;
                },
              ),
              const SizedBox(height: 16),
              
              _buildTextField(
                controller: _amountPerLevelController,
                label: 'Amount Per Level (\$)',
                hint: 'e.g., 10.0',
                icon: Icons.attach_money,
                validator: (value) {
                  if (value == null || value.isEmpty) {
                    return 'Please enter amount per level';
                  }
                  final val = double.tryParse(value);
                  if (val == null || val <= 0) {
                    return 'Enter a positive amount';
                  }
                  return null;
                },
              ),
              const SizedBox(height: 16),
              
              _buildTextField(
                controller: _numberOfLevelsController,
                label: 'Number of Levels',
                hint: 'e.g., 10',
                icon: Icons.layers,
                validator: (value) {
                  if (value == null || value.isEmpty) {
                    return 'Please enter number of levels';
                  }
                  final val = int.tryParse(value);
                  if (val == null || val <= 0 || val > 50) {
                    return 'Enter a value between 1 and 50';
                  }
                  return null;
                },
              ),
              const SizedBox(height: 24),
              
              _buildTermsCheckbox(),
              const SizedBox(height: 24),
              
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: _isLoading ? null : _startAlgoTrading,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Theme.of(context).colorScheme.primary,
                    padding: const EdgeInsets.symmetric(vertical: 16),
                  ),
                  child: _isLoading
                      ? const SizedBox(
                          height: 20,
                          width: 20,
                          child: CircularProgressIndicator(strokeWidth: 2),
                        )
                      : const Text(
                          'Start Algo Trading',
                          style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                        ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildInfoCard() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.primary.withOpacity(0.1),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(
          color: Theme.of(context).colorScheme.primary.withOpacity(0.3),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(
                Icons.info_outline,
                color: Theme.of(context).colorScheme.primary,
              ),
              const SizedBox(width: 8),
              Text(
                'How It Works',
                style: TextStyle(
                  fontWeight: FontWeight.bold,
                  color: Theme.of(context).colorScheme.primary,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Text(
            '• The algorithm places limit orders based on strong technical indicator signals\n'
            '• If loss hits your "Max Loss Per Trade" (e.g., 3%), it adds more funds (Amount Per Level)\n'
            '• If profit hits your "Max Profit Book" (e.g., 3%), it books profit and stops\n'
            '• If max levels are reached, it books overall loss and stops',
            style: TextStyle(
              fontSize: 12,
              color: Colors.grey[700],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTextField({
    required TextEditingController controller,
    required String label,
    required String hint,
    required IconData icon,
    required String? Function(String?) validator,
  }) {
    return TextFormField(
      controller: controller,
      decoration: InputDecoration(
        labelText: label,
        hintText: hint,
        prefixIcon: Icon(icon),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
        ),
      ),
      keyboardType: TextInputType.number,
      validator: validator,
    );
  }

  Widget _buildTermsCheckbox() {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        border: Border.all(color: Colors.grey[300]!),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Checkbox(
            value: _acceptedTerms,
            onChanged: (value) {
              setState(() {
                _acceptedTerms = value ?? false;
              });
            },
          ),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Terms and Conditions',
                  style: TextStyle(
                    fontWeight: FontWeight.bold,
                    fontSize: 14,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  'I understand that algorithmic trading involves risks. I accept full responsibility for all trades executed by this algorithm. The algorithm will automatically place orders based on technical indicators and my configured parameters.',
                  style: TextStyle(
                    fontSize: 12,
                    color: Colors.grey[600],
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
