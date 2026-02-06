import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { Theme } from '../../theme';
import { Screen, Card } from '../../components/SharedComponents';
import { Ionicons } from '@expo/vector-icons';
import { StorageAdapter } from '../../data/services/StorageAdapter';
import { Tune } from '../../domain/services/DomainTypes';

const CACHE_KEYS = {
    TUNES_LIST: 'tunes_list_cache',
};

export const DownloadManagerScreen = ({ navigation }: any) => {
    const [downloads, setDownloads] = useState<Tune[]>([]);

    useEffect(() => {
        loadDownloads();
    }, []);

    const loadDownloads = () => {
        const cached = StorageAdapter.get<Tune[]>(CACHE_KEYS.TUNES_LIST);
        if (cached) {
            // For now, we assume everything in cache is "downloaded" or available offline
            // In a real app, we might have a separate 'downloaded_files' key
            setDownloads(cached);
        }
    };

    const handleDelete = (id: string) => {
        Alert.alert(
            "Delete Download",
            "Are you sure you want to remove this tune from offline storage?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: () => {
                        const newDownloads = downloads.filter(t => t.id !== id);
                        setDownloads(newDownloads);
                        StorageAdapter.set(CACHE_KEYS.TUNES_LIST, newDownloads);
                    }
                }
            ]
        );
    };

    const renderItem = ({ item }: { item: Tune }) => (
        <Card style={styles.card}>
            <View style={styles.row}>
                <View style={{ flex: 1 }}>
                    <Text style={styles.title}>{item.title}</Text>
                    <Text style={styles.subtitle}>{item.bikeId} • {item.version}</Text>
                </View>
                <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.deleteBtn}>
                    <Ionicons name="trash-outline" size={20} color={Theme.Colors.error} />
                </TouchableOpacity>
            </View>
        </Card>
    );

    return (
        <Screen>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color={Theme.Colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Downloads & Storage</Text>
            </View>

            {downloads.length === 0 ? (
                <View style={styles.emptyState}>
                    <Ionicons name="cloud-offline-outline" size={64} color={Theme.Colors.textSecondary} />
                    <Text style={styles.emptyText}>No downloaded tunes found.</Text>
                    <Text style={styles.emptySubText}>Purchased tunes will appear here for offline access.</Text>
                </View>
            ) : (
                <FlatList
                    data={downloads}
                    keyExtractor={(item) => item.id}
                    renderItem={renderItem}
                    contentContainerStyle={styles.list}
                />
            )}
        </Screen>
    );
};

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: Theme.Spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: Theme.Colors.surfaceHighlight,
    },
    backBtn: { marginRight: 16 },
    headerTitle: { ...Theme.Typography.h2, fontSize: 20 },
    list: { padding: Theme.Spacing.md },
    card: { marginBottom: 12 },
    row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    title: { ...Theme.Typography.body, fontWeight: 'bold' },
    subtitle: { ...Theme.Typography.caption, color: Theme.Colors.textSecondary, marginTop: 4 },
    deleteBtn: { padding: 8 },
    emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
    emptyText: { ...Theme.Typography.h3, marginTop: 16, textAlign: 'center' },
    emptySubText: { ...Theme.Typography.body, color: Theme.Colors.textSecondary, textAlign: 'center', marginTop: 8 },
});
