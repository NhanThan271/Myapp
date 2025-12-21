import { useAuth } from '@/components/contexts/AuthContext';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';

export default function ProfileScreen() {
    const { logout } = useAuth();
    const [notificationsEnabled, setNotificationsEnabled] = useState(true);
    const [darkModeEnabled, setDarkModeEnabled] = useState(true);

    const handleLogout = () => {
        // Call logout from AuthContext
        logout();
        // Navigate to login screen
        router.replace('/(auth)/login');
    };

    // Mock user data
    const user = {
        name: 'Thân Trường Nhạn',
        email: 'nhan@email.com',
        phone: '0123 456 789',
        memberSince: 'Tháng 1, 2023',
        points: 1250,
    };

    const menuItems = [
        {
            id: 1,
            icon: '🎫',
            title: 'Vé của tôi',
            subtitle: 'Xem lịch sử đặt vé',
            onPress: () => router.push('/(ticket)/myticket'),
        },
        {
            id: 2,
            icon: '❤️',
            title: 'Danh sách yêu thích',
            subtitle: 'Phim đã lưu',
            onPress: () => { },
        },
        {
            id: 3,
            icon: '💳',
            title: 'Phương thức thanh toán',
            subtitle: 'Quản lý thẻ và ví',
            onPress: () => { },
        },
        {
            id: 4,
            icon: '🎁',
            title: 'Ưu đãi của tôi',
            subtitle: 'Mã giảm giá & voucher',
            onPress: () => { },
        },
        {
            id: 5,
            icon: '⭐',
            title: 'Điểm thưởng',
            subtitle: `${user.points} điểm`,
            onPress: () => { },
        },
    ];

    const settingsItems = [
        {
            id: 1,
            icon: '🔔',
            title: 'Thông báo',
            type: 'switch',
            value: notificationsEnabled,
            onValueChange: setNotificationsEnabled,
        },
        {
            id: 2,
            icon: '🌙',
            title: 'Chế độ tối',
            type: 'switch',
            value: darkModeEnabled,
            onValueChange: setDarkModeEnabled,
        },
        {
            id: 3,
            icon: '🌍',
            title: 'Ngôn ngữ',
            type: 'link',
            value: 'Tiếng Việt',
            onPress: () => { },
        },
        {
            id: 4,
            icon: '🔒',
            title: 'Bảo mật',
            type: 'link',
            onPress: () => { },
        },
    ];

    return (
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
            {/* Header */}
            <ThemedView style={styles.header}>
                <ThemedText type="title" style={styles.headerTitle}>Tài khoản</ThemedText>
            </ThemedView>

            {/* Profile Card */}
            <View style={styles.profileCard}>
                <View style={styles.profileHeader}>
                    <Image
                        source={require('@/assets/images/avatar.jpg')}
                        style={styles.avatar}
                        contentFit="cover"
                    />
                    <View style={styles.profileInfo}>
                        <Text style={styles.userName}>{user.name}</Text>
                        <Text style={styles.userEmail}>{user.email}</Text>
                        <Text style={styles.memberSince}>Thành viên từ {user.memberSince}</Text>
                    </View>
                </View>

                <TouchableOpacity style={styles.editButton}>
                    <Text style={styles.editButtonText}>Chỉnh sửa hồ sơ</Text>
                </TouchableOpacity>
            </View>

            {/* Stats */}
            <View style={styles.statsContainer}>
                <View style={styles.statBox}>
                    <Text style={styles.statValue}>24</Text>
                    <Text style={styles.statLabel}>Vé đã đặt</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statBox}>
                    <Text style={styles.statValue}>{user.points}</Text>
                    <Text style={styles.statLabel}>Điểm thưởng</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statBox}>
                    <Text style={styles.statValue}>12</Text>
                    <Text style={styles.statLabel}>Yêu thích</Text>
                </View>
            </View>

            {/* Menu Items */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Tài khoản</Text>
                <View style={styles.menuList}>
                    {menuItems.map((item) => (
                        <TouchableOpacity
                            key={item.id}
                            style={styles.menuItem}
                            onPress={item.onPress}
                        >
                            <View style={styles.menuItemLeft}>
                                <Text style={styles.menuIcon}>{item.icon}</Text>
                                <View>
                                    <Text style={styles.menuTitle}>{item.title}</Text>
                                    <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
                                </View>
                            </View>
                            <Text style={styles.chevron}>›</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            {/* Settings */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Cài đặt</Text>
                <View style={styles.menuList}>
                    {settingsItems.map((item) => (
                        <View key={item.id} style={styles.menuItem}>
                            <View style={styles.menuItemLeft}>
                                <Text style={styles.menuIcon}>{item.icon}</Text>
                                <Text style={styles.menuTitle}>{item.title}</Text>
                            </View>
                            {item.type === 'switch' ? (
                                <Switch
                                    //value={item.value}
                                    onValueChange={item.onValueChange}
                                    trackColor={{ false: '#333', true: '#E50914' }}
                                    thumbColor="#fff"
                                />
                            ) : (
                                <TouchableOpacity
                                    style={styles.menuItemRight}
                                    onPress={item.onPress}
                                >
                                    {item.value && <Text style={styles.menuValue}>{item.value}</Text>}
                                    <Text style={styles.chevron}>›</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    ))}
                </View>
            </View>

            {/* Support */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Hỗ trợ</Text>
                <View style={styles.menuList}>
                    <TouchableOpacity style={styles.menuItem}>
                        <View style={styles.menuItemLeft}>
                            <Text style={styles.menuIcon}>❓</Text>
                            <Text style={styles.menuTitle}>Trung tâm trợ giúp</Text>
                        </View>
                        <Text style={styles.chevron}>›</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.menuItem}>
                        <View style={styles.menuItemLeft}>
                            <Text style={styles.menuIcon}>📧</Text>
                            <Text style={styles.menuTitle}>Liên hệ hỗ trợ</Text>
                        </View>
                        <Text style={styles.chevron}>›</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.menuItem}>
                        <View style={styles.menuItemLeft}>
                            <Text style={styles.menuIcon}>📄</Text>
                            <Text style={styles.menuTitle}>Điều khoản & Chính sách</Text>
                        </View>
                        <Text style={styles.chevron}>›</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.menuItem}>
                        <View style={styles.menuItemLeft}>
                            <Text style={styles.menuIcon}>ℹ️</Text>
                            <Text style={styles.menuTitle}>Về chúng tôi</Text>
                        </View>
                        <Text style={styles.chevron}>›</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Logout Button */}
            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                <Text style={styles.logoutIcon}>🚪</Text>
                <Text style={styles.logoutText}>Đăng xuất</Text>
            </TouchableOpacity>

            {/* Version */}
            <Text style={styles.version}>Version 1.0.0</Text>

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
        paddingTop: 60,
        paddingHorizontal: 20,
        paddingBottom: 16,
        backgroundColor: '#111',
    },
    headerTitle: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#fff',
    },
    profileCard: {
        backgroundColor: '#111',
        margin: 20,
        padding: 20,
        borderRadius: 16,
    },
    profileHeader: {
        flexDirection: 'row',
        marginBottom: 16,
    },
    avatar: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#222',
    },
    profileInfo: {
        flex: 1,
        marginLeft: 16,
        justifyContent: 'center',
    },
    userName: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 4,
    },
    userEmail: {
        fontSize: 14,
        color: '#999',
        marginBottom: 4,
    },
    memberSince: {
        fontSize: 12,
        color: '#666',
    },
    editButton: {
        backgroundColor: '#222',
        paddingVertical: 12,
        borderRadius: 10,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#333',
    },
    editButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
    statsContainer: {
        flexDirection: 'row',
        backgroundColor: '#111',
        marginHorizontal: 20,
        marginBottom: 20,
        padding: 20,
        borderRadius: 16,
    },
    statBox: {
        flex: 1,
        alignItems: 'center',
    },
    statValue: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#E50914',
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 12,
        color: '#999',
    },
    statDivider: {
        width: 1,
        backgroundColor: '#222',
        marginHorizontal: 8,
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#999',
        paddingHorizontal: 20,
        marginBottom: 12,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    menuList: {
        backgroundColor: '#111',
        marginHorizontal: 20,
        borderRadius: 16,
        overflow: 'hidden',
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#222',
    },
    menuItemLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    menuIcon: {
        fontSize: 24,
        marginRight: 16,
        width: 32,
        textAlign: 'center',
    },
    menuTitle: {
        fontSize: 15,
        color: '#fff',
        fontWeight: '500',
    },
    menuSubtitle: {
        fontSize: 13,
        color: '#666',
        marginTop: 2,
    },
    menuItemRight: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    menuValue: {
        fontSize: 14,
        color: '#999',
        marginRight: 8,
    },
    chevron: {
        fontSize: 24,
        color: '#666',
        fontWeight: '300',
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#222',
        marginHorizontal: 20,
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E50914',
        marginBottom: 16,
    },
    logoutIcon: {
        fontSize: 20,
        marginRight: 8,
    },
    logoutText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#E50914',
    },
    version: {
        textAlign: 'center',
        color: '#666',
        fontSize: 12,
        marginBottom: 8,
    },
    bottomSpacing: {
        height: 40,
    },
});