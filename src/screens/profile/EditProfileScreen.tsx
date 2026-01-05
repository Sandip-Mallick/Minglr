import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
    Alert,
    Modal,
    FlatList,
    Platform,
    Animated,
    Dimensions,
    KeyboardAvoidingView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme';
import { useAuthStore } from '../../store';
import { TargetIcon, CloseIcon } from '../../components/Icons';
import { SearchPreferencesModal } from '../../components/common/SearchPreferencesModal';
import { getCountryByCode, countries as COUNTRIES } from '../../utils/countries';

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');


const PROFILE_COLORS = ['#8B5CF6', '#EC4899', '#3B82F6', '#10B981', '#F97316', '#EF4444'];

const EditProfileScreen: React.FC = () => {
    const { colors, primary, isDark, primaryColor, spacing, borderRadius } = useTheme();
    const navigation = useNavigation();
    const { user, updateUser } = useAuthStore();

    // Animation values
    const backgroundScale = useRef(new Animated.Value(1)).current;
    const backgroundTranslateY = useRef(new Animated.Value(0)).current;
    const backgroundBorderRadius = useRef(new Animated.Value(0)).current;

    // Form state
    const [name, setName] = useState(user?.name || '');
    const [age, setAge] = useState(user?.age?.toString() || '');
    const [gender, setGender] = useState(user?.gender || 'other');
    const [country, setCountry] = useState(user?.country || '');
    const [bio, setBio] = useState(user?.bio || '');
    const [profileColor, setProfileColor] = useState(primaryColor);
    const [isSaving, setIsSaving] = useState(false);
    const [showCountryPicker, setShowCountryPicker] = useState(false);
    const [showSearchPreferences, setShowSearchPreferences] = useState(false);
    const [showGenderPicker, setShowGenderPicker] = useState(false);
    const [countrySearch, setCountrySearch] = useState('');


    // Social handles
    const [snapchat, setSnapchat] = useState('');
    const [instagram, setInstagram] = useState('');
    const [tiktok, setTiktok] = useState('');

    // Animate background when modal opens/closes
    useEffect(() => {
        if (showSearchPreferences) {
            Animated.parallel([
                Animated.timing(backgroundScale, {
                    toValue: 0.92,
                    duration: 300,
                    useNativeDriver: true,
                }),
                Animated.timing(backgroundTranslateY, {
                    toValue: -20,
                    duration: 300,
                    useNativeDriver: true,
                }),
                Animated.timing(backgroundBorderRadius, {
                    toValue: 20,
                    duration: 300,
                    useNativeDriver: false,
                }),
            ]).start();
        } else {
            Animated.parallel([
                Animated.timing(backgroundScale, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true,
                }),
                Animated.timing(backgroundTranslateY, {
                    toValue: 0,
                    duration: 300,
                    useNativeDriver: true,
                }),
                Animated.timing(backgroundBorderRadius, {
                    toValue: 0,
                    duration: 300,
                    useNativeDriver: false,
                }),
            ]).start();
        }
    }, [showSearchPreferences, backgroundScale, backgroundTranslateY, backgroundBorderRadius]);

    const handleSave = async () => {
        if (!name.trim()) {
            Alert.alert('Error', 'Name is required');
            return;
        }

        setIsSaving(true);
        try {
            await updateUser({
                name: name.trim(),
                age: parseInt(age) || user?.age,
                gender: gender as 'male' | 'female' | 'other',
                country,
                bio: bio.trim(),
            });
            navigation.goBack();
        } catch (error) {
            Alert.alert('Error', 'Failed to save profile');
        } finally {
            setIsSaving(false);
        }
    };

    const handleInterestsPress = () => {
        console.log('Open interests picker');
    };

    const handlePreferencesPress = () => {
        setShowSearchPreferences(true);
    };



    const handleCountrySelect = (selectedCountry: typeof COUNTRIES[0]) => {
        setCountry(selectedCountry.code);
        setShowCountryPicker(false);
    };

    const getCountryInfo = () => {
        const countryInfo = COUNTRIES.find(c => c.code === country || c.name === country);
        return countryInfo ? `${countryInfo.flag} ${countryInfo.name}` : country || 'Select country';
    };

    const getGenderDisplay = () => {
        const genderEmojis: { [key: string]: string } = {
            male: '👨',
            female: '👩',
            other: '🧑',
        };
        const emoji = genderEmojis[gender] || '🧑';
        const label = gender.charAt(0).toUpperCase() + gender.slice(1);
        return `${emoji} ${label}`;
    };

    // Check if any changes were made
    const hasChanges =
        name !== (user?.name || '') ||
        age !== (user?.age?.toString() || '') ||
        gender !== (user?.gender || 'other') ||
        country !== (user?.country || '') ||
        bio !== (user?.bio || '');

    // Theme-aware colors
    const screenBgColor = isDark ? colors.background : '#FFFFFF';
    const cardBgColor = isDark ? colors.surface : '#f6f6f6';
    const modalBgColor = isDark ? colors.surface : '#FFFFFF';
    const optionBgColor = isDark ? colors.elevated : '#f6f6f6';

    return (
        <KeyboardAvoidingView
            style={styles.rootContainer}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
        >
            <View style={{ flex: 1 }}>
                {/* Background overlay when modal is open */}
                {showSearchPreferences && <View style={styles.darkOverlay} />}

                <Animated.View
                    style={[
                        styles.container,
                        {
                            backgroundColor: screenBgColor,
                            transform: [
                                { scale: backgroundScale },
                                { translateY: backgroundTranslateY },
                            ],
                            borderRadius: showSearchPreferences ? 20 : 0,
                            overflow: 'hidden',
                        }
                    ]}
                >
                    {/* Header */}
                    <View style={[styles.header, { backgroundColor: screenBgColor }]}>
                        <TouchableOpacity onPress={() => navigation.goBack()}>
                            <Ionicons name="chevron-back" size={24} color={colors.text} />
                        </TouchableOpacity>
                        <Text style={[styles.headerTitle, { color: colors.text }]}>Edit Profile</Text>
                        <TouchableOpacity
                            style={[styles.saveButton, { backgroundColor: hasChanges ? primaryColor : '#6B7280' }]}
                            onPress={handleSave}
                            disabled={isSaving || !hasChanges}
                        >
                            <Text style={styles.saveButtonText}>{isSaving ? '...' : 'Save'}</Text>
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                        {/* Basic Info Card */}
                        <View style={[styles.card, { backgroundColor: cardBgColor }]}>
                            {/* Name */}
                            <View style={styles.fieldRow}>
                                <Text style={[styles.fieldLabel, { color: colors.text }]}>Name</Text>
                                <TextInput
                                    style={[styles.fieldValue, { color: colors.text }]}
                                    value={name}
                                    onChangeText={setName}
                                    placeholder="Your name"
                                    placeholderTextColor={colors.textMuted}
                                />
                            </View>

                            {/* Age */}
                            <View style={styles.fieldRow}>
                                <Text style={[styles.fieldLabel, { color: colors.text }]}>Age</Text>
                                <TextInput
                                    style={[styles.fieldValue, { color: colors.text }]}
                                    value={age}
                                    onChangeText={setAge}
                                    placeholder="Your age"
                                    placeholderTextColor={colors.textMuted}
                                    keyboardType="numeric"
                                    maxLength={2}
                                />
                            </View>

                            {/* Gender */}
                            <TouchableOpacity
                                style={styles.fieldRow}
                                onPress={() => setShowGenderPicker(true)}
                            >
                                <Text style={[styles.fieldLabel, { color: colors.text }]}>Gender</Text>
                                <Text style={[styles.fieldValueText, { color: colors.text }]}>{getGenderDisplay()}</Text>
                            </TouchableOpacity>

                            {/* Profile Colors */}
                            <View style={styles.fieldRow}>
                                <Text style={[styles.fieldLabel, { color: colors.text }]}>Profile Colors</Text>
                                <View style={styles.colorOptions}>
                                    {PROFILE_COLORS.map((color) => (
                                        <TouchableOpacity
                                            key={color}
                                            style={[
                                                styles.colorOption,
                                                { backgroundColor: color },
                                                profileColor === color && styles.colorOptionSelected
                                            ]}
                                            onPress={() => setProfileColor(color)}
                                        />
                                    ))}
                                </View>
                            </View>

                            {/* Country */}
                            <TouchableOpacity
                                style={styles.fieldRow}
                                onPress={() => setShowCountryPicker(true)}
                            >
                                <Text style={[styles.fieldLabel, { color: colors.text }]}>Country</Text>
                                <View style={styles.countryValue}>
                                    <Text style={[styles.fieldValueText, { color: colors.text }]}>{getCountryInfo()}</Text>
                                </View>
                            </TouchableOpacity>
                        </View>

                        {/* Bio Section */}
                        <Text style={[styles.sectionTitle, { color: primaryColor }]}>Bio</Text>
                        <View style={[styles.card, { backgroundColor: cardBgColor }]}>
                            <TextInput
                                style={[styles.bioInput, { color: colors.text }]}
                                value={bio}
                                onChangeText={setBio}
                                placeholder="Tell others about yourself..."
                                placeholderTextColor={colors.textMuted}
                                multiline
                                maxLength={300}
                            />
                        </View>

                        {/* My Interests */}
                        <TouchableOpacity
                            style={[styles.card, styles.linkCard, { backgroundColor: cardBgColor }]}
                            onPress={handleInterestsPress}
                        >
                            <Text style={[styles.linkText, { color: colors.text }]}>My interests</Text>
                            <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
                        </TouchableOpacity>

                        {/* Search Preferences */}
                        <TouchableOpacity
                            style={[styles.card, styles.linkCard, { backgroundColor: cardBgColor }]}
                            onPress={handlePreferencesPress}
                        >
                            <Text style={[styles.linkText, { color: colors.text }]}>Search Preferences</Text>
                            <Ionicons name="options-outline" size={20} color={colors.textMuted} />
                        </TouchableOpacity>

                        {/* Socials Section */}
                        <Text style={[styles.sectionTitle, { color: primaryColor }]}>Socials</Text>

                        {/* Snapchat */}
                        <View style={[styles.socialCard, { backgroundColor: cardBgColor }]}>
                            <View style={[styles.socialIcon, { backgroundColor: '#FFFC00' }]}>
                                <Text style={styles.socialEmoji}>👻</Text>
                            </View>
                            <TextInput
                                style={[styles.socialInput, { color: colors.text }]}
                                value={snapchat}
                                onChangeText={setSnapchat}
                                placeholder="Add your Snapchat"
                                placeholderTextColor={colors.textMuted}
                            />
                        </View>

                        {/* Instagram */}
                        <View style={[styles.socialCard, { backgroundColor: cardBgColor }]}>
                            <View style={[styles.socialIcon, { backgroundColor: '#E4405F' }]}>
                                <Text style={styles.socialEmoji}>📷</Text>
                            </View>
                            <TextInput
                                style={[styles.socialInput, { color: colors.text }]}
                                value={instagram}
                                onChangeText={setInstagram}
                                placeholder="Add your Instagram"
                                placeholderTextColor={colors.textMuted}
                            />
                        </View>

                        {/* TikTok */}
                        <View style={[styles.socialCard, { backgroundColor: cardBgColor }]}>
                            <View style={[styles.socialIcon, { backgroundColor: '#000000' }]}>
                                <Text style={styles.socialEmoji}>🎵</Text>
                            </View>
                            <TextInput
                                style={[styles.socialInput, { color: colors.text }]}
                                value={tiktok}
                                onChangeText={setTiktok}
                                placeholder="Add your TikTok"
                                placeholderTextColor={colors.textMuted}
                            />
                        </View>

                        <View style={{ height: 50 }} />
                    </ScrollView>
                </Animated.View>

                {/* Country Picker Modal - Full Screen */}
                <Modal
                    visible={showCountryPicker}
                    animationType="slide"
                    statusBarTranslucent={true}
                    onRequestClose={() => {
                        setCountrySearch('');
                        setShowCountryPicker(false);
                    }}
                >
                    <View style={[styles.fullScreenModal, { backgroundColor: modalBgColor }]}>
                        {/* Header */}
                        <View style={[styles.fullScreenHeader, { borderBottomColor: colors.border }]}>
                            <View style={{ width: 40 }} />
                            <Text style={[styles.fullScreenTitle, { color: colors.text }]}>Select Country</Text>
                            <TouchableOpacity
                                onPress={() => {
                                    setCountrySearch('');
                                    setShowCountryPicker(false);
                                }}
                                style={styles.fullScreenCloseButton}
                            >
                                <Ionicons name="close" size={28} color={colors.text} />
                            </TouchableOpacity>
                        </View>

                        {/* Search Bar */}
                        <View style={[styles.searchContainer, { backgroundColor: cardBgColor }]}>
                            <Ionicons name="search" size={20} color={colors.textMuted} />
                            <TextInput
                                style={[styles.searchInput, { color: colors.text }]}
                                placeholder="Search countries..."
                                placeholderTextColor={colors.textMuted}
                                value={countrySearch}
                                onChangeText={setCountrySearch}
                                autoCapitalize="none"
                            />
                            {countrySearch.length > 0 && (
                                <TouchableOpacity onPress={() => setCountrySearch('')}>
                                    <Ionicons name="close-circle" size={20} color={colors.textMuted} />
                                </TouchableOpacity>
                            )}
                        </View>

                        {/* Countries List */}
                        <FlatList
                            data={COUNTRIES.filter(c =>
                                c.name.toLowerCase().includes(countrySearch.toLowerCase()) ||
                                c.code.toLowerCase().includes(countrySearch.toLowerCase())
                            )}
                            keyExtractor={(item) => item.code}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={[
                                        styles.countryItem,
                                        { borderBottomColor: colors.border },
                                        country === item.code && { backgroundColor: `${primaryColor}15` }
                                    ]}
                                    onPress={() => {
                                        handleCountrySelect(item);
                                        setCountrySearch('');
                                    }}
                                >
                                    <Text style={styles.countryFlag}>{item.flag}</Text>
                                    <Text style={[styles.countryName, { color: colors.text }]}>{item.name}</Text>
                                    {country === item.code && (
                                        <Ionicons name="checkmark" size={20} color={primaryColor} />
                                    )}
                                </TouchableOpacity>
                            )}
                            style={styles.countryList}
                            showsVerticalScrollIndicator={false}
                            keyboardShouldPersistTaps="handled"
                        />
                    </View>
                </Modal>

                {/* Gender Picker Modal - Center Popup */}
                <Modal
                    visible={showGenderPicker}
                    transparent
                    statusBarTranslucent={true}
                    animationType="fade"
                    onRequestClose={() => setShowGenderPicker(false)}
                >
                    <TouchableOpacity
                        style={styles.centerModalOverlay}
                        activeOpacity={1}
                        onPress={() => setShowGenderPicker(false)}
                    >
                        <TouchableOpacity
                            activeOpacity={1}
                            onPress={(e) => e.stopPropagation()}
                        >
                            <View style={[styles.centerPopup, { backgroundColor: modalBgColor }]}>
                                {/* Close button */}
                                <TouchableOpacity
                                    style={styles.popupCloseButton}
                                    onPress={() => setShowGenderPicker(false)}
                                >
                                    <Ionicons name="close" size={24} color={colors.textMuted} />
                                </TouchableOpacity>

                                {/* Header */}
                                <View style={styles.genderPickerHeader}>
                                    <Text style={styles.genderPickerEmoji}>👤</Text>
                                    <Text style={[styles.genderPickerTitle, { color: colors.text }]}>Gender</Text>
                                    <Text style={[styles.genderPickerSubtitle, { color: colors.textMuted }]}>
                                        Choose your Gender
                                    </Text>
                                </View>

                                {/* Gender Options */}
                                <View style={styles.genderPickerOptions}>
                                    {[
                                        { value: 'male', label: 'Male', emoji: '👨' },
                                        { value: 'female', label: 'Female', emoji: '👩' },
                                        { value: 'other', label: 'Other', emoji: '🧑' },
                                    ].map((option) => (
                                        <TouchableOpacity
                                            key={option.value}
                                            style={[
                                                styles.genderPickerOption,
                                                { backgroundColor: optionBgColor },
                                                gender === option.value && {
                                                    borderColor: primaryColor,
                                                    borderWidth: 3,
                                                }
                                            ]}
                                            onPress={() => {
                                                setGender(option.value as typeof gender);
                                                setShowGenderPicker(false);
                                            }}
                                        >
                                            <Text style={styles.genderPickerOptionEmoji}>{option.emoji}</Text>
                                            <Text style={[
                                                styles.genderPickerOptionLabel,
                                                { color: gender === option.value ? primaryColor : colors.text }
                                            ]}>
                                                {option.label}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>
                        </TouchableOpacity>
                    </TouchableOpacity>
                </Modal>

                {/* Search Preferences - Using shared component */}
                <SearchPreferencesModal
                    visible={showSearchPreferences}
                    onClose={() => setShowSearchPreferences(false)}
                />
            </View>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    rootContainer: {
        flex: 1,
        backgroundColor: '#000000',
    },
    darkOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: '#000000',
    },
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
    saveButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
    },
    saveButtonText: {
        color: '#FFFFFF',
        fontWeight: '600',
        fontSize: 14,
    },
    content: {
        flex: 1,
        padding: 16,
    },
    card: {
        borderRadius: 12,
        marginBottom: 16,
        overflow: 'hidden',
    },
    fieldRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 14,
    },
    fieldLabel: {
        fontSize: 15,
        fontWeight: '500',
    },
    fieldValue: {
        fontSize: 15,
        textAlign: 'right',
        flex: 1,
        marginLeft: 16,
    },
    fieldValueText: {
        fontSize: 15,
        textAlign: 'right',
    },
    colorOptions: {
        flexDirection: 'row',
        gap: 8,
    },
    colorOption: {
        width: 24,
        height: 24,
        borderRadius: 12,
    },
    colorOptionSelected: {
        borderWidth: 3,
        borderColor: '#FFFFFF',
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 8,
        marginTop: 8,
    },
    bioInput: {
        padding: 16,
        fontSize: 15,
        lineHeight: 22,
        minHeight: 100,
        textAlignVertical: 'top',
    },
    linkCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 16,
    },
    linkText: {
        fontSize: 15,
        fontWeight: '500',
    },
    socialCard: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 12,
        marginBottom: 12,
        paddingHorizontal: 12,
        paddingVertical: 12,
    },
    socialIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    socialEmoji: {
        fontSize: 20,
    },
    socialInput: {
        flex: 1,
        marginLeft: 12,
        fontSize: 15,
    },
    countryValue: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    pickerContainer: {
        width: '100%',
    },
    // Country picker specific styles
    countryPickerContainer: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    countryPickerTouchable: {
        height: SCREEN_HEIGHT * 0.7,
    },
    countryPickerContent: {
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingTop: 12,
        paddingBottom: Platform.OS === 'ios' ? 40 : 24,
        paddingHorizontal: 20,
        height: '100%',
    },
    pickerHandle: {
        width: 40,
        height: 4,
        borderRadius: 2,
        backgroundColor: '#D1D1D6',
        alignSelf: 'center',
        marginBottom: 16,
    },
    pickerHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    pickerTitle: {
        fontSize: 20,
        fontWeight: '600',
    },
    countryList: {
        flex: 1,
    },
    countryItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        borderBottomWidth: 1,
    },
    countryFlag: {
        fontSize: 24,
        marginRight: 12,
    },
    countryName: {
        flex: 1,
        fontSize: 16,
    },
    // Search Preferences Modal - Bottom Sheet style without transparency
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
        backgroundColor: '#F3F4F6',
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
        marginBottom: 12,
    },
    ageRangeValue: {
        fontSize: 15,
        fontWeight: '500',
    },
    sliderContainer: {
        marginBottom: 32,
        alignItems: 'center',
    },
    slider: {
        width: '100%',
        height: 50,
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
    // Gender Picker Modal styles
    genderPickerContent: {
        paddingBottom: 40,
    },
    genderPickerHeader: {
        alignItems: 'center',
        marginBottom: 24,
    },
    genderPickerEmoji: {
        fontSize: 48,
        marginBottom: 12,
    },
    genderPickerTitle: {
        fontSize: 24,
        fontWeight: '700',
        marginBottom: 4,
    },
    genderPickerSubtitle: {
        fontSize: 15,
    },
    genderPickerOptions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 12,
    },
    genderPickerOption: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: 20,
        paddingHorizontal: 12,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: 'transparent',
    },
    genderPickerOptionEmoji: {
        fontSize: 40,
        marginBottom: 8,
    },
    genderPickerOptionLabel: {
        fontSize: 15,
        fontWeight: '600',
    },
    // Center popup styles for gender picker
    centerModalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    centerPopup: {
        borderRadius: 24,
        paddingTop: 48,
        paddingBottom: 32,
        paddingHorizontal: 20,
        width: SCREEN_WIDTH - 32,
    },
    popupCloseButton: {
        position: 'absolute',
        top: 16,
        right: 16,
        padding: 4,
        zIndex: 1,
    },
    // Full screen modal styles for country picker
    fullScreenModal: {
        flex: 1,
        paddingTop: Platform.OS === 'ios' ? 50 : 20,
    },
    fullScreenHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E5EA',
    },
    fullScreenCloseButton: {
        padding: 8,
    },
    fullScreenTitle: {
        fontSize: 18,
        fontWeight: '600',
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: 16,
        marginVertical: 12,
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderRadius: 10,
        gap: 8,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        padding: 0,
    },
});

export default EditProfileScreen;
