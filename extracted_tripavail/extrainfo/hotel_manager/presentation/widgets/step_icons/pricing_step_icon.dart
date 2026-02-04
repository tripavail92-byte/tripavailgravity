import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:tripavail/widgets/animations/looping_icon.dart';
import 'package:tripavail/features/hotel_manager/presentation/constants/hm_animation.dart';

class PricingStepIcon extends StatelessWidget {
  final double size;
  final Color? color;
  const PricingStepIcon({super.key, this.size = 56, this.color});

  @override
  Widget build(BuildContext context) {
    return LoopingIcon(
      size: size,
      color: color,
      duration: HMAnimation.calm,
      painterBuilder: (p, c) => _PricingPainter(progress: p, color: c),
    );
  }
}

class _PricingPainter extends CustomPainter {
  final double progress;
  final Color color;
  const _PricingPainter({required this.progress, required this.color});

  @override
  void paint(Canvas canvas, Size size) {
    final w = size.width;
    final h = size.height;

    final base = Paint()
      ..style = PaintingStyle.stroke
      ..strokeWidth = 2
      ..color = color.withValues(alpha:0.9);

    // 3-state morph: $ coin → € coin → coupon/discount
    final states = 3;
    final p = progress * states;
    final idx = p.floor() % states;
    final t = p - idx;

    void drawVariant(int index, double alpha) {
      final stroke = base..color = base.color.withValues(alpha:alpha);
      if (index == 0) {
        final angle = progress * 2 * math.pi;
        canvas.save();
        canvas.translate(w / 2, h / 2);
        canvas.rotate(0.1 * math.sin(angle));
        canvas.drawCircle(Offset.zero, w * 0.28, stroke);
        canvas.restore();
        final symPaint = Paint()
          ..style = PaintingStyle.stroke
          ..strokeWidth = 2
          ..strokeCap = StrokeCap.round
          ..color = color.withValues(alpha:0.9 * alpha);
        final pulse = 1 + 0.1 * math.sin(angle * 2);
        final cx = w / 2;
        final cy = h / 2;
        canvas.drawLine(
          Offset(cx, cy - 10 * pulse),
          Offset(cx, cy + 10 * pulse),
          symPaint,
        );
        final top = Path()
          ..moveTo(cx - 8, cy - 6)
          ..cubicTo(cx - 2, cy - 12, cx + 10, cy - 10, cx + 6, cy - 4);
        canvas.drawPath(top, symPaint);
        final bottom = Path()
          ..moveTo(cx - 8, cy + 2)
          ..cubicTo(cx - 2, cy + 8, cx + 10, cy + 6, cx + 6, cy + 12);
        canvas.drawPath(bottom, symPaint);
      } else if (index == 1) {
        // € coin
        final angle = progress * 2 * math.pi;
        canvas.save();
        canvas.translate(w / 2, h / 2);
        canvas.rotate(-0.08 * math.sin(angle));
        canvas.drawCircle(Offset.zero, w * 0.28, stroke);
        canvas.restore();
        final ePaint = Paint()
          ..style = PaintingStyle.stroke
          ..strokeWidth = 2
          ..strokeCap = StrokeCap.round
          ..color = color.withValues(alpha:0.9 * alpha);
        final cx = w / 2;
        final cy = h / 2;
        final ePath = Path()
          ..moveTo(cx + 8, cy - 8)
          ..quadraticBezierTo(cx - 8, cy - 12, cx - 8, cy)
          ..quadraticBezierTo(cx - 8, cy + 12, cx + 8, cy + 8);
        canvas.drawPath(ePath, ePaint);
        canvas.drawLine(Offset(cx - 4, cy - 4), Offset(cx + 6, cy - 4), ePaint);
        canvas.drawLine(Offset(cx - 4, cy + 4), Offset(cx + 6, cy + 4), ePaint);
      } else {
        // coupon ticket with notches and dashed divider
        final ticket = Path()
          ..moveTo(w * 0.26, h * 0.36)
          ..lineTo(w * 0.54, h * 0.36)
          ..arcToPoint(
            Offset(w * 0.58, h * 0.40),
            radius: const Radius.circular(6),
            clockwise: false,
          )
          ..arcToPoint(
            Offset(w * 0.54, h * 0.44),
            radius: const Radius.circular(6),
            clockwise: false,
          )
          ..lineTo(w * 0.26, h * 0.44)
          ..arcToPoint(
            Offset(w * 0.22, h * 0.40),
            radius: const Radius.circular(6),
            clockwise: false,
          )
          ..arcToPoint(
            Offset(w * 0.26, h * 0.36),
            radius: const Radius.circular(6),
            clockwise: false,
          )
          ..close();
        canvas.drawPath(ticket, stroke);
        // dashed divider
        for (int i = 0; i < 5; i++) {
          canvas.drawLine(
            Offset(w * (0.28 + i * 0.05), h * 0.40),
            Offset(w * (0.30 + i * 0.05), h * 0.40),
            stroke,
          );
        }
        // small percentage mark
        canvas.drawLine(
          Offset(w * 0.46, h * 0.38),
          Offset(w * 0.50, h * 0.42),
          stroke,
        );
        canvas.drawCircle(
          Offset(w * 0.45, h * 0.37),
          1.5,
          Paint()..color = color.withValues(alpha:0.9 * alpha),
        );
        canvas.drawCircle(
          Offset(w * 0.51, h * 0.43),
          1.5,
          Paint()..color = color.withValues(alpha:0.9 * alpha),
        );
      }
    }

    drawVariant(idx, 1 - t);
    drawVariant((idx + 1) % states, t);
  }

  @override
  bool shouldRepaint(covariant _PricingPainter oldDelegate) =>
      oldDelegate.progress != progress || oldDelegate.color != color;
}
