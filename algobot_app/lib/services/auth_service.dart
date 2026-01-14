import 'package:firebase_auth/firebase_auth.dart';
import 'user_service.dart';
import 'api_handler.dart';

class AuthService {
  final FirebaseAuth _auth = FirebaseAuth.instance;

  // Get current user
  User? get currentUser => _auth.currentUser;

  // Auth state stream
  Stream<User?> get authStateChanges => _auth.authStateChanges();

  // Send email verification code (Firebase sends email with verification link)
  Future<void> sendEmailVerificationCode(String email) async {
    try {
      // Create user with email (unverified) using a temporary password
      // Note: Firebase requires a password, but we'll let user set it after verification
      final randomPassword = 'Temp${DateTime.now().millisecondsSinceEpoch}';
      await _auth.createUserWithEmailAndPassword(
        email: email,
        password: randomPassword,
      );

      // Send email verification link
      await _auth.currentUser?.sendEmailVerification();
      
      // Note: User will be created in MongoDB after password is set
    } on FirebaseAuthException catch (e) {
      String message;
      switch (e.code) {
        case 'email-already-in-use':
          message = 'Email already registered. Please use login or reset password.';
          break;
        case 'invalid-email':
          message = 'Invalid email address.';
          break;
        case 'weak-password':
          message = 'Password is too weak.';
          break;
        default:
          message = e.message ?? 'Failed to send verification code.';
      }
      throw Exception(message);
    }
  }

  // Verify email with code (Firebase handles this automatically via email link)
  // For OTP verification, we'll check if email is verified
  Future<bool> verifyEmail(String email) async {
    try {
      await _auth.currentUser?.reload();
      final user = _auth.currentUser;
      return user?.emailVerified ?? false;
    } catch (e) {
      throw Exception('Failed to verify email: $e');
    }
  }

  // Set password after email verification
  Future<void> setPassword(String password) async {
    try {
      final user = _auth.currentUser;
      if (user == null) {
        throw Exception('No user found. Please verify your email first.');
      }

      if (!user.emailVerified) {
        throw Exception('Email not verified. Please verify your email first.');
      }

      // Update password
      await user.updatePassword(password);
      
      // Re-authenticate to ensure session is valid
      await _auth.signInWithEmailAndPassword(
        email: user.email!,
        password: password,
      );

      // Create user in MongoDB if not exists
      await _createUserInDatabase(user);
    } on FirebaseAuthException catch (e) {
      throw Exception(e.message ?? 'Failed to set password');
    }
  }

  Future<bool> _checkBackendConnection() async {
    try {
      final apiHandler = ApiHandler();
      // Health endpoint is at /api/health, but baseUrl already includes /api
      final response = await apiHandler.get('/health');
      print('✅ Backend health check passed: ${response.statusCode}');
      return response.statusCode == 200;
    } catch (e) {
      print('⚠️ Backend health check failed: $e');
      return false;
    }
  }

  Future<void> _createUserInDatabase(User firebaseUser) async {
    if (firebaseUser.uid.isEmpty || firebaseUser.email == null || firebaseUser.email!.isEmpty) {
      print('❌ Cannot create user in database: Invalid user data');
      return;
    }

    // Check backend connection first
    final isBackendAvailable = await _checkBackendConnection();
    if (!isBackendAvailable) {
      print('⚠️ Backend server is not reachable. User will be created on next successful connection.');
      return;
    }

    final userService = UserService();
    int retryCount = 0;
    const maxRetries = 2; // Reduced retries since we check connection first
    
    while (retryCount < maxRetries) {
      try {
        print('🔄 Attempting to create user in database (attempt ${retryCount + 1}/$maxRetries): ${firebaseUser.uid}');
        await userService.createUser(
          userId: firebaseUser.uid,
          email: firebaseUser.email ?? '',
        );
        print('✅ User created successfully in database: ${firebaseUser.uid}');
        return;
      } catch (e) {
        final errorString = e.toString();
        if (errorString.contains('already exists') || 
            errorString.contains('User already exists') ||
            errorString.contains('409') ||
            errorString.contains('200')) {
          print('✅ User already exists in database: ${firebaseUser.uid}');
          return;
        }
        
        // If it's a connection/timeout error, don't retry
        if (errorString.contains('connection timeout') || 
            errorString.contains('timeout') ||
            errorString.contains('Network error')) {
          print('⚠️ Backend connection timeout. User will be created when backend is available.');
          return;
        }
        
        retryCount++;
        if (retryCount < maxRetries) {
          print('⚠️ Failed to create user (attempt $retryCount/$maxRetries), retrying in ${retryCount * 2} seconds...');
          await Future.delayed(Duration(seconds: retryCount * 2));
        } else {
          print('❌ Failed to create user in database after $maxRetries attempts: $e');
          // Don't throw - allow user to continue even if DB creation fails
        }
      }
    }
  }

  Future<void> ensureUserInDatabase() async {
    final user = _auth.currentUser;
    if (user != null && user.emailVerified) {
      await _createUserInDatabase(user);
    }
  }

  // Login with email and password
  Future<UserCredential> login(String email, String password) async {
    try {
      final credential = await _auth.signInWithEmailAndPassword(
        email: email,
        password: password,
      );

      final user = credential.user;
      if (user != null && !(user.emailVerified)) {
        await _auth.signOut();
        throw Exception('Email not verified. Please verify your email first.');
      }

      // Create user in MongoDB if not exists
      if (user != null) {
        await _createUserInDatabase(user);
      }

      return credential;
    } on FirebaseAuthException catch (e) {
      String message;
      switch (e.code) {
        case 'user-not-found':
          message = 'No user found with this email.';
          break;
        case 'wrong-password':
          message = 'Incorrect password.';
          break;
        case 'invalid-email':
          message = 'Invalid email address.';
          break;
        case 'user-disabled':
          message = 'This account has been disabled.';
          break;
        default:
          message = e.message ?? 'Login failed. Please try again.';
      }
      throw Exception(message);
    }
  }

  // Send password reset email (OTP)
  Future<void> sendPasswordResetCode(String email) async {
    try {
      await _auth.sendPasswordResetEmail(email: email);
    } on FirebaseAuthException catch (e) {
      String message;
      switch (e.code) {
        case 'user-not-found':
          message = 'No user found with this email.';
          break;
        case 'invalid-email':
          message = 'Invalid email address.';
          break;
        default:
          message = e.message ?? 'Failed to send reset code. Please try again.';
      }
      throw Exception(message);
    }
  }

  // Reset password with new password (after OTP verification via email link)
  Future<void> resetPassword(String email, String newPassword) async {
    try {
      // Firebase handles password reset via email link
      // This method is called after user clicks the link in email
      final user = _auth.currentUser;
      if (user != null) {
        await user.updatePassword(newPassword);
      } else {
        throw Exception('No user session found. Please use the reset link from your email.');
      }
    } on FirebaseAuthException catch (e) {
      throw Exception(e.message ?? 'Failed to reset password');
    }
  }

  // Logout
  Future<void> logout() async {
    await _auth.signOut();
  }

  // Check if email is verified
  Future<bool> checkEmailVerified() async {
    await _auth.currentUser?.reload();
    return _auth.currentUser?.emailVerified ?? false;
  }

  // Resend verification email
  Future<void> resendVerificationEmail() async {
    final user = _auth.currentUser;
    if (user != null) {
      await user.sendEmailVerification();
    } else {
      throw Exception('No user found. Please sign up first.');
    }
  }
}
