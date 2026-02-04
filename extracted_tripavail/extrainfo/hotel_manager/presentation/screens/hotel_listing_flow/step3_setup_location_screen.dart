import 'package:flutter/material.dart';
import 'package:geolocator/geolocator.dart';
import 'package:geocoding/geocoding.dart';
import 'package:get/get.dart';
import 'package:tripavail/features/hotel_manager/presentation/controllers/listing_draft_controller.dart';
import 'package:tripavail/features/hotel_manager/data/models/listing_location.dart';
import 'package:tripavail/features/hotel_manager/presentation/screens/hotel_listing_flow/map_picker_screen.dart';
import 'package:tripavail/features/hotel_manager/presentation/screens/hotel_listing_flow/step4_amenities_screen.dart';
import 'package:tripavail/features/hotel_manager/presentation/widgets/property_icons/property_type_icons.dart';
import 'package:tripavail/utils/app_labels.dart';
import 'package:tripavail/widgets/primary_button.dart';
import 'package:tripavail/widgets/primary_text_field.dart';

class Step3SetupLocationScreen extends StatefulWidget {
  final String propertyType;

  const Step3SetupLocationScreen({
    super.key,
    required this.propertyType,
  });

  @override
  State<Step3SetupLocationScreen> createState() =>
      _Step3SetupLocationScreenState();
}

class _Step3SetupLocationScreenState extends State<Step3SetupLocationScreen> {
  final _formKey = GlobalKey<FormState>();
  final _addressController = TextEditingController();
  final _apartmentController = TextEditingController();
  final _cityController = TextEditingController();
  final _postalCodeController = TextEditingController();
  final _draftController = Get.put(ListingDraftController());

  bool _isLoadingLocation = false;
  double? _latitude;
  double? _longitude;

  @override
  void dispose() {
    _addressController.dispose();
    _apartmentController.dispose();
    _cityController.dispose();
    _postalCodeController.dispose();
    super.dispose();
  }

  void _saveAndExit() async {
    final location = (_latitude != null && _longitude != null)
        ? ListingLocation(
            address: _addressController.text,
            apartment: _apartmentController.text,
            city: _cityController.text,
            postalCode: _postalCodeController.text,
            latitude: _latitude!,
            longitude: _longitude!,
          )
        : null;

    await _draftController.saveDraft(
      propertyType: widget.propertyType,
      location: location,
    );
    Get.back();
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

  Future<void> _useCurrentLocation() async {
    setState(() => _isLoadingLocation = true);

    try {
      // Check permissions
      LocationPermission permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
        if (permission == LocationPermission.denied) {
          if (mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text('Location permission denied',
                    style: Theme.of(context).textTheme.bodyMedium),
                backgroundColor: Theme.of(context).colorScheme.error,
              ),
            );
          }
          return;
        }
      }

      if (permission == LocationPermission.deniedForever) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(
                  'Location permissions permanently denied. Enable in settings.',
                  style: Theme.of(context).textTheme.bodyMedium),
              backgroundColor: Theme.of(context).colorScheme.error,
            ),
          );
        }
        return;
      }

      // Get current position
      final position = await Geolocator.getCurrentPosition(
        desiredAccuracy: LocationAccuracy.high,
      );

      // Reverse geocode
      final placemarks = await placemarkFromCoordinates(
        position.latitude,
        position.longitude,
      );

      if (placemarks.isNotEmpty && mounted) {
        final place = placemarks.first;
        setState(() {
          _addressController.text = place.street ?? '';
          _cityController.text = place.locality ?? '';
          _postalCodeController.text = place.postalCode ?? '';
          _latitude = position.latitude;
          _longitude = position.longitude;
        });

        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Location detected successfully!',
                style: Theme.of(context).textTheme.bodyMedium),
            backgroundColor: Theme.of(context).colorScheme.primary,
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to get location: $e',
                style: Theme.of(context).textTheme.bodyMedium),
            backgroundColor: Theme.of(context).colorScheme.error,
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isLoadingLocation = false);
      }
    }
  }

  Future<void> _openMapPicker() async {
    if (!_formKey.currentState!.validate()) return;

    // Try to geocode the entered address if we don't have coordinates yet
    if (_latitude == null || _longitude == null) {
      try {
        final address = '${_addressController.text}, ${_cityController.text}';
        final locations = await locationFromAddress(address);
        if (locations.isNotEmpty) {
          _latitude = locations.first.latitude;
          _longitude = locations.first.longitude;
        }
      } catch (e) {
        // Use default coordinates if geocoding fails
        _latitude = 33.6844; // Default to Islamabad
        _longitude = 73.0479;
      }
    }

    if (!mounted) return;

    final result = await Navigator.push<Map<String, dynamic>>(
      context,
      MaterialPageRoute(
        builder: (context) => MapPickerScreen(
          initialLatitude: _latitude!,
          initialLongitude: _longitude!,
          propertyType: widget.propertyType,
        ),
      ),
    );

    if (result != null && mounted) {
      setState(() {
        _latitude = result['latitude'] as double;
        _longitude = result['longitude'] as double;
        
        // Update address fields from map result if available
        if (result['address'] != null) {
          final addressData = result['address'] as Map<String, String>;
          _addressController.text = addressData['street'] ?? _addressController.text;
          _cityController.text = addressData['city'] ?? _cityController.text;
          _postalCodeController.text = addressData['postalCode'] ?? _postalCodeController.text;
        }
      });
    }
  }

  bool get _canOpenMap {
    return _addressController.text.isNotEmpty &&
        _cityController.text.isNotEmpty &&
        _postalCodeController.text.isNotEmpty;
  }

  void _handleNext() async {
    if (!_formKey.currentState!.validate()) return;
    
    // For testing: Allow proceeding without GPS coordinates
    // In production, you may want to require GPS confirmation
    if (_latitude == null || _longitude == null) {
      // Set default coordinates (you can remove this warning later)
      _latitude = 0.0;
      _longitude = 0.0;
    }

    final location = ListingLocation(
      address: _addressController.text,
      apartment: _apartmentController.text.isEmpty
          ? null
          : _apartmentController.text,
      city: _cityController.text,
      postalCode: _postalCodeController.text,
      latitude: _latitude!,
      longitude: _longitude!,
    );

    // Save location to draft
    await _draftController.saveDraft(
      propertyType: widget.propertyType,
      location: location,
    );

    // Navigate to Step 4: Amenities
    Get.to(() => Step4AmenitiesScreen(propertyType: widget.propertyType));
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    final size = MediaQuery.of(context).size;
    final double width = size.width;
    final double height = size.height;
    final typeLabel =
        widget.propertyType[0].toUpperCase() + widget.propertyType.substring(1);
    final propertyType = _getPropertyTypeFromLabel(widget.propertyType);

    return Scaffold(
      backgroundColor: theme.scaffoldBackgroundColor,
      body: SafeArea(
        child: Form(
          key: _formKey,
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
                      SizedBox(height: height * 0.025),

                      // Dynamic property icon
                      PropertyTypeIcons.getIcon(
                        type: propertyType,
                        size: 100,
                        isSelected: true,
                      ),
                      SizedBox(height: height * 0.03),

                      // Title
                      Text(
                        'Where is your $typeLabel located?',
                        style: theme.textTheme.headlineMedium?.copyWith(
                          fontWeight: FontWeight.bold,
                        ),
                        textAlign: TextAlign.center,
                      ),
                      SizedBox(height: height * 0.01),

                      // Subtitle
                      Text(
                        'Enter your address or use your current location',
                        style: theme.textTheme.bodyMedium?.copyWith(
                          color: theme.textTheme.bodyMedium?.color
                              ?.withValues(alpha: 0.7),
                        ),
                        textAlign: TextAlign.center,
                      ),
                      SizedBox(height: height * 0.01),

                      // Step indicator
                      Text(
                        'Step 3 of 5',
                        style: theme.textTheme.bodySmall?.copyWith(
                          color: theme.colorScheme.primary,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      SizedBox(height: height * 0.04),

                      // Address form fields
                      PrimaryTextField(
                        controller: _addressController,
                        label: 'Street Address *',
                        hintText: 'e.g., 123 Main Street',
                        validator: (v) =>
                            v == null || v.isEmpty ? 'Required' : null,
                      ),
                      SizedBox(height: height * 0.025),

                      PrimaryTextField(
                        controller: _apartmentController,
                        label: 'Apartment / Suite (Optional)',
                        hintText: 'e.g., Apt 4B, Floor 2',
                      ),
                      SizedBox(height: height * 0.025),

                      PrimaryTextField(
                        controller: _cityController,
                        label: 'City *',
                        hintText: 'e.g., Islamabad',
                        validator: (v) =>
                            v == null || v.isEmpty ? 'Required' : null,
                      ),
                      SizedBox(height: height * 0.025),

                      PrimaryTextField(
                        controller: _postalCodeController,
                        label: 'Postal Code *',
                        hintText: 'e.g., 44000',
                        keyboardType: TextInputType.number,
                        validator: (v) =>
                            v == null || v.isEmpty ? 'Required' : null,
                      ),
                      SizedBox(height: height * 0.03),

                      // Use current location button
                      TextButton.icon(
                        onPressed: _isLoadingLocation ? null : _useCurrentLocation,
                        icon: _isLoadingLocation
                            ? SizedBox(
                                width: 16,
                                height: 16,
                                child: CircularProgressIndicator(
                                  strokeWidth: 2,
                                  color: theme.colorScheme.primary,
                                ),
                              )
                            : Icon(
                                Icons.my_location,
                                color: theme.colorScheme.primary,
                                size: 20,
                              ),
                        label: Text(
                          _isLoadingLocation
                              ? 'Getting location...'
                              : 'Use my current location',
                          style: theme.textTheme.bodyMedium?.copyWith(
                            color: theme.colorScheme.primary,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ),
                      SizedBox(height: height * 0.03),

                      // Open Map button
                      PrimaryButton(
                        title: 'Open Map',
                        enabled: _canOpenMap,
                        onPressed: _openMapPicker,
                        width: double.infinity,
                        height: 50,
                      ),
                      SizedBox(height: height * 0.03),

                      // Tips box
                      Container(
                        padding: EdgeInsets.all(width * 0.04),
                        decoration: BoxDecoration(
                          color: theme.colorScheme.primary.withValues(alpha: 0.1),
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(
                            color: theme.colorScheme.primary.withValues(alpha: 0.3),
                          ),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                Icon(
                                  Icons.lightbulb_outline,
                                  color: theme.colorScheme.primary,
                                  size: 20,
                                ),
                                const SizedBox(width: 8),
                                Text(
                                  'Location Tips',
                                  style: theme.textTheme.labelLarge?.copyWith(
                                    color: theme.colorScheme.primary,
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                              ],
                            ),
                            SizedBox(height: height * 0.01),
                            _buildTipItem(
                              theme,
                              'Accurate location helps guests find you easily',
                            ),
                            _buildTipItem(
                              theme,
                              'Pin should mark your main entrance',
                            ),
                            _buildTipItem(
                              theme,
                              'Add building name if in a complex',
                            ),
                          ],
                        ),
                      ),
                      SizedBox(height: height * 0.12),
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
                          value: 0.6,
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
                            enabled: _latitude != null && _longitude != null,
                            onPressed: _handleNext,
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
      ),
    );
  }

  Widget _buildTipItem(ThemeData theme, String text) {
    return Padding(
      padding: const EdgeInsets.only(top: 8),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            '•  ',
            style: theme.textTheme.bodySmall?.copyWith(
              color: theme.colorScheme.primary,
            ),
          ),
          Expanded(
            child: Text(
              text,
              style: theme.textTheme.bodySmall?.copyWith(
                color: theme.textTheme.bodySmall?.color?.withValues(alpha: 0.8),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
