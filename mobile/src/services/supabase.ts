import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        storage: {
            getItem: async (key: string) => {
                try {
                    return await SecureStore.getItemAsync(key);
                } catch (e) {
                    console.error('SecureStore getItem failed', e);
                    return null;
                }
            },
            setItem: async (key: string, value: string) => {
                try {
                    await SecureStore.setItemAsync(key, value);
                } catch (e) {
                    console.error('SecureStore setItem failed', e);
                }
            },
            removeItem: async (key: string) => {
                try {
                    await SecureStore.deleteItemAsync(key);
                } catch (e) {
                    console.error('SecureStore removeItem failed', e);
                }
            },
        },
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
    },
});
