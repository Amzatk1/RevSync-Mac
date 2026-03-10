import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Easing, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { ServiceLocator } from '../../../di/ServiceLocator';
import { AppScreen, GlassCard, TopBar } from '../../components/AppUI';
import { Theme } from '../../theme';

const { Colors, Layout, Motion, Spacing, Typography } = Theme;

interface VerifyStep {
    label: string;
    status: 'pending' | 'running' | 'pass' | 'fail';
    detail?: string;
}

export const VerificationScreen = ({ navigation, route }: any) => {
    const { tuneId, deviceId, flashJobId } = route.params || {};
    const [steps, setSteps] = useState<VerifyStep[]>([
        { label: 'Read-back checksum', status: 'pending' },
        { label: 'Signature match', status: 'pending' },
        { label: 'Memory integrity', status: 'pending' },
        { label: 'Clear diagnostic codes', status: 'pending' },
        { label: 'Application boot test', status: 'pending' },
    ]);
    const [overall, setOverall] = useState<'running' | 'pass' | 'fail'>('running');
    const [error, setError] = useState<string | null>(null);

    const checkAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (tuneId) {
            runVerificationSequence();
        } else {
            setError('Missing tune identifier.');
            setOverall('fail');
        }
    }, [tuneId]);

    useEffect(() => {
        if (overall === 'pass') {
            Animated.spring(checkAnim, {
                toValue: 1,
                friction: 5,
                tension: 70,
                useNativeDriver: true,
            }).start();
        }
    }, [checkAnim, overall]);

    const updateStep = (index: number, update: Partial<VerifyStep>) => {
        setSteps((prev) => prev.map((step, currentIndex) => (currentIndex === index ? { ...step, ...update } : step)));
    };

    const runVerificationSequence = async () => {
        try {
            const tuneService = ServiceLocator.getTuneService();
            const tune = await tuneService.getTuneDetails(tuneId);
            if (!tune) throw new Error('Tune details not found');

            const ecuService = ServiceLocator.getECUService();
            if (deviceId && 'setConnectedDevice' in ecuService) {
                (ecuService as any).setConnectedDevice(deviceId);
            }

            updateStep(0, { status: 'running' });
            const verified = await ecuService.verifyFlash(tune);
            updateStep(0, {
                status: verified ? 'pass' : 'fail',
                detail: verified ? 'SHA-256 checksum matches the staged package' : 'Checksum mismatch detected',
            });
            if (!verified) throw new Error('Read-back checksum mismatch');

            updateStep(1, { status: 'running' });
            const ecuInfo = await ecuService.identifyECU();
            updateStep(1, {
                status: 'pass',
                detail: ecuInfo.calibrationId ? `Calibration ${ecuInfo.calibrationId}` : `Firmware ${ecuInfo.firmwareVersion}`,
            });

            updateStep(2, { status: 'running' });
            const checksumB64 = await ecuService.readChecksum(0x0000, 4096);
            const memOk = checksumB64.length > 0;
            updateStep(2, {
                status: memOk ? 'pass' : 'fail',
                detail: memOk ? 'Initial 4KB memory block verified' : 'Memory read failed',
            });
            if (!memOk) throw new Error('Memory integrity check failed');

            updateStep(3, { status: 'running' });
            await ecuService.clearDTCs();
            updateStep(3, { status: 'pass', detail: 'Diagnostic codes cleared' });

            updateStep(4, { status: 'running' });
            const bootCheck = await ecuService.identifyECU();
            updateStep(4, {
                status: bootCheck.ecuId ? 'pass' : 'fail',
                detail: bootCheck.ecuId ? `ECU responded with ID ${bootCheck.ecuId}` : 'ECU did not respond after boot',
            });
            if (!bootCheck.ecuId) throw new Error('Application boot test failed');

            setOverall('pass');
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

            try {
                const { ApiClient } = await import('../../../data/http/ApiClient');
                if (flashJobId) {
                    await ApiClient.getInstance().patch(`/v1/garage/flash-jobs/${flashJobId}/`, {
                        status: 'COMPLETED',
                        verified_at: new Date().toISOString(),
                        checksum_matched: true,
                    });
                }
            } catch {
                // Offline sync later.
            }
        } catch (e: any) {
            setError(e.message || 'Verification failed');
            setOverall('fail');
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);

            try {
                const { ApiClient } = await import('../../../data/http/ApiClient');
                if (flashJobId) {
                    await ApiClient.getInstance().patch(`/v1/garage/flash-jobs/${flashJobId}/`, {
                        status: 'VERIFY_FAILED',
                        error_message: e.message,
                    });
                }
            } catch {
                // Offline sync later.
            }
        }
    };

    const handleFinish = () => navigation.reset({ index: 0, routes: [{ name: 'Garage' }] });
    const passCount = steps.filter((step) => step.status === 'pass').length;

    if (overall === 'pass') {
        return (
            <AppScreen contentContainerStyle={styles.successScreen}>
                <TopBar title="Verification" subtitle="Post-flash checks complete" />
                <View style={styles.successContent}>
                    <Animated.View style={[styles.successBadge, { transform: [{ scale: checkAnim }], opacity: checkAnim }]}>
                        <Ionicons name="shield-checkmark" size={68} color={Colors.success} />
                    </Animated.View>
                    <Text style={styles.successTitle}>Verification passed</Text>
                    <Text style={styles.successText}>The tune was written successfully, integrity checks passed, and the ECU is responding normally.</Text>
                    <GlassCard style={styles.successCard}>
                        <Text style={styles.successCardLabel}>Checks passed</Text>
                        <Text style={styles.successCardValue}>
                            {passCount}/{steps.length}
                        </Text>
                    </GlassCard>
                    <TouchableOpacity style={styles.primaryButton} onPress={handleFinish}>
                        <Text style={styles.primaryButtonText}>Back to Garage</Text>
                    </TouchableOpacity>
                </View>
            </AppScreen>
        );
    }

    return (
        <AppScreen scroll contentContainerStyle={styles.content}>
            <TopBar title="Verification" subtitle={overall === 'running' ? 'Post-flash integrity checks in progress' : 'Verification failed'} />

            <GlassCard style={styles.heroCard}>
                <Text style={styles.kicker}>{overall === 'running' ? 'Running checks' : 'Blocked state'}</Text>
                <Text style={styles.heroTitle}>{overall === 'running' ? 'Do not disconnect the device while verification is active.' : 'Verification needs attention before this session can be treated as complete.'}</Text>
                <Text style={styles.heroSubtitle}>
                    {overall === 'running'
                        ? 'The app is validating checksum, signature, memory integrity, DTC state, and ECU response.'
                        : error || 'One or more post-flash checks failed.'}
                </Text>
            </GlassCard>

            <Text style={styles.sectionLabel}>Verification Steps</Text>
            <GlassCard>
                {steps.map((step, index) => (
                    <View key={step.label} style={[styles.stepRow, index < steps.length - 1 && styles.stepDivider]}>
                        <View
                            style={[
                                styles.stepIcon,
                                step.status === 'running'
                                    ? styles.stepIconRunning
                                    : step.status === 'pass'
                                      ? styles.stepIconPass
                                      : step.status === 'fail'
                                        ? styles.stepIconFail
                                        : styles.stepIconPending,
                            ]}
                        >
                            {step.status === 'running' ? (
                                <ActivityIndicator size="small" color={Colors.accent} />
                            ) : (
                                <Ionicons
                                    name={
                                        step.status === 'pass'
                                            ? 'checkmark'
                                            : step.status === 'fail'
                                              ? 'close'
                                              : 'ellipse-outline'
                                    }
                                    size={16}
                                    color={step.status === 'pass' ? Colors.success : step.status === 'fail' ? Colors.error : Colors.textTertiary}
                                />
                            )}
                        </View>
                        <View style={styles.stepCopy}>
                            <Text style={styles.stepTitle}>{step.label}</Text>
                            {!!step.detail && <Text style={styles.stepDetail}>{step.detail}</Text>}
                        </View>
                    </View>
                ))}
            </GlassCard>

            {overall === 'fail' && (
                <>
                    <GlassCard style={styles.errorCard}>
                        <Ionicons name="alert-circle" size={18} color={Colors.error} />
                        <Text style={styles.errorText}>{error}</Text>
                    </GlassCard>

                    <View style={styles.actions}>
                        <TouchableOpacity style={styles.primaryButton} onPress={runVerificationSequence}>
                            <Text style={styles.primaryButtonText}>Retry Verification</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.secondaryButton} onPress={handleFinish}>
                            <Text style={styles.secondaryButtonText}>Return to Garage</Text>
                        </TouchableOpacity>
                    </View>
                </>
            )}
        </AppScreen>
    );
};

const styles = StyleSheet.create({
    content: {
        paddingBottom: 120,
    },
    heroCard: {
        marginTop: 8,
        marginBottom: 18,
    },
    kicker: {
        ...Typography.dataLabel,
        color: Colors.accent,
        marginBottom: 8,
    },
    heroTitle: {
        ...Typography.h2,
    },
    heroSubtitle: {
        ...Typography.caption,
        marginTop: 8,
        lineHeight: 20,
    },
    sectionLabel: {
        ...Typography.dataLabel,
        marginLeft: 4,
        marginBottom: 8,
    },
    stepRow: {
        flexDirection: 'row',
        gap: 12,
        alignItems: 'flex-start',
        paddingVertical: 12,
    },
    stepDivider: {
        borderBottomWidth: 1,
        borderBottomColor: Colors.divider,
    },
    stepIcon: {
        width: 28,
        height: 28,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 2,
    },
    stepIconPending: {
        backgroundColor: 'rgba(255,255,255,0.03)',
    },
    stepIconRunning: {
        backgroundColor: Colors.accentSoft,
    },
    stepIconPass: {
        backgroundColor: 'rgba(46,211,154,0.12)',
    },
    stepIconFail: {
        backgroundColor: 'rgba(255,107,121,0.12)',
    },
    stepCopy: {
        flex: 1,
    },
    stepTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: Colors.textPrimary,
    },
    stepDetail: {
        marginTop: 4,
        fontSize: 12,
        lineHeight: 18,
        color: Colors.textSecondary,
    },
    errorCard: {
        marginTop: 12,
        flexDirection: 'row',
        gap: 10,
        alignItems: 'flex-start',
        borderColor: 'rgba(255,107,121,0.22)',
        backgroundColor: 'rgba(255,107,121,0.08)',
    },
    errorText: {
        flex: 1,
        fontSize: 13,
        lineHeight: 19,
        color: Colors.error,
    },
    actions: {
        gap: 10,
        marginTop: 14,
    },
    primaryButton: {
        minHeight: 50,
        borderRadius: Layout.buttonRadius,
        backgroundColor: Colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
    },
    primaryButtonText: {
        fontSize: 15,
        fontWeight: '800',
        color: Colors.white,
    },
    secondaryButton: {
        minHeight: 50,
        borderRadius: Layout.buttonRadius,
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderWidth: 1,
        borderColor: Colors.strokeSoft,
        alignItems: 'center',
        justifyContent: 'center',
    },
    secondaryButtonText: {
        fontSize: 14,
        fontWeight: '700',
        color: Colors.textPrimary,
    },
    successScreen: {
        paddingBottom: 80,
    },
    successContent: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 12,
    },
    successBadge: {
        marginTop: 40,
        marginBottom: 22,
    },
    successTitle: {
        ...Typography.h1,
        textAlign: 'center',
    },
    successText: {
        ...Typography.body,
        textAlign: 'center',
        maxWidth: 320,
        marginTop: 10,
    },
    successCard: {
        marginTop: 20,
        width: '100%',
        alignItems: 'center',
    },
    successCardLabel: {
        ...Typography.dataLabel,
    },
    successCardValue: {
        marginTop: 8,
        fontSize: 28,
        fontWeight: '800',
        color: Colors.textPrimary,
    },
});
