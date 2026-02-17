import React, { useState, useEffect, useRef } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, ScrollView,
    Platform, StatusBar, Animated, Easing, Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ServiceLocator } from '../../../di/ServiceLocator';
import { Tune } from '../../../domain/services/DomainTypes';
import { useAppStore } from '../../store/useAppStore';
import { LoadingOverlay } from '../../components/SharedComponents';

// ── Design tokens ──
const C = {
    primary: '#ea103c',
    primaryBadgeBg: 'rgba(225,29,72,0.15)',
    primaryBadgeText: '#FB7185',
    bg: '#1a1a1a',
    surface: '#2d2d2d',
    surfaceDark: '#262626',
    border: '#404040',
    neutral400: '#a3a3a3',
    neutral500: '#a3a3a3',
    neutral600: '#737373',
    neutral700: '#525252',
    white: '#ffffff',
    warning: '#FBBF24',
    warningBg: 'rgba(234,179,8,0.15)',
    success: '#22C55E',
    blue400: '#60A5FA',
};

const getSafetyInfo = (rating: number) => {
    if (rating > 90) return { label: 'Safe', color: '#22C55E', bg: 'rgba(34,197,94,0.1)' };
    if (rating > 80) return { label: 'Moderate', color: '#F59E0B', bg: 'rgba(245,158,11,0.1)' };
    return { label: 'Risky', color: '#EF4444', bg: 'rgba(239,68,68,0.1)' };
};

const getStageColor = (stage: number) => {
    if (stage === 1) return { bg: 'rgba(59,130,246,0.15)', text: '#60A5FA' };
    if (stage === 2) return { bg: C.primaryBadgeBg, text: C.primaryBadgeText };
    return { bg: 'rgba(168,85,247,0.15)', text: '#C084FC' };
};

export const TuneDetailsScreen = ({ route, navigation }: any) => {
    const { tuneId } = route.params;
    const { activeBike } = useAppStore();
    const [tune, setTune] = useState<Tune | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(30)).current;

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
    if (error) return (
        <View style={[styles.root, { justifyContent: 'center', alignItems: 'center', padding: 24 }]}>
            <Ionicons name="alert-circle" size={48} color="#EF4444" />
            <Text style={{ color: '#FCA5A5', marginTop: 12, fontSize: 16 }}>{error}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={loadTune}>
                <Text style={styles.retryBtnText}>Retry</Text>
            </TouchableOpacity>
        </View>
    );
    if (!tune) return null;

    const safety = getSafetyInfo(tune.safetyRating);
    const stageStyle = getStageColor(tune.stage);

    return (
        <View style={styles.root}>
            <StatusBar barStyle="light-content" />

            {/* ─── Header ─── */}
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.headerBtn}
                    onPress={() => navigation.goBack()}
                >
                    <Ionicons name="arrow-back" size={24} color={C.neutral500} />
                </TouchableOpacity>
                <View style={styles.headerRight}>
                    <TouchableOpacity style={styles.headerBtn}>
                        <Ionicons name="share-outline" size={24} color={C.neutral500} />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.headerBtn}>
                        <Ionicons name="heart" size={24} color={C.neutral500} />
                    </TouchableOpacity>
                </View>
            </View>

            <Animated.ScrollView
                style={{ flex: 1, opacity: fadeAnim }}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* ─── Title + Price ─── */}
                <View style={styles.titleSection}>
                    <View style={styles.titleLeft}>
                        <View style={[styles.stageBadge, { backgroundColor: stageStyle.bg }]}>
                            <Text style={[styles.stageBadgeText, { color: stageStyle.text }]}>
                                Stage {tune.stage}
                            </Text>
                        </View>
                        <Text style={styles.tuneTitle}>{tune.title}</Text>
                    </View>
                    <View style={styles.priceBlock}>
                        <Text style={styles.priceValue}>${tune.price.toFixed(0)}</Text>
                        <Text style={styles.priceCurrency}>USD</Text>
                    </View>
                </View>

                {/* ─── Tuner Info Bar ─── */}
                <View style={styles.tunerBar}>
                    <View style={styles.tunerRow}>
                        <View style={styles.tunerAvatar}>
                            <Text style={styles.tunerAvatarText}>RL</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                            <View style={styles.tunerNameRow}>
                                <Text style={styles.tunerName}>Race Logic</Text>
                                <Ionicons name="checkmark-circle" size={16} color={C.blue400} />
                            </View>
                            <View style={styles.ratingRow}>
                                <Ionicons name="star" size={14} color="#EAB308" />
                                <Text style={styles.ratingText}>4.9 (1.2k)</Text>
                            </View>
                        </View>
                        <TouchableOpacity>
                            <Text style={styles.viewProfileText}>View Profile</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* ─── Description ─── */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Description</Text>
                    <Text style={styles.bodyText}>{tune.description}</Text>
                    <TouchableOpacity>
                        <Text style={styles.readMore}>Read more</Text>
                    </TouchableOpacity>
                </View>

                {/* ─── Dyno Chart placeholder ─── */}
                <View style={styles.dynoCard}>
                    <View style={styles.dynoOverlay}>
                        <View style={styles.dynoLabel}>
                            <Ionicons name="expand" size={18} color={C.white} />
                            <Text style={styles.dynoLabelText}>VIEW DYNO CHART</Text>
                        </View>
                    </View>
                    {/* Simple SVG-like gradient lines */}
                    <View style={styles.dynoLines}>
                        <View style={[styles.dynoLine, { height: '20%', backgroundColor: 'rgba(234,16,60,0.3)' }]} />
                        <View style={[styles.dynoLine, { height: '35%', backgroundColor: 'rgba(234,16,60,0.3)' }]} />
                        <View style={[styles.dynoLine, { height: '50%', backgroundColor: 'rgba(234,16,60,0.3)' }]} />
                        <View style={[styles.dynoLine, { height: '65%', backgroundColor: 'rgba(234,16,60,0.3)' }]} />
                        <View style={[styles.dynoLine, { height: '75%', backgroundColor: 'rgba(234,16,60,0.3)' }]} />
                        <View style={[styles.dynoLine, { height: '85%', backgroundColor: 'rgba(234,16,60,0.3)' }]} />
                        <View style={[styles.dynoLine, { height: '90%', backgroundColor: 'rgba(234,16,60,0.3)' }]} />
                        <View style={[styles.dynoLine, { height: '88%', backgroundColor: 'rgba(234,16,60,0.3)' }]} />
                        <View style={[styles.dynoLine, { height: '92%', backgroundColor: 'rgba(234,16,60,0.3)' }]} />
                        <View style={[styles.dynoLine, { height: '95%', backgroundColor: 'rgba(234,16,60,0.3)' }]} />
                    </View>
                </View>

                {/* ─── Specs Grid ─── */}
                <View style={styles.specsGrid}>
                    <View style={styles.specCard}>
                        <View style={styles.specHeader}>
                            <Ionicons name="flame-outline" size={18} color={C.neutral400} />
                            <Text style={styles.specLabel}>FUEL</Text>
                        </View>
                        <Text style={styles.specValue}>{tune.octaneRequired}+ Octane</Text>
                        <Text style={styles.specSub}>Premium Required</Text>
                    </View>
                    <View style={styles.specCard}>
                        <View style={styles.specHeader}>
                            <Ionicons name="build-outline" size={18} color={C.neutral400} />
                            <Text style={styles.specLabel}>MODS</Text>
                        </View>
                        <Text style={styles.specValue}>
                            {tune.modificationsRequired?.[0] || 'Stock'}
                        </Text>
                        <Text style={styles.specSub}>
                            {tune.modificationsRequired?.[1] || 'No mods needed'}
                        </Text>
                    </View>
                </View>

                {/* ─── Fitment ─── */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Fitment</Text>
                    <View style={styles.fitmentCard}>
                        <View style={styles.fitmentIcon}>
                            <Ionicons name="bicycle" size={24} color={C.neutral500} />
                        </View>
                        <View>
                            <Text style={styles.fitmentTitle}>
                                {activeBike ? `${activeBike.make} ${activeBike.model}` : 'Compatible Bikes'}
                            </Text>
                            <Text style={styles.fitmentSub}>
                                {activeBike ? `${activeBike.year} Model` : 'Select a bike to check'}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* ─── Safety Warning ─── */}
                {tune.safetyRating < 90 && (
                    <View style={styles.warningCard}>
                        <Ionicons name="warning" size={20} color={C.warning} />
                        <View style={styles.warningContent}>
                            <Text style={styles.warningTitle}>Safety Warning</Text>
                            <Text style={styles.warningBody}>
                                This tune disables factory safeguards. For off-road competition use only. Not legal for sale or use on pollution controlled vehicles.
                            </Text>
                        </View>
                    </View>
                )}

                {/* bottom spacer */}
                <View style={{ height: 160 }} />
            </Animated.ScrollView>

            {/* ─── Bottom Bar ─── */}
            <View style={styles.bottomBar}>
                <View style={styles.bottomPriceRow}>
                    <View>
                        <Text style={styles.bottomPriceLabel}>TOTAL</Text>
                        <Text style={styles.bottomPriceValue}>${tune.price.toFixed(2)}</Text>
                    </View>
                    <View style={styles.instantDelivery}>
                        <Ionicons name="flash" size={14} color={C.success} />
                        <Text style={styles.instantText}>Instant Delivery</Text>
                    </View>
                </View>
                <TouchableOpacity
                    style={[styles.purchaseBtn, !isCompatible && { opacity: 0.5 }]}
                    activeOpacity={0.85}
                    disabled={!isCompatible}
                    onPress={() => {
                        ServiceLocator.getAnalyticsService().logEvent('tune_validate_initiated', { tuneId: tune.id });
                        navigation.navigate('TuneValidation', { tuneId: tune.id });
                    }}
                >
                    <Text style={styles.purchaseBtnText}>
                        {isCompatible ? 'Purchase Tune' : 'Not Compatible'}
                    </Text>
                    <Ionicons name="arrow-forward" size={20} color={C.white} />
                </TouchableOpacity>
            </View>
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
    header: {
        paddingTop: Platform.OS === 'ios' ? 56 : 40,
        paddingBottom: 8,
        paddingHorizontal: 24,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: 'rgba(26,26,26,0.95)',
    },
    headerBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerRight: {
        flexDirection: 'row',
        gap: 16,
    },

    scrollContent: {
        paddingHorizontal: 20,
        paddingTop: 8,
    },

    // ── Title ──
    titleSection: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 16,
    },
    titleLeft: {
        flex: 1,
        marginRight: 16,
    },
    stageBadge: {
        alignSelf: 'flex-start',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 50,
        marginBottom: 12,
    },
    stageBadgeText: {
        fontSize: 11,
        fontWeight: '700',
        letterSpacing: 0.5,
        textTransform: 'uppercase',
    },
    tuneTitle: {
        fontSize: 28,
        fontWeight: '800',
        color: C.white,
        lineHeight: 31,
        letterSpacing: -0.3,
    },
    priceBlock: {
        alignItems: 'flex-end',
    },
    priceValue: {
        fontSize: 24,
        fontWeight: '800',
        color: C.primary,
    },
    priceCurrency: {
        fontSize: 12,
        color: C.neutral500,
    },

    // ── Tuner Bar ──
    tunerBar: {
        backgroundColor: C.surface,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: C.border,
        padding: 12,
        marginBottom: 20,
    },
    tunerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    tunerAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: C.neutral700,
        alignItems: 'center',
        justifyContent: 'center',
    },
    tunerAvatarText: {
        fontSize: 14,
        fontWeight: '700',
        color: C.white,
    },
    tunerNameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    tunerName: {
        fontSize: 14,
        fontWeight: '700',
        color: C.white,
    },
    ratingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginTop: 2,
    },
    ratingText: {
        fontSize: 12,
        color: C.neutral400,
    },
    viewProfileText: {
        fontSize: 12,
        fontWeight: '600',
        color: C.neutral400,
    },

    // ── Section ──
    section: {
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: C.white,
        marginBottom: 8,
    },
    bodyText: {
        fontSize: 14,
        color: C.neutral400,
        lineHeight: 21,
    },
    readMore: {
        fontSize: 14,
        fontWeight: '600',
        color: C.primary,
        marginTop: 6,
    },

    // ── Dyno Chart ──
    dynoCard: {
        height: 192,
        borderRadius: 16,
        backgroundColor: C.surface,
        borderWidth: 1,
        borderColor: C.border,
        overflow: 'hidden',
        marginBottom: 20,
        justifyContent: 'flex-end',
    },
    dynoOverlay: {
        ...StyleSheet.absoluteFillObject,
        zIndex: 2,
        alignItems: 'center',
        justifyContent: 'center',
    },
    dynoLabel: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: 'rgba(0,0,0,0.50)',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 50,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.10)',
    },
    dynoLabelText: {
        fontSize: 12,
        fontWeight: '700',
        color: C.white,
        letterSpacing: 0.5,
    },
    dynoLines: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        justifyContent: 'space-evenly',
        height: '60%',
        paddingHorizontal: 16,
        paddingBottom: 8,
    },
    dynoLine: {
        width: 16,
        borderRadius: 4,
    },

    // ── Specs Grid ──
    specsGrid: {
        flexDirection: 'row',
        gap: 16,
        marginBottom: 20,
    },
    specCard: {
        flex: 1,
        backgroundColor: C.surface,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: C.border,
        padding: 16,
    },
    specHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 8,
    },
    specLabel: {
        fontSize: 12,
        fontWeight: '700',
        color: C.neutral400,
        letterSpacing: 0.5,
    },
    specValue: {
        fontSize: 18,
        fontWeight: '700',
        color: C.white,
    },
    specSub: {
        fontSize: 12,
        color: C.neutral500,
        marginTop: 2,
    },

    // ── Fitment ──
    fitmentCard: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 16,
        backgroundColor: C.surface,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: C.border,
        padding: 16,
    },
    fitmentIcon: {
        width: 48,
        height: 48,
        borderRadius: 12,
        backgroundColor: C.neutral700,
        alignItems: 'center',
        justifyContent: 'center',
    },
    fitmentTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: C.white,
    },
    fitmentSub: {
        fontSize: 14,
        color: C.neutral500,
        marginTop: 2,
    },

    // ── Warning ──
    warningCard: {
        flexDirection: 'row',
        gap: 12,
        backgroundColor: C.warningBg,
        borderWidth: 1,
        borderColor: 'rgba(234,179,8,0.20)',
        borderRadius: 16,
        padding: 16,
        marginTop: 4,
    },
    warningContent: {
        flex: 1,
    },
    warningTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: C.warning,
        marginBottom: 4,
    },
    warningBody: {
        fontSize: 12,
        color: 'rgba(251,191,36,0.8)',
        lineHeight: 18,
    },

    // ── Bottom Bar ──
    bottomBar: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'rgba(26,26,26,0.95)',
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.10)',
        padding: 24,
        paddingBottom: Platform.OS === 'ios' ? 36 : 24,
    },
    bottomPriceRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        marginBottom: 16,
    },
    bottomPriceLabel: {
        fontSize: 12,
        fontWeight: '700',
        color: C.neutral400,
        letterSpacing: 0.8,
    },
    bottomPriceValue: {
        fontSize: 24,
        fontWeight: '800',
        color: C.white,
        marginTop: 2,
    },
    instantDelivery: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    instantText: {
        fontSize: 12,
        fontWeight: '500',
        color: C.success,
    },
    purchaseBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: C.primary,
        paddingVertical: 16,
        borderRadius: 50,
        // glow
        shadowColor: C.primary,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.4,
        shadowRadius: 15,
        elevation: 6,
    },
    purchaseBtnText: {
        fontSize: 18,
        fontWeight: '700',
        color: C.white,
    },

    // ── Retry ──
    retryBtn: {
        marginTop: 16,
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: C.primary,
    },
    retryBtnText: {
        fontSize: 14,
        fontWeight: '700',
        color: C.primary,
    },
});
