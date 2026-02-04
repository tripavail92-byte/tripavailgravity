import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:tripavail/widgets/animations/looping_icon.dart';
import 'package:tripavail/features/hotel_manager/presentation/constants/hm_animation.dart';

class AmenitiesStepIcon extends StatelessWidget {
  final double size;
  final Color? color;
  const AmenitiesStepIcon({super.key, this.size = 56, this.color});

  @override
  Widget build(BuildContext context) {
    return LoopingIcon(
      size: size,
      color: color,
      duration: HMAnimation.calm,
      painterBuilder: (p, c) => _AmenitiesPainter(progress: p, color: c),
    );
  }
}

class _AmenitiesPainter extends CustomPainter {
  final double progress;
  final Color color;
  const _AmenitiesPainter({required this.progress, required this.color});

  @override
  void paint(Canvas canvas, Size size) {
    final w = size.width;
    final h = size.height;
    final cx = w / 2;
    final cy = h / 2;

    final outer = Paint()
      ..style = PaintingStyle.stroke
      ..strokeWidth = 2
      ..color = color.withValues(alpha:0.9);
    final inner = Paint()
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.5
      ..color = color.withValues(alpha:0.6);
    canvas.drawCircle(
      Offset(cx, cy),
      w * 0.32,
      outer..strokeCap = StrokeCap.round,
    );
    canvas.drawCircle(Offset(cx, cy), w * 0.22, inner);

    // center wifi
    final wifi = Paint()
      ..style = PaintingStyle.stroke
      ..strokeWidth = 2
      ..strokeCap = StrokeCap.round
      ..color = color.withValues(alpha:0.9);
    canvas.drawArc(
      Rect.fromCircle(center: Offset(cx, cy + 2), radius: 6),
      math.pi,
      -math.pi,
      false,
      wifi,
    );
    canvas.drawArc(
      Rect.fromCircle(center: Offset(cx, cy + 2), radius: 4),
      math.pi,
      -math.pi,
      false,
      wifi,
    );
    canvas.drawCircle(
      Offset(cx, cy + 6),
      1.5,
      Paint()..color = const Color(0xFF06B6D4),
    );

    // orbiting glyphs (pool, dumbbell, fork/spoon, P)
    final angle = progress * 2 * math.pi;
    final glyphPaint = Paint()
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.5
      ..color = color.withValues(alpha:0.9);

    // pool (top)
    final pt = Offset(cx + math.cos(angle) * 18, cy - math.sin(angle) * 18);
    canvas.drawRRect(
      RRect.fromRectAndRadius(
        Rect.fromCenter(center: pt, width: 10, height: 6),
        const Radius.circular(2),
      ),
      glyphPaint,
    );
    // dumbbell (right)
    final pr = Offset(
      cx + math.cos(angle + math.pi / 2) * 18,
      cy - math.sin(angle + math.pi / 2) * 18,
    );
    canvas.drawCircle(pr.translate(-4, 0), 2, glyphPaint);
    canvas.drawCircle(pr.translate(4, 0), 2, glyphPaint);
    canvas.drawLine(pr.translate(-4, 0), pr.translate(4, 0), glyphPaint);
    // restaurant (bottom)
    final pb = Offset(
      cx + math.cos(angle + math.pi) * 18,
      cy - math.sin(angle + math.pi) * 18,
    );
    canvas.drawLine(pb.translate(-3, -2), pb.translate(-3, 3), glyphPaint);
    canvas.drawCircle(pb.translate(3, -1), 1.5, glyphPaint);
    canvas.drawLine(pb.translate(3, 0.5), pb.translate(3, 3), glyphPaint);
    // parking (left)
    final pl = Offset(
      cx + math.cos(angle + 3 * math.pi / 2) * 18,
      cy - math.sin(angle + 3 * math.pi / 2) * 18,
    );
    final pPath = Path()
      ..moveTo(pl.dx - 3, pl.dy + 3)
      ..lineTo(pl.dx - 3, pl.dy - 3)
      ..lineTo(pl.dx + 1, pl.dy - 3)
      ..quadraticBezierTo(pl.dx + 4, pl.dy - 3, pl.dx + 4, pl.dy - 0)
      ..quadraticBezierTo(pl.dx + 4, pl.dy + 3, pl.dx + 1, pl.dy + 3)
      ..lineTo(pl.dx - 3, pl.dy + 3);
    canvas.drawPath(pPath, glyphPaint);

    // sparkles
    for (int i = 0; i < 4; i++) {
      final a = i * math.pi / 2;
      final r = 22.0;
      final p = Offset(cx + math.cos(a) * r, cy + math.sin(a) * r);
      final scale = 1 + 0.3 * math.sin(angle * 2 + i * 0.6);
      canvas.drawCircle(p, scale, Paint()..color = color.withValues(alpha:0.9));
    }

    // shadow
    canvas.drawOval(
      Rect.fromCenter(center: Offset(cx, h * 0.96), width: w * 0.7, height: 3),
      Paint()..color = Colors.black.withValues(alpha:0.1),
    );
  }

  @override
  bool shouldRepaint(covariant _AmenitiesPainter oldDelegate) =>
      oldDelegate.progress != progress;
}
