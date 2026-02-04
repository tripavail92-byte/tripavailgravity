import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:tripavail/features/hotel_manager/presentation/controllers/listing_draft_controller.dart';
import 'package:tripavail/features/hotel_manager/presentation/screens/hotel_listing_flow/step2_property_details_screen.dart';
import 'package:tripavail/features/hotel_manager/presentation/widgets/property_icons/property_type_icons.dart';
import 'package:tripavail/utils/app_labels.dart';
import 'package:tripavail/widgets/primary_button.dart';

class Step1PropertyTypeScreen extends StatefulWidget {
  const Step1PropertyTypeScreen({super.key});

  @override
  State<Step1PropertyTypeScreen> createState() =>
      _Step1PropertyTypeScreenState();
}

class _Step1PropertyTypeScreenState extends State<Step1PropertyTypeScreen> {
  PropertyType? _selectedType;
  final _draftController = Get.put(ListingDraftController());

  void _saveAndExit() async {
    if (_selectedType != null) {
      await _draftController.saveDraft(
        propertyType: PropertyTypeIcons.getLabel(_selectedType!),
      );
    }
    Get.back();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    final size = MediaQuery.of(context).size;
    final double width = size.width;
    final double height = size.height;
    
    return Scaffold(
      backgroundColor: theme.scaffoldBackgroundColor,
      body: SafeArea(
        child: Column(
          children: [
            // Top bar with Save & Exit
            Padding(
              padding: EdgeInsets.symmetric(
                horizontal: width * 0.04,
                vertical: height * 0.015,
              ),
              child: Row(
                children: [
                  GestureDetector(
                    onTap: _saveAndExit,
                    child: Row(
                      children: [
                        Icon(
                          Icons.close,
                          size: 20,
                          color: theme.iconTheme.color,
                        ),
                        const SizedBox(width: 4),
                        Text(
                          AppLabels.saveAndExit,
                          style: theme.textTheme.bodySmall?.copyWith(
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),

            // Main content
            Expanded(
              child: SingleChildScrollView(
                padding: EdgeInsets.symmetric(horizontal: width * 0.06),
                child: Column(
                  children: [
                    SizedBox(height: height * 0.025),

                    // Animated Icon Preview
                    PropertyTypeIcons.getIcon(
                      type: _selectedType ?? PropertyType.hotel,
                      size: 100,
                      isSelected: true,
                    ),
                    SizedBox(height: height * 0.03),

                    // Title
                    Text(
                      AppLabels.propertyTypeTitle,
                      style: theme.textTheme.headlineMedium?.copyWith(
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    SizedBox(height: height * 0.01),

                    // Subtitle
                    Text(
                      AppLabels.propertyTypeSubtitle,
                      style: theme.textTheme.bodyMedium?.copyWith(
                        color: theme.textTheme.bodyMedium?.color
                            ?.withValues(alpha: 0.7),
                      ),
                    ),
                    SizedBox(height: height * 0.01),

                    // Step indicator text
                    Text(
                      AppLabels.propertyTypeStep1Of5,
                      style: theme.textTheme.bodySmall?.copyWith(
                        color: theme.colorScheme.primary,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    SizedBox(height: height * 0.04),

                    // Property Type Grid
                    GridView.builder(
                      shrinkWrap: true,
                      physics: const NeverScrollableScrollPhysics(),
                      gridDelegate:
                          const SliverGridDelegateWithFixedCrossAxisCount(
                            crossAxisCount: 2,
                            crossAxisSpacing: 16,
                            mainAxisSpacing: 16,
                            childAspectRatio: 0.85,
                          ),
                      itemCount: PropertyTypeIcons.allTypes.length,
                      itemBuilder: (context, index) {
                        final type = PropertyTypeIcons.allTypes[index];
                        final isSelected = _selectedType == type;
                        return _PropertyTypeCard(
                          type: type,
                          name: PropertyTypeIcons.getLabel(type),
                          description: PropertyTypeIcons.getDescription(type),
                          isSelected: isSelected,
                          onTap: () {
                            setState(() => _selectedType = type);
                          },
                        );
                      },
                    ),
                    SizedBox(height: height * 0.12), // Space for bottom navigation
                  ],
                ),
              ),
            ),

            // Bottom navigation with progress bar
            Container(
              decoration: BoxDecoration(
                color: theme.scaffoldBackgroundColor,
                boxShadow: [
                  BoxShadow(
                    // Use theme shadowColor adjusted for elevation feel instead of hardcoded black.
                    color: theme.shadowColor.withValues(
                      alpha: isDark ? 0.4 : 0.12,
                    ),
                    blurRadius: 12,
                    offset: const Offset(0, -3),
                  ),
                ],
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  // Progress bar
                  Padding(
                    padding: EdgeInsets.symmetric(
                      horizontal: width * 0.06,
                      vertical: height * 0.02,
                    ),
                    child: ClipRRect(
                      borderRadius: BorderRadius.circular(10),
                      child: LinearProgressIndicator(
                        value: 0.2,
                        minHeight: 8,
                        backgroundColor: theme.dividerColor.withValues(
                          alpha: 0.3,
                        ),
                        valueColor: AlwaysStoppedAnimation<Color>(
                          theme.colorScheme.primary,
                        ),
                      ),
                    ),
                  ),

                  // Back and Next buttons
                  Padding(
                    padding: EdgeInsets.fromLTRB(
                      width * 0.06,
                      0,
                      width * 0.06,
                      height * 0.03,
                    ),
                    child: Row(
                      children: [
                        // Back button
                        TextButton(
                          onPressed: () => Get.back(),
                          child: Text(
                            AppLabels.back,
                            style: theme.textTheme.bodyMedium?.copyWith(
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ),
                        const Spacer(),

                        // Next button
                        PrimaryButton(
                          title: AppLabels.next,
                          enabled: _selectedType != null,
                          onPressed: _selectedType != null
                              ? () {
                                  Get.to(() => Step2PropertyDetailsScreen(
                                        propertyType:
                                            PropertyTypeIcons.getLabel(
                                                _selectedType!),
                                      ));
                                }
                              : () {},
                          width: 140,
                          height: 50,
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _PropertyTypeCard extends StatelessWidget {
  final PropertyType type;
  final String name;
  final String description;
  final bool isSelected;
  final VoidCallback onTap;

  const _PropertyTypeCard({
    required this.type,
    required this.name,
    required this.description,
    required this.isSelected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final baseColor = theme.cardColor;
  final selectedColor = theme.colorScheme.primary;
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 180),
        curve: Curves.easeOut,
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: baseColor,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            width: 2,
            color: isSelected
                ? selectedColor
                : theme.dividerColor.withValues(alpha: 0.6),
          ),
          boxShadow: isSelected
              ? [
                  BoxShadow(
                    color: theme.shadowColor.withValues(alpha: 0.30),
                    blurRadius: 14,
                    offset: const Offset(0, 4),
                  ),
                ]
              : [
                  BoxShadow(
                    color: theme.shadowColor.withValues(alpha: 0.10),
                    blurRadius: 6,
                    offset: const Offset(0, 2),
                  ),
                ],
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            // Icon
            PropertyTypeIcons.getIcon(
              type: type,
              size: 64,
              isSelected: isSelected,
            ),
            const SizedBox(height: 12),

            // Name
            Text(
              name,
              style: theme.textTheme.bodyMedium?.copyWith(
                fontWeight: FontWeight.w600,
                color: isSelected
                    ? selectedColor
                    : theme.textTheme.bodyMedium?.color,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 4),

            // Description
            Text(
              description,
              style: theme.textTheme.bodySmall?.copyWith(
                color: theme.textTheme.bodySmall?.color?.withValues(alpha: 0.7),
                fontSize: 11,
              ),
              textAlign: TextAlign.center,
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
            ),
          ],
        ),
      ),
    );
  }
}
