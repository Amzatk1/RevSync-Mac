import React, { useEffect, useMemo, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

import { Theme } from '../../theme';
import { Screen, LoadingOverlay, ErrorBanner } from '../../components/SharedComponents';
import { ServiceLocator } from '../../../di/ServiceLocator';
import { Tune } from '../../../domain/services/DomainTypes';
import { useAppStore } from '../../store/useAppStore';

const getStageBadge = (stage: number) => {
    if (stage === 2) return { text: 'STAGE 2', bg: 'rgba(225,29,72,0.14)', border: 'rgba(225,29,72,0.35)', color: '#FB7185' };
    if (stage === 3) return { text: 'STAGE 3', bg: 'rgba(168,85,247,0.16)', border: 'rgba(168,85,247,0.3)', color: '#C084FC' };
    if (stage <= 0) return { text: 'ECO', bg: 'rgba(115,115,115,0.18)', border: 'rgba(115,115,115,0.35)', color: '#D4D4D8' };
    return { text: `STAGE ${stage}`, bg: 'rgba(113,113,122,0.22)', border: 'rgba(113,113,122,0.38)', color: '#E4E4E7' };
};

export const TuneDetailsScreen = ({ route, navigation }: any) => {
    const { tuneId } = route.params;
    const { activeBike } = useAppStore();

    const [tune, setTune] = useState<Tune | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [expanded, setExpanded] = useState(false);
    const [saved, setSaved] = useState(false);

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
        } catch (e: any) {
            setError(e.message || 'Failed to load tune details');
        } finally {
            setLoading(false);
        }
    };

    const description = useMemo(() => {
        if (!tune?.description) {
            return 'Optimized for track use. Increases mid-range torque and peak horsepower. Improved throttle response and smoother power delivery across the entire rev range.';
        }
        return tune.description;
    }, [tune]);

    if (loading) return <LoadingOverlay visible message="Loading tune..." />;
    if (error) return <Screen center><ErrorBanner message={error} onRetry={loadTune} /></Screen>;
    if (!tune) return null;

    const stage = getStageBadge(tune.stage);
    const priceText = tune.price <= 0 ? 'Free' : `$${tune.price.toFixed(0)}`;
    const priceFull = tune.price <= 0 ? 'Free' : `$${tune.price.toFixed(2)}`;
    const requiresWarning = tune.safetyRating < 90 || tune.stage >= 2;

    return (
        <Screen>
            <View style={styles.container}>
                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                    <View style={styles.topBar}>
                        <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.goBack()}>
                            <Ionicons name="arrow-back" size={24} color={Theme.Colors.textSecondary} />
                        </TouchableOpacity>
                        <View style={styles.topRightActions}>
                            <TouchableOpacity style={styles.iconBtn}>
                                <Ionicons name="share-social-outline" size={22} color={Theme.Colors.textSecondary} />
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.iconBtn} onPress={() => setSaved(v => !v)}>
                                <Ionicons name={saved ? 'heart' : 'heart-outline'} size={22} color={saved ? Theme.Colors.primary : Theme.Colors.textSecondary} />
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View style={styles.titleRow}>
                        <View style={{ flex: 1 }}>
                            <View style={[styles.stageBadge, { backgroundColor: stage.bg, borderColor: stage.border }]}>
                                <Text style={[styles.stageBadgeText, { color: stage.color }]}>{stage.text}</Text>
                            </View>
                            <Text style={styles.title}>{tune.title}</Text>
                        </View>
                        <View style={styles.priceCol}>
                            <Text style={styles.priceBig}>{priceText}</Text>
                            <Text style={styles.priceCurrency}>USD</Text>
                        </View>
                    </View>

                    <View style={styles.tunerCard}>
                        <View style={styles.avatar}><Text style={styles.avatarText}>RL</Text></View>
                        <View style={{ flex: 1 }}>
                            <View style={styles.tunerNameRow}>
                                <Text style={styles.tunerName}>Race Logic</Text>
                                <Ionicons name="checkmark-circle" size={14} color="#60A5FA" />
                            </View>
                            <View style={styles.ratingRow}>
                                <Ionicons name="star" size={12} color="#FACC15" />
                                <Text style={styles.tunerMeta}>4.9 (1.2k)</Text>
                            </View>
                        </View>
                        <TouchableOpacity><Text style={styles.profileLink}>View Profile</Text></TouchableOpacity>
                    </View>

                    <Text style={styles.sectionTitle}>Description</Text>
                    <Text style={styles.descriptionText} numberOfLines={expanded ? undefined : 4}>{description}</Text>
                    <TouchableOpacity onPress={() => setExpanded(v => !v)}>
                        <Text style={styles.readMore}>{expanded ? 'Show less' : 'Read more'}</Text>
                    </TouchableOpacity>

                    <View style={styles.chartCard}>
                        <LinearGradient
                            colors={['#2F3035', '#3A3B41']}
                            style={StyleSheet.absoluteFillObject}
                        />
                        <View style={styles.chartWave1} />
                        <View style={styles.chartWave2} />
                        <TouchableOpacity style={styles.chartBtn}>
                            <Ionicons name="scan-outline" size={18} color="#FFF" />
                            <Text style={styles.chartBtnText}>VIEW DYNO CHART</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.reqRow}>
                        <View style={styles.reqCard}>
                            <View style={styles.reqHeader}>
                                <Ionicons name="flask-outline" size={14} color={Theme.Colors.textSecondary} />
                                <Text style={styles.reqLabel}>FUEL</Text>
                            </View>
                            <Text style={styles.reqValue}>{tune.octaneRequired ? `${tune.octaneRequired} Octane` : '93 Octane'}</Text>
                            <Text style={styles.reqSub}>Premium Required</Text>
                        </View>

                        <View style={styles.reqCard}>
                            <View style={styles.reqHeader}>
                                <Ionicons name="construct-outline" size={14} color={Theme.Colors.textSecondary} />
                                <Text style={styles.reqLabel}>MODS</Text>
                            </View>
                            <Text style={styles.reqValue}>{tune.modificationsRequired?.[0] || 'Full Exhaust'}</Text>
                            <Text style={styles.reqSub}>{tune.modificationsRequired?.[1] || 'High Flow Filter'}</Text>
                        </View>
                    </View>

                    <Text style={styles.sectionTitle}>Fitment</Text>
                    <View style={styles.fitmentCard}>
                        <Image
                            source={require('../../../../assets/welcome-hero.png')}
                            style={styles.fitmentThumb}
                        />
                        <View style={{ flex: 1 }}>
                            <Text style={styles.fitmentTitle}>
                                {activeBike ? `${activeBike.make} ${activeBike.model}` : tune.bikeId}
                            </Text>
                            <Text style={styles.fitmentSub}>{activeBike ? `${activeBike.year} Model` : '2021 - 2023 Models'}</Text>
                        </View>
                    </View>

                    {requiresWarning && (
                        <View style={styles.warningCard}>
                            <View style={styles.warningRow}>
                                <Ionicons name="warning" size={20} color="#FACC15" />
                                <Text style={styles.warningTitle}>Safety Warning</Text>
                            </View>
                            <Text style={styles.warningText}>
                                This tune may disable factory safeguards and is intended for advanced/off-road use. Verify fuel and cooling system readiness before flashing.
                            </Text>
                        </View>
                    )}

                    <View style={{ height: 130 }} />
                </ScrollView>

                <View style={styles.bottomBar}>
                    <View style={styles.bottomTopRow}>
                        <View>
                            <Text style={styles.totalLabel}>TOTAL</Text>
                            <Text style={styles.totalValue}>{priceFull}</Text>
                        </View>
                        <View style={styles.deliveryRow}>
                            <Ionicons name="flash" size={14} color="#22C55E" />
                            <Text style={styles.deliveryText}>Instant Delivery</Text>
                        </View>
                    </View>

                    <TouchableOpacity
                        style={styles.purchaseBtn}
                        onPress={() => navigation.navigate('Checkout', { tuneId: tune.id })}
                        activeOpacity={0.9}
                    >
                        <Text style={styles.purchaseText}>Purchase Tune</Text>
                        <Ionicons name="arrow-forward" size={22} color="#FFF" />
                    </TouchableOpacity>
                </View>
            </View>
        </Screen>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#151619' },
    scrollContent: { padding: 20, paddingTop: 56, paddingBottom: 0 },
    topBar: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 14 },
    topRightActions: { flexDirection: 'row', gap: 10 },
    iconBtn: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
    titleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 18 },
    stageBadge: { alignSelf: 'flex-start', borderWidth: 1, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4, marginBottom: 12 },
    stageBadgeText: { fontSize: 13, fontWeight: '800', letterSpacing: 0.4 },
    title: { color: Theme.Colors.text, fontSize: 48, fontWeight: '800', lineHeight: 52, letterSpacing: -1 },
    priceCol: { alignItems: 'flex-end', paddingTop: 6 },
    priceBig: { color: Theme.Colors.primary, fontSize: 52, fontWeight: '800', letterSpacing: -0.8 },
    priceCurrency: { color: Theme.Colors.textSecondary, fontSize: 12, marginTop: -4 },
    tunerCard: {
        flexDirection: 'row', alignItems: 'center', gap: 12,
        backgroundColor: '#2A2B30', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
        padding: 14, marginBottom: 18,
    },
    avatar: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', backgroundColor: '#4B4C51' },
    avatarText: { color: '#E5E7EB', fontWeight: '800' },
    tunerNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    tunerName: { color: Theme.Colors.text, fontSize: 16, fontWeight: '700' },
    ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
    tunerMeta: { color: Theme.Colors.textSecondary, fontSize: 13 },
    profileLink: { color: Theme.Colors.textSecondary, fontSize: 14, fontWeight: '600' },
    sectionTitle: { color: Theme.Colors.text, fontSize: 38, fontWeight: '800', marginBottom: 8, letterSpacing: -0.6 },
    descriptionText: { color: Theme.Colors.textSecondary, fontSize: 16, lineHeight: 24 },
    readMore: { color: Theme.Colors.primary, fontSize: 16, fontWeight: '700', marginTop: 8, marginBottom: 18 },
    chartCard: {
        height: 220, borderRadius: 18, overflow: 'hidden',
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', marginBottom: 16,
        justifyContent: 'center', alignItems: 'center',
    },
    chartWave1: { position: 'absolute', bottom: 0, left: -20, right: -20, height: 92, backgroundColor: 'rgba(225,29,72,0.22)', transform: [{ skewY: '-8deg' }] as any },
    chartWave2: { position: 'absolute', bottom: 0, left: -20, right: -20, height: 66, backgroundColor: 'rgba(225,29,72,0.34)', transform: [{ skewY: '-8deg' }] as any },
    chartBtn: {
        flexDirection: 'row', alignItems: 'center', gap: 8,
        backgroundColor: 'rgba(10,10,12,0.9)', paddingHorizontal: 18, paddingVertical: 10, borderRadius: 999,
    },
    chartBtnText: { color: '#FFF', fontSize: 16, fontWeight: '800' },
    reqRow: { flexDirection: 'row', gap: 12, marginBottom: 14 },
    reqCard: {
        flex: 1, backgroundColor: '#2A2B30', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
        borderRadius: 16, padding: 14,
    },
    reqHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
    reqLabel: { color: Theme.Colors.textSecondary, fontSize: 13, fontWeight: '700' },
    reqValue: { color: Theme.Colors.text, fontSize: 20, fontWeight: '700' },
    reqSub: { color: Theme.Colors.textSecondary, fontSize: 14, marginTop: 2 },
    fitmentCard: {
        flexDirection: 'row', alignItems: 'center', gap: 12,
        backgroundColor: '#2A2B30', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', padding: 12,
        marginBottom: 14,
    },
    fitmentThumb: { width: 56, height: 56, borderRadius: 12 },
    fitmentTitle: { color: Theme.Colors.text, fontSize: 20, fontWeight: '700' },
    fitmentSub: { color: Theme.Colors.textSecondary, fontSize: 14, marginTop: 2 },
    warningCard: {
        backgroundColor: 'rgba(250, 204, 21, 0.12)', borderColor: 'rgba(250, 204, 21, 0.3)', borderWidth: 1,
        borderRadius: 16, padding: 14,
    },
    warningRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
    warningTitle: { color: '#FACC15', fontSize: 20, fontWeight: '800' },
    warningText: { color: '#E8D17D', fontSize: 14, lineHeight: 20 },
    bottomBar: {
        position: 'absolute', left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(19,20,23,0.98)', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.08)',
        paddingHorizontal: 20, paddingTop: 12, paddingBottom: 18,
    },
    bottomTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    totalLabel: { color: Theme.Colors.textSecondary, fontSize: 12, letterSpacing: 0.8, fontWeight: '700' },
    totalValue: { color: Theme.Colors.text, fontSize: 40, fontWeight: '800', letterSpacing: -0.7 },
    deliveryRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    deliveryText: { color: '#22C55E', fontSize: 14, fontWeight: '600' },
    purchaseBtn: {
        height: 68, borderRadius: 999, backgroundColor: Theme.Colors.primary,
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    },
    purchaseText: { color: '#FFF', fontSize: 34, fontWeight: '800', letterSpacing: -0.5 },
});
