import 'package:flutter/material.dart';
import 'package:tripavail/features/hotel_manager/presentation/theme/hotel_manager_theme.dart';
import 'package:tripavail/utils/app_text_styles.dart';

class StepData {
  final int id;
  final String title;
  final String description;
  final String duration;
  final Widget icon;

  const StepData({
    required this.id,
    required this.title,
    required this.description,
    required this.duration,
    required this.icon,
  });
}

class HotelStepCard extends StatelessWidget {
  final StepData step;
  final bool isHovered;
  final VoidCallback? onTap;

  const HotelStepCard({
    super.key,
    required this.step,
    required this.isHovered,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    final Color durationPillBg = isDark ? Colors.white : Colors.black;
    final Color durationPillFg = isDark ? Colors.black : Colors.white;

    final Widget contents = AnimatedContainer(
      duration: const Duration(milliseconds: 200),
      // Using translateByDouble to avoid deprecated Matrix4.translate API.
    transform: isHovered
      ? (Matrix4.identity()..translateByDouble(0.0, -4.0, 0.0, 1.0))
      : Matrix4.identity(),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(16),
        boxShadow: isHovered
            ? [
                BoxShadow(
                  color: const Color(0xFF9D4EDD).withValues(alpha:0.2),
                  blurRadius: 20,
                  offset: const Offset(0, 8),
                ),
              ]
            : [],
      ),
      child: Container(
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: isDark
              ? HotelManagerTheme.cardBackgroundDark
              : HotelManagerTheme.backgroundLight,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            width: 2,
            color: isHovered
                ? const Color(0xFF9D4EDD).withValues(alpha:0.5)
                : (isDark
                      ? Colors.white.withValues(alpha:0.1)
                      : Colors.grey.shade200),
          ),
        ),
        child: Row(
          children: [
            Container(
              width: 64,
              height: 64,
              decoration: BoxDecoration(
                color: isDark
                    ? HotelManagerTheme.cardBackgroundDark
                    : Colors.white,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(
                  color: isDark
                      ? Colors.white.withValues(alpha:0.08)
                      : Colors.black.withValues(alpha:0.06),
                ),
              ),
              child: Center(
                child: SizedBox(width: 40, height: 40, child: step.icon),
              ),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    step.title,
                    style: AppTextStyle.bodyLarge.copyWith(
                      color: isDark
                          ? Colors.white
                          : HotelManagerTheme.textPrimaryLight,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    step.description,
                    style: AppTextStyle.bodyMedium.copyWith(
                      color: isDark
                          ? HotelManagerTheme.textSecondaryDark
                          : HotelManagerTheme.textSecondaryLight,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      Icon(
                        Icons.access_time,
                        size: 14,
                        color: isDark
                            ? HotelManagerTheme.textSecondaryDark
                            : HotelManagerTheme.textSecondaryLight,
                      ),
                      const SizedBox(width: 6),
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 8,
                          vertical: 3,
                        ),
                        decoration: BoxDecoration(
                          color: durationPillBg,
                          borderRadius: BorderRadius.circular(999),
                        ),
                        child: Text(
                          step.duration,
                          style: AppTextStyle.bodySmall.copyWith(
                            color: durationPillFg,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );

    return Material(
      color: Colors.transparent,
      child: InkWell(
        borderRadius: BorderRadius.circular(16),
        onTap: onTap,
        child: contents,
      ),
    );
  }
}
