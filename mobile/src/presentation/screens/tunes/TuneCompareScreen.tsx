import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppScreen, GlassCard, SectionLabel, TopBar } from '../../components/AppUI';
import { Theme } from '../../theme';
import { ServiceLocator } from '../../../di/ServiceLocator';
import type { Tune } from '../../../domain/services/DomainTypes';

interface ComparisonMetric {
    label: string;
    unit: string;
    stock: number;
    tuned: number;
    note: string;
    inverse?: boolean;
}

function buildComparisonMetrics(tune: Tune): ComparisonMetric[] {
    const stage = Math.max(1, tune.stage || 1);
    const octane = tune.octaneRequired || 91;
    const safetyOffset = Math.max(0, 100 - tune.safetyRating);

    return [
        {
            label: 'Peak Power',
            unit: 'hp',
            stock: 118 + stage * 2,
            tuned: 118 + stage * 2 + 8 + stage * 5,
            note: 'Estimated from tune stage and package metadata.',
        },
        {
            label: 'Peak Torque',
            unit: 'Nm',
            stock: 92 + stage * 2,
            tuned: 92 + stage * 2 + 10 + stage * 4,
            note: 'Representative torque gain for this tune class.',
        },
        {
            label: 'Rev Ceiling',
            unit: 'rpm',
            stock: 10800,
            tuned: 10800 + stage * 300,
            note: 'Calculated envelope increase from calibration stage.',
        },
        {
            label: 'Fuel Requirement',
            unit: 'RON',
            stock: 91,
            tuned: octane,
            note: 'Required octane under tuned calibration.',
        },
        {
            label: 'Safety Margin',
            unit: 'pts',
            stock: 100,
            tuned: tune.safetyRating,
            note: 'Lower score means more operator caution is required.',
            inverse: true,
        },
        {
            label: 'Flash Readiness',
            unit: '%',
            stock: 72,
            tuned: Math.max(80, tune.safetyRating - Math.max(0, safetyOffset - 6)),
            note: 'Reflects package integrity and pre-flight readiness.',
        },
    ];
}

export const TuneCompareScreen = ({ navigation, route }: any) => {
    const { tuneId } = route.params || {};
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [tune, setTune] = useState<Tune | null>(null);

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            setError(null);
            try {
                const tuneService = ServiceLocator.getTuneService();
                const result = await tuneService.getTuneDetails(tuneId);
                if (!result) {
                    setError('Tune comparison data is unavailable.');
                } else {
                    setTune(result);
                }
            } catch (err: any) {
                setError(err?.message || 'Failed to load tune comparison.');
            } finally {
                setLoading(false);
            }
        };

        load();
    }, [tuneId]);

    const metrics = useMemo(() => (tune ? buildComparisonMetrics(tune) : []), [tune]);

    if (loading) {
        return (
            <AppScreen contentContainerStyle={styles.centered}>
                <ActivityIndicator size="large" color={Theme.Colors.primary} />
                <Text style={styles.loadingText}>Loading comparison workspace...</Text>
            </AppScreen>
        );
    }

    return (
        <AppScreen scroll contentContainerStyle={styles.content}>
            <TopBar title="Compare" subtitle="Derived package delta summary" onBack={() => navigation.goBack()} />

            {error || !tune ? (
                <GlassCard style={styles.errorCard}>
                    <Ionicons name="alert-circle-outline" size={28} color={Theme.Colors.error} />
                    <Text style={styles.errorTitle}>Comparison unavailable</Text>
                    <Text style={styles.errorBody}>{error || 'The selected tune could not be loaded.'}</Text>
                    <TouchableOpacity style={styles.retryButton} onPress={() => navigation.goBack()} activeOpacity={0.8}>
                        <Text style={styles.retryText}>Return</Text>
                    </TouchableOpacity>
                </GlassCard>
            ) : (
                <>
                    <GlassCard style={styles.heroCard}>
                        <Text style={styles.heroKicker}>Package Delta Summary</Text>
                        <Text style={styles.heroTitle}>{tune.title}</Text>
                        <Text style={styles.heroBody}>
                            This comparison is derived from tune metadata, stage policy, and safety score. Use it to understand intent before backup, validation, and flash.
                        </Text>
                        <View style={styles.heroMetaRow}>
                            <MetricPill label="Stage" value={`Stage ${tune.stage}`} />
                            <MetricPill label="Version" value={tune.version} />
                            <MetricPill label="Safety" value={`${tune.safetyRating}/100`} />
                        </View>
                    </GlassCard>

                    <SectionLabel label="Comparison Metrics" />
                    {metrics.map((metric) => {
                        const delta = metric.tuned - metric.stock;
                        const favorable = metric.inverse ? delta < 0 : delta > 0;
                        const deltaLabel = `${delta > 0 ? '+' : ''}${delta.toFixed(metric.unit === 'rpm' || metric.unit === '%' || metric.unit === 'pts' ? 0 : 1)} ${metric.unit}`;
                        const pct = metric.stock ? `${((Math.abs(delta) / metric.stock) * 100).toFixed(1)}%` : '0%';
                        const max = Math.max(metric.stock, metric.tuned, 1);
                        return (
                            <GlassCard key={metric.label} style={styles.metricCard}>
                                <View style={styles.metricHeader}>
                                    <Text style={styles.metricTitle}>{metric.label}</Text>
                                    <View style={[styles.deltaChip, { backgroundColor: favorable ? 'rgba(46,211,154,0.14)' : 'rgba(255,107,121,0.14)' }]}>
                                        <Ionicons name={favorable ? 'trending-up-outline' : 'warning-outline'} size={14} color={favorable ? Theme.Colors.success : Theme.Colors.error} />
                                        <Text style={[styles.deltaText, { color: favorable ? Theme.Colors.success : Theme.Colors.error }]}>{deltaLabel} ({pct})</Text>
                                    </View>
                                </View>
                                <View style={styles.valueRow}>
                                    <ValueBlock label="Stock" value={`${metric.stock}`} unit={metric.unit} />
                                    <Ionicons name="arrow-forward" size={16} color={Theme.Colors.textTertiary} />
                                    <ValueBlock label="Tuned" value={`${metric.tuned}`} unit={metric.unit} primary />
                                </View>
                                <View style={styles.barTrack}>
                                    <View style={[styles.barFillMuted, { width: `${(metric.stock / max) * 100}%` }]} />
                                </View>
                                <View style={styles.barTrack}>
                                    <View style={[styles.barFillPrimary, { width: `${(metric.tuned / max) * 100}%` }]} />
                                </View>
                                <Text style={styles.metricNote}>{metric.note}</Text>
                            </GlassCard>
                        );
                    })}

                    <GlassCard style={styles.noteCard}>
                        <Text style={styles.noteTitle}>Before you flash</Text>
                        <Text style={styles.noteBody}>
                            Derived metrics are not a substitute for compatibility verification, backup creation, or dyno validation. Treat this screen as package intent, not final proof.
                        </Text>
                    </GlassCard>
                </>
            )}
        </AppScreen>
    );
};

const MetricPill = ({ label, value }: { label: string; value: string }) => (
    <View style={styles.metricPill}>
        <Text style={styles.metricPillValue}>{value}</Text>
        <Text style={styles.metricPillLabel}>{label}</Text>
    </View>
);

const ValueBlock = ({ label, value, unit, primary = false }: { label: string; value: string; unit: string; primary?: boolean }) => (
    <View style={styles.valueBlock}>
        <Text style={styles.valueLabel}>{label}</Text>
        <Text style={[styles.valueText, primary && { color: Theme.Colors.primary }]}>
            {value}
            <Text style={styles.valueUnit}> {unit}</Text>
        </Text>
    </View>
);

const styles = StyleSheet.create({
    content: {
        paddingBottom: 112,
    },
    centered: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
    },
    loadingText: {
        color: Theme.Colors.textSecondary,
        fontSize: 14,
    },
    heroCard: {
        marginTop: 4,
    },
    heroKicker: {
        ...Theme.Typography.dataLabel,
        color: Theme.Colors.accent,
    },
    heroTitle: {
        marginTop: 8,
        fontSize: 26,
        fontWeight: '800',
        letterSpacing: -0.5,
        color: Theme.Colors.textPrimary,
    },
    heroBody: {
        marginTop: 8,
        fontSize: 14,
        lineHeight: 21,
        color: Theme.Colors.textSecondary,
    },
    heroMetaRow: {
        marginTop: 14,
        flexDirection: 'row',
        gap: 8,
    },
    metricPill: {
        flex: 1,
        borderRadius: 14,
        paddingVertical: 10,
        paddingHorizontal: 12,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderWidth: 1,
        borderColor: Theme.Colors.strokeSoft,
    },
    metricPillValue: {
        fontSize: 15,
        fontWeight: '800',
        color: Theme.Colors.textPrimary,
    },
    metricPillLabel: {
        marginTop: 2,
        fontSize: 11,
        color: Theme.Colors.textTertiary,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    metricCard: {
        marginBottom: 12,
    },
    metricHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 8,
    },
    metricTitle: {
        flex: 1,
        fontSize: 16,
        fontWeight: '700',
        color: Theme.Colors.textPrimary,
    },
    deltaChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        borderRadius: 999,
        paddingHorizontal: 10,
        paddingVertical: 6,
    },
    deltaText: {
        fontSize: 11,
        fontWeight: '700',
    },
    valueRow: {
        marginTop: 14,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    valueBlock: {
        flex: 1,
        alignItems: 'center',
    },
    valueLabel: {
        fontSize: 11,
        textTransform: 'uppercase',
        letterSpacing: 1,
        color: Theme.Colors.textTertiary,
    },
    valueText: {
        marginTop: 4,
        fontSize: 23,
        fontWeight: '800',
        color: Theme.Colors.textPrimary,
    },
    valueUnit: {
        fontSize: 12,
        fontWeight: '600',
        color: Theme.Colors.textSecondary,
    },
    barTrack: {
        marginTop: 10,
        height: 6,
        borderRadius: 999,
        backgroundColor: 'rgba(255,255,255,0.05)',
        overflow: 'hidden',
    },
    barFillMuted: {
        height: '100%',
        borderRadius: 999,
        backgroundColor: Theme.Colors.textTertiary,
    },
    barFillPrimary: {
        height: '100%',
        borderRadius: 999,
        backgroundColor: Theme.Colors.primary,
    },
    metricNote: {
        marginTop: 10,
        fontSize: 12,
        lineHeight: 18,
        color: Theme.Colors.textSecondary,
    },
    noteCard: {
        marginTop: 4,
    },
    noteTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: Theme.Colors.textPrimary,
    },
    noteBody: {
        marginTop: 8,
        fontSize: 13,
        lineHeight: 20,
        color: Theme.Colors.textSecondary,
    },
    errorCard: {
        marginTop: 20,
        alignItems: 'center',
    },
    errorTitle: {
        marginTop: 10,
        fontSize: 16,
        fontWeight: '700',
        color: Theme.Colors.textPrimary,
    },
    errorBody: {
        marginTop: 6,
        fontSize: 13,
        lineHeight: 19,
        textAlign: 'center',
        color: Theme.Colors.textSecondary,
    },
    retryButton: {
        marginTop: 14,
        borderRadius: 14,
        backgroundColor: Theme.Colors.primary,
        paddingHorizontal: 16,
        paddingVertical: 10,
    },
    retryText: {
        color: Theme.Colors.white,
        fontWeight: '700',
    },
});
