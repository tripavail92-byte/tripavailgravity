import 'package:flutter/material.dart';
import 'package:tripavail/features/hotel_manager/presentation/widgets/property_icons/base/property_icon_base.dart';

class GuesthouseIcon extends PropertyIconBase {
  const GuesthouseIcon({super.key, super.size = 80, super.isSelected = false});

  @override
  State<GuesthouseIcon> createState() => _GuesthouseIconState();
}

class _GuesthouseIconState extends PropertyIconBaseState<GuesthouseIcon> {
  @override
  CustomPainter createPainter({
    required Color strokeColor,
    required double glowOpacity,
  }) {
    return _GuesthouseIconPainter(
      glowOpacity: glowOpacity,
      isSelected: widget.isSelected,
    );
  }
}

class _GuesthouseIconPainter extends CustomPainter {
  _GuesthouseIconPainter({required this.glowOpacity, required this.isSelected});
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
                const Color(0xFF0077B6).withValues(alpha: glowOpacity * 0.35),
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

    // Garden/yard background
    final yardPaint = Paint()..color = const Color(0xFF52B788).withValues(alpha: 0.3);
    canvas.drawRect(
      Rect.fromLTWH(0, size.height * 0.7, size.width, size.height * 0.18),
      yardPaint,
    );

    // Garden flowers/plants on sides
    final plantPaint = Paint()
      ..color = const Color(0xFF2D6A4F)
      ..style = PaintingStyle.fill;
    // Left plants
    for (var i = 0; i < 3; i++) {
      canvas.drawCircle(
        Offset(size.width * (0.1 + i * 0.04), size.height * 0.78),
        size.width * 0.02,
        plantPaint,
      );
    }
    // Right plants
    for (var i = 0; i < 3; i++) {
      canvas.drawCircle(
        Offset(size.width * (0.78 + i * 0.04), size.height * 0.78),
        size.width * 0.02,
        plantPaint,
      );
    }

    // Flower colors
    final flowerPaint = Paint()..style = PaintingStyle.fill;
    final flowerColors = [
      const Color(0xFFFF006E),
      const Color(0xFFFFD60A),
      const Color(0xFFFF8500),
    ];
    for (var i = 0; i < 3; i++) {
      flowerPaint.color = flowerColors[i];
      canvas.drawCircle(
        Offset(size.width * (0.1 + i * 0.04), size.height * 0.77),
        size.width * 0.012,
        flowerPaint,
      );
      canvas.drawCircle(
        Offset(size.width * (0.78 + i * 0.04), size.height * 0.77),
        size.width * 0.012,
        flowerPaint,
      );
    }

    // Roof - dark blue gradient
    final roofPaint = Paint()
      ..shader =
          LinearGradient(
            colors: [const Color(0xFF0A0E78), const Color(0xFF03045E)],
          ).createShader(
            Rect.fromLTWH(
              size.width * 0.22,
              size.height * 0.18,
              size.width * 0.56,
              size.height * 0.17,
            ),
          );
    final roofPath = Path()
      ..moveTo(size.width * 0.22, size.height * 0.35)
      ..lineTo(size.width * 0.5, size.height * 0.18)
      ..lineTo(size.width * 0.78, size.height * 0.35)
      ..close();
    canvas.drawPath(roofPath, roofPaint);

    // Roof tiles texture
    final tilePaint = Paint()
      ..color = const Color(0xFF02024A).withValues(alpha: 0.5)
      ..strokeWidth = 1.5
      ..style = PaintingStyle.stroke;
    for (var i = 0; i < 5; i++) {
      final yPos = size.height * (0.22 + i * 0.03);
      canvas.drawLine(
        Offset(size.width * (0.28 + i * 0.03), yPos),
        Offset(size.width * (0.72 - i * 0.03), yPos),
        tilePaint,
      );
    }

    // Chimney on roof
    final chimneyPaint = Paint()
      ..color = const Color(0xFF8B4545)
      ..style = PaintingStyle.fill;
    canvas.drawRect(
      Rect.fromLTWH(
        size.width * 0.62,
        size.height * 0.24,
        size.width * 0.08,
        size.height * 0.11,
      ),
      chimneyPaint,
    );

    // Chimney brick lines
    final brickPaint = Paint()
      ..color = const Color(0xFF6B3535).withValues(alpha: 0.6)
      ..strokeWidth = 1;
    for (var i = 0; i < 3; i++) {
      canvas.drawLine(
        Offset(size.width * 0.62, size.height * (0.27 + i * 0.03)),
        Offset(size.width * 0.7, size.height * (0.27 + i * 0.03)),
        brickPaint,
      );
    }

    // Smoke from chimney
    final smokePaint = Paint()
      ..color = const Color(0xFF6C757D).withValues(alpha: 0.4)
      ..maskFilter = const MaskFilter.blur(BlurStyle.normal, 3);
    canvas.drawCircle(
      Offset(size.width * 0.66, size.height * 0.19),
      size.width * 0.022,
      smokePaint,
    );
    canvas.drawCircle(
      Offset(size.width * 0.675, size.height * 0.15),
      size.width * 0.018,
      smokePaint,
    );

    // Main house body - blue gradient
    final housePaint = Paint()
      ..shader =
          LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [
              const Color(0xFF0096C7),
              const Color(0xFF0077B6),
              const Color(0xFF005F8C),
            ],
          ).createShader(
            Rect.fromLTWH(
              size.width * 0.27,
              size.height * 0.35,
              size.width * 0.46,
              size.height * 0.45,
            ),
          );
    canvas.drawRRect(
      RRect.fromRectAndRadius(
        Rect.fromLTWH(
          size.width * 0.27,
          size.height * 0.35,
          size.width * 0.46,
          size.height * 0.45,
        ),
        const Radius.circular(6),
      ),
      housePaint,
    );

    // House outline
    final outlinePaint = Paint()
      ..color = const Color(0xFF005F8C).withValues(alpha: 0.4)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.5;
    canvas.drawRRect(
      RRect.fromRectAndRadius(
        Rect.fromLTWH(
          size.width * 0.27,
          size.height * 0.35,
          size.width * 0.46,
          size.height * 0.45,
        ),
        const Radius.circular(6),
      ),
      outlinePaint,
    );

    // Windows (2 on top, 2 on bottom) with curtains
    final windowPositions = [
      [0.36, 0.45], // Top left
      [0.58, 0.45], // Top right
      [0.36, 0.62], // Bottom left
      [0.58, 0.62], // Bottom right
    ];

    for (var pos in windowPositions) {
      final windowX = size.width * pos[0];
      final windowY = size.height * pos[1];

      // Window glow
      final windowGlow = Paint()
        ..color = const Color(0xFFFFE66D).withValues(alpha: 0.35)
        ..maskFilter = const MaskFilter.blur(BlurStyle.normal, 3);
      canvas.drawRRect(
        RRect.fromRectAndRadius(
          Rect.fromCenter(
            center: Offset(windowX, windowY),
            width: size.width * 0.12,
            height: size.height * 0.1,
          ),
          const Radius.circular(3),
        ),
        windowGlow,
      );

      // Window background (yellow/warm)
      final windowBgPaint = Paint()
        ..color = const Color(0xFFFFE66D).withValues(alpha: 0.85);
      canvas.drawRRect(
        RRect.fromRectAndRadius(
          Rect.fromCenter(
            center: Offset(windowX, windowY),
            width: size.width * 0.11,
            height: size.height * 0.095,
          ),
          const Radius.circular(3),
        ),
        windowBgPaint,
      );

      // Curtains (white semi-transparent on sides)
      final curtainPaint = Paint()
        ..color = const Color(0xFFFFFFFF).withValues(alpha: 0.4);
      canvas.drawRRect(
        RRect.fromRectAndRadius(
          Rect.fromLTWH(
            windowX - size.width * 0.053,
            windowY - size.height * 0.045,
            size.width * 0.042,
            size.height * 0.09,
          ),
          const Radius.circular(2),
        ),
        curtainPaint,
      );
      canvas.drawRRect(
        RRect.fromRectAndRadius(
          Rect.fromLTWH(
            windowX + size.width * 0.011,
            windowY - size.height * 0.045,
            size.width * 0.042,
            size.height * 0.09,
          ),
          const Radius.circular(2),
        ),
        curtainPaint,
      );

      // Window frame
      final framePaint = Paint()
        ..color = const Color(0xFFFFFFFF)
        ..style = PaintingStyle.stroke
        ..strokeWidth = 2;
      canvas.drawRRect(
        RRect.fromRectAndRadius(
          Rect.fromCenter(
            center: Offset(windowX, windowY),
            width: size.width * 0.11,
            height: size.height * 0.095,
          ),
          const Radius.circular(3),
        ),
        framePaint,
      );

      // Window panes
      canvas.drawLine(
        Offset(windowX, windowY - size.height * 0.0475),
        Offset(windowX, windowY + size.height * 0.0475),
        framePaint,
      );
      canvas.drawLine(
        Offset(windowX - size.width * 0.055, windowY),
        Offset(windowX + size.width * 0.055, windowY),
        framePaint,
      );
    }

    // Door with welcoming details
    final doorGradient = Paint()
      ..shader =
          LinearGradient(
            colors: [const Color(0xFF8B4513), const Color(0xFF6F3613)],
          ).createShader(
            Rect.fromLTWH(
              size.width * 0.43,
              size.height * 0.65,
              size.width * 0.14,
              size.height * 0.15,
            ),
          );
    canvas.drawRRect(
      RRect.fromRectAndRadius(
        Rect.fromLTWH(
          size.width * 0.43,
          size.height * 0.65,
          size.width * 0.14,
          size.height * 0.15,
        ),
        const Radius.circular(5),
      ),
      doorGradient,
    );

    // Wreath on door (green circle)
    final wreathPaint = Paint()
      ..color = const Color(0xFF2D6A4F)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 3;
    canvas.drawCircle(
      Offset(size.width * 0.5, size.height * 0.7),
      size.width * 0.035,
      wreathPaint,
    );

    // Wreath bow (red)
    final bowPaint = Paint()..color = const Color(0xFFDC2F02);
    canvas.drawCircle(
      Offset(size.width * 0.5, size.height * 0.665),
      size.width * 0.012,
      bowPaint,
    );

    // Door knob
    canvas.drawCircle(
      Offset(size.width * 0.54, size.height * 0.735),
      size.width * 0.012,
      Paint()..color = const Color(0xFFFFD60A),
    );

    // Welcome mat/step
    final matGradient = Paint()
      ..shader =
          LinearGradient(
            colors: [
              const Color(0xFF8B4513).withValues(alpha: 0.8),
              const Color(0xFF6F3613).withValues(alpha: 0.6),
            ],
          ).createShader(
            Rect.fromLTWH(
              size.width * 0.4,
              size.height * 0.795,
              size.width * 0.2,
              size.height * 0.025,
            ),
          );
    canvas.drawRRect(
      RRect.fromRectAndRadius(
        Rect.fromLTWH(
          size.width * 0.4,
          size.height * 0.795,
          size.width * 0.2,
          size.height * 0.025,
        ),
        const Radius.circular(1),
      ),
      matGradient,
    );

    // Shadow
    final shadowPaint = Paint()
      ..shader =
          RadialGradient(
            colors: [
              Colors.black.withValues(alpha: 0.18),
              Colors.black.withValues(alpha: 0.08),
              Colors.transparent,
            ],
          ).createShader(
            Rect.fromCenter(
              center: Offset(size.width * 0.5, size.height * 0.87),
              width: size.width * 0.6,
              height: size.height * 0.1,
            ),
          );
    canvas.drawOval(
      Rect.fromCenter(
        center: Offset(size.width * 0.5, size.height * 0.87),
        width: size.width * 0.6,
        height: size.height * 0.09,
      ),
      shadowPaint,
    );
  }

  @override
  bool shouldRepaint(_GuesthouseIconPainter old) =>
      old.glowOpacity != glowOpacity || old.isSelected != isSelected;
}

