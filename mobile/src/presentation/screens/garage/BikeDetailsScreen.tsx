import React, { useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ServiceLocator } from '../../../di/ServiceLocator';
import { AppScreen, GlassCard, TopBar } from '../../components/AppUI';
import { Theme } from '../../theme';
import { garageService } from '../../../services/garageService';

const { Colors, Layout, Typography } = Theme;

export const BikeDetailsScreen = ({ navigation, route }: any) => {
    const { bikeId } = route.params;
    const [bike, setBike] = useState<any>(null);
    const [flashJobs, setFlashJobs] = useState<any[]>([]);
    const [backups, setBackups] = useState<any[]>([]);
    const [loadingHistory, setLoadingHistory] = useState(true);

    React.useEffect(() => {
        const load = async () => {
            const bikeService = ServiceLocator.getBikeService();
            const all = await bikeService.getBikes();
            const found = all.find((entry) => entry.id === bikeId);
            setBike(found);

            if (found) {
                try {
                    const [vehicleFlashJobs, vehicleBackups] = await Promise.all([
                        garageService.getVehicleFlashJobs(found.id),
                        garageService.getVehicleBackups(found.id),
                    ]);
                    setFlashJobs(vehicleFlashJobs);
                    setBackups(vehicleBackups);
                } catch (e) {
                    console.warn('BikeDetails: failed to load vehicle history', e);
                    setFlashJobs([]);
                    setBackups([]);
                } finally {
                    setLoadingHistory(false);
                }
            } else {
                setLoadingHistory(false);
            }

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

    const lastFlashJob = flashJobs[0];
    const lastFlashLabel = !lastFlashJob
        ? 'No recorded flash session'
        : `${lastFlashJob.status.replace('_', ' ')} • ${formatRelativeDate(lastFlashJob.created_at)}`;

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
                <DetailRow icon="flash-outline" iconColor={Colors.primary} label="Last Flash" value={lastFlashLabel} />
            </GlassCard>

            <GlassCard style={styles.summaryCard}>
                <View style={styles.summaryItem}>
                    <Text style={styles.summaryValue}>{flashJobs.length}</Text>
                    <Text style={styles.summaryLabel}>Flash Jobs</Text>
                </View>
                <View style={styles.summaryDivider} />
                <View style={styles.summaryItem}>
                    <Text style={styles.summaryValue}>{backups.length}</Text>
                    <Text style={styles.summaryLabel}>Backups</Text>
                </View>
                <View style={styles.summaryDivider} />
                <View style={styles.summaryItem}>
                    <Text style={styles.summaryValue}>
                        {backups[0]?.file_size_kb ? `${backups[0].file_size_kb}KB` : 'None'}
                    </Text>
                    <Text style={styles.summaryLabel}>Latest Backup</Text>
                </View>
            </GlassCard>

            <GlassCard>
                <Text style={styles.sectionLabel}>Recent Activity</Text>
                {loadingHistory ? (
                    <View style={styles.inlineLoading}>
                        <ActivityIndicator size="small" color={Colors.primary} />
                        <Text style={styles.inlineLoadingText}>Loading flash and backup records...</Text>
                    </View>
                ) : flashJobs.length === 0 && backups.length === 0 ? (
                    <Text style={styles.emptyStateText}>No flash jobs or backups recorded for this bike yet.</Text>
                ) : (
                    <>
                        {lastFlashJob && (
                            <ActivityRow
                                icon="flash"
                                tone={statusTone(lastFlashJob.status)}
                                title={lastFlashJob.tune_detail?.title || lastFlashJob.tune_detail?.name || 'Flash session'}
                                subtitle={`${lastFlashJob.status.replaceAll('_', ' ')} • ${formatRelativeDate(lastFlashJob.created_at)}`}
                            />
                        )}
                        {backups[0] && (
                            <ActivityRow
                                icon="save-outline"
                                tone={Colors.success}
                                title={`Backup #${backups[0].id}`}
                                subtitle={`${backups[0].file_size_kb} KB • ${formatRelativeDate(backups[0].created_at)}`}
                            />
                        )}
                    </>
                )}
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
                    <Text style={styles.secondaryButtonText}>Create Backup</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.secondaryButton}
                    onPress={() =>
                        navigation.navigate('Flash', {
                            screen: 'FlashHistory',
                            params: {
                                bikeId: bike.id,
                                bikeLabel: `${bike.year} ${bike.make} ${bike.model}`,
                            },
                        })
                    }
                >
                    <Ionicons name="time-outline" size={18} color={Colors.textPrimary} />
                    <Text style={styles.secondaryButtonText}>View Flash History</Text>
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

const ActivityRow = ({
    icon,
    tone,
    title,
    subtitle,
}: {
    icon: string;
    tone: string;
    title: string;
    subtitle: string;
}) => (
    <View style={styles.activityRow}>
        <View style={[styles.activityIcon, { backgroundColor: `${tone}18` }]}>
            <Ionicons name={icon as any} size={16} color={tone} />
        </View>
        <View style={styles.activityCopy}>
            <Text style={styles.activityTitle}>{title}</Text>
            <Text style={styles.activitySubtitle}>{subtitle}</Text>
        </View>
    </View>
);

function formatRelativeDate(iso?: string): string {
    if (!iso) return 'Unknown time';
    const date = new Date(iso);
    const delta = Date.now() - date.getTime();
    if (delta < 3_600_000) return `${Math.max(1, Math.floor(delta / 60_000))}m ago`;
    if (delta < 86_400_000) return `${Math.floor(delta / 3_600_000)}h ago`;
    if (delta < 604_800_000) return `${Math.floor(delta / 86_400_000)}d ago`;
    return date.toLocaleDateString();
}

function statusTone(status?: string): string {
    switch (status) {
        case 'COMPLETED':
            return Colors.success;
        case 'FAILED':
        case 'ABORTED':
            return Colors.error;
        case 'RECOVERING':
        case 'FLASHING':
        case 'VERIFYING':
            return Colors.warning;
        default:
            return Colors.info;
    }
}

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
    summaryCard: {
        marginTop: 12,
        flexDirection: 'row',
        alignItems: 'center',
    },
    summaryItem: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: 4,
    },
    summaryValue: {
        fontSize: 18,
        fontWeight: '800',
        color: Colors.textPrimary,
    },
    summaryLabel: {
        marginTop: 2,
        fontSize: 10,
        letterSpacing: 0.8,
        fontWeight: '700',
        textTransform: 'uppercase',
        color: Colors.textSecondary,
    },
    summaryDivider: {
        width: 1,
        height: 32,
        backgroundColor: Colors.divider,
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
    inlineLoading: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        paddingVertical: 12,
    },
    inlineLoadingText: {
        fontSize: 13,
        color: Colors.textSecondary,
    },
    emptyStateText: {
        fontSize: 13,
        lineHeight: 19,
        color: Colors.textSecondary,
    },
    activityRow: {
        flexDirection: 'row',
        gap: 12,
        alignItems: 'flex-start',
        paddingVertical: 10,
        borderTopWidth: 1,
        borderTopColor: Colors.divider,
    },
    activityIcon: {
        width: 34,
        height: 34,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    activityCopy: {
        flex: 1,
    },
    activityTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: Colors.textPrimary,
    },
    activitySubtitle: {
        marginTop: 4,
        fontSize: 12,
        lineHeight: 18,
        color: Colors.textSecondary,
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
