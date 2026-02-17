import React, { useEffect, useState, useCallback } from 'react';
import {
    View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity,
    ActivityIndicator, RefreshControl, Alert, Platform, StatusBar,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { Ionicons } from '@expo/vector-icons';
import { ServiceLocator } from '../../di/ServiceLocator';
import { Tune, TuneFilter } from '../../domain/services/DomainTypes';
import { TuneCard } from '../components/TuneCard';
import { useAppStore } from '../store/useAppStore';

// ── Design tokens ──
const C = {
    primary: '#ea103c',
    bg: '#1a1a1a',
    surface: '#2d2d2d',
    border: '#404040',
    neutral400: '#a3a3a3',
    neutral500: '#a3a3a3',
    neutral600: '#737373',
    neutral700: '#525252',
    white: '#ffffff',
};

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
                    title: file.name.replace(/\.[^/.]+$/, ""),
                    bikeId: activeBike?.id || 'unknown',
                    stage: 0,
                    price: 0,
                    safetyRating: 100,
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

    // ── Filter chip helper ──
    const Chip = ({ label, active, onPress, icon }: any) => (
        <TouchableOpacity
            style={[styles.chip, active && styles.chipActive]}
            onPress={onPress}
            activeOpacity={0.7}
        >
            {icon && <Ionicons name={icon} size={14} color={active ? '#000' : C.white} style={{ marginRight: 4 }} />}
            <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
        </TouchableOpacity>
    );

    const renderHeader = () => (
        <View style={styles.headerContainer}>
            {/* Title + filter icon */}
            <View style={styles.titleRow}>
                <Text style={styles.title}>Tunes</Text>
                <TouchableOpacity style={styles.filterIconBtn}>
                    <Ionicons name="options-outline" size={22} color={C.neutral400} />
                </TouchableOpacity>
            </View>

            {/* Search */}
            <View style={styles.searchBar}>
                <Ionicons name="search" size={20} color={C.neutral500} />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search tunes..."
                    placeholderTextColor={C.neutral500}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                />
                {searchQuery.length > 0 && (
                    <TouchableOpacity onPress={() => setSearchQuery('')}>
                        <Ionicons name="close-circle" size={20} color={C.neutral500} />
                    </TouchableOpacity>
                )}
            </View>

            {/* Filter Chips */}
            <View style={styles.chipRow}>
                <Chip
                    label={activeBike ? 'Make/Model' : 'Make/Model'}
                    active={compatibleOnly}
                    onPress={() => setCompatibleOnly(!compatibleOnly)}
                />
                <Chip
                    label="Stage"
                    active={filterStage !== null}
                    onPress={() => setFilterStage(filterStage ? null : 1)}
                />
                <Chip
                    label="Safety"
                    active={onlySafe}
                    onPress={() => setOnlySafe(!onlySafe)}
                    icon="shield-checkmark"
                />
                <Chip
                    label="Price"
                    active={false}
                    onPress={() => { }}
                />
            </View>
        </View>
    );

    return (
        <View style={styles.root}>
            <StatusBar barStyle="light-content" />

            {renderHeader()}

            {loading && !refreshing ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={C.primary} />
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
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.primary} />
                    }
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={
                        <View style={styles.emptyState}>
                            <Ionicons name="documents-outline" size={48} color={C.neutral600} />
                            <Text style={styles.emptyTitle}>No Tunes Found</Text>
                            <Text style={styles.emptyBody}>No tunes found matching your filters.</Text>
                            <TouchableOpacity style={styles.importBtn} onPress={handleImport}>
                                <Ionicons name="cloud-upload-outline" size={20} color={C.primary} />
                                <Text style={styles.importBtnText}>Import from File</Text>
                            </TouchableOpacity>
                        </View>
                    }
                />
            )}
        </View>
    );
};

// ════════════════════════════════════════════════════════════════════
const styles = StyleSheet.create({
    root: {
        flex: 1,
        backgroundColor: C.bg,
    },

    // ── Header ──
    headerContainer: {
        paddingTop: Platform.OS === 'ios' ? 60 : 44,
        paddingHorizontal: 24,
        paddingBottom: 12,
        backgroundColor: C.bg,
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    title: {
        fontSize: 32,
        fontWeight: '800',
        color: C.white,
        letterSpacing: -0.5,
    },
    filterIconBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: C.surface,
        borderWidth: 1,
        borderColor: C.border,
        alignItems: 'center',
        justifyContent: 'center',
    },

    // ── Search Bar ──
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: C.surface,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: C.border,
        paddingHorizontal: 16,
        paddingVertical: 12,
        marginBottom: 14,
    },
    searchInput: {
        flex: 1,
        color: C.white,
        marginLeft: 10,
        fontSize: 16,
    },

    // ── Chips ──
    chipRow: {
        flexDirection: 'row',
        gap: 8,
    },
    chip: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 50,
        backgroundColor: C.surface,
        borderWidth: 1,
        borderColor: C.border,
    },
    chipActive: {
        backgroundColor: C.primary,
        borderColor: C.primary,
    },
    chipText: {
        fontSize: 13,
        fontWeight: '500',
        color: C.white,
    },
    chipTextActive: {
        color: '#000',
        fontWeight: '700',
    },

    // ── List ──
    listContent: {
        paddingHorizontal: 16,
        paddingTop: 8,
        paddingBottom: 100,
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },

    // ── Empty ──
    emptyState: {
        alignItems: 'center',
        paddingVertical: 48,
        gap: 8,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#D4D4D4',
        marginTop: 8,
    },
    emptyBody: {
        fontSize: 14,
        color: C.neutral500,
        textAlign: 'center',
    },
    importBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginTop: 16,
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: C.primary,
        borderStyle: 'dashed',
        backgroundColor: 'rgba(225,29,72,0.04)',
    },
    importBtnText: {
        fontSize: 14,
        fontWeight: '700',
        color: C.primary,
    },
});
