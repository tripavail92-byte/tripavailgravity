import 'package:flutter/material.dart';
import 'package:tripavail/features/hotel_manager/presentation/widgets/property_icons/base/property_icon_base.dart';

class BoutiqueIcon extends PropertyIconBase {
  const BoutiqueIcon({super.key, super.size = 80, super.isSelected = false});

  @override
  State<BoutiqueIcon> createState() => _BoutiqueIconState();
}

class _BoutiqueIconState extends PropertyIconBaseState<BoutiqueIcon> {
  @override
  CustomPainter createPainter({
    required Color strokeColor,
    required double glowOpacity,
  }) {
    return _BoutiqueIconPainter(
      glowOpacity: glowOpacity,
      isSelected: widget.isSelected,
    );
  }
}

class _BoutiqueIconPainter extends CustomPainter {
  _BoutiqueIconPainter({required this.glowOpacity, required this.isSelected});
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
                const Color(0xFFFF006E).withValues(alpha: glowOpacity * 0.35),
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

    // Main building - vibrant pink/magenta gradient with multiple stops
    final buildingPaint = Paint()
      ..shader =
          LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [
              const Color(0xFFFF4C8C),
              const Color(0xFFFF006E),
              const Color(0xFFD90368),
              const Color(0xFFC4035F),
            ],
          ).createShader(
            Rect.fromLTWH(
              size.width * 0.28,
              size.height * 0.25,
              size.width * 0.44,
              size.height * 0.55,
            ),
          );
    canvas.drawRRect(
      RRect.fromRectAndRadius(
        Rect.fromLTWH(
          size.width * 0.28,
          size.height * 0.25,
          size.width * 0.44,
          size.height * 0.55,
        ),
        const Radius.circular(8),
      ),
      buildingPaint,
    );

    // Building outline for depth
    final outlinePaint = Paint()
      ..color = const Color(0xFFD90368).withValues(alpha: 0.4)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.5;
    canvas.drawRRect(
      RRect.fromRectAndRadius(
        Rect.fromLTWH(
          size.width * 0.28,
          size.height * 0.25,
          size.width * 0.44,
          size.height * 0.55,
        ),
        const Radius.circular(8),
      ),
      outlinePaint,
    );

    // Decorative top ornament - gold circle with shine
    final accentGradient = Paint()
      ..shader =
          RadialGradient(
            colors: [
              const Color(0xFFFFE66D),
              const Color(0xFFFFD60A),
              const Color(0xFFFFC300),
            ],
          ).createShader(
            Rect.fromCircle(
              center: Offset(size.width * 0.5, size.height * 0.22),
              radius: size.width * 0.055,
            ),
          );
    canvas.drawCircle(
      Offset(size.width * 0.5, size.height * 0.22),
      size.width * 0.055,
      accentGradient,
    );
    // Gold ornament highlight
    final shinePaint = Paint()
      ..color = const Color(0xFFFFFFFF).withValues(alpha: 0.6)
      ..style = PaintingStyle.fill;
    canvas.drawCircle(
      Offset(size.width * 0.492, size.height * 0.215),
      size.width * 0.02,
      shinePaint,
    );

    // Decorative awning with stripes and depth
    final awningBasePaint = Paint()
      ..color = const Color(0xFFFF85A2).withValues(alpha: 0.3)
      ..style = PaintingStyle.fill;
    canvas.drawRRect(
      RRect.fromRectAndRadius(
        Rect.fromLTWH(
          size.width * 0.26,
          size.height * 0.35,
          size.width * 0.48,
          size.height * 0.058,
        ),
        const Radius.circular(3),
      ),
      awningBasePaint,
    );

    // Awning stripes - alternating white and pink
    for (var i = 0; i < 6; i++) {
      final stripePaint = Paint()
        ..color = i % 2 == 0
            ? const Color(0xFFFFFFFF).withValues(alpha: 0.95)
            : const Color(0xFFFF85A2).withValues(alpha: 0.8)
        ..style = PaintingStyle.fill;
      canvas.drawRRect(
        RRect.fromRectAndRadius(
          Rect.fromLTWH(
            size.width * (0.26 + i * 0.08),
            size.height * 0.35,
            size.width * 0.08,
            size.height * 0.055,
          ),
          const Radius.circular(2),
        ),
        stripePaint,
      );
    }

    // Awning scalloped edge
    final scallopPaint = Paint()
      ..color = const Color(0xFFFF006E).withValues(alpha: 0.6)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 2;
    for (var i = 0; i < 6; i++) {
      final arcRect = Rect.fromLTWH(
        size.width * (0.26 + i * 0.08),
        size.height * 0.398,
        size.width * 0.08,
        size.height * 0.015,
      );
      canvas.drawArc(arcRect, 0, 3.14, false, scallopPaint);
    }

    // Windows (2x3 grid) with frames and details
    for (var row = 0; row < 3; row++) {
      for (var col = 0; col < 2; col++) {
        final x = size.width * (0.365 + col * 0.22);
        final y = size.height * (0.45 + row * 0.11);

        // Window glow
        final windowGlow = Paint()
          ..color = const Color(0xFFFFE5EC).withValues(alpha: 0.4)
          ..maskFilter = const MaskFilter.blur(BlurStyle.normal, 2);
        canvas.drawRRect(
          RRect.fromRectAndRadius(
            Rect.fromCenter(
              center: Offset(x, y),
              width: size.width * 0.13,
              height: size.height * 0.08,
            ),
            const Radius.circular(4),
          ),
          windowGlow,
        );

        // Window background
        final windowPaint = Paint()
          ..color = const Color(0xFFFFE5EC).withValues(alpha: 0.95);
        canvas.drawRRect(
          RRect.fromRectAndRadius(
            Rect.fromCenter(
              center: Offset(x, y),
              width: size.width * 0.12,
              height: size.height * 0.075,
            ),
            const Radius.circular(4),
          ),
          windowPaint,
        );

        // Window dividers
        final dividerPaint = Paint()
          ..color = const Color(0xFFFF006E).withValues(alpha: 0.3)
          ..strokeWidth = 1.2
          ..style = PaintingStyle.stroke;
        canvas.drawLine(
          Offset(x, y - size.height * 0.0375),
          Offset(x, y + size.height * 0.0375),
          dividerPaint,
        );
        canvas.drawLine(
          Offset(x - size.width * 0.06, y),
          Offset(x + size.width * 0.06, y),
          dividerPaint,
        );
      }
    }

    // Entrance canopy
    final canopyPaint = Paint()
      ..color = const Color(0xFFFF4C8C).withValues(alpha: 0.4);
    canvas.drawRRect(
      RRect.fromRectAndRadius(
        Rect.fromLTWH(
          size.width * 0.38,
          size.height * 0.655,
          size.width * 0.24,
          size.height * 0.03,
        ),
        const Radius.circular(2),
      ),
      canopyPaint,
    );

    // Door - elegant white with gradient
    final doorGradient = Paint()
      ..shader =
          LinearGradient(
            colors: [const Color(0xFFFFFFFF), const Color(0xFFF8F8F8)],
          ).createShader(
            Rect.fromLTWH(
              size.width * 0.41,
              size.height * 0.68,
              size.width * 0.18,
              size.height * 0.12,
            ),
          );
    canvas.drawRRect(
      RRect.fromRectAndRadius(
        Rect.fromLTWH(
          size.width * 0.41,
          size.height * 0.68,
          size.width * 0.18,
          size.height * 0.12,
        ),
        const Radius.circular(5),
      ),
      doorGradient,
    );

    // Door frame accent
    final doorFramePaint = Paint()
      ..color = const Color(0xFFFF006E).withValues(alpha: 0.2)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 2;
    canvas.drawRRect(
      RRect.fromRectAndRadius(
        Rect.fromLTWH(
          size.width * 0.41,
          size.height * 0.68,
          size.width * 0.18,
          size.height * 0.12,
        ),
        const Radius.circular(5),
      ),
      doorFramePaint,
    );

    // Door handle - gold with shine
    final handleGradient = Paint()
      ..shader =
          LinearGradient(
            colors: [const Color(0xFFFFE66D), const Color(0xFFFFD60A)],
          ).createShader(
            Rect.fromCircle(
              center: Offset(size.width * 0.54, size.height * 0.74),
              radius: size.width * 0.018,
            ),
          );
    canvas.drawCircle(
      Offset(size.width * 0.54, size.height * 0.74),
      size.width * 0.018,
      handleGradient,
    );
    final handleShine = Paint()
      ..color = const Color(0xFFFFFFFF).withValues(alpha: 0.7);
    canvas.drawCircle(
      Offset(size.width * 0.538, size.height * 0.737),
      size.width * 0.007,
      handleShine,
    );

    // Entrance step
    final stepPaint = Paint()
      ..color = const Color(0xFFFF006E).withValues(alpha: 0.15);
    canvas.drawRRect(
      RRect.fromRectAndRadius(
        Rect.fromLTWH(
          size.width * 0.39,
          size.height * 0.795,
          size.width * 0.22,
          size.height * 0.015,
        ),
        const Radius.circular(1),
      ),
      stepPaint,
    );

    // Shadow with realistic gradient
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
              center: Offset(size.width * 0.5, size.height * 0.86),
              width: size.width * 0.5,
              height: size.height * 0.1,
            ),
          );
    canvas.drawOval(
      Rect.fromCenter(
        center: Offset(size.width * 0.5, size.height * 0.86),
        width: size.width * 0.5,
        height: size.height * 0.09,
      ),
      shadowPaint,
    );
  }

  @override
  bool shouldRepaint(_BoutiqueIconPainter old) =>
      old.glowOpacity != glowOpacity || old.isSelected != isSelected;
}

