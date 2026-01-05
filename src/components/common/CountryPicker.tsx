import React, { useState, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TouchableOpacity,
    FlatList,
    TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../theme';
import { countries, Country } from '../../utils/countries';

interface CountryPickerProps {
    selectedCountry?: string;
    onSelect: (country: Country) => void;
    placeholder?: string;
}

export const CountryPicker: React.FC<CountryPickerProps> = ({
    selectedCountry,
    onSelect,
    placeholder = 'Select your country',
}) => {
    const { colors, primaryColor } = useTheme();
    const [visible, setVisible] = useState(false);
    const [search, setSearch] = useState('');

    const selectedCountryData = useMemo(() => {
        if (!selectedCountry) return null;
        return countries.find(c => c.name === selectedCountry || c.code === selectedCountry);
    }, [selectedCountry]);

    const filteredCountries = useMemo(() => {
        if (!search.trim()) return countries;
        const query = search.toLowerCase();
        return countries.filter(
            c => c.name.toLowerCase().includes(query) || c.code.toLowerCase().includes(query)
        );
    }, [search]);

    const handleSelect = (country: Country) => {
        onSelect(country);
        setVisible(false);
        setSearch('');
    };

    const renderCountryItem = ({ item }: { item: Country }) => (
        <TouchableOpacity
            style={[styles.countryItem, { borderBottomColor: colors.border }]}
            onPress={() => handleSelect(item)}
        >
            <Text style={styles.flag}>{item.flag}</Text>
            <Text style={[styles.countryName, { color: colors.text }]}>{item.name}</Text>
            <Text style={[styles.countryCode, { color: colors.textMuted }]}>{item.code}</Text>
        </TouchableOpacity>
    );

    return (
        <>
            <TouchableOpacity
                style={[
                    styles.selector,
                    { backgroundColor: colors.surface, borderColor: colors.border },
                ]}
                onPress={() => setVisible(true)}
            >
                {selectedCountryData ? (
                    <View style={styles.selectedContainer}>
                        <Text style={styles.selectedFlag}>{selectedCountryData.flag}</Text>
                        <Text style={[styles.selectedText, { color: colors.text }]}>
                            {selectedCountryData.name}
                        </Text>
                    </View>
                ) : (
                    <Text style={[styles.placeholder, { color: colors.textMuted }]}>
                        {placeholder}
                    </Text>
                )}
                <Text style={[styles.arrow, { color: colors.textMuted }]}>▼</Text>
            </TouchableOpacity>

            <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" statusBarTranslucent>
                <SafeAreaView style={[styles.modal, { backgroundColor: colors.background }]} edges={['top', 'left', 'right']}>
                    <View style={styles.header}>
                        <Text style={[styles.title, { color: colors.text }]}>Select Country</Text>
                        <TouchableOpacity onPress={() => setVisible(false)}>
                            <Text style={[styles.closeButton, { color: primaryColor }]}>Close</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={[styles.searchContainer, { backgroundColor: colors.surface }]}>
                        <TextInput
                            style={[styles.searchInput, { color: colors.text }]}
                            placeholder="Search countries..."
                            placeholderTextColor={colors.textMuted}
                            value={search}
                            onChangeText={setSearch}
                            autoCorrect={false}
                        />
                    </View>

                    <FlatList
                        data={filteredCountries}
                        keyExtractor={item => item.code}
                        renderItem={renderCountryItem}
                        keyboardShouldPersistTaps="handled"
                        initialNumToRender={20}
                        maxToRenderPerBatch={20}
                    />
                </SafeAreaView>
            </Modal>
        </>
    );
};

const styles = StyleSheet.create({
    selector: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        marginBottom: 16,
    },
    selectedContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    selectedFlag: {
        fontSize: 24,
        marginRight: 12,
    },
    selectedText: {
        fontSize: 16,
    },
    placeholder: {
        fontSize: 16,
    },
    arrow: {
        fontSize: 12,
        marginLeft: 8,
    },
    modal: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E5E5',
    },
    title: {
        fontSize: 18,
        fontWeight: '600',
    },
    closeButton: {
        fontSize: 16,
        fontWeight: '500',
    },
    searchContainer: {
        margin: 16,
        borderRadius: 12,
        paddingHorizontal: 16,
    },
    searchInput: {
        height: 48,
        fontSize: 16,
    },
    countryItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
    },
    flag: {
        fontSize: 28,
        marginRight: 16,
    },
    countryName: {
        flex: 1,
        fontSize: 16,
    },
    countryCode: {
        fontSize: 14,
    },
});
