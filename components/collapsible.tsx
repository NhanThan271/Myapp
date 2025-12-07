import React, { useState } from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import RNCollapsible from 'react-native-collapsible';
import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';

type CollapsibleProps = {
  title: string;
  children: React.ReactNode;
};

export function Collapsible({ title, children }: CollapsibleProps) {
  const [isCollapsed, setIsCollapsed] = useState(true);

  return (
    <ThemedView style={styles.container}>
      <TouchableOpacity 
        style={styles.header} 
        onPress={() => setIsCollapsed(!isCollapsed)}
      >
        <ThemedText type="defaultSemiBold">{title}</ThemedText>
        <ThemedText>{isCollapsed ? '▼' : '▲'}</ThemedText>
      </TouchableOpacity>
      
      <RNCollapsible collapsed={isCollapsed}>
        <ThemedView style={styles.content}>
          {children}
        </ThemedView>
      </RNCollapsible>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: 'rgba(128, 128, 128, 0.1)',
    borderRadius: 8,
  },
  content: {
    padding: 16,
    gap: 8,
  },
});