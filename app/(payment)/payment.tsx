import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

// Types
interface PaymentMethod {
    id: string;
    type: 'card' | 'momo' | 'zalopay' | 'banking' | 'cash';
    name: string;
    icon: string;
}

interface Seat {
    id: number;
    rowSeat: string;
    number: number;
    type: 'NORMAL' | 'VIP';
}

interface Room {
    id: number;
    name: string;
    cinema: {
        id: number;
        name: string;
        address: string;
    };
}

interface Movie {
    id: number;
    title: string;
    posterUrl: string;
    duration: number;
    rating: number;
}

interface ShowtimeDetail {
    id: number;
    startTime: string;
    format: string;
    price: number;
    movie: Movie;
    room: Room;
}

interface TicketCreateRequest {
    showtime: {
        id: number;
    };
    seat: {
        id: number;
    };
    price: number;
}

const API_URL = 'https://ltud.up.railway.app/api';

const paymentMethods: PaymentMethod[] = [
    { id: '1', type: 'momo', name: 'Ví MoMo', icon: '🟣' },
    { id: '2', type: 'zalopay', name: 'ZaloPay', icon: '🔵' },
    { id: '3', type: 'banking', name: 'Chuyển khoản ngân hàng', icon: '🏦' },
    { id: '4', type: 'card', name: 'Thẻ tín dụng/ghi nợ', icon: '💳' },
    { id: '5', type: 'cash', name: 'Thanh toán tại quầy', icon: '💵' },
];

export default function PaymentScreen() {
    // Get params from navigation
    const params = useLocalSearchParams();
    console.log('🔍 RAW PARAMS:', JSON.stringify(params, null, 2));

    // TEMPORARY: Use test data if params are missing
    const showtimeId = (params.showtimeId as string) || '1'; // Test với showtime ID = 1
    const seatIds = params.seatIds
        ? JSON.parse(params.seatIds as string)
        : [1, 2]; // Test với seat IDs = [1, 2]

    console.log('📌 PARSED showtimeId:', showtimeId);
    console.log('📌 PARSED seatIds:', seatIds);
    console.log('⚠️ Using test data:', !params.showtimeId || !params.seatIds);

    const [selectedMethod, setSelectedMethod] = useState<string>('1');
    const [promoCode, setPromoCode] = useState<string>('');
    const [discount, setDiscount] = useState<number>(0);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [authToken, setAuthToken] = useState<string | null>(null);

    // Data from API
    const [showtimeDetail, setShowtimeDetail] = useState<ShowtimeDetail | null>(null);
    const [selectedSeats, setSelectedSeats] = useState<Seat[]>([]);
    const [allSeats, setAllSeats] = useState<Seat[]>([]);

    const serviceFee = 5000;
    const subtotal = showtimeDetail ? showtimeDetail.price * selectedSeats.length : 0;
    const total = subtotal + serviceFee - discount;

    useEffect(() => {
        loadAuthToken();
    }, []);

    useEffect(() => {
        if (authToken && showtimeId) {
            fetchShowtimeDetails();
        }
    }, [authToken, showtimeId]);

    const loadAuthToken = async () => {
        try {
            const token = await AsyncStorage.getItem('authToken');
            console.log('Token loaded:', token ? 'Yes' : 'No');

            if (!token) {
                Alert.alert('Lỗi', 'Vui lòng đăng nhập để tiếp tục', [
                    { text: 'Đăng nhập', onPress: () => router.push('/(auth)/login') }
                ]);
                return;
            }
            setAuthToken(token);
        } catch (error) {
            console.error('Error loading token:', error);
        }
    };

    const fetchShowtimeDetails = async () => {
        try {
            setIsLoading(true);
            console.log('=== PAYMENT SCREEN DEBUG ===');
            console.log('1. Fetching showtime ID:', showtimeId);
            console.log('2. Selected seat IDs:', seatIds);
            console.log('3. Auth token exists:', authToken ? 'YES' : 'NO');
            console.log('4. API URL:', `${API_URL}/customer/showtimes/${showtimeId}`);

            // Fetch showtime details
            console.log('5. Starting API call...');
            const showtimeResponse = await axios.get(
                `${API_URL}/customer/showtimes/${showtimeId}`,
                {
                    headers: {
                        'Authorization': `Bearer ${authToken}`,
                    },
                    timeout: 10000 // 10 seconds timeout
                }
            );

            console.log('6. Showtime API response received:', showtimeResponse.status);
            console.log('7. Showtime data:', JSON.stringify(showtimeResponse.data, null, 2));
            setShowtimeDetail(showtimeResponse.data);

            // Fetch all seats in the room (CUSTOMER can access this endpoint)
            const roomId = showtimeResponse.data.room?.id;
            console.log('8. Room ID from showtime:', roomId);

            if (!roomId) {
                throw new Error('Room ID not found in showtime response');
            }

            console.log('9. Fetching seats for room:', roomId);
            console.log('10. API URL:', `${API_URL}/customer/seats/room/${roomId}`);

            const seatsResponse = await axios.get(
                `${API_URL}/customer/seats/room/${roomId}`,
                {
                    headers: {
                        'Authorization': `Bearer ${authToken}`,
                    },
                    timeout: 10000
                }
            );

            console.log('11. Seats API response received:', seatsResponse.status);
            console.log('12. Number of seats:', seatsResponse.data.length);
            console.log('13. All seats data:', JSON.stringify(seatsResponse.data, null, 2));
            setAllSeats(seatsResponse.data);

            // Filter selected seats from all seats
            if (seatIds.length > 0) {
                const filteredSeats = seatsResponse.data.filter((seat: Seat) =>
                    seatIds.includes(seat.id)
                );
                console.log('14. Filtered selected seats:', JSON.stringify(filteredSeats, null, 2));
                console.log('15. Number of selected seats:', filteredSeats.length);
                setSelectedSeats(filteredSeats);
            } else {
                console.log('14. WARNING: No seat IDs provided!');
            }

            console.log('16. SUCCESS: All data loaded successfully!');

        } catch (error: any) {
            console.error('❌ ERROR in fetchShowtimeDetails:');
            console.error('Error message:', error.message);
            console.error('Error response:', error.response?.data);
            console.error('Error status:', error.response?.status);
            console.error('Full error:', error);

            if (error.response?.status === 401 || error.response?.status === 403) {
                Alert.alert('Lỗi xác thực', 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.', [
                    { text: 'Đăng nhập', onPress: () => router.push('/(auth)/login') }
                ]);
            } else {
                Alert.alert('Lỗi', `Không thể tải thông tin đặt vé: ${error.response?.data?.message || error.message}`);
            }
        } finally {
            console.log('17. Setting isLoading to false');
            setIsLoading(false);
        }
    };

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

    const formatDateTime = (dateTimeString: string) => {
        const date = new Date(dateTimeString);
        const dateStr = date.toLocaleDateString('vi-VN');
        const timeStr = date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
        return { date: dateStr, time: timeStr };
    };

    const createTickets = async () => {
        if (!authToken || !showtimeDetail) {
            Alert.alert('Lỗi', 'Thông tin không hợp lệ');
            return false;
        }

        try {
            console.log('Creating tickets for seats:', selectedSeats);

            const ticketPromises = selectedSeats.map(seat => {
                const ticketData: TicketCreateRequest = {
                    showtime: {
                        id: showtimeDetail.id
                    },
                    seat: {
                        id: seat.id
                    },
                    price: showtimeDetail.price
                };

                console.log('Creating ticket with data:', ticketData);

                return axios.post(
                    `${API_URL}/customer/tickets`,
                    ticketData,
                    {
                        headers: {
                            'Authorization': `Bearer ${authToken}`,
                            'Content-Type': 'application/json',
                        }
                    }
                );
            });

            const responses = await Promise.all(ticketPromises);

            console.log('Tickets created successfully:', responses.map(r => r.data));
            return true;
        } catch (error: any) {
            console.error('Error creating tickets:', error);
            console.error('Error response:', error.response?.data);

            if (error.response) {
                console.error('Response status:', error.response.status);
                console.error('Response data:', error.response.data);

                if (error.response.status === 401 || error.response.status === 403) {
                    Alert.alert('Lỗi xác thực', 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.', [
                        { text: 'Đăng nhập', onPress: () => router.push('/(auth)/login') }
                    ]);
                } else {
                    const errorMessage = error.response.data?.message || 'Không thể tạo vé. Vui lòng thử lại.';
                    Alert.alert('Lỗi', errorMessage);
                }
            } else if (error.request) {
                console.error('Request error:', error.request);
                Alert.alert('Lỗi kết nối', 'Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng.');
            } else {
                console.error('Error:', error.message);
                Alert.alert('Lỗi', 'Đã xảy ra lỗi không xác định');
            }

            return false;
        }
    };

    const handlePayment = async () => {
        if (!authToken) {
            Alert.alert('Lỗi', 'Vui lòng đăng nhập để tiếp tục', [
                { text: 'Đăng nhập', onPress: () => router.push('/(auth)/login') }
            ]);
            return;
        }

        setIsProcessing(true);

        try {
            // Create tickets via API
            const success = await createTickets();

            if (success) {
                // Simulate payment processing
                await new Promise(resolve => setTimeout(resolve, 1500));

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
            }
        } catch (error) {
            console.error('Payment error:', error);
            Alert.alert('Lỗi', 'Đã xảy ra lỗi trong quá trình thanh toán');
        } finally {
            setIsProcessing(false);
        }
    };

    if (isLoading) {
        return (
            <View style={[styles.container, styles.centerContent]}>
                <ActivityIndicator size="large" color="#8b5cf6" />
                <Text style={styles.loadingText}>Đang tải thông tin...</Text>
                <Text style={[styles.loadingText, { marginTop: 20, fontSize: 12, color: '#666' }]}>
                    ShowtimeId: {showtimeId || 'MISSING'}
                </Text>
                <Text style={[styles.loadingText, { fontSize: 12, color: '#666' }]}>
                    SeatIds: {seatIds.length > 0 ? seatIds.join(', ') : 'MISSING'}
                </Text>
                <Text style={[styles.loadingText, { fontSize: 12, color: '#666' }]}>
                    Token: {authToken ? 'EXISTS' : 'MISSING'}
                </Text>

                {/* Test button */}
                <TouchableOpacity
                    style={{ marginTop: 20, padding: 10, backgroundColor: '#ef4444', borderRadius: 8 }}
                    onPress={() => {
                        console.log('🔴 FORCE TEST');
                        console.log('showtimeId:', showtimeId);
                        console.log('seatIds:', seatIds);
                        console.log('authToken exists:', !!authToken);
                    }}
                >
                    <Text style={{ color: '#fff' }}>Debug Console</Text>
                </TouchableOpacity>
            </View>
        );
    }

    if (!showtimeDetail) {
        return (
            <View style={[styles.container, styles.centerContent]}>
                <Text style={styles.errorText}>Không tìm thấy thông tin suất chiếu</Text>
                <TouchableOpacity
                    style={styles.backButtonError}
                    onPress={() => router.back()}
                >
                    <Text style={styles.backButtonText}>Quay lại</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const { date, time } = formatDateTime(showtimeDetail.startTime);

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.headerBackButton} onPress={() => router.back()}>
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
                            source={{ uri: showtimeDetail.movie.posterUrl }}
                            style={styles.moviePoster}
                            contentFit="cover"
                        />
                        <View style={styles.summaryDetails}>
                            <Text style={styles.movieTitle}>{showtimeDetail.movie.title}</Text>
                            <View style={styles.infoRow}>
                                <Text style={styles.infoIcon}>🎬</Text>
                                <Text style={styles.infoText}>{showtimeDetail.room.cinema.name}</Text>
                            </View>
                            <View style={styles.infoRow}>
                                <Text style={styles.infoIcon}>📅</Text>
                                <Text style={styles.infoText}>
                                    {date} • {time}
                                </Text>
                            </View>
                            <View style={styles.infoRow}>
                                <Text style={styles.infoIcon}>🎭</Text>
                                <Text style={styles.infoText}>
                                    {showtimeDetail.room.name} • {showtimeDetail.format}
                                </Text>
                            </View>
                            <View style={styles.infoRow}>
                                <Text style={styles.infoIcon}>💺</Text>
                                <Text style={styles.infoText}>
                                    Ghế: {selectedSeats.map(s => `${s.rowSeat}${s.number}`).join(', ')}
                                </Text>
                            </View>
                            <View style={styles.infoRow}>
                                <Text style={styles.infoIcon}>⭐</Text>
                                <Text style={styles.infoText}>
                                    Đánh giá: {showtimeDetail.movie.rating}/10
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
                                Giá vé ({selectedSeats.length} x {showtimeDetail.price.toLocaleString('vi-VN')}đ)
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
                    {isProcessing ? (
                        <View style={styles.processingContainer}>
                            <ActivityIndicator color="#fff" size="small" />
                            <Text style={styles.payButtonText}> Đang xử lý...</Text>
                        </View>
                    ) : (
                        <Text style={styles.payButtonText}>💳 Thanh toán</Text>
                    )}
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
    centerContent: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        color: '#fff',
        fontSize: 16,
        marginTop: 16,
    },
    errorText: {
        color: '#ef4444',
        fontSize: 16,
        marginBottom: 20,
        textAlign: 'center',
        paddingHorizontal: 20,
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
    headerBackButton: {
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
    processingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    backButtonError: {
        backgroundColor: '#8b5cf6',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 8,
    },
    backButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
});