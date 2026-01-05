import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Image,
    TouchableOpacity,
    TextInput,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../theme';
import { useAuthStore, useGemsStore } from '../../store';
import {
    PlusIcon,
    SettingsIcon,
    EditIcon,
    EyeIcon,
    GemIcon,
    StarIcon,
} from '../../components/Icons';

const ProfileScreen: React.FC = () => {
    const { colors, primary, secondary, spacing, borderRadius, typography, shadows, specialShadows, isDark } = useTheme();
    const navigation = useNavigation();
    const insets = useSafeAreaInsets();
    const { user, updateUser } = useAuthStore();
    const { gemsBalance } = useGemsStore();

    const photos = user?.photos || [];
    const mainPhoto = photos.find((p) => p.isMain)?.url;
    const mediaCount = photos.length;

    const [isEditingBio, setIsEditingBio] = useState(false);
    const [bioText, setBioText] = useState(user?.bio || '');

    const handleEditPress = () => {
        navigation.navigate('EditProfile' as never);
    };

    const handlePreviewPress = () => {
        navigation.navigate('PreviewProfile' as never);
    };

    const handleSettingsPress = () => {
        navigation.navigate('Settings' as never);
    };

    const handleMediaPress = () => {
        navigation.navigate('ManageMedia' as never);
    };

    const handleGemsPress = () => {
        navigation.navigate('GemsAndBoosters' as never);
    };

    const handleBioSave = () => {
        updateUser({ bio: bioText });
        setIsEditingBio(false);
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            {/* Header */}
            <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
                <View style={styles.headerSide} />

                <View style={styles.headerCenter}>
                    <Text style={[typography.h2, { color: colors.text }]}>Profile</Text>
                </View>

                <View style={[styles.headerSide, { alignItems: 'flex-end' }]}>
                    <TouchableOpacity
                        style={[styles.headerIcon, { padding: spacing.xs }]}
                        onPress={handleSettingsPress}
                    >
                        <SettingsIcon size={22} color={colors.text} />
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* Profile Info Section */}
                <View style={[
                    styles.profileSection,
                    {
                        backgroundColor: colors.card,
                        marginHorizontal: spacing.base,
                        padding: spacing.lg,
                        borderRadius: borderRadius.lg,
                    }
                ]}>
                    <View style={styles.profileRow}>
                        {/* Avatar with online indicator */}
                        <View style={styles.avatarWrapper}>
                            {mainPhoto ? (
                                <Image source={{ uri: mainPhoto }} style={styles.avatar} />
                            ) : (
                                <View style={[styles.avatar, { backgroundColor: colors.surface }]}>
                                    <Text style={styles.avatarPlaceholder}>👤</Text>
                                </View>
                            )}
                            <View style={[
                                styles.onlineIndicator,
                                { backgroundColor: '#22C55E', borderColor: colors.card }
                            ]} />
                        </View>

                        {/* Action buttons */}
                        <View style={[styles.profileInfo, { marginLeft: spacing.base }]}>
                            <View style={[styles.actionButtons, { gap: spacing.sm }]}>
                                <TouchableOpacity
                                    style={[
                                        styles.actionButton,
                                        {
                                            backgroundColor: primary.main,
                                            paddingHorizontal: spacing.base,
                                            paddingVertical: spacing.sm,
                                            borderRadius: borderRadius.button,
                                        }
                                    ]}
                                    onPress={handleEditPress}
                                >
                                    <EditIcon size={14} color="#FFFFFF" />
                                    <Text style={[typography.labelSmall, styles.actionButtonText]}>
                                        Edit
                                    </Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[
                                        styles.actionButton,
                                        {
                                            backgroundColor: isDark ? colors.elevated : colors.text,
                                            paddingHorizontal: spacing.base,
                                            paddingVertical: spacing.sm,
                                            borderRadius: borderRadius.button,
                                        }
                                    ]}
                                    onPress={handlePreviewPress}
                                >
                                    <EyeIcon size={14} color="#FFFFFF" />
                                    <Text style={[typography.labelSmall, styles.actionButtonText]}>
                                        Preview
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Media Section */}
                <View style={[styles.mediaSection, { marginTop: spacing.xl, paddingHorizontal: spacing.base }]}>
                    <Text style={[typography.h4, { color: colors.text, marginBottom: spacing.md }]}>
                        {mediaCount} Media
                    </Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.mediaScroll}>
                        {/* Add Media Button */}
                        <TouchableOpacity
                            style={[
                                styles.addMediaButton,
                                {
                                    borderColor: primary.main,
                                    backgroundColor: `${primary.main}08`,
                                    borderRadius: borderRadius.base,
                                    marginRight: spacing.sm,
                                }
                            ]}
                            onPress={handleMediaPress}
                        >
                            <PlusIcon size={32} color={primary.main} />
                        </TouchableOpacity>

                        {/* Existing Photos */}
                        {photos.map((photo, index) => (
                            <TouchableOpacity
                                key={`photo-${index}`}
                                style={[styles.mediaItem, { marginRight: spacing.sm }]}
                                onPress={handleMediaPress}
                            >
                                <Image
                                    source={{ uri: photo.url }}
                                    style={[styles.mediaImage, { borderRadius: borderRadius.base }]}
                                />
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>

                {/* Bio Section */}
                <View style={[styles.bioSection, { marginTop: spacing.xl, paddingHorizontal: spacing.base }]}>
                    <View style={styles.bioHeader}>
                        <Text style={[typography.label, { color: primary.main }]}>Bio</Text>
                    </View>
                    <View style={[
                        styles.bioCard,
                        {
                            backgroundColor: isDark ? colors.surface : '#F3F4F6',
                            padding: spacing.base,
                            borderRadius: borderRadius.base,
                        }
                    ]}>
                        <Text style={[
                            typography.body,
                            { color: user?.bio ? colors.text : colors.textMuted, lineHeight: 22 }
                        ]}>
                            {user?.bio || 'Tell others about yourself...'}
                        </Text>
                    </View>
                </View>

                {/* Upgrade Section */}
                <View style={[styles.upgradeSection, { marginTop: spacing['2xl'], paddingHorizontal: spacing.base }]}>
                    <View style={[styles.upgradeTitleRow, { gap: spacing.xs, marginBottom: spacing.md }]}>
                        <Text style={[typography.h4, { color: colors.text }]}>Upgrade</Text>
                        <StarIcon size={20} color={secondary.main} />
                    </View>

                    <TouchableOpacity
                        style={[
                            styles.gemsCard,
                            { borderRadius: borderRadius.lg, overflow: 'hidden' }
                        ]}
                        onPress={handleGemsPress}
                    >
                        <View style={[
                            styles.gemsCardContent,
                            { padding: spacing.base }
                        ]}>
                            <View style={[
                                styles.gemsIconWrapper,
                                {
                                    width: 48,
                                    height: 48,
                                    borderRadius: 24,
                                    backgroundColor: 'rgba(255,255,255,0.2)',
                                }
                            ]}>
                                <GemIcon size={28} animated />
                            </View>
                            <View style={[styles.gemsInfo, { marginLeft: spacing.md }]}>
                                <Text style={[typography.label, { color: '#FFFFFF' }]}>
                                    Your gems: <Text style={{ fontWeight: 'bold' }}>{gemsBalance}</Text>
                                </Text>
                                <Text style={[
                                    typography.caption,
                                    { color: 'rgba(255,255,255,0.8)', marginTop: 2 }
                                ]}>
                                    Use them to make even more friends.
                                </Text>
                            </View>
                            <View style={[
                                styles.gemsArrow,
                                {
                                    width: 36,
                                    height: 36,
                                    borderRadius: 18,
                                    backgroundColor: 'rgba(255,255,255,0.2)',
                                }
                            ]}>
                                <Ionicons name="chevron-forward" size={24} color="#FFFFFF" />
                            </View>
                        </View>
                    </TouchableOpacity>
                </View>

                <View style={{ height: spacing['3xl'] }} />
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingBottom: 8,
    },
    headerSide: {
        minWidth: 72,
        alignItems: 'flex-start',
    },
    headerCenter: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerIcon: {},
    content: {
        flex: 1,
    },
    profileSection: {},
    profileRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatarWrapper: {
        position: 'relative',
    },
    avatar: {
        width: 70,
        height: 70,
        borderRadius: 35,
    },
    avatarPlaceholder: {
        fontSize: 32,
    },
    onlineIndicator: {
        position: 'absolute',
        bottom: 2,
        right: 2,
        width: 18,
        height: 18,
        borderRadius: 9,
        borderWidth: 3,
    },
    profileInfo: {
        flex: 1,
    },
    actionButtons: {
        flexDirection: 'row',
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    actionButtonText: {
        color: '#FFFFFF',
    },
    mediaSection: {},
    mediaScroll: {
        flexDirection: 'row',
    },
    addMediaButton: {
        width: 100,
        height: 178,
        borderWidth: 2,
        borderStyle: 'dashed',
        justifyContent: 'center',
        alignItems: 'center',
    },
    mediaItem: {},
    mediaImage: {
        width: 100,
        height: 178,
    },
    bioSection: {},
    bioHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    bioCard: {},
    upgradeSection: {},
    upgradeTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    gemsCard: {},
    gemsCardContent: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(168, 85, 247, 0.95)',
    },
    gemsIconWrapper: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    gemsInfo: {
        flex: 1,
    },
    gemsArrow: {
        justifyContent: 'center',
        alignItems: 'center',
    },
});

export default ProfileScreen;
