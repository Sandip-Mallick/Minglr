import React, { useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../theme';
import { Button } from '../../components/common/Button';
import { useOnboardingStore } from '../../store';
import { getCountryByCode, getCountryByName } from '../../utils/countries';

const PreferencesScreen: React.FC = () => {
    const navigation = useNavigation();
    const { colors, primaryColor } = useTheme();

    // Get state and actions from onboarding store
    const { country, searchCountries, genderPreference, setPreferences } = useOnboardingStore();

    // Get the user's country flag
    const userCountryFlag = useMemo(() => {
        if (!country) return '📍';
        const countryData = getCountryByCode(country) || getCountryByName(country);
        return countryData?.flag || '📍';
    }, [country]);

    const genderOptions = [
        { value: 'male', label: '👨 Men' },
        { value: 'female', label: '👩 Women' },
        { value: 'everyone', label: '🌈 Everyone' },
    ];

    const handleSearchCountriesChange = (value: 'worldwide' | 'specific') => {
        setPreferences(value, genderPreference);
    };

    const handleGenderPreferenceChange = (value: 'male' | 'female' | 'everyone') => {
        setPreferences(searchCountries, value);
    };

    const handleContinue = () => {
        navigation.navigate('PhotoUpload' as never);
    };

    return (
        <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={100}
        >
            <ScrollView
                style={[styles.container, { backgroundColor: colors.background }]}
                contentContainerStyle={styles.content}
                keyboardShouldPersistTaps="handled"
            >
                <Text style={[styles.title, { color: colors.text }]}>Your Preferences</Text>
                <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                    Tell us what you're looking for
                </Text>

                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                    🌍 Search Area
                </Text>
                <View style={styles.options}>
                    <Button
                        title="🌎 Worldwide"
                        onPress={() => handleSearchCountriesChange('worldwide')}
                        variant={searchCountries === 'worldwide' ? 'primary' : 'outline'}
                        style={styles.optionButton}
                    />
                    <Button
                        title={`${userCountryFlag} My country`}
                        onPress={() => handleSearchCountriesChange('specific')}
                        variant={searchCountries === 'specific' ? 'primary' : 'outline'}
                        style={styles.optionButton}
                    />
                </View>

                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                    💕 Interested In
                </Text>
                <View style={styles.genderOptions}>
                    {genderOptions.map((option) => (
                        <Button
                            key={option.value}
                            title={option.label}
                            onPress={() => handleGenderPreferenceChange(option.value as any)}
                            variant={genderPreference === option.value ? 'primary' : 'outline'}
                            size="small"
                            style={styles.genderButton}
                        />
                    ))}
                </View>

                <Button
                    title="Continue"
                    onPress={handleContinue}
                    style={styles.continueButton}
                />
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        padding: 24,
        paddingBottom: 40,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        marginBottom: 32,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 16,
        marginTop: 16,
    },
    options: {
        flexDirection: 'row',
        gap: 12,
    },
    optionButton: {
        flex: 1,
    },
    genderOptions: {
        flexDirection: 'row',
        gap: 8,
    },
    genderButton: {
        flex: 1,
    },
    continueButton: {
        marginTop: 40,
    },
});

export default PreferencesScreen;
