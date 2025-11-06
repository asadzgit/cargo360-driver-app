# Dependency & API Level 35 Fix Guide

## 🔍 Issues Found and Fixed

### 1. ✅ SDK Version Mismatch (FIXED)
**Problem**: 
- `package.json` had Expo SDK **53**
- `app.json` had `sdkVersion: "52.0.0"`

**Solution**: 
- Removed `sdkVersion` from `app.json` (Expo SDK 53 auto-determines this)
- SDK version is now controlled by the `expo` package version in `package.json`

### 2. ✅ Android API Level (FIXED)
**Problem**: Targeting API level 34 (Google requires 35)

**Solution**: Added to `app.json`:
```json
"targetSdkVersion": 35,
"compileSdkVersion": 35
```

### 3. ⚠️ Package Compatibility (NEEDS UPDATE)
Some packages may need updates to work perfectly with:
- Expo SDK 53
- React Native 0.79.1
- Android API Level 35

---

## 🚀 Quick Fix (Recommended)

### Option 1: Automatic Fix Script

```bash
./fix-dependencies.sh
```

This script will:
1. Update Expo CLI globally
2. Update EAS CLI globally
3. Fix all Expo packages to match SDK 53
4. Update critical packages (location, notifications, camera)
5. Clean reinstall all dependencies

### Option 2: Manual Fix

```bash
# Step 1: Update Expo packages to match SDK 53
npx expo install --fix

# Step 2: Update critical packages
npx expo install expo-location@latest
npx expo install expo-task-manager@latest
npx expo install expo-notifications@latest

# Step 3: Clean install
rm -rf node_modules
npm install

# Step 4: Test locally
npx expo start --clear
```

---

## 📦 Current Package Versions

Your app is using:
- ✅ **Expo SDK**: 53.0.0 (Latest - supports API 35)
- ✅ **React Native**: 0.79.1 (Latest)
- ✅ **React**: 19.0.0 (Latest)

### Packages That May Need Updates:

| Package | Current | Notes |
|---------|---------|-------|
| `expo-location` | ^18.1.6 | Should work with API 35 |
| `expo-task-manager` | 13.1.6 | May need update for API 35 |
| `expo-notifications` | ^0.31.4 | Check compatibility |
| `expo-camera` | ~16.1.5 | Should work with API 35 |

---

## 🔧 Detailed Fix Steps

### Step 1: Update Expo CLI & EAS CLI

```bash
# Update Expo CLI
npm install -g expo-cli@latest

# Update EAS CLI (for building)
npm install -g eas-cli@latest
```

### Step 2: Fix Expo Package Versions

```bash
# This command checks all expo-* packages and updates them
# to versions compatible with your Expo SDK (53)
npx expo install --fix
```

### Step 3: Update Specific Critical Packages

```bash
# Location services (important for your app)
npx expo install expo-location@latest

# Background tasks (for location tracking)
npx expo install expo-task-manager@latest

# Notifications
npx expo install expo-notifications@latest

# Camera (if used)
npx expo install expo-camera@latest
```

### Step 4: Clean Installation

```bash
# Remove old node_modules and lockfile
rm -rf node_modules
rm package-lock.json  # or yarn.lock if using yarn

# Fresh install
npm install
```

### Step 5: Clear Cache and Test

```bash
# Clear Expo cache and start
npx expo start --clear

# Test on Android (if possible)
npx expo start --android
```

---

## 🏗️ Building for Play Store After Fixes

Once dependencies are updated:

```bash
# Login to EAS (if not already)
eas login

# Build for production
eas build --platform android --profile production

# Or build with cache cleared
eas build --platform android --profile production --clear-cache
```

---

## ⚙️ What Each Fix Does

### Removing `sdkVersion` from app.json
- **Why**: Expo SDK 53+ determines SDK version automatically
- **Impact**: Prevents version conflicts
- **Safe**: Yes, this is the recommended approach

### Adding `targetSdkVersion: 35`
- **Why**: Google Play Store requirement (as of November 2024)
- **Impact**: Ensures app uses latest Android APIs
- **Safe**: Yes, Expo SDK 53 fully supports this

### Running `expo install --fix`
- **Why**: Ensures all expo-* packages match SDK version
- **Impact**: Prevents build and runtime errors
- **Safe**: Yes, this is the recommended way to update

---

## 🧪 Testing Checklist

After running the fixes, test these features:

- [ ] App starts without errors
- [ ] Location tracking works
- [ ] Background location works
- [ ] Notifications appear
- [ ] Camera opens (if used)
- [ ] Maps display correctly
- [ ] Navigation works

---

## 🚨 Common Issues & Solutions

### Issue 1: "Expo module not found"
**Solution**:
```bash
npx expo install --fix
npx expo start --clear
```

### Issue 2: "Native module cannot be null"
**Solution**:
```bash
rm -rf node_modules
npm install
npx expo prebuild --clean
```

### Issue 3: Build fails with "SDK version mismatch"
**Solution**:
```bash
# Make sure app.json doesn't have sdkVersion field
# Then rebuild with cache cleared
eas build --platform android --profile production --clear-cache
```

### Issue 4: Location permissions not working
**Solution**:
Check your `app.json` has these permissions:
```json
"permissions": [
  "ACCESS_FINE_LOCATION",
  "ACCESS_COARSE_LOCATION",
  "ACCESS_BACKGROUND_LOCATION"
]
```

---

## 📱 Android API Level 35 Requirements

Android 15 (API 35) introduces new requirements:

### 1. **Foreground Service Types**
If using background location, ensure you declare the service type:
```json
"android": {
  "foregroundServiceTypes": ["location"]
}
```

### 2. **Runtime Permissions**
Some permissions now require additional runtime handling.

### 3. **Background Location**
Stricter requirements - make sure you really need it.

---

## 🔄 Version Compatibility Matrix

| Component | Version | API 35 Support |
|-----------|---------|----------------|
| Expo SDK | 53.0.0 | ✅ Yes |
| React Native | 0.79.1 | ✅ Yes |
| React | 19.0.0 | ✅ Yes |
| expo-location | 18.1.6+ | ✅ Yes |
| expo-notifications | 0.31.4+ | ✅ Yes |

---

## 📋 Complete Fix Sequence

```bash
# 1. Update global tools
npm install -g expo-cli@latest eas-cli@latest

# 2. Fix Expo packages
npx expo install --fix

# 3. Update critical packages
npx expo install expo-location@latest expo-task-manager@latest expo-notifications@latest

# 4. Clean install
rm -rf node_modules && npm install

# 5. Test locally
npx expo start --clear

# 6. Build for Play Store
eas build --platform android --profile production --clear-cache
```

---

## ✅ Verification

After fixing, verify:

1. **Check package.json**:
   ```bash
   cat package.json | grep expo
   ```
   All expo packages should have compatible versions

2. **Check app.json**:
   - No `sdkVersion` field
   - `targetSdkVersion: 35` is present
   - `compileSdkVersion: 35` is present

3. **Test build**:
   ```bash
   eas build --platform android --profile production
   ```
   Should complete without SDK version errors

---

## 🎯 Final Checklist Before Play Store Upload

- [ ] Ran `./fix-dependencies.sh` OR manual fixes
- [ ] Tested app locally with `npx expo start --clear`
- [ ] No console errors or warnings
- [ ] Built with `eas build --platform android --profile production`
- [ ] Downloaded `.aab` file
- [ ] Verified target SDK is 35 in build logs
- [ ] Ready to upload to Play Console!

---

## 💡 Pro Tips

1. **Always use `--clear-cache`** when building after dependency changes
2. **Test on a real Android device** before submitting
3. **Keep EAS CLI updated**: `npm install -g eas-cli@latest`
4. **Use `expo-doctor`** to check for issues: `npx expo-doctor`

---

Need help? Run:
```bash
npx expo-doctor  # Diagnose issues
eas build:list   # Check build status
eas whoami       # Verify login
```

