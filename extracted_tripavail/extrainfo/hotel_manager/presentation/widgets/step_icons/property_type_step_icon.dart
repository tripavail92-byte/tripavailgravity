import 'package:flutter/material.dart';
import 'package:tripavail/widgets/animations/looping_icon.dart';
import 'package:tripavail/features/hotel_manager/presentation/constants/hm_animation.dart';

class PropertyTypeStepIcon extends StatelessWidget {
  final double size;
  final Color? color;
  const PropertyTypeStepIcon({super.key, this.size = 56, this.color});

  @override
  Widget build(BuildContext context) {
    return LoopingIcon(
      size: size,
      color: color,
      duration: HMAnimation.calm,
      painterBuilder: (p, c) => _PropertyTypeIconPainter(progress: p, color: c),
    );
  }
}

class _PropertyTypeIconPainter extends CustomPainter {
  final double progress; // 0..1
  final Color color;
  const _PropertyTypeIconPainter({required this.progress, required this.color});

  @override
  void paint(Canvas canvas, Size size) {
    final w = size.width;
    final h = size.height;

    final baseStroke = Paint()
      ..style = PaintingStyle.stroke
      ..strokeWidth = 2
      ..color = color.withValues(alpha:0.9);

    // Morph across 5 variants with cross‑fade: hotel, resort, motel, cabin, inn
    final states = 5;
    final p = progress * states;
    final idx = p.floor() % states;
    final t = p - idx;

    void drawVariant(int index, double alpha) {
      int floors;
      double widthFactor;
      int roofType; // 0 peaked, 1 flat, 2 cabin triangle
      switch (index) {
        case 0:
          floors = 5;
          widthFactor = 0.52;
          roofType = 0;
          break; // hotel
        case 1:
          floors = 4;
          widthFactor = 0.58;
          roofType = 0;
          break; // resort
        case 2:
          floors = 2;
          widthFactor = 0.70;
          roofType = 1;
          break; // motel
        case 3:
          floors = 2;
          widthFactor = 0.46;
          roofType = 2;
          break; // cabin
        default:
          floors = 3;
          widthFactor = 0.50;
          roofType = 0;
          break; // inn
      }

      final stroke = baseStroke..color = baseStroke.color.withValues(alpha:alpha);
      final top = h * 0.24;
      final height = h * (0.16 + floors * 0.095);
      final left = w * 0.5 - (w * widthFactor) / 2;
      final rect = RRect.fromRectAndRadius(
        Rect.fromLTWH(left, top, w * widthFactor, height),
        const Radius.circular(2),
      );
      canvas.drawRRect(rect, stroke);

      // roof
      Path roof;
      if (roofType == 0) {
        roof = Path()
          ..moveTo(left - w * 0.05, top)
          ..lineTo(w * 0.5, top - h * 0.12)
          ..lineTo(left + w * widthFactor + w * 0.05, top);
      } else if (roofType == 1) {
        roof = Path()
          ..moveTo(left - w * 0.04, top - 2)
          ..lineTo(left + w * widthFactor + w * 0.04, top - 2);
      } else {
        roof = Path()
          ..moveTo(left, top)
          ..lineTo(w * 0.5, top - h * 0.14)
          ..lineTo(left + w * widthFactor, top)
          ..close();
      }
      canvas.drawPath(
        roof,
        Paint()
          ..style = PaintingStyle.stroke
          ..strokeWidth = 2
          ..color = color.withValues(alpha:0.9 * alpha),
      );

      // windows flicker
      final cols = (roofType == 1) ? 4 : 3;
      final winOn = Paint()..color = color.withValues(alpha:0.9 * alpha);
      final winOff = Paint()..color = color.withValues(alpha:0.35 * alpha);
      for (int r = 0; r < floors; r++) {
        for (int c = 0; c < cols; c++) {
          final cellW = (w * widthFactor) / (cols + 2);
          final x = left + cellW * (c + 1);
          final y = top + h * 0.08 * (r + 1);
          final on = ((r + c) % 2 == 0) ? (t < 0.5) : (t >= 0.5);
          final paint = on ? winOn : winOff;
          final rr = RRect.fromRectAndRadius(
            Rect.fromLTWH(x, y, cellW * 0.6, h * 0.06),
            const Radius.circular(1),
          );
          canvas.drawRRect(rr, paint);
        }
      }

      // door
      final doorW = (roofType == 1) ? w * 0.18 : w * 0.14;
      final door = RRect.fromRectAndRadius(
        Rect.fromLTWH(
          w * 0.5 - doorW / 2,
          top + height - h * 0.14,
          doorW,
          h * 0.14,
        ),
        const Radius.circular(1),
      );
      canvas.drawRRect(door, Paint()..color = color.withValues(alpha:alpha));
    }

    drawVariant(idx, 1 - t);
    drawVariant((idx + 1) % states, t);

    // shadow
    final shadow = Paint()..color = Colors.black.withValues(alpha:0.10);
    canvas.drawOval(
      Rect.fromCenter(
        center: Offset(w / 2, h * 0.96),
        width: w * 0.7,
        height: 3,
      ),
      shadow,
    );
  }

  @override
  bool shouldRepaint(covariant _PropertyTypeIconPainter oldDelegate) =>
      oldDelegate.progress != progress;
}
