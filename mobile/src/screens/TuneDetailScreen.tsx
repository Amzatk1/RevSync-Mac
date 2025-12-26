import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { theme } from '../styles/theme';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { marketplaceService } from '../services/marketplaceService';

export default function TuneDetailScreen() {
    const route = useRoute();
    const navigation = useNavigation();
    const { tuneId, name, author, price, rating } = route.params as any;
    const [purchasing, setPurchasing] = useState(false);

    const handlePurchase = async () => {
        setPurchasing(true);
        try {
            // In a real app, this would trigger a Stripe/Apple Pay flow first
            await marketplaceService.purchaseTune(tuneId);
            Alert.alert('Success', 'Tune purchased and added to your library!', [
                { text: 'OK', onPress: () => navigation.goBack() }
            ]);
        } catch (error) {
            Alert.alert('Error', 'Purchase failed. Please try again.');
        } finally {
            setPurchasing(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Button
                    title="Back"
                    variant="ghost"
                    size="sm"
                    onPress={() => navigation.goBack()}
                    style={styles.backButton}
                />
                <Text style={styles.headerTitle}>Tune Details</Text>
                <View style={{ width: 60 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* Hero Section */}
                <View style={styles.hero}>
                    <Text style={styles.title}>{name}</Text>
                    <Text style={styles.author}>by {author}</Text>

                    <View style={styles.ratingRow}>
                        <View style={styles.badge}>
                            <Text style={styles.badgeText}>Safety: {rating}/10</Text>
                        </View>
                        <View style={[styles.badge, styles.verifiedBadge]}>
                            <Text style={styles.badgeText}>✓ Verified</Text>
                        </View>
                    </View>
                </View>

                {/* Dyno Chart Placeholder */}
                <Card style={styles.chartCard}>
                    <Text style={styles.chartTitle}>Dyno Results</Text>
                    <View style={styles.chartPlaceholder}>
                        {/* Simulated Chart Lines */}
                        <View style={styles.chartLine} />
                        <Text style={styles.chartLabel}>+12 HP Gain</Text>
                    </View>
                </Card>

                {/* Description */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Description</Text>
                    <Text style={styles.description}>
                        Optimized for street performance with a focus on mid-range torque and smooth throttle response.
                        Removes factory restrictions and improves fuel mapping for aftermarket exhausts.
                    </Text>
                </View>

                {/* Features List */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Features</Text>
                    {[
                        'Improved Throttle Response',
                        'Fan Temperature Lowered (195°F)',
                        'Top Speed Limiter Removed',
                        'Decel Cut Disabled',
                        'Optimized Ignition Timing'
                    ].map((feature, index) => (
                        <View key={index} style={styles.featureRow}>
                            <Text style={styles.featureBullet}>•</Text>
                            <Text style={styles.featureText}>{feature}</Text>
                        </View>
                    ))}
                </View>

                {/* Compatibility */}
                <Card style={styles.compatibilityCard}>
                    <Text style={styles.compatibilityTitle}>Compatibility Check</Text>
                    <View style={styles.compatibilityRow}>
                        <Text style={styles.compatibilityLabel}>Your Bike:</Text>
                        <Text style={styles.compatibilityValue}>2024 Yamaha R1</Text>
                    </View>
                    <View style={styles.compatibilityStatus}>
                        <Text style={styles.compatibilitySuccess}>✓ Fully Compatible</Text>
                    </View>
                </Card>

            </ScrollView>

            {/* Sticky Footer */}
            <View style={styles.footer}>
                <View>
                    <Text style={styles.priceLabel}>Total Price</Text>
                    <Text style={styles.price}>${price}</Text>
                </View>
                <Button
                    title={purchasing ? "Processing..." : "Purchase & Flash"}
                    size="lg"
                    onPress={handlePurchase}
                    disabled={purchasing}
                    style={styles.buyButton}
                />
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
    },
    backButton: {
        width: 60,
        justifyContent: 'flex-start',
    },
    headerTitle: {
        ...theme.typography.h3,
        fontSize: 18,
        color: theme.colors.text,
    },
    scrollContent: {
        padding: 20,
        paddingBottom: 100,
    },
    hero: {
        marginBottom: 24,
    },
    title: {
        ...theme.typography.h1,
        color: theme.colors.text,
        marginBottom: 4,
    },
    author: {
        ...theme.typography.h3,
        color: theme.colors.primary,
        marginBottom: 12,
    },
    ratingRow: {
        flexDirection: 'row',
        gap: 8,
    },
    badge: {
        backgroundColor: theme.colors.surfaceHighlight,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
    },
    verifiedBadge: {
        backgroundColor: 'rgba(48, 209, 88, 0.2)',
    },
    badgeText: {
        color: theme.colors.text,
        fontWeight: '600',
        fontSize: 12,
    },
    chartCard: {
        height: 200,
        marginBottom: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    chartTitle: {
        position: 'absolute',
        top: 16,
        left: 16,
        color: theme.colors.textSecondary,
        fontWeight: '600',
    },
    chartPlaceholder: {
        alignItems: 'center',
    },
    chartLine: {
        width: 200,
        height: 2,
        backgroundColor: theme.colors.primary,
        transform: [{ rotate: '-20deg' }],
        marginBottom: 12,
    },
    chartLabel: {
        color: theme.colors.success,
        fontWeight: 'bold',
        fontSize: 18,
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        ...theme.typography.h3,
        color: theme.colors.text,
        marginBottom: 12,
    },
    description: {
        ...theme.typography.body,
        color: theme.colors.textSecondary,
        lineHeight: 24,
    },
    featureRow: {
        flexDirection: 'row',
        marginBottom: 8,
    },
    featureBullet: {
        color: theme.colors.primary,
        marginRight: 8,
        fontSize: 16,
    },
    featureText: {
        ...theme.typography.body,
        color: theme.colors.text,
    },
    compatibilityCard: {
        backgroundColor: 'rgba(48, 209, 88, 0.1)',
        borderColor: theme.colors.success,
    },
    compatibilityTitle: {
        fontWeight: '600',
        color: theme.colors.success,
        marginBottom: 8,
    },
    compatibilityRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 4,
    },
    compatibilityLabel: {
        color: theme.colors.textSecondary,
    },
    compatibilityValue: {
        color: theme.colors.text,
        fontWeight: '600',
    },
    compatibilityStatus: {
        marginTop: 8,
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: 'rgba(48, 209, 88, 0.2)',
    },
    compatibilitySuccess: {
        color: theme.colors.success,
        fontWeight: 'bold',
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: theme.colors.surface,
        borderTopWidth: 1,
        borderTopColor: theme.colors.border,
        padding: 20,
        paddingBottom: 34,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    priceLabel: {
        color: theme.colors.textSecondary,
        fontSize: 12,
    },
    price: {
        color: theme.colors.text,
        fontSize: 24,
        fontWeight: 'bold',
    },
    buyButton: {
        width: 180,
    },
});
