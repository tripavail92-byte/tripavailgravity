import 'dart:math' as math;
import 'package:flutter/material.dart';

class HotelHeroAnimated extends StatefulWidget {
  final double size;
  const HotelHeroAnimated({super.key, this.size = 140});

  @override
  State<HotelHeroAnimated> createState() => _HotelHeroAnimatedState();
}

class _HotelHeroAnimatedState extends State<HotelHeroAnimated>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 3),
    )..repeat();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _controller,
      builder: (context, _) {
        return CustomPaint(
          size: Size.square(widget.size),
          painter: _HotelPainter(progress: _controller.value),
        );
      },
    );
  }
}

class _HotelPainter extends CustomPainter {
  final double progress;
  const _HotelPainter({required this.progress});

  @override
  void paint(Canvas canvas, Size size) {
    final w = size.width;
    final h = size.height;

    // glow
    final glow = Paint()
      ..shader = const RadialGradient(
        colors: [Color(0xFF9D4EDD), Color(0x00000000)],
      ).createShader(Rect.fromCircle(center: Offset(w / 2, h / 2), radius: w));
    canvas.drawCircle(
      Offset(w / 2, h / 2),
      w * 0.42,
      glow..maskFilter = const MaskFilter.blur(BlurStyle.normal, 24),
    );

    // body gradient
    final bodyGradient = const LinearGradient(
      begin: Alignment.topLeft,
      end: Alignment.bottomRight,
      colors: [Color(0xFF8B5CF6), Color(0xFF06B6D4)],
    ).createShader(Rect.fromLTWH(0, 0, w, h));

    final body = RRect.fromRectAndRadius(
      Rect.fromLTWH(w * 0.28, h * 0.28, w * 0.44, h * 0.44),
      const Radius.circular(8),
    );
    canvas.drawRRect(body, Paint()..shader = bodyGradient);

    // roof
    final roof = Path()
      ..moveTo(w * 0.24, h * 0.28)
      ..lineTo(w * 0.5, h * 0.18)
      ..lineTo(w * 0.76, h * 0.28)
      ..close();
    final roofPaint = Paint()..color = const Color(0xFF0EA5E9);
    canvas.drawPath(roof, roofPaint);

    // hotel sign
    final sign = RRect.fromRectAndRadius(
      Rect.fromLTWH(w * 0.38, h * 0.22, w * 0.24, h * 0.06),
      const Radius.circular(4),
    );
    canvas.drawRRect(sign, Paint()..color = const Color(0xFF1F2937));

    // windows flicker
    final on = Paint()..color = const Color(0xFFFCD34D);
    final off = Paint()..color = const Color(0xFF6D28D9);
    for (int r = 0; r < 5; r++) {
      for (int c = 0; c < 4; c++) {
        final x = w * (0.32 + c * 0.1);
        final y = h * (0.32 + r * 0.085);
        final lit = ((r * 4 + c) % 3) != 0;
        final flicker = math.sin(progress * 2 * math.pi + (r + c) * 0.3) > 0;
        final paint = lit && flicker ? on : off;
        canvas.drawRRect(
          RRect.fromRectAndRadius(
            Rect.fromLTWH(x, y, w * 0.06, h * 0.06),
            const Radius.circular(2),
          ),
          paint,
        );
      }
    }

    // entrance
    canvas.drawRRect(
      RRect.fromRectAndRadius(
        Rect.fromLTWH(w * 0.44, h * 0.56, w * 0.12, h * 0.12),
        const Radius.circular(3),
      ),
      Paint()..color = const Color(0xFF111827),
    );

    // stars on roof
    for (int i = 0; i < 3; i++) {
      final x = w * (0.40 + i * 0.08);
      final y = h * (0.14 + (i % 2) * 0.01);
      final s = 1 + 0.4 * math.sin(progress * 2 * math.pi + i);
      canvas.drawCircle(
        Offset(x, y),
        s,
        Paint()..color = const Color(0xFFFCD34D),
      );
    }
  }

  @override
  bool shouldRepaint(covariant _HotelPainter oldDelegate) =>
      oldDelegate.progress != progress;
}
