import { Tabs } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { Chrome as Home, Users, Truck, User } from 'lucide-react-native';

export default function TabLayout() {
  const { user } = useAuth();
  const isBroker = user?.role === 'trucker';
  const isDriver = user?.role === 'driver';

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: isBroker ? '#2563eb' : '#059669',
        tabBarInactiveTintColor: '#94a3b8',
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopColor: '#e2e8f0',
          paddingBottom: 8,
          paddingTop: 8,
          height: 80,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ size, color }) => (
            <Home size={size} color={color} />
          ),
        }}
      />
      
      {isBroker && !isDriver && (
        <Tabs.Screen
          name="drivers"
          options={{
            title: 'Drivers',
            tabBarIcon: ({ size, color }) => (
              <Users size={size} color={color} />
            ),
          }}
        />
      )}

      <Tabs.Screen
        name="journeys"
        options={{
          title: isBroker ? 'Orders' : 'Orders',
          tabBarIcon: ({ size, color }) => (
            <Truck size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ size, color }) => (
            <User size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}