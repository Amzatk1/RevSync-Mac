import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppScreen, GlassCard, TopBar } from '../../components/AppUI';
import { Theme } from '../../theme';
import { useAppStore } from '../../store/useAppStore';

const { Colors, Layout, Typography } = Theme;

interface GaugeData {
    label: string;
    value: number;
    max: number;
    unit: string;
    color: string;
    icon: keyof typeof Ionicons.glyphMap;
}

export const TelemetryScreen = ({ navigation }: any) => {
    const { isConnected, connectedDeviceId } = useAppStore();
    const [gauges, setGauges] = useState<GaugeData[]>([
        { label: 'RPM', value: 0, max: 14000, unit: 'rpm', color: Colors.primary, icon: 'speedometer-outline' },
        { label: 'Coolant', value: 0, max: 120, unit: '°C', color: Colors.info, icon: 'thermometer-outline' },
        { label: 'Battery', value: 0, max: 16, unit: 'V', color: Colors.success, icon: 'battery-half-outline' },
        { label: 'Throttle', value: 0, max: 100, unit: '%', color: Colors.warning, icon: 'radio-button-on-outline' },
    ]);
    const pulse = useRef(new Animated.Value(0.4)).current;
    const telemetryMode = !isConnected
        ? 'offline'
        : __DEV__
            ? 'simulated'
            : 'connected';

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulse, { toValue: 1, duration: 1400, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
                Animated.timing(pulse, { toValue: 0.4, duration: 1400, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
            ]),
        ).start();
    }, [pulse]);

    useEffect(() => {
        if (telemetryMode === 'simulated') {
            const interval = setInterval(() => {
                setGauges((prev) =>
                    prev.map((gauge) => ({
                        ...gauge,
                        value:
                            gauge.label === 'RPM'
                                ? Math.round(3000 + Math.random() * 5000)
                                : gauge.label === 'Coolant'
                                  ? Math.round(75 + Math.random() * 20)
                                  : gauge.label === 'Battery'
                                    ? parseFloat((12.5 + Math.random() * 1.5).toFixed(1))
                                    : Math.round(15 + Math.random() * 50),
                    })),
                );
            }, 500);
            return () => clearInterval(interval);
        }
        setGauges((prev) => prev.map((gauge) => ({ ...gauge, value: 0 })));
    }, [telemetryMode]);

    const subtitle =
        telemetryMode === 'simulated'
            ? 'Simulated ECU readings for the connected development device'
            : telemetryMode === 'connected'
                ? 'Device connected. Live telemetry streaming is not available in this build.'
                : 'Connect a device to start telemetry.';

    const badgeLabel =
        telemetryMode === 'simulated'
            ? 'SIMULATED'
            : telemetryMode === 'connected'
                ? 'CONNECTED'
                : 'OFFLINE';

    const badgeColor =
        telemetryMode === 'offline'
            ? Colors.textTertiary
            : telemetryMode === 'simulated'
                ? Colors.warning
                : Colors.info;

    return (
        <AppScreen scroll contentContainerStyle={styles.content}>
            <TopBar
                title="Telemetry"
                subtitle={subtitle}
                onBack={() => navigation.goBack()}
                right={
                    <View style={[styles.liveBadge, { backgroundColor: telemetryMode === 'offline' ? 'rgba(255,255,255,0.04)' : `${badgeColor}20` }]}>
                        <Animated.View style={[styles.liveDot, { backgroundColor: badgeColor, opacity: pulse }]} />
                        <Text style={[styles.liveText, { color: badgeColor }]}>{badgeLabel}</Text>
                    </View>
                }
            />

            {telemetryMode !== 'simulated' && (
                <GlassCard style={styles.noticeCard}>
                    <Ionicons
                        name={telemetryMode === 'connected' ? 'information-circle-outline' : 'hardware-chip-outline'}
                        size={18}
                        color={telemetryMode === 'connected' ? Colors.info : Colors.warning}
                    />
                    <Text style={styles.noticeText}>
                        {telemetryMode === 'connected'
                            ? 'The ECU device is connected, but this build does not expose real sensor streaming yet. Use identification, backup, flash, and verification workflows for persisted operational state.'
                            : 'No ECU device is connected. Telemetry remains unavailable until a RevSync device session is active.'}
                    </Text>
                </GlassCard>
            )}

            <View style={styles.grid}>
                {gauges.map((gauge) => {
                    const pct = Math.min(gauge.value / gauge.max, 1);
                    return (
                        <GlassCard key={gauge.label} style={styles.gaugeCard}>
                            <View style={styles.gaugeHeader}>
                                <View style={[styles.gaugeIcon, { backgroundColor: `${gauge.color}15` }]}>
                                    <Ionicons name={gauge.icon} size={18} color={gauge.color} />
                                </View>
                                <Text style={styles.gaugeLabel}>{gauge.label}</Text>
                            </View>
                            <Text style={[styles.gaugeValue, { color: gauge.color }]}>
                                {gauge.value}
                                <Text style={styles.gaugeUnit}> {gauge.unit}</Text>
                            </Text>
                            <View style={styles.track}>
                                <View style={[styles.fill, { width: `${pct * 100}%`, backgroundColor: gauge.color }]} />
                            </View>
                        </GlassCard>
                    );
                })}
            </View>

            <GlassCard style={styles.statusCard}>
                <Text style={styles.sectionLabel}>Connection State</Text>
                <StatusRow label="Session" value={connectedDeviceId ? connectedDeviceId : 'No device session'} />
                <StatusRow label="ECU Mode" value={isConnected ? 'Connected' : 'Disconnected'} />
                <StatusRow label="Telemetry Source" value={telemetryMode === 'simulated' ? 'Dev simulator' : telemetryMode === 'connected' ? 'Not implemented in this build' : 'Unavailable'} />
            </GlassCard>

            {!isConnected && (
                <TouchableOpacity style={styles.primaryButton} onPress={() => navigation.navigate('DeviceConnect')}>
                    <Text style={styles.primaryButtonText}>Connect ECU</Text>
                </TouchableOpacity>
            )}
        </AppScreen>
    );
};

const StatusRow = ({ label, value }: { label: string; value: string }) => (
    <View style={styles.statusRow}>
        <Text style={styles.statusLabel}>{label}</Text>
        <Text style={styles.statusValue}>{value}</Text>
    </View>
);

const styles = StyleSheet.create({
    content: {
        paddingBottom: 120,
    },
    liveBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: Colors.strokeSoft,
    },
    liveDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
    },
    liveText: {
        fontSize: 10,
        fontWeight: '800',
        letterSpacing: 0.8,
    },
    noticeCard: {
        marginTop: 10,
        flexDirection: 'row',
        gap: 10,
        alignItems: 'flex-start',
    },
    noticeText: {
        flex: 1,
        fontSize: 12,
        lineHeight: 18,
        color: Colors.textSecondary,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
        marginTop: 8,
    },
    gaugeCard: {
        width: '48%',
        minWidth: 160,
    },
    gaugeHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 10,
    },
    gaugeIcon: {
        width: 32,
        height: 32,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    gaugeLabel: {
        fontSize: 13,
        fontWeight: '700',
        color: Colors.textSecondary,
    },
    gaugeValue: {
        fontSize: 30,
        fontWeight: '800',
        letterSpacing: -1,
    },
    gaugeUnit: {
        fontSize: 13,
        fontWeight: '600',
        color: Colors.textSecondary,
    },
    track: {
        height: 6,
        borderRadius: 999,
        backgroundColor: 'rgba(255,255,255,0.08)',
        overflow: 'hidden',
        marginTop: 10,
    },
    fill: {
        height: '100%',
        borderRadius: 999,
    },
    statusCard: {
        marginTop: 12,
    },
    sectionLabel: {
        ...Typography.dataLabel,
        marginBottom: 10,
    },
    statusRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: Colors.divider,
    },
    statusLabel: {
        fontSize: 14,
        color: Colors.textSecondary,
    },
    statusValue: {
        fontSize: 14,
        fontWeight: '700',
        color: Colors.textPrimary,
    },
    primaryButton: {
        minHeight: 50,
        borderRadius: Layout.buttonRadius,
        backgroundColor: Colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 14,
    },
    primaryButtonText: {
        fontSize: 15,
        fontWeight: '800',
        color: Colors.white,
    },
});
