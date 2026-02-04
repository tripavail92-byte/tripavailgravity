class ListingLocation {
  final String address;
  final String? apartment;
  final String city;
  final String postalCode;
  final double latitude;
  final double longitude;

  const ListingLocation({
    required this.address,
    this.apartment,
    required this.city,
    required this.postalCode,
    required this.latitude,
    required this.longitude,
  });

  String get fullAddress {
    final parts = [
      address,
      if (apartment != null && apartment!.isNotEmpty) apartment,
      city,
      postalCode,
    ];
    return parts.join(', ');
  }

  ListingLocation copyWith({
    String? address,
    String? apartment,
    String? city,
    String? postalCode,
    double? latitude,
    double? longitude,
  }) {
    return ListingLocation(
      address: address ?? this.address,
      apartment: apartment ?? this.apartment,
      city: city ?? this.city,
      postalCode: postalCode ?? this.postalCode,
      latitude: latitude ?? this.latitude,
      longitude: longitude ?? this.longitude,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'address': address,
      'apartment': apartment,
      'city': city,
      'postalCode': postalCode,
      'latitude': latitude,
      'longitude': longitude,
    };
  }

  factory ListingLocation.fromJson(Map<String, dynamic> json) {
    return ListingLocation(
      address: json['address'] as String,
      apartment: json['apartment'] as String?,
      city: json['city'] as String,
      postalCode: json['postalCode'] as String,
      latitude: json['latitude'] as double,
      longitude: json['longitude'] as double,
    );
  }
}
