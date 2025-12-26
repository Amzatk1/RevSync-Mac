import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, Dimensions, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { theme } from '../styles/theme';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';

const { width } = Dimensions.get('window');

// Simple Gauge Component
const Gauge = ({ label, value, unit, max, color }: any) => {
    const percentage = Math.min(Math.max(value / max, 0), 1);
    return (
        <View style={styles.gaugeContainer}>
            <View style={styles.gaugeTrack}>
                <View
                    style={[
                        styles.gaugeFill,
                        { width: `${percentage * 100}%`, backgroundColor: color }
                    ]}
                />
            </View>
            <View style={styles.gaugeInfo}>
                <Text style={styles.gaugeLabel}>{label}</Text>
                <Text style={styles.gaugeValue}>{Math.round(value)} <Text style={styles.gaugeUnit}>{unit}</Text></Text>
            </View>
        </View>
    );
};

export default function LiveMonitorScreen() {
    const navigation = useNavigation();
    const [connectionState, setConnectionState] = useState<'DISCONNECTED' | 'CONNECTING' | 'CONNECTED'>('DISCONNECTED');
    const [rpm, setRpm] = useState(0);
    const [speed, setSpeed] = useState(0);
    const [temp, setTemp] = useState(180);
    const [tps, setTps] = useState(0);

    const handleConnect = () => {
        setConnectionState('CONNECTING');
        setTimeout(() => {
            setConnectionState('CONNECTED');
        }, 2000); // Simulate connection delay
    };

    const handleDisconnect = () => {
        setConnectionState('DISCONNECTED');
    };

    // Simulate Data Stream
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (connectionState === 'CONNECTED') {
            interval = setInterval(() => {
                // Simulate revving engine
                setRpm(prev => {
                    const noise = Math.random() * 200 - 100;
                    let next = prev + (Math.random() > 0.5 ? 500 : -300) + noise;
                    if (next < 1200) next = 1200;
                    if (next > 14000) next = 14000;
                    return next;
                });

                setSpeed(prev => Math.min(prev + (Math.random() * 2), 180));
                setTemp(prev => Math.min(Math.max(prev + (Math.random() - 0.5), 180), 220));
                setTps(prev => Math.random() * 100);
            }, 100);
        } else {
            setRpm(0);
            setSpeed(0);
        }
        return () => clearInterval(interval);
    }, [connectionState]);

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Button
                    title="Exit"
                    variant="ghost"
                    size="sm"
                    onPress={() => navigation.goBack()}
                />
                <View style={styles.statusContainer}>
                    <View style={[
                        styles.statusDot,
                        { backgroundColor: connectionState === 'CONNECTED' ? theme.colors.success : (connectionState === 'CONNECTING' ? theme.colors.warning : theme.colors.error) }
                    ]} />
                    <Text style={styles.statusText}>{connectionState}</Text>
                </View>
                <View style={{ width: 60 }} />
            </View>

            {connectionState === 'CONNECTED' && (
                <View style={styles.demoBadge}>
                    <Text style={styles.demoText}>DEMO MODE</Text>
                </View>
            )}

            <View style={styles.content}>
                {/* Main RPM Gauge */}
                <View style={styles.mainGauge}>
                    <Text style={styles.rpmValue}>{Math.round(rpm)}</Text>
                    <Text style={styles.rpmLabel}>RPM</Text>
                    <View style={styles.rpmBarContainer}>
                        <View style={[styles.rpmBar, { width: `${(rpm / 14000) * 100}%` }]} />
                    </View>
                </View>

                {/* Secondary Gauges Grid */}
                <View style={styles.grid}>
                    <Card style={styles.gridItem}>
                        <Text style={styles.gridLabel}>SPEED</Text>
                        <Text style={styles.gridValue}>{Math.round(speed)}</Text>
                        <Text style={styles.gridUnit}>MPH</Text>
                    </Card>
                    <Card style={styles.gridItem}>
                        <Text style={styles.gridLabel}>TEMP</Text>
                        <Text style={[styles.gridValue, temp > 210 && { color: theme.colors.error }]}>
                            {Math.round(temp)}°
                        </Text>
                        <Text style={styles.gridUnit}>F</Text>
                    </Card>
                    <Card style={styles.gridItem}>
                        <Text style={styles.gridLabel}>TPS</Text>
                        <Text style={styles.gridValue}>{Math.round(tps)}</Text>
                        <Text style={styles.gridUnit}>%</Text>
                    </Card>
                    <Card style={styles.gridItem}>
                        <Text style={styles.gridLabel}>BATTERY</Text>
                        <Text style={styles.gridValue}>14.2</Text>
                        <Text style={styles.gridUnit}>V</Text>
                    </Card>
                </View>

                {/* Connection Control */}
                <View style={styles.footer}>
                    {connectionState === 'DISCONNECTED' ? (
                        <Button
                            title="Connect to ECU"
                            size="lg"
                            onPress={handleConnect}
                            style={styles.connectButton}
                        />
                    ) : connectionState === 'CONNECTING' ? (
                        <Button
                            title="Connecting..."
                            size="lg"
                            disabled
                            style={styles.connectButton}
                        />
                    ) : (
                        <Button
                            title="Stop Monitoring"
                            variant="destructive"
                            onPress={handleDisconnect}
                        />
                    )}
                </View>
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
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
    },
    statusContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.surface,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
    },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginRight: 8,
    },
    statusText: {
        color: theme.colors.text,
        fontSize: 12,
        fontWeight: '700',
    },
    demoBadge: {
        position: 'absolute',
        top: 60,
        alignSelf: 'center',
        backgroundColor: 'rgba(255, 214, 10, 0.2)',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
        borderWidth: 1,
        borderColor: theme.colors.warning,
    },
    demoText: {
        color: theme.colors.warning,
        fontSize: 10,
        fontWeight: '700',
    },
    content: {
        flex: 1,
        padding: 20,
        justifyContent: 'space-between',
    },
    mainGauge: {
        alignItems: 'center',
        marginBottom: 40,
    },
    rpmValue: {
        fontSize: 80,
        fontWeight: '800',
        color: theme.colors.text,
        fontVariant: ['tabular-nums'],
        letterSpacing: -2,
    },
    rpmLabel: {
        fontSize: 24,
        color: theme.colors.textSecondary,
        marginBottom: 20,
    },
    rpmBarContainer: {
        width: '100%',
        height: 24,
        backgroundColor: theme.colors.surfaceHighlight,
        borderRadius: 12,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    rpmBar: {
        height: '100%',
        backgroundColor: theme.colors.primary,
        borderRadius: 12,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    gridItem: {
        width: '48%', // Approx half
        alignItems: 'center',
        padding: 20,
    },
    gridLabel: {
        fontSize: 14,
        color: theme.colors.textSecondary,
        marginBottom: 8,
    },
    gridValue: {
        fontSize: 32,
        fontWeight: '700',
        color: theme.colors.text,
    },
    gridUnit: {
        fontSize: 14,
        color: theme.colors.textSecondary,
        marginTop: 4,
    },
    footer: {
        marginBottom: 20,
    },
    connectButton: {
        ...theme.shadows.glow,
    },
});
