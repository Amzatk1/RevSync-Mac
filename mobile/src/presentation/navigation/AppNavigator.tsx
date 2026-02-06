import React, { useEffect } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { NavigationContainer } from '@react-navigation/native';
import { Theme } from '../theme';
import { Ionicons } from '@expo/vector-icons';
import { useAppStore } from '../store/useAppStore';
import { ActivityIndicator, View } from 'react-native';

// Tunes Screens
import { TuneMarketplaceScreen } from '../screens/TuneMarketplaceScreen';
import { TuneDetailsScreen } from '../screens/tunes/TuneDetailsScreen';
import { TuneValidationScreen } from '../screens/tunes/TuneValidationScreen';
import { CheckoutScreen } from '../screens/tunes/TunesStubs';
import { DownloadManagerScreen } from '../screens/tunes/DownloadManagerScreen';

// Garage Screens
import { GarageScreen } from '../screens/GarageScreen';
import { AddBikeScreen, BikeDetailsScreen } from '../screens/garage/GarageStubs';

// Flash Screens
import { FlashWizardScreen } from '../screens/flash/FlashWizardScreen'; // Updated path
import { DeviceConnectScreen } from '../screens/flash/DeviceConnectScreen';
import { ECUIdentifyScreen } from '../screens/flash/ECUIdentifyScreen';
import { BackupScreen } from '../screens/flash/BackupScreen';
import { VerificationScreen } from '../screens/flash/VerificationScreen';
import { RecoveryScreen } from '../screens/flash/RecoveryScreen';

// Profile Screens
import { ProfileScreen } from '../screens/profile/ProfileScreen';
import { ProfileEditScreen } from '../screens/profile/ProfileEditScreen';
import { SettingsScreen } from '../screens/profile/SettingsScreen';
import { SupportScreen } from '../screens/profile/SupportScreen';
import { AboutScreen } from '../screens/profile/AboutScreen';
import { PrivacyScreen } from '../screens/profile/PrivacyScreen';
import { LogsExportScreen } from '../screens/profile/LogsExportScreen';
import { LegalMenuScreen } from '../screens/profile/LegalMenuScreen';
import { LegalDocumentScreen } from '../screens/profile/LegalDocumentScreen';
import { FlashingSafetySettingsScreen } from '../screens/profile/FlashingSafetySettingsScreen';

// Auth Screens
import { WelcomeScreen } from '../screens/WelcomeScreen';
import { SignInScreen, SignUpScreen } from '../screens/auth/SignInSignUpScreens';
import { OnboardingScreen } from '../screens/auth/OnboardingScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();
const AuthStack = createStackNavigator();

// --- Auth Stack ---
const AuthNavigator = () => (
    <AuthStack.Navigator
        screenOptions={{
            headerShown: false,
            cardStyle: { backgroundColor: Theme.Colors.background },
        }}
    >
        <AuthStack.Screen name="Welcome" component={WelcomeScreen} />
        <AuthStack.Screen name="SignIn" component={SignInScreen} />
        <AuthStack.Screen name="SignUp" component={SignUpScreen} />
    </AuthStack.Navigator>
);

// --- Components for Stacks ---

const TunesStack = () => (
    <Stack.Navigator
        screenOptions={{
            headerShown: false,
            cardStyle: { backgroundColor: Theme.Colors.background },
        }}
    >
        <Stack.Screen name="TuneMarketplace" component={TuneMarketplaceScreen} />
        <Stack.Screen name="TuneDetails" component={TuneDetailsScreen} />
        <Stack.Screen name="TuneValidation" component={TuneValidationScreen} />
        <Stack.Screen name="Checkout" component={CheckoutScreen} />
        <Stack.Screen name="DownloadManager" component={DownloadManagerScreen} />
    </Stack.Navigator>
);

const GarageStack = () => (
    <Stack.Navigator
        screenOptions={{
            headerShown: false,
            cardStyle: { backgroundColor: Theme.Colors.background },
        }}
    >
        <Stack.Screen name="GarageList" component={GarageScreen} />
        <Stack.Screen name="AddBike" component={AddBikeScreen} />
        <Stack.Screen name="BikeDetails" component={BikeDetailsScreen} />
    </Stack.Navigator>
);

const FlashStack = () => (
    <Stack.Navigator
        screenOptions={{
            headerShown: false,
            cardStyle: { backgroundColor: Theme.Colors.background },
        }}
    >
        <Stack.Screen name="DeviceConnect" component={DeviceConnectScreen} />
        <Stack.Screen name="ECUIdentify" component={ECUIdentifyScreen} />
        <Stack.Screen name="Backup" component={BackupScreen} />
        <Stack.Screen name="FlashWizard" component={FlashWizardScreen} />
        <Stack.Screen name="Verification" component={VerificationScreen} />
        <Stack.Screen name="Recovery" component={RecoveryScreen} />
    </Stack.Navigator>
);

const ProfileStack = () => (
    <Stack.Navigator
        screenOptions={{
            headerShown: false,
            cardStyle: { backgroundColor: Theme.Colors.background },
        }}
    >
        <Stack.Screen name="ProfileHome" component={ProfileScreen} />
        <Stack.Screen name="ProfileEdit" component={ProfileEditScreen} />
        <Stack.Screen name="Settings" component={SettingsScreen} />
        <Stack.Screen name="Support" component={SupportScreen} />
        <Stack.Screen name="About" component={AboutScreen} />
        <Stack.Screen name="Privacy" component={PrivacyScreen} />
        <Stack.Screen name="LogsExport" component={LogsExportScreen} />
        <Stack.Screen name="LegalMenu" component={LegalMenuScreen} />
        <Stack.Screen name="LegalDocument" component={LegalDocumentScreen} />
        <Stack.Screen name="FlashingSafetySettings" component={FlashingSafetySettingsScreen} />
        <Stack.Screen name="DownloadManager" component={DownloadManagerScreen} />
    </Stack.Navigator>
);

// --- Main Tab Navigator ---

const MainNavigator = () => (
    <Tab.Navigator
        screenOptions={({ route }) => ({
            headerShown: false,
            tabBarStyle: {
                backgroundColor: Theme.Colors.surface,
                borderTopColor: Theme.Colors.border,
                paddingBottom: 5,
                paddingTop: 5,
                height: 60,
            },
            tabBarActiveTintColor: Theme.Colors.primary,
            tabBarInactiveTintColor: Theme.Colors.text,
            tabBarIcon: ({ focused, color, size }) => {
                let iconName: any;

                if (route.name === 'Tunes') {
                    iconName = focused ? 'speedometer' : 'speedometer-outline';
                } else if (route.name === 'Garage') {
                    iconName = focused ? 'car-sport' : 'car-sport-outline';
                } else if (route.name === 'Flash') {
                    iconName = focused ? 'flash' : 'flash-outline';
                } else if (route.name === 'Profile') {
                    iconName = focused ? 'person' : 'person-outline';
                }

                return <Ionicons name={iconName} size={size} color={color} />;
            },
        })}
    >
        <Tab.Screen name="Tunes" component={TunesStack} />
        <Tab.Screen name="Garage" component={GarageStack} />
        <Tab.Screen name="Flash" component={FlashStack} />
        <Tab.Screen name="Profile" component={ProfileStack} />
    </Tab.Navigator>
);

// --- Root App Navigator ---

export const AppNavigator = () => {
    const { isAuthenticated, checkAuth, isLoading, isOnboarded } = useAppStore();

    useEffect(() => {
        checkAuth();
    }, []);

    if (isLoading) {
        return (
            <View style={{ flex: 1, backgroundColor: Theme.Colors.background, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color={Theme.Colors.primary} />
            </View>
        );
    }

    if (isAuthenticated) {
        return (
            <NavigationContainer>
                {isOnboarded ? <MainNavigator /> : (
                    <AuthStack.Navigator screenOptions={{ headerShown: false, cardStyle: { backgroundColor: Theme.Colors.background } }}>
                        <AuthStack.Screen name="Onboarding" component={OnboardingScreen} />
                    </AuthStack.Navigator>
                )}
            </NavigationContainer>
        );
    }

    return (
        <NavigationContainer>
            <AuthNavigator />
        </NavigationContainer>
    );
};
