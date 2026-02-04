import 'package:flutter/material.dart';
import 'package:tripavail/features/hotel_manager/data/models/amenity.dart';
import 'package:tripavail/features/hotel_manager/data/models/amenity_category.dart';
import 'package:tripavail/features/hotel_manager/presentation/widgets/amenity_icon.dart';
import 'package:tripavail/features/hotel_manager/presentation/widgets/amenity_selection_tile.dart';

/// Collapsible amenity category with accordion behavior
class CollapsibleAmenityCategory extends StatefulWidget {
  final AmenityCategory category;
  final List<Amenity> amenities;
  final Set<String> selectedAmenityIds;
  final ValueChanged<String> onAmenityToggle;
  final bool isExpanded; // Controlled by parent
  final VoidCallback onCategoryTap; // Notify parent of tap

  const CollapsibleAmenityCategory({
    super.key,
    required this.category,
    required this.amenities,
    required this.selectedAmenityIds,
    required this.onAmenityToggle,
    required this.isExpanded,
    required this.onCategoryTap,
  });

  @override
  State<CollapsibleAmenityCategory> createState() =>
      _CollapsibleAmenityCategoryState();
}

class _CollapsibleAmenityCategoryState
    extends State<CollapsibleAmenityCategory> {

  int get _selectedCount {
    return widget.amenities
        .where((amenity) => widget.selectedAmenityIds.contains(amenity.id))
        .length;
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final totalCount = widget.amenities.length;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Category header
        InkWell(
          onTap: widget.onCategoryTap, // Use callback from parent
          borderRadius: BorderRadius.circular(12),
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 12),
            child: Row(
              children: [
                // Category icon
                AmenityIcon(
                  iconName: widget.category.iconName,
                  isSelected: _selectedCount > 0,
                  size: 32, // Category header icon
                  outlineOnly: true,
                ),
                const SizedBox(width: 12),

                // Category name
                Expanded(
                  child: Text(
                    widget.category.label,
                    style: theme.textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),

                // Count badge
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: _selectedCount > 0
                        ? theme.colorScheme.primary.withValues(alpha: 0.1)
                        : theme.dividerColor.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Text(
                    '$_selectedCount/$totalCount',
                    style: theme.textTheme.bodySmall?.copyWith(
                      fontWeight: FontWeight.w600,
                      color: _selectedCount > 0
                          ? theme.colorScheme.primary
                          : theme.textTheme.bodySmall?.color,
                    ),
                  ),
                ),
                const SizedBox(width: 8),

                // Expand/collapse arrow
                AnimatedRotation(
                  turns: widget.isExpanded ? 0.5 : 0, // Use widget.isExpanded
                  duration: const Duration(milliseconds: 200),
                  child: Icon(
                    Icons.keyboard_arrow_down,
                    color: theme.iconTheme.color,
                  ),
                ),
              ],
            ),
          ),
        ),

        // Amenity grid
        AnimatedSize(
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeInOut,
          child: widget.isExpanded // Use widget.isExpanded
              ? Padding(
                  padding: const EdgeInsets.only(top: 8, bottom: 16),
                  child: GridView.builder(
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    gridDelegate:
                        const SliverGridDelegateWithFixedCrossAxisCount(
                      crossAxisCount: 2,
                      crossAxisSpacing: 10,
                      mainAxisSpacing: 12,
                      childAspectRatio: 0.85, // taller cards for 48dp icons
                    ),
                    itemCount: widget.amenities.length,
                    itemBuilder: (context, index) {
                      final amenity = widget.amenities[index];
                      final isSelected =
                          widget.selectedAmenityIds.contains(amenity.id);

                      return AmenitySelectionTile(
                        amenity: amenity,
                        isSelected: isSelected,
                        onTap: () => widget.onAmenityToggle(amenity.id),
                        verticalLayout: true,
                        iconSize: -1, // auto-size icon based on tile size (reduce padding)
                      );
                    },
                  ),
                )
              : const SizedBox.shrink(),
        ),

        // Divider
        Divider(
          color: theme.dividerColor.withValues(alpha: 0.2),
          height: 1,
        ),
      ],
    );
  }
}
