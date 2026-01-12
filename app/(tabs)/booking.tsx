import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import axios from 'axios';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Dimensions, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const { width } = Dimensions.get('window');

// API Configuration
const API_BASE_URL = 'https://ltud.up.railway.app';

// Types
interface Genre {
    id: number;
    name: string;
}

interface Movie {
    id: number;
    title: string;
    description: string;
    duration: number;
    rating: number;
    status: string;
    poster: string;
    genres: Genre[];
}

interface Cinema {
    id: number;
    name: string;
    address: string;
}

interface Room {
    id: number;
    name: string;
    capacity: number;
    cinema: Cinema;
}

interface Showtime {
    id: number;
    startTime: string;
    endTime: string;
    price: number;
    movie: Movie;
    room: Room;
}

interface Seat {
    id: number;
    rowSeat: string;
    number: number;
    type: 'NORMAL' | 'VIP';
    status: 'AVAILABLE' | 'BOOKED' | 'RESERVED';
    room: Room;
}

interface FoodItem {
    id: number;
    name: string;
    price: number;
    image: string;
    category: 'combo' | 'snack' | 'drink';
}

// Mock food data
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

export default function BookingScreen() {
    const params = useLocalSearchParams();
    const movieIdFromParams = params.movieId ? parseInt(params.movieId as string) : null;
    const [step, setStep] = useState<number>(1);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [expandedCinemaId, setExpandedCinemaId] = useState<number | null>(null);

    // Data từ API
    const [movies, setMovies] = useState<Movie[]>([]);
    const [showtimes, setShowtimes] = useState<Showtime[]>([]);
    const [seats, setSeats] = useState<Seat[]>([]);

    // Selected states
    const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
    const [selectedShowtime, setSelectedShowtime] = useState<Showtime | null>(null);
    const [selectedSeats, setSelectedSeats] = useState<number[]>([]);
    const [foodCart, setFoodCart] = useState<{ [key: number]: number }>({});
    const [selectedCategory, setSelectedCategory] = useState<'combo' | 'snack' | 'drink'>('combo');

    // Reset khi focus
    useFocusEffect(
        useCallback(() => {
            const initBooking = async () => {
                await fetchMovies();

                if (movieIdFromParams && movies.length === 0) {
                    return;
                }

                if (movieIdFromParams && movies.length > 0) {
                    const selectedMovie = movies.find(m => m.id === movieIdFromParams);
                    if (selectedMovie) {
                        setSelectedMovie(selectedMovie);
                        await fetchShowtimes(movieIdFromParams);
                        setStep(2);
                    }
                } else {
                    resetBooking();
                }
            };

            initBooking();
        }, [movieIdFromParams, movies.length])
    );

    const resetBooking = () => {
        setStep(1);
        setSelectedMovie(null);
        setSelectedShowtime(null);
        setSelectedSeats([]);
        setFoodCart({});
        setSelectedCategory('combo');
        setError(null);
    };

    const fetchMovies = async () => {
        try {
            setLoading(true);
            setError(null);

            const token = await AsyncStorage.getItem('authToken');
            if (!token) {
                setError('Vui lòng đăng nhập để đặt vé');
                return;
            }

            const config = {
                headers: { 'Authorization': `Bearer ${token}` }
            };

            const response = await axios.get(
                `${API_BASE_URL}/api/customer/movies`,
                config
            );

            let data = response.data;
            if (typeof data === 'string') {
                data = JSON.parse(data);
            }

            const cleanedMovies = Array.isArray(data)
                ? data
                    .filter((movie: any) => movie.status === 'NOW_SHOWING')
                    .map((movie: any) => ({
                        id: movie.id,
                        title: movie.title,
                        description: movie.description,
                        duration: movie.duration,
                        rating: movie.rating,
                        status: movie.status,
                        poster: movie.posterUrl || movie.poster,
                        genres: movie.genres?.map((g: any) => ({ id: g.id, name: g.name })) || [],
                    }))
                : [];

            setMovies(cleanedMovies);

        } catch (err: any) {
            console.error('Error fetching movies:', err);

            if (err.response?.status === 500) {
                setError('Lỗi server. Vui lòng thử lại sau hoặc liên hệ admin.');
            } else if (err.response?.status === 401) {
                setError('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.');
            } else {
                setError('Không thể tải danh sách phim. Vui lòng kiểm tra kết nối.');
            }
        } finally {
            setLoading(false);
        }
    };

    const fetchShowtimes = async (movieId: number) => {
        try {
            setLoading(true);
            setError(null);

            const token = await AsyncStorage.getItem('authToken');
            if (!token) return;

            const config = {
                headers: { 'Authorization': `Bearer ${token}` }
            };

            const response = await axios.get(
                `${API_BASE_URL}/api/customer/showtimes`,
                config
            );

            let data = response.data;
            if (typeof data === 'string') {
                data = JSON.parse(data);
            }

            const filteredShowtimes = Array.isArray(data)
                ? data.filter((showtime: any) => showtime.movie.id === movieId)
                : [];

            setShowtimes(filteredShowtimes);

        } catch (err: any) {
            console.error('Error fetching showtimes:', err);
            setError('Không thể tải lịch chiếu');
        } finally {
            setLoading(false);
        }
    };

    const fetchSeats = async (roomId: number) => {
        try {
            setLoading(true);
            setError(null);

            const token = await AsyncStorage.getItem('authToken');
            if (!token) return;

            const config = {
                headers: { 'Authorization': `Bearer ${token}` }
            };

            const response = await axios.get(
                `${API_BASE_URL}/api/customer/seats/room/${roomId}`,
                config
            );

            let data = response.data;
            if (typeof data === 'string') {
                data = JSON.parse(data);
            }

            setSeats(Array.isArray(data) ? data : []);
        } catch (err: any) {
            console.error('Error fetching seats:', err);
            setError('Không thể tải sơ đồ ghế');
        } finally {
            setLoading(false);
        }
    };

    const toggleSeat = (seatId: number) => {
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
        if (!selectedShowtime) return 0;

        const vipSeats = selectedSeats.filter(seatId => {
            const seat = seats.find(s => s.id === seatId);
            return seat?.type === 'VIP';
        }).length;
        const normalSeats = selectedSeats.length - vipSeats;

        return (normalSeats * selectedShowtime.price) + (vipSeats * (selectedShowtime.price + 20000));
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

    const formatTime = (dateString: string): string => {
        const date = new Date(dateString);
        return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    };

    const getGenresString = (genres: Genre[]): string => {
        if (!genres || genres.length === 0) return 'Chưa phân loại';
        return genres.map(g => g.name).join(', ');
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
                        {num === 1 ? 'Phim' : num === 2 ? 'Rạp/Suất' : num === 3 ? 'Ghế' : 'Đồ ăn'}
                    </Text>
                    {num < 4 && <View style={[styles.stepLine, step > num && styles.stepLineActive]} />}
                </View>
            ))}
        </View>
    );

    const renderMovieSelection = () => (
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>Chọn phim</Text>

            {loading && (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#E50914" />
                </View>
            )}

            {error && (
                <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>{error}</Text>
                </View>
            )}

            {!loading && !error && movies.map(movie => (
                <TouchableOpacity
                    key={movie.id}
                    style={[
                        styles.movieCard,
                        selectedMovie?.id === movie.id && styles.movieCardSelected
                    ]}
                    onPress={() => {
                        setSelectedMovie(movie);
                        fetchShowtimes(movie.id);
                    }}
                >
                    <View style={styles.movieInfo}>
                        <Text style={styles.movieTitle}>{movie.title}</Text>
                        <Text style={styles.movieMeta}>
                            {getGenresString(movie.genres)} • {movie.duration} phút
                        </Text>
                        <Text style={styles.movieRating}>⭐ {movie.rating.toFixed(1)}</Text>
                    </View>
                    <View style={styles.checkmark}>
                        {selectedMovie?.id === movie.id && <Text style={styles.checkmarkText}>✓</Text>}
                    </View>
                </TouchableOpacity>
            ))}

            <TouchableOpacity
                style={[styles.nextButton, (!selectedMovie || showtimes.length === 0) && styles.nextButtonDisabled]}
                disabled={!selectedMovie || showtimes.length === 0}
                onPress={() => setStep(2)}
            >
                <Text style={styles.nextButtonText}>Tiếp tục</Text>
            </TouchableOpacity>
        </View>
    );

    const renderCinemaAndShowtimeSelection = () => {
        const showtimesByCinema: { [key: number]: Showtime[] } = {};
        showtimes.forEach(showtime => {
            const cinemaId = showtime.room.cinema.id;
            if (!showtimesByCinema[cinemaId]) {
                showtimesByCinema[cinemaId] = [];
            }
            showtimesByCinema[cinemaId].push(showtime);
        });

        return (
            <View style={styles.section}>
                <TouchableOpacity style={styles.backButton} onPress={() => setStep(1)}>
                    <Text style={styles.backButtonText}>← Quay lại</Text>
                </TouchableOpacity>

                <Text style={styles.sectionTitle}>Chọn rạp & suất chiếu</Text>
                <Text style={styles.selectedInfo}>🎬 {selectedMovie?.title}</Text>

                {loading && (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color="#E50914" />
                    </View>
                )}

                {!loading && Object.entries(showtimesByCinema).map(([cinemaId, cinemaShowtimes]) => {
                    const cinema = cinemaShowtimes[0].room.cinema;
                    const isExpanded = expandedCinemaId === parseInt(cinemaId);

                    return (
                        <View key={cinemaId} style={styles.cinemaGroup}>
                            {/* Header rạp - có thể click để expand/collapse */}
                            <TouchableOpacity
                                style={styles.cinemaHeader}
                                onPress={() => setExpandedCinemaId(isExpanded ? null : parseInt(cinemaId))}
                            >
                                <View style={styles.cinemaIcon}>
                                    <Text style={styles.cinemaEmoji}>🎬</Text>
                                </View>
                                <View style={styles.cinemaHeaderInfo}>
                                    <Text style={styles.cinemaName}>{cinema.name}</Text>
                                    <Text style={styles.cinemaAddress}>{cinema.address}</Text>
                                </View>
                                {/* Icon mũi tên */}
                                <Text style={styles.expandIcon}>
                                    {isExpanded ? '▼' : '▶'}
                                </Text>
                            </TouchableOpacity>

                            {/* Danh sách suất chiếu - chỉ hiện khi expanded */}
                            {isExpanded && (
                                <View style={styles.showtimeGrid}>
                                    {cinemaShowtimes.map(showtime => (
                                        <TouchableOpacity
                                            key={showtime.id}
                                            style={[
                                                styles.showtimeCard,
                                                selectedShowtime?.id === showtime.id && styles.showtimeCardSelected
                                            ]}
                                            onPress={() => {
                                                setSelectedShowtime(showtime);
                                                fetchSeats(showtime.room.id);
                                            }}
                                        >
                                            <Text style={[
                                                styles.showtimeTime,
                                                selectedShowtime?.id === showtime.id && styles.showtimeTimeSelected
                                            ]}>
                                                {formatTime(showtime.startTime)}
                                            </Text>
                                            <Text style={[
                                                styles.showtimeType,
                                                selectedShowtime?.id === showtime.id && styles.showtimeTypeSelected
                                            ]}>
                                                {showtime.room.name}
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
                            )}
                        </View>
                    );
                })}

                <TouchableOpacity
                    style={[styles.nextButton, !selectedShowtime && styles.nextButtonDisabled]}
                    disabled={!selectedShowtime}
                    onPress={() => setStep(3)}
                >
                    <Text style={styles.nextButtonText}>Tiếp tục</Text>
                </TouchableOpacity>
            </View>
        );
    };

    const renderSeatSelection = () => {
        const seatsByRow: { [key: string]: Seat[] } = {};
        seats.forEach(seat => {
            const row = seat.rowSeat.charAt(0);
            if (!row) return;
            if (!seatsByRow[row]) {
                seatsByRow[row] = [];
            }
            seatsByRow[row].push(seat);
        });

        const rows = Object.keys(seatsByRow).sort();

        return (
            <View style={styles.section}>
                <TouchableOpacity style={styles.backButton} onPress={() => setStep(2)}>
                    <Text style={styles.backButtonText}>← Quay lại</Text>
                </TouchableOpacity>

                <Text style={styles.sectionTitle}>Chọn ghế ngồi</Text>

                <View style={styles.screenContainer}>
                    <View style={styles.screen}>
                        <Text style={styles.screenText}>Màn hình</Text>
                    </View>
                </View>

                {loading && (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color="#E50914" />
                    </View>
                )}

                {!loading && (
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        <View style={styles.seatsContainer}>
                            {rows.map(row => (
                                <View key={row} style={styles.seatRow}>
                                    <Text style={styles.rowLabel}>{row}</Text>
                                    {seatsByRow[row]
                                        .sort((a, b) => a.number - b.number)
                                        .map(seat => (
                                            <TouchableOpacity
                                                key={seat.id}
                                                style={[
                                                    styles.seat,
                                                    seat.status === 'BOOKED' && styles.seatBooked,
                                                    seat.type === 'VIP' && seat.status !== 'BOOKED' && styles.seatVIP,
                                                    selectedSeats.includes(seat.id) && styles.seatSelected,
                                                ]}
                                                disabled={seat.status === 'BOOKED'}
                                                onPress={() => toggleSeat(seat.id)}
                                            >
                                                <Text style={[
                                                    styles.seatText,
                                                    (seat.status === 'BOOKED' || selectedSeats.includes(seat.id)) && styles.seatTextLight
                                                ]}>
                                                    {/* Sửa từ seat.seatNumber.substring(1) thành seat.number */}
                                                    {seat.number}
                                                </Text>
                                            </TouchableOpacity>
                                        ))}
                                </View>
                            ))}
                        </View>
                    </ScrollView>
                )}

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

                {selectedSeats.length > 0 && (
                    <View style={styles.selectedSeatInfo}>
                        <View>
                            <Text style={styles.selectedLabel}>Ghế đã chọn:</Text>
                            <Text style={styles.selectedSeatsText}>
                                {selectedSeats.map(id => {
                                    const seat = seats.find(s => s.id === id);
                                    return seat ? `${seat.rowSeat}${seat.number}` : '';
                                }).join(', ')}
                            </Text>
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
    };

    const renderFoodSelection = () => {
        const filteredItems = foodItems.filter(item => item.category === selectedCategory);

        return (
            <View style={styles.section}>
                <TouchableOpacity style={styles.backButton} onPress={() => setStep(3)}>
                    <Text style={styles.backButtonText}>← Quay lại</Text>
                </TouchableOpacity>

                <Text style={styles.sectionTitle}>Chọn đồ ăn & nước uống</Text>
                <Text style={styles.foodSubtitle}>Thêm đồ ăn để trải nghiệm tốt hơn</Text>

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
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Đặt vé xem phim</Text>
                {selectedMovie && (
                    <>
                        <Text style={styles.movieTitleHeader}>{selectedMovie.title}</Text>
                        <Text style={styles.movieInfoHeader}>
                            {getGenresString(selectedMovie.genres)} • {selectedMovie.duration} phút
                        </Text>
                    </>
                )}
            </View>

            {renderStepIndicator()}

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {step === 1 && renderMovieSelection()}
                {step === 2 && renderCinemaAndShowtimeSelection()}
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
        paddingTop: 50,
        backgroundColor: '#111',
    },
    headerTitle: {
        fontSize: 16,
        color: '#999',
        marginBottom: 8,
    },
    movieTitleHeader: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 4,
    },
    movieInfoHeader: {
        fontSize: 14,
        color: '#999',
    },
    stepIndicator: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
        backgroundColor: '#111',
        borderBottomWidth: 1,
        borderBottomColor: '#222',
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
        fontSize: 10,
        color: '#666',
        marginLeft: 6,
        marginRight: 4,
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
    loadingContainer: {
        padding: 40,
        alignItems: 'center',
    },
    errorContainer: {
        padding: 20,
        alignItems: 'center',
    },
    errorText: {
        color: '#ff6b6b',
        fontSize: 14,
        textAlign: 'center',
    },
    emptyText: {
        color: '#999',
        fontSize: 14,
        textAlign: 'center',
        padding: 20,
    },
    selectedInfo: {
        fontSize: 14,
        color: '#999',
        marginBottom: 16,
    },
    movieCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#111',
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        borderWidth: 2,
        borderColor: '#222',
    },
    movieCardSelected: {
        borderColor: '#E50914',
        backgroundColor: '#1a0a0f',
    },
    movieInfo: {
        flex: 1,
    },
    movieTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff',
        marginBottom: 4,
    },
    movieMeta: {
        fontSize: 13,
        color: '#999',
        marginBottom: 4,
    },
    movieRating: {
        fontSize: 13,
        color: '#FFD700',
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
    expandIcon: {
        fontSize: 16,
        color: '#999',
        marginLeft: 12,
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
        backgroundColor: '#ccb429ff',
        borderColor: '#ccb429ff',
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
    selectedSeatInfo: {
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
    selectedSeatsText: {
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
    cinemaGroup: {
        marginBottom: 24,
        backgroundColor: '#111',
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: '#222',
    },
    cinemaHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#222',
    },
    cinemaHeaderInfo: {
        flex: 1,
    },
});