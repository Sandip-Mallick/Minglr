import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Image,
    Alert,
    ScrollView,
    Dimensions,
    ActivityIndicator,
    useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { useTheme } from '../../theme';
import { Button } from '../../components/common/Button';
import { useOnboardingStore, useAuthStore, useGemsStore } from '../../store';
import { usersApi, CompleteProfileData } from '../../api/users';

const GAP = 12;
const HORIZONTAL_PADDING = 24;

interface UploadedPhoto {
    localUri: string;
    serverUrl?: string;
    isUploading: boolean;
    error?: boolean;
}

const PhotoUploadScreen: React.FC = () => {
    const navigation = useNavigation();
    const { colors, primaryColor } = useTheme();
    const { setAuth, accessToken, refreshToken } = useAuthStore();
    const { syncFromUser } = useGemsStore();
    const onboarding = useOnboardingStore();
    const insets = useSafeAreaInsets();
    const { width: screenWidth } = useWindowDimensions();

    // Calculate slot width dynamically based on screen width
    // Account for: padding on both sides, 2 gaps between 3 columns, and border width
    const borderWidth = 2;
    const availableWidth = screenWidth - (HORIZONTAL_PADDING * 2) - (GAP * 2);
    const slotWidth = Math.floor(availableWidth / 3) - borderWidth;

    // Track photos with upload status
    const [photos, setPhotos] = useState<UploadedPhoto[]>([]);
    const [isCompletingProfile, setIsCompletingProfile] = useState(false);

    const uploadPhoto = async (uri: string, isMain: boolean): Promise<string | null> => {
        try {
            // Check if file exists
            let fileExists = true;
            try {
                const fileInfo = await FileSystem.getInfoAsync(uri);
                fileExists = fileInfo.exists;
            } catch (fileCheckError) {
                console.warn('File check failed (common on web):', fileCheckError);
            }

            if (!fileExists) {
                console.warn('Photo file not found:', uri);
                return null;
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
            formData.append('isMain', isMain ? 'true' : 'false');

            const photo = await usersApi.uploadPhoto(formData);
            return photo.url;
        } catch (error) {
            console.error('Failed to upload photo:', error);
            return null;
        }
    };

    const handlePickImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission needed', 'Please allow access to your photo library.');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [9, 16],
            quality: 0.8,
        });

        if (!result.canceled && result.assets[0]) {
            const uri = result.assets[0].uri;
            const isMain = photos.length === 0;

            // Add photo with uploading state
            const newPhoto: UploadedPhoto = {
                localUri: uri,
                isUploading: true,
            };
            setPhotos(prev => [...prev, newPhoto]);

            // Upload immediately
            const serverUrl = await uploadPhoto(uri, isMain);

            // Update photo with result
            setPhotos(prev => prev.map(p =>
                p.localUri === uri
                    ? { ...p, serverUrl: serverUrl || undefined, isUploading: false, error: !serverUrl }
                    : p
            ));

            // Also update onboarding store for tracking
            if (serverUrl) {
                onboarding.addPhotoUri(uri);
            }
        }
    };

    const handleTakePhoto = async () => {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission needed', 'Please allow camera access.');
            return;
        }

        const result = await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            aspect: [9, 16],
            quality: 0.8,
        });

        if (!result.canceled && result.assets[0]) {
            const uri = result.assets[0].uri;
            const isMain = photos.length === 0;

            // Add photo with uploading state
            const newPhoto: UploadedPhoto = {
                localUri: uri,
                isUploading: true,
            };
            setPhotos(prev => [...prev, newPhoto]);

            // Upload immediately
            const serverUrl = await uploadPhoto(uri, isMain);

            // Update photo with result
            setPhotos(prev => prev.map(p =>
                p.localUri === uri
                    ? { ...p, serverUrl: serverUrl || undefined, isUploading: false, error: !serverUrl }
                    : p
            ));

            // Also update onboarding store for tracking
            if (serverUrl) {
                onboarding.addPhotoUri(uri);
            }
        }
    };

    const handleRemovePhoto = async (index: number) => {
        Alert.alert(
            'Remove Photo',
            'Are you sure you want to remove this photo?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Remove',
                    style: 'destructive',
                    onPress: async () => {
                        const photo = photos[index];
                        // TODO: Call API to delete photo from server if serverUrl exists
                        setPhotos(prev => prev.filter((_, i) => i !== index));
                        onboarding.removePhotoUri(index);
                    }
                },
            ]
        );
    };

    const handleContinue = async () => {
        const successfulUploads = photos.filter(p => p.serverUrl && !p.error);

        if (successfulUploads.length === 0) {
            Alert.alert('Photo Required', 'Please add at least one photo to continue.');
            return;
        }

        // Check if any photos are still uploading
        if (photos.some(p => p.isUploading)) {
            Alert.alert('Please wait', 'Photos are still uploading...');
            return;
        }

        setIsCompletingProfile(true);

        try {
            // Complete profile with basic info and preferences
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

            // Get updated user profile
            const updatedProfile = await usersApi.getMe();

            // Update local auth store with complete profile
            await setAuth(updatedProfile, accessToken!, refreshToken!);
            syncFromUser(updatedProfile);

            // Clear onboarding store
            onboarding.reset();

            // Success! AppNavigator will automatically navigate to main app
        } catch (error: any) {
            console.error('Profile completion error:', error);
            Alert.alert(
                'Error',
                error.response?.data?.message || error.message || 'Failed to complete profile. Please try again.',
                [{ text: 'OK' }]
            );
        } finally {
            setIsCompletingProfile(false);
        }
    };

    const successfulUploads = photos.filter(p => p.serverUrl && !p.error).length;
    const hasPhotosUploading = photos.some(p => p.isUploading);

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}
            >
                <Text style={[styles.title, { color: colors.text }]}>Add Your Photos</Text>
                <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                    Add up to 6 photos to your profile. Photos are uploaded as you add them.
                </Text>

                {/* Photo Grid */}
                <View style={styles.photoGrid}>
                    {[...Array(6)].map((_, index) => {
                        const photo = photos[index];

                        return (
                            <TouchableOpacity
                                key={index}
                                style={[
                                    styles.photoSlot,
                                    {
                                        backgroundColor: colors.surface,
                                        borderColor: colors.border,
                                        width: slotWidth,
                                        height: slotWidth * (16 / 9),
                                    },
                                ]}
                                onPress={photo ? () => handleRemovePhoto(index) : handlePickImage}
                                disabled={(!photo && photos.length >= 6) || (photo?.isUploading)}
                            >
                                {photo ? (
                                    <>
                                        <Image source={{ uri: photo.localUri }} style={styles.photo} />

                                        {/* Loading overlay */}
                                        {photo.isUploading && (
                                            <View style={styles.uploadingOverlay}>
                                                <ActivityIndicator size="small" color="#FFFFFF" />
                                                <Text style={styles.uploadingText}>Uploading...</Text>
                                            </View>
                                        )}

                                        {/* Error overlay */}
                                        {photo.error && !photo.isUploading && (
                                            <View style={[styles.uploadingOverlay, { backgroundColor: 'rgba(255,0,0,0.7)' }]}>
                                                <Text style={styles.uploadingText}>Failed</Text>
                                            </View>
                                        )}

                                        {/* Remove button - only show when not uploading */}
                                        {!photo.isUploading && (
                                            <View style={[styles.removeButton, { backgroundColor: colors.error }]}>
                                                <Text style={styles.removeText}>✕</Text>
                                            </View>
                                        )}

                                        {/* Main badge */}
                                        {index === 0 && !photo.isUploading && (
                                            <View style={[styles.mainBadge, { backgroundColor: primaryColor }]}>
                                                <Text style={styles.mainText}>Main</Text>
                                            </View>
                                        )}

                                        {/* Success checkmark */}
                                        {photo.serverUrl && !photo.isUploading && !photo.error && (
                                            <View style={styles.successBadge}>
                                                <Text style={styles.successText}>✓</Text>
                                            </View>
                                        )}
                                    </>
                                ) : (
                                    <>
                                        <Text style={[styles.addIcon, { color: primaryColor }]}>+</Text>
                                        <Text style={[styles.addText, { color: colors.textMuted }]}>
                                            {index === 0 ? 'Main Photo' : 'Add Photo'}
                                        </Text>
                                    </>
                                )}
                            </TouchableOpacity>
                        );
                    })}
                </View>

                {/* Camera Option */}
                <TouchableOpacity
                    style={[styles.cameraButton, { borderColor: primaryColor }]}
                    onPress={handleTakePhoto}
                    disabled={photos.length >= 6}
                >
                    <Text style={[styles.cameraText, { color: primaryColor }]}>
                        📷 Take a Photo
                    </Text>
                </TouchableOpacity>

                <Text style={[styles.hint, { color: colors.textMuted }]}>
                    Your first photo will be your main profile picture
                </Text>
            </ScrollView>

            {/* Continue Button - Fixed at bottom center */}
            <View style={[styles.bottomButtonContainer, { paddingBottom: insets.bottom + 16 }]}>
                <Button
                    title={
                        isCompletingProfile
                            ? 'Creating profile...'
                            : hasPhotosUploading
                                ? 'Uploading...'
                                : successfulUploads === 0
                                    ? 'Add at least 1 photo'
                                    : 'Continue'
                    }
                    onPress={handleContinue}
                    disabled={successfulUploads === 0 || hasPhotosUploading || isCompletingProfile}
                    loading={isCompletingProfile}
                    style={{ ...styles.continueButton, width: screenWidth / 2 }}
                />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollView: {
        flex: 1,
    },
    content: {
        padding: HORIZONTAL_PADDING,
        paddingBottom: 120, // Space for the fixed button at bottom
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        marginBottom: 24,
        lineHeight: 22,
    },
    photoGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        columnGap: GAP,
        rowGap: GAP,
        justifyContent: 'flex-start',
    },
    photoSlot: {
        borderRadius: 12,
        borderWidth: 2,
        borderStyle: 'dashed',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },
    bottomButtonContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        alignItems: 'center',
        paddingTop: 16,
        backgroundColor: 'transparent',
    },
    photo: {
        width: '100%',
        height: '100%',
        position: 'absolute',
    },
    uploadingOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    uploadingText: {
        color: '#FFFFFF',
        fontSize: 12,
        marginTop: 4,
        fontWeight: '500',
    },
    removeButton: {
        position: 'absolute',
        top: 4,
        right: 4,
        width: 24,
        height: 24,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    removeText: {
        color: '#FFFFFF',
        fontWeight: 'bold',
        fontSize: 12,
    },
    mainBadge: {
        position: 'absolute',
        bottom: 4,
        left: 4,
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    mainText: {
        color: '#FFFFFF',
        fontSize: 10,
        fontWeight: '600',
    },
    successBadge: {
        position: 'absolute',
        top: 4,
        left: 4,
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: '#32CD32',
        justifyContent: 'center',
        alignItems: 'center',
    },
    successText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: 'bold',
    },
    addIcon: {
        fontSize: 32,
        fontWeight: '300',
    },
    addText: {
        fontSize: 11,
        marginTop: 4,
        textAlign: 'center',
    },
    cameraButton: {
        marginTop: 24,
        padding: 16,
        borderRadius: 12,
        borderWidth: 2,
        alignItems: 'center',
    },
    cameraText: {
        fontSize: 16,
        fontWeight: '500',
    },
    continueButton: {
        // Width set dynamically in component
    },
    hint: {
        textAlign: 'center',
        marginTop: 16,
        fontSize: 13,
    },
});

export default PhotoUploadScreen;



