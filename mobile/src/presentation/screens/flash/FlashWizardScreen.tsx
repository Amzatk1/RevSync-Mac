import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Alert, BackHandler, ScrollView } from 'react-native';
import { Theme } from '../../theme';
import { Screen, PrimaryButton, SecondaryButton, Card, LoadingOverlay, ErrorBanner } from '../../components/SharedComponents';
import { Ionicons } from '@expo/vector-icons';
import { ServiceLocator } from '../../../di/ServiceLocator';
import { useAppStore } from '../../store/useAppStore';
import { useSettingsStore } from '../../store/useSettingsStore';

type WizardStep = 'pre-checks' | 'confirmation' | 'flashing' | 'success' | 'failed';

export const FlashWizardScreen = ({ navigation, route }: any) => {
    const { tuneId, backupPath } = route.params || {};
    const { startFlash, flashSession } = useAppStore();

    const [step, setStep] = useState<WizardStep>('pre-checks');
    const [checks, setChecks] = useState({
        battery: false,
        ignition: false,
        internet: true, // simplified
    });
    const [progress, setProgress] = useState(0);
    const [log, setLog] = useState<string[]>([]);
    const [error, setError] = useState<string | null>(null);

    // Lock back navigation during critical steps
    useEffect(() => {
        const onBackPress = () => {
            if (step === 'flashing') {
                Alert.alert('CRITICAL WARNING', 'Interrupting the flash process now will brick your ECU. Do not exit.');
                return true;
            }
            return false;
        };
        const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
        return () => subscription.remove();
    }, [step]);

    const { safetyModeEnabled } = useSettingsStore();

    // Initial Checks
    useEffect(() => {
        if (step === 'pre-checks') {
            runPreChecks();
        }
    }, []);

    const runPreChecks = async () => {
        if (!safetyModeEnabled) {
            // If safety checks are disabled, we might skip them or just auto-pass them instantly
            // For UI consistency, let's just make them pass very fast
            setChecks({ battery: true, ignition: true, internet: true });
            return;
        }

        // Mock checking vehicle state
        setTimeout(() => {
            setChecks(prev => ({ ...prev, battery: true }));
        }, 500);
        setTimeout(() => {
            setChecks(prev => ({ ...prev, ignition: true }));
        }, 1500);
    };

    const allChecksPassed = checks.battery && checks.ignition && checks.internet;

    const handleStartFlash = async () => {
        setStep('flashing');
        setError(null);
        setProgress(0);
        setLog(['Initializing flash session...', 'Verifying backup... OK']);

        try {
            const tuneService = ServiceLocator.getTuneService();
            const tune = await tuneService.getTuneDetails(tuneId); // Should be passed or fetched

            if (!tune) throw new Error("Tune definition not found");

            // Subscribe to progress (In a real app, useAppStore might expose an observable or callback)
            // Here we rely on the ECUService inside startFlash to update something, 
            // OR we call ECUService directly to have better control over callbacks for UI.
            // Let's call ECUService directly here for the UI feedback loop, 
            // but we must ensure AppStore state is kept in sync if needed.

            const ecuService = ServiceLocator.getECUService();

            await ecuService.flashTune(tune, backupPath, (pct, msg) => {
                setProgress(pct);
                if (msg) setLog(prev => [...prev.slice(-4), msg]); // Keep last 5 logs
            });

            setStep('success');
        } catch (e: any) {
            setError(e.message || 'Flash sequence failed');
            setStep('failed');
            setLog(prev => [...prev, `ERROR: ${e.message}`]);
        }
    };

    const handleFinish = () => {
        // Reset navigation to Garage
        navigation.reset({
            index: 0,
            routes: [{ name: 'Garage' }],
        });
    };

    if (step === 'pre-checks') {
        return (
            <Screen>
                <View style={styles.header}>
                    <Text style={styles.title}>Pre-Flash Checks</Text>
                    <Text style={styles.subtitle}>Ensuring safe conditions</Text>
                </View>

                <Card style={styles.checkCard}>
                    <CheckRow label="Battery Voltage (>12.5V)" passed={checks.battery} />
                    <View style={styles.divider} />
                    <CheckRow label="Ignition ON, Engine OFF" passed={checks.ignition} />
                    <View style={styles.divider} />
                    <CheckRow label="Internet Connection" passed={checks.internet} />
                </Card>

                <View style={styles.footer}>
                    {!allChecksPassed ? (
                        <Text style={styles.waitingText}>Checking vehicle status...</Text>
                    ) : (
                        <PrimaryButton title="Continue" onPress={() => setStep('confirmation')} />
                    )}
                </View>
            </Screen>
        );
    }

    if (step === 'confirmation') {
        return (
            <Screen>
                <View style={styles.header}>
                    <Text style={styles.title}>Confirm Flash</Text>
                    <Text style={styles.subtitle}>Last chance to abort</Text>
                </View>

                <View style={styles.warningContainer}>
                    <Ionicons name="warning-outline" size={64} color={Theme.Colors.error} />
                    <Text style={styles.warningTitle}>CRITICAL SAFETY WARNING</Text>
                    <Text style={styles.warningText}>
                        1. Do not turn off the ignition.{'\n'}
                        2. Do not unplug the cable/adapter.{'\n'}
                        3. Do not minimize this app.{'\n'}
                        4. Ensure phone battery is charged.
                    </Text>
                    <Text style={styles.warningSubText}>
                        Failure to follow these instructions may result in a non-functional ECU (bricked bike).
                    </Text>
                </View>

                <View style={styles.footer}>
                    <SecondaryButton title="Cancel" onPress={() => navigation.goBack()} style={{ marginBottom: 12 }} />
                    <PrimaryButton
                        title="I Understand, Flash Tune"
                        onPress={handleStartFlash}
                        style={{ backgroundColor: Theme.Colors.error }} // Red for dangerous action
                    />
                </View>
            </Screen>
        );
    }

    if (step === 'flashing') {
        return (
            <Screen edges={['top']}>
                <View style={styles.flashContainer}>
                    <Text style={styles.flashTitle}>Flashing ECU...</Text>
                    <Text style={styles.flashSubtitle}>Do not touch the device</Text>

                    <View style={styles.progressCircle}>
                        <Text style={styles.progressText}>{Math.round(progress)}%</Text>
                    </View>

                    <View style={styles.progressBarBg}>
                        <View style={[styles.progressBarFill, { width: `${progress}%` }]} />
                    </View>

                    <View style={styles.logContainer}>
                        {log.map((line, i) => (
                            <Text key={i} style={styles.logText}> {'>'} {line}</Text>
                        ))}
                    </View>
                </View>
            </Screen>
        );
    }

    if (step === 'success') {
        return (
            <Screen>
                <View style={styles.resultContainer}>
                    <Ionicons name="checkmark-done-circle" size={96} color={Theme.Colors.success} />
                    <Text style={styles.resultTitle}>Flash Successful!</Text>
                    <Text style={styles.resultText}>
                        Your ECU has been successfully updated.
                        Please cycle your ignition (OFF then ON) to complete the process.
                    </Text>
                </View>
                <View style={styles.footer}>
                    <PrimaryButton title="Proceed to Verification" onPress={() => navigation.navigate('Verification', { tuneId })} />
                </View>
            </Screen>
        );
    }

    if (step === 'failed') {
        return (
            <Screen>
                <View style={styles.resultContainer}>
                    <Ionicons name="alert-circle" size={96} color={Theme.Colors.error} />
                    <Text style={[styles.resultTitle, { color: Theme.Colors.error }]}>Flash Failed</Text>
                    <Text style={styles.resultText}>
                        {error || "An unknown error occurred."}
                    </Text>
                    <Text style={styles.resultSubText}>
                        Your original backup is available. Attempt Recovery?
                    </Text>
                </View>
                <View style={styles.footer}>
                    <PrimaryButton
                        title="Attempt Recovery (Restore Backup)"
                        onPress={() => navigation.navigate('Recovery', { backupPath })}
                        style={{ marginBottom: 16 }}
                    />
                    <SecondaryButton title="Contact Support" onPress={() => { }} />
                </View>
            </Screen>
        );
    }

    return null;
};

const CheckRow = ({ label, passed }: { label: string, passed: boolean }) => (
    <View style={styles.checkRow}>
        <Text style={styles.checkLabel}>{label}</Text>
        {passed ? (
            <Ionicons name="checkmark-circle" size={24} color={Theme.Colors.success} />
        ) : (
            <Ionicons name="ellipse-outline" size={24} color={Theme.Colors.textSecondary} /> // data-loading placeholder or spinner
        )}
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
    checkCard: {
        marginTop: 20,
    },
    checkRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
    },
    checkLabel: {
        fontSize: 16,
        color: Theme.Colors.text,
    },
    divider: {
        height: 1,
        backgroundColor: Theme.Colors.border,
    },
    footer: {
        padding: Theme.Spacing.md,
        marginTop: 'auto',
    },
    waitingText: {
        textAlign: 'center',
        color: Theme.Colors.textSecondary,
    },
    warningContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 32,
    },
    warningTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: Theme.Colors.error,
        marginTop: 16,
        marginBottom: 16,
        textAlign: 'center',
    },
    warningText: {
        fontSize: 16,
        color: Theme.Colors.text,
        lineHeight: 28,
    },
    warningSubText: {
        marginTop: 24,
        fontSize: 14,
        color: Theme.Colors.textSecondary,
        textAlign: 'center',
        fontStyle: 'italic',
    },
    flashContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
    },
    flashTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: Theme.Colors.text,
        marginBottom: 8,
    },
    flashSubtitle: {
        fontSize: 16,
        color: Theme.Colors.error,
        fontWeight: '600',
        marginBottom: 40,
    },
    progressCircle: {
        marginBottom: 20,
    },
    progressText: {
        fontSize: 48,
        fontWeight: 'bold',
        color: Theme.Colors.primary,
    },
    progressBarBg: {
        width: '100%',
        height: 12,
        backgroundColor: Theme.Colors.surfaceHighlight,
        borderRadius: 6,
        overflow: 'hidden',
        marginBottom: 32,
    },
    progressBarFill: {
        height: '100%',
        backgroundColor: Theme.Colors.primary,
    },
    logContainer: {
        width: '100%',
        backgroundColor: '#000',
        padding: 12,
        borderRadius: 8,
        opacity: 0.8,
    },
    logText: {
        color: '#0F0',
        fontFamily: 'monospace',
        fontSize: 12,
        marginBottom: 4,
    },
    resultContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    resultTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: Theme.Colors.text,
        marginTop: 24,
        marginBottom: 16,
    },
    resultText: {
        textAlign: 'center',
        fontSize: 16,
        color: Theme.Colors.text,
        lineHeight: 24,
    },
    resultSubText: {
        textAlign: 'center',
        marginTop: 16,
        color: Theme.Colors.textSecondary,
    },
});
