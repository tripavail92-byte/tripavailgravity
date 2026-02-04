import 'package:flutter/material.dart';
import 'package:tripavail/features/hotel_manager/presentation/widgets/property_icons/base/property_icon_base.dart';

class HostelIcon extends PropertyIconBase {
  const HostelIcon({super.key, super.size = 80, super.isSelected = false});

  @override
  State<HostelIcon> createState() => _HostelIconState();
}

class _HostelIconState extends PropertyIconBaseState<HostelIcon> {
  @override
  CustomPainter createPainter({
    required Color strokeColor,
    required double glowOpacity,
  }) {
    return _HostelIconPainter(
      glowOpacity: glowOpacity,
      isSelected: widget.isSelected,
    );
  }
}

class _HostelIconPainter extends CustomPainter {
  _HostelIconPainter({required this.glowOpacity, required this.isSelected});
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
                const Color(0xFF06A77D).withValues(alpha: glowOpacity * 0.35),
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

    // Main building - vibrant teal/green gradient (3 floors)
    final buildingPaint = Paint()
      ..shader =
          LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [
              const Color(0xFF10D4AA),
              const Color(0xFF06A77D),
              const Color(0xFF048A63),
            ],
          ).createShader(
            Rect.fromLTWH(
              size.width * 0.26,
              size.height * 0.22,
              size.width * 0.48,
              size.height * 0.58,
            ),
          );
    canvas.drawRRect(
      RRect.fromRectAndRadius(
        Rect.fromLTWH(
          size.width * 0.26,
          size.height * 0.22,
          size.width * 0.48,
          size.height * 0.58,
        ),
        const Radius.circular(6),
      ),
      buildingPaint,
    );

    // Building outline
    final outlinePaint = Paint()
      ..color = const Color(0xFF048A63).withValues(alpha: 0.4)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.5;
    canvas.drawRRect(
      RRect.fromRectAndRadius(
        Rect.fromLTWH(
          size.width * 0.26,
          size.height * 0.22,
          size.width * 0.48,
          size.height * 0.58,
        ),
        const Radius.circular(6),
      ),
      outlinePaint,
    );

    // Floor separation lines
    final floorLinePaint = Paint()
      ..color = const Color(0xFF048A63).withValues(alpha: 0.5)
      ..strokeWidth = 2;
    canvas.drawLine(
      Offset(size.width * 0.26, size.height * 0.42),
      Offset(size.width * 0.74, size.height * 0.42),
      floorLinePaint,
    );
    canvas.drawLine(
      Offset(size.width * 0.26, size.height * 0.61),
      Offset(size.width * 0.74, size.height * 0.61),
      floorLinePaint,
    );

    // HOSTEL sign at top
    final signPaint = Paint()
      ..color = const Color(0xFFFFD60A)
      ..style = PaintingStyle.fill;
    canvas.drawRRect(
      RRect.fromRectAndRadius(
        Rect.fromCenter(
          center: Offset(size.width * 0.5, size.height * 0.15),
          width: size.width * 0.38,
          height: size.height * 0.06,
        ),
        const Radius.circular(3),
      ),
      signPaint,
    );

    // Sign text representation (HOSTEL as 6 rectangles)
    final letterPaint = Paint()
      ..color = const Color(0xFF06A77D)
      ..style = PaintingStyle.fill;
    for (var i = 0; i < 6; i++) {
      canvas.drawRRect(
        RRect.fromRectAndRadius(
          Rect.fromCenter(
            center: Offset(size.width * (0.33 + i * 0.057), size.height * 0.15),
            width: size.width * 0.04,
            height: size.height * 0.035,
          ),
          const Radius.circular(1),
        ),
        letterPaint,
      );
    }

    // Windows with bunk beds visible (3 floors, 2 windows per floor)
    for (var floor = 0; floor < 3; floor++) {
      for (var col = 0; col < 2; col++) {
        final windowX = size.width * (0.35 + col * 0.22);
        final windowY = size.height * (0.32 + floor * 0.19);

        // Window background (white/bright)
        final windowBgPaint = Paint()
          ..color = const Color(0xFFFFFFFF).withValues(alpha: 0.9);
        canvas.drawRRect(
          RRect.fromRectAndRadius(
            Rect.fromCenter(
              center: Offset(windowX, windowY),
              width: size.width * 0.15,
              height: size.height * 0.12,
            ),
            const Radius.circular(3),
          ),
          windowBgPaint,
        );

        // Window frame
        final framePaint = Paint()
          ..color = const Color(0xFF048A63)
          ..style = PaintingStyle.stroke
          ..strokeWidth = 2;
        canvas.drawRRect(
          RRect.fromRectAndRadius(
            Rect.fromCenter(
              center: Offset(windowX, windowY),
              width: size.width * 0.15,
              height: size.height * 0.12,
            ),
            const Radius.circular(3),
          ),
          framePaint,
        );

        // Bunk bed visible through window (simplified representation)
        final bunkPaint = Paint()
          ..color = const Color(0xFF8B4513)
          ..style = PaintingStyle.fill;

        // Top bunk
        canvas.drawRect(
          Rect.fromLTWH(
            windowX - size.width * 0.06,
            windowY - size.height * 0.035,
            size.width * 0.12,
            size.height * 0.015,
          ),
          bunkPaint,
        );
        // Bottom bunk
        canvas.drawRect(
          Rect.fromLTWH(
            windowX - size.width * 0.06,
            windowY + size.height * 0.02,
            size.width * 0.12,
            size.height * 0.015,
          ),
          bunkPaint,
        );

        // Bunk posts
        canvas.drawRect(
          Rect.fromLTWH(
            windowX - size.width * 0.063,
            windowY - size.height * 0.04,
            size.width * 0.01,
            size.height * 0.08,
          ),
          bunkPaint,
        );
        canvas.drawRect(
          Rect.fromLTWH(
            windowX + size.width * 0.053,
            windowY - size.height * 0.04,
            size.width * 0.01,
            size.height * 0.08,
          ),
          bunkPaint,
        );

        // Bedding/pillows (colorful)
        final beddingColors = [
          const Color(0xFFFF006E),
          const Color(0xFF3A86FF),
          const Color(0xFFFFD60A),
        ];
        final beddingPaint = Paint()
          ..color = beddingColors[floor]
          ..style = PaintingStyle.fill;

        // Top bed pillow
        canvas.drawRRect(
          RRect.fromRectAndRadius(
            Rect.fromLTWH(
              windowX - size.width * 0.05,
              windowY - size.height * 0.045,
              size.width * 0.035,
              size.height * 0.012,
            ),
            const Radius.circular(1),
          ),
          beddingPaint,
        );
        // Bottom bed pillow
        canvas.drawRRect(
          RRect.fromRectAndRadius(
            Rect.fromLTWH(
              windowX - size.width * 0.05,
              windowY + size.height * 0.01,
              size.width * 0.035,
              size.height * 0.012,
            ),
            const Radius.circular(1),
          ),
          beddingPaint,
        );
      }
    }

    // Entrance door at bottom
    final doorGradient = Paint()
      ..shader =
          LinearGradient(
            colors: [const Color(0xFF048A63), const Color(0xFF025E45)],
          ).createShader(
            Rect.fromLTWH(
              size.width * 0.42,
              size.height * 0.69,
              size.width * 0.16,
              size.height * 0.11,
            ),
          );
    canvas.drawRRect(
      RRect.fromRectAndRadius(
        Rect.fromLTWH(
          size.width * 0.42,
          size.height * 0.69,
          size.width * 0.16,
          size.height * 0.11,
        ),
        const Radius.circular(4),
      ),
      doorGradient,
    );

    // Door glass panel (small window in door)
    final glassPaint = Paint()
      ..color = const Color(0xFF90E0EF).withValues(alpha: 0.7);
    canvas.drawRRect(
      RRect.fromRectAndRadius(
        Rect.fromCenter(
          center: Offset(size.width * 0.5, size.height * 0.725),
          width: size.width * 0.08,
          height: size.height * 0.05,
        ),
        const Radius.circular(2),
      ),
      glassPaint,
    );

    // Door handle
    canvas.drawCircle(
      Offset(size.width * 0.545, size.height * 0.75),
      size.width * 0.012,
      Paint()..color = const Color(0xFFFFD60A),
    );

    // Welcome/entrance icons (people silhouettes or backpack icons)
    final iconPaint = Paint()
      ..color = const Color(0xFF048A63).withValues(alpha: 0.3)
      ..style = PaintingStyle.fill;

    // Simplified backpack icon on left
    canvas.drawRRect(
      RRect.fromRectAndRadius(
        Rect.fromCenter(
          center: Offset(size.width * 0.18, size.height * 0.75),
          width: size.width * 0.06,
          height: size.height * 0.08,
        ),
        const Radius.circular(2),
      ),
      iconPaint,
    );

    // Simplified backpack icon on right
    canvas.drawRRect(
      RRect.fromRectAndRadius(
        Rect.fromCenter(
          center: Offset(size.width * 0.82, size.height * 0.75),
          width: size.width * 0.06,
          height: size.height * 0.08,
        ),
        const Radius.circular(2),
      ),
      iconPaint,
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
  bool shouldRepaint(_HostelIconPainter old) =>
      old.glowOpacity != glowOpacity || old.isSelected != isSelected;
}

