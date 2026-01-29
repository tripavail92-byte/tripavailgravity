# Flutter Theme System Implementation

## Executive Summary

This document defines the comprehensive Flutter theme system for TripAvail, migrating from the sophisticated Tailwind v4 CSS system to Material 3 with extensive customization. The implementation preserves all advanced theming features including Rose brand colors, custom gradients, glass morphism effects, and smooth dark mode transitions while leveraging Flutter's powerful theming capabilities.

### Key Features to Migrate
- **Rose Brand Colors**: #E11D48 (light) / #FB7185 (dark) primary scheme
- **Custom Gradient System**: 6 specialized gradients with hover states
- **Glass Morphism Effects**: Backdrop blur and transparency
- **Advanced Shadows**: Modern, Airbnb-style, and floating shadows
- **Smooth Transitions**: 0.3s ease animations for theme changes
- **Typography System**: Custom font weights and conditional application

---

## 🎨 Color System Migration

### **Primary Brand Colors**
```dart
//lib/core/app/app_colors.dart
class AppColors {
  // Rose Brand Colors - Primary Scheme
  static const Color rosePrimary600 = Color(0xFFE11D48); // Light mode primary
  static const Color rosePrimary400 = Color(0xFFFB7185); // Dark mode primary
  static const Color rosePrimary700 = Color(0xFFBE123C); // Hover state (darker)
  static const Color rosePrimary500 = Color(0xFFF43F5E); // Hover state (lighter)
  
  // Partner Gradient Colors
  static const Color violetPrimary = Color(0xFF8B5CF6);
  static const Color pinkPrimary = Color(0xFFEC4899);
  static const Color violetDark = Color(0xFF7C3AED);
  static const Color pinkDark = Color(0xFFDB2777);
  
  // Neutral Colors (matching Tailwind system)
  static const Color backgroundLight = Color(0xFFFFFFFF);
  static const Color backgroundDark = Color(0xFF0A0A0A);
  static const Color cardLight = Color(0xFFFFFFFF);
  static const Color cardDark = Color(0xFF1A1A1A);
  static const Color mutedLight = Color(0xFFECECF0);
  static const Color mutedDark = Color(0xFF2A2A2A);
  
  // Glass Morphism Support Colors
  static const Color glassLight = Color.fromRGBO(255, 255, 255, 0.1);
  static const Color glassDark = Color.fromRGBO(0, 0, 0, 0.1);
  static const Color glassBorderLight = Color.fromRGBO(255, 255, 255, 0.2);
  static const Color glassBorderDark = Color.fromRGBO(255, 255, 255, 0.1);
  
  // Chart Colors (for analytics dashboards)
  static const List<Color> chartColorsLight = [
    Color(0xFFFB7185), // chart-1
    Color(0xFFF59E0B), // chart-2
    Color(0xFFDB2777), // chart-3
    Color(0xFF7C3AED), // chart-4
    Color(0xFF06B6D4), // chart-5
  ];
  
  static const List<Color> chartColorsDark = [
    Color(0xFFFB7185), // Same for consistency
    Color(0xFFF59E0B),
    Color(0xFFDB2777),
    Color(0xFF7C3AED),
    Color(0xFF06B6D4),
  ];
}
```

### **Material 3 Color Scheme Implementation**
```dart
// lib/core/app/app_theme.dart
class AppTheme {
  static ColorScheme get lightColorScheme => ColorScheme.fromSeed(
    seedColor: AppColors.rosePrimary600,
    brightness: Brightness.light,
  ).copyWith(
    primary: AppColors.rosePrimary600,
    onPrimary: Colors.white,
    primaryContainer: AppColors.rosePrimary400.withOpacity(0.1),
    onPrimaryContainer: AppColors.rosePrimary700,
    
    secondary: AppColors.violetPrimary,
    onSecondary: Colors.white,
    secondaryContainer: AppColors.violetPrimary.withOpacity(0.1),
    onSecondaryContainer: AppColors.violetDark,
    
    tertiary: AppColors.pinkPrimary,
    onTertiary: Colors.white,
    tertiaryContainer: AppColors.pinkPrimary.withOpacity(0.1),
    onTertiaryContainer: AppColors.pinkDark,
    
    surface: AppColors.backgroundLight,
    onSurface: const Color(0xFF1A1A1A),
    surfaceVariant: AppColors.mutedLight,
    onSurfaceVariant: const Color(0xFF717182),
    
    background: AppColors.backgroundLight,
    onBackground: const Color(0xFF1A1A1A),
    
    error: const Color(0xFFD4183D),
    onError: Colors.white,
    
    outline: const Color.fromRGBO(0, 0, 0, 0.1),
    shadow: Colors.black.withOpacity(0.1),
    scrim: Colors.black.withOpacity(0.5),
  );
  
  static ColorScheme get darkColorScheme => ColorScheme.fromSeed(
    seedColor: AppColors.rosePrimary400,
    brightness: Brightness.dark,
  ).copyWith(
    primary: AppColors.rosePrimary400,
    onPrimary: Colors.white,
    primaryContainer: AppColors.rosePrimary600.withOpacity(0.2),
    onPrimaryContainer: AppColors.rosePrimary400,
    
    secondary: AppColors.pinkPrimary,
    onSecondary: Colors.white,
    secondaryContainer: AppColors.pinkPrimary.withOpacity(0.2),
    onSecondaryContainer: AppColors.pinkPrimary,
    
    tertiary: AppColors.violetPrimary,
    onTertiary: Colors.white,
    tertiaryContainer: AppColors.violetPrimary.withOpacity(0.2),
    onTertiaryContainer: AppColors.violetPrimary,
    
    surface: AppColors.cardDark,
    onSurface: Colors.white,
    surfaceVariant: AppColors.mutedDark,
    onSurfaceVariant: Colors.white,
    
    background: AppColors.backgroundDark,
    onBackground: Colors.white,
    
    error: const Color(0xFFDC2626),
    onError: Colors.white,
    
    outline: AppColors.mutedDark,
    shadow: Colors.black.withOpacity(0.3),
    scrim: Colors.black.withOpacity(0.7),
  );
}
```

---

## 🌈 Custom Theme Extensions

### **Gradient Theme Extension**
```dart
// lib/core/app/theme_extensions/gradient_extension.dart
@immutable
class AppGradients extends ThemeExtension<AppGradients> {
  final Gradient rosePrimary;
  final Gradient rosePrimaryHover;
  final Gradient partner;
  final Gradient partnerHover;
  final Gradient airbnb;
  final Gradient sunset;
  final Gradient ocean;
  final Gradient modern;
  final Gradient glass;
  final Gradient glassDark;
  
  const AppGradients({
    required this.rosePrimary,
    required this.rosePrimaryHover,
    required this.partner,
    required this.partnerHover,
    required this.airbnb,
    required this.sunset,
    required this.ocean,
    required this.modern,
    required this.glass,
    required this.glassDark,
  });
  
  static const light = AppGradients(
    rosePrimary: LinearGradient(
      begin: Alignment.topLeft,
      end: Alignment.bottomRight,
      colors: [AppColors.rosePrimary600, AppColors.rosePrimary400],
    ),
    rosePrimaryHover: LinearGradient(
      begin: Alignment.topLeft,
      end: Alignment.bottomRight,
      colors: [AppColors.rosePrimary700, AppColors.rosePrimary500],
    ),
    partner: LinearGradient(
      begin: Alignment.topLeft,
      end: Alignment.bottomRight,
      colors: [AppColors.violetPrimary, AppColors.pinkPrimary],
    ),
    partnerHover: LinearGradient(
      begin: Alignment.topLeft,
      end: Alignment.bottomRight,
      colors: [AppColors.violetDark, AppColors.pinkDark],
    ),
    airbnb: LinearGradient(
      begin: Alignment.topLeft,
      end: Alignment.bottomRight,
      colors: [Color(0xFFFF5A5F), Color(0xFFFF385C)],
    ),
    sunset: LinearGradient(
      begin: Alignment.topLeft,
      end: Alignment.bottomRight,
      colors: [Color(0xFFFF9A9E), Color(0xFFFECFEF), Color(0xFFFECFEF)],
      stops: [0.0, 0.5, 1.0],
    ),
    ocean: LinearGradient(
      begin: Alignment.topLeft,
      end: Alignment.bottomRight,
      colors: [Color(0xFF667EEA), Color(0xFF764BA2)],
    ),
    modern: LinearGradient(
      begin: Alignment.topLeft,
      end: Alignment.bottomRight,
      colors: [Color(0xFFF093FB), Color(0xFFF5576C)],
    ),
    glass: LinearGradient(
      colors: [
        Color.fromRGBO(255, 255, 255, 0.1),
        Color.fromRGBO(255, 255, 255, 0.05),
      ],
    ),
    glassDark: LinearGradient(
      colors: [
        Color.fromRGBO(0, 0, 0, 0.1),
        Color.fromRGBO(0, 0, 0, 0.05),
      ],
    ),
  );
  
  static const dark = AppGradients(
    rosePrimary: LinearGradient(
      begin: Alignment.topLeft,
      end: Alignment.bottomRight,
      colors: [AppColors.rosePrimary400, AppColors.rosePrimary600],
    ),
    rosePrimaryHover: LinearGradient(
      begin: Alignment.topLeft,
      end: Alignment.bottomRight,
      colors: [AppColors.rosePrimary500, AppColors.rosePrimary700],
    ),
    partner: LinearGradient(
      begin: Alignment.topLeft,
      end: Alignment.bottomRight,
      colors: [AppColors.pinkPrimary, AppColors.violetPrimary],
    ),
    partnerHover: LinearGradient(
      begin: Alignment.topLeft,
      end: Alignment.bottomRight,
      colors: [AppColors.pinkDark, AppColors.violetDark],
    ),
    // Other gradients remain the same for dark mode
    airbnb: light.airbnb,
    sunset: light.sunset,
    ocean: light.ocean,
    modern: light.modern,
    glass: LinearGradient(
      colors: [
        Color.fromRGBO(255, 255, 255, 0.05),
        Color.fromRGBO(255, 255, 255, 0.02),
      ],
    ),
    glassDark: LinearGradient(
      colors: [
        Color.fromRGBO(0, 0, 0, 0.2),
        Color.fromRGBO(0, 0, 0, 0.1),
      ],
    ),
  );
  
  @override
  AppGradients copyWith({
    Gradient? rosePrimary,
    Gradient? rosePrimaryHover,
    Gradient? partner,
    Gradient? partnerHover,
    Gradient? airbnb,
    Gradient? sunset,
    Gradient? ocean,
    Gradient? modern,
    Gradient? glass,
    Gradient? glassDark,
  }) {
    return AppGradients(
      rosePrimary: rosePrimary ?? this.rosePrimary,
      rosePrimaryHover: rosePrimaryHover ?? this.rosePrimaryHover,
      partner: partner ?? this.partner,
      partnerHover: partnerHover ?? this.partnerHover,
      airbnb: airbnb ?? this.airbnb,
      sunset: sunset ?? this.sunset,
      ocean: ocean ?? this.ocean,
      modern: modern ?? this.modern,
      glass: glass ?? this.glass,
      glassDark: glassDark ?? this.glassDark,
    );
  }
  
  @override
  AppGradients lerp(ThemeExtension<AppGradients>? other, double t) {
    if (other is! AppGradients) return this;
    
    return AppGradients(
      rosePrimary: Gradient.lerp(rosePrimary, other.rosePrimary, t) ?? rosePrimary,
      rosePrimaryHover: Gradient.lerp(rosePrimaryHover, other.rosePrimaryHover, t) ?? rosePrimaryHover,
      partner: Gradient.lerp(partner, other.partner, t) ?? partner,
      partnerHover: Gradient.lerp(partnerHover, other.partnerHover, t) ?? partnerHover,
      airbnb: Gradient.lerp(airbnb, other.airbnb, t) ?? airbnb,
      sunset: Gradient.lerp(sunset, other.sunset, t) ?? sunset,
      ocean: Gradient.lerp(ocean, other.ocean, t) ?? ocean,
      modern: Gradient.lerp(modern, other.modern, t) ?? modern,
      glass: Gradient.lerp(glass, other.glass, t) ?? glass,
      glassDark: Gradient.lerp(glassDark, other.glassDark, t) ?? glassDark,
    );
  }
}
```

### **Shadow Theme Extension**
```dart
// lib/core/app/theme_extensions/shadow_extension.dart
@immutable
class AppShadows extends ThemeExtension<AppShadows> {
  final List<BoxShadow> modern;
  final List<BoxShadow> airbnb;
  final List<BoxShadow> float;
  final List<BoxShadow> card;
  final List<BoxShadow> button;
  final List<BoxShadow> dialog;
  
  const AppShadows({
    required this.modern,
    required this.airbnb,
    required this.float,
    required this.card,
    required this.button,
    required this.dialog,
  });
  
  static const light = AppShadows(
    // .shadow-modern equivalent
    modern: [
      BoxShadow(
        color: Color.fromRGBO(0, 0, 0, 0.1),
        offset: Offset(0, 10),
        blurRadius: 25,
        spreadRadius: -3,
      ),
      BoxShadow(
        color: Color.fromRGBO(0, 0, 0, 0.05),
        offset: Offset(0, 4),
        blurRadius: 6,
        spreadRadius: -2,
      ),
    ],
    
    // .shadow-airbnb equivalent
    airbnb: [
      BoxShadow(
        color: Color.fromRGBO(0, 0, 0, 0.12),
        offset: Offset(0, 6),
        blurRadius: 16,
      ),
    ],
    
    // .shadow-float equivalent
    float: [
      BoxShadow(
        color: Color.fromRGBO(0, 0, 0, 0.1),
        offset: Offset(0, 20),
        blurRadius: 25,
        spreadRadius: -5,
      ),
      BoxShadow(
        color: Color.fromRGBO(0, 0, 0, 0.04),
        offset: Offset(0, 10),
        blurRadius: 10,
        spreadRadius: -5,
      ),
    ],
    
    // Card shadows
    card: [
      BoxShadow(
        color: Color.fromRGBO(0, 0, 0, 0.08),
        offset: Offset(0, 2),
        blurRadius: 8,
      ),
    ],
    
    // Button shadows
    button: [
      BoxShadow(
        color: Color.fromRGBO(0, 0, 0, 0.1),
        offset: Offset(0, 4),
        blurRadius: 8,
      ),
    ],
    
    // Dialog shadows
    dialog: [
      BoxShadow(
        color: Color.fromRGBO(0, 0, 0, 0.15),
        offset: Offset(0, 10),
        blurRadius: 30,
        spreadRadius: -5,
      ),
    ],
  );
  
  static const dark = AppShadows(
    // Darker shadows for dark mode
    modern: [
      BoxShadow(
        color: Color.fromRGBO(0, 0, 0, 0.3),
        offset: Offset(0, 10),
        blurRadius: 25,
        spreadRadius: -3,
      ),
      BoxShadow(
        color: Color.fromRGBO(0, 0, 0, 0.15),
        offset: Offset(0, 4),
        blurRadius: 6,
        spreadRadius: -2,
      ),
    ],
    
    airbnb: [
      BoxShadow(
        color: Color.fromRGBO(0, 0, 0, 0.25),
        offset: Offset(0, 6),
        blurRadius: 16,
      ),
    ],
    
    float: [
      BoxShadow(
        color: Color.fromRGBO(0, 0, 0, 0.25),
        offset: Offset(0, 20),
        blurRadius: 25,
        spreadRadius: -5,
      ),
      BoxShadow(
        color: Color.fromRGBO(0, 0, 0, 0.1),
        offset: Offset(0, 10),
        blurRadius: 10,
        spreadRadius: -5,
      ),
    ],
    
    card: [
      BoxShadow(
        color: Color.fromRGBO(0, 0, 0, 0.2),
        offset: Offset(0, 2),
        blurRadius: 8,
      ),
    ],
    
    button: [
      BoxShadow(
        color: Color.fromRGBO(0, 0, 0, 0.2),
        offset: Offset(0, 4),
        blurRadius: 8,
      ),
    ],
    
    dialog: [
      BoxShadow(
        color: Color.fromRGBO(0, 0, 0, 0.4),
        offset: Offset(0, 10),
        blurRadius: 30,
        spreadRadius: -5,
      ),
    ],
  );
  
  @override
  AppShadows copyWith({
    List<BoxShadow>? modern,
    List<BoxShadow>? airbnb,
    List<BoxShadow>? float,
    List<BoxShadow>? card,
    List<BoxShadow>? button,
    List<BoxShadow>? dialog,
  }) {
    return AppShadows(
      modern: modern ?? this.modern,
      airbnb: airbnb ?? this.airbnb,
      float: float ?? this.float,
      card: card ?? this.card,
      button: button ?? this.button,
      dialog: dialog ?? this.dialog,
    );
  }
  
  @override
  AppShadows lerp(ThemeExtension<AppShadows>? other, double t) {
    if (other is! AppShadows) return this;
    
    return AppShadows(
      modern: BoxShadow.lerpList(modern, other.modern, t) ?? modern,
      airbnb: BoxShadow.lerpList(airbnb, other.airbnb, t) ?? airbnb,
      float: BoxShadow.lerpList(float, other.float, t) ?? float,
      card: BoxShadow.lerpList(card, other.card, t) ?? card,
      button: BoxShadow.lerpList(button, other.button, t) ?? button,
      dialog: BoxShadow.lerpList(dialog, other.dialog, t) ?? dialog,
    );
  }
}
```

### **Glass Morphism Extension**
```dart
// lib/core/app/theme_extensions/glass_extension.dart
@immutable
class AppGlassEffects extends ThemeExtension<AppGlassEffects> {
  final Color backgroundColor;
  final Color borderColor;
  final double blurRadius;
  final double borderWidth;
  
  const AppGlassEffects({
    required this.backgroundColor,
    required this.borderColor,
    required this.blurRadius,
    required this.borderWidth,
  });
  
  static const light = AppGlassEffects(
    backgroundColor: Color.fromRGBO(255, 255, 255, 0.1),
    borderColor: Color.fromRGBO(255, 255, 255, 0.2),
    blurRadius: 10.0,
    borderWidth: 1.0,
  );
  
  static const dark = AppGlassEffects(
    backgroundColor: Color.fromRGBO(0, 0, 0, 0.1),
    borderColor: Color.fromRGBO(255, 255, 255, 0.1),
    blurRadius: 10.0,
    borderWidth: 1.0,
  );
  
  @override
  AppGlassEffects copyWith({
    Color? backgroundColor,
    Color? borderColor,
    double? blurRadius,
    double? borderWidth,
  }) {
    return AppGlassEffects(
      backgroundColor: backgroundColor ?? this.backgroundColor,
      borderColor: borderColor ?? this.borderColor,
      blurRadius: blurRadius ?? this.blurRadius,
      borderWidth: borderWidth ?? this.borderWidth,
    );
  }
  
  @override
  AppGlassEffects lerp(ThemeExtension<AppGlassEffects>? other, double t) {
    if (other is! AppGlassEffects) return this;
    
    return AppGlassEffects(
      backgroundColor: Color.lerp(backgroundColor, other.backgroundColor, t) ?? backgroundColor,
      borderColor: Color.lerp(borderColor, other.borderColor, t) ?? borderColor,
      blurRadius: lerpDouble(blurRadius, other.blurRadius, t) ?? blurRadius,
      borderWidth: lerpDouble(borderWidth, other.borderWidth, t) ?? borderWidth,
    );
  }
}
```

---

## 📱 Complete Theme Implementation

### **Main Theme Data**
```dart
// lib/core/app/app_theme.dart (continued)
class AppTheme {
  static ThemeData get lightTheme => ThemeData(
    useMaterial3: true,
    colorScheme: lightColorScheme,
    
    // Typography matching Tailwind system
    textTheme: _buildTextTheme(false),
    
    // Component themes
    appBarTheme: AppBarTheme(
      backgroundColor: Colors.transparent,
      elevation: 0,
      scrolledUnderElevation: 0,
      titleTextStyle: TextStyle(
        color: lightColorScheme.onSurface,
        fontSize: 18,
        fontWeight: FontWeight.w600,
      ),
      iconTheme: IconThemeData(color: lightColorScheme.onSurface),
    ),
    
    cardTheme: CardTheme(
      color: lightColorScheme.surface,
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
      ),
      shadowColor: Colors.black.withOpacity(0.08),
    ),
    
    elevatedButtonTheme: ElevatedButtonThemeData(
      style: ElevatedButton.styleFrom(
        elevation: 0,
        shadowColor: Colors.transparent,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(12),
        ),
        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
        textStyle: const TextStyle(
          fontSize: 16,
          fontWeight: FontWeight.w600,
        ),
      ),
    ),
    
    outlinedButtonTheme: OutlinedButtonThemeData(
      style: OutlinedButton.styleFrom(
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(12),
        ),
        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
        side: BorderSide(color: lightColorScheme.outline),
      ),
    ),
    
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: const Color(0xFFF3F3F5),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: BorderSide.none,
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: BorderSide(color: lightColorScheme.primary, width: 2),
      ),
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
    ),
    
    bottomNavigationBarTheme: BottomNavigationBarThemeData(
      backgroundColor: Colors.white.withOpacity(0.9),
      selectedItemColor: lightColorScheme.primary,
      unselectedItemColor: Colors.grey[600],
      type: BottomNavigationBarType.fixed,
      elevation: 8,
      showSelectedLabels: true,
      showUnselectedLabels: true,
    ),
    
    drawerTheme: const DrawerThemeData(
      backgroundColor: Colors.white,
      elevation: 16,
      width: 300,
    ),
    
    dialogTheme: DialogTheme(
      backgroundColor: lightColorScheme.surface,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
      ),
      elevation: 0,
    ),
    
    snackBarTheme: SnackBarThemeData(
      backgroundColor: lightColorScheme.inverseSurface,
      contentTextStyle: TextStyle(color: lightColorScheme.onInverseSurface),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(8),
      ),
      behavior: SnackBarBehavior.floating,
    ),
    
    // Custom theme extensions
    extensions: <ThemeExtension<dynamic>>[
      AppGradients.light,
      AppShadows.light,
      AppGlassEffects.light,
    ],
  );
  
  static ThemeData get darkTheme => ThemeData(
    useMaterial3: true,
    colorScheme: darkColorScheme,
    
    // Typography
    textTheme: _buildTextTheme(true),
    
    // Component themes for dark mode
    appBarTheme: AppBarTheme(
      backgroundColor: Colors.transparent,
      elevation: 0,
      scrolledUnderElevation: 0,
      titleTextStyle: TextStyle(
        color: darkColorScheme.onSurface,
        fontSize: 18,
        fontWeight: FontWeight.w600,
      ),
      iconTheme: IconThemeData(color: darkColorScheme.onSurface),
    ),
    
    cardTheme: CardTheme(
      color: darkColorScheme.surface,
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
      ),
      shadowColor: Colors.black.withOpacity(0.3),
    ),
    
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: darkColorScheme.surfaceVariant,
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: BorderSide.none,
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: BorderSide(color: darkColorScheme.primary, width: 2),
      ),
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
    ),
    
    bottomNavigationBarTheme: BottomNavigationBarThemeData(
      backgroundColor: AppColors.cardDark.withOpacity(0.9),
      selectedItemColor: darkColorScheme.primary,
      unselectedItemColor: Colors.grey[400],
      type: BottomNavigationBarType.fixed,
      elevation: 8,
    ),
    
    drawerTheme: DrawerThemeData(
      backgroundColor: AppColors.cardDark,
      elevation: 16,
      width: 300,
    ),
    
    // Custom theme extensions
    extensions: <ThemeExtension<dynamic>>[
      AppGradients.dark,
      AppShadows.dark,
      AppGlassEffects.dark,
    ],
  );
  
  // Typography system matching Tailwind CSS variables
  static TextTheme _buildTextTheme(bool isDark) {
    final Color textColor = isDark ? Colors.white : const Color(0xFF1A1A1A);
    final Color mutedColor = isDark ? Colors.white70 : const Color(0xFF717182);
    
    return TextTheme(
      // Headings
      displayLarge: TextStyle(
        fontSize: 28,
        fontWeight: FontWeight.w500,
        color: textColor,
        height: 1.5,
      ),
      displayMedium: TextStyle(
        fontSize: 24,
        fontWeight: FontWeight.w500,
        color: textColor,
        height: 1.5,
      ),
      displaySmall: TextStyle(
        fontSize: 20,
        fontWeight: FontWeight.w500,
        color: textColor,
        height: 1.5,
      ),
      headlineLarge: TextStyle(
        fontSize: 18,
        fontWeight: FontWeight.w500,
        color: textColor,
        height: 1.5,
      ),
      
      // Body text
      bodyLarge: TextStyle(
        fontSize: 16,
        fontWeight: FontWeight.w400,
        color: textColor,
        height: 1.5,
      ),
      bodyMedium: TextStyle(
        fontSize: 14,
        fontWeight: FontWeight.w400,
        color: textColor,
        height: 1.5,
      ),
      bodySmall: TextStyle(
        fontSize: 12,
        fontWeight: FontWeight.w400,
        color: mutedColor,
        height: 1.5,
      ),
      
      // Labels
      labelLarge: TextStyle(
        fontSize: 16,
        fontWeight: FontWeight.w500,
        color: textColor,
        height: 1.5,
      ),
      labelMedium: TextStyle(
        fontSize: 14,
        fontWeight: FontWeight.w500,
        color: textColor,
        height: 1.5,
      ),
      labelSmall: TextStyle(
        fontSize: 12,
        fontWeight: FontWeight.w500,
        color: mutedColor,
        height: 1.5,
      ),
    );
  }
}
```

---

## 🎨 Custom Widgets for Theme System

### **Gradient Button Widget**
```dart
// lib/core/widgets/buttons/gradient_button.dart
class GradientButton extends StatefulWidget {
  final String text;
  final VoidCallback? onPressed;
  final GradientType gradientType;
  final bool isLoading;
  final IconData? icon;
  final EdgeInsetsGeometry? padding;
  final BorderRadius? borderRadius;
  
  const GradientButton({
    required this.text,
    this.onPressed,
    this.gradientType = GradientType.rosePrimary,
    this.isLoading = false,
    this.icon,
    this.padding,
    this.borderRadius,
    super.key,
  });

  @override
  State<GradientButton> createState() => _GradientButtonState();
}

class _GradientButtonState extends State<GradientButton>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _scaleAnimation;
  bool _isPressed = false;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      duration: const Duration(milliseconds: 150),
      vsync: this,
    );
    _scaleAnimation = Tween<double>(
      begin: 1.0,
      end: 0.95,
    ).animate(CurvedAnimation(
      parent: _controller,
      curve: Curves.easeInOut,
    ));
  }

  @override
  Widget build(BuildContext context) {
    final gradients = Theme.of(context).extension<AppGradients>()!;
    final shadows = Theme.of(context).extension<AppShadows>()!;
    
    Gradient gradient;
    Gradient hoverGradient;
    
    switch (widget.gradientType) {
      case GradientType.rosePrimary:
        gradient = gradients.rosePrimary;
        hoverGradient = gradients.rosePrimaryHover;
        break;
      case GradientType.partner:
        gradient = gradients.partner;
        hoverGradient = gradients.partnerHover;
        break;
      case GradientType.airbnb:
        gradient = gradients.airbnb;
        hoverGradient = gradients.airbnb;
        break;
    }
    
    return AnimatedBuilder(
      animation: _scaleAnimation,
      builder: (context, child) {
        return Transform.scale(
          scale: _scaleAnimation.value,
          child: Container(
            decoration: BoxDecoration(
              gradient: _isPressed ? hoverGradient : gradient,
              borderRadius: widget.borderRadius ?? BorderRadius.circular(12),
              boxShadow: _isPressed ? [] : shadows.button,
            ),
            child: Material(
              color: Colors.transparent,
              child: InkWell(
                onTap: widget.isLoading ? null : widget.onPressed,
                onTapDown: (_) {
                  setState(() => _isPressed = true);
                  _controller.forward();
                },
                onTapUp: (_) {
                  setState(() => _isPressed = false);
                  _controller.reverse();
                },
                onTapCancel: () {
                  setState(() => _isPressed = false);
                  _controller.reverse();
                },
                borderRadius: widget.borderRadius ?? BorderRadius.circular(12),
                child: Container(
                  padding: widget.padding ?? 
                    const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      if (widget.isLoading) ...[
                        const SizedBox(
                          width: 20,
                          height: 20,
                          child: CircularProgressIndicator(
                            color: Colors.white,
                            strokeWidth: 2,
                          ),
                        ),
                        const SizedBox(width: 8),
                      ] else if (widget.icon != null) ...[
                        Icon(widget.icon, color: Colors.white, size: 20),
                        const SizedBox(width: 8),
                      ],
                      Text(
                        widget.text,
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 16,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
        );
      },
    );
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }
}

enum GradientType {
  rosePrimary,
  partner,
  airbnb,
}
```

### **Glass Morphism Container**
```dart
// lib/core/widgets/containers/glass_container.dart
class GlassContainer extends StatelessWidget {
  final Widget child;
  final EdgeInsetsGeometry? padding;
  final EdgeInsetsGeometry? margin;
  final BorderRadius? borderRadius;
  final double? blur;
  final Color? backgroundColor;
  final Border? border;
  
  const GlassContainer({
    required this.child,
    this.padding,
    this.margin,
    this.borderRadius,
    this.blur,
    this.backgroundColor,
    this.border,
    super.key,
  });

  @override
  Widget build(BuildContext context) {
    final glassEffects = Theme.of(context).extension<AppGlassEffects>()!;
    
    return Container(
      margin: margin,
      decoration: BoxDecoration(
        borderRadius: borderRadius ?? BorderRadius.circular(12),
        border: border ?? Border.all(
          color: glassEffects.borderColor,
          width: glassEffects.borderWidth,
        ),
      ),
      child: ClipRRect(
        borderRadius: borderRadius ?? BorderRadius.circular(12),
        child: BackdropFilter(
          filter: ImageFilter.blur(
            sigmaX: blur ?? glassEffects.blurRadius,
            sigmaY: blur ?? glassEffects.blurRadius,
          ),
          child: Container(
            padding: padding,
            decoration: BoxDecoration(
              color: backgroundColor ?? glassEffects.backgroundColor,
            ),
            child: child,
          ),
        ),
      ),
    );
  }
}
```

### **Animated Theme Switcher**
```dart
// lib/core/widgets/theme/animated_theme_switcher.dart
class AnimatedThemeSwitcher extends ConsumerWidget {
  const AnimatedThemeSwitcher({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isDarkMode = ref.watch(isDarkModeProvider);
    
    return GestureDetector(
      onTap: () => ref.read(themeProvider.notifier).toggleDarkMode(),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 300),
        curve: Curves.easeInOut,
        width: 60,
        height: 30,
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(15),
          color: isDarkMode ? AppColors.rosePrimary400 : Colors.grey[300],
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.1),
              blurRadius: 4,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Stack(
          children: [
            AnimatedPositioned(
              duration: const Duration(milliseconds: 300),
              curve: Curves.easeInOut,
              left: isDarkMode ? 32 : 2,
              top: 2,
              child: Container(
                width: 26,
                height: 26,
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(13),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withOpacity(0.15),
                      blurRadius: 4,
                      offset: const Offset(0, 1),
                    ),
                  ],
                ),
                child: AnimatedSwitcher(
                  duration: const Duration(milliseconds: 300),
                  child: isDarkMode
                      ? const Icon(
                          Icons.nightlight_round,
                          key: ValueKey('moon'),
                          size: 16,
                          color: AppColors.rosePrimary400,
                        )
                      : Icon(
                          Icons.wb_sunny,
                          key: const ValueKey('sun'),
                          size: 16,
                          color: Colors.amber[600],
                        ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
```

---

## 🎬 Theme Transition Animations

### **Theme Transition Controller**
```dart
// lib/core/app/theme_transition_controller.dart
class ThemeTransitionController {
  static const Duration transitionDuration = Duration(milliseconds: 300);
  static const Curve transitionCurve = Curves.easeInOut;
  
  static void animateThemeChange(
    BuildContext context,
    VoidCallback onComplete,
  ) {
    // Create overlay for smooth transition
    final overlay = Overlay.of(context);
    late OverlayEntry overlayEntry;
    
    overlayEntry = OverlayEntry(
      builder: (context) => AnimatedContainer(
        duration: transitionDuration,
        curve: transitionCurve,
        color: Colors.black.withOpacity(0.0),
        child: Container(),
      ),
    );
    
    overlay.insert(overlayEntry);
    
    // Trigger theme change after brief delay
    Future.delayed(const Duration(milliseconds: 50), () {
      onComplete();
      
      // Remove overlay after transition
      Future.delayed(transitionDuration, () {
        overlayEntry.remove();
      });
    });
  }
  
  static Widget buildTransitionWrapper({
    required Widget child,
    required bool isDarkMode,
  }) {
    return AnimatedContainer(
      duration: transitionDuration,
      curve: transitionCurve,
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
          colors: isDarkMode
              ? [
                  const Color(0xFF0A0A0A),
                  const Color(0xFF1A1A1A),
                ]
              : [
                  Colors.white,
                  const Color(0xFFFAFAFA),
                ],
        ),
      ),
      child: child,
    );
  }
}
```

### **Page Transition with Theme**
```dart
// lib/core/navigation/theme_aware_page_route.dart
class ThemeAwarePageRoute<T> extends PageRouteBuilder<T> {
  final Widget child;
  final bool isDarkMode;
  
  ThemeAwarePageRoute({
    required this.child,
    required this.isDarkMode,
    RouteSettings? settings,
  }) : super(
    settings: settings,
    pageBuilder: (context, animation, _) => child,
    transitionsBuilder: (context, animation, secondaryAnimation, child) {
      return FadeTransition(
        opacity: animation,
        child: SlideTransition(
          position: Tween<Offset>(
            begin: const Offset(0.0, 0.1),
            end: Offset.zero,
          ).animate(CurvedAnimation(
            parent: animation,
            curve: Curves.easeOutCubic,
          )),
          child: ThemeTransitionController.buildTransitionWrapper(
            isDarkMode: isDarkMode,
            child: child,
          ),
        ),
      );
    },
    transitionDuration: const Duration(milliseconds: 300),
  );
}
```

---

## 🔧 Theme Integration with State Management

### **Theme Provider Integration**
```dart
// lib/core/state/providers/theme_provider.dart (updated)
final themeProvider = StateNotifierProvider<ThemeNotifier, ThemeState>((ref) {
  final storageService = ref.watch(storageServiceProvider);
  return ThemeNotifier(storageService);
});

// Computed providers for easy access
final currentThemeDataProvider = Provider<ThemeData>((ref) {
  final themeState = ref.watch(themeProvider);
  return themeState.isDarkMode ? AppTheme.darkTheme : AppTheme.lightTheme;
});

final gradientsProvider = Provider<AppGradients>((ref) {
  final themeData = ref.watch(currentThemeDataProvider);
  return themeData.extension<AppGradients>()!;
});

final shadowsProvider = Provider<AppShadows>((ref) {
  final themeData = ref.watch(currentThemeDataProvider);
  return themeData.extension<AppShadows>()!;
});

final glassEffectsProvider = Provider<AppGlassEffects>((ref) {
  final themeData = ref.watch(currentThemeDataProvider);
  return themeData.extension<AppGlassEffects>()!;
});
```

### **App Integration**
```dart
// lib/main.dart
class TripAvailApp extends ConsumerWidget {
  const TripAvailApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final themeData = ref.watch(currentThemeDataProvider);
    final themeState = ref.watch(themeProvider);
    
    return MaterialApp.router(
      title: 'TripAvail',
      theme: AppTheme.lightTheme,
      darkTheme: AppTheme.darkTheme,
      themeMode: themeState.themeMode,
      routerConfig: ref.watch(appRouterProvider),
      
      // Theme transition animation
      builder: (context, child) {
        return AnimatedContainer(
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeInOut,
          child: child,
        );
      },
      
      // Localization support
      locale: Locale(themeState.locale),
      
      debugShowCheckedModeBanner: false,
    );
  }
}
```

---

## 📱 Component Theme Examples

### **Themed Card Component**
```dart
// lib/core/widgets/cards/themed_card.dart
class ThemedCard extends ConsumerWidget {
  final Widget child;
  final VoidCallback? onTap;
  final bool useGlass;
  final bool useHoverEffect;
  final EdgeInsetsGeometry? padding;
  final EdgeInsetsGeometry? margin;
  
  const ThemedCard({
    required this.child,
    this.onTap,
    this.useGlass = false,
    this.useHoverEffect = true,
    this.padding,
    this.margin,
    super.key,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final shadows = ref.watch(shadowsProvider);
    final glassEffects = ref.watch(glassEffectsProvider);
    
    Widget cardContent = Container(
      padding: padding ?? const EdgeInsets.all(16),
      margin: margin,
      decoration: BoxDecoration(
        color: useGlass ? null : Theme.of(context).cardColor,
        borderRadius: BorderRadius.circular(12),
        boxShadow: useGlass ? null : shadows.card,
        border: useGlass ? Border.all(
          color: glassEffects.borderColor,
          width: glassEffects.borderWidth,
        ) : null,
      ),
      child: child,
    );
    
    if (useGlass) {
      cardContent = ClipRRect(
        borderRadius: BorderRadius.circular(12),
        child: BackdropFilter(
          filter: ImageFilter.blur(
            sigmaX: glassEffects.blurRadius,
            sigmaY: glassEffects.blurRadius,
          ),
          child: Container(
            decoration: BoxDecoration(
              color: glassEffects.backgroundColor,
              borderRadius: BorderRadius.circular(12),
            ),
            child: cardContent,
          ),
        ),
      );
    }
    
    if (onTap != null) {
      return Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(12),
          child: useHoverEffect
              ? MouseRegion(
                  cursor: SystemMouseCursors.click,
                  child: AnimatedContainer(
                    duration: const Duration(milliseconds: 200),
                    child: cardContent,
                  ),
                )
              : cardContent,
        ),
      );
    }
    
    return cardContent;
  }
}
```

### **Themed App Bar**
```dart
// lib/core/widgets/app_bars/themed_app_bar.dart
class ThemedAppBar extends ConsumerWidget implements PreferredSizeWidget {
  final String? title;
  final List<Widget>? actions;
  final Widget? leading;
  final bool useGlass;
  final bool centerTitle;
  
  const ThemedAppBar({
    this.title,
    this.actions,
    this.leading,
    this.useGlass = true,
    this.centerTitle = true,
    super.key,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final glassEffects = ref.watch(glassEffectsProvider);
    
    return Container(
      decoration: useGlass ? BoxDecoration(
        border: Border(
          bottom: BorderSide(
            color: glassEffects.borderColor,
            width: 0.5,
          ),
        ),
      ) : null,
      child: ClipRRect(
        child: useGlass ? BackdropFilter(
          filter: ImageFilter.blur(
            sigmaX: glassEffects.blurRadius,
            sigmaY: glassEffects.blurRadius,
          ),
          child: _buildAppBar(context),
        ) : _buildAppBar(context),
      ),
    );
  }
  
  Widget _buildAppBar(BuildContext context) {
    return AppBar(
      title: title != null ? Text(title!) : null,
      actions: actions,
      leading: leading,
      centerTitle: centerTitle,
      backgroundColor: useGlass 
          ? Colors.transparent 
          : Theme.of(context).appBarTheme.backgroundColor,
      elevation: 0,
      scrolledUnderElevation: 0,
    );
  }

  @override
  Size get preferredSize => const Size.fromHeight(kToolbarHeight);
}
```

---

## 📊 Theme Performance Optimization

### **Theme Caching Strategy**
```dart
// lib/core/app/theme_cache.dart
class ThemeCache {
  static final Map<String, ThemeData> _cache = {};
  
  static ThemeData getTheme(String key, ThemeData Function() builder) {
    if (_cache.containsKey(key)) {
      return _cache[key]!;
    }
    
    final theme = builder();
    _cache[key] = theme;
    return theme;
  }
  
  static void clearCache() {
    _cache.clear();
  }
  
  static ThemeData getLightTheme() {
    return getTheme('light', () => AppTheme.lightTheme);
  }
  
  static ThemeData getDarkTheme() {
    return getTheme('dark', () => AppTheme.darkTheme);
  }
}
```

### **Memory Management**
```dart
// lib/core/app/theme_manager.dart
class ThemeManager {
  static void disposeResources() {
    // Clean up any theme-related resources
    ThemeCache.clearCache();
  }
  
  static void preloadThemes() {
    // Preload themes for better performance
    ThemeCache.getLightTheme();
    ThemeCache.getDarkTheme();
  }
}
```

---

## 🧪 Testing Theme System

### **Theme Test Helpers**
```dart
// test/helpers/theme_test_helpers.dart
class ThemeTestHelpers {
  static Widget buildThemedWidget({
    required Widget child,
    bool isDarkMode = false,
    List<Override> overrides = const [],
  }) {
    return ProviderScope(
      overrides: [
        themeProvider.overrideWith(() => MockThemeNotifier(isDarkMode)),
        ...overrides,
      ],
      child: MaterialApp(
        theme: AppTheme.lightTheme,
        darkTheme: AppTheme.darkTheme,
        themeMode: isDarkMode ? ThemeMode.dark : ThemeMode.light,
        home: child,
      ),
    );
  }
  
  static void expectGradientColors(
    Container container,
    List<Color> expectedColors,
  ) {
    final decoration = container.decoration as BoxDecoration;
    final gradient = decoration.gradient as LinearGradient;
    expect(gradient.colors, expectedColors);
  }
  
  static void expectShadowProperties(
    Container container,
    List<BoxShadow> expectedShadows,
  ) {
    final decoration = container.decoration as BoxDecoration;
    expect(decoration.boxShadow, expectedShadows);
  }
}

// Widget tests
void main() {
  group('Theme System Tests', () {
    testWidgets('should apply correct colors in light mode', (tester) async {
      await tester.pumpWidget(
        ThemeTestHelpers.buildThemedWidget(
          child: Builder(
            builder: (context) {
              expect(
                Theme.of(context).colorScheme.primary,
                AppColors.rosePrimary600,
              );
              return Container();
            },
          ),
        ),
      );
    });
    
    testWidgets('should apply correct colors in dark mode', (tester) async {
      await tester.pumpWidget(
        ThemeTestHelpers.buildThemedWidget(
          isDarkMode: true,
          child: Builder(
            builder: (context) {
              expect(
                Theme.of(context).colorScheme.primary,
                AppColors.rosePrimary400,
              );
              return Container();
            },
          ),
        ),
      );
    });
    
    testWidgets('gradient button should use correct gradient', (tester) async {
      await tester.pumpWidget(
        ThemeTestHelpers.buildThemedWidget(
          child: const GradientButton(
            text: 'Test Button',
            gradientType: GradientType.rosePrimary,
          ),
        ),
      );
      
      // Find the gradient container
      final container = tester.widget<Container>(
        find.descendant(
          of: find.byType(GradientButton),
          matching: find.byType(Container),
        ).first,
      );
      
      ThemeTestHelpers.expectGradientColors(container, [
        AppColors.rosePrimary600,
        AppColors.rosePrimary400,
      ]);
    });
  });
}
```

---

## 🔍 Migration Checklist

### **✅ Core Theme Migration**
- [ ] Implement Material 3 color schemes (light/dark)
- [ ] Create custom theme extensions (gradients, shadows, glass)
- [ ] Set up typography system matching Tailwind CSS
- [ ] Configure component themes (AppBar, Card, Button, etc.)
- [ ] Implement theme transition animations

### **✅ Custom Components**
- [ ] Create GradientButton with hover states
- [ ] Implement GlassContainer with backdrop filter
- [ ] Build AnimatedThemeSwitcher component
- [ ] Create ThemedCard with glass morphism option
- [ ] Implement ThemedAppBar with blur effects

### **✅ State Integration**
- [ ] Connect theme system with Riverpod providers
- [ ] Implement theme persistence with SharedPreferences
- [ ] Create theme transition controller
- [ ] Set up theme caching for performance
- [ ] Add theme-aware page transitions

### **✅ Testing & Quality**
- [ ] Write comprehensive theme tests
- [ ] Create theme test helpers
- [ ] Test gradient and shadow applications
- [ ] Verify dark/light mode transitions
- [ ] Performance test theme switching

### **✅ Advanced Features**
- [ ] System theme detection and auto-switching
- [ ] Smooth theme transition animations (0.3s ease)
- [ ] Memory management and resource cleanup
- [ ] Theme extension lerp implementations
- [ ] Custom theme builder patterns

---

## 🔍 Next Steps

1. **Implement core theme system** with Material 3 colors
2. **Create custom theme extensions** for gradients and effects  
3. **Set up component architecture** (`07_core_components.md`)
4. **Implement navigation system** (`05_navigation_system.md`)
5. **Define data models** (`06_data_models.md`)

---

*This comprehensive Flutter theme system preserves all sophisticated features from the Tailwind v4 CSS implementation while leveraging Flutter's powerful theming capabilities for better performance, maintainability, and integration with the state management system.*