import React, { useState, useCallback, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Image,
    Modal,
    Alert,
    Platform,
    Dimensions,
    ActivityIndicator,
    Animated,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import DraggableFlatList, {
    ScaleDecorator,
    RenderItemParams,
} from 'react-native-draggable-flatlist';
import { useTheme } from '../../theme';
import { useAuthStore, useGemsStore } from '../../store';
import { usersApi } from '../../api/users';
import {
    CloseIcon,
    PlusIcon,
    GemIcon,
    CameraIcon,
    GalleryIcon,
} from '../../components/Icons';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const GRID_PADDING = 16;
const GRID_GAP = 8;
// Calculate item width based on 3 columns
const ITEM_WIDTH = (SCREEN_WIDTH - GRID_PADDING * 2 - GRID_GAP * 2) / 3;
// 9:16 aspect ratio (portrait)
const ITEM_HEIGHT = ITEM_WIDTH * (16 / 9);

interface Photo {
    url: string;
    publicId?: string;
    order?: number;
    isMain: boolean;
    isVerified?: boolean;
}

const ManageMediaScreen: React.FC = () => {
    const { colors, primaryColor } = useTheme();
    const navigation = useNavigation();
    const { user, refreshUser } = useAuthStore();
    const { gemsBalance } = useGemsStore();

    const [photos, setPhotos] = useState<Photo[]>(user?.photos || []);
    const [showPhotoOptions, setShowPhotoOptions] = useState(false);
    const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);
    const [deletingIndex, setDeletingIndex] = useState<number | null>(null);
    const [isReordering, setIsReordering] = useState(false);

    const handleClose = () => {
        navigation.goBack();
    };

    const showErrorAlert = (errorType: 'network' | 'server' | 'fileSize' | 'unknown') => {
        const messages: Record<string, string> = {
            network: 'Error uploading the image, network error',
            server: 'Error uploading the image, please try again',
            fileSize: 'Error uploading the image, file size too large',
            unknown: 'An unexpected error occurred, please try again',
        };
        Alert.alert('Upload Failed', messages[errorType]);
    };

    const getErrorType = (error: unknown): 'network' | 'server' | 'fileSize' | 'unknown' => {
        if (error && typeof error === 'object') {
            const axiosError = error as { message?: string; response?: { status?: number } };
            if (axiosError.message?.includes('Network Error') || axiosError.message?.includes('timeout')) {
                return 'network';
            }
            if (axiosError.response?.status === 413) {
                return 'fileSize';
            }
            if (axiosError.response?.status && axiosError.response.status >= 500) {
                return 'server';
            }
        }
        return 'unknown';
    };

    const handleDeletePhoto = async (index: number) => {
        const photoToDelete = photos[index];

        Alert.alert(
            'Delete Photo',
            'Are you sure you want to remove this photo?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        setDeletingIndex(index);
                        try {
                            await usersApi.deletePhoto(photoToDelete.url);
                            const newPhotos = photos.filter((_, i) => i !== index);
                            setPhotos(newPhotos);
                            // Refresh user data to sync with server
                            if (refreshUser) {
                                await refreshUser();
                            }
                        } catch (error) {
                            const errorType = getErrorType(error);
                            Alert.alert(
                                'Delete Failed',
                                errorType === 'network'
                                    ? 'Error deleting photo, network error'
                                    : 'Error deleting photo, please try again'
                            );
                        } finally {
                            setDeletingIndex(null);
                        }
                    },
                },
            ]
        );
    };

    const handleAddPhoto = () => {
        if (uploadingIndex !== null) return; // Prevent adding while uploading
        setShowPhotoOptions(true);
    };

    const requestCameraPermission = async () => {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission Required', 'Camera permission is needed to take photos.');
            return false;
        }
        return true;
    };

    const requestMediaLibraryPermission = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission Required', 'Photo library permission is needed to select photos.');
            return false;
        }
        return true;
    };

    const uploadPhoto = async (uri: string) => {
        const uploadIndex = photos.length;
        setUploadingIndex(uploadIndex);

        // Add placeholder for loading state
        const placeholderPhoto: Photo = {
            url: uri,
            isMain: photos.length === 0,
        };
        setPhotos([...photos, placeholderPhoto]);

        try {
            const formData = new FormData();
            const fileName = uri.split('/').pop() || 'photo.jpg';
            const mimeType = fileName.endsWith('.png') ? 'image/png' : 'image/jpeg';

            formData.append('photo', {
                uri,
                name: fileName,
                type: mimeType,
            } as unknown as Blob);
            formData.append('isMain', String(photos.length === 0));

            const uploadedPhoto = await usersApi.uploadPhoto(formData);

            // Update with actual photo from server
            setPhotos(prevPhotos => {
                const newPhotos = [...prevPhotos];
                newPhotos[uploadIndex] = {
                    url: uploadedPhoto.url,
                    order: uploadedPhoto.order,
                    isMain: uploadedPhoto.isMain,
                    isVerified: uploadedPhoto.isVerified,
                };
                return newPhotos;
            });

            // Refresh user data
            if (refreshUser) {
                await refreshUser();
            }
        } catch (error) {
            // Remove the placeholder photo on error
            setPhotos(prevPhotos => prevPhotos.filter((_, i) => i !== uploadIndex));
            showErrorAlert(getErrorType(error));
        } finally {
            setUploadingIndex(null);
        }
    };

    const handleTakePhoto = async () => {
        setShowPhotoOptions(false);

        const hasPermission = await requestCameraPermission();
        if (!hasPermission) return;

        const result = await ImagePicker.launchCameraAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [9, 16], // 9:16 ratio
            quality: 0.8,
        });

        if (!result.canceled && result.assets[0]) {
            await uploadPhoto(result.assets[0].uri);
        }
    };

    const handleChooseFromGallery = async () => {
        setShowPhotoOptions(false);

        const hasPermission = await requestMediaLibraryPermission();
        if (!hasPermission) return;

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [9, 16], // 9:16 ratio
            quality: 0.8,
        });

        if (!result.canceled && result.assets[0]) {
            await uploadPhoto(result.assets[0].uri);
        }
    };

    const handleDragEnd = async ({ data }: { data: Photo[] }) => {
        setPhotos(data);
        setIsReordering(true);

        try {
            const photoOrder = data.map(photo => photo.url);
            await usersApi.reorderPhotos(photoOrder);
            if (refreshUser) {
                await refreshUser();
            }
        } catch (error) {
            // Revert to original order on error
            setPhotos(user?.photos || []);
            Alert.alert('Reorder Failed', 'Failed to save new order, please try again');
        } finally {
            setIsReordering(false);
        }
    };

    const handleDragBegin = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    };

    const renderPhoto = useCallback(
        ({ item, drag, isActive, getIndex }: RenderItemParams<Photo>) => {
            const index = getIndex() ?? 0;
            const isDeleting = deletingIndex === index;
            const isUploading = uploadingIndex === index;

            return (
                <ScaleDecorator activeScale={1.05}>
                    <TouchableOpacity
                        onLongPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                            drag();
                        }}
                        disabled={isActive || isUploading || isDeleting}
                        style={[
                            styles.photoWrapper,
                            isActive && styles.photoActive,
                        ]}
                    >
                        <Image source={{ uri: item.url }} style={styles.photoImage} />

                        {/* Loading overlay for uploading */}
                        {isUploading && (
                            <View style={styles.loadingOverlay}>
                                <ActivityIndicator size="large" color="#FFFFFF" />
                            </View>
                        )}

                        {/* Loading overlay for deleting */}
                        {isDeleting && (
                            <View style={styles.loadingOverlay}>
                                <ActivityIndicator size="small" color="#FFFFFF" />
                            </View>
                        )}

                        {/* Delete button */}
                        {!isUploading && !isDeleting && (
                            <TouchableOpacity
                                style={styles.deleteButton}
                                onPress={() => handleDeletePhoto(index)}
                            >
                                <View style={styles.deleteButtonInner}>
                                    <CloseIcon size={12} color="#FFFFFF" />
                                </View>
                            </TouchableOpacity>
                        )}
                    </TouchableOpacity>
                </ScaleDecorator>
            );
        },
        [deletingIndex, uploadingIndex]
    );

    const renderAddButton = () => (
        <TouchableOpacity
            style={[styles.addPhotoButton, {
                backgroundColor: colors.surface,
                borderColor: colors.border,
            }]}
            onPress={handleAddPhoto}
            disabled={uploadingIndex !== null}
        >
            {uploadingIndex !== null ? (
                <ActivityIndicator size="small" color={primaryColor} />
            ) : (
                <PlusIcon size={36} color={primaryColor} />
            )}
        </TouchableOpacity>
    );

    // Combine photos with add button placeholder
    const renderListFooter = () => {
        if (photos.length >= 6) return null; // Max 6 photos
        return renderAddButton();
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                    <CloseIcon size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text }]}>Media</Text>
                <View style={styles.gemsDisplay}>
                    <GemIcon size={18} />
                    <Text style={[styles.gemsCount, { color: colors.text }]}>{gemsBalance}</Text>
                </View>
            </View>

            {/* Instructions */}
            <Text style={[styles.instructions, { color: colors.textSecondary }]}>
                Hold and drag to reorder.
            </Text>

            {/* Photo Grid with Drag and Drop */}
            <View style={styles.content}>
                <View style={styles.photoGridWrapper}>
                    {photos.map((item, index) => {
                        const isDeleting = deletingIndex === index;
                        const isUploading = uploadingIndex === index;

                        return (
                            <TouchableOpacity
                                key={`photo-${index}-${item.url}`}
                                onLongPress={() => {
                                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                                }}
                                disabled={isUploading || isDeleting}
                                style={styles.photoWrapper}
                            >
                                <Image source={{ uri: item.url }} style={styles.photoImage} />

                                {/* Loading overlay for uploading */}
                                {isUploading && (
                                    <View style={styles.loadingOverlay}>
                                        <ActivityIndicator size="large" color="#FFFFFF" />
                                    </View>
                                )}

                                {/* Loading overlay for deleting */}
                                {isDeleting && (
                                    <View style={styles.loadingOverlay}>
                                        <ActivityIndicator size="small" color="#FFFFFF" />
                                    </View>
                                )}

                                {/* Delete button */}
                                {!isUploading && !isDeleting && (
                                    <TouchableOpacity
                                        style={styles.deleteButton}
                                        onPress={() => handleDeletePhoto(index)}
                                    >
                                        <View style={styles.deleteButtonInner}>
                                            <CloseIcon size={12} color="#FFFFFF" />
                                        </View>
                                    </TouchableOpacity>
                                )}
                            </TouchableOpacity>
                        );
                    })}

                    {/* Add button - appears in next available slot */}
                    {photos.length < 6 && (
                        <TouchableOpacity
                            style={[styles.addPhotoButton, {
                                backgroundColor: colors.surface,
                                borderColor: colors.border,
                            }]}
                            onPress={handleAddPhoto}
                            disabled={uploadingIndex !== null}
                        >
                            <PlusIcon size={36} color={primaryColor} />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {/* Photo Options Modal (Bottom Sheet) */}
            <Modal
                visible={showPhotoOptions}
                transparent
                animationType="slide"
                onRequestClose={() => setShowPhotoOptions(false)}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setShowPhotoOptions(false)}
                >
                    <View style={styles.bottomSheetContainer}>
                        <TouchableOpacity
                            activeOpacity={1}
                            onPress={(e) => e.stopPropagation()}
                        >
                            <View style={[styles.bottomSheet, { backgroundColor: colors.card }]}>
                                {/* Handle */}
                                <View style={[styles.bottomSheetHandle, { backgroundColor: colors.border }]} />

                                <Text style={[styles.bottomSheetTitle, { color: colors.text }]}>Add Photo</Text>

                                {/* Camera Option */}
                                <TouchableOpacity
                                    style={[styles.optionButton, { borderBottomColor: colors.border }]}
                                    onPress={handleTakePhoto}
                                >
                                    <View style={[styles.optionIconWrapper, { backgroundColor: `${primaryColor}15` }]}>
                                        <CameraIcon size={24} color={primaryColor} />
                                    </View>
                                    <View style={styles.optionInfo}>
                                        <Text style={[styles.optionText, { color: colors.text }]}>Take Photo</Text>
                                        <Text style={[styles.optionSubtext, { color: colors.textSecondary }]}>
                                            Use your camera to take a new photo
                                        </Text>
                                    </View>
                                </TouchableOpacity>

                                {/* Gallery Option */}
                                <TouchableOpacity
                                    style={styles.optionButton}
                                    onPress={handleChooseFromGallery}
                                >
                                    <View style={[styles.optionIconWrapper, { backgroundColor: '#3B82F615' }]}>
                                        <GalleryIcon size={24} color="#3B82F6" />
                                    </View>
                                    <View style={styles.optionInfo}>
                                        <Text style={[styles.optionText, { color: colors.text }]}>Choose from Gallery</Text>
                                        <Text style={[styles.optionSubtext, { color: colors.textSecondary }]}>
                                            Select a photo from your library
                                        </Text>
                                    </View>
                                </TouchableOpacity>

                                {/* Cancel Button */}
                                <TouchableOpacity
                                    style={[styles.cancelButton, { backgroundColor: colors.surface }]}
                                    onPress={() => setShowPhotoOptions(false)}
                                >
                                    <Text style={[styles.cancelButtonText, { color: colors.text }]}>Cancel</Text>
                                </TouchableOpacity>
                            </View>
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
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
    closeButton: {
        padding: 4,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '600',
    },
    gemsDisplay: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    gemsCount: {
        fontSize: 16,
        fontWeight: '600',
    },
    instructions: {
        textAlign: 'center',
        paddingVertical: 16,
        fontSize: 14,
    },
    content: {
        flex: 1,
        paddingHorizontal: GRID_PADDING,
    },
    photoGrid: {
        paddingBottom: 50,
    },
    photoGridWrapper: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: GRID_GAP,
    },
    columnWrapper: {
        justifyContent: 'flex-start',
        gap: GRID_GAP,
        marginBottom: GRID_GAP,
    },
    photoWrapper: {
        width: ITEM_WIDTH,
        height: ITEM_HEIGHT,
        borderRadius: 12,
        overflow: 'hidden',
        position: 'relative',
    },
    photoActive: {
        opacity: 0.9,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    photoImage: {
        width: '100%',
        height: '100%',
        borderRadius: 12,
    },
    loadingOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 12,
    },
    deleteButton: {
        position: 'absolute',
        top: -5,
        right: -5,
        padding: 8,
    },
    deleteButtonInner: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#d7305b',
        justifyContent: 'center',
        alignItems: 'center',
    },
    addPhotoButton: {
        width: ITEM_WIDTH,
        height: ITEM_HEIGHT,
        borderRadius: 12,
        borderWidth: 2,
        borderStyle: 'dashed',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    bottomSheetContainer: {
        width: '100%',
    },
    bottomSheet: {
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingTop: 12,
        paddingBottom: Platform.OS === 'ios' ? 40 : 24,
        paddingHorizontal: 20,
    },
    bottomSheetHandle: {
        width: 40,
        height: 4,
        borderRadius: 2,
        alignSelf: 'center',
        marginBottom: 16,
    },
    bottomSheetTitle: {
        fontSize: 20,
        fontWeight: '600',
        textAlign: 'center',
        marginBottom: 20,
    },
    optionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        borderBottomWidth: 1,
    },
    optionIconWrapper: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    optionInfo: {
        flex: 1,
        marginLeft: 16,
    },
    optionText: {
        fontSize: 16,
        fontWeight: '600',
    },
    optionSubtext: {
        fontSize: 13,
        marginTop: 2,
    },
    cancelButton: {
        marginTop: 16,
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    cancelButtonText: {
        fontSize: 16,
        fontWeight: '600',
    },
});

export default ManageMediaScreen;
