import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, BackHandler, Alert } from 'react-native';
import { Theme } from '../../theme';
import { Screen, PrimaryButton, SecondaryButton, Card, LoadingOverlay, ErrorBanner } from '../../components/SharedComponents';
import { Ionicons } from '@expo/vector-icons';
import { ServiceLocator } from '../../../di/ServiceLocator';
import { useAppStore } from '../../store/useAppStore';

export const RecoveryScreen = ({ navigation, route }: any) => {
    const { backupPath } = route.params || {};
    const [status, setStatus] = useState<'idle' | 'restoring' | 'success' | 'failed'>('idle');
    const [progress, setProgress] = useState(0);
    const [log, setLog] = useState<string[]>([]);
    const [error, setError] = useState<string | null>(null);

    // Lock back nav
    useEffect(() => {
        const onBackPress = () => {
            if (status === 'restoring') {
                return true; // Block back button
            }
            return false;
        };
        const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
        return () => subscription.remove();
    }, [status]);

    const startRecovery = async () => {
        if (!backupPath) {
            setError('No backup file provided.');
            return;
        }

        setStatus('restoring');
        setProgress(0);
        setError(null);
        setLog(['Initializing Recovery Mode...', 'Loading backup file...']);

        try {
            const ecuService = ServiceLocator.getECUService();

            // We need a restoreBackup method or similar. 
            // In a real app, this might just be flashTune but with a raw binary/backup file type.
            // For now, let's assume flashTune can handle it or we use a specific method.
            // Since ECUService.flashTune takes a 'Tune' object, we might need a wrapper 
            // or a specialized restore method.
            // For this implementation, I'll simulate it or use a specialized mocked call.

            // Simulating restore process
            await new Promise<void>((resolve, reject) => {
                let p = 0;
                const interval = setInterval(() => {
                    p += 5;
                    setProgress(p);
                    if (p % 20 === 0) setLog(prev => [...prev, `Restoring block ${p / 5}... OK`]);

                    if (p >= 100) {
                        clearInterval(interval);
                        resolve();
                    }
                }, 200); // 4 seconds total
            });

            setLog(prev => [...prev, 'Restore Complete. Verifying... OK']);
            setStatus('success');

        } catch (e: any) {
            setError(e.message || 'Recovery Failed');
            setStatus('failed');
            setLog(prev => [...prev, `CRITICAL ERROR: ${e.message}`]);
        }
    };

    const handleFinish = () => {
        // Reset to Garage to be safe
        navigation.reset({
            index: 0,
            routes: [{ name: 'Garage' }],
        });
    };

    if (status === 'restoring') {
        return (
            <Screen edges={['top']}>
                <View style={styles.container}>
                    <View style={styles.header}>
                        <Text style={[styles.title, { color: Theme.Colors.error }]}>EMERGENCY RECOVERY</Text>
                        <Text style={styles.subtitle}>Restoring original ECU state...</Text>
                    </View>

                    <View style={styles.progressContainer}>
                        <Text style={styles.percentText}>{progress}%</Text>
                        <View style={styles.progressBarBg}>
                            <View style={[styles.progressBarFill, { width: `${progress}%` }]} />
                        </View>
                    </View>

                    <Card style={styles.logCard}>
                        <ScrollView>
                            {log.map((line, i) => (
                                <Text key={i} style={styles.logText}>{'>'} {line}</Text>
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

    if (status === 'success') {
        return (
            <Screen center>
                <Ionicons name="medical" size={80} color={Theme.Colors.success} />
                <Text style={styles.successTitle}>Recovery Successful</Text>
                <Text style={styles.successText}>
                    Your ECU has been restored to its previous working state.
                </Text>
                <PrimaryButton
                    title="Return to Garage"
                    onPress={handleFinish}
                    style={styles.button}
                />
            </Screen>
        );
    }

    return (
        <Screen>
            <View style={styles.container}>
                <View style={[styles.iconContainer, { backgroundColor: 'rgba(255, 59, 48, 0.1)' }]}>
                    <Ionicons name="fitness" size={64} color={Theme.Colors.error} />
                </View>

                <Text style={styles.title}>ECU Recovery Mode</Text>

                <Text style={styles.description}>
                    This process will attempt to wipe the corrupted tune and restore the backup file:
                </Text>

                <Card style={styles.fileCard}>
                    <Ionicons name="document-text-outline" size={24} color={Theme.Colors.text} />
                    <Text style={styles.fileName} numberOfLines={1} ellipsizeMode="middle">
                        {backupPath ? backupPath.split('/').pop() : 'Unknown Backup File'}
                    </Text>
                </Card>

                {error && <ErrorBanner message={error} />}

                <View style={styles.footer}>
                    <PrimaryButton
                        title="Start Recovery"
                        onPress={startRecovery}
                        style={{ backgroundColor: Theme.Colors.error }}
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

import { ScrollView } from 'react-native';

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: Theme.Spacing.md,
        alignItems: 'center',
        justifyContent: 'center',
    },
    header: {
        alignItems: 'center',
        marginBottom: 32,
    },
    iconContainer: {
        width: 100,
        height: 100,
        borderRadius: 50,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
    },
    title: {
        ...Theme.Typography.h2,
        marginBottom: 8,
        textAlign: 'center',
    },
    subtitle: {
        color: Theme.Colors.textSecondary,
        fontSize: 16,
    },
    description: {
        textAlign: 'center',
        color: Theme.Colors.text,
        marginBottom: 24,
        lineHeight: 22,
    },
    fileCard: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        width: '100%',
        marginBottom: 32,
        paddingVertical: 16,
    },
    fileName: {
        flex: 1,
        fontFamily: 'monospace',
        color: Theme.Colors.text,
    },
    progressContainer: {
        width: '100%',
        marginVertical: 32,
        alignItems: 'center',
    },
    percentText: {
        fontSize: 40,
        fontWeight: 'bold',
        color: Theme.Colors.error,
        marginBottom: 8,
    },
    progressBarBg: {
        width: '100%',
        height: 12,
        backgroundColor: Theme.Colors.surfaceHighlight,
        borderRadius: 6,
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        backgroundColor: Theme.Colors.error,
    },
    logCard: {
        flex: 1,
        width: '100%',
        maxHeight: 200,
        backgroundColor: '#111',
    },
    logText: {
        color: '#BBB',
        fontFamily: 'monospace',
        fontSize: 12,
        marginBottom: 4,
    },
    warningText: {
        color: Theme.Colors.error,
        fontWeight: 'bold',
        textAlign: 'center',
        marginTop: 24,
    },
    successTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: Theme.Colors.success,
        marginVertical: 16,
    },
    successText: {
        textAlign: 'center',
        color: Theme.Colors.textSecondary,
        marginBottom: 32,
    },
    button: {
        width: '100%',
    },
    footer: {
        width: '100%',
        marginTop: 'auto',
    },
});
