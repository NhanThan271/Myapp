import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
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
  status: 'NOW_SHOWING' | 'COMING_SOON' | 'ENDED';
  poster: string;
  genres: Genre[];
  releaseDate?: string;
}

export default function HomeScreen() {
  const [nowShowingMovies, setNowShowingMovies] = useState<Movie[]>([]);
  const [comingSoonMovies, setComingSoonMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch movies từ API
  useEffect(() => {
    fetchMovies();
  }, []);

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

      // Thử fetch tất cả phim trước
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
          // Nếu parse fail, có thể do circular reference, thử trim
          const cleanedString = rawData.substring(0, rawData.lastIndexOf('}') + 1);
          rawData = JSON.parse(cleanedString);
        }
      }

      // Xử lý circular reference: chỉ lấy level đầu tiên
      let allMovies: Movie[] = [];

      if (Array.isArray(rawData)) {
        // Clean data để loại bỏ circular reference
        allMovies = rawData.map((movie: any) => ({
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
            // Không lấy movies bên trong genre để tránh circular reference
          })) || [],
          releaseDate: movie.releaseDate,
        }));
      } else {
        throw new Error('Response is not an array');
      }

      console.log('Cleaned movies:', allMovies);

      // Lọc phim theo status ở client side
      const nowShowing = allMovies.filter((movie: Movie) => movie.status === 'NOW_SHOWING');
      const comingSoon = allMovies.filter((movie: Movie) => movie.status === 'COMING_SOON');

      console.log('Now Showing Movies:', nowShowing.length);
      console.log('Coming Soon Movies:', comingSoon.length);

      setNowShowingMovies(nowShowing);
      setComingSoonMovies(comingSoon);
    } catch (err: any) {
      console.error('Error fetching movies:', err);

      if (err.response) {
        // Server trả về lỗi
        console.error('Response status:', err.response.status);
        console.error('Response data:', err.response.data);

        if (err.response.status === 401) {
          setError('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại!');
        } else {
          setError(err.response.data?.message || 'Không thể tải danh sách phim');
        }
      } else if (err.request) {
        // Không nhận được response
        console.error('Request error - No response received');
        setError('Không thể kết nối đến server!');
      } else {
        // Lỗi khác
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
      // Sử dụng placeholder image từ source khác
      return 'https://placehold.co/500x750/1a1a1a/666666?text=No+Poster';
    }
    if (posterPath.startsWith('http')) {
      return posterPath;
    }
    // Thêm base URL cho relative path
    return `${API_BASE_URL}/${posterPath}`;
  };

  // Get genres string
  const getGenresString = (genres: Genre[]) => {
    if (!genres || genres.length === 0) return 'Chưa phân loại';
    return genres.map(g => g.name).join(', ');
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <ThemedView style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Image
              source={require('@/assets/images/LogoCinema.png')}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>
        </View>
      </ThemedView>

      {/* Banner Slider */}
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        style={styles.bannerContainer}
      >
        {[1, 2, 3].map((item) => (
          <View key={item} style={styles.bannerCard}>
            <Image
              source={{ uri: 'https://res.cloudinary.com/dmdv4vd0y/image/upload/v1767526658/movies/vhaa3gkqrdh698wraiiy.jpg' }}
              style={styles.bannerImage}
              contentFit="cover"
            />
            <View style={styles.bannerOverlay}>
              <ThemedText style={styles.bannerTitle}>Khuyến mãi đặc biệt</ThemedText>
              <ThemedText style={styles.bannerSubtitle}>Giảm 20% vé xem phim</ThemedText>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <TouchableOpacity style={styles.actionButton} onPress={() => router.push('/booking')}>
          <View style={styles.actionIcon}>
            <Text style={styles.actionEmoji}>🎫</Text>
          </View>
          <Text style={styles.actionText}>Đặt vé</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton}>
          <View style={styles.actionIcon}>
            <Text style={styles.actionEmoji}>🍿</Text>
          </View>
          <Text style={styles.actionText}>Đồ ăn</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton}>
          <View style={styles.actionIcon}>
            <Text style={styles.actionEmoji}>🎁</Text>
          </View>
          <Text style={styles.actionText}>Ưu đãi</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton}>
          <View style={styles.actionIcon}>
            <Text style={styles.actionEmoji}>🏢</Text>
          </View>
          <Text style={styles.actionText}>Rạp</Text>
        </TouchableOpacity>
      </View>

      {/* Loading State */}
      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#E50914" />
          <Text style={styles.loadingText}>Đang tải phim...</Text>
        </View>
      )}

      {/* Error State */}
      {error && (
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

      {/* Now Showing Section */}
      {!loading && !error && nowShowingMovies.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>Đang chiếu</ThemedText>
            <TouchableOpacity onPress={() => router.push('/movies?tab=now-showing')}>
              <Text style={styles.seeAllButton}>Xem tất cả →</Text>
            </TouchableOpacity>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.movieList}>
            {nowShowingMovies.map((movie) => (
              <TouchableOpacity key={movie.id} style={styles.movieCard}>
                <Image
                  source={{ uri: getPosterUrl(movie.poster) }}
                  style={styles.moviePoster}
                  contentFit="cover"
                />
                <View style={styles.ratingBadge}>
                  <Text style={styles.starIcon}>⭐</Text>
                  <Text style={styles.ratingText}>{movie.rating.toFixed(1)}</Text>
                </View>
                <View style={styles.movieInfo}>
                  <Text style={styles.movieTitle} numberOfLines={2}>{movie.title}</Text>
                  <Text style={styles.movieGenre}>{getGenresString(movie.genres)}</Text>
                  <TouchableOpacity style={styles.bookButton} onPress={() => router.push(`/booking?movieId=${movie.id}`)}>
                    <Text style={styles.bookButtonText}>Đặt vé</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Coming Soon Section */}
      {!loading && !error && comingSoonMovies.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>Sắp chiếu</ThemedText>
            <TouchableOpacity onPress={() => router.push('/movies?tab=coming-soon')}>
              <Text style={styles.seeAllButton}>Xem tất cả →</Text>
            </TouchableOpacity>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.movieList}>
            {comingSoonMovies.map((movie) => (
              <TouchableOpacity key={movie.id} style={styles.movieCard}>
                <Image
                  source={{ uri: getPosterUrl(movie.poster) }}
                  style={styles.moviePoster}
                  contentFit="cover"
                />
                <View style={styles.comingSoonBadge}>
                  <Text style={styles.comingSoonText}>Sắp chiếu</Text>
                </View>
                <View style={styles.movieInfo}>
                  <Text style={styles.movieTitle} numberOfLines={2}>{movie.title}</Text>
                  <Text style={styles.releaseDate}>
                    {movie.releaseDate || 'Sắp công bố'}
                  </Text>
                  <TouchableOpacity style={styles.notifyButton}>
                    <Text style={styles.notifyButtonText}>Nhận thông báo</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Empty State */}
      {!loading && !error && nowShowingMovies.length === 0 && comingSoonMovies.length === 0 && (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Chưa có phim nào</Text>
        </View>
      )}

      {/* Bottom Spacing */}
      <View style={styles.bottomSpacing} />
    </ScrollView>
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
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  logo: {
    width: 100,
    height: 100,
    alignSelf: 'center',
    marginBottom: 16,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#222',
    borderRadius: 12,
    padding: 14,
    gap: 10,
  },
  searchIcon: {
    fontSize: 18,
  },
  searchPlaceholder: {
    color: '#666',
    fontSize: 15,
  },
  bannerContainer: {
    marginTop: -46,
    marginHorizontal: 10,
  },
  bannerCard: {
    width: width - 40,
    height: 240,
    marginHorizontal: 20,
    borderRadius: 16,
    overflow: 'hidden',
  },
  bannerImage: {
    width: '100%',
    height: '100%',
  },
  bannerOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  bannerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  bannerSubtitle: {
    fontSize: 14,
    color: '#ddd',
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  actionButton: {
    alignItems: 'center',
    gap: 8,
  },
  actionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#E50914',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionEmoji: {
    fontSize: 28,
  },
  actionText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    color: '#999',
    fontSize: 16,
  },
  section: {
    marginTop: 8,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  seeAllButton: {
    color: '#E50914',
    fontSize: 14,
    fontWeight: '600',
  },
  movieList: {
    paddingLeft: 20,
  },
  movieCard: {
    width: 140,
    marginRight: 16,
  },
  moviePoster: {
    width: 140,
    height: 210,
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
    height: 115,
  },
  movieTitle: {
    color: '#fff',
    fontSize: 14,
    height: 48,
    fontWeight: '600',
    marginBottom: 4,
    lineHeight: 18,
  },
  movieGenre: {
    color: '#999',
    fontSize: 12,
    marginBottom: 8,
  },
  releaseDate: {
    color: '#999',
    fontSize: 12,
    marginBottom: 8,
  },
  bookButton: {
    backgroundColor: '#E50914',
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  bookButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  notifyButton: {
    backgroundColor: '#222',
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E50914',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  notifyButtonText: {
    color: '#E50914',
    fontSize: 12,
    fontWeight: 'bold',
  },
  bottomSpacing: {
    height: 80,
  },
});