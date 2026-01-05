import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Image,
    Dimensions,
    TouchableOpacity,
    Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme';
import { useAuthStore } from '../../store';
import { countries, Country } from '../../utils/countries';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const CARD_MARGIN = 10;
const CARD_WIDTH = SCREEN_WIDTH - CARD_MARGIN * 2;
const CARD_HEIGHT = SCREEN_HEIGHT * 0.78;

const PreviewProfileScreen: React.FC = () => {
    const { colors, primaryColor } = useTheme();
    const navigation = useNavigation();
    const { user } = useAuthStore();
    const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);

    if (!user) {
        return (
            <View style={[styles.container, { backgroundColor: colors.background }]}>
                <Text style={{ color: colors.text }}>Loading...</Text>
            </View>
        );
    }

    const photos = user.photos && user.photos.length > 0
        ? user.photos
        : [{ url: '', order: 0, isMain: true, isVerified: false }];

    // Get country flag
    const countryData = countries.find((c: Country) => c.code === user.country || c.name === user.country);
    const countryFlag = countryData?.flag || '🌍';
    const countryCode = countryData?.code || user.country;

    const nextPhoto = () => {
        if (photos.length > 1) {
            setCurrentPhotoIndex((currentPhotoIndex + 1) % photos.length);
        }
    };

    const prevPhoto = () => {
        if (photos.length > 1) {
            setCurrentPhotoIndex((currentPhotoIndex - 1 + photos.length) % photos.length);
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            {/* Header */}
            <View style={styles.header}>
                <View style={{ width: 24 }} />
                <Text style={[styles.headerTitle, { color: colors.text }]}>Profile Preview</Text>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="close" size={24} color={colors.text} />
                </TouchableOpacity>
            </View>

            {/* Card */}
            <View style={styles.cardContainer}>
                <View style={[styles.card, { backgroundColor: colors.card }]}>
                    {/* Photo */}
                    <View style={styles.photoContainer}>
                        {photos[currentPhotoIndex]?.url ? (
                            <Image
                                source={{ uri: photos[currentPhotoIndex].url }}
                                style={styles.photo}
                                resizeMode="cover"
                            />
                        ) : (
                            <View style={[styles.photo, { backgroundColor: colors.surface }]}>
                                <Ionicons name="person" size={64} color={colors.textMuted} />
                            </View>
                        )}

                        {/* Photo indicators */}
                        {photos.length > 1 && (
                            <View style={styles.photoIndicators}>
                                {photos.map((_, index) => (
                                    <View
                                        key={index}
                                        style={[
                                            styles.indicator,
                                            {
                                                backgroundColor:
                                                    index === currentPhotoIndex
                                                        ? '#FFFFFF'
                                                        : 'rgba(255,255,255,0.5)',
                                            },
                                        ]}
                                    />
                                ))}
                            </View>
                        )}

                        {/* Photo navigation areas */}
                        <TouchableOpacity
                            style={styles.photoNavLeft}
                            onPress={prevPhoto}
                            activeOpacity={1}
                        />
                        <TouchableOpacity
                            style={styles.photoNavRight}
                            onPress={nextPhoto}
                            activeOpacity={1}
                        />

                        {/* User info - Top left */}
                        <View style={styles.userInfo}>
                            <View style={styles.nameRow}>
                                <Text style={styles.userName}>{user.name}</Text>
                                {user.onlineStatus?.isOnline && (
                                    <View style={styles.onlineIndicator} />
                                )}
                            </View>
                            <View style={[styles.countryBadge, { backgroundColor: primaryColor }]}>
                                <Text style={styles.countryFlag}>{countryFlag}</Text>
                                <Text style={styles.countryText}>{countryCode}, {user.age}</Text>
                            </View>
                        </View>

                        {/* Bio at bottom */}
                        {user.bio && (
                            <View style={styles.bioContainer}>
                                <Text style={styles.bioText} numberOfLines={3}>{user.bio}</Text>
                            </View>
                        )}
                    </View>
                </View>
            </View>

            {/* Preview note */}
            <View style={styles.noteContainer}>
                <Text style={[styles.noteText, { color: colors.textMuted }]}>
                    This is how others see your profile
                </Text>
            </View>
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
        fontWeight: '600',
    },
    cardContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    noteContainer: {
        paddingVertical: 16,
        alignItems: 'center',
        paddingBottom: Platform.OS === 'ios' ? 30 : 20,
    },
    noteText: {
        fontSize: 14,
    },
    card: {
        width: CARD_WIDTH,
        height: CARD_HEIGHT,
        borderRadius: 20,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 8,
    },
    photoContainer: {
        width: '100%',
        height: '100%',
        position: 'relative',
    },
    photo: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    photoIndicators: {
        position: 'absolute',
        top: 12,
        left: 16,
        right: 16,
        flexDirection: 'row',
        gap: 4,
    },
    indicator: {
        flex: 1,
        height: 3,
        borderRadius: 2,
    },
    photoNavLeft: {
        position: 'absolute',
        left: 0,
        top: 60,
        bottom: 80,
        width: '40%',
    },
    photoNavRight: {
        position: 'absolute',
        right: 0,
        top: 60,
        bottom: 80,
        width: '40%',
    },
    userInfo: {
        position: 'absolute',
        top: 28,
        left: 16,
    },
    nameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    userName: {
        fontSize: 26,
        fontWeight: 'bold',
        color: '#FFFFFF',
        textShadowColor: 'rgba(0,0,0,0.5)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 3,
    },
    onlineIndicator: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: '#4CAF50',
        borderWidth: 2,
        borderColor: '#FFFFFF',
    },
    countryBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 6,
        marginTop: 6,
        alignSelf: 'flex-start',
    },
    countryFlag: {
        fontSize: 14,
        marginRight: 6,
    },
    countryText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    bioContainer: {
        position: 'absolute',
        bottom: 16,
        left: 16,
        right: 16,
        backgroundColor: 'rgba(0,0,0,0.5)',
        borderRadius: 12,
        padding: 12,
    },
    bioText: {
        fontSize: 14,
        color: '#FFFFFF',
        lineHeight: 20,
    },
});

export default PreviewProfileScreen;
