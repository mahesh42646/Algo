import 'dart:async';
import 'package:flutter/material.dart';
import '../models/crypto_coin.dart';
import '../services/algo_trading_service.dart';
import '../services/exchange_service.dart';
import '../services/user_service.dart';
import '../services/auth_service.dart';

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
  final UserService _userService = UserService();

  // Form controllers
  final TextEditingController _maxLossPerTradeController = TextEditingController(text: '3.0');
  final TextEditingController _maxLossOverallController = TextEditingController(text: '3.0');
  final TextEditingController _maxProfitBookController = TextEditingController(text: '3.0');
  final TextEditingController _amountPerLevelController = TextEditingController(text: '10.0');
  final TextEditingController _numberOfLevelsController = TextEditingController(text: '10');

  bool _acceptedTerms = false;
  bool _isLoading = false;
  bool _isValidating = false;
  bool _hasActiveTrade = false;
  bool _useMargin = false;
  int _leverage = 1; // Default leverage for margin trading
  
  // API and balance data
  List<ExchangeApi> _availableApis = [];
  ExchangeApi? _selectedApi;
  Map<String, dynamic>? _apiBalance;
  double _platformWalletBalance = 0.0;
  String? _validationError;
  Map<String, dynamic>? _validationDetails;
  
  // Transaction history and live updates
  Map<String, dynamic>? _activeTradeDetails;
  Map<String, dynamic>? _tradeHistory;
  Timer? _updateTimer;
  bool _showHistory = false;

  @override
  void initState() {
    super.initState();
    _loadData();
    _startLiveUpdates();
  }
  
  void _startLiveUpdates() {
    _updateTimer?.cancel();
    _updateTimer = Timer.periodic(const Duration(seconds: 3), (timer) {
      if (mounted && _hasActiveTrade) {
        _loadActiveTradeDetails();
      }
    });
  }
  
  Future<void> _loadActiveTradeDetails() async {
    try {
      final symbol = '${widget.coin.symbol}${widget.quoteCurrency}';
      final trades = await _algoService.getActiveTrades();
      final activeTrade = trades.firstWhere(
        (t) => t['symbol'] == symbol && (t['isStarted'] == true || t['isStarted'] == 'true'),
        orElse: () => {},
      );
      
      if (activeTrade.isNotEmpty && mounted) {
        setState(() {
          _activeTradeDetails = activeTrade;
        });
        
        // Load transaction history
        try {
          final history = await _algoService.getTradeHistory(symbol);
          if (mounted) {
            setState(() {
              _tradeHistory = history;
            });
          }
        } catch (e) {
          // History might not be available yet
        }
      }
    } catch (e) {
      // Ignore errors in live updates
    }
  }

  Future<void> _loadData() async {
    setState(() {
      _isLoading = true;
    });

    try {
      // Load active trade status
      final symbol = '${widget.coin.symbol}${widget.quoteCurrency}';
      final status = await _algoService.getTradeStatus(symbol);
      
      // Load available APIs
      final apis = await _exchangeService.getLinkedApis();
      print('[ALGO CONFIG] Loaded ${apis.length} total APIs');
      for (var api in apis) {
        print('[ALGO CONFIG] API: ${api.platform} - ${api.label} (Active: ${api.isActive}, Test: ${api.isTest})');
      }
      final activeApis = apis.where((api) => api.isActive).toList();
      print('[ALGO CONFIG] Active APIs: ${activeApis.length}');
      
      // Load platform wallet balance
      double platformWalletBalance = 0.0;
      final authService = AuthService();
      final userId = authService.currentUser?.uid;
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
          // If wallet fetch fails, use default 0.0
          platformWalletBalance = 0.0;
        }
      }
      
      if (mounted) {
        setState(() {
          _hasActiveTrade = status['isActive'] == true;
          // Show all active APIs (both test and real)
          _availableApis = apis.where((api) => api.isActive).toList();
          if (_availableApis.isNotEmpty) {
            _selectedApi = _availableApis.first;
          }
          _platformWalletBalance = platformWalletBalance;
          _isLoading = false;
        });
        
        // Load balance for selected API
        if (_selectedApi != null) {
          _loadApiBalance(_selectedApi!);
        } else if (_availableApis.isEmpty) {
          // Log for debugging
          print('[ALGO CONFIG] No active APIs found. Total APIs: ${apis.length}');
        }
        
        // Load active trade details if trade exists
        if (_hasActiveTrade) {
          _loadActiveTradeDetails();
        }
      }
    } catch (e) {
      print('[ALGO CONFIG] Error in _loadData: $e');
      if (mounted) {
        setState(() {
          _isLoading = false;
          // Even on error, show empty list so UI can render
          _availableApis = [];
        });
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error loading data: ${e.toString()}'),
            backgroundColor: Colors.red,
            duration: const Duration(seconds: 5),
          ),
        );
      }
    }
  }

  Future<void> _loadApiBalance(ExchangeApi api) async {
    try {
      print('[ALGO CONFIG] Loading balance for API: ${api.platform} - ${api.label} (Test: ${api.isTest})');
      final balance = await _exchangeService.getBalance(api.platform, apiId: api.id);
      print('[ALGO CONFIG] Balance loaded: ${balance.length} assets');
      
      // Calculate total balance in quote currency (USDT)
      double totalBalance = 0.0;
      for (var b in balance) {
        if (b.asset.toUpperCase() == widget.quoteCurrency.toUpperCase()) {
          totalBalance += b.total;
        }
      }
      
      print('[ALGO CONFIG] Total ${widget.quoteCurrency} balance: $totalBalance');
      
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
      print('[ALGO CONFIG] Error loading balance: $e');
      if (mounted) {
        setState(() {
          _apiBalance = {
            'total': 0.0,
            'balances': [],
            'platform': api.platform,
            'permissions': api.permissions,
          };
        });
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error loading balance: ${e.toString()}'),
            backgroundColor: Colors.orange,
            duration: const Duration(seconds: 3),
          ),
        );
      }
    }
  }

  @override
  void dispose() {
    _updateTimer?.cancel();
    _maxLossPerTradeController.dispose();
    _maxLossOverallController.dispose();
    _maxProfitBookController.dispose();
    _amountPerLevelController.dispose();
    _numberOfLevelsController.dispose();
    super.dispose();
  }

  Future<void> _stopActiveTrade() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Stop Algo Trade?'),
        content: const Text(
          'Are you sure you want to stop the active algo trade? This will close all positions and stop the bot.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            style: TextButton.styleFrom(foregroundColor: Colors.red),
            child: const Text('Stop'),
          ),
        ],
      ),
    );

    if (confirmed != true) return;

    setState(() {
      _isLoading = true;
    });

    try {
      final symbol = '${widget.coin.symbol}${widget.quoteCurrency}';
      await _algoService.stopAlgoTrade(symbol);
      
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Algo trade stopped successfully'),
            backgroundColor: Colors.green,
          ),
        );
        // Reload data to update UI
        await _loadData();
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error stopping trade: ${e.toString()}'),
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

  Future<void> _validateBeforeStart() async {
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
      _isValidating = true;
      _validationError = null;
      _validationDetails = null;
    });

    try {
      final amountPerLevel = double.parse(_amountPerLevelController.text);
      final numberOfLevels = int.parse(_numberOfLevelsController.text);
      final totalTradeAmount = amountPerLevel * numberOfLevels;

      // Check API balance - must be sufficient for ALL levels
      final apiTotalBalance = (_apiBalance?['total'] ?? 0.0).toDouble();
      if (apiTotalBalance < totalTradeAmount) {
        setState(() {
          _validationError = 'Insufficient Exchange Balance';
          _validationDetails = {
            'message': 'You need sufficient balance in your ${_selectedApi!.platform} account for all $numberOfLevels levels.',
            'required': '\$${totalTradeAmount.toStringAsFixed(2)} (for all levels)',
            'current': '\$${apiTotalBalance.toStringAsFixed(2)}',
            'numberOfLevels': '$numberOfLevels levels',
          };
        });
        return;
      }

      // Check platform wallet balance (fee depends on test/real key)
      final feePercentage = _selectedApi!.isTest ? 0.03 : 0.003; // 3% for test, 0.3% for demo
      final requiredWalletBalance = totalTradeAmount * feePercentage;
      
      if (_platformWalletBalance < requiredWalletBalance) {
        setState(() {
          _validationError = 'Insufficient Platform Wallet Balance';
          _validationDetails = {
            'message': 'You need at least ${(feePercentage * 100).toStringAsFixed(1)}% of total trade amount (for all $numberOfLevels levels) in platform wallet.',
            'required': '\$${requiredWalletBalance.toStringAsFixed(2)} (${(feePercentage * 100).toStringAsFixed(1)}% of \$${totalTradeAmount.toStringAsFixed(2)})',
            'current': '\$${_platformWalletBalance.toStringAsFixed(2)}',
            'totalTradeAmount': '\$${totalTradeAmount.toStringAsFixed(2)}',
            'numberOfLevels': '$numberOfLevels levels',
          };
        });
        return;
      }

      // Check permissions
      final requiredPermission = _useMargin ? 'margin_trade' : 'spot_trade';
      if (!_selectedApi!.permissions.contains(requiredPermission)) {
        setState(() {
          _validationError = 'Missing API Permissions';
          _validationDetails = {
            'message': 'Your API key does not have ${_useMargin ? "margin" : "spot"} trading permissions.',
            'required': requiredPermission,
            'current': _selectedApi!.permissions.join(', '),
          };
        });
        return;
      }

      // All validations passed - show confirmation dialog
      _showConfirmationDialog(totalTradeAmount, requiredWalletBalance);
    } catch (e) {
      setState(() {
        _validationError = 'Validation Error';
        _validationDetails = {
          'message': e.toString(),
        };
      });
    } finally {
      setState(() {
        _isValidating = false;
      });
    }
  }

  void _showConfirmationDialog(double totalTradeAmount, double requiredWalletBalance) {
    final feePercentage = _selectedApi!.isTest ? 0.03 : 0.003;
    final feeText = _selectedApi!.isTest ? '3%' : '0.3%';
    final modeText = _selectedApi!.isTest ? 'Test Mode (Testnet)' : 'Demo Mode (Real Key)';
    
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Confirm Algo Trading Start'),
        content: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'Please confirm the following details:',
                style: TextStyle(fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 16),
              _buildConfirmationRow('Symbol', '${widget.coin.symbol}/${widget.quoteCurrency}'),
              _buildConfirmationRow('API', '${_selectedApi!.platform.toUpperCase()} (${_selectedApi!.label})'),
              _buildConfirmationRow('Key Type', modeText),
              _buildConfirmationRow('Trading Mode', _useMargin ? 'Margin' : 'Spot'),
              _buildConfirmationRow('Total Trade Amount', '\$${totalTradeAmount.toStringAsFixed(2)}'),
              _buildConfirmationRow('Platform Wallet Fee', '\$${requiredWalletBalance.toStringAsFixed(2)} ($feeText)'),
              _buildConfirmationRow('Exchange Balance', '\$${(_apiBalance!['total'] ?? 0.0).toStringAsFixed(2)}'),
              const SizedBox(height: 16),
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: _selectedApi!.isTest 
                      ? Colors.orange.withOpacity(0.1)
                      : Colors.blue.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(
                    color: _selectedApi!.isTest ? Colors.orange : Colors.blue,
                  ),
                ),
                child: Row(
                  children: [
                    Icon(
                      _selectedApi!.isTest ? Icons.science : Icons.play_circle_outline,
                      color: _selectedApi!.isTest ? Colors.orange : Colors.blue,
                      size: 20,
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        _selectedApi!.isTest
                            ? 'Test Mode: Using Binance Testnet. $feeText platform wallet fee per level.'
                            : 'Demo Mode: Simulated trading with real key. $feeText platform wallet fee per level.',
                        style: const TextStyle(fontSize: 12),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(context);
              _startAlgoTrading();
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.green,
              foregroundColor: Colors.white,
            ),
            child: const Text('Confirm & Start'),
          ),
        ],
      ),
    );
  }

  Widget _buildConfirmationRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            label,
            style: TextStyle(color: Colors.grey[600], fontSize: 14),
          ),
          Text(
            value,
            style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
          ),
        ],
      ),
    );
  }

  Future<void> _startAlgoTrading() async {
    setState(() {
      _isLoading = true;
    });

    try {
      final symbol = '${widget.coin.symbol}${widget.quoteCurrency}';
      
      await _algoService.startAlgoTrade(
        symbol: symbol,
        apiId: _selectedApi!.id,
        maxLossPerTrade: double.parse(_maxLossPerTradeController.text),
        maxLossOverall: double.parse(_maxLossOverallController.text),
        maxProfitBook: double.parse(_maxProfitBookController.text),
        amountPerLevel: double.parse(_amountPerLevelController.text),
        numberOfLevels: int.parse(_numberOfLevelsController.text),
        useMargin: _useMargin,
        leverage: _useMargin ? _leverage : 1,
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
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _loadData,
            tooltip: 'Refresh',
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: Form(
                key: _formKey,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
              if (_hasActiveTrade) ...[
                _buildActiveTradeCard(),
                const SizedBox(height: 16),
                _buildTransactionHistorySection(),
                const SizedBox(height: 16),
              ],

              // API Selection
              if (_availableApis.isNotEmpty) ...[
                Text(
                  'Select API',
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 8),
                DropdownButtonFormField<ExchangeApi>(
                  value: _selectedApi,
                  decoration: InputDecoration(
                    labelText: 'Exchange API',
                    prefixIcon: const Icon(Icons.api),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(8),
                    ),
                  ),
                  items: _availableApis.map((api) {
                    return DropdownMenuItem(
                      value: api,
                      child: Text(
                        '${api.platform.toUpperCase()} - ${api.label} ${api.isTest ? "(TEST)" : "(REAL)"}',
                        style: const TextStyle(fontWeight: FontWeight.bold),
                        overflow: TextOverflow.ellipsis,
                      ),
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
                const SizedBox(height: 16),
                
                // API Balance Display
                if (_apiBalance != null)
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: (_apiBalance!['total'] ?? 0.0) > 0
                          ? Colors.green.withOpacity(0.1)
                          : Colors.red.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(
                        color: (_apiBalance!['total'] ?? 0.0) > 0
                            ? Colors.green
                            : Colors.red,
                      ),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Icon(
                              (_apiBalance!['total'] ?? 0.0) > 0
                                  ? Icons.check_circle
                                  : Icons.error,
                              color: (_apiBalance!['total'] ?? 0.0) > 0
                                  ? Colors.green
                                  : Colors.red,
                            ),
                            const SizedBox(width: 8),
                            Text(
                              '${_apiBalance!['platform'].toUpperCase()} Balance',
                              style: const TextStyle(fontWeight: FontWeight.bold),
                            ),
                          ],
                        ),
                        const SizedBox(height: 8),
                        Text(
                          '\$${(_apiBalance!['total'] ?? 0.0).toStringAsFixed(2)}',
                          style: TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                            color: (_apiBalance!['total'] ?? 0.0) > 0
                                ? Colors.green
                                : Colors.red,
                          ),
                        ),
                      ],
                    ),
                  ),
                const SizedBox(height: 16),
              ] else ...[
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: Colors.orange.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: Colors.orange),
                  ),
                  child: Column(
                    children: [
                      const Row(
                        children: [
                          Icon(Icons.warning, color: Colors.orange),
                          SizedBox(width: 8),
                          Expanded(
                            child: Text(
                              'No Active APIs Found',
                              style: TextStyle(
                                color: Colors.orange,
                                fontWeight: FontWeight.bold,
                                fontSize: 16,
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 12),
                      const Text(
                        'Please link an exchange API (test or real) from the API Binding page before starting algo trading.',
                        style: TextStyle(color: Colors.orange),
                      ),
                      const SizedBox(height: 12),
                      ElevatedButton.icon(
                        onPressed: () {
                          Navigator.pop(context);
                        },
                        icon: const Icon(Icons.link),
                        label: const Text('Go to API Binding'),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.orange,
                          foregroundColor: Colors.white,
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 16),
              ],

              // Platform Wallet Balance
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: _platformWalletBalance > 0
                      ? Colors.blue.withOpacity(0.1)
                      : Colors.orange.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(
                    color: _platformWalletBalance > 0
                        ? Colors.blue
                        : Colors.orange,
                  ),
                ),
                child: Row(
                  children: [
                    Icon(
                      _platformWalletBalance > 0
                          ? Icons.account_balance_wallet
                          : Icons.warning,
                      color: _platformWalletBalance > 0
                          ? Colors.blue
                          : Colors.orange,
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            'Platform Wallet Balance',
                            style: TextStyle(fontWeight: FontWeight.bold),
                          ),
                          Text(
                            '\$${_platformWalletBalance.toStringAsFixed(2)}',
                            style: TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.bold,
                              color: _platformWalletBalance > 0
                                  ? Colors.blue
                                  : Colors.orange,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            'Required: ${_selectedApi != null ? (_selectedApi!.isTest ? "3%" : "0.3%") : "3%"} of total trade amount (all levels)',
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
              ),
              const SizedBox(height: 24),

              // Margin Trading Toggle
              SwitchListTile(
                title: const Text('Margin Trading'),
                subtitle: const Text('Enable margin trading (requires margin permissions) - Faster execution with leverage'),
                value: _useMargin,
                onChanged: (value) {
                  setState(() {
                    _useMargin = value;
                    if (!value) {
                      _leverage = 1; // Reset leverage when margin is disabled
                    }
                  });
                },
              ),
              // Leverage selector (only show when margin is enabled)
              if (_useMargin) ...[
                const SizedBox(height: 8),
                DropdownButtonFormField<int>(
                  value: _leverage,
                  decoration: InputDecoration(
                    labelText: 'Leverage',
                    prefixIcon: const Icon(Icons.trending_up),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(8),
                    ),
                    helperText: 'Higher leverage = faster level execution (more risk)',
                  ),
                  items: [1, 2, 3, 5, 10, 20].map((lev) {
                    return DropdownMenuItem(
                      value: lev,
                      child: Text('${lev}x'),
                    );
                  }).toList(),
                  onChanged: (value) {
                    setState(() {
                      _leverage = value ?? 1;
                    });
                  },
                ),
              ],
              const SizedBox(height: 16),

              // Validation Error Display
              if (_validationError != null) ...[
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: Colors.red.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: Colors.red),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          const Icon(Icons.error, color: Colors.red),
                          const SizedBox(width: 8),
                          Text(
                            _validationError!,
                            style: const TextStyle(
                              fontWeight: FontWeight.bold,
                              color: Colors.red,
                            ),
                          ),
                        ],
                      ),
                      if (_validationDetails != null) ...[
                        const SizedBox(height: 8),
                        Text(
                          _validationDetails!['message'] ?? '',
                          style: const TextStyle(fontSize: 12),
                        ),
                        if (_validationDetails!['required'] != null) ...[
                          const SizedBox(height: 4),
                          Text(
                            'Required: ${_validationDetails!['required']}',
                            style: const TextStyle(fontSize: 12),
                          ),
                        ],
                        if (_validationDetails!['current'] != null) ...[
                          Text(
                            'Current: ${_validationDetails!['current']}',
                            style: const TextStyle(fontSize: 12),
                          ),
                        ],
                      ],
                    ],
                  ),
                ),
                const SizedBox(height: 16),
              ],

              _buildInfoCard(),
              const SizedBox(height: 24),
              
              // Trading Parameters - Always show
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
                  onPressed: (_isLoading || _isValidating || _availableApis.isEmpty || _hasActiveTrade) 
                      ? null 
                      : _validateBeforeStart,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Theme.of(context).colorScheme.primary,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(8),
                    ),
                  ),
                  child: _isLoading || _isValidating
                      ? const SizedBox(
                          height: 20,
                          width: 20,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            color: Colors.white,
                          ),
                        )
                      : const Text(
                          'Start Algo Trading',
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                            color: Colors.white,
                          ),
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
            '• The algorithm waits for a strong signal (BUY or SELL) before starting\n'
            '• Once started, if loss hits "Max Loss Per Trade" (e.g., 3%), it adds more funds in the same direction\n'
            '• Loss adjustments don\'t check signals - they automatically add funds when loss threshold is hit\n'
            '• If profit hits "Max Profit Book" (e.g., 3%), it books profit and stops\n'
            '• If max levels are reached, it books overall loss and stops\n'
            '• ${_selectedApi != null ? (_selectedApi!.isTest ? "3%" : "0.3%") : "Platform wallet"} fee is deducted at each level (must have ${_selectedApi != null ? (_selectedApi!.isTest ? "3%" : "0.3%") : "required"} of total for all levels upfront)',
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
                  'I understand that algorithmic trading involves risks. I accept full responsibility for all trades executed by this algorithm. The algorithm will automatically place orders based on technical indicators and my configured parameters. A ${_selectedApi != null ? (_selectedApi!.isTest ? "3%" : "0.3%") : "platform wallet"} fee will be deducted at each level.',
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

  Widget _buildActiveTradeCard() {
    if (_activeTradeDetails == null) {
      return Container(
        padding: const EdgeInsets.all(12),
        margin: const EdgeInsets.only(bottom: 16),
        decoration: BoxDecoration(
          color: Colors.orange.withOpacity(0.1),
          borderRadius: BorderRadius.circular(8),
          border: Border.all(color: Colors.orange),
        ),
        child: const Center(child: CircularProgressIndicator()),
      );
    }
    
    final currentPrice = _activeTradeDetails!['currentPrice'] ?? 0.0;
    final startPrice = _activeTradeDetails!['startPrice'] ?? 0.0;
    final currentPnL = _activeTradeDetails!['currentPnL'] ?? 0.0;
    final totalBalance = _activeTradeDetails!['totalBalance'] ?? _activeTradeDetails!['totalInvested'] ?? 0.0;
    final currentLevel = _activeTradeDetails!['currentLevel'] ?? 0;
    final numberOfLevels = _activeTradeDetails!['numberOfLevels'] ?? 0;
    final tradeDirection = _activeTradeDetails!['tradeDirection'] ?? 'N/A';
    final leverage = _activeTradeDetails!['leverage'] ?? 1;
    final useMargin = _activeTradeDetails!['useMargin'] ?? false;
    
    // Calculate stop loss and target prices
    final maxLossPerTrade = double.tryParse(_maxLossPerTradeController.text) ?? 3.0;
    final maxProfitBook = double.tryParse(_maxProfitBookController.text) ?? 3.0;
    final stopLossPrice = tradeDirection == 'BUY' 
        ? startPrice * (1 - maxLossPerTrade / 100)
        : startPrice * (1 + maxLossPerTrade / 100);
    final targetPrice = tradeDirection == 'BUY'
        ? startPrice * (1 + maxProfitBook / 100)
        : startPrice * (1 - maxProfitBook / 100);
    
    return Container(
      padding: const EdgeInsets.all(16),
      margin: const EdgeInsets.only(bottom: 16),
      decoration: BoxDecoration(
        color: Theme.of(context).cardColor,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: currentPnL >= 0 ? Colors.green : Colors.red,
          width: 2,
        ),
        boxShadow: [
          BoxShadow(
            color: (currentPnL >= 0 ? Colors.green : Colors.red).withOpacity(0.1),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  Icon(
                    tradeDirection == 'BUY' ? Icons.trending_up : Icons.trending_down,
                    color: tradeDirection == 'BUY' ? Colors.green : Colors.red,
                    size: 24,
                  ),
                  const SizedBox(width: 8),
                  Text(
                    'Active Trade - $tradeDirection',
                    style: const TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ],
              ),
              if (useMargin && leverage > 1)
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: Colors.blue.withOpacity(0.2),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(
                    '${leverage}x',
                    style: const TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.bold,
                      color: Colors.blue,
                    ),
                  ),
                ),
            ],
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              Expanded(
                child: _buildTradeMetric('Current Price', '\$${currentPrice.toStringAsFixed(2)}', Colors.grey[700]!),
              ),
              Expanded(
                child: _buildTradeMetric('Entry Price', '\$${startPrice.toStringAsFixed(2)}', Colors.grey[700]!),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: _buildTradeMetric('P&L', '${currentPnL >= 0 ? "+" : ""}${currentPnL.toStringAsFixed(2)}%', currentPnL >= 0 ? Colors.green : Colors.red, isBold: true),
              ),
              Expanded(
                child: _buildTradeMetric('Total Balance', '\$${totalBalance.toStringAsFixed(2)}', Colors.blue, isBold: true),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: _buildTradeMetric('Levels', '$currentLevel / $numberOfLevels', Colors.orange),
              ),
              Expanded(
                child: _buildTradeMetric('Stop Loss', '\$${stopLossPrice.toStringAsFixed(2)}', Colors.red),
              ),
            ],
          ),
          const SizedBox(height: 12),
          _buildTradeMetric('Target Price', '\$${targetPrice.toStringAsFixed(2)}', Colors.green),
          const SizedBox(height: 16),
          ClipRRect(
            borderRadius: BorderRadius.circular(4),
            child: LinearProgressIndicator(
              value: numberOfLevels > 0 ? currentLevel / numberOfLevels : 0,
              backgroundColor: Colors.grey[300],
              valueColor: AlwaysStoppedAnimation<Color>(
                currentLevel >= numberOfLevels ? Colors.green : Colors.blue,
              ),
              minHeight: 8,
            ),
          ),
          const SizedBox(height: 16),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton.icon(
              onPressed: _isLoading ? null : _stopActiveTrade,
              icon: const Icon(Icons.stop_circle),
              label: const Text('Stop Active Trade'),
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.red,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 12),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTradeMetric(String label, String value, Color color, {bool isBold = false}) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: TextStyle(
            fontSize: 12,
            color: Colors.grey[600],
          ),
        ),
        const SizedBox(height: 4),
        Text(
          value,
          style: TextStyle(
            fontSize: 16,
            fontWeight: isBold ? FontWeight.bold : FontWeight.w600,
            color: color,
          ),
        ),
      ],
    );
  }

  Widget _buildTransactionHistorySection() {
    if (_tradeHistory == null) {
      return const SizedBox.shrink();
    }
    
    final history = _tradeHistory!['history'] as List<dynamic>? ?? [];
    
    return Container(
      decoration: BoxDecoration(
        color: Theme.of(context).cardColor,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: Theme.of(context).dividerColor,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          InkWell(
            onTap: () {
              setState(() {
                _showHistory = !_showHistory;
              });
            },
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text(
                    'Transaction History',
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  Icon(
                    _showHistory ? Icons.expand_less : Icons.expand_more,
                  ),
                ],
              ),
            ),
          ),
          if (_showHistory) ...[
            const Divider(height: 1),
            if (history.isEmpty)
              const Padding(
                padding: EdgeInsets.all(16),
                child: Center(
                  child: Text('No transaction history yet'),
                ),
              )
            else
              ListView.builder(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                itemCount: history.length,
                itemBuilder: (context, index) {
                  final entry = history[index];
                  final level = entry['level'] ?? 0;
                  final type = entry['type'] ?? 'trade';
                  final description = entry['description'] ?? 'Unknown';
                  final price = entry['price'];
                  final quantity = entry['quantity'];
                  final balance = entry['balance'] ?? 0.0;
                  final invested = entry['invested'] ?? 0.0;
                  final pnl = entry['pnl'] ?? 0.0;
                  final pnlPercent = entry['pnlPercent'] ?? 0.0;
                  
                  return Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      border: Border(
                        bottom: BorderSide(
                          color: Theme.of(context).dividerColor,
                          width: 1,
                        ),
                      ),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(
                              description,
                              style: const TextStyle(
                                fontWeight: FontWeight.bold,
                                fontSize: 14,
                              ),
                            ),
                            if (level > 0)
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                decoration: BoxDecoration(
                                  color: Colors.blue.withOpacity(0.1),
                                  borderRadius: BorderRadius.circular(4),
                                ),
                                child: Text(
                                  'Level $level',
                                  style: const TextStyle(
                                    fontSize: 12,
                                    fontWeight: FontWeight.bold,
                                    color: Colors.blue,
                                  ),
                                ),
                              ),
                          ],
                        ),
                        if (price != null && quantity != null) ...[
                          const SizedBox(height: 8),
                          Row(
                            children: [
                              Text(
                                'Price: \$${price.toStringAsFixed(2)}',
                                style: TextStyle(
                                  fontSize: 12,
                                  color: Colors.grey[600],
                                ),
                              ),
                              const SizedBox(width: 16),
                              Text(
                                'Qty: ${quantity.toStringAsFixed(8)}',
                                style: TextStyle(
                                  fontSize: 12,
                                  color: Colors.grey[600],
                                ),
                              ),
                            ],
                          ),
                        ],
                        const SizedBox(height: 8),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  'Balance: \$${balance.toStringAsFixed(2)}',
                                  style: const TextStyle(
                                    fontSize: 12,
                                    fontWeight: FontWeight.w500,
                                  ),
                                ),
                                Text(
                                  'Invested: \$${invested.toStringAsFixed(2)}',
                                  style: TextStyle(
                                    fontSize: 12,
                                    color: Colors.grey[600],
                                  ),
                                ),
                              ],
                            ),
                            if (pnl != 0 || pnlPercent != 0)
                              Column(
                                crossAxisAlignment: CrossAxisAlignment.end,
                                children: [
                                  Text(
                                    '${pnl >= 0 ? "+" : ""}\$${pnl.toStringAsFixed(2)}',
                                    style: TextStyle(
                                      fontSize: 14,
                                      fontWeight: FontWeight.bold,
                                      color: pnl >= 0 ? Colors.green : Colors.red,
                                    ),
                                  ),
                                  Text(
                                    '${pnlPercent >= 0 ? "+" : ""}${pnlPercent.toStringAsFixed(2)}%',
                                    style: TextStyle(
                                      fontSize: 12,
                                      color: pnlPercent >= 0 ? Colors.green : Colors.red,
                                    ),
                                  ),
                                ],
                              ),
                          ],
                        ),
                      ],
                    ),
                  );
                },
              ),
          ],
        ],
      ),
    );
  }
}
