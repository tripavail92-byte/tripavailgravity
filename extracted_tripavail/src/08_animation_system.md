# Flutter Animation System Implementation

## Executive Summary

This document defines the comprehensive Flutter animation system for TripAvail, migrating from the sophisticated Motion/Framer Motion React implementation to Flutter's powerful animation APIs. The system preserves all advanced animation features including 3D screen flip transitions, glass morphism effects, micro-interactions, stagger animations, and complex state-coordinated animations while leveraging Flutter's native performance benefits.

### Key Animation Features to Migrate
- **3D Screen Flip Animation**: Complex perspective-based rotation with gradient overlays
- **Glass Morphism Effects**: Backdrop blur animations with smooth transitions
- **Micro-interactions**: Button press, hover, and focus animations
- **Stagger Animations**: List items and component cascade effects
- **Loading Animations**: Skeleton loaders, spinners, and progress indicators
- **Search Overlay**: Blur transition and overlay animations
- **Navigation Transitions**: Tab switching and screen change animations

---

## 🎬 Animation Architecture Overview

### **Animation System Hierarchy**
```
TripAvail Animation System
├── Core Animation Infrastructure
│   ├── AnimationController Management
│   ├── Tween System Integration
│   ├── Curve Library Extensions
│   └── Performance Monitoring
├── Screen-Level Animations
│   ├── 3D Screen Flip Animation
│   ├── Page Transitions
│   ├── Search Overlay Blur
│   └── Navigation Animations
├── Component-Level Animations
│   ├── Micro-interactions
│   ├── Button Press Effects
│   ├── Hover Animations
│   └── Focus Transitions
├── Loading & State Animations
│   ├── Skeleton Loaders
│   ├── Progress Indicators
│   ├── Spinner Animations
│   └── State Transition Effects
├── Advanced Effects
│   ├── Glass Morphism Animations
│   ├── Gradient Transitions
│   ├── Parallax Effects
│   └── Particle Systems
└── Performance Optimization
    ├── Animation Coordination
    ├── Memory Management
    ├── Frame Rate Monitoring
    └── Battery Optimization
```

### **Animation Coordination Principles**
```dart
// Core animation coordination strategy
abstract class AnimationCoordinator {
  // 1. Centralized animation management
  // 2. State-aware animation triggers
  // 3. Performance optimization
  // 4. Memory leak prevention
  // 5. Smooth interruption handling
}
```

---

## 🎯 Core Animation Infrastructure

### **Animation Controller Manager**
```dart
// lib/core/animations/animation_controller_manager.dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

class AnimationControllerManager {
  static final Map<String, AnimationController> _controllers = {};
  static final Map<String, Timer> _disposalTimers = {};
  
  static AnimationController getOrCreate(
    String key,
    TickerProvider vsync, {
    required Duration duration,
    Duration? reverseDuration,
    String? debugLabel,
  }) {
    if (_controllers.containsKey(key)) {
      _cancelDisposalTimer(key);
      return _controllers[key]!;
    }
    
    final controller = AnimationController(
      duration: duration,
      reverseDuration: reverseDuration,
      vsync: vsync,
      debugLabel: debugLabel ?? key,
    );
    
    _controllers[key] = controller;
    return controller;
  }
  
  static void releaseController(String key, {Duration delay = const Duration(seconds: 2)}) {
    if (!_controllers.containsKey(key)) return;
    
    _disposalTimers[key] = Timer(delay, () {
      _controllers[key]?.dispose();
      _controllers.remove(key);
      _disposalTimers.remove(key);
    });
  }
  
  static void _cancelDisposalTimer(String key) {
    _disposalTimers[key]?.cancel();
    _disposalTimers.remove(key);
  }
  
  static void disposeAll() {
    for (final timer in _disposalTimers.values) {
      timer.cancel();
    }
    for (final controller in _controllers.values) {
      controller.dispose();
    }
    _controllers.clear();
    _disposalTimers.clear();
  }
}

// Animation state provider
final animationStateProvider = StateNotifierProvider<AnimationStateNotifier, AnimationState>((ref) {
  return AnimationStateNotifier();
});

class AnimationStateNotifier extends StateNotifier<AnimationState> {
  AnimationStateNotifier() : super(const AnimationState());
  
  void setScreenFlipping(bool isFlipping) {
    state = state.copyWith(isScreenFlipping: isFlipping);
  }
  
  void setSearchOverlayAnimating(bool isAnimating) {
    state = state.copyWith(isSearchOverlayAnimating: isAnimating);
  }
  
  void setGlobalAnimationsEnabled(bool enabled) {
    state = state.copyWith(globalAnimationsEnabled: enabled);
  }
  
  void addActiveAnimation(String animationId) {
    final updatedActive = {...state.activeAnimations, animationId};
    state = state.copyWith(activeAnimations: updatedActive);
  }
  
  void removeActiveAnimation(String animationId) {
    final updatedActive = {...state.activeAnimations}..remove(animationId);
    state = state.copyWith(activeAnimations: updatedActive);
  }
}

@freezed
class AnimationState with _$AnimationState {
  const factory AnimationState({
    @Default(false) bool isScreenFlipping,
    @Default(false) bool isSearchOverlayAnimating,
    @Default(true) bool globalAnimationsEnabled,
    @Default({}) Set<String> activeAnimations,
    @Default(60.0) double targetFrameRate,
    @Default(false) bool batteryOptimizationEnabled,
  }) = _AnimationState;
}
```

### **Custom Animation Curves**
```dart
// lib/core/animations/custom_curves.dart
import 'package:flutter/animation.dart';

class TripAvailCurves {
  // Easing curves matching Motion/Framer Motion behavior
  static const Curve easeInOutCubic = Cubic(0.4, 0.0, 0.2, 1.0);
  static const Curve easeOutCubic = Cubic(0.0, 0.0, 0.2, 1.0);
  static const Curve easeInCubic = Cubic(0.4, 0.0, 1.0, 1.0);
  
  // Spring animations
  static const Curve spring = _SpringCurve();
  static const Curve dampedSpring = _DampedSpringCurve();
  
  // Glass morphism effect curve
  static const Curve glassBlur = Cubic(0.25, 0.46, 0.45, 0.94);
  
  // Screen flip animation curve
  static const Curve flip3D = Cubic(0.175, 0.885, 0.32, 1.275);
  
  // Micro-interaction curves
  static const Curve buttonPress = Cubic(0.4, 0.0, 0.6, 1.0);
  static const Curve hoverLift = Cubic(0.25, 0.46, 0.45, 0.94);
  
  // Stagger animation curve
  static const Curve stagger = Cubic(0.0, 0.0, 0.2, 1.0);
}

class _SpringCurve extends Curve {
  const _SpringCurve();
  
  @override
  double transform(double t) {
    return 1.0 - math.pow(2.0, -10.0 * t) * math.cos((t - 0.1) * 5.0 * math.pi);
  }
}

class _DampedSpringCurve extends Curve {
  const _DampedSpringCurve();
  
  @override
  double transform(double t) {
    const double damping = 0.8;
    return 1.0 - math.pow(2.0, -10.0 * t) * math.cos(t * math.pi * 2.0) * damping;
  }
}
```

### **Animation Coordination Widget**
```dart
// lib/core/animations/animation_coordinator.dart
class AnimationCoordinator extends ConsumerStatefulWidget {
  final Widget child;
  final String? coordinatorId;
  
  const AnimationCoordinator({
    required this.child,
    this.coordinatorId,
    super.key,
  });

  @override
  ConsumerState<AnimationCoordinator> createState() => _AnimationCoordinatorState();
}

class _AnimationCoordinatorState extends ConsumerState<AnimationCoordinator>
    with TickerProviderStateMixin {
  final Map<String, AnimationController> _controllers = {};
  late final AnimationPerformanceMonitor _performanceMonitor;

  @override
  void initState() {
    super.initState();
    _performanceMonitor = AnimationPerformanceMonitor();
  }

  @override
  Widget build(BuildContext context) {
    return AnimationCoordinatorProvider(
      coordinator: this,
      child: widget.child,
    );
  }
  
  AnimationController createController({
    required String id,
    required Duration duration,
    Duration? reverseDuration,
  }) {
    if (_controllers.containsKey(id)) {
      return _controllers[id]!;
    }
    
    final controller = AnimationController(
      duration: duration,
      reverseDuration: reverseDuration,
      vsync: this,
      debugLabel: '${widget.coordinatorId ?? 'coordinator'}_$id',
    );
    
    _controllers[id] = controller;
    
    // Monitor performance
    controller.addListener(() {
      _performanceMonitor.recordFrame(id);
    });
    
    return controller;
  }
  
  void disposeController(String id) {
    _controllers[id]?.dispose();
    _controllers.remove(id);
  }
  
  // Coordinate multiple animations
  Future<void> runSequence(List<AnimationSequenceItem> sequence) async {
    for (final item in sequence) {
      if (item.delay != null) {
        await Future.delayed(item.delay!);
      }
      
      switch (item.action) {
        case AnimationAction.forward:
          await item.controller.forward();
          break;
        case AnimationAction.reverse:
          await item.controller.reverse();
          break;
        case AnimationAction.reset:
          item.controller.reset();
          break;
      }
    }
  }
  
  // Stagger animation helper
  void staggerAnimation(
    List<AnimationController> controllers,
    Duration staggerDelay,
  ) {
    for (int i = 0; i < controllers.length; i++) {
      Timer(staggerDelay * i, () {
        if (mounted) {
          controllers[i].forward();
        }
      });
    }
  }

  @override
  void dispose() {
    for (final controller in _controllers.values) {
      controller.dispose();
    }
    _performanceMonitor.dispose();
    super.dispose();
  }
}

// Provider for accessing animation coordinator
class AnimationCoordinatorProvider extends InheritedWidget {
  final _AnimationCoordinatorState coordinator;
  
  const AnimationCoordinatorProvider({
    required this.coordinator,
    required super.child,
    super.key,
  });

  static _AnimationCoordinatorState? of(BuildContext context) {
    return context.dependOnInheritedWidgetOfExactType<AnimationCoordinatorProvider>()?.coordinator;
  }

  @override
  bool updateShouldNotify(AnimationCoordinatorProvider oldWidget) {
    return coordinator != oldWidget.coordinator;
  }
}

enum AnimationAction { forward, reverse, reset }

class AnimationSequenceItem {
  final AnimationController controller;
  final AnimationAction action;
  final Duration? delay;
  
  const AnimationSequenceItem({
    required this.controller,
    required this.action,
    this.delay,
  });
}
```

---

## 🎪 3D Screen Flip Animation

### **Screen Flip Animation Implementation**
```dart
// lib/core/animations/screen_flip_animation.dart
class ScreenFlipAnimation extends ConsumerStatefulWidget {
  const ScreenFlipAnimation({super.key});

  @override
  ConsumerState<ScreenFlipAnimation> createState() => _ScreenFlipAnimationState();
}

class _ScreenFlipAnimationState extends ConsumerState<ScreenFlipAnimation>
    with TickerProviderStateMixin {
  late AnimationController _flipController;
  late AnimationController _scaleController;
  late AnimationController _iconController;
  late AnimationController _gradientController;
  
  late Animation<double> _flipAnimation;
  late Animation<double> _scaleAnimation;
  late Animation<double> _iconRotationAnimation;
  late Animation<double> _opacityAnimation;
  late Animation<List<Color>> _gradientAnimation;

  @override
  void initState() {
    super.initState();
    _initializeAnimations();
    _startAnimationSequence();
  }
  
  void _initializeAnimations() {
    // Main flip animation - 800ms total
    _flipController = AnimationController(
      duration: const Duration(milliseconds: 800),
      vsync: this,
    );
    
    // Scale animation for the icon container
    _scaleController = AnimationController(
      duration: const Duration(milliseconds: 600),
      vsync: this,
    );
    
    // Icon rotation animation
    _iconController = AnimationController(
      duration: const Duration(milliseconds: 800),
      vsync: this,
    );
    
    // Gradient transition animation
    _gradientController = AnimationController(
      duration: const Duration(milliseconds: 1000),
      vsync: this,
    );
    
    // 3D flip animation (Y-axis rotation)
    _flipAnimation = Tween<double>(
      begin: 0,
      end: 2 * math.pi,
    ).animate(CurvedAnimation(
      parent: _flipController,
      curve: const Interval(0.0, 0.8, curve: TripAvailCurves.flip3D),
    ));
    
    // Scale animation with elastic effect
    _scaleAnimation = Tween<double>(
      begin: 0.8,
      end: 1.0,
    ).animate(CurvedAnimation(
      parent: _scaleController,
      curve: const Interval(0.2, 0.6, curve: Curves.elasticOut),
    ));
    
    // Icon rotation (continuous)
    _iconRotationAnimation = Tween<double>(
      begin: 0,
      end: 2 * math.pi,
    ).animate(CurvedAnimation(
      parent: _iconController,
      curve: Curves.linear,
    ));
    
    // Opacity fade-in
    _opacityAnimation = Tween<double>(
      begin: 0.0,
      end: 1.0,
    ).animate(CurvedAnimation(
      parent: _scaleController,
      curve: const Interval(0.0, 0.3, curve: Curves.easeOut),
    ));
    
    // Gradient color transition
    _gradientAnimation = ColorTween(
      begin: const Color(0xFF8B5CF6), // violet
      end: const Color(0xFFEC4899),   // pink
    ).animate(_gradientController).drive(
      Tween<List<Color>>(
        begin: [const Color(0xFF8B5CF6), const Color(0xFFEC4899)],
        end: [const Color(0xFFEC4899), const Color(0xFF8B5CF6)],
      ),
    );
  }
  
  void _startAnimationSequence() {
    // Update animation state
    ref.read(animationStateProvider.notifier).setScreenFlipping(true);
    
    // Start all animations with proper timing
    _flipController.forward();
    
    // Delayed start for scale animation
    Future.delayed(const Duration(milliseconds: 100), () {
      if (mounted) {
        _scaleController.forward();
      }
    });
    
    // Repeating icon rotation
    _iconController.repeat();
    
    // Gradient animation
    _gradientController.repeat(reverse: true);
    
    // Complete animation after duration
    Future.delayed(const Duration(milliseconds: 800), () {
      if (mounted) {
        _completeAnimation();
      }
    });
  }
  
  void _completeAnimation() {
    ref.read(animationStateProvider.notifier).setScreenFlipping(false);
    
    // Trigger role switch completion
    ref.read(navigationStateProvider.notifier).stopFlipAnimation();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final gradients = theme.extension<AppGradients>()!;
    
    return AnimatedBuilder(
      animation: Listenable.merge([
        _flipController,
        _scaleController,
        _gradientController,
      ]),
      builder: (context, child) {
        return Container(
          decoration: BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: _gradientAnimation.value,
            ),
          ),
          child: Center(
            child: Transform(
              alignment: Alignment.center,
              transform: Matrix4.identity()
                ..setEntry(3, 2, 0.001) // Perspective for 3D effect
                ..rotateY(_flipAnimation.value),
              child: Transform.scale(
                scale: _scaleAnimation.value,
                child: Opacity(
                  opacity: _opacityAnimation.value,
                  child: _buildAnimatedIcon(),
                ),
              ),
            ),
          ),
        );
      },
    );
  }
  
  Widget _buildAnimatedIcon() {
    return Container(
      width: 100,
      height: 100,
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.2),
        borderRadius: BorderRadius.circular(50),
        border: Border.all(
          color: Colors.white.withOpacity(0.3),
          width: 2,
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.1),
            blurRadius: 20,
            offset: const Offset(0, 10),
          ),
        ],
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
    );
  }

  @override
  void dispose() {
    _flipController.dispose();
    _scaleController.dispose();
    _iconController.dispose();
    _gradientController.dispose();
    super.dispose();
  }
}

// Screen flip trigger
class ScreenFlipTrigger {
  static Future<void> triggerRoleSwitch(
    WidgetRef ref,
    UserRole newRole,
  ) async {
    final navigationNotifier = ref.read(navigationStateProvider.notifier);
    
    // Start flip animation
    navigationNotifier.startFlipAnimation();
    
    // Close drawer immediately
    navigationNotifier.closeDrawer();
    
    // Wait for animation to complete
    await Future.delayed(const Duration(milliseconds: 800));
    
    // Switch role
    await ref.read(userRoleProvider.notifier).switchToPartnerMode(newRole);
    
    // Navigate to appropriate screen
    if (newRole != UserRole.traveler) {
      ref.read(appRouterProvider).go('/partner-selection');
    }
  }
}
```

---

## 🌊 Glass Morphism Animation Effects

### **Animated Glass Container**
```dart
// lib/core/animations/glass_morphism_animation.dart
class AnimatedGlassContainer extends StatefulWidget {
  final Widget child;
  final Duration animationDuration;
  final EdgeInsetsGeometry? padding;
  final EdgeInsetsGeometry? margin;
  final BorderRadius? borderRadius;
  final bool isVisible;
  final double maxBlur;
  final Color? backgroundColor;
  
  const AnimatedGlassContainer({
    required this.child,
    this.animationDuration = const Duration(milliseconds: 300),
    this.padding,
    this.margin,
    this.borderRadius,
    this.isVisible = true,
    this.maxBlur = 10.0,
    this.backgroundColor,
    super.key,
  });

  @override
  State<AnimatedGlassContainer> createState() => _AnimatedGlassContainerState();
}

class _AnimatedGlassContainerState extends State<AnimatedGlassContainer>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _blurAnimation;
  late Animation<double> _opacityAnimation;
  late Animation<double> _scaleAnimation;

  @override
  void initState() {
    super.initState();
    
    _controller = AnimationController(
      duration: widget.animationDuration,
      vsync: this,
    );
    
    _blurAnimation = Tween<double>(
      begin: 0.0,
      end: widget.maxBlur,
    ).animate(CurvedAnimation(
      parent: _controller,
      curve: TripAvailCurves.glassBlur,
    ));
    
    _opacityAnimation = Tween<double>(
      begin: 0.0,
      end: 1.0,
    ).animate(CurvedAnimation(
      parent: _controller,
      curve: Curves.easeOut,
    ));
    
    _scaleAnimation = Tween<double>(
      begin: 0.95,
      end: 1.0,
    ).animate(CurvedAnimation(
      parent: _controller,
      curve: TripAvailCurves.easeOutCubic,
    ));
    
    if (widget.isVisible) {
      _controller.forward();
    }
  }

  @override
  void didUpdateWidget(AnimatedGlassContainer oldWidget) {
    super.didUpdateWidget(oldWidget);
    
    if (widget.isVisible != oldWidget.isVisible) {
      if (widget.isVisible) {
        _controller.forward();
      } else {
        _controller.reverse();
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final glassEffects = theme.extension<AppGlassEffects>()!;
    
    return AnimatedBuilder(
      animation: _controller,
      builder: (context, child) {
        return Transform.scale(
          scale: _scaleAnimation.value,
          child: Opacity(
            opacity: _opacityAnimation.value,
            child: Container(
              margin: widget.margin,
              decoration: BoxDecoration(
                borderRadius: widget.borderRadius ?? BorderRadius.circular(12),
                border: Border.all(
                  color: glassEffects.borderColor.withOpacity(_opacityAnimation.value),
                  width: glassEffects.borderWidth,
                ),
              ),
              child: ClipRRect(
                borderRadius: widget.borderRadius ?? BorderRadius.circular(12),
                child: BackdropFilter(
                  filter: ImageFilter.blur(
                    sigmaX: _blurAnimation.value,
                    sigmaY: _blurAnimation.value,
                  ),
                  child: Container(
                    padding: widget.padding,
                    decoration: BoxDecoration(
                      color: (widget.backgroundColor ?? glassEffects.backgroundColor)
                          .withOpacity(_opacityAnimation.value * 0.8),
                    ),
                    child: widget.child,
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

// Glass morphism state transitions
class GlassMorphismTransition extends StatefulWidget {
  final Widget child;
  final bool showGlass;
  final Duration transitionDuration;
  
  const GlassMorphismTransition({
    required this.child,
    required this.showGlass,
    this.transitionDuration = const Duration(milliseconds: 400),
    super.key,
  });

  @override
  State<GlassMorphismTransition> createState() => _GlassMorphismTransitionState();
}

class _GlassMorphismTransitionState extends State<GlassMorphismTransition>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _glassAnimation;

  @override
  void initState() {
    super.initState();
    
    _controller = AnimationController(
      duration: widget.transitionDuration,
      vsync: this,
    );
    
    _glassAnimation = CurvedAnimation(
      parent: _controller,
      curve: TripAvailCurves.glassBlur,
    );
    
    if (widget.showGlass) {
      _controller.forward();
    }
  }

  @override
  void didUpdateWidget(GlassMorphismTransition oldWidget) {
    super.didUpdateWidget(oldWidget);
    
    if (widget.showGlass != oldWidget.showGlass) {
      if (widget.showGlass) {
        _controller.forward();
      } else {
        _controller.reverse();
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _glassAnimation,
      builder: (context, child) {
        return Stack(
          children: [
            widget.child,
            if (_glassAnimation.value > 0)
              Positioned.fill(
                child: BackdropFilter(
                  filter: ImageFilter.blur(
                    sigmaX: 10 * _glassAnimation.value,
                    sigmaY: 10 * _glassAnimation.value,
                  ),
                  child: Container(
                    color: Colors.white.withOpacity(0.1 * _glassAnimation.value),
                  ),
                ),
              ),
          ],
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

## 🎪 Micro-interactions & Button Animations

### **Animated Button System**
```dart
// lib/core/animations/animated_button_effects.dart
class AnimatedButtonEffects extends StatefulWidget {
  final Widget child;
  final VoidCallback? onTap;
  final Duration animationDuration;
  final double scaleDownFactor;
  final double elevationChange;
  final bool enableHoverEffect;
  final bool enableRipple;
  
  const AnimatedButtonEffects({
    required this.child,
    this.onTap,
    this.animationDuration = const Duration(milliseconds: 150),
    this.scaleDownFactor = 0.95,
    this.elevationChange = 4.0,
    this.enableHoverEffect = true,
    this.enableRipple = true,
    super.key,
  });

  @override
  State<AnimatedButtonEffects> createState() => _AnimatedButtonEffectsState();
}

class _AnimatedButtonEffectsState extends State<AnimatedButtonEffects>
    with TickerProviderStateMixin {
  late AnimationController _pressController;
  late AnimationController _hoverController;
  late AnimationController _rippleController;
  
  late Animation<double> _scaleAnimation;
  late Animation<double> _elevationAnimation;
  late Animation<double> _hoverAnimation;
  late Animation<double> _rippleAnimation;
  
  bool _isPressed = false;
  bool _isHovered = false;
  Offset? _ripplePosition;

  @override
  void initState() {
    super.initState();
    
    _pressController = AnimationController(
      duration: widget.animationDuration,
      vsync: this,
    );
    
    _hoverController = AnimationController(
      duration: const Duration(milliseconds: 200),
      vsync: this,
    );
    
    _rippleController = AnimationController(
      duration: const Duration(milliseconds: 300),
      vsync: this,
    );
    
    _scaleAnimation = Tween<double>(
      begin: 1.0,
      end: widget.scaleDownFactor,
    ).animate(CurvedAnimation(
      parent: _pressController,
      curve: TripAvailCurves.buttonPress,
    ));
    
    _elevationAnimation = Tween<double>(
      begin: 0.0,
      end: widget.elevationChange,
    ).animate(CurvedAnimation(
      parent: _hoverController,
      curve: TripAvailCurves.hoverLift,
    ));
    
    _hoverAnimation = Tween<double>(
      begin: 1.0,
      end: 1.02,
    ).animate(CurvedAnimation(
      parent: _hoverController,
      curve: Curves.easeOut,
    ));
    
    _rippleAnimation = Tween<double>(
      begin: 0.0,
      end: 1.0,
    ).animate(CurvedAnimation(
      parent: _rippleController,
      curve: Curves.easeOut,
    ));
  }

  @override
  Widget build(BuildContext context) {
    return MouseRegion(
      onEnter: widget.enableHoverEffect ? _handleHoverEnter : null,
      onExit: widget.enableHoverEffect ? _handleHoverExit : null,
      child: GestureDetector(
        onTapDown: _handleTapDown,
        onTapUp: _handleTapUp,
        onTapCancel: _handleTapCancel,
        child: AnimatedBuilder(
          animation: Listenable.merge([
            _pressController,
            _hoverController,
            _rippleController,
          ]),
          builder: (context, child) {
            return Transform.scale(
              scale: _scaleAnimation.value * _hoverAnimation.value,
              child: Container(
                decoration: BoxDecoration(
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withOpacity(0.1),
                      blurRadius: 4 + _elevationAnimation.value,
                      offset: Offset(0, 2 + _elevationAnimation.value / 2),
                    ),
                  ],
                ),
                child: Stack(
                  clipBehavior: Clip.hardEdge,
                  children: [
                    widget.child,
                    if (widget.enableRipple && _ripplePosition != null)
                      _buildRippleEffect(),
                  ],
                ),
              ),
            );
          },
        ),
      ),
    );
  }
  
  Widget _buildRippleEffect() {
    return Positioned.fill(
      child: AnimatedBuilder(
        animation: _rippleAnimation,
        builder: (context, child) {
          return CustomPaint(
            painter: RipplePainter(
              animation: _rippleAnimation,
              center: _ripplePosition!,
              color: Colors.white.withOpacity(0.3),
            ),
          );
        },
      ),
    );
  }
  
  void _handleHoverEnter(PointerEnterEvent event) {
    if (!_isHovered) {
      setState(() => _isHovered = true);
      _hoverController.forward();
    }
  }
  
  void _handleHoverExit(PointerExitEvent event) {
    if (_isHovered) {
      setState(() => _isHovered = false);
      _hoverController.reverse();
    }
  }
  
  void _handleTapDown(TapDownDetails details) {
    setState(() {
      _isPressed = true;
      _ripplePosition = details.localPosition;
    });
    
    _pressController.forward();
    
    if (widget.enableRipple) {
      _rippleController.forward();
    }
  }
  
  void _handleTapUp(TapUpDetails details) {
    _handleTapEnd();
    widget.onTap?.call();
  }
  
  void _handleTapCancel() {
    _handleTapEnd();
  }
  
  void _handleTapEnd() {
    setState(() => _isPressed = false);
    _pressController.reverse();
    
    if (widget.enableRipple) {
      _rippleController.reverse().then((_) {
        if (mounted) {
          setState(() => _ripplePosition = null);
        }
      });
    }
  }

  @override
  void dispose() {
    _pressController.dispose();
    _hoverController.dispose();
    _rippleController.dispose();
    super.dispose();
  }
}

class RipplePainter extends CustomPainter {
  final Animation<double> animation;
  final Offset center;
  final Color color;
  
  RipplePainter({
    required this.animation,
    required this.center,
    required this.color,
  });

  @override
  void paint(Canvas canvas, Size size) {
    final radius = math.max(size.width, size.height) * animation.value;
    final paint = Paint()
      ..color = color.withOpacity((1.0 - animation.value) * 0.3)
      ..style = PaintingStyle.fill;
    
    canvas.drawCircle(center, radius, paint);
  }

  @override
  bool shouldRepaint(RipplePainter oldDelegate) {
    return animation.value != oldDelegate.animation.value ||
           center != oldDelegate.center ||
           color != oldDelegate.color;
  }
}
```

### **Hover Lift Effect**
```dart
// lib/core/animations/hover_lift_effect.dart
class HoverLiftEffect extends StatefulWidget {
  final Widget child;
  final double liftHeight;
  final Duration animationDuration;
  final Curve curve;
  final bool enabled;
  
  const HoverLiftEffect({
    required this.child,
    this.liftHeight = 8.0,
    this.animationDuration = const Duration(milliseconds: 200),
    this.curve = TripAvailCurves.hoverLift,
    this.enabled = true,
    super.key,
  });

  @override
  State<HoverLiftEffect> createState() => _HoverLiftEffectState();
}

class _HoverLiftEffectState extends State<HoverLiftEffect>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _liftAnimation;
  late Animation<double> _shadowAnimation;
  bool _isHovered = false;

  @override
  void initState() {
    super.initState();
    
    _controller = AnimationController(
      duration: widget.animationDuration,
      vsync: this,
    );
    
    _liftAnimation = Tween<double>(
      begin: 0.0,
      end: widget.liftHeight,
    ).animate(CurvedAnimation(
      parent: _controller,
      curve: widget.curve,
    ));
    
    _shadowAnimation = Tween<double>(
      begin: 0.0,
      end: 0.2,
    ).animate(CurvedAnimation(
      parent: _controller,
      curve: widget.curve,
    ));
  }

  @override
  Widget build(BuildContext context) {
    if (!widget.enabled) {
      return widget.child;
    }
    
    return MouseRegion(
      onEnter: _handleHoverEnter,
      onExit: _handleHoverExit,
      child: AnimatedBuilder(
        animation: _controller,
        builder: (context, child) {
          return Transform.translate(
            offset: Offset(0, -_liftAnimation.value),
            child: Container(
              decoration: BoxDecoration(
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(_shadowAnimation.value),
                    blurRadius: 10 + _liftAnimation.value,
                    offset: Offset(0, 5 + _liftAnimation.value / 2),
                  ),
                ],
              ),
              child: widget.child,
            ),
          );
        },
      ),
    );
  }
  
  void _handleHoverEnter(PointerEnterEvent event) {
    if (!_isHovered) {
      setState(() => _isHovered = true);
      _controller.forward();
    }
  }
  
  void _handleHoverExit(PointerExitEvent event) {
    if (_isHovered) {
      setState(() => _isHovered = false);
      _controller.reverse();
    }
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }
}
```

---

## 🌀 Loading Animations

### **Advanced Skeleton Loader**
```dart
// lib/core/animations/skeleton_loader.dart
class AdvancedSkeletonLoader extends StatefulWidget {
  final double width;
  final double height;
  final BorderRadius? borderRadius;
  final Duration animationDuration;
  final Duration delayDuration;
  final Color? baseColor;
  final Color? highlightColor;
  final bool enabled;
  
  const AdvancedSkeletonLoader({
    required this.width,
    required this.height,
    this.borderRadius,
    this.animationDuration = const Duration(milliseconds: 1500),
    this.delayDuration = Duration.zero,
    this.baseColor,
    this.highlightColor,
    this.enabled = true,
    super.key,
  });

  @override
  State<AdvancedSkeletonLoader> createState() => _AdvancedSkeletonLoaderState();
}

class _AdvancedSkeletonLoaderState extends State<AdvancedSkeletonLoader>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _shimmerAnimation;
  late Animation<double> _pulseAnimation;

  @override
  void initState() {
    super.initState();
    
    _controller = AnimationController(
      duration: widget.animationDuration,
      vsync: this,
    );
    
    _shimmerAnimation = Tween<double>(
      begin: -1.0,
      end: 2.0,
    ).animate(CurvedAnimation(
      parent: _controller,
      curve: Curves.ease,
    ));
    
    _pulseAnimation = Tween<double>(
      begin: 0.6,
      end: 1.0,
    ).animate(CurvedAnimation(
      parent: _controller,
      curve: Curves.easeInOut,
    ));
    
    _startAnimation();
  }
  
  void _startAnimation() {
    if (widget.enabled) {
      Future.delayed(widget.delayDuration, () {
        if (mounted) {
          _controller.repeat();
        }
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    if (!widget.enabled) {
      return SizedBox(width: widget.width, height: widget.height);
    }
    
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    
    final baseColor = widget.baseColor ?? 
        (isDark ? Colors.grey[800]! : Colors.grey[300]!);
    final highlightColor = widget.highlightColor ?? 
        (isDark ? Colors.grey[700]! : Colors.grey[100]!);
    
    return AnimatedBuilder(
      animation: _controller,
      builder: (context, child) {
        return Container(
          width: widget.width,
          height: widget.height,
          decoration: BoxDecoration(
            borderRadius: widget.borderRadius ?? BorderRadius.circular(8),
            color: baseColor,
          ),
          child: ClipRRect(
            borderRadius: widget.borderRadius ?? BorderRadius.circular(8),
            child: Stack(
              children: [
                // Pulse effect
                Opacity(
                  opacity: _pulseAnimation.value,
                  child: Container(
                    decoration: BoxDecoration(
                      color: highlightColor.withOpacity(0.5),
                    ),
                  ),
                ),
                // Shimmer effect
                Positioned.fill(
                  child: Transform.translate(
                    offset: Offset(
                      _shimmerAnimation.value * widget.width,
                      0,
                    ),
                    child: Container(
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          begin: Alignment.centerLeft,
                          end: Alignment.centerRight,
                          colors: [
                            Colors.transparent,
                            highlightColor.withOpacity(0.8),
                            Colors.transparent,
                          ],
                          stops: const [0.0, 0.5, 1.0],
                        ),
                      ),
                    ),
                  ),
                ),
              ],
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

// Staggered skeleton loader for lists
class StaggeredSkeletonLoader extends StatefulWidget {
  final int itemCount;
  final Duration staggerDelay;
  final Widget Function(int index) itemBuilder;
  
  const StaggeredSkeletonLoader({
    required this.itemCount,
    required this.itemBuilder,
    this.staggerDelay = const Duration(milliseconds: 100),
    super.key,
  });

  @override
  State<StaggeredSkeletonLoader> createState() => _StaggeredSkeletonLoaderState();
}

class _StaggeredSkeletonLoaderState extends State<StaggeredSkeletonLoader> {
  final List<bool> _itemsVisible = [];

  @override
  void initState() {
    super.initState();
    _itemsVisible.addAll(List.generate(widget.itemCount, (index) => false));
    _startStaggeredAnimation();
  }
  
  void _startStaggeredAnimation() {
    for (int i = 0; i < widget.itemCount; i++) {
      Future.delayed(widget.staggerDelay * i, () {
        if (mounted) {
          setState(() {
            _itemsVisible[i] = true;
          });
        }
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      children: List.generate(widget.itemCount, (index) {
        return AnimatedOpacity(
          opacity: _itemsVisible[index] ? 1.0 : 0.0,
          duration: const Duration(milliseconds: 300),
          child: widget.itemBuilder(index),
        );
      }),
    );
  }
}
```

### **Spinner Animation System**
```dart
// lib/core/animations/spinner_animations.dart
class TripAvailSpinner extends StatefulWidget {
  final double size;
  final Color? color;
  final double strokeWidth;
  final SpinnerType type;
  
  const TripAvailSpinner({
    this.size = 24,
    this.color,
    this.strokeWidth = 2,
    this.type = SpinnerType.circular,
    super.key,
  });

  @override
  State<TripAvailSpinner> createState() => _TripAvailSpinnerState();
}

class _TripAvailSpinnerState extends State<TripAvailSpinner>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _rotationAnimation;
  late Animation<double> _scaleAnimation;

  @override
  void initState() {
    super.initState();
    
    _controller = AnimationController(
      duration: Duration(
        milliseconds: widget.type == SpinnerType.pulsing ? 1200 : 1000,
      ),
      vsync: this,
    );
    
    _rotationAnimation = Tween<double>(
      begin: 0,
      end: 2 * math.pi,
    ).animate(CurvedAnimation(
      parent: _controller,
      curve: Curves.linear,
    ));
    
    _scaleAnimation = Tween<double>(
      begin: 0.8,
      end: 1.0,
    ).animate(CurvedAnimation(
      parent: _controller,
      curve: Curves.easeInOut,
    ));
    
    if (widget.type == SpinnerType.pulsing) {
      _controller.repeat(reverse: true);
    } else {
      _controller.repeat();
    }
  }

  @override
  Widget build(BuildContext context) {
    final color = widget.color ?? Theme.of(context).primaryColor;
    
    return SizedBox(
      width: widget.size,
      height: widget.size,
      child: AnimatedBuilder(
        animation: _controller,
        builder: (context, child) {
          switch (widget.type) {
            case SpinnerType.circular:
              return _buildCircularSpinner(color);
            case SpinnerType.pulsing:
              return _buildPulsingSpinner(color);
            case SpinnerType.gradient:
              return _buildGradientSpinner(color);
            case SpinnerType.dots:
              return _buildDotsSpinner(color);
          }
        },
      ),
    );
  }
  
  Widget _buildCircularSpinner(Color color) {
    return Transform.rotate(
      angle: _rotationAnimation.value,
      child: CircularProgressIndicator(
        color: color,
        strokeWidth: widget.strokeWidth,
      ),
    );
  }
  
  Widget _buildPulsingSpinner(Color color) {
    return Transform.scale(
      scale: _scaleAnimation.value,
      child: Container(
        decoration: BoxDecoration(
          color: color.withOpacity(0.8),
          shape: BoxShape.circle,
        ),
      ),
    );
  }
  
  Widget _buildGradientSpinner(Color color) {
    return Transform.rotate(
      angle: _rotationAnimation.value,
      child: Container(
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          gradient: SweepGradient(
            colors: [
              Colors.transparent,
              color.withOpacity(0.3),
              color,
              color.withOpacity(0.3),
              Colors.transparent,
            ],
            stops: const [0.0, 0.2, 0.5, 0.8, 1.0],
          ),
        ),
      ),
    );
  }
  
  Widget _buildDotsSpinner(Color color) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceEvenly,
      children: List.generate(3, (index) {
        final delay = index * 0.3;
        final animation = Tween<double>(
          begin: 0.0,
          end: 1.0,
        ).animate(CurvedAnimation(
          parent: _controller,
          curve: Interval(delay, 1.0, curve: Curves.ease),
        ));
        
        return AnimatedBuilder(
          animation: animation,
          builder: (context, child) {
            return Transform.scale(
              scale: 0.5 + (animation.value * 0.5),
              child: Container(
                width: widget.size / 5,
                height: widget.size / 5,
                decoration: BoxDecoration(
                  color: color.withOpacity(0.5 + animation.value * 0.5),
                  shape: BoxShape.circle,
                ),
              ),
            );
          },
        );
      }),
    );
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }
}

enum SpinnerType { circular, pulsing, gradient, dots }
```

---

## 🌊 Stagger & List Animations

### **Stagger Animation Controller**
```dart
// lib/core/animations/stagger_animation.dart
class StaggerAnimationController {
  static void animateList({
    required List<AnimationController> controllers,
    required Duration staggerDelay,
    Duration? individualDuration,
    Curve curve = Curves.easeOut,
    bool reverse = false,
  }) {
    final duration = individualDuration ?? const Duration(milliseconds: 300);
    
    for (int i = 0; i < controllers.length; i++) {
      final delay = reverse 
          ? staggerDelay * (controllers.length - 1 - i)
          : staggerDelay * i;
      
      Timer(delay, () {
        if (reverse) {
          controllers[i].reverse();
        } else {
          controllers[i].forward();
        }
      });
    }
  }
  
  static void animateSequential({
    required List<VoidCallback> animations,
    required Duration interval,
  }) {
    for (int i = 0; i < animations.length; i++) {
      Timer(interval * i, animations[i]);
    }
  }
}

class StaggeredListView extends StatefulWidget {
  final List<Widget> children;
  final Duration animationDuration;
  final Duration staggerDelay;
  final Curve curve;
  final ScrollPhysics? physics;
  final EdgeInsetsGeometry? padding;
  final bool reverse;
  
  const StaggeredListView({
    required this.children,
    this.animationDuration = const Duration(milliseconds: 300),
    this.staggerDelay = const Duration(milliseconds: 50),
    this.curve = TripAvailCurves.stagger,
    this.physics,
    this.padding,
    this.reverse = false,
    super.key,
  });

  @override
  State<StaggeredListView> createState() => _StaggeredListViewState();
}

class _StaggeredListViewState extends State<StaggeredListView>
    with TickerProviderStateMixin {
  late List<AnimationController> _controllers;
  late List<Animation<double>> _fadeAnimations;
  late List<Animation<Offset>> _slideAnimations;

  @override
  void initState() {
    super.initState();
    _initializeAnimations();
    _startStaggeredAnimation();
  }
  
  void _initializeAnimations() {
    _controllers = List.generate(widget.children.length, (index) {
      return AnimationController(
        duration: widget.animationDuration,
        vsync: this,
        debugLabel: 'stagger_$index',
      );
    });
    
    _fadeAnimations = _controllers.map((controller) {
      return Tween<double>(
        begin: 0.0,
        end: 1.0,
      ).animate(CurvedAnimation(
        parent: controller,
        curve: widget.curve,
      ));
    }).toList();
    
    _slideAnimations = _controllers.map((controller) {
      return Tween<Offset>(
        begin: const Offset(0.0, 0.3),
        end: Offset.zero,
      ).animate(CurvedAnimation(
        parent: controller,
        curve: widget.curve,
      ));
    }).toList();
  }
  
  void _startStaggeredAnimation() {
    StaggerAnimationController.animateList(
      controllers: _controllers,
      staggerDelay: widget.staggerDelay,
      reverse: widget.reverse,
    );
  }

  @override
  Widget build(BuildContext context) {
    return ListView.builder(
      physics: widget.physics,
      padding: widget.padding,
      itemCount: widget.children.length,
      itemBuilder: (context, index) {
        return AnimatedBuilder(
          animation: _controllers[index],
          builder: (context, child) {
            return FadeTransition(
              opacity: _fadeAnimations[index],
              child: SlideTransition(
                position: _slideAnimations[index],
                child: widget.children[index],
              ),
            );
          },
        );
      },
    );
  }

  @override
  void dispose() {
    for (final controller in _controllers) {
      controller.dispose();
    }
    super.dispose();
  }
}

class StaggeredGridView extends StatefulWidget {
  final List<Widget> children;
  final int crossAxisCount;
  final Duration animationDuration;
  final Duration staggerDelay;
  final double mainAxisSpacing;
  final double crossAxisSpacing;
  final EdgeInsetsGeometry? padding;
  
  const StaggeredGridView({
    required this.children,
    required this.crossAxisCount,
    this.animationDuration = const Duration(milliseconds: 300),
    this.staggerDelay = const Duration(milliseconds: 50),
    this.mainAxisSpacing = 8.0,
    this.crossAxisSpacing = 8.0,
    this.padding,
    super.key,
  });

  @override
  State<StaggeredGridView> createState() => _StaggeredGridViewState();
}

class _StaggeredGridViewState extends State<StaggeredGridView>
    with TickerProviderStateMixin {
  late List<AnimationController> _controllers;
  late List<Animation<double>> _scaleAnimations;
  late List<Animation<double>> _fadeAnimations;

  @override
  void initState() {
    super.initState();
    _initializeAnimations();
    _startStaggeredAnimation();
  }
  
  void _initializeAnimations() {
    _controllers = List.generate(widget.children.length, (index) {
      return AnimationController(
        duration: widget.animationDuration,
        vsync: this,
      );
    });
    
    _scaleAnimations = _controllers.map((controller) {
      return Tween<double>(
        begin: 0.8,
        end: 1.0,
      ).animate(CurvedAnimation(
        parent: controller,
        curve: TripAvailCurves.easeOutCubic,
      ));
    }).toList();
    
    _fadeAnimations = _controllers.map((controller) {
      return Tween<double>(
        begin: 0.0,
        end: 1.0,
      ).animate(CurvedAnimation(
        parent: controller,
        curve: Curves.easeOut,
      ));
    }).toList();
  }
  
  void _startStaggeredAnimation() {
    // Animate in diagonal pattern for grid
    for (int i = 0; i < widget.children.length; i++) {
      final row = i ~/ widget.crossAxisCount;
      final col = i % widget.crossAxisCount;
      final delay = widget.staggerDelay * (row + col);
      
      Timer(delay, () {
        if (mounted) {
          _controllers[i].forward();
        }
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: widget.padding ?? EdgeInsets.zero,
      child: GridView.builder(
        shrinkWrap: true,
        physics: const NeverScrollableScrollPhysics(),
        gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
          crossAxisCount: widget.crossAxisCount,
          mainAxisSpacing: widget.mainAxisSpacing,
          crossAxisSpacing: widget.crossAxisSpacing,
        ),
        itemCount: widget.children.length,
        itemBuilder: (context, index) {
          return AnimatedBuilder(
            animation: _controllers[index],
            builder: (context, child) {
              return FadeTransition(
                opacity: _fadeAnimations[index],
                child: ScaleTransition(
                  scale: _scaleAnimations[index],
                  child: widget.children[index],
                ),
              );
            },
          );
        },
      ),
    );
  }

  @override
  void dispose() {
    for (final controller in _controllers) {
      controller.dispose();
    }
    super.dispose();
  }
}
```

---

## 📱 Search Overlay Animation

### **Search Overlay Animation System**
```dart
// lib/core/animations/search_overlay_animation.dart
class SearchOverlayAnimation extends ConsumerStatefulWidget {
  final Widget child;
  final bool isVisible;
  final VoidCallback? onAnimationComplete;
  
  const SearchOverlayAnimation({
    required this.child,
    required this.isVisible,
    this.onAnimationComplete,
    super.key,
  });

  @override
  ConsumerState<SearchOverlayAnimation> createState() => _SearchOverlayAnimationState();
}

class _SearchOverlayAnimationState extends ConsumerState<SearchOverlayAnimation>
    with TickerProviderStateMixin {
  late AnimationController _overlayController;
  late AnimationController _blurController;
  late AnimationController _contentController;
  
  late Animation<double> _overlayAnimation;
  late Animation<double> _blurAnimation;
  late Animation<double> _scaleAnimation;
  late Animation<Offset> _slideAnimation;

  @override
  void initState() {
    super.initState();
    _initializeAnimations();
  }
  
  void _initializeAnimations() {
    // Overlay fade animation
    _overlayController = AnimationController(
      duration: const Duration(milliseconds: 300),
      vsync: this,
    );
    
    // Blur animation
    _blurController = AnimationController(
      duration: const Duration(milliseconds: 400),
      vsync: this,
    );
    
    // Content animation
    _contentController = AnimationController(
      duration: const Duration(milliseconds: 350),
      vsync: this,
    );
    
    _overlayAnimation = Tween<double>(
      begin: 0.0,
      end: 1.0,
    ).animate(CurvedAnimation(
      parent: _overlayController,
      curve: Curves.easeOut,
    ));
    
    _blurAnimation = Tween<double>(
      begin: 0.0,
      end: 4.0,
    ).animate(CurvedAnimation(
      parent: _blurController,
      curve: TripAvailCurves.glassBlur,
    ));
    
    _scaleAnimation = Tween<double>(
      begin: 0.9,
      end: 1.0,
    ).animate(CurvedAnimation(
      parent: _contentController,
      curve: TripAvailCurves.easeOutCubic,
    ));
    
    _slideAnimation = Tween<Offset>(
      begin: const Offset(0.0, 0.1),
      end: Offset.zero,
    ).animate(CurvedAnimation(
      parent: _contentController,
      curve: TripAvailCurves.easeOutCubic,
    ));
    
    // Listen for animation completion
    _contentController.addStatusListener((status) {
      if (status == AnimationStatus.completed) {
        widget.onAnimationComplete?.call();
      }
    });
    
    if (widget.isVisible) {
      _startShowAnimation();
    }
  }

  @override
  void didUpdateWidget(SearchOverlayAnimation oldWidget) {
    super.didUpdateWidget(oldWidget);
    
    if (widget.isVisible != oldWidget.isVisible) {
      if (widget.isVisible) {
        _startShowAnimation();
      } else {
        _startHideAnimation();
      }
    }
  }
  
  Future<void> _startShowAnimation() async {
    // Update animation state
    ref.read(animationStateProvider.notifier).setSearchOverlayAnimating(true);
    
    // Staggered animation sequence
    _overlayController.forward();
    
    // Start blur animation slightly delayed
    Future.delayed(const Duration(milliseconds: 50), () {
      if (mounted) {
        _blurController.forward();
      }
    });
    
    // Start content animation
    Future.delayed(const Duration(milliseconds: 100), () {
      if (mounted) {
        _contentController.forward();
      }
    });
  }
  
  Future<void> _startHideAnimation() async {
    // Reverse animations in reverse order
    _contentController.reverse();
    
    Future.delayed(const Duration(milliseconds: 50), () {
      if (mounted) {
        _blurController.reverse();
      }
    });
    
    Future.delayed(const Duration(milliseconds: 100), () {
      if (mounted) {
        _overlayController.reverse().then((_) {
          ref.read(animationStateProvider.notifier).setSearchOverlayAnimating(false);
        });
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    if (!widget.isVisible && _overlayController.isDismissed) {
      return const SizedBox.shrink();
    }
    
    return AnimatedBuilder(
      animation: Listenable.merge([
        _overlayController,
        _blurController,
        _contentController,
      ]),
      builder: (context, child) {
        return Stack(
          children: [
            // Background overlay with blur
            if (_overlayAnimation.value > 0)
              Positioned.fill(
                child: GestureDetector(
                  onTap: () => _startHideAnimation(),
                  child: AnimatedContainer(
                    duration: const Duration(milliseconds: 300),
                    color: Colors.black.withOpacity(0.5 * _overlayAnimation.value),
                    child: BackdropFilter(
                      filter: ImageFilter.blur(
                        sigmaX: _blurAnimation.value,
                        sigmaY: _blurAnimation.value,
                      ),
                      child: Container(
                        color: Colors.transparent,
                      ),
                    ),
                  ),
                ),
              ),
            
            // Content
            if (_contentController.value > 0)
              SafeArea(
                child: SlideTransition(
                  position: _slideAnimation,
                  child: ScaleTransition(
                    scale: _scaleAnimation,
                    child: FadeTransition(
                      opacity: _contentController,
                      child: Container(
                        margin: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: Theme.of(context).scaffoldBackgroundColor,
                          borderRadius: BorderRadius.circular(16),
                          boxShadow: [
                            BoxShadow(
                              color: Colors.black.withOpacity(0.2 * _contentController.value),
                              blurRadius: 20,
                              offset: const Offset(0, 10),
                            ),
                          ],
                        ),
                        child: widget.child,
                      ),
                    ),
                  ),
                ),
              ),
          ],
        );
      },
    );
  }

  @override
  void dispose() {
    _overlayController.dispose();
    _blurController.dispose();
    _contentController.dispose();
    super.dispose();
  }
}
```

---

## ⚡ Performance Optimization

### **Animation Performance Monitor**
```dart
// lib/core/animations/performance_monitor.dart
class AnimationPerformanceMonitor {
  final Map<String, List<Duration>> _frameTimes = {};
  final Map<String, Stopwatch> _activeTimers = {};
  static const int _maxSamples = 60; // Monitor last 60 frames
  
  void startTiming(String animationId) {
    _activeTimers[animationId] = Stopwatch()..start();
  }
  
  void recordFrame(String animationId) {
    final timer = _activeTimers[animationId];
    if (timer == null) return;
    
    timer.stop();
    final frameDuration = timer.elapsed;
    timer.reset();
    timer.start();
    
    _frameTimes.putIfAbsent(animationId, () => <Duration>[]);
    final frames = _frameTimes[animationId]!;
    
    frames.add(frameDuration);
    
    // Keep only recent samples
    if (frames.length > _maxSamples) {
      frames.removeAt(0);
    }
    
    // Check for performance issues
    _checkPerformance(animationId, frameDuration);
  }
  
  void stopTiming(String animationId) {
    _activeTimers[animationId]?.stop();
    _activeTimers.remove(animationId);
  }
  
  void _checkPerformance(String animationId, Duration frameDuration) {
    const Duration targetFrameTime = Duration(microseconds: 16667); // 60fps
    const Duration warningThreshold = Duration(microseconds: 20000); // 50fps
    
    if (frameDuration > warningThreshold) {
      debugPrint('⚠️ Animation performance warning: $animationId frame took ${frameDuration.inMicroseconds}μs');
    }
  }
  
  double getAverageFrameTime(String animationId) {
    final frames = _frameTimes[animationId];
    if (frames == null || frames.isEmpty) return 0.0;
    
    final totalMicroseconds = frames.fold<int>(
      0,
      (sum, duration) => sum + duration.inMicroseconds,
    );
    
    return totalMicroseconds / frames.length;
  }
  
  double getFrameRate(String animationId) {
    final avgFrameTime = getAverageFrameTime(animationId);
    if (avgFrameTime == 0) return 0.0;
    
    return 1000000 / avgFrameTime; // Convert to fps
  }
  
  void dispose() {
    for (final timer in _activeTimers.values) {
      timer.stop();
    }
    _activeTimers.clear();
    _frameTimes.clear();
  }
}

// Performance optimization utilities
class AnimationOptimizer {
  static Widget optimizeForPerformance({
    required Widget child,
    bool cacheExtent = true,
    bool addSemanticIndexes = false,
    bool addAutomaticKeepAlives = false,
  }) {
    Widget optimizedChild = child;
    
    if (cacheExtent) {
      optimizedChild = RepaintBoundary(child: optimizedChild);
    }
    
    return optimizedChild;
  }
  
  static void optimizeAnimation(AnimationController controller) {
    // Dispose controller when not needed
    controller.addStatusListener((status) {
      if (status == AnimationStatus.completed || 
          status == AnimationStatus.dismissed) {
        // Consider releasing resources after delay
      }
    });
  }
  
  static bool shouldReduceAnimations(BuildContext context) {
    // Check system settings for reduced motion
    return MediaQuery.of(context).disableAnimations;
  }
}

// Battery optimization
class BatteryOptimizedAnimations {
  static Duration adjustDurationForBattery(
    Duration original,
    double batteryLevel,
  ) {
    if (batteryLevel < 0.2) {
      // Reduce animation duration when battery is low
      return Duration(milliseconds: (original.inMilliseconds * 0.5).round());
    } else if (batteryLevel < 0.5) {
      return Duration(milliseconds: (original.inMilliseconds * 0.8).round());
    }
    
    return original;
  }
  
  static bool shouldSkipAnimation(double batteryLevel) {
    return batteryLevel < 0.1; // Skip animations when battery is critically low
  }
}
```

### **Animation Memory Management**
```dart
// lib/core/animations/memory_management.dart
class AnimationMemoryManager {
  static final Map<String, WeakReference<AnimationController>> _controllerPool = {};
  static final Set<String> _activeAnimations = {};
  
  static AnimationController getPooledController(
    String key,
    TickerProvider vsync,
    Duration duration,
  ) {
    // Try to reuse existing controller
    final weakRef = _controllerPool[key];
    final existing = weakRef?.target;
    
    if (existing != null && !existing.isDisposed) {
      _activeAnimations.add(key);
      return existing;
    }
    
    // Create new controller
    final controller = AnimationController(
      duration: duration,
      vsync: vsync,
      debugLabel: key,
    );
    
    _controllerPool[key] = WeakReference(controller);
    _activeAnimations.add(key);
    
    // Auto-cleanup when animation completes
    controller.addStatusListener((status) {
      if (status == AnimationStatus.completed || 
          status == AnimationStatus.dismissed) {
        _scheduleCleanup(key);
      }
    });
    
    return controller;
  }
  
  static void _scheduleCleanup(String key) {
    // Delay cleanup to allow for potential reuse
    Future.delayed(const Duration(seconds: 2), () {
      _activeAnimations.remove(key);
      _cleanupUnusedControllers();
    });
  }
  
  static void _cleanupUnusedControllers() {
    final keysToRemove = <String>[];
    
    for (final entry in _controllerPool.entries) {
      final key = entry.key;
      final controller = entry.value.target;
      
      if (!_activeAnimations.contains(key) &&
          (controller == null || controller.isDisposed)) {
        keysToRemove.add(key);
      }
    }
    
    for (final key in keysToRemove) {
      _controllerPool.remove(key);
    }
  }
  
  static void forceCleanup() {
    for (final weakRef in _controllerPool.values) {
      final controller = weakRef.target;
      if (controller != null && !controller.isDisposed) {
        controller.dispose();
      }
    }
    
    _controllerPool.clear();
    _activeAnimations.clear();
  }
  
  static int get activeAnimationsCount => _activeAnimations.length;
  static int get pooledControllersCount => _controllerPool.length;
}

// Animation lifecycle manager
class AnimationLifecycleManager extends StatefulWidget {
  final Widget child;
  
  const AnimationLifecycleManager({required this.child, super.key});

  @override
  State<AnimationLifecycleManager> createState() => _AnimationLifecycleManagerState();
}

class _AnimationLifecycleManagerState extends State<AnimationLifecycleManager>
    with WidgetsBindingObserver {

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    switch (state) {
      case AppLifecycleState.paused:
      case AppLifecycleState.inactive:
        // Pause animations to save battery
        _pauseAllAnimations();
        break;
      case AppLifecycleState.resumed:
        // Resume animations
        _resumeAllAnimations();
        break;
      case AppLifecycleState.detached:
        // Cleanup all animations
        AnimationMemoryManager.forceCleanup();
        break;
      case AppLifecycleState.hidden:
        break;
    }
  }
  
  void _pauseAllAnimations() {
    // Implementation to pause active animations
  }
  
  void _resumeAllAnimations() {
    // Implementation to resume paused animations
  }

  @override
  Widget build(BuildContext context) {
    return widget.child;
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    super.dispose();
  }
}
```

---

## 🔧 Animation Integration Utilities

### **Animation Builders**
```dart
// lib/core/animations/animation_builders.dart
class AnimationBuilder {
  static Widget fadeIn({
    required Widget child,
    Duration duration = const Duration(milliseconds: 300),
    Duration delay = Duration.zero,
    Curve curve = Curves.easeOut,
  }) {
    return FadeInAnimation(
      duration: duration,
      delay: delay,
      curve: curve,
      child: child,
    );
  }
  
  static Widget slideIn({
    required Widget child,
    SlideDirection direction = SlideDirection.fromBottom,
    Duration duration = const Duration(milliseconds: 300),
    Duration delay = Duration.zero,
    Curve curve = TripAvailCurves.easeOutCubic,
  }) {
    return SlideInAnimation(
      direction: direction,
      duration: duration,
      delay: delay,
      curve: curve,
      child: child,
    );
  }
  
  static Widget scaleIn({
    required Widget child,
    double initialScale = 0.8,
    Duration duration = const Duration(milliseconds: 300),
    Duration delay = Duration.zero,
    Curve curve = TripAvailCurves.easeOutCubic,
  }) {
    return ScaleInAnimation(
      initialScale: initialScale,
      duration: duration,
      delay: delay,
      curve: curve,
      child: child,
    );
  }
  
  static Widget staggeredList({
    required List<Widget> children,
    Duration staggerDelay = const Duration(milliseconds: 50),
    Duration itemDuration = const Duration(milliseconds: 300),
  }) {
    return StaggeredListView(
      children: children,
      staggerDelay: staggerDelay,
      animationDuration: itemDuration,
    );
  }
}

enum SlideDirection {
  fromTop,
  fromBottom,
  fromLeft,
  fromRight,
}
```

### **Animation State Integration**
```dart
// lib/core/animations/animation_state_integration.dart
final animationCoordinatorProvider = Provider<AnimationCoordinator>((ref) {
  return AnimationCoordinator();
});

class AnimationCoordinator {
  final Map<String, AnimationController> _controllers = {};
  final StreamController<AnimationEvent> _eventController = StreamController.broadcast();
  
  Stream<AnimationEvent> get events => _eventController.stream;
  
  void registerAnimation(String id, AnimationController controller) {
    _controllers[id] = controller;
    _eventController.add(AnimationEvent.registered(id));
  }
  
  void unregisterAnimation(String id) {
    _controllers.remove(id);
    _eventController.add(AnimationEvent.unregistered(id));
  }
  
  Future<void> playSequence(List<String> animationIds) async {
    for (final id in animationIds) {
      final controller = _controllers[id];
      if (controller != null) {
        await controller.forward();
        _eventController.add(AnimationEvent.completed(id));
      }
    }
  }
  
  void pauseAll() {
    for (final controller in _controllers.values) {
      if (controller.isAnimating) {
        controller.stop();
      }
    }
    _eventController.add(const AnimationEvent.allPaused());
  }
  
  void resumeAll() {
    for (final controller in _controllers.values) {
      if (!controller.isCompleted && !controller.isDismissed) {
        controller.forward();
      }
    }
    _eventController.add(const AnimationEvent.allResumed());
  }
  
  void dispose() {
    for (final controller in _controllers.values) {
      controller.dispose();
    }
    _controllers.clear();
    _eventController.close();
  }
}

@freezed
class AnimationEvent with _$AnimationEvent {
  const factory AnimationEvent.registered(String id) = _Registered;
  const factory AnimationEvent.unregistered(String id) = _Unregistered;
  const factory AnimationEvent.completed(String id) = _Completed;
  const factory AnimationEvent.allPaused() = _AllPaused;
  const factory AnimationEvent.allResumed() = _AllResumed;
}
```

---

## 🔍 Migration Checklist

### **✅ Core Animation Infrastructure**
- [ ] Implement AnimationController management system
- [ ] Create custom curves matching Motion/Framer Motion
- [ ] Set up animation state providers with Riverpod
- [ ] Build animation coordination system
- [ ] Implement performance monitoring

### **✅ Screen-Level Animations**
- [ ] Create 3D screen flip animation with perspective
- [ ] Implement search overlay blur animation
- [ ] Build page transition animations
- [ ] Set up navigation animation coordination
- [ ] Add glass morphism animation effects

### **✅ Component-Level Animations**
- [ ] Create micro-interaction system
- [ ] Implement button press and hover animations
- [ ] Build focus transition effects
- [ ] Add ripple effect animations
- [ ] Create hover lift effects

### **✅ Loading & State Animations**
- [ ] Implement advanced skeleton loader system
- [ ] Create spinner animation variants
- [ ] Build stagger animation controllers
- [ ] Add progress indicator animations
- [ ] Implement state transition effects

### **✅ Performance & Optimization**
- [ ] Set up animation performance monitoring
- [ ] Implement memory management for animations
- [ ] Create battery optimization strategies
- [ ] Add frame rate monitoring
- [ ] Build animation lifecycle management

### **✅ Integration & Testing**
- [ ] Connect animations to theme system
- [ ] Integrate with navigation state
- [ ] Test animation performance across devices
- [ ] Verify smooth dark mode transitions
- [ ] Test memory usage and cleanup

---

## 🔍 Next Steps

1. **Implement API integration layer** (`09_api_integration.md`)
2. **Create role-specific features** (`10_role_features.md`)
3. **Build offline capabilities** (`11_offline_system.md`)
4. **Add testing strategies** (`12_testing_strategy.md`)
5. **Implement deployment pipeline** (`13_deployment_guide.md`)

---

*This comprehensive Flutter animation system preserves all sophisticated features from the Motion/Framer Motion React implementation while leveraging Flutter's powerful animation APIs for better performance, smoother transitions, and native mobile optimization. The modular design ensures maintainability and allows for easy extension of animation capabilities.*