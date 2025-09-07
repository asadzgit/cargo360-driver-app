import { useEffect, useRef } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { WebView } from 'react-native-webview';

interface ClientTrackingEmbedProps {
  journeyId: string;
  onLocationUpdate?: (location: any) => void;
}

const { width, height } = Dimensions.get('window');

export function ClientTrackingEmbed({ journeyId, onLocationUpdate }: ClientTrackingEmbedProps) {
  const webViewRef = useRef<WebView>(null);

  const clientTrackingUrl = `/client-tracking?journey=${journeyId}`;

  const handleMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'location_update' && onLocationUpdate) {
        onLocationUpdate(data.payload);
      }
    } catch (error) {
      console.error('Error parsing WebView message:', error);
    }
  };

  const injectedJavaScript = `
    // Listen for location updates and send to React Native
    window.addEventListener('driverLocationUpdate', (event) => {
      window.ReactNativeWebView.postMessage(JSON.stringify({
        type: 'location_update',
        payload: event.detail
      }));
    });
    
    // Override the handleDriverLocationUpdate function to dispatch custom events
    const originalHandler = window.handleDriverLocationUpdate;
    window.handleDriverLocationUpdate = function(data) {
      if (originalHandler) {
        originalHandler(data);
      }
      
      // Dispatch custom event for React Native
      window.dispatchEvent(new CustomEvent('driverLocationUpdate', {
        detail: data
      }));
    };
    
    true; // Required for injected JavaScript
  `;

  return (
    <View style={styles.container}>
      <WebView
        ref={webViewRef}
        source={{ uri: clientTrackingUrl }}
        style={styles.webview}
        onMessage={handleMessage}
        injectedJavaScript={injectedJavaScript}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        scalesPageToFit={true}
        scrollEnabled={true}
        bounces={false}
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  webview: {
    flex: 1,
    backgroundColor: 'transparent',
  },
});