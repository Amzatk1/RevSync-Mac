import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ServiceLocator } from '../../../di/ServiceLocator';
import { AppScreen, GlassCard, TopBar } from '../../components/AppUI';
import { Theme } from '../../theme';

const { Colors, Layout, Typography } = Theme;

export const BikeDetailsScreen = ({ navigation, route }: any) => {
    const { bikeId } = route.params;
    const [bike, setBike] = useState<any>(null);

    React.useEffect(() => {
        const load = async () => {
            const bikeService = ServiceLocator.getBikeService();
            const all = await bikeService.getBikes();
            const found = all.find((entry) => entry.id === bikeId);
            setBike(found);

            if (found) {
                ServiceLocator.getAnalyticsService().logEvent('bike_details_viewed', {
                    bikeId: found.id,
                    make: found.make,
                    model: found.model,
                });
            }
        };
        load();
    }, [bikeId]);

    if (!bike) {
        return (
            <AppScreen contentContainerStyle={styles.loadingScreen}>
                <Text style={styles.loadingText}>Loading bike details...</Text>
            </AppScreen>
        );
    }

    return (
        <AppScreen scroll contentContainerStyle={styles.content}>
            <TopBar title="Bike Details" subtitle={`${bike.year} ${bike.make} ${bike.model}`} onBack={() => navigation.goBack()} />

            <GlassCard style={styles.heroCard}>
                <View style={styles.heroIcon}>
                    <Ionicons name="bicycle" size={32} color={Colors.primary} />
                </View>
                <Text style={styles.heroTitle}>
                    {bike.year} {bike.make} {bike.model}
                </Text>
                <Text style={styles.heroSub}>{bike.name || 'Vehicle profile'}</Text>
            </GlassCard>

            <GlassCard style={styles.detailsCard}>
                <Text style={styles.sectionLabel}>Specifications</Text>
                <DetailRow icon="barcode-outline" iconColor={Colors.info} label="VIN" value={bike.vin || 'Not set'} />
                <DetailRow icon="hardware-chip-outline" iconColor="#9B8CFF" label="ECU ID" value={bike.ecuId || 'Not linked'} />
                <DetailRow icon="calendar-outline" iconColor={Colors.warning} label="Year" value={String(bike.year)} />
                <DetailRow icon="flash-outline" iconColor={Colors.primary} label="Last Flash" value="No recorded flash session" />
            </GlassCard>

            <GlassCard>
                <Text style={styles.sectionLabel}>Actions</Text>
                <TouchableOpacity
                    style={styles.primaryButton}
                    onPress={() => {
                        ServiceLocator.getAnalyticsService().logEvent('ecu_identify_initiated', { bikeId: bike.id });
                        navigation.navigate('Flash', {
                            screen: 'ECUIdentify',
                            params: { bikeId: bike.id },
                        });
                    }}
                >
                    <Ionicons name="scan-outline" size={18} color={Colors.white} />
                    <Text style={styles.primaryButtonText}>Identify ECU</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.secondaryButton}
                    onPress={() =>
                        navigation.navigate('Flash', {
                            screen: 'Backup',
                            params: { bikeId: bike.id },
                        })
                    }
                >
                    <Ionicons name="cloud-download-outline" size={18} color={Colors.textPrimary} />
                    <Text style={styles.secondaryButtonText}>Open Backups</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.secondaryButton} onPress={() => navigation.navigate('Flash', { screen: 'Telemetry' })}>
                    <Ionicons name="pulse-outline" size={18} color={Colors.textPrimary} />
                    <Text style={styles.secondaryButtonText}>Live Telemetry</Text>
                </TouchableOpacity>
            </GlassCard>
        </AppScreen>
    );
};

const DetailRow = ({
    icon,
    iconColor,
    label,
    value,
}: {
    icon: string;
    iconColor: string;
    label: string;
    value: string;
}) => (
    <View style={styles.detailRow}>
        <View style={[styles.detailIcon, { backgroundColor: `${iconColor}15` }]}>
            <Ionicons name={icon as any} size={18} color={iconColor} />
        </View>
        <View style={styles.detailCopy}>
            <Text style={styles.detailLabel}>{label}</Text>
            <Text style={styles.detailValue}>{value}</Text>
        </View>
    </View>
);

const styles = StyleSheet.create({
    content: {
        paddingBottom: 120,
    },
    loadingScreen: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    loadingText: {
        fontSize: 15,
        color: Colors.textSecondary,
    },
    heroCard: {
        marginTop: 8,
        alignItems: 'center',
        paddingVertical: 24,
    },
    heroIcon: {
        width: 72,
        height: 72,
        borderRadius: 24,
        backgroundColor: 'rgba(234,16,60,0.10)',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 14,
    },
    heroTitle: {
        ...Typography.h2,
        textAlign: 'center',
    },
    heroSub: {
        ...Typography.caption,
        marginTop: 6,
        textAlign: 'center',
    },
    detailsCard: {
        marginTop: 12,
    },
    sectionLabel: {
        ...Typography.dataLabel,
        marginBottom: 10,
    },
    detailRow: {
        flexDirection: 'row',
        gap: 12,
        alignItems: 'flex-start',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: Colors.divider,
    },
    detailIcon: {
        width: 34,
        height: 34,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    detailCopy: {
        flex: 1,
    },
    detailLabel: {
        ...Typography.dataLabel,
        marginBottom: 6,
    },
    detailValue: {
        fontSize: 14,
        lineHeight: 20,
        fontWeight: '600',
        color: Colors.textPrimary,
    },
    primaryButton: {
        minHeight: 50,
        borderRadius: Layout.buttonRadius,
        backgroundColor: Colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        gap: 8,
        marginBottom: 10,
    },
    primaryButtonText: {
        fontSize: 15,
        fontWeight: '800',
        color: Colors.white,
    },
    secondaryButton: {
        minHeight: 48,
        borderRadius: Layout.buttonRadius,
        borderWidth: 1,
        borderColor: Colors.strokeSoft,
        backgroundColor: 'rgba(255,255,255,0.03)',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        gap: 8,
        marginTop: 10,
    },
    secondaryButtonText: {
        fontSize: 14,
        fontWeight: '700',
        color: Colors.textPrimary,
    },
});
