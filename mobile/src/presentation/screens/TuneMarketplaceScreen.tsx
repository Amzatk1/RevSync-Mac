import React, { useEffect, useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TextInput,
    TouchableOpacity,
    RefreshControl,
    Alert,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ServiceLocator } from '../../di/ServiceLocator';
import { Tune, TuneFilter } from '../../domain/services/DomainTypes';
import { TuneCard } from '../components/TuneCard';
import { SkeletonTuneCard } from '../components/SkeletonCards';
import { useAppStore } from '../store/useAppStore';
import { AppScreen, TopBar, GlassCard, Chip, SectionLabel } from '../components/AppUI';
import { Theme } from '../theme';

export const TuneMarketplaceScreen = ({ navigation }: any) => {
    const insets = useSafeAreaInsets();
    const { activeBike } = useAppStore();

    const [tunes, setTunes] = useState<Tune[]>([]);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

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
                compatibleBikeId: compatibleOnly ? activeBike?.id : undefined,
            };
            const results = await tuneService.getTunes(filter, 1);
            setTunes(results);
        } catch (error) {
            console.warn('Marketplace: fetch failed', error);
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
            if (!result.canceled && result.assets?.length) {
                const file = result.assets[0];
                const tune: Tune = {
                    id: `import-${Date.now()}`,
                    title: file.name.replace(/\.[^/.]+$/, ''),
                    bikeId: activeBike?.id || 'unknown',
                    stage: 0,
                    price: 0,
                    safetyRating: 92,
                    compatibilityRaw: [],
                    description: `Imported from ${file.name}`,
                    version: 'Custom',
                    checksum: 'imported',
                };
                await ServiceLocator.getTuneService().importTune(tune);
                setTunes(prev => [tune, ...prev]);
                Alert.alert('Imported', `${file.name} is now available in your library.`);
            }
        } catch (err) {
            console.warn('Import failed', err);
            Alert.alert('Import failed', 'Could not import tune file.');
        }
    };

    const stats = {
        total: tunes.length,
        safe: tunes.filter(t => t.safetyRating >= 90).length,
        stage2plus: tunes.filter(t => t.stage >= 2).length,
    };

    return (
        <AppScreen>
            <TopBar
                title="Tune Marketplace"
                subtitle="Discover validated maps for your build"
                right={
                    <TouchableOpacity style={styles.iconAction} onPress={handleImport} activeOpacity={0.75}>
                        <Ionicons name="cloud-upload-outline" size={18} color={Theme.Colors.text} />
                    </TouchableOpacity>
                }
            />

            <FlatList
                data={loading && !refreshing ? [] : tunes}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <TuneCard
                        tune={item}
                        onPress={() => navigation.navigate('TuneDetails', { tuneId: item.id })}
                    />
                )}
                contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: insets.bottom + 110 }}
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Theme.Colors.primary} />}
                ListHeaderComponent={
                    <>
                        <GlassCard style={styles.heroCard}>
                            <LinearGradient
                                colors={['rgba(234,16,60,0.18)', 'rgba(234,16,60,0.02)']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                style={StyleSheet.absoluteFill}
                            />
                            <View style={styles.heroTop}>
                                <Text style={styles.heroLabel}>LIVE CATALOG</Text>
                                <Text style={styles.heroTitle}>Built for riders, tuned for confidence.</Text>
                                <Text style={styles.heroBody}>
                                    Compatibility-aware tune discovery with safety scoring and instant entitlement checks.
                                </Text>
                            </View>
                            <View style={styles.statsRow}>
                                <StatPill label="Total" value={String(stats.total)} />
                                <StatPill label="Safe" value={String(stats.safe)} />
                                <StatPill label="Stage 2+" value={String(stats.stage2plus)} />
                            </View>
                        </GlassCard>

                        <View style={styles.searchWrap}>
                            <Ionicons name="search" size={18} color={Theme.Colors.textSecondary} />
                            <TextInput
                                style={styles.searchInput}
                                placeholder="Search by tune, bike, or tuner"
                                placeholderTextColor={Theme.Colors.textTertiary}
                                value={searchQuery}
                                onChangeText={setSearchQuery}
                            />
                            {!!searchQuery && (
                                <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={8}>
                                    <Ionicons name="close-circle" size={18} color={Theme.Colors.textTertiary} />
                                </TouchableOpacity>
                            )}
                        </View>

                        <SectionLabel label="Filters" />
                        <View style={styles.chipsWrap}>
                            <Chip label="Compatible" icon="checkmark-circle-outline" active={compatibleOnly} onPress={() => setCompatibleOnly(!compatibleOnly)} />
                            <Chip label="Safety 90+" icon="shield-checkmark-outline" active={onlySafe} onPress={() => setOnlySafe(!onlySafe)} />
                            <Chip label="Stage 1+" active={filterStage !== null} onPress={() => setFilterStage(filterStage ? null : 1)} />
                            <Chip label={activeBike ? `${activeBike.make} ${activeBike.model}` : 'No active bike'} />
                        </View>

                        {loading && !refreshing && (
                            <View style={{ marginTop: 8 }}>
                                <SkeletonTuneCard />
                                <SkeletonTuneCard />
                                <SkeletonTuneCard />
                            </View>
                        )}
                    </>
                }
                ListEmptyComponent={
                    !loading ? (
                        <GlassCard style={styles.emptyCard}>
                            <Ionicons name="library-outline" size={34} color={Theme.Colors.textSecondary} />
                            <Text style={styles.emptyTitle}>No tunes matched your current filters</Text>
                            <Text style={styles.emptyBody}>Try clearing filters or importing a tune package manually.</Text>
                            <TouchableOpacity style={styles.emptyAction} onPress={handleImport} activeOpacity={0.8}>
                                <Ionicons name="cloud-upload-outline" size={16} color={Theme.Colors.text} />
                                <Text style={styles.emptyActionText}>Import from file</Text>
                            </TouchableOpacity>
                        </GlassCard>
                    ) : null
                }
            />
        </AppScreen>
    );
};

const StatPill = ({ label, value }: { label: string; value: string }) => (
    <View style={styles.statPill}>
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statLabel}>{label}</Text>
    </View>
);

const styles = StyleSheet.create({
    iconAction: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255,255,255,0.06)',
        borderWidth: 1,
        borderColor: Theme.Colors.border,
    },
    heroCard: {
        overflow: 'hidden',
        marginTop: 4,
    },
    heroTop: {
        gap: 6,
    },
    heroLabel: {
        fontSize: 10,
        fontWeight: '800',
        textTransform: 'uppercase',
        letterSpacing: 1.1,
        color: '#FB7185',
    },
    heroTitle: {
        fontSize: 24,
        lineHeight: 28,
        letterSpacing: -0.45,
        fontWeight: '800',
        color: Theme.Colors.text,
    },
    heroBody: {
        fontSize: 13,
        color: Theme.Colors.textSecondary,
        lineHeight: 19,
    },
    statsRow: {
        marginTop: 12,
        flexDirection: 'row',
        gap: 8,
    },
    statPill: {
        flex: 1,
        borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.06)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        paddingVertical: 8,
        alignItems: 'center',
    },
    statValue: {
        fontSize: 15,
        fontWeight: '800',
        color: Theme.Colors.text,
    },
    statLabel: {
        marginTop: 2,
        fontSize: 10,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 0.8,
        color: Theme.Colors.textSecondary,
    },
    searchWrap: {
        marginTop: 12,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: Theme.Colors.border,
        backgroundColor: 'rgba(16,17,25,0.78)',
        paddingHorizontal: 12,
        paddingVertical: 10,
    },
    searchInput: {
        flex: 1,
        color: Theme.Colors.text,
        fontSize: 14,
        paddingVertical: 0,
    },
    chipsWrap: {
        marginBottom: 12,
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    emptyCard: {
        marginTop: 12,
        alignItems: 'center',
        paddingVertical: 24,
        gap: 8,
    },
    emptyTitle: {
        marginTop: 3,
        fontSize: 17,
        fontWeight: '800',
        color: Theme.Colors.text,
        textAlign: 'center',
    },
    emptyBody: {
        maxWidth: 280,
        textAlign: 'center',
        fontSize: 13,
        lineHeight: 19,
        color: Theme.Colors.textSecondary,
    },
    emptyAction: {
        marginTop: 8,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 7,
        borderRadius: 999,
        paddingHorizontal: 14,
        paddingVertical: 9,
        backgroundColor: 'rgba(234,16,60,0.16)',
        borderWidth: 1,
        borderColor: 'rgba(234,16,60,0.3)',
    },
    emptyActionText: {
        fontSize: 12,
        fontWeight: '800',
        letterSpacing: 0.3,
        color: Theme.Colors.text,
        textTransform: 'uppercase',
    },
});
