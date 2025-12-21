import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

// Mock data
const allMovies = [
    {
        id: 1,
        title: 'Avatar: The Way of Water',
        poster: 'https://image.tmdb.org/t/p/w500/t6HIqrRAclMCA60NsSmeqe9RmNV.jpg',
        rating: 8.5,
        genre: 'Action, Sci-Fi',
        duration: '192 phút',
        releaseDate: '16/12/2022',
        status: 'now-showing',
    },
    {
        id: 2,
        title: 'Spider-Man: No Way Home',
        poster: 'https://image.tmdb.org/t/p/w500/1g0dhYtq4irTY1GPXvft6k4YLjm.jpg',
        rating: 9.0,
        genre: 'Action, Adventure',
        duration: '148 phút',
        releaseDate: '17/12/2021',
        status: 'now-showing',
    },
    {
        id: 3,
        title: 'The Batman',
        poster: 'https://image.tmdb.org/t/p/w500/74xTEgt7R36Fpooo50r9T25onhq.jpg',
        rating: 8.7,
        genre: 'Action, Crime',
        duration: '176 phút',
        releaseDate: '04/03/2022',
        status: 'now-showing',
    },
    {
        id: 4,
        title: 'Oppenheimer',
        poster: 'https://image.tmdb.org/t/p/w500/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg',
        rating: 8.9,
        genre: 'Biography, Drama',
        duration: '180 phút',
        releaseDate: '21/07/2024',
        status: 'coming-soon',
    },
    {
        id: 5,
        title: 'Barbie',
        poster: 'https://image.tmdb.org/t/p/w500/iuFNMS8U5cb6xfzi51Dbkovj7vM.jpg',
        rating: 8.3,
        genre: 'Comedy, Adventure',
        duration: '114 phút',
        releaseDate: '21/07/2024',
        status: 'coming-soon',
    },
    {
        id: 6,
        title: 'Dune: Part Two',
        poster: 'https://image.tmdb.org/t/p/w500/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg',
        rating: 8.8,
        genre: 'Sci-Fi, Adventure',
        duration: '166 phút',
        releaseDate: '01/03/2024',
        status: 'coming-soon',
    },
    {
        id: 7,
        title: 'Guardians of the Galaxy Vol. 3',
        poster: 'https://image.tmdb.org/t/p/w500/r2J02Z2OpNTctfOSN1Ydgii51I3.jpg',
        rating: 8.4,
        genre: 'Action, Comedy',
        duration: '150 phút',
        releaseDate: '05/05/2023',
        status: 'now-showing',
    },
    {
        id: 8,
        title: 'John Wick: Chapter 4',
        poster: 'https://image.tmdb.org/t/p/w500/vZloFAK7NmvMGKE7VkF5UHaz0I.jpg',
        rating: 8.6,
        genre: 'Action, Thriller',
        duration: '169 phút',
        releaseDate: '24/03/2023',
        status: 'now-showing',
    },
];

export default function MoviesScreen() {
    const params = useLocalSearchParams();
    const [selectedTab, setSelectedTab] = useState<'now-showing' | 'coming-soon'>('now-showing');
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        if (params.tab === 'coming-soon') {
            setSelectedTab('coming-soon');
        } else if (params.tab === 'now-showing') {
            setSelectedTab('now-showing');
        }
    }, [params.tab]);

    const filteredMovies = allMovies.filter(movie => {
        const matchesTab = movie.status === selectedTab;
        const matchesSearch = movie.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            movie.genre.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesTab && matchesSearch;
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
                        style={[styles.tab, selectedTab === 'now-showing' && styles.activeTab]}
                        onPress={() => setSelectedTab('now-showing')}
                    >
                        <Text style={[styles.tabText, selectedTab === 'now-showing' && styles.activeTabText]}>
                            Đang chiếu
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.tab, selectedTab === 'coming-soon' && styles.activeTab]}
                        onPress={() => setSelectedTab('coming-soon')}
                    >
                        <Text style={[styles.tabText, selectedTab === 'coming-soon' && styles.activeTabText]}>
                            Sắp chiếu
                        </Text>
                    </TouchableOpacity>
                </View>
            </ThemedView>

            {/* Movie Grid */}
            <ScrollView
                style={styles.movieGrid}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.movieGridContent}
            >
                {filteredMovies.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyIcon}>🎬</Text>
                        <Text style={styles.emptyText}>Không tìm thấy phim nào</Text>
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
                                    source={{ uri: movie.poster }}
                                    style={styles.moviePoster}
                                    contentFit="cover"
                                />

                                {/* Rating Badge */}
                                <View style={styles.ratingBadge}>
                                    <Text style={styles.starIcon}>⭐</Text>
                                    <Text style={styles.ratingText}>{movie.rating}</Text>
                                </View>

                                {/* Status Badge */}
                                {movie.status === 'coming-soon' && (
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
                                        {movie.genre}
                                    </Text>
                                    <Text style={styles.movieMeta}>
                                        ⏱️ {movie.duration}
                                    </Text>

                                    {movie.status === 'now-showing' ? (
                                        <TouchableOpacity style={styles.bookButton} onPress={() => router.push('/booking')}>
                                            <Text style={styles.bookButtonText}>Đặt vé</Text>
                                        </TouchableOpacity>
                                    ) : (
                                        <View style={styles.releaseInfo}>
                                            <Text style={styles.releaseDate}>📅 {movie.releaseDate}</Text>
                                        </View>
                                    )}
                                </View>
                            </TouchableOpacity>
                        ))}
                    </View>
                )}
            </ScrollView>
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
    movieGrid: {
        flex: 1,
    },
    gridContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 16,
    },
    movieCard: {
        width: '47%',
        marginBottom: 8,
    },
    movieGridContent: {
        padding: 20,
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