import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:qr_flutter/qr_flutter.dart';
import '../services/auth_service.dart';
import '../services/user_service.dart';
import '../config/env.dart';

/// Reusable Payment Gateway Modal
/// Can be used on any screen to accept USDT deposits
class PaymentGatewayModal {
  static void show({
    required BuildContext context,
    required String depositAddress,
    required VoidCallback onPaymentComplete,
    String? title,
    double? minAmount,
  }) {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (dialogContext) {
        return _PaymentGatewayContent(
          address: depositAddress,
          onClose: () {
            Navigator.of(dialogContext).pop();
            onPaymentComplete();
          },
          title: title ?? 'Deposit USDT (TRC20)',
          minAmount: minAmount,
        );
      },
    );
  }
}

class _PaymentGatewayContent extends StatefulWidget {
  final String address;
  final VoidCallback onClose;
  final String title;
  final double? minAmount;

  const _PaymentGatewayContent({
    required this.address,
    required this.onClose,
    required this.title,
    this.minAmount,
  });

  @override
  State<_PaymentGatewayContent> createState() => _PaymentGatewayContentState();
}

class _PaymentGatewayContentState extends State<_PaymentGatewayContent> {
  final UserService _userService = UserService();
  final AuthService _authService = AuthService();
  
  String _status = 'waiting'; // waiting, processing, confirmed, failed, timeout
  double _receivedAmount = 0.0;
  int _remainingSeconds = 900; // 15 minutes
  Timer? _pollTimer;
  Timer? _countdownTimer;
  String? _errorMessage;
  double _initialBalance = 0.0;
  bool _willAutoSweep = false;

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
      final user = _authService.currentUser;
      if (user != null) {
        final data = await _userService.getUser(user.uid);
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
      final user = _authService.currentUser;
      if (user == null) return;

      final data = await _userService.getUser(user.uid);
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
        
        // Check unswept funds
        final unsweptFunds = data['wallet']?['unsweptFunds'] ?? 0.0;
        _willAutoSweep = (unsweptFunds + received) >= (widget.minAmount ?? 100.0);
        
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
                  widget.title,
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
              
              // Network Warning
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
                    if (widget.minAmount != null && widget.minAmount! > 0) ...[
                      const SizedBox(height: 4),
                      Text(
                        'Auto-sweep: ${widget.minAmount} USDT or more',
                        style: TextStyle(
                          fontSize: 11,
                          color: subtextColor,
                        ),
                      ),
                    ],
                  ],
                ),
              ),
              const SizedBox(height: 16),
              
              // Address with Copy
              Text(
                'Your Deposit Address:',
                style: TextStyle(
                  fontWeight: FontWeight.w600,
                  fontSize: 13,
                  color: textColor,
                ),
              ),
              const SizedBox(height: 8),
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
              
              // Timer
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

            const SizedBox(height: 24),

            // Action Button
            _buildActionButton(isDark, textColor),
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
        subtitle = 'Amount: $_receivedAmount USDT${_willAutoSweep ? " • Will auto-sweep" : ""}';
        break;
      case 'confirmed':
        icon = Icons.check_circle;
        iconColor = Colors.green;
        title = 'Payment Confirmed!';
        subtitle = 'Received: $_receivedAmount USDT${_willAutoSweep ? " (Auto-swept)" : ""}';
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

  Widget _buildActionButton(bool isDark, Color textColor) {
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
