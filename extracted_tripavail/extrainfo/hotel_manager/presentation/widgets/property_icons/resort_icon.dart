import 'dart:math';

import 'package:flutter/material.dart';
import 'package:tripavail/features/hotel_manager/presentation/widgets/property_icons/base/property_icon_base.dart';

class ResortIcon extends PropertyIconBase {
  const ResortIcon({super.key, super.size = 80, super.isSelected = false});

  @override
  State<ResortIcon> createState() => _ResortIconState();
}

class _ResortIconState extends PropertyIconBaseState<ResortIcon> {
  @override
  CustomPainter createPainter({
    required Color strokeColor,
    required double glowOpacity,
  }) {
    return _ResortIconPainter(
      glowOpacity: glowOpacity,
      isSelected: widget.isSelected,
    );
  }
}

class _ResortIconPainter extends CustomPainter {
  _ResortIconPainter({required this.glowOpacity, required this.isSelected});
  final double glowOpacity;
  final bool isSelected;

  @override
  void paint(Canvas canvas, Size size) {
    // Glow effect when selected
    if (isSelected && glowOpacity > 0) {
      final glowPaint = Paint()
        ..shader =
            RadialGradient(
              colors: [
                const Color(0xFFFF8500).withValues(alpha: glowOpacity * 0.3),
                Colors.transparent,
              ],
            ).createShader(
              Rect.fromCircle(
                center: Offset(size.width / 2, size.height / 2),
                radius: size.width * 0.5,
              ),
            );
      canvas.drawCircle(
        Offset(size.width / 2, size.height / 2),
        size.width * 0.5,
        glowPaint,
      );
    }

    // Sun in top right corner with rays
    final sunGradient = Paint()
      ..shader =
          RadialGradient(
            colors: [
              const Color(0xFFFFE66D),
              const Color(0xFFFFD60A),
              const Color(0xFFFFAA00),
            ],
          ).createShader(
            Rect.fromCircle(
              center: Offset(size.width * 0.82, size.height * 0.18),
              radius: size.width * 0.08,
            ),
          );
    canvas.drawCircle(
      Offset(size.width * 0.82, size.height * 0.18),
      size.width * 0.08,
      sunGradient,
    );

    // Sun rays
    final rayPaint = Paint()
      ..color = const Color(0xFFFFD60A).withValues(alpha: 0.6)
      ..strokeWidth = 2
      ..strokeCap = StrokeCap.round;
    for (var i = 0; i < 8; i++) {
      final angle = (i * 3.14159 * 2 / 8);
      final startRadius = size.width * 0.1;
      final endRadius = size.width * 0.14;
      canvas.drawLine(
        Offset(
          size.width * 0.82 + startRadius * cos(angle),
          size.height * 0.18 + startRadius * sin(angle),
        ),
        Offset(
          size.width * 0.82 + endRadius * cos(angle),
          size.height * 0.18 + endRadius * sin(angle),
        ),
        rayPaint,
      );
    }

    // Main building - vibrant orange/yellow gradient
    final buildingPaint = Paint()
      ..shader =
          LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [
              const Color(0xFFFFB84D),
              const Color(0xFFFF8500),
              const Color(0xFFFFAA00),
              const Color(0xFFE69500),
            ],
          ).createShader(
            Rect.fromLTWH(
              size.width * 0.32,
              size.height * 0.22,
              size.width * 0.46,
              size.height * 0.38,
            ),
          );
    canvas.drawRRect(
      RRect.fromRectAndRadius(
        Rect.fromLTWH(
          size.width * 0.32,
          size.height * 0.22,
          size.width * 0.46,
          size.height * 0.38,
        ),
        const Radius.circular(6),
      ),
      buildingPaint,
    );

    // Building windows - 3x3 grid with varied colors
    for (var row = 0; row < 3; row++) {
      for (var col = 0; col < 3; col++) {
        final windowPaint = Paint()
          ..color = (row + col) % 2 == 0
              ? const Color(0xFF90E0EF).withValues(alpha: 0.8)
              : const Color(0xFF4CC9F0).withValues(alpha: 0.7);
        canvas.drawRRect(
          RRect.fromRectAndRadius(
            Rect.fromCenter(
              center: Offset(
                size.width * (0.4 + col * 0.13),
                size.height * (0.3 + row * 0.1),
              ),
              width: size.width * 0.08,
              height: size.height * 0.06,
            ),
            const Radius.circular(2),
          ),
          windowPaint,
        );
      }
    }

    // Palm tree trunk on left
    final trunkPaint = Paint()
      ..color = const Color(0xFF8B4513)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 4
      ..strokeCap = StrokeCap.round;
    final trunkPath = Path()
      ..moveTo(size.width * 0.15, size.height * 0.65)
      ..quadraticBezierTo(
        size.width * 0.13,
        size.height * 0.45,
        size.width * 0.17,
        size.height * 0.28,
      );
    canvas.drawPath(trunkPath, trunkPaint);

    // Palm fronds (5 fronds)
    final frondPaint = Paint()
      ..color = const Color(0xFF2D6A4F)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 3
      ..strokeCap = StrokeCap.round;
    final fronds = [
      [0.17, 0.28, 0.22, 0.18], // Top right
      [0.17, 0.28, 0.12, 0.19], // Top left
      [0.17, 0.28, 0.24, 0.25], // Right
      [0.17, 0.28, 0.10, 0.26], // Left
      [0.17, 0.28, 0.17, 0.16], // Top
    ];
    for (var frond in fronds) {
      canvas.drawLine(
        Offset(size.width * frond[0], size.height * frond[1]),
        Offset(size.width * frond[2], size.height * frond[3]),
        frondPaint,
      );
    }

    // Pool with ripples - layered blues
    final poolBase = Paint()
      ..shader =
          RadialGradient(
            colors: [
              const Color(0xFF90E0EF),
              const Color(0xFF4CC9F0),
              const Color(0xFF00B4D8),
            ],
          ).createShader(
            Rect.fromCenter(
              center: Offset(size.width * 0.55, size.height * 0.7),
              width: size.width * 0.35,
              height: size.height * 0.16,
            ),
          );
    canvas.drawOval(
      Rect.fromCenter(
        center: Offset(size.width * 0.55, size.height * 0.7),
        width: size.width * 0.35,
        height: size.height * 0.14,
      ),
      poolBase,
    );

    // Pool ripples
    final ripplePaint = Paint()
      ..color = const Color(0xFF90E0EF).withValues(alpha: 0.5)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.5;
    canvas.drawOval(
      Rect.fromCenter(
        center: Offset(size.width * 0.55, size.height * 0.7),
        width: size.width * 0.28,
        height: size.height * 0.11,
      ),
      ripplePaint,
    );
    canvas.drawOval(
      Rect.fromCenter(
        center: Offset(size.width * 0.55, size.height * 0.7),
        width: size.width * 0.22,
        height: size.height * 0.09,
      ),
      ripplePaint,
    );

    // Beach umbrella on right
    final umbrellaPole = Paint()
      ..color = const Color(0xFF8B4513)
      ..strokeWidth = 2
      ..strokeCap = StrokeCap.round;
    canvas.drawLine(
      Offset(size.width * 0.78, size.height * 0.68),
      Offset(size.width * 0.78, size.height * 0.5),
      umbrellaPole,
    );

    // Umbrella top
    final umbrellaTop = Paint()
      ..shader =
          RadialGradient(
            colors: [const Color(0xFFFF6B6B), const Color(0xFFEE5A6F)],
          ).createShader(
            Rect.fromCenter(
              center: Offset(size.width * 0.78, size.height * 0.5),
              width: size.width * 0.12,
              height: size.height * 0.08,
            ),
          );
    final umbrellaPath = Path()
      ..moveTo(size.width * 0.72, size.height * 0.5)
      ..quadraticBezierTo(
        size.width * 0.78,
        size.height * 0.46,
        size.width * 0.84,
        size.height * 0.5,
      )
      ..lineTo(size.width * 0.78, size.height * 0.5)
      ..close();
    canvas.drawPath(umbrellaPath, umbrellaTop);

    // Umbrella segments
    final segmentPaint = Paint()
      ..color = const Color(0xFFCC0000).withValues(alpha: 0.4)
      ..strokeWidth = 1;
    for (var i = 0; i < 3; i++) {
      canvas.drawLine(
        Offset(size.width * 0.78, size.height * 0.5),
        Offset(size.width * (0.72 + i * 0.04), size.height * 0.5),
        segmentPaint,
      );
    }

    // Lounge chair
    final chairPaint = Paint()
      ..color = const Color(0xFFFFFFFF).withValues(alpha: 0.9)
      ..strokeWidth = 2
      ..style = PaintingStyle.stroke;
    canvas.drawRRect(
      RRect.fromRectAndRadius(
        Rect.fromLTWH(
          size.width * 0.73,
          size.height * 0.685,
          size.width * 0.08,
          size.height * 0.04,
        ),
        const Radius.circular(1),
      ),
      chairPaint,
    );

    // Shadow
    final shadowPaint = Paint()
      ..shader =
          RadialGradient(
            colors: [
              Colors.black.withValues(alpha: 0.15),
              Colors.black.withValues(alpha: 0.05),
              Colors.transparent,
            ],
          ).createShader(
            Rect.fromCenter(
              center: Offset(size.width * 0.5, size.height * 0.86),
              width: size.width * 0.6,
              height: size.height * 0.1,
            ),
          );
    canvas.drawOval(
      Rect.fromCenter(
        center: Offset(size.width * 0.5, size.height * 0.86),
        width: size.width * 0.6,
        height: size.height * 0.09,
      ),
      shadowPaint,
    );
  }

  @override
  bool shouldRepaint(_ResortIconPainter old) =>
      old.glowOpacity != glowOpacity || old.isSelected != isSelected;
}

