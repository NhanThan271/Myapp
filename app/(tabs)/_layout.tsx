import { Tabs } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#a78bfa',
        tabBarInactiveTintColor: 'rgba(255,255,255,0.5)',
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle: {
          backgroundColor: isDark ? '#0f0f23' : '#1a1a2e',
          height: Platform.OS === 'ios' ? 88 : 65,
          paddingBottom: Platform.OS === 'ios' ? 28 : 10,
          paddingTop: 10,
          paddingHorizontal: 10,
          borderTopWidth: 1,
          borderTopColor: 'rgba(139, 92, 246, 0.2)',
          elevation: 12,
          shadowColor: '#8b5cf6',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.2,
          shadowRadius: 16,
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
          marginTop: 4,
        },
        tabBarIconStyle: {
          marginTop: 0,
        },
      }}
    >

      {/* HOME */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'Trang chủ',
          tabBarIcon: ({ color, focused }) => (
            <IconSymbol
              name="home"
              color={color}
              size={26}
              focused={focused}
            />
          ),
        }}
      />

      {/* MOVIES */}
      <Tabs.Screen
        name="movies"
        options={{
          title: 'Phim',
          tabBarIcon: ({ color, focused }) => (
            <IconSymbol
              name="movies"
              color={color}
              size={26}
              focused={focused}
            />
          ),
        }}
      />

      {/* TICKETS */}
      <Tabs.Screen
        name="tickets"
        options={{
          title: 'Vé của tôi',
          tabBarIcon: ({ color, focused }) => (
            <IconSymbol
              name="tickets"
              color={color}
              size={26}
              focused={focused}
            />
          ),
        }}
      />

      {/* PROFILE */}
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Cá nhân',
          tabBarIcon: ({ color, focused }) => (
            <IconSymbol
              name="profile"
              color={color}
              size={26}
              focused={focused}
            />
          ),
        }}
      />
    </Tabs>
  );
}