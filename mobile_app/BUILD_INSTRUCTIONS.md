# Android Build Instructions for Barangay Management System

## Prerequisites

1. **Node.js** (v18 or higher) installed
2. **Expo CLI** installed globally:
   ```bash
   npm install -g expo-cli
   ```
3. **EAS CLI** installed (for cloud builds):
   ```bash
   npm install -g eas-cli
   ```
4. Expo account (for EAS Build)
5. Android Studio (for local builds - optional)

## Build Options

### Option 1: EAS Build (Recommended - Cloud Build)

EAS Build is the easiest way to build your Android app without needing local Android setup.

#### Step 1: Login to Expo
```bash
eas login
```

#### Step 2: Configure EAS (First time only)
```bash
eas build:configure
```

#### Step 3: Build APK (For testing/distribution)
```bash
eas build --platform android --profile preview
```
This will generate an APK file that can be installed on any Android device.

#### Step 4: Build AAB (For Play Store)
```bash
eas build --platform android --profile production
```
This will generate an AAB (Android App Bundle) file for Google Play Store submission.

#### Step 5: Download the Build
After the build completes, you'll receive a download link. The build files will be stored in:
- APK: `build/` directory or via download link
- AAB: `build/` directory or via download link

### Option 2: Local Build (Requires Android Studio)

If you prefer to build locally with Android Studio:

#### Step 1: Install Dependencies
```bash
npm install
```

#### Step 2: Prebuild (Generate Native Code)
```bash
npx expo prebuild --platform android
```

#### Step 3: Navigate to Android Project
```bash
cd android
```

#### Step 4: Build APK (Debug)
```bash
./gradlew assembleDebug
```
The APK will be in: `android/app/build/outputs/apk/debug/app-debug.apk`

#### Step 5: Build APK (Release)
```bash
./gradlew assembleRelease
```
The APK will be in: `android/app/build/outputs/apk/release/app-release.apk`

#### Step 6: Build AAB (For Play Store)
```bash
./gradlew bundleRelease
```
The AAB will be in: `android/app/build/outputs/bundle/release/app-release.aab`

## Testing the Build

### Install APK on Device
1. Enable "Install from Unknown Sources" on your Android device
2. Transfer the APK file to your device
3. Open the APK file to install

### Test with Expo Go (Development)
```bash
npm start
```
Then scan the QR code with Expo Go app on your Android device.

## Configuration Files

### app.json
- App name: "Barangay Management System"
- Package: `com.barangay.residentapp`
- Version: 1.0.0
- Version Code: 1

### Permissions Included
- INTERNET (for Supabase connectivity)
- ACCESS_NETWORK_STATE
- CAMERA (for future features)
- READ_EXTERNAL_STORAGE
- WRITE_EXTERNAL_STORAGE

## Updating Version for New Releases

To release a new version:

1. Update `version` in `app.json` (e.g., "1.0.1")
2. Update `versionCode` in `app.json` (e.g., 2)
3. Rebuild using the commands above

## Troubleshooting

### Build Fails with "Gradle" Errors
- Ensure you have Java JDK 17 or higher installed
- Clear gradle cache: `cd android && ./gradlew clean`

### EAS Build Fails
- Check your internet connection
- Ensure you're logged in: `eas whoami`
- Check build logs for specific errors

### App Crashes on Launch
- Check Supabase configuration in `lib/supabase.ts`
- Ensure all required permissions are granted
- Check console logs for errors

## Play Store Submission

1. Build the production AAB using EAS
2. Create a Google Play Console account
3. Create a new app listing
4. Upload the AAB file
5. Complete store listing information
6. Submit for review

## Support

For issues with:
- **EAS Build**: https://docs.expo.dev/build/introduction/
- **Expo Router**: https://docs.expo.dev/router/introduction/
- **Supabase**: https://supabase.com/docs
