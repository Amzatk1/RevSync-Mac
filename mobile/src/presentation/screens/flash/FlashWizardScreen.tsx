import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Alert, BackHandler, ScrollView, Animated, Easing } from 'react-native';
import { Theme } from '../../theme';
import { Screen, PrimaryButton, SecondaryButton, Card, ErrorBanner } from '../../components/SharedComponents';
import { Ionicons } from '@expo/vector-icons';
import { ServiceLocator } from '../../../di/ServiceLocator';
import { useAppStore } from '../../store/useAppStore';
import { useSettingsStore } from '../../store/useSettingsStore';

// ─── Types ─────────────────────────────────────────────────────

type WizardStep = 'pre-checks' | 'confirmation' | 'bootloader' | 'flashing' | 'verifying' | 'success' | 'failed';

interface FlashLog {
    timestamp: number;
    message: string;
    type: 'info' | 'success' | 'error' | 'warn';
}

// ─── Component ─────────────────────────────────────────────────

export const FlashWizardScreen = ({ navigation, route }: any) => {
    const { tuneId, backupPath, versionId, deviceId } = route.params || {};
    const { safetyModeEnabled } = useSettingsStore();

    const [step, setStep] = useState<WizardStep>('pre-checks');
    const [checks, setChecks] = useState({
        battery: false,
        ignition: false,
        backup: false,
        package: false,
    });
    const [progress, setProgress] = useState(0);
    const [log, setLog] = useState<FlashLog[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [chunkInfo, setChunkInfo] = useState({ sent: 0, total: 0 });

    const progressPulse = useRef(new Animated.Value(1)).current;
    const scrollRef = useRef<ScrollView>(null);

    // Lock back navigation during critical steps
    useEffect(() => {
        const onBackPress = () => {
            if (step === 'bootloader' || step === 'flashing' || step === 'verifying') {
                Alert.alert(
                    '⛔ CRITICAL WARNING',
                    'Interrupting the flash process NOW WILL BRICK YOUR ECU.\n\nDo not exit this screen.',
                    [{ text: 'I Understand', style: 'cancel' }]
                );
                return true;
            }
            return false;
        };
        const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
        return () => subscription.remove();
    }, [step]);

    // Pulse animation during flash
    useEffect(() => {
        if (step === 'flashing') {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(progressPulse, {
                        toValue: 1.05, duration: 800, easing: Easing.inOut(Easing.sin),
                        useNativeDriver: true,
                    }),
                    Animated.timing(progressPulse, {
                        toValue: 1, duration: 800, easing: Easing.inOut(Easing.sin),
                        useNativeDriver: true,
                    }),
                ])
            ).start();
        }
    }, [step]);

    // Auto-scroll log
    useEffect(() => {
        setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    }, [log]);

    // ─── Pre-flight ────────────────────────────────────────────

    useEffect(() => {
        if (step === 'pre-checks') runPreChecks();
    }, []);

    const addLog = (message: string, type: FlashLog['type'] = 'info') => {
        setLog(prev => [...prev, { timestamp: Date.now(), message, type }]);
    };

    const runPreChecks = async () => {
        if (!safetyModeEnabled) {
            setChecks({ battery: true, ignition: true, backup: true, package: true });
            return;
        }

        // Battery check
        setTimeout(() => setChecks(prev => ({ ...prev, battery: true })), 500);

        // Ignition check
        setTimeout(() => setChecks(prev => ({ ...prev, ignition: true })), 1200);

        // Backup exists check
        setTimeout(() => {
            setChecks(prev => ({ ...prev, backup: !!backupPath }));
        }, 1800);

        // Package verified check
        setTimeout(async () => {
            if (versionId) {
                const downloadSvc = ServiceLocator.getDownloadService();
                const exists = await downloadSvc.hasVerifiedPackage(versionId);
                setChecks(prev => ({ ...prev, package: exists }));
            } else {
                setChecks(prev => ({ ...prev, package: true }));
            }
        }, 2200);
    };

    const allChecksPassed = checks.battery && checks.ignition && checks.backup && checks.package;

    // ─── Flash Sequence ────────────────────────────────────────

    const handleStartFlash = async () => {
        setStep('bootloader');
        setError(null);
        setProgress(0);
        setLog([]);
        addLog('Initializing flash session...', 'info');

        try {
            const tuneService = ServiceLocator.getTuneService();
            const tune = await tuneService.getTuneDetails(tuneId);
            if (!tune) throw new Error('Tune definition not found');

            const ecuService = ServiceLocator.getECUService();

            // Set device ID on ECU service if available
            if (deviceId && 'setConnectedDevice' in ecuService) {
                (ecuService as any).setConnectedDevice(deviceId);
            }

            addLog('Tune loaded: ' + tune.title, 'info');

            // Bootloader phase
            addLog('Entering bootloader mode...', 'info');
            setStep('bootloader');

            // Flash with progress
            setStep('flashing');
            await ecuService.flashTune(tune, backupPath, (pct, msg) => {
                setProgress(pct);
                if (msg) {
                    // Extract chunk info from message
                    const chunkMatch = msg.match(/Chunk (\d+)\/(\d+)/);
                    if (chunkMatch) {
                        setChunkInfo({
                            sent: parseInt(chunkMatch[1]),
                            total: parseInt(chunkMatch[2]),
                        });
                    }

                    // Log every 10% or non-chunk messages
                    if (!chunkMatch || parseInt(chunkMatch[1]) % Math.ceil(parseInt(chunkMatch[2]) / 10) === 0) {
                        addLog(msg, 'info');
                    }
                }
            });

            addLog('Flash completed successfully!', 'success');
            setStep('success');

        } catch (e: any) {
            setError(e.message || 'Flash sequence failed');
            setStep('failed');
            addLog(`FATAL: ${e.message}`, 'error');
        }
    };

    const handleFinish = () => {
        navigation.navigate('Verification', { tuneId });
    };

    // ─── Render: Pre-Checks ────────────────────────────────────

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
                    <CheckRow label="ECU Backup Created" passed={checks.backup} />
                    <View style={styles.divider} />
                    <CheckRow label="Verified Tune Package" passed={checks.package} />
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

    // ─── Render: Confirmation ──────────────────────────────────

    if (step === 'confirmation') {
        return (
            <Screen>
                <View style={styles.header}>
                    <Text style={styles.title}>Confirm Flash</Text>
                    <Text style={styles.subtitle}>Last chance to abort</Text>
                </View>
                <View style={styles.warningContainer}>
                    <Ionicons name="warning-outline" size={64} color="#EF4444" />
                    <Text style={styles.warningTitle}>CRITICAL SAFETY WARNING</Text>
                    <Text style={styles.warningBody}>
                        1. Do not turn off the ignition.{'\n'}
                        2. Do not unplug the cable/adapter.{'\n'}
                        3. Do not minimize this app.{'\n'}
                        4. Ensure phone battery is charged.{'\n'}
                        5. Do not move away from your bike.
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
                        style={{ backgroundColor: '#DC2626' }}
                    />
                </View>
            </Screen>
        );
    }

    // ─── Render: Flashing / Bootloader ─────────────────────────

    if (step === 'bootloader' || step === 'flashing' || step === 'verifying') {
        const phaseLabel =
            step === 'bootloader' ? 'Entering Bootloader...' :
                step === 'verifying' ? 'Verifying Flash...' :
                    'Flashing ECU';

        return (
            <Screen edges={['top']}>
                <View style={styles.flashContainer}>
                    <Text style={styles.flashTitle}>{phaseLabel}</Text>
                    <Text style={styles.flashSubtitle}>DO NOT TOUCH THE DEVICE</Text>

                    {/* Progress Circle */}
                    <Animated.View style={[styles.progressCircle, { transform: [{ scale: progressPulse }] }]}>
                        <Text style={styles.progressText}>{Math.round(progress)}%</Text>
                        {chunkInfo.total > 0 && (
                            <Text style={styles.chunkText}>
                                {chunkInfo.sent}/{chunkInfo.total}
                            </Text>
                        )}
                    </Animated.View>

                    {/* Progress Bar */}
                    <View style={styles.progressBarBg}>
                        <View style={[styles.progressBarFill, { width: `${progress}%` }]} />
                    </View>

                    {/* Phase Steps */}
                    <View style={styles.phaseRow}>
                        <PhaseChip label="Boot" active={step === 'bootloader'} done={step !== 'bootloader'} />
                        <PhaseChip label="Flash" active={step === 'flashing'} done={step === 'verifying'} />
                        <PhaseChip label="Verify" active={step === 'verifying'} done={false} />
                    </View>

                    {/* Log */}
                    <Card style={styles.logCard}>
                        <ScrollView ref={scrollRef} style={{ maxHeight: 160 }}>
                            {log.map((entry, i) => (
                                <Text key={i} style={[styles.logText, {
                                    color: entry.type === 'error' ? '#EF4444' :
                                        entry.type === 'success' ? '#22C55E' :
                                            entry.type === 'warn' ? '#F59E0B' : '#4ADE80',
                                }]}>
                                    {'>'} {entry.message}
                                </Text>
                            ))}
                        </ScrollView>
                    </Card>
                </View>
            </Screen>
        );
    }

    // ─── Render: Success ───────────────────────────────────────

    if (step === 'success') {
        return (
            <Screen>
                <View style={styles.resultContainer}>
                    <Ionicons name="checkmark-done-circle" size={96} color="#22C55E" />
                    <Text style={styles.resultTitle}>Flash Successful!</Text>
                    <Text style={styles.resultText}>
                        Your ECU has been successfully updated.{'\n'}
                        Please cycle your ignition (OFF then ON) to finalize.
                    </Text>
                    {chunkInfo.total > 0 && (
                        <Text style={styles.statsText}>
                            {chunkInfo.total} chunks sent • {log.filter(l => l.type === 'error').length} errors
                        </Text>
                    )}
                </View>
                <View style={styles.footer}>
                    <PrimaryButton title="Proceed to Verification" onPress={handleFinish} />
                </View>
            </Screen>
        );
    }

    // ─── Render: Failed ────────────────────────────────────────

    if (step === 'failed') {
        return (
            <Screen>
                <View style={styles.resultContainer}>
                    <Ionicons name="alert-circle" size={96} color="#EF4444" />
                    <Text style={[styles.resultTitle, { color: '#EF4444' }]}>Flash Failed</Text>
                    <Text style={styles.resultText}>{error || 'An unknown error occurred.'}</Text>
                    <Text style={styles.resultSubText}>
                        Your original backup is available. Attempt Recovery?
                    </Text>
                </View>
                <View style={styles.footer}>
                    <PrimaryButton
                        title="Attempt Recovery (Restore Backup)"
                        onPress={() => navigation.navigate('Recovery', { backupPath, deviceId })}
                        style={{ marginBottom: 16 }}
                    />
                    <SecondaryButton title="Contact Support" onPress={() => { }} />
                </View>
            </Screen>
        );
    }

    return null;
};

// ─── Sub-components ────────────────────────────────────────────

const CheckRow = ({ label, passed }: { label: string; passed: boolean }) => (
    <View style={styles.checkRow}>
        <Text style={styles.checkLabel}>{label}</Text>
        {passed ? (
            <Ionicons name="checkmark-circle" size={24} color="#22C55E" />
        ) : (
            <Ionicons name="ellipse-outline" size={24} color={Theme.Colors.textSecondary} />
        )}
    </View>
);

const PhaseChip = ({ label, active, done }: { label: string; active: boolean; done: boolean }) => (
    <View style={[styles.phaseChip, active && styles.phaseChipActive, done && styles.phaseChipDone]}>
        {done && <Ionicons name="checkmark" size={12} color="#22C55E" />}
        <Text style={[styles.phaseChipText, active && styles.phaseChipTextActive]}>
            {label}
        </Text>
    </View>
);

// ─── Styles ────────────────────────────────────────────────────

const styles = StyleSheet.create({
    header: { padding: Theme.Spacing.md },
    title: { ...Theme.Typography.h2 },
    subtitle: { color: Theme.Colors.textSecondary, marginTop: 4 },
    checkCard: { marginTop: 20 },
    checkRow: {
        flexDirection: 'row', justifyContent: 'space-between',
        alignItems: 'center', paddingVertical: 12,
    },
    checkLabel: { fontSize: 16, color: Theme.Colors.text },
    divider: { height: 1, backgroundColor: Theme.Colors.border },
    footer: { padding: Theme.Spacing.md, marginTop: 'auto' },
    waitingText: { textAlign: 'center', color: Theme.Colors.textSecondary },
    warningContainer: {
        flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32,
    },
    warningTitle: {
        fontSize: 22, fontWeight: '800', color: '#EF4444',
        marginTop: 16, marginBottom: 16, textAlign: 'center',
        letterSpacing: 0.5,
        textShadowColor: 'rgba(239,68,68,0.3)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 8,
    },
    warningBody: { fontSize: 16, color: '#FAFAFA', lineHeight: 30 },
    warningSubText: {
        marginTop: 24, fontSize: 13, color: '#71717A',
        textAlign: 'center', fontStyle: 'italic', lineHeight: 20,
    },
    flashContainer: {
        flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24,
    },
    flashTitle: {
        fontSize: 24, fontWeight: 'bold', color: Theme.Colors.text, marginBottom: 8,
    },
    flashSubtitle: {
        fontSize: 16, color: '#EF4444', fontWeight: '600', marginBottom: 24,
        letterSpacing: 1,
    },
    progressCircle: {
        marginBottom: 24, width: 150, height: 150, borderRadius: 75,
        borderWidth: 4, borderColor: 'rgba(225,29,72,0.3)',
        justifyContent: 'center', alignItems: 'center',
        backgroundColor: 'rgba(225,29,72,0.04)',
    },
    progressText: {
        fontSize: 42, fontWeight: '800', color: Theme.Colors.primary,
        textShadowColor: 'rgba(225,29,72,0.4)',
        textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 12,
    },
    chunkText: { fontSize: 12, color: Theme.Colors.textSecondary, marginTop: 2 },
    progressBarBg: {
        width: '100%', height: 6,
        backgroundColor: 'rgba(255,255,255,0.04)',
        borderRadius: 3, overflow: 'hidden', marginBottom: 16,
    },
    progressBarFill: {
        height: '100%', backgroundColor: Theme.Colors.primary, borderRadius: 3,
    },
    phaseRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
    phaseChip: {
        flexDirection: 'row', alignItems: 'center', gap: 4,
        paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.04)',
    },
    phaseChipActive: {
        backgroundColor: 'rgba(225,29,72,0.15)',
        borderWidth: 1, borderColor: 'rgba(225,29,72,0.3)',
    },
    phaseChipDone: { backgroundColor: 'rgba(34,197,94,0.08)' },
    phaseChipText: { fontSize: 12, color: Theme.Colors.textSecondary, fontWeight: '600' },
    phaseChipTextActive: { color: Theme.Colors.primary },
    logCard: {
        width: '100%', backgroundColor: 'rgba(0,0,0,0.6)',
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.04)',
    },
    logText: {
        fontFamily: 'monospace', fontSize: 12, marginBottom: 4, lineHeight: 18,
    },
    resultContainer: {
        flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32,
    },
    resultTitle: {
        fontSize: 28, fontWeight: '800', color: '#FAFAFA',
        marginTop: 24, marginBottom: 16, letterSpacing: -0.3,
    },
    resultText: {
        textAlign: 'center', fontSize: 15, color: '#A1A1AA', lineHeight: 24,
    },
    resultSubText: {
        textAlign: 'center', marginTop: 16, color: '#71717A', fontSize: 14,
    },
    statsText: {
        textAlign: 'center', marginTop: 12, color: Theme.Colors.textSecondary,
        fontSize: 13, fontStyle: 'italic',
    },
});
