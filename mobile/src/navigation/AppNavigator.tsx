import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useAuth } from '../auth/context/AuthContext';
import { theme } from '../styles/theme';

// Auth Screens
import LoginScreen from '../auth/screens/LoginScreen';

// Onboarding Screens
import WelcomeOnboardingScreen from '../screens/WelcomeOnboardingScreen';
import OnboardingScreen from '../screens/OnboardingScreen';

// Main App Screens
import HomeScreen from '../screens/HomeScreen';
import GarageScreen from '../screens/GarageScreen';
import MarketplaceScreen from '../screens/MarketplaceScreen';
import CommunityScreen from '../screens/CommunityScreen';
import ProfileScreen from '../screens/ProfileScreen';

// Detail Screens
import BikeDetailScreen from '../screens/BikeDetailScreen';
import TuneDetailScreen from '../screens/TuneDetailScreen';

// Smart Features
import AddBikeScreen from '../screens/AddBikeScreen';
import LiveMonitorScreen from '../screens/LiveMonitorScreen';

// Settings Screens
import SettingsScreen from '../settings/screens/SettingsScreen';
import LegalScreen from '../settings/screens/LegalScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabs() {
    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                headerShown: false,
                tabBarStyle: {
                    backgroundColor: theme.colors.surface,
                    borderTopColor: theme.colors.border,
                },
                tabBarActiveTintColor: theme.colors.primary,
                tabBarInactiveTintColor: theme.colors.textSecondary,
            })}
        >
            <Tab.Screen name="Home" component={HomeScreen} />
            <Tab.Screen name="Garage" component={GarageScreen} />
            <Tab.Screen name="Marketplace" component={MarketplaceScreen} />
            <Tab.Screen name="Community" component={CommunityScreen} />
            <Tab.Screen name="Profile" component={ProfileScreen} />
        </Tab.Navigator>
    );
}

function OnboardingStack() {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="Welcome" component={WelcomeOnboardingScreen} />
            <Stack.Screen name="OnboardingSteps" component={OnboardingScreen} />
        </Stack.Navigator>
    );
}

export default function AppNavigator() {
    const { session, profile, isLoading } = useAuth();

    if (isLoading) {
        return null;
    }

    return (
        <NavigationContainer>
            <Stack.Navigator screenOptions={{ headerShown: false }}>
                {session ? (
                    profile?.has_completed_onboarding ? (
                        <>
                            <Stack.Screen name="Main" component={MainTabs} />

                            {/* Feature Detail Screens */}
                            <Stack.Screen name="BikeDetail" component={BikeDetailScreen} />
                            <Stack.Screen name="TuneDetail" component={TuneDetailScreen} />

                            {/* Smart Features */}
                            <Stack.Screen name="AddBike" component={AddBikeScreen} />
                            <Stack.Screen name="LiveMonitor" component={LiveMonitorScreen} />

                            {/* Settings & Legal */}
                            <Stack.Screen name="Settings" component={SettingsScreen} />
                            <Stack.Screen name="Legal" component={LegalScreen} />
                        </>
                    ) : (
                        <Stack.Screen name="Onboarding" component={OnboardingStack} />
                    )
                ) : (
                    <Stack.Screen name="Login" component={LoginScreen} />
                )}
            </Stack.Navigator>
        </NavigationContainer>
    );
}
