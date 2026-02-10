import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TextInput,
    TouchableOpacity,
    ActivityIndicator,
    RefreshControl,
    Alert,
    ScrollView,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { Theme } from '../theme';
import { Screen } from '../components/SharedComponents';
import { Ionicons } from '@expo/vector-icons';
import { ServiceLocator } from '../../di/ServiceLocator';
import { Tune, TuneFilter } from '../../domain/services/DomainTypes';
import { useAppStore } from '../store/useAppStore';

const FILTERS = ['Make/Model', 'Stage', 'Safety', 'Price'];

const getStageBadgeStyle = (stage: number) => {
    if (stage === 2) return { bg: 'rgba(225, 29, 72, 0.14)', color: '#FB7185', border: 'rgba(225, 29, 72, 0.28)', text: 'STAGE 2' };
    if (stage === 3) return { bg: 'rgba(168, 85, 247, 0.15)', color: '#C084FC', border: 'rgba(168, 85, 247, 0.35)', text: 'STAGE 3' };
    if (stage <= 0) return { bg: 'rgba(115, 115, 115, 0.15)', color: '#D4D4D8', border: 'rgba(115, 115, 115, 0.3)', text: 'ECO' };
    return { bg: 'rgba(113, 113, 122, 0.28)', color: '#E4E4E7', border: 'rgba(113, 113, 122, 0.35)', text: `STAGE ${stage}` };
};

const isCompatible = (tune: Tune) => tune.safetyRating >= 80;

export const TuneMarketplaceScreen = ({ navigation }: any) => {
    const { activeBike } = useAppStore();
    const [tunes, setTunes] = useState<Tune[]>([]);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const [filterStage, setFilterStage] = useState<number | null>(null);
    const [onlySafe, setOnlySafe] = useState(false);
    const [compatibleOnly, setCompatibleOnly] = useState(true);
    const [activeFilter, setActiveFilter] = useState('Make/Model');

    const fetchTunes = useCallback(async (isRefresh = false) => {
        if (!isRefresh) setLoading(true);
        try {
            const tuneService = ServiceLocator.getTuneService();
            const filter: TuneFilter = {
                searchQuery,
                onlySafe,
                minStage: filterStage || undefined,
                compatibleBikeId: compatibleOnly ? activeBike?.id : undefined,
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

    const displayedTunes = useMemo(() => {
        const filteredBySearch = tunes.filter(t => {
            if (!searchQuery.trim()) return true;
            const q = searchQuery.toLowerCase();
            return (
                t.title.toLowerCase().includes(q)
                || t.description?.toLowerCase().includes(q)
            );
        });

        return filteredBySearch.sort((a, b) => b.safetyRating - a.safetyRating);
    }, [tunes, searchQuery]);

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
                    title: file.name.replace(/\.[^/.]+$/, ''),
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

    const renderListHeader = () => (
        <>
            <View style={styles.pageHeader}>
                <Text style={styles.title}>Tunes</Text>
                <TouchableOpacity style={styles.filterButton} activeOpacity={0.85}>
                    <Ionicons name="filter" size={20} color={Theme.Colors.textSecondary} />
                </TouchableOpacity>
            </View>

            <View style={styles.searchWrap}>
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
                        <Ionicons name="close-circle" size={18} color={Theme.Colors.textSecondary} />
                    </TouchableOpacity>
                )}
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
                {FILTERS.map(label => {
                    const selected = activeFilter === label;
                    return (
                        <TouchableOpacity
                            key={label}
                            style={[styles.chip, selected && styles.activeChip]}
                            onPress={() => {
                                setActiveFilter(label);
                                if (label === 'Stage') setFilterStage(filterStage ? null : 1);
                                if (label === 'Safety') setOnlySafe(v => !v);
                                if (label === 'Make/Model') setCompatibleOnly(v => !v);
                            }}
                        >
                            <Text style={[styles.chipText, selected && styles.activeChipText]}>{label}</Text>
                        </TouchableOpacity>
                    );
                })}
            </ScrollView>

            <TouchableOpacity style={styles.importButton} onPress={handleImport}>
                <Ionicons name="cloud-upload-outline" size={20} color={Theme.Colors.primary} />
                <Text style={styles.importText}>Import from File...</Text>
            </TouchableOpacity>
        </>
    );

    const renderTuneCard = ({ item }: { item: Tune }) => {
        const stage = getStageBadgeStyle(item.stage);
        const compatible = isCompatible(item);
        return (
            <TouchableOpacity
                activeOpacity={0.88}
                onPress={() => navigation.navigate('TuneDetails', { tuneId: item.id })}
                style={styles.tuneCard}
            >
                <View style={styles.cardTopRow}>
                    <View style={styles.badgeRow}>
                        <View style={[styles.stageBadge, { backgroundColor: stage.bg, borderColor: stage.border }]}> 
                            <Text style={[styles.stageBadgeText, { color: stage.color }]}>{stage.text}</Text>
                        </View>
                        {compatible && (
                            <View style={styles.compatBadge}>
                                <Ionicons name="checkmark-circle" size={12} color="#4ADE80" />
                                <Text style={styles.compatText}>COMPATIBLE</Text>
                            </View>
                        )}
                    </View>
                    <View style={styles.ratingBadge}>
                        <Ionicons name="star" size={14} color="#FACC15" />
                        <Text style={styles.ratingText}>{(item.safetyRating / 20).toFixed(1)}</Text>
                    </View>
                </View>

                <View style={styles.cardBodyRow}>
                    <View style={styles.thumb}>
                        <Ionicons name="analytics-outline" size={20} color="rgba(255,255,255,0.5)" />
                    </View>

                    <View style={styles.infoCol}>
                        <Text style={styles.tuneTitle} numberOfLines={1}>{item.title}</Text>
                        <View style={styles.tunerRow}>
                            <Ionicons name="person" size={14} color={Theme.Colors.textSecondary} />
                            <Text style={styles.tunerText} numberOfLines={1}>{item.description || 'RevSync Verified Tuner'}</Text>
                        </View>
                        <Text style={styles.priceText}>{item.price <= 0 ? 'Free' : `$${item.price.toFixed(2)}`}</Text>
                    </View>

                    <View style={styles.nextBtn}>
                        <Ionicons name="arrow-forward" size={24} color={Theme.Colors.primary} />
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <Screen>
            {loading && !refreshing ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={Theme.Colors.primary} />
                </View>
            ) : (
                <FlatList
                    data={displayedTunes}
                    keyExtractor={item => item.id}
                    renderItem={renderTuneCard}
                    ListHeaderComponent={renderListHeader}
                    contentContainerStyle={styles.listContent}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Theme.Colors.primary} />}
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
    listContent: {
        paddingHorizontal: 16,
        paddingTop: 56,
        paddingBottom: 110,
        backgroundColor: '#141416',
    },
    pageHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 18,
    },
    title: {
        color: Theme.Colors.text,
        fontSize: 54,
        fontWeight: '800',
        letterSpacing: -1,
    },
    filterButton: {
        width: 72,
        height: 72,
        borderRadius: 36,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.14)',
        backgroundColor: '#2A2A2F',
    },
    searchWrap: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.11)',
        backgroundColor: '#25262B',
        paddingHorizontal: 14,
        height: 78,
        marginBottom: 14,
    },
    searchInput: {
        flex: 1,
        marginLeft: 10,
        color: Theme.Colors.text,
        fontSize: 18,
    },
    filterRow: {
        gap: 10,
        marginBottom: 14,
    },
    chip: {
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.16)',
        backgroundColor: '#2A2A2F',
    },
    activeChip: {
        backgroundColor: Theme.Colors.primary,
        borderColor: Theme.Colors.primary,
    },
    chipText: {
        color: '#D4D4D8',
        fontSize: 15,
        fontWeight: '600',
    },
    activeChipText: {
        color: '#FFFFFF',
    },
    importButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderStyle: 'dashed',
        borderColor: Theme.Colors.primary,
        borderRadius: 14,
        paddingVertical: 12,
        marginBottom: 14,
        backgroundColor: 'rgba(225,29,72,0.08)',
    },
    importText: {
        color: Theme.Colors.primary,
        fontWeight: '700',
        fontSize: 14,
        marginLeft: 8,
    },
    tuneCard: {
        backgroundColor: '#2D2D31',
        borderRadius: 22,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        padding: 16,
        marginBottom: 14,
    },
    cardTopRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 14,
    },
    badgeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    stageBadge: {
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 10,
        paddingVertical: 4,
    },
    stageBadgeText: {
        fontSize: 11,
        fontWeight: '800',
        letterSpacing: 0.4,
    },
    compatBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        borderWidth: 1,
        borderColor: 'rgba(74,222,128,0.3)',
        backgroundColor: 'rgba(34,197,94,0.12)',
        borderRadius: 8,
        paddingHorizontal: 10,
        paddingVertical: 4,
    },
    compatText: {
        color: '#4ADE80',
        fontSize: 11,
        fontWeight: '800',
    },
    ratingBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.09)',
        backgroundColor: 'rgba(0,0,0,0.16)',
        paddingHorizontal: 10,
        paddingVertical: 4,
    },
    ratingText: {
        color: '#E4E4E7',
        fontSize: 12,
        fontWeight: '800',
    },
    cardBodyRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    thumb: {
        width: 72,
        height: 72,
        borderRadius: 14,
        backgroundColor: '#1D1E22',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.06)',
    },
    infoCol: {
        flex: 1,
    },
    tuneTitle: {
        color: Theme.Colors.text,
        fontSize: 24,
        fontWeight: '800',
        marginBottom: 4,
    },
    tunerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 6,
    },
    tunerText: {
        color: Theme.Colors.textSecondary,
        fontSize: 13,
        fontWeight: '500',
    },
    priceText: {
        color: Theme.Colors.primary,
        fontSize: 24,
        fontWeight: '800',
        letterSpacing: 0.2,
    },
    nextBtn: {
        width: 62,
        height: 62,
        borderRadius: 31,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.18)',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(20,20,20,0.4)',
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
});
