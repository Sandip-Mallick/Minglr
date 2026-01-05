import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, ActivityIndicator } from 'react-native';
import { RouteProp, useRoute } from '@react-navigation/native';
import { useTheme } from '../../theme';
import { usersApi, UserProfile } from '../../api/users';
import { Button } from '../../components/common/Button';
import { UserIcon, LocationIcon } from '../../components/Icons';

type RouteParams = {
    UserInfo: { userId: string };
};

const UserInfoScreen: React.FC = () => {
    const { colors, primaryColor } = useTheme();
    const route = useRoute<RouteProp<RouteParams, 'UserInfo'>>();

    const [user, setUser] = useState<Partial<UserProfile> | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadUser();
    }, []);

    const loadUser = async () => {
        try {
            const data = await usersApi.getUser(route.params.userId);
            setUser(data);
        } catch (error) {
            console.error('Failed to load user:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <View style={[styles.container, styles.centered, { backgroundColor: colors.background }]}>
                <ActivityIndicator size="large" color={primaryColor} />
            </View>
        );
    }

    if (!user) {
        return (
            <View style={[styles.container, styles.centered, { backgroundColor: colors.background }]}>
                <Text style={[styles.errorText, { color: colors.text }]}>User not found</Text>
            </View>
        );
    }

    const mainPhoto = user.photos?.find((p) => p.isMain)?.url;

    return (
        <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
            {/* Photo */}
            {mainPhoto ? (
                <Image source={{ uri: mainPhoto }} style={styles.photo} />
            ) : (
                <View style={[styles.photo, { backgroundColor: colors.surface }]}>
                    <UserIcon size={80} color={colors.textMuted} />
                </View>
            )}

            {/* Info */}
            <View style={styles.info}>
                <Text style={[styles.name, { color: colors.text }]}>
                    {user.name}, {user.age}
                </Text>
                <View style={styles.locationRow}>
                    <LocationIcon size={18} color={colors.textSecondary} />
                    <Text style={[styles.location, { color: colors.textSecondary }]}>
                        {user.country}
                    </Text>
                </View>

                {user.onlineStatus && (
                    <View style={styles.onlineStatus}>
                        <View style={[
                            styles.statusDot,
                            { backgroundColor: user.onlineStatus.isOnline ? colors.success : colors.textMuted }
                        ]} />
                        <Text style={[styles.statusText, { color: colors.textSecondary }]}>
                            {user.onlineStatus.isOnline ? 'Online now' : 'Offline'}
                        </Text>
                    </View>
                )}

                {user.bio && (
                    <View style={[styles.bioSection, { backgroundColor: colors.card }]}>
                        <Text style={[styles.bioTitle, { color: colors.textSecondary }]}>About</Text>
                        <Text style={[styles.bio, { color: colors.text }]}>{user.bio}</Text>
                    </View>
                )}

                {/* Photo gallery */}
                {user.photos && user.photos.length > 1 && (
                    <View style={styles.gallery}>
                        <Text style={[styles.galleryTitle, { color: colors.textSecondary }]}>Photos</Text>
                        <View style={styles.photoGrid}>
                            {user.photos.map((photo, index) => (
                                <Image key={index} source={{ uri: photo.url }} style={styles.gridPhoto} />
                            ))}
                        </View>
                    </View>
                )}

                {/* Actions */}
                <View style={styles.actions}>
                    <Button
                        title="Block User"
                        onPress={() => { }}
                        variant="outline"
                        style={styles.actionButton}
                    />
                    <Button
                        title="Report"
                        onPress={() => { }}
                        variant="outline"
                        style={styles.actionButton}
                    />
                </View>
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    centered: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    errorText: {
        fontSize: 16,
    },
    photo: {
        width: '100%',
        height: 400,
        justifyContent: 'center',
        alignItems: 'center',
    },
    placeholder: {
        fontSize: 80,
    },
    info: {
        padding: 24,
    },
    name: {
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    location: {
        fontSize: 18,
        marginLeft: 4,
        marginBottom: 12,
    },
    locationRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    onlineStatus: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 24,
    },
    statusDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        marginRight: 8,
    },
    statusText: {
        fontSize: 14,
    },
    bioSection: {
        padding: 16,
        borderRadius: 12,
        marginBottom: 24,
    },
    bioTitle: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 8,
        textTransform: 'uppercase',
    },
    bio: {
        fontSize: 16,
        lineHeight: 24,
    },
    gallery: {
        marginBottom: 24,
    },
    galleryTitle: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 12,
        textTransform: 'uppercase',
    },
    photoGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    gridPhoto: {
        width: '31%',
        aspectRatio: 1,
        borderRadius: 8,
    },
    actions: {
        flexDirection: 'row',
        gap: 12,
    },
    actionButton: {
        flex: 1,
    },
});

export default UserInfoScreen;
