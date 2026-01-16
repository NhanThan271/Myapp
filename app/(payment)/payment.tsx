import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

// Types
interface PaymentMethod {
    id: string;
    type: 'momo' | 'zalopay' | 'banking' | 'cash';
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

interface User {
    id: number;
    username: string;
    email: string;
    role: string;
}

const API_URL = 'https://backend-ltud2.onrender.com/api';

const paymentMethods: PaymentMethod[] = [
    { id: '1', type: 'momo', name: 'Ví MoMo', icon: '🟣' },
    { id: '2', type: 'zalopay', name: 'ZaloPay', icon: '🔵' },
    { id: '3', type: 'banking', name: 'Chuyển khoản ngân hàng', icon: '🏦' },
    { id: '5', type: 'cash', name: 'Thanh toán tại quầy', icon: '💵' },
];

export default function PaymentScreen() {
    const params = useLocalSearchParams();

    const showtimeId = params.showtimeId as string;
    const seatIds = params.seatIds ? JSON.parse(params.seatIds as string) : [];

    const [selectedMethod, setSelectedMethod] = useState<string>('1');
    const [promoCode, setPromoCode] = useState<string>('');
    const [discount, setDiscount] = useState<number>(0);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [authToken, setAuthToken] = useState<string | null>(null);
    const [currentUser, setCurrentUser] = useState<User | null>(null);

    const [showtimeDetail, setShowtimeDetail] = useState<ShowtimeDetail | null>(null);
    const [selectedSeats, setSelectedSeats] = useState<Seat[]>([]);

    const serviceFee = 5000;
    const subtotal = showtimeDetail?.price ? showtimeDetail.price * selectedSeats.length : 0;
    const total = subtotal + serviceFee - discount;
    const [toast, setToast] = useState({ visible: false, message: '', type: 'error' as 'error' | 'success' | 'info' });

    const showToast = (message: string, type: 'error' | 'success' | 'info' = 'error') => {
        setToast({ visible: true, message, type });
    };

    useEffect(() => {
        loadAuthToken();
    }, []);

    useEffect(() => {
        if (authToken && showtimeId) {
            fetchUserInfo();
            fetchShowtimeDetails();
        }
    }, [authToken, showtimeId]);

    const loadAuthToken = async () => {
        try {
            const token = await AsyncStorage.getItem('authToken');
            console.log(' Token loaded');

            if (!token) {
                Alert.alert('Lỗi', 'Vui lòng đăng nhập để tiếp tục', [
                    { text: 'Đăng nhập', onPress: () => router.push('/(auth)/login') }
                ]);
                return;
            }
            setAuthToken(token);
        } catch (error) {
            console.error('❌ Error loading token:', error);
        }
    };
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
            console.error('❌ Error parsing JWT:', error);
            return null;
        }
    };

    const fetchUserInfo = async () => {
        try {
            console.log('🔍 Loading user info...');

            if (!authToken) {
                throw new Error('No auth token');
            }

            //  Lấy userId đã lưu từ AsyncStorage
            const storedUserId = await AsyncStorage.getItem('userId');
            const storedUsername = await AsyncStorage.getItem('username');
            const storedEmail = await AsyncStorage.getItem('email');
            const storedRoles = await AsyncStorage.getItem('roles');

            console.log('📦 Stored data:', {
                userId: storedUserId,
                username: storedUsername,
                email: storedEmail,
                roles: storedRoles
            });

            if (!storedUserId) {
                throw new Error('No userId in storage');
            }

            const parsedUserId = parseInt(storedUserId, 10);

            if (isNaN(parsedUserId)) {
                throw new Error('Invalid userId format');
            }

            //  Set user từ AsyncStorage
            setCurrentUser({
                id: parsedUserId,
                username: storedUsername || '',
                email: storedEmail || '',
                role: storedRoles ? JSON.parse(storedRoles)[0] : 'CUSTOMER'
            });

            console.log(' User info loaded:', parsedUserId);

        } catch (error: any) {
            console.error('❌ Error loading user info:', error.message);
            Alert.alert('Lỗi', 'Không thể lấy thông tin người dùng. Vui lòng đăng nhập lại.', [
                { text: 'Đăng nhập', onPress: () => router.push('/(auth)/login') }
            ]);
            setIsLoading(false);
        }
    };

    const fetchShowtimeDetails = async () => {
        try {
            setIsLoading(true);
            console.log('🎬 Fetching showtime:', showtimeId);

            const showtimeResponse = await axios.get(
                `${API_URL}/customer/showtimes/${showtimeId}`,
                { headers: { 'Authorization': `Bearer ${authToken}` }, timeout: 10000 }
            );

            console.log(' Showtime loaded');
            setShowtimeDetail(showtimeResponse.data);

            const roomId = showtimeResponse.data.room?.id;
            if (!roomId) {
                console.error('❌ Room ID not found');
                throw new Error('Room ID not found');
            }

            console.log('💺 Fetching seats for room:', roomId);
            const seatsResponse = await axios.get(
                `${API_URL}/customer/seats/room/${roomId}`,
                { headers: { 'Authorization': `Bearer ${authToken}` }, timeout: 10000 }
            );

            console.log(' Seats loaded:', seatsResponse.data.length);

            if (seatIds.length > 0) {
                const filteredSeats = seatsResponse.data.filter((seat: Seat) =>
                    seatIds.includes(seat.id)
                );
                console.log(' Selected seats:', filteredSeats.length);
                setSelectedSeats(filteredSeats);
            }

            console.log('🎉 ALL DATA LOADED SUCCESSFULLY');

        } catch (error: any) {
            console.error('❌ ERROR in fetchShowtimeDetails:', error.message);
            console.error('Response status:', error.response?.status);
            console.error('Response data:', error.response?.data);

            if (error.response?.status === 401 || error.response?.status === 403) {
                Alert.alert('Lỗi xác thực', 'Phiên đăng nhập đã hết hạn.', [
                    { text: 'Đăng nhập', onPress: () => router.push('/(auth)/login') }
                ]);
            } else {
                Alert.alert('Lỗi', `Không thể tải thông tin: ${error.message}`);
            }
        } finally {
            console.log('🏁 Setting isLoading = false');
            setIsLoading(false);
        }
    };

    const handleApplyPromo = () => {
        if (!promoCode.trim()) return;

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

    //  GỬI ĐÚNG FORMAT CreateTicketRequest
    const createTickets = async () => {
        if (!authToken || !showtimeDetail || !currentUser || !currentUser.id || isNaN(currentUser.id)) {
            console.error('❌ Invalid data:', {
                authToken: !!authToken,
                showtimeDetail: !!showtimeDetail,
                currentUser: currentUser,
                userId: currentUser?.id
            });
            Alert.alert('Lỗi', 'Thông tin người dùng không hợp lệ. Vui lòng đăng nhập lại.');
            return false;
        }
        try {
            console.log('🎫 Creating tickets for user:', currentUser.id);
            const createdTickets = [];

            for (const seat of selectedSeats) {
                console.log(`📤 Booking seat ${seat.rowSeat}${seat.number}`);

                // Format đúng theo CreateTicketRequest của backend
                const requestBody = {
                    showtimeId: showtimeDetail.id,
                    seatId: seat.id,
                    userId: currentUser.id
                };

                console.log('Request:', JSON.stringify(requestBody));

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

                    console.log(` Ticket ${response.data.id} created for ${seat.rowSeat}${seat.number}`);
                    createdTickets.push(response.data);

                } catch (seatError: any) {
                    console.error(`❌ Failed for ${seat.rowSeat}${seat.number}:`, seatError.response?.data);
                    console.error('Error status:', seatError.response?.status);
                    console.error('Request body:', requestBody);

                    const errorMsg = seatError.response?.data?.message || 'Lỗi không xác định';
                    throw new Error(`Không thể đặt ghế ${seat.rowSeat}${seat.number}: ${errorMsg}`);
                }

                await new Promise(resolve => setTimeout(resolve, 200));
            }

            console.log('🎉 All tickets created! Total:', createdTickets.length);
            return true;

        } catch (error: any) {
            console.error('❌ createTickets error:', error);

            if (error.message.includes('Không thể đặt ghế')) {
                Alert.alert('Lỗi đặt vé', error.message);
            } else if (error.response) {
                const status = error.response.status;
                const message = error.response.data?.message;

                if (status === 401 || status === 403) {
                    Alert.alert('Lỗi xác thực', 'Phiên đăng nhập đã hết hạn.', [
                        { text: 'Đăng nhập', onPress: () => router.push('/(auth)/login') }
                    ]);
                } else if (status === 409) {
                    Alert.alert('Ghế đã được đặt', message || 'Vui lòng chọn ghế khác.');
                } else if (status === 400) {
                    Alert.alert('Lỗi dữ liệu', message || 'Dữ liệu không hợp lệ.');
                } else if (status === 404) {
                    Alert.alert('Không tìm thấy', message || 'Không tìm thấy thông tin.');
                } else {
                    Alert.alert('Lỗi', message || 'Không thể tạo vé.');
                }
            } else if (error.request) {
                Alert.alert('Lỗi kết nối', 'Không thể kết nối đến server.');
            } else {
                Alert.alert('Lỗi', error.message || 'Lỗi không xác định');
            }

            return false;
        }
    };

    const TICKETS_STORAGE_KEY = 'user_tickets';

    const handlePayment = async () => {
        if (!authToken || !currentUser) {
            Alert.alert('Lỗi', 'Vui lòng đăng nhập để tiếp tục', [
                { text: 'Đăng nhập', onPress: () => router.push('/(auth)/login') }
            ]);
            return;
        }

        //  Kiểm tra nếu chọn chuyển khoản ngân hàng -> chuyển sang BankingPaymentScreen
        if (selectedMethod === '3') { // '3' là ID của "Chuyển khoản ngân hàng"
            router.push({
                pathname: '/(payment)/bankingPayment',
                params: {
                    movieTitle: showtimeDetail!.movie.title,
                    cinema: showtimeDetail!.room.cinema.name,
                    showtime: `${time} - ${date}`,
                    seats: selectedSeats.map(s => `${s.rowSeat}${s.number}`).join(', '),
                    amount: subtotal.toString(),
                    serviceFee: serviceFee.toString(),
                    discount: discount.toString(),
                    // Thêm các thông tin cần thiết để tạo vé sau khi thanh toán thành công
                    showtimeId: showtimeDetail!.id.toString(),
                    seatIds: JSON.stringify(selectedSeats.map(s => s.id)),
                }
            });
            return;
        }

        //  Xử lý các phương thức thanh toán khác (MoMo, ZaloPay, Cash)
        setIsProcessing(true);

        try {
            console.log('💳 Starting payment...');
            const success = await createTickets();

            if (success) {
                console.log(' Payment successful!');

                // Lưu tickets vào AsyncStorage
                try {
                    const newTickets = selectedSeats.map((seat, index) => ({
                        id: Date.now() + index,
                        showtime: showtimeDetail!,
                        seat: seat,
                        price: showtimeDetail!.price,
                        bookingDate: new Date().toISOString(),
                        status: 'BOOKED' as const
                    }));

                    const storedTickets = await AsyncStorage.getItem(
                        `${TICKETS_STORAGE_KEY}_${currentUser.id}`
                    );

                    const existingTickets = storedTickets ? JSON.parse(storedTickets) : [];
                    const allTickets = [...existingTickets, ...newTickets];

                    await AsyncStorage.setItem(
                        `${TICKETS_STORAGE_KEY}_${currentUser.id}`,
                        JSON.stringify(allTickets)
                    );

                    console.log(' Tickets saved to storage:', newTickets.length);
                } catch (storageError) {
                    console.error('⚠️ Failed to save tickets to storage:', storageError);
                }

                setIsProcessing(false);
                showToast('Đặt vé thành công!', 'success');

                setTimeout(() => {
                    console.log('🎫 Navigating to myticket...');
                    router.replace('/(ticket)/myticket');
                }, 1500);

            } else {
                setIsProcessing(false);
                Alert.alert('Lỗi', 'Không thể hoàn tất thanh toán');
            }
        } catch (error: any) {
            console.error('❌ Payment error:', error);
            setIsProcessing(false);
            Alert.alert('Lỗi', error.message || 'Đã xảy ra lỗi trong quá trình thanh toán');
        }
    };

    if (!showtimeDetail || !currentUser) {
        return (
            <View style={[styles.container, styles.centerContent]}>
                <Text style={styles.errorText}>
                    {!showtimeDetail ? 'Không tìm thấy thông tin suất chiếu' : 'Đang tải thông tin người dùng...'}
                </Text>
                <TouchableOpacity style={styles.backButtonError} onPress={() => router.back()}>
                    <Text style={styles.backButtonText}>Quay lại</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const { date, time } = formatDateTime(showtimeDetail.startTime);

    return (
        <View style={styles.container}>
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
                                <Text style={styles.infoText}>{date} • {time}</Text>
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
                                <View style={[styles.radio, selectedMethod === method.id && styles.radioSelected]}>
                                    <Text>{selectedMethod === method.id && <View style={styles.radioDot} />}</Text>
                                </View>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

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
                    <Text style={styles.promoHint}>💡 Thử: NEWUSER, CINEMA50</Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Chi tiết thanh toán</Text>
                    <View style={styles.priceCard}>
                        <View style={styles.priceRow}>
                            <Text style={styles.priceLabel}>
                                Giá vé ({selectedSeats.length} x {showtimeDetail.price.toLocaleString('vi-VN')}đ)
                            </Text>
                            <Text style={styles.priceValue}>{subtotal.toLocaleString('vi-VN')}đ</Text>
                        </View>

                        <View style={styles.priceRow}>
                            <Text style={styles.priceLabel}>Phí dịch vụ</Text>
                            <Text style={styles.priceValue}>{serviceFee.toLocaleString('vi-VN')}đ</Text>
                        </View>

                        {discount > 0 && (
                            <View style={styles.priceRow}>
                                <Text style={[styles.priceLabel, styles.discountLabel]}>Giảm giá</Text>
                                <Text style={[styles.priceValue, styles.discountValue]}>
                                    -{discount.toLocaleString('vi-VN')}đ
                                </Text>
                            </View>
                        )}

                        <View style={styles.divider} />

                        <View style={styles.priceRow}>
                            <Text style={styles.totalLabel}>Tổng cộng</Text>
                            <Text style={styles.totalValue}>{total.toLocaleString('vi-VN')}đ</Text>
                        </View>
                    </View>
                </View>

                <View style={styles.termsContainer}>
                    <Text style={styles.termsText}>
                        Bằng việc tiếp tục, bạn đồng ý với{' '}
                        <Text style={styles.termsLink}>Điều khoản dịch vụ</Text> và{' '}
                        <Text style={styles.termsLink}>Chính sách bảo mật</Text> của chúng tôi
                    </Text>
                </View>

                <View style={styles.bottomSpacing} />
            </ScrollView>

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
                            <Text style={styles.payButtonText}>Đang xử lý...</Text>
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
    container: { flex: 1, backgroundColor: '#0f0f23' },
    centerContent: { justifyContent: 'center', alignItems: 'center' },
    loadingText: { color: '#fff', fontSize: 16, marginTop: 16 },
    errorText: { color: '#ef4444', fontSize: 16, marginBottom: 20, textAlign: 'center', paddingHorizontal: 20 },
    header: { paddingTop: 60, paddingHorizontal: 20, paddingBottom: 20, backgroundColor: '#1a1a2e', borderBottomWidth: 1, borderBottomColor: 'rgba(139, 92, 246, 0.2)', flexDirection: 'row', alignItems: 'center' },
    headerBackButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(139, 92, 246, 0.2)', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    backIcon: { fontSize: 24, color: '#a78bfa', fontWeight: 'bold' },
    headerContent: { flex: 1 },
    headerTitle: { fontSize: 28, fontWeight: 'bold', color: '#fff', marginBottom: 4 },
    headerSubtitle: { fontSize: 14, color: 'rgba(255,255,255,0.6)' },
    content: { flex: 1 },
    section: { marginTop: 24, paddingHorizontal: 20 },
    sectionTitle: { fontSize: 16, fontWeight: 'bold', color: 'rgba(255,255,255,0.6)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 },
    summaryCard: { backgroundColor: '#1a1a2e', borderRadius: 16, padding: 16, flexDirection: 'row', borderWidth: 1, borderColor: 'rgba(139, 92, 246, 0.2)' },
    moviePoster: { width: 80, height: 120, borderRadius: 12, backgroundColor: '#2a2a3e' },
    summaryDetails: { flex: 1, marginLeft: 16 },
    movieTitle: { fontSize: 16, fontWeight: 'bold', color: '#fff', marginBottom: 12 },
    infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
    infoIcon: { fontSize: 12, marginRight: 8, width: 16 },
    infoText: { fontSize: 12, color: 'rgba(255,255,255,0.7)', flex: 1 },
    paymentMethods: { gap: 12 },
    paymentMethod: { backgroundColor: '#1a1a2e', borderRadius: 12, padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 2, borderColor: 'rgba(139, 92, 246, 0.2)' },
    paymentMethodSelected: { borderColor: '#8b5cf6', backgroundColor: 'rgba(139, 92, 246, 0.1)' },
    paymentMethodLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
    paymentIcon: { fontSize: 24, marginRight: 12 },
    paymentName: { fontSize: 15, color: '#fff', fontWeight: '500' },
    radio: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: 'rgba(139, 92, 246, 0.5)', justifyContent: 'center', alignItems: 'center' },
    radioSelected: { borderColor: '#8b5cf6' },
    radioDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#8b5cf6' },
    promoCard: { backgroundColor: '#1a1a2e', borderRadius: 12, padding: 4, flexDirection: 'row', borderWidth: 1, borderColor: 'rgba(139, 92, 246, 0.2)' },
    promoInput: { flex: 1, paddingHorizontal: 16, paddingVertical: 12, fontSize: 15, color: '#fff', fontWeight: '600' },
    applyButton: { backgroundColor: '#8b5cf6', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 8, justifyContent: 'center' },
    applyButtonText: { fontSize: 14, fontWeight: '600', color: '#fff' },
    promoHint: { fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 8, fontStyle: 'italic' },
    priceCard: { backgroundColor: '#1a1a2e', borderRadius: 16, padding: 20, borderWidth: 1, borderColor: 'rgba(139, 92, 246, 0.2)' },
    priceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    priceLabel: { fontSize: 14, color: 'rgba(255,255,255,0.7)' },
    priceValue: { fontSize: 14, color: '#fff', fontWeight: '600' },
    discountLabel: { color: '#10b981' },
    discountValue: { color: '#10b981' },
    divider: { height: 1, backgroundColor: 'rgba(139, 92, 246, 0.2)', marginVertical: 8 },
    totalLabel: { fontSize: 16, fontWeight: 'bold', color: '#fff' },
    totalValue: { fontSize: 20, fontWeight: 'bold', color: '#8b5cf6' },
    termsContainer: { paddingHorizontal: 20, marginTop: 24 },
    termsText: { fontSize: 12, color: 'rgba(255,255,255,0.5)', textAlign: 'center', lineHeight: 18 },
    termsLink: { color: '#a78bfa', fontWeight: '600' },
    bottomSpacing: { height: 140 },
    bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#1a1a2e', padding: 20, borderTopWidth: 1, borderTopColor: 'rgba(139, 92, 246, 0.2)', shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 10 },
    totalInfo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    bottomLabel: { fontSize: 14, color: 'rgba(255,255,255,0.6)' },
    bottomTotal: { fontSize: 24, fontWeight: 'bold', color: '#8b5cf6' },
    payButton: { backgroundColor: '#8b5cf6', paddingVertical: 16, borderRadius: 12, alignItems: 'center', shadowColor: '#8b5cf6', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 },
    payButtonDisabled: { backgroundColor: '#6b7280', shadowOpacity: 0 },
    payButtonText: { fontSize: 16, fontWeight: 'bold', color: '#fff' },
    processingContainer: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    backButtonError: { backgroundColor: '#8b5cf6', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 },
    backButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});