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
    // Backend auto-detects every 15s, so poll every 10s is sufficient
    _pollTimer = Timer.periodic(const Duration(seconds: 10), (timer) async {
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

      // Fetch latest user data to check for balance changes
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
        final totalUnswept = unsweptFunds + received;
        _willAutoSweep = totalUnswept >= (widget.minAmount ?? 100.0);
        
        // Check deposit status from transactions
        final transactions = data['wallet']?['transactions'] as List<dynamic>? ?? [];
        bool hasRecentDeposit = false;
        
        if (transactions.isNotEmpty) {
          // Check for recent completed deposits
          for (final tx in transactions) {
            if (tx['type'] == 'deposit' && 
                tx['status'] == 'completed' &&
                tx['currency']?.toString().toUpperCase() == 'USDT') {
              hasRecentDeposit = true;
              break;
            }
          }
        }
        
        if (!mounted) return;
        
        // Update status based on recent transactions
        if (hasRecentDeposit || currentBalance > (_initialBalance + 0.01)) {
          setState(() {
            _status = 'confirmed';
            _receivedAmount = received;
          });
          // Stop polling immediately when confirmed
          _pollTimer?.cancel();
        } else {
          setState(() {
            _status = 'processing';
            _receivedAmount = received;
          });
        }
      }
    } catch (e) {
      // Don't log errors unless in debug mode
      if (Env.enableApiLogs) {
        print('Payment check failed');
      }
      // Don't change status to failed unless it's a critical error.
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

    // Responsive sizing based on screen height
    final screenHeight = MediaQuery.of(context).size.height;
    final isSmallScreen = screenHeight < 700;
    
    // Dynamic sizes
    final qrSize = isSmallScreen ? 140.0 : 200.0;
    final titleFontSize = isSmallScreen ? 16.0 : 18.0;
    final statusIconSize = isSmallScreen ? 48.0 : 64.0;
    final statusTitleSize = isSmallScreen ? 16.0 : 20.0;
    final statusSubtitleSize = isSmallScreen ? 12.0 : 14.0;
    final addressFontSize = isSmallScreen ? 10.0 : 12.0;
    final warningFontSize = isSmallScreen ? 10.0 : 11.0;
    final timerFontSize = isSmallScreen ? 12.0 : 13.0;
    final padding = isSmallScreen ? 16.0 : 24.0;
    final spacing = isSmallScreen ? 12.0 : 16.0;

    return Dialog(
      backgroundColor: backgroundColor,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
      ),
      elevation: 8,
      child: Container(
        constraints: const BoxConstraints(maxWidth: 450),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Header with close button and timer
            Container(
              padding: EdgeInsets.symmetric(horizontal: padding, vertical: spacing * 0.75),
              decoration: BoxDecoration(
                border: Border(bottom: BorderSide(color: borderColor, width: 1)),
              ),
              child: Row(
                children: [
                  Expanded(
                    child: Text(
                      widget.title,
                      style: TextStyle(
                        fontSize: titleFontSize,
                        fontWeight: FontWeight.bold,
                        color: textColor,
                      ),
                    ),
                  ),
                  if (_status == 'waiting' || _status == 'processing') ...[
                    Icon(Icons.timer_outlined, size: timerFontSize + 2, color: subtextColor),
                    const SizedBox(width: 4),
                    Text(
                      _formatTime(_remainingSeconds),
                      style: TextStyle(
                        fontSize: timerFontSize,
                        fontWeight: FontWeight.w500,
                        color: subtextColor,
                      ),
                    ),
                    const SizedBox(width: 12),
                  ],
                  IconButton(
                    icon: Icon(Icons.close, size: 22, color: subtextColor),
                    onPressed: widget.onClose,
                    padding: EdgeInsets.zero,
                    constraints: const BoxConstraints(),
                    tooltip: 'Close',
                  ),
                ],
              ),
            ),
            
            // Content (no scroll)
            Padding(
              padding: EdgeInsets.all(padding),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.center,
                children: [

            // Status Indicator
            _buildStatusIndicator(textColor, subtextColor, statusIconSize, statusTitleSize, statusSubtitleSize),
            SizedBox(height: spacing),

            // Show QR and address only if waiting or processing
            if (_status == 'waiting' || _status == 'processing') ...[
              // QR Code
              Container(
                padding: EdgeInsets.all(spacing * 0.75),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: borderColor, width: 1),
                ),
                child: QrImageView(
                  data: widget.address,
                  version: QrVersions.auto,
                  size: qrSize,
                  backgroundColor: Colors.white,
                ),
              ),
              SizedBox(height: spacing),
              
              // Network Warning (One Line)
              Container(
                padding: EdgeInsets.symmetric(horizontal: spacing * 0.67, vertical: spacing * 0.5),
                decoration: BoxDecoration(
                  color: isDark ? const Color(0xFF3D2E1F) : const Color(0xFFFFF3E0),
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(
                    color: isDark ? const Color(0xFF755233) : const Color(0xFFFFB74D),
                  ),
                ),
                child: Text(
                  '⚠️ TEST MODE: Use TRON Nile Testnet • USDT (TRC20)${widget.minAmount != null ? " • Auto-sweep ≥${widget.minAmount}" : ""}',
                  style: TextStyle(
                    fontSize: warningFontSize,
                    fontWeight: FontWeight.w600,
                    color: isDark ? const Color(0xFFFFB74D) : const Color(0xFFE65100),
                  ),
                  textAlign: TextAlign.center,
                ),
              ),
              SizedBox(height: spacing),
              
              // Address with Copy Icon
              Container(
                padding: EdgeInsets.symmetric(horizontal: spacing * 0.67, vertical: spacing * 0.67),
                decoration: BoxDecoration(
                  color: surfaceColor,
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: borderColor),
                ),
                child: Row(
                  children: [
                    Expanded(
                      child: Text(
                        widget.address,
                        style: TextStyle(
                          fontSize: addressFontSize,
                          fontFamily: 'monospace',
                          color: textColor,
                        ),
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                    const SizedBox(width: 8),
                    InkWell(
                      onTap: () {
                        Clipboard.setData(ClipboardData(text: widget.address));
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(
                            content: const Text('Address copied'),
                            backgroundColor: isDark ? const Color(0xFF2D2D2D) : Colors.grey[800],
                            behavior: SnackBarBehavior.floating,
                            duration: const Duration(seconds: 2),
                          ),
                        );
                      },
                      child: Icon(Icons.copy, size: addressFontSize + 6, color: textColor),
                    ),
                  ],
                ),
              ),
            ],

            SizedBox(height: spacing),

            // Action Button (only Done for confirmed, nothing for waiting/processing)
            if (_status == 'confirmed' || _status == 'timeout' || _status == 'failed')
              _buildActionButton(isDark, textColor, isSmallScreen),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStatusIndicator(Color textColor, Color? subtextColor, double iconSize, double titleSize, double subtitleSize) {
    IconData icon;
    Color iconColor;
    String title;
    String subtitle;

    switch (_status) {
      case 'waiting':
        icon = Icons.pending_outlined;
        iconColor = Colors.orange;
        title = 'Waiting for Payment';
        subtitle = 'Scan QR or copy address below';
        break;
      case 'processing':
        icon = Icons.sync;
        iconColor = Colors.blue;
        title = 'Processing...';
        subtitle = '$_receivedAmount USDT${_willAutoSweep ? " • Auto-sweep" : ""}';
        break;
      case 'confirmed':
        icon = Icons.check_circle;
        iconColor = Colors.green;
        title = 'Payment Confirmed!';
        subtitle = 'Received: $_receivedAmount USDT${_willAutoSweep ? " (Swept)" : ""}';
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
        title = 'Timeout';
        subtitle = 'Session expired';
        break;
      default:
        icon = Icons.info;
        iconColor = Colors.grey;
        title = 'Unknown';
        subtitle = '';
    }

    return Column(
      children: [
        TweenAnimationBuilder<double>(
          tween: Tween(begin: 0.0, end: 1.0),
          duration: const Duration(milliseconds: 500),
          builder: (context, value, child) {
            return Transform.scale(
              scale: value,
              child: Icon(
                icon,
                size: iconSize,
                color: iconColor,
              ),
            );
          },
        ),
        const SizedBox(height: 12),
        Text(
          title,
          style: TextStyle(
            fontSize: titleSize,
            fontWeight: FontWeight.bold,
            color: textColor,
          ),
          textAlign: TextAlign.center,
        ),
        const SizedBox(height: 6),
        Text(
          subtitle,
          style: TextStyle(
            fontSize: subtitleSize,
            color: subtextColor,
          ),
          textAlign: TextAlign.center,
        ),
        if (_status == 'processing')
          Padding(
            padding: const EdgeInsets.only(top: 12),
            child: SizedBox(
              width: iconSize * 0.5,
              height: iconSize * 0.5,
              child: CircularProgressIndicator(
                strokeWidth: 3,
                valueColor: AlwaysStoppedAnimation<Color>(iconColor),
              ),
            ),
          ),
      ],
    );
  }

  Widget _buildActionButton(bool isDark, Color textColor, bool isSmallScreen) {
    return SizedBox(
      width: double.infinity,
      child: ElevatedButton(
        onPressed: widget.onClose,
        style: ElevatedButton.styleFrom(
          backgroundColor: _status == 'confirmed' 
              ? Colors.green 
              : (isDark ? const Color(0xFF404040) : Colors.grey[300]),
          foregroundColor: _status == 'confirmed' ? Colors.white : textColor,
          padding: EdgeInsets.symmetric(vertical: isSmallScreen ? 12 : 14),
          elevation: 0,
        ),
        child: Text(
          _status == 'confirmed' ? 'Done' : _status == 'timeout' ? 'Retry' : 'Close',
          style: TextStyle(fontSize: isSmallScreen ? 14 : 16),
        ),
      ),
    );
  }
}
