import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { useLanguage } from '@/context/LanguageContext';

export function LanguageToggle() {
  try {
    const { language, toggleLanguage } = useLanguage();

    return (
      <TouchableOpacity 
        style={styles.toggle} 
        onPress={toggleLanguage} 
        activeOpacity={0.7}
        testID="language-toggle"
      >
        <Text style={[styles.languageText, language === 'en' && styles.activeLanguage]}>
          Eng
        </Text>
        <Text style={styles.separator}> | </Text>
        <Text style={[styles.languageText, language === 'ur' && styles.activeLanguage]}>
          اُرْدُو
        </Text>
      </TouchableOpacity>
    );
  } catch (error) {
    console.error('LanguageToggle error:', error);
    // Fallback if context is not available - still show the button
    return (
      <TouchableOpacity style={styles.toggle} activeOpacity={0.7}>
        <Text style={styles.languageText}>Eng</Text>
        <Text style={styles.separator}> | </Text>
        <Text style={styles.languageText}>اُرْدُو</Text>
      </TouchableOpacity>
    );
  }
}

const styles = StyleSheet.create({
  toggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#2563eb',
    backgroundColor: '#ffffff',
    minWidth: 120,
    minHeight: 44,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },
  languageText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748b',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  activeLanguage: {
    color: '#2563eb',
    fontWeight: '700',
    fontSize: 17,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  separator: {
    fontSize: 16,
    color: '#94a3b8',
    marginHorizontal: 8,
    fontWeight: '500',
  },
});
