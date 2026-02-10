import React, { useEffect } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { NavigationContainer } from '@react-navigation/native';
import { Theme } from '../theme';
import { Ionicons } from '@expo/vector-icons';
import { useAppStore } from '../store/useAppStore';
import { Animated, Text, View } from 'react-native';

// Tunes Screens
import { TuneMarketplaceScreen } from '../screens/TuneMarketplaceScreen';
import { TuneDetailsScreen } from '../screens/tunes/TuneDetailsScreen';
import { TuneValidationScreen } from '../screens/tunes/TuneValidationScreen';
import { CheckoutScreen } from '../screens/tunes/CheckoutScreen';
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
        <AuthStack.Screen name="LegalDocument" component={LegalDocumentScreen} />
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
                backgroundColor: '#18181B',
                borderTopWidth: 0,
                paddingBottom: 8,
                paddingTop: 8,
                height: 68,
                elevation: 24,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: -4 },
                shadowOpacity: 0.3,
                shadowRadius: 12,
            },
            tabBarActiveTintColor: Theme.Colors.primary,
            tabBarInactiveTintColor: '#52525B',
            tabBarLabelStyle: {
                fontSize: 11,
                fontWeight: '600',
                letterSpacing: 0.2,
            },
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

                return <Ionicons name={iconName} size={focused ? 26 : 24} color={color} />;
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

    // --- Loading Screen Animations ---
    const loadLogoScale = React.useRef(new Animated.Value(0)).current;
    const loadGlow = React.useRef(new Animated.Value(0.3)).current;
    const loadBarAnim = React.useRef(new Animated.Value(0)).current;

    React.useEffect(() => {
        if (isLoading) {
            Animated.spring(loadLogoScale, { toValue: 1, friction: 5, tension: 50, useNativeDriver: true }).start();
            Animated.loop(Animated.sequence([
                Animated.timing(loadGlow, { toValue: 0.8, duration: 1500, useNativeDriver: true }),
                Animated.timing(loadGlow, { toValue: 0.3, duration: 1500, useNativeDriver: true }),
            ])).start();
            Animated.loop(Animated.sequence([
                Animated.timing(loadBarAnim, { toValue: 1, duration: 1200, useNativeDriver: false }),
                Animated.timing(loadBarAnim, { toValue: 0, duration: 0, useNativeDriver: false }),
            ])).start();
        }
    }, [isLoading]);

    if (isLoading) {
        return (
            <View style={{ flex: 1, backgroundColor: '#09090B', justifyContent: 'center', alignItems: 'center' }}>
                {/* Background glow */}
                <Animated.View style={{
                    position: 'absolute', width: 200, height: 200, borderRadius: 100,
                    backgroundColor: Theme.Colors.primary, opacity: loadGlow,
                }} />
                {/* Logo ring */}
                <Animated.View style={{
                    width: 100, height: 100, borderRadius: 50,
                    borderWidth: 2, borderColor: 'rgba(225,29,72,0.45)',
                    backgroundColor: 'rgba(225,29,72,0.1)',
                    justifyContent: 'center', alignItems: 'center',
                    transform: [{ scale: loadLogoScale }],
                    shadowColor: Theme.Colors.primary, shadowOffset: { width: 0, height: 0 },
                    shadowOpacity: 0.4, shadowRadius: 20,
                }}>
                    <Ionicons name="speedometer" size={48} color={Theme.Colors.primary} />
                </Animated.View>
                {/* Title */}
                <Text style={{
                    fontSize: 32, fontWeight: '800', color: '#FAFAFA', marginTop: 16, letterSpacing: -0.5,
                    textShadowColor: 'rgba(225,29,72,0.3)', textShadowOffset: { width: 0, height: 4 }, textShadowRadius: 16
                }}>
                    RevSync
                </Text>
                {/* Loading bar */}
                <View style={{
                    width: 160, height: 3, backgroundColor: 'rgba(255,255,255,0.06)',
                    borderRadius: 2, marginTop: 32, overflow: 'hidden'
                }}>
                    <Animated.View style={{
                        width: '40%', height: '100%', borderRadius: 2,
                        backgroundColor: Theme.Colors.primary,
                        transform: [{ translateX: loadBarAnim.interpolate({ inputRange: [0, 1], outputRange: [-64, 160] }) }],
                    }} />
                </View>
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
