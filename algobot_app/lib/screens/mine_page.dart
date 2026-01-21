import 'dart:io';
import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:image_picker/image_picker.dart';
import 'package:provider/provider.dart';
import 'package:qr_flutter/qr_flutter.dart';
import '../services/auth_service.dart';
import '../services/user_service.dart';
import '../widgets/notification_bell.dart';
import '../widgets/settings_modal.dart';
import '../widgets/skeleton.dart';
import '../providers/app_state_provider.dart';
import '../config/env.dart';

class MinePage extends StatefulWidget {
  const MinePage({super.key});

  @override
  State<MinePage> createState() => _MinePageState();
}

class _MinePageState extends State<MinePage> {
  final AuthService _authService = AuthService();
  final UserService _userService = UserService();
  final ImagePicker _imagePicker = ImagePicker();
  
  Map<String, dynamic>? _userData;
  bool _isLoading = true;
  bool _isEditing = false;
  final _nicknameController = TextEditingController();
  String? _selectedCountry;
  String? _selectedLanguage = 'en';
  File? _selectedImage;
  bool _isUploading = false;

  final List<String> _languages = [
    'en', 'es', 'fr', 'de', 'zh', 'ja', 'ko', 'hi', 'ar'
  ];

  final Map<String, String> _languageNames = {
    'en': 'English',
    'es': 'Spanish',
    'fr': 'French',
    'de': 'German',
    'zh': 'Chinese',
    'ja': 'Japanese',
    'ko': 'Korean',
    'hi': 'Hindi',
    'ar': 'Arabic',
  };

  @override
  void initState() {
    super.initState();
    _loadUserData();
  }

  @override
  void dispose() {
    _nicknameController.dispose();
    super.dispose();
  }

  Future<void> _loadUserData({bool retryAfterCreate = false}) async {
    if (!mounted) return;
    setState(() => _isLoading = true);
    try {
      final user = _authService.currentUser;
      if (user != null) {
        final data = await _userService.getUser(user.uid);
        if (!mounted) return;
        setState(() {
          _userData = data;
          _nicknameController.text = data['nickname'] ?? '';
          _selectedCountry = data['location']?['country'];
          _selectedLanguage = data['language'] ?? 'en';
          _isLoading = false;
        });
      } else {
        if (!mounted) return;
        setState(() => _isLoading = false);
      }
    } catch (e) {
      if (Env.enableApiLogs) {
        print('❌ Error loading user profile: $e');
      }
      setState(() => _isLoading = false);
      if (mounted) {
        // Try to create user if it doesn't exist (only once)
        final user = _authService.currentUser;
        final errorString = e.toString();
        final isNotFound = errorString.contains('User not found') ||
            errorString.contains('404') ||
            errorString.contains('not found');

        if (!retryAfterCreate && user != null && isNotFound) {
          try {
            await _authService.ensureUserInDatabase();
            await Future.delayed(const Duration(milliseconds: 200));
            await _loadUserData(retryAfterCreate: true);
            return;
          } catch (createError) {
            if (Env.enableApiLogs) {
              print('❌ Failed to create user: $createError');
            }
          }
        }
        
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error loading profile: ${e.toString().replaceAll('Exception: ', '')}'),
            action: SnackBarAction(
              label: 'Retry',
              onPressed: () => _loadUserData(),
            ),
          ),
        );
      }
    }
  }

  Future<void> _pickImage() async {
    try {
      final XFile? image = await _imagePicker.pickImage(
        source: ImageSource.gallery,
        maxWidth: 800,
        maxHeight: 800,
        imageQuality: 85,
      );

      if (image != null) {
        setState(() {
          _selectedImage = File(image.path);
        });
        await _uploadAvatar();
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error picking image: $e')),
        );
      }
    }
  }

  Future<void> _uploadAvatar() async {
    if (_selectedImage == null) return;

    final user = _authService.currentUser;
    if (user == null) return;

    setState(() => _isUploading = true);
    try {
      final avatarUrl = await _userService.uploadAvatar(user.uid, _selectedImage!);
      await _loadUserData();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Avatar updated successfully')),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error uploading avatar: $e')),
        );
      }
    } finally {
      setState(() {
        _isUploading = false;
        _selectedImage = null;
      });
    }
  }

  Future<void> _saveProfile() async {
    final user = _authService.currentUser;
    if (user == null) return;

    setState(() => _isLoading = true);
    try {
      await _userService.updateUser(
        userId: user.uid,
        nickname: _nicknameController.text.trim(),
        location: _selectedCountry != null
            ? {'country': _selectedCountry}
            : null,
        language: _selectedLanguage,
      );
      await _loadUserData();
      setState(() => _isEditing = false);
      // Notification will be created automatically by backend
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Profile updated successfully')),
        );
      }
    } catch (e) {
      setState(() => _isLoading = false);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error updating profile: $e')),
        );
      }
    }
  }

  String _getAvatarUrl() {
    if (_userData?['avatar'] != null) {
      final avatar = _userData!['avatar'] as String;
      if (avatar.startsWith('http')) {
        return avatar;
      }
      if (avatar.startsWith('/uploads')) {
        return '${Env.backendBaseUrl}$avatar';
      }
      final fileName = avatar.split('/').last;
      return '${Env.backendBaseUrl}/uploads/user-profile-photos/$fileName';
    }
    return '';
  }

  String _getDepositAddress() {
    return _userData?['wallet']?['tron']?['address'] ?? '';
  }

  String _getDepositStatus() {
    final status = (_userData?['wallet']?['depositStatus'] ?? 'none').toString();
    switch (status) {
      case 'pending':
        return 'Pending';
      case 'confirmed':
        return 'Confirmed';
      case 'failed':
        return 'Failed';
      default:
        return 'No deposits yet';
    }
  }

  double _getUsdtBalance() {
    final balances = _userData?['wallet']?['balances'] as List<dynamic>? ?? [];
    for (final item in balances) {
      final currency = item['currency']?.toString().toUpperCase();
      if (currency == 'USDT') {
        final amount = item['amount'];
        if (amount is num) return amount.toDouble();
        return double.tryParse(amount.toString()) ?? 0.0;
      }
    }
    return 0.0;
  }

  @override
  Widget build(BuildContext context) {
    final user = _authService.currentUser;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Mine'),
        actions: [
          if (!_isEditing)
            IconButton(
              icon: const Icon(Icons.edit),
              onPressed: () {
                setState(() => _isEditing = true);
              },
            ),
          // Refresh button
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _loadUserData,
          ),
          IconButton(
            icon: const Icon(Icons.settings),
            onPressed: () {
              showDialog(
                context: context,
                builder: (context) => const SettingsModal(),
              );
            },
          ),
          const NotificationBell(),
        ],
      ),
      body: _isLoading
          ? _buildSkeleton()
          : RefreshIndicator(
              onRefresh: _loadUserData,
              child: SingleChildScrollView(
                physics: const AlwaysScrollableScrollPhysics(),
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                  _buildProfileHeader(),
                  const SizedBox(height: 24),
                  _buildWalletSection(),
                  const SizedBox(height: 24),
                  _buildUserInfo(),
                  const SizedBox(height: 24),
                  _buildAdditionalInfo(),
                ],
              ),
            ),
          ),
    );
  }

  Widget _buildSkeleton() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: const [
          Center(
            child: Column(
              children: [
                SkeletonBox(width: 120, height: 120, borderRadius: BorderRadius.all(Radius.circular(60))),
                SizedBox(height: 16),
                SkeletonBox(width: 160, height: 20),
              ],
            ),
          ),
          SizedBox(height: 24),
          SkeletonBox(width: double.infinity, height: 180),
          SizedBox(height: 24),
          SkeletonBox(width: double.infinity, height: 220),
        ],
      ),
    );
  }

  Widget _buildProfileHeader() {
    final avatarUrl = _getAvatarUrl();
    
    return Center(
      child: Column(
        children: [
          Stack(
            children: [
              CircleAvatar(
                radius: 60,
                backgroundColor: Colors.grey[300],
                backgroundImage: avatarUrl.isNotEmpty
                    ? NetworkImage(avatarUrl)
                    : null,
                child: avatarUrl.isEmpty
                    ? const Icon(Icons.person, size: 60, color: Colors.grey)
                    : null,
              ),
              if (_isEditing)
                Positioned(
                  bottom: 0,
                  right: 0,
                  child: CircleAvatar(
                    radius: 20,
                    backgroundColor: Theme.of(context).colorScheme.primary,
                    child: _isUploading
                        ? const Padding(
                            padding: EdgeInsets.all(8.0),
                            child: CircularProgressIndicator(
                              strokeWidth: 2,
                              valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                            ),
                          )
                        : IconButton(
                            icon: const Icon(Icons.camera_alt, size: 20, color: Colors.white),
                            onPressed: _pickImage,
                            padding: EdgeInsets.zero,
                          ),
                  ),
                ),
            ],
          ),
          const SizedBox(height: 16),
          if (_isEditing)
            SizedBox(
              width: 300,
              child: TextField(
                controller: _nicknameController,
                decoration: const InputDecoration(
                  labelText: 'Nickname',
                  border: OutlineInputBorder(),
                ),
              ),
            )
          else
            Text(
              _userData?['nickname'] ?? 'User',
              style: const TextStyle(
                fontSize: 24,
                fontWeight: FontWeight.bold,
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildUserInfo() {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'User Information',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 16),
            _buildInfoRow('User ID', _userData?['userId'] ?? 'N/A'),
            const Divider(),
            _buildInfoRow('Email', _userData?['email'] ?? 'N/A'),
            const Divider(),
            _buildInfoRow('Referral Code', _userData?['referralCode'] ?? 'N/A'),
            const Divider(),
            _buildInfoRow('Wallet ID', _userData?['wallet']?['walletId'] ?? 'N/A'),
            const Divider(),
            _buildInfoRow('Plan', _userData?['subscription']?['plan']?.toUpperCase() ?? 'FREE'),
          ],
        ),
      ),
    );
  }

  Widget _buildWalletSection() {
    final address = _getDepositAddress();
    final status = _getDepositStatus();
    final balance = _getUsdtBalance();

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Wallet',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 12),
            _buildInfoRow('USDT Balance', balance.toStringAsFixed(2)),
            const Divider(),
            _buildInfoRow('Deposit Status', status),
            const SizedBox(height: 12),
            if (address.isNotEmpty)
              Text(
                'Deposit Address',
                style: TextStyle(color: Colors.grey[600], fontSize: 12),
              ),
            if (address.isNotEmpty)
              Text(
                address,
                style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w500),
              ),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: ElevatedButton(
                    onPressed: address.isEmpty ? null : _showDepositModal,
                    child: const Text('Deposit USDT (TRC20)'),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  void _showDepositModal() {
    final address = _getDepositAddress();
    if (address.isEmpty) return;

    showDialog(
      context: context,
      barrierDismissible: false, // Don't allow dismiss by tapping outside
      builder: (dialogContext) {
        return _DepositModalContent(
          address: address,
          onClose: () {
            Navigator.of(dialogContext).pop();
            // Refresh balance after closing
            Future.delayed(const Duration(milliseconds: 300), () {
              _loadUserData();
            });
          },
          userService: _userService,
          authService: _authService,
        );
      },
    );
  }
}

// Stateful Deposit Modal Widget
class _DepositModalContent extends StatefulWidget {
  final String address;
  final VoidCallback onClose;
  final UserService userService;
  final AuthService authService;

  const _DepositModalContent({
    required this.address,
    required this.onClose,
    required this.userService,
    required this.authService,
  });

  @override
  State<_DepositModalContent> createState() => _DepositModalContentState();
}

class _DepositModalContentState extends State<_DepositModalContent> {
  String _status = 'waiting'; // waiting, processing, confirmed, failed, timeout
  double _receivedAmount = 0.0;
  int _remainingSeconds = 900; // 15 minutes = 900 seconds
  Timer? _pollTimer;
  Timer? _countdownTimer;
  String? _errorMessage;
  double _initialBalance = 0.0;

  @override
  void initState() {
    super.initState();
    _loadInitialBalance();
    _startPolling();
    _startCountdown();
  }

  @override
  void dispose() {
    _pollTimer?.cancel();
    _countdownTimer?.cancel();
    super.dispose();
  }

  Future<void> _loadInitialBalance() async {
    try {
      final user = widget.authService.currentUser;
      if (user != null) {
        final data = await widget.userService.getUser(user.uid);
        final balances = data['wallet']?['balances'] as List<dynamic>? ?? [];
        for (final item in balances) {
          if (item['currency']?.toString().toUpperCase() == 'USDT') {
            _initialBalance = (item['amount'] is num)
                ? (item['amount'] as num).toDouble()
                : double.tryParse(item['amount'].toString()) ?? 0.0;
            break;
          }
        }
      }
    } catch (e) {
      if (Env.enableApiLogs) {
        print('Error loading initial balance: $e');
      }
    }
  }

  void _startPolling() {
    // Poll every 5 seconds for transaction updates
    _pollTimer = Timer.periodic(const Duration(seconds: 5), (timer) async {
      if (_status == 'confirmed' || _status == 'timeout' || _status == 'failed') {
        timer.cancel();
        return;
      }
      await _checkForDeposit();
    });
  }

  void _startCountdown() {
    _countdownTimer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (!mounted) {
        timer.cancel();
        return;
      }
      
      setState(() {
        _remainingSeconds--;
      });

      if (_remainingSeconds <= 0) {
        timer.cancel();
        if (_status == 'waiting') {
          setState(() {
            _status = 'timeout';
          });
        }
      }
    });
  }

  Future<void> _checkForDeposit() async {
    try {
      final user = widget.authService.currentUser;
      if (user == null) return;

      final data = await widget.userService.getUser(user.uid);
      final balances = data['wallet']?['balances'] as List<dynamic>? ?? [];
      
      double currentBalance = 0.0;
      for (final item in balances) {
        if (item['currency']?.toString().toUpperCase() == 'USDT') {
          currentBalance = (item['amount'] is num)
              ? (item['amount'] as num).toDouble()
              : double.tryParse(item['amount'].toString()) ?? 0.0;
          break;
        }
      }

      // Check if balance increased
      if (currentBalance > _initialBalance) {
        final received = currentBalance - _initialBalance;
        
        // Check deposit status
        final depositStatus = data['wallet']?['depositStatus']?.toString() ?? 'pending';
        
        if (!mounted) return;
        
        if (depositStatus == 'confirmed') {
          setState(() {
            _status = 'confirmed';
            _receivedAmount = received;
          });
        } else {
          setState(() {
            _status = 'processing';
            _receivedAmount = received;
          });
        }
      }
    } catch (e) {
      if (Env.enableApiLogs) {
        print('Error checking deposit: $e');
      }
      if (mounted && _status != 'confirmed') {
        setState(() {
          _status = 'failed';
          _errorMessage = 'Failed to check transaction status';
        });
      }
    }
  }

  String _formatTime(int seconds) {
    final minutes = seconds ~/ 60;
    final secs = seconds % 60;
    return '${minutes.toString().padLeft(2, '0')}:${secs.toString().padLeft(2, '0')}';
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final backgroundColor = isDark ? const Color(0xFF1E1E1E) : Colors.white;
    final surfaceColor = isDark ? const Color(0xFF2D2D2D) : const Color(0xFFF5F5F5);
    final borderColor = isDark ? const Color(0xFF404040) : const Color(0xFFE0E0E0);
    final textColor = isDark ? Colors.white : Colors.black87;
    final subtextColor = isDark ? Colors.grey[400] : Colors.grey[600];

    return Dialog(
      backgroundColor: backgroundColor,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
      ),
      elevation: 8,
      child: Container(
        constraints: const BoxConstraints(maxWidth: 400),
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            // Header
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'Deposit USDT (TRC20)',
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                    color: textColor,
                  ),
                ),
                if (_status == 'confirmed' || _status == 'timeout' || _status == 'failed')
                  IconButton(
                    icon: Icon(Icons.close, color: subtextColor),
                    onPressed: widget.onClose,
                    padding: EdgeInsets.zero,
                    constraints: const BoxConstraints(),
                  ),
              ],
            ),
            const SizedBox(height: 24),

            // Status Indicator
            _buildStatusIndicator(textColor, subtextColor),
            const SizedBox(height: 24),

            // Show QR and address only if waiting or processing
            if (_status == 'waiting' || _status == 'processing') ...[
                
                // QR Code
                Center(
                  child: Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: borderColor, width: 1),
                    ),
                    child: QrImageView(
                      data: widget.address,
                      version: QrVersions.auto,
                      size: 180,
                      backgroundColor: Colors.white,
                    ),
                  ),
                ),
                const SizedBox(height: 16),
                
                // Warning Box
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: isDark 
                        ? const Color(0xFF3D2E1F) 
                        : const Color(0xFFFFF3E0),
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(
                      color: isDark 
                          ? const Color(0xFF755233) 
                          : const Color(0xFFFFB74D),
                    ),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        '⚠️ Important:',
                        style: TextStyle(
                          fontWeight: FontWeight.bold,
                          color: isDark 
                              ? const Color(0xFFFFB74D) 
                              : const Color(0xFFE65100),
                        ),
                      ),
                      const SizedBox(height: 6),
                      Text(
                        '🔴 TEST MODE - Use Nile Testnet Only',
                        style: TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                          color: isDark ? const Color(0xFFFF6B6B) : Colors.red[700],
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        'Network: USDT (TRC20) on TRON Nile Testnet',
                        style: TextStyle(
                          fontSize: 13,
                          color: textColor,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        '⚙️ Switch TronLink to Nile Testnet before sending',
                        style: TextStyle(
                          fontSize: 11,
                          color: subtextColor,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        'Deposits under 100 USDT will be credited but not auto-swept',
                        style: TextStyle(
                          fontSize: 11,
                          color: subtextColor,
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 16),
                
                // Address Label
                Text(
                  'Your Deposit Address:',
                  style: TextStyle(
                    fontWeight: FontWeight.w600,
                    fontSize: 13,
                    color: textColor,
                  ),
                ),
                const SizedBox(height: 8),
                
                // Address Container with Copy Button
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: surfaceColor,
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: borderColor),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      SelectableText(
                        widget.address,
                        style: TextStyle(
                          fontSize: 12,
                          fontFamily: 'monospace',
                          color: textColor,
                        ),
                      ),
                      const SizedBox(height: 8),
                      OutlinedButton.icon(
                        onPressed: () {
                          Clipboard.setData(ClipboardData(text: widget.address));
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(
                              content: const Text('Address copied to clipboard'),
                              backgroundColor: isDark 
                                  ? const Color(0xFF2D2D2D) 
                                  : Colors.grey[800],
                              behavior: SnackBarBehavior.floating,
                              duration: const Duration(seconds: 2),
                            ),
                          );
                        },
                        icon: const Icon(Icons.copy, size: 16),
                        label: const Text('Copy Address'),
                        style: OutlinedButton.styleFrom(
                          foregroundColor: isDark ? Colors.white : Colors.black87,
                          side: BorderSide(color: borderColor),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 16),
                
                // Timer Display
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: surfaceColor,
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: borderColor),
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.timer_outlined, size: 18, color: subtextColor),
                      const SizedBox(width: 8),
                      Text(
                        'Time remaining: ${_formatTime(_remainingSeconds)}',
                        style: TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.w500,
                          color: textColor,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ],

            const SizedBox(height: 24),

            // Action Button
            _buildActionButton(isDark, textColor, backgroundColor),
          ],
        ),
      ),
    );
  }

  Widget _buildStatusIndicator(Color textColor, Color? subtextColor) {
    IconData icon;
    Color iconColor;
    String title;
    String subtitle;

    switch (_status) {
      case 'waiting':
        icon = Icons.pending_outlined;
        iconColor = Colors.orange;
        title = 'Waiting for Payment';
        subtitle = 'Send USDT to the address below';
        break;
      case 'processing':
        icon = Icons.sync;
        iconColor = Colors.blue;
        title = 'Processing Transaction';
        subtitle = 'Amount: $_receivedAmount USDT';
        break;
      case 'confirmed':
        icon = Icons.check_circle;
        iconColor = Colors.green;
        title = 'Payment Confirmed!';
        subtitle = 'Received: $_receivedAmount USDT';
        break;
      case 'failed':
        icon = Icons.error;
        iconColor = Colors.red;
        title = 'Transaction Failed';
        subtitle = _errorMessage ?? 'Please try again';
        break;
      case 'timeout':
        icon = Icons.access_time;
        iconColor = Colors.grey;
        title = 'Session Timeout';
        subtitle = 'Please try again';
        break;
      default:
        icon = Icons.info;
        iconColor = Colors.grey;
        title = 'Unknown Status';
        subtitle = '';
    }

    return Column(
      children: [
        // Animated Icon
        TweenAnimationBuilder<double>(
          tween: Tween(begin: 0.0, end: 1.0),
          duration: const Duration(milliseconds: 600),
          builder: (context, value, child) {
            return Transform.scale(
              scale: value,
              child: Icon(
                icon,
                size: 64,
                color: iconColor,
              ),
            );
          },
        ),
        const SizedBox(height: 16),
        Text(
          title,
          style: TextStyle(
            fontSize: 20,
            fontWeight: FontWeight.bold,
            color: textColor,
          ),
          textAlign: TextAlign.center,
        ),
        const SizedBox(height: 8),
        Text(
          subtitle,
          style: TextStyle(
            fontSize: 14,
            color: subtextColor,
          ),
          textAlign: TextAlign.center,
        ),
        if (_status == 'processing')
          Padding(
            padding: const EdgeInsets.only(top: 16),
            child: SizedBox(
              width: 30,
              height: 30,
              child: CircularProgressIndicator(
                strokeWidth: 3,
                valueColor: AlwaysStoppedAnimation<Color>(iconColor),
              ),
            ),
          ),
      ],
    );
  }

  Widget _buildActionButton(bool isDark, Color textColor, Color backgroundColor) {
    if (_status == 'waiting' || _status == 'processing') {
      return SizedBox(
        width: double.infinity,
        child: OutlinedButton(
          onPressed: widget.onClose,
          style: OutlinedButton.styleFrom(
            foregroundColor: textColor,
            side: BorderSide(color: isDark ? const Color(0xFF404040) : const Color(0xFFE0E0E0)),
            padding: const EdgeInsets.symmetric(vertical: 14),
          ),
          child: const Text('Cancel'),
        ),
      );
    }

    return SizedBox(
      width: double.infinity,
      child: ElevatedButton(
        onPressed: widget.onClose,
        style: ElevatedButton.styleFrom(
          backgroundColor: _status == 'confirmed' 
              ? Colors.green 
              : (isDark ? const Color(0xFF404040) : Colors.grey[300]),
          foregroundColor: _status == 'confirmed' ? Colors.white : textColor,
          padding: const EdgeInsets.symmetric(vertical: 14),
          elevation: 0,
        ),
        child: Text(_status == 'confirmed' ? 'Done' : _status == 'timeout' ? 'Retry' : 'Close'),
      ),
    );
  }
}

  Widget _buildInfoRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 120,
            child: Text(
              label,
              style: TextStyle(
                color: Colors.grey[600],
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
          Expanded(
            child: Text(
              value,
              style: const TextStyle(
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildAdditionalInfo() {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Additional Information',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 16),
            if (_isEditing) ...[
              DropdownButtonFormField<String>(
                value: _selectedCountry,
                decoration: const InputDecoration(
                  labelText: 'Country',
                  border: OutlineInputBorder(),
                ),
                items: [
                  'United States',
                  'United Kingdom',
                  'Canada',
                  'Australia',
                  'Germany',
                  'France',
                  'Japan',
                  'China',
                  'India',
                  'Brazil',
                ].map((country) {
                  return DropdownMenuItem(
                    value: country,
                    child: Text(country),
                  );
                }).toList(),
                onChanged: (value) {
                  setState(() => _selectedCountry = value);
                },
              ),
              const SizedBox(height: 16),
              Consumer<AppStateProvider>(
                builder: (context, appState, _) {
                  return DropdownButtonFormField<String>(
                    value: appState.language,
                    decoration: const InputDecoration(
                      labelText: 'Language',
                      border: OutlineInputBorder(),
                    ),
                    items: _languages.map((lang) {
                      return DropdownMenuItem(
                        value: lang,
                        child: Text(_languageNames[lang] ?? lang),
                      );
                    }).toList(),
                    onChanged: (value) {
                      if (value != null) {
                        appState.setLanguage(value);
                        setState(() => _selectedLanguage = value);
                      }
                    },
                  );
                },
              ),
              const SizedBox(height: 24),
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton(
                      onPressed: () {
                        setState(() {
                          _isEditing = false;
                          _loadUserData();
                        });
                      },
                      child: const Text('Cancel'),
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: ElevatedButton(
                      onPressed: _saveProfile,
                      child: const Text('Save'),
                    ),
                  ),
                ],
              ),
            ] else ...[
              _buildInfoRow('Location', _userData?['location']?['country'] ?? 'Not set'),
              const Divider(),
              _buildInfoRow('Language', _languageNames[_userData?['language'] ?? 'en'] ?? 'English'),
              const Divider(),
              _buildInfoRow('Counselor', _userData?['counselor']?['nickname'] ?? 'Not assigned'),
            ],
          ],
        ),
      ),
    );
  }
}
