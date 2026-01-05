import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Modal,
    FlatList,
    TextInput,
    Alert,
    Linking,
    Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, ThemeMode } from '../../theme';
import { useAuthStore } from '../../store';

// URLs for legal pages
const URLS = {
    TERMS: 'https://minglr.app/terms',
    PRIVACY: 'https://minglr.app/privacy',
    COMMUNITY: 'https://minglr.app/community-guidelines',
};

const APP_VERSION = '4.4.5';
const SUPPORT_EMAIL = 'dev.sandip999@gmail.com';

interface BlockedUser {
    _id: string;
    name: string;
    photo?: string;
}

type SettingOption = {
    id: string;
    title: string;
    icon: keyof typeof Ionicons.glyphMap;
    action: () => void;
    color?: string;
    showChevron?: boolean;
};

const SettingsScreen: React.FC = () => {
    const { colors, primaryColor, primary, mode, setTheme, isDark } = useTheme();
    const navigation = useNavigation();
    const { user, logout } = useAuthStore();

    // Modal states
    const [showThemeModal, setShowThemeModal] = useState(false);
    const [showBlockedUsersModal, setShowBlockedUsersModal] = useState(false);
    const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([]);
    const [searchQuery, setSearchQuery] = useState('');

    // Theme options
    const themeOptions = [
        { value: 'light' as ThemeMode, label: 'Light Mode', icon: 'sunny' as const },
        { value: 'dark' as ThemeMode, label: 'Dark Mode', icon: 'moon' as const },
        { value: 'system' as ThemeMode, label: 'Same as System', icon: 'phone-portrait' as const },
    ];

    // Handle theme selection
    const handleThemeSelect = (newMode: ThemeMode) => {
        setTheme(newMode);
        setShowThemeModal(false);
    };

    // Handle opening notification settings
    const openNotificationSettings = () => {
        if (Platform.OS === 'ios') {
            Linking.openURL('app-settings:');
        } else if (Platform.OS === 'android') {
            Linking.openSettings();
        } else {
            Alert.alert('Notification Settings', 'Please manage notifications in your browser settings.');
        }
    };

    // Handle opening URLs
    const openURL = async (url: string) => {
        try {
            const supported = await Linking.canOpenURL(url);
            if (supported) {
                await Linking.openURL(url);
            } else {
                Alert.alert('Error', 'Cannot open this URL');
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to open URL');
        }
    };

    // Handle contact support
    const contactSupport = async () => {
        const platform = Platform.OS === 'ios'
            ? `iOS Version (iOS ${Platform.Version})`
            : Platform.OS === 'android'
                ? `Android Version (Android ${Platform.Version})`
                : 'Web';

        const userId = user?._id || 'Unknown';

        const body = `

---------------------
Don't edit below this line 👀

minglr ID: ${userId}
platform: ${platform}
Minglr Version: ${APP_VERSION}`;

        const subject = 'Minglr Support Request';
        const mailtoUrl = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

        try {
            await Linking.openURL(mailtoUrl);
        } catch (error) {
            Alert.alert('Error', 'Could not open email app. Please email us at ' + SUPPORT_EMAIL);
        }
    };

    // Handle logout
    const handleLogout = () => {
        Alert.alert(
            'Logout',
            'Are you sure you want to logout?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Logout',
                    style: 'destructive',
                    onPress: async () => {
                        await logout();
                    }
                },
            ]
        );
    };

    // Handle delete account (placeholder)
    const handleDeleteAccount = () => {
        Alert.alert(
            'Delete Account',
            'This feature is coming soon. Please contact support if you need to delete your account.',
            [{ text: 'OK' }]
        );
    };

    // Handle unblock user
    const handleUnblock = (userId: string) => {
        Alert.alert(
            'Unblock User',
            'Are you sure you want to unblock this user?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Unblock',
                    onPress: () => {
                        setBlockedUsers(blockedUsers.filter(u => u._id !== userId));
                        // TODO: API call to unblock user
                    }
                },
            ]
        );
    };

    // Filter blocked users by search query
    const filteredBlockedUsers = blockedUsers.filter(u =>
        u.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Settings options
    const settingsOptions: SettingOption[] = [
        {
            id: 'theme',
            title: 'App Theme',
            icon: 'color-palette',
            action: () => setShowThemeModal(true),
            showChevron: true,
        },
        {
            id: 'language',
            title: 'Language',
            icon: 'language',
            action: () => Alert.alert('Coming Soon', 'Language settings will be available soon!'),
            showChevron: true,
        },
        {
            id: 'blocked',
            title: 'Blocked Users',
            icon: 'ban',
            action: () => setShowBlockedUsersModal(true),
            showChevron: true,
        },
        {
            id: 'notifications',
            title: 'Notification Settings',
            icon: 'notifications',
            action: openNotificationSettings,
            showChevron: true,
        },
        {
            id: 'terms',
            title: 'Terms of Services',
            icon: 'document-text',
            action: () => openURL(URLS.TERMS),
            showChevron: true,
        },
        {
            id: 'privacy',
            title: 'Privacy Policy',
            icon: 'shield-checkmark',
            action: () => openURL(URLS.PRIVACY),
            showChevron: true,
        },
        {
            id: 'community',
            title: 'Community Guidelines',
            icon: 'people-circle',
            action: () => openURL(URLS.COMMUNITY),
            showChevron: true,
        },
        {
            id: 'support',
            title: 'Contact Support',
            icon: 'mail',
            action: contactSupport,
            showChevron: true,
        },
        {
            id: 'logout',
            title: 'Logout',
            icon: 'log-out',
            action: handleLogout,
            color: '#EF4444',
        },
        {
            id: 'delete',
            title: 'Delete My Account',
            icon: 'trash',
            action: handleDeleteAccount,
            color: '#EF4444',
        },
    ];

    const renderSettingItem = (option: SettingOption) => (
        <TouchableOpacity
            key={option.id}
            style={[styles.settingItem, { backgroundColor: colors.card }]}
            onPress={option.action}
        >
            <View style={[styles.iconContainer, { backgroundColor: `${option.color || primaryColor}15` }]}>
                <Ionicons
                    name={option.icon}
                    size={22}
                    color={option.color || primaryColor}
                />
            </View>
            <Text style={[
                styles.settingTitle,
                { color: option.color || colors.text }
            ]}>
                {option.title}
            </Text>
            {option.showChevron && (
                <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
            )}
        </TouchableOpacity>
    );

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            {/* Header */}
            <View style={[styles.header, { backgroundColor: colors.background }]}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="chevron-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text }]}>Settings</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* Main Settings */}
                <View style={styles.section}>
                    {settingsOptions.slice(0, 4).map(renderSettingItem)}
                </View>

                {/* Legal Section */}
                <Text style={[styles.sectionHeader, { color: colors.textMuted }]}>Legal</Text>
                <View style={styles.section}>
                    {settingsOptions.slice(4, 7).map(renderSettingItem)}
                </View>

                {/* Support Section */}
                <Text style={[styles.sectionHeader, { color: colors.textMuted }]}>Support</Text>
                <View style={styles.section}>
                    {settingsOptions.slice(7, 8).map(renderSettingItem)}
                </View>

                {/* Account Section */}
                <Text style={[styles.sectionHeader, { color: colors.textMuted }]}>Account</Text>
                <View style={styles.section}>
                    {settingsOptions.slice(8).map(renderSettingItem)}
                </View>

                {/* Version Info */}
                <Text style={[styles.versionText, { color: colors.textMuted }]}>
                    Minglr v{APP_VERSION}
                </Text>

                <View style={{ height: 40 }} />
            </ScrollView>

            {/* Theme Modal */}
            <Modal
                visible={showThemeModal}
                transparent
                animationType="slide"
                statusBarTranslucent={true}
                onRequestClose={() => setShowThemeModal(false)}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setShowThemeModal(false)}
                >
                    <View style={styles.modalContainer}>
                        <TouchableOpacity activeOpacity={1} onPress={(e) => e.stopPropagation()}>
                            <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
                                <View style={styles.modalHandle} />
                                <Text style={[styles.modalTitle, { color: colors.text }]}>App Theme</Text>

                                {themeOptions.map((option) => (
                                    <TouchableOpacity
                                        key={option.value}
                                        style={[
                                            styles.themeOption,
                                            { backgroundColor: isDark ? colors.elevated : '#f6f6f6' },
                                            mode === option.value && {
                                                borderColor: primaryColor,
                                                borderWidth: 3,
                                            }
                                        ]}
                                        onPress={() => handleThemeSelect(option.value)}
                                    >
                                        <Ionicons
                                            name={option.icon}
                                            size={24}
                                            color={mode === option.value ? primaryColor : colors.text}
                                        />
                                        <Text style={[
                                            styles.themeOptionText,
                                            { color: mode === option.value ? primaryColor : colors.text }
                                        ]}>
                                            {option.label}
                                        </Text>
                                        {mode === option.value && (
                                            <Ionicons name="checkmark-circle" size={24} color={primaryColor} />
                                        )}
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </Modal>

            {/* Blocked Users Modal */}
            <Modal
                visible={showBlockedUsersModal}
                transparent
                animationType="slide"
                onRequestClose={() => setShowBlockedUsersModal(false)}
            >
                <View style={[styles.fullModal, { backgroundColor: colors.background }]}>
                    {/* Header */}
                    <View style={[styles.blockedHeader, { backgroundColor: colors.background }]}>
                        <TouchableOpacity onPress={() => setShowBlockedUsersModal(false)}>
                            <Ionicons name="chevron-back" size={24} color={colors.text} />
                        </TouchableOpacity>
                        <Text style={[styles.blockedHeaderTitle, { color: colors.text }]}>Blocked Users</Text>
                        <View style={{ width: 24 }} />
                    </View>

                    {/* Search */}
                    <View style={[styles.searchContainer, { backgroundColor: colors.card }]}>
                        <Ionicons name="search" size={20} color={colors.textMuted} />
                        <TextInput
                            style={[styles.searchInput, { color: colors.text }]}
                            placeholder="Search by name"
                            placeholderTextColor={colors.textMuted}
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                        />
                    </View>

                    {/* Blocked Users List */}
                    {blockedUsers.length === 0 ? (
                        <View style={styles.emptyContainer}>
                            <Ionicons name="ban-outline" size={48} color={colors.textMuted} />
                            <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                                No blocked users
                            </Text>
                        </View>
                    ) : (
                        <FlatList
                            data={filteredBlockedUsers}
                            keyExtractor={(item) => item._id}
                            renderItem={({ item }) => (
                                <View style={[styles.blockedUserItem, { backgroundColor: colors.card }]}>
                                    <View style={styles.blockedUserAvatar}>
                                        <Ionicons name="person" size={24} color={colors.textMuted} />
                                    </View>
                                    <Text style={[styles.blockedUserName, { color: colors.text }]}>
                                        {item.name}
                                    </Text>
                                    <TouchableOpacity
                                        style={[styles.unblockButton, { backgroundColor: primaryColor }]}
                                        onPress={() => handleUnblock(item._id)}
                                    >
                                        <Text style={styles.unblockButtonText}>Unblock</Text>
                                    </TouchableOpacity>
                                </View>
                            )}
                        />
                    )}
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        paddingTop: 50,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '700',
    },
    content: {
        flex: 1,
        padding: 16,
    },
    section: {
        marginBottom: 16,
        borderRadius: 12,
        overflow: 'hidden',
    },
    sectionHeader: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 8,
        marginTop: 8,
        marginLeft: 4,
    },
    settingItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 0.5,
        borderBottomColor: 'rgba(0,0,0,0.1)',
    },
    iconContainer: {
        width: 36,
        height: 36,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    settingTitle: {
        flex: 1,
        fontSize: 16,
        fontWeight: '500',
    },
    versionText: {
        textAlign: 'center',
        fontSize: 13,
        marginTop: 24,
    },
    // Modal styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContainer: {
        width: '100%',
    },
    modalContent: {
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 20,
        paddingBottom: 40,
    },
    modalHandle: {
        width: 40,
        height: 4,
        borderRadius: 2,
        backgroundColor: '#D1D1D6',
        alignSelf: 'center',
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '700',
        marginBottom: 20,
        textAlign: 'center',
    },
    themeOption: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        borderWidth: 2,
        borderColor: 'transparent',
    },
    themeOptionText: {
        flex: 1,
        fontSize: 16,
        fontWeight: '500',
        marginLeft: 12,
    },
    // Blocked Users Modal
    fullModal: {
        flex: 1,
    },
    blockedHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        paddingTop: 50,
    },
    blockedHeaderTitle: {
        fontSize: 20,
        fontWeight: '700',
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        margin: 16,
        padding: 12,
        borderRadius: 12,
    },
    searchInput: {
        flex: 1,
        marginLeft: 8,
        fontSize: 16,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyText: {
        fontSize: 16,
        marginTop: 12,
    },
    blockedUserItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        marginHorizontal: 16,
        marginBottom: 8,
        borderRadius: 12,
    },
    blockedUserAvatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#f6f6f6',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    blockedUserName: {
        flex: 1,
        fontSize: 16,
        fontWeight: '500',
    },
    unblockButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
    },
    unblockButtonText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '600',
    },
});

export default SettingsScreen;
