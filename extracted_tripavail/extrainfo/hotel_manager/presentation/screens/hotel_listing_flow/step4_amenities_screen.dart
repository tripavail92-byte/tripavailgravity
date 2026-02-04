import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:tripavail/features/hotel_manager/data/models/amenity.dart';
import 'package:tripavail/features/hotel_manager/data/models/amenity_category.dart';
import 'package:tripavail/features/hotel_manager/data/models/amenities_data.dart';
import 'package:tripavail/features/hotel_manager/presentation/widgets/amenity_search_bar.dart';
import 'package:tripavail/features/hotel_manager/presentation/widgets/collapsible_amenity_category.dart';
import 'package:tripavail/features/hotel_manager/presentation/widgets/property_icons/property_type_icons.dart';
import 'package:tripavail/features/hotel_manager/presentation/widgets/selected_amenities_summary.dart';
import 'package:tripavail/utils/app_labels.dart';
import 'package:tripavail/utils/lottie_performance_monitor.dart';

class Step4AmenitiesScreen extends StatefulWidget {
  final String propertyType;

  const Step4AmenitiesScreen({
    super.key,
    required this.propertyType,
  });

  @override
  State<Step4AmenitiesScreen> createState() => _Step4AmenitiesScreenState();
}

class _Step4AmenitiesScreenState extends State<Step4AmenitiesScreen> {
  // final _draftController = Get.put(ListingDraftController()); // TODO: Use in Phase 2 for draft saving
  final Set<String> _selectedAmenityIds = {};
  String _searchQuery = '';
  AmenityCategory? _expandedCategory; // Track which category is expanded

  @override
  void initState() {
    super.initState();
    // Expand first category (Standout Amenities) by default
    _expandedCategory = AmenityCategory.standout;
    // Load previously selected amenities if any
    // TODO: Implement draft loading in Phase 2
  }

  @override
  void dispose() {
    super.dispose();
  }

  void _toggleAmenity(String amenityId) {
    setState(() {
      if (_selectedAmenityIds.contains(amenityId)) {
        _selectedAmenityIds.remove(amenityId);
      } else {
        _selectedAmenityIds.add(amenityId);
      }
    });
  }

  void _onSearchChanged(String query) {
    setState(() {
      _searchQuery = query;
      // When searching, expand all categories to show results
      if (query.isNotEmpty) {
        _expandedCategory = null; // Allow all to expand during search
      }
    });
  }

  void _onCategoryTap(AmenityCategory category) {
    setState(() {
      // Toggle: if tapping the same category, collapse it; otherwise open new one
      if (_expandedCategory == category) {
        _expandedCategory = null; // Collapse current
      } else {
        _expandedCategory = category; // Open new, close others
      }
    });
  }

  void _saveAndExit() async {
    // TODO: Save amenities to draft
    Get.back();
  }

  void _onContinue() {
    // TODO: Navigate to Step 5 (Photos/Pricing)
    // For now, just show success message
    Get.snackbar(
      'Success',
      '${_selectedAmenityIds.length} amenities selected!',
      snackPosition: SnackPosition.BOTTOM,
      duration: const Duration(seconds: 2),
    );
  }

  PropertyType _getPropertyTypeFromLabel(String label) {
    for (var type in PropertyTypeIcons.allTypes) {
      if (PropertyTypeIcons.getLabel(type).toLowerCase() ==
          label.toLowerCase()) {
        return type;
      }
    }
    return PropertyType.hotel;
  }

  List<Amenity> _getFilteredAmenities(AmenityCategory category) {
    final categoryAmenities = AmenitiesData.byCategory(category);
    if (_searchQuery.isEmpty) return categoryAmenities;

    return categoryAmenities
        .where((amenity) => amenity.matchesSearch(_searchQuery))
        .toList();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final size = MediaQuery.of(context).size;
    final double width = size.width;
    final double height = size.height;
    final typeLabel =
        widget.propertyType[0].toUpperCase() + widget.propertyType.substring(1);
    final propertyType = _getPropertyTypeFromLabel(widget.propertyType);

    // Get categories with amenities (filtered by search)
    final categoriesWithResults = AmenitiesData.categoriesWithAmenities
        .where((category) => _getFilteredAmenities(category).isNotEmpty)
        .toList();

    return PerformanceMonitoredScreen(
      screenName: 'Step4AmenitiesScreen',
      child: Scaffold(
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
                  crossAxisAlignment: CrossAxisAlignment.center,
                  children: [
                    SizedBox(height: height * 0.02),

                    // Property icon
                    PropertyTypeIcons.getIcon(
                      type: propertyType,
                      size: 80,
                      isSelected: true,
                    ),
                    SizedBox(height: height * 0.025),

                    // Title and subtitle
                    Text(
                      'Step 4 of 5',
                      style: theme.textTheme.labelLarge?.copyWith(
                        color: theme.colorScheme.primary,
                        fontWeight: FontWeight.w600,
                        letterSpacing: 1.2,
                      ),
                    ),
                    SizedBox(height: height * 0.012),
                    Text(
                      'Amenities & Features',
                      style: theme.textTheme.headlineSmall?.copyWith(
                        fontWeight: FontWeight.bold,
                      ),
                      textAlign: TextAlign.center,
                    ),
                    SizedBox(height: height * 0.008),
                    Text(
                      'Select all amenities available at your $typeLabel',
                      style: theme.textTheme.bodyMedium?.copyWith(
                        color: theme.textTheme.bodySmall?.color,
                      ),
                      textAlign: TextAlign.center,
                    ),
                    SizedBox(height: height * 0.03),

                    // Search bar
                    AmenitySearchBar(
                      onSearchChanged: _onSearchChanged,
                      hintText: 'Search amenities...',
                    ),
                    SizedBox(height: height * 0.025),

                    // Categories
                    if (categoriesWithResults.isEmpty && _searchQuery.isNotEmpty)
                      // No results message
                      Padding(
                        padding: EdgeInsets.symmetric(vertical: height * 0.1),
                        child: Column(
                          children: [
                            Icon(
                              Icons.search_off,
                              size: 64,
                              color: theme.iconTheme.color?.withValues(alpha: 0.3),
                            ),
                            SizedBox(height: height * 0.02),
                            Text(
                              'No amenities found',
                              style: theme.textTheme.titleMedium?.copyWith(
                                color: theme.textTheme.bodySmall?.color,
                              ),
                            ),
                            SizedBox(height: height * 0.01),
                            Text(
                              'Try different search terms',
                              style: theme.textTheme.bodyMedium?.copyWith(
                                color: theme.textTheme.bodySmall?.color
                                    ?.withValues(alpha: 0.7),
                              ),
                            ),
                          ],
                        ),
                      )
                    else
                      // Category list
                      ListView.builder(
                        shrinkWrap: true,
                        physics: const NeverScrollableScrollPhysics(),
                        itemCount: categoriesWithResults.length,
                        itemBuilder: (context, index) {
                          final category = categoriesWithResults[index];
                          final filteredAmenities =
                              _getFilteredAmenities(category);
                          
                          // Determine if this category should be expanded
                          final isExpanded = _searchQuery.isNotEmpty 
                              ? true // Expand all during search
                              : _expandedCategory == category; // Otherwise only expand selected

                          return CollapsibleAmenityCategory(
                            key: ValueKey(category),
                            category: category,
                            amenities: filteredAmenities,
                            selectedAmenityIds: _selectedAmenityIds,
                            onAmenityToggle: _toggleAmenity,
                            isExpanded: isExpanded,
                            onCategoryTap: () => _onCategoryTap(category),
                          );
                        },
                      ),

                    // Bottom spacing for summary bar
                    SizedBox(height: height * 0.1),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),

      // Bottom summary bar
      bottomNavigationBar: SelectedAmenitiesSummary(
        selectedCount: _selectedAmenityIds.length,
        onContinue: _onContinue,
        isEnabled: _selectedAmenityIds.isNotEmpty,
      ),
    ),
    );
  }
}
