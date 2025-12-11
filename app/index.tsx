import SplashScreen from '@/app/(plash)/splashScreen';
import { useAuth } from '@/components/contexts/AuthContext';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';

export default function Index() {
    const router = useRouter();
    const { isAuthenticated } = useAuth();
    const [showSplash, setShowSplash] = useState(true);

    useEffect(() => {
        if (showSplash) return;

        // Redirect based on authentication status after splash
        const timeout = setTimeout(() => {
            if (isAuthenticated) {
                router.replace('/(tabs)');
            } else {
                router.replace('/(auth)/login');
            }
        }, 100);

        return () => clearTimeout(timeout);
    }, [isAuthenticated, showSplash]);

    if (showSplash) {
        return <SplashScreen onFinish={() => setShowSplash(false)} />;
    }

    return null;
}