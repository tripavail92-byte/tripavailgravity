import 'dart:async';
import 'package:flutter/material.dart';

class PropertyTypeIcon extends StatefulWidget {
  final double size;
  final bool isActive;

  const PropertyTypeIcon({super.key, this.size = 80, this.isActive = false});

  @override
  State<PropertyTypeIcon> createState() => _PropertyTypeIconState();
}

class _PropertyTypeIconState extends State<PropertyTypeIcon>
    with SingleTickerProviderStateMixin {
  static const List<Map<String, dynamic>> propertyTypes = [
    {'name': 'Hotel', 'floors': 5},
    {'name': 'Inn', 'floors': 3},
    {'name': 'Resort', 'floors': 4},
    {'name': 'Motel', 'floors': 2},
    {'name': 'Lodge', 'floors': 3},
    {'name': 'Boutique', 'floors': 4},
    {'name': 'Hostel', 'floors': 3},
    {'name': 'Guesthouse', 'floors': 2},
  ];

  int _currentIndex = 0;
  late Timer _timer;
  late AnimationController _animController;

  @override
  void initState() {
    super.initState();
    _animController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 600),
    );
    _animController.forward();

    _timer = Timer.periodic(const Duration(seconds: 3), (timer) {
      setState(() {
        _currentIndex = (_currentIndex + 1) % propertyTypes.length;
      });
      _animController.forward(from: 0.0);
    });
  }

  @override
  void dispose() {
    _timer.cancel();
    _animController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final colorPrimary = isDark
        ? const Color(0xFFE5E5E5)
        : const Color(0xFF666666);
    final colorSecondary = isDark
        ? const Color(0xFFB8B8B8)
        : const Color(0xFF888888);

    final currentType = propertyTypes[_currentIndex];
    final floors = currentType['floors'] as int;

    return SizedBox(
      width: widget.size,
      height: widget.size,
      child: AnimatedBuilder(
        animation: _animController,
        builder: (context, child) {
          final animationValue = _animController.value;
          return Opacity(
            opacity: animationValue,
            child: Transform.translate(
              offset: Offset(0, 20 * (1 - animationValue)),
              child: Transform.scale(
                scale: 0.8 + 0.2 * animationValue,
                child: child,
              ),
            ),
          );
        },
        child: CustomPaint(
          painter: _PropertyTypePainter(
            floors: floors,
            colorPrimary: colorPrimary,
            colorSecondary: colorSecondary,
            propertyName: currentType['name'] as String,
          ),
        ),
      ),
    );
  }
}

class _PropertyTypePainter extends CustomPainter {
  final int floors;
  final Color colorPrimary;
  final Color colorSecondary;
  final String propertyName;

  _PropertyTypePainter({
    required this.floors,
    required this.colorPrimary,
    required this.colorSecondary,
    required this.propertyName,
  });

  @override
  void paint(Canvas canvas, Size size) {
    final width = size.width;
    final height = size.height;

    // Shadow base
    final shadowPaint = Paint()..color = colorPrimary.withValues(alpha:0.08);
    canvas.drawOval(
      Rect.fromCenter(
        center: Offset(width / 2, height * 0.88),
        width: width * 0.6,
        height: height * 0.15,
      ),
      shadowPaint,
    );

    // Main building
    final buildingPaint = Paint()
      ..style = PaintingStyle.stroke
      ..color = colorPrimary
      ..strokeWidth = 2.0;

    final buildingRect = Rect.fromLTWH(
      width * 0.21,
      height * 0.28,
      width * 0.58,
      floors * (height * 0.08),
    );
    final buildingRRect = RRect.fromRectAndRadius(
      buildingRect,
      const Radius.circular(4),
    );
    canvas.drawRRect(buildingRRect, buildingPaint);

    // Windows grid
    final windowPaint = Paint()
      ..style = PaintingStyle.stroke
      ..color = colorSecondary
      ..strokeWidth = 1.5;
    for (int floor = 0; floor < floors; floor++) {
      for (int col = 0; col < 4; col++) {
        final x = width * (0.27 + col * 0.14);
        final y = height * (0.22 + floor * 0.08);
        final windowRect = RRect.fromRectAndRadius(
          Rect.fromLTWH(x, y, width * 0.06, height * 0.05),
          const Radius.circular(1),
        );
        canvas.drawRRect(windowRect, windowPaint);
      }
    }

    // Door
    final doorPaint = Paint()
      ..style = PaintingStyle.stroke
      ..color = colorPrimary
      ..strokeWidth = 2.0;
    final doorRect = Rect.fromLTWH(
      width * 0.43,
      height * 0.72,
      width * 0.13,
      height * 0.12,
    );
    canvas.drawRRect(
      RRect.fromRectAndRadius(doorRect, const Radius.circular(2)),
      doorPaint,
    );

    // Property name text
    final textSpan = TextSpan(
      text: propertyName,
      style: TextStyle(
        color: colorPrimary,
        fontSize: width * 0.11,
        fontWeight: FontWeight.bold,
      ),
    );
    final textPainter = TextPainter(
      text: textSpan,
      textDirection: TextDirection.ltr,
    );
    textPainter.layout();
    final textX = (width - textPainter.width) / 2;
    textPainter.paint(canvas, Offset(textX, height * 0.05));
  }

  @override
  bool shouldRepaint(covariant _PropertyTypePainter old) {
    return old.floors != floors ||
        old.colorPrimary != colorPrimary ||
        old.colorSecondary != colorSecondary ||
        old.propertyName != propertyName;
  }
}
