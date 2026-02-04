import 'package:flutter/material.dart';
import 'package:tripavail/utils/app_text_styles.dart';
import 'package:tripavail/widgets/primary_appbar.dart';
import 'package:tripavail/widgets/primary_button.dart';

class HotelPackagesScreen extends StatelessWidget {
  const HotelPackagesScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final size = MediaQuery.of(context).size;
    final double width = size.width;
    final double height = size.height;
    return Scaffold(
      appBar: const PrimaryAppBar(
        title: 'Hotel Packages',
        showBackArrowIcon: true,
      ),
      body: SafeArea(
        child: Padding(
          padding: EdgeInsets.symmetric(horizontal: width * 0.08),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              PrimaryButton(onPressed: () {}, title: 'Create Package'),
              SizedBox(height: height * 0.02),
              Expanded(
                child: ListView.separated(
                  itemCount: 6,
                  separatorBuilder: (_, __) => const Divider(),
                  itemBuilder: (context, index) {
                    return ListTile(
                      title: Text(
                        'Package ${index + 1}',
                        style: AppTextStyle.bodyLarge,
                      ),
                      subtitle: const Text(
                        '2 nights • Breakfast • Airport Pickup',
                      ),
                      trailing: const Icon(Icons.chevron_right),
                    );
                  },
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
