import React, { useEffect } from 'react';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';

import { RootStackParamList } from './types';
import { AuthNavigator } from './AuthNavigator';
import { MainTabNavigator } from './MainTabNavigator';
import { useTheme } from '../theme';
import { useAuthStore } from '../store';

// Import onboarding screens
import BasicInfoScreen from '../screens/onboarding/BasicInfoScreen';
import PreferencesScreen from '../screens/onboarding/PreferencesScreen';
import PhotoUploadScreen from '../screens/onboarding/PhotoUploadScreen';
import SuccessScreen from '../screens/onboarding/SuccessScreen';

// Import modal screens
import GemsBoostersScreen from '../screens/gems/GemsBoostersScreen';
import UserInfoScreen from '../screens/profile/UserInfoScreen';
import ManageMediaScreen from '../screens/profile/ManageMediaScreen';
import EditProfileScreen from '../screens/profile/EditProfileScreen';
import PreviewProfileScreen from '../screens/profile/PreviewProfileScreen';
import SettingsScreen from '../screens/settings/SettingsScreen';
import ChatScreen from '../screens/chat/ChatScreen';
import AllFriendsScreen from '../screens/friends/AllFriendsScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

export const AppNavigator: React.FC = () => {
    const { colors, isDark, primaryColor } = useTheme();
    const { isAuthenticated, isLoading, user, loadStoredAuth } = useAuthStore();

    useEffect(() => {
        loadStoredAuth();
    }, []);

    if (isLoading) {
        return (
            <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
                <ActivityIndicator size="large" color={primaryColor} />
            </View>
        );
    }

    const needsOnboarding = isAuthenticated && user && !user.isProfileComplete;

    return (
        <>
            <StatusBar style={isDark ? 'light' : 'dark'} />
            <NavigationContainer
                theme={{
                    dark: isDark,
                    colors: {
                        primary: primaryColor,
                        background: colors.background,
                        card: colors.card,
                        text: colors.text,
                        border: colors.border,
                        notification: primaryColor,
                    },
                    fonts: {
                        regular: {
                            fontFamily: 'System',
                            fontWeight: '400' as const,
                        },
                        medium: {
                            fontFamily: 'System',
                            fontWeight: '500' as const,
                        },
                        bold: {
                            fontFamily: 'System',
                            fontWeight: '700' as const,
                        },
                        heavy: {
                            fontFamily: 'System',
                            fontWeight: '900' as const,
                        },
                    },
                }}
            >
                <Stack.Navigator screenOptions={{ headerShown: false }}>
                    {!isAuthenticated ? (
                        <Stack.Screen name="Auth" component={AuthNavigator} />
                    ) : needsOnboarding ? (
                        <Stack.Group>
                            <Stack.Screen name="Onboarding" options={{ headerShown: false }}>
                                {() => (
                                    <OnboardingNavigator colors={colors} primaryColor={primaryColor} />
                                )}
                            </Stack.Screen>
                        </Stack.Group>
                    ) : (
                        <>
                            <Stack.Screen name="Main" component={MainTabNavigator} />
                            <Stack.Screen
                                name="GemsAndBoosters"
                                component={GemsBoostersScreen}
                                options={{
                                    headerShown: true,
                                    title: 'Gems & Boosters',
                                    headerStyle: { backgroundColor: colors.background },
                                    headerTintColor: primaryColor,
                                    presentation: 'card',
                                    animation: 'ios_from_right',
                                    animationDuration: 400,
                                    gestureEnabled: true,
                                    fullScreenGestureEnabled: true,
                                }}
                            />
                            <Stack.Screen
                                name="UserInfo"
                                component={UserInfoScreen}
                                options={{
                                    headerShown: true,
                                    title: 'Profile',
                                    headerStyle: { backgroundColor: colors.background },
                                    headerTintColor: primaryColor,
                                    presentation: 'card',
                                }}
                            />
                            <Stack.Screen
                                name="ManageMedia"
                                component={ManageMediaScreen}
                                options={{
                                    headerShown: false,
                                    presentation: 'modal',
                                }}
                            />
                            <Stack.Screen
                                name="EditProfile"
                                component={EditProfileScreen}
                                options={{
                                    headerShown: false,
                                    presentation: 'card',
                                }}
                            />
                            <Stack.Screen
                                name="PreviewProfile"
                                component={PreviewProfileScreen}
                                options={{
                                    headerShown: false,
                                    presentation: 'card',
                                }}
                            />
                            <Stack.Screen
                                name="Settings"
                                component={SettingsScreen}
                                options={{
                                    headerShown: false,
                                    presentation: 'card',
                                }}
                            />
                            <Stack.Screen
                                name="Chat"
                                component={ChatScreen}
                                options={{
                                    headerShown: false,
                                    presentation: 'card',
                                }}
                            />
                            <Stack.Screen
                                name="AllFriends"
                                component={AllFriendsScreen}
                                options={{
                                    headerShown: false,
                                    presentation: 'modal',
                                }}
                            />
                        </>
                    )}
                </Stack.Navigator>
            </NavigationContainer>
        </>
    );
};

// Onboarding Stack Navigator
const OnboardingStack = createNativeStackNavigator();

const OnboardingNavigator: React.FC<{ colors: any; primaryColor: string }> = ({ colors, primaryColor }) => (
    <OnboardingStack.Navigator
        screenOptions={{
            headerStyle: { backgroundColor: colors.background },
            headerTintColor: primaryColor,
            headerTitleStyle: { fontWeight: '700' },
            headerBackButtonDisplayMode: 'minimal',
            contentStyle: { backgroundColor: colors.background },
        }}
    >
        <OnboardingStack.Screen
            name="BasicInfo"
            component={BasicInfoScreen}
            options={{ title: 'About You' }}
        />
        <OnboardingStack.Screen
            name="Preferences"
            component={PreferencesScreen}
            options={{ title: 'Preferences' }}
        />
        <OnboardingStack.Screen
            name="PhotoUpload"
            component={PhotoUploadScreen}
            options={{ title: 'Add Photos' }}
        />
        <OnboardingStack.Screen
            name="Success"
            component={SuccessScreen}
            options={{ headerShown: false }}
        />
    </OnboardingStack.Navigator>
);

const styles = StyleSheet.create({
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
});

export default AppNavigator;
