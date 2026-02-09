import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Animated, Easing, Alert } from 'react-native';
import { Theme } from '../../theme';
import { Screen, PrimaryButton, SecondaryButton, Card } from '../../components/SharedComponents';
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

    // Success animation
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
        } catch (e) {
            Alert.alert('Error', 'Could not load tune info.');
            navigation.goBack();
        } finally {
            setLoading(false);
        }
    };

    const handlePay = async () => {
        setState('processing');

        try {
            // Mock payment — in production, this calls Stripe via backend
            await new Promise(r => setTimeout(r, 2500));

            ServiceLocator.getAnalyticsService().logEvent('purchase_completed', {
                tuneId,
                price: tune?.price,
            });

            setState('success');

            // Animated checkmark
            Animated.sequence([
                Animated.parallel([
                    Animated.spring(checkScale, { toValue: 1, friction: 4, tension: 60, useNativeDriver: true }),
                    Animated.timing(checkOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
                ]),
            ]).start();

        } catch (e) {
            setState('failed');
        }
    };

    if (loading || !tune) {
        return (
            <Screen center>
                <Text style={{ color: Theme.Colors.textSecondary }}>Loading...</Text>
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
                    title="Flash Now"
                    onPress={() => navigation.navigate('FlashTab', {
                        screen: 'DeviceConnect',
                        params: { tuneId: tune.id }
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
                        <Text style={styles.tuneInfo}>Stage {tune.stage} • {'RevSync'}</Text>
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
                        <Text style={styles.failedText}>Payment failed. Please try again.</Text>
                    </View>
                )}
                <PrimaryButton
                    title={state === 'processing' ? 'Processing...' : `Pay $${tune.price.toFixed(2)}`}
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

const styles = StyleSheet.create({
    header: {
        padding: Theme.Spacing.md,
    },
    title: {
        ...Theme.Typography.h2,
    },
    tuneCard: {
        marginHorizontal: Theme.Spacing.md,
    },
    tuneRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    tuneIconBox: {
        width: 56,
        height: 56,
        borderRadius: 14,
        backgroundColor: 'rgba(225, 29, 72, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    tuneName: {
        fontSize: 18,
        fontWeight: '700',
        color: Theme.Colors.text,
    },
    tuneInfo: {
        fontSize: 14,
        color: Theme.Colors.textSecondary,
        marginTop: 2,
    },
    vehicleCard: {
        marginHorizontal: Theme.Spacing.md,
    },
    vehicleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    vehicleText: {
        color: Theme.Colors.text,
        fontSize: 15,
        fontWeight: '500',
    },
    priceCard: {
        marginHorizontal: Theme.Spacing.md,
    },
    priceRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 8,
    },
    priceLabel: {
        color: Theme.Colors.textSecondary,
        fontSize: 15,
    },
    priceLabelBold: {
        color: Theme.Colors.text,
        fontSize: 16,
        fontWeight: '700',
    },
    priceValue: {
        color: Theme.Colors.text,
        fontSize: 15,
    },
    totalValue: {
        color: Theme.Colors.success,
        fontSize: 22,
        fontWeight: '800',
    },
    divider: {
        height: 1,
        backgroundColor: Theme.Colors.border,
        marginVertical: 4,
    },
    taxNote: {
        color: Theme.Colors.textTertiary,
        fontSize: 12,
        marginTop: 8,
        fontStyle: 'italic',
    },
    securityRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 16,
    },
    securityText: {
        color: Theme.Colors.textSecondary,
        fontSize: 13,
    },
    footer: {
        padding: Theme.Spacing.md,
        marginTop: 'auto',
    },
    payButton: {
        paddingVertical: 18,
        ...Theme.Shadows.lg,
        shadowColor: Theme.Colors.primary,
    },
    failedBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        padding: 12,
        borderRadius: 8,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: Theme.Colors.error,
    },
    failedText: {
        color: Theme.Colors.error,
        fontSize: 14,
        fontWeight: '500',
    },
    successCircle: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: Theme.Colors.success,
        justifyContent: 'center',
        alignItems: 'center',
        ...Theme.Shadows.lg,
        shadowColor: Theme.Colors.success,
    },
    successTitle: {
        ...Theme.Typography.h2,
        marginTop: 24,
        textAlign: 'center',
    },
    successDesc: {
        ...Theme.Typography.body,
        textAlign: 'center',
        marginTop: 8,
    },
});
