import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Share, Alert } from 'react-native';
import { useAuth } from '@/context/AuthContext';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ClientTrackingEmbed } from '@/components/ClientTrackingEmbed';
import { ArrowLeft, Share2, ExternalLink } from 'lucide-react-native';

export default function ClientViewScreen() {
  const { user } = useAuth();
  const { journeyId } = useLocalSearchParams();
  const router = useRouter();
  const [locationData, setLocationData] = useState(null);

  const handleLocationUpdate = (location: any) => {
    setLocationData(location);
  };

  const shareTrackingLink = async () => {
    const trackingUrl = `${window.location.origin}/client-tracking?journey=${journeyId}`;
    
    try {
      if (Share.share) {
        await Share.share({
          message: `Track your delivery in real-time: ${trackingUrl}`,
          url: trackingUrl,
          title: 'Track Your Delivery',
        });
      } else {
        // Fallback for web
        if (navigator.share) {
          await navigator.share({
            title: 'Track Your Delivery',
            text: 'Track your delivery in real-time',
            url: trackingUrl,
          });
        } else {
          // Copy to clipboard
          await navigator.clipboard.writeText(trackingUrl);
          Alert.alert('Link Copied', 'Tracking link copied to clipboard');
        }
      }
    } catch (error) {
      console.error('Error sharing:', error);
      Alert.alert('Error', 'Failed to share tracking link');
    }
  };

  const openInBrowser = () => {
    const trackingUrl = `/client-tracking?journey=${journeyId}`;
    if (typeof window !== 'undefined') {
      window.open(trackingUrl, '_blank');
    }
  };

  if (user?.role !== 'broker') {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Broker access required</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color="#64748b" />
        </TouchableOpacity>
        <Text style={styles.title}>Client Tracking View</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.shareButton} onPress={shareTrackingLink}>
            <Share2 size={20} color="#ffffff" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.openButton} onPress={openInBrowser}>
            <ExternalLink size={20} color="#ffffff" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.infoBar}>
        <Text style={styles.infoText}>
          This is how your client will see the live tracking interface
        </Text>
      </View>

      <ClientTrackingEmbed 
        journeyId={journeyId as string}
        onLocationUpdate={handleLocationUpdate}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
    flex: 1,
    marginLeft: 16,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  shareButton: {
    backgroundColor: '#10b981',
    padding: 8,
    borderRadius: 8,
  },
  openButton: {
    backgroundColor: '#2563eb',
    padding: 8,
    borderRadius: 8,
  },
  infoBar: {
    backgroundColor: '#dbeafe',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#bfdbfe',
  },
  infoText: {
    fontSize: 14,
    color: '#1e40af',
    textAlign: 'center',
    fontWeight: '500',
  },
  errorText: {
    fontSize: 18,
    color: '#dc2626',
    textAlign: 'center',
    marginTop: 100,
  },
});