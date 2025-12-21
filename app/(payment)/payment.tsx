import { Image } from 'expo-image';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

// Types
interface PaymentMethod {
    id: string;
    type: 'card' | 'momo' | 'zalopay' | 'banking' | 'cash';
    name: string;
    icon: string;
    detail?: string;
}

interface BookingInfo {
    movieTitle: string;
    poster: string;
    cinema: string;
    date: string;
    time: string;
    seats: string[];
    screen: string;
    type: '2D' | '3D';
    ticketPrice: number;
    quantity: number;
}

// Mock data
const mockBooking: BookingInfo = {
    movieTitle: 'Avatar: The Way of Water',
    poster: 'https://image.tmdb.org/t/p/w500/t6HIqrRAclMCA60NsSmeqe9RmNV.jpg',
    cinema: 'CGV Vincom Center',
    date: '20/12/2024',
    time: '19:00',
    seats: ['G7', 'G8'],
    screen: 'Rạp 3',
    type: '3D',
    ticketPrice: 120000,
    quantity: 2,
};

const paymentMethods: PaymentMethod[] = [
    { id: '1', type: 'momo', name: 'Ví MoMo', icon: '🟣' },
    { id: '2', type: 'zalopay', name: 'ZaloPay', icon: '🔵' },
    { id: '3', type: 'banking', name: 'Chuyển khoản ngân hàng', icon: '🏦' },
    { id: '4', type: 'card', name: 'Thẻ tín dụng/ghi nợ', icon: '💳' },
    { id: '5', type: 'cash', name: 'Thanh toán tại quầy', icon: '💵' },
];

export default function PaymentScreen() {
    const [selectedMethod, setSelectedMethod] = useState<string>('1');
    const [promoCode, setPromoCode] = useState<string>('');
    const [discount, setDiscount] = useState<number>(0);
    const [isProcessing, setIsProcessing] = useState(false);

    const subtotal = mockBooking.ticketPrice * mockBooking.quantity;
    const serviceFee = 5000;
    const total = subtotal + serviceFee - discount;

    const handleApplyPromo = () => {
        if (promoCode.toUpperCase() === 'NEWUSER') {
            setDiscount(20000);
            Alert.alert('Thành công', 'Đã áp dụng mã giảm giá 20.000đ');
        } else if (promoCode.toUpperCase() === 'CINEMA50') {
            setDiscount(subtotal * 0.1);
            Alert.alert('Thành công', 'Đã áp dụng giảm giá 10%');
        } else {
            Alert.alert('Lỗi', 'Mã giảm giá không hợp lệ');
        }
    };

    const handlePayment = () => {
        setIsProcessing(true);
        setTimeout(() => {
            setIsProcessing(false);
            Alert.alert(
                'Thanh toán thành công! 🎉',
                'Vé của bạn đã được đặt thành công',
                [
                    {
                        text: 'Xem vé',
                        onPress: () => router.push('/(ticket)/myticket'),
                    },
                ]
            );
        }, 2000);
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                    <Text style={styles.backIcon}>←</Text>
                </TouchableOpacity>
                <View style={styles.headerContent}>
                    <Text style={styles.headerTitle}>Thanh toán</Text>
                    <Text style={styles.headerSubtitle}>Hoàn tất đặt vé</Text>
                </View>
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* Booking Summary */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Thông tin đặt vé</Text>
                    <View style={styles.summaryCard}>
                        <Image
                            source={{ uri: mockBooking.poster }}
                            style={styles.moviePoster}
                            contentFit="cover"
                        />
                        <View style={styles.summaryDetails}>
                            <Text style={styles.movieTitle}>{mockBooking.movieTitle}</Text>
                            <View style={styles.infoRow}>
                                <Text style={styles.infoIcon}>🎬</Text>
                                <Text style={styles.infoText}>{mockBooking.cinema}</Text>
                            </View>
                            <View style={styles.infoRow}>
                                <Text style={styles.infoIcon}>📅</Text>
                                <Text style={styles.infoText}>
                                    {mockBooking.date} • {mockBooking.time}
                                </Text>
                            </View>
                            <View style={styles.infoRow}>
                                <Text style={styles.infoIcon}>🎭</Text>
                                <Text style={styles.infoText}>
                                    {mockBooking.screen} • {mockBooking.type}
                                </Text>
                            </View>
                            <View style={styles.infoRow}>
                                <Text style={styles.infoIcon}>💺</Text>
                                <Text style={styles.infoText}>
                                    Ghế: {mockBooking.seats.join(', ')}
                                </Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Payment Method */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Phương thức thanh toán</Text>
                    <View style={styles.paymentMethods}>
                        {paymentMethods.map((method) => (
                            <TouchableOpacity
                                key={method.id}
                                style={[
                                    styles.paymentMethod,
                                    selectedMethod === method.id && styles.paymentMethodSelected,
                                ]}
                                onPress={() => setSelectedMethod(method.id)}
                            >
                                <View style={styles.paymentMethodLeft}>
                                    <Text style={styles.paymentIcon}>{method.icon}</Text>
                                    <Text style={styles.paymentName}>{method.name}</Text>
                                </View>
                                <View
                                    style={[
                                        styles.radio,
                                        selectedMethod === method.id && styles.radioSelected,
                                    ]}
                                >
                                    {selectedMethod === method.id && (
                                        <View style={styles.radioDot} />
                                    )}
                                </View>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Promo Code */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Mã giảm giá</Text>
                    <View style={styles.promoCard}>
                        <TextInput
                            style={styles.promoInput}
                            placeholder="Nhập mã giảm giá"
                            placeholderTextColor="rgba(255,255,255,0.4)"
                            value={promoCode}
                            onChangeText={setPromoCode}
                            autoCapitalize="characters"
                        />
                        <TouchableOpacity
                            style={styles.applyButton}
                            onPress={handleApplyPromo}
                            disabled={!promoCode}
                        >
                            <Text style={styles.applyButtonText}>Áp dụng</Text>
                        </TouchableOpacity>
                    </View>
                    <Text style={styles.promoHint}>
                        💡 Thử: NEWUSER, CINEMA50
                    </Text>
                </View>

                {/* Price Breakdown */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Chi tiết thanh toán</Text>
                    <View style={styles.priceCard}>
                        <View style={styles.priceRow}>
                            <Text style={styles.priceLabel}>
                                Giá vé ({mockBooking.quantity} x {mockBooking.ticketPrice.toLocaleString('vi-VN')}đ)
                            </Text>
                            <Text style={styles.priceValue}>
                                {subtotal.toLocaleString('vi-VN')}đ
                            </Text>
                        </View>

                        <View style={styles.priceRow}>
                            <Text style={styles.priceLabel}>Phí dịch vụ</Text>
                            <Text style={styles.priceValue}>
                                {serviceFee.toLocaleString('vi-VN')}đ
                            </Text>
                        </View>

                        {discount > 0 && (
                            <View style={styles.priceRow}>
                                <Text style={[styles.priceLabel, styles.discountLabel]}>
                                    Giảm giá
                                </Text>
                                <Text style={[styles.priceValue, styles.discountValue]}>
                                    -{discount.toLocaleString('vi-VN')}đ
                                </Text>
                            </View>
                        )}

                        <View style={styles.divider} />

                        <View style={styles.priceRow}>
                            <Text style={styles.totalLabel}>Tổng cộng</Text>
                            <Text style={styles.totalValue}>
                                {total.toLocaleString('vi-VN')}đ
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Terms */}
                <View style={styles.termsContainer}>
                    <Text style={styles.termsText}>
                        Bằng việc tiếp tục, bạn đồng ý với{' '}
                        <Text style={styles.termsLink}>Điều khoản dịch vụ</Text> và{' '}
                        <Text style={styles.termsLink}>Chính sách bảo mật</Text> của chúng tôi
                    </Text>
                </View>

                <View style={styles.bottomSpacing} />
            </ScrollView>

            {/* Bottom Bar */}
            <View style={styles.bottomBar}>
                <View style={styles.totalInfo}>
                    <Text style={styles.bottomLabel}>Tổng thanh toán</Text>
                    <Text style={styles.bottomTotal}>{total.toLocaleString('vi-VN')}đ</Text>
                </View>
                <TouchableOpacity
                    style={[styles.payButton, isProcessing && styles.payButtonDisabled]}
                    onPress={handlePayment}
                    disabled={isProcessing}
                >
                    <Text style={styles.payButtonText}>
                        {isProcessing ? '⏳ Đang xử lý...' : '💳 Thanh toán'}
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0f0f23',
    },
    header: {
        paddingTop: 60,
        paddingHorizontal: 20,
        paddingBottom: 20,
        backgroundColor: '#1a1a2e',
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(139, 92, 246, 0.2)',
        flexDirection: 'row',
        alignItems: 'center',
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(139, 92, 246, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    backIcon: {
        fontSize: 24,
        color: '#a78bfa',
        fontWeight: 'bold',
    },
    headerContent: {
        flex: 1,
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 4,
    },
    headerSubtitle: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.6)',
    },
    content: {
        flex: 1,
    },
    section: {
        marginTop: 24,
        paddingHorizontal: 20,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: 'rgba(255,255,255,0.6)',
        marginBottom: 12,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    summaryCard: {
        backgroundColor: '#1a1a2e',
        borderRadius: 16,
        padding: 16,
        flexDirection: 'row',
        borderWidth: 1,
        borderColor: 'rgba(139, 92, 246, 0.2)',
    },
    moviePoster: {
        width: 80,
        height: 120,
        borderRadius: 12,
        backgroundColor: '#2a2a3e',
    },
    summaryDetails: {
        flex: 1,
        marginLeft: 16,
    },
    movieTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 12,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 6,
    },
    infoIcon: {
        fontSize: 12,
        marginRight: 8,
        width: 16,
    },
    infoText: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.7)',
        flex: 1,
    },
    paymentMethods: {
        gap: 12,
    },
    paymentMethod: {
        backgroundColor: '#1a1a2e',
        borderRadius: 12,
        padding: 16,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: 'rgba(139, 92, 246, 0.2)',
    },
    paymentMethodSelected: {
        borderColor: '#8b5cf6',
        backgroundColor: 'rgba(139, 92, 246, 0.1)',
    },
    paymentMethodLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    paymentIcon: {
        fontSize: 24,
        marginRight: 12,
    },
    paymentName: {
        fontSize: 15,
        color: '#fff',
        fontWeight: '500',
    },
    radio: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: 'rgba(139, 92, 246, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    radioSelected: {
        borderColor: '#8b5cf6',
    },
    radioDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: '#8b5cf6',
    },
    promoCard: {
        backgroundColor: '#1a1a2e',
        borderRadius: 12,
        padding: 4,
        flexDirection: 'row',
        borderWidth: 1,
        borderColor: 'rgba(139, 92, 246, 0.2)',
    },
    promoInput: {
        flex: 1,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 15,
        color: '#fff',
        fontWeight: '600',
    },
    applyButton: {
        backgroundColor: '#8b5cf6',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 8,
        justifyContent: 'center',
    },
    applyButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#fff',
    },
    promoHint: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.5)',
        marginTop: 8,
        fontStyle: 'italic',
    },
    priceCard: {
        backgroundColor: '#1a1a2e',
        borderRadius: 16,
        padding: 20,
        borderWidth: 1,
        borderColor: 'rgba(139, 92, 246, 0.2)',
    },
    priceRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    priceLabel: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.7)',
    },
    priceValue: {
        fontSize: 14,
        color: '#fff',
        fontWeight: '600',
    },
    discountLabel: {
        color: '#10b981',
    },
    discountValue: {
        color: '#10b981',
    },
    divider: {
        height: 1,
        backgroundColor: 'rgba(139, 92, 246, 0.2)',
        marginVertical: 8,
    },
    totalLabel: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#fff',
    },
    totalValue: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#8b5cf6',
    },
    termsContainer: {
        paddingHorizontal: 20,
        marginTop: 24,
    },
    termsText: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.5)',
        textAlign: 'center',
        lineHeight: 18,
    },
    termsLink: {
        color: '#a78bfa',
        fontWeight: '600',
    },
    bottomSpacing: {
        height: 140,
    },
    bottomBar: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#1a1a2e',
        padding: 20,
        borderTopWidth: 1,
        borderTopColor: 'rgba(139, 92, 246, 0.2)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 10,
    },
    totalInfo: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    bottomLabel: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.6)',
    },
    bottomTotal: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#8b5cf6',
    },
    payButton: {
        backgroundColor: '#8b5cf6',
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        shadowColor: '#8b5cf6',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    payButtonDisabled: {
        backgroundColor: '#6b7280',
        shadowOpacity: 0,
    },
    payButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#fff',
    },
});