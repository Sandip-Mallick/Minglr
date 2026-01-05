import React, { useEffect, useRef, useState, useMemo } from 'react';
import { View, Text, StyleSheet, Animated, Alert, ActivityIndicator } from 'react-native';
import { useTheme } from '../../theme';
import { Button } from '../../components/common/Button';
import { useAuthStore, useOnboardingStore, useGemsStore } from '../../store';
import { usersApi, CompleteProfileData } from '../../api/users';
import * as FileSystem from 'expo-file-system/legacy';
import { getCountryByCode, getCountryByName } from '../../utils/countries';

const SuccessScreen: React.FC = () => {
    const { colors, primaryColor } = useTheme();
    const { updateUser, setAuth, user, accessToken, refreshToken } = useAuthStore();
    const { syncFromUser } = useGemsStore();
    const onboarding = useOnboardingStore();

    const [loading, setLoading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState('');

    // Get the user's country flag
    const userCountryFlag = useMemo(() => {
        if (!onboarding.country) return '🌍';
        const countryData = getCountryByCode(onboarding.country) || getCountryByName(onboarding.country);
        return countryData?.flag || '🌍';
    }, [onboarding.country]);

    // Simple confetti animation using Animated API
    const confettiAnim = useRef(Array.from({ length: 20 }, () => ({
        x: new Animated.Value(0),
        y: new Animated.Value(0),
        opacity: new Animated.Value(1),
    }))).current;

    useEffect(() => {
        // Animate confetti
        confettiAnim.forEach((anim, index) => {
            const startX = Math.random() * 300 - 150;
            const endY = 500 + Math.random() * 200;

            Animated.sequence([
                Animated.delay(index * 50),
                Animated.parallel([
                    Animated.timing(anim.x, {
                        toValue: startX,
                        duration: 2000,
                        useNativeDriver: true,
                    }),
                    Animated.timing(anim.y, {
                        toValue: endY,
                        duration: 2000,
                        useNativeDriver: true,
                    }),
                    Animated.timing(anim.opacity, {
                        toValue: 0,
                        duration: 2000,
                        useNativeDriver: true,
                    }),
                ]),
            ]).start();
        });
    }, []);

    const uploadPhotos = async () => {
        const uploadedPhotos = [];

        for (let i = 0; i < onboarding.photoUris.length; i++) {
            const uri = onboarding.photoUris[i];
            setUploadProgress(`Uploading photo ${i + 1} of ${onboarding.photoUris.length}...`);

            try {
                // Check if file exists (may fail on web with Jimp MIME error)
                let fileExists = true;
                try {
                    const fileInfo = await FileSystem.getInfoAsync(uri);
                    fileExists = fileInfo.exists;
                } catch (fileCheckError) {
                    // On web, FileSystem may fail due to Jimp MIME error
                    // Continue with upload attempt anyway
                    console.warn('File check failed (common on web):', fileCheckError);
                }

                if (!fileExists) {
                    console.warn('Photo file not found:', uri);
                    continue;
                }

                // Create form data
                const formData = new FormData();
                const filename = uri.split('/').pop() || 'photo.jpg';
                const match = /\.(\w+)$/.exec(filename);
                const type = match ? `image/${match[1]}` : 'image/jpeg';

                formData.append('photo', {
                    uri,
                    name: filename,
                    type,
                } as any);
                formData.append('isMain', i === 0 ? 'true' : 'false');

                const photo = await usersApi.uploadPhoto(formData);
                uploadedPhotos.push(photo);
            } catch (error) {
                console.error(`Failed to upload photo ${i + 1}:`, error);
            }
        }

        return uploadedPhotos;
    };

    const handleGetStarted = async () => {
        setLoading(true);

        try {
            // Step 1: Complete profile with basic info and preferences
            setUploadProgress('Saving your profile...');

            const profileData: CompleteProfileData = {
                name: onboarding.name,
                age: parseInt(onboarding.age, 10),
                gender: onboarding.gender as 'male' | 'female' | 'other',
                country: onboarding.country,
                searchPreferences: {
                    searchCountries: onboarding.searchCountries === 'worldwide' ? 'worldwide' : [],
                    genderPreference: onboarding.genderPreference,
                },
            };

            await usersApi.completeProfile(profileData);

            // Step 2: Upload photos
            if (onboarding.photoUris.length > 0) {
                await uploadPhotos();
            }

            // Step 3: Get updated user profile
            setUploadProgress('Finishing up...');
            const updatedProfile = await usersApi.getMe();

            // Step 4: Update local auth store with complete profile
            await setAuth(updatedProfile, accessToken!, refreshToken!);
            syncFromUser(updatedProfile);

            // Step 5: Clear onboarding store
            onboarding.reset();

            setUploadProgress('');

        } catch (error: any) {
            console.error('Profile completion error:', error);
            Alert.alert(
                'Error',
                error.response?.data?.message || error.message || 'Failed to complete profile. Please try again.',
                [{ text: 'OK' }]
            );
        } finally {
            setLoading(false);
            setUploadProgress('');
        }
    };

    const confettiColors = ['#d7305b', '#d94b3c', '#FFD700', '#32CD32', '#1E90FF', '#FF69B4'];

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            {/* Confetti */}
            {confettiAnim.map((anim, index) => (
                <Animated.View
                    key={index}
                    style={[
                        styles.confetti,
                        {
                            backgroundColor: confettiColors[index % confettiColors.length],
                            transform: [
                                { translateX: anim.x },
                                { translateY: anim.y },
                            ],
                            opacity: anim.opacity,
                            left: `${Math.random() * 100}%`,
                        },
                    ]}
                />
            ))}

            <View style={styles.content}>
                <Text style={styles.emoji}>🎉</Text>

                <Text style={[styles.title, { color: colors.text }]}>
                    You're Almost Done!
                </Text>

                <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                    Tap the button below to save your profile and start discovering amazing people!
                </Text>

                {/* Summary of what will be saved */}
                <View style={[styles.summary, { backgroundColor: colors.surface }]}>
                    <Text style={[styles.summaryTitle, { color: colors.text }]}>Your Profile</Text>
                    <Text style={[styles.summaryItem, { color: colors.textSecondary }]}>
                        👤 {onboarding.name}, {onboarding.age}
                    </Text>
                    <Text style={[styles.summaryItem, { color: colors.textSecondary }]}>
                        {userCountryFlag} {onboarding.country}
                    </Text>
                    <Text style={[styles.summaryItem, { color: colors.textSecondary }]}>
                        📷 {onboarding.photoUris.length} photo{onboarding.photoUris.length !== 1 ? 's' : ''}
                    </Text>
                </View>

                {loading && (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color={primaryColor} />
                        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
                            {uploadProgress}
                        </Text>
                    </View>
                )}

                <Button
                    title={loading ? 'Saving...' : "Let's Go!"}
                    onPress={handleGetStarted}
                    size="large"
                    style={styles.button}
                    disabled={loading}
                    loading={loading}
                />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        position: 'relative',
        overflow: 'hidden',
    },
    confetti: {
        position: 'absolute',
        top: 0,
        width: 10,
        height: 10,
        borderRadius: 2,
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    emoji: {
        fontSize: 80,
        marginBottom: 24,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 16,
    },
    subtitle: {
        fontSize: 16,
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 24,
        paddingHorizontal: 20,
    },
    summary: {
        width: '100%',
        padding: 20,
        borderRadius: 16,
        marginBottom: 24,
    },
    summaryTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 12,
    },
    summaryItem: {
        fontSize: 14,
        marginBottom: 6,
    },
    loadingContainer: {
        alignItems: 'center',
        marginBottom: 20,
    },
    loadingText: {
        marginTop: 12,
        fontSize: 14,
    },
    button: {
        width: '100%',
        maxWidth: 300,
    },
});

export default SuccessScreen;
