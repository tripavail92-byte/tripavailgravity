import 'package:flutter/material.dart';
import 'package:tripavail/widgets/primary_button.dart';

/// Bottom summary bar showing selected amenity count and Continue button
class SelectedAmenitiesSummary extends StatelessWidget {
  final int selectedCount;
  final VoidCallback onContinue;
  final bool isEnabled;

  const SelectedAmenitiesSummary({
    super.key,
    required this.selectedCount,
    required this.onContinue,
    this.isEnabled = true,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final size = MediaQuery.of(context).size;

    return Container(
      padding: EdgeInsets.symmetric(
        horizontal: size.width * 0.06,
        vertical: 16,
      ),
      decoration: BoxDecoration(
        color: theme.scaffoldBackgroundColor,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.05),
            blurRadius: 10,
            offset: const Offset(0, -2),
          ),
        ],
      ),
      child: SafeArea(
        top: false,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Selected count
            if (selectedCount > 0)
              Padding(
                padding: const EdgeInsets.only(bottom: 12),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(
                      Icons.check_circle,
                      size: 20,
                      color: theme.colorScheme.primary,
                    ),
                    const SizedBox(width: 8),
                    Text(
                      '$selectedCount ${selectedCount == 1 ? 'amenity' : 'amenities'} selected',
                      style: theme.textTheme.bodyMedium?.copyWith(
                        fontWeight: FontWeight.w600,
                        color: theme.colorScheme.primary,
                      ),
                    ),
                  ],
                ),
              ),

            // Continue button
            PrimaryButton(
              title: 'Continue',
              onPressed: onContinue,
              enabled: isEnabled && selectedCount > 0,
              width: double.infinity,
            ),
          ],
        ),
      ),
    );
  }
}
