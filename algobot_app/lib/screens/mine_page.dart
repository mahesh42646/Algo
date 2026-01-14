import 'dart:io';
import 'package:flutter/material.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:image_picker/image_picker.dart';
import 'package:provider/provider.dart';
import '../services/auth_service.dart';
import '../services/user_service.dart';
import '../widgets/notification_bell.dart';
import '../widgets/settings_modal.dart';
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

  Future<void> _loadUserData() async {
    setState(() => _isLoading = true);
    try {
      final user = _authService.currentUser;
      if (user != null) {
        // Ensure user exists in database before loading
        await _authService.ensureUserInDatabase();
        
        // Wait a bit for user creation to complete
        await Future.delayed(const Duration(milliseconds: 500));
        
        final data = await _userService.getUser(user.uid);
        setState(() {
          _userData = data;
          _nicknameController.text = data['nickname'] ?? '';
          _selectedCountry = data['location']?['country'];
          _selectedLanguage = data['language'] ?? 'en';
          _isLoading = false;
        });
      } else {
        setState(() => _isLoading = false);
      }
    } catch (e) {
      print('❌ Error loading user profile: $e');
      setState(() => _isLoading = false);
      if (mounted) {
        // Try to create user if it doesn't exist
        final user = _authService.currentUser;
        if (user != null) {
          try {
            await _authService.ensureUserInDatabase();
            await Future.delayed(const Duration(milliseconds: 500));
            await _loadUserData();
            return;
          } catch (createError) {
            print('❌ Failed to create user: $createError');
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
          ? const Center(child: CircularProgressIndicator())
          : SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _buildProfileHeader(),
                  const SizedBox(height: 24),
                  _buildUserInfo(),
                  const SizedBox(height: 24),
                  _buildAdditionalInfo(),
                ],
              ),
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
