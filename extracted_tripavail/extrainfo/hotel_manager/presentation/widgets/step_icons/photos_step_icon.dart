import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:tripavail/widgets/animations/looping_icon.dart';
import 'package:tripavail/features/hotel_manager/presentation/constants/hm_animation.dart';

class PhotosStepIcon extends StatelessWidget {
  final double size;
  final Color? color;
  const PhotosStepIcon({super.key, this.size = 56, this.color});

  @override
  Widget build(BuildContext context) {
    return LoopingIcon(
      size: size,
      color: color,
      duration: HMAnimation.calm,
      painterBuilder: (p, c) => _PhotosPainter(progress: p, color: c),
    );
  }
}

class _PhotosPainter extends CustomPainter {
  final double progress; // 0..1
  final Color color;
  const _PhotosPainter({required this.progress, required this.color});

  @override
  void paint(Canvas canvas, Size size) {
    final w = size.width;
    final h = size.height;

    final baseStroke = Paint()
      ..style = PaintingStyle.stroke
      ..strokeWidth = 2
      ..color = color.withValues(alpha:0.9);

    // 3-state morph: camera → photo frame → gallery stack
    final states = 4; // camera → frame → gallery → film roll
    final p = progress * states;
    final idx = p.floor() % states;
    final t = p - idx; // 0..1

    void drawVariant(int index, double alpha) {
      final stroke = baseStroke..color = baseStroke.color.withValues(alpha:alpha);
      if (index == 0) {
        // camera
        final body = RRect.fromRectAndRadius(
          Rect.fromLTWH(w * 0.2, h * 0.32, w * 0.6, h * 0.43),
          const Radius.circular(3),
        );
        canvas.drawRRect(body, stroke);
        final top = Path()
          ..moveTo(w * 0.33, h * 0.32)
          ..lineTo(w * 0.38, h * 0.24)
          ..lineTo(w * 0.62, h * 0.24)
          ..lineTo(w * 0.67, h * 0.32);
        canvas.drawPath(top, stroke);
        // lens
        canvas.drawCircle(Offset(w * 0.5, h * 0.54), w * 0.125, stroke);
        canvas.drawCircle(
          Offset(w * 0.5, h * 0.54),
          w * 0.07,
          Paint()
            ..style = PaintingStyle.stroke
            ..strokeWidth = 1.5
            ..color = color.withValues(alpha:0.6 * alpha),
        );
        canvas.drawCircle(
          Offset(w * 0.5, h * 0.54),
          w * 0.035,
          Paint()..color = color.withValues(alpha:0.6 * alpha),
        );
        // flash pulsate
        final flashOpacity =
            0.2 + 0.6 * (0.5 + 0.5 * math.sin(progress * 2 * math.pi));
        canvas.drawRRect(
          RRect.fromRectAndRadius(
            Rect.fromLTWH(w * 0.64, h * 0.40, w * 0.07, h * 0.05),
            const Radius.circular(1),
          ),
          Paint()..color = color.withValues(alpha:flashOpacity * alpha),
        );
      } else if (index == 1) {
        // photo frame with mountain + sun
        final frame = RRect.fromRectAndRadius(
          Rect.fromLTWH(w * 0.22, h * 0.30, w * 0.56, h * 0.46),
          const Radius.circular(6),
        );
        canvas.drawRRect(frame, stroke);
        // mountain
        final m = Path()
          ..moveTo(w * 0.28, h * 0.64)
          ..lineTo(w * 0.42, h * 0.46)
          ..lineTo(w * 0.52, h * 0.58)
          ..lineTo(w * 0.62, h * 0.52)
          ..lineTo(w * 0.70, h * 0.64);
        canvas.drawPath(m, stroke);
        // sun
        canvas.drawCircle(
          Offset(w * 0.60, h * 0.40),
          4,
          Paint()..color = color.withValues(alpha:0.9 * alpha),
        );
      } else if (index == 2) {
        // gallery stack (two offset frames)
        final back = RRect.fromRectAndRadius(
          Rect.fromLTWH(w * 0.26, h * 0.34, w * 0.52, h * 0.42),
          const Radius.circular(6),
        );
        final front = RRect.fromRectAndRadius(
          Rect.fromLTWH(w * 0.22, h * 0.30, w * 0.52, h * 0.42),
          const Radius.circular(6),
        );
        canvas.drawRRect(
          back,
          Paint()
            ..style = PaintingStyle.stroke
            ..strokeWidth = 2
            ..color = color.withValues(alpha:0.5 * alpha),
        );
        canvas.drawRRect(front, stroke);
      } else {
        // film roll
        final leftReelCenter = Offset(w * 0.32, h * 0.50);
        final rightReelCenter = Offset(w * 0.68, h * 0.50);
        final reelR = w * 0.10;
        canvas.drawCircle(
          leftReelCenter,
          reelR,
          baseStroke..color = color.withValues(alpha:0.6 * alpha),
        );
        canvas.drawCircle(
          rightReelCenter,
          reelR,
          baseStroke..color = color.withValues(alpha:0.6 * alpha),
        );
        // strip
        final strip = RRect.fromRectAndRadius(
          Rect.fromLTWH(w * 0.32, h * 0.44, w * 0.36, h * 0.12),
          const Radius.circular(2),
        );
        canvas.drawRRect(
          strip,
          baseStroke..color = color.withValues(alpha:0.9 * alpha),
        );
        // perforations
        for (int i = 0; i < 6; i++) {
          final x = w * 0.34 + i * (w * 0.055);
          canvas.drawRect(
            Rect.fromLTWH(x, h * 0.445, w * 0.02, h * 0.01),
            Paint()..color = color.withValues(alpha:0.9 * alpha),
          );
          canvas.drawRect(
            Rect.fromLTWH(x, h * 0.545, w * 0.02, h * 0.01),
            Paint()..color = color.withValues(alpha:0.9 * alpha),
          );
        }
      }
    }

    drawVariant(idx, 1 - t);
    drawVariant((idx + 1) % states, t);
  }

  @override
  bool shouldRepaint(covariant _PhotosPainter oldDelegate) =>
      oldDelegate.progress != progress;
}
