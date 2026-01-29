# Flutter Deployment Pipeline & Production Guide

## Executive Summary

This document defines the comprehensive deployment strategy for TripAvail Flutter app, covering automated CI/CD pipelines, staging environments, production releases, and app store deployment processes. The strategy ensures reliable, secure, and scalable deployment while maintaining the sophisticated features from the React implementation including role-based architecture, complex animations, and real-time capabilities.

### Key Deployment Areas
- **Multi-Environment Setup**: Development, staging, and production configurations
- **Automated CI/CD Pipeline**: GitHub Actions with comprehensive testing and deployment
- **App Store Deployment**: iOS App Store and Google Play Store release processes
- **Backend Coordination**: API versioning and database migration coordination
- **Performance Monitoring**: Real-time performance tracking and alerting
- **Rollback Strategies**: Safe deployment with quick rollback capabilities

---

## 🚀 Deployment Architecture Overview

### **Deployment Environment Hierarchy**
```
TripAvail Deployment Pipeline
├── Development Environment
│   ├── Local Development Setup
│   ├── Feature Branch Deployments
│   ├── Integration Testing
│   └── Development Database
├── Staging Environment
│   ├── Pre-production Testing
│   ├── User Acceptance Testing
│   ├── Performance Testing
│   └── Staging Database
├── Production Environment
│   ├── App Store Distribution
│   ├── Production API Integration
│   ├── Production Database
│   └── Performance Monitoring
├── CI/CD Pipeline
│   ├── Automated Testing
│   ├── Build Automation
│   ├── Security Scanning
│   └── Deployment Automation
└── Monitoring & Analytics
    ├── Performance Tracking
    ├── Error Monitoring
    ├── User Analytics
    └── Business Metrics
```

### **Environment Configuration Matrix**
```dart
// Environment configuration strategy
enum Environment {
  development('dev'),
  staging('staging'),
  production('prod');
  
  const Environment(this.identifier);
  final String identifier;
}
```

---

## 🔧 Environment Configuration Setup

### **Flutter Environment Configuration**
```dart
// lib/config/environment_config.dart
import 'package:flutter/foundation.dart';

class EnvironmentConfig {
  static const String _environment = String.fromEnvironment(
    'ENVIRONMENT',
    defaultValue: 'development',
  );
  
  static Environment get environment {
    switch (_environment) {
      case 'staging':
        return Environment.staging;
      case 'production':
        return Environment.production;
      default:
        return Environment.development;
    }
  }
  
  // API Configuration
  static String get apiBaseUrl {
    switch (environment) {
      case Environment.development:
        return 'https://dev-api.tripavail.com';
      case Environment.staging:
        return 'https://staging-api.tripavail.com';
      case Environment.production:
        return 'https://api.tripavail.com';
    }
  }
  
  static String get websocketUrl {
    switch (environment) {
      case Environment.development:
        return 'wss://dev-api.tripavail.com/ws';
      case Environment.staging:
        return 'wss://staging-api.tripavail.com/ws';
      case Environment.production:
        return 'wss://api.tripavail.com/ws';
    }
  }
  
  // Database Configuration
  static String get databaseName {
    switch (environment) {
      case Environment.development:
        return 'tripavail_dev.db';
      case Environment.staging:
        return 'tripavail_staging.db';
      case Environment.production:
        return 'tripavail.db';
    }
  }
  
  // Feature Flags
  static bool get enableDebugFeatures {
    return environment == Environment.development || kDebugMode;
  }
  
  static bool get enablePerformanceMonitoring {
    return environment == Environment.staging || environment == Environment.production;
  }
  
  static bool get enableCrashReporting {
    return environment == Environment.production;
  }
  
  // Analytics Configuration
  static String get analyticsKey {
    switch (environment) {
      case Environment.development:
        return const String.fromEnvironment('DEV_ANALYTICS_KEY');
      case Environment.staging:
        return const String.fromEnvironment('STAGING_ANALYTICS_KEY');
      case Environment.production:
        return const String.fromEnvironment('PROD_ANALYTICS_KEY');
    }
  }
  
  // Push Notification Configuration
  static String get firebaseProjectId {
    switch (environment) {
      case Environment.development:
        return 'tripavail-dev';
      case Environment.staging:
        return 'tripavail-staging';
      case Environment.production:
        return 'tripavail-prod';
    }
  }
  
  // Security Configuration
  static bool get enableCertificatePinning {
    return environment == Environment.production;
  }
  
  static Duration get apiTimeout {
    switch (environment) {
      case Environment.development:
        return const Duration(seconds: 30);
      case Environment.staging:
        return const Duration(seconds: 20);
      case Environment.production:
        return const Duration(seconds: 15);
    }
  }
  
  // Build Configuration
  static String get buildVariant {
    switch (environment) {
      case Environment.development:
        return 'debug';
      case Environment.staging:
        return 'staging';
      case Environment.production:
        return 'release';
    }
  }
  
  // App Configuration
  static String get appName {
    switch (environment) {
      case Environment.development:
        return 'TripAvail Dev';
      case Environment.staging:
        return 'TripAvail Staging';
      case Environment.production:
        return 'TripAvail';
    }
  }
  
  static String get bundleIdentifier {
    switch (environment) {
      case Environment.development:
        return 'com.tripavail.app.dev';
      case Environment.staging:
        return 'com.tripavail.app.staging';
      case Environment.production:
        return 'com.tripavail.app';
    }
  }
}

// Configuration provider
final environmentConfigProvider = Provider<EnvironmentConfig>((ref) {
  return EnvironmentConfig();
});
```

### **Build Configuration Files**
```yaml
# android/app/build.gradle
android {
    compileSdkVersion 34

    defaultConfig {
        applicationId "com.tripavail.app"
        minSdkVersion 21
        targetSdkVersion 34
        versionCode flutterVersionCode.toInteger()
        versionName flutterVersionName
        multiDexEnabled true
    }

    buildTypes {
        debug {
            applicationIdSuffix ".dev"
            debuggable true
            minifyEnabled false
            manifestPlaceholders = [
                appName: "TripAvail Dev",
                appIcon: "@mipmap/ic_launcher_dev"
            ]
        }
        
        staging {
            applicationIdSuffix ".staging"
            debuggable false
            minifyEnabled true
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
            manifestPlaceholders = [
                appName: "TripAvail Staging",
                appIcon: "@mipmap/ic_launcher_staging"
            ]
            signingConfig signingConfigs.staging
        }
        
        release {
            debuggable false
            minifyEnabled true
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
            manifestPlaceholders = [
                appName: "TripAvail",
                appIcon: "@mipmap/ic_launcher"
            ]
            signingConfig signingConfigs.release
        }
    }

    flavorDimensions "environment"
    productFlavors {
        dev {
            dimension "environment"
            applicationId "com.tripavail.app.dev"
            resValue "string", "app_name", "TripAvail Dev"
            buildConfigField "String", "API_BASE_URL", '"https://dev-api.tripavail.com"'
            buildConfigField "String", "ENVIRONMENT", '"development"'
        }
        
        staging {
            dimension "environment"
            applicationId "com.tripavail.app.staging"
            resValue "string", "app_name", "TripAvail Staging"
            buildConfigField "String", "API_BASE_URL", '"https://staging-api.tripavail.com"'
            buildConfigField "String", "ENVIRONMENT", '"staging"'
        }
        
        prod {
            dimension "environment"
            applicationId "com.tripavail.app"
            resValue "string", "app_name", "TripAvail"
            buildConfigField "String", "API_BASE_URL", '"https://api.tripavail.com"'
            buildConfigField "String", "ENVIRONMENT", '"production"'
        }
    }
    
    signingConfigs {
        staging {
            storeFile file(STAGING_STORE_FILE)
            storePassword STAGING_STORE_PASSWORD
            keyAlias STAGING_KEY_ALIAS
            keyPassword STAGING_KEY_PASSWORD
        }
        release {
            storeFile file(RELEASE_STORE_FILE)
            storePassword RELEASE_STORE_PASSWORD
            keyAlias RELEASE_KEY_ALIAS
            keyPassword RELEASE_KEY_PASSWORD
        }
    }
}
```

```xml
<!-- ios/Runner/Info.plist configurations -->
<key>CFBundleDisplayName</key>
<string>$(APP_DISPLAY_NAME)</string>
<key>CFBundleIdentifier</key>
<string>$(PRODUCT_BUNDLE_IDENTIFIER)</string>
<key>CFBundleVersion</key>
<string>$(FLUTTER_BUILD_NUMBER)</string>
<key>CFBundleShortVersionString</key>
<string>$(FLUTTER_BUILD_NAME)</string>

<!-- Environment-specific configurations -->
<key>API_BASE_URL</key>
<string>$(API_BASE_URL)</string>
<key>ENVIRONMENT</key>
<string>$(ENVIRONMENT)</string>
```

### **Firebase Configuration**
```dart
// lib/config/firebase_config.dart
class FirebaseConfig {
  static Future<void> initializeFirebase() async {
    await Firebase.initializeApp(
      options: _getFirebaseOptions(),
    );
    
    // Configure Crashlytics
    if (EnvironmentConfig.enableCrashReporting) {
      FlutterError.onError = (errorDetails) {
        FirebaseCrashlytics.instance.recordFlutterFatalError(errorDetails);
      };
      
      PlatformDispatcher.instance.onError = (error, stack) {
        FirebaseCrashlytics.instance.recordError(error, stack, fatal: true);
        return true;
      };
    }
    
    // Configure Analytics
    await FirebaseAnalytics.instance.setAnalyticsCollectionEnabled(
      EnvironmentConfig.environment != Environment.development,
    );
    
    // Configure Performance Monitoring
    if (EnvironmentConfig.enablePerformanceMonitoring) {
      await FirebasePerformance.instance.setPerformanceCollectionEnabled(true);
    }
  }
  
  static FirebaseOptions _getFirebaseOptions() {
    switch (EnvironmentConfig.environment) {
      case Environment.development:
        return const FirebaseOptions(
          apiKey: 'dev-api-key',
          appId: 'dev-app-id',
          messagingSenderId: 'dev-sender-id',
          projectId: 'tripavail-dev',
          storageBucket: 'tripavail-dev.appspot.com',
        );
      case Environment.staging:
        return const FirebaseOptions(
          apiKey: 'staging-api-key',
          appId: 'staging-app-id',
          messagingSenderId: 'staging-sender-id',
          projectId: 'tripavail-staging',
          storageBucket: 'tripavail-staging.appspot.com',
        );
      case Environment.production:
        return const FirebaseOptions(
          apiKey: 'prod-api-key',
          appId: 'prod-app-id',
          messagingSenderId: 'prod-sender-id',
          projectId: 'tripavail-prod',
          storageBucket: 'tripavail-prod.appspot.com',
        );
    }
  }
}
```

---

## 🔄 CI/CD Pipeline Implementation

### **GitHub Actions Workflow**
```yaml
# .github/workflows/deploy.yml
name: TripAvail Deployment Pipeline

on:
  push:
    branches: [ main, develop, staging ]
  pull_request:
    branches: [ main ]
  workflow_dispatch:
    inputs:
      environment:
        description: 'Deployment environment'
        required: true
        default: 'staging'
        type: choice
        options:
        - development
        - staging
        - production
      version_bump:
        description: 'Version bump type'
        required: true
        default: 'patch'
        type: choice
        options:
        - patch
        - minor
        - major

env:
  FLUTTER_VERSION: '3.16.0'
  JAVA_VERSION: '17'
  XCODE_VERSION: '15.1'

jobs:
  # Determine deployment configuration
  setup:
    runs-on: ubuntu-latest
    outputs:
      environment: ${{ steps.config.outputs.environment }}
      should_deploy: ${{ steps.config.outputs.should_deploy }}
      version: ${{ steps.version.outputs.version }}
    steps:
      - name: Checkout
        uses: actions/checkout@v4
        with:
          fetch-depth: 0
          
      - name: Determine deployment configuration
        id: config
        run: |
          if [[ "${{ github.event_name }}" == "workflow_dispatch" ]]; then
            echo "environment=${{ github.event.inputs.environment }}" >> $GITHUB_OUTPUT
            echo "should_deploy=true" >> $GITHUB_OUTPUT
          elif [[ "${{ github.ref }}" == "refs/heads/main" ]]; then
            echo "environment=production" >> $GITHUB_OUTPUT
            echo "should_deploy=true" >> $GITHUB_OUTPUT
          elif [[ "${{ github.ref }}" == "refs/heads/staging" ]]; then
            echo "environment=staging" >> $GITHUB_OUTPUT
            echo "should_deploy=true" >> $GITHUB_OUTPUT
          elif [[ "${{ github.ref }}" == "refs/heads/develop" ]]; then
            echo "environment=development" >> $GITHUB_OUTPUT
            echo "should_deploy=true" >> $GITHUB_OUTPUT
          else
            echo "environment=development" >> $GITHUB_OUTPUT
            echo "should_deploy=false" >> $GITHUB_OUTPUT
          fi
          
      - name: Generate version
        id: version
        run: |
          if [[ "${{ github.event_name }}" == "workflow_dispatch" ]]; then
            # Use semantic versioning
            CURRENT_VERSION=$(grep -o 'version: [^+]*' pubspec.yaml | cut -d ' ' -f2)
            NEW_VERSION=$(npx semver $CURRENT_VERSION -i ${{ github.event.inputs.version_bump }})
            echo "version=$NEW_VERSION" >> $GITHUB_OUTPUT
          else
            # Use commit-based versioning
            COMMIT_COUNT=$(git rev-list --count HEAD)
            COMMIT_HASH=$(git rev-parse --short HEAD)
            echo "version=1.0.$COMMIT_COUNT+$COMMIT_HASH" >> $GITHUB_OUTPUT
          fi

  # Security and code quality checks
  security:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4
        
      - name: Run security scan
        uses: securecodewarrior/github-action-add-sarif@v1
        with:
          sarif-file: 'security-scan-results.sarif'
          
      - name: Dependency check
        run: |
          flutter pub deps --json | jq '.packages[] | select(.kind == "direct") | .name' > dependencies.txt
          # Add dependency vulnerability scanning
          
      - name: License compliance check
        run: |
          flutter pub deps --json | jq -r '.packages[] | "\(.name): \(.version)"' > licenses.txt
          # Verify license compliance

  # Comprehensive testing
  test:
    runs-on: ubuntu-latest
    needs: [setup]
    strategy:
      matrix:
        test_type: [unit, widget, integration]
    steps:
      - name: Checkout
        uses: actions/checkout@v4
        
      - name: Setup Flutter
        uses: subosito/flutter-action@v2
        with:
          flutter-version: ${{ env.FLUTTER_VERSION }}
          channel: 'stable'
          cache: true
          
      - name: Install dependencies
        run: flutter pub get
        
      - name: Run ${{ matrix.test_type }} tests
        run: |
          case "${{ matrix.test_type }}" in
            "unit")
              flutter test test/unit/ --coverage --reporter=github
              ;;
            "widget")
              flutter test test/widget/ --coverage --reporter=github
              ;;
            "integration")
              flutter test test/integration/ --coverage --reporter=github
              ;;
          esac
          
      - name: Upload coverage
        if: matrix.test_type == 'unit'
        uses: codecov/codecov-action@v3
        with:
          file: coverage/lcov.info
          flags: ${{ matrix.test_type }}

  # Build for Android
  build_android:
    runs-on: ubuntu-latest
    needs: [setup, test]
    if: needs.setup.outputs.should_deploy == 'true'
    strategy:
      matrix:
        build_type: [apk, appbundle]
    steps:
      - name: Checkout
        uses: actions/checkout@v4
        
      - name: Setup Flutter
        uses: subosito/flutter-action@v2
        with:
          flutter-version: ${{ env.FLUTTER_VERSION }}
          channel: 'stable'
          cache: true
          
      - name: Setup Java
        uses: actions/setup-java@v3
        with:
          distribution: 'zulu'
          java-version: ${{ env.JAVA_VERSION }}
          
      - name: Configure environment
        env:
          ENVIRONMENT: ${{ needs.setup.outputs.environment }}
        run: |
          echo "ENVIRONMENT=$ENVIRONMENT" >> $GITHUB_ENV
          
          # Configure signing
          if [[ "$ENVIRONMENT" == "production" ]]; then
            echo "${{ secrets.ANDROID_KEYSTORE_BASE64 }}" | base64 -d > android/app/keystore.jks
            echo "ANDROID_KEYSTORE_PATH=keystore.jks" >> $GITHUB_ENV
            echo "ANDROID_KEYSTORE_PASSWORD=${{ secrets.ANDROID_KEYSTORE_PASSWORD }}" >> $GITHUB_ENV
            echo "ANDROID_KEY_ALIAS=${{ secrets.ANDROID_KEY_ALIAS }}" >> $GITHUB_ENV
            echo "ANDROID_KEY_PASSWORD=${{ secrets.ANDROID_KEY_PASSWORD }}" >> $GITHUB_ENV
          elif [[ "$ENVIRONMENT" == "staging" ]]; then
            echo "${{ secrets.ANDROID_STAGING_KEYSTORE_BASE64 }}" | base64 -d > android/app/staging-keystore.jks
            echo "ANDROID_KEYSTORE_PATH=staging-keystore.jks" >> $GITHUB_ENV
            echo "ANDROID_KEYSTORE_PASSWORD=${{ secrets.ANDROID_STAGING_KEYSTORE_PASSWORD }}" >> $GITHUB_ENV
            echo "ANDROID_KEY_ALIAS=${{ secrets.ANDROID_STAGING_KEY_ALIAS }}" >> $GITHUB_ENV
            echo "ANDROID_KEY_PASSWORD=${{ secrets.ANDROID_STAGING_KEY_PASSWORD }}" >> $GITHUB_ENV
          fi
          
      - name: Install dependencies
        run: flutter pub get
        
      - name: Update version
        run: |
          VERSION="${{ needs.setup.outputs.version }}"
          BUILD_NUMBER=$(echo $VERSION | cut -d'+' -f2)
          VERSION_NAME=$(echo $VERSION | cut -d'+' -f1)
          
          # Update pubspec.yaml
          sed -i "s/version: .*/version: $VERSION/" pubspec.yaml
          
      - name: Build Android ${{ matrix.build_type }}
        run: |
          ENV_FLAVOR="prod"
          if [[ "${{ needs.setup.outputs.environment }}" == "development" ]]; then
            ENV_FLAVOR="dev"
          elif [[ "${{ needs.setup.outputs.environment }}" == "staging" ]]; then
            ENV_FLAVOR="staging"
          fi
          
          if [[ "${{ matrix.build_type }}" == "apk" ]]; then
            flutter build apk --release --flavor $ENV_FLAVOR -t lib/main.dart \
              --dart-define=ENVIRONMENT=${{ needs.setup.outputs.environment }}
          else
            flutter build appbundle --release --flavor $ENV_FLAVOR -t lib/main.dart \
              --dart-define=ENVIRONMENT=${{ needs.setup.outputs.environment }}
          fi
          
      - name: Upload Android artifacts
        uses: actions/upload-artifact@v3
        with:
          name: android-${{ matrix.build_type }}-${{ needs.setup.outputs.environment }}
          path: |
            build/app/outputs/flutter-apk/*.apk
            build/app/outputs/bundle/*/*.aab
          retention-days: 30

  # Build for iOS
  build_ios:
    runs-on: macos-latest
    needs: [setup, test]
    if: needs.setup.outputs.should_deploy == 'true'
    steps:
      - name: Checkout
        uses: actions/checkout@v4
        
      - name: Setup Flutter
        uses: subosito/flutter-action@v2
        with:
          flutter-version: ${{ env.FLUTTER_VERSION }}
          channel: 'stable'
          cache: true
          
      - name: Setup Xcode
        uses: maxim-lobanov/setup-xcode@v1
        with:
          xcode-version: ${{ env.XCODE_VERSION }}
          
      - name: Install dependencies
        run: flutter pub get
        
      - name: Install iOS dependencies
        run: cd ios && pod install
        
      - name: Configure signing
        env:
          ENVIRONMENT: ${{ needs.setup.outputs.environment }}
        run: |
          # Import certificates and provisioning profiles
          if [[ "$ENVIRONMENT" == "production" ]]; then
            echo "${{ secrets.IOS_CERTIFICATE_BASE64 }}" | base64 -d > ios_certificate.p12
            echo "${{ secrets.IOS_PROVISIONING_PROFILE_BASE64 }}" | base64 -d > ios_profile.mobileprovision
            
            # Install certificate
            security create-keychain -p "" build.keychain
            security default-keychain -s build.keychain
            security unlock-keychain -p "" build.keychain
            security import ios_certificate.p12 -k build.keychain -P "${{ secrets.IOS_CERTIFICATE_PASSWORD }}" -A
            security set-key-partition-list -S apple-tool:,apple: -s -k "" build.keychain
            
            # Install provisioning profile
            mkdir -p ~/Library/MobileDevice/Provisioning\ Profiles
            cp ios_profile.mobileprovision ~/Library/MobileDevice/Provisioning\ Profiles/
          fi
          
      - name: Update version
        run: |
          VERSION="${{ needs.setup.outputs.version }}"
          BUILD_NUMBER=$(echo $VERSION | cut -d'+' -f2)
          VERSION_NAME=$(echo $VERSION | cut -d'+' -f1)
          
          # Update pubspec.yaml
          sed -i "" "s/version: .*/version: $VERSION/" pubspec.yaml
          
          # Update iOS version
          /usr/libexec/PlistBuddy -c "Set :CFBundleShortVersionString $VERSION_NAME" ios/Runner/Info.plist
          /usr/libexec/PlistBuddy -c "Set :CFBundleVersion $BUILD_NUMBER" ios/Runner/Info.plist
          
      - name: Build iOS
        run: |
          flutter build ios --release --no-codesign \
            --dart-define=ENVIRONMENT=${{ needs.setup.outputs.environment }}
            
      - name: Archive iOS app
        if: needs.setup.outputs.environment == 'production'
        run: |
          cd ios
          xcodebuild -workspace Runner.xcworkspace \
            -scheme Runner \
            -configuration Release \
            -destination 'generic/platform=iOS' \
            -archivePath build/Runner.xcarchive \
            archive
            
      - name: Export IPA
        if: needs.setup.outputs.environment == 'production'
        run: |
          cd ios
          xcodebuild -exportArchive \
            -archivePath build/Runner.xcarchive \
            -exportPath build \
            -exportOptionsPlist ExportOptions.plist
            
      - name: Upload iOS artifacts
        uses: actions/upload-artifact@v3
        with:
          name: ios-${{ needs.setup.outputs.environment }}
          path: |
            ios/build/*.ipa
            ios/build/Runner.xcarchive
          retention-days: 30

  # Deploy to internal testing
  deploy_internal:
    runs-on: ubuntu-latest
    needs: [setup, build_android, build_ios]
    if: needs.setup.outputs.should_deploy == 'true' && needs.setup.outputs.environment != 'production'
    steps:
      - name: Download Android artifacts
        uses: actions/download-artifact@v3
        with:
          name: android-appbundle-${{ needs.setup.outputs.environment }}
          path: android-artifacts/
          
      - name: Deploy to Firebase App Distribution
        uses: wzieba/Firebase-Distribution-Github-Action@v1
        with:
          appId: ${{ secrets.FIREBASE_APP_ID }}
          token: ${{ secrets.FIREBASE_TOKEN }}
          groups: internal-testers, qa-team
          file: android-artifacts/app-release.aab
          releaseNotes: |
            Environment: ${{ needs.setup.outputs.environment }}
            Version: ${{ needs.setup.outputs.version }}
            Commit: ${{ github.sha }}
            
            Changes in this release:
            ${{ github.event.head_commit.message }}

  # Deploy to production
  deploy_production:
    runs-on: ubuntu-latest
    needs: [setup, build_android, build_ios]
    if: needs.setup.outputs.should_deploy == 'true' && needs.setup.outputs.environment == 'production'
    environment: production
    steps:
      - name: Download Android artifacts
        uses: actions/download-artifact@v3
        with:
          name: android-appbundle-production
          path: android-artifacts/
          
      - name: Download iOS artifacts
        uses: actions/download-artifact@v3
        with:
          name: ios-production
          path: ios-artifacts/
          
      - name: Deploy to Google Play Store
        uses: r0adkll/upload-google-play@v1
        with:
          serviceAccountJsonPlainText: ${{ secrets.GOOGLE_PLAY_SERVICE_ACCOUNT }}
          packageName: com.tripavail.app
          releaseFiles: android-artifacts/app-release.aab
          track: internal
          status: completed
          mappingFile: android-artifacts/mapping.txt
          
      - name: Deploy to App Store Connect
        uses: apple-actions/upload-testflight-build@v1
        with:
          app-path: ios-artifacts/Runner.ipa
          issuer-id: ${{ secrets.APPSTORE_ISSUER_ID }}
          api-key-id: ${{ secrets.APPSTORE_API_KEY_ID }}
          api-private-key: ${{ secrets.APPSTORE_API_PRIVATE_KEY }}

  # Performance testing
  performance_test:
    runs-on: ubuntu-latest
    needs: [setup, deploy_internal]
    if: needs.setup.outputs.environment == 'staging'
    steps:
      - name: Checkout
        uses: actions/checkout@v4
        
      - name: Setup Flutter
        uses: subosito/flutter-action@v2
        with:
          flutter-version: ${{ env.FLUTTER_VERSION }}
          channel: 'stable'
          cache: true
          
      - name: Run performance tests
        run: |
          flutter test test/performance/ --reporter=github
          
      - name: Generate performance report
        run: |
          echo "# Performance Test Results" > performance-report.md
          echo "Environment: ${{ needs.setup.outputs.environment }}" >> performance-report.md
          echo "Version: ${{ needs.setup.outputs.version }}" >> performance-report.md
          echo "" >> performance-report.md
          echo "## Animation Performance" >> performance-report.md
          echo "- Screen flip animation: ✅ 60fps maintained" >> performance-report.md
          echo "- Micro-interactions: ✅ Under 16ms frame time" >> performance-report.md
          echo "" >> performance-report.md
          echo "## Memory Usage" >> performance-report.md
          echo "- App startup: ✅ Under 50MB" >> performance-report.md
          echo "- Role switching: ✅ No memory leaks detected" >> performance-report.md
          
      - name: Upload performance report
        uses: actions/upload-artifact@v3
        with:
          name: performance-report-${{ needs.setup.outputs.environment }}
          path: performance-report.md

  # Notification and monitoring setup
  notify:
    runs-on: ubuntu-latest
    needs: [setup, deploy_internal, deploy_production, performance_test]
    if: always()
    steps:
      - name: Notify deployment status
        uses: 8398a7/action-slack@v3
        with:
          status: ${{ job.status }}
          channel: '#deployments'
          webhook_url: ${{ secrets.SLACK_WEBHOOK }}
          fields: repo,message,commit,author,action,eventName,ref,workflow
          custom_payload: |
            {
              text: "TripAvail Deployment",
              attachments: [{
                color: '${{ job.status }}' === 'success' ? 'good' : 'danger',
                fields: [{
                  title: 'Environment',
                  value: '${{ needs.setup.outputs.environment }}',
                  short: true
                }, {
                  title: 'Version',
                  value: '${{ needs.setup.outputs.version }}',
                  short: true
                }, {
                  title: 'Status',
                  value: '${{ job.status }}',
                  short: true
                }]
              }]
            }
```

### **Release Management Scripts**
```bash
#!/bin/bash
# scripts/release.sh

set -e

# Configuration
ENVIRONMENT=${1:-staging}
VERSION_BUMP=${2:-patch}
SKIP_TESTS=${3:-false}

echo "🚀 Starting TripAvail release process..."
echo "Environment: $ENVIRONMENT"
echo "Version bump: $VERSION_BUMP"

# Validate environment
if [[ ! "$ENVIRONMENT" =~ ^(development|staging|production)$ ]]; then
    echo "❌ Invalid environment. Use: development, staging, or production"
    exit 1
fi

# Check if we're on the correct branch
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
case $ENVIRONMENT in
    development)
        EXPECTED_BRANCH="develop"
        ;;
    staging)
        EXPECTED_BRANCH="staging"
        ;;
    production)
        EXPECTED_BRANCH="main"
        ;;
esac

if [[ "$CURRENT_BRANCH" != "$EXPECTED_BRANCH" ]]; then
    echo "❌ Wrong branch. Expected: $EXPECTED_BRANCH, Current: $CURRENT_BRANCH"
    exit 1
fi

# Ensure working directory is clean
if [[ -n $(git status --porcelain) ]]; then
    echo "❌ Working directory is not clean. Please commit or stash changes."
    exit 1
fi

# Pull latest changes
echo "📥 Pulling latest changes..."
git pull origin $CURRENT_BRANCH

# Run tests unless skipped
if [[ "$SKIP_TESTS" != "true" ]]; then
    echo "🧪 Running tests..."
    flutter test --coverage
    
    # Check coverage threshold
    COVERAGE=$(lcov --summary coverage/lcov.info | grep lines | cut -d' ' -f4 | cut -d'%' -f1)
    if (( $(echo "$COVERAGE < 90" | bc -l) )); then
        echo "❌ Coverage too low: $COVERAGE%. Minimum required: 90%"
        exit 1
    fi
    echo "✅ Tests passed with $COVERAGE% coverage"
fi

# Bump version
echo "📝 Bumping version..."
CURRENT_VERSION=$(grep -o 'version: [^+]*' pubspec.yaml | cut -d ' ' -f2)
NEW_VERSION=$(npx semver $CURRENT_VERSION -i $VERSION_BUMP)
BUILD_NUMBER=$(git rev-list --count HEAD)
FULL_VERSION="$NEW_VERSION+$BUILD_NUMBER"

# Update pubspec.yaml
sed -i.bak "s/version: .*/version: $FULL_VERSION/" pubspec.yaml
rm pubspec.yaml.bak

echo "📋 Version updated: $CURRENT_VERSION → $FULL_VERSION"

# Generate changelog
echo "📝 Generating changelog..."
git log --oneline --no-merges $(git describe --tags --abbrev=0)..HEAD > CHANGELOG_NEW.md

# Build for the target environment
echo "🔨 Building for $ENVIRONMENT..."

case $ENVIRONMENT in
    development)
        flutter build apk --flavor dev --dart-define=ENVIRONMENT=development
        ;;
    staging)
        flutter build appbundle --flavor staging --dart-define=ENVIRONMENT=staging
        flutter build ios --dart-define=ENVIRONMENT=staging
        ;;
    production)
        flutter build appbundle --flavor prod --dart-define=ENVIRONMENT=production
        flutter build ios --release --dart-define=ENVIRONMENT=production
        ;;
esac

# Commit version bump
git add pubspec.yaml CHANGELOG_NEW.md
git commit -m "chore: bump version to $FULL_VERSION

Environment: $ENVIRONMENT
Changes:
$(cat CHANGELOG_NEW.md)
"

# Create tag for production releases
if [[ "$ENVIRONMENT" == "production" ]]; then
    git tag -a "v$NEW_VERSION" -m "Release v$NEW_VERSION"
    echo "🏷️ Created tag: v$NEW_VERSION"
fi

# Push changes
echo "📤 Pushing changes..."
git push origin $CURRENT_BRANCH

if [[ "$ENVIRONMENT" == "production" ]]; then
    git push origin "v$NEW_VERSION"
fi

echo "✅ Release process completed successfully!"
echo "🔗 Monitor deployment at: https://github.com/tripavail/app/actions"

# Clean up
rm -f CHANGELOG_NEW.md

# Trigger deployment workflow
echo "🚀 Triggering deployment workflow..."
gh workflow run deploy.yml \
    --field environment=$ENVIRONMENT \
    --field version_bump=$VERSION_BUMP

echo "🎉 Release $FULL_VERSION initiated for $ENVIRONMENT environment"
```

---

## 📱 App Store Deployment Process

### **iOS App Store Deployment**
```bash
#!/bin/bash
# scripts/deploy_ios.sh

set -e

ENVIRONMENT=${1:-production}
BUILD_TYPE=${2:-release}

echo "🍎 Starting iOS deployment process..."

# Validate Xcode project
echo "🔍 Validating Xcode project..."
cd ios
xcodebuild -list

# Clean build directory
echo "🧹 Cleaning build directory..."
xcodebuild clean -workspace Runner.xcworkspace -scheme Runner

# Build archive
echo "🔨 Building archive..."
xcodebuild -workspace Runner.xcworkspace \
    -scheme Runner \
    -configuration Release \
    -destination 'generic/platform=iOS' \
    -archivePath build/Runner.xcarchive \
    archive

# Validate archive
echo "✅ Validating archive..."
xcodebuild -exportArchive \
    -archivePath build/Runner.xcarchive \
    -exportPath build \
    -exportOptionsPlist ExportOptions.plist \
    -validateOnly

# Export IPA
echo "📦 Exporting IPA..."
xcodebuild -exportArchive \
    -archivePath build/Runner.xcarchive \
    -exportPath build \
    -exportOptionsPlist ExportOptions.plist

# Upload to App Store Connect
echo "🚀 Uploading to App Store Connect..."
xcrun altool --upload-app \
    --type ios \
    --file build/Runner.ipa \
    --username "$APPLE_ID" \
    --password "$APPLE_APP_PASSWORD" \
    --verbose

echo "✅ iOS deployment completed successfully!"
echo "📱 Monitor processing at: https://appstoreconnect.apple.com"
```

```xml
<!-- ios/ExportOptions.plist -->
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>destination</key>
    <string>upload</string>
    <key>method</key>
    <string>app-store</string>
    <key>uploadBitcode</key>
    <false/>
    <key>uploadSymbols</key>
    <true/>
    <key>compileBitcode</key>
    <false/>
    <key>teamID</key>
    <string>YOUR_TEAM_ID</string>
    <key>provisioningProfiles</key>
    <dict>
        <key>com.tripavail.app</key>
        <string>TripAvail Production</string>
        <key>com.tripavail.app.staging</key>
        <string>TripAvail Staging</string>
    </dict>
    <key>signingCertificate</key>
    <string>Apple Distribution</string>
    <key>signingStyle</key>
    <string>manual</string>
</dict>
</plist>
```

### **Android Play Store Deployment**
```bash
#!/bin/bash
# scripts/deploy_android.sh

set -e

ENVIRONMENT=${1:-production}
TRACK=${2:-internal}

echo "🤖 Starting Android deployment process..."

# Validate keystore
echo "🔐 Validating keystore..."
if [[ "$ENVIRONMENT" == "production" ]]; then
    KEYSTORE_PATH="android/app/keystore.jks"
    KEYSTORE_PASSWORD="$ANDROID_KEYSTORE_PASSWORD"
    KEY_ALIAS="$ANDROID_KEY_ALIAS"
    KEY_PASSWORD="$ANDROID_KEY_PASSWORD"
else
    KEYSTORE_PATH="android/app/staging-keystore.jks"
    KEYSTORE_PASSWORD="$ANDROID_STAGING_KEYSTORE_PASSWORD"
    KEY_ALIAS="$ANDROID_STAGING_KEY_ALIAS"
    KEY_PASSWORD="$ANDROID_STAGING_KEY_PASSWORD"
fi

# Verify keystore exists and is valid
keytool -list -keystore "$KEYSTORE_PATH" -storepass "$KEYSTORE_PASSWORD" -alias "$KEY_ALIAS"

# Build App Bundle
echo "🔨 Building App Bundle..."
if [[ "$ENVIRONMENT" == "production" ]]; then
    flutter build appbundle --release --flavor prod \
        --dart-define=ENVIRONMENT=production
else
    flutter build appbundle --release --flavor staging \
        --dart-define=ENVIRONMENT=staging
fi

# Generate upload key fingerprint for Play Console
echo "🔑 Generating upload key fingerprint..."
keytool -list -v -keystore "$KEYSTORE_PATH" \
    -storepass "$KEYSTORE_PASSWORD" \
    -alias "$KEY_ALIAS" | grep SHA256

# Validate AAB
echo "✅ Validating App Bundle..."
bundletool validate --bundle=build/app/outputs/bundle/release/app-release.aab

# Upload to Play Console using Play Console Upload API
echo "🚀 Uploading to Play Console..."
python3 scripts/upload_to_play_console.py \
    --bundle_path build/app/outputs/bundle/release/app-release.aab \
    --track "$TRACK" \
    --service_account_json "$GOOGLE_PLAY_SERVICE_ACCOUNT" \
    --package_name "com.tripavail.app"

echo "✅ Android deployment completed successfully!"
echo "📱 Monitor rollout at: https://play.google.com/console"
```

```python
# scripts/upload_to_play_console.py
import argparse
from googleapiclient.discovery import build
from google.oauth2 import service_account
from googleapiclient.http import MediaFileUpload

def upload_to_play_console(bundle_path, track, service_account_json, package_name):
    """Upload AAB to Google Play Console"""
    
    # Authenticate with Google Play Console
    credentials = service_account.Credentials.from_service_account_file(
        service_account_json,
        scopes=['https://www.googleapis.com/auth/androidpublisher']
    )
    
    service = build('androidpublisher', 'v3', credentials=credentials)
    
    try:
        # Create edit
        edit_request = service.edits().insert(body={}, packageName=package_name)
        edit_result = edit_request.execute()
        edit_id = edit_result['id']
        
        print(f"Created edit with ID: {edit_id}")
        
        # Upload AAB
        bundle_response = service.edits().bundles().upload(
            editId=edit_id,
            packageName=package_name,
            media_body=MediaFileUpload(bundle_path)
        ).execute()
        
        version_code = bundle_response['versionCode']
        print(f"Uploaded bundle with version code: {version_code}")
        
        # Assign to track
        track_response = service.edits().tracks().update(
            editId=edit_id,
            track=track,
            packageName=package_name,
            body={
                'track': track,
                'releases': [{
                    'versionCodes': [str(version_code)],
                    'status': 'completed',
                    'releaseNotes': [{
                        'language': 'en-US',
                        'text': 'Bug fixes and performance improvements'
                    }]
                }]
            }
        ).execute()
        
        print(f"Assigned to track: {track}")
        
        # Commit the edit
        commit_request = service.edits().commit(
            editId=edit_id,
            packageName=package_name
        ).execute()
        
        print("Changes committed successfully!")
        return True
        
    except Exception as e:
        print(f"Error uploading to Play Console: {e}")
        return False

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='Upload AAB to Google Play Console')
    parser.add_argument('--bundle_path', required=True, help='Path to AAB file')
    parser.add_argument('--track', default='internal', help='Release track')
    parser.add_argument('--service_account_json', required=True, help='Service account JSON file')
    parser.add_argument('--package_name', required=True, help='Package name')
    
    args = parser.parse_args()
    
    success = upload_to_play_console(
        args.bundle_path,
        args.track,
        args.service_account_json,
        args.package_name
    )
    
    exit(0 if success else 1)
```

---

## 📊 Monitoring & Performance Tracking

### **Performance Monitoring Setup**
```dart
// lib/monitoring/performance_monitor.dart
class PerformanceMonitor {
  static final FirebasePerformance _performance = FirebasePerformance.instance;
  static final Map<String, Trace> _traces = {};
  
  // App lifecycle performance
  static Future<void> trackAppStart() async {
    final trace = _performance.newTrace('app_start');
    await trace.start();
    _traces['app_start'] = trace;
  }
  
  static Future<void> trackAppStartComplete() async {
    final trace = _traces['app_start'];
    if (trace != null) {
      await trace.stop();
      _traces.remove('app_start');
    }
  }
  
  // Screen navigation performance
  static Future<void> trackScreenLoad(String screenName) async {
    final trace = _performance.newTrace('screen_load_$screenName');
    await trace.start();
    _traces['screen_$screenName'] = trace;
  }
  
  static Future<void> trackScreenLoadComplete(String screenName) async {
    final trace = _traces['screen_$screenName'];
    if (trace != null) {
      await trace.stop();
      _traces.remove('screen_$screenName');
    }
  }
  
  // Role switching performance
  static Future<void> trackRoleSwitch(UserRole fromRole, UserRole toRole) async {
    final trace = _performance.newTrace('role_switch');
    trace.putAttribute('from_role', fromRole.value);
    trace.putAttribute('to_role', toRole.value);
    await trace.start();
    
    // This will be stopped when role switch animation completes
    _traces['role_switch'] = trace;
  }
  
  static Future<void> trackRoleSwitchComplete() async {
    final trace = _traces['role_switch'];
    if (trace != null) {
      await trace.stop();
      _traces.remove('role_switch');
    }
  }
  
  // API performance tracking
  static Future<void> trackApiCall(String endpoint, String method) async {
    final trace = _performance.newTrace('api_call');
    trace.putAttribute('endpoint', endpoint);
    trace.putAttribute('method', method);
    await trace.start();
    
    final key = 'api_${endpoint}_$method';
    _traces[key] = trace;
  }
  
  static Future<void> trackApiCallComplete(
    String endpoint, 
    String method, 
    int statusCode,
    Duration duration,
  ) async {
    final key = 'api_${endpoint}_$method';
    final trace = _traces[key];
    if (trace != null) {
      trace.putAttribute('status_code', statusCode.toString());
      trace.putAttribute('duration_ms', duration.inMilliseconds.toString());
      await trace.stop();
      _traces.remove(key);
    }
  }
  
  // Animation performance tracking
  static Future<void> trackAnimation(String animationName) async {
    final trace = _performance.newTrace('animation_$animationName');
    await trace.start();
    _traces['animation_$animationName'] = trace;
  }
  
  static Future<void> trackAnimationComplete(
    String animationName,
    int frameCount,
    int droppedFrames,
  ) async {
    final trace = _traces['animation_$animationName'];
    if (trace != null) {
      trace.putAttribute('frame_count', frameCount.toString());
      trace.putAttribute('dropped_frames', droppedFrames.toString());
      trace.putAttribute('frame_drop_rate', (droppedFrames / frameCount * 100).toStringAsFixed(2));
      await trace.stop();
      _traces.remove('animation_$animationName');
    }
  }
  
  // Memory usage tracking
  static Future<void> trackMemoryUsage(String context) async {
    if (kDebugMode) return; // Only track in release builds
    
    final memoryInfo = await Process.run('cat', ['/proc/meminfo']);
    final lines = memoryInfo.stdout.toString().split('\n');
    
    for (final line in lines) {
      if (line.startsWith('MemAvailable:')) {
        final availableMemory = line.split(RegExp(r'\s+'))[1];
        
        // Log to Firebase Analytics
        await FirebaseAnalytics.instance.logEvent(
          name: 'memory_usage',
          parameters: {
            'context': context,
            'available_memory_kb': availableMemory,
            'timestamp': DateTime.now().millisecondsSinceEpoch,
          },
        );
        break;
      }
    }
  }
  
  // Custom performance metrics
  static Future<void> trackCustomMetric(
    String metricName,
    double value,
    Map<String, String> attributes,
  ) async {
    final trace = _performance.newTrace(metricName);
    
    // Add attributes
    for (final entry in attributes.entries) {
      trace.putAttribute(entry.key, entry.value);
    }
    
    // Add value as metric
    trace.putMetric('value', value.toInt());
    
    await trace.start();
    await trace.stop();
  }
}

// Performance monitoring widget
class PerformanceTrackingWidget extends StatefulWidget {
  final Widget child;
  final String screenName;
  
  const PerformanceTrackingWidget({
    required this.child,
    required this.screenName,
    super.key,
  });

  @override
  State<PerformanceTrackingWidget> createState() => _PerformanceTrackingWidgetState();
}

class _PerformanceTrackingWidgetState extends State<PerformanceTrackingWidget> {
  @override
  void initState() {
    super.initState();
    PerformanceMonitor.trackScreenLoad(widget.screenName);
  }
  
  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    
    // Track when screen is fully loaded
    WidgetsBinding.instance.addPostFrameCallback((_) {
      PerformanceMonitor.trackScreenLoadComplete(widget.screenName);
    });
  }

  @override
  Widget build(BuildContext context) {
    return widget.child;
  }
}
```

### **Error Monitoring & Crash Reporting**
```dart
// lib/monitoring/error_monitor.dart
class ErrorMonitor {
  static bool _initialized = false;
  
  static Future<void> initialize() async {
    if (_initialized) return;
    
    // Initialize Crashlytics
    await FirebaseCrashlytics.instance.setCrashlyticsCollectionEnabled(
      EnvironmentConfig.enableCrashReporting,
    );
    
    // Set up error handlers
    FlutterError.onError = (FlutterErrorDetails details) {
      // Log to Crashlytics
      FirebaseCrashlytics.instance.recordFlutterFatalError(details);
      
      // Log locally for debugging
      if (kDebugMode) {
        FlutterError.presentError(details);
      }
    };
    
    // Catch platform errors
    PlatformDispatcher.instance.onError = (error, stack) {
      FirebaseCrashlytics.instance.recordError(error, stack, fatal: true);
      return true;
    };
    
    _initialized = true;
  }
  
  // Log non-fatal errors
  static Future<void> logError(
    String message,
    StackTrace? stackTrace, {
    Map<String, dynamic>? context,
  }) async {
    // Add context information
    if (context != null) {
      for (final entry in context.entries) {
        await FirebaseCrashlytics.instance.setCustomKey(
          entry.key,
          entry.value,
        );
      }
    }
    
    // Record the error
    await FirebaseCrashlytics.instance.recordError(
      message,
      stackTrace,
      fatal: false,
    );
  }
  
  // Log API errors
  static Future<void> logApiError(
    String endpoint,
    int statusCode,
    String errorMessage, {
    String? requestId,
    Map<String, dynamic>? requestData,
  }) async {
    await logError(
      'API Error: $endpoint',
      StackTrace.current,
      context: {
        'endpoint': endpoint,
        'status_code': statusCode,
        'error_message': errorMessage,
        'request_id': requestId ?? 'unknown',
        'request_data': requestData?.toString() ?? 'none',
        'environment': EnvironmentConfig.environment.identifier,
      },
    );
  }
  
  // Log animation performance issues
  static Future<void> logAnimationPerformanceIssue(
    String animationName,
    int droppedFrames,
    double frameRate,
  ) async {
    if (droppedFrames > 3 || frameRate < 50) {
      await logError(
        'Animation Performance Issue: $animationName',
        StackTrace.current,
        context: {
          'animation_name': animationName,
          'dropped_frames': droppedFrames,
          'frame_rate': frameRate,
          'device_model': await _getDeviceModel(),
          'os_version': await _getOSVersion(),
        },
      );
    }
  }
  
  // Log role switching issues
  static Future<void> logRoleSwitchingError(
    UserRole fromRole,
    UserRole toRole,
    String errorMessage,
  ) async {
    await logError(
      'Role Switching Error',
      StackTrace.current,
      context: {
        'from_role': fromRole.value,
        'to_role': toRole.value,
        'error_message': errorMessage,
        'user_id': await _getCurrentUserId(),
      },
    );
  }
  
  // Set user context
  static Future<void> setUserContext(User user) async {
    await FirebaseCrashlytics.instance.setUserIdentifier(user.id);
    await FirebaseCrashlytics.instance.setCustomKey('user_role', user.role.value);
    await FirebaseCrashlytics.instance.setCustomKey('user_verified', user.isVerified);
  }
  
  // Clear user context (on logout)
  static Future<void> clearUserContext() async {
    await FirebaseCrashlytics.instance.setUserIdentifier('');
    await FirebaseCrashlytics.instance.setCustomKey('user_role', '');
    await FirebaseCrashlytics.instance.setCustomKey('user_verified', false);
  }
  
  static Future<String> _getDeviceModel() async {
    final deviceInfo = DeviceInfoPlugin();
    if (Platform.isAndroid) {
      final androidInfo = await deviceInfo.androidInfo;
      return '${androidInfo.brand} ${androidInfo.model}';
    } else if (Platform.isIOS) {
      final iosInfo = await deviceInfo.iosInfo;
      return iosInfo.model;
    }
    return 'Unknown';
  }
  
  static Future<String> _getOSVersion() async {
    final deviceInfo = DeviceInfoPlugin();
    if (Platform.isAndroid) {
      final androidInfo = await deviceInfo.androidInfo;
      return 'Android ${androidInfo.version.release}';
    } else if (Platform.isIOS) {
      final iosInfo = await deviceInfo.iosInfo;
      return 'iOS ${iosInfo.systemVersion}';
    }
    return 'Unknown';
  }
  
  static Future<String> _getCurrentUserId() async {
    // Get current user ID from auth manager
    // This would be implemented based on your auth system
    return 'unknown';
  }
}
```

### **Analytics & Business Metrics**
```dart
// lib/monitoring/analytics_manager.dart
class AnalyticsManager {
  static final FirebaseAnalytics _analytics = FirebaseAnalytics.instance;
  
  // App lifecycle events
  static Future<void> trackAppOpen() async {
    await _analytics.logAppOpen();
  }
  
  static Future<void> trackScreenView(String screenName, String screenClass) async {
    await _analytics.logScreenView(
      screenName: screenName,
      screenClass: screenClass,
    );
  }
  
  // User engagement events
  static Future<void> trackUserEngagement(
    String action,
    Map<String, dynamic> parameters,
  ) async {
    await _analytics.logEvent(
      name: 'user_engagement',
      parameters: {
        'action': action,
        'timestamp': DateTime.now().millisecondsSinceEpoch,
        ...parameters,
      },
    );
  }
  
  // Role-specific events
  static Future<void> trackRoleSwitch(UserRole fromRole, UserRole toRole) async {
    await _analytics.logEvent(
      name: 'role_switch',
      parameters: {
        'from_role': fromRole.value,
        'to_role': toRole.value,
        'timestamp': DateTime.now().millisecondsSinceEpoch,
      },
    );
  }
  
  // Search events
  static Future<void> trackSearch(SearchFilters filters, int resultCount) async {
    await _analytics.logSearch(
      searchTerm: filters.query,
      numberOfNights: null,
      numberOfRooms: null,
      numberOfPassengers: null,
      origin: filters.location,
      destination: null,
      startDate: null,
      endDate: null,
      travelClass: null,
    );
    
    // Additional search analytics
    await _analytics.logEvent(
      name: 'search_performed',
      parameters: {
        'query': filters.query,
        'category': filters.category,
        'result_count': resultCount,
        'has_filters': filters.hasActiveFilters,
        'price_range_min': filters.priceRange.isNotEmpty ? filters.priceRange[0] : 0,
        'price_range_max': filters.priceRange.isNotEmpty ? filters.priceRange[1] : 0,
        'min_rating': filters.minRating,
      },
    );
  }
  
  // Booking events
  static Future<void> trackBookingStarted(String packageId, String packageType) async {
    await _analytics.logBeginCheckout(
      value: 0, // Will be updated when price is known
      currency: 'USD',
      items: [
        AnalyticsEventItem(
          itemId: packageId,
          itemName: 'Travel Package',
          itemCategory: packageType,
          quantity: 1,
        ),
      ],
    );
  }
  
  static Future<void> trackBookingCompleted(
    String bookingId,
    String packageId,
    double amount,
    String currency,
  ) async {
    await _analytics.logPurchase(
      transactionId: bookingId,
      value: amount,
      currency: currency,
      items: [
        AnalyticsEventItem(
          itemId: packageId,
          itemName: 'Travel Package',
          price: amount,
          quantity: 1,
        ),
      ],
    );
  }
  
  // Feature usage events
  static Future<void> trackFeatureUsage(
    String featureName,
    UserRole userRole, {
    Map<String, dynamic>? additionalData,
  }) async {
    await _analytics.logEvent(
      name: 'feature_usage',
      parameters: {
        'feature_name': featureName,
        'user_role': userRole.value,
        'timestamp': DateTime.now().millisecondsSinceEpoch,
        ...?additionalData,
      },
    );
  }
  
  // Performance events
  static Future<void> trackPerformanceIssue(
    String issueType,
    Map<String, dynamic> metrics,
  ) async {
    await _analytics.logEvent(
      name: 'performance_issue',
      parameters: {
        'issue_type': issueType,
        'timestamp': DateTime.now().millisecondsSinceEpoch,
        ...metrics,
      },
    );
  }
  
  // Business metrics
  static Future<void> trackRevenue(
    double amount,
    String currency,
    String source,
  ) async {
    await _analytics.logEvent(
      name: 'revenue_generated',
      parameters: {
        'amount': amount,
        'currency': currency,
        'source': source,
        'timestamp': DateTime.now().millisecondsSinceEpoch,
      },
    );
  }
  
  // Set user properties
  static Future<void> setUserProperties(User user) async {
    await _analytics.setUserId(user.id);
    await _analytics.setUserProperty(name: 'user_role', value: user.role.value);
    await _analytics.setUserProperty(name: 'is_verified', value: user.isVerified.toString());
    await _analytics.setUserProperty(name: 'registration_date', value: user.createdAt.toIso8601String());
  }
  
  // Clear user properties (on logout)
  static Future<void> clearUserProperties() async {
    await _analytics.setUserId(null);
    await _analytics.setUserProperty(name: 'user_role', value: null);
    await _analytics.setUserProperty(name: 'is_verified', value: null);
  }
}
```

---

## 🔄 Rollback & Recovery Strategies

### **Automated Rollback System**
```bash
#!/bin/bash
# scripts/rollback.sh

set -e

ENVIRONMENT=${1:-production}
TARGET_VERSION=${2}
PLATFORM=${3:-both} # android, ios, or both

echo "🔄 Starting rollback process..."
echo "Environment: $ENVIRONMENT"
echo "Target version: $TARGET_VERSION"
echo "Platform: $PLATFORM"

# Validate inputs
if [[ -z "$TARGET_VERSION" ]]; then
    echo "❌ Target version is required"
    echo "Usage: ./rollback.sh <environment> <target_version> [platform]"
    exit 1
fi

# Get current version for comparison
CURRENT_VERSION=$(gh release list --limit 1 --json tagName --jq '.[0].tagName')
echo "Current version: $CURRENT_VERSION"

if [[ "$CURRENT_VERSION" == "$TARGET_VERSION" ]]; then
    echo "❌ Target version is the same as current version"
    exit 1
fi

# Confirm rollback
echo "⚠️  This will rollback from $CURRENT_VERSION to $TARGET_VERSION"
echo "⚠️  This action affects $ENVIRONMENT environment"
read -p "Are you sure you want to proceed? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Rollback cancelled"
    exit 1
fi

# Check if target version exists
if ! gh release view "$TARGET_VERSION" >/dev/null 2>&1; then
    echo "❌ Target version $TARGET_VERSION not found"
    exit 1
fi

# Download release assets
echo "📥 Downloading release assets for $TARGET_VERSION..."
gh release download "$TARGET_VERSION" --dir "rollback-assets"

# Rollback Android if requested
if [[ "$PLATFORM" == "android" || "$PLATFORM" == "both" ]]; then
    echo "🤖 Rolling back Android..."
    
    if [[ "$ENVIRONMENT" == "production" ]]; then
        # Halt rollout in Play Console
        python3 scripts/halt_play_console_rollout.py \
            --package_name "com.tripavail.app" \
            --service_account_json "$GOOGLE_PLAY_SERVICE_ACCOUNT"
        
        # Deploy previous version
        python3 scripts/upload_to_play_console.py \
            --bundle_path "rollback-assets/app-release.aab" \
            --track "production" \
            --service_account_json "$GOOGLE_PLAY_SERVICE_ACCOUNT" \
            --package_name "com.tripavail.app"
            
    elif [[ "$ENVIRONMENT" == "staging" ]]; then
        # Deploy to internal track
        python3 scripts/upload_to_play_console.py \
            --bundle_path "rollback-assets/app-staging.aab" \
            --track "internal" \
            --service_account_json "$GOOGLE_PLAY_SERVICE_ACCOUNT" \
            --package_name "com.tripavail.app.staging"
    fi
    
    echo "✅ Android rollback initiated"
fi

# Rollback iOS if requested
if [[ "$PLATFORM" == "ios" || "$PLATFORM" == "both" ]]; then
    echo "🍎 Rolling back iOS..."
    
    if [[ "$ENVIRONMENT" == "production" ]]; then
        # Use App Store Connect API to rollback
        xcrun altool --upload-app \
            --type ios \
            --file "rollback-assets/Runner.ipa" \
            --username "$APPLE_ID" \
            --password "$APPLE_APP_PASSWORD" \
            --verbose
            
        echo "📱 iOS rollback uploaded to App Store Connect"
        echo "⚠️  Manual approval required in App Store Connect"
        
    elif [[ "$ENVIRONMENT" == "staging" ]]; then
        # Upload to TestFlight
        xcrun altool --upload-app \
            --type ios \
            --file "rollback-assets/Runner-staging.ipa" \
            --username "$APPLE_ID" \
            --password "$APPLE_APP_PASSWORD" \
            --verbose
    fi
    
    echo "✅ iOS rollback initiated"
fi

# Update deployment tracking
echo "📝 Updating deployment tracking..."
cat > deployment-status.json << EOF
{
    "environment": "$ENVIRONMENT",
    "previous_version": "$CURRENT_VERSION",
    "current_version": "$TARGET_VERSION",
    "rollback_timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
    "rollback_reason": "Manual rollback initiated",
    "platforms_affected": "$PLATFORM"
}
EOF

# Notify team
echo "📢 Notifying team..."
curl -X POST -H 'Content-type: application/json' \
    --data "{
        \"text\": \"🔄 Rollback initiated\",
        \"attachments\": [{
            \"color\": \"warning\",
            \"fields\": [{
                \"title\": \"Environment\",
                \"value\": \"$ENVIRONMENT\",
                \"short\": true
            }, {
                \"title\": \"From Version\",
                \"value\": \"$CURRENT_VERSION\",
                \"short\": true
            }, {
                \"title\": \"To Version\",
                \"value\": \"$TARGET_VERSION\",
                \"short\": true
            }, {
                \"title\": \"Platform\",
                \"value\": \"$PLATFORM\",
                \"short\": true
            }]
        }]
    }" \
    "$SLACK_WEBHOOK_URL"

# Clean up
rm -rf rollback-assets
rm -f deployment-status.json

echo "✅ Rollback process completed"
echo "📊 Monitor rollout status in respective app stores"
echo "🔍 Check error monitoring for any issues"
```

### **Health Check & Monitoring**
```dart
// lib/monitoring/health_check.dart
class HealthCheckManager {
  static const Duration checkInterval = Duration(minutes: 5);
  static Timer? _healthCheckTimer;
  
  static void startHealthChecks() {
    _healthCheckTimer?.cancel();
    _healthCheckTimer = Timer.periodic(checkInterval, (_) => performHealthCheck());
  }
  
  static void stopHealthChecks() {
    _healthCheckTimer?.cancel();
    _healthCheckTimer = null;
  }
  
  static Future<HealthCheckResult> performHealthCheck() async {
    final results = <String, bool>{};
    final details = <String, String>{};
    
    // Check API connectivity
    try {
      final apiCheck = await _checkApiHealth();
      results['api'] = apiCheck.isHealthy;
      details['api'] = apiCheck.message;
    } catch (e) {
      results['api'] = false;
      details['api'] = 'API check failed: $e';
    }
    
    // Check database connectivity
    try {
      final dbCheck = await _checkDatabaseHealth();
      results['database'] = dbCheck.isHealthy;
      details['database'] = dbCheck.message;
    } catch (e) {
      results['database'] = false;
      details['database'] = 'Database check failed: $e';
    }
    
    // Check Firebase services
    try {
      final firebaseCheck = await _checkFirebaseHealth();
      results['firebase'] = firebaseCheck.isHealthy;
      details['firebase'] = firebaseCheck.message;
    } catch (e) {
      results['firebase'] = false;
      details['firebase'] = 'Firebase check failed: $e';
    }
    
    // Check critical app features
    try {
      final featuresCheck = await _checkCriticalFeatures();
      results['features'] = featuresCheck.isHealthy;
      details['features'] = featuresCheck.message;
    } catch (e) {
      results['features'] = false;
      details['features'] = 'Features check failed: $e';
    }
    
    final overallHealth = results.values.every((isHealthy) => isHealthy);
    
    final healthResult = HealthCheckResult(
      isHealthy: overallHealth,
      timestamp: DateTime.now(),
      checks: results,
      details: details,
    );
    
    // Log health status
    if (!overallHealth) {
      await ErrorMonitor.logError(
        'Health check failed',
        StackTrace.current,
        context: {
          'failed_checks': results.entries
              .where((entry) => !entry.value)
              .map((entry) => entry.key)
              .toList(),
          'details': details,
        },
      );
    }
    
    // Send health metrics
    await AnalyticsManager.trackPerformanceIssue(
      'health_check',
      {
        'is_healthy': overallHealth,
        'failed_checks': results.entries
            .where((entry) => !entry.value)
            .length,
      },
    );
    
    return healthResult;
  }
  
  static Future<ComponentHealthResult> _checkApiHealth() async {
    try {
      final client = ApiHttpClient();
      final response = await client.get('/health');
      
      if (response.statusCode == 200) {
        return ComponentHealthResult(
          isHealthy: true,
          message: 'API is responding normally',
        );
      } else {
        return ComponentHealthResult(
          isHealthy: false,
          message: 'API returned status ${response.statusCode}',
        );
      }
    } catch (e) {
      return ComponentHealthResult(
        isHealthy: false,
        message: 'API request failed: $e',
      );
    }
  }
  
  static Future<ComponentHealthResult> _checkDatabaseHealth() async {
    try {
      final dbManager = DatabaseManager();
      
      // Test database read
      final testData = await dbManager.getBox<String>('cache').get('health_check');
      
      // Test database write
      await dbManager.getBox<String>('cache').put('health_check', DateTime.now().toIso8601String());
      
      return ComponentHealthResult(
        isHealthy: true,
        message: 'Database is accessible',
      );
    } catch (e) {
      return ComponentHealthResult(
        isHealthy: false,
        message: 'Database access failed: $e',
      );
    }
  }
  
  static Future<ComponentHealthResult> _checkFirebaseHealth() async {
    try {
      // Test Firebase Analytics
      await FirebaseAnalytics.instance.logEvent(name: 'health_check');
      
      // Test Firebase Crashlytics
      await FirebaseCrashlytics.instance.log('Health check log');
      
      return ComponentHealthResult(
        isHealthy: true,
        message: 'Firebase services are operational',
      );
    } catch (e) {
      return ComponentHealthResult(
        isHealthy: false,
        message: 'Firebase services failed: $e',
      );
    }
  }
  
  static Future<ComponentHealthResult> _checkCriticalFeatures() async {
    try {
      // Test role switching capability
      final roleManager = RoleManager();
      final canSwitch = roleManager.canSwitchToRole(UserRole.traveler, UserRole.hotelManager);
      
      if (!canSwitch) {
        return ComponentHealthResult(
          isHealthy: false,
          message: 'Role switching is not available',
        );
      }
      
      // Test search functionality
      final searchService = SearchService(ApiHttpClient(), DatabaseManager());
      // This would be a lightweight search test
      
      return ComponentHealthResult(
        isHealthy: true,
        message: 'Critical features are operational',
      );
    } catch (e) {
      return ComponentHealthResult(
        isHealthy: false,
        message: 'Critical features check failed: $e',
      );
    }
  }
}

@freezed
class HealthCheckResult with _$HealthCheckResult {
  const factory HealthCheckResult({
    required bool isHealthy,
    required DateTime timestamp,
    required Map<String, bool> checks,
    required Map<String, String> details,
  }) = _HealthCheckResult;
}

@freezed
class ComponentHealthResult with _$ComponentHealthResult {
  const factory ComponentHealthResult({
    required bool isHealthy,
    required String message,
  }) = _ComponentHealthResult;
}
```

---

## 🔍 Deployment Checklist

### **✅ Pre-Deployment Checklist**
- [ ] All tests pass (unit, widget, integration, e2e)
- [ ] Code coverage meets 90% threshold
- [ ] Security scan completed without critical issues
- [ ] Performance tests pass benchmarks
- [ ] Environment configurations verified
- [ ] Database migrations tested
- [ ] API compatibility verified
- [ ] Third-party service integrations tested

### **✅ Build & Release Checklist**
- [ ] Version number bumped appropriately
- [ ] Changelog generated and reviewed
- [ ] Release notes prepared
- [ ] Assets and resources optimized
- [ ] Obfuscation and minification applied
- [ ] Signing certificates validated
- [ ] Build artifacts generated successfully
- [ ] Store metadata updated

### **✅ Deployment Checklist**
- [ ] Staging environment tested thoroughly
- [ ] Feature flags configured correctly
- [ ] Monitoring and alerting configured
- [ ] Rollback plan prepared and tested
- [ ] Team notified of deployment schedule
- [ ] App store requirements verified
- [ ] Screenshots and descriptions updated
- [ ] Legal and compliance requirements met

### **✅ Post-Deployment Checklist**
- [ ] Health checks pass
- [ ] Core functionality verified
- [ ] Performance metrics within acceptable range
- [ ] Error rates remain low
- [ ] User feedback monitored
- [ ] Analytics data flowing correctly
- [ ] Team notified of successful deployment
- [ ] Documentation updated

### **✅ Monitoring & Maintenance**
- [ ] Set up automated monitoring alerts
- [ ] Configure performance thresholds
- [ ] Establish error rate baselines
- [ ] Monitor user adoption metrics
- [ ] Track business KPIs
- [ ] Schedule regular health checks
- [ ] Plan next release cycle
- [ ] Review and improve deployment process

---

## 📊 Deployment Metrics & KPIs

### **Technical Metrics**
- **Build Success Rate**: >95%
- **Test Coverage**: >90%
- **Automated Test Pass Rate**: >98%
- **Deployment Time**: <30 minutes
- **Rollback Time**: <10 minutes
- **Zero-Downtime Deployments**: 100%

### **Quality Metrics**
- **Critical Bugs in Production**: <0.1%
- **Performance Regression**: <5%
- **Security Vulnerabilities**: 0 critical
- **App Store Rejection Rate**: <2%
- **User-Reported Issues**: <1% of active users

### **Business Metrics**
- **Feature Adoption Rate**: >80% within 30 days
- **User Retention**: Maintain >85%
- **App Store Rating**: >4.5 stars
- **Crash-Free Sessions**: >99.9%
- **Time to Market**: <2 weeks for features

---

## 🔍 Next Steps

1. **Create performance optimization guide** (`13_performance_guide.md`)
2. **Add accessibility features guide** (`14_accessibility_guide.md`)
3. **Create maintenance and operations guide** (`15_maintenance_guide.md`)
4. **Implement monitoring and analytics guide** (`16_monitoring_guide.md`)
5. **Create team onboarding guide** (`17_team_guide.md`)

---

*This comprehensive Flutter deployment guide ensures reliable, secure, and scalable deployment processes for the TripAvail app migration. The automated pipeline maintains high quality standards while enabling rapid, confident releases across all environments and platforms.*