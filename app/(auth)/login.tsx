import { useAuth } from '@/components/contexts/AuthContext';
import { Toast } from '@/components/Toast';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

const API_URL = 'https://backend-ltud2.onrender.com/api/auth';

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({
    visible: false,
    message: '',
    type: 'error' as 'error' | 'success' | 'info'
  });

  const showToast = (message: string, type: 'error' | 'success' | 'info' = 'error') => {
    setToast({ visible: true, message, type });
  };

  const handleLogin = async () => {
    if (!username || !password) {
      showToast('Vui lòng nhập đầy đủ thông tin!', 'error');
      return;
    }

    if (password.length < 6) {
      showToast('Mật khẩu phải có ít nhất 6 ký tự!', 'error');
      return;
    }

    setLoading(true);

    try {
      console.log('Sending login request to:', `${API_URL}/login`);
      console.log('Request data:', { username: username.trim() });

      const response = await axios.post(`${API_URL}/login`, {
        username: username.trim(),
        password: password,
      });

      console.log('Full response data:', JSON.stringify(response.data, null, 2));

      if (!response.data || !response.data.token) {
        throw new Error('Token not found in response');
      }

      const { token, id, username: userName, email, roles } = response.data;

      // ✅ Decode token để debug
      const decoded = parseJwt(token);
      console.log('🔓 Decoded token:', JSON.stringify(decoded, null, 2));

      // ✅ Lưu thông tin vào AsyncStorage
      await AsyncStorage.setItem('authToken', token);
      await AsyncStorage.setItem('userId', id.toString()); // ✅ Dùng 'id' từ response
      await AsyncStorage.setItem('username', userName);
      await AsyncStorage.setItem('email', email || '');
      await AsyncStorage.setItem('roles', JSON.stringify(roles));

      console.log('✅ Data saved to AsyncStorage');

      showToast('Đăng nhập thành công!', 'success');
      login();

      setTimeout(() => {
        router.replace('/(tabs)');
      }, 1000);

    } catch (error: any) {
      console.error('Login error:', error);

      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', JSON.stringify(error.response.data, null, 2));
        const errorMessage = error.response.data?.message || 'Đăng nhập thất bại!';
        showToast(errorMessage, 'error');
      } else if (error.request) {
        console.error('Request error - No response received');
        showToast('Không thể kết nối đến server!', 'error');
      } else {
        console.error('Error message:', error.message);
        showToast(error.message || 'Đã xảy ra lỗi không xác định!', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  // ✅ Helper function parse JWT
  const parseJwt = (token: string) => {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch (error) {
      console.error('Error parsing JWT:', error);
      return null;
    }
  };

  return (
    <View style={styles.container}>
      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={() => setToast({ ...toast, visible: false })}
      />

      <View style={styles.card}>
        <Image
          source={require('@/assets/images/LogoCinema.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.heading}>Đăng nhập</Text>
        <Text style={styles.subtitle}>Đặt vé xem phim ngay hôm nay</Text>

        <Text style={styles.label}>Tên đăng nhập</Text>
        <TextInput
          style={styles.input}
          placeholder="Nhập tên đăng nhập"
          placeholderTextColor="#a0a0ab"
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
          editable={!loading}
        />

        <Text style={styles.label}>Mật khẩu</Text>
        <TextInput
          style={styles.input}
          placeholder="Nhập mật khẩu"
          placeholderTextColor="#a0a0ab"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          editable={!loading}
        />

        <TouchableOpacity
          style={styles.forgotButton}
          disabled={loading}
        >
          <Text
            style={styles.forgotText}
            onPress={() => router.push('/(auth)/ForgotPasswordScreen')}
          >
            Quên mật khẩu?
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.loginButton, loading && styles.loginButtonDisabled]}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.loginButtonText}>Đăng nhập</Text>
          )}
        </TouchableOpacity>

        <Text style={styles.dividerText}>hoặc tiếp tục với</Text>

        <View style={styles.socialRow}>
          <TouchableOpacity
            style={styles.socialButton}
            disabled={loading}
          >
            <Text style={styles.socialText}>Google</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.socialButton}
            disabled={loading}
          >
            <Text style={styles.socialText}>Facebook</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.signupText}>
          Chưa có tài khoản?{' '}
          <Text
            style={styles.signupLink}
            onPress={() => !loading && router.push('/(auth)/register')}
          >
            Đăng ký
          </Text>
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#16161d',
    padding: 20,
  },
  card: {
    backgroundColor: '#0a0a0f',
    borderRadius: 16,
    padding: 40,
    width: '100%',
    maxWidth: 500,
    shadowColor: '#e50914',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  heading: {
    fontSize: 32,
    fontWeight: '700',
    textAlign: 'center',
    color: '#f5f5f7',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    color: '#a0a0ab',
    marginBottom: 36,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#f5f5f7',
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    backgroundColor: '#1e1e28',
    color: '#f5f5f7',
  },
  forgotButton: {
    alignSelf: 'flex-end',
    marginTop: 12,
    marginBottom: 24,
  },
  forgotText: {
    color: '#ffd700',
    fontSize: 14,
    fontWeight: '600',
  },
  loginButton: {
    backgroundColor: '#e50914',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#e50914',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  loginButtonDisabled: {
    opacity: 0.6,
  },
  loginButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  dividerText: {
    textAlign: 'center',
    color: '#a0a0ab',
    fontSize: 14,
    marginBottom: 20,
  },
  socialRow: {
    flexDirection: 'row',
    marginBottom: 28,
    gap: 12,
  },
  socialButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    backgroundColor: '#1e1e28',
  },
  socialText: {
    color: '#f5f5f7',
    fontSize: 15,
    fontWeight: '500',
  },
  signupText: {
    textAlign: 'center',
    color: '#a0a0ab',
    fontSize: 15,
  },
  signupLink: {
    color: '#e50914',
    fontWeight: '700',
  },
  logo: {
    width: 140,
    height: 140,
    alignSelf: 'center',
    marginBottom: 16,
  },
});