import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:provider/provider.dart';
import 'package:connectivity_plus/connectivity_plus.dart';
import 'firebase_options.dart';
import 'config/env.dart';
import 'services/auth_service.dart';
import 'services/api_handler.dart';
import 'providers/app_state_provider.dart';
import 'screens/auth/email_verification_screen.dart';
import 'screens/auth/password_setup_screen.dart';
import 'screens/auth/login_screen.dart';
import 'screens/auth/forgot_password_screen.dart';
import 'screens/splash_screen.dart';
import 'screens/main_navigation_screen.dart';
import 'screens/coin_detail_screen.dart';
import 'screens/api_binding_screen.dart';

class AuthStateHandler extends StatefulWidget {
  final AuthService authService;

  const AuthStateHandler({
    super.key,
    required this.authService,
  });

  @override
  State<AuthStateHandler> createState() => _AuthStateHandlerState();
}

class _AuthStateHandlerState extends State<AuthStateHandler> {
  Timer? _timeoutTimer;
  bool _hasTimedOut = false;
  ConnectivityResult _connectivityResult = ConnectivityResult.none;

  @override
  void initState() {
    super.initState();
    _checkConnectivity();
    // Set a 10-second timeout for auth state determination
    _timeoutTimer = Timer(const Duration(seconds: 10), () {
      if (mounted) {
        setState(() {
          _hasTimedOut = true;
        });
      }
    });
  }

  Future<void> _checkConnectivity() async {
    try {
      final result = await Connectivity().checkConnectivity();
      if (mounted) {
        setState(() {
          _connectivityResult = result;
        });
      }
    } catch (e) {
      print('Error checking connectivity: $e');
    }
  }

  @override
  void dispose() {
    _timeoutTimer?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (_hasTimedOut) {
      // Show fallback UI after timeout
      final hasNetwork = _connectivityResult != ConnectivityResult.none;
      return Scaffold(
        body: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(
                hasNetwork ? Icons.error_outline : Icons.wifi_off,
                size: 64,
                color: hasNetwork ? Colors.orange : Colors.red,
              ),
              const SizedBox(height: 16),
              Text(
                hasNetwork ? 'Connection Issue' : 'No Internet',
                style: const TextStyle(
                  fontSize: 24,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                hasNetwork
                    ? 'Unable to verify authentication status.\nPlease try again.'
                    : 'No internet connection detected.\nPlease check your network settings.',
                textAlign: TextAlign.center,
                style: const TextStyle(fontSize: 16),
              ),
              const SizedBox(height: 24),
              ElevatedButton(
                onPressed: () async {
                  // Check connectivity again
                  await _checkConnectivity();
                  // Restart the timeout and try again
                  setState(() {
                    _hasTimedOut = false;
                  });
                  _timeoutTimer?.cancel();
                  _timeoutTimer = Timer(const Duration(seconds: 10), () {
                    if (mounted) {
                      setState(() {
                        _hasTimedOut = true;
                      });
                    }
                  });
                },
                child: const Text('Retry'),
              ),
            ],
          ),
        ),
      );
    }

    return StreamBuilder(
      stream: widget.authService.authStateChanges,
      builder: (context, snapshot) {
        // Handle errors
        if (snapshot.hasError) {
          _timeoutTimer?.cancel();
          return Scaffold(
            body: Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(
                    Icons.error,
                    size: 64,
                    color: Colors.red,
                  ),
                  const SizedBox(height: 16),
                  const Text(
                    'Authentication Error',
                    style: TextStyle(
                      fontSize: 24,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 8),
                  const Text(
                    'Failed to check authentication status.\nPlease restart the app.',
                    textAlign: TextAlign.center,
                    style: TextStyle(fontSize: 16),
                  ),
                  const SizedBox(height: 24),
                  ElevatedButton(
                    onPressed: () {
                      // Force restart by setting timeout to true
                      setState(() {
                        _hasTimedOut = true;
                      });
                    },
                    child: const Text('Continue'),
                  ),
                ],
              ),
            ),
          );
        }

        // Show loading while checking auth state
        if (snapshot.connectionState == ConnectionState.waiting) {
          return const Scaffold(
            body: Center(child: CircularProgressIndicator()),
          );
        }

        // Cancel timeout if we got a result
        _timeoutTimer?.cancel();

        // If user is logged in, show main navigation
        if (snapshot.hasData && snapshot.data != null) {
          // Ensure user exists in database
          widget.authService.ensureUserInDatabase();
          return const MainNavigationScreen();
        }

        // Otherwise, show login screen
        return const LoginScreen();
      },
    );
  }
}

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Initialize Firebase with platform-specific options
  try {
    await Firebase.initializeApp(
      options: DefaultFirebaseOptions.currentPlatform,
    );
    print('Firebase initialized successfully');
  } catch (e) {
    print('Failed to initialize Firebase: $e');
    // Continue with the app even if Firebase fails - show error in UI
  }

  // Load environment variables (optional - uses defaults if file doesn't exist)
  try {
    await dotenv.load(fileName: '.env.local');
    print('Environment variables loaded from .env.local');
  } catch (e) {
    // .env.local file doesn't exist, will use defaults from env.dart
    print('Warning: .env.local file not found, using default environment variables');
  }

  // Validate environment variables (non-blocking in development)
  try {
    Env.validate();
    print('Environment validation passed');
  } catch (e) {
    print('Environment validation failed: $e');
    // Continue with app even if validation fails
  }

  // Initialize API handler
  try {
    ApiHandler().initialize();
    print('API handler initialized successfully');
  } catch (e) {
    print('Failed to initialize API handler: $e');
    // Continue with app
  }

  // Initialize AppStateProvider
  try {
    final appStateProvider = AppStateProvider();
    await appStateProvider.init();
    print('AppStateProvider initialized successfully');
  } catch (e) {
    print('Failed to initialize AppStateProvider: $e');
    // Continue with app - it will use default values
  }

  runApp(const AlgoBotApp());
}

class AlgoBotApp extends StatefulWidget {
  const AlgoBotApp({super.key});

  @override
  State<AlgoBotApp> createState() => _AlgoBotAppState();
}

class _AlgoBotAppState extends State<AlgoBotApp> {
  late final AuthService authService;
  late final AppStateProvider appStateProvider;

  @override
  void initState() {
    super.initState();
    authService = AuthService();
    appStateProvider = AppStateProvider();
  }

  @override
  Widget build(BuildContext context) {
    return ChangeNotifierProvider.value(
      value: appStateProvider,
      child: Consumer<AppStateProvider>(
        builder: (context, appState, _) {
          try {
            return MaterialApp(
            title: Env.appName,
            debugShowCheckedModeBanner: false,
            theme: ThemeData(
              colorScheme: ColorScheme.fromSeed(
                seedColor: Colors.deepOrange,
                brightness: Brightness.light,
              ),
              useMaterial3: true,
            ),
            darkTheme: ThemeData(
              colorScheme: ColorScheme.fromSeed(
                seedColor: Colors.deepOrange,
                brightness: Brightness.dark,
              ),
              useMaterial3: true,
            ),
            themeMode: appState.themeMode,
            // Show splash screen on every launch
            home: SplashScreen(
              child: AuthStateHandler(authService: authService),
            ),
            routes: {
              '/login': (context) => const LoginScreen(),
              '/email-verification': (context) => const EmailVerificationScreen(),
              '/set-password': (context) {
                final args = ModalRoute.of(context)!.settings.arguments as Map<String, dynamic>;
                return PasswordSetupScreen(email: args['email']);
              },
              '/forgot-password': (context) => const ForgotPasswordScreen(),
              '/home': (context) => const MainNavigationScreen(),
              '/coin-detail': (context) {
                final args = ModalRoute.of(context)!.settings.arguments as Map<String, dynamic>;
                return CoinDetailScreen(
                  coin: args['coin'],
                  quoteCurrency: args['quoteCurrency'],
                );
              },
              '/api-binding': (context) => const ApiBindingScreen(),
            },
          );
          } catch (e) {
            // Fallback UI in case of initialization errors
            return MaterialApp(
              title: 'AlgoBot - Error',
              debugShowCheckedModeBanner: false,
              home: Scaffold(
                body: Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(
                        Icons.error,
                        size: 64,
                        color: Colors.red,
                      ),
                      const SizedBox(height: 16),
                      const Text(
                        'Initialization Error',
                        style: TextStyle(
                          fontSize: 24,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        'Failed to initialize app: $e',
                        textAlign: TextAlign.center,
                        style: const TextStyle(fontSize: 16),
                      ),
                      const SizedBox(height: 24),
                      ElevatedButton(
                        onPressed: () {
                          // Force restart the app
                          setState(() {});
                        },
                        child: const Text('Retry'),
                      ),
                    ],
                  ),
                ),
              ),
            );
          }
        },
      ),
    );
  }
}
