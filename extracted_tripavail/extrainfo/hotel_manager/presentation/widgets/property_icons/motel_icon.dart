import 'package:flutter/material.dart';
import 'package:tripavail/features/hotel_manager/presentation/widgets/property_icons/base/property_icon_base.dart';

class MotelIcon extends PropertyIconBase {
  const MotelIcon({super.key, super.size = 80, super.isSelected = false});

  @override
  State<MotelIcon> createState() => _MotelIconState();
}

class _MotelIconState extends PropertyIconBaseState<MotelIcon> {
  @override
  CustomPainter createPainter({
    required Color strokeColor,
    required double glowOpacity,
  }) {
    return _MotelIconPainter(
      glowOpacity: glowOpacity,
      isSelected: widget.isSelected,
    );
  }
}

class _MotelIconPainter extends CustomPainter {
  _MotelIconPainter({required this.glowOpacity, required this.isSelected});
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
                const Color(0xFF2B2D42).withValues(alpha: glowOpacity * 0.4),
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

    // Night sky or background
    final skyPaint = Paint()..color = const Color(0xFF1A1B26).withValues(alpha: 0.3);
    canvas.drawRect(
      Rect.fromLTWH(0, 0, size.width, size.height * 0.35),
      skyPaint,
    );

    // MOTEL neon sign at top
    final signBoardPaint = Paint()
      ..color = const Color(0xFF3A3D52)
      ..style = PaintingStyle.fill;
    canvas.drawRRect(
      RRect.fromRectAndRadius(
        Rect.fromCenter(
          center: Offset(size.width * 0.5, size.height * 0.2),
          width: size.width * 0.35,
          height: size.height * 0.08,
        ),
        const Radius.circular(4),
      ),
      signBoardPaint,
    );

    // Neon glow effect on sign
    final neonGlow = Paint()
      ..color = const Color(0xFFD00000).withValues(alpha: 0.6)
      ..maskFilter = const MaskFilter.blur(BlurStyle.normal, 4);
    canvas.drawRRect(
      RRect.fromRectAndRadius(
        Rect.fromCenter(
          center: Offset(size.width * 0.5, size.height * 0.2),
          width: size.width * 0.33,
          height: size.height * 0.06,
        ),
        const Radius.circular(3),
      ),
      neonGlow,
    );

    // MOTEL text representation (M O T E L as rectangles)
    final textPaint = Paint()
      ..color = const Color(0xFFFF4444)
      ..style = PaintingStyle.fill;
    final letterWidth = size.width * 0.04;
    final letterSpacing = size.width * 0.06;
    for (var i = 0; i < 5; i++) {
      canvas.drawRRect(
        RRect.fromRectAndRadius(
          Rect.fromCenter(
            center: Offset(
              size.width * 0.36 + i * letterSpacing,
              size.height * 0.2,
            ),
            width: letterWidth,
            height: size.height * 0.045,
          ),
          const Radius.circular(1),
        ),
        textPaint,
      );
    }

    // Main building - dark with gradient
    final buildingPaint = Paint()
      ..shader =
          LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [const Color(0xFF2B2D42), const Color(0xFF1F2132)],
          ).createShader(
            Rect.fromLTWH(
              size.width * 0.18,
              size.height * 0.32,
              size.width * 0.64,
              size.height * 0.48,
            ),
          );
    canvas.drawRRect(
      RRect.fromRectAndRadius(
        Rect.fromLTWH(
          size.width * 0.18,
          size.height * 0.32,
          size.width * 0.64,
          size.height * 0.48,
        ),
        const Radius.circular(4),
      ),
      buildingPaint,
    );

    // Roof overhang
    final roofPaint = Paint()
      ..color = const Color(0xFF1A1B26)
      ..style = PaintingStyle.fill;
    canvas.drawRect(
      Rect.fromLTWH(
        size.width * 0.16,
        size.height * 0.32,
        size.width * 0.68,
        size.height * 0.025,
      ),
      roofPaint,
    );

    // Room doors with details (5 doors)
    for (var i = 0; i < 5; i++) {
      final doorX = size.width * (0.22 + i * 0.125);
      final doorY = size.height * 0.52;

      // Door light glow above each door
      final lightGlow = Paint()
        ..color = const Color(0xFFFFD60A).withValues(alpha: 0.3)
        ..maskFilter = const MaskFilter.blur(BlurStyle.normal, 3);
      canvas.drawCircle(
        Offset(doorX + size.width * 0.04, doorY - size.height * 0.06),
        size.width * 0.02,
        lightGlow,
      );
      canvas.drawCircle(
        Offset(doorX + size.width * 0.04, doorY - size.height * 0.06),
        size.width * 0.015,
        Paint()..color = const Color(0xFFFFD60A),
      );

      // Door background gradient
      final doorGradient = Paint()
        ..shader =
            LinearGradient(
              colors: [const Color(0xFFD00000), const Color(0xFFA00000)],
            ).createShader(
              Rect.fromLTWH(
                doorX,
                doorY,
                size.width * 0.09,
                size.height * 0.24,
              ),
            );
      canvas.drawRRect(
        RRect.fromRectAndRadius(
          Rect.fromLTWH(doorX, doorY, size.width * 0.09, size.height * 0.24),
          const Radius.circular(3),
        ),
        doorGradient,
      );

      // Door panel details
      final panelPaint = Paint()
        ..color = const Color(0xFF8B0000).withValues(alpha: 0.6)
        ..style = PaintingStyle.stroke
        ..strokeWidth = 1;
      canvas.drawRRect(
        RRect.fromRectAndRadius(
          Rect.fromLTWH(
            doorX + size.width * 0.01,
            doorY + size.height * 0.02,
            size.width * 0.07,
            size.height * 0.09,
          ),
          const Radius.circular(2),
        ),
        panelPaint,
      );
      canvas.drawRRect(
        RRect.fromRectAndRadius(
          Rect.fromLTWH(
            doorX + size.width * 0.01,
            doorY + size.height * 0.13,
            size.width * 0.07,
            size.height * 0.09,
          ),
          const Radius.circular(2),
        ),
        panelPaint,
      );

      // Door knob
      canvas.drawCircle(
        Offset(doorX + size.width * 0.075, doorY + size.height * 0.15),
        size.width * 0.008,
        Paint()..color = const Color(0xFFFFD60A),
      );

      // Room number above door
      final numberPaint = Paint()
        ..color = const Color(0xFFFFFFFF).withValues(alpha: 0.9)
        ..style = PaintingStyle.fill;
      canvas.drawRRect(
        RRect.fromRectAndRadius(
          Rect.fromCenter(
            center: Offset(
              doorX + size.width * 0.045,
              doorY - size.height * 0.03,
            ),
            width: size.width * 0.035,
            height: size.height * 0.025,
          ),
          const Radius.circular(1),
        ),
        numberPaint,
      );
    }

    // Parking lot at bottom
    final parkingPaint = Paint()
      ..color = const Color(0xFF3A3D52).withValues(alpha: 0.5);
    canvas.drawRect(
      Rect.fromLTWH(
        size.width * 0.1,
        size.height * 0.78,
        size.width * 0.8,
        size.height * 0.1,
      ),
      parkingPaint,
    );

    // Parking lines (5 spaces)
    final linePaint = Paint()
      ..color = const Color(0xFFFFFFFF).withValues(alpha: 0.4)
      ..strokeWidth = 1.5;
    for (var i = 0; i <= 5; i++) {
      canvas.drawLine(
        Offset(size.width * (0.1 + i * 0.16), size.height * 0.78),
        Offset(size.width * (0.1 + i * 0.16), size.height * 0.88),
        linePaint,
      );
    }

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
              center: Offset(size.width * 0.5, size.height * 0.87),
              width: size.width * 0.7,
              height: size.height * 0.08,
            ),
          );
    canvas.drawOval(
      Rect.fromCenter(
        center: Offset(size.width * 0.5, size.height * 0.87),
        width: size.width * 0.7,
        height: size.height * 0.08,
      ),
      shadowPaint,
    );
  }

  @override
  bool shouldRepaint(_MotelIconPainter old) =>
      old.glowOpacity != glowOpacity || old.isSelected != isSelected;
}

