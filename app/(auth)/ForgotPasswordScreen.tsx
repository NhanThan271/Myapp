import { Toast } from '@/components/Toast';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

// Dữ liệu mẫu
const VALID_EMAIL = 'user@gmail.com';
const VALID_OTP = '123456';

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
    const [toast, setToast] = useState({ visible: false, message: '', type: 'error' as 'error' | 'success' | 'info' });

    const showToast = (message: string, type: 'error' | 'success' | 'info' = 'error') => {
        setToast({ visible: true, message, type });
    };

    const handleSendOTP = () => {
        if (!email) {
            showToast('Vui lòng nhập email!', 'error');
            return;
        }

        if (!email.includes('@')) {
            showToast('Email không hợp lệ!', 'error');
            return;
        }

        if (email !== VALID_EMAIL) {
            showToast('Email không tồn tại trong hệ thống!', 'error');
            return;
        }

        showToast('Mã OTP đã được gửi đến email của bạn!', 'success');
        setTimeout(() => {
            setStep('otp');
        }, 1500);
    };

    const handleVerifyOTP = () => {
        if (!otp) {
            showToast('Vui lòng nhập mã OTP!', 'error');
            return;
        }

        if (otp.length !== 6) {
            showToast('Mã OTP phải có 6 số!', 'error');
            return;
        }

        if (otp !== VALID_OTP) {
            showToast('Mã OTP không chính xác!', 'error');
            return;
        }

        showToast('Xác thực thành công!', 'success');
        setTimeout(() => {
            setStep('newPassword');
        }, 1500);
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

    const handleResetPassword = () => {
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

        showToast('Đặt lại mật khẩu thành công!', 'success');
        setTimeout(() => {
            router.push('/(auth)/login');
        }, 1500);
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
                                <View style={styles.infoBox}>
                                    <Text style={styles.infoText}>Email mẫu: user@gmail.com</Text>
                                </View>
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
                                <TouchableOpacity style={styles.primaryButton} onPress={handleSendOTP}>
                                    <Text style={styles.primaryButtonText}>Gửi mã OTP</Text>
                                </TouchableOpacity>
                            </>
                        )}

                        {/* Bước 2: Nhập OTP */}
                        {step === 'otp' && (
                            <>
                                <View style={styles.infoBox}>
                                    <Text style={styles.infoText}>Mã OTP mẫu: 123456</Text>
                                </View>
                                <Text style={styles.label}>Mã OTP</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Nhập mã 6 số"
                                    placeholderTextColor="#a0a0ab"
                                    value={otp}
                                    onChangeText={setOtp}
                                    keyboardType="number-pad"
                                    maxLength={6}
                                />
                                <TouchableOpacity style={styles.resendButton}>
                                    <Text style={styles.resendText}>Gửi lại mã OTP</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.primaryButton} onPress={handleVerifyOTP}>
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
                                            { color: newPassword === confirmPassword ? '#10B981' : '#dc2626' }
                                        ]}>
                                            {newPassword === confirmPassword ? '✓ Mật khẩu khớp' : '✗ Mật khẩu không khớp'}
                                        </Text>
                                    )}
                                </View>

                                <TouchableOpacity style={styles.primaryButton} onPress={handleResetPassword}>
                                    <Text style={styles.primaryButtonText}>Đặt lại mật khẩu</Text>
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
    infoBox: {
        backgroundColor: '#1e1e28',
        borderRadius: 8,
        padding: 12,
        marginBottom: 20,
        borderLeftWidth: 3,
        borderLeftColor: '#ffd700',
    },
    infoText: {
        color: '#ffd700',
        fontSize: 14,
        fontWeight: '500',
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