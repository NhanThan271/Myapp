import { Toast } from '@/components/Toast';
import axios from 'axios';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
    ActivityIndicator,
    Image,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';

const API_URL = 'https://backend-ltud2.onrender.com/api/auth/password';

type Step = 'email' | 'otp' | 'newPassword';

export default function ForgotPasswordScreen() {
    const router = useRouter();
    const [step, setStep] = useState<Step>('email');
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [toast, setToast] = useState({
        visible: false,
        message: '',
        type: 'error' as 'error' | 'success' | 'info'
    });

    const showToast = (message: string, type: 'error' | 'success' | 'info' = 'error') => {
        setToast({ visible: true, message, type });
    };

    // ✅ Gửi OTP qua API
    const handleSendOTP = async () => {
        if (!email) {
            showToast('Vui lòng nhập email!', 'error');
            return;
        }

        if (!email.includes('@')) {
            showToast('Email không hợp lệ!', 'error');
            return;
        }

        setLoading(true);

        try {
            console.log('📧 Sending OTP to:', email);

            const response = await axios.post(`${API_URL}/forgot`, {
                email: email.trim()
            });

            console.log('✅ OTP sent:', response.data);

            showToast('Mã OTP đã được gửi đến email của bạn!', 'success');

            setTimeout(() => {
                setStep('otp');
            }, 1500);

        } catch (error: any) {
            console.error('❌ Error sending OTP:', error);

            if (error.response) {
                const errorMessage = error.response.data?.message || 'Email không tồn tại trong hệ thống!';
                showToast(errorMessage, 'error');
            } else if (error.request) {
                showToast('Không thể kết nối đến server!', 'error');
            } else {
                showToast('Đã xảy ra lỗi không xác định!', 'error');
            }
        } finally {
            setLoading(false);
        }
    };

    // ✅ Xác thực OTP và chuyển sang bước đặt mật khẩu
    const handleVerifyOTP = () => {
        if (!otp) {
            showToast('Vui lòng nhập mã OTP!', 'error');
            return;
        }

        if (otp.length !== 6) {
            showToast('Mã OTP phải có 6 số!', 'error');
            return;
        }

        // Chuyển sang bước đặt mật khẩu mới
        // Backend sẽ verify OTP khi reset password
        showToast('Mã OTP hợp lệ!', 'success');
        setTimeout(() => {
            setStep('newPassword');
        }, 1000);
    };

    const getPasswordStrength = () => {
        if (newPassword.length === 0) return null;

        const hasNumber = /\d/.test(newPassword);
        const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(newPassword);
        const hasUpperCase = /[A-Z]/.test(newPassword);
        const hasLowerCase = /[a-z]/.test(newPassword);

        if (newPassword.length < 6) {
            return { label: 'Yếu', color: '#dc2626' };
        }

        if (hasNumber && newPassword.length >= 6) {
            if (hasSpecialChar || (hasUpperCase && hasLowerCase && hasNumber && newPassword.length >= 8)) {
                return { label: 'Mạnh', color: '#10B981' };
            }
            return { label: 'Trung bình', color: '#ffd700' };
        }
        return { label: 'Yếu', color: '#dc2626' };
    };

    // ✅ Reset mật khẩu qua API
    const handleResetPassword = async () => {
        if (!newPassword || !confirmPassword) {
            showToast('Vui lòng nhập đầy đủ thông tin!', 'error');
            return;
        }

        if (newPassword.length < 6) {
            showToast('Mật khẩu phải có ít nhất 6 ký tự!', 'error');
            return;
        }

        if (newPassword !== confirmPassword) {
            showToast('Mật khẩu xác nhận không khớp!', 'error');
            return;
        }

        setLoading(true);

        try {
            console.log('🔐 Resetting password with OTP:', otp);

            const response = await axios.post(`${API_URL}/reset`, {
                otp: otp,
                newPassword: newPassword
            });

            console.log('✅ Password reset successful:', response.data);

            showToast('Đặt lại mật khẩu thành công!', 'success');

            setTimeout(() => {
                router.replace('/(auth)/login');
            }, 1500);

        } catch (error: any) {
            console.error('❌ Error resetting password:', error);

            if (error.response) {
                const errorMessage = error.response.data?.message || 'Không thể đặt lại mật khẩu!';

                if (errorMessage.includes('OTP')) {
                    showToast('Mã OTP không đúng hoặc đã hết hạn!', 'error');
                } else {
                    showToast(errorMessage, 'error');
                }
            } else if (error.request) {
                showToast('Không thể kết nối đến server!', 'error');
            } else {
                showToast('Đã xảy ra lỗi không xác định!', 'error');
            }
        } finally {
            setLoading(false);
        }
    };

    // ✅ Gửi lại OTP
    const handleResendOTP = async () => {
        if (!email) {
            showToast('Email không hợp lệ!', 'error');
            return;
        }

        setLoading(true);

        try {
            console.log('🔄 Resending OTP to:', email);

            await axios.post(`${API_URL}/forgot`, {
                email: email.trim()
            });

            showToast('Mã OTP mới đã được gửi!', 'success');

        } catch (error: any) {
            console.error('❌ Error resending OTP:', error);
            showToast('Không thể gửi lại OTP. Vui lòng thử lại!', 'error');
        } finally {
            setLoading(false);
        }
    };

    const strength = getPasswordStrength();

    const renderStepIndicator = () => (
        <View style={styles.stepIndicator}>
            <View style={styles.stepItem}>
                <View style={[styles.stepCircle, step !== 'email' && styles.stepCircleActive]}>
                    <Text style={[styles.stepNumber, step !== 'email' && styles.stepNumberActive]}>
                        {step !== 'email' ? '✓' : '1'}
                    </Text>
                </View>
                <Text style={styles.stepLabel}>Email</Text>
            </View>
            <View style={[styles.stepLine, step !== 'email' && styles.stepLineActive]} />
            <View style={styles.stepItem}>
                <View style={[styles.stepCircle, step === 'newPassword' && styles.stepCircleActive]}>
                    <Text style={[styles.stepNumber, step === 'newPassword' && styles.stepNumberActive]}>
                        {step === 'newPassword' ? '✓' : '2'}
                    </Text>
                </View>
                <Text style={styles.stepLabel}>OTP</Text>
            </View>
            <View style={[styles.stepLine, step === 'newPassword' && styles.stepLineActive]} />
            <View style={styles.stepItem}>
                <View style={styles.stepCircle}>
                    <Text style={styles.stepNumber}>3</Text>
                </View>
                <Text style={styles.stepLabel}>Mật khẩu</Text>
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            <KeyboardAvoidingView
                style={styles.keyboardView}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContainer}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                    bounces={false}
                >
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
                        <Text style={styles.heading}>Quên mật khẩu</Text>
                        <Text style={styles.subtitle}>
                            {step === 'email' && 'Nhập email để nhận mã xác thực'}
                            {step === 'otp' && 'Nhập mã OTP đã được gửi đến email'}
                            {step === 'newPassword' && 'Đặt mật khẩu mới cho tài khoản'}
                        </Text>

                        {renderStepIndicator()}

                        {/* Bước 1: Nhập Email */}
                        {step === 'email' && (
                            <>
                                <Text style={styles.label}>Email</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Nhập email của bạn"
                                    placeholderTextColor="#a0a0ab"
                                    value={email}
                                    onChangeText={setEmail}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                    editable={!loading}
                                />
                                <TouchableOpacity
                                    style={[styles.primaryButton, loading && styles.buttonDisabled]}
                                    onPress={handleSendOTP}
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <ActivityIndicator color="#fff" />
                                    ) : (
                                        <Text style={styles.primaryButtonText}>Gửi mã OTP</Text>
                                    )}
                                </TouchableOpacity>
                            </>
                        )}

                        {/* Bước 2: Nhập OTP */}
                        {step === 'otp' && (
                            <>
                                <Text style={styles.label}>Mã OTP</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Nhập mã 6 số"
                                    placeholderTextColor="#a0a0ab"
                                    value={otp}
                                    onChangeText={setOtp}
                                    keyboardType="number-pad"
                                    maxLength={6}
                                    editable={!loading}
                                />
                                <TouchableOpacity
                                    style={styles.resendButton}
                                    onPress={handleResendOTP}
                                    disabled={loading}
                                >
                                    <Text style={styles.resendText}>
                                        {loading ? 'Đang gửi...' : 'Gửi lại mã OTP'}
                                    </Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.primaryButton, loading && styles.buttonDisabled]}
                                    onPress={handleVerifyOTP}
                                    disabled={loading}
                                >
                                    <Text style={styles.primaryButtonText}>Xác thực</Text>
                                </TouchableOpacity>
                            </>
                        )}

                        {/* Bước 3: Đặt lại mật khẩu */}
                        {step === 'newPassword' && (
                            <>
                                <View style={styles.inputContainer}>
                                    <Text style={styles.label}>Mật khẩu mới</Text>
                                    <View style={styles.passwordWrapper}>
                                        <TextInput
                                            style={styles.passwordInput}
                                            placeholder="Nhập mật khẩu mới"
                                            placeholderTextColor="#a0a0ab"
                                            value={newPassword}
                                            onChangeText={setNewPassword}
                                            secureTextEntry={!showPassword}
                                            editable={!loading}
                                        />
                                        <TouchableOpacity
                                            onPress={() => setShowPassword(!showPassword)}
                                            style={styles.eyeButton}
                                        >
                                            <Text style={styles.eyeIcon}>{showPassword ? '👁️' : '👁️‍🗨️'}</Text>
                                        </TouchableOpacity>
                                    </View>

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

                                <View style={styles.inputContainer}>
                                    <Text style={styles.label}>Xác nhận mật khẩu</Text>
                                    <View style={styles.passwordWrapper}>
                                        <TextInput
                                            style={styles.passwordInput}
                                            placeholder="Nhập lại mật khẩu mới"
                                            placeholderTextColor="#a0a0ab"
                                            value={confirmPassword}
                                            onChangeText={setConfirmPassword}
                                            secureTextEntry={!showConfirmPassword}
                                            editable={!loading}
                                        />
                                        <TouchableOpacity
                                            onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                                            style={styles.eyeButton}
                                        >
                                            <Text style={styles.eyeIcon}>{showConfirmPassword ? '👁️' : '👁️‍🗨️'}</Text>
                                        </TouchableOpacity>
                                    </View>

                                    {confirmPassword.length > 0 && (
                                        <Text style={[
                                            styles.matchText,
                                            { color: newPassword === confirmPassword ? '#10B981' : '#dc2626' }
                                        ]}>
                                            {newPassword === confirmPassword ? '✓ Mật khẩu khớp' : '✗ Mật khẩu không khớp'}
                                        </Text>
                                    )}
                                </View>

                                <TouchableOpacity
                                    style={[styles.primaryButton, loading && styles.buttonDisabled]}
                                    onPress={handleResetPassword}
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <ActivityIndicator color="#fff" />
                                    ) : (
                                        <Text style={styles.primaryButtonText}>Đặt lại mật khẩu</Text>
                                    )}
                                </TouchableOpacity>
                            </>
                        )}

                        <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
                            <Text style={styles.backText}>← Quay lại đăng nhập</Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#16161d',
    },
    keyboardView: {
        flex: 1,
    },
    scrollContainer: {
        flexGrow: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        paddingVertical: 40,
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
    logo: {
        width: 140,
        height: 140,
        alignSelf: 'center',
        marginBottom: 16,
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
        marginBottom: 24,
    },
    stepIndicator: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 32,
    },
    stepItem: {
        alignItems: 'center',
    },
    stepCircle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#1e1e28',
        borderWidth: 2,
        borderColor: 'rgba(255, 255, 255, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    stepCircleActive: {
        backgroundColor: '#e50914',
        borderColor: '#e50914',
    },
    stepNumber: {
        color: '#a0a0ab',
        fontSize: 16,
        fontWeight: '700',
    },
    stepNumberActive: {
        color: '#ffffff',
    },
    stepLabel: {
        fontSize: 12,
        color: '#a0a0ab',
        fontWeight: '500',
    },
    stepLine: {
        width: 40,
        height: 2,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        marginHorizontal: 8,
        marginBottom: 28,
    },
    stepLineActive: {
        backgroundColor: '#e50914',
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
    primaryButton: {
        backgroundColor: '#e50914',
        borderRadius: 12,
        padding: 18,
        alignItems: 'center',
        marginTop: 24,
        marginBottom: 24,
        shadowColor: '#e50914',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    buttonDisabled: {
        opacity: 0.6,
    },
    primaryButtonText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    resendButton: {
        alignSelf: 'flex-end',
        marginTop: 12,
    },
    resendText: {
        color: '#ffd700',
        fontSize: 14,
        fontWeight: '600',
    },
    backText: {
        textAlign: 'center',
        color: '#a0a0ab',
        fontSize: 15,
        fontWeight: '500',
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
});