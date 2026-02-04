// File: lib/features/hotel_manager/widgets/property_icons/base/property_icon_base.dart
// Purpose: Shared base widget & theme for animated property icons.
// Usage: Extend PropertyIconBase and implement createPainter() in each icon.
//
// ✅ TripAvail Coding Standards v2 applied
// ✅ Const constructors where possible
// ✅ SingleTickerProviderStateMixin with proper dispose
// ✅ No external assets (pure vector)
// ✅ Mobile-friendly "on-select" animation only

import 'package:flutter/material.dart';

class PropertyIconTheme {
  const PropertyIconTheme._();

  static const Color baseStroke = Color(0xFF6B7280); // Neutral gray
  static const Color selectedStrokeA = Color(0xFF9D4EDD); // Purple
  static const Color selectedStrokeB = Color(0xFF00D4FF); // Cyan
  static const Color accent = Color(0xFFF59E0B); // Amber
}

/// Base widget for all animated property icons.
abstract class PropertyIconBase extends StatefulWidget {
  final double size;
  final bool isSelected;

  const PropertyIconBase({super.key, this.size = 80, this.isSelected = false});
}

abstract class PropertyIconBaseState<T extends PropertyIconBase>
    extends State<T>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller;
  late final Animation<Color?> _strokeAnimation;
  late final Animation<double> _glowAnimation;

  Color get baseStroke => PropertyIconTheme.baseStroke;
  Color get accent => PropertyIconTheme.accent;

  @override
  void initState() {
    super.initState();

    _controller = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 2),
    );

    _strokeAnimation = ColorTween(
      begin: PropertyIconTheme.selectedStrokeA,
      end: PropertyIconTheme.selectedStrokeB,
    ).animate(CurvedAnimation(parent: _controller, curve: Curves.easeInOut));

    _glowAnimation = Tween<double>(
      begin: 0.0,
      end: 0.25,
    ).animate(CurvedAnimation(parent: _controller, curve: Curves.easeInOut));

    if (widget.isSelected) {
      _controller.repeat(reverse: true);
    }
  }

  @override
  void didUpdateWidget(covariant T oldWidget) {
    super.didUpdateWidget(oldWidget);

    if (widget.isSelected && !_controller.isAnimating) {
      _controller.repeat(reverse: true);
    } else if (!widget.isSelected && _controller.isAnimating) {
      _controller.stop();
      _controller.reset();
    }
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  /// Subclasses must provide a painter that uses [strokeColor] and [glowOpacity].
  CustomPainter createPainter({
    required Color strokeColor,
    required double glowOpacity,
  });

  @override
  Widget build(BuildContext context) {
    return AnimatedScale(
      scale: widget.isSelected ? 1.05 : 1.0,
      duration: const Duration(milliseconds: 200),
      curve: Curves.easeOut,
      child: AnimatedBuilder(
        animation: _controller,
        builder: (context, _) {
          final strokeColor = widget.isSelected
              ? (_strokeAnimation.value ?? PropertyIconTheme.selectedStrokeA)
              : baseStroke;

          final glowOpacity = widget.isSelected ? _glowAnimation.value : 0.0;

          return CustomPaint(
            size: Size(widget.size, widget.size),
            painter: createPainter(
              strokeColor: strokeColor,
              glowOpacity: glowOpacity,
            ),
          );
        },
      ),
    );
  }
}
