import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Theme } from '../../theme';
import { Screen, PrimaryButton, LoadingOverlay, Card, ErrorBanner } from '../../components/SharedComponents';
import { Ionicons } from '@expo/vector-icons';
import { ServiceLocator } from '../../../di/ServiceLocator';
import { Tune } from '../../../domain/services/DomainTypes';
import { useAppStore } from '../../store/useAppStore';

const getSafetyInfo = (rating: number) => {
    if (rating > 90) return { label: 'Safe', color: '#22C55E', bg: 'rgba(34,197,94,0.1)' };
    if (rating > 80) return { label: 'Moderate', color: '#F59E0B', bg: 'rgba(245,158,11,0.1)' };
    return { label: 'Risky', color: '#EF4444', bg: 'rgba(239,68,68,0.1)' };
};

const getStageColor = (stage: number) => {
    if (stage === 1) return { bg: 'rgba(59,130,246,0.15)', text: '#60A5FA' };
    if (stage === 2) return { bg: 'rgba(225,29,72,0.15)', text: '#FB7185' };
    return { bg: 'rgba(168,85,247,0.15)', text: '#C084FC' };
};

export const TuneDetailsScreen = ({ route, navigation }: any) => {
    const { tuneId } = route.params;
    const { activeBike } = useAppStore();
    const [tune, setTune] = useState<Tune | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fadeAnim = React.useRef(new Animated.Value(0)).current;
    const slideAnim = React.useRef(new Animated.Value(30)).current;

    useEffect(() => {
        loadTune();
    }, [tuneId]);

    const loadTune = async () => {
        setLoading(true);
        setError(null);
        try {
            const tuneService = ServiceLocator.getTuneService();
            const data = await tuneService.getTuneDetails(tuneId);
            setTune(data);

            if (data) {
                ServiceLocator.getAnalyticsService().logEvent('tune_details_viewed', {
                    tuneId: data.id, title: data.title, price: data.price,
                });
                // Animate in
                Animated.parallel([
                    Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
                    Animated.timing(slideAnim, { toValue: 0, duration: 400, easing: Easing.out(Easing.back(1.2)), useNativeDriver: true }),
                ]).start();
            }
        } catch (e: any) {
            setError(e.message || 'Failed to load tune details');
        } finally {
            setLoading(false);
        }
    };

    const isCompatible = tune && activeBike && tune.bikeId === activeBike.id;

    if (loading) return <LoadingOverlay visible={true} message="Loading tune..." />;
    if (error) return <Screen center><ErrorBanner message={error} onRetry={loadTune} /></Screen>;
    if (!tune) return null;

    const safety = getSafetyInfo(tune.safetyRating);
    const stageStyle = getStageColor(tune.stage);

    return (
        <Screen scroll>
            {/* Gradient Header */}
            <LinearGradient
                colors={['rgba(225,29,72,0.12)', 'rgba(225,29,72,0.03)', 'transparent']}
                style={styles.headerGradient}
            />

            <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
                {/* Title Section */}
                <View style={styles.header}>
                    <Text style={styles.name}>{tune.title}</Text>
                    <View style={styles.metaRow}>
                        <View style={[styles.stageBadge, { backgroundColor: stageStyle.bg }]}>
                            <Ionicons name="flash" size={12} color={stageStyle.text} />
                            <Text style={[styles.stageBadgeText, { color: stageStyle.text }]}>
                                Stage {tune.stage}
                            </Text>
                        </View>
                        <Text style={styles.price}>${tune.price.toFixed(2)}</Text>
                    </View>
                </View>

                {/* Compatibility Card */}
                <View style={styles.section}>
                    <View style={[styles.compatCard, { borderColor: isCompatible ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)' }]}>
                        <View style={styles.compatRow}>
                            <View style={[styles.compatIcon, { backgroundColor: isCompatible ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)' }]}>
                                <Ionicons
                                    name={isCompatible ? "checkmark-circle" : "alert-circle"}
                                    size={22}
                                    color={isCompatible ? '#22C55E' : '#EF4444'}
                                />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.compatTitle}>
                                    {isCompatible ? 'Compatible with your bike' : 'Compatibility Issue'}
                                </Text>
                                {!isCompatible && activeBike && (
                                    <Text style={styles.compatReason}>
                                        This tune is for {tune.bikeId}, but your active bike is {activeBike.name}.
                                    </Text>
                                )}
                                {!activeBike && (
                                    <Text style={styles.compatReason}>
                                        Select a bike in your Garage to check compatibility.
                                    </Text>
                                )}
                            </View>
                        </View>
                    </View>
                </View>

                {/* Description */}
                <View style={styles.section}>
                    <Text style={styles.sectionLabel}>Description</Text>
                    <Text style={styles.body}>{tune.description}</Text>
                </View>

                {/* Safety Rating */}
                <View style={styles.section}>
                    <Text style={styles.sectionLabel}>Safety Analysis</Text>
                    <View style={styles.safetyRow}>
                        <View style={[styles.safetyBadge, { backgroundColor: safety.bg }]}>
                            <Ionicons name="shield-checkmark" size={18} color={safety.color} />
                            <Text style={[styles.safetyScore, { color: safety.color }]}>
                                {tune.safetyRating}/100 — {safety.label}
                            </Text>
                        </View>
                        <View style={styles.safetyBar}>
                            <View style={[styles.safetyBarFill, { width: `${tune.safetyRating}%`, backgroundColor: safety.color }]} />
                        </View>
                    </View>
                </View>

                {/* Requirements */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Ionicons name="construct-outline" size={18} color={Theme.Colors.primary} />
                        <Text style={styles.sectionLabel}>Requirements</Text>
                    </View>
                    <View style={styles.reqList}>
                        <View style={styles.reqItem}>
                            <Ionicons name="flame-outline" size={16} color="#F59E0B" />
                            <Text style={styles.reqText}>Octane: {tune.octaneRequired}+ required</Text>
                        </View>
                        {tune.modificationsRequired?.map((mod, i) => (
                            <View key={i} style={styles.reqItem}>
                                <Ionicons name="build-outline" size={16} color="#71717A" />
                                <Text style={styles.reqText}>{mod}</Text>
                            </View>
                        ))}
                    </View>
                </View>

                {/* Metadata */}
                <View style={styles.section}>
                    <Text style={styles.sectionLabel}>Details</Text>
                    <View style={styles.metadataGrid}>
                        <MetaItem icon="git-branch-outline" label="Version" value={`v${tune.version}`} />
                        <MetaItem icon="finger-print-outline" label="Checksum" value={tune.checksum?.slice(0, 12) || '—'} />
                    </View>
                </View>

                {/* Action */}
                <View style={styles.footer}>
                    <PrimaryButton
                        title={isCompatible ? "Validate & Flash" : "Not Compatible"}
                        onPress={() => {
                            ServiceLocator.getAnalyticsService().logEvent('tune_validate_initiated', { tuneId: tune.id });
                            navigation.navigate('TuneValidation', { tuneId: tune.id });
                        }}
                        disabled={!isCompatible}
                        icon={isCompatible ? "flash-outline" : "close-circle-outline"}
                    />
                </View>
            </Animated.View>
        </Screen>
    );
};

const MetaItem = ({ icon, label, value }: { icon: any; label: string; value: string }) => (
    <View style={styles.metaItem}>
        <Ionicons name={icon} size={16} color="#52525B" />
        <Text style={styles.metaLabel}>{label}</Text>
        <Text style={styles.metaValue}>{value}</Text>
    </View>
);

const styles = StyleSheet.create({
    headerGradient: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 200,
    },
    header: {
        padding: 20,
        paddingTop: 16,
    },
    name: {
        fontSize: 28,
        fontWeight: '800',
        color: '#FAFAFA',
        letterSpacing: -0.5,
        marginBottom: 12,
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    stageBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 12,
    },
    stageBadgeText: {
        fontSize: 13,
        fontWeight: '700',
    },
    price: {
        fontSize: 24,
        fontWeight: '800',
        color: '#22C55E',
        letterSpacing: -0.5,
    },
    section: {
        paddingHorizontal: 20,
        paddingVertical: 12,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 4,
    },
    sectionLabel: {
        fontSize: 13,
        fontWeight: '700',
        color: '#71717A',
        textTransform: 'uppercase',
        letterSpacing: 0.8,
        marginBottom: 10,
    },
    body: {
        fontSize: 15,
        color: '#A1A1AA',
        lineHeight: 22,
    },
    compatCard: {
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderRadius: 14,
        padding: 16,
        borderWidth: 1,
    },
    compatRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 12,
    },
    compatIcon: {
        width: 40,
        height: 40,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    compatTitle: {
        fontWeight: '700',
        color: '#FAFAFA',
        fontSize: 15,
        marginBottom: 4,
    },
    compatReason: {
        color: '#71717A',
        fontSize: 13,
        lineHeight: 18,
    },
    safetyRow: {
        gap: 10,
    },
    safetyBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 10,
        alignSelf: 'flex-start',
    },
    safetyScore: {
        fontSize: 14,
        fontWeight: '700',
    },
    safetyBar: {
        width: '100%',
        height: 4,
        backgroundColor: 'rgba(255,255,255,0.04)',
        borderRadius: 2,
        overflow: 'hidden',
    },
    safetyBarFill: {
        height: '100%',
        borderRadius: 2,
    },
    reqList: {
        gap: 8,
    },
    reqItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        paddingVertical: 6,
        paddingHorizontal: 12,
        backgroundColor: 'rgba(255,255,255,0.02)',
        borderRadius: 10,
    },
    reqText: {
        fontSize: 14,
        color: '#A1A1AA',
    },
    metadataGrid: {
        flexDirection: 'row',
        gap: 12,
    },
    metaItem: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: 'rgba(255,255,255,0.02)',
        borderRadius: 10,
        paddingVertical: 10,
        paddingHorizontal: 12,
    },
    metaLabel: {
        fontSize: 12,
        color: '#52525B',
    },
    metaValue: {
        fontSize: 12,
        color: '#A1A1AA',
        fontWeight: '600',
    },
    footer: {
        padding: 20,
        paddingTop: 8,
        paddingBottom: 32,
    },
});
