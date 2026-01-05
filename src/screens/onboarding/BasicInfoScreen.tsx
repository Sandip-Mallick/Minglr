import React from 'react';
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
import { Input } from '../../components/common/Input';
import { CountryPicker } from '../../components/common/CountryPicker';
import { useOnboardingStore } from '../../store';
import { Country } from '../../utils/countries';

const BasicInfoScreen: React.FC = () => {
    const navigation = useNavigation();
    const { colors, primaryColor } = useTheme();

    // Get state and actions from onboarding store
    const { name, age, gender, country, setBasicInfo } = useOnboardingStore();

    const genderOptions = [
        { value: 'male', label: '👨 Male' },
        { value: 'female', label: '👩 Female' },
        { value: 'other', label: '🧑 Other' },
    ];

    const handleCountrySelect = (selected: Country) => {
        setBasicInfo(name, age, gender as 'male' | 'female' | 'other', selected.code);
    };

    const handleNameChange = (value: string) => {
        setBasicInfo(value, age, gender as 'male' | 'female' | 'other', country);
    };

    const handleAgeChange = (value: string) => {
        // Only allow numbers
        const numericValue = value.replace(/[^0-9]/g, '');
        setBasicInfo(name, numericValue, gender as 'male' | 'female' | 'other', country);
    };

    const handleGenderSelect = (value: 'male' | 'female' | 'other') => {
        setBasicInfo(name, age, value, country);
    };

    const handleContinue = () => {
        // Validate age is between 18 and 120
        const ageNum = parseInt(age, 10);
        if (isNaN(ageNum) || ageNum < 18 || ageNum > 120) {
            return;
        }
        navigation.navigate('Preferences' as never);
    };

    const isValidAge = () => {
        const ageNum = parseInt(age, 10);
        return !isNaN(ageNum) && ageNum >= 18 && ageNum <= 120;
    };

    const canContinue = name.trim() && isValidAge() && gender && country;

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
                showsVerticalScrollIndicator={false}
            >
                <Text style={[styles.title, { color: colors.text }]}>Tell us about yourself</Text>
                <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                    This helps us find the right matches for you
                </Text>

                <Input
                    label="Your Name"
                    value={name}
                    onChangeText={handleNameChange}
                    placeholder="Enter your name"
                    autoCapitalize="words"
                />

                <Input
                    label="Your Age"
                    value={age}
                    onChangeText={handleAgeChange}
                    placeholder="Enter your age (18+)"
                    keyboardType="number-pad"
                    maxLength={3}
                />
                {age && !isValidAge() && (
                    <Text style={[styles.errorText, { color: colors.error }]}>
                        Age must be between 18 and 120
                    </Text>
                )}

                <Text style={[styles.label, { color: colors.text }]}>Gender</Text>
                <View style={styles.genderOptions}>
                    {genderOptions.map((option) => (
                        <Button
                            key={option.value}
                            title={option.label}
                            onPress={() => handleGenderSelect(option.value as any)}
                            variant={gender === option.value ? 'primary' : 'outline'}
                            size="small"
                            style={styles.genderButton}
                        />
                    ))}
                </View>

                <Text style={[styles.label, { color: colors.text }]}>Country</Text>
                <CountryPicker
                    selectedCountry={country}
                    onSelect={handleCountrySelect}
                    placeholder="Select your country"
                />

                <Button
                    title="Continue"
                    onPress={handleContinue}
                    disabled={!canContinue}
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
    label: {
        fontSize: 14,
        fontWeight: '500',
        marginBottom: 8,
    },
    genderOptions: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 24,
    },
    genderButton: {
        flex: 1,
    },
    errorText: {
        fontSize: 12,
        marginTop: -12,
        marginBottom: 16,
    },
    continueButton: {
        marginTop: 24,
    },
});

export default BasicInfoScreen;
