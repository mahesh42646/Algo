import 'package:flutter/material.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:provider/provider.dart';
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

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const AlgoBotApp());
}

class AlgoBotApp extends StatefulWidget {
  const AlgoBotApp({super.key});

  @override
  State<AlgoBotApp> createState() => _AlgoBotAppState();
}

class _AlgoBotAppState extends State<AlgoBotApp> {
  bool _initialized = false;
  String? _initError;

  @override
  void initState() {
    super.initState();
    _initializeApp();
  }

  Future<void> _initializeApp() async {
    try {
      await Firebase.initializeApp(
        options: DefaultFirebaseOptions.currentPlatform,
      );
      await dotenv.load(fileName: '.env');
      Env.validate();
      ApiHandler().initialize();
      if (mounted) {
        setState(() => _initialized = true);
      }
    } catch (e) {
      if (mounted) {
        setState(() => _initError = e.toString());
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_initError != null) {
      return MaterialApp(
        debugShowCheckedModeBanner: false,
        home: Scaffold(
          body: Center(
            child: Text('Failed to initialize app: $_initError'),
          ),
        ),
      );
    }

    if (!_initialized) {
      return MaterialApp(
        debugShowCheckedModeBanner: false,
        theme: ThemeData(
          colorScheme: ColorScheme.fromSeed(
            seedColor: Colors.deepOrange,
            brightness: Brightness.light,
          ),
          useMaterial3: true,
        ),
        home: const SplashScreen(
          child: Scaffold(
            body: Center(child: CircularProgressIndicator()),
          ),
        ),
      );
    }

    final authService = AuthService();

    return ChangeNotifierProvider(
      create: (_) => AppStateProvider(),
      child: Consumer<AppStateProvider>(
        builder: (context, appState, _) {
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
              child: StreamBuilder(
                stream: authService.authStateChanges,
                builder: (context, snapshot) {
                  // Show loading while checking auth state
                  if (snapshot.connectionState == ConnectionState.waiting) {
                    return const Scaffold(
                      body: Center(child: CircularProgressIndicator()),
                    );
                  }
                  
                  // If user is logged in, show main navigation
                  if (snapshot.hasData && snapshot.data != null) {
                    // Ensure user exists in database (runs once per user)
                    authService.ensureUserInDatabase();
                    return const MainNavigationScreen();
                  }
                  
                  // Otherwise, show login screen
                  return const LoginScreen();
                },
              ),
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
            },
          );
        },
      ),
    );
  }
}
