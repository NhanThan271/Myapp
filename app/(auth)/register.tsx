import { Toast } from '@/components/Toast';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function RegisterScreen() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'error' as 'error' | 'success' | 'info' });

  const showToast = (message: string, type: 'error' | 'success' | 'info' = 'error') => {
    setToast({ visible: true, message, type });
  };

  const handleRegister = () => {
    if (password !== confirmPassword) {
      showToast('Mật khẩu không khớp!');
      return;
    }

    // Kiểm tra các trường bắt buộc
    if (!fullName || !email || !password) {
      showToast('Vui lòng điền đầy đủ thông tin!');
      return;
    }

    console.log('Register:', { fullName, email, password });

    // Hiển thị thông báo đăng ký thành công
    showToast('Đăng ký thành công!', 'success');
    setTimeout(() => {
      router.back();
    }, 2000);

  };

  const getPasswordStrength = () => {
    if (password.length === 0) return null;

    const hasNumber = /\d/.test(password); // Kiểm tra có số
    const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password); // Kiểm tra có ký tự đặc biệt
    const hasUpperCase = /[A-Z]/.test(password); // Kiểm tra có chữ hoa
    const hasLowerCase = /[a-z]/.test(password); // Kiểm tra có chữ thường

    if (password.length < 6) {
      return { label: 'Yếu', color: '#dc2626' };
    }

    if (hasNumber && password.length >= 6) {
      if (hasSpecialChar || (hasUpperCase && hasLowerCase && hasNumber && password.length >= 8)) {
        return { label: 'Mạnh', color: '#10B981' };
      }
      return { label: 'Trung bình', color: '#ffd700' };
    }
    // Yếu: Chỉ có chữ, không có số
    return { label: 'Yếu', color: '#dc2626' };
  };

  const strength = getPasswordStrength();

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={() => setToast({ ...toast, visible: false })}
      />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
          {/* Icon */}
          <View style={styles.iconContainer}>
            <Image
              source={require('@/assets/images/LogoCinema.png')}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>

          {/* Title */}
          <Text style={styles.title}>Đăng ký</Text>
          <Text style={styles.subtitle}>Tạo tài khoản để đặt vé xem phim</Text>

          {/* Full Name Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Họ và tên</Text>
            <TextInput
              style={styles.input}
              placeholder="Nhập họ và tên"
              placeholderTextColor="#a0a0ab"
              value={fullName}
              onChangeText={setFullName}
            />
          </View>

          {/* Email Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder="Nhập email của bạn"
              placeholderTextColor="#a0a0ab"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          {/* Password Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Mật khẩu</Text>
            <View style={styles.passwordWrapper}>
              <TextInput
                style={styles.passwordInput}
                placeholder="Tạo mật khẩu"
                placeholderTextColor="#a0a0ab"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeButton}
              >
                <Text style={styles.eyeIcon}>{showPassword ? '👁️' : '👁️‍🗨️'}</Text>
              </TouchableOpacity>
            </View>

            {/* Password Strength */}
            {strength && (
              <View style={styles.strengthContainer}>
                <View style={styles.strengthBar}>
                  <View
                    style={[
                      styles.strengthFill,
                      {
                        width: strength.label === 'Yếu' ? '33%' : strength.label === 'Trung bình' ? '66%' : '100%',
                        backgroundColor: strength.color
                      }
                    ]}
                  />
                </View>
                <Text style={[styles.strengthText, { color: strength.color }]}>
                  Mật khẩu {strength.label.toLowerCase()}
                </Text>
              </View>
            )}
          </View>

          {/* Confirm Password Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Xác nhận mật khẩu</Text>
            <View style={styles.passwordWrapper}>
              <TextInput
                style={styles.passwordInput}
                placeholder="Nhập lại mật khẩu"
                placeholderTextColor="#a0a0ab"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showConfirmPassword}
              />
              <TouchableOpacity
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                style={styles.eyeButton}
              >
                <Text style={styles.eyeIcon}>{showConfirmPassword ? '👁️' : '👁️‍🗨️'}</Text>
              </TouchableOpacity>
            </View>

            {/* Password Match Indicator */}
            {confirmPassword.length > 0 && (
              <Text style={[
                styles.matchText,
                { color: password === confirmPassword ? '#10B981' : '#dc2626' }
              ]}>
                {password === confirmPassword ? '✓ Mật khẩu khớp' : '✗ Mật khẩu không khớp'}
              </Text>
            )}
          </View>

          {/* Register Button */}
          <TouchableOpacity style={styles.registerButton} onPress={handleRegister}>
            <Text style={styles.registerButtonText}>Đăng ký ngay</Text>
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>hoặc đăng ký với</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Social Buttons */}
          <View style={styles.socialContainer}>
            <View style={{ flex: 1, marginRight: 6 }}>
              <TouchableOpacity style={styles.socialButton}>
                <Text style={styles.socialText}>🔵 Google</Text>
              </TouchableOpacity>
            </View>
            <View style={{ flex: 1, marginLeft: 6 }}>
              <TouchableOpacity style={styles.socialButton}>
                <Text style={styles.socialText}>📘 Facebook</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Sign In Link */}
          <View style={styles.signinContainer}>
            <Text style={styles.signinText}>Đã có tài khoản? </Text>
            <TouchableOpacity onPress={() => router.back()}>
              <Text style={styles.signinLink}>Đăng nhập</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#16161d',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: '#0a0a0f',
    borderRadius: 16,
    padding: 32,
    shadowColor: '#8b5cf6',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  iconContainer: {
    alignSelf: 'center',
    width: 80,
    height: 80,
    backgroundColor: '#8b5cf6',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#8b5cf6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  icon: {
    fontSize: 40,
  },
  title: {
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
    marginBottom: 32,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#f5f5f7',
    marginBottom: 8,
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
  passwordWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    backgroundColor: '#1e1e28',
  },
  passwordInput: {
    flex: 1,
    padding: 16,
    fontSize: 16,
    color: '#f5f5f7',
  },
  eyeButton: {
    padding: 16,
  },
  eyeIcon: {
    fontSize: 20,
  },
  strengthContainer: {
    marginTop: 8,
  },
  strengthBar: {
    height: 4,
    backgroundColor: '#2a2a35',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 6,
  },
  strengthFill: {
    height: '100%',
    borderRadius: 2,
  },
  strengthText: {
    fontSize: 12,
    fontWeight: '600',
  },
  matchText: {
    fontSize: 12,
    marginTop: 6,
    fontWeight: '600',
  },
  registerButton: {
    backgroundColor: '#8b5cf6',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    marginBottom: 24,
    marginTop: 8,
    shadowColor: '#8b5cf6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  registerButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  dividerText: {
    marginHorizontal: 16,
    color: '#a0a0ab',
    fontSize: 14,
  },
  socialContainer: {
    flexDirection: 'row',
    marginBottom: 24,
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
    fontSize: 15,
    color: '#f5f5f7',
    fontWeight: '500',
  },
  signinContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  signinText: {
    color: '#a0a0ab',
    fontSize: 15,
  },
  signinLink: {
    color: '#8b5cf6',
    fontSize: 15,
    fontWeight: '700',
  },
  logo: {
    width: 140,
    height: 140,
    alignSelf: 'center',
    marginBottom: 16,
  },
});