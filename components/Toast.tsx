import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text } from 'react-native';

interface ToastProps {
    visible: boolean;
    message: string;
    type?: 'error' | 'success' | 'info';
    onHide: () => void;
}

export const Toast: React.FC<ToastProps> = ({ visible, message, type = 'error', onHide }) => {
    const opacity = useRef(new Animated.Value(0)).current;
    const translateY = useRef(new Animated.Value(-100)).current;

    useEffect(() => {
        if (visible) {
            Animated.parallel([
                Animated.timing(opacity, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true,
                }),
                Animated.spring(translateY, {
                    toValue: 0,
                    tension: 65,
                    friction: 8,
                    useNativeDriver: true,
                }),
            ]).start();

            const timer = setTimeout(() => {
                Animated.parallel([
                    Animated.timing(opacity, {
                        toValue: 0,
                        duration: 300,
                        useNativeDriver: true,
                    }),
                    Animated.timing(translateY, {
                        toValue: -100,
                        duration: 300,
                        useNativeDriver: true,
                    }),
                ]).start(() => {
                    onHide();
                });
            }, 3000);

            return () => clearTimeout(timer);
        }
    }, [visible]);

    if (!visible) return null;

    const backgroundColor = type === 'error' ? '#dc2626' : type === 'success' ? '#10B981' : '#ffd700';

    return (
        <Animated.View
            style={[
                styles.container,
                {
                    opacity,
                    transform: [{ translateY }],
                    backgroundColor,
                },
            ]}
        >
            <Text style={styles.message}>{message}</Text>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: 60,
        left: 20,
        right: 20,
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
        zIndex: 9999,
    },
    icon: {
        fontSize: 20,
        marginRight: 12,
    },
    message: {
        flex: 1,
        color: '#fff',
        fontSize: 15,
        fontWeight: '600',
    },
});