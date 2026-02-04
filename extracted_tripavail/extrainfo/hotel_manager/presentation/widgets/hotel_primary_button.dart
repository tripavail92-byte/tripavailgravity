import 'package:flutter/material.dart';
import 'package:tripavail/widgets/primary_button.dart';

/// Deprecated: Use [PrimaryButton] directly. This wrapper exists for backward compatibility.
@Deprecated('Use PrimaryButton instead')
class HotelPrimaryButton extends StatelessWidget {
  const HotelPrimaryButton({
    super.key,
    required this.onPressed,
    required this.title,
    this.margin,
    this.padding,
    this.enabled = true,
    this.height,
    this.width,
    this.icon,
    this.titleColor,
  });

  final VoidCallback onPressed;
  final String title;
  final EdgeInsetsGeometry? margin;
  final EdgeInsetsGeometry? padding;
  final bool enabled;
  final double? height;
  final double? width;
  final Widget? icon;
  final Color? titleColor;

  @override
  Widget build(BuildContext context) {
    return PrimaryButton(
      onPressed: onPressed,
      title: title,
      margin: margin,
      padding: padding,
      enabled: enabled,
      height: height,
      width: width,
      icon: icon,
      titleColor: titleColor,
    );
  }
}
