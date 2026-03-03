import React, { useEffect, useState, useCallback } from 'react';
import {
    View, Text, StyleSheet, FlatList, TouchableOpacity,
    RefreshControl, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

// ─── Color Tokens ──────────────────────────────────────────────
const C = {
    bg: '#1a1a1a', surface: '#252525', border: 'rgba(255,255,255,0.05)',
    text: '#FFFFFF', muted: '#9ca3af', primary: '#ea103c',
    success: '#22C55E', error: '#EF4444', warning: '#F59E0B', dim: '#525252',
};

interface FlashJob {
    id: string;
    tune_title: string;
    tune_version: string;
    status: 'COMPLETED' | 'FAILED' | 'VERIFY_FAILED' | 'IN_PROGRESS';
    created_at: string;
    verified_at?: string;
    checksum_matched?: boolean;
    error_message?: string;
    bike_name?: string;
}

const STATUS_MAP: Record<string, { icon: string; color: string; label: string }> = {
    COMPLETED: { icon: 'checkmark-circle', color: C.success, label: 'Verified' },
    FAILED: { icon: 'close-circle', color: C.error, label: 'Failed' },
    VERIFY_FAILED: { icon: 'alert-circle', color: C.warning, label: 'Verify Failed' },
    IN_PROGRESS: { icon: 'hourglass', color: '#3B82F6', label: 'In Progress' },
};

export const FlashHistoryScreen = ({ navigation }: any) => {
    const [jobs, setJobs] = useState<FlashJob[]>([]);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    const loadHistory = useCallback(async () => {
        setLoading(true);
        try {
            const { ApiClient } = await import('../../../data/http/ApiClient');
            const resp: any = await ApiClient.getInstance().get('/v1/garage/flash-jobs/');
            const results: FlashJob[] = resp?.results || resp || [];
            setJobs(results.sort((a, b) =>
                new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            ));
        } catch {
            // Offline — show empty
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => { loadHistory(); }, []);

    const onRefresh = () => { setRefreshing(true); loadHistory(); };

    const formatDate = (iso: string) => {
        const d = new Date(iso);
        const now = new Date();
        const diff = now.getTime() - d.getTime();
        if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
        if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
        if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`;
        return d.toLocaleDateString();
    };

    const renderJob = ({ item, index }: { item: FlashJob; index: number }) => {
        const cfg = STATUS_MAP[item.status] || STATUS_MAP.FAILED;
        const isLast = index === jobs.length - 1;
        return (
            <View style={s.timelineItem}>
                {/* Timeline connector */}
                <View style={s.timelineLeft}>
                    <View style={[s.timelineDot, { backgroundColor: cfg.color }]}>
                        <Ionicons name={cfg.icon as any} size={14} color="#FFF" />
                    </View>
                    {!isLast && <View style={s.timelineLine} />}
                </View>

                {/* Card */}
                <View style={s.card}>
                    <View style={s.cardHeader}>
                        <Text style={s.tuneName} numberOfLines={1}>{item.tune_title || 'Untitled Tune'}</Text>
                        <View style={[s.statusPill, { backgroundColor: `${cfg.color}15`, borderColor: `${cfg.color}30` }]}>
                            <View style={[s.statusDot, { backgroundColor: cfg.color }]} />
                            <Text style={[s.statusText, { color: cfg.color }]}>{cfg.label}</Text>
                        </View>
                    </View>

                    <View style={s.cardMeta}>
                        <View style={s.metaRow}>
                            <Ionicons name="time-outline" size={14} color={C.muted} />
                            <Text style={s.metaText}>{formatDate(item.created_at)}</Text>
                        </View>
                        {item.tune_version && (
                            <View style={s.metaRow}>
                                <Ionicons name="git-branch-outline" size={14} color={C.muted} />
                                <Text style={s.metaText}>v{item.tune_version}</Text>
                            </View>
                        )}
                        {item.bike_name && (
                            <View style={s.metaRow}>
                                <Ionicons name="bicycle" size={14} color={C.muted} />
                                <Text style={s.metaText}>{item.bike_name}</Text>
                            </View>
                        )}
                    </View>

                    {item.checksum_matched && (
                        <View style={s.checksumBadge}>
                            <Ionicons name="shield-checkmark" size={14} color={C.success} />
                            <Text style={s.checksumText}>SHA-256 Verified</Text>
                        </View>
                    )}

                    {item.error_message && (
                        <View style={s.errorBanner}>
                            <Ionicons name="warning" size={14} color={C.error} />
                            <Text style={s.errorText} numberOfLines={2}>{item.error_message}</Text>
                        </View>
                    )}
                </View>
            </View>
        );
    };

    return (
        <SafeAreaView style={s.root} edges={['top']}>
            <View style={s.header}>
                <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={20} color={C.text} />
                </TouchableOpacity>
                <Text style={s.headerTitle}>Flash History</Text>
                <View style={{ width: 40 }} />
            </View>

            <FlatList
                data={jobs}
                renderItem={renderJob}
                keyExtractor={item => item.id}
                contentContainerStyle={s.list}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.primary} />}
                ListEmptyComponent={
                    loading ? (
                        <View style={s.emptyState}><ActivityIndicator size="large" color={C.primary} /></View>
                    ) : (
                        <View style={s.emptyState}>
                            <View style={s.emptyCircle}>
                                <Ionicons name="flash-outline" size={48} color={C.dim} />
                            </View>
                            <Text style={s.emptyTitle}>No Flash History</Text>
                            <Text style={s.emptySub}>Your ECU flash operations will appear here.</Text>
                        </View>
                    )
                }
            />
        </SafeAreaView>
    );
};

// ─── Styles ────────────────────────────────────────────────────
const s = StyleSheet.create({
    root: { flex: 1, backgroundColor: C.bg },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 16, height: 56,
        borderBottomWidth: 1, borderBottomColor: C.border,
    },
    backBtn: {
        width: 40, height: 40, borderRadius: 12,
        alignItems: 'center', justifyContent: 'center',
    },
    headerTitle: { fontSize: 18, fontWeight: '700', color: C.text },
    list: { paddingHorizontal: 16, paddingTop: 20, paddingBottom: 100 },

    // Timeline
    timelineItem: { flexDirection: 'row', marginBottom: 4 },
    timelineLeft: { width: 36, alignItems: 'center' },
    timelineDot: {
        width: 28, height: 28, borderRadius: 14,
        alignItems: 'center', justifyContent: 'center', zIndex: 2,
    },
    timelineLine: {
        width: 2, flex: 1, backgroundColor: 'rgba(255,255,255,0.06)',
        marginTop: -2,
    },

    // Card
    card: {
        flex: 1, marginLeft: 12, marginBottom: 16,
        backgroundColor: C.surface, borderRadius: 16,
        padding: 16, borderWidth: 1, borderColor: C.border,
    },
    cardHeader: {
        flexDirection: 'row', alignItems: 'center',
        justifyContent: 'space-between', marginBottom: 10,
    },
    tuneName: { fontSize: 16, fontWeight: '700', color: C.text, flex: 1, marginRight: 8 },
    statusPill: {
        flexDirection: 'row', alignItems: 'center', gap: 6,
        paddingHorizontal: 10, paddingVertical: 4,
        borderRadius: 20, borderWidth: 1,
    },
    statusDot: { width: 6, height: 6, borderRadius: 3 },
    statusText: { fontSize: 11, fontWeight: '700' },

    // Meta
    cardMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 8 },
    metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    metaText: { fontSize: 12, color: C.muted },

    // Checksum
    checksumBadge: {
        flexDirection: 'row', alignItems: 'center', gap: 6,
        backgroundColor: 'rgba(34,197,94,0.08)', paddingHorizontal: 10,
        paddingVertical: 6, borderRadius: 8, marginTop: 4,
    },
    checksumText: { fontSize: 11, fontWeight: '600', color: C.success },

    // Error
    errorBanner: {
        flexDirection: 'row', alignItems: 'flex-start', gap: 6,
        backgroundColor: 'rgba(239,68,68,0.08)', paddingHorizontal: 10,
        paddingVertical: 8, borderRadius: 8, marginTop: 4,
    },
    errorText: { fontSize: 12, color: C.error, flex: 1, lineHeight: 16 },

    // Empty
    emptyState: { alignItems: 'center', justifyContent: 'center', paddingTop: 80 },
    emptyCircle: {
        width: 96, height: 96, borderRadius: 48,
        backgroundColor: C.surface, alignItems: 'center',
        justifyContent: 'center', marginBottom: 20,
    },
    emptyTitle: { fontSize: 20, fontWeight: '800', color: C.text },
    emptySub: { fontSize: 14, color: C.muted, marginTop: 8, textAlign: 'center' },
});
