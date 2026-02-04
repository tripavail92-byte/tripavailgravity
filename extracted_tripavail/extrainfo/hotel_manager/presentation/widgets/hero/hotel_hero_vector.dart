import 'package:flutter/material.dart';

class HotelHeroVector extends StatelessWidget {
  final double size;
  const HotelHeroVector({super.key, this.size = 140});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [Color(0xFF9D4EDD), Color(0xFF00D4FF)],
        ),
        borderRadius: BorderRadius.circular(28),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF9D4EDD).withValues(alpha:0.28),
            blurRadius: 36,
            spreadRadius: 2,
          ),
        ],
      ),
      child: CustomPaint(
        painter: _HotelGlyphPainter(color: Colors.white),
        size: Size.square(size),
      ),
    );
  }
}

class _HotelGlyphPainter extends CustomPainter {
  final Color color;
  const _HotelGlyphPainter({required this.color});

  @override
  void paint(Canvas canvas, Size size) {
    final w = size.width;
    final h = size.height;
    final cx = w / 2;
    final cy = h / 2;
    final iconW = w * 0.34;
    final iconH = h * 0.34;

    final paint = Paint()..color = color;

    // building block
    final rect = RRect.fromRectAndRadius(
      Rect.fromCenter(center: Offset(cx, cy), width: iconW, height: iconH),
      const Radius.circular(6),
    );
    canvas.drawRRect(rect, paint);

    // windows cutouts (draw as negative with clear blend by overlaying rounded rects of gradient-colored square? Instead, simply draw smaller squares with background color using saveLayer for simplicity.)
    canvas.saveLayer(Offset.zero & size, Paint());
    canvas.drawRRect(rect, paint);
    final clear = Paint()..blendMode = BlendMode.clear;
    final cellW = iconW / 5;
    final cellH = iconH / 5;
    final startX = cx - iconW / 2 + cellW * 0.6;
    final startY = cy - iconH / 2 + cellH * 0.6;
    for (int r = 0; r < 3; r++) {
      for (int c = 0; c < 3; c++) {
        final rx = startX + c * cellW * 1.4;
        final ry = startY + r * cellH * 1.4;
        canvas.drawRRect(
          RRect.fromRectAndRadius(
            Rect.fromLTWH(rx, ry, cellW * 0.7, cellH * 0.7),
            const Radius.circular(2),
          ),
          clear,
        );
      }
    }
    // door cutout
    canvas.drawRRect(
      RRect.fromRectAndRadius(
        Rect.fromCenter(
          center: Offset(cx, cy + iconH * 0.22),
          width: cellW * 1.2,
          height: cellH * 1.6,
        ),
        const Radius.circular(2),
      ),
      clear,
    );
    canvas.restore();
  }

  @override
  bool shouldRepaint(covariant _HotelGlyphPainter oldDelegate) => false;
}
