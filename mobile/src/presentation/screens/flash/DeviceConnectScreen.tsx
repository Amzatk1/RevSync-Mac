import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Platform, Alert, ActivityIndicator } from 'react-native';
import { Theme } from '../../theme';
import { Screen, PrimaryButton, SecondaryButton, LoadingOverlay, Card, ErrorBanner, EmptyState } from '../../components/SharedComponents';
import { Ionicons } from '@expo/vector-icons';
import { ServiceLocator } from '../../../di/ServiceLocator';
import { useAppStore } from '../../store/useAppStore';
// using internal interface ScannedDevice

interface ScannedDevice {
    id: string;
    name: string | null;
    rssi: number | null;
}

export const DeviceConnectScreen = ({ navigation, route }: any) => {
    const { tuneId } = route.params || {}; // Context: if coming from Tune Validation
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

            // In a real app we need to handle permissions here first? 
            // BleDeviceService.scan() implementation should handle the actual scan logic.
            // We need to subscribe to the observable.

            // BleDeviceService.scan() implementation should handle the actual scan logic.
            // We need to subscribe to the observable.

            service.startScan((device: { id: string; name: string | null; rssi: number | null }) => {
                if (device.name) {
                    setDevices(prev => {
                        const exists = prev.find(d => d.id === device.id);
                        if (exists) return prev;
                        return [...prev, { id: device.id, name: device.name, rssi: device.rssi }];
                    });
                }
            });

            // Stop scanning after 10 seconds automatically
            // Store the timeout ID to clear it if unmounted
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
        const cleanup = startScan();
        return () => {
            // Cleanup provided by startScan's return if it was synchronous, 
            // but startScan is async.
            // Actually startScan defined above returns a Promise<void|cleanup>... 
            // no it is async () => void. 
            // Let's refactor startScan to NOT be the effect directly.
            ServiceLocator.getDeviceService().stopScan();
        };
    }, []);

    const handleConnect = async (deviceId: string) => {
        setConnectingId(deviceId);
        setError(null);
        try {
            await connect(deviceId);
            // If successful, navigate to next step
            // If we have a tuneId, we are in the Flash Flow -> Go to ECU Identify
            // If not, maybe just Garage or remain connected?
            if (tuneId) {
                navigation.navigate('ECUIdentify', { tuneId });
            } else {
                Alert.alert('Connected', 'Device connected successfully.');
                navigation.goBack();
            }
        } catch (e: any) {
            setError(e.message || 'Connection Failed');
            // Try to disconnect if stuck?
            await disconnect();
        } finally {
            setConnectingId(null);
        }
    };

    const renderItem = ({ item }: { item: ScannedDevice }) => (
        <TouchableOpacity onPress={() => handleConnect(item.id)} disabled={!!connectingId}>
            <View style={styles.deviceRow}>
                <View style={styles.deviceIcon}>
                    <Ionicons name="bluetooth" size={24} color={Theme.Colors.primary} />
                </View>
                <View style={styles.deviceInfo}>
                    <Text style={styles.deviceName}>{item.name || 'Unknown Device'}</Text>
                    <Text style={styles.deviceId}>{item.id}</Text>
                </View>
                <View>
                    <Text style={styles.rssi}>{item.rssi} dBm</Text>
                    {connectingId === item.id && <ActivityIndicator size="small" color={Theme.Colors.primary} />}
                </View>
            </View>
        </TouchableOpacity>
    );

    return (
        <Screen edges={['top']}>
            <View style={styles.header}>
                <Text style={styles.title}>Connect Device</Text>
                <Text style={styles.subtitle}>Select your OBD adapter to begin.</Text>
            </View>

            {error && <ErrorBanner message={error} onRetry={startScan} />}

            <View style={styles.scanStatus}>
                {scanning ? (
                    <View style={styles.scanningBadge}>
                        <ActivityIndicator size="small" color="#FFF" />
                        <Text style={styles.scanningText}>Scanning...</Text>
                    </View>
                ) : (
                    <SecondaryButton title="Scan Again" onPress={startScan} />
                )}
            </View>

            <FlatList
                data={devices}
                renderItem={renderItem}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.list}
                ListEmptyComponent={
                    !scanning ? (
                        <EmptyState
                            icon="bluetooth-outline"
                            title="No Devices Found"
                            message="Make sure your OBD adapter is plugged in and the ignition is ON."
                            action={{ label: 'Retry Scan', onPress: startScan }}
                        />
                    ) : null
                }
            />

            {connectingId && <LoadingOverlay visible={true} message="Connecting..." />}
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
    subtitle: {
        color: Theme.Colors.textSecondary,
        marginTop: 4,
    },
    scanStatus: {
        paddingHorizontal: Theme.Spacing.md,
        marginBottom: Theme.Spacing.sm,
        flexDirection: 'row',
        justifyContent: 'flex-end',
    },
    scanningBadge: {
        flexDirection: 'row',
        backgroundColor: Theme.Colors.primary,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        gap: 8,
        alignItems: 'center',
    },
    scanningText: {
        color: '#000',
        fontWeight: 'bold',
        fontSize: 12,
    },
    list: {
        padding: Theme.Spacing.md,
    },
    deviceRow: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        backgroundColor: 'rgba(255,255,255,0.035)',
        marginBottom: 10,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.06)',
    },
    deviceIcon: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: 'rgba(225,29,72,0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 14,
    },
    deviceInfo: {
        flex: 1,
    },
    deviceName: {
        color: Theme.Colors.text,
        fontWeight: 'bold',
        fontSize: 16,
    },
    deviceId: {
        color: Theme.Colors.textSecondary,
        fontSize: 12,
        fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    },
    rssi: {
        color: Theme.Colors.textSecondary,
        fontSize: 12,
        marginBottom: 4,
    },
});
