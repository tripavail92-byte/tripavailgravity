import 'package:flutter/material.dart';
import 'dart:math' as math;
import 'package:tripavail/features/hotel_manager/data/models/amenity.dart';
import 'package:tripavail/features/hotel_manager/presentation/widgets/amenity_icon.dart';

/// Individual amenity selection tile with checkbox, icon, and label
class AmenitySelectionTile extends StatelessWidget {
  final Amenity amenity;
  final bool isSelected;
  final VoidCallback onTap;
  final bool verticalLayout; // If true, show icon above label (grid style)
  final double iconSize; // If <= 0, size will be computed from tile constraints

  const AmenitySelectionTile({
    super.key,
    required this.amenity,
    required this.isSelected,
    required this.onTap,
    this.verticalLayout = false,
    this.iconSize = 32,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    final borderColor = isSelected
        ? theme.colorScheme.primary
        : theme.dividerColor.withValues(alpha: 0.25);
    if (verticalLayout) {
      // Compact grid layout: icon + label centered
      return InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(14),
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 180),
          curve: Curves.easeOut,
          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 10), // increased padding for 48dp icons
          decoration: BoxDecoration(
            border: Border.all(color: borderColor, width: isSelected ? 2 : 1),
            borderRadius: BorderRadius.circular(14),
            // Keep background fully transparent like Airbnb; selection indicated by border/check only
            color: Colors.transparent,
          ),
          child: LayoutBuilder(
            builder: (context, constraints) {
              final base = math.min(constraints.maxWidth, constraints.maxHeight);
              final computedSize = iconSize > 0 ? iconSize : (base * 0.35).clamp(28.0, 56.0);
              // Use 48dp for auto-sized icons to accommodate Lordicon scale
              final effectiveIconSize = iconSize <= 0 ? 48.0 : computedSize;
              return Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Stack(
                    alignment: Alignment.topRight,
                    children: [
                      AmenityIcon(
                        iconName: amenity.iconName,
                        isSelected: isSelected,
                        hasAnimation: amenity.hasAnimation,
                        size: effectiveIconSize,
                        outlineOnly: true,
                      ),
                      Positioned(
                        top: -2,
                        right: -2,
                        child: AnimatedScale(
                          scale: isSelected ? 1 : 0.0,
                          duration: const Duration(milliseconds: 180),
                          child: Container(
                            height: 16,
                            width: 16,
                            decoration: BoxDecoration(
                              color: theme.colorScheme.primary,
                              shape: BoxShape.circle,
                              border: Border.all(
                                color: theme.colorScheme.onPrimary,
                                width: 1.5,
                              ),
                            ),
                            child: Icon(
                              Icons.check,
                              size: 10,
                              color: theme.colorScheme.onPrimary,
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 6),
                  Text(
                    amenity.name,
                    textAlign: TextAlign.center,
                    style: theme.textTheme.bodySmall?.copyWith(
                      fontWeight: isSelected ? FontWeight.w600 : FontWeight.w400,
                      height: 1.15,
                      letterSpacing: 0.1,
                      color: isSelected
                          ? theme.colorScheme.primary
                          : theme.textTheme.bodySmall?.color,
                    ),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
              );
            },
          ),
        ),
      );
    }
    // Original horizontal layout (list style)
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 14),
        decoration: BoxDecoration(
          border: Border.all(
            color: borderColor,
            width: isSelected ? 2 : 1,
          ),
          borderRadius: BorderRadius.circular(12),
          color: isSelected
              ? theme.colorScheme.primary.withValues(alpha: 0.05)
              : Colors.transparent,
        ),
        child: Row(
          children: [
            SizedBox(
              width: 20,
              height: 20,
              child: Checkbox(
                value: isSelected,
                onChanged: (_) => onTap(),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(4),
                ),
                materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
                visualDensity: VisualDensity.compact,
              ),
            ),
            const SizedBox(width: 10),
            AmenityIcon(
              iconName: amenity.iconName,
              isSelected: isSelected,
              hasAnimation: amenity.hasAnimation,
              size: iconSize,
              outlineOnly: true,
            ),
            const SizedBox(width: 10),
            Expanded(
              child: Text(
                amenity.name,
                style: theme.textTheme.bodyMedium?.copyWith(
                  fontWeight: isSelected ? FontWeight.w600 : FontWeight.w400,
                  color: isSelected
                      ? theme.colorScheme.primary
                      : theme.textTheme.bodyMedium?.color,
                ),
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
