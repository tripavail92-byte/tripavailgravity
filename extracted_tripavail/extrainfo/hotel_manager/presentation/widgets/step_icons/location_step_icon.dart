import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:tripavail/widgets/animations/looping_icon.dart';
import 'package:tripavail/features/hotel_manager/presentation/constants/hm_animation.dart';

class LocationStepIcon extends StatelessWidget {
  final double size;
  final Color? color;
  const LocationStepIcon({super.key, this.size = 56, this.color});

  @override
  Widget build(BuildContext context) {
    return LoopingIcon(
      size: size,
      color: color,
      duration: HMAnimation.calm,
      painterBuilder: (p, c) => _LocationPainter(progress: p, color: c),
    );
  }
}

class _LocationPainter extends CustomPainter {
  final double progress;
  final Color color;
  const _LocationPainter({required this.progress, required this.color});

  @override
  void paint(Canvas canvas, Size size) {
    final w = size.width;
    final h = size.height;
    final cx = w / 2;
    final cy = h / 2;

    final stroke = Paint()
      ..style = PaintingStyle.stroke
      ..strokeWidth = 2
      ..color = color.withValues(alpha:0.9);

    // globe
    canvas.drawCircle(Offset(cx, cy), w * 0.32, stroke);
    canvas.drawLine(
      Offset(cx, cy - w * 0.32),
      Offset(cx, cy + w * 0.32),
      stroke..strokeWidth = 1.5,
    );
    canvas.drawLine(
      Offset(cx - w * 0.32, cy),
      Offset(cx + w * 0.32, cy),
      stroke..strokeWidth = 1.5,
    );

    // latitude curves
    final latPaint = Paint()
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1
      ..color = color.withValues(alpha:0.6);
    final top = Path()
      ..moveTo(cx - w * 0.28, cy - w * 0.14)
      ..quadraticBezierTo(cx, cy - w * 0.18, cx + w * 0.28, cy - w * 0.14);
    final bottom = Path()
      ..moveTo(cx - w * 0.28, cy + w * 0.14)
      ..quadraticBezierTo(cx, cy + w * 0.18, cx + w * 0.28, cy + w * 0.14);
    canvas.drawPath(top, latPaint);
    canvas.drawPath(bottom, latPaint);

    // cycle phases: 0-0.33 pin, 0.33-0.66 compass, 0.66-1 grid map
    final phase = progress;
    if (phase < 1 / 3) {
      // bouncing pin
      final pinY = cy - w * 0.06 + math.sin(phase * 3 * 2 * math.pi) * 2;
      final pinPath = Path();
      final pinTop = Offset(cx, pinY);
      pinPath.addOval(Rect.fromCircle(center: pinTop, radius: w * 0.03));
      final tail = Path()
        ..moveTo(cx, pinY + w * 0.03)
        ..quadraticBezierTo(cx, pinY + w * 0.18, cx, pinY + w * 0.24);
      final pinPaint = Paint()
        ..style = PaintingStyle.fill
        ..color = color.withValues(alpha:0.9);
      canvas.drawPath(pinPath, pinPaint);
      canvas.drawPath(
        tail,
        Paint()
          ..style = PaintingStyle.stroke
          ..strokeWidth = 1
          ..color = color.withValues(alpha:0.9),
      );
    } else if (phase < 2 / 3) {
      // rotating compass needle in corner
      final corner = Offset(w * 0.78, h * 0.18);
      canvas.drawCircle(
        corner,
        w * 0.11,
        Paint()
          ..style = PaintingStyle.stroke
          ..color = color.withValues(alpha:0.9)
          ..strokeWidth = 1.5,
      );
      canvas.save();
      canvas.translate(corner.dx, corner.dy);
      canvas.rotate((phase - 1 / 3) * 3 * 2 * math.pi);
      final needle = Path()
        ..moveTo(0, -w * 0.08)
        ..lineTo(w * 0.01, 0)
        ..lineTo(0, w * 0.08)
        ..lineTo(-w * 0.01, 0)
        ..close();
      canvas.drawPath(needle, Paint()..color = color.withValues(alpha:0.9));
      canvas.restore();
    } else {
      // simple grid map pulse
      final gridPaint = Paint()
        ..style = PaintingStyle.stroke
        ..strokeWidth = 1
        ..color = color.withValues(alpha:0.9);
      final base = Rect.fromLTWH(
        cx - w * 0.18,
        cy - w * 0.12,
        w * 0.36,
        w * 0.24,
      );
      canvas.drawRRect(
        RRect.fromRectAndRadius(base, const Radius.circular(4)),
        gridPaint,
      );
      for (int i = 1; i < 4; i++) {
        final dx = base.left + base.width * i / 4;
        canvas.drawLine(
          Offset(dx, base.top),
          Offset(dx, base.bottom),
          gridPaint,
        );
      }
      for (int j = 1; j < 3; j++) {
        final dy = base.top + base.height * j / 3;
        canvas.drawLine(
          Offset(base.left, dy),
          Offset(base.right, dy),
          gridPaint,
        );
      }
      // pulsing route dot
      final pulse = 1 + 0.2 * math.sin((phase - 2 / 3) * 3 * 2 * math.pi);
      canvas.drawCircle(
        Offset(base.center.dx, base.center.dy),
        3 * pulse,
        Paint()..color = color.withValues(alpha:0.9),
      );
    }

    // shadow
    canvas.drawOval(
      Rect.fromCenter(center: Offset(cx, h * 0.96), width: w * 0.7, height: 3),
      Paint()..color = Colors.black.withValues(alpha:0.1),
    );
  }

  @override
  bool shouldRepaint(covariant _LocationPainter oldDelegate) =>
      oldDelegate.progress != progress;
}
