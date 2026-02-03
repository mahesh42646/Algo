import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:provider/provider.dart';
import 'firebase_options.dart';
import 'config/env.dart';
import 'services/auth_service.dart';
import 'services/api_handler.dart';
import 'services/crash_reporter.dart';
import 'services/push_notification_service.dart';
import 'providers/app_state_provider.dart';
import 'screens/auth/email_verification_screen.dart';
import 'screens/auth/password_setup_screen.dart';
import 'screens/auth/login_screen.dart';
import 'screens/auth/forgot_password_screen.dart';
import 'screens/splash_screen.dart';
import 'screens/main_navigation_screen.dart';
import 'screens/onboarding_screen.dart';
import 'screens/coin_detail_screen.dart';
import 'services/onboarding_service.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  // Initialize crash reporter
  await CrashReporter.initialize();
  
  // Run app with crash zone for catching async errors
  runZonedGuarded(
    () => runApp(const AlgoBotApp()),
    (error, stackTrace) {
      CrashReporter().logCrash(
        error: error.toString(),
        stackTrace: stackTrace.toString(),
        context: 'runZonedGuarded - Uncaught async error',
      );
      if (kDebugMode) {
        print('💥 Uncaught error: $error');
        print(stackTrace);
      }
    },
  );
}

class _PostAuthRouter extends StatelessWidget {
  final String uid;

  const _PostAuthRouter({required this.uid});

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<bool>(
      future: OnboardingService().hasSeenOnboarding(uid),
      builder: (context, snapshot) {
        if (!snapshot.hasData) {
          return const Scaffold(
            body: Center(child: CircularProgressIndicator()),
          );
        }
        return snapshot.data == true
            ? const MainNavigationScreen()
            : const OnboardingScreen();
      },
    );
  }
}

@pragma('vm:entry-point')
Future<void> firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  await Firebase.initializeApp(options: DefaultFirebaseOptions.currentPlatform);
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
      FirebaseMessaging.onBackgroundMessage(firebaseMessagingBackgroundHandler);
      await PushNotificationService.initialize();
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
            seedColor: const Color(0xFF4A90E2), // Light bluish theme
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
            navigatorObservers: [CrashReportingNavigatorObserver()],
            theme: ThemeData(
              colorScheme: ColorScheme.fromSeed(
                seedColor: const Color(0xFF4A90E2), // Light bluish theme
                brightness: Brightness.light,
              ),
              primaryColor: const Color(0xFF4A90E2),
              scaffoldBackgroundColor: const Color(0xFFF0F5FF), // Light bluish background
              appBarTheme: const AppBarTheme(
                backgroundColor: Color(0xFFE3F2FD), // Light blue app bar
                foregroundColor: Color(0xFF1565C0),
                elevation: 0,
                centerTitle: false,
              ),
              cardTheme: CardThemeData(
                elevation: 0,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
                color: Colors.white,
              ),
              inputDecorationTheme: InputDecorationTheme(
                filled: true,
                fillColor: const Color(0xFFF5F9FF), // Very light blue fill
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: const BorderSide(color: Color(0xFFBBDEFB)),
                ),
                enabledBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: const BorderSide(color: Color(0xFFBBDEFB)),
                ),
                focusedBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: const BorderSide(color: Color(0xFF4A90E2), width: 2),
                ),
                contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
              ),
              elevatedButtonTheme: ElevatedButtonThemeData(
                style: ElevatedButton.styleFrom(
                  elevation: 0,
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
              ),
              textButtonTheme: TextButtonThemeData(
                style: TextButton.styleFrom(
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(8),
                  ),
                ),
              ),
              outlinedButtonTheme: OutlinedButtonThemeData(
                style: OutlinedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
              ),
              useMaterial3: true,
            ),
            darkTheme: ThemeData(
              colorScheme: ColorScheme.fromSeed(
                seedColor: const Color(0xFF64B5F6),
                brightness: Brightness.dark,
              ),
              scaffoldBackgroundColor: const Color(0xFF121212),
              appBarTheme: const AppBarTheme(
                backgroundColor: Color(0xFF1E1E1E),
                foregroundColor: Colors.white,
                elevation: 0,
                centerTitle: false,
              ),
              cardTheme: CardThemeData(
                elevation: 0,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
                color: const Color(0xFF1E1E1E),
              ),
              inputDecorationTheme: InputDecorationTheme(
                filled: true,
                fillColor: const Color(0xFF2D2D2D),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: const BorderSide(color: Color(0xFF404040)),
                ),
                enabledBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: const BorderSide(color: Color(0xFF404040)),
                ),
                focusedBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: const BorderSide(color: Color(0xFF64B5F6), width: 2),
                ),
                contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
              ),
              elevatedButtonTheme: ElevatedButtonThemeData(
                style: ElevatedButton.styleFrom(
                  elevation: 0,
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
              ),
              textButtonTheme: TextButtonThemeData(
                style: TextButton.styleFrom(
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(8),
                  ),
                ),
              ),
              outlinedButtonTheme: OutlinedButtonThemeData(
                style: OutlinedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
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
                  
                  // If user is logged in, check onboarding then show home or onboarding
                  if (snapshot.hasData && snapshot.data != null) {
                    authService.ensureUserInDatabase();
                    PushNotificationService.onUserLoggedIn(snapshot.data!.uid);
                    return _PostAuthRouter(uid: snapshot.data!.uid);
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
