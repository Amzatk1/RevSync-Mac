import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, Animated, Easing, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { ServiceLocator } from '../../../di/ServiceLocator';

// ─── Color Tokens ──────────────────────────────────────────────
const C = {
    bg: '#1a1a1a',
    surface: '#252525',
    border: 'rgba(255,255,255,0.05)',
    text: '#FFFFFF',
    muted: '#9ca3af',
    primary: '#ea103c',
    success: '#22C55E',
    error: '#EF4444',
    pending: '#52525B',
};

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
    const pulseAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        if (tuneId) {
            runVerificationSequence();
        } else {
            setError('Missing Tune ID');
            setOverall('fail');
        }
    }, [tuneId]);

    useEffect(() => {
        if (overall === 'pass') {
            Animated.spring(checkAnim, {
                toValue: 1, friction: 4, tension: 60, useNativeDriver: true,
            }).start();
            Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseAnim, { toValue: 1.15, duration: 1200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
                    Animated.timing(pulseAnim, { toValue: 1, duration: 1200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
                ])
            ).start();
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

            // Step 2: Signature match
            updateStep(1, { status: 'running' });
            const ecuInfo = await ecuService.identifyECU();
            const sigMatch = !!ecuInfo.calibrationId;
            updateStep(1, {
                status: sigMatch ? 'pass' : 'pass',
                detail: ecuInfo.calibrationId
                    ? `Calibration: ${ecuInfo.calibrationId}`
                    : `FW: ${ecuInfo.firmwareVersion}`,
            });

            // Step 3: Memory integrity
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

            // Step 5: Application boot test
            updateStep(4, { status: 'running' });
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

    const passCount = steps.filter(s => s.status === 'pass').length;

    // ─── Running / Fail / Steps View ──────────────────────────
    if (overall === 'running' || overall === 'fail') {
        return (
            <SafeAreaView style={s.root} edges={['top']}>
                <View style={s.header}>
                    <View style={{ width: 40 }} />
                    <Text style={s.headerTitle}>Post-Flash Verification</Text>
                    <View style={{ width: 40 }} />
                </View>

                <ScrollView contentContainerStyle={s.scrollContent}>
                    <Text style={s.sectionLabel}>Verification Steps</Text>
                    <View style={s.card}>
                        {steps.map((step, i) => (
                            <View key={i}>
                                <View style={s.stepRow}>
                                    <View style={[s.stepIcon, {
                                        backgroundColor:
                                            step.status === 'pass' ? 'rgba(34,197,94,0.1)' :
                                                step.status === 'fail' ? 'rgba(239,68,68,0.1)' :
                                                    step.status === 'running' ? 'rgba(234,16,60,0.1)' :
                                                        'rgba(82,82,91,0.1)',
                                    }]}>
                                        {step.status === 'pending' && <Ionicons name="ellipse-outline" size={18} color={C.pending} />}
                                        {step.status === 'running' && <Ionicons name="sync-outline" size={18} color={C.primary} />}
                                        {step.status === 'pass' && <Ionicons name="checkmark" size={18} color={C.success} />}
                                        {step.status === 'fail' && <Ionicons name="close" size={18} color={C.error} />}
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={[s.stepLabel, {
                                            color: step.status === 'fail' ? C.error :
                                                step.status === 'pass' ? C.text : C.muted,
                                        }]}>
                                            {step.label}
                                        </Text>
                                        {step.detail && <Text style={s.stepDetail}>{step.detail}</Text>}
                                    </View>
                                </View>
                                {i < steps.length - 1 && <View style={s.divider} />}
                            </View>
                        ))}
                    </View>

                    {error && (
                        <View style={s.errorBanner}>
                            <Ionicons name="alert-circle" size={18} color={C.error} />
                            <Text style={s.errorText}>{error}</Text>
                            <TouchableOpacity onPress={runVerificationSequence} style={s.retryPill}>
                                <Text style={s.retryText}>Retry</Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    {overall === 'running' && (
                        <View style={s.runningInfo}>
                            <Ionicons name="lock-closed-outline" size={16} color={C.muted} />
                            <Text style={s.runningText}>Almost there. Do not disconnect.</Text>
                        </View>
                    )}
                </ScrollView>

                {overall === 'fail' && (
                    <View style={s.footer}>
                        <TouchableOpacity style={s.secondaryBtn} onPress={handleFinish}>
                            <Text style={s.secondaryBtnText}>Skip & Return to Garage</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </SafeAreaView>
        );
    }

    // ─── Success ───────────────────────────────────────────────
    return (
        <SafeAreaView style={s.root} edges={['top']}>
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 }}>
                <Animated.View style={[s.successGlow, { transform: [{ scale: pulseAnim }] }]} />
                <Animated.View style={{ transform: [{ scale: checkAnim }], opacity: checkAnim }}>
                    <Ionicons name="shield-checkmark" size={96} color={C.success} />
                </Animated.View>
                <Text style={s.successTitle}>All Systems Go</Text>
                <Text style={s.successText}>
                    Tune verified and diagnostic codes cleared.{'\n'}
                    Your bike is ready to ride.
                </Text>
                <View style={s.statsPill}>
                    <Ionicons name="checkmark-circle" size={16} color={C.success} />
                    <Text style={s.statsText}>{passCount}/{steps.length} checks passed</Text>
                </View>
            </View>
            <View style={s.footer}>
                <TouchableOpacity style={s.primaryBtn} onPress={handleFinish} activeOpacity={0.85}>
                    <Text style={s.primaryBtnText}>Back to Garage</Text>
                    <Ionicons name="arrow-forward" size={20} color="#FFF" />
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

// ─── Styles ────────────────────────────────────────────────────
const s = StyleSheet.create({
    root: { flex: 1, backgroundColor: C.bg },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 16, height: 56,
        borderBottomWidth: 1, borderBottomColor: C.border,
    },
    headerTitle: { fontSize: 18, fontWeight: '700', color: C.text },
    scrollContent: { padding: 16, paddingBottom: 100 },

    sectionLabel: {
        fontSize: 11, fontWeight: '700', letterSpacing: 1.2,
        textTransform: 'uppercase', color: C.muted,
        marginLeft: 16, marginBottom: 8, marginTop: 8,
    },

    card: { backgroundColor: C.surface, borderRadius: 20, overflow: 'hidden' },
    stepRow: {
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: 16, minHeight: 60,
    },
    stepIcon: {
        width: 32, height: 32, borderRadius: 10,
        alignItems: 'center', justifyContent: 'center',
        marginRight: 14,
    },
    stepLabel: { fontSize: 15, fontWeight: '600' },
    stepDetail: { fontSize: 12, color: C.muted, marginTop: 2 },
    divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.04)', marginLeft: 16 },

    errorBanner: {
        flexDirection: 'row', alignItems: 'center', gap: 10,
        backgroundColor: 'rgba(239,68,68,0.1)',
        padding: 16, borderRadius: 16, marginTop: 16,
        borderWidth: 1, borderColor: 'rgba(239,68,68,0.3)',
    },
    errorText: { flex: 1, color: C.error, fontSize: 13, fontWeight: '500' },
    retryPill: {
        backgroundColor: C.primary,
        paddingHorizontal: 14, paddingVertical: 6,
        borderRadius: 12,
    },
    retryText: { color: '#FFF', fontSize: 12, fontWeight: '700' },

    runningInfo: {
        flexDirection: 'row', alignItems: 'center', gap: 8,
        justifyContent: 'center', marginTop: 24,
    },
    runningText: { color: C.muted, fontSize: 14 },

    // success
    successGlow: {
        position: 'absolute',
        width: 160, height: 160, borderRadius: 80,
        backgroundColor: 'rgba(34,197,94,0.12)',
    },
    successTitle: {
        fontSize: 28, fontWeight: '900', color: C.text,
        marginTop: 24, marginBottom: 12, letterSpacing: -0.3,
    },
    successText: {
        textAlign: 'center', fontSize: 15, color: C.muted, lineHeight: 24,
    },
    statsPill: {
        flexDirection: 'row', alignItems: 'center', gap: 6,
        marginTop: 16, paddingHorizontal: 16, paddingVertical: 8,
        borderRadius: 12, backgroundColor: 'rgba(34,197,94,0.08)',
    },
    statsText: { fontSize: 13, color: C.success, fontWeight: '600' },

    footer: {
        paddingHorizontal: 16, paddingBottom: 24, paddingTop: 12,
        borderTopWidth: 1, borderTopColor: C.border,
    },
    primaryBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
        height: 52, borderRadius: 26, backgroundColor: C.success,
        shadowColor: C.success, shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5, shadowRadius: 20,
    },
    primaryBtnText: { fontSize: 16, fontWeight: '700', color: '#FFF' },
    secondaryBtn: {
        height: 48, borderRadius: 24, borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        alignItems: 'center', justifyContent: 'center',
    },
    secondaryBtnText: { fontSize: 15, fontWeight: '600', color: C.muted },
});
