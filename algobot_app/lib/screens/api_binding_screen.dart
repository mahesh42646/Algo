import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../services/exchange_service.dart';
import '../widgets/skeleton.dart';

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
          ? SingleChildScrollView(
              physics: const NeverScrollableScrollPhysics(),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _buildHeader(),
                  _buildLinkedApisSkeleton(),
                  _buildPlatformList(),
                ],
              ),
            )
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

  Widget _buildLinkedApisSkeleton() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Padding(
          padding: EdgeInsets.all(16),
          child: SkeletonBox(width: 160, height: 18),
        ),
        ...List.generate(3, (index) {
          return Card(
            margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Row(
                children: const [
                  SkeletonBox(width: 50, height: 50),
                  SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        SkeletonBox(width: 140, height: 14),
                        SizedBox(height: 8),
                        SkeletonBox(width: 200, height: 12),
                        SizedBox(height: 6),
                        SkeletonBox(width: 120, height: 12),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          );
        }),
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
            Row(
              children: [
                Text(
                  'Label: ${api.label}',
                  style: TextStyle(color: Colors.grey[600], fontSize: 12),
                ),
                const SizedBox(width: 8),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                  decoration: BoxDecoration(
                    color: api.isTest 
                        ? Colors.orange.withOpacity(0.2)
                        : Colors.green.withOpacity(0.2),
                    borderRadius: BorderRadius.circular(4),
                  ),
                  child: Text(
                    api.isTest ? 'TEST' : 'REAL',
                    style: TextStyle(
                      color: api.isTest ? Colors.orange[700] : Colors.green[700],
                      fontSize: 10,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              ],
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
            content: SingleChildScrollView(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _buildPermissionRow('Can Trade', result['canTrade'] ?? false),
                  const SizedBox(height: 8),
                  _buildPermissionRow('Can Withdraw', result['canWithdraw'] ?? false),
                  const SizedBox(height: 8),
                  _buildPermissionRow('Can Deposit', result['canDeposit'] ?? false),
                  if (result['balances'] != null && (result['balances'] as List).isNotEmpty) ...[
                    const SizedBox(height: 16),
                    const Divider(),
                    const SizedBox(height: 8),
                    const Text(
                      'Sample Balances:',
                      style: TextStyle(fontWeight: FontWeight.bold),
                    ),
                    const SizedBox(height: 8),
                    ...(result['balances'] as List).take(5).map((balance) {
                      final asset = balance['asset'] ?? '';
                      final free = balance['free'] ?? 0;
                      final freeValue = free is String ? double.tryParse(free) ?? 0.0 : (free is num ? free.toDouble() : 0.0);
                      return Padding(
                        padding: const EdgeInsets.symmetric(vertical: 4),
                        child: Text('$asset: ${freeValue.toStringAsFixed(4)}'),
                      );
                    }).toList(),
                  ],
                ],
              ),
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
        String errorMessage = 'Verification failed';
        String errorDetails = '';
        String serverIP = '';
        List<String> troubleshooting = [];
        
        // Try to extract structured error data from exception
        try {
          final errorStr = e.toString();
          
          // Extract server IP
          final ipMatch = RegExp(r'serverIP:\s*([^\s|]+)').firstMatch(errorStr);
          if (ipMatch != null) {
            serverIP = ipMatch.group(1) ?? '';
          }
          
          // Extract troubleshooting steps
          final troubleshootingMatch = RegExp(r'troubleshooting:\s*(.+?)(?:\s*\||$)').firstMatch(errorStr);
          if (troubleshootingMatch != null) {
            final troubleshootingStr = troubleshootingMatch.group(1) ?? '';
            troubleshooting = troubleshootingStr.split(',').map((s) => s.trim()).where((s) => s.isNotEmpty).toList();
          }
          
          // Extract error message and details
          final parts = errorStr.split(' | ');
          if (parts.isNotEmpty) {
            errorMessage = parts[0].replaceAll('Exception: ', '');
            if (parts.length > 1) {
              errorDetails = parts[1];
            }
          }
          
          // Parse specific error types
          if (errorStr.contains('Invalid signature')) {
            errorMessage = 'Invalid API Secret';
            errorDetails = 'Please check your API secret key. Make sure it matches your API key.';
          } else if (errorStr.contains('Invalid API-key') || errorStr.contains('Invalid API key')) {
            errorMessage = 'Invalid API Key';
            errorDetails = 'Please check your API key. Make sure it\'s correct and active.';
          } else if (errorStr.contains('IP') || errorStr.contains('restriction') || errorStr.contains('IP Address Restriction')) {
            errorMessage = 'IP Address Restriction';
            if (serverIP.isEmpty) {
              errorDetails = 'Your API key has IP restrictions enabled. Please whitelist the server IP or disable IP restrictions.';
            } else {
              errorDetails = 'Your API key has IP restrictions. Add the server IP shown below to your Binance API whitelist.';
            }
          } else if (errorStr.contains('Permission') || errorStr.contains('Insufficient Permissions')) {
            errorMessage = 'Insufficient Permissions';
            errorDetails = 'Your API key doesn\'t have the required permissions. Please enable "Enable Reading" and "Enable Spot & Margin Trading" in Binance API settings.';
          } else if (errorStr.contains('expired') || errorStr.contains('Expired')) {
            errorMessage = 'API Key Expired';
            errorDetails = 'Your API key has expired or been revoked. Please create a new API key.';
          }
          
          // If details not set, use the error string
          if (errorDetails.isEmpty) {
            errorDetails = errorStr.replaceAll('Exception: ', '');
          }
        } catch (parseError) {
          errorDetails = e.toString().replaceAll('Exception: ', '');
        }

        showDialog(
          context: context,
          builder: (_) => AlertDialog(
            title: Row(
              children: [
                const Icon(Icons.error_outline, color: Colors.red),
                const SizedBox(width: 8),
                Expanded(child: Text(errorMessage)),
              ],
            ),
            content: SingleChildScrollView(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(errorDetails),
                  if (serverIP.isNotEmpty && serverIP != 'Unknown') ...[
                    const SizedBox(height: 16),
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: Colors.blue[50],
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(color: Colors.blue[200]!),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Icon(Icons.info_outline, color: Colors.blue[700], size: 20),
                              const SizedBox(width: 8),
                              const Text(
                                'Server IP Address:',
                                style: TextStyle(fontWeight: FontWeight.bold),
                              ),
                            ],
                          ),
                          const SizedBox(height: 8),
                          SelectableText(
                            serverIP,
                            style: TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.bold,
                              color: Colors.blue[900],
                              fontFamily: 'monospace',
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            'Add this IP to your Binance API whitelist',
                            style: TextStyle(
                              fontSize: 12,
                              color: Colors.blue[700],
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                  if (troubleshooting.isNotEmpty) ...[
                    const SizedBox(height: 16),
                    const Text(
                      'Troubleshooting Steps:',
                      style: TextStyle(fontWeight: FontWeight.bold),
                    ),
                    const SizedBox(height: 8),
                    ...troubleshooting.map((step) => Padding(
                      padding: const EdgeInsets.only(bottom: 4),
                      child: Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text('• ', style: TextStyle(fontWeight: FontWeight.bold)),
                          Expanded(child: Text(step)),
                        ],
                      ),
                    )),
                  ] else ...[
                    const SizedBox(height: 16),
                    const Text(
                      'Common Issues:',
                      style: TextStyle(fontWeight: FontWeight.bold),
                    ),
                    const SizedBox(height: 8),
                    const Text('• Check that your API key and secret are correct'),
                    const Text('• Ensure "Enable Reading" is enabled'),
                    const Text('• Ensure "Enable Spot & Margin Trading" is enabled'),
                    const Text('• Check IP restrictions if enabled'),
                    const Text('• Make sure the API key is not expired'),
                  ],
                ],
              ),
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
    }
  }

  Widget _buildPermissionRow(String label, bool value) {
    return Row(
      children: [
        Icon(
          value ? Icons.check_circle : Icons.cancel,
          color: value ? Colors.green : Colors.red,
          size: 20,
        ),
        const SizedBox(width: 8),
        Text('$label: ${value ? "Yes" : "No"}'),
      ],
    );
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
            title: Row(
              children: [
                const Icon(Icons.account_balance_wallet, color: Colors.blue),
                const SizedBox(width: 8),
                const Text('Account Balance'),
              ],
            ),
            content: SizedBox(
              width: double.maxFinite,
              child: balances.isEmpty
                  ? const Padding(
                      padding: EdgeInsets.all(16.0),
                      child: Text('No balances found'),
                    )
                  : ListView.builder(
                      shrinkWrap: true,
                      itemCount: balances.length,
                      itemBuilder: (context, index) {
                        final balance = balances[index];
                        return Card(
                          margin: const EdgeInsets.symmetric(vertical: 4),
                          child: ListTile(
                            dense: true,
                            leading: CircleAvatar(
                              backgroundColor: Theme.of(context).colorScheme.primary.withOpacity(0.1),
                              child: Text(
                                balance.asset.substring(0, 1),
                                style: TextStyle(
                                  color: Theme.of(context).colorScheme.primary,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                            ),
                            title: Text(
                              balance.asset,
                              style: const TextStyle(fontWeight: FontWeight.bold),
                            ),
                            subtitle: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text('Free: ${balance.free.toStringAsFixed(8)}'),
                                if (balance.locked > 0)
                                  Text('Locked: ${balance.locked.toStringAsFixed(8)}'),
                              ],
                            ),
                            trailing: Text(
                              balance.total.toStringAsFixed(8),
                              style: const TextStyle(
                                fontWeight: FontWeight.bold,
                                fontSize: 14,
                              ),
                            ),
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
        String errorMessage = 'Failed to get balance';
        String errorDetails = '';
        String serverIP = '';
        List<String> troubleshooting = [];
        
        // Try to extract structured error data from exception
        try {
          final errorStr = e.toString();
          
          // Extract server IP
          final ipMatch = RegExp(r'serverIP:\s*([^\s|]+)').firstMatch(errorStr);
          if (ipMatch != null) {
            serverIP = ipMatch.group(1) ?? '';
          }
          
          // Extract troubleshooting steps
          final troubleshootingMatch = RegExp(r'troubleshooting:\s*(.+?)(?:\s*\||$)').firstMatch(errorStr);
          if (troubleshootingMatch != null) {
            final troubleshootingStr = troubleshootingMatch.group(1) ?? '';
            troubleshooting = troubleshootingStr.split(',').map((s) => s.trim()).where((s) => s.isNotEmpty).toList();
          }
          
          // Extract error message and details
          final parts = errorStr.split(' | ');
          if (parts.isNotEmpty) {
            errorMessage = parts[0].replaceAll('Exception: ', '');
            if (parts.length > 1) {
              errorDetails = parts[1];
            }
          }
          
          // Parse specific error types
          if (errorStr.contains('Invalid signature')) {
            errorMessage = 'Invalid API Secret';
            errorDetails = 'Please check your API secret key.';
          } else if (errorStr.contains('Invalid API-key') || errorStr.contains('Invalid API key')) {
            errorMessage = 'Invalid API Key';
            errorDetails = 'Please check your API key.';
          } else if (errorStr.contains('IP') || errorStr.contains('restriction') || errorStr.contains('IP Address Restriction')) {
            errorMessage = 'IP Address Restriction';
            if (serverIP.isEmpty) {
              errorDetails = 'Your API key has IP restrictions. Please whitelist the server IP.';
            } else {
              errorDetails = 'Your API key has IP restrictions. Add the server IP shown below to your Binance API whitelist.';
            }
          } else if (errorStr.contains('Permission') || errorStr.contains('Insufficient Permissions')) {
            errorMessage = 'Insufficient Permissions';
            errorDetails = 'Your API key needs "Enable Reading" permission.';
          }
          
          // If details not set, use the error string
          if (errorDetails.isEmpty) {
            errorDetails = errorStr.replaceAll('Exception: ', '');
          }
        } catch (parseError) {
          errorDetails = e.toString().replaceAll('Exception: ', '');
        }

        showDialog(
          context: context,
          builder: (_) => AlertDialog(
            title: Row(
              children: [
                const Icon(Icons.error_outline, color: Colors.red),
                const SizedBox(width: 8),
                Expanded(child: Text(errorMessage)),
              ],
            ),
            content: SingleChildScrollView(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(errorDetails),
                  if (serverIP.isNotEmpty && serverIP != 'Unknown') ...[
                    const SizedBox(height: 16),
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: Colors.blue[50],
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(color: Colors.blue[200]!),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Icon(Icons.info_outline, color: Colors.blue[700], size: 20),
                              const SizedBox(width: 8),
                              const Text(
                                'Server IP Address:',
                                style: TextStyle(fontWeight: FontWeight.bold),
                              ),
                            ],
                          ),
                          const SizedBox(height: 8),
                          SelectableText(
                            serverIP,
                            style: TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.bold,
                              color: Colors.blue[900],
                              fontFamily: 'monospace',
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            'Add this IP to your Binance API whitelist',
                            style: TextStyle(
                              fontSize: 12,
                              color: Colors.blue[700],
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                  if (troubleshooting.isNotEmpty) ...[
                    const SizedBox(height: 16),
                    const Text(
                      'Troubleshooting Steps:',
                      style: TextStyle(fontWeight: FontWeight.bold),
                    ),
                    const SizedBox(height: 8),
                    ...troubleshooting.map((step) => Padding(
                      padding: const EdgeInsets.only(bottom: 4),
                      child: Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text('• ', style: TextStyle(fontWeight: FontWeight.bold)),
                          Expanded(child: Text(step)),
                        ],
                      ),
                    )),
                  ],
                ],
              ),
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
    bool isTestKey = false;

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
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: Colors.blue.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: Colors.blue.withOpacity(0.3)),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Icon(Icons.info_outline, color: Colors.blue[700]),
                          const SizedBox(width: 8),
                          const Text(
                            'Key Type',
                            style: TextStyle(
                              fontSize: 14,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 12),
                      Row(
                        children: [
                          Expanded(
                            child: GestureDetector(
                              onTap: () => setState(() => isTestKey = false),
                              child: Container(
                                padding: const EdgeInsets.all(12),
                                decoration: BoxDecoration(
                                  color: !isTestKey
                                      ? Colors.green.withOpacity(0.2)
                                      : Colors.transparent,
                                  borderRadius: BorderRadius.circular(8),
                                  border: Border.all(
                                    color: !isTestKey
                                        ? Colors.green
                                        : Colors.grey[300]!,
                                    width: 2,
                                  ),
                                ),
                                child: Row(
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  children: [
                                    Icon(
                                      Icons.check_circle,
                                      color: !isTestKey ? Colors.green : Colors.grey,
                                      size: 20,
                                    ),
                                    const SizedBox(width: 8),
                                    const Text(
                                      'Real Key',
                                      style: TextStyle(fontWeight: FontWeight.w600),
                                    ),
                                  ],
                                ),
                              ),
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: GestureDetector(
                              onTap: () => setState(() => isTestKey = true),
                              child: Container(
                                padding: const EdgeInsets.all(12),
                                decoration: BoxDecoration(
                                  color: isTestKey
                                      ? Colors.orange.withOpacity(0.2)
                                      : Colors.transparent,
                                  borderRadius: BorderRadius.circular(8),
                                  border: Border.all(
                                    color: isTestKey
                                        ? Colors.orange
                                        : Colors.grey[300]!,
                                    width: 2,
                                  ),
                                ),
                                child: Row(
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  children: [
                                    Icon(
                                      Icons.science,
                                      color: isTestKey ? Colors.orange : Colors.grey,
                                      size: 20,
                                    ),
                                    const SizedBox(width: 8),
                                    const Text(
                                      'Test Key',
                                      style: TextStyle(fontWeight: FontWeight.w600),
                                    ),
                                  ],
                                ),
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 12),
                      Text(
                        isTestKey
                            ? 'Test keys use Binance Testnet (testnet.binance.vision) for safe testing.'
                            : 'Real keys use live Binance API. Demo trading with 0.3% fee will be enabled.',
                        style: TextStyle(
                          fontSize: 12,
                          color: Colors.grey[700],
                        ),
                      ),
                    ],
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
                          isTest: isTestKey,
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
