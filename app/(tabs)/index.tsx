import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Dimensions, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const { width } = Dimensions.get('window');

// Mock data cho phim
const nowShowingMovies = [
  {
    id: 1,
    title: 'Avatar: The Way of Water',
    poster: 'https://image.tmdb.org/t/p/w500/t6HIqrRAclMCA60NsSmeqe9RmNV.jpg',
    rating: 8.5,
    genre: 'Action, Sci-Fi',
  },
  {
    id: 2,
    title: 'Spider-Man: No Way Home',
    poster: 'https://image.tmdb.org/t/p/w500/1g0dhYtq4irTY1GPXvft6k4YLjm.jpg',
    rating: 9.0,
    genre: 'Action, Adventure',
  },
  {
    id: 3,
    title: 'The Batman',
    poster: 'https://image.tmdb.org/t/p/w500/74xTEgt7R36Fpooo50r9T25onhq.jpg',
    rating: 8.7,
    genre: 'Action, Crime',
  },
];

const comingSoonMovies = [
  {
    id: 4,
    title: 'Oppenheimer',
    poster: 'https://image.tmdb.org/t/p/w500/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg',
    releaseDate: '21/07/2024',
  },
  {
    id: 5,
    title: 'Barbie',
    poster: 'https://image.tmdb.org/t/p/w500/iuFNMS8U5cb6xfzi51Dbkovj7vM.jpg',
    releaseDate: '21/07/2024',
  },
];

export default function HomeScreen() {
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

        {/* Search Bar */}
        <TouchableOpacity style={styles.searchBar}>
          <Text style={styles.searchIcon}>🔍</Text>
          <Text style={styles.searchPlaceholder}>Tìm phim, rạp...</Text>
        </TouchableOpacity>
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
              source={{ uri: 'https://image.tmdb.org/t/p/w500/t6HIqrRAclMCA60NsSmeqe9RmNV.jpg' }}
              style={styles.bannerImage}
              contentFit="cover"
            />
            <View style={styles.bannerOverlay}>
              <ThemedText style={styles.bannerTitle}>Khuyến mãi đặc biệt</ThemedText>
              <ThemedText style={styles.bannerSubtitle}>Giảm 50% vé xem phim</ThemedText>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <TouchableOpacity style={styles.actionButton}>
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

      {/* Now Showing Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>Đang chiếu</ThemedText>
          <TouchableOpacity onPress={() => router.push('/movies')}>
            <Text style={styles.seeAllButton}>Xem tất cả →</Text>
          </TouchableOpacity>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.movieList}>
          {nowShowingMovies.map((movie) => (
            <TouchableOpacity key={movie.id} style={styles.movieCard}>
              <Image
                source={{ uri: movie.poster }}
                style={styles.moviePoster}
                contentFit="cover"
              />
              <View style={styles.ratingBadge}>
                <Text style={styles.starIcon}>⭐</Text>
                <Text style={styles.ratingText}>{movie.rating}</Text>
              </View>
              <View style={styles.movieInfo}>
                <Text style={styles.movieTitle} numberOfLines={2}>{movie.title}</Text>
                <Text style={styles.movieGenre}>{movie.genre}</Text>
                <TouchableOpacity style={styles.bookButton}>
                  <Text style={styles.bookButtonText}>Đặt vé</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Coming Soon Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>Sắp chiếu</ThemedText>
          <TouchableOpacity onPress={() => router.push('/movies')}>
            <Text style={styles.seeAllButton}>Xem tất cả →</Text>
          </TouchableOpacity>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.movieList}>
          {comingSoonMovies.map((movie) => (
            <TouchableOpacity key={movie.id} style={styles.movieCard}>
              <Image
                source={{ uri: movie.poster }}
                style={styles.moviePoster}
                contentFit="cover"
              />
              <View style={styles.comingSoonBadge}>
                <Text style={styles.comingSoonText}>Sắp chiếu</Text>
              </View>
              <View style={styles.movieInfo}>
                <Text style={styles.movieTitle} numberOfLines={2}>{movie.title}</Text>
                <Text style={styles.releaseDate}>📅 {movie.releaseDate}</Text>
                <TouchableOpacity style={styles.notifyButton}>
                  <Text style={styles.notifyButtonText}>Nhận thông báo</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Bottom Spacing */}
      <View style={styles.bottomSpacing} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
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
  greeting: {
    fontSize: 14,
    color: '#999',
    marginBottom: 4,
  },
  appName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  notificationButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#222',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconText: {
    fontSize: 20,
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
    marginTop: 20,
  },
  bannerCard: {
    width: width - 40,
    height: 180,
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
    height: 90,
  },
  movieTitle: {
    color: '#fff',
    fontSize: 14,
    height: 36,
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
    height: 40,
  },
  logo: {
    width: 100,
    height: 100,
    alignSelf: 'center',
    marginBottom: 16,
  },
});