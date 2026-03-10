import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppScreen, GlassCard, TopBar } from '../../components/AppUI';
import { Theme } from '../../theme';

const { Colors, Layout, Typography } = Theme;

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

const STATUS_MAP: Record<FlashJob['status'], { icon: keyof typeof Ionicons.glyphMap; color: string; label: string }> = {
    COMPLETED: { icon: 'checkmark-circle', color: Colors.success, label: 'Verified' },
    FAILED: { icon: 'close-circle', color: Colors.error, label: 'Failed' },
    VERIFY_FAILED: { icon: 'alert-circle', color: Colors.warning, label: 'Verify Failed' },
    IN_PROGRESS: { icon: 'hourglass', color: Colors.info, label: 'In Progress' },
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
            setJobs(results.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
        } catch {
            setJobs([]);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        loadHistory();
    }, [loadHistory]);

    const onRefresh = () => {
        setRefreshing(true);
        loadHistory();
    };

    const formatDate = (iso: string) => {
        const d = new Date(iso);
        const now = new Date();
        const diff = now.getTime() - d.getTime();
        if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
        if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
        if (diff < 604_800_000) return `${Math.floor(diff / 86_400_000)}d ago`;
        return d.toLocaleDateString();
    };

    const renderJob = ({ item }: { item: FlashJob }) => {
        const cfg = STATUS_MAP[item.status] || STATUS_MAP.FAILED;
        return (
            <GlassCard style={styles.card}>
                <View style={styles.cardHeader}>
                    <Text style={styles.tuneName} numberOfLines={1}>
                        {item.tune_title || 'Untitled Tune'}
                    </Text>
                    <View style={[styles.statusPill, { backgroundColor: `${cfg.color}15`, borderColor: `${cfg.color}30` }]}>
                        <Ionicons name={cfg.icon} size={12} color={cfg.color} />
                        <Text style={[styles.statusText, { color: cfg.color }]}>{cfg.label}</Text>
                    </View>
                </View>

                <View style={styles.metaWrap}>
                    <MetaRow icon="time-outline" text={formatDate(item.created_at)} />
                    {!!item.tune_version && <MetaRow icon="git-branch-outline" text={`v${item.tune_version}`} />}
                    {!!item.bike_name && <MetaRow icon="bicycle" text={item.bike_name} />}
                </View>

                {item.checksum_matched && (
                    <View style={styles.checksumBadge}>
                        <Ionicons name="shield-checkmark" size={14} color={Colors.success} />
                        <Text style={styles.checksumText}>SHA-256 verified</Text>
                    </View>
                )}

                {item.error_message && (
                    <View style={styles.errorBanner}>
                        <Ionicons name="warning" size={14} color={Colors.error} />
                        <Text style={styles.errorText} numberOfLines={2}>
                            {item.error_message}
                        </Text>
                    </View>
                )}
            </GlassCard>
        );
    };

    return (
        <AppScreen>
            <TopBar title="Flash History" subtitle="Recorded tune write and verification sessions" onBack={() => navigation.goBack()} />

            <FlatList
                data={jobs}
                renderItem={renderJob}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.list}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
                ListHeaderComponent={
                    <GlassCard style={styles.summaryCard}>
                        <View style={styles.summaryItem}>
                            <Text style={styles.summaryValue}>{jobs.length}</Text>
                            <Text style={styles.summaryLabel}>Sessions</Text>
                        </View>
                        <View style={styles.summaryDivider} />
                        <View style={styles.summaryItem}>
                            <Text style={styles.summaryValue}>{jobs.filter((job) => job.status === 'COMPLETED').length}</Text>
                            <Text style={styles.summaryLabel}>Verified</Text>
                        </View>
                        <View style={styles.summaryDivider} />
                        <View style={styles.summaryItem}>
                            <Text style={styles.summaryValue}>{jobs.filter((job) => job.status !== 'COMPLETED').length}</Text>
                            <Text style={styles.summaryLabel}>Attention</Text>
                        </View>
                    </GlassCard>
                }
                ListEmptyComponent={
                    loading ? (
                        <View style={styles.emptyState}>
                            <ActivityIndicator size="large" color={Colors.primary} />
                        </View>
                    ) : (
                        <GlassCard style={styles.emptyCard}>
                            <Ionicons name="flash-outline" size={36} color={Colors.textTertiary} />
                            <Text style={styles.emptyTitle}>No flash history</Text>
                            <Text style={styles.emptyBody}>Completed and failed ECU sessions will appear here once you start using the flash workflow.</Text>
                        </GlassCard>
                    )
                }
            />
        </AppScreen>
    );
};

const MetaRow = ({ icon, text }: { icon: keyof typeof Ionicons.glyphMap; text: string }) => (
    <View style={styles.metaRow}>
        <Ionicons name={icon} size={13} color={Colors.textTertiary} />
        <Text style={styles.metaText}>{text}</Text>
    </View>
);

const styles = StyleSheet.create({
    list: {
        paddingHorizontal: 16,
        paddingBottom: 110,
    },
    summaryCard: {
        marginTop: 4,
        marginBottom: 12,
        flexDirection: 'row',
        alignItems: 'center',
    },
    summaryItem: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: 4,
    },
    summaryValue: {
        fontSize: 20,
        fontWeight: '800',
        color: Colors.textPrimary,
    },
    summaryLabel: {
        marginTop: 2,
        fontSize: 10,
        letterSpacing: 0.8,
        fontWeight: '700',
        textTransform: 'uppercase',
        color: Colors.textSecondary,
    },
    summaryDivider: {
        width: 1,
        height: 32,
        backgroundColor: Colors.divider,
    },
    card: {
        marginBottom: 10,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 10,
        gap: 10,
    },
    tuneName: {
        flex: 1,
        fontSize: 16,
        fontWeight: '700',
        color: Colors.textPrimary,
    },
    statusPill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 999,
        borderWidth: 1,
    },
    statusText: {
        fontSize: 11,
        fontWeight: '700',
    },
    metaWrap: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        marginBottom: 8,
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    metaText: {
        fontSize: 12,
        color: Colors.textSecondary,
    },
    checksumBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginTop: 2,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: Layout.radiusSm,
        backgroundColor: 'rgba(46,211,154,0.08)',
    },
    checksumText: {
        fontSize: 11,
        fontWeight: '700',
        color: Colors.success,
    },
    errorBanner: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 8,
        marginTop: 8,
        paddingHorizontal: 10,
        paddingVertical: 8,
        borderRadius: Layout.radiusSm,
        backgroundColor: 'rgba(255,107,121,0.08)',
    },
    errorText: {
        flex: 1,
        fontSize: 12,
        lineHeight: 17,
        color: Colors.error,
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 60,
    },
    emptyCard: {
        marginTop: 14,
        alignItems: 'center',
        paddingVertical: 34,
    },
    emptyTitle: {
        marginTop: 12,
        fontSize: 18,
        fontWeight: '800',
        color: Colors.textPrimary,
    },
    emptyBody: {
        ...Typography.caption,
        marginTop: 8,
        textAlign: 'center',
        maxWidth: 280,
    },
});
