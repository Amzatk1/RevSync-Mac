import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, BackHandler, Alert, ActivityIndicator } from 'react-native';
import { Theme } from '../../theme';
import { Screen, PrimaryButton, LoadingOverlay, Card, ErrorBanner } from '../../components/SharedComponents';
import { Ionicons } from '@expo/vector-icons';
import { ServiceLocator } from '../../../di/ServiceLocator';
import { useAppStore } from '../../store/useAppStore';

export const BackupScreen = ({ navigation, route }: any) => {
    const { tuneId, ecuData } = route.params || {};
    const [status, setStatus] = useState<'idle' | 'reading' | 'uploading' | 'completed' | 'failed'>('idle');
    const [progress, setProgress] = useState(0);
    const [backupPath, setBackupPath] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Prevent accidental back navigation during critical operations
    useEffect(() => {
        const onBackPress = () => {
            if (status === 'reading' || status === 'uploading') {
                Alert.alert('Backup in Progress', 'Please do not interrupt the backup process.');
                return true;
            }
            return false;
        };

        const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
        return () => subscription.remove();
    }, [status]);

    const startBackup = async () => {
        setStatus('reading');
        setProgress(0);
        setError(null);

        try {
            const ecuService = ServiceLocator.getECUService();

            // 1. Read ECU Memory
            const path = await ecuService.readECU((pct) => {
                setProgress(pct);
            });

            setBackupPath(path);

            // 2. Simulate Cloud Upload (Optional but good for safety)
            setStatus('uploading');
            // Mock upload delay
            await new Promise(r => setTimeout(r, 1500));

            setStatus('completed');
        } catch (e: any) {
            setError(e.message || 'Backup failed');
            setStatus('failed');
        }
    };

    const handleNext = () => {
        navigation.navigate('FlashWizard', { tuneId, backupPath });
    };

    return (
        <Screen edges={['top']}>
            <View style={styles.header}>
                <Text style={styles.title}>ECU Backup</Text>
                <Text style={styles.subtitle}>creating a safety restore point</Text>
            </View>

            {/* Status Display */}
            <View style={styles.content}>
                {status === 'idle' && (
                    <View style={styles.infoContainer}>
                        <Ionicons name="save-outline" size={64} color={Theme.Colors.primary} />
                        <Text style={styles.infoText}>
                            Before flashing, we must create a full backup of your current ECU state.
                            This allows you to revert to stock if anything goes wrong.
                        </Text>
                        <Card style={styles.infoCard}>
                            <Text style={styles.warningTitle}>⚠️ Do not unplug</Text>
                            <Text style={styles.warningText}>
                                Ensure your device stays connected and your bike battery is charged.
                            </Text>
                        </Card>
                    </View>
                )}

                {(status === 'reading' || status === 'uploading') && (
                    <View style={styles.progressContainer}>
                        <ActivityIndicatorCircle progress={progress} />
                        <Text style={styles.statusText}>
                            {status === 'reading' ? 'Reading ECU Memory...' : 'Syncing to Cloud...'}
                        </Text>
                        <Text style={styles.percentText}>{Math.round(progress)}%</Text>
                        <View style={styles.progressBar}>
                            <View style={[styles.progressFill, { width: `${progress}%` }]} />
                        </View>
                    </View>
                )}

                {status === 'completed' && (
                    <View style={styles.successContainer}>
                        <Ionicons name="checkmark-circle" size={80} color={Theme.Colors.success} />
                        <Text style={styles.successTitle}>Backup Secure</Text>
                        <Text style={styles.successPath}>Saved to: {backupPath}</Text>
                        <Text style={styles.successSub}>
                            Your original ECU data is safe. We can now proceed to flash the new tune.
                        </Text>
                    </View>
                )}

                {status === 'failed' && (
                    <ErrorBanner
                        message={error || 'Backup operation failed'}
                        onRetry={startBackup}
                    />
                )}
            </View>

            {/* Footer Actions */}
            <View style={styles.footer}>
                {status === 'idle' && (
                    <PrimaryButton title="Start Backup" onPress={startBackup} />
                )}

                {status === 'completed' && (
                    <PrimaryButton title="Continue to Flash" onPress={handleNext} />
                )}

                {/* Lock navigation during active states */}
                {(status === 'reading' || status === 'uploading') && (
                    <Text style={styles.workingText}>Please wait...</Text>
                )}
            </View>
        </Screen>
    );
};

// Simple Circle Component for UI flare
const ActivityIndicatorCircle = ({ progress }: { progress: number }) => (
    <View style={styles.circleContainer}>
        <Ionicons name="cloud-upload-outline" size={48} color={Theme.Colors.primary} />
    </View>
);

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
    content: {
        flex: 1,
        padding: Theme.Spacing.md,
        justifyContent: 'center',
    },
    infoContainer: {
        alignItems: 'center',
    },
    infoText: {
        textAlign: 'center',
        paddingVertical: 24,
        color: Theme.Colors.text,
        fontSize: 16,
        lineHeight: 24,
    },
    infoCard: {
        backgroundColor: 'rgba(255, 179, 71, 0.15)', // Orange tint
        borderColor: 'rgba(255, 179, 71, 0.5)',
        borderWidth: 1,
        width: '100%',
    },
    warningTitle: {
        color: '#FFA500', // Orange
        fontWeight: 'bold',
        marginBottom: 4,
    },
    warningText: {
        color: Theme.Colors.text,
        fontSize: 14,
    },
    progressContainer: {
        alignItems: 'center',
        width: '100%',
    },
    circleContainer: {
        marginBottom: 24,
    },
    statusText: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 8,
        color: Theme.Colors.text,
    },
    percentText: {
        fontSize: 32,
        fontWeight: 'bold',
        color: Theme.Colors.primary,
        marginBottom: 16,
    },
    progressBar: {
        height: 8,
        backgroundColor: Theme.Colors.surfaceHighlight,
        width: '100%',
        borderRadius: 4,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        backgroundColor: Theme.Colors.primary,
    },
    successContainer: {
        alignItems: 'center',
    },
    successTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: Theme.Colors.success,
        marginTop: 16,
    },
    successPath: {
        color: Theme.Colors.textSecondary,
        fontSize: 12,
        fontFamily: 'monospace',
        marginVertical: 8,
    },
    successSub: {
        textAlign: 'center',
        color: Theme.Colors.text,
        marginTop: 8,
    },
    footer: {
        padding: Theme.Spacing.md,
    },
    workingText: {
        textAlign: 'center',
        color: Theme.Colors.textSecondary,
    },
});
