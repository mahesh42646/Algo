import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../services/exchange_service.dart';

class ApiBindingScreen extends StatefulWidget {
  const ApiBindingScreen({super.key});

  @override
  State<ApiBindingScreen> createState() => _ApiBindingScreenState();
}

class _ApiBindingScreenState extends State<ApiBindingScreen> {
  final ExchangeService _exchangeService = ExchangeService();
  List<ExchangeApi> _linkedApis = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadLinkedApis();
  }

  Future<void> _loadLinkedApis() async {
    setState(() => _isLoading = true);
    try {
      final apis = await _exchangeService.getLinkedApis();
      setState(() {
        _linkedApis = apis;
        _isLoading = false;
      });
    } catch (e) {
      setState(() => _isLoading = false);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error loading APIs: $e')),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('API Binding'),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: _loadLinkedApis,
              child: SingleChildScrollView(
                physics: const AlwaysScrollableScrollPhysics(),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _buildHeader(),
                    _buildLinkedApis(),
                    _buildPlatformList(),
                  ],
                ),
              ),
            ),
    );
  }

  Widget _buildHeader() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            Theme.of(context).colorScheme.primary,
            Theme.of(context).colorScheme.primary.withOpacity(0.7),
          ],
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Icon(Icons.link, color: Colors.white, size: 40),
          const SizedBox(height: 12),
          const Text(
            'Connect Your Exchange',
            style: TextStyle(
              fontSize: 24,
              fontWeight: FontWeight.bold,
              color: Colors.white,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'Link your exchange API to trade directly from AlgoBot',
            style: TextStyle(
              fontSize: 14,
              color: Colors.white.withOpacity(0.9),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildLinkedApis() {
    if (_linkedApis.isEmpty) {
      return const SizedBox.shrink();
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Padding(
          padding: EdgeInsets.all(16),
          child: Text(
            'Linked Exchanges',
            style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
          ),
        ),
        ..._linkedApis.map((api) => _buildLinkedApiCard(api)),
        const Divider(height: 32),
      ],
    );
  }

  Widget _buildLinkedApiCard(ExchangeApi api) {
    final platform = ExchangeService.supportedPlatforms.firstWhere(
      (p) => p['id'] == api.platform,
      orElse: () => {'name': api.platform, 'color': 0xFF000000},
    );

    return Card(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: ListTile(
        leading: Container(
          width: 50,
          height: 50,
          decoration: BoxDecoration(
            color: Color(platform['color'] as int).withOpacity(0.1),
            borderRadius: BorderRadius.circular(12),
          ),
          child: Center(
            child: Text(
              platform['name'].toString().substring(0, 1).toUpperCase(),
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.bold,
                color: Color(platform['color'] as int),
              ),
            ),
          ),
        ),
        title: Text(
          platform['name'] as String,
          style: const TextStyle(fontWeight: FontWeight.w600),
        ),
        subtitle: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'API: ${api.apiKey}',
              style: TextStyle(color: Colors.grey[600], fontSize: 12),
            ),
            Text(
              'Label: ${api.label}',
              style: TextStyle(color: Colors.grey[600], fontSize: 12),
            ),
          ],
        ),
        trailing: PopupMenuButton<String>(
          onSelected: (value) => _handleApiAction(value, api),
          itemBuilder: (context) => [
            const PopupMenuItem(
              value: 'verify',
              child: Row(
                children: [
                  Icon(Icons.check_circle_outline, size: 20),
                  SizedBox(width: 8),
                  Text('Verify'),
                ],
              ),
            ),
            const PopupMenuItem(
              value: 'balance',
              child: Row(
                children: [
                  Icon(Icons.account_balance_wallet, size: 20),
                  SizedBox(width: 8),
                  Text('Check Balance'),
                ],
              ),
            ),
            const PopupMenuItem(
              value: 'delete',
              child: Row(
                children: [
                  Icon(Icons.delete_outline, size: 20, color: Colors.red),
                  SizedBox(width: 8),
                  Text('Delete', style: TextStyle(color: Colors.red)),
                ],
              ),
            ),
          ],
        ),
        isThreeLine: true,
      ),
    );
  }

  void _handleApiAction(String action, ExchangeApi api) async {
    switch (action) {
      case 'verify':
        _verifyApi(api);
        break;
      case 'balance':
        _showBalance(api);
        break;
      case 'delete':
        _deleteApi(api);
        break;
    }
  }

  Future<void> _verifyApi(ExchangeApi api) async {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (_) => const Center(child: CircularProgressIndicator()),
    );

    try {
      final result = await _exchangeService.verifyApi(api.platform);
      if (mounted) Navigator.pop(context);

      if (mounted) {
        showDialog(
          context: context,
          builder: (_) => AlertDialog(
            title: Row(
              children: [
                const Icon(Icons.check_circle, color: Colors.green),
                const SizedBox(width: 8),
                const Text('API Verified'),
              ],
            ),
            content: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Can Trade: ${result['canTrade'] ?? false}'),
                Text('Can Withdraw: ${result['canWithdraw'] ?? false}'),
                Text('Can Deposit: ${result['canDeposit'] ?? false}'),
              ],
            ),
            actions: [
              TextButton(
                onPressed: () => Navigator.pop(context),
                child: const Text('OK'),
              ),
            ],
          ),
        );
      }
    } catch (e) {
      if (mounted) Navigator.pop(context);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Verification failed: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  Future<void> _showBalance(ExchangeApi api) async {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (_) => const Center(child: CircularProgressIndicator()),
    );

    try {
      final balances = await _exchangeService.getBalance(api.platform);
      if (mounted) Navigator.pop(context);

      if (mounted) {
        showDialog(
          context: context,
          builder: (_) => AlertDialog(
            title: const Text('Account Balance'),
            content: SizedBox(
              width: double.maxFinite,
              child: balances.isEmpty
                  ? const Text('No balances found')
                  : ListView.builder(
                      shrinkWrap: true,
                      itemCount: balances.length,
                      itemBuilder: (context, index) {
                        final balance = balances[index];
                        return ListTile(
                          dense: true,
                          title: Text(balance.asset),
                          subtitle: Text('Free: ${balance.free.toStringAsFixed(8)}'),
                          trailing: Text(
                            balance.total.toStringAsFixed(4),
                            style: const TextStyle(fontWeight: FontWeight.bold),
                          ),
                        );
                      },
                    ),
            ),
            actions: [
              TextButton(
                onPressed: () => Navigator.pop(context),
                child: const Text('Close'),
              ),
            ],
          ),
        );
      }
    } catch (e) {
      if (mounted) Navigator.pop(context);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to get balance: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  Future<void> _deleteApi(ExchangeApi api) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (_) => AlertDialog(
        title: const Text('Delete API?'),
        content: Text('Are you sure you want to remove this ${api.platform.toUpperCase()} API?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            style: TextButton.styleFrom(foregroundColor: Colors.red),
            child: const Text('Delete'),
          ),
        ],
      ),
    );

    if (confirmed == true) {
      try {
        await _exchangeService.deleteApi(api.id);
        await _loadLinkedApis();
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('API deleted successfully')),
          );
        }
      } catch (e) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Error: $e'), backgroundColor: Colors.red),
          );
        }
      }
    }
  }

  Widget _buildPlatformList() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Padding(
          padding: EdgeInsets.all(16),
          child: Text(
            'Select Exchange',
            style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
          ),
        ),
        ...ExchangeService.supportedPlatforms.map((platform) {
          final isLinked = _linkedApis.any(
            (api) => api.platform == platform['id'] && api.isActive,
          );
          return _buildPlatformCard(platform, isLinked);
        }),
        const SizedBox(height: 20),
      ],
    );
  }

  Widget _buildPlatformCard(Map<String, dynamic> platform, bool isLinked) {
    return Card(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: ListTile(
        leading: Container(
          width: 50,
          height: 50,
          decoration: BoxDecoration(
            color: Color(platform['color'] as int).withOpacity(0.1),
            borderRadius: BorderRadius.circular(12),
          ),
          child: Center(
            child: Text(
              platform['name'].toString().substring(0, 1).toUpperCase(),
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.bold,
                color: Color(platform['color'] as int),
              ),
            ),
          ),
        ),
        title: Text(
          platform['name'] as String,
          style: const TextStyle(fontWeight: FontWeight.w600),
        ),
        subtitle: Text(platform['description'] as String),
        trailing: isLinked
            ? const Chip(
                label: Text('Linked', style: TextStyle(color: Colors.white)),
                backgroundColor: Colors.green,
              )
            : Icon(Icons.chevron_right, color: Colors.grey[400]),
        onTap: isLinked ? null : () => _showAddApiDialog(platform),
      ),
    );
  }

  void _showAddApiDialog(Map<String, dynamic> platform) {
    final apiKeyController = TextEditingController();
    final apiSecretController = TextEditingController();
    final labelController = TextEditingController(text: 'Default');
    bool isLoading = false;
    bool obscureSecret = true;

    showDialog(
      context: context,
      builder: (context) => StatefulBuilder(
        builder: (context, setState) => AlertDialog(
          title: Row(
            children: [
              Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  color: Color(platform['color'] as int).withOpacity(0.1),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Center(
                  child: Text(
                    platform['name'].toString().substring(0, 1),
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                      color: Color(platform['color'] as int),
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Text('Add ${platform['name']} API'),
            ],
          ),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Enter your API credentials from ${platform['name']}. Make sure to enable Spot Trading permission.',
                  style: const TextStyle(fontSize: 12, color: Colors.grey),
                ),
                const SizedBox(height: 16),
                TextField(
                  controller: labelController,
                  decoration: const InputDecoration(
                    labelText: 'Label (Optional)',
                    hintText: 'e.g., Main Account',
                    border: OutlineInputBorder(),
                  ),
                ),
                const SizedBox(height: 16),
                TextField(
                  controller: apiKeyController,
                  decoration: InputDecoration(
                    labelText: 'API Key',
                    hintText: 'Paste your API key',
                    border: const OutlineInputBorder(),
                    suffixIcon: IconButton(
                      icon: const Icon(Icons.paste),
                      onPressed: () async {
                        final data = await Clipboard.getData('text/plain');
                        if (data?.text != null) {
                          apiKeyController.text = data!.text!;
                        }
                      },
                    ),
                  ),
                ),
                const SizedBox(height: 16),
                TextField(
                  controller: apiSecretController,
                  obscureText: obscureSecret,
                  decoration: InputDecoration(
                    labelText: 'API Secret',
                    hintText: 'Paste your API secret',
                    border: const OutlineInputBorder(),
                    suffixIcon: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        IconButton(
                          icon: Icon(obscureSecret 
                              ? Icons.visibility 
                              : Icons.visibility_off),
                          onPressed: () {
                            setState(() => obscureSecret = !obscureSecret);
                          },
                        ),
                        IconButton(
                          icon: const Icon(Icons.paste),
                          onPressed: () async {
                            final data = await Clipboard.getData('text/plain');
                            if (data?.text != null) {
                              apiSecretController.text = data!.text!;
                            }
                          },
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 16),
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: Colors.amber.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: Colors.amber.withOpacity(0.3)),
                  ),
                  child: Row(
                    children: [
                      Icon(Icons.warning_amber, color: Colors.amber[700]),
                      const SizedBox(width: 8),
                      const Expanded(
                        child: Text(
                          'Never share your API secret with anyone. Enable IP restrictions for security.',
                          style: TextStyle(fontSize: 12),
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
              onPressed: isLoading ? null : () => Navigator.pop(context),
              child: const Text('Cancel'),
            ),
            ElevatedButton(
              onPressed: isLoading
                  ? null
                  : () async {
                      if (apiKeyController.text.isEmpty ||
                          apiSecretController.text.isEmpty) {
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(
                            content: Text('Please enter API key and secret'),
                          ),
                        );
                        return;
                      }

                      setState(() => isLoading = true);

                      try {
                        await _exchangeService.addApi(
                          platform: platform['id'] as String,
                          apiKey: apiKeyController.text.trim(),
                          apiSecret: apiSecretController.text.trim(),
                          label: labelController.text.trim(),
                        );

                        if (mounted) {
                          Navigator.pop(context);
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(
                              content: Text(
                                '${platform['name']} API added successfully!',
                              ),
                              backgroundColor: Colors.green,
                            ),
                          );
                          _loadLinkedApis();
                        }
                      } catch (e) {
                        setState(() => isLoading = false);
                        if (mounted) {
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(
                              content: Text('Error: $e'),
                              backgroundColor: Colors.red,
                            ),
                          );
                        }
                      }
                    },
              child: isLoading
                  ? const SizedBox(
                      width: 20,
                      height: 20,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    )
                  : const Text('Add API'),
            ),
          ],
        ),
      ),
    );
  }
}
