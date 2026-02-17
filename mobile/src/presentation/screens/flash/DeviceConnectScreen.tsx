import React, { useEffect, useState, useCallback } from 'react';
import {
    View, Text, StyleSheet, FlatList, TouchableOpacity,
    Platform, Alert, ActivityIndicator, StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ServiceLocator } from '../../../di/ServiceLocator';
import { useAppStore } from '../../store/useAppStore';

// ── Design tokens ──
const C = {
    primary: '#ea103c',
    primaryGlow: 'rgba(225,29,72,0.40)',
    bg: '#1a1a1a',
    surface: '#2d2d2d',
    surfaceDark: '#262626',
    border: '#404040',
    neutral300: '#d4d4d4',
    neutral400: '#a3a3a3',
    neutral500: '#a3a3a3',
    neutral600: '#737373',
    neutral700: '#525252',
    white: '#ffffff',
    success: '#10B981',
    successGlow: 'rgba(16,185,129,0.3)',
    successBg: 'rgba(16,185,129,0.15)',
    blue400: '#60A5FA',
    blue500: '#3B82F6',
};

interface ScannedDevice {
    id: string;
    name: string | null;
    rssi: number | null;
}

// ── Signal Bars Component ──
const SignalBars = ({ rssi, connected }: { rssi: number | null; connected?: boolean }) => {
    const strength = rssi ? Math.min(4, Math.max(1, Math.ceil((100 + (rssi || -100)) / 25))) : 1;
    const activeColor = connected ? C.success : '#FB7185';
    return (
        <View style={signalStyles.container}>
            {[1, 2, 3, 4].map(i => (
                <View
                    key={i}
                    style={[
                        signalStyles.bar,
                        { height: 6 + i * 3 },
                        i <= strength
                            ? { backgroundColor: activeColor }
                            : { backgroundColor: C.neutral700 },
                    ]}
                />
            ))}
        </View>
    );
};

const signalStyles = StyleSheet.create({
    container: { flexDirection: 'row', alignItems: 'flex-end', gap: 2, height: 18 },
    bar: { width: 3, borderRadius: 1 },
});

// ════════════════════════════════════════════════════════════════════
export const DeviceConnectScreen = ({ navigation, route }: any) => {
    const { tuneId } = route.params || {};
    const { connect, isConnected, connectedDeviceId, disconnect } = useAppStore();
    const [devices, setDevices] = useState<ScannedDevice[]>([]);
    const [scanning, setScanning] = useState(false);
    const [connectingId, setConnectingId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const startScan = useCallback(async () => {
        setScanning(true);
        setError(null);
        setDevices([]);
        try {
            const service = ServiceLocator.getDeviceService();
            service.startScan((device: { id: string; name: string | null; rssi: number | null }) => {
                if (device.name) {
                    setDevices(prev => {
                        const exists = prev.find(d => d.id === device.id);
                        if (exists) return prev;
                        return [...prev, { id: device.id, name: device.name, rssi: device.rssi }];
                    });
                }
            });
            const timer = setTimeout(() => {
                service.stopScan();
                setScanning(false);
            }, 10000);
            return () => {
                clearTimeout(timer);
                service.stopScan();
            };
        } catch (e: any) {
            setError(e.message || 'Could not start scan');
            setScanning(false);
        }
    }, []);

    useEffect(() => {
        startScan();
        return () => {
            ServiceLocator.getDeviceService().stopScan();
        };
    }, []);

    const handleConnect = async (deviceId: string) => {
        setConnectingId(deviceId);
        setError(null);
        try {
            await connect(deviceId);
            if (tuneId) {
                navigation.navigate('ECUIdentify', { tuneId });
            } else {
                Alert.alert('Connected', 'Device connected successfully.');
                navigation.goBack();
            }
        } catch (e: any) {
            setError(e.message || 'Connection Failed');
            await disconnect();
        } finally {
            setConnectingId(null);
        }
    };

    const renderConnectedDevice = () => {
        if (!isConnected || !connectedDeviceId) return null;
        return (
            <View style={styles.sectionBlock}>
                <Text style={styles.sectionLabel}>Connected Device</Text>
                <View style={[styles.deviceCard, styles.connectedCard]}>
                    <View style={styles.deviceRow}>
                        <View style={[styles.deviceIconCircle, { backgroundColor: C.successBg, borderColor: 'rgba(16,185,129,0.2)' }]}>
                            <Ionicons name="link" size={22} color={C.success} />
                        </View>
                        <View style={styles.deviceInfo}>
                            <Text style={styles.deviceName}>RevSync Dongle v2</Text>
                            <View style={styles.connectedBadgeRow}>
                                <View style={styles.connectedDot} />
                                <Text style={styles.connectedText}>Connected</Text>
                            </View>
                        </View>
                        <SignalBars rssi={-30} connected />
                    </View>
                </View>
            </View>
        );
    };

    const renderItem = ({ item }: { item: ScannedDevice }) => (
        <TouchableOpacity
            style={styles.deviceCard}
            onPress={() => handleConnect(item.id)}
            disabled={!!connectingId}
            activeOpacity={0.7}
        >
            <View style={styles.deviceRow}>
                <View style={styles.deviceIconCircle}>
                    <Ionicons name="bluetooth" size={22} color={C.neutral500} />
                </View>
                <View style={styles.deviceInfo}>
                    <Text style={styles.deviceName}>{item.name || 'Unknown Device'}</Text>
                    <Text style={styles.deviceMac}>
                        MAC: {item.id.substring(0, 14).toUpperCase()}
                    </Text>
                </View>
                <View style={styles.deviceRight}>
                    {connectingId === item.id ? (
                        <ActivityIndicator size="small" color={C.primary} />
                    ) : (
                        <>
                            <SignalBars rssi={item.rssi} />
                            <Text style={styles.rssiText}>{item.rssi} dBm</Text>
                        </>
                    )}
                </View>
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={styles.root}>
            <StatusBar barStyle="light-content" />

            {/* ─── Header ─── */}
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backBtn}
                    onPress={() => navigation.goBack()}
                >
                    <Ionicons name="arrow-back" size={24} color={C.neutral400} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Connect Device</Text>
            </View>

            <FlatList
                data={devices}
                renderItem={renderItem}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                ListHeaderComponent={
                    <>
                        {/* Bluetooth info card */}
                        <View style={styles.infoCard}>
                            <Ionicons name="bluetooth" size={20} color={C.blue400} />
                            <View style={styles.infoContent}>
                                <Text style={styles.infoTitle}>Bluetooth Access Required</Text>
                                <Text style={styles.infoBody}>
                                    RevSync needs Bluetooth access to communicate with your ECU. Ensure your device is in pairing mode.
                                </Text>
                            </View>
                        </View>

                        {/* Connected device */}
                        {renderConnectedDevice()}

                        {/* Error banner */}
                        {error && (
                            <View style={styles.errorCard}>
                                <Ionicons name="warning" size={18} color="#EF4444" />
                                <Text style={styles.errorText}>{error}</Text>
                                <TouchableOpacity onPress={startScan}>
                                    <Text style={styles.retryText}>Retry</Text>
                                </TouchableOpacity>
                            </View>
                        )}

                        {/* Available section header */}
                        <View style={styles.availableHeader}>
                            <Text style={styles.sectionLabel}>Available Devices</Text>
                            {scanning && (
                                <View style={styles.scanningBadge}>
                                    <View style={styles.pulsingDot} />
                                    <Text style={styles.scanningText}>Scanning...</Text>
                                </View>
                            )}
                        </View>
                    </>
                }
                ListEmptyComponent={
                    !scanning ? (
                        <View style={styles.emptyState}>
                            <Ionicons name="bluetooth-outline" size={48} color={C.neutral600} />
                            <Text style={styles.emptyTitle}>No Devices Found</Text>
                            <Text style={styles.emptyBody}>
                                Make sure your OBD adapter is plugged in and the ignition is ON.
                            </Text>
                            <TouchableOpacity style={styles.retryBtn} onPress={startScan}>
                                <Text style={styles.retryBtnText}>Retry Scan</Text>
                            </TouchableOpacity>
                        </View>
                    ) : null
                }
            />

            {/* ─── Bottom bar ─── */}
            <View style={styles.bottomBar}>
                <View style={styles.secureRow}>
                    <Ionicons name="shield-checkmark-outline" size={14} color={C.neutral500} />
                    <Text style={styles.secureText}>Secure 128-bit Encrypted Connection</Text>
                </View>
                <TouchableOpacity
                    style={[styles.continueBtn, !isConnected && { opacity: 0.4 }]}
                    activeOpacity={0.85}
                    disabled={!isConnected}
                    onPress={() => {
                        if (tuneId) navigation.navigate('ECUIdentify', { tuneId });
                        else navigation.goBack();
                    }}
                >
                    <Text style={styles.continueBtnText}>Continue to Flashing</Text>
                    <Ionicons name="arrow-forward" size={20} color={C.white} />
                </TouchableOpacity>
            </View>
        </View>
    );
};

// ════════════════════════════════════════════════════════════════════
const styles = StyleSheet.create({
    root: {
        flex: 1,
        backgroundColor: C.bg,
    },

    // ── Header ──
    header: {
        paddingTop: Platform.OS === 'ios' ? 60 : 44,
        paddingBottom: 20,
        paddingHorizontal: 24,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
        backgroundColor: 'rgba(26,26,26,0.95)',
    },
    backBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: C.surfaceDark,
        borderWidth: 1,
        borderColor: C.border,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: '800',
        color: C.white,
        letterSpacing: -0.3,
    },

    listContent: {
        paddingHorizontal: 16,
        paddingTop: 8,
        paddingBottom: 180,
    },

    // ── Info Card ──
    infoCard: {
        flexDirection: 'row',
        gap: 12,
        alignItems: 'flex-start',
        backgroundColor: 'rgba(59,130,246,0.10)',
        borderWidth: 1,
        borderColor: 'rgba(59,130,246,0.20)',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
    },
    infoContent: {
        flex: 1,
    },
    infoTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#93C5FD',
        marginBottom: 4,
    },
    infoBody: {
        fontSize: 12,
        color: 'rgba(147,197,253,0.7)',
        lineHeight: 18,
    },

    // ── Section ──
    sectionBlock: {
        marginBottom: 16,
    },
    sectionLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: C.neutral500,
        textTransform: 'uppercase',
        letterSpacing: 0.8,
        marginBottom: 12,
        marginLeft: 4,
    },

    // ── Device Cards ──
    deviceCard: {
        backgroundColor: C.surface,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: C.border,
        marginBottom: 12,
        overflow: 'hidden',
    },
    connectedCard: {
        borderColor: 'rgba(16,185,129,0.40)',
        // glow
        shadowColor: C.success,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.3,
        shadowRadius: 15,
        elevation: 4,
    },
    deviceRow: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
    },
    deviceIconCircle: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: C.surfaceDark,
        borderWidth: 1,
        borderColor: C.border,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    deviceInfo: {
        flex: 1,
    },
    deviceName: {
        fontSize: 16,
        fontWeight: '700',
        color: C.white,
    },
    deviceMac: {
        fontSize: 12,
        color: C.neutral500,
        fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
        marginTop: 2,
    },
    deviceRight: {
        alignItems: 'flex-end',
        gap: 4,
    },
    rssiText: {
        fontSize: 10,
        color: C.neutral600,
        fontWeight: '500',
    },

    // ── Connected badge ──
    connectedBadgeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginTop: 4,
    },
    connectedDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: C.success,
    },
    connectedText: {
        fontSize: 12,
        color: C.success,
        fontWeight: '500',
    },

    // ── Available header ──
    availableHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        paddingHorizontal: 4,
        marginBottom: 12,
        marginTop: 8,
    },
    scanningBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    pulsingDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: C.primary,
    },
    scanningText: {
        fontSize: 12,
        color: C.primary,
        fontWeight: '500',
    },

    // ── Error ──
    errorCard: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: 'rgba(239,68,68,0.1)',
        borderWidth: 1,
        borderColor: 'rgba(239,68,68,0.2)',
        borderRadius: 12,
        padding: 12,
        marginBottom: 16,
    },
    errorText: {
        flex: 1,
        fontSize: 13,
        color: '#FCA5A5',
    },
    retryText: {
        fontSize: 13,
        fontWeight: '700',
        color: '#EF4444',
    },

    // ── Empty State ──
    emptyState: {
        alignItems: 'center',
        paddingVertical: 40,
        gap: 8,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: C.neutral300,
        marginTop: 8,
    },
    emptyBody: {
        fontSize: 14,
        color: C.neutral500,
        textAlign: 'center',
        paddingHorizontal: 20,
        lineHeight: 20,
    },
    retryBtn: {
        marginTop: 12,
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: C.primary,
    },
    retryBtnText: {
        fontSize: 14,
        fontWeight: '700',
        color: C.primary,
    },

    // ── Bottom Bar ──
    bottomBar: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'rgba(26,26,26,0.95)',
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.10)',
        padding: 24,
        paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    },
    secureRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        marginBottom: 12,
    },
    secureText: {
        fontSize: 12,
        color: C.neutral500,
    },
    continueBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: C.primary,
        paddingVertical: 16,
        borderRadius: 12,
        // glow
        shadowColor: C.primary,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.4,
        shadowRadius: 15,
        elevation: 6,
    },
    continueBtnText: {
        fontSize: 16,
        fontWeight: '700',
        color: C.white,
    },
});
