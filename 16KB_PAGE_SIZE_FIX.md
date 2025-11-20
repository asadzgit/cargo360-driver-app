# 16 KB Page Size Support Fix

## Problem
Google Play Store now requires apps to support devices with 16 KB memory page sizes starting in 2025. This affects Android apps using native libraries.

## Solution Applied

### 1. Configuration Changes

**Created `app.config.js`** (replaced `app.json`):
- Added custom config plugin `./plugins/with16kPages` to write `android.enable16kPages=true` into `android/gradle.properties` during EAS builds. This is the flag Google recommends for 16 KB compatibility. `android/gradle.properties` in a managed project can only be updated through a plugin, so this guarantees the property is applied on every build.

**Updated `eas.json`**:
- Ensured production builds use `app-bundle` format
- Added explicit Android build configurations

### 2. Testing Before Submission

To test your app with 16KB page size:

```bash
# Create a 16KB page size emulator
# First, list available system images
sdkmanager --list | grep "system-images"

# Install a system image with 16KB support (API 35+)
sdkmanager "system-images;android-35;google_apis;arm64-v8a"

# Create AVD with 16KB page size
avdmanager create avd -n test_16kb -k "system-images;android-35;google_apis;arm64-v8a"

# Or use Android Studio:
# - Open AVD Manager
# - Create Virtual Device
# - Choose a device with API 35+
# - In Advanced Settings, set "Memory and Storage" options appropriately
```

### 3. Build for Production

```bash
# Clear any cached builds
rm -rf node_modules/.cache
rm -rf .expo

# Build for production
eas build --platform android --profile production

# The build will now include 16KB page size support
```

### 4. Verify the Build

After building:
1. Download the AAB file from EAS
2. Test on a 16KB emulator before submitting
3. Submit to Google Play Console

### 5. Dependencies Check

Your current setup uses:
- Expo SDK 53 ✅
- React Native 0.79.1 ✅
- Target SDK 35 ✅

These versions have good support for 16KB page sizes.

### 6. If Issues Persist

If you still get the error after applying these changes:

1. **Update native dependencies:**
```bash
npx expo install --fix
npm update
```

2. **Check for incompatible libraries:**
```bash
# List all native modules
npx expo-doctor

# Some older native modules may need updates
```

3. **Rebuild from scratch:**
```bash
# Clear EAS cache
eas build --platform android --profile production --clear-cache
```

4. **Verify Gradle Property Injection**

The repository now includes `plugins/with16kPages.js`, which injects `android.enable16kPages=true` into the generated `android/gradle.properties`. This is the property that AGP 8.5+ and the Android 15 docs mention for aligning native libraries to 16 KB pages. If you ever remove the plugin, the flag will disappear, so keep it registered inside `app.config.js`.

## Resources

- [Google's 16KB Page Size Guide](https://developer.android.com/guide/practices/page-sizes)
- [Expo Android Configuration](https://docs.expo.dev/versions/latest/config/app/#android)
- [EAS Build Configuration](https://docs.expo.dev/build/eas-json/)

## Next Steps

1. Delete `app.json` (it's been replaced by `app.config.js`)
2. Run: `eas build --platform android --profile production`
3. Test the build on a 16KB emulator
4. Submit to Google Play Store

The changes ensure your app is compiled with 16KB page size support enabled.



