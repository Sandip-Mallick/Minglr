import { NavigatorScreenParams } from '@react-navigation/native';

// Auth Stack
export type AuthStackParamList = {
    Login: undefined;
    Signup: undefined;
    ForgotPassword: undefined;
    VerifyEmail: undefined;
};

// Onboarding Stack
export type OnboardingStackParamList = {
    BasicInfo: undefined;
    Preferences: undefined;
    PhotoUpload: undefined;
    Success: undefined;
};

// Main Tab Navigator
export type MainTabParamList = {
    Swipe: undefined;
    Find: undefined;
    Request: undefined;
    Chats: undefined;
    Profile: undefined;
};

// Chat Stack (nested in Chats tab)
export type ChatStackParamList = {
    ChatsList: undefined;
    Chat: { chatId: string; participantName: string; participantPhoto?: string };
    UserInfo: { userId: string };
};

// Profile Stack (nested in Profile tab)
export type ProfileStackParamList = {
    ProfileMain: undefined;
    EditProfile: undefined;
    PreviewProfile: undefined;
    GemsAndBoosters: undefined;
    Settings: undefined;
};

// Root Navigator
export type RootStackParamList = {
    Auth: NavigatorScreenParams<AuthStackParamList>;
    Onboarding: NavigatorScreenParams<OnboardingStackParamList>;
    Main: NavigatorScreenParams<MainTabParamList>;
    GemsAndBoosters: undefined;
    UserInfo: { userId: string };
    ManageMedia: undefined;
    EditProfile: undefined;
    PreviewProfile: undefined;
    Settings: undefined;
    Chat: { chatId: string; participantName: string; participantPhoto?: string };
    AllFriends: undefined;
};

// Type helpers for navigation
declare global {
    namespace ReactNavigation {
        interface RootParamList extends RootStackParamList { }
    }
}
