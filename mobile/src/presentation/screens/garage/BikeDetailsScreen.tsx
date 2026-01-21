import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Theme } from '../../theme';
import { Screen, PrimaryButton, SecondaryButton, Card, LoadingOverlay, ErrorBanner } from '../../components/SharedComponents';
import { Ionicons } from '@expo/vector-icons';
import { ServiceLocator } from '../../../di/ServiceLocator';
import { Bike } from '../../../domain/services/DomainTypes';
import { useAppStore } from '../../store/useAppStore';

export const BikeDetailsScreen = ({ route, navigation }: any) => {
    const { bikeId } = route.params;
    const { activeBike, loadActiveBike } = useAppStore();
    const [bike, setBike] = useState<Bike | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadBike();
    }, [bikeId]);

    const loadBike = async () => {
        setLoading(true);
        try {
            const bikeService = ServiceLocator.getBikeService();
            const list = await bikeService.getBikes(); // In real app getBikeById
            const found = list.find(b => b.id === bikeId) || null;
            setBike(found);

            // Auto refresh active bike status if we are viewing the active bike
            if (activeBike?.id === bikeId) {
                await loadActiveBike();
            }
        } catch (e: any) {
            setError(e.message || 'Failed to load bike');
        } finally {
            setLoading(false);
        }
    };

    const handleSetActive = async () => {
        if (!bike) return;
        setLoading(true);
        try {
            await ServiceLocator.getBikeService().setActiveBike(bike.id);
            await loadActiveBike();
            // Refresh local state to show updated badge
            await loadBike();
        } catch (e) {
            // ignore
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <LoadingOverlay visible={true} />;

    if (error || !bike) {
        return (
            <Screen center>
                <ErrorBanner message={error || 'Bike not found'} />
            </Screen>
        );
    }

    const isActive = activeBike?.id === bike.id;
    const hasEcu = !!bike.ecuId;

    return (
        <Screen scroll>
            <View style={styles.header}>
                <View>
                    <Text style={styles.title}>{bike.year} {bike.make} {bike.model}</Text>
                    {isActive ? (
                        <View style={styles.activeBadge}>
                            <Text style={styles.activeText}>CURRENTLY ACTIVE</Text>
                        </View>
                    ) : (
                        <SecondaryButton
                            title="Set Active"
                            onPress={handleSetActive}
                            style={styles.activateBtn}
                        />
                    )}
                </View>
            </View>

            {/* ECU Section */}
            <Card style={styles.ecuContainer}>
                <View style={styles.sectionHeader}>
                    <Ionicons name="hardware-chip-outline" size={24} color={Theme.Colors.primary} />
                    <Text style={styles.sectionTitle}>ECU Information</Text>
                </View>

                {hasEcu ? (
                    <View style={styles.ecuDetails}>
                        <View style={styles.row}>
                            <Text style={styles.label}>ECU ID:</Text>
                            <Text style={styles.value}>{bike.ecuId}</Text>
                        </View>
                        <View style={styles.row}>
                            <Text style={styles.label}>Identifier:</Text>
                            <Text style={styles.value}>Full-Read-Required</Text>
                        </View>
                        <View style={styles.statusRow}>
                            <Ionicons name="checkmark-circle" size={16} color={Theme.Colors.success} />
                            <Text style={styles.successText}>Identification Complete</Text>
                        </View>
                    </View>
                ) : (
                    <View style={styles.noEcu}>
                        <Text style={styles.noEcuText}>
                            Your ECU has not been identified yet. We need to read identifiers to ensure tune compatibility.
                        </Text>
                        <PrimaryButton
                            title="Identify ECU"
                            onPress={() => navigation.navigate('Flash', { screen: 'ECUIdentify' })}
                            style={{ marginTop: 16 }}
                        />
                    </View>
                )}
            </Card>

            {/* Actions */}
            <View style={styles.actions}>
                <PrimaryButton
                    title="Browse Compatible Tunes"
                    onPress={() => {
                        // Navigate to tunes tab and should technically set filters
                        navigation.navigate('Tunes', {
                            screen: 'TuneMarketplace',
                            params: { filterBikeId: bike.id }
                        });
                    }}
                    icon="search"
                    style={{ marginBottom: 12 }}
                />

                <SecondaryButton
                    title="View Flash History"
                    onPress={() => { }}
                    icon="time-outline"
                    disabled={true} // Implementation later
                />
            </View>

            {bike.vin && (
                <View style={styles.footerInfo}>
                    <Text style={styles.footerLabel}>VIN</Text>
                    <Text style={styles.footerValue}>{bike.vin}</Text>
                </View>
            )}
        </Screen>
    );
};

const styles = StyleSheet.create({
    header: {
        padding: Theme.Spacing.md,
        marginBottom: Theme.Spacing.sm,
    },
    title: {
        ...Theme.Typography.h1,
        marginBottom: 8,
    },
    activeBadge: {
        backgroundColor: Theme.Colors.primary,
        alignSelf: 'flex-start',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 4,
    },
    activeText: {
        fontWeight: 'bold',
        color: '#000',
        fontSize: 12,
    },
    activateBtn: {
        alignSelf: 'flex-start',
        paddingVertical: 8,
        paddingHorizontal: 16,
    },
    ecuContainer: {
        marginHorizontal: 0,
        borderLeftWidth: 0, borderRightWidth: 0, borderRadius: 0, // Full width look optionally? OR keep card
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 16,
    },
    sectionTitle: {
        ...Theme.Typography.h3,
    },
    ecuDetails: {
        gap: 8,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 4,
        borderBottomWidth: 1,
        borderBottomColor: Theme.Colors.border,
    },
    label: {
        color: Theme.Colors.textSecondary,
    },
    value: {
        color: Theme.Colors.text,
        fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
        fontWeight: '600',
    },
    statusRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginTop: 8,
    },
    successText: {
        color: Theme.Colors.success,
        fontSize: 14,
    },
    noEcu: {
        alignItems: 'center',
        padding: 8,
    },
    noEcuText: {
        textAlign: 'center',
        color: Theme.Colors.textSecondary,
        lineHeight: 20,
    },
    actions: {
        padding: Theme.Spacing.md,
    },
    footerInfo: {
        padding: Theme.Spacing.md,
        alignItems: 'center',
    },
    footerLabel: {
        fontSize: 12,
        color: Theme.Colors.textSecondary,
    },
    footerValue: {
        fontSize: 14,
        color: Theme.Colors.text,
        fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    },
});

import { Platform } from 'react-native';
