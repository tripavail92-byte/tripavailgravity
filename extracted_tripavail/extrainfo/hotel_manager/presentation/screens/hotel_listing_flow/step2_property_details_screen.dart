import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:tripavail/features/hotel_manager/presentation/controllers/listing_draft_controller.dart';
import 'package:tripavail/features/hotel_manager/presentation/screens/hotel_listing_flow/step3_setup_location_screen.dart';
import 'package:tripavail/features/hotel_manager/presentation/widgets/property_icons/property_type_icons.dart';
import 'package:tripavail/utils/app_labels.dart';
import 'package:tripavail/widgets/primary_button.dart';
import 'package:tripavail/widgets/primary_text_field.dart';

class Step2PropertyDetailsScreen extends StatefulWidget {
  final String propertyType;

  const Step2PropertyDetailsScreen({
    super.key,
    required this.propertyType,
  });

  @override
  State<Step2PropertyDetailsScreen> createState() =>
      _Step2PropertyDetailsScreenState();
}

class _Step2PropertyDetailsScreenState extends State<Step2PropertyDetailsScreen> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _descController = TextEditingController();
  final _emailController = TextEditingController(text: 'contact@yourhotel.com');
  final _phoneController = TextEditingController(text: '+92 300 1234567');
  final _draftController = Get.put(ListingDraftController());

  bool _isFormValid = false;

  @override
  void initState() {
    super.initState();
    _nameController.addListener(_validateForm);
    _descController.addListener(_validateForm);
    _emailController.addListener(_validateForm);
    _phoneController.addListener(_validateForm);
  }

  @override
  void dispose() {
    _nameController.dispose();
    _descController.dispose();
    _emailController.dispose();
    _phoneController.dispose();
    super.dispose();
  }

  void _validateForm() {
    final isValid = _nameController.text.isNotEmpty &&
        _descController.text.isNotEmpty &&
        _emailController.text.isNotEmpty &&
        _emailController.text.contains('@');
    
    if (_isFormValid != isValid) {
      setState(() {
        _isFormValid = isValid;
      });
    }
  }

  void _saveAndExit() async {
    await _draftController.saveDraft(
      propertyType: widget.propertyType,
      propertyName: _nameController.text,
      description: _descController.text,
      email: _emailController.text,
      phone: _phoneController.text,
    );
    Get.back();
  }

  PropertyType _getPropertyTypeFromLabel(String label) {
    for (var type in PropertyTypeIcons.allTypes) {
      if (PropertyTypeIcons.getLabel(type).toLowerCase() == label.toLowerCase()) {
        return type;
      }
    }
    return PropertyType.hotel; // Default fallback
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
            crossAxisAlignment: CrossAxisAlignment.start,
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
                        '$typeLabel Details',
                        style: theme.textTheme.headlineMedium?.copyWith(
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      SizedBox(height: height * 0.01),

                      // Subtitle
                      Text(
                        'Tell us about your property',
                        style: theme.textTheme.bodyMedium?.copyWith(
                          color: theme.textTheme.bodyMedium?.color
                              ?.withValues(alpha: 0.7),
                        ),
                      ),
                      SizedBox(height: height * 0.01),

                      // Step indicator
                      Text(
                        'Step 2 of 5',
                        style: theme.textTheme.bodySmall?.copyWith(
                          color: theme.colorScheme.primary,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      SizedBox(height: height * 0.04),
                      _buildSectionLabel(
                          'Listing a ${widget.propertyType}', theme),
                      SizedBox(height: size.height * 0.03),
                      PrimaryTextField(
                        controller: _nameController,
                        label: '$typeLabel Name *',
                        hintText: 'Enter your ${widget.propertyType} name',
                        helperText:
                            'Example: Sunset View ${widget.propertyType}, Paradise ${widget.propertyType}',
                        validator: (v) =>
                            v == null || v.isEmpty ? 'Required' : null,
                      ),
                      SizedBox(height: size.height * 0.025),
                      _buildTextArea(
                        controller: _descController,
                        label: '$typeLabel Description *',
                        hint:
                            'Describe your ${widget.propertyType}, its unique features, and what makes it special...',
                        theme: theme,
                        validator: (v) =>
                            v == null || v.isEmpty ? 'Required' : null,
                      ),
                      SizedBox(height: size.height * 0.025),
                      PrimaryTextField(
                        controller: _emailController,
                        label: 'Contact Email *',
                        hintText: 'contact@yourhotel.com',
                        validator: (v) =>
                            v != null && v.contains('@') ? null : 'Invalid email',
                      ),
                      SizedBox(height: size.height * 0.025),
                      PrimaryTextField(
                        controller: _phoneController,
                        label: 'Phone Number',
                        hintText: '+92 300 1234567',
                        keyboardType: TextInputType.phone,
                      ),
                      SizedBox(height: height * 0.04),
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
                          value: 0.4,
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
                            enabled: _isFormValid,
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

  Widget _buildSectionLabel(String text, ThemeData theme) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 14),
      decoration: BoxDecoration(
        color: theme.colorScheme.primary,
        borderRadius: BorderRadius.circular(8),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(Icons.check_circle_outline,
              color: theme.colorScheme.onPrimary, size: 16),
          const SizedBox(width: 8),
          Text(
            text,
            style: theme.textTheme.labelLarge?.copyWith(
              color: theme.colorScheme.onPrimary,
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTextArea({
    required TextEditingController controller,
    required String label,
    required String hint,
    required ThemeData theme,
    String? Function(String?)? validator,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Text(label, style: theme.textTheme.labelLarge),
            const Spacer(),
            Icon(Icons.auto_awesome, color: theme.colorScheme.primary, size: 18),
            const SizedBox(width: 4),
            Text('AI Assistant',
                style: theme.textTheme.bodySmall?.copyWith(
                    color: theme.colorScheme.primary,
                    fontWeight: FontWeight.w500)),
          ],
        ),
        const SizedBox(height: 6),
        TextFormField(
          controller: controller,
          maxLines: 5,
          maxLength: 500,
          validator: validator,
          decoration: InputDecoration(
            hintText: hint,
            alignLabelWithHint: true,
          ),
        ),
      ],
    );
  }

  void _handleNext() {
    if (_formKey.currentState!.validate()) {
      Get.to(() => Step3SetupLocationScreen(propertyType: widget.propertyType));
    }
  }
}
