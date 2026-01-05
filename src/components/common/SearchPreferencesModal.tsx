import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TouchableOpacity,
    Dimensions,
    Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import MultiSlider from '@ptomasroos/react-native-multi-slider';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../theme';
import { useAuthStore } from '../../store';
import { getCountryByCode } from '../../utils/countries';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface SearchPreferencesModalProps {
    visible: boolean;
    onClose: () => void;
    onSave?: () => void;
}

export const SearchPreferencesModal: React.FC<SearchPreferencesModalProps> = ({
    visible,
    onClose,
    onSave,
}) => {
    const { colors, primary, spacing, borderRadius, typography, isDark } = useTheme();
    const { user, updateUser } = useAuthStore();

    const [searchGender, setSearchGender] = useState<'male' | 'female' | 'everyone'>(
        user?.searchPreferences?.genderPreference || 'everyone'
    );
    const [searchLocation, setSearchLocation] = useState<'my_country' | 'worldwide'>(
        user?.searchPreferences?.searchCountries === 'worldwide' ? 'worldwide' : 'my_country'
    );
    const [ageRange, setAgeRange] = useState({
        min: user?.searchPreferences?.ageRange?.min || 18,
        max: user?.searchPreferences?.ageRange?.max || 60
    });

    // Get user's country flag
    const userCountry = getCountryByCode(user?.country || '');
    const countryFlag = userCountry?.flag || '🏠';

    // Dynamic colors based on theme
    const sheetBgColor = isDark ? colors.surface : '#FFFFFF';
    const optionBgColor = isDark ? colors.elevated : '#F3F4F6';
    const sliderUnselectedColor = isDark ? colors.border : '#D1D1D6';

    // Sync with user data when modal opens
    useEffect(() => {
        if (visible && user) {
            setSearchGender(user.searchPreferences?.genderPreference || 'everyone');
            setSearchLocation(
                user.searchPreferences?.searchCountries === 'worldwide' ? 'worldwide' : 'my_country'
            );
            setAgeRange({
                min: user.searchPreferences?.ageRange?.min || 18,
                max: user.searchPreferences?.ageRange?.max || 60,
            });
        }
    }, [visible, user]);

    const handleSavePreferences = async () => {
        try {
            await updateUser({
                searchPreferences: {
                    genderPreference: searchGender,
                    searchCountries: searchLocation === 'worldwide' ? 'worldwide' : [user?.country || ''],
                    ageRange: {
                        min: ageRange.min,
                        max: ageRange.max,
                    },
                },
            });
            onSave?.();
            onClose();
        } catch (error) {
            console.error('Failed to save preferences:', error);
        }
    };

    const handleAgeRangeChange = (values: number[]) => {
        const newMin = values[0];
        const newMax = values[1];
        if (newMin !== ageRange.min || newMax !== ageRange.max) {
            Haptics.selectionAsync();
        }
        setAgeRange({ min: newMin, max: newMax });
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={onClose}
            statusBarTranslucent={true}
        >
            <TouchableOpacity
                style={styles.preferencesModalContainer}
                activeOpacity={1}
                onPress={onClose}
            >
                <TouchableOpacity
                    activeOpacity={1}
                    onPress={(e) => e.stopPropagation()}
                >
                    <View style={[styles.preferencesSheet, { backgroundColor: sheetBgColor }]}>
                        {/* Header with chevron on right */}
                        <View style={styles.preferencesHeader}>
                            <View style={{ width: 28 }} />
                            <Text style={[styles.preferencesTitle, { color: colors.text }]}>Search Preferences</Text>
                            <TouchableOpacity onPress={onClose}>
                                <Ionicons name="chevron-down" size={28} color={colors.text} />
                            </TouchableOpacity>
                        </View>

                        {/* Gender Selection */}
                        <Text style={[styles.prefSectionLabel, { color: colors.text }]}>That identify as</Text>
                        <View style={styles.genderGrid}>
                            {[
                                { value: 'male', label: 'Male', emoji: '👨' },
                                { value: 'female', label: 'Female', emoji: '👩' },
                                { value: 'everyone', label: 'Everyone', emoji: '🐸' },
                            ].map((option) => (
                                <TouchableOpacity
                                    key={option.value}
                                    style={[
                                        styles.genderOptionBox,
                                        { backgroundColor: optionBgColor },
                                        searchGender === option.value && {
                                            borderColor: primary.main,
                                            borderWidth: 3,
                                        }
                                    ]}
                                    onPress={() => setSearchGender(option.value as typeof searchGender)}
                                >
                                    <Text style={styles.genderEmoji}>{option.emoji}</Text>
                                    <Text style={[
                                        styles.genderLabel,
                                        { color: searchGender === option.value ? primary.main : colors.text }
                                    ]}>
                                        {option.label}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        {/* Location Selection */}
                        <Text style={[styles.prefSectionLabel, { color: colors.text }]}>Who lives in</Text>
                        <View style={styles.locationOptions}>
                            <TouchableOpacity
                                style={[
                                    styles.locationOption,
                                    { backgroundColor: optionBgColor },
                                    searchLocation === 'my_country' && {
                                        borderColor: primary.main,
                                        borderWidth: 3,
                                    }
                                ]}
                                onPress={() => setSearchLocation('my_country')}
                            >
                                <Text style={styles.locationEmoji}>{countryFlag}</Text>
                                <Text style={[
                                    styles.locationText,
                                    { color: searchLocation === 'my_country' ? primary.main : colors.text }
                                ]}>My country</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[
                                    styles.locationOption,
                                    { backgroundColor: optionBgColor, flex: 1 },
                                    searchLocation === 'worldwide' && {
                                        borderColor: primary.main,
                                        borderWidth: 3,
                                    }
                                ]}
                                onPress={() => setSearchLocation('worldwide')}
                            >
                                <Text style={styles.locationEmoji}>🌍</Text>
                                <Text style={[
                                    styles.locationText,
                                    { color: searchLocation === 'worldwide' ? primary.main : colors.text }
                                ]}>
                                    Worldwide
                                </Text>
                            </TouchableOpacity>
                        </View>

                        {/* Age Range */}
                        <View style={styles.ageRangeHeader}>
                            <Text style={[styles.prefSectionLabelBold, { color: colors.text }]}>Between ages</Text>
                            <Text style={[styles.ageRangeValue, { color: primary.main }]}>
                                {ageRange.min} - {ageRange.max}
                            </Text>
                        </View>
                        <View style={styles.sliderContainer}>
                            <MultiSlider
                                values={[ageRange.min, ageRange.max]}
                                min={18}
                                max={60}
                                step={1}
                                onValuesChange={handleAgeRangeChange}
                                selectedStyle={{ backgroundColor: primary.main }}
                                unselectedStyle={{ backgroundColor: sliderUnselectedColor }}
                                markerStyle={{
                                    height: 24,
                                    width: 24,
                                    borderRadius: 12,
                                    backgroundColor: isDark ? colors.card : '#FFFFFF',
                                    borderWidth: 3,
                                    borderColor: primary.main,
                                    shadowColor: '#000',
                                    shadowOffset: { width: 0, height: 2 },
                                    shadowOpacity: 0.2,
                                    shadowRadius: 3,
                                    elevation: 3,
                                    marginTop: 4,
                                }}
                                pressedMarkerStyle={{
                                    height: 28,
                                    width: 28,
                                    borderRadius: 14,
                                }}
                                sliderLength={SCREEN_WIDTH - 80}
                                containerStyle={{ height: 50 }}
                                trackStyle={{ height: 6, borderRadius: 3 }}
                            />
                        </View>

                        {/* Save Button */}
                        <View style={styles.saveButtonContainer}>
                            <TouchableOpacity
                                style={[styles.savePreferencesButton, { backgroundColor: primary.main }]}
                                onPress={handleSavePreferences}
                            >
                                <Text style={styles.savePreferencesText}>Save Preferences</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </TouchableOpacity>
            </TouchableOpacity>
        </Modal>
    );
};

const styles = StyleSheet.create({
    preferencesModalContainer: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    preferencesSheet: {
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingTop: 16,
        paddingBottom: Platform.OS === 'ios' ? 40 : 24,
        paddingHorizontal: 20,
        minHeight: SCREEN_HEIGHT * 0.55,
    },
    preferencesHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    preferencesTitle: {
        fontSize: 20,
        fontWeight: '700',
    },
    prefSectionLabel: {
        fontSize: 15,
        fontWeight: '500',
        marginBottom: 12,
    },
    prefSectionLabelBold: {
        fontSize: 16,
        fontWeight: '700',
    },
    genderGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 12,
        marginBottom: 24,
    },
    genderOptionBox: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 8,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: 'transparent',
    },
    genderEmoji: {
        fontSize: 32,
        marginBottom: 8,
    },
    genderLabel: {
        fontSize: 14,
        fontWeight: '500',
    },
    locationOptions: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 24,
    },
    locationOption: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 24,
        gap: 8,
        borderWidth: 2,
        borderColor: 'transparent',
    },
    locationEmoji: {
        fontSize: 18,
    },
    locationText: {
        fontSize: 14,
        fontWeight: '500',
    },
    ageRangeHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    ageRangeValue: {
        fontSize: 16,
        fontWeight: '700',
    },
    sliderContainer: {
        marginBottom: 32,
        alignItems: 'center',
    },
    saveButtonContainer: {
        paddingHorizontal: 40,
    },
    savePreferencesButton: {
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    savePreferencesText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
});

export default SearchPreferencesModal;
