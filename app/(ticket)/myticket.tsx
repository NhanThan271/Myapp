import { Image } from 'expo-image';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

// Types
interface Ticket {
    id: string;
    movieTitle: string;
    poster: string;
    cinema: string;
    date: string;
    time: string;
    seats: string[];
    screen: string;
    bookingCode: string;
    status: 'upcoming' | 'past' | 'cancelled';
    totalPrice: number;
    type: '2D' | '3D';
}

// Mock data
const mockTickets: Ticket[] = [
    {
        id: '1',
        movieTitle: 'Avatar: The Way of Water',
        poster: 'https://image.tmdb.org/t/p/w500/t6HIqrRAclMCA60NsSmeqe9RmNV.jpg',
        cinema: 'CGV Vincom Center',
        date: '20/12/2024',
        time: '19:00',
        seats: ['G7', 'G8'],
        screen: 'Rạp 3',
        bookingCode: 'CGV123456',
        status: 'upcoming',
        totalPrice: 240000,
        type: '3D',
    },
    {
        id: '2',
        movieTitle: 'Spider-Man: No Way Home',
        poster: 'https://image.tmdb.org/t/p/w500/1g0dhYtq4irTY1GPXvft6k4YLjm.jpg',
        cinema: 'Lotte Cinema Q7',
        date: '15/12/2024',
        time: '21:30',
        seats: ['F5', 'F6', 'F7'],
        screen: 'Rạp 2',
        bookingCode: 'LTE789012',
        status: 'upcoming',
        totalPrice: 255000,
        type: '2D',
    },
    {
        id: '3',
        movieTitle: 'The Batman',
        poster: 'https://image.tmdb.org/t/p/w500/74xTEgt7R36Fpooo50r9T25onhq.jpg',
        cinema: 'CGV Aeon Mall',
        date: '10/12/2024',
        time: '14:00',
        seats: ['H8', 'H9'],
        screen: 'Rạp 1',
        bookingCode: 'CGV345678',
        status: 'past',
        totalPrice: 170000,
        type: '2D',
    },
    {
        id: '4',
        movieTitle: 'Top Gun: Maverick',
        poster: 'https://image.tmdb.org/t/p/w500/62HCnUTziyWcpDaBO2i1DX17ljH.jpg',
        cinema: 'CGV Vincom Center',
        date: '05/12/2024',
        time: '16:30',
        seats: ['E5'],
        screen: 'Rạp 4',
        bookingCode: 'CGV901234',
        status: 'past',
        totalPrice: 85000,
        type: '2D',
    },
    {
        id: '5',
        movieTitle: 'Doctor Strange 2',
        poster: 'https://image.tmdb.org/t/p/w500/9Gtg2DzBhmYamXBS1hKAhiwbBKS.jpg',
        cinema: 'Lotte Cinema Q1',
        date: '28/11/2024',
        time: '19:00',
        seats: ['G10', 'G11'],
        screen: 'Rạp 5',
        bookingCode: 'LTE567890',
        status: 'cancelled',
        totalPrice: 240000,
        type: '3D',
    },
];

export default function MyTicketsScreen() {
    const [activeTab, setActiveTab] = useState<'upcoming' | 'past' | 'cancelled'>('upcoming');

    const filteredTickets = mockTickets.filter(ticket => ticket.status === activeTab);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'upcoming':
                return '#10b981';
            case 'past':
                return '#6b7280';
            case 'cancelled':
                return '#ef4444';
            default:
                return '#6b7280';
        }
    };

    const getStatusText = (status: string) => {
        switch (status) {
            case 'upcoming':
                return 'Sắp chiếu';
            case 'past':
                return 'Đã xem';
            case 'cancelled':
                return 'Đã hủy';
            default:
                return '';
        }
    };

    const renderTicketCard = (ticket: Ticket) => (
        <TouchableOpacity key={ticket.id} style={styles.ticketCard} activeOpacity={0.7}>
            <View style={styles.ticketContent}>
                {/* Left side - Movie poster */}
                <Image
                    source={{ uri: ticket.poster }}
                    style={styles.poster}
                    contentFit="cover"
                />

                {/* Right side - Ticket details */}
                <View style={styles.ticketDetails}>
                    <View style={styles.ticketHeader}>
                        <Text style={styles.movieTitle} numberOfLines={2}>
                            {ticket.movieTitle}
                        </Text>
                        <View
                            style={[
                                styles.statusBadge,
                                { backgroundColor: getStatusColor(ticket.status) + '20' },
                            ]}
                        >
                            <Text
                                style={[
                                    styles.statusText,
                                    { color: getStatusColor(ticket.status) },
                                ]}
                            >
                                {getStatusText(ticket.status)}
                            </Text>
                        </View>
                    </View>

                    <View style={styles.infoRow}>
                        <Text style={styles.infoIcon}>🎬</Text>
                        <Text style={styles.infoText}>{ticket.cinema}</Text>
                    </View>

                    <View style={styles.infoRow}>
                        <Text style={styles.infoIcon}>📅</Text>
                        <Text style={styles.infoText}>
                            {ticket.date} • {ticket.time}
                        </Text>
                    </View>

                    <View style={styles.infoRow}>
                        <Text style={styles.infoIcon}>🎭</Text>
                        <Text style={styles.infoText}>
                            {ticket.screen} • {ticket.type}
                        </Text>
                    </View>

                    <View style={styles.infoRow}>
                        <Text style={styles.infoIcon}>💺</Text>
                        <Text style={styles.infoText}>
                            Ghế: {ticket.seats.join(', ')}
                        </Text>
                    </View>

                    <View style={styles.ticketFooter}>
                        <View>
                            <Text style={styles.priceLabel}>Tổng tiền</Text>
                            <Text style={styles.priceValue}>
                                {ticket.totalPrice.toLocaleString('vi-VN')}đ
                            </Text>
                        </View>
                        <View style={styles.bookingCodeContainer}>
                            <Text style={styles.bookingCodeLabel}>Mã đặt vé</Text>
                            <Text style={styles.bookingCode}>{ticket.bookingCode}</Text>
                        </View>
                    </View>
                </View>
            </View>

            {/* Dotted line separator */}
            <View style={styles.separator}>
                <View style={styles.circleLeft} />
                <View style={styles.dottedLine} />
                <View style={styles.circleRight} />
            </View>

            {/* Action buttons */}
            <View style={styles.actionButtons}>
                {ticket.status === 'upcoming' ? (
                    <>
                        <TouchableOpacity style={styles.actionButton}>
                            <Text style={styles.actionButtonText}>Chi tiết vé</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.actionButton, styles.cancelButton]}>
                            <Text style={[styles.actionButtonText, styles.cancelButtonText]}>
                                Hủy vé
                            </Text>
                        </TouchableOpacity>
                    </>
                ) : ticket.status === 'past' ? (
                    <>
                        <TouchableOpacity style={styles.actionButton}>
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
            <TouchableOpacity style={styles.browseButton}>
                <Text style={styles.browseButtonText}>Khám phá phim</Text>
            </TouchableOpacity>
        </View>
    );

    return (
        <View style={styles.container}>
            {/* Header */}
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
                        {mockTickets.filter(t => t.status === 'upcoming').length} vé sắp chiếu
                    </Text>
                </View>
            </View>

            {/* Tabs */}
            <View style={styles.tabs}>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'upcoming' && styles.tabActive]}
                    onPress={() => setActiveTab('upcoming')}
                >
                    <Text style={[styles.tabText, activeTab === 'upcoming' && styles.tabTextActive]}>
                        Sắp chiếu
                    </Text>
                    {mockTickets.filter(t => t.status === 'upcoming').length > 0 && (
                        <View style={styles.badge}>
                            <Text style={styles.badgeText}>
                                {mockTickets.filter(t => t.status === 'upcoming').length}
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

            {/* Content */}
            <ScrollView
                style={styles.content}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
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
    tabs: {
        flexDirection: 'row',
        backgroundColor: '#1a1a2e',
        paddingHorizontal: 20,
        paddingBottom: 16,
        gap: 12,
    },
    tab: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 8,
        backgroundColor: '#0f0f23',
        gap: 8,
    },
    tabActive: {
        backgroundColor: 'rgba(139, 92, 246, 0.2)',
    },
    tabText: {
        fontSize: 14,
        fontWeight: '600',
        color: 'rgba(255,255,255,0.5)',
    },
    tabTextActive: {
        color: '#a78bfa',
    },
    badge: {
        backgroundColor: '#8b5cf6',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 10,
        minWidth: 20,
        alignItems: 'center',
    },
    badgeText: {
        fontSize: 11,
        fontWeight: 'bold',
        color: '#fff',
    },
    content: {
        flex: 1,
    },
    scrollContent: {
        padding: 20,
    },
    ticketCard: {
        backgroundColor: '#1a1a2e',
        borderRadius: 16,
        marginBottom: 16,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(139, 92, 246, 0.2)',
    },
    ticketContent: {
        flexDirection: 'row',
        padding: 16,
    },
    poster: {
        width: 100,
        height: 150,
        borderRadius: 12,
        backgroundColor: '#2a2a3e',
    },
    ticketDetails: {
        flex: 1,
        marginLeft: 16,
    },
    ticketHeader: {
        marginBottom: 12,
    },
    movieTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 8,
    },
    statusBadge: {
        alignSelf: 'flex-start',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 6,
    },
    statusText: {
        fontSize: 11,
        fontWeight: '600',
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    infoIcon: {
        fontSize: 14,
        marginRight: 8,
        width: 20,
    },
    infoText: {
        fontSize: 13,
        color: 'rgba(255,255,255,0.7)',
        flex: 1,
    },
    ticketFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: 'rgba(139, 92, 246, 0.2)',
    },
    priceLabel: {
        fontSize: 11,
        color: 'rgba(255,255,255,0.5)',
        marginBottom: 2,
    },
    priceValue: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#8b5cf6',
    },
    bookingCodeContainer: {
        alignItems: 'flex-end',
    },
    bookingCodeLabel: {
        fontSize: 10,
        color: 'rgba(255,255,255,0.5)',
        marginBottom: 2,
    },
    bookingCode: {
        fontSize: 12,
        fontWeight: '600',
        color: '#a78bfa',
        fontFamily: 'monospace',
    },
    separator: {
        height: 1,
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: 16,
    },
    circleLeft: {
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: '#0f0f23',
        marginLeft: -26,
    },
    dottedLine: {
        flex: 1,
        height: 1,
        borderStyle: 'dashed',
        borderWidth: 1,
        borderColor: 'rgba(139, 92, 246, 0.3)',
    },
    circleRight: {
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: '#0f0f23',
        marginRight: -26,
    },
    actionButtons: {
        flexDirection: 'row',
        padding: 16,
        gap: 12,
    },
    actionButton: {
        flex: 1,
        backgroundColor: '#8b5cf6',
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    actionButtonFull: {
        flex: 1,
        backgroundColor: '#8b5cf6',
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    actionButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#fff',
    },
    cancelButton: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: '#ef4444',
    },
    cancelButtonText: {
        color: '#ef4444',
    },
    reviewButton: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: '#8b5cf6',
    },
    reviewButtonText: {
        color: '#8b5cf6',
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
    },
    emptyIcon: {
        fontSize: 64,
        marginBottom: 16,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 8,
    },
    emptyText: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.5)',
        textAlign: 'center',
        marginBottom: 24,
    },
    browseButton: {
        backgroundColor: '#8b5cf6',
        paddingVertical: 12,
        paddingHorizontal: 32,
        borderRadius: 8,
    },
    browseButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#fff',
    },
    bottomSpacing: {
        height: 100,
    },
});