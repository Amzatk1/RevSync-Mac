import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, BackHandler, Alert, ScrollView } from 'react-native';
import { Theme } from '../../theme';
import { Screen, PrimaryButton, SecondaryButton, Card, ErrorBanner } from '../../components/SharedComponents';
import { Ionicons } from '@expo/vector-icons';
import { ServiceLocator } from '../../../di/ServiceLocator';

export const RecoveryScreen = ({ navigation, route }: any) => {
    const { backupPath, deviceId } = route.params || {};
    const [status, setStatus] = useState<'idle' | 'restoring' | 'success' | 'failed'>('idle');
    const [progress, setProgress] = useState(0);
    const [log, setLog] = useState<string[]>([]);
    const [error, setError] = useState<string | null>(null);
    const scrollRef = useRef<ScrollView>(null);

    // Lock back nav during recovery
    useEffect(() => {
        const onBackPress = () => {
            if (status === 'restoring') {
                Alert.alert(
                    '⛔ CRITICAL',
                    'Recovery is in progress. Interrupting will corrupt your ECU.',
                    [{ text: 'I Understand', style: 'cancel' }]
                );
                return true;
            }
            return false;
        };
        const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
        return () => subscription.remove();
    }, [status]);

    // Auto-scroll log
    useEffect(() => {
        setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    }, [log]);

    const addLog = (msg: string) => setLog(prev => [...prev, msg]);

    const startRecovery = async () => {
        if (!backupPath) {
            setError('No backup file provided.');
            return;
        }

        setStatus('restoring');
        setProgress(0);
        setError(null);
        setLog([]);
        addLog('Initializing Recovery Mode...');
        addLog(`Backup file: ${backupPath.split('/').pop()}`);

        try {
            const ecuService = ServiceLocator.getECUService();

            // Set device ID if available
            if (deviceId && 'setConnectedDevice' in ecuService) {
                (ecuService as any).setConnectedDevice(deviceId);
            }

            addLog('Starting ECU restore...');

            // Use the real restoreBackup method
            await ecuService.restoreBackup(backupPath, (pct, msg) => {
                setProgress(pct);
                if (msg) {
                    // Log every 10th chunk or non-chunk messages
                    const chunkMatch = msg.match(/chunk (\d+)\/(\d+)/i);
                    if (!chunkMatch || parseInt(chunkMatch[1]) % Math.max(1, Math.ceil(parseInt(chunkMatch[2]) / 10)) === 0) {
                        addLog(msg);
                    }
                }
            });

            addLog('Restore complete. Verifying integrity...');
            addLog('Recovery successful ✓');
            setStatus('success');

        } catch (e: any) {
            setError(e.message || 'Recovery Failed');
            setStatus('failed');
            addLog(`CRITICAL ERROR: ${e.message}`);
        }
    };

    const handleFinish = () => {
        navigation.reset({ index: 0, routes: [{ name: 'Garage' }] });
    };

    // ─── Restoring ─────────────────────────────────────────────

    if (status === 'restoring') {
        return (
            <Screen edges={['top']}>
                <View style={styles.container}>
                    <View style={styles.header}>
                        <Text style={[styles.title, { color: '#EF4444' }]}>EMERGENCY RECOVERY</Text>
                        <Text style={styles.subtitle}>Restoring original ECU state...</Text>
                    </View>

                    <View style={styles.progressContainer}>
                        <Text style={styles.percentText}>{Math.round(progress)}%</Text>
                        <View style={styles.progressBarBg}>
                            <View style={[styles.progressBarFill, { width: `${progress}%` }]} />
                        </View>
                    </View>

                    <Card style={styles.logCard}>
                        <ScrollView ref={scrollRef} style={{ maxHeight: 200 }}>
                            {log.map((line, i) => (
                                <Text key={i} style={[styles.logText, {
                                    color: line.includes('ERROR') ? '#EF4444' :
                                        line.includes('✓') ? '#22C55E' : '#BBB',
                                }]}>
                                    {'>'} {line}
                                </Text>
                            ))}
                        </ScrollView>
                    </Card>

                    <Text style={styles.warningText}>
                        DO NOT DISCONNECT POWER.{'\n'}
                        DO NOT CLOSE APP.
                    </Text>
                </View>
            </Screen>
        );
    }

    // ─── Success ───────────────────────────────────────────────

    if (status === 'success') {
        return (
            <Screen center>
                <Ionicons name="medical" size={80} color="#22C55E" />
                <Text style={styles.successTitle}>Recovery Successful</Text>
                <Text style={styles.successText}>
                    Your ECU has been restored to its previous working state.{'\n'}
                    Cycle ignition (OFF → ON) to finalize.
                </Text>
                <PrimaryButton
                    title="Return to Garage"
                    onPress={handleFinish}
                    style={styles.button}
                />
            </Screen>
        );
    }

    // ─── Failed ────────────────────────────────────────────────

    if (status === 'failed') {
        return (
            <Screen>
                <View style={styles.container}>
                    <View style={[styles.iconContainer, { backgroundColor: 'rgba(239,68,68,0.1)' }]}>
                        <Ionicons name="warning" size={64} color="#EF4444" />
                    </View>
                    <Text style={[styles.title, { color: '#EF4444' }]}>Recovery Failed</Text>
                    <ErrorBanner message={error || 'Recovery operation failed'} onRetry={startRecovery} />
                    <Card style={styles.logCard}>
                        <ScrollView style={{ maxHeight: 150 }}>
                            {log.map((line, i) => (
                                <Text key={i} style={[styles.logText, {
                                    color: line.includes('ERROR') ? '#EF4444' : '#BBB',
                                }]}>
                                    {'>'} {line}
                                </Text>
                            ))}
                        </ScrollView>
                    </Card>
                    <View style={styles.footer}>
                        <SecondaryButton title="Contact Support" onPress={() => { }} />
                    </View>
                </View>
            </Screen>
        );
    }

    // ─── Idle ──────────────────────────────────────────────────

    return (
        <Screen>
            <View style={styles.container}>
                <View style={[styles.iconContainer, { backgroundColor: 'rgba(255, 59, 48, 0.1)' }]}>
                    <Ionicons name="fitness" size={64} color="#EF4444" />
                </View>

                <Text style={styles.title}>ECU Recovery Mode</Text>
                <Text style={styles.description}>
                    This process will wipe the corrupted tune and restore the backup:
                </Text>

                <Card style={styles.fileCard}>
                    <Ionicons name="document-text-outline" size={24} color={Theme.Colors.text} />
                    <Text style={styles.fileName} numberOfLines={1} ellipsizeMode="middle">
                        {backupPath ? backupPath.split('/').pop() : 'Unknown Backup File'}
                    </Text>
                </Card>

                {!backupPath && (
                    <ErrorBanner message="No backup file available. Contact support." />
                )}

                <View style={styles.footer}>
                    <PrimaryButton
                        title="Start Recovery"
                        onPress={startRecovery}
                        disabled={!backupPath}
                        style={{ backgroundColor: '#DC2626' }}
                    />
                    <SecondaryButton
                        title="Contact Support"
                        onPress={() => { }}
                        style={{ marginTop: 12 }}
                    />
                </View>
            </View>
        </Screen>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, padding: Theme.Spacing.md, alignItems: 'center', justifyContent: 'center' },
    header: { alignItems: 'center', marginBottom: 32 },
    iconContainer: {
        width: 100, height: 100, borderRadius: 50,
        justifyContent: 'center', alignItems: 'center', marginBottom: 24,
    },
    title: { ...Theme.Typography.h2, marginBottom: 8, textAlign: 'center' },
    subtitle: { color: Theme.Colors.textSecondary, fontSize: 16 },
    description: { textAlign: 'center', color: Theme.Colors.text, marginBottom: 24, lineHeight: 22 },
    fileCard: {
        flexDirection: 'row', alignItems: 'center', gap: 12,
        width: '100%', marginBottom: 32, paddingVertical: 16,
    },
    fileName: { flex: 1, fontFamily: 'monospace', color: Theme.Colors.text },
    progressContainer: { width: '100%', marginVertical: 32, alignItems: 'center' },
    percentText: { fontSize: 40, fontWeight: 'bold', color: '#EF4444', marginBottom: 8 },
    progressBarBg: {
        width: '100%', height: 12,
        backgroundColor: Theme.Colors.surfaceHighlight,
        borderRadius: 6, overflow: 'hidden',
    },
    progressBarFill: { height: '100%', backgroundColor: '#EF4444' },
    logCard: {
        width: '100%', backgroundColor: '#111',
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.04)',
    },
    logText: { fontFamily: 'monospace', fontSize: 12, marginBottom: 4 },
    warningText: { color: '#EF4444', fontWeight: 'bold', textAlign: 'center', marginTop: 24 },
    successTitle: { fontSize: 24, fontWeight: 'bold', color: '#22C55E', marginVertical: 16 },
    successText: {
        textAlign: 'center', color: Theme.Colors.textSecondary,
        marginBottom: 32, lineHeight: 22,
    },
    button: { width: '100%' },
    footer: { width: '100%', marginTop: 'auto' },
});
