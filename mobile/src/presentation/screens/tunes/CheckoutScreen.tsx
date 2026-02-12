import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Animated, Easing, Alert } from 'react-native';
import { Theme } from '../../theme';
import {
    Screen, PrimaryButton, SecondaryButton, Card,
} from '../../components/SharedComponents';
import { Ionicons } from '@expo/vector-icons';
import { useAppStore } from '../../store/useAppStore';
import { ServiceLocator } from '../../../di/ServiceLocator';
import { Tune } from '../../../domain/services/DomainTypes';

type CheckoutState = 'review' | 'processing' | 'success' | 'failed';

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

    useEffect(() => {
        loadTune();
    }, [tuneId]);

    const loadTune = async () => {
        try {
            const tuneService = ServiceLocator.getTuneService();
            const data = await tuneService.getTuneDetails(tuneId);
            setTune(data);

            // Check if already purchased
            if (data?.listingId) {
                try {
                    const { owned } = await tuneService.checkPurchase(data.listingId);
                    if (owned) {
                        setAlreadyOwned(true);
                    }
                } catch {
                    // Offline — proceed without check
                }
            }
        } catch (e) {
            Alert.alert('Error', 'Could not load tune info.');
            navigation.goBack();
        } finally {
            setLoading(false);
        }
    };

    // ─── Stripe Payment Flow ───────────────────────────────────

    const handlePay = async () => {
        if (!tune) return;
        setState('processing');
        setStatusMessage('Creating payment intent...');

        try {
            const tuneService = ServiceLocator.getTuneService();
            const listingId = tune.listingId || tune.id;

            // Step 1: Create payment intent on backend
            setStatusMessage('Connecting to Stripe...');
            const { clientSecret, publishableKey } = await tuneService.createPaymentIntent(listingId);

            // Step 2: In production, present Stripe PaymentSheet here
            // For now, we simulate the Stripe confirmation after getting the real intent
            // When @stripe/stripe-react-native is fully configured:
            //
            // import { useStripe } from '@stripe/stripe-react-native';
            // const { initPaymentSheet, presentPaymentSheet } = useStripe();
            // await initPaymentSheet({ paymentIntentClientSecret: clientSecret, merchantDisplayName: 'RevSync' });
            // const { error } = await presentPaymentSheet();
            // if (error) throw error;

            setStatusMessage('Processing payment...');

            // Simulate Stripe confirmation delay (replace with real PaymentSheet)
            await new Promise(r => setTimeout(r, 2000));

            // Step 3: Payment success — webhook handles entitlement on backend
            ServiceLocator.getAnalyticsService().logEvent('purchase_completed', {
                tuneId,
                listingId,
                price: tune.price,
            });

            setState('success');

            Animated.sequence([
                Animated.parallel([
                    Animated.spring(checkScale, {
                        toValue: 1, friction: 4, tension: 60, useNativeDriver: true,
                    }),
                    Animated.timing(checkOpacity, {
                        toValue: 1, duration: 300, useNativeDriver: true,
                    }),
                ]),
            ]).start();

        } catch (e: any) {
            console.error('Payment error:', e);
            setStatusMessage(e.uiMessage || e.message || 'Payment failed');
            setState('failed');
        }
    };

    // ─── Render ────────────────────────────────────────────────

    if (loading || !tune) {
        return (
            <Screen center>
                <Text style={{ color: Theme.Colors.textSecondary }}>Loading...</Text>
            </Screen>
        );
    }

    // Already owned → skip to download
    if (alreadyOwned) {
        return (
            <Screen center>
                <View style={styles.ownedCircle}>
                    <Ionicons name="checkmark-done" size={48} color="#FFF" />
                </View>
                <Text style={styles.successTitle}>Already Purchased!</Text>
                <Text style={styles.successDesc}>
                    {tune.title} is already in your library.
                </Text>
                <PrimaryButton
                    title="Download & Verify"
                    icon="download-outline"
                    onPress={() => navigation.navigate('DownloadManager', {
                        versionId: tune.versionId,
                        listingId: tune.listingId || tune.id,
                        title: tune.title,
                    })}
                    style={{ marginTop: 32, minWidth: 200 }}
                />
                <SecondaryButton
                    title="Back to Tunes"
                    onPress={() => navigation.popToTop()}
                    style={{ marginTop: 12, minWidth: 200 }}
                />
            </Screen>
        );
    }

    // Success state
    if (state === 'success') {
        return (
            <Screen center>
                <Animated.View style={{ opacity: checkOpacity, transform: [{ scale: checkScale }] }}>
                    <View style={styles.successCircle}>
                        <Ionicons name="checkmark" size={56} color="#FFF" />
                    </View>
                </Animated.View>
                <Text style={styles.successTitle}>Purchase Complete!</Text>
                <Text style={styles.successDesc}>{tune.title} is now in your library.</Text>
                <PrimaryButton
                    title="Download & Verify"
                    icon="download-outline"
                    onPress={() => navigation.navigate('DownloadManager', {
                        versionId: tune.versionId,
                        listingId: tune.listingId || tune.id,
                        title: tune.title,
                    })}
                    style={{ marginTop: 32, minWidth: 200 }}
                />
                <SecondaryButton
                    title="Back to Tunes"
                    onPress={() => navigation.popToTop()}
                    style={{ marginTop: 12, minWidth: 200 }}
                />
            </Screen>
        );
    }

    return (
        <Screen scroll>
            <View style={styles.header}>
                <Text style={styles.title}>Checkout</Text>
            </View>

            {/* Tune Summary */}
            <Card style={styles.tuneCard}>
                <View style={styles.tuneRow}>
                    <View style={styles.tuneIconBox}>
                        <Ionicons name="flash" size={28} color={Theme.Colors.primary} />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.tuneName}>{tune.title}</Text>
                        <Text style={styles.tuneInfo}>Stage {tune.stage} • v{tune.version}</Text>
                    </View>
                </View>
            </Card>

            {/* Vehicle */}
            {activeBike && (
                <Card style={styles.vehicleCard}>
                    <View style={styles.vehicleRow}>
                        <Ionicons name="bicycle-outline" size={20} color={Theme.Colors.textSecondary} />
                        <Text style={styles.vehicleText}>
                            {activeBike.year} {activeBike.make} {activeBike.model}
                        </Text>
                    </View>
                </Card>
            )}

            {/* Price Breakdown */}
            <Card style={styles.priceCard}>
                <View style={styles.priceRow}>
                    <Text style={styles.priceLabel}>Tune Price</Text>
                    <Text style={styles.priceValue}>${tune.price.toFixed(2)}</Text>
                </View>
                <View style={styles.divider} />
                <View style={styles.priceRow}>
                    <Text style={styles.priceLabelBold}>Total</Text>
                    <Text style={styles.totalValue}>${tune.price.toFixed(2)}</Text>
                </View>
                <Text style={styles.taxNote}>Prices in USD. Tax included where applicable.</Text>
            </Card>

            {/* What you get */}
            <Card style={styles.benefitsCard}>
                <Text style={styles.benefitsTitle}>What's Included</Text>
                <BenefitItem icon="shield-checkmark" label="Cryptographically signed tune package" />
                <BenefitItem icon="refresh" label="Free updates to this tune version" />
                <BenefitItem icon="cloud-download" label="Unlimited re-downloads" />
                <BenefitItem icon="flash" label="Unlimited flashes to your ECU" />
            </Card>

            {/* Security Note */}
            <View style={styles.securityRow}>
                <Ionicons name="lock-closed" size={16} color={Theme.Colors.success} />
                <Text style={styles.securityText}>Secured by Stripe • 256-bit encryption</Text>
            </View>

            {/* Pay Button */}
            <View style={styles.footer}>
                {state === 'failed' && (
                    <View style={styles.failedBanner}>
                        <Ionicons name="alert-circle" size={20} color={Theme.Colors.error} />
                        <Text style={styles.failedText}>{statusMessage || 'Payment failed. Please try again.'}</Text>
                    </View>
                )}
                <PrimaryButton
                    title={state === 'processing' ? statusMessage || 'Processing...' : `Pay $${tune.price.toFixed(2)}`}
                    onPress={handlePay}
                    loading={state === 'processing'}
                    disabled={state === 'processing'}
                    icon="card-outline"
                    style={styles.payButton}
                />
            </View>
        </Screen>
    );
};

// ─── Small Components ──────────────────────────────────────────

const BenefitItem = ({ icon, label }: { icon: string; label: string }) => (
    <View style={styles.benefitRow}>
        <Ionicons name={icon as any} size={16} color="#22C55E" />
        <Text style={styles.benefitText}>{label}</Text>
    </View>
);

// ─── Styles ────────────────────────────────────────────────────

const styles = StyleSheet.create({
    header: { padding: Theme.Spacing.md },
    title: { ...Theme.Typography.h2 },
    tuneCard: { marginHorizontal: Theme.Spacing.md },
    tuneRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
    tuneIconBox: {
        width: 56, height: 56, borderRadius: 14,
        backgroundColor: 'rgba(225, 29, 72, 0.1)',
        justifyContent: 'center', alignItems: 'center',
    },
    tuneName: { fontSize: 18, fontWeight: '700', color: Theme.Colors.text },
    tuneInfo: { fontSize: 14, color: Theme.Colors.textSecondary, marginTop: 2 },
    vehicleCard: { marginHorizontal: Theme.Spacing.md },
    vehicleRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    vehicleText: { color: Theme.Colors.text, fontSize: 15, fontWeight: '500' },
    priceCard: { marginHorizontal: Theme.Spacing.md },
    priceRow: {
        flexDirection: 'row', justifyContent: 'space-between',
        alignItems: 'center', paddingVertical: 8,
    },
    priceLabel: { color: Theme.Colors.textSecondary, fontSize: 15 },
    priceLabelBold: { color: Theme.Colors.text, fontSize: 16, fontWeight: '700' },
    priceValue: { color: Theme.Colors.text, fontSize: 15 },
    totalValue: { color: Theme.Colors.success, fontSize: 22, fontWeight: '800' },
    divider: { height: 1, backgroundColor: Theme.Colors.border, marginVertical: 4 },
    taxNote: { color: Theme.Colors.textTertiary, fontSize: 12, marginTop: 8, fontStyle: 'italic' },
    benefitsCard: { marginHorizontal: Theme.Spacing.md },
    benefitsTitle: {
        fontSize: 14, fontWeight: '700', color: Theme.Colors.textSecondary,
        textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 12,
    },
    benefitRow: {
        flexDirection: 'row', alignItems: 'center', gap: 10,
        paddingVertical: 6,
    },
    benefitText: { color: Theme.Colors.text, fontSize: 14 },
    securityRow: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        gap: 8, paddingVertical: 16,
    },
    securityText: { color: Theme.Colors.textSecondary, fontSize: 13 },
    footer: { padding: Theme.Spacing.md, marginTop: 'auto' },
    payButton: {
        paddingVertical: 18,
        ...Theme.Shadows.lg,
        shadowColor: Theme.Colors.primary,
    },
    failedBanner: {
        flexDirection: 'row', alignItems: 'center', gap: 8,
        backgroundColor: 'rgba(239, 68, 68, 0.1)', padding: 12,
        borderRadius: 8, marginBottom: 16,
        borderWidth: 1, borderColor: Theme.Colors.error,
    },
    failedText: { color: Theme.Colors.error, fontSize: 14, fontWeight: '500', flex: 1 },
    successCircle: {
        width: 100, height: 100, borderRadius: 50,
        backgroundColor: Theme.Colors.success,
        justifyContent: 'center', alignItems: 'center',
        ...Theme.Shadows.lg, shadowColor: Theme.Colors.success,
    },
    ownedCircle: {
        width: 100, height: 100, borderRadius: 50,
        backgroundColor: '#3B82F6',
        justifyContent: 'center', alignItems: 'center',
        ...Theme.Shadows.lg, shadowColor: '#3B82F6',
    },
    successTitle: { ...Theme.Typography.h2, marginTop: 24, textAlign: 'center' },
    successDesc: { ...Theme.Typography.body, textAlign: 'center', marginTop: 8 },
});
