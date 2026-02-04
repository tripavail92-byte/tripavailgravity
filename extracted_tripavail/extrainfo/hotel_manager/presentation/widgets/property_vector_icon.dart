import 'package:flutter/material.dart';
import 'package:tripavail/features/hotel_manager/presentation/theme/hotel_manager_theme.dart';

class PropertyVectorIcon extends StatelessWidget {
  final String propertyType;
  final double size;

  const PropertyVectorIcon({
    super.key,
    required this.propertyType,
    required this.size,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        gradient: HotelManagerTheme.brandGradient,
        borderRadius: BorderRadius.circular(24),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF9D4EDD).withValues(alpha:0.3),
            blurRadius: 30,
            offset: const Offset(0, 15),
          ),
        ],
      ),
      child: Center(
        child: Icon(
          _iconForType(propertyType),
          size: size * 0.5,
          // Use onPrimary to ensure contrast against gradient across light/dark themes.
          color: Theme.of(context).colorScheme.onPrimary,
        ),
      ),
    );
  }

  IconData _iconForType(String type) {
    switch (type) {
      case 'hotel':
        return Icons.apartment;
      case 'boutique':
        return Icons.business;
      case 'resort':
        return Icons.beach_access;
      case 'motel':
        return Icons.local_hotel;
      case 'lodge':
        return Icons.cabin;
      case 'inn':
        return Icons.home;
      case 'guesthouse':
        return Icons.house;
      case 'hostel':
        return Icons.bed;
      default:
        return Icons.apartment;
    }
  }
}
