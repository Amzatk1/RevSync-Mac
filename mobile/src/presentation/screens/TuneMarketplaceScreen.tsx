import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, ActivityIndicator, RefreshControl, Alert } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { Theme } from '../theme';
import { Screen } from '../components/SharedComponents';
import { Ionicons } from '@expo/vector-icons';
import { ServiceLocator } from '../../di/ServiceLocator';
import { Tune, TuneFilter } from '../../domain/services/DomainTypes';
import { TuneCard } from '../components/TuneCard';
import { useAppStore } from '../store/useAppStore';

export const TuneMarketplaceScreen = ({ navigation }: any) => {
    const { activeBike } = useAppStore();
    const [tunes, setTunes] = useState<Tune[]>([]);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    // Filters
    const [filterStage, setFilterStage] = useState<number | null>(null);
    const [onlySafe, setOnlySafe] = useState(false);
    const [compatibleOnly, setCompatibleOnly] = useState(true);

    const fetchTunes = useCallback(async (isRefresh = false) => {
        if (!isRefresh) setLoading(true);
        try {
            const tuneService = ServiceLocator.getTuneService();
            const filter: TuneFilter = {
                searchQuery,
                onlySafe,
                minStage: filterStage || undefined,
                compatibleBikeId: compatibleOnly ? activeBike?.id : undefined
            };

            const results = await tuneService.getTunes(filter, 1);
            setTunes(results);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
            if (isRefresh) setRefreshing(false);
        }
    }, [searchQuery, filterStage, onlySafe, compatibleOnly, activeBike]);

    useEffect(() => {
        fetchTunes();
    }, [fetchTunes]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchTunes(true);
    };

    const renderHeader = () => (
        <View style={styles.headerContainer}>
            <Text style={styles.title}>Tune Marketplace</Text>

            {/* Search Bar */}
            <View style={styles.searchBar}>
                <Ionicons name="search" size={20} color={Theme.Colors.textSecondary} />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search tunes..."
                    placeholderTextColor={Theme.Colors.textSecondary}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                />
                {searchQuery.length > 0 && (
                    <TouchableOpacity onPress={() => setSearchQuery('')}>
                        <Ionicons name="close-circle" size={20} color={Theme.Colors.textSecondary} />
                    </TouchableOpacity>
                )}
            </View>

            {/* Filter Chips */}
            <View style={styles.filtersScroll}>
                <TouchableOpacity
                    style={[styles.filterChip, compatibleOnly && styles.activeChip]}
                    onPress={() => setCompatibleOnly(!compatibleOnly)}
                >
                    <Text style={[styles.chipText, compatibleOnly && styles.activeChipText]}>
                        {activeBike ? `For ${activeBike.make} ${activeBike.model}` : 'Compatible Only'}
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.filterChip, onlySafe && styles.activeChip]}
                    onPress={() => setOnlySafe(!onlySafe)}
                >
                    <Ionicons name="shield-checkmark" size={14} color={onlySafe ? '#000' : Theme.Colors.text} style={{ marginRight: 4 }} />
                    <Text style={[styles.chipText, onlySafe && styles.activeChipText]}>Safe Rated</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.filterChip, filterStage === 1 && styles.activeChip]}
                    onPress={() => setFilterStage(filterStage === 1 ? null : 1)}
                >
                    <Text style={[styles.chipText, filterStage === 1 && styles.activeChipText]}>Stage 1</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.filterChip, filterStage === 2 && styles.activeChip]}
                    onPress={() => setFilterStage(filterStage === 2 ? null : 2)}
                >
                    <Text style={[styles.chipText, filterStage === 2 && styles.activeChipText]}>Stage 2</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.filterChip, filterStage === 3 && styles.activeChip]}
                    onPress={() => setFilterStage(filterStage === 3 ? null : 3)}
                >
                    <Text style={[styles.chipText, filterStage === 3 && styles.activeChipText]}>Stage 3</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    const handleImport = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: '*/*',
                copyToCacheDirectory: true,
            });

            if (!result.canceled && result.assets && result.assets.length > 0) {
                const file = result.assets[0];
                const newTune: Tune = {
                    id: `import-${Date.now()}`,
                    title: file.name.replace(/\.[^/.]+$/, ""), // Remove extension
                    bikeId: activeBike?.id || 'unknown',
                    stage: 0,
                    price: 0,
                    safetyRating: 100, // User imported, assume they trust it
                    compatibilityRaw: [],
                    description: `Imported from ${file.name}`,
                    version: 'Custom',
                    checksum: 'imported-checksum',
                };

                const tuneService = ServiceLocator.getTuneService();
                await tuneService.importTune(newTune);
                setTunes(prev => [newTune, ...prev]);
                Alert.alert('Success', 'Custom tune imported successfully!');
            }
        } catch (err) {
            console.log('Import cancelled or failed', err);
            Alert.alert('Error', 'Failed to import tune.');
        }
    };

    return (
        <Screen>
            {renderHeader()}

            {loading && !refreshing ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={Theme.Colors.primary} />
                </View>
            ) : (
                <FlatList
                    data={tunes}
                    keyExtractor={item => item.id}
                    renderItem={({ item }) => (
                        <TuneCard
                            tune={item}
                            onPress={() => navigation.navigate('TuneDetails', { tuneId: item.id })}
                        />
                    )}
                    contentContainerStyle={styles.listContent}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Theme.Colors.primary} />
                    }
                    ListHeaderComponent={
                        <TouchableOpacity style={styles.importButton} onPress={handleImport}>
                            <Ionicons name="cloud-upload-outline" size={24} color={Theme.Colors.primary} />
                            <Text style={styles.importText}>Import from File...</Text>
                        </TouchableOpacity>
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyState}>
                            <Ionicons name="documents-outline" size={64} color={Theme.Colors.textSecondary} />
                            <Text style={styles.emptyText}>No tunes found matching your filters.</Text>
                        </View>
                    }
                />
            )}
        </Screen>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Theme.Colors.background,
    },
    headerContainer: {
        paddingHorizontal: Theme.Spacing.md,
        paddingBottom: Theme.Spacing.sm,
        backgroundColor: Theme.Colors.background,
    },
    title: {
        ...Theme.Typography.h2,
        marginBottom: Theme.Spacing.md,
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.04)',
        borderRadius: 24,
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.06)',
        marginBottom: Theme.Spacing.md,
    },
    searchInput: {
        flex: 1,
        color: Theme.Colors.text,
        marginLeft: 8,
        fontSize: 16,
    },
    filtersScroll: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    filterChip: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        backgroundColor: Theme.Colors.surface,
        borderWidth: 1,
        borderColor: Theme.Colors.border,
    },
    activeChip: {
        backgroundColor: Theme.Colors.primary,
        borderColor: Theme.Colors.primary,
    },
    chipText: {
        color: Theme.Colors.text,
        fontSize: 14,
        fontWeight: '500',
    },
    activeChipText: {
        color: '#000',
        fontWeight: '700',
    },
    listContent: {
        padding: Theme.Spacing.md,
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyState: {
        padding: Theme.Spacing.xl,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyText: {
        color: Theme.Colors.textSecondary,
        marginTop: Theme.Spacing.md,
        fontSize: 16,
    },
    importButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        borderWidth: 1,
        borderColor: Theme.Colors.primary,
        borderStyle: 'dashed',
        borderRadius: 12,
        marginBottom: Theme.Spacing.md,
        backgroundColor: 'rgba(225, 29, 72, 0.04)',
    },
    importText: {
        color: Theme.Colors.primary,
        fontWeight: 'bold',
        marginLeft: 8,
        fontSize: 16,
    },
});
