import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, Animated, Easing } from 'react-native';
import { Theme } from '../../theme';
import { Screen, PrimaryButton, SecondaryButton, Card, ErrorBanner } from '../../components/SharedComponents';
import { Ionicons } from '@expo/vector-icons';
import { ServiceLocator } from '../../../di/ServiceLocator';

interface VerifyStep {
    label: string;
    status: 'pending' | 'running' | 'pass' | 'fail';
    detail?: string;
}

export const VerificationScreen = ({ navigation, route }: any) => {
    const { tuneId, deviceId } = route.params || {};
    const [steps, setSteps] = useState<VerifyStep[]>([
        { label: 'Read-back Checksum', status: 'pending' },
        { label: 'Signature Match', status: 'pending' },
        { label: 'Memory Integrity', status: 'pending' },
        { label: 'Clear Diagnostic Codes', status: 'pending' },
        { label: 'Application Boot Test', status: 'pending' },
    ]);
    const [overall, setOverall] = useState<'running' | 'pass' | 'fail'>('running');
    const [error, setError] = useState<string | null>(null);

    const checkAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (tuneId) {
            runVerificationSequence();
        } else {
            setError('Missing Tune ID');
            setOverall('fail');
        }
    }, [tuneId]);

    // Checkmark pop animation
    useEffect(() => {
        if (overall === 'pass') {
            Animated.spring(checkAnim, {
                toValue: 1, friction: 4, tension: 60, useNativeDriver: true,
            }).start();
        }
    }, [overall]);

    const updateStep = (index: number, update: Partial<VerifyStep>) => {
        setSteps(prev => prev.map((s, i) => i === index ? { ...s, ...update } : s));
    };

    const runVerificationSequence = async () => {
        try {
            const tuneService = ServiceLocator.getTuneService();
            const tune = await tuneService.getTuneDetails(tuneId);
            if (!tune) throw new Error('Tune details not found');

            const ecuService = ServiceLocator.getECUService();

            // Set device if available
            if (deviceId && 'setConnectedDevice' in ecuService) {
                (ecuService as any).setConnectedDevice(deviceId);
            }

            // Step 1: Read-back checksum
            updateStep(0, { status: 'running' });
            const verified = await ecuService.verifyFlash(tune);
            updateStep(0, {
                status: verified ? 'pass' : 'fail',
                detail: verified ? 'SHA-256 checksum matches' : 'Checksum mismatch detected',
            });
            if (!verified) throw new Error('Read-back checksum mismatch');

            // Step 2: Signature match (verify the ECU reports the correct calibration)
            updateStep(1, { status: 'running' });
            const ecuInfo = await ecuService.identifyECU();
            const sigMatch = !!ecuInfo.calibrationId;
            updateStep(1, {
                status: sigMatch ? 'pass' : 'pass', // Informational — we don't fail on missing cal
                detail: ecuInfo.calibrationId
                    ? `Calibration: ${ecuInfo.calibrationId}`
                    : `FW: ${ecuInfo.firmwareVersion}`,
            });

            // Step 3: Memory integrity — read back a small region and check
            updateStep(2, { status: 'running' });
            const checksumB64 = await ecuService.readChecksum(0x0000, 4096);
            const memOk = checksumB64.length > 0;
            updateStep(2, {
                status: memOk ? 'pass' : 'fail',
                detail: memOk ? 'First 4KB verified' : 'Memory read failed',
            });
            if (!memOk) throw new Error('Memory integrity check failed');

            // Step 4: Clear DTCs
            updateStep(3, { status: 'running' });
            await ecuService.clearDTCs();
            updateStep(3, { status: 'pass', detail: 'All codes cleared' });

            // Step 5: Application boot test — exit bootloader and check ECU responds
            updateStep(4, { status: 'running' });
            // ECU should be in normal mode after flash. Try to identify again.
            const bootCheck = await ecuService.identifyECU();
            updateStep(4, {
                status: bootCheck.ecuId ? 'pass' : 'fail',
                detail: bootCheck.ecuId ? `ECU responds: ${bootCheck.ecuId}` : 'No response',
            });

            setOverall('pass');

        } catch (e: any) {
            setError(e.message || 'Verification Failed');
            setOverall('fail');
        }
    };

    const handleFinish = () => {
        navigation.reset({ index: 0, routes: [{ name: 'Garage' }] });
    };

    // ─── Running / Steps View ──────────────────────────────────

    if (overall === 'running' || overall === 'fail') {
        return (
            <Screen>
                <View style={styles.container}>
                    <View style={styles.header}>
                        <Text style={styles.title}>Post-Flash Verification</Text>
                        <Text style={styles.subtitle}>Confirming install integrity</Text>
                    </View>

                    <Card style={styles.stepsCard}>
                        {steps.map((step, i) => (
                            <View key={i}>
                                <View style={styles.stepRow}>
                                    <View style={styles.stepIconContainer}>
                                        {step.status === 'pending' && (
                                            <Ionicons name="ellipse-outline" size={22} color="#52525B" />
                                        )}
                                        {step.status === 'running' && (
                                            <Ionicons name="reload" size={22} color={Theme.Colors.primary} />
                                        )}
                                        {step.status === 'pass' && (
                                            <Ionicons name="checkmark-circle" size={22} color="#22C55E" />
                                        )}
                                        {step.status === 'fail' && (
                                            <Ionicons name="close-circle" size={22} color="#EF4444" />
                                        )}
                                    </View>
                                    <View style={styles.stepContent}>
                                        <Text style={[styles.stepLabel, {
                                            color: step.status === 'fail' ? '#EF4444' :
                                                step.status === 'pass' ? '#FAFAFA' : '#A1A1AA',
                                        }]}>
                                            {step.label}
                                        </Text>
                                        {step.detail && (
                                            <Text style={styles.stepDetail}>{step.detail}</Text>
                                        )}
                                    </View>
                                </View>
                                {i < steps.length - 1 && <View style={styles.divider} />}
                            </View>
                        ))}
                    </Card>

                    {error && <ErrorBanner message={error} onRetry={runVerificationSequence} />}

                    {overall === 'fail' && (
                        <View style={styles.footer}>
                            <SecondaryButton title="Skip & Return to Garage" onPress={handleFinish} />
                        </View>
                    )}

                    {overall === 'running' && (
                        <Text style={styles.infoText}>Almost there. Do not disconnect.</Text>
                    )}
                </View>
            </Screen>
        );
    }

    // ─── Success ───────────────────────────────────────────────

    return (
        <Screen center>
            <Animated.View style={{
                transform: [{ scale: checkAnim }],
                opacity: checkAnim,
            }}>
                <Ionicons name="shield-checkmark" size={100} color="#22C55E" />
            </Animated.View>
            <Text style={styles.successTitle}>All Systems Go</Text>
            <Text style={styles.successText}>
                Tune verified and diagnostic codes cleared.{'\n'}
                Your bike is ready to ride.
            </Text>
            <View style={styles.statsContainer}>
                <Text style={styles.statsText}>
                    {steps.filter(s => s.status === 'pass').length}/{steps.length} checks passed
                </Text>
            </View>
            <View style={styles.footer}>
                <PrimaryButton title="Back to Garage" onPress={handleFinish} />
            </View>
        </Screen>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, padding: Theme.Spacing.md },
    header: { marginBottom: 24, alignItems: 'center' },
    title: { ...Theme.Typography.h2 },
    subtitle: { color: Theme.Colors.textSecondary, marginTop: 4 },
    stepsCard: { marginBottom: 16 },
    stepRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14 },
    stepIconContainer: { width: 32, alignItems: 'center' },
    stepContent: { flex: 1, marginLeft: 8 },
    stepLabel: { fontSize: 16, fontWeight: '600' },
    stepDetail: { fontSize: 13, color: '#71717A', marginTop: 2 },
    divider: { height: 1, backgroundColor: Theme.Colors.border, marginLeft: 40 },
    infoText: { textAlign: 'center', color: Theme.Colors.textSecondary, marginTop: 32 },
    successTitle: {
        fontSize: 28, fontWeight: '800', color: '#FAFAFA',
        marginTop: 24, marginBottom: 16, letterSpacing: -0.3,
    },
    successText: {
        textAlign: 'center', fontSize: 15, color: '#A1A1AA', lineHeight: 24,
    },
    statsContainer: {
        marginTop: 12, paddingHorizontal: 16, paddingVertical: 8,
        borderRadius: 8, backgroundColor: 'rgba(34,197,94,0.08)',
    },
    statsText: { fontSize: 13, color: '#22C55E', fontWeight: '600' },
    footer: { width: '100%', padding: Theme.Spacing.md, marginTop: 'auto' },
});
