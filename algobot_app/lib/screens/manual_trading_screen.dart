import 'package:flutter/material.dart';
import '../models/crypto_coin.dart';
import '../services/exchange_service.dart';
import '../services/algo_trading_service.dart';
import '../services/user_service.dart';
import '../services/auth_service.dart';

class ManualTradingScreen extends StatefulWidget {
  final CryptoCoin coin;
  final String quoteCurrency;

  const ManualTradingScreen({
    super.key,
    required this.coin,
    required this.quoteCurrency,
  });

  @override
  State<ManualTradingScreen> createState() => _ManualTradingScreenState();
}

class _ManualTradingScreenState extends State<ManualTradingScreen> {
  final _formKey = GlobalKey<FormState>();
  final AlgoTradingService _algoService = AlgoTradingService();
  final ExchangeService _exchangeService = ExchangeService();
  final UserService _userService = UserService();
  final AuthService _authService = AuthService();

  // Form controllers
  final TextEditingController _amountPerLevelController = TextEditingController(text: '10.0');
  final TextEditingController _numberOfLevelsController = TextEditingController(text: '5');

  bool _isLoading = false;
  bool _isValidating = false;
  
  // API and balance data
  List<ExchangeApi> _availableApis = [];
  ExchangeApi? _selectedApi;
  Map<String, dynamic>? _apiBalance;
  double _platformWalletBalance = 0.0;
  String? _validationError;
  Map<String, dynamic>? _validationDetails;

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    setState(() {
      _isLoading = true;
    });

    try {
      // Load available APIs
      final apis = await _exchangeService.getLinkedApis();
      final activeApis = apis.where((api) => api.isActive).toList();
      
      // Load platform wallet balance
      double platformWalletBalance = 0.0;
      final userId = _authService.currentUser?.uid;
      if (userId != null) {
        try {
          final wallet = await _userService.getWallet(userId);
          final walletBalances = wallet['balances'] as List?;
          final usdtBalance = walletBalances?.firstWhere(
            (b) => (b['currency'] ?? '').toString().toUpperCase() == 'USDT',
            orElse: () => {'amount': 0.0},
          );
          platformWalletBalance = (usdtBalance['amount'] ?? 0.0).toDouble();
        } catch (e) {
          platformWalletBalance = 0.0;
        }
      }
      
      if (mounted) {
        setState(() {
          _availableApis = activeApis;
          _selectedApi = activeApis.isNotEmpty ? activeApis.first : null;
          _platformWalletBalance = platformWalletBalance;
          _isLoading = false;
        });
        
        if (_selectedApi != null) {
          await _loadApiBalance(_selectedApi!);
        }
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error loading data: ${e.toString()}'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  Future<void> _loadApiBalance(ExchangeApi api) async {
    try {
      final balance = await _exchangeService.getBalance(api.platform, apiId: api.id);
      
      double totalBalance = 0.0;
      for (var b in balance) {
        if (b.asset.toUpperCase() == widget.quoteCurrency.toUpperCase()) {
          totalBalance += b.total;
        }
      }
      
      if (mounted) {
        setState(() {
          _apiBalance = {
            'total': totalBalance,
            'balances': balance,
            'platform': api.platform,
            'permissions': api.permissions,
          };
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _apiBalance = {
            'total': 0.0,
            'balances': [],
            'platform': api.platform,
            'permissions': api.permissions,
          };
        });
      }
    }
  }

  Future<void> _startManualTrade() async {
    if (!_formKey.currentState!.validate()) {
      return;
    }

    if (_selectedApi == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please select an API'),
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
      final amountPerLevel = double.parse(_amountPerLevelController.text);
      final numberOfLevels = int.parse(_numberOfLevelsController.text);

      // Start manual trade (backend will handle it differently)
      await _algoService.startManualTrade(
        symbol: symbol,
        apiId: _selectedApi!.id,
        amountPerLevel: amountPerLevel,
        numberOfLevels: numberOfLevels,
      );

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Manual trade started successfully'),
            backgroundColor: Colors.green,
          ),
        );
        Navigator.pop(context);
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error starting manual trade: ${e.toString()}'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  @override
  void dispose() {
    _amountPerLevelController.dispose();
    _numberOfLevelsController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Manual Trading'),
      ),
      body: _isLoading && _availableApis.isEmpty
          ? const Center(child: CircularProgressIndicator())
          : SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: Form(
                key: _formKey,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // API Selection
                    if (_availableApis.isNotEmpty) ...[
                      const Text(
                        'Select API',
                        style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 8),
                      DropdownButtonFormField<ExchangeApi>(
                        value: _selectedApi,
                        decoration: const InputDecoration(
                          border: OutlineInputBorder(),
                          labelText: 'Exchange API',
                        ),
                        items: _availableApis.map((api) {
                          return DropdownMenuItem(
                            value: api,
                            child: Text('${api.platform.toUpperCase()} - ${api.label}${api.isTest ? " (Test)" : ""}'),
                          );
                        }).toList(),
                        onChanged: (api) {
                          setState(() {
                            _selectedApi = api;
                          });
                          if (api != null) {
                            _loadApiBalance(api);
                          }
                        },
                      ),
                      const SizedBox(height: 24),
                    ],

                    // Amount per level
                    TextFormField(
                      controller: _amountPerLevelController,
                      decoration: const InputDecoration(
                        border: OutlineInputBorder(),
                        labelText: 'Amount per Level (\$)',
                        hintText: '10.0',
                      ),
                      keyboardType: TextInputType.number,
                      validator: (value) {
                        if (value == null || value.isEmpty) {
                          return 'Please enter amount per level';
                        }
                        final amount = double.tryParse(value);
                        if (amount == null || amount <= 0) {
                          return 'Amount must be greater than 0';
                        }
                        return null;
                      },
                    ),
                    const SizedBox(height: 16),

                    // Number of levels
                    TextFormField(
                      controller: _numberOfLevelsController,
                      decoration: const InputDecoration(
                        border: OutlineInputBorder(),
                        labelText: 'Number of Levels',
                        hintText: '5',
                      ),
                      keyboardType: TextInputType.number,
                      validator: (value) {
                        if (value == null || value.isEmpty) {
                          return 'Please enter number of levels';
                        }
                        final levels = int.tryParse(value);
                        if (levels == null || levels <= 0) {
                          return 'Number of levels must be greater than 0';
                        }
                        if (levels > 100) {
                          return 'Maximum 100 levels allowed';
                        }
                        return null;
                      },
                    ),
                    const SizedBox(height: 24),

                    // Balance info
                    if (_apiBalance != null) ...[
                      Card(
                        child: Padding(
                          padding: const EdgeInsets.all(16),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text(
                                'Balance Information',
                                style: TextStyle(
                                  fontSize: 16,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                              const SizedBox(height: 8),
                              Text('Exchange Balance: ${_apiBalance!['total'].toStringAsFixed(2)} ${widget.quoteCurrency}'),
                              Text('Platform Wallet: ${_platformWalletBalance.toStringAsFixed(2)} USDT'),
                            ],
                          ),
                        ),
                      ),
                      const SizedBox(height: 24),
                    ],

                    // Start button
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton(
                        onPressed: _isLoading ? null : _startManualTrade,
                        style: ElevatedButton.styleFrom(
                          padding: const EdgeInsets.symmetric(vertical: 16),
                        ),
                        child: _isLoading
                            ? const CircularProgressIndicator()
                            : const Text(
                                'Start Manual Trade',
                                style: TextStyle(fontSize: 16),
                              ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
    );
  }
}
