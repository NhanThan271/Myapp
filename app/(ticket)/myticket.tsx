import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { Image } from 'expo-image';
import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

// Types
interface Cinema {
    id: number;
    name: string;
    address: string;
}

interface Room {
    id: number;
    name: string;
    cinema: Cinema;
}

interface Movie {
    id: number;
    title: string;
    posterUrl: string;
    duration: number;
    rating: number;
}

interface Showtime {
    id: number;
    startTime: string;
    format: string;
    price: number;
    movie: Movie;
    room: Room;
}

interface Seat {
    id: number;
    rowSeat: string;
    number: number;
    type: 'NORMAL' | 'VIP';
}

interface Ticket {
    id: number;
    showtime: Showtime;
    seat: Seat;
    price: number;
    bookedAt: string;
    status: 'PENDING' | 'BOOKED' | 'CANCELLED' | 'USED';
    ticketCode?: string;
}

interface User {
    id: number;
    username: string;
    email: string;
    role: string;
}

const API_URL = 'https://backend-ltud2.onrender.com/api';
const TICKETS_STORAGE_KEY = 'user_tickets';

export default function MyTicketsScreen() {
    const [activeTab, setActiveTab] = useState<'upcoming' | 'past' | 'cancelled'>('upcoming');
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [authToken, setAuthToken] = useState<string | null>(null);
    const [currentUser, setCurrentUser] = useState<User | null>(null);

    useEffect(() => {
        loadAuthToken();
    }, []);

    useEffect(() => {
        if (authToken) {
            fetchUserInfo();
        }
    }, [authToken]);

    // Load tickets when screen is focused
    useFocusEffect(
        useCallback(() => {
            if (authToken && currentUser) {
                console.log('🔄 Screen focused - reloading tickets');
                fetchTickets();
            }
        }, [authToken, currentUser])
    );

    const loadAuthToken = async () => {
        try {
            const token = await AsyncStorage.getItem('authToken');
            console.log(' Token loaded');

            if (!token) {
                Alert.alert('Lỗi', 'Vui lòng đăng nhập để xem vé', [
                    { text: 'Đăng nhập', onPress: () => router.push('/(auth)/login') }
                ]);
                return;
            }
            setAuthToken(token);
        } catch (error) {
            console.error('❌ Error loading token:', error);
        }
    };

    const fetchUserInfo = async () => {
        try {
            console.log('🔍 Loading user info...');

            if (!authToken) {
                throw new Error('No auth token');
            }

            const storedUserId = await AsyncStorage.getItem('userId');
            const storedUsername = await AsyncStorage.getItem('username');
            const storedEmail = await AsyncStorage.getItem('email');
            const storedRoles = await AsyncStorage.getItem('roles');

            if (!storedUserId) {
                throw new Error('No userId in storage');
            }

            const parsedUserId = parseInt(storedUserId, 10);

            if (isNaN(parsedUserId)) {
                throw new Error('Invalid userId format');
            }

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

    const fetchTickets = async () => {
        try {
            setIsLoading(true);
            console.log('🎫 Fetching tickets for user:', currentUser?.id);

            if (!currentUser?.id) {
                throw new Error('User ID not found');
            }

            // Thử lấy từ API trước
            try {
                const response = await axios.get(
                    `${API_URL}/customer/tickets/user/${currentUser.id}`,
                    {
                        headers: { 'Authorization': `Bearer ${authToken}` },
                        timeout: 10000
                    }
                );
                console.log('📊 Raw API Response:', JSON.stringify(response.data, null, 2));
                if (response.data && Array.isArray(response.data)) {
                    console.log(' Tickets loaded from API:', response.data.length);

                    response.data.forEach((ticket, index) => {
                        console.log(`Ticket ${index}:`, {
                            id: ticket.id,
                            status: ticket.status,
                            bookedAt: ticket.bookedAt,
                            showtimeStartTime: ticket.showtime?.startTime,
                            movieTitle: ticket.showtime?.movie?.title
                        });
                    });

                    setTickets(response.data);

                    // Lưu vào AsyncStorage để backup
                    await AsyncStorage.setItem(
                        `${TICKETS_STORAGE_KEY}_${currentUser.id}`,
                        JSON.stringify(response.data)
                    );
                    return;
                }
            } catch (apiError: any) {
                console.error('⚠️ API Error:', {
                    status: apiError.response?.status,
                    message: apiError.response?.data?.message || apiError.message,
                    data: apiError.response?.data
                });

                // Nếu API fail, lấy từ AsyncStorage
                const storedTickets = await AsyncStorage.getItem(
                    `${TICKETS_STORAGE_KEY}_${currentUser.id}`
                );

                if (storedTickets) {
                    const parsedTickets = JSON.parse(storedTickets);
                    console.log(' Tickets loaded from storage:', parsedTickets.length);
                    setTickets(parsedTickets);
                } else {
                    console.log('ℹ️ No tickets found');
                    setTickets([]);
                }
            }

        } catch (error: any) {
            console.error('❌ Error fetching tickets:', error.message);
            setTickets([]);
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    };

    const onRefresh = async () => {
        setIsRefreshing(true);
        await fetchTickets();
    };

    // Group tickets by showtime
    const groupTicketsByShowtime = (tickets: Ticket[]) => {
        const grouped = new Map<number, Ticket[]>();

        tickets.forEach(ticket => {
            const showtimeId = ticket.showtime.id;
            if (!grouped.has(showtimeId)) {
                grouped.set(showtimeId, []);
            }
            grouped.get(showtimeId)!.push(ticket);
        });

        return Array.from(grouped.values());
    };

    // Filter tickets based on active tab and showtime date
    const getFilteredTickets = () => {
        const now = new Date();

        return tickets.filter(ticket => {
            const showtimeDate = new Date(ticket.showtime.startTime);

            if (activeTab === 'upcoming') {
                return (ticket.status === 'BOOKED' || ticket.status === 'PENDING') && showtimeDate > now;
            } else if (activeTab === 'past') {
                return (ticket.status === 'USED' ||
                    ((ticket.status === 'BOOKED' || ticket.status === 'PENDING') && showtimeDate <= now));
            } else {
                return ticket.status === 'CANCELLED';
            }
        });
    };

    const filteredTickets = groupTicketsByShowtime(getFilteredTickets());

    const formatDateTime = (dateTimeString: string) => {
        const date = new Date(dateTimeString);
        const dateStr = date.toLocaleDateString('vi-VN');
        const timeStr = date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
        return { date: dateStr, time: timeStr };
    };

    const getStatusColor = (status: string, showtimeDate: Date) => {
        const now = new Date();

        if (status === 'CANCELLED') {
            return '#ef4444';
        } else if (status === 'USED' || showtimeDate <= now) {
            return '#6b7280';
        } else if (status === 'PENDING' || status === 'BOOKED') {
            return '#10b981';
        }
        return '#10b981';
    };

    const getStatusText = (status: string, showtimeDate: Date) => {
        const now = new Date();

        if (status === 'CANCELLED') {
            return 'Đã hủy';
        } else if (status === 'USED' || showtimeDate <= now) {
            return 'Đã xem';
        } else if (status === 'PENDING') {
            return 'Chờ xác nhận';
        } else {
            return 'Sắp chiếu';
        }
    };

    const handleCancelTicket = async (groupedTickets: Ticket[]) => {
        Alert.alert(
            'Xác nhận hủy vé',
            `Bạn có chắc chắn muốn hủy ${groupedTickets.length} vé này?`,
            [
                { text: 'Không', style: 'cancel' },
                {
                    text: 'Hủy vé',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            // Update status in local storage
                            const updatedTickets = tickets.map(ticket => {
                                if (groupedTickets.some(t => t.id === ticket.id)) {
                                    return { ...ticket, status: 'CANCELLED' as const };
                                }
                                return ticket;
                            });

                            setTickets(updatedTickets);

                            // Save to AsyncStorage
                            if (currentUser?.id) {
                                await AsyncStorage.setItem(
                                    `${TICKETS_STORAGE_KEY}_${currentUser.id}`,
                                    JSON.stringify(updatedTickets)
                                );
                            }

                            Alert.alert('Thành công', 'Đã hủy vé');
                        } catch (error) {
                            Alert.alert('Lỗi', 'Không thể hủy vé');
                        }
                    }
                }
            ]
        );
    };

    const renderTicketCard = (groupedTickets: Ticket[]) => {
        const firstTicket = groupedTickets[0];
        const { showtime, seat } = firstTicket;
        const { movie, room } = showtime;
        const { date, time } = formatDateTime(showtime.startTime);

        const totalPrice = groupedTickets.reduce((sum, t) => sum + t.price, 0);
        const seats = groupedTickets.map(t => `${t.seat.rowSeat}${t.seat.number}`);
        const showtimeDate = new Date(showtime.startTime);
        const status = firstTicket.status;
        const statusColor = getStatusColor(status, showtimeDate);
        const statusText = getStatusText(status, showtimeDate);

        // Generate booking code from first ticket ID
        const bookingCode = `TKT${firstTicket.id.toString().padStart(6, '0')}`;

        return (
            <TouchableOpacity
                key={`${firstTicket.showtime.id}-${firstTicket.id}`}
                style={styles.ticketCard}
                activeOpacity={0.7}
            >
                <View style={styles.ticketContent}>
                    <Image
                        source={{ uri: movie.posterUrl }}
                        style={styles.poster}
                        contentFit="cover"
                    />

                    <View style={styles.ticketDetails}>
                        <View style={styles.ticketHeader}>
                            <Text style={styles.movieTitle} numberOfLines={2}>
                                {movie.title}
                            </Text>
                            <View
                                style={[
                                    styles.statusBadge,
                                    { backgroundColor: statusColor + '20' },
                                ]}
                            >
                                <Text
                                    style={[
                                        styles.statusText,
                                        { color: statusColor },
                                    ]}
                                >
                                    {statusText}
                                </Text>
                            </View>
                        </View>

                        <View style={styles.infoRow}>
                            <Text style={styles.infoIcon}>🎬</Text>
                            <Text style={styles.infoText}>{room.cinema.name}</Text>
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
                                {room.name} • {showtime.format}
                            </Text>
                        </View>

                        <View style={styles.infoRow}>
                            <Text style={styles.infoIcon}>💺</Text>
                            <Text style={styles.infoText}>
                                Ghế: {seats.join(', ')}
                            </Text>
                        </View>

                        <View style={styles.ticketFooter}>
                            <View>
                                <Text style={styles.priceLabel}>Tổng tiền</Text>
                                <Text style={styles.priceValue}>
                                    {totalPrice.toLocaleString('vi-VN')}đ
                                </Text>
                            </View>
                            <View style={styles.bookingCodeContainer}>
                                <Text style={styles.bookingCodeLabel}>Mã đặt vé</Text>
                                <Text style={styles.bookingCode}>{bookingCode}</Text>
                            </View>
                        </View>
                    </View>
                </View>

                <View style={styles.separator}>
                    <View style={styles.circleLeft} />
                    <View style={styles.dottedLine} />
                    <View style={styles.circleRight} />
                </View>

                <View style={styles.actionButtons}>
                    {(status === 'BOOKED' || status === 'PENDING') && showtimeDate > new Date() ? (
                        <>
                            <TouchableOpacity style={styles.actionButton}>
                                <Text style={styles.actionButtonText}>Chi tiết vé</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.actionButton, styles.cancelButton]}
                                onPress={() => handleCancelTicket(groupedTickets)}
                            >
                                <Text style={[styles.actionButtonText, styles.cancelButtonText]}>
                                    Hủy vé
                                </Text>
                            </TouchableOpacity>
                        </>
                    ) : status === 'USED' || ((status === 'BOOKED' || status === 'PENDING') && showtimeDate <= new Date()) ? (
                        <>
                            <TouchableOpacity
                                style={styles.actionButton}
                                onPress={() => router.push('/(tabs)')}
                            >
                                <Text style={styles.actionButtonText}>Đặt lại</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.actionButton, styles.reviewButton]}>
                                <Text style={[styles.actionButtonText, styles.reviewButtonText]}>
                                    Đánh giá
                                </Text>
                            </TouchableOpacity>
                        </>
                    ) : (
                        <TouchableOpacity style={styles.actionButtonFull}>
                            <Text style={styles.actionButtonText}>Xem chi tiết</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </TouchableOpacity>
        );
    };

    const renderEmptyState = () => (
        <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🎫</Text>
            <Text style={styles.emptyTitle}>Chưa có vé nào</Text>
            <Text style={styles.emptyText}>
                {activeTab === 'upcoming'
                    ? 'Bạn chưa có vé nào sắp chiếu'
                    : activeTab === 'past'
                        ? 'Bạn chưa xem phim nào'
                        : 'Bạn chưa có vé nào bị hủy'}
            </Text>
            <TouchableOpacity
                style={styles.browseButton}
                onPress={() => router.push('/(tabs)')}
            >
                <Text style={styles.browseButtonText}>Khám phá phim</Text>
            </TouchableOpacity>
        </View>
    );

    const renderLoadingState = () => (
        <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#8b5cf6" />
            <Text style={styles.loadingText}>Đang tải vé...</Text>
        </View>
    );

    // Count tickets by status
    const upcomingCount = tickets.filter(t => {
        const showtimeDate = new Date(t.showtime.startTime);
        return (t.status === 'BOOKED' || t.status === 'PENDING') && showtimeDate > new Date();
    }).length;

    if (isLoading) {
        return (
            <View style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => router.back()}
                    >
                        <Text style={styles.backIcon}>←</Text>
                    </TouchableOpacity>
                    <View style={styles.headerContent}>
                        <Text style={styles.headerTitle}>Vé của tôi</Text>
                    </View>
                </View>
                {renderLoadingState()}
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => router.back()}
                >
                    <Text style={styles.backIcon}>←</Text>
                </TouchableOpacity>
                <View style={styles.headerContent}>
                    <Text style={styles.headerTitle}>Vé của tôi</Text>
                    <Text style={styles.headerSubtitle}>
                        {upcomingCount} vé sắp chiếu
                    </Text>
                </View>
            </View>

            <View style={styles.tabs}>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'upcoming' && styles.tabActive]}
                    onPress={() => setActiveTab('upcoming')}
                >
                    <Text style={[styles.tabText, activeTab === 'upcoming' && styles.tabTextActive]}>
                        Sắp chiếu
                    </Text>
                    {upcomingCount > 0 && (
                        <View style={styles.badge}>
                            <Text style={styles.badgeText}>
                                {upcomingCount}
                            </Text>
                        </View>
                    )}
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.tab, activeTab === 'past' && styles.tabActive]}
                    onPress={() => setActiveTab('past')}
                >
                    <Text style={[styles.tabText, activeTab === 'past' && styles.tabTextActive]}>
                        Đã xem
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.tab, activeTab === 'cancelled' && styles.tabActive]}
                    onPress={() => setActiveTab('cancelled')}
                >
                    <Text style={[styles.tabText, activeTab === 'cancelled' && styles.tabTextActive]}>
                        Đã hủy
                    </Text>
                </TouchableOpacity>
            </View>

            <ScrollView
                style={styles.content}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
                refreshControl={
                    <RefreshControl
                        refreshing={isRefreshing}
                        onRefresh={onRefresh}
                        tintColor="#8b5cf6"
                        colors={['#8b5cf6']}
                    />
                }
            >
                {filteredTickets.length > 0
                    ? filteredTickets.map(renderTicketCard)
                    : renderEmptyState()}

                <View style={styles.bottomSpacing} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0f0f23' },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 60 },
    loadingText: { marginTop: 16, fontSize: 14, color: 'rgba(255,255,255,0.6)' },
    header: { paddingTop: 60, paddingHorizontal: 20, paddingBottom: 20, backgroundColor: '#1a1a2e', borderBottomWidth: 1, borderBottomColor: 'rgba(139, 92, 246, 0.2)', flexDirection: 'row', alignItems: 'center' },
    backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(139, 92, 246, 0.2)', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    backIcon: { fontSize: 24, color: '#a78bfa', fontWeight: 'bold' },
    headerContent: { flex: 1 },
    headerTitle: { fontSize: 28, fontWeight: 'bold', color: '#fff', marginBottom: 4 },
    headerSubtitle: { fontSize: 14, color: 'rgba(255,255,255,0.6)' },
    tabs: { flexDirection: 'row', backgroundColor: '#1a1a2e', paddingHorizontal: 20, paddingBottom: 16, gap: 12 },
    tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8, backgroundColor: '#0f0f23', gap: 8 },
    tabActive: { backgroundColor: 'rgba(139, 92, 246, 0.2)' },
    tabText: { fontSize: 14, fontWeight: '600', color: 'rgba(255,255,255,0.5)' },
    tabTextActive: { color: '#a78bfa' },
    badge: { backgroundColor: '#8b5cf6', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10, minWidth: 20, alignItems: 'center' },
    badgeText: { fontSize: 11, fontWeight: 'bold', color: '#fff' },
    content: { flex: 1 },
    scrollContent: { padding: 20 },
    ticketCard: { backgroundColor: '#1a1a2e', borderRadius: 16, marginBottom: 16, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(139, 92, 246, 0.2)' },
    ticketContent: { flexDirection: 'row', padding: 16 },
    poster: { width: 100, height: 150, borderRadius: 12, backgroundColor: '#2a2a3e' },
    ticketDetails: { flex: 1, marginLeft: 16 },
    ticketHeader: { marginBottom: 12 },
    movieTitle: { fontSize: 18, fontWeight: 'bold', color: '#fff', marginBottom: 8 },
    statusBadge: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
    statusText: { fontSize: 11, fontWeight: '600' },
    infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
    infoIcon: { fontSize: 14, marginRight: 8, width: 20 },
    infoText: { fontSize: 13, color: 'rgba(255,255,255,0.7)', flex: 1 },
    ticketFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: 'rgba(139, 92, 246, 0.2)' },
    priceLabel: { fontSize: 11, color: 'rgba(255,255,255,0.5)', marginBottom: 2 },
    priceValue: { fontSize: 18, fontWeight: 'bold', color: '#8b5cf6' },
    bookingCodeContainer: { alignItems: 'flex-end' },
    bookingCodeLabel: { fontSize: 10, color: 'rgba(255,255,255,0.5)', marginBottom: 2 },
    bookingCode: { fontSize: 12, fontWeight: '600', color: '#a78bfa', fontFamily: 'monospace' },
    separator: { height: 1, flexDirection: 'row', alignItems: 'center', marginHorizontal: 16 },
    circleLeft: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#0f0f23', marginLeft: -26 },
    dottedLine: { flex: 1, height: 1, borderStyle: 'dashed', borderWidth: 1, borderColor: 'rgba(139, 92, 246, 0.3)' },
    circleRight: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#0f0f23', marginRight: -26 },
    actionButtons: { flexDirection: 'row', padding: 16, gap: 12 },
    actionButton: { flex: 1, backgroundColor: '#8b5cf6', paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
    actionButtonFull: { flex: 1, backgroundColor: '#8b5cf6', paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
    actionButtonText: { fontSize: 14, fontWeight: '600', color: '#fff' },
    cancelButton: { backgroundColor: 'transparent', borderWidth: 1, borderColor: '#ef4444' },
    cancelButtonText: { color: '#ef4444' },
    reviewButton: { backgroundColor: 'transparent', borderWidth: 1, borderColor: '#8b5cf6' },
    reviewButtonText: { color: '#8b5cf6' },
    emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
    emptyIcon: { fontSize: 64, marginBottom: 16 },
    emptyTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff', marginBottom: 8 },
    emptyText: { fontSize: 14, color: 'rgba(255,255,255,0.5)', textAlign: 'center', marginBottom: 24 },
    browseButton: { backgroundColor: '#8b5cf6', paddingVertical: 12, paddingHorizontal: 32, borderRadius: 8 },
    browseButtonText: { fontSize: 14, fontWeight: '600', color: '#fff' },
    bottomSpacing: { height: 100 },
});