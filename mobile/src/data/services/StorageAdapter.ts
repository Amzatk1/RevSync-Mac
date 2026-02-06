import { MMKV } from 'react-native-mmkv';

// @ts-ignore
export const storage = new MMKV();

export const StorageAdapter = {
    set: (key: string, value: any) => {
        try {
            const jsonValue = JSON.stringify(value);
            storage.set(key, jsonValue);
        } catch (e) {
            console.error('StorageAdapter Set Error', e);
        }
    },

    get: <T>(key: string): T | null => {
        try {
            const jsonValue = storage.getString(key);
            return jsonValue != null ? JSON.parse(jsonValue) : null;
        } catch (e) {
            console.error('StorageAdapter Get Error', e);
            return null;
        }
    },

    getString: (key: string): string | undefined => {
        return storage.getString(key);
    },

    setString: (key: string, value: string) => {
        storage.set(key, value);
    },

    delete: (key: string) => {
        storage.delete(key);
    },

    clearAll: () => {
        storage.clearAll();
    }
};
