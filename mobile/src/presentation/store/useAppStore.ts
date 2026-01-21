import { create } from 'zustand';
import { ServiceLocator } from '../../di/ServiceLocator';
import { Bike, Tune } from '../../domain/services/DomainTypes';
import { FlashSession } from '../../domain/entities/FlashSession';
import { User } from '../../domain/entities/User';

interface AppState {
    // Auth
    isLoading: boolean;
    isAuthenticated: boolean;
    currentUser: User | null;
    signIn: (email: string, pass: string) => Promise<boolean>;
    signUp: (email: string, pass: string) => Promise<boolean>;
    signOut: () => Promise<void>;
    checkAuth: () => Promise<void>;

    // Connection
    isConnected: boolean;
    connectedDeviceId: string | null;
    connect: (deviceId: string) => Promise<void>;
    disconnect: () => Promise<void>;

    // Bike
    activeBike: Bike | null;
    loadActiveBike: () => Promise<void>;

    // Flash
    flashSession: FlashSession | null;
    startFlash: (tune: Tune) => Promise<void>;

    isOnboarded: boolean;
    completeOnboarding: () => Promise<void>;
}

export const useAppStore = create<AppState>((set, get) => ({
    // Auth
    isLoading: true,
    isAuthenticated: false,
    currentUser: null,

    checkAuth: async () => {
        set({ isLoading: true });
        const user = await ServiceLocator.getAuthService().getCurrentUser();
        set({
            currentUser: user,
            isAuthenticated: !!user,
            isLoading: false
        });
    },

    signIn: async (email, pass) => {
        set({ isLoading: true });
        const result = await ServiceLocator.getAuthService().signIn(email, pass);
        if (result.success && result.user) {
            set({ currentUser: result.user, isAuthenticated: true, isLoading: false });
            return true;
        }
        set({ isLoading: false });
        return false;
    },

    signUp: async (email, pass) => {
        set({ isLoading: true });
        const result = await ServiceLocator.getAuthService().signUp(email, pass);
        if (result.success && result.user) {
            set({ currentUser: result.user, isAuthenticated: true, isLoading: false });
            return true;
        }
        set({ isLoading: false });
        // In real app we might throw error or return object with message
        return false;
    },

    signOut: async () => {
        set({ isLoading: true });
        await ServiceLocator.getAuthService().signOut();
        set({ currentUser: null, isAuthenticated: false, isLoading: false });
    },

    // -----------------------------------------------------------------

    isConnected: false,
    connectedDeviceId: null,

    connect: async (deviceId: string) => {
        const service = ServiceLocator.getDeviceService();
        await service.connect(deviceId);
        set({ isConnected: true, connectedDeviceId: deviceId });
    },

    disconnect: async () => {
        const { connectedDeviceId } = get();
        if (connectedDeviceId) {
            await ServiceLocator.getDeviceService().disconnect(connectedDeviceId);
        }
        set({ isConnected: false, connectedDeviceId: null });
    },

    activeBike: null,
    loadActiveBike: async () => {
        const bike = await ServiceLocator.getBikeService().getActiveBike();
        set({ activeBike: bike });
    },

    flashSession: null,
    startFlash: async (tune: Tune) => {
        const ecuService = ServiceLocator.getECUService();

        try {
            const backupPath = await ecuService.readECU((progress) => {
                // Implementation detail: update session progress in store? 
            });

            await ecuService.flashTune(tune, backupPath, (progress) => {
                // Update UI via transient state or just let the component subscribe to the service directly if needed
            });

        } catch (e) {
            console.error(e);
        }
    },

    isOnboarded: false,
    completeOnboarding: async () => {
        // Persist this setting locally
        set({ isOnboarded: true });
    },
}));
