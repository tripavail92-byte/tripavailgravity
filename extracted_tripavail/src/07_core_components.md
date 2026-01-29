# Flutter Core Components Implementation

## Executive Summary

This document defines the comprehensive Flutter component architecture for TripAvail, migrating from the sophisticated React component system to Flutter widgets while preserving all advanced features including glass morphism effects, custom animations, gradient systems, and complex state coordination. The implementation maintains the modular architecture with feature-based organization and creates a robust design system foundation.

### Key Component Features to Migrate
- **Advanced Widget Composition**: Custom widgets with sophisticated styling and animations
- **Glass Morphism Effects**: Backdrop blur and transparency with proper Material 3 integration
- **Gradient System**: Custom gradient buttons and containers with hover states
- **Icon Animation System**: Sophisticated animated icons with state-aware transitions
- **Modular Architecture**: Feature-based widget organization with proper separation of concerns
- **Complex State Coordination**: Widgets that respond to multiple state providers seamlessly

---

## 🧩 Component Architecture Overview

### **Widget Hierarchy**
```
TripAvail Widget Architecture
├── App-Level Widgets
│   ├── TripAvailApp (MaterialApp wrapper)
│   ├── SplashScreen (Animated intro)
│   ├── MainNavigationShell (Layout coordinator)
│   └── ErrorBoundaryWidget (Error handling)
├── Layout Widgets
│   ├── ThemedAppBar (Custom app bar with glass effects)
│   ├── CustomDrawer (Role-based navigation drawer)
│   ├── CustomBottomNavigation (Traveler tab navigation)
│   └── ScreenFlipAnimationOverlay (3D rotation transition)
├── Core UI Components
│   ├── Buttons (Gradient, themed, animated)
│   ├── Cards (Glass morphism, elevated, themed)
│   ├── Inputs (Themed form components)
│   ├── Loading States (Skeleton, spinner, progress)
│   └── Overlays (Search, dialogs, modals)
├── Feature Widgets
│   ├── Search Components
│   ├── Profile Components
│   ├── Booking Components
│   ├── Verification Components
│   └── Dashboard Components
├── Animated Icons & Graphics
│   ├── Role-specific Icon Sets
│   ├── Animated State Indicators
│   ├── Vector Graphics Components
│   └── Lottie Animation Wrappers
└── Utility Widgets
    ├── Responsive Layout Helpers
    ├── Animation Coordinators
    ├── State-aware Builders
    └── Performance Optimizers
```

### **Component Design Principles**
```dart
// Core design principles for all widgets
abstract class TripAvailWidget extends StatelessWidget {
  // 1. Theme-aware styling
  // 2. Animation integration
  // 3. State management integration
  // 4. Performance optimization
  // 5. Accessibility compliance
}
```

---

## 🎨 Core UI Component Library

### **Base Widget Classes**
```dart
// lib/core/widgets/base/base_widget.dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

abstract class TripAvailWidget extends ConsumerWidget {
  const TripAvailWidget({super.key});
  
  // Theme-aware build pattern
  Widget buildWithTheme(BuildContext context, WidgetRef ref, ThemeData theme);
  
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);
    return buildWithTheme(context, ref, theme);
  }
}

abstract class TripAvailStatefulWidget extends ConsumerStatefulWidget {
  const TripAvailStatefulWidget({super.key});
}

// Animation-aware widget base
abstract class AnimatedTripAvailWidget extends TripAvailWidget {
  const AnimatedTripAvailWidget({super.key});
  
  Duration get animationDuration => const Duration(milliseconds: 300);
  Curve get animationCurve => Curves.easeInOut;
}

// State-coordinated widget base
abstract class StateAwareTripAvailWidget extends TripAvailWidget {
  const StateAwareTripAvailWidget({super.key});
  
  // Automatically subscribes to common state providers
  Widget buildWithState(
    BuildContext context,
    WidgetRef ref,
    ThemeData theme,
    NavigationState navigationState,
    UserRole currentRole,
  );
  
  @override
  Widget buildWithTheme(BuildContext context, WidgetRef ref, ThemeData theme) {
    final navigationState = ref.watch(navigationStateProvider);
    final currentRole = ref.watch(currentRoleProvider);
    
    return buildWithState(context, ref, theme, navigationState, currentRole);
  }
}
```

### **Gradient Button System**
```dart
// lib/core/widgets/buttons/gradient_button.dart
class GradientButton extends AnimatedTripAvailWidget {
  final String text;
  final VoidCallback? onPressed;
  final GradientType gradientType;
  final bool isLoading;
  final IconData? icon;
  final EdgeInsetsGeometry? padding;
  final BorderRadius? borderRadius;
  final double? width;
  final double? height;
  
  const GradientButton({
    required this.text,
    this.onPressed,
    this.gradientType = GradientType.rosePrimary,
    this.isLoading = false,
    this.icon,
    this.padding,
    this.borderRadius,
    this.width,
    this.height,
    super.key,
  });

  @override
  Widget buildWithTheme(BuildContext context, WidgetRef ref, ThemeData theme) {
    final gradients = theme.extension<AppGradients>()!;
    final shadows = theme.extension<AppShadows>()!;
    
    return AnimatedButtonWrapper(
      duration: animationDuration,
      curve: animationCurve,
      child: _GradientButtonContent(
        text: text,
        onPressed: onPressed,
        gradientType: gradientType,
        isLoading: isLoading,
        icon: icon,
        padding: padding,
        borderRadius: borderRadius,
        width: width,
        height: height,
        gradients: gradients,
        shadows: shadows,
      ),
    );
  }
}

class _GradientButtonContent extends StatefulWidget {
  final String text;
  final VoidCallback? onPressed;
  final GradientType gradientType;
  final bool isLoading;
  final IconData? icon;
  final EdgeInsetsGeometry? padding;
  final BorderRadius? borderRadius;
  final double? width;
  final double? height;
  final AppGradients gradients;
  final AppShadows shadows;
  
  const _GradientButtonContent({
    required this.text,
    this.onPressed,
    required this.gradientType,
    this.isLoading = false,
    this.icon,
    this.padding,
    this.borderRadius,
    this.width,
    this.height,
    required this.gradients,
    required this.shadows,
  });

  @override
  State<_GradientButtonContent> createState() => _GradientButtonContentState();
}

class _GradientButtonContentState extends State<_GradientButtonContent>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _scaleAnimation;
  late Animation<double> _elevationAnimation;
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
    
    _elevationAnimation = Tween<double>(
      begin: 1.0,
      end: 0.0,
    ).animate(CurvedAnimation(
      parent: _controller,
      curve: Curves.easeInOut,
    ));
  }

  @override
  Widget build(BuildContext context) {
    Gradient gradient;
    Gradient hoverGradient;
    
    switch (widget.gradientType) {
      case GradientType.rosePrimary:
        gradient = widget.gradients.rosePrimary;
        hoverGradient = widget.gradients.rosePrimaryHover;
        break;
      case GradientType.partner:
        gradient = widget.gradients.partner;
        hoverGradient = widget.gradients.partnerHover;
        break;
      case GradientType.airbnb:
        gradient = widget.gradients.airbnb;
        hoverGradient = widget.gradients.airbnb;
        break;
    }
    
    return AnimatedBuilder(
      animation: _controller,
      builder: (context, child) {
        return Transform.scale(
          scale: _scaleAnimation.value,
          child: Container(
            width: widget.width,
            height: widget.height,
            decoration: BoxDecoration(
              gradient: _isPressed ? hoverGradient : gradient,
              borderRadius: widget.borderRadius ?? BorderRadius.circular(12),
              boxShadow: widget.shadows.button.map((shadow) => 
                shadow.copyWith(
                  blurRadius: shadow.blurRadius * _elevationAnimation.value,
                  spreadRadius: shadow.spreadRadius * _elevationAnimation.value,
                  offset: shadow.offset * _elevationAnimation.value,
                ),
              ).toList(),
            ),
            child: Material(
              color: Colors.transparent,
              child: InkWell(
                onTap: widget.isLoading ? null : widget.onPressed,
                onTapDown: (_) => _handleTapDown(),
                onTapUp: (_) => _handleTapUp(),
                onTapCancel: _handleTapUp,
                borderRadius: widget.borderRadius ?? BorderRadius.circular(12),
                child: Container(
                  padding: widget.padding ?? 
                    const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
                  child: _buildButtonContent(),
                ),
              ),
            ),
          ),
        );
      },
    );
  }
  
  Widget _buildButtonContent() {
    if (widget.isLoading) {
      return Row(
        mainAxisSize: MainAxisSize.min,
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          SizedBox(
            width: 20,
            height: 20,
            child: CircularProgressIndicator(
              color: Colors.white,
              strokeWidth: 2,
            ),
          ),
          const SizedBox(width: 8),
          Text(
            'Loading...',
            style: const TextStyle(
              color: Colors.white,
              fontSize: 16,
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      );
    }
    
    return Row(
      mainAxisSize: MainAxisSize.min,
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        if (widget.icon != null) ...[
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
    );
  }
  
  void _handleTapDown() {
    setState(() => _isPressed = true);
    _controller.forward();
  }
  
  void _handleTapUp() {
    setState(() => _isPressed = false);
    _controller.reverse();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }
}

// Animated button wrapper for shared animation logic
class AnimatedButtonWrapper extends StatelessWidget {
  final Widget child;
  final Duration duration;
  final Curve curve;
  
  const AnimatedButtonWrapper({
    required this.child,
    required this.duration,
    required this.curve,
    super.key,
  });

  @override
  Widget build(BuildContext context) {
    return AnimatedContainer(
      duration: duration,
      curve: curve,
      child: child,
    );
  }
}

enum GradientType {
  rosePrimary,
  partner,
  airbnb,
}
```

### **Glass Morphism Card System**
```dart
// lib/core/widgets/cards/glass_card.dart
class GlassCard extends TripAvailWidget {
  final Widget child;
  final EdgeInsetsGeometry? padding;
  final EdgeInsetsGeometry? margin;
  final BorderRadius? borderRadius;
  final double? blur;
  final Color? backgroundColor;
  final Border? border;
  final VoidCallback? onTap;
  final bool useHoverEffect;
  final double? width;
  final double? height;
  
  const GlassCard({
    required this.child,
    this.padding,
    this.margin,
    this.borderRadius,
    this.blur,
    this.backgroundColor,
    this.border,
    this.onTap,
    this.useHoverEffect = true,
    this.width,
    this.height,
    super.key,
  });

  @override
  Widget buildWithTheme(BuildContext context, WidgetRef ref, ThemeData theme) {
    final glassEffects = theme.extension<AppGlassEffects>()!;
    final shadows = theme.extension<AppShadows>()!;
    
    return GlassCardWrapper(
      width: width,
      height: height,
      margin: margin,
      borderRadius: borderRadius ?? BorderRadius.circular(12),
      border: border ?? Border.all(
        color: glassEffects.borderColor,
        width: glassEffects.borderWidth,
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
              boxShadow: shadows.card,
            ),
            child: _buildCardContent(),
          ),
        ),
      ),
    );
  }
  
  Widget _buildCardContent() {
    if (onTap != null) {
      return Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: onTap,
          borderRadius: borderRadius ?? BorderRadius.circular(12),
          child: useHoverEffect
              ? MouseRegion(
                  cursor: SystemMouseCursors.click,
                  child: AnimatedContainer(
                    duration: const Duration(milliseconds: 200),
                    child: child,
                  ),
                )
              : child,
        ),
      );
    }
    
    return child;
  }
}

class GlassCardWrapper extends StatelessWidget {
  final Widget child;
  final double? width;
  final double? height;
  final EdgeInsetsGeometry? margin;
  final BorderRadius borderRadius;
  final Border border;
  
  const GlassCardWrapper({
    required this.child,
    this.width,
    this.height,
    this.margin,
    required this.borderRadius,
    required this.border,
    super.key,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      width: width,
      height: height,
      margin: margin,
      decoration: BoxDecoration(
        borderRadius: borderRadius,
        border: border,
      ),
      child: child,
    );
  }
}
```

### **Themed App Bar Component**
```dart
// lib/core/widgets/app_bars/themed_app_bar.dart
class ThemedAppBar extends StateAwareTripAvailWidget implements PreferredSizeWidget {
  final String? title;
  final Widget? titleWidget;
  final List<Widget>? actions;
  final Widget? leading;
  final bool useGlass;
  final bool centerTitle;
  final bool showBackButton;
  final VoidCallback? onBackPressed;
  
  const ThemedAppBar({
    this.title,
    this.titleWidget,
    this.actions,
    this.leading,
    this.useGlass = true,
    this.centerTitle = true,
    this.showBackButton = false,
    this.onBackPressed,
    super.key,
  });

  @override
  Widget buildWithState(
    BuildContext context,
    WidgetRef ref,
    ThemeData theme,
    NavigationState navigationState,
    UserRole currentRole,
  ) {
    final glassEffects = theme.extension<AppGlassEffects>()!;
    
    if (navigationState.isDetailScreenActive || navigationState.isFlipping) {
      return const SizedBox.shrink();
    }
    
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
          child: _buildAppBar(context, ref, theme, currentRole),
        ) : _buildAppBar(context, ref, theme, currentRole),
      ),
    );
  }
  
  Widget _buildAppBar(BuildContext context, WidgetRef ref, ThemeData theme, UserRole currentRole) {
    return AppBar(
      title: titleWidget ?? (title != null ? Text(title!) : null),
      leading: _buildLeading(context, ref),
      actions: _buildActions(context, ref, currentRole),
      centerTitle: centerTitle,
      backgroundColor: useGlass 
          ? Colors.transparent 
          : theme.appBarTheme.backgroundColor,
      elevation: 0,
      scrolledUnderElevation: 0,
      surfaceTintColor: Colors.transparent,
    );
  }
  
  Widget? _buildLeading(BuildContext context, WidgetRef ref) {
    if (leading != null) return leading;
    
    if (showBackButton) {
      return IconButton(
        onPressed: onBackPressed ?? () => Navigator.of(context).pop(),
        icon: const Icon(Icons.arrow_back),
      );
    }
    
    return MenuButton();
  }
  
  List<Widget>? _buildActions(BuildContext context, WidgetRef ref, UserRole currentRole) {
    final defaultActions = [
      const AnimatedThemeSwitcher(),
      const SizedBox(width: 8),
      ProfileButton(role: currentRole),
      const SizedBox(width: 16),
    ];
    
    if (actions != null) {
      return [...actions!, ...defaultActions];
    }
    
    return defaultActions;
  }

  @override
  Size get preferredSize => const Size.fromHeight(kToolbarHeight);
}

// Menu Button Component
class MenuButton extends StateAwareTripAvailWidget {
  const MenuButton({super.key});

  @override
  Widget buildWithState(
    BuildContext context,
    WidgetRef ref,
    ThemeData theme,
    NavigationState navigationState,
    UserRole currentRole,
  ) {
    return IconButton(
      onPressed: () => ref.read(navigationStateProvider.notifier).toggleDrawer(),
      icon: AnimatedSwitcher(
        duration: const Duration(milliseconds: 200),
        child: navigationState.isDrawerOpen
            ? const Icon(Icons.close, key: ValueKey('close'))
            : const Icon(Icons.menu, key: ValueKey('menu')),
      ),
    );
  }
}

// Profile Button Component
class ProfileButton extends TripAvailWidget {
  final UserRole role;
  
  const ProfileButton({required this.role, super.key});

  @override
  Widget buildWithTheme(BuildContext context, WidgetRef ref, ThemeData theme) {
    final user = ref.watch(currentUserProvider);
    
    return GestureDetector(
      onTap: () => _navigateToProfile(context, ref, role),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        decoration: BoxDecoration(
          color: theme.colorScheme.surfaceVariant,
          borderRadius: BorderRadius.circular(20),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            ProfileAvatar(size: 24, user: user),
            const SizedBox(width: 8),
            Text(
              role.displayName,
              style: theme.textTheme.labelMedium,
            ),
          ],
        ),
      ),
    );
  }
  
  void _navigateToProfile(BuildContext context, WidgetRef ref, UserRole role) {
    switch (role) {
      case UserRole.traveler:
        context.goNamed('traveler-profile');
        break;
      case UserRole.hotelManager:
      case UserRole.tourOperator:
        ref.read(navigationStateProvider.notifier).selectDrawerItem('profile', 'profile');
        break;
    }
  }
}
```

---

## 🎬 Animation Components System

### **Screen Flip Animation Component**
```dart
// lib/core/widgets/animations/screen_flip_animation.dart
class ScreenFlipAnimationOverlay extends StateAwareTripAvailWidget {
  const ScreenFlipAnimationOverlay({super.key});

  @override
  Widget buildWithState(
    BuildContext context,
    WidgetRef ref,
    ThemeData theme,
    NavigationState navigationState,
    UserRole currentRole,
  ) {
    if (!navigationState.isFlipping) {
      return const SizedBox.shrink();
    }
    
    return ScreenFlipAnimationContent();
  }
}

class ScreenFlipAnimationContent extends StatefulWidget {
  const ScreenFlipAnimationContent({super.key});

  @override
  State<ScreenFlipAnimationContent> createState() => _ScreenFlipAnimationContentState();
}

class _ScreenFlipAnimationContentState extends State<ScreenFlipAnimationContent>
    with TickerProviderStateMixin {
  late AnimationController _rotationController;
  late AnimationController _scaleController;
  late AnimationController _iconController;
  
  late Animation<double> _rotationAnimation;
  late Animation<double> _scaleAnimation;
  late Animation<double> _iconRotationAnimation;
  late Animation<double> _opacityAnimation;

  @override
  void initState() {
    super.initState();
    
    _rotationController = AnimationController(
      duration: const Duration(milliseconds: 800),
      vsync: this,
    );
    
    _scaleController = AnimationController(
      duration: const Duration(milliseconds: 600),
      vsync: this,
    );
    
    _iconController = AnimationController(
      duration: const Duration(milliseconds: 800),
      vsync: this,
    );
    
    _rotationAnimation = Tween<double>(
      begin: 0,
      end: 2 * math.pi,
    ).animate(CurvedAnimation(
      parent: _rotationController,
      curve: const Interval(0.0, 0.8, curve: Curves.easeInOutCubic),
    ));
    
    _scaleAnimation = Tween<double>(
      begin: 0.8,
      end: 1.0,
    ).animate(CurvedAnimation(
      parent: _scaleController,
      curve: const Interval(0.2, 0.6, curve: Curves.elasticOut),
    ));
    
    _iconRotationAnimation = Tween<double>(
      begin: 0,
      end: 2 * math.pi,
    ).animate(CurvedAnimation(
      parent: _iconController,
      curve: Curves.linear,
    ));
    
    _opacityAnimation = Tween<double>(
      begin: 0.0,
      end: 1.0,
    ).animate(CurvedAnimation(
      parent: _scaleController,
      curve: const Interval(0.0, 0.3, curve: Curves.easeOut),
    ));
    
    // Start animations
    _rotationController.forward();
    _scaleController.forward();
    _iconController.repeat();
  }

  @override
  Widget build(BuildContext context) {
    final gradients = Theme.of(context).extension<AppGradients>()!;
    
    return AnimatedBuilder(
      animation: Listenable.merge([_rotationController, _scaleController]),
      builder: (context, child) {
        return Container(
          decoration: BoxDecoration(gradient: gradients.partner),
          child: Center(
            child: Transform.scale(
              scale: _scaleAnimation.value,
              child: Transform(
                alignment: Alignment.center,
                transform: Matrix4.identity()
                  ..setEntry(3, 2, 0.001) // Perspective
                  ..rotateY(_rotationAnimation.value),
                child: Opacity(
                  opacity: _opacityAnimation.value,
                  child: Container(
                    width: 100,
                    height: 100,
                    decoration: BoxDecoration(
                      color: Colors.white.withOpacity(0.2),
                      borderRadius: BorderRadius.circular(50),
                      border: Border.all(
                        color: Colors.white.withOpacity(0.3),
                        width: 2,
                      ),
                    ),
                    child: AnimatedBuilder(
                      animation: _iconController,
                      builder: (context, child) {
                        return Transform.rotate(
                          angle: _iconRotationAnimation.value,
                          child: const Icon(
                            Icons.swap_horiz,
                            color: Colors.white,
                            size: 48,
                          ),
                        );
                      },
                    ),
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
    _rotationController.dispose();
    _scaleController.dispose();
    _iconController.dispose();
    super.dispose();
  }
}
```

### **Loading Components**
```dart
// lib/core/widgets/loading/loading_components.dart
class TripAvailLoadingSpinner extends TripAvailWidget {
  final double size;
  final Color? color;
  final double strokeWidth;
  
  const TripAvailLoadingSpinner({
    this.size = 24,
    this.color,
    this.strokeWidth = 2,
    super.key,
  });

  @override
  Widget buildWithTheme(BuildContext context, WidgetRef ref, ThemeData theme) {
    return SizedBox(
      width: size,
      height: size,
      child: CircularProgressIndicator(
        color: color ?? theme.primaryColor,
        strokeWidth: strokeWidth,
      ),
    );
  }
}

class SkeletonLoader extends StatefulWidget {
  final double width;
  final double height;
  final BorderRadius? borderRadius;
  
  const SkeletonLoader({
    required this.width,
    required this.height,
    this.borderRadius,
    super.key,
  });

  @override
  State<SkeletonLoader> createState() => _SkeletonLoaderState();
}

class _SkeletonLoaderState extends State<SkeletonLoader>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _animation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      duration: const Duration(milliseconds: 1500),
      vsync: this,
    );
    _animation = Tween<double>(begin: -1.0, end: 2.0).animate(
      CurvedAnimation(parent: _controller, curve: Curves.ease),
    );
    _controller.repeat();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    
    return Container(
      width: widget.width,
      height: widget.height,
      decoration: BoxDecoration(
        borderRadius: widget.borderRadius ?? BorderRadius.circular(8),
        color: isDark ? Colors.grey[800] : Colors.grey[300],
      ),
      child: AnimatedBuilder(
        animation: _animation,
        builder: (context, child) {
          return ClipRRect(
            borderRadius: widget.borderRadius ?? BorderRadius.circular(8),
            child: Stack(
              children: [
                Positioned.fill(
                  child: Container(
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        begin: Alignment.centerLeft,
                        end: Alignment.centerRight,
                        colors: [
                          Colors.transparent,
                          isDark ? Colors.grey[700]! : Colors.grey[100]!,
                          Colors.transparent,
                        ],
                        stops: [
                          _animation.value - 0.3,
                          _animation.value,
                          _animation.value + 0.3,
                        ],
                      ),
                    ),
                  ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }
}

class LoadingCardSkeleton extends TripAvailWidget {
  final double height;
  final EdgeInsetsGeometry? padding;
  
  const LoadingCardSkeleton({
    this.height = 200,
    this.padding,
    super.key,
  });

  @override
  Widget buildWithTheme(BuildContext context, WidgetRef ref, ThemeData theme) {
    return Container(
      height: height,
      padding: padding ?? const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SkeletonLoader(
            width: double.infinity,
            height: height * 0.6,
            borderRadius: BorderRadius.circular(12),
          ),
          const SizedBox(height: 12),
          SkeletonLoader(
            width: MediaQuery.of(context).size.width * 0.7,
            height: 16,
            borderRadius: BorderRadius.circular(4),
          ),
          const SizedBox(height: 8),
          SkeletonLoader(
            width: MediaQuery.of(context).size.width * 0.5,
            height: 14,
            borderRadius: BorderRadius.circular(4),
          ),
        ],
      ),
    );
  }
}
```

---

## 🔍 Search Components System

### **TripAvail Search Bar**
```dart
// lib/core/widgets/search/tripavail_search_bar.dart
class TripAvailSearchBar extends StateAwareTripAvailWidget {
  final Function(SearchFilters) onSearch;
  final Function(bool isOpen, SearchFilters? filters)? onSearchOverlayToggle;
  final SearchFilters? initialFilters;
  
  const TripAvailSearchBar({
    required this.onSearch,
    this.onSearchOverlayToggle,
    this.initialFilters,
    super.key,
  });

  @override
  Widget buildWithState(
    BuildContext context,
    WidgetRef ref,
    ThemeData theme,
    NavigationState navigationState,
    UserRole currentRole,
  ) {
    // Only show for travelers on relevant screens
    if (currentRole != UserRole.traveler || 
        !['home', 'dashboard'].contains(navigationState.currentScreen) ||
        navigationState.isDetailScreenActive ||
        navigationState.isFlipping) {
      return const SizedBox.shrink();
    }
    
    return GlassCard(
      padding: const EdgeInsets.all(16),
      margin: const EdgeInsets.symmetric(vertical: 8),
      child: Column(
        children: [
          _buildMainSearchRow(context, ref, theme),
          const SizedBox(height: 16),
          _buildQuickFilters(context, ref, theme),
        ],
      ),
    );
  }
  
  Widget _buildMainSearchRow(BuildContext context, WidgetRef ref, ThemeData theme) {
    return Row(
      children: [
        Expanded(
          child: GestureDetector(
            onTap: () => _openSearchOverlay(ref),
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              decoration: BoxDecoration(
                color: theme.colorScheme.surfaceVariant,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(
                  color: theme.colorScheme.outline.withOpacity(0.2),
                ),
              ),
              child: Row(
                children: [
                  Icon(
                    Icons.search,
                    color: theme.colorScheme.onSurfaceVariant,
                    size: 20,
                  ),
                  const SizedBox(width: 12),
                  Text(
                    'Where do you want to go?',
                    style: theme.textTheme.bodyMedium?.copyWith(
                      color: theme.colorScheme.onSurfaceVariant,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
        const SizedBox(width: 12),
        FilterButton(
          onPressed: () => _openSearchOverlay(ref),
          hasActiveFilters: _hasActiveFilters(ref),
        ),
      ],
    );
  }
  
  Widget _buildQuickFilters(BuildContext context, WidgetRef ref, ThemeData theme) {
    final quickFilters = [
      ('Hotels', Icons.hotel, 'hotels'),
      ('Tours', Icons.tour, 'tours'),
      ('Packages', Icons.card_travel, 'packages'),
      ('Experiences', Icons.explore, 'experiences'),
    ];
    
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      child: Row(
        children: quickFilters.map((filter) {
          return Padding(
            padding: const EdgeInsets.only(right: 8),
            child: QuickFilterChip(
              label: filter.$1,
              icon: filter.$2,
              isSelected: false, // TODO: Connect to search state
              onTap: () => _applyQuickFilter(ref, filter.$3),
            ),
          );
        }).toList(),
      ),
    );
  }
  
  void _openSearchOverlay(WidgetRef ref) {
    ref.read(navigationStateProvider.notifier).setSearchOverlayOpen(true);
    onSearchOverlayToggle?.call(true, null);
  }
  
  void _applyQuickFilter(WidgetRef ref, String filterType) {
    final filters = SearchFilters(category: filterType);
    onSearch(filters);
  }
  
  bool _hasActiveFilters(WidgetRef ref) {
    // TODO: Check if there are active search filters
    return false;
  }
}

class FilterButton extends TripAvailWidget {
  final VoidCallback onPressed;
  final bool hasActiveFilters;
  
  const FilterButton({
    required this.onPressed,
    this.hasActiveFilters = false,
    super.key,
  });

  @override
  Widget buildWithTheme(BuildContext context, WidgetRef ref, ThemeData theme) {
    return Stack(
      children: [
        Container(
          width: 44,
          height: 44,
          decoration: BoxDecoration(
            color: hasActiveFilters 
                ? theme.primaryColor 
                : theme.colorScheme.surfaceVariant,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(
              color: theme.colorScheme.outline.withOpacity(0.2),
            ),
          ),
          child: IconButton(
            onPressed: onPressed,
            icon: Icon(
              Icons.tune,
              color: hasActiveFilters 
                  ? Colors.white 
                  : theme.colorScheme.onSurfaceVariant,
              size: 20,
            ),
          ),
        ),
        if (hasActiveFilters)
          Positioned(
            top: 6,
            right: 6,
            child: Container(
              width: 8,
              height: 8,
              decoration: BoxDecoration(
                color: Colors.red,
                borderRadius: BorderRadius.circular(4),
              ),
            ),
          ),
      ],
    );
  }
}

class QuickFilterChip extends TripAvailWidget {
  final String label;
  final IconData icon;
  final bool isSelected;
  final VoidCallback onTap;
  
  const QuickFilterChip({
    required this.label,
    required this.icon,
    required this.isSelected,
    required this.onTap,
    super.key,
  });

  @override
  Widget buildWithTheme(BuildContext context, WidgetRef ref, ThemeData theme) {
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        decoration: BoxDecoration(
          color: isSelected 
              ? theme.primaryColor 
              : theme.colorScheme.surfaceVariant,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: isSelected 
                ? theme.primaryColor 
                : theme.colorScheme.outline.withOpacity(0.2),
          ),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              icon,
              color: isSelected 
                  ? Colors.white 
                  : theme.colorScheme.onSurfaceVariant,
              size: 16,
            ),
            const SizedBox(width: 4),
            Text(
              label,
              style: theme.textTheme.labelSmall?.copyWith(
                color: isSelected 
                    ? Colors.white 
                    : theme.colorScheme.onSurfaceVariant,
                fontWeight: FontWeight.w500,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
```

### **Search Overlay Component**
```dart
// lib/core/widgets/search/search_overlay.dart
class SearchOverlay extends StateAwareTripAvailWidget {
  const SearchOverlay({super.key});

  @override
  Widget buildWithState(
    BuildContext context,
    WidgetRef ref,
    ThemeData theme,
    NavigationState navigationState,
    UserRole currentRole,
  ) {
    if (!navigationState.isSearchOverlayOpen) {
      return const SizedBox.shrink();
    }
    
    return SearchOverlayContent();
  }
}

class SearchOverlayContent extends ConsumerStatefulWidget {
  const SearchOverlayContent({super.key});

  @override
  ConsumerState<SearchOverlayContent> createState() => _SearchOverlayContentState();
}

class _SearchOverlayContentState extends ConsumerState<SearchOverlayContent>
    with SingleTickerProviderStateMixin {
  late AnimationController _animationController;
  late Animation<double> _scaleAnimation;
  late Animation<double> _opacityAnimation;
  late Animation<Offset> _slideAnimation;
  
  final TextEditingController _searchController = TextEditingController();

  @override
  void initState() {
    super.initState();
    
    _animationController = AnimationController(
      duration: const Duration(milliseconds: 300),
      vsync: this,
    );
    
    _scaleAnimation = Tween<double>(
      begin: 0.9,
      end: 1.0,
    ).animate(CurvedAnimation(
      parent: _animationController,
      curve: Curves.easeOutCubic,
    ));
    
    _opacityAnimation = Tween<double>(
      begin: 0.0,
      end: 1.0,
    ).animate(CurvedAnimation(
      parent: _animationController,
      curve: Curves.easeOut,
    ));
    
    _slideAnimation = Tween<Offset>(
      begin: const Offset(0.0, 0.1),
      end: Offset.zero,
    ).animate(CurvedAnimation(
      parent: _animationController,
      curve: Curves.easeOutCubic,
    ));
    
    _animationController.forward();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final searchState = ref.watch(searchStateProvider);
    
    return AnimatedBuilder(
      animation: _animationController,
      builder: (context, child) {
        return Container(
          color: Colors.black.withOpacity(0.5 * _opacityAnimation.value),
          child: SafeArea(
            child: SlideTransition(
              position: _slideAnimation,
              child: Transform.scale(
                scale: _scaleAnimation.value,
                child: Container(
                  margin: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: theme.scaffoldBackgroundColor,
                    borderRadius: BorderRadius.circular(16),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withOpacity(0.2),
                        blurRadius: 20,
                        offset: const Offset(0, 10),
                      ),
                    ],
                  ),
                  child: Column(
                    children: [
                      _buildSearchHeader(context, theme),
                      Expanded(
                        child: searchState.isLoading
                            ? const SearchLoadingState()
                            : searchState.results.isNotEmpty
                                ? SearchResultsList(results: searchState.results)
                                : const SearchEmptyState(),
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
  
  Widget _buildSearchHeader(BuildContext context, ThemeData theme) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        border: Border(
          bottom: BorderSide(
            color: theme.dividerColor,
            width: 1,
          ),
        ),
      ),
      child: Row(
        children: [
          Expanded(
            child: TextField(
              controller: _searchController,
              autofocus: true,
              decoration: InputDecoration(
                hintText: 'Search destinations, hotels, tours...',
                prefixIcon: const Icon(Icons.search),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: BorderSide.none,
                ),
                fillColor: theme.colorScheme.surfaceVariant,
                filled: true,
              ),
              onChanged: _handleSearch,
            ),
          ),
          const SizedBox(width: 16),
          IconButton(
            onPressed: _closeSearch,
            icon: const Icon(Icons.close),
          ),
        ],
      ),
    );
  }
  
  void _handleSearch(String query) {
    final searchNotifier = ref.read(searchStateProvider.notifier);
    searchNotifier.updateQuery(query);
    
    if (query.isNotEmpty) {
      searchNotifier.performSearch();
    }
  }
  
  Future<void> _closeSearch() async {
    await _animationController.reverse();
    if (mounted) {
      ref.read(navigationStateProvider.notifier).setSearchOverlayOpen(false);
    }
  }

  @override
  void dispose() {
    _animationController.dispose();
    _searchController.dispose();
    super.dispose();
  }
}

// Search result states
class SearchLoadingState extends TripAvailWidget {
  const SearchLoadingState({super.key});

  @override
  Widget buildWithTheme(BuildContext context, WidgetRef ref, ThemeData theme) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const TripAvailLoadingSpinner(size: 40),
          const SizedBox(height: 16),
          Text(
            'Searching...',
            style: theme.textTheme.bodyLarge?.copyWith(
              color: theme.colorScheme.onSurfaceVariant,
            ),
          ),
        ],
      ),
    );
  }
}

class SearchEmptyState extends TripAvailWidget {
  const SearchEmptyState({super.key});

  @override
  Widget buildWithTheme(BuildContext context, WidgetRef ref, ThemeData theme) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            Icons.search_off,
            size: 64,
            color: theme.colorScheme.onSurfaceVariant.withOpacity(0.5),
          ),
          const SizedBox(height: 16),
          Text(
            'Start typing to search',
            style: theme.textTheme.headlineSmall?.copyWith(
              color: theme.colorScheme.onSurfaceVariant,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'Find hotels, tours, and packages',
            style: theme.textTheme.bodyMedium?.copyWith(
              color: theme.colorScheme.onSurfaceVariant.withOpacity(0.7),
            ),
          ),
        ],
      ),
    );
  }
}

class SearchResultsList extends TripAvailWidget {
  final List<SearchResult> results;
  
  const SearchResultsList({required this.results, super.key});

  @override
  Widget buildWithTheme(BuildContext context, WidgetRef ref, ThemeData theme) {
    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: results.length,
      itemBuilder: (context, index) {
        final result = results[index];
        return SearchResultCard(result: result);
      },
    );
  }
}

class SearchResultCard extends TripAvailWidget {
  final SearchResult result;
  
  const SearchResultCard({required this.result, super.key});

  @override
  Widget buildWithTheme(BuildContext context, WidgetRef ref, ThemeData theme) {
    return GlassCard(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      onTap: () => _handleResultTap(context, ref),
      child: Row(
        children: [
          Container(
            width: 60,
            height: 60,
            decoration: BoxDecoration(
              color: theme.primaryColor.withOpacity(0.1),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Icon(
              _getResultIcon(),
              color: theme.primaryColor,
              size: 24,
            ),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  result.title,
                  style: theme.textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.w600,
                  ),
                ),
                if (result.subtitle != null) ...[
                  const SizedBox(height: 4),
                  Text(
                    result.subtitle!,
                    style: theme.textTheme.bodySmall?.copyWith(
                      color: theme.colorScheme.onSurfaceVariant,
                    ),
                  ),
                ],
              ],
            ),
          ),
          Icon(
            Icons.arrow_forward_ios,
            size: 16,
            color: theme.colorScheme.onSurfaceVariant,
          ),
        ],
      ),
    );
  }
  
  IconData _getResultIcon() {
    switch (result.type) {
      case 'hotel':
        return Icons.hotel;
      case 'tour':
        return Icons.tour;
      case 'package':
        return Icons.card_travel;
      case 'destination':
        return Icons.place;
      default:
        return Icons.search;
    }
  }
  
  void _handleResultTap(BuildContext context, WidgetRef ref) {
    // Handle navigation to result detail
    ref.read(navigationStateProvider.notifier).setSearchOverlayOpen(false);
    
    switch (result.type) {
      case 'hotel':
        context.goNamed('hotel-detail', pathParameters: {'hotelId': result.id});
        break;
      case 'tour':
        context.goNamed('tour-detail', pathParameters: {'tourId': result.id});
        break;
      case 'package':
        context.goNamed('package-detail', pathParameters: {'packageId': result.id});
        break;
      default:
        break;
    }
  }
}
```

---

## 🏗️ Layout Components

### **Responsive Layout Helpers**
```dart
// lib/core/widgets/layout/responsive_layout.dart
class ResponsiveLayout extends TripAvailWidget {
  final Widget mobile;
  final Widget? tablet;
  final Widget? desktop;
  
  const ResponsiveLayout({
    required this.mobile,
    this.tablet,
    this.desktop,
    super.key,
  });

  @override
  Widget buildWithTheme(BuildContext context, WidgetRef ref, ThemeData theme) {
    return LayoutBuilder(
      builder: (context, constraints) {
        if (constraints.maxWidth >= 1200) {
          return desktop ?? tablet ?? mobile;
        } else if (constraints.maxWidth >= 768) {
          return tablet ?? mobile;
        } else {
          return mobile;
        }
      },
    );
  }
}

class ResponsiveBuilder extends TripAvailWidget {
  final Widget Function(BuildContext context, BoxConstraints constraints, DeviceType deviceType) builder;
  
  const ResponsiveBuilder({required this.builder, super.key});

  @override
  Widget buildWithTheme(BuildContext context, WidgetRef ref, ThemeData theme) {
    return LayoutBuilder(
      builder: (context, constraints) {
        DeviceType deviceType;
        
        if (constraints.maxWidth >= 1200) {
          deviceType = DeviceType.desktop;
        } else if (constraints.maxWidth >= 768) {
          deviceType = DeviceType.tablet;
        } else {
          deviceType = DeviceType.mobile;
        }
        
        return builder(context, constraints, deviceType);
      },
    );
  }
}

enum DeviceType {
  mobile,
  tablet,
  desktop,
}

class SafeAreaWrapper extends TripAvailWidget {
  final Widget child;
  final bool top;
  final bool bottom;
  final bool left;
  final bool right;
  
  const SafeAreaWrapper({
    required this.child,
    this.top = true,
    this.bottom = true,
    this.left = true,
    this.right = true,
    super.key,
  });

  @override
  Widget buildWithTheme(BuildContext context, WidgetRef ref, ThemeData theme) {
    return SafeArea(
      top: top,
      bottom: bottom,
      left: left,
      right: right,
      child: child,
    );
  }
}
```

### **Animated List Components**
```dart
// lib/core/widgets/lists/animated_list.dart
class AnimatedListView extends TripAvailWidget {
  final List<Widget> children;
  final Duration animationDuration;
  final Duration staggerDelay;
  final ScrollPhysics? physics;
  final EdgeInsetsGeometry? padding;
  
  const AnimatedListView({
    required this.children,
    this.animationDuration = const Duration(milliseconds: 300),
    this.staggerDelay = const Duration(milliseconds: 50),
    this.physics,
    this.padding,
    super.key,
  });

  @override
  Widget buildWithTheme(BuildContext context, WidgetRef ref, ThemeData theme) {
    return ListView.builder(
      physics: physics,
      padding: padding,
      itemCount: children.length,
      itemBuilder: (context, index) {
        return AnimatedListItem(
          index: index,
          animationDuration: animationDuration,
          staggerDelay: staggerDelay,
          child: children[index],
        );
      },
    );
  }
}

class AnimatedListItem extends StatefulWidget {
  final int index;
  final Duration animationDuration;
  final Duration staggerDelay;
  final Widget child;
  
  const AnimatedListItem({
    required this.index,
    required this.animationDuration,
    required this.staggerDelay,
    required this.child,
    super.key,
  });

  @override
  State<AnimatedListItem> createState() => _AnimatedListItemState();
}

class _AnimatedListItemState extends State<AnimatedListItem>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _fadeAnimation;
  late Animation<Offset> _slideAnimation;

  @override
  void initState() {
    super.initState();
    
    _controller = AnimationController(
      duration: widget.animationDuration,
      vsync: this,
    );
    
    _fadeAnimation = Tween<double>(
      begin: 0.0,
      end: 1.0,
    ).animate(CurvedAnimation(
      parent: _controller,
      curve: Curves.easeOut,
    ));
    
    _slideAnimation = Tween<Offset>(
      begin: const Offset(0.0, 0.5),
      end: Offset.zero,
    ).animate(CurvedAnimation(
      parent: _controller,
      curve: Curves.easeOutCubic,
    ));
    
    // Start animation with stagger delay
    Future.delayed(widget.staggerDelay * widget.index, () {
      if (mounted) {
        _controller.forward();
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _controller,
      builder: (context, child) {
        return FadeTransition(
          opacity: _fadeAnimation,
          child: SlideTransition(
            position: _slideAnimation,
            child: widget.child,
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
```

---

## 🎯 Feature-Specific Components

### **Profile Components**
```dart
// lib/core/widgets/profile/profile_components.dart
class ProfileAvatar extends TripAvailWidget {
  final double size;
  final User? user;
  final VoidCallback? onTap;
  final bool showBorder;
  
  const ProfileAvatar({
    required this.size,
    this.user,
    this.onTap,
    this.showBorder = false,
    super.key,
  });

  @override
  Widget buildWithTheme(BuildContext context, WidgetRef ref, ThemeData theme) {
    final currentUser = user ?? ref.watch(currentUserProvider);
    
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: size,
        height: size,
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(size / 2),
          border: showBorder ? Border.all(
            color: theme.primaryColor,
            width: 2,
          ) : null,
        ),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(size / 2),
          child: currentUser?.profileImageUrl != null
              ? Image.network(
                  currentUser!.profileImageUrl!,
                  width: size,
                  height: size,
                  fit: BoxFit.cover,
                  errorBuilder: (context, error, stackTrace) {
                    return _buildInitialsAvatar(currentUser, theme);
                  },
                )
              : _buildInitialsAvatar(currentUser, theme),
        ),
      ),
    );
  }
  
  Widget _buildInitialsAvatar(User? user, ThemeData theme) {
    final initials = user?.initials ?? 'U';
    
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        color: theme.primaryColor,
        borderRadius: BorderRadius.circular(size / 2),
      ),
      child: Center(
        child: Text(
          initials,
          style: TextStyle(
            color: Colors.white,
            fontSize: size * 0.4,
            fontWeight: FontWeight.w600,
          ),
        ),
      ),
    );
  }
}

class VerificationBadge extends TripAvailWidget {
  final bool isVerified;
  final double size;
  
  const VerificationBadge({
    required this.isVerified,
    this.size = 20,
    super.key,
  });

  @override
  Widget buildWithTheme(BuildContext context, WidgetRef ref, ThemeData theme) {
    if (!isVerified) return const SizedBox.shrink();
    
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        color: Colors.blue,
        borderRadius: BorderRadius.circular(size / 2),
      ),
      child: Icon(
        Icons.verified,
        color: Colors.white,
        size: size * 0.7,
      ),
    );
  }
}

class ProfileCompletionIndicator extends TripAvailWidget {
  final double completion;
  final double size;
  
  const ProfileCompletionIndicator({
    required this.completion,
    this.size = 60,
    super.key,
  });

  @override
  Widget buildWithTheme(BuildContext context, WidgetRef ref, ThemeData theme) {
    return SizedBox(
      width: size,
      height: size,
      child: Stack(
        children: [
          CircularProgressIndicator(
            value: completion,
            backgroundColor: theme.colorScheme.surfaceVariant,
            valueColor: AlwaysStoppedAnimation<Color>(theme.primaryColor),
            strokeWidth: 4,
          ),
          Center(
            child: Text(
              '${(completion * 100).round()}%',
              style: theme.textTheme.labelSmall?.copyWith(
                fontWeight: FontWeight.w600,
                color: theme.primaryColor,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
```

### **Booking Components**
```dart
// lib/core/widgets/booking/booking_components.dart
class BookingCard extends TripAvailWidget {
  final Booking booking;
  final VoidCallback? onTap;
  
  const BookingCard({
    required this.booking,
    this.onTap,
    super.key,
  });

  @override
  Widget buildWithTheme(BuildContext context, WidgetRef ref, ThemeData theme) {
    return GlassCard(
      padding: const EdgeInsets.all(16),
      margin: const EdgeInsets.only(bottom: 12),
      onTap: onTap,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Text(
                  booking.confirmationCode ?? 'No confirmation code',
                  style: theme.textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
              BookingStatusChip(status: booking.status),
            ],
          ),
          const SizedBox(height: 12),
          if (booking.checkInDate != null) ...[
            _buildDateRow(
              context,
              theme,
              'Check-in',
              booking.checkInDate!,
              Icons.login,
            ),
            const SizedBox(height: 8),
          ],
          if (booking.checkOutDate != null) ...[
            _buildDateRow(
              context,
              theme,
              'Check-out',
              booking.checkOutDate!,
              Icons.logout,
            ),
            const SizedBox(height: 8),
          ],
          Row(
            children: [
              Icon(
                Icons.people,
                size: 16,
                color: theme.colorScheme.onSurfaceVariant,
              ),
              const SizedBox(width: 8),
              Text(
                '${booking.totalGuests} guests',
                style: theme.textTheme.bodySmall?.copyWith(
                  color: theme.colorScheme.onSurfaceVariant,
                ),
              ),
              const Spacer(),
              Text(
                '\$${booking.payment.totalAmount.toStringAsFixed(0)}',
                style: theme.textTheme.titleMedium?.copyWith(
                  fontWeight: FontWeight.w600,
                  color: theme.primaryColor,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
  
  Widget _buildDateRow(
    BuildContext context,
    ThemeData theme,
    String label,
    DateTime date,
    IconData icon,
  ) {
    return Row(
      children: [
        Icon(
          icon,
          size: 16,
          color: theme.colorScheme.onSurfaceVariant,
        ),
        const SizedBox(width: 8),
        Text(
          label,
          style: theme.textTheme.bodySmall?.copyWith(
            color: theme.colorScheme.onSurfaceVariant,
          ),
        ),
        const SizedBox(width: 8),
        Text(
          DateFormat('MMM dd, yyyy').format(date),
          style: theme.textTheme.bodySmall?.copyWith(
            fontWeight: FontWeight.w500,
          ),
        ),
      ],
    );
  }
}

class BookingStatusChip extends TripAvailWidget {
  final BookingStatus status;
  
  const BookingStatusChip({required this.status, super.key});

  @override
  Widget buildWithTheme(BuildContext context, WidgetRef ref, ThemeData theme) {
    Color backgroundColor;
    Color textColor;
    
    switch (status) {
      case BookingStatus.confirmed:
        backgroundColor = Colors.green;
        textColor = Colors.white;
        break;
      case BookingStatus.pending:
        backgroundColor = Colors.orange;
        textColor = Colors.white;
        break;
      case BookingStatus.cancelled:
        backgroundColor = Colors.red;
        textColor = Colors.white;
        break;
      case BookingStatus.completed:
        backgroundColor = Colors.blue;
        textColor = Colors.white;
        break;
      default:
        backgroundColor = theme.colorScheme.surfaceVariant;
        textColor = theme.colorScheme.onSurfaceVariant;
    }
    
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: backgroundColor,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Text(
        status.displayName,
        style: theme.textTheme.labelSmall?.copyWith(
          color: textColor,
          fontWeight: FontWeight.w500,
        ),
      ),
    );
  }
}
```

---

## 🔧 Utility Components

### **Error Boundary Widget**
```dart
// lib/core/widgets/error/error_boundary.dart
class ErrorBoundaryWidget extends StatefulWidget {
  final Widget child;
  final Widget Function(Object error, StackTrace stackTrace)? errorBuilder;
  final void Function(Object error, StackTrace stackTrace)? onError;
  
  const ErrorBoundaryWidget({
    required this.child,
    this.errorBuilder,
    this.onError,
    super.key,
  });

  @override
  State<ErrorBoundaryWidget> createState() => _ErrorBoundaryWidgetState();
}

class _ErrorBoundaryWidgetState extends State<ErrorBoundaryWidget> {
  Object? _error;
  StackTrace? _stackTrace;

  @override
  Widget build(BuildContext context) {
    if (_error != null) {
      return widget.errorBuilder?.call(_error!, _stackTrace!) ??
          DefaultErrorWidget(error: _error!, stackTrace: _stackTrace!);
    }
    
    return ErrorCatcher(
      onError: _handleError,
      child: widget.child,
    );
  }
  
  void _handleError(Object error, StackTrace stackTrace) {
    setState(() {
      _error = error;
      _stackTrace = stackTrace;
    });
    
    widget.onError?.call(error, stackTrace);
  }
}

class ErrorCatcher extends StatelessWidget {
  final Widget child;
  final void Function(Object error, StackTrace stackTrace) onError;
  
  const ErrorCatcher({
    required this.child,
    required this.onError,
    super.key,
  });

  @override
  Widget build(BuildContext context) {
    return child;
  }
}

class DefaultErrorWidget extends TripAvailWidget {
  final Object error;
  final StackTrace stackTrace;
  
  const DefaultErrorWidget({
    required this.error,
    required this.stackTrace,
    super.key,
  });

  @override
  Widget buildWithTheme(BuildContext context, WidgetRef ref, ThemeData theme) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Error'),
        backgroundColor: Colors.red,
        foregroundColor: Colors.white,
      ),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Icon(
              Icons.error_outline,
              size: 64,
              color: Colors.red,
            ),
            const SizedBox(height: 16),
            Text(
              'Something went wrong',
              style: theme.textTheme.headlineMedium?.copyWith(
                color: Colors.red,
                fontWeight: FontWeight.w600,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'An unexpected error occurred. Please try again.',
              style: theme.textTheme.bodyLarge,
            ),
            const SizedBox(height: 24),
            GradientButton(
              text: 'Reload App',
              onPressed: () {
                // Restart the app or navigate to home
                ref.read(navigationStateProvider.notifier).reset();
                context.goNamed('traveler-home');
              },
            ),
            const SizedBox(height: 16),
            if (kDebugMode) ...[
              Text(
                'Error Details:',
                style: theme.textTheme.titleMedium?.copyWith(
                  fontWeight: FontWeight.w600,
                ),
              ),
              const SizedBox(height: 8),
              Expanded(
                child: SingleChildScrollView(
                  child: Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: theme.colorScheme.surfaceVariant,
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Text(
                      '$error\n\n$stackTrace',
                      style: theme.textTheme.bodySmall?.copyWith(
                        fontFamily: 'monospace',
                      ),
                    ),
                  ),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
```

### **Performance Monitoring Components**
```dart
// lib/core/widgets/performance/performance_monitor.dart
class PerformanceMonitor extends StatefulWidget {
  final Widget child;
  final String? identifier;
  
  const PerformanceMonitor({
    required this.child,
    this.identifier,
    super.key,
  });

  @override
  State<PerformanceMonitor> createState() => _PerformanceMonitorState();
}

class _PerformanceMonitorState extends State<PerformanceMonitor> {
  late Stopwatch _stopwatch;

  @override
  void initState() {
    super.initState();
    _stopwatch = Stopwatch()..start();
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _stopwatch.stop();
      final duration = _stopwatch.elapsedMilliseconds;
      
      if (kDebugMode) {
        debugPrint('Performance: ${widget.identifier ?? 'Widget'} rendered in ${duration}ms');
      }
      
      if (duration > 16) { // More than 1 frame at 60fps
        debugPrint('⚠️ Slow render detected: ${widget.identifier ?? 'Widget'} took ${duration}ms');
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return widget.child;
  }
}

class MemoryMonitor extends StatefulWidget {
  final Widget child;
  
  const MemoryMonitor({required this.child, super.key});

  @override
  State<MemoryMonitor> createState() => _MemoryMonitorState();
}

class _MemoryMonitorState extends State<MemoryMonitor> {
  @override
  void initState() {
    super.initState();
    
    if (kDebugMode) {
      // Monitor memory usage periodically
      Timer.periodic(const Duration(seconds: 30), (_) {
        _logMemoryUsage();
      });
    }
  }

  void _logMemoryUsage() {
    // This would require platform-specific implementation
    // For now, just a placeholder
    debugPrint('Memory monitoring placeholder');
  }

  @override
  Widget build(BuildContext context) {
    return widget.child;
  }
}
```

---

## 🎯 Widget Factory & Builder Patterns

### **Widget Factory**
```dart
// lib/core/widgets/factories/widget_factory.dart
class WidgetFactory {
  static Widget createButton({
    required String text,
    required VoidCallback? onPressed,
    ButtonType type = ButtonType.primary,
    ButtonSize size = ButtonSize.medium,
    IconData? icon,
    bool isLoading = false,
  }) {
    switch (type) {
      case ButtonType.primary:
        return GradientButton(
          text: text,
          onPressed: onPressed,
          gradientType: GradientType.rosePrimary,
          icon: icon,
          isLoading: isLoading,
        );
      case ButtonType.secondary:
        return OutlinedButton.icon(
          onPressed: onPressed,
          icon: icon != null ? Icon(icon) : const SizedBox.shrink(),
          label: Text(text),
        );
      case ButtonType.partner:
        return GradientButton(
          text: text,
          onPressed: onPressed,
          gradientType: GradientType.partner,
          icon: icon,
          isLoading: isLoading,
        );
    }
  }
  
  static Widget createCard({
    required Widget child,
    CardType type = CardType.standard,
    EdgeInsetsGeometry? padding,
    VoidCallback? onTap,
  }) {
    switch (type) {
      case CardType.standard:
        return Card(
          child: Padding(
            padding: padding ?? const EdgeInsets.all(16),
            child: child,
          ),
        );
      case CardType.glass:
        return GlassCard(
          padding: padding,
          onTap: onTap,
          child: child,
        );
      case CardType.elevated:
        return Container(
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(12),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.1),
                blurRadius: 8,
                offset: const Offset(0, 4),
              ),
            ],
          ),
          child: Card(
            elevation: 0,
            child: Padding(
              padding: padding ?? const EdgeInsets.all(16),
              child: child,
            ),
          ),
        );
    }
  }
  
  static Widget createLoadingState({
    LoadingType type = LoadingType.spinner,
    String? message,
    double? size,
  }) {
    switch (type) {
      case LoadingType.spinner:
        return Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TripAvailLoadingSpinner(size: size ?? 40),
              if (message != null) ...[
                const SizedBox(height: 16),
                Text(message),
              ],
            ],
          ),
        );
      case LoadingType.skeleton:
        return LoadingCardSkeleton(height: size ?? 200);
      case LoadingType.progress:
        return Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              LinearProgressIndicator(),
              if (message != null) ...[
                const SizedBox(height: 16),
                Text(message),
              ],
            ],
          ),
        );
    }
  }
}

enum ButtonType { primary, secondary, partner }
enum ButtonSize { small, medium, large }
enum CardType { standard, glass, elevated }
enum LoadingType { spinner, skeleton, progress }
```

### **Conditional Widget Builder**
```dart
// lib/core/widgets/builders/conditional_builder.dart
class ConditionalBuilder extends TripAvailWidget {
  final bool condition;
  final Widget child;
  final Widget? fallback;
  
  const ConditionalBuilder({
    required this.condition,
    required this.child,
    this.fallback,
    super.key,
  });

  @override
  Widget buildWithTheme(BuildContext context, WidgetRef ref, ThemeData theme) {
    if (condition) {
      return child;
    }
    
    return fallback ?? const SizedBox.shrink();
  }
}

class RoleBasedBuilder extends StateAwareTripAvailWidget {
  final Map<UserRole, Widget> roleWidgets;
  final Widget? fallback;
  
  const RoleBasedBuilder({
    required this.roleWidgets,
    this.fallback,
    super.key,
  });

  @override
  Widget buildWithState(
    BuildContext context,
    WidgetRef ref,
    ThemeData theme,
    NavigationState navigationState,
    UserRole currentRole,
  ) {
    final widget = roleWidgets[currentRole];
    
    if (widget != null) {
      return widget;
    }
    
    return fallback ?? const SizedBox.shrink();
  }
}

class StateBuilder<T> extends TripAvailWidget {
  final StateProvider<T> provider;
  final Widget Function(BuildContext context, T state) builder;
  final Widget? loading;
  final Widget Function(Object error)? error;
  
  const StateBuilder({
    required this.provider,
    required this.builder,
    this.loading,
    this.error,
    super.key,
  });

  @override
  Widget buildWithTheme(BuildContext context, WidgetRef ref, ThemeData theme) {
    final asyncValue = ref.watch(provider);
    
    return asyncValue.when(
      data: (data) => builder(context, data),
      loading: () => loading ?? const TripAvailLoadingSpinner(),
      error: (err, stack) => error?.call(err) ?? DefaultErrorWidget(
        error: err,
        stackTrace: stack,
      ),
    );
  }
}
```

---

## 🔍 Migration Checklist

### **✅ Core Component Foundation**
- [ ] Implement base widget classes and patterns
- [ ] Create gradient button system with animations
- [ ] Build glass morphism card components
- [ ] Set up themed app bar with blur effects
- [ ] Create responsive layout helpers

### **✅ Animation System Integration**
- [ ] Implement screen flip animation component
- [ ] Create loading state components (spinner, skeleton, progress)
- [ ] Build animated list and stagger animations
- [ ] Set up performance monitoring for animations
- [ ] Create animation coordination utilities

### **✅ Search & Discovery Components**
- [ ] Build TripAvail search bar with overlay integration
- [ ] Create search overlay with blur and animations
- [ ] Implement search result components
- [ ] Add quick filter chips and interactions
- [ ] Set up search state coordination

### **✅ Feature-Specific Components**
- [ ] Create profile avatar and verification badges
- [ ] Build booking card components with status chips
- [ ] Implement role-based component builders
- [ ] Create form input components with theming
- [ ] Add navigation-aware widget builders

### **✅ Utility & Performance**
- [ ] Implement error boundary widget system
- [ ] Create performance monitoring components
- [ ] Build widget factory and builder patterns
- [ ] Set up conditional rendering utilities
- [ ] Add memory and performance optimization

### **✅ Integration & Testing**
- [ ] Connect components to theme system
- [ ] Integrate with state management providers
- [ ] Test responsive behavior across devices
- [ ] Verify animation performance
- [ ] Test error handling and recovery

---

## 🔍 Next Steps

1. **Implement animation system** (`08_animation_system.md`)
2. **Create API integration layer** (`09_api_integration.md`)
3. **Build role-specific features** (`10_role_features.md`)
4. **Implement offline capabilities** (`11_offline_system.md`)
5. **Add testing strategies** (`12_testing_strategy.md`)

---

*This comprehensive Flutter component architecture preserves all sophisticated features from the React implementation while leveraging Flutter's widget system for better performance, type safety, and native integration. The modular design ensures maintainability and reusability across the entire application.*