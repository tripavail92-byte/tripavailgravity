import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:tripavail/features/hotel_manager/presentation/theme/hotel_manager_theme.dart';
import 'package:tripavail/features/hotel_manager/presentation/widgets/hotel_step_card.dart';
import 'package:tripavail/features/hotel_manager/presentation/screens/hotel_listing_flow/step1_property_type_screen.dart';
import 'package:tripavail/features/hotel_manager/presentation/widgets/step_icons/property_type_step_icon.dart';
import 'package:tripavail/features/hotel_manager/presentation/widgets/step_icons/location_step_icon.dart';
import 'package:tripavail/features/hotel_manager/presentation/widgets/step_icons/amenities_step_icon.dart';
import 'package:tripavail/features/hotel_manager/presentation/widgets/step_icons/photos_step_icon.dart';
import 'package:tripavail/features/hotel_manager/presentation/widgets/step_icons/pricing_step_icon.dart';
import 'package:tripavail/features/hotel_manager/presentation/widgets/hero/hotel_hero_animated.dart';
import 'package:tripavail/utils/app_text_styles.dart';

class HotelListScreen extends StatefulWidget {
  const HotelListScreen({super.key});

  @override
  State<HotelListScreen> createState() => _HotelListScreenState();
}

class _HotelListScreenState extends State<HotelListScreen> {
  final _hoveredStep = Rx<int?>(null);

  void handleStartFlow() {
    try {
      debugPrint('[HotelListScreen] Navigating to Step1PropertyTypeScreen');
      Get.to(() => const Step1PropertyTypeScreen());
    } catch (e, st) {
      debugPrint('[HotelListScreen] Navigation error: $e\n$st');
      final theme = Theme.of(Get.context!);
      ScaffoldMessenger.of(Get.context!).showSnackBar(
        SnackBar(
          content: Text(
            'Unable to open listing flow: $e',
            style: theme.textTheme.bodyMedium,
          ),
          backgroundColor: theme.colorScheme.error,
        ),
      );
    }
  }

  void _onStepHover(int? stepId) {
    _hoveredStep.value = stepId;
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final bgColor = isDark
        ? HotelManagerTheme.backgroundDark
        : HotelManagerTheme.backgroundLight;
    final theme = Theme.of(context);
    final iconColor = isDark ? theme.colorScheme.onSurface : const Color(0xFF111827);
    final size = MediaQuery.of(context).size;
    final double width = size.width;
    final double height = size.height;
    
    final List<StepData> hotelSteps = [
      StepData(
        id: 1,
        title: 'Property Type',
        description: 'Select your property category',
        duration: '1 min',
        icon: PropertyTypeStepIcon(size: 40, color: iconColor),
      ),
      StepData(
        id: 2,
        title: 'Location',
        description: 'Pin your exact location',
        duration: '2 min',
        icon: LocationStepIcon(size: 40, color: iconColor),
      ),
      StepData(
        id: 3,
        title: 'Amenities',
        description: 'Highlight your facilities',
        duration: '3 min',
        icon: AmenitiesStepIcon(size: 40, color: iconColor),
      ),
      StepData(
        id: 4,
        title: 'Photos',
        description: 'Showcase your spaces',
        duration: '4 min',
        icon: PhotosStepIcon(size: 40, color: iconColor),
      ),
      StepData(
        id: 5,
        title: 'Pricing',
        description: 'Set your rates',
        duration: '2 min',
        icon: PricingStepIcon(size: 40, color: iconColor),
      ),
    ];

    return Scaffold(
      backgroundColor: bgColor,
      body: SafeArea(
        child: Stack(
          children: [
            SingleChildScrollView(
              padding: EdgeInsets.only(bottom: height * 0.15),
              child: Column(
                children: [
                  // Back Button
                  Padding(
                    padding: EdgeInsets.fromLTRB(
                      width * 0.06,
                      height * 0.03,
                      width * 0.06,
                      height * 0.01,
                    ),
                    child: GestureDetector(
                      onTap: () => Get.back(),
                      child: Row(
                        children: [
                          const Icon(Icons.arrow_back, size: 24),
                          const SizedBox(width: 12),
                          Text(
                            'Back to Dashboard',
                            style: AppTextStyle.bodyLarge.copyWith(
                              color: isDark
                                  ? theme.colorScheme.onSurface
                                  : HotelManagerTheme.textPrimaryLight,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),

                  // Hero Section
                  Padding(
                    padding: EdgeInsets.symmetric(
                      horizontal: width * 0.06,
                      vertical: height * 0.02,
                    ),
                    child: Column(
                      children: [
                        const HotelHeroAnimated(size: 120),
                        SizedBox(height: height * 0.03),
                        Text(
                          'List Your Hotel',
                          style: AppTextStyle.headlineMedium.copyWith(
                            fontSize: 32,
                            fontWeight: FontWeight.bold,
                            color: isDark
                                ? theme.colorScheme.onSurface
                                : HotelManagerTheme.textPrimaryLight,
                          ),
                          textAlign: TextAlign.center,
                        ),
                        SizedBox(height: height * 0.01),
                        Text(
                          'Complete each step at your own pace',
                          style: AppTextStyle.bodyLarge.copyWith(
                            color: isDark
                                ? HotelManagerTheme.textSecondaryDark
                                : HotelManagerTheme.textSecondaryLight,
                          ),
                          textAlign: TextAlign.center,
                        ),
                      ],
                    ),
                  ),

                  // Steps Section
                  Padding(
                    padding: EdgeInsets.symmetric(horizontal: width * 0.06),
                    child: Column(
                      children: hotelSteps.map((step) {
                        return Padding(
                          padding: EdgeInsets.only(bottom: height * 0.02),
                          child: MouseRegion(
                            onEnter: (_) => _onStepHover(step.id),
                            onExit: (_) => _onStepHover(null),
                            child: Obx(
                              () => HotelStepCard(
                                step: step,
                                isHovered: _hoveredStep.value == step.id,
                              ),
                            ),
                          ),
                        );
                      }).toList(),
                    ),
                  ),
                ],
              ),
            ),

            // Fixed CTA Button
            Positioned(
              bottom: height * 0.025,
              left: width * 0.06,
              right: width * 0.06,
              child: Container(
                decoration: BoxDecoration(
                  gradient: HotelManagerTheme.brandGradient,
                  borderRadius: BorderRadius.circular(24),
                  boxShadow: [
                    BoxShadow(
                      color: theme.shadowColor.withValues(alpha: isDark ? 0.25 : 0.4),
                      blurRadius: isDark ? 14 : 20,
                      offset: const Offset(0, 10),
                    ),
                  ],
                ),
                child: Material(
                  color: Colors.transparent,
                  child: InkWell(
                    onTap: handleStartFlow,
                    borderRadius: BorderRadius.circular(24),
                    child: Container(
                      alignment: Alignment.center,
                      height: 56,
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Text(
                            'List Your Hotel',
                            style: AppTextStyle.titleMedium.copyWith(
                              color: theme.colorScheme.onPrimary,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                          const SizedBox(width: 8),
                          Icon(Icons.arrow_forward, color: theme.colorScheme.onPrimary),
                        ],
                      ),
                    ),
                  ),
                ),
              ),
            ),
            // helper text removed per request
          ],
        ),
      ),
    );
  }
}
