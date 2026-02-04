import 'dart:convert';
import 'package:get/get.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:tripavail/features/hotel_manager/data/models/listing_location.dart';

class ListingDraftController extends GetxController {
  static const String _draftKey = 'hotel_listing_draft';

  // Save draft data
  Future<void> saveDraft({
    String? propertyType,
    String? propertyName,
    String? description,
    String? email,
    String? phone,
    ListingLocation? location,
  }) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      
      final draftData = {
        'propertyType': propertyType,
        'propertyName': propertyName,
        'description': description,
        'email': email,
        'phone': phone,
        'location': location?.toJson(),
        'savedAt': DateTime.now().toIso8601String(),
      };

      await prefs.setString(_draftKey, jsonEncode(draftData));
    } catch (e) {
      // Silent fail - draft save is not critical
    }
  }

  // Load draft data
  Future<Map<String, dynamic>?> loadDraft() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final draftJson = prefs.getString(_draftKey);
      
      if (draftJson != null) {
        return jsonDecode(draftJson) as Map<String, dynamic>;
      }
    } catch (e) {
      // Silent fail
    }
    return null;
  }

  // Clear draft
  Future<void> clearDraft() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.remove(_draftKey);
    } catch (e) {
      // Silent fail
    }
  }

  // Check if draft exists
  Future<bool> hasDraft() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      return prefs.containsKey(_draftKey);
    } catch (e) {
      return false;
    }
  }
}
