import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Clipboard,
    Linking,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';

const API_URL = 'https://backend-ltud2.onrender.com/api';

interface PaymentInfo {
    checkoutUrl?: string;
    qrCode?: string;
    orderCode: number;
    accountNo: string;
    accountName: string;
    bankName: string;
    amount: number;
    content: string;
}

interface BookingData {
    movieTitle: string;
    cinema: string;
    showtime: string;
    seats: string;
    amount: number;
    serviceFee: number;
    discount: number;

    showtimeId: string;
    seatIds: string;
}

export default function BankingPaymentScreen() {
    const params = useLocalSearchParams();

    const bookingData: BookingData = {
        movieTitle: params.movieTitle as string || 'Avengers: Endgame',
        cinema: params.cinema as string || 'CGV Vincom Center',
        showtime: params.showtime as string || '19:30 - 16/01/2026',
        seats: params.seats as string || 'A5, A6',
        amount: Number(params.amount) || 200000,
        serviceFee: Number(params.serviceFee) || 5000,
        discount: Number(params.discount) || 0,
        showtimeId: params.showtimeId as string || '',
        seatIds: params.seatIds as string || '[]'
    };

    const [paymentInfo, setPaymentInfo] = useState<PaymentInfo | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [countdown, setCountdown] = useState(900);
    const [copiedField, setCopiedField] = useState('');
    const [authToken, setAuthToken] = useState<string | null>(null);

    const totalAmount = bookingData.amount - bookingData.discount;

    useEffect(() => {
        loadAuthToken();
    }, []);

    useEffect(() => {
        if (paymentInfo && countdown > 0) {
            const timer = setInterval(() => {
                setCountdown(prev => prev - 1);
            }, 1000);
            return () => clearInterval(timer);
        }
        if (countdown === 0) {
            Alert.alert('Hết thời gian', 'Phiên thanh toán đã hết hạn. Vui lòng tạo lại.');
        }
    }, [paymentInfo, countdown]);

    const createTicketsAfterPayment = async () => {
        try {
            console.log('🎫 Creating tickets after successful payment...');

            // Parse seat IDs từ params
            const seatIds = params.seatIds ? JSON.parse(params.seatIds as string) : [];
            const showtimeId = params.showtimeId as string;

            if (!seatIds || seatIds.length === 0 || !showtimeId) {
                console.error('Missing seat or showtime data');
                return false;
            }

            // Lấy user ID
            const storedUserId = await AsyncStorage.getItem('userId');
            if (!storedUserId) {
                console.error('No user ID found');
                return false;
            }

            const userId = parseInt(storedUserId, 10);
            if (isNaN(userId)) {
                console.error('Invalid user ID');
                return false;
            }

            console.log('📊 Booking data:', {
                userId,
                showtimeId,
                seatIds,
                seatCount: seatIds.length
            });

            // Tạo vé cho từng ghế
            const createdTickets = [];
            for (const seatId of seatIds) {
                const requestBody = {
                    showtimeId: parseInt(showtimeId),
                    seatId: seatId,
                    userId: userId
                };

                console.log(`📤 Creating ticket for seat ${seatId}...`);

                try {
                    const response = await axios.post(
                        `${API_URL}/customer/tickets`,
                        requestBody,
                        {
                            headers: {
                                'Authorization': `Bearer ${authToken}`,
                                'Content-Type': 'application/json',
                            },
                            timeout: 15000
                        }
                    );

                    console.log(`Ticket created: ${response.data.id}`);
                    createdTickets.push(response.data);

                } catch (seatError: any) {
                    console.error(`Failed to create ticket for seat ${seatId}:`, {
                        status: seatError.response?.status,
                        data: seatError.response?.data
                    });

                    // Nếu ghế đã được đặt, tiếp tục với ghế khác
                    if (seatError.response?.status === 409) {
                        console.warn(`Seat ${seatId} already booked, skipping...`);
                        continue;
                    }

                    throw seatError;
                }

                // Delay nhỏ giữa các request
                await new Promise(resolve => setTimeout(resolve, 200));
            }

            if (createdTickets.length > 0) {
                console.log(`🎉 Successfully created ${createdTickets.length} tickets!`);
                return true;
            } else {
                console.error('No tickets were created');
                return false;
            }

        } catch (error: any) {
            console.error('Error creating tickets:', error);
            return false;
        }
    };

    useEffect(() => {
        if (!paymentInfo) return;

        let hasCreatedTickets = false; // Flag để tránh tạo vé nhiều lần

        const checkPaymentStatus = async () => {
            try {
                console.log('🔍 Checking payment status for order:', paymentInfo.orderCode);

                const response = await axios.get(
                    `${API_URL}/payos/check/${paymentInfo.orderCode}`,
                    {
                        headers: authToken ? { 'Authorization': `Bearer ${authToken}` } : {},
                        timeout: 10000
                    }
                );

                console.log('Payment check response:', JSON.stringify(response.data, null, 2));

                const status = response.data?.data?.status || response.data?.status;
                console.log('📊 Payment status:', status);

                if ((status === 'PAID' || status === 'paid' || status === 'COMPLETED') && !hasCreatedTickets) {
                    hasCreatedTickets = true; // Đánh dấu đã tạo vé

                    console.log('💳 Payment successful! Creating tickets...');

                    const ticketsCreated = await createTicketsAfterPayment();

                    if (ticketsCreated) {
                        await new Promise(resolve => setTimeout(resolve, 1000));

                        Alert.alert(
                            'Thanh toán thành công! 🎉',
                            'Vé của bạn đã được tạo.',
                            [{
                                text: 'Xem vé',
                                onPress: () => router.replace('/(ticket)/myticket')
                            }]
                        );
                    } else {
                        Alert.alert(
                            'Cảnh báo',
                            'Thanh toán thành công nhưng không thể tạo vé. Vui lòng liên hệ hỗ trợ.',
                            [{
                                text: 'OK',
                                onPress: () => router.back()
                            }]
                        );
                    }
                }
            } catch (error: any) {
                console.error('Payment check error:', error.response?.data || error.message);
            }
        };

        checkPaymentStatus();
        const interval = setInterval(checkPaymentStatus, 3000);

        return () => {
            clearInterval(interval);
            hasCreatedTickets = false; // Reset flag khi unmount
        };
    }, [paymentInfo, authToken]);

    const loadAuthToken = async () => {
        try {
            const token = await AsyncStorage.getItem('authToken');
            if (token) {
                setAuthToken(token);
            }
        } catch (error) {
            console.error('Error loading token:', error);
        }
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const createPayOSPayment = async () => {
        setLoading(true);
        setError('');

        try {
            const orderCode = Date.now();
            const ticketId = params.ticketId as string || 'TICKET123456';
            const shortDescription = `TT${orderCode.toString().slice(-8)}`;
            const payload = {
                orderCode: orderCode,
                amount: totalAmount,
                description: shortDescription,
                returnUrl: "https://your-app.com/payment/success",
                cancelUrl: "https://your-app.com/payment/cancel",
                items: [
                    {
                        name: bookingData.movieTitle.substring(0, 50),
                        quantity: 1,
                        price: totalAmount
                    }
                ]
            };

            console.log('🔵 Request payload:', JSON.stringify(payload, null, 2));

            const response = await axios.post(
                `${API_URL}/payos/create`,
                payload,
                {
                    headers: {
                        'Content-Type': 'application/json',
                        ...(authToken && { 'Authorization': `Bearer ${authToken}` })
                    },
                    timeout: 30000
                }
            );
            console.log(' Full PayOS Response:', JSON.stringify(response.data, null, 2));
            console.log('🖼️ QR Code from response.data.data?.qrCode:', response.data.data?.qrCode);
            console.log('🖼️ QR Code from response.data.qrCode:', response.data.qrCode);
            console.log(' Full Response:', JSON.stringify(response.data, null, 2));

            const payosResponse = response.data;

            //  Kiểm tra nếu có lỗi từ PayOS
            if (payosResponse.code && payosResponse.code !== "00") {
                throw new Error(payosResponse.desc || 'PayOS trả về lỗi');
            }

            //  Lấy data từ đúng cấu trúc response
            // PayOS có thể trả về: response.data.data HOẶC response.data trực tiếp
            const payosData = payosResponse.data || payosResponse;

            if (!payosData.checkoutUrl && !payosData.qrCode) {
                console.error('Response structure:', payosResponse);
                throw new Error('PayOS không trả về thông tin thanh toán');
            }

            console.log('🖼️ QR Code URL:', payosData.qrCode);

            setPaymentInfo({
                checkoutUrl: payosData.checkoutUrl || payosData.paymentLinkId,
                qrCode: payosData.qrCode,
                orderCode: orderCode,
                accountNo: payosData.accountNumber || '9704360011122233',
                accountName: payosData.accountName || 'CONG TY CP PAYOS',
                bankName: payosData.bin || '970436',
                amount: totalAmount,
                content: `Thanh toan DH${orderCode}`
            });

            setLoading(false);

        } catch (err: any) {
            console.error('Full error:', err);
            console.error('Response data:', err.response?.data);

            setError(
                err.response?.data?.desc ||
                err.response?.data?.message ||
                err.message ||
                'Không thể tạo thanh toán. Vui lòng thử lại.'
            );
            setLoading(false);
        }
    };

    const copyToClipboard = (text: string, field: string) => {
        Clipboard.setString(text);
        setCopiedField(field);
        setTimeout(() => setCopiedField(''), 2000);
    };

    const openPaymentLink = () => {
        if (paymentInfo?.checkoutUrl) {
            Linking.openURL(paymentInfo.checkoutUrl).catch(() => {
                Alert.alert('Lỗi', 'Không thể mở link thanh toán');
            });
        }
    };
    const manualCheckPayment = async () => {
        if (!paymentInfo) return;

        setLoading(true);
        try {
            const response = await axios.get(
                `${API_URL}/payos/check/${paymentInfo.orderCode}`,
                {
                    headers: authToken ? { 'Authorization': `Bearer ${authToken}` } : {},
                    timeout: 10000
                }
            );

            const status = response.data?.data?.status || response.data?.status;

            if (status === 'PAID' || status === 'paid' || status === 'COMPLETED') {
                Alert.alert(
                    'Thanh toán thành công! 🎉',
                    'Vé của bạn đã được xác nhận.',
                    [{ text: 'OK', onPress: () => router.replace('/(ticket)/myticket') }]
                );
            } else {
                Alert.alert('Thông báo', 'Chưa nhận được thanh toán. Vui lòng kiểm tra lại.');
            }
        } catch (error) {
            Alert.alert('Lỗi', 'Không thể kiểm tra trạng thái thanh toán');
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                    <Text style={styles.backIcon}>←</Text>
                </TouchableOpacity>
                <View style={styles.headerContent}>
                    <Text style={styles.headerTitle}>Chuyển khoản ngân hàng</Text>
                    <Text style={styles.headerSubtitle}>Thanh toán qua PayOS</Text>
                </View>
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>📋 Thông tin đặt vé</Text>
                    <View style={styles.card}>
                        <InfoRow label="Phim" value={bookingData.movieTitle} bold vertical />  {/*  Thêm vertical */}
                        <InfoRow label="Rạp" value={bookingData.cinema} />
                        <InfoRow label="Suất chiếu" value={bookingData.showtime} />
                        <InfoRow label="Ghế" value={bookingData.seats} bold />
                        <View style={styles.divider} />
                        <InfoRow label="Tiền vé" value={`${bookingData.amount.toLocaleString('vi-VN')}đ`} />
                        <InfoRow
                            label="Tổng cộng"
                            value={`${totalAmount.toLocaleString('vi-VN')}đ`}
                            bold
                            highlight
                        />
                    </View>
                </View>

                {!paymentInfo && (
                    <View style={styles.section}>
                        <TouchableOpacity
                            style={[styles.primaryButton, loading && styles.buttonDisabled]}
                            onPress={createPayOSPayment}
                            disabled={loading}
                        >
                            {loading ? (
                                <View style={styles.loadingContainer}>
                                    <ActivityIndicator color="#fff" />
                                    <Text style={styles.buttonText}>Đang tạo thanh toán...</Text>
                                </View>
                            ) : (
                                <Text style={styles.buttonText}>🏦 Tạo thanh toán</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                )}

                {error ? (
                    <View style={styles.errorBox}>
                        <Text style={styles.errorText}>{error}</Text>
                    </View>
                ) : null}

                {paymentInfo && (
                    <>
                        <View style={styles.countdownBox}>
                            <Text style={styles.countdownLabel}>⏰ Thời gian còn lại</Text>
                            <Text style={styles.countdownTime}>{formatTime(countdown)}</Text>
                        </View>

                        <View style={styles.qrSection}>
                            <View style={styles.qrCard}>
                                <Text style={styles.qrTitle}>📱 Quét mã QR để thanh toán</Text>

                                {/*  SỬA PHẦN NÀY */}
                                {paymentInfo.qrCode ? (
                                    <QRCode
                                        value={paymentInfo.qrCode}
                                        size={250}
                                        backgroundColor="white"
                                    />
                                ) : paymentInfo.checkoutUrl ? (
                                    <QRCode
                                        value={paymentInfo.checkoutUrl}
                                        size={250}
                                        backgroundColor="white"
                                    />
                                ) : (
                                    <Text style={styles.errorText}>Không có QR code</Text>
                                )}

                                <Text style={styles.qrHint}>Sử dụng app ngân hàng để quét mã</Text>
                            </View>
                        </View>

                        {paymentInfo && (
                            <View style={styles.section}>
                                <TouchableOpacity
                                    style={styles.secondaryButton}
                                    onPress={manualCheckPayment}
                                    disabled={loading}
                                >
                                    <Text style={styles.buttonText}>
                                        {loading ? '⏳ Đang kiểm tra...' : '🔍 Kiểm tra thanh toán'}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        )}

                        {/*  THÊM NÚT MỞ LINK THANH TOÁN */}
                        {paymentInfo.checkoutUrl && (
                            <View style={styles.section}>
                                <TouchableOpacity
                                    style={styles.secondaryButton}
                                    onPress={openPaymentLink}
                                >
                                    <Text style={styles.buttonText}>🌐 Mở trang thanh toán</Text>
                                </TouchableOpacity>
                            </View>
                        )}

                        {/*  THÔNG TIN CHUYỂN KHOẢN THỦ CÔNG */}
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>💳 Hoặc chuyển khoản thủ công</Text>
                            <View style={styles.card}>
                                <CopyableField
                                    label="Ngân hàng"
                                    value={paymentInfo.bankName}
                                    field="bank"
                                    copiedField={copiedField}
                                    onCopy={copyToClipboard}
                                    noCopy
                                />
                                <CopyableField
                                    label="Số tài khoản"
                                    value={paymentInfo.accountNo}
                                    field="account"
                                    copiedField={copiedField}
                                    onCopy={copyToClipboard}
                                    mono
                                />
                                <CopyableField
                                    label="Tên tài khoản"
                                    value={paymentInfo.accountName}
                                    field="name"
                                    copiedField={copiedField}
                                    onCopy={copyToClipboard}
                                />
                                <CopyableField
                                    label="Số tiền"
                                    value={`${paymentInfo.amount.toLocaleString('vi-VN')}đ`}
                                    field="amount"
                                    copiedField={copiedField}
                                    onCopy={copyToClipboard}
                                    important
                                    highlight
                                />
                                <CopyableField
                                    label="Nội dung chuyển khoản"
                                    value={paymentInfo.content}
                                    field="content"
                                    copiedField={copiedField}
                                    onCopy={copyToClipboard}
                                    mono
                                    important
                                />
                                <Text style={styles.warningText}>
                                    Vui lòng nhập CHÍNH XÁC nội dung chuyển khoản
                                </Text>
                            </View>
                        </View>
                    </>
                )}

                <View style={styles.bottomSpacing} />
            </ScrollView>
        </View >
    );
}

const InfoRow = ({ label, value, bold, highlight, vertical }: any) => {
    if (vertical) {
        //  Layout dọc cho text dài
        return (
            <View style={styles.infoRowVertical}>
                <Text style={styles.infoLabel}>{label}</Text>
                <Text
                    style={[
                        styles.infoValue,
                        styles.infoValueVertical,
                        bold && styles.infoBold,
                        highlight && styles.infoHighlight
                    ]}
                    numberOfLines={3}
                >
                    {value}
                </Text>
            </View>
        );
    }

    //  Layout ngang cho text ngắn
    return (
        <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{label}</Text>
            <Text
                style={[
                    styles.infoValue,
                    bold && styles.infoBold,
                    highlight && styles.infoHighlight
                ]}
                numberOfLines={2}
                ellipsizeMode="tail"
            >
                {value}
            </Text>
        </View>
    );
};

const CopyableField = ({ label, value, field, copiedField, onCopy, noCopy, mono, important, highlight }: any) => (
    <View style={styles.fieldContainer}>
        <Text style={styles.fieldLabel}>{label}</Text>
        <View style={[styles.fieldBox, important && styles.fieldImportant]}>
            <Text style={[
                styles.fieldValue,
                mono && styles.mono,
                highlight && styles.highlightText
            ]}>{value}</Text>
            {!noCopy && (
                <TouchableOpacity
                    style={[styles.copyButton, important && styles.copyButtonImportant]}
                    onPress={() => onCopy(value, field)}
                >
                    <Text style={styles.copyButtonText}>
                        {copiedField === field ? '✓' : 'Copy'}
                    </Text>
                </TouchableOpacity>
            )}
        </View>
    </View>
);

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0f0f23' },
    header: {
        paddingTop: 60,
        paddingHorizontal: 20,
        paddingBottom: 20,
        backgroundColor: '#1a1a2e',
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(139, 92, 246, 0.2)',
        flexDirection: 'row',
        alignItems: 'center'
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(139, 92, 246, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12
    },
    backIcon: { fontSize: 24, color: '#a78bfa', fontWeight: 'bold' },
    headerContent: { flex: 1 },
    headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#fff', marginBottom: 4 },
    headerSubtitle: { fontSize: 14, color: 'rgba(255,255,255,0.6)' },
    content: { flex: 1 },
    section: { marginTop: 20, paddingHorizontal: 20 },
    sectionTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: 'rgba(255,255,255,0.6)',
        marginBottom: 12,
        textTransform: 'uppercase'
    },
    card: {
        backgroundColor: '#1a1a2e',
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: 'rgba(139, 92, 246, 0.2)'
    },
    infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
    infoLabel: { fontSize: 14, color: 'rgba(255,255,255,0.7)', flex: 1, marginRight: 8 },
    infoValue: { fontSize: 14, color: '#fff', flex: 2, textAlign: 'right' },
    infoRowVertical: {
        marginBottom: 12
    },
    infoValueVertical: {
        textAlign: 'left',
        marginTop: 4,
        flex: 1
    },
    infoBold: { fontWeight: 'bold' },
    infoHighlight: { color: '#a78bfa', fontSize: 16 },
    divider: { height: 1, backgroundColor: 'rgba(139, 92, 246, 0.2)', marginVertical: 8 },
    primaryButton: {
        backgroundColor: '#8b5cf6',
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center'
    },
    secondaryButton: {
        backgroundColor: '#3b82f6',
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center'
    },
    buttonDisabled: { backgroundColor: '#6b7280' },
    buttonText: { fontSize: 16, fontWeight: 'bold', color: '#fff' },
    loadingContainer: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    errorBox: {
        marginHorizontal: 20,
        marginTop: 20,
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        borderWidth: 1,
        borderColor: 'rgba(239, 68, 68, 0.5)',
        borderRadius: 12,
        padding: 16
    },
    errorText: { color: '#ef4444', fontSize: 14 },
    countdownBox: {
        marginHorizontal: 20,
        marginTop: 20,
        backgroundColor: '#f97316',
        borderRadius: 12,
        padding: 16,
        alignItems: 'center'
    },
    countdownLabel: { fontSize: 14, color: '#fff', marginBottom: 4 },
    countdownTime: { fontSize: 32, fontWeight: 'bold', color: '#fff' },
    qrSection: { marginTop: 20, paddingHorizontal: 20 },
    qrCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 20,
        alignItems: 'center'
    },
    qrTitle: { fontSize: 16, fontWeight: 'bold', color: '#1a1a2e', marginBottom: 16 },
    qrImage: { width: 250, height: 250, borderWidth: 4, borderColor: '#8b5cf6', borderRadius: 12 },
    qrHint: { fontSize: 12, color: '#6b7280', marginTop: 12 },
    fieldContainer: { marginBottom: 16 },
    fieldLabel: { fontSize: 12, color: 'rgba(255,255,255,0.6)', marginBottom: 6 },
    fieldBox: {
        backgroundColor: 'rgba(139, 92, 246, 0.1)',
        borderRadius: 8,
        padding: 12,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    fieldImportant: {
        backgroundColor: 'rgba(249, 115, 22, 0.2)',
        borderWidth: 1,
        borderColor: 'rgba(249, 115, 22, 0.5)'
    },
    fieldValue: { fontSize: 14, color: '#fff', flex: 1 },
    mono: { fontFamily: 'monospace', fontWeight: 'bold' },
    highlightText: { color: '#a78bfa', fontSize: 16, fontWeight: 'bold' },
    copyButton: {
        backgroundColor: '#8b5cf6',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 6
    },
    copyButtonImportant: { backgroundColor: '#f97316' },
    copyButtonText: { fontSize: 12, color: '#fff', fontWeight: 'bold' },
    warningText: { fontSize: 11, color: '#f97316', marginTop: 8 },
    infoBox: {
        marginHorizontal: 20,
        marginTop: 20,
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderWidth: 1,
        borderColor: 'rgba(59, 130, 246, 0.3)',
        borderRadius: 12,
        padding: 16
    },
    infoTitle: { fontSize: 14, color: '#60a5fa', fontWeight: 'bold', marginBottom: 8 },
    infoText: { fontSize: 13, color: '#93c5fd', marginBottom: 4 },
    bottomSpacing: { height: 40 }
});