import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

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
    status: 'NOW_SHOWING' | 'COMING_SOON' | 'ENDED';
    poster: string;
    genres: Genre[];
    releaseDate?: string;
}

export default function MoviesScreen() {
    const params = useLocalSearchParams();
    const [selectedTab, setSelectedTab] = useState<'NOW_SHOWING' | 'COMING_SOON'>('NOW_SHOWING');
    const [searchQuery, setSearchQuery] = useState('');
    const [allMovies, setAllMovies] = useState<Movie[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (params.tab === 'coming-soon') {
            setSelectedTab('COMING_SOON');
        } else if (params.tab === 'now-showing') {
            setSelectedTab('NOW_SHOWING');
        }
    }, [params.tab]);

    // Fetch movies từ API
    useEffect(() => {
        fetchMovies();
    }, []);

    // Search movies khi user nhập từ khóa
    useEffect(() => {
        const delaySearch = setTimeout(() => {
            if (searchQuery.trim()) {
                searchMovies(searchQuery.trim());
            } else {
                fetchMovies();
            }
        }, 500); // Debounce 500ms

        return () => clearTimeout(delaySearch);
    }, [searchQuery]);

    const fetchMovies = async () => {
        try {
            setLoading(true);
            setError(null);

            console.log('Fetching movies from:', API_BASE_URL);

            // Lấy token từ AsyncStorage
            const token = await AsyncStorage.getItem('authToken');
            console.log('Token:', token ? 'Present' : 'MISSING');

            if (!token) {
                setError('Vui lòng đăng nhập để xem phim');
                setLoading(false);
                return;
            }

            // Cấu hình headers với token
            const config = {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            };

            // Fetch tất cả phim
            const allMoviesResponse = await axios.get(
                `${API_BASE_URL}/api/customer/movies`,
                config
            );

            console.log('Raw response data type:', typeof allMoviesResponse.data);

            // Parse data nếu là string
            let rawData = allMoviesResponse.data;
            if (typeof rawData === 'string') {
                try {
                    rawData = JSON.parse(rawData);
                } catch (e) {
                    console.error('JSON parse error, trying to clean data...');
                    const cleanedString = rawData.substring(0, rawData.lastIndexOf('}') + 1);
                    rawData = JSON.parse(cleanedString);
                }
            }

            // Xử lý circular reference: chỉ lấy level đầu tiên
            let movies: Movie[] = [];

            if (Array.isArray(rawData)) {
                // Clean data để loại bỏ circular reference
                movies = rawData.map((movie: any) => ({
                    id: movie.id,
                    title: movie.title,
                    description: movie.description,
                    duration: movie.duration,
                    rating: movie.rating,
                    status: movie.status,
                    poster: movie.posterUrl || movie.poster,
                    genres: movie.genres?.map((g: any) => ({
                        id: g.id,
                        name: g.name,
                    })) || [],
                    releaseDate: movie.releaseDate,
                }));
            } else {
                throw new Error('Response is not an array');
            }

            console.log('Cleaned movies:', movies);
            setAllMovies(movies);

        } catch (err: any) {
            console.error('Error fetching movies:', err);

            if (err.response) {
                console.error('Response status:', err.response.status);
                console.error('Response data:', err.response.data);

                if (err.response.status === 401) {
                    setError('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại!');
                } else {
                    setError(err.response.data?.message || 'Không thể tải danh sách phim');
                }
            } else if (err.request) {
                console.error('Request error - No response received');
                setError('Không thể kết nối đến server!');
            } else {
                console.error('Error message:', err.message);
                setError('Đã xảy ra lỗi không xác định!');
            }
        } finally {
            setLoading(false);
        }
    };

    const searchMovies = async (keyword: string) => {
        try {
            setLoading(true);
            setError(null);

            console.log('Searching movies with keyword:', keyword);

            // Lấy token từ AsyncStorage
            const token = await AsyncStorage.getItem('authToken');

            if (!token) {
                setError('Vui lòng đăng nhập để tìm kiếm phim');
                setLoading(false);
                return;
            }

            // Cấu hình headers và params
            const config = {
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                params: {
                    keyword: keyword
                }
            };

            // Gọi API search
            const searchResponse = await axios.get(
                `${API_BASE_URL}/api/customer/movies/search`,
                config
            );

            console.log('Search response:', searchResponse.data);

            // Parse data nếu là string
            let rawData = searchResponse.data;
            if (typeof rawData === 'string') {
                try {
                    rawData = JSON.parse(rawData);
                } catch (e) {
                    console.error('JSON parse error, trying to clean data...');
                    const cleanedString = rawData.substring(0, rawData.lastIndexOf('}') + 1);
                    rawData = JSON.parse(cleanedString);
                }
            }

            // Xử lý circular reference
            let movies: Movie[] = [];

            if (Array.isArray(rawData)) {
                movies = rawData.map((movie: any) => ({
                    id: movie.id,
                    title: movie.title,
                    description: movie.description,
                    duration: movie.duration,
                    rating: movie.rating,
                    status: movie.status,
                    poster: movie.posterUrl || movie.poster,
                    genres: movie.genres?.map((g: any) => ({
                        id: g.id,
                        name: g.name,
                    })) || [],
                    releaseDate: movie.releaseDate,
                }));
            } else {
                throw new Error('Response is not an array');
            }

            console.log('Search results:', movies.length);
            setAllMovies(movies);

        } catch (err: any) {

            // Nếu API search fail (500), fallback về client-side search
            if (err.response?.status === 500) {
                console.log('API search failed, using client-side search instead');
                await fetchMovies(); // Load lại tất cả phim để search ở client
            } else if (err.response?.status === 401) {
                setError('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại!');
            } else if (err.request) {
                console.error('Request error - No response received');
                setError('Không thể kết nối đến server!');
            } else {
                console.error('Error message:', err.message);
                setError('Đã xảy ra lỗi không xác định!');
            }
        } finally {
            setLoading(false);
        }
    };

    // Format poster URL
    const getPosterUrl = (posterPath: string) => {
        if (!posterPath) {
            return 'https://placehold.co/500x750/1a1a1a/666666?text=No+Poster';
        }
        if (posterPath.startsWith('http')) {
            return posterPath;
        }
        return `${API_BASE_URL}/${posterPath}`;
    };

    // Get genres string
    const getGenresString = (genres: Genre[]) => {
        if (!genres || genres.length === 0) return 'Chưa phân loại';
        return genres.map(g => g.name).join(', ');
    };

    // Format duration
    const formatDuration = (minutes: number) => {
        return `${minutes} phút`;
    };

    // Filter movies
    const filteredMovies = allMovies.filter(movie => {
        const matchesTab = movie.status === selectedTab;

        // Nếu có search query, filter ở client side
        if (searchQuery.trim()) {
            const matchesSearch = movie.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                getGenresString(movie.genres).toLowerCase().includes(searchQuery.toLowerCase());
            return matchesTab && matchesSearch;
        }

        return matchesTab;
    });

    return (
        <View style={styles.container}>
            {/* Header */}
            <ThemedView style={styles.header}>
                <ThemedText type="title" style={styles.headerTitle}>Phim</ThemedText>

                {/* Search Bar */}
                <View style={styles.searchContainer}>
                    <Text style={styles.searchIcon}>🔍</Text>
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Tìm kiếm phim..."
                        placeholderTextColor="#666"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                    {searchQuery.length > 0 && (
                        <TouchableOpacity onPress={() => setSearchQuery('')}>
                            <Text style={styles.clearIcon}>✕</Text>
                        </TouchableOpacity>
                    )}
                </View>

                {/* Tabs */}
                <View style={styles.tabs}>
                    <TouchableOpacity
                        style={[styles.tab, selectedTab === 'NOW_SHOWING' && styles.activeTab]}
                        onPress={() => setSelectedTab('NOW_SHOWING')}
                    >
                        <Text style={[styles.tabText, selectedTab === 'NOW_SHOWING' && styles.activeTabText]}>
                            Đang chiếu
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.tab, selectedTab === 'COMING_SOON' && styles.activeTab]}
                        onPress={() => setSelectedTab('COMING_SOON')}
                    >
                        <Text style={[styles.tabText, selectedTab === 'COMING_SOON' && styles.activeTabText]}>
                            Sắp chiếu
                        </Text>
                    </TouchableOpacity>
                </View>
            </ThemedView>

            {/* Loading State */}
            {loading && (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#E50914" />
                    <Text style={styles.loadingText}>Đang tải phim...</Text>
                </View>
            )}

            {/* Error State */}
            {error && !loading && (
                <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>{error}</Text>
                    {error.includes('đăng nhập') ? (
                        <TouchableOpacity
                            style={styles.retryButton}
                            onPress={() => router.push('/(auth)/login')}
                        >
                            <Text style={styles.retryButtonText}>Đăng nhập</Text>
                        </TouchableOpacity>
                    ) : (
                        <TouchableOpacity style={styles.retryButton} onPress={fetchMovies}>
                            <Text style={styles.retryButtonText}>Thử lại</Text>
                        </TouchableOpacity>
                    )}
                </View>
            )}

            {/* Movie Grid */}
            {!loading && !error && (
                <ScrollView
                    style={styles.movieGrid}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.movieGridContent}
                >
                    {filteredMovies.length === 0 ? (
                        <View style={styles.emptyState}>
                            <Text style={styles.emptyIcon}>🎬</Text>
                            <Text style={styles.emptyText}>
                                {searchQuery ? 'Không tìm thấy phim nào' : 'Chưa có phim nào'}
                            </Text>
                        </View>
                    ) : (
                        <View style={styles.gridContainer}>
                            {filteredMovies.map((movie) => (
                                <TouchableOpacity
                                    key={movie.id}
                                    style={styles.movieCard}
                                    onPress={() => {
                                        // Navigate to movie detail
                                        // router.push(`/movie/${movie.id}`)
                                    }}
                                >
                                    <Image
                                        source={{ uri: getPosterUrl(movie.poster) }}
                                        style={styles.moviePoster}
                                        contentFit="cover"
                                    />

                                    {/* Rating Badge */}
                                    <View style={styles.ratingBadge}>
                                        <Text style={styles.starIcon}>⭐</Text>
                                        <Text style={styles.ratingText}>{movie.rating.toFixed(1)}</Text>
                                    </View>

                                    {/* Status Badge */}
                                    {movie.status === 'COMING_SOON' && (
                                        <View style={styles.comingSoonBadge}>
                                            <Text style={styles.comingSoonText}>Sắp chiếu</Text>
                                        </View>
                                    )}

                                    {/* Movie Info */}
                                    <View style={styles.movieInfo}>
                                        <Text style={styles.movieTitle} numberOfLines={2}>
                                            {movie.title}
                                        </Text>
                                        <Text style={styles.movieMeta}>
                                            {getGenresString(movie.genres)}
                                        </Text>
                                        <Text style={styles.movieMeta}>
                                            ⏱️ {formatDuration(movie.duration)}
                                        </Text>

                                        {movie.status === 'NOW_SHOWING' ? (
                                            <TouchableOpacity
                                                style={styles.bookButton}
                                                onPress={() => router.push('/booking')}
                                            >
                                                <Text style={styles.bookButtonText}>Đặt vé</Text>
                                            </TouchableOpacity>
                                        ) : (
                                            <View style={styles.releaseInfo}>
                                                <Text style={styles.releaseDate}>
                                                    📅 {movie.releaseDate || 'Sắp công bố'}
                                                </Text>
                                            </View>
                                        )}
                                    </View>
                                </TouchableOpacity>
                            ))}
                        </View>
                    )}
                </ScrollView>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    header: {
        paddingTop: 60,
        paddingHorizontal: 20,
        paddingBottom: 16,
        backgroundColor: '#111',
    },
    headerTitle: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 16,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#222',
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 12,
        marginBottom: 16,
    },
    searchIcon: {
        fontSize: 18,
        marginRight: 10,
    },
    searchInput: {
        flex: 1,
        color: '#fff',
        fontSize: 15,
    },
    clearIcon: {
        fontSize: 16,
        color: '#666',
        paddingHorizontal: 8,
    },
    tabs: {
        flexDirection: 'row',
        backgroundColor: '#222',
        borderRadius: 12,
        padding: 4,
        gap: 4,
    },
    tab: {
        flex: 1,
        paddingVertical: 10,
        borderRadius: 8,
        alignItems: 'center',
    },
    activeTab: {
        backgroundColor: '#E50914',
    },
    tabText: {
        color: '#999',
        fontSize: 14,
        fontWeight: '600',
    },
    activeTabText: {
        color: '#fff',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
    },
    loadingText: {
        color: '#fff',
        marginTop: 16,
        fontSize: 16,
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
    },
    errorText: {
        color: '#ff6b6b',
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 16,
    },
    retryButton: {
        backgroundColor: '#E50914',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 8,
    },
    retryButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: 'bold',
    },
    movieGrid: {
        flex: 1,
    },
    gridContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    movieCard: {
        width: '48%',
        marginBottom: 16,
    },
    movieGridContent: {
        padding: 16,
        paddingBottom: 100,
    },
    moviePoster: {
        width: '100%',
        height: 240,
        borderRadius: 12,
        backgroundColor: '#222',
    },
    ratingBadge: {
        position: 'absolute',
        top: 8,
        right: 8,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.8)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        gap: 4,
    },
    starIcon: {
        fontSize: 12,
    },
    ratingText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: 'bold',
    },
    comingSoonBadge: {
        position: 'absolute',
        top: 8,
        left: 8,
        backgroundColor: '#E50914',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    comingSoonText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: 'bold',
    },
    movieInfo: {
        marginTop: 8,
        minHeight: 110,
    },
    movieTitle: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 6,
        lineHeight: 18,
        height: 46,
    },
    movieMeta: {
        color: '#999',
        fontSize: 11,
        marginBottom: 4,
    },
    bookButton: {
        backgroundColor: '#E50914',
        paddingVertical: 8,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 8,
    },
    bookButtonText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: 'bold',
    },
    releaseInfo: {
        marginTop: 8,
    },
    releaseDate: {
        color: '#999',
        fontSize: 11,
    },
    emptyState: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 80,
    },
    emptyIcon: {
        fontSize: 64,
        marginBottom: 16,
    },
    emptyText: {
        color: '#666',
        fontSize: 16,
    },
});