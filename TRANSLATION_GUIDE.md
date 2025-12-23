# Translation System Documentation

## Overview
This app supports two languages: **English** and **Urdu (اُرْدُو)**. Users can switch between languages using the language toggle button throughout the app.

## How It Works (Simple Explanation)

### 1. **Translation Files**
All text translations are stored in JSON files:
- `i18n/locales/en.json` - English translations
- `i18n/locales/ur.json` - Urdu translations

Each file contains the same keys (like `auth.signIn`, `dashboard.title`) but with different values in each language.

**Example:**
```json
// en.json
{
  "auth": {
    "signIn": "Sign In"
  }
}

// ur.json
{
  "auth": {
    "signIn": "سائن ان"
  }
}
```

### 2. **Language Context (LanguageContext.tsx)**
This is the "brain" of the translation system. It:
- Remembers which language the user selected
- Saves the language preference to device storage (so it persists after app restart)
- Provides functions to switch languages
- Notifies all components when language changes

**Key Functions:**
- `setLanguage('en')` or `setLanguage('ur')` - Changes the language
- `toggleLanguage()` - Switches between English and Urdu
- `language` - Current selected language

### 3. **Language Toggle Button (LanguageToggle.tsx)**
A reusable button component that appears on various screens. When clicked, it switches the entire app's language.

**Location:** Usually appears in the header of pages (login, profile, dashboard, etc.)

### 4. **Using Translations in Components**

To make text translatable in any component:

**Step 1:** Import the translation hook
```typescript
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/context/LanguageContext';
```

**Step 2:** Get the translation function
```typescript
export default function MyComponent() {
  const { t } = useTranslation();
  const { language } = useLanguage(); // This forces re-render when language changes
  
  // Use t() to translate text
  return <Text>{t('auth.signIn')}</Text>;
}
```

**Step 3:** Replace hardcoded text
```typescript
// Before
<Text>Sign In</Text>

// After
<Text>{t('auth.signIn')}</Text>
```

### 5. **Translation Keys Structure**

Translation keys are organized by feature/screen:
- `auth.*` - Authentication pages (login, signup, etc.)
- `dashboard.*` - Dashboard screen
- `profile.*` - Profile/Settings screen
- `drivers.*` - Drivers management
- `journeys.*` - Journeys/Orders list
- `journeyDetails.*` - Journey details page
- `common.*` - Common/shared translations

**Example Key:** `auth.signIn` means:
- Category: `auth`
- Specific text: `signIn`

## How Language Switching Works

1. User clicks the language toggle button
2. `LanguageContext` updates the language state
3. `i18next` library changes its active language
4. All components using `t()` automatically re-render with new translations
5. The selected language is saved to device storage

## Adding New Translations

### Step 1: Add to English file (`en.json`)
```json
{
  "auth": {
    "newText": "Hello World"
  }
}
```

### Step 2: Add to Urdu file (`ur.json`)
```json
{
  "auth": {
    "newText": "ہیلو ورلڈ"
  }
}
```

### Step 3: Use in component
```typescript
<Text>{t('auth.newText')}</Text>
```

## Special Features

### 1. **Dynamic Values**
You can insert variables into translations:

**Translation files:**
```json
{
  "auth": {
    "welcome": "Welcome, {{name}}!"
  }
}
```

**Usage:**
```typescript
<Text>{t('auth.welcome', { name: 'John' })}</Text>
// Output: "Welcome, John!"
```

### 2. **Name Transliteration**
Driver and client names are automatically transliterated to Urdu script when Urdu is selected. This is handled by the `translateName()` function in relevant components.

### 3. **Status Values**
Status values (like "pending", "completed") are displayed as-is (not translated) as per requirements.

## File Structure

```
cargo360-driver-app/
├── i18n/
│   ├── index.ts              # i18next configuration
│   └── locales/
│       ├── en.json           # English translations
│       └── ur.json           # Urdu translations
├── context/
│   └── LanguageContext.tsx   # Language state management
└── components/
    └── LanguageToggle.tsx    # Language toggle button
```

## Important Notes

1. **Always use `useLanguage()` hook** in components that need to re-render when language changes, even if you don't use the `language` variable directly.

2. **Translation keys must match exactly** between `en.json` and `ur.json` files.

3. **The language preference is saved** to device storage, so it persists across app restarts.

4. **All text should be translatable** - avoid hardcoded strings in components.

## Troubleshooting

**Problem:** Text not translating
- **Solution:** Make sure you're using `t('key')` and the key exists in both translation files

**Problem:** Component not updating when language changes
- **Solution:** Add `const { language } = useLanguage();` to force re-render

**Problem:** Translation key not found
- **Solution:** Check that the key exists in both `en.json` and `ur.json` with the exact same path

## Summary

The translation system works like a dictionary:
1. You define words/phrases in two languages (English and Urdu)
2. Components look up the current language's translation
3. When language changes, all components automatically update
4. The preference is saved so it persists

It's that simple! 🎉

