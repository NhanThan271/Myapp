import { useEffect, useRef } from 'react';
import { Animated, Dimensions, StyleSheet, Text, View } from 'react-native';

const { height } = Dimensions.get('window');

export default function SplashScreen({ onFinish }) {
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(0.3)).current;
    const progressAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        // Logo animation
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 1000,
                useNativeDriver: true,
            }),
            Animated.spring(scaleAnim, {
                toValue: 1,
                tension: 50,
                friction: 7,
                useNativeDriver: true,
            }),
        ]).start();

        // Progress bar animation
        Animated.timing(progressAnim, {
            toValue: 1,
            duration: 5000,
            useNativeDriver: false,
        }).start();

        // Hide splash after 5 seconds
        const timer = setTimeout(() => {
            Animated.timing(fadeAnim, {
                toValue: 0,
                duration: 500,
                useNativeDriver: true,
            }).start(() => {
                onFinish();
            });
        }, 5000);

        return () => clearTimeout(timer);
    }, []);

    const progressWidth = progressAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0%', '100%'],
    });

    return (
        <View style={styles.container}>
            {/* Background gradient effect */}
            <View style={styles.gradientTop} />
            <View style={styles.gradientBottom} />

            {/* Animated content */}
            <Animated.View
                style={[
                    styles.content,
                    {
                        opacity: fadeAnim,
                        transform: [{ scale: scaleAnim }],
                    },
                ]}
            >
                {/* Logo */}
                <View style={styles.logoContainer}>
                    <View style={styles.logo}>
                        <Text style={styles.logoIcon}>🎬</Text>
                    </View>
                </View>

                {/* App name */}
                <Text style={styles.appName}>CinemaHub</Text>
                <Text style={styles.tagline}>Book Your Perfect Movie Experience</Text>

                {/* Loading bar */}
                <View style={styles.progressBarContainer}>
                    <Animated.View
                        style={[
                            styles.progressBar,
                            { width: progressWidth },
                        ]}
                    />
                </View>

                <Text style={styles.loadingText}>Loading...</Text>
            </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#16161d',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
    },
    gradientTop: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: height / 2,
        backgroundColor: '#0a0a0f',
        opacity: 0.3,
    },
    gradientBottom: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: height / 2,
        backgroundColor: '#16161d',
        opacity: 0.4,
    },
    content: {
        alignItems: 'center',
        zIndex: 10,
    },
    logoContainer: {
        marginBottom: 30,
    },
    logo: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: '#DC2626',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#FBBF24',
        shadowOffset: {
            width: 0,
            height: 10,
        },
        shadowOpacity: 0.5,
        shadowRadius: 20,
        elevation: 15,
        borderWidth: 3,
        borderColor: '#FBBF24',
    },
    logoIcon: {
        fontSize: 60,
    },
    appName: {
        fontSize: 48,
        fontWeight: 'bold',
        color: '#FBBF24',
        marginBottom: 10,
        textAlign: 'center',
        textShadowColor: '#DC2626',
        textShadowOffset: { width: 2, height: 2 },
        textShadowRadius: 5,
    },
    tagline: {
        fontSize: 18,
        color: '#F3F4F6',
        opacity: 0.9,
        marginBottom: 40,
        textAlign: 'center',
        letterSpacing: 1,
    },
    progressBarContainer: {
        width: 250,
        height: 8,
        backgroundColor: 'rgba(251, 191, 36, 0.2)',
        borderRadius: 4,
        overflow: 'hidden',
        marginBottom: 15,
        borderWidth: 1,
        borderColor: 'rgba(251, 191, 36, 0.3)',
    },
    progressBar: {
        height: '100%',
        backgroundColor: '#FBBF24',
        borderRadius: 4,
    },
    loadingText: {
        color: '#F3F4F6',
        fontSize: 14,
        opacity: 0.75,
        letterSpacing: 2,
    },
});