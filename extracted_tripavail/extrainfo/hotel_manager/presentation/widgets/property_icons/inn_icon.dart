import 'package:flutter/material.dart';
import 'package:tripavail/features/hotel_manager/presentation/widgets/property_icons/base/property_icon_base.dart';

class InnIcon extends PropertyIconBase {
  const InnIcon({super.key, super.size = 80, super.isSelected = false});

  @override
  State<InnIcon> createState() => _InnIconState();
}

class _InnIconState extends PropertyIconBaseState<InnIcon> {
  @override
  CustomPainter createPainter({
    required Color strokeColor,
    required double glowOpacity,
  }) {
    return _InnIconPainter(
      glowOpacity: glowOpacity,
      isSelected: widget.isSelected,
    );
  }
}

class _InnIconPainter extends CustomPainter {
  _InnIconPainter({required this.glowOpacity, required this.isSelected});
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
                const Color(0xFFDC2F02).withValues(alpha: glowOpacity * 0.35),
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

    // INN sign at top with decorative frame
    final signBoardPaint = Paint()
      ..shader =
          LinearGradient(
            colors: [
              const Color(0xFFFFE66D),
              const Color(0xFFFFD60A),
              const Color(0xFFFFC300),
            ],
          ).createShader(
            Rect.fromCenter(
              center: Offset(size.width * 0.5, size.height * 0.22),
              width: size.width * 0.32,
              height: size.height * 0.09,
            ),
          );
    canvas.drawRRect(
      RRect.fromRectAndRadius(
        Rect.fromCenter(
          center: Offset(size.width * 0.5, size.height * 0.22),
          width: size.width * 0.32,
          height: size.height * 0.09,
        ),
        const Radius.circular(4),
      ),
      signBoardPaint,
    );

    // Sign border/frame
    final signFramePaint = Paint()
      ..color = const Color(0xFF8B4513)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 2.5;
    canvas.drawRRect(
      RRect.fromRectAndRadius(
        Rect.fromCenter(
          center: Offset(size.width * 0.5, size.height * 0.22),
          width: size.width * 0.32,
          height: size.height * 0.09,
        ),
        const Radius.circular(4),
      ),
      signFramePaint,
    );

    // INN text representation (3 letters as rectangles)
    final letterPaint = Paint()
      ..color = const Color(0xFFDC2F02)
      ..style = PaintingStyle.fill;
    for (var i = 0; i < 3; i++) {
      canvas.drawRRect(
        RRect.fromRectAndRadius(
          Rect.fromCenter(
            center: Offset(size.width * (0.4 + i * 0.1), size.height * 0.22),
            width: size.width * 0.055,
            height: size.height * 0.05,
          ),
          const Radius.circular(1),
        ),
        letterPaint,
      );
    }

    // Sign hanging chains
    final chainPaint = Paint()
      ..color = const Color(0xFF8B4513)
      ..strokeWidth = 1.5
      ..strokeCap = StrokeCap.round;
    canvas.drawLine(
      Offset(size.width * 0.36, size.height * 0.175),
      Offset(size.width * 0.36, size.height * 0.27),
      chainPaint,
    );
    canvas.drawLine(
      Offset(size.width * 0.64, size.height * 0.175),
      Offset(size.width * 0.64, size.height * 0.27),
      chainPaint,
    );

    // Main building - vibrant red gradient
    final buildingPaint = Paint()
      ..shader =
          LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [
              const Color(0xFFE63946),
              const Color(0xFFDC2F02),
              const Color(0xFFB82601),
            ],
          ).createShader(
            Rect.fromLTWH(
              size.width * 0.28,
              size.height * 0.3,
              size.width * 0.44,
              size.height * 0.5,
            ),
          );
    canvas.drawRRect(
      RRect.fromRectAndRadius(
        Rect.fromLTWH(
          size.width * 0.28,
          size.height * 0.3,
          size.width * 0.44,
          size.height * 0.5,
        ),
        const Radius.circular(6),
      ),
      buildingPaint,
    );

    // Building outline
    final outlinePaint = Paint()
      ..color = const Color(0xFFB82601).withValues(alpha: 0.4)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.5;
    canvas.drawRRect(
      RRect.fromRectAndRadius(
        Rect.fromLTWH(
          size.width * 0.28,
          size.height * 0.3,
          size.width * 0.44,
          size.height * 0.5,
        ),
        const Radius.circular(6),
      ),
      outlinePaint,
    );

    // Windows with shutters (2x2 grid)
    for (var row = 0; row < 2; row++) {
      for (var col = 0; col < 2; col++) {
        final windowX = size.width * (0.36 + col * 0.22);
        final windowY = size.height * (0.4 + row * 0.15);

        // Shutters (left and right)
        final shutterPaint = Paint()
          ..color = const Color(0xFF2D3142)
          ..style = PaintingStyle.fill;
        // Left shutter
        canvas.drawRect(
          Rect.fromLTWH(
            windowX - size.width * 0.065,
            windowY - size.height * 0.045,
            size.width * 0.025,
            size.height * 0.09,
          ),
          shutterPaint,
        );
        // Right shutter
        canvas.drawRect(
          Rect.fromLTWH(
            windowX + size.width * 0.04,
            windowY - size.height * 0.045,
            size.width * 0.025,
            size.height * 0.09,
          ),
          shutterPaint,
        );

        // Window glow
        final windowGlow = Paint()
          ..color = const Color(0xFFFFE66D).withValues(alpha: 0.4)
          ..maskFilter = const MaskFilter.blur(BlurStyle.normal, 3);
        canvas.drawRRect(
          RRect.fromRectAndRadius(
            Rect.fromCenter(
              center: Offset(windowX, windowY),
              width: size.width * 0.11,
              height: size.height * 0.09,
            ),
            const Radius.circular(3),
          ),
          windowGlow,
        );

        // Window background (warm yellow)
        final windowBgPaint = Paint()
          ..color = const Color(0xFFFFE66D).withValues(alpha: 0.9);
        canvas.drawRRect(
          RRect.fromRectAndRadius(
            Rect.fromCenter(
              center: Offset(windowX, windowY),
              width: size.width * 0.1,
              height: size.height * 0.085,
            ),
            const Radius.circular(3),
          ),
          windowBgPaint,
        );

        // Window frame
        final windowFramePaint = Paint()
          ..color = const Color(0xFF8B4513)
          ..style = PaintingStyle.stroke
          ..strokeWidth = 2;
        canvas.drawRRect(
          RRect.fromRectAndRadius(
            Rect.fromCenter(
              center: Offset(windowX, windowY),
              width: size.width * 0.1,
              height: size.height * 0.085,
            ),
            const Radius.circular(3),
          ),
          windowFramePaint,
        );

        // Window panes (4 panes)
        final panePaint = Paint()
          ..color = const Color(0xFF8B4513)
          ..strokeWidth = 1.5;
        canvas.drawLine(
          Offset(windowX, windowY - size.height * 0.0425),
          Offset(windowX, windowY + size.height * 0.0425),
          panePaint,
        );
        canvas.drawLine(
          Offset(windowX - size.width * 0.05, windowY),
          Offset(windowX + size.width * 0.05, windowY),
          panePaint,
        );

        // Curtain hint (small detail)
        final curtainPaint = Paint()
          ..color = const Color(0xFFFFFFFF).withValues(alpha: 0.3);
        canvas.drawRRect(
          RRect.fromRectAndRadius(
            Rect.fromLTWH(
              windowX - size.width * 0.048,
              windowY - size.height * 0.04,
              size.width * 0.045,
              size.height * 0.08,
            ),
            const Radius.circular(2),
          ),
          curtainPaint,
        );
      }
    }

    // Entrance canopy
    final canopyPaint = Paint()
      ..color = const Color(0xFF8B4513).withValues(alpha: 0.7);
    canvas.drawRect(
      Rect.fromLTWH(
        size.width * 0.36,
        size.height * 0.67,
        size.width * 0.28,
        size.height * 0.03,
      ),
      canopyPaint,
    );

    // Door with detailed panels
    final doorGradient = Paint()
      ..shader =
          LinearGradient(
            colors: [const Color(0xFF8B4513), const Color(0xFF6F3613)],
          ).createShader(
            Rect.fromLTWH(
              size.width * 0.4,
              size.height * 0.7,
              size.width * 0.2,
              size.height * 0.1,
            ),
          );
    canvas.drawRRect(
      RRect.fromRectAndRadius(
        Rect.fromLTWH(
          size.width * 0.4,
          size.height * 0.7,
          size.width * 0.2,
          size.height * 0.1,
        ),
        const Radius.circular(5),
      ),
      doorGradient,
    );

    // Door panels (3 panels)
    final doorPanelPaint = Paint()
      ..color = const Color(0xFF4A2C0D).withValues(alpha: 0.5)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.5;
    for (var i = 0; i < 3; i++) {
      canvas.drawRRect(
        RRect.fromRectAndRadius(
          Rect.fromLTWH(
            size.width * 0.415,
            size.height * (0.715 + i * 0.025),
            size.width * 0.17,
            size.height * 0.02,
          ),
          const Radius.circular(1),
        ),
        doorPanelPaint,
      );
    }

    // Door knob (gold)
    final knobGradient = Paint()
      ..shader =
          RadialGradient(
            colors: [const Color(0xFFFFE66D), const Color(0xFFFFD60A)],
          ).createShader(
            Rect.fromCircle(
              center: Offset(size.width * 0.56, size.height * 0.75),
              radius: size.width * 0.015,
            ),
          );
    canvas.drawCircle(
      Offset(size.width * 0.56, size.height * 0.75),
      size.width * 0.015,
      knobGradient,
    );

    // Welcome mat
    final matPaint = Paint()..color = const Color(0xFF8B4513).withValues(alpha: 0.6);
    canvas.drawRRect(
      RRect.fromRectAndRadius(
        Rect.fromLTWH(
          size.width * 0.39,
          size.height * 0.795,
          size.width * 0.22,
          size.height * 0.02,
        ),
        const Radius.circular(1),
      ),
      matPaint,
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
  bool shouldRepaint(_InnIconPainter old) =>
      old.glowOpacity != glowOpacity || old.isSelected != isSelected;
}

