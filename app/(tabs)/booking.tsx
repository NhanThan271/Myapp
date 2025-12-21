import { useFocusEffect } from '@react-navigation/native';
import { router } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { Dimensions, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const { width } = Dimensions.get('window');

// Types
interface Movie {
    title: string;
    poster: string;
    duration: string;
    genre: string;
    rating: number;
}

interface Cinema {
    id: number;
    name: string;
    address: string;
}

interface Showtime {
    id: number;
    time: string;
    type: string;
    price: number;
}

interface Seat {
    id: string;
    row: string;
    number: number;
    isBooked: boolean;
    isVIP: boolean;
}

interface FoodItem {
    id: number;
    name: string;
    price: number;
    image: string;
    category: 'combo' | 'snack' | 'drink';
}

// Mock data
const movie: Movie = {
    title: 'Avatar: The Way of Water',
    poster: 'https://image.tmdb.org/t/p/w500/t6HIqrRAclMCA60NsSmeqe9RmNV.jpg',
    duration: '192 phút',
    genre: 'Action, Sci-Fi',
    rating: 8.5,
};

const cinemas: Cinema[] = [
    { id: 1, name: 'CGV Vincom', address: 'Vincom Center, Q1' },
    { id: 2, name: 'CGV Aeon Mall', address: 'Aeon Mall Tân Phú' },
    { id: 3, name: 'Lotte Cinema', address: 'Lotte Mart, Q7' },
];

const showtimes: Showtime[] = [
    { id: 1, time: '09:00', type: '2D', price: 85000 },
    { id: 2, time: '11:30', type: '2D', price: 85000 },
    { id: 3, time: '14:00', type: '3D', price: 120000 },
    { id: 4, time: '16:30', type: '2D', price: 85000 },
    { id: 5, time: '19:00', type: '3D', price: 120000 },
    { id: 6, time: '21:30', type: '2D', price: 85000 },
];

const foodItems: FoodItem[] = [
    { id: 1, name: 'Combo 1 (Bỏng + Nước)', price: 89000, image: '🍿', category: 'combo' },
    { id: 2, name: 'Combo 2 (Bỏng + 2 Nước)', price: 129000, image: '🍿', category: 'combo' },
    { id: 3, name: 'Combo Family', price: 199000, image: '🍿', category: 'combo' },
    { id: 4, name: 'Bỏng ngô lớn', price: 60000, image: '🍿', category: 'snack' },
    { id: 5, name: 'Bỏng ngô vừa', price: 45000, image: '🍿', category: 'snack' },
    { id: 6, name: 'Hotdog', price: 35000, image: '🌭', category: 'snack' },
    { id: 7, name: 'Nachos', price: 45000, image: '🧀', category: 'snack' },
    { id: 8, name: 'Coca Cola', price: 30000, image: '🥤', category: 'drink' },
    { id: 9, name: 'Pepsi', price: 30000, image: '🥤', category: 'drink' },
    { id: 10, name: 'Nước suối', price: 15000, image: '💧', category: 'drink' },
];

const generateSeats = (): Seat[] => {
    const rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
    const seats: Seat[] = [];

    rows.forEach(row => {
        for (let i = 1; i <= 10; i++) {
            const seatNumber = `${row}${i}`;
            const isBooked = Math.random() > 0.7;
            seats.push({
                id: seatNumber,
                row,
                number: i,
                isBooked,
                isVIP: row === 'G' || row === 'H',
            });
        }
    });

    return seats;
};

export default function BookingScreen() {
    const [step, setStep] = useState<number>(1);
    const [selectedCinema, setSelectedCinema] = useState<Cinema | null>(null);
    const [selectedShowtime, setSelectedShowtime] = useState<Showtime | null>(null);
    const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
    const [seats, setSeats] = useState<Seat[]>(generateSeats());
    const [foodCart, setFoodCart] = useState<{ [key: number]: number }>({});
    const [selectedCategory, setSelectedCategory] = useState<'combo' | 'snack' | 'drink'>('combo');

    // Reset tất cả state khi tab được focus
    useFocusEffect(
        useCallback(() => {
            setStep(1);
            setSelectedCinema(null);
            setSelectedShowtime(null);
            setSelectedSeats([]);
            setSeats(generateSeats());
            setFoodCart({});
            setSelectedCategory('combo');
        }, [])
    );

    const toggleSeat = (seatId: string) => {
        if (selectedSeats.includes(seatId)) {
            setSelectedSeats(selectedSeats.filter(id => id !== seatId));
        } else {
            setSelectedSeats([...selectedSeats, seatId]);
        }
    };

    const updateFoodQuantity = (itemId: number, change: number) => {
        setFoodCart(prev => {
            const currentQty = prev[itemId] || 0;
            const newQty = Math.max(0, currentQty + change);
            if (newQty === 0) {
                const { [itemId]: _, ...rest } = prev;
                return rest;
            }
            return { ...prev, [itemId]: newQty };
        });
    };

    const calculateTicketTotal = (): number => {
        const showtimePrice = selectedShowtime?.price || 0;
        const vipSeats = selectedSeats.filter(seatId => {
            const seat = seats.find(s => s.id === seatId);
            return seat?.isVIP;
        }).length;
        const normalSeats = selectedSeats.length - vipSeats;

        return (normalSeats * showtimePrice) + (vipSeats * (showtimePrice + 20000));
    };

    const calculateFoodTotal = (): number => {
        return Object.entries(foodCart).reduce((total, [itemId, quantity]) => {
            const item = foodItems.find(f => f.id === parseInt(itemId));
            return total + (item ? item.price * quantity : 0);
        }, 0);
    };

    const calculateGrandTotal = (): number => {
        return calculateTicketTotal() + calculateFoodTotal();
    };

    const renderStepIndicator = () => (
        <View style={styles.stepIndicator}>
            {[1, 2, 3, 4].map(num => (
                <View key={num} style={styles.stepItem}>
                    <View style={[styles.stepCircle, step >= num && styles.stepCircleActive]}>
                        <Text style={[styles.stepNumber, step >= num && styles.stepNumberActive]}>
                            {num}
                        </Text>
                    </View>
                    <Text style={styles.stepLabel}>
                        {num === 1 ? 'Rạp' : num === 2 ? 'Suất' : num === 3 ? 'Ghế' : 'Đồ ăn'}
                    </Text>
                    {num < 4 && <View style={[styles.stepLine, step > num && styles.stepLineActive]} />}
                </View>
            ))}
        </View>
    );

    const renderCinemaSelection = () => (
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>Chọn rạp chiếu</Text>
            <Text style={styles.dateText}>📅 Thứ 6, 15/12/2025</Text>

            {cinemas.map(cinema => (
                <TouchableOpacity
                    key={cinema.id}
                    style={[
                        styles.cinemaCard,
                        selectedCinema?.id === cinema.id && styles.cinemaCardSelected
                    ]}
                    onPress={() => setSelectedCinema(cinema)}
                >
                    <View style={styles.cinemaIcon}>
                        <Text style={styles.cinemaEmoji}>🎬</Text>
                    </View>
                    <View style={styles.cinemaInfo}>
                        <Text style={styles.cinemaName}>{cinema.name}</Text>
                        <Text style={styles.cinemaAddress}>{cinema.address}</Text>
                    </View>
                    <View style={styles.checkmark}>
                        {selectedCinema?.id === cinema.id && <Text style={styles.checkmarkText}>✓</Text>}
                    </View>
                </TouchableOpacity>
            ))}

            <TouchableOpacity
                style={[styles.nextButton, !selectedCinema && styles.nextButtonDisabled]}
                disabled={!selectedCinema}
                onPress={() => setStep(2)}
            >
                <Text style={styles.nextButtonText}>Tiếp tục</Text>
            </TouchableOpacity>
        </View>
    );

    const renderShowtimeSelection = () => (
        <View style={styles.section}>
            <TouchableOpacity style={styles.backButton} onPress={() => setStep(1)}>
                <Text style={styles.backButtonText}>← Quay lại</Text>
            </TouchableOpacity>

            <Text style={styles.sectionTitle}>Chọn suất chiếu</Text>
            <Text style={styles.selectedCinema}>🎬 {selectedCinema?.name}</Text>

            <View style={styles.showtimeGrid}>
                {showtimes.map(showtime => (
                    <TouchableOpacity
                        key={showtime.id}
                        style={[
                            styles.showtimeCard,
                            selectedShowtime?.id === showtime.id && styles.showtimeCardSelected
                        ]}
                        onPress={() => setSelectedShowtime(showtime)}
                    >
                        <Text style={[
                            styles.showtimeTime,
                            selectedShowtime?.id === showtime.id && styles.showtimeTimeSelected
                        ]}>
                            {showtime.time}
                        </Text>
                        <Text style={[
                            styles.showtimeType,
                            selectedShowtime?.id === showtime.id && styles.showtimeTypeSelected
                        ]}>
                            {showtime.type}
                        </Text>
                        <Text style={[
                            styles.showtimePrice,
                            selectedShowtime?.id === showtime.id && styles.showtimePriceSelected
                        ]}>
                            {showtime.price.toLocaleString('vi-VN')}đ
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            <TouchableOpacity
                style={[styles.nextButton, !selectedShowtime && styles.nextButtonDisabled]}
                disabled={!selectedShowtime}
                onPress={() => setStep(3)}
            >
                <Text style={styles.nextButtonText}>Tiếp tục</Text>
            </TouchableOpacity>
        </View>
    );

    const renderSeatSelection = () => (
        <View style={styles.section}>
            <TouchableOpacity style={styles.backButton} onPress={() => setStep(2)}>
                <Text style={styles.backButtonText}>← Quay lại</Text>
            </TouchableOpacity>

            <Text style={styles.sectionTitle}>Chọn ghế ngồi</Text>

            {/* Screen */}
            <View style={styles.screenContainer}>
                <View style={styles.screen}>
                    <Text style={styles.screenText}>Màn hình</Text>
                </View>
            </View>

            {/* Seats */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.seatsContainer}>
                    {['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'].map(row => (
                        <View key={row} style={styles.seatRow}>
                            <Text style={styles.rowLabel}>{row}</Text>
                            {seats.filter(seat => seat.row === row).map(seat => (
                                <TouchableOpacity
                                    key={seat.id}
                                    style={[
                                        styles.seat,
                                        seat.isBooked && styles.seatBooked,
                                        seat.isVIP && !seat.isBooked && styles.seatVIP,
                                        selectedSeats.includes(seat.id) && styles.seatSelected,
                                    ]}
                                    disabled={seat.isBooked}
                                    onPress={() => toggleSeat(seat.id)}
                                >
                                    <Text style={[
                                        styles.seatText,
                                        (seat.isBooked || selectedSeats.includes(seat.id)) && styles.seatTextLight
                                    ]}>
                                        {seat.number}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    ))}
                </View>
            </ScrollView>

            {/* Legend */}
            <View style={styles.legend}>
                <View style={styles.legendItem}>
                    <View style={[styles.legendBox, styles.seatAvailable]} />
                    <Text style={styles.legendText}>Trống</Text>
                </View>
                <View style={styles.legendItem}>
                    <View style={[styles.legendBox, styles.seatVIP]} />
                    <Text style={styles.legendText}>VIP</Text>
                </View>
                <View style={styles.legendItem}>
                    <View style={[styles.legendBox, styles.seatSelected]} />
                    <Text style={styles.legendText}>Đang chọn</Text>
                </View>
                <View style={styles.legendItem}>
                    <View style={[styles.legendBox, styles.seatBooked]} />
                    <Text style={styles.legendText}>Đã đặt</Text>
                </View>
            </View>

            {/* Selected Info */}
            {selectedSeats.length > 0 && (
                <View style={styles.selectedInfo}>
                    <View>
                        <Text style={styles.selectedLabel}>Ghế đã chọn:</Text>
                        <Text style={styles.selectedSeats}>{selectedSeats.join(', ')}</Text>
                    </View>
                    <View>
                        <Text style={styles.totalLabel}>Tiền vé:</Text>
                        <Text style={styles.totalAmount}>{calculateTicketTotal().toLocaleString('vi-VN')}đ</Text>
                    </View>
                </View>
            )}

            <TouchableOpacity
                style={[styles.nextButton, selectedSeats.length === 0 && styles.nextButtonDisabled]}
                disabled={selectedSeats.length === 0}
                onPress={() => setStep(4)}
            >
                <Text style={styles.nextButtonText}>Tiếp tục</Text>
            </TouchableOpacity>
        </View>
    );

    const renderFoodSelection = () => {
        const filteredItems = foodItems.filter(item => item.category === selectedCategory);

        return (
            <View style={styles.section}>
                <TouchableOpacity style={styles.backButton} onPress={() => setStep(3)}>
                    <Text style={styles.backButtonText}>← Quay lại</Text>
                </TouchableOpacity>

                <Text style={styles.sectionTitle}>Chọn đồ ăn & nước uống</Text>
                <Text style={styles.foodSubtitle}>Thêm đồ ăn để trải nghiệm tốt hơn</Text>

                {/* Category Tabs */}
                <View style={styles.categoryTabs}>
                    <TouchableOpacity
                        style={[styles.categoryTab, selectedCategory === 'combo' && styles.categoryTabActive]}
                        onPress={() => setSelectedCategory('combo')}
                    >
                        <Text style={[styles.categoryTabText, selectedCategory === 'combo' && styles.categoryTabTextActive]}>
                            🎁 Combo
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.categoryTab, selectedCategory === 'snack' && styles.categoryTabActive]}
                        onPress={() => setSelectedCategory('snack')}
                    >
                        <Text style={[styles.categoryTabText, selectedCategory === 'snack' && styles.categoryTabTextActive]}>
                            🍿 Đồ ăn
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.categoryTab, selectedCategory === 'drink' && styles.categoryTabActive]}
                        onPress={() => setSelectedCategory('drink')}
                    >
                        <Text style={[styles.categoryTabText, selectedCategory === 'drink' && styles.categoryTabTextActive]}>
                            🥤 Nước uống
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Food Items */}
                <ScrollView style={styles.foodList} showsVerticalScrollIndicator={false}>
                    {filteredItems.map(item => (
                        <View key={item.id} style={styles.foodItem}>
                            <View style={styles.foodItemLeft}>
                                <Text style={styles.foodEmoji}>{item.image}</Text>
                                <View style={styles.foodInfo}>
                                    <Text style={styles.foodName}>{item.name}</Text>
                                    <Text style={styles.foodPrice}>{item.price.toLocaleString('vi-VN')}đ</Text>
                                </View>
                            </View>
                            <View style={styles.foodQuantity}>
                                {foodCart[item.id] > 0 ? (
                                    <>
                                        <TouchableOpacity
                                            style={styles.quantityButton}
                                            onPress={() => updateFoodQuantity(item.id, -1)}
                                        >
                                            <Text style={styles.quantityButtonText}>−</Text>
                                        </TouchableOpacity>
                                        <Text style={styles.quantityText}>{foodCart[item.id]}</Text>
                                        <TouchableOpacity
                                            style={styles.quantityButton}
                                            onPress={() => updateFoodQuantity(item.id, 1)}
                                        >
                                            <Text style={styles.quantityButtonText}>+</Text>
                                        </TouchableOpacity>
                                    </>
                                ) : (
                                    <TouchableOpacity
                                        style={styles.addButton}
                                        onPress={() => updateFoodQuantity(item.id, 1)}
                                    >
                                        <Text style={styles.addButtonText}>Thêm</Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        </View>
                    ))}
                </ScrollView>

                {/* Cart Summary */}
                {Object.keys(foodCart).length > 0 && (
                    <View style={styles.cartSummary}>
                        <View style={styles.cartRow}>
                            <Text style={styles.cartLabel}>Tiền vé:</Text>
                            <Text style={styles.cartValue}>{calculateTicketTotal().toLocaleString('vi-VN')}đ</Text>
                        </View>
                        <View style={styles.cartRow}>
                            <Text style={styles.cartLabel}>Đồ ăn & nước:</Text>
                            <Text style={styles.cartValue}>{calculateFoodTotal().toLocaleString('vi-VN')}đ</Text>
                        </View>
                        <View style={[styles.cartRow, styles.cartTotal]}>
                            <Text style={styles.cartTotalLabel}>Tổng cộng:</Text>
                            <Text style={styles.cartTotalValue}>{calculateGrandTotal().toLocaleString('vi-VN')}đ</Text>
                        </View>
                    </View>
                )}

                <TouchableOpacity
                    style={styles.confirmButton}
                    onPress={() => router.push('/(payment)/payment')}
                >
                    <Text style={styles.confirmButtonText}>
                        {Object.keys(foodCart).length > 0 ? 'Thanh toán' : 'Bỏ qua & Thanh toán'}
                    </Text>
                </TouchableOpacity>
            </View>
        );
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Đặt vé xem phim</Text>
                <Text style={styles.movieTitle}>{movie.title}</Text>
                <Text style={styles.movieInfo}>{movie.genre} • {movie.duration}</Text>
            </View>

            {/* Step Indicator */}
            {renderStepIndicator()}

            {/* Content */}
            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {step === 1 && renderCinemaSelection()}
                {step === 2 && renderShowtimeSelection()}
                {step === 3 && renderSeatSelection()}
                {step === 4 && renderFoodSelection()}

                <View style={styles.bottomSpacing} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0a0a0f',
    },
    header: {
        padding: 20,
        paddingTop: 60,
        backgroundColor: '#111',
        borderBottomWidth: 1,
        borderBottomColor: '#222',
    },
    headerTitle: {
        fontSize: 16,
        color: '#999',
        marginBottom: 8,
    },
    movieTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 4,
    },
    movieInfo: {
        fontSize: 14,
        color: '#999',
    },
    stepIndicator: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        backgroundColor: '#111',
    },
    stepItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    stepCircle: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#222',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#333',
    },
    stepCircleActive: {
        backgroundColor: '#E50914',
        borderColor: '#E50914',
    },
    stepNumber: {
        color: '#666',
        fontSize: 14,
        fontWeight: 'bold',
    },
    stepNumberActive: {
        color: '#fff',
    },
    stepLabel: {
        fontSize: 12,
        color: '#666',
        marginLeft: 8,
    },
    stepLine: {
        width: 30,
        height: 2,
        backgroundColor: '#333',
        marginHorizontal: 8,
    },
    stepLineActive: {
        backgroundColor: '#E50914',
    },
    content: {
        flex: 1,
    },
    section: {
        padding: 20,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 16,
    },
    dateText: {
        fontSize: 14,
        color: '#999',
        marginBottom: 16,
    },
    cinemaCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#111',
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        borderWidth: 2,
        borderColor: '#222',
    },
    cinemaCardSelected: {
        borderColor: '#E50914',
        backgroundColor: '#1a0a0f',
    },
    cinemaIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#222',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    cinemaEmoji: {
        fontSize: 24,
    },
    cinemaInfo: {
        flex: 1,
    },
    cinemaName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff',
        marginBottom: 4,
    },
    cinemaAddress: {
        fontSize: 13,
        color: '#999',
    },
    checkmark: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#E50914',
        justifyContent: 'center',
        alignItems: 'center',
    },
    checkmarkText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: 'bold',
    },
    nextButton: {
        backgroundColor: '#E50914',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 20,
    },
    nextButtonDisabled: {
        backgroundColor: '#333',
        opacity: 0.5,
    },
    nextButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    backButton: {
        marginBottom: 16,
    },
    backButtonText: {
        color: '#E50914',
        fontSize: 14,
        fontWeight: '600',
    },
    selectedCinema: {
        fontSize: 14,
        color: '#999',
        marginBottom: 16,
    },
    showtimeGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    showtimeCard: {
        width: (width - 60) / 3,
        backgroundColor: '#111',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#222',
    },
    showtimeCardSelected: {
        borderColor: '#E50914',
        backgroundColor: '#1a0a0f',
    },
    showtimeTime: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 4,
    },
    showtimeTimeSelected: {
        color: '#E50914',
    },
    showtimeType: {
        fontSize: 12,
        color: '#999',
        marginBottom: 8,
    },
    showtimeTypeSelected: {
        color: '#fff',
    },
    showtimePrice: {
        fontSize: 13,
        color: '#999',
        fontWeight: '600',
    },
    showtimePriceSelected: {
        color: '#fff',
    },
    screenContainer: {
        alignItems: 'center',
        marginBottom: 24,
    },
    screen: {
        width: width - 80,
        height: 4,
        backgroundColor: '#E50914',
        borderRadius: 2,
        marginBottom: 8,
    },
    screenText: {
        fontSize: 12,
        color: '#999',
        textAlign: 'center',
        marginTop: 8,
    },
    seatsContainer: {
        paddingVertical: 16,
    },
    seatRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    rowLabel: {
        width: 30,
        fontSize: 14,
        fontWeight: 'bold',
        color: '#999',
        textAlign: 'center',
    },
    seat: {
        width: 32,
        height: 32,
        backgroundColor: '#222',
        borderRadius: 6,
        justifyContent: 'center',
        alignItems: 'center',
        marginHorizontal: 4,
        borderWidth: 1,
        borderColor: '#333',
    },
    seatAvailable: {
        backgroundColor: '#222',
    },
    seatVIP: {
        backgroundColor: '#4a3c00',
        borderColor: '#FFD700',
    },
    seatSelected: {
        backgroundColor: '#E50914',
        borderColor: '#E50914',
    },
    seatBooked: {
        backgroundColor: '#555',
        borderColor: '#555',
    },
    seatText: {
        fontSize: 11,
        color: '#999',
        fontWeight: '600',
    },
    seatTextLight: {
        color: '#fff',
    },
    legend: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingVertical: 16,
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderColor: '#222',
        marginVertical: 16,
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    legendBox: {
        width: 20,
        height: 20,
        borderRadius: 4,
    },
    legendText: {
        fontSize: 12,
        color: '#999',
    },
    selectedInfo: {
        backgroundColor: '#111',
        padding: 16,
        borderRadius: 12,
        marginBottom: 16,
    },
    selectedLabel: {
        fontSize: 13,
        color: '#999',
        marginBottom: 4,
    },
    selectedSeats: {
        fontSize: 15,
        color: '#fff',
        fontWeight: '600',
        marginBottom: 12,
    },
    totalLabel: {
        fontSize: 13,
        color: '#999',
        marginBottom: 4,
    },
    totalAmount: {
        fontSize: 24,
        color: '#E50914',
        fontWeight: 'bold',
    },
    confirmButton: {
        backgroundColor: '#E50914',
        padding: 18,
        borderRadius: 12,
        alignItems: 'center',
    },
    confirmButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    foodSubtitle: {
        fontSize: 14,
        color: '#999',
        marginBottom: 16,
    },
    categoryTabs: {
        flexDirection: 'row',
        backgroundColor: '#111',
        borderRadius: 12,
        padding: 4,
        marginBottom: 20,
    },
    categoryTab: {
        flex: 1,
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    categoryTabActive: {
        backgroundColor: '#E50914',
    },
    categoryTabText: {
        fontSize: 14,
        color: '#999',
        fontWeight: '600',
    },
    categoryTabTextActive: {
        color: '#fff',
    },
    foodList: {
        maxHeight: 400,
    },
    foodItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#111',
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
    },
    foodItemLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    foodEmoji: {
        fontSize: 40,
        marginRight: 12,
    },
    foodInfo: {
        flex: 1,
    },
    foodName: {
        fontSize: 15,
        fontWeight: '600',
        color: '#fff',
        marginBottom: 4,
    },
    foodPrice: {
        fontSize: 14,
        color: '#E50914',
        fontWeight: '600',
    },
    foodQuantity: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    quantityButton: {
        width: 32,
        height: 32,
        backgroundColor: '#222',
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    quantityButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    quantityText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#fff',
        marginHorizontal: 16,
        minWidth: 20,
        textAlign: 'center',
    },
    addButton: {
        backgroundColor: '#E50914',
        paddingHorizontal: 20,
        paddingVertical: 8,
        borderRadius: 8,
    },
    addButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: 'bold',
    },
    cartSummary: {
        backgroundColor: '#111',
        padding: 16,
        borderRadius: 12,
        marginTop: 20,
        marginBottom: 16,
    },
    cartRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    cartLabel: {
        fontSize: 14,
        color: '#999',
    },
    cartValue: {
        fontSize: 14,
        color: '#fff',
        fontWeight: '600',
    },
    cartTotal: {
        borderTopWidth: 1,
        borderTopColor: '#222',
        paddingTop: 12,
        marginTop: 8,
    },
    cartTotalLabel: {
        fontSize: 16,
        color: '#fff',
        fontWeight: 'bold',
    },
    cartTotalValue: {
        fontSize: 20,
        color: '#E50914',
        fontWeight: 'bold',
    },
    bottomSpacing: {
        height: 40,
    },
});