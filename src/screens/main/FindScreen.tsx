import React, { useState } from 'react';
import { View, Text, StyleSheet, Animated, Easing, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../theme';
import { Button } from '../../components/common/Button';
import { matchesApi } from '../../api/matches';
import { useGemsStore } from '../../store';
import { GemIcon } from '../../components/Icons';

const FindScreen: React.FC = () => {
    const { colors, primary, primaryColor, spacing, borderRadius, typography } = useTheme();
    const navigation = useNavigation();
    const insets = useSafeAreaInsets();
    const { gemsBalance } = useGemsStore();

    const [searching, setSearching] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [searchAnim] = useState(new Animated.Value(0));

    const startSearchAnimation = () => {
        Animated.loop(
            Animated.timing(searchAnim, {
                toValue: 1,
                duration: 1500,
                easing: Easing.linear,
                useNativeDriver: true,
            })
        ).start();
    };

    const handleFind = async () => {
        setSearching(true);
        setResult(null);
        startSearchAnimation();

        try {
            const matchResult = await matchesApi.findMatch();
            setResult(matchResult);
        } catch (error) {
            console.error('Find failed:', error);
            setResult({ found: false, message: 'Search failed. Please try again.' });
        } finally {
            setSearching(false);
            searchAnim.stopAnimation();
            searchAnim.setValue(0);
        }
    };

    const handleChat = () => {
        if (result?.chatId) {
            // Navigate to chat
            console.log('Navigate to chat:', result.chatId);
        }
    };

    const spin = searchAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg'],
    });

    // Get icon based on state
    const getIconName = (): keyof typeof Ionicons.glyphMap => {
        if (searching) return 'search-outline';
        if (result?.found) return 'heart';
        return 'hand-right-outline';
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            {/* Header */}
            <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
                <View style={styles.headerSide}>
                    <TouchableOpacity style={[styles.headerIcon, { padding: spacing.xs }]}>
                        <Ionicons name="search-outline" size={22} color={colors.text} />
                    </TouchableOpacity>
                </View>

                <View style={styles.headerCenter}>
                    <Text style={[typography.h2, { color: colors.text }]}>Find</Text>
                </View>

                <View style={[styles.headerSide, { alignItems: 'flex-end' }]}>
                    <TouchableOpacity
                        style={[
                            styles.gemsContainer,
                            {
                                backgroundColor: colors.surface,
                                borderColor: primary.main,
                                borderRadius: borderRadius.button,
                                paddingHorizontal: spacing.md,
                                paddingVertical: spacing.xs,
                            }
                        ]}
                        onPress={() => navigation.navigate('GemsAndBoosters' as never)}
                    >
                        <GemIcon size={16} />
                        <Text style={[typography.labelSmall, { color: colors.text, marginLeft: spacing.xs }]}>
                            {gemsBalance}
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Content */}
            <View style={styles.content}>
                {/* Styled Icon Container - like ChatsScreen empty state */}
                <View style={[
                    styles.iconContainer,
                    {
                        backgroundColor: `${primary.main}15`,
                        borderRadius: borderRadius.full,
                    }
                ]}>
                    <Animated.View
                        style={searching ? { transform: [{ rotate: spin }] } : undefined}
                    >
                        <Ionicons
                            name={getIconName()}
                            size={48}
                            color={primary.main}
                        />
                    </Animated.View>
                </View>

                {/* Title and Description */}
                <Text style={[typography.h2, { color: colors.text, textAlign: 'center', marginTop: spacing.xl }]}>
                    {searching
                        ? 'Searching...'
                        : result?.found
                            ? 'Found Someone!'
                            : 'Find a Friend'}
                </Text>

                <Text style={[
                    typography.bodySmall,
                    {
                        color: colors.textSecondary,
                        textAlign: 'center',
                        marginTop: spacing.sm,
                        paddingHorizontal: spacing.xl,
                        lineHeight: 20,
                    }
                ]}>
                    {searching
                        ? 'Looking for online users matching your preferences'
                        : result?.found
                            ? `${result.user?.name}, ${result.user?.age} from ${result.user?.country}`
                            : 'Connect instantly with someone who is online right now'}
                </Text>

                {/* Result or Find Button */}
                <View style={{ marginTop: spacing['2xl'], width: '100%', alignItems: 'center' }}>
                    {result?.found ? (
                        <View style={styles.resultActions}>
                            <Button
                                title="💬 Start Chat"
                                onPress={handleChat}
                                fullWidth
                                size="large"
                            />
                            <View style={{ height: spacing.md }} />
                            <Button
                                title="🔍 Find Another"
                                onPress={handleFind}
                                variant="outline"
                                fullWidth
                                size="large"
                            />
                        </View>
                    ) : (
                        <Button
                            title={searching ? 'Searching...' : '🔍 Find Now'}
                            onPress={handleFind}
                            disabled={searching}
                            size="large"
                            style={styles.findButton}
                        />
                    )}

                    {result && !result.found && (
                        <View style={[styles.noResult, { marginTop: spacing.xl }]}>
                            <Text style={[
                                typography.bodySmall,
                                { color: colors.textSecondary, textAlign: 'center', marginBottom: spacing.base }
                            ]}>
                                {result.message || 'No one is online right now. Try again later!'}
                            </Text>
                            <Button
                                title="Try Again"
                                onPress={handleFind}
                                variant="outline"
                            />
                        </View>
                    )}
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingBottom: 8,
    },
    headerSide: {
        minWidth: 72,
        alignItems: 'flex-start',
    },
    headerIcon: {
        padding: 4,
    },
    headerCenter: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: '700',
    },
    gemsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        borderWidth: 1,
    },
    gemsText: {
        fontSize: 14,
        fontWeight: '600',
        marginLeft: 4,
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    iconContainer: {
        width: 100,
        height: 100,
        justifyContent: 'center',
        alignItems: 'center',
    },
    findButton: {
        width: '100%',
        maxWidth: 280,
    },
    resultActions: {
        width: '100%',
        maxWidth: 280,
        alignItems: 'center',
    },
    noResult: {
        alignItems: 'center',
    },
});

export default FindScreen;
