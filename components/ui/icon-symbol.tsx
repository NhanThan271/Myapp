// components/ui/icon-symbol.tsx
import React from 'react';
import { Image, StyleSheet, View } from 'react-native';

interface IconSymbolProps {
  name: string;
  color?: string;
  size?: number;
  focused?: boolean;
}

export const IconSymbol = ({ name, color = '#000', size = 24, focused = false }: IconSymbolProps) => {
  const getIconSource = () => {
    switch (name) {
      case 'home':
        return require('@/assets/images/Home.png');
      case 'movies':
        return require('@/assets/images/Movie.png');
      case 'tickets':
        return require('@/assets/images/Ticket.png');
      case 'profile':
        return require('@/assets/images/Profile.png');
      default:
        return require('@/assets/images/Home.png');
    }
  };

  return (
    <View style={[
      styles.container,
      focused && styles.focusedContainer,
      { width: size + 26, height: size + 26 }
    ]}>
      <Image
        source={getIconSource()}
        style={{
          width: size,
          height: size,
        }}
        resizeMode="contain"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
  },
  focusedContainer: {
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
  },
});