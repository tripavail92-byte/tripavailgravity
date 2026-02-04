import 'package:flutter/material.dart';
import 'package:tripavail/features/hotel_manager/presentation/widgets/property_icons/base/property_icon_base.dart';

class HotelIcon extends PropertyIconBase {
  const HotelIcon({super.key, super.size = 80, super.isSelected = false});

  @override
  State<HotelIcon> createState() => _HotelIconState();
}

class _HotelIconState extends PropertyIconBaseState<HotelIcon> {
  @override
  CustomPainter createPainter({
    required Color strokeColor,
    required double glowOpacity,
  }) {
    return _HotelIconPainter(
      glowOpacity: glowOpacity,
      isSelected: widget.isSelected,
    );
  }
}

class _HotelIconPainter extends CustomPainter {
  _HotelIconPainter({required this.glowOpacity, required this.isSelected});
  final double glowOpacity;
  final bool isSelected;

  @override
  void paint(Canvas canvas, Size size) {
    // Background gradient glow when selected
    if (isSelected && glowOpacity > 0) {
      final glowPaint = Paint()
        ..shader =
            RadialGradient(
              colors: [
                const Color(0xFF9D4EDD).withValues(alpha: glowOpacity * 0.3),
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

    // Main building body - vibrant purple gradient
    final buildingPaint = Paint()
      ..shader =
          LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [
              const Color(0xFFB06BF5),
              const Color(0xFF9D4EDD),
              const Color(0xFF7B2CBF),
            ],
          ).createShader(
            Rect.fromLTWH(
              size.width * 0.25,
              size.height * 0.28,
              size.width * 0.5,
              size.height * 0.52,
            ),
          );

    canvas.drawRRect(
      RRect.fromRectAndRadius(
        Rect.fromLTWH(
          size.width * 0.25,
          size.height * 0.28,
          size.width * 0.5,
          size.height * 0.52,
        ),
        const Radius.circular(6),
      ),
      buildingPaint,
    );

    // Building outline for definition
    final outlinePaint = Paint()
      ..color = const Color(0xFF7B2CBF).withValues(alpha: 0.3)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.5;
    canvas.drawRRect(
      RRect.fromRectAndRadius(
        Rect.fromLTWH(
          size.width * 0.25,
          size.height * 0.28,
          size.width * 0.5,
          size.height * 0.52,
        ),
        const Radius.circular(6),
      ),
      outlinePaint,
    );

    // Awning/roof - cyan with gradient
    final awningGradientPaint = Paint()
      ..shader =
          LinearGradient(
            colors: [
              const Color(0xFF5DD9F0),
              const Color(0xFF4CC9F0),
              const Color(0xFF3AB5D6),
            ],
          ).createShader(
            Rect.fromLTWH(
              size.width * 0.2,
              size.height * 0.15,
              size.width * 0.6,
              size.height * 0.13,
            ),
          );

    final awningPath = Path()
      ..moveTo(size.width * 0.2, size.height * 0.28)
      ..lineTo(size.width * 0.5, size.height * 0.15)
      ..lineTo(size.width * 0.8, size.height * 0.28)
      ..close();
    canvas.drawPath(awningPath, awningGradientPaint);

    // Awning shadow/depth
    final awningEdgePaint = Paint()
      ..color = const Color(0xFF3AB5D6)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 2;
    canvas.drawPath(awningPath, awningEdgePaint);

    // Hotel sign on awning - golden
    final signPaint = Paint()
      ..shader =
          LinearGradient(
            colors: [const Color(0xFFFFE66D), const Color(0xFFFFD60A)],
          ).createShader(
            Rect.fromCenter(
              center: Offset(size.width * 0.5, size.height * 0.22),
              width: size.width * 0.15,
              height: size.height * 0.07,
            ),
          );
    canvas.drawRRect(
      RRect.fromRectAndRadius(
        Rect.fromCenter(
          center: Offset(size.width * 0.5, size.height * 0.22),
          width: size.width * 0.15,
          height: size.height * 0.07,
        ),
        const Radius.circular(3),
      ),
      signPaint,
    );

    // Windows - detailed grid with frames (4x3)
    for (var row = 0; row < 4; row++) {
      for (var col = 0; col < 3; col++) {
        final x = size.width * (0.3 + col * 0.15);
        final y = size.height * (0.36 + row * 0.095);

        final isLit = (row + col) % 2 == 0;

        // Window glow for lit windows
        if (isLit) {
          final glowPaint = Paint()
            ..color = const Color(0xFFFFD60A).withValues(alpha: 0.3)
            ..maskFilter = const MaskFilter.blur(BlurStyle.normal, 3);
          canvas.drawRRect(
            RRect.fromRectAndRadius(
              Rect.fromCenter(
                center: Offset(x, y),
                width: size.width * 0.095,
                height: size.height * 0.07,
              ),
              const Radius.circular(2),
            ),
            glowPaint,
          );
        }

        // Window background
        final windowBgPaint = Paint()
          ..color = isLit
              ? const Color(0xFFFFE66D)
              : const Color(0xFF3F37C9).withValues(alpha: 0.6)
          ..style = PaintingStyle.fill;

        canvas.drawRRect(
          RRect.fromRectAndRadius(
            Rect.fromCenter(
              center: Offset(x, y),
              width: size.width * 0.085,
              height: size.height * 0.065,
            ),
            const Radius.circular(2),
          ),
          windowBgPaint,
        );

        // Window frame/divider
        final framePaint = Paint()
          ..color = const Color(0xFF7B2CBF).withValues(alpha: 0.8)
          ..strokeWidth = 1
          ..style = PaintingStyle.stroke;
        canvas.drawLine(
          Offset(x, y - size.height * 0.0325),
          Offset(x, y + size.height * 0.0325),
          framePaint,
        );
        canvas.drawLine(
          Offset(x - size.width * 0.0425, y),
          Offset(x + size.width * 0.0425, y),
          framePaint,
        );
      }
    }

    // Entrance canopy
    final canopyPaint = Paint()
      ..color = const Color(0xFF7B2CBF).withValues(alpha: 0.4)
      ..style = PaintingStyle.fill;
    canvas.drawRect(
      Rect.fromLTWH(
        size.width * 0.38,
        size.height * 0.65,
        size.width * 0.24,
        size.height * 0.03,
      ),
      canopyPaint,
    );

    // Door - detailed with panels
    final doorGradient = Paint()
      ..shader =
          LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [const Color(0xFF4056A1), const Color(0xFF3F37C9)],
          ).createShader(
            Rect.fromLTWH(
              size.width * 0.42,
              size.height * 0.68,
              size.width * 0.16,
              size.height * 0.12,
            ),
          );

    canvas.drawRRect(
      RRect.fromRectAndRadius(
        Rect.fromLTWH(
          size.width * 0.42,
          size.height * 0.68,
          size.width * 0.16,
          size.height * 0.12,
        ),
        const Radius.circular(4),
      ),
      doorGradient,
    );

    // Door panels
    final panelPaint = Paint()
      ..color = const Color(0xFF2D2654).withValues(alpha: 0.3)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.5;
    canvas.drawRRect(
      RRect.fromRectAndRadius(
        Rect.fromLTWH(
          size.width * 0.44,
          size.height * 0.69,
          size.width * 0.12,
          size.height * 0.05,
        ),
        const Radius.circular(2),
      ),
      panelPaint,
    );
    canvas.drawRRect(
      RRect.fromRectAndRadius(
        Rect.fromLTWH(
          size.width * 0.44,
          size.height * 0.745,
          size.width * 0.12,
          size.height * 0.045,
        ),
        const Radius.circular(2),
      ),
      panelPaint,
    );

    // Door handle - gold with shine
    final handlePaint = Paint()
      ..color = const Color(0xFFFFD60A)
      ..style = PaintingStyle.fill;
    canvas.drawCircle(
      Offset(size.width * 0.54, size.height * 0.74),
      size.width * 0.015,
      handlePaint,
    );
    final handleShine = Paint()
      ..color = const Color(0xFFFFE66D)
      ..style = PaintingStyle.fill;
    canvas.drawCircle(
      Offset(size.width * 0.5385, size.height * 0.7385),
      size.width * 0.006,
      handleShine,
    );

    // Steps leading to door
    for (var i = 0; i < 2; i++) {
      final stepPaint = Paint()
        ..color = const Color(0xFF7B2CBF).withValues(alpha: 0.2 + i * 0.1)
        ..style = PaintingStyle.fill;
      canvas.drawRect(
        Rect.fromLTWH(
          size.width * 0.4,
          size.height * (0.78 + i * 0.015),
          size.width * 0.2,
          size.height * 0.012,
        ),
        stepPaint,
      );
    }

    // Shadow at bottom - more realistic
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
  bool shouldRepaint(covariant _HotelIconPainter oldDelegate) {
    return oldDelegate.glowOpacity != glowOpacity ||
        oldDelegate.isSelected != isSelected;
  }
}

