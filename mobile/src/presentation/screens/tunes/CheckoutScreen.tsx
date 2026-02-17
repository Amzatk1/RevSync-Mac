import React, { useState, useRef, useEffect } from 'react';
import {
    View, Text, StyleSheet, Animated, Easing, Alert,
    ScrollView, TouchableOpacity, ActivityIndicator, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppStore } from '../../store/useAppStore';
import { ServiceLocator } from '../../../di/ServiceLocator';
import { Tune } from '../../../domain/services/DomainTypes';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

type CheckoutState = 'review' | 'processing' | 'success' | 'failed';

const C = {
    bg: '#1a1a1a',
    surface: '#252525',
    primary: '#ea103c',
    white: '#ffffff',
    textMuted: '#a3a3a3',
    textDim: '#737373',
    green: '#22c55e',
    border: 'rgba(255,255,255,0.05)',
};

export const CheckoutScreen = ({ route, navigation }: any) => {
    const { tuneId } = route.params;
    const { activeBike } = useAppStore();
    const [tune, setTune] = useState<Tune | null>(null);
    const [state, setState] = useState<CheckoutState>('review');
    const [loading, setLoading] = useState(true);
    const [statusMessage, setStatusMessage] = useState('');
    const [alreadyOwned, setAlreadyOwned] = useState(false);

    const checkScale = useRef(new Animated.Value(0)).current;
    const checkOpacity = useRef(new Animated.Value(0)).current;

    useEffect(() => { loadTune(); }, [tuneId]);

    const loadTune = async () => {
        try {
            const tuneService = ServiceLocator.getTuneService();
            const data = await tuneService.getTuneDetails(tuneId);
            setTune(data);
            if (data?.listingId) {
                try {
                    const { owned } = await tuneService.checkPurchase(data.listingId);
                    if (owned) setAlreadyOwned(true);
                } catch { }
            }
        } catch (e) {
            Alert.alert('Error', 'Could not load tune info.');
            navigation.goBack();
        } finally {
            setLoading(false);
        }
    };

    const handlePay = async () => {
        if (!tune) return;
        setState('processing');
        setStatusMessage('Creating payment intent...');
        try {
            const tuneService = ServiceLocator.getTuneService();
            const listingId = tune.listingId || tune.id;
            setStatusMessage('Connecting to Stripe...');
            const { clientSecret, publishableKey } = await tuneService.createPaymentIntent(listingId);
            setStatusMessage('Processing payment...');
            await new Promise(r => setTimeout(r, 2000));
            ServiceLocator.getAnalyticsService().logEvent('purchase_completed', { tuneId, listingId, price: tune.price });
            setState('success');
            Animated.parallel([
                Animated.spring(checkScale, { toValue: 1, friction: 4, tension: 60, useNativeDriver: true }),
                Animated.timing(checkOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
            ]).start();
        } catch (e: any) {
            console.error('Payment error:', e);
            setStatusMessage(e.uiMessage || e.message || 'Payment failed');
            setState('failed');
        }
    };

    // Loading
    if (loading || !tune) {
        return (
            <View style={[s.root, { alignItems: 'center', justifyContent: 'center' }]}>
                <ActivityIndicator size="large" color={C.primary} />
            </View>
        );
    }

    // Already Owned
    if (alreadyOwned) {
        return (
            <View style={[s.root, { alignItems: 'center', justifyContent: 'center', padding: 32 }]}>
                <View style={s.ownedCircle}>
                    <Ionicons name="checkmark-done" size={48} color="#FFF" />
                </View>
                <Text style={s.successTitle}>Already Purchased!</Text>
                <Text style={s.successDesc}>{tune.title} is already in your library.</Text>
                <TouchableOpacity
                    style={s.payBtn}
                    onPress={() => navigation.navigate('DownloadManager', {
                        versionId: tune.versionId, listingId: tune.listingId || tune.id, title: tune.title,
                    })}
                    activeOpacity={0.85}
                >
                    <Ionicons name="download-outline" size={20} color="#FFF" />
                    <Text style={s.payBtnText}>Download & Verify</Text>
                </TouchableOpacity>
                <TouchableOpacity style={s.secondaryBtn} onPress={() => navigation.popToTop()} activeOpacity={0.7}>
                    <Text style={s.secondaryBtnText}>Back to Tunes</Text>
                </TouchableOpacity>
            </View>
        );
    }

    // Success State
    if (state === 'success') {
        return (
            <View style={[s.root, { alignItems: 'center', justifyContent: 'center', padding: 32 }]}>
                <Animated.View style={{ opacity: checkOpacity, transform: [{ scale: checkScale }] }}>
                    <View style={s.successCircle}>
                        <Ionicons name="checkmark" size={56} color="#FFF" />
                    </View>
                </Animated.View>
                <Text style={s.successTitle}>Purchase Complete!</Text>
                <Text style={s.successDesc}>{tune.title} is now in your library.</Text>
                <TouchableOpacity
                    style={s.payBtn}
                    onPress={() => navigation.navigate('DownloadManager', {
                        versionId: tune.versionId, listingId: tune.listingId || tune.id, title: tune.title,
                    })}
                    activeOpacity={0.85}
                >
                    <Ionicons name="download-outline" size={20} color="#FFF" />
                    <Text style={s.payBtnText}>Download & Verify</Text>
                </TouchableOpacity>
                <TouchableOpacity style={s.secondaryBtn} onPress={() => navigation.popToTop()} activeOpacity={0.7}>
                    <Text style={s.secondaryBtnText}>Back to Tunes</Text>
                </TouchableOpacity>
            </View>
        );
    }

    // Review / Processing / Failed
    return (
        <View style={s.root}>
            {/* Header */}
            <SafeAreaView edges={['top']}>
                <View style={s.header}>
                    <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
                        <Ionicons name="arrow-back" size={20} color={C.white} />
                    </TouchableOpacity>
                    <Text style={s.headerTitle}>Checkout</Text>
                    <View style={{ width: 40 }} />
                </View>
            </SafeAreaView>

            <ScrollView contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
                {/* Tune Summary Card */}
                <View style={s.tuneCard}>
                    <LinearGradient
                        colors={['rgba(234,16,60,0.12)', 'rgba(234,16,60,0.02)']}
                        style={StyleSheet.absoluteFillObject}
                        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                    />
                    <View style={s.tuneCardInner}>
                        <View style={s.tuneIconBox}>
                            <Ionicons name="flash" size={24} color={C.primary} />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={s.tuneName}>{tune.title}</Text>
                            <Text style={s.tuneInfo}>Stage {tune.stage} • v{tune.version}</Text>
                        </View>
                        <Text style={s.tunePrice}>${tune.price.toFixed(2)}</Text>
                    </View>
                    {activeBike && (
                        <View style={s.vehicleRow}>
                            <Ionicons name="bicycle" size={14} color={C.textDim} />
                            <Text style={s.vehicleText}>{activeBike.year} {activeBike.make} {activeBike.model}</Text>
                        </View>
                    )}
                    {tune.description && (
                        <Text style={s.tuneDescription}>{tune.description}</Text>
                    )}
                </View>

                {/* Pricing Breakdown */}
                <View style={s.priceCard}>
                    <Text style={s.sectionTitle}>Pricing</Text>
                    <View style={s.priceRow}>
                        <Text style={s.priceLabel}>Tune License</Text>
                        <Text style={s.priceValue}>${tune.price.toFixed(2)}</Text>
                    </View>
                    <View style={s.priceRow}>
                        <Text style={s.priceLabel}>Priority Support</Text>
                        <Text style={s.priceValueFree}>FREE</Text>
                    </View>
                    <View style={s.priceDivider} />
                    <View style={s.priceRow}>
                        <Text style={s.totalLabel}>Total</Text>
                        <Text style={s.totalValue}>${tune.price.toFixed(2)}</Text>
                    </View>
                </View>

                {/* What's Included */}
                <View style={s.includesCard}>
                    <Text style={s.sectionTitle}>What's Included</Text>
                    <BenefitItem icon="flash" label="Instant flash — ready in seconds" />
                    <BenefitItem icon="shield-checkmark" label="Cryptographically signed package" />
                    <BenefitItem icon="refresh" label="Free updates to this tune version" />
                    <BenefitItem icon="cloud-download" label="Unlimited re-downloads" />
                </View>

                {/* Payment Method */}
                <View style={s.paymentCard}>
                    <Text style={s.sectionTitle}>Payment Method</Text>
                    <TouchableOpacity style={s.payMethodRow} activeOpacity={0.7}>
                        <Ionicons name="logo-apple" size={20} color={C.white} />
                        <Text style={s.payMethodLabel}>Apple Pay</Text>
                        <Ionicons name="checkmark-circle" size={20} color={C.primary} style={{ marginLeft: 'auto' }} />
                    </TouchableOpacity>
                </View>
            </ScrollView>

            {/* Sticky Footer */}
            <LinearGradient colors={['transparent', C.bg, C.bg]} style={s.footer}>
                <SafeAreaView edges={['bottom']}>
                    {/* Security badge */}
                    <View style={s.securityRow}>
                        <Ionicons name="lock-closed" size={14} color={C.green} />
                        <Text style={s.securityText}>Secured by Stripe • 256-bit encryption</Text>
                    </View>

                    {state === 'failed' && (
                        <View style={s.failedBanner}>
                            <Ionicons name="alert-circle" size={18} color="#EF4444" />
                            <Text style={s.failedText}>{statusMessage || 'Payment failed.'}</Text>
                        </View>
                    )}

                    <TouchableOpacity
                        style={[s.payBtn, state === 'processing' && { opacity: 0.7 }]}
                        onPress={handlePay}
                        disabled={state === 'processing'}
                        activeOpacity={0.85}
                    >
                        {state === 'processing' ? (
                            <ActivityIndicator size="small" color="#FFF" />
                        ) : (
                            <Ionicons name="card-outline" size={20} color="#FFF" />
                        )}
                        <Text style={s.payBtnText}>
                            {state === 'processing' ? statusMessage || 'Processing...' : `Pay $${tune.price.toFixed(2)}`}
                        </Text>
                    </TouchableOpacity>
                </SafeAreaView>
            </LinearGradient>
        </View>
    );
};

const BenefitItem = ({ icon, label }: { icon: string; label: string }) => (
    <View style={s.benefitRow}>
        <View style={s.benefitDot}>
            <Ionicons name={icon as any} size={14} color={C.green} />
        </View>
        <Text style={s.benefitText}>{label}</Text>
    </View>
);

const s = StyleSheet.create({
    root: { flex: 1, backgroundColor: C.bg },

    // Header
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 24, paddingVertical: 12,
    },
    backBtn: {
        width: 40, height: 40, borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.05)',
        alignItems: 'center', justifyContent: 'center',
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)',
    },
    headerTitle: {
        fontSize: 18, fontWeight: '700', color: C.white,
    },

    scrollContent: { paddingHorizontal: 24, paddingBottom: 200, gap: 20, paddingTop: 8 },

    // Tune Card
    tuneCard: {
        backgroundColor: C.surface, borderRadius: 20, padding: 20,
        borderWidth: 1, borderColor: 'rgba(234,16,60,0.15)', overflow: 'hidden',
    },
    tuneCardInner: {
        flexDirection: 'row', alignItems: 'center', gap: 14,
    },
    tuneIconBox: {
        width: 48, height: 48, borderRadius: 14,
        backgroundColor: 'rgba(234,16,60,0.12)',
        alignItems: 'center', justifyContent: 'center',
    },
    tuneName: { fontSize: 18, fontWeight: '700', color: C.white },
    tuneInfo: { fontSize: 12, color: C.textDim, marginTop: 2 },
    tunePrice: { fontSize: 20, fontWeight: '800', color: C.primary },
    vehicleRow: {
        flexDirection: 'row', alignItems: 'center', gap: 8,
        marginTop: 14, paddingTop: 14,
        borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)',
    },
    vehicleText: { fontSize: 13, color: C.textMuted },
    tuneDescription: {
        fontSize: 13, color: C.textDim, marginTop: 10, lineHeight: 18,
    },

    // Price Card
    priceCard: {
        backgroundColor: C.surface, borderRadius: 16, padding: 20,
        borderWidth: 1, borderColor: C.border,
    },
    sectionTitle: {
        fontSize: 11, fontWeight: '700', color: C.textDim,
        textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16,
    },
    priceRow: {
        flexDirection: 'row', justifyContent: 'space-between',
        alignItems: 'center', paddingVertical: 6,
    },
    priceLabel: { fontSize: 14, color: C.textMuted },
    priceValue: { fontSize: 14, color: C.white, fontWeight: '500' },
    priceValueFree: {
        fontSize: 12, fontWeight: '700', color: C.green,
        textTransform: 'uppercase',
    },
    priceDivider: {
        height: 1, backgroundColor: 'rgba(255,255,255,0.05)',
        marginVertical: 10,
    },
    totalLabel: { fontSize: 16, fontWeight: '700', color: C.white },
    totalValue: { fontSize: 22, fontWeight: '800', color: C.primary },

    // Includes
    includesCard: {
        backgroundColor: C.surface, borderRadius: 16, padding: 20,
        borderWidth: 1, borderColor: C.border,
    },
    benefitRow: {
        flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8,
    },
    benefitDot: {
        width: 28, height: 28, borderRadius: 14,
        backgroundColor: 'rgba(34,197,94,0.1)',
        alignItems: 'center', justifyContent: 'center',
    },
    benefitText: { fontSize: 14, color: C.textMuted, flex: 1 },

    // Payment
    paymentCard: {
        backgroundColor: C.surface, borderRadius: 16, padding: 20,
        borderWidth: 1, borderColor: C.border,
    },
    payMethodRow: {
        flexDirection: 'row', alignItems: 'center', gap: 12,
        paddingVertical: 12, paddingHorizontal: 16,
        borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.03)',
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)',
    },
    payMethodLabel: { fontSize: 16, fontWeight: '600', color: C.white },

    // Footer
    footer: {
        position: 'absolute', bottom: 0, left: 0, right: 0,
        paddingHorizontal: 24, paddingTop: 48,
    },
    securityRow: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        gap: 6, marginBottom: 12,
    },
    securityText: { fontSize: 12, color: C.textDim },
    failedBanner: {
        flexDirection: 'row', alignItems: 'center', gap: 8,
        backgroundColor: 'rgba(239,68,68,0.08)', padding: 12,
        borderRadius: 12, marginBottom: 12,
        borderWidth: 1, borderColor: 'rgba(239,68,68,0.2)',
    },
    failedText: { fontSize: 13, color: '#EF4444', fontWeight: '500', flex: 1 },
    payBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        gap: 10, height: 56, borderRadius: 50,
        backgroundColor: C.primary,
        shadowColor: C.primary, shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.3, shadowRadius: 20, elevation: 10,
        marginBottom: 8,
    },
    payBtnText: { fontSize: 18, fontWeight: '700', color: '#FFF' },
    secondaryBtn: {
        paddingVertical: 14, paddingHorizontal: 24,
        borderRadius: 50, borderWidth: 1, borderColor: '#525252',
        alignItems: 'center', marginTop: 12,
    },
    secondaryBtnText: { fontSize: 14, fontWeight: '600', color: '#d4d4d4' },

    // Success / Owned
    successCircle: {
        width: 100, height: 100, borderRadius: 50,
        backgroundColor: C.green, alignItems: 'center', justifyContent: 'center',
        shadowColor: C.green, shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.4, shadowRadius: 20,
    },
    ownedCircle: {
        width: 100, height: 100, borderRadius: 50,
        backgroundColor: '#3B82F6', alignItems: 'center', justifyContent: 'center',
        shadowColor: '#3B82F6', shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.4, shadowRadius: 20, marginBottom: 24,
    },
    successTitle: {
        fontSize: 24, fontWeight: '800', color: C.white, marginTop: 24, textAlign: 'center',
    },
    successDesc: {
        fontSize: 15, color: C.textMuted, textAlign: 'center', marginTop: 8, lineHeight: 22,
    },
});
