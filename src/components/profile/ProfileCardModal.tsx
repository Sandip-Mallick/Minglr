import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    Image,
    TouchableOpacity,
    Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme';
import { countries, Country } from '../../utils/countries';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const CARD_MARGIN = 10;
const CARD_WIDTH = SCREEN_WIDTH - CARD_MARGIN * 2;
const CARD_HEIGHT = SCREEN_HEIGHT * 0.72;

interface Photo {
    url: string;
    isMain: boolean;
    isVerified?: boolean;
}

interface ProfileUser {
    _id: string;
    name: string;
    age: number;
    country: string;
    bio?: string;
    photos: Photo[];
    onlineStatus?: { isOnline: boolean };
}

interface ProfileCardModalProps {
    visible: boolean;
    user: ProfileUser | null;
    onClose: () => void;
}

export const ProfileCardModal: React.FC<ProfileCardModalProps> = ({
    visible,
    user,
    onClose,
}) => {
    const { colors } = useTheme();
    const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);

    if (!user) return null;

    const photos = user.photos.length > 0 ? user.photos : [{ url: '', isMain: true, isVerified: false }];

    // Get country flag
    const countryData = countries.find((c: Country) => c.code === user.country || c.name === user.country);
    const countryFlag = countryData?.flag || '🌍';
    const countryCode = countryData?.code || user.country;

    const nextPhoto = () => {
        if (currentPhotoIndex < photos.length - 1) {
            setCurrentPhotoIndex(currentPhotoIndex + 1);
        }
    };

    const prevPhoto = () => {
        if (currentPhotoIndex > 0) {
            setCurrentPhotoIndex(currentPhotoIndex - 1);
        }
    };

    const handleClose = () => {
        setCurrentPhotoIndex(0);
        onClose();
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={handleClose}
        >
            <View style={styles.modalOverlay}>
                <TouchableOpacity
                    style={styles.backdrop}
                    activeOpacity={1}
                    onPress={handleClose}
                />

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

                        {/* Close button - Top left */}
                        <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
                            <Ionicons name="close" size={24} color="#FFFFFF" />
                        </TouchableOpacity>

                        {/* User info - Bottom left */}
                        <View style={styles.userInfo}>
                            <View style={styles.nameRow}>
                                <Text style={styles.userName}>{user.name}</Text>
                                {user.onlineStatus?.isOnline && (
                                    <View style={styles.onlineIndicator} />
                                )}
                            </View>
                            <View style={styles.countryBadge}>
                                <Text style={styles.countryFlag}>{countryFlag}</Text>
                                <Text style={styles.countryText}>{countryCode}, {user.age}</Text>
                            </View>
                        </View>

                        {/* Bio at bottom if exists */}
                        {user.bio && (
                            <View style={styles.bioContainer}>
                                <Text style={styles.bioText} numberOfLines={3}>{user.bio}</Text>
                            </View>
                        )}
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
    },
    card: {
        width: CARD_WIDTH,
        height: CARD_HEIGHT,
        borderRadius: 20,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 10,
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
        bottom: 100,
        width: '40%',
    },
    photoNavRight: {
        position: 'absolute',
        right: 0,
        top: 60,
        bottom: 100,
        width: '40%',
    },
    closeButton: {
        position: 'absolute',
        top: 28,
        left: 16,
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    userInfo: {
        position: 'absolute',
        bottom: 80,
        left: 16,
    },
    nameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    userName: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#FFFFFF',
        textShadowColor: 'rgba(0,0,0,0.5)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 3,
    },
    onlineIndicator: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: '#4CAF50',
        borderWidth: 2,
        borderColor: '#FFFFFF',
    },
    countryBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(215, 48, 91, 0.9)',
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

export default ProfileCardModal;
