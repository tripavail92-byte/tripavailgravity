import 'package:flutter/material.dart';
import 'package:tripavail/features/hotel_manager/presentation/widgets/property_icons/base/property_icon_base.dart';

class LodgeIcon extends PropertyIconBase {
  const LodgeIcon({super.key, super.size = 80, super.isSelected = false});

  @override
  State<LodgeIcon> createState() => _LodgeIconState();
}

class _LodgeIconState extends PropertyIconBaseState<LodgeIcon> {
  @override
  CustomPainter createPainter({
    required Color strokeColor,
    required double glowOpacity,
  }) {
    return _LodgeIconPainter(
      glowOpacity: glowOpacity,
      isSelected: widget.isSelected,
    );
  }
}

class _LodgeIconPainter extends CustomPainter {
  _LodgeIconPainter({required this.glowOpacity, required this.isSelected});
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
                const Color(0xFF8B4513).withValues(alpha: glowOpacity * 0.3),
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

    // Forest/mountain background
    final bgPaint = Paint()..color = const Color(0xFF2D6A4F).withValues(alpha: 0.2);
    canvas.drawRect(
      Rect.fromLTWH(0, 0, size.width, size.height * 0.4),
      bgPaint,
    );

    // Mountain silhouette
    final mountainPaint = Paint()
      ..color = const Color(0xFF52796F).withValues(alpha: 0.4);
    final mountainPath = Path()
      ..moveTo(0, size.height * 0.35)
      ..lineTo(size.width * 0.3, size.height * 0.15)
      ..lineTo(size.width * 0.6, size.height * 0.35)
      ..lineTo(0, size.height * 0.35)
      ..close();
    canvas.drawPath(mountainPath, mountainPaint);

    final mountain2Path = Path()
      ..moveTo(size.width * 0.4, size.height * 0.35)
      ..lineTo(size.width * 0.7, size.height * 0.2)
      ..lineTo(size.width, size.height * 0.35)
      ..lineTo(size.width * 0.4, size.height * 0.35)
      ..close();
    canvas.drawPath(mountain2Path, mountainPaint);

    // Stone foundation
    final stonePaint = Paint()
      ..color = const Color(0xFF6C757D)
      ..style = PaintingStyle.fill;
    canvas.drawRect(
      Rect.fromLTWH(
        size.width * 0.27,
        size.height * 0.72,
        size.width * 0.46,
        size.height * 0.08,
      ),
      stonePaint,
    );

    // Stone texture
    final stoneLinePaint = Paint()
      ..color = const Color(0xFF495057).withValues(alpha: 0.5)
      ..strokeWidth = 1;
    for (var i = 0; i < 3; i++) {
      canvas.drawLine(
        Offset(size.width * 0.27, size.height * (0.72 + i * 0.027)),
        Offset(size.width * 0.73, size.height * (0.72 + i * 0.027)),
        stoneLinePaint,
      );
    }

    // Main cabin body - wood gradient
    final cabinPaint = Paint()
      ..shader =
          LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [
              const Color(0xFFA0653A),
              const Color(0xFF8B4513),
              const Color(0xFF6F3613),
            ],
          ).createShader(
            Rect.fromLTWH(
              size.width * 0.27,
              size.height * 0.38,
              size.width * 0.46,
              size.height * 0.34,
            ),
          );
    canvas.drawRRect(
      RRect.fromRectAndRadius(
        Rect.fromLTWH(
          size.width * 0.27,
          size.height * 0.38,
          size.width * 0.46,
          size.height * 0.34,
        ),
        const Radius.circular(4),
      ),
      cabinPaint,
    );

    // Wood log lines (horizontal logs)
    final logPaint = Paint()
      ..color = const Color(0xFF654321).withValues(alpha: 0.7)
      ..strokeWidth = 2.5
      ..strokeCap = StrokeCap.round;
    for (var i = 0; i < 6; i++) {
      canvas.drawLine(
        Offset(size.width * 0.27, size.height * (0.4 + i * 0.055)),
        Offset(size.width * 0.73, size.height * (0.4 + i * 0.055)),
        logPaint,
      );
    }

    // Wood grain texture on logs
    final grainPaint = Paint()
      ..color = const Color(0xFF4A2C0D).withValues(alpha: 0.3)
      ..strokeWidth = 0.8;
    for (var i = 0; i < 6; i++) {
      for (var j = 0; j < 8; j++) {
        canvas.drawLine(
          Offset(
            size.width * (0.3 + j * 0.055),
            size.height * (0.4 + i * 0.055 - 0.008),
          ),
          Offset(
            size.width * (0.3 + j * 0.055),
            size.height * (0.4 + i * 0.055 + 0.008),
          ),
          grainPaint,
        );
      }
    }

    // Roof - dark brown with gradient
    final roofPaint = Paint()
      ..shader =
          LinearGradient(
            colors: [const Color(0xFF654321), const Color(0xFF4A2C0D)],
          ).createShader(
            Rect.fromLTWH(
              size.width * 0.22,
              size.height * 0.18,
              size.width * 0.56,
              size.height * 0.2,
            ),
          );
    final roofPath = Path()
      ..moveTo(size.width * 0.22, size.height * 0.38)
      ..lineTo(size.width * 0.5, size.height * 0.18)
      ..lineTo(size.width * 0.78, size.height * 0.38)
      ..close();
    canvas.drawPath(roofPath, roofPaint);

    // Roof edge/overhang
    final roofEdgePaint = Paint()
      ..color = const Color(0xFF4A2C0D)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 3
      ..strokeCap = StrokeCap.round;
    canvas.drawLine(
      Offset(size.width * 0.22, size.height * 0.38),
      Offset(size.width * 0.5, size.height * 0.18),
      roofEdgePaint,
    );
    canvas.drawLine(
      Offset(size.width * 0.5, size.height * 0.18),
      Offset(size.width * 0.78, size.height * 0.38),
      roofEdgePaint,
    );

    // Chimney with bricks
    final chimneyPaint = Paint()
      ..color = const Color(0xFF8B4545)
      ..style = PaintingStyle.fill;
    canvas.drawRect(
      Rect.fromLTWH(
        size.width * 0.62,
        size.height * 0.22,
        size.width * 0.09,
        size.height * 0.16,
      ),
      chimneyPaint,
    );

    // Chimney brick lines
    final brickPaint = Paint()
      ..color = const Color(0xFF6B3535).withValues(alpha: 0.6)
      ..strokeWidth = 1;
    for (var i = 0; i < 4; i++) {
      canvas.drawLine(
        Offset(size.width * 0.62, size.height * (0.26 + i * 0.04)),
        Offset(size.width * 0.71, size.height * (0.26 + i * 0.04)),
        brickPaint,
      );
    }

    // Smoke from chimney
    final smokePaint = Paint()
      ..color = const Color(0xFF6C757D).withValues(alpha: 0.4)
      ..maskFilter = const MaskFilter.blur(BlurStyle.normal, 3);
    canvas.drawCircle(
      Offset(size.width * 0.665, size.height * 0.17),
      size.width * 0.025,
      smokePaint,
    );
    canvas.drawCircle(
      Offset(size.width * 0.68, size.height * 0.13),
      size.width * 0.02,
      smokePaint,
    );
    canvas.drawCircle(
      Offset(size.width * 0.695, size.height * 0.095),
      size.width * 0.018,
      smokePaint,
    );

    // Windows (2) with frames
    for (var i = 0; i < 2; i++) {
      final windowX = size.width * (0.34 + i * 0.24);
      final windowY = size.height * 0.52;

      // Window glow (warm light inside)
      final glowWarmPaint = Paint()
        ..color = const Color(0xFFFFD60A).withValues(alpha: 0.3)
        ..maskFilter = const MaskFilter.blur(BlurStyle.normal, 3);
      canvas.drawRRect(
        RRect.fromRectAndRadius(
          Rect.fromCenter(
            center: Offset(windowX, windowY),
            width: size.width * 0.13,
            height: size.height * 0.1,
          ),
          const Radius.circular(3),
        ),
        glowWarmPaint,
      );

      // Window background (yellow/warm)
      final windowBgPaint = Paint()
        ..color = const Color(0xFFFFE66D).withValues(alpha: 0.8);
      canvas.drawRRect(
        RRect.fromRectAndRadius(
          Rect.fromCenter(
            center: Offset(windowX, windowY),
            width: size.width * 0.12,
            height: size.height * 0.095,
          ),
          const Radius.circular(3),
        ),
        windowBgPaint,
      );

      // Window frame (dark wood)
      final framePaint = Paint()
        ..color = const Color(0xFF4A2C0D)
        ..style = PaintingStyle.stroke
        ..strokeWidth = 2;
      canvas.drawRRect(
        RRect.fromRectAndRadius(
          Rect.fromCenter(
            center: Offset(windowX, windowY),
            width: size.width * 0.12,
            height: size.height * 0.095,
          ),
          const Radius.circular(3),
        ),
        framePaint,
      );

      // Window panes (cross)
      canvas.drawLine(
        Offset(windowX, windowY - size.height * 0.0475),
        Offset(windowX, windowY + size.height * 0.0475),
        framePaint,
      );
      canvas.drawLine(
        Offset(windowX - size.width * 0.06, windowY),
        Offset(windowX + size.width * 0.06, windowY),
        framePaint,
      );
    }

    // Door with panels
    final doorGradient = Paint()
      ..shader =
          LinearGradient(
            colors: [const Color(0xFF6F3613), const Color(0xFF4A2C0D)],
          ).createShader(
            Rect.fromLTWH(
              size.width * 0.43,
              size.height * 0.58,
              size.width * 0.14,
              size.height * 0.14,
            ),
          );
    canvas.drawRRect(
      RRect.fromRectAndRadius(
        Rect.fromLTWH(
          size.width * 0.43,
          size.height * 0.58,
          size.width * 0.14,
          size.height * 0.14,
        ),
        const Radius.circular(4),
      ),
      doorGradient,
    );

    // Door panels
    final doorPanelPaint = Paint()
      ..color = const Color(0xFF3A1C0D).withValues(alpha: 0.5)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.5;
    canvas.drawRRect(
      RRect.fromRectAndRadius(
        Rect.fromLTWH(
          size.width * 0.445,
          size.height * 0.595,
          size.width * 0.11,
          size.height * 0.05,
        ),
        const Radius.circular(2),
      ),
      doorPanelPaint,
    );
    canvas.drawRRect(
      RRect.fromRectAndRadius(
        Rect.fromLTWH(
          size.width * 0.445,
          size.height * 0.66,
          size.width * 0.11,
          size.height * 0.05,
        ),
        const Radius.circular(2),
      ),
      doorPanelPaint,
    );

    // Door knob
    canvas.drawCircle(
      Offset(size.width * 0.54, size.height * 0.65),
      size.width * 0.012,
      Paint()..color = const Color(0xFFFFD60A),
    );

    // Shadow
    final shadowPaint = Paint()
      ..shader =
          RadialGradient(
            colors: [
              Colors.black.withValues(alpha: 0.2),
              Colors.black.withValues(alpha: 0.08),
              Colors.transparent,
            ],
          ).createShader(
            Rect.fromCenter(
              center: Offset(size.width * 0.5, size.height * 0.86),
              width: size.width * 0.55,
              height: size.height * 0.1,
            ),
          );
    canvas.drawOval(
      Rect.fromCenter(
        center: Offset(size.width * 0.5, size.height * 0.86),
        width: size.width * 0.55,
        height: size.height * 0.09,
      ),
      shadowPaint,
    );
  }

  @override
  bool shouldRepaint(_LodgeIconPainter old) =>
      old.glowOpacity != glowOpacity || old.isSelected != isSelected;
}

