import 'package:flutter/material.dart';
import 'package:lottie/lottie.dart';
import 'package:lordicon/lordicon.dart';
import 'package:visibility_detector/visibility_detector.dart';

/// Smart amenity icon widget - Uses Lottie for animated icons, Material icons as fallback
/// Automatically switches between static and animated icons based on amenity config
/// Implements visibility-based animation control for performance optimization
class AmenityIcon extends StatefulWidget {
  // Lordicon configuration
  static const String _lordiconBasePath = 'assets/lottie/lordicon_animations';
  static const double _lordiconScaleFactor = 0.52; // Scale factor for Lordicon icons to achieve ~45dp visual size
  static const Set<String> _lordiconIcons = {
    'ocean_view',
    'beachfront',
    'bbq_grill',
    'pool',
    'gym',
    'patio',
    'fire_pit',
    'Tv',
    'wifiant',
    'parking',
    'washer',
    'aircondt',
    'heating',
  };

  final String iconName;
  final bool isSelected;
  final bool hasAnimation;
  final double size;
  final bool shouldAnimate; // Control animation playback
  final double zoom; // Extra scale inside allotted box to counter internal padding in assets
  final bool outlineOnly; // When true, avoid fills/animations and render clean outline icons
  // Normalize Lottie visual size to match Material icon metrics without changing card size
  final double lottieScale;

  const AmenityIcon({
    super.key,
    required this.iconName,
    this.isSelected = false,
    this.hasAnimation = false,
    this.size = 32, // Standard amenity icon size (aligned with Airbnb ~32px)
    this.shouldAnimate = true, // Animate by default
    this.zoom = 1.0, // Retained for future outline assets but default remains 1.0
    this.outlineOnly = false,
    this.lottieScale = 1.8, // Increased significantly to match Material icon visual size
  });

  @override
  State<AmenityIcon> createState() => _AmenityIconState();
}

class _AmenityIconState extends State<AmenityIcon>
    with SingleTickerProviderStateMixin {
  bool _isVisible = true; // Track visibility for animation control
  final Stopwatch _renderStopwatch = Stopwatch();
  late AnimationController _controller;
  late Animation<double> _scaleAnimation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this, // Fix: `this` now implements `TickerProvider`
      duration: const Duration(milliseconds: 200),
    );
    _scaleAnimation = Tween<double>(begin: 1.0, end: 1.2).animate(
      CurvedAnimation(parent: _controller, curve: Curves.easeOut),
    );
  }

  @override
  void didUpdateWidget(covariant AmenityIcon oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.isSelected) {
      _controller.forward().then((_) => _controller.reverse());
    }
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    _renderStopwatch.start();
    final theme = Theme.of(context);
    final iconColor = theme.colorScheme.onSurface;

    final child = AnimatedScale(
      scale: widget.isSelected ? 1.08 : 1.0,
      duration: const Duration(milliseconds: 180),
      curve: Curves.easeOut,
      child: _buildAmenityIcon(widget.iconName, iconColor, widget.hasAnimation),
    );

    _renderStopwatch.stop();
    if (_renderStopwatch.elapsedMilliseconds > 16) {
      // Log if frame takes >16ms (60fps threshold)
      debugPrint('[AmenityIcon] Slow render: ${widget.iconName} took ${_renderStopwatch.elapsedMilliseconds}ms');
    }
    _renderStopwatch.reset();

    // Wrap with VisibilityDetector for animation lifecycle control
    return VisibilityDetector(
      key: Key('amenity_icon_${widget.iconName}'),
      onVisibilityChanged: (info) {
        final isVisible = info.visibleFraction > 0.1; // Consider visible if >10% shown
        if (_isVisible != isVisible) {
          setState(() {
            _isVisible = isVisible;
          });
          debugPrint('[AmenityIcon] ${widget.iconName} visibility: $_isVisible');
        }
      },
      child: child,
    );
  }

  /// Build amenity icon - chooses between Lottie animated icon and Material static icon
  Widget _buildAmenityIcon(String iconName, Color? iconColor, bool hasAnimation) {
    // Check if this icon uses Lordicon player
    if (AmenityIcon._lordiconIcons.contains(iconName)) {
      return _buildLordiconIcon(iconColor, iconName);
    }

    return SizedBox(
      width: widget.size,
      height: widget.size,
      child: hasAnimation && _isVisible // Only animate if visible
          ? _buildLottieIcon(iconName, iconColor)
          : _buildMaterialIcon(iconName, iconColor),
    );
  }

  /// Build Lordicon animated icon using Lordicon player
  Widget _buildLordiconIcon(Color? iconColor, String iconName) {
    final controller = IconController.assets(
      '${AmenityIcon._lordiconBasePath}/$iconName.json',
    );

    if (_isVisible && widget.shouldAnimate) {
      controller.addStatusListener((status) {
        if (status == ControllerStatus.ready) {
          controller.playFromBeginning();
        } else if (status == ControllerStatus.completed) {
          // Loop the animation continuously
          controller.playFromBeginning();
        }
      });
    }

    return Transform.scale(
      scale: widget.lottieScale * AmenityIcon._lordiconScaleFactor,
      child: IconViewer(
        controller: controller,
        width: widget.size,
        height: widget.size,
        colorize: iconColor,
      ),
    );
  }

  /// Build Lottie animated icon
  Widget _buildLottieIcon(String iconName, Color? iconColor) {
    // Use standard amenity path
    final lottieAssetPath = 'assets/lottie/amenities/$iconName.json';
    final effectiveScale = switch (iconName) {
      // Hot tub clean version on large 1000x1000 canvas
      'hot_tub_clean' => widget.lottieScale * 0.52, // Match Lordicon ~45dp visual size
      // BBQ grill (200x200 canvas with smoke)
      'bbq_grill' => widget.lottieScale * 0.84,
      // Ocean view animation (Lordicon 430x430 canvas)
      'ocean_view' => widget.lottieScale * 0.85,
      // Developer-supplied oceanfinal (200x200 canvas) — scale down to 50%
      'oceanfinal' => widget.lottieScale * 0.5,
      // Gym clean version on 1000x1000 canvas
      'gym_clean' => widget.lottieScale * 0.5, // Large 1000x1000 canvas scaled to icon size
      // Pool clean version on 558x558 canvas
      'pool_clean' => widget.lottieScale * 0.9, // Medium canvas needs slight reduction
      'pool_waves_new' => widget.lottieScale * 0.9, // New 558x558 wave animation
      // Pool tends to read large due to internal padding; nudge down a touch
      'pool' => widget.lottieScale * 0.95,
      'pool_v2' => widget.lottieScale * 0.95,
      'pool_swim' => widget.lottieScale * 0.95,
      'pool_swim_v2' => widget.lottieScale * 0.95,
      'pool_swim_v3' => widget.lottieScale * 0.95,
      'pool_swim_v4' => widget.lottieScale * 0.95,
      // Fire pit bonfire cleaned animation (430x430 canvas)
      'fire_pit_bonfire' => widget.lottieScale * 0.85,
      // Fire pit hover-pinch version (430x430 canvas)
      'fire_pit_hover_pinch' => widget.lottieScale * 0.64,
      _ => widget.lottieScale,
    };

    // Use LottieDelegates to directly replace colors in the animation tree
    // Use both color and strokeColor to ensure proper rendering on all platforms
    return Transform.scale(
      scale: effectiveScale,
      child: Lottie.asset(
        lottieAssetPath,
        width: widget.size,
        height: widget.size,
        fit: BoxFit.contain,
        repeat: true,
        animate: _isVisible && widget.shouldAnimate, // Pause when off-screen
        delegates: LottieDelegates(
          values: [
            ValueDelegate.color(
              const ['**'],
              value: iconColor ?? Colors.black,
            ),
            ValueDelegate.strokeColor(
              const ['**'],
              value: iconColor ?? Colors.black,
            ),
          ],
        ),
        onLoaded: (composition) {
          // ignore: avoid_print
          print('[AmenityIcon] Loaded Lottie $iconName (${composition.duration}) ${composition.endFrame}f');
        },
        errorBuilder: (context, error, stackTrace) {
          // ignore: avoid_print
          print('[AmenityIcon] ERROR loading $iconName: $error');
          return _buildMaterialIcon(iconName, iconColor);
        },
      ),
    );
  }

  /// Build Material icon (fallback or non-animated)
  Widget _buildMaterialIcon(String iconName, Color? iconColor) {
    // Prefer outlined variants where available; default Icons in many cases are already outline.
    return Icon(
      _getIconData(iconName),
      size: widget.size * 0.86,
      color: iconColor,
    );
  }

  /// Map amenity icon names to Material icons (Phase 1 placeholders)
  /// Phase 2: Replace with Lottie.asset() or SvgPicture.asset()
  IconData _getIconData(String name) {
    switch (name) {
      // Standout amenities
      case 'pool':
        return Icons.pool;
      case 'hot_tub':
        return Icons.hot_tub;
      case 'gym':
        return Icons.fitness_center;
      case 'ocean_view':
        return Icons.beach_access;
      case 'oceanfinal':
        return Icons.beach_access;
      case 'bbq_grill':
        return Icons.outdoor_grill;
      case 'fire_pit':
        return Icons.local_fire_department;
      case 'patio':
        return Icons.deck;

      // Guest essentials
      case 'wifi':
        return Icons.wifi;
      case 'wifiant':
        return Icons.wifi;
      case 'aircondt':
        return Icons.ac_unit;
      case 'wifiant':
        return Icons.wifi;
      case 'tv':
        return Icons.tv;
      case 'air_conditioning':
        return Icons.ac_unit;
      case 'tv':
        return Icons.tv;
      case 'air_conditioning':
        return Icons.ac_unit;
      case 'heating':
        return Icons.thermostat;
      case 'washer':
        return Icons.local_laundry_service;
      case 'parking':
        return Icons.local_parking;

      // Kitchen
      case 'refrigerator':
        return Icons.kitchen;
      case 'microwave':
        return Icons.microwave;
      case 'oven':
        return Icons.soup_kitchen;
      case 'stove':
        return Icons.whatshot;
      case 'coffee_maker':
        return Icons.coffee_maker;
      case 'dishwasher':
        return Icons.countertops;
      case 'dishes':
        return Icons.restaurant;
      case 'cookware':
        return Icons.set_meal;
      case 'toaster':
        return Icons.breakfast_dining;
      case 'kettle':
        return Icons.coffee;

      // Bathroom
      case 'hair_dryer':
        return Icons.air;
      case 'shampoo':
        return Icons.shower;
      case 'body_soap':
        return Icons.soap;
      case 'towels':
        return Icons.dry;
      case 'hot_water':
        return Icons.water_drop;

      // Bedroom & Laundry
      case 'hangers':
        return Icons.checkroom;
      case 'iron':
        return Icons.iron;
      case 'bed_linens':
        return Icons.bed;
      case 'extra_pillows':
        return Icons.weekend;
      case 'blackout_curtains':
        return Icons.curtains;

      // Safety
      case 'smoke_alarm':
        return Icons.smoke_free;
      case 'fire_extinguisher':
        return Icons.fire_extinguisher;
      case 'first_aid_kit':
        return Icons.medical_services;
      case 'carbon_monoxide_alarm':
        return Icons.sensors;
      case 'lock_on_door':
        return Icons.lock;

      // Internet & Office
      case 'dedicated_workspace':
        return Icons.desk;
      case 'ethernet':
        return Icons.cable;

      // Outdoor
      case 'garden':
        return Icons.grass;
      case 'outdoor_furniture':
        return Icons.chair;
      case 'outdoor_dining':
        return Icons.table_restaurant;
      case 'star':
        return Icons.star;
      case 'essentials':
        return Icons.checklist;
      case 'kitchen':
        return Icons.kitchen;
      case 'bathroom':
        return Icons.bathroom;
      case 'bedroom':
        return Icons.bed;
      case 'safety':
        return Icons.security;
      case 'outdoor':
        return Icons.park;

      default:
        return Icons.category;
    }
  }

  /// Build Lordicon animated icon using standard Lottie package
  Widget _buildLordiconWithLottie(Color? iconColor) {
    final lordIconPath = 'assets/lottie/lordamen/wired-outline-100-price-tag-sale-hover-flutter.json';
    
    return Transform.scale(
      scale: widget.lottieScale * 0.8, // Adjust scale as needed
      child: Lottie.asset(
        lordIconPath,
        width: widget.size,
        height: widget.size,
        fit: BoxFit.contain,
        repeat: true,
        animate: _isVisible && widget.shouldAnimate,
        delegates: LottieDelegates(
          values: [
            ValueDelegate.color(
              const ['**'],
              value: iconColor ?? Colors.black,
            ),
            ValueDelegate.strokeColor(
              const ['**'],
              value: iconColor ?? Colors.black,
            ),
          ],
        ),
        onLoaded: (composition) {
          print('[AmenityIcon] Loaded Lordicon $lordIconPath');
        },
        errorBuilder: (context, error, stackTrace) {
          print('[AmenityIcon] ERROR loading Lordicon: $error');
          return _buildMaterialIcon('beachfront', iconColor);
        },
      ),
    );
  }
}
