import { useRef, useCallback } from 'react';
import { ScrollView } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

/**
 * Hook to automatically scroll to top when screen comes into focus
 * Usage:
 * const scrollRef = useScrollToTopOnFocus();
 * <ScrollView ref={scrollRef}>...</ScrollView>
 */
export function useScrollToTopOnFocus() {
  const scrollRef = useRef<ScrollView>(null);

  useFocusEffect(
    useCallback(() => {
      // Scroll to top when screen comes into focus
      scrollRef.current?.scrollTo({ y: 0, animated: false });
    }, [])
  );

  return scrollRef;
}

