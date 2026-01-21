import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Theme } from '../../theme';
import { Screen, PrimaryButton, LoadingOverlay, Card, ErrorBanner } from '../../components/SharedComponents';
import { Ionicons } from '@expo/vector-icons';
import { ServiceLocator } from '../../../di/ServiceLocator';
import { Tune } from '../../../domain/services/DomainTypes';
import { useAppStore } from '../../store/useAppStore';

export const TuneDetailsScreen = ({ route, navigation }: any) => {
    const { tuneId } = route.params;
    const { activeBike } = useAppStore();
    const [tune, setTune] = useState<Tune | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

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

    const isCompatible = tune && activeBike && tune.bikeId === activeBike.id;
    // In real logic, we'd also check ECU ID compatibility via compatibilityRaw

    if (loading) return <LoadingOverlay visible={true} />;

    if (error) {
        return (
            <Screen center>
                <ErrorBanner message={error} onRetry={loadTune} />
            </Screen>
        );
    }

    if (!tune) return null;

    return (
        <Screen scroll>
            <View style={styles.header}>
                <Text style={styles.name}>{tune.name}</Text>
                <View style={styles.row}>
                    <View style={styles.badge}>
                        <Text style={styles.badgeText}>Stage {tune.stage}</Text>
                    </View>
                    <Text style={styles.price}>${tune.price}</Text>
                </View>
            </View>

            {/* Compatibility Section */}
            <Card style={isCompatible ? styles.compatibleCard : styles.incompatibleCard}>
                <View style={styles.compatibilityHeader}>
                    <Ionicons
                        name={isCompatible ? "checkmark-circle" : "alert-circle"}
                        size={24}
                        color={isCompatible ? Theme.Colors.success : Theme.Colors.error}
                    />
                    <Text style={styles.compatibilityTitle}>
                        {isCompatible ? 'Compatible with your bike' : 'Not Compatible'}
                    </Text>
                </View>
                {!isCompatible && activeBike && (
                    <Text style={styles.compatibilityReason}>
                        This tune is for {tune.bikeId}, but your active bike is {activeBike.name}.
                    </Text>
                )}
                {!activeBike && (
                    <Text style={styles.compatibilityReason}>
                        Please select a bike in your Garage to check compatibility.
                    </Text>
                )}
            </Card>

            {/* Info Sections */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Description</Text>
                <Text style={styles.body}>{tune.description}</Text>
            </View>

            <View style={styles.section}>
                <View style={styles.row}>
                    <Ionicons name="information-circle-outline" size={20} color={Theme.Colors.primary} />
                    <Text style={styles.sectionTitle}>Requirements</Text>
                </View>
                <View style={styles.bulletList}>
                    <Text style={styles.bulletItem}>• Octane: {tune.octaneRequired}+</Text>
                    {tune.modificationsRequired?.map((mod, i) => (
                        <Text key={i} style={styles.bulletItem}>• {mod}</Text>
                    ))}
                </View>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Parameters</Text>
                <Text style={styles.body}>Safety Rating: {tune.safetyRating}/100</Text>
                <Text style={styles.body}>Version: {tune.version}</Text>
            </View>

            {/* Actions */}
            <View style={styles.footer}>
                <PrimaryButton
                    title="Validate & Flash"
                    onPress={() => navigation.navigate('TuneValidation', { tuneId: tune.id })}
                    disabled={!isCompatible}
                    style={{ marginBottom: Theme.Spacing.md }}
                />
            </View>
        </Screen>
    );
};

const styles = StyleSheet.create({
    header: {
        padding: Theme.Spacing.md,
    },
    name: {
        ...Theme.Typography.h2,
        marginBottom: Theme.Spacing.sm,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Theme.Spacing.md,
    },
    badge: {
        backgroundColor: Theme.Colors.primary,
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
    },
    badgeText: {
        fontWeight: 'bold',
        color: '#000',
    },
    price: {
        ...Theme.Typography.h3,
        color: Theme.Colors.success,
    },
    compatibleCard: {
        borderColor: Theme.Colors.success,
        borderWidth: 1,
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
    },
    incompatibleCard: {
        borderColor: Theme.Colors.error,
        borderWidth: 1,
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
    },
    compatibilityHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Theme.Spacing.sm,
        marginBottom: 4,
    },
    compatibilityTitle: {
        fontWeight: 'bold',
        color: Theme.Colors.text,
        fontSize: 16,
    },
    compatibilityReason: {
        color: Theme.Colors.text,
        fontSize: 14,
        marginTop: 4,
    },
    section: {
        padding: Theme.Spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: Theme.Colors.border,
    },
    sectionTitle: {
        ...Theme.Typography.h3,
        marginBottom: Theme.Spacing.sm,
    },
    body: {
        ...Theme.Typography.body,
        color: Theme.Colors.textSecondary,
    },
    bulletList: {
        marginTop: Theme.Spacing.sm,
    },
    bulletItem: {
        ...Theme.Typography.body,
        color: Theme.Colors.textSecondary,
        marginBottom: 4,
    },
    footer: {
        padding: Theme.Spacing.md,
        marginTop: Theme.Spacing.md,
    },
});
