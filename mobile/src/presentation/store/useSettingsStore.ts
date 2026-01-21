import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface SettingsState {
    // Preferences
    units: 'metric' | 'imperial';
    darkMode: boolean;
    notificationsEnabled: boolean;
    safetyModeEnabled: boolean;
    keepScreenAwake: boolean;

    // Actions
    toggleUnits: () => void;
    toggleDarkMode: () => void;
    toggleNotifications: () => void;
    toggleSafetyMode: () => void;
    toggleKeepScreenAwake: () => void;

    // Privacy
    analyticsEnabled: boolean;
    crashReports: boolean;
    recommendationsEnabled: boolean;
    toggleAnalytics: () => void;
    toggleCrashReports: () => void;
    toggleRecommendations: () => void;
}

export const useSettingsStore = create<SettingsState>()(
    persist(
        (set) => ({
            units: 'metric',
            darkMode: true,
            notificationsEnabled: true,
            safetyModeEnabled: true,
            keepScreenAwake: true,

            toggleUnits: () => set((state) => ({ units: state.units === 'metric' ? 'imperial' : 'metric' })),
            toggleDarkMode: () => set((state) => ({ darkMode: !state.darkMode })),
            toggleNotifications: () => set((state) => ({ notificationsEnabled: !state.notificationsEnabled })),
            toggleSafetyMode: () => set((state) => ({ safetyModeEnabled: !state.safetyModeEnabled })),
            toggleKeepScreenAwake: () => set((state) => ({ keepScreenAwake: !state.keepScreenAwake })),

            // Privacy
            analyticsEnabled: true,
            crashReports: true,
            recommendationsEnabled: true,
            toggleAnalytics: () => set((state) => ({ analyticsEnabled: !state.analyticsEnabled })),
            toggleCrashReports: () => set((state) => ({ crashReports: !state.crashReports })),
            toggleRecommendations: () => set((state) => ({ recommendationsEnabled: !state.recommendationsEnabled })),
        }),
        {
            name: 'revsync-settings',
            storage: createJSONStorage(() => AsyncStorage),
        }
    )
);
