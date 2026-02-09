import AsyncStorage from '@react-native-async-storage/async-storage';

export const StorageAdapter = {
    set: async (key: string, value: any) => {
        try {
            const jsonValue = JSON.stringify(value);
            await AsyncStorage.setItem(key, jsonValue);
        } catch (e) {
            console.error('StorageAdapter Set Error', e);
        }
    },

    get: async <T>(key: string): Promise<T | null> => {
        try {
            const jsonValue = await AsyncStorage.getItem(key);
            return jsonValue != null ? JSON.parse(jsonValue) : null;
        } catch (e) {
            console.error('StorageAdapter Get Error', e);
            return null;
        }
    },

    getString: async (key: string): Promise<string | undefined> => {
        const val = await AsyncStorage.getItem(key);
        return val === null ? undefined : val;
    },

    setString: async (key: string, value: string) => {
        await AsyncStorage.setItem(key, value);
    },

    delete: async (key: string) => {
        await AsyncStorage.removeItem(key);
    },

    clearAll: async () => {
        await AsyncStorage.clear();
    }
};
