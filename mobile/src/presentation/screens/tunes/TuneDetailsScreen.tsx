import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppScreen, GlassCard, SectionLabel, TopBar } from '../../components/AppUI';
import { Theme } from '../../theme';
import { ServiceLocator } from '../../../di/ServiceLocator';
import type { Tune } from '../../../domain/services/DomainTypes';
import { useAppStore } from '../../store/useAppStore';

function getSafetyTone(rating: number) {
    if (rating >= 92) return { label: 'Low risk', color: Theme.Colors.success, bg: 'rgba(46,211,154,0.14)' };
    if (rating >= 82) return { label: 'Moderate risk', color: Theme.Colors.warning, bg: 'rgba(255,184,92,0.14)' };
    return { label: 'High caution', color: Theme.Colors.error, bg: 'rgba(255,107,121,0.14)' };
}

function getStageTone(stage: number) {
    if (stage <= 1) return { color: Theme.Colors.accent, bg: 'rgba(99,199,255,0.14)' };
    if (stage === 2) return { color: Theme.Colors.primary, bg: 'rgba(234,16,60,0.14)' };
    return { color: '#C084FC', bg: 'rgba(192,132,252,0.16)' };
}

export const TuneDetailsScreen = ({ route, navigation }: any) => {
    const { tuneId } = route.params;
    const insets = useSafeAreaInsets();
    const { activeBike } = useAppStore();
    const [tune, setTune] = useState<Tune | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const loadTune = async () => {
            setLoading(true);
            setError(null);
            try {
                const tuneService = ServiceLocator.getTuneService();
                const data = await tuneService.getTuneDetails(tuneId);
                if (!data) {
                    setError('Tune details are unavailable.');
                } else {
                    setTune(data);
                    ServiceLocator.getAnalyticsService().logEvent('tune_details_viewed', {
                        tuneId: data.id,
                        title: data.title,
                        price: data.price,
                    });
                }
            } catch (err: any) {
                setError(err?.message || 'Failed to load tune details.');
            } finally {
                setLoading(false);
            }
        };

        loadTune();
    }, [tuneId]);

    const isCompatible = useMemo(() => {
        if (!tune || !activeBike) return false;
        const compatibility = (tune.compatibilityRaw || []).join(' ').toLowerCase();
        return compatibility.includes(activeBike.make.toLowerCase()) && compatibility.includes(activeBike.model.toLowerCase());
    }, [tune, activeBike]);

    const safety = tune ? getSafetyTone(tune.safetyRating) : null;
    const stage = tune ? getStageTone(tune.stage) : null;

    const summaryMetrics = useMemo(() => {
        if (!tune) return [];
        return [
            { label: 'Safety Score', value: `${tune.safetyRating}/100`, helper: safety?.label || 'Unknown' },
            { label: 'Version', value: tune.version, helper: tune.versionState || 'Published' },
            { label: 'Fuel', value: `${tune.octaneRequired || 91}+ RON`, helper: 'Minimum fuel quality' },
            { label: 'Checksum', value: tune.checksum ? 'Present' : 'Pending', helper: tune.checksum || 'No checksum' },
        ];
    }, [tune, safety]);

    if (loading) {
        return (
            <AppScreen contentContainerStyle={styles.centered}>
                <ActivityIndicator size="large" color={Theme.Colors.primary} />
                <Text style={styles.loadingText}>Loading tune details...</Text>
            </AppScreen>
        );
    }

    return (
        <View style={styles.root}>
            <AppScreen scroll contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 140 }]}>
                <TopBar
                    title="Tune Details"
                    subtitle="Verified listing and purchase readiness"
                    onBack={() => navigation.goBack()}
                    right={
                        <View style={styles.topActions}>
                            <TouchableOpacity style={styles.iconButton} activeOpacity={0.75}>
                                <Ionicons name="share-outline" size={18} color={Theme.Colors.textPrimary} />
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.iconButton} activeOpacity={0.75}>
                                <Ionicons name="heart-outline" size={18} color={Theme.Colors.textPrimary} />
                            </TouchableOpacity>
                        </View>
                    }
                />

                {error || !tune ? (
                    <GlassCard style={styles.errorCard}>
                        <Ionicons name="alert-circle-outline" size={28} color={Theme.Colors.error} />
                        <Text style={styles.errorTitle}>Unable to load tune</Text>
                        <Text style={styles.errorBody}>{error || 'The selected listing could not be loaded.'}</Text>
                        <TouchableOpacity style={styles.retryButton} onPress={() => navigation.goBack()} activeOpacity={0.8}>
                            <Text style={styles.retryText}>Return</Text>
                        </TouchableOpacity>
                    </GlassCard>
                ) : (
                    <>
                        <GlassCard style={styles.heroCard}>
                            <View style={styles.heroHeader}>
                                <View style={styles.heroTextWrap}>
                                    <View style={[styles.stageBadge, { backgroundColor: stage?.bg }]}>
                                        <Text style={[styles.stageBadgeText, { color: stage?.color }]}>Stage {tune.stage}</Text>
                                    </View>
                                    <Text style={styles.heroTitle}>{tune.title}</Text>
                                    <Text style={styles.heroBody}>
                                        {tune.description || 'Validated tune package with safety-aware delivery and entitlement checks.'}
                                    </Text>
                                </View>
                                <View style={styles.priceWrap}>
                                    <Text style={styles.priceValue}>${tune.price.toFixed(2)}</Text>
                                    <Text style={styles.priceLabel}>USD</Text>
                                </View>
                            </View>

                            <View style={styles.heroMetaRow}>
                                <View style={[styles.metaChip, { backgroundColor: safety?.bg }]}>
                                    <Ionicons name="shield-checkmark-outline" size={14} color={safety?.color} />
                                    <Text style={[styles.metaChipText, { color: safety?.color }]}>{safety?.label}</Text>
                                </View>
                                <View style={[styles.metaChip, { backgroundColor: isCompatible ? 'rgba(46,211,154,0.14)' : 'rgba(255,184,92,0.14)' }]}>
                                    <Ionicons name={isCompatible ? 'checkmark-circle-outline' : 'alert-circle-outline'} size={14} color={isCompatible ? Theme.Colors.success : Theme.Colors.warning} />
                                    <Text style={[styles.metaChipText, { color: isCompatible ? Theme.Colors.success : Theme.Colors.warning }]}>
                                        {isCompatible ? 'Compatible bike active' : 'Bike check required'}
                                    </Text>
                                </View>
                            </View>
                        </GlassCard>

                        <SectionLabel label="Package Summary" />
                        <View style={styles.summaryGrid}>
                            {summaryMetrics.map((item) => (
                                <GlassCard key={item.label} style={styles.summaryCard}>
                                    <Text style={styles.summaryLabel}>{item.label}</Text>
                                    <Text style={styles.summaryValue}>{item.value}</Text>
                                    <Text style={styles.summaryHelper}>{item.helper}</Text>
                                </GlassCard>
                            ))}
                        </View>

                        <SectionLabel label="Fitment and Trust" />
                        <GlassCard style={styles.sectionCard}>
                            <View style={styles.infoRow}>
                                <InfoBlock label="Active Bike" value={activeBike ? `${activeBike.year} ${activeBike.make} ${activeBike.model}` : 'No active bike selected'} />
                                <InfoBlock label="Version State" value={tune.versionState || 'PUBLISHED'} />
                            </View>
                            <View style={styles.infoRow}>
                                <InfoBlock label="Compatibility" value={isCompatible ? 'Matched to active bike' : 'Select matching bike before purchase'} />
                                <InfoBlock label="Signature" value={tune.signatureBase64 ? 'Attached' : 'Backend verified at download'} />
                            </View>
                        </GlassCard>

                        <SectionLabel label="Requirements" />
                        <GlassCard style={styles.sectionCard}>
                            <InfoBlock label="Fuel requirement" value={`${tune.octaneRequired || 91}+ RON`} />
                            <View style={styles.requirementsWrap}>
                                {(tune.modificationsRequired?.length ? tune.modificationsRequired : ['Stock intake/exhaust supported']).map((item) => (
                                    <View key={item} style={styles.requirementChip}>
                                        <Ionicons name="build-outline" size={14} color={Theme.Colors.accent} />
                                        <Text style={styles.requirementChipText}>{item}</Text>
                                    </View>
                                ))}
                            </View>
                        </GlassCard>

                        <SectionLabel label="Actions" />
                        <GlassCard style={styles.sectionCard}>
                            <TouchableOpacity
                                style={styles.secondaryAction}
                                onPress={() => navigation.navigate('TuneCompare', { tuneId: tune.id })}
                                activeOpacity={0.8}
                            >
                                <Ionicons name="git-compare-outline" size={18} color={Theme.Colors.accent} />
                                <View style={styles.actionTextWrap}>
                                    <Text style={styles.secondaryActionTitle}>Compare package intent</Text>
                                    <Text style={styles.secondaryActionBody}>Review derived deltas before purchase or flash.</Text>
                                </View>
                            </TouchableOpacity>
                        </GlassCard>

                        {tune.safetyRating < 90 && (
                            <GlassCard style={styles.warningCard}>
                                <Ionicons name="warning-outline" size={18} color={Theme.Colors.warning} />
                                <View style={styles.warningTextWrap}>
                                    <Text style={styles.warningTitle}>Additional caution required</Text>
                                    <Text style={styles.warningBody}>
                                        This package reduces safety margin. Verify compatibility, create a backup, and review the full validation flow before purchase or flash.
                                    </Text>
                                </View>
                            </GlassCard>
                        )}
                    </>
                )}
            </AppScreen>

            {tune && !error && (
                <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 12 }]}>
                    <View>
                        <Text style={styles.bottomLabel}>Purchase Total</Text>
                        <Text style={styles.bottomValue}>${tune.price.toFixed(2)}</Text>
                    </View>
                    <TouchableOpacity
                        style={[styles.purchaseButton, !isCompatible && styles.purchaseButtonDisabled]}
                        activeOpacity={0.85}
                        disabled={!isCompatible}
                        onPress={() => {
                            ServiceLocator.getAnalyticsService().logEvent('tune_validate_initiated', { tuneId: tune.id });
                            navigation.navigate('TuneValidation', {
                                tuneId: tune.id,
                                versionId: tune.versionId,
                                listingId: tune.listingId || tune.id,
                            });
                        }}
                    >
                        <Text style={styles.purchaseText}>{isCompatible ? 'Continue to validation' : 'Bike mismatch'}</Text>
                        <Ionicons name="arrow-forward" size={18} color={Theme.Colors.white} />
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
};

const InfoBlock = ({ label, value }: { label: string; value: string }) => (
    <View style={styles.infoBlock}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
    </View>
);

const styles = StyleSheet.create({
    root: {
        flex: 1,
        backgroundColor: Theme.Colors.shell,
    },
    content: {
        paddingBottom: 120,
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
    topActions: {
        flexDirection: 'row',
        gap: 8,
    },
    iconButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderWidth: 1,
        borderColor: Theme.Colors.strokeSoft,
    },
    heroCard: {
        marginTop: 4,
    },
    heroHeader: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: 12,
    },
    heroTextWrap: {
        flex: 1,
    },
    stageBadge: {
        alignSelf: 'flex-start',
        borderRadius: 999,
        paddingHorizontal: 10,
        paddingVertical: 6,
    },
    stageBadgeText: {
        fontSize: 11,
        fontWeight: '800',
        letterSpacing: 0.4,
        textTransform: 'uppercase',
    },
    heroTitle: {
        marginTop: 10,
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
    priceWrap: {
        alignItems: 'flex-end',
    },
    priceValue: {
        fontSize: 26,
        fontWeight: '800',
        color: Theme.Colors.textPrimary,
    },
    priceLabel: {
        marginTop: 2,
        fontSize: 11,
        fontWeight: '700',
        letterSpacing: 1,
        textTransform: 'uppercase',
        color: Theme.Colors.textTertiary,
    },
    heroMetaRow: {
        marginTop: 14,
        flexDirection: 'row',
        gap: 8,
        flexWrap: 'wrap',
    },
    metaChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        borderRadius: 999,
        paddingHorizontal: 12,
        paddingVertical: 8,
    },
    metaChipText: {
        fontSize: 12,
        fontWeight: '700',
    },
    summaryGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    summaryCard: {
        width: '47%',
    },
    summaryLabel: {
        ...Theme.Typography.dataLabel,
    },
    summaryValue: {
        marginTop: 8,
        fontSize: 18,
        fontWeight: '800',
        color: Theme.Colors.textPrimary,
    },
    summaryHelper: {
        marginTop: 4,
        fontSize: 12,
        lineHeight: 18,
        color: Theme.Colors.textSecondary,
    },
    sectionCard: {
        marginBottom: 4,
        gap: 12,
    },
    infoRow: {
        flexDirection: 'row',
        gap: 10,
    },
    infoBlock: {
        flex: 1,
        borderRadius: 14,
        padding: 12,
        backgroundColor: 'rgba(255,255,255,0.04)',
        borderWidth: 1,
        borderColor: Theme.Colors.strokeSoft,
    },
    infoLabel: {
        ...Theme.Typography.dataLabel,
    },
    infoValue: {
        marginTop: 8,
        fontSize: 13,
        lineHeight: 19,
        color: Theme.Colors.textPrimary,
        fontWeight: '600',
    },
    requirementsWrap: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    requirementChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        borderRadius: 999,
        paddingHorizontal: 12,
        paddingVertical: 8,
        backgroundColor: 'rgba(255,255,255,0.04)',
        borderWidth: 1,
        borderColor: Theme.Colors.strokeSoft,
    },
    requirementChipText: {
        fontSize: 12,
        fontWeight: '600',
        color: Theme.Colors.textSecondary,
    },
    secondaryAction: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        borderRadius: 16,
        padding: 14,
        backgroundColor: 'rgba(255,255,255,0.04)',
        borderWidth: 1,
        borderColor: Theme.Colors.strokeSoft,
    },
    actionTextWrap: {
        flex: 1,
    },
    secondaryActionTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: Theme.Colors.textPrimary,
    },
    secondaryActionBody: {
        marginTop: 2,
        fontSize: 12,
        lineHeight: 18,
        color: Theme.Colors.textSecondary,
    },
    warningCard: {
        marginTop: 4,
        flexDirection: 'row',
        gap: 10,
        borderColor: 'rgba(255,184,92,0.24)',
        backgroundColor: 'rgba(255,184,92,0.08)',
    },
    warningTextWrap: {
        flex: 1,
    },
    warningTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: Theme.Colors.warning,
    },
    warningBody: {
        marginTop: 6,
        fontSize: 12,
        lineHeight: 18,
        color: Theme.Colors.textSecondary,
    },
    bottomBar: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        paddingHorizontal: 16,
        paddingTop: 12,
        backgroundColor: 'rgba(10,14,20,0.92)',
        borderTopWidth: 1,
        borderTopColor: Theme.Colors.strokeSoft,
    },
    bottomLabel: {
        ...Theme.Typography.dataLabel,
    },
    bottomValue: {
        marginTop: 4,
        fontSize: 20,
        fontWeight: '800',
        color: Theme.Colors.textPrimary,
    },
    purchaseButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        borderRadius: 16,
        backgroundColor: Theme.Colors.primary,
        paddingHorizontal: 18,
        paddingVertical: 14,
    },
    purchaseButtonDisabled: {
        backgroundColor: Theme.Colors.surface3,
        opacity: 0.75,
    },
    purchaseText: {
        color: Theme.Colors.white,
        fontSize: 14,
        fontWeight: '700',
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
