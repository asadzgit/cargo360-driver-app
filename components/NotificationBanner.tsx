import React, { useEffect, useState, useRef, useCallback } from 'react';
import { View, Text, TouchableOpacity, Animated, StyleSheet } from 'react-native';
import socketService, { NotificationPayload } from '@/services/socketService';
import { X, Bell, Truck, Package, CheckCircle, AlertCircle, Info } from 'lucide-react-native';

export default function NotificationBanner() {
  const [currentNotification, setCurrentNotification] = useState<NotificationPayload | null>(null);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(-100));
  const [scaleAnim] = useState(new Animated.Value(0.95));
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const getNotificationIcon = (notification: NotificationPayload) => {
    const updateType = notification.data?.updateType;
    const type = notification.data?.type;

    if (type === 'shipment_update') {
      if (updateType === 'assigned') {
        return <Truck size={22} color="#ffffff" />;
      } else if (updateType === 'status_change') {
        return <CheckCircle size={22} color="#ffffff" />;
      } else if (updateType === 'cancelled') {
        return <AlertCircle size={22} color="#ffffff" />;
      }
      return <Package size={22} color="#ffffff" />;
    }
    return <Bell size={22} color="#ffffff" />;
  };

  const getNotificationColor = (notification: NotificationPayload) => {
    const updateType = notification.data?.updateType;
    const type = notification.data?.type;

    if (type === 'shipment_update') {
      if (updateType === 'assigned') {
        return { primary: '#2563eb', secondary: '#1e40af', accent: '#3b82f6' }; // Blue
      } else if (updateType === 'status_change') {
        return { primary: '#059669', secondary: '#047857', accent: '#10b981' }; // Green
      } else if (updateType === 'cancelled') {
        return { primary: '#dc2626', secondary: '#b91c1c', accent: '#ef4444' }; // Red
      }
      return { primary: '#f59e0b', secondary: '#d97706', accent: '#fbbf24' }; // Amber
    }
    return { primary: '#6366f1', secondary: '#4f46e5', accent: '#818cf8' }; // Indigo
  };

  const dismissNotification = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: -100,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setCurrentNotification(null);
    });
  }, [fadeAnim, slideAnim, scaleAnim]);

  useEffect(() => {
    const handleNotification = (notification: NotificationPayload) => {
      // Clear any existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      setCurrentNotification(notification);

      // Reset animations
      fadeAnim.setValue(0);
      slideAnim.setValue(-100);
      scaleAnim.setValue(0.95);

      // Animate in with spring effect
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 350,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 65,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 65,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto dismiss after 6 seconds
      timeoutRef.current = setTimeout(() => {
        dismissNotification();
      }, 6000);
    };

    socketService.on('notification', handleNotification);

    return () => {
      socketService.off('notification', handleNotification);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [dismissNotification, fadeAnim, slideAnim, scaleAnim]);

  if (!currentNotification) return null;

  const colors = getNotificationColor(currentNotification);
  const icon = getNotificationIcon(currentNotification);

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [
            { translateY: slideAnim },
            { scale: scaleAnim },
          ],
        },
      ]}
    >
      <View
        style={[
          styles.content,
          {
            backgroundColor: colors.primary,
            borderLeftColor: colors.accent,
          },
        ]}
      >
        {/* Icon Container */}
        <View style={[styles.iconContainer, { backgroundColor: colors.secondary }]}>
          {icon}
        </View>

        {/* Text Content */}
        <View style={styles.textContainer}>
          <Text style={styles.title} numberOfLines={1}>
            {currentNotification.title}
          </Text>
          <Text style={styles.body} numberOfLines={2}>
            {currentNotification.body}
          </Text>
        </View>

        {/* Close Button */}
        <TouchableOpacity
          onPress={dismissNotification}
          style={styles.closeButton}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          activeOpacity={0.7}
        >
          <View style={[styles.closeButtonBg, { backgroundColor: colors.secondary }]}>
            <X size={14} color="#ffffff" strokeWidth={2.5} />
          </View>
        </TouchableOpacity>
      </View>

      {/* Bottom accent line */}
      <View style={[styles.accentLine, { backgroundColor: colors.accent }]} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 50,
    left: 16,
    right: 16,
    zIndex: 1000,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  content: {
    padding: 16,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderLeftWidth: 4,
    minHeight: 80,
    overflow: 'hidden',
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    flexShrink: 0,
  },
  textContainer: {
    flex: 1,
    marginRight: 8,
    paddingTop: 2,
  },
  title: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 15,
    marginBottom: 6,
    letterSpacing: 0.2,
  },
  body: {
    color: '#ffffff',
    fontSize: 13,
    opacity: 0.92,
    lineHeight: 18,
    letterSpacing: 0.1,
  },
  closeButton: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -2,
    marginRight: -2,
    flexShrink: 0,
  },
  closeButtonBg: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.8,
  },
  accentLine: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
});

