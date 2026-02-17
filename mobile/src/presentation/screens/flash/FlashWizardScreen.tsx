import React, { useState, useEffect, useRef } from 'react';
import {
    View, Text, StyleSheet, Alert, BackHandler, ScrollView,
    Animated, Easing, TouchableOpacity, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ServiceLocator } from '../../../di/ServiceLocator';
import { useAppStore } from '../../store/useAppStore';
import { useSettingsStore } from '../../store/useSettingsStore';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

// ─── Types ─────────────────────────────────────────────────────

type WizardStep = 'pre-checks' | 'confirmation' | 'bootloader' | 'flashing' | 'verifying' | 'success' | 'failed';

interface FlashLog {
    timestamp: number;
    message: string;
    type: 'info' | 'success' | 'error' | 'warn';
}

const C = {
    bg: '#1a1a1a',
    surface: '#252525',
    primary: '#ea103c',
    white: '#ffffff',
    textMuted: '#a3a3a3',
    textDim: '#737373',
    green: '#22c55e',
    red: '#ef4444',
    yellow: '#f59e0b',
    border: 'rgba(255,255,255,0.05)',
};

// ─── Component ─────────────────────────────────────────────────

export const FlashWizardScreen = ({ navigation, route }: any) => {
    const { tuneId, backupPath, versionId, deviceId } = route.params || {};
    const { safetyModeEnabled } = useSettingsStore();

    const [step, setStep] = useState<WizardStep>('pre-checks');
    const [checks, setChecks] = useState({ battery: false, ignition: false, backup: false, package: false });
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
                Alert.alert('⛔ CRITICAL WARNING',
                    'Interrupting the flash process NOW WILL BRICK YOUR ECU.\n\nDo not exit this screen.',
                    [{ text: 'I Understand', style: 'cancel' }]);
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
                        toValue: 1.05, duration: 800, easing: Easing.inOut(Easing.sin), useNativeDriver: true,
                    }),
                    Animated.timing(progressPulse, {
                        toValue: 1, duration: 800, easing: Easing.inOut(Easing.sin), useNativeDriver: true,
                    }),
                ])
            ).start();
        }
    }, [step]);

    // Auto-scroll log
    useEffect(() => {
        setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    }, [log]);

    useEffect(() => { if (step === 'pre-checks') runPreChecks(); }, []);

    const addLog = (message: string, type: FlashLog['type'] = 'info') => {
        setLog(prev => [...prev, { timestamp: Date.now(), message, type }]);
    };

    const runPreChecks = async () => {
        if (!safetyModeEnabled) {
            setChecks({ battery: true, ignition: true, backup: true, package: true });
            return;
        }
        setTimeout(() => setChecks(prev => ({ ...prev, battery: true })), 500);
        setTimeout(() => setChecks(prev => ({ ...prev, ignition: true })), 1200);
        setTimeout(() => setChecks(prev => ({ ...prev, backup: !!backupPath })), 1800);
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
            if (deviceId && 'setConnectedDevice' in ecuService) {
                (ecuService as any).setConnectedDevice(deviceId);
            }
            addLog('Tune loaded: ' + tune.title, 'info');
            addLog('Entering bootloader mode...', 'info');
            setStep('flashing');
            await ecuService.flashTune(tune, backupPath, (pct, msg) => {
                setProgress(pct);
                if (msg) {
                    const chunkMatch = msg.match(/Chunk (\d+)\/(\d+)/);
                    if (chunkMatch) {
                        setChunkInfo({ sent: parseInt(chunkMatch[1]), total: parseInt(chunkMatch[2]) });
                    }
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

    const handleFinish = () => navigation.navigate('Verification', { tuneId });

    // ─── Pre-Checks ────────────────────────────────────────────
    if (step === 'pre-checks') {
        return (
            <View style={s.root}>
                <SafeAreaView edges={['top']}>
                    <View style={s.header}>
                        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
                            <Ionicons name="arrow-back" size={20} color={C.white} />
                        </TouchableOpacity>
                        <Text style={s.headerTitle}>Flash Wizard</Text>
                        <View style={{ width: 40 }} />
                    </View>
                </SafeAreaView>
                <View style={s.centeredContent}>
                    <Text style={s.sectionTitle}>Pre-Flash Checks</Text>
                    <Text style={s.sectionSub}>Ensuring safe conditions</Text>
                    <View style={s.checksCard}>
                        <CheckRow label="Battery Voltage (>12.5V)" passed={checks.battery} />
                        <View style={s.divider} />
                        <CheckRow label="Ignition ON, Engine OFF" passed={checks.ignition} />
                        <View style={s.divider} />
                        <CheckRow label="ECU Backup Created" passed={checks.backup} />
                        <View style={s.divider} />
                        <CheckRow label="Verified Tune Package" passed={checks.package} />
                    </View>
                    {allChecksPassed ? (
                        <TouchableOpacity style={s.primaryBtn} onPress={() => setStep('confirmation')} activeOpacity={0.85}>
                            <Text style={s.primaryBtnText}>Continue</Text>
                        </TouchableOpacity>
                    ) : (
                        <Text style={s.waitingText}>Checking vehicle status...</Text>
                    )}
                </View>
            </View>
        );
    }

    // ─── Confirmation ──────────────────────────────────────────
    if (step === 'confirmation') {
        return (
            <View style={s.root}>
                <SafeAreaView edges={['top']}>
                    <View style={s.header}>
                        <TouchableOpacity style={s.backBtn} onPress={() => setStep('pre-checks')}>
                            <Ionicons name="arrow-back" size={20} color={C.white} />
                        </TouchableOpacity>
                        <Text style={s.headerTitle}>Flash Wizard</Text>
                        <View style={{ width: 40 }} />
                    </View>
                </SafeAreaView>
                <View style={s.centeredContent}>
                    <Ionicons name="warning-outline" size={64} color={C.red} />
                    <Text style={s.dangerTitle}>CRITICAL SAFETY WARNING</Text>
                    <View style={s.warningBox}>
                        <Text style={s.warningText}>1. Do not turn off the ignition.</Text>
                        <Text style={s.warningText}>2. Do not unplug the cable/adapter.</Text>
                        <Text style={s.warningText}>3. Do not minimize this app.</Text>
                        <Text style={s.warningText}>4. Ensure phone battery is charged.</Text>
                        <Text style={s.warningText}>5. Do not move away from your bike.</Text>
                    </View>
                    <Text style={s.warningFooter}>
                        Failure to follow these instructions may result in a non-functional ECU (bricked bike).
                    </Text>
                </View>
                <LinearGradient colors={['transparent', C.bg]} style={s.bottomActions}>
                    <SafeAreaView edges={['bottom']}>
                        <TouchableOpacity style={s.secondaryBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}>
                            <Text style={s.secondaryBtnText}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[s.primaryBtn, { backgroundColor: '#DC2626' }]}
                            onPress={handleStartFlash}
                            activeOpacity={0.85}
                        >
                            <Ionicons name="flash" size={20} color="#FFF" />
                            <Text style={s.primaryBtnText}>I Understand, Flash Tune</Text>
                        </TouchableOpacity>
                    </SafeAreaView>
                </LinearGradient>
            </View>
        );
    }

    // ─── Flashing ──────────────────────────────────────────────
    if (step === 'bootloader' || step === 'flashing' || step === 'verifying') {
        const phaseLabel = step === 'bootloader' ? 'Entering Bootloader...'
            : step === 'verifying' ? 'Verifying Flash...' : 'FLASHING ECU';

        return (
            <View style={s.root}>
                <SafeAreaView edges={['top']}>
                    <View style={s.header}>
                        <View style={[s.backBtn, { opacity: 0.3 }]}>
                            <Ionicons name="arrow-back" size={20} color={C.white} />
                        </View>
                        <Text style={s.headerTitle}>Flash Wizard</Text>
                        <View style={{ width: 40 }} />
                    </View>
                </SafeAreaView>

                <View style={s.flashContent}>
                    {/* Warning Banner */}
                    <View style={s.flashWarningBadge}>
                        <Ionicons name="warning" size={14} color={C.red} />
                        <Text style={s.flashWarningText}>{phaseLabel}</Text>
                    </View>

                    {/* Progress Circle */}
                    <Animated.View style={[s.progressCircle, { transform: [{ scale: progressPulse }] }]}>
                        <Text style={s.progressPercent}>{Math.round(progress)}%</Text>
                        {chunkInfo.total > 0 && (
                            <Text style={s.chunkText}>{chunkInfo.sent}/{chunkInfo.total}</Text>
                        )}
                    </Animated.View>

                    {/* Phase Chips */}
                    <View style={s.phaseRow}>
                        <PhaseChip label="Erase" active={step === 'bootloader'} done={step !== 'bootloader'} />
                        <PhaseChip label="Write" active={step === 'flashing'} done={step === 'verifying'} />
                        <PhaseChip label="Verify" active={step === 'verifying'} done={false} />
                    </View>

                    {/* Progress Bar */}
                    <View style={s.progressBarBg}>
                        <View style={[s.progressBarFill, { width: `${progress}%` }]} />
                    </View>

                    {/* Terminal Log */}
                    <View style={s.logCard}>
                        <View style={s.logHeader}>
                            <View style={s.logDot} />
                            <Text style={s.logTitle}>Terminal</Text>
                        </View>
                        <ScrollView ref={scrollRef} style={{ maxHeight: 160 }}>
                            {log.map((entry, i) => (
                                <Text key={i} style={[s.logText, {
                                    color: entry.type === 'error' ? C.red
                                        : entry.type === 'success' ? C.green
                                            : entry.type === 'warn' ? C.yellow : '#4ADE80',
                                }]}>{`> ${entry.message}`}</Text>
                            ))}
                        </ScrollView>
                    </View>
                </View>
            </View>
        );
    }

    // ─── Success ───────────────────────────────────────────────
    if (step === 'success') {
        return (
            <View style={[s.root, { justifyContent: 'center', alignItems: 'center', padding: 32 }]}>
                <View style={s.successCircle}>
                    <Ionicons name="checkmark-done-circle" size={56} color="#FFF" />
                </View>
                <Text style={s.resultTitle}>Flash Successful!</Text>
                <Text style={s.resultDesc}>
                    Your ECU has been successfully updated.{'\n'}
                    Cycle ignition (OFF → ON) to finalize.
                </Text>
                {chunkInfo.total > 0 && (
                    <Text style={s.statsText}>
                        {chunkInfo.total} chunks sent • {log.filter(l => l.type === 'error').length} errors
                    </Text>
                )}
                <TouchableOpacity style={s.primaryBtn} onPress={handleFinish} activeOpacity={0.85}>
                    <Text style={s.primaryBtnText}>Proceed to Verification</Text>
                </TouchableOpacity>
            </View>
        );
    }

    // ─── Failed ────────────────────────────────────────────────
    if (step === 'failed') {
        return (
            <View style={[s.root, { justifyContent: 'center', alignItems: 'center', padding: 32 }]}>
                <View style={s.failCircle}>
                    <Ionicons name="alert-circle" size={56} color="#FFF" />
                </View>
                <Text style={[s.resultTitle, { color: C.red }]}>Flash Failed</Text>
                <Text style={s.resultDesc}>{error || 'An unknown error occurred.'}</Text>
                <Text style={s.resultSubText}>Your original backup is available. Attempt Recovery?</Text>
                <TouchableOpacity
                    style={s.primaryBtn}
                    onPress={() => navigation.navigate('Recovery', { backupPath, deviceId })}
                    activeOpacity={0.85}
                >
                    <Ionicons name="medical" size={20} color="#FFF" />
                    <Text style={s.primaryBtnText}>Attempt Recovery</Text>
                </TouchableOpacity>
                <TouchableOpacity style={s.secondaryBtn} onPress={() => { }} activeOpacity={0.7}>
                    <Text style={s.secondaryBtnText}>Contact Support</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return null;
};

// ─── Sub-components ────────────────────────────────────────────

const CheckRow = ({ label, passed }: { label: string; passed: boolean }) => (
    <View style={s.checkRow}>
        <Text style={s.checkLabel}>{label}</Text>
        <Ionicons
            name={passed ? 'checkmark-circle' : 'ellipse-outline'}
            size={22}
            color={passed ? C.green : C.textDim}
        />
    </View>
);

const PhaseChip = ({ label, active, done }: { label: string; active: boolean; done: boolean }) => (
    <View style={[s.phaseChip, active && s.phaseChipActive, done && s.phaseChipDone]}>
        {done && <Ionicons name="checkmark" size={12} color={C.green} />}
        <Text style={[s.phaseChipText, active && { color: C.primary }]}>{label}</Text>
    </View>
);

// ─── Styles ────────────────────────────────────────────────────

const s = StyleSheet.create({
    root: { flex: 1, backgroundColor: C.bg },

    // Header
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 24, paddingVertical: 12,
    },
    backBtn: {
        width: 40, height: 40, borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.05)',
        alignItems: 'center', justifyContent: 'center',
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)',
    },
    headerTitle: { fontSize: 18, fontWeight: '700', color: C.white },

    centeredContent: {
        flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32,
    },

    // Pre-checks
    sectionTitle: { fontSize: 22, fontWeight: '700', color: C.white, marginBottom: 4 },
    sectionSub: { fontSize: 14, color: C.textMuted, marginBottom: 24 },
    checksCard: {
        width: '100%', backgroundColor: C.surface, borderRadius: 20, padding: 20,
        borderWidth: 1, borderColor: C.border, marginBottom: 24,
    },
    checkRow: {
        flexDirection: 'row', justifyContent: 'space-between',
        alignItems: 'center', paddingVertical: 12,
    },
    checkLabel: { fontSize: 14, color: C.white, fontWeight: '500' },
    divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.04)' },
    waitingText: { fontSize: 14, color: C.textDim, marginTop: 16 },

    // Confirmation
    dangerTitle: {
        fontSize: 20, fontWeight: '800', color: C.red,
        marginTop: 16, marginBottom: 16, textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    warningBox: { marginBottom: 24 },
    warningText: { fontSize: 16, color: C.white, lineHeight: 30 },
    warningFooter: {
        fontSize: 13, color: C.textDim, textAlign: 'center',
        fontStyle: 'italic', lineHeight: 20,
    },

    // Bottom actions
    bottomActions: {
        position: 'absolute', bottom: 0, left: 0, right: 0,
        paddingHorizontal: 24, paddingTop: 48,
    },

    // Flashing
    flashContent: {
        flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24,
    },
    flashWarningBadge: {
        flexDirection: 'row', alignItems: 'center', gap: 8,
        paddingHorizontal: 16, paddingVertical: 8,
        borderRadius: 50, backgroundColor: 'rgba(239,68,68,0.08)',
        borderWidth: 1, borderColor: 'rgba(239,68,68,0.2)',
        marginBottom: 32,
    },
    flashWarningText: {
        fontSize: 13, fontWeight: '700', color: C.red,
        letterSpacing: 1, textTransform: 'uppercase',
    },
    progressCircle: {
        width: 160, height: 160, borderRadius: 80,
        borderWidth: 4, borderColor: 'rgba(234,16,60,0.3)',
        alignItems: 'center', justifyContent: 'center',
        backgroundColor: 'rgba(234,16,60,0.04)',
        marginBottom: 24,
        shadowColor: C.primary, shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.2, shadowRadius: 20,
    },
    progressPercent: {
        fontSize: 42, fontWeight: '800', color: C.primary,
        textShadowColor: 'rgba(234,16,60,0.4)',
        textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 12,
    },
    chunkText: { fontSize: 12, color: C.textDim, marginTop: 2 },
    phaseRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
    phaseChip: {
        flexDirection: 'row', alignItems: 'center', gap: 4,
        paddingHorizontal: 14, paddingVertical: 8, borderRadius: 50,
        backgroundColor: 'rgba(255,255,255,0.04)',
    },
    phaseChipActive: {
        backgroundColor: 'rgba(234,16,60,0.12)',
        borderWidth: 1, borderColor: 'rgba(234,16,60,0.3)',
    },
    phaseChipDone: { backgroundColor: 'rgba(34,197,94,0.08)' },
    phaseChipText: { fontSize: 12, color: C.textDim, fontWeight: '600' },
    progressBarBg: {
        width: '100%', height: 6, borderRadius: 3,
        backgroundColor: 'rgba(255,255,255,0.04)',
        overflow: 'hidden', marginBottom: 20,
    },
    progressBarFill: {
        height: '100%', backgroundColor: C.primary, borderRadius: 3,
    },
    logCard: {
        width: '100%', backgroundColor: 'rgba(0,0,0,0.6)',
        borderRadius: 12, padding: 16,
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.04)',
    },
    logHeader: {
        flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12,
    },
    logDot: {
        width: 8, height: 8, borderRadius: 4, backgroundColor: C.green,
    },
    logTitle: { fontSize: 11, fontWeight: '600', color: C.textDim, textTransform: 'uppercase' },
    logText: {
        fontFamily: Platform.select({ ios: 'Menlo', default: 'monospace' }),
        fontSize: 11, marginBottom: 4, lineHeight: 18,
    },

    // Success / Failed
    successCircle: {
        width: 96, height: 96, borderRadius: 48,
        backgroundColor: C.green, alignItems: 'center', justifyContent: 'center',
        shadowColor: C.green, shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.4, shadowRadius: 20, marginBottom: 24,
    },
    failCircle: {
        width: 96, height: 96, borderRadius: 48,
        backgroundColor: C.red, alignItems: 'center', justifyContent: 'center',
        shadowColor: C.red, shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.4, shadowRadius: 20, marginBottom: 24,
    },
    resultTitle: {
        fontSize: 28, fontWeight: '800', color: C.white,
        marginBottom: 12, letterSpacing: -0.3,
    },
    resultDesc: {
        textAlign: 'center', fontSize: 14, color: C.textMuted, lineHeight: 22,
    },
    resultSubText: {
        textAlign: 'center', marginTop: 16, color: C.textDim, fontSize: 14, marginBottom: 24,
    },
    statsText: {
        textAlign: 'center', marginTop: 12, marginBottom: 24,
        color: C.textDim, fontSize: 13, fontStyle: 'italic',
    },

    // Buttons
    primaryBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        gap: 10, height: 56, borderRadius: 50, width: '100%',
        backgroundColor: C.primary,
        shadowColor: C.primary, shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.3, shadowRadius: 20, elevation: 10,
        marginBottom: 12,
    },
    primaryBtnText: { fontSize: 18, fontWeight: '700', color: '#FFF' },
    secondaryBtn: {
        width: '100%', paddingVertical: 14,
        borderRadius: 50, borderWidth: 1, borderColor: '#525252',
        alignItems: 'center',
    },
    secondaryBtnText: { fontSize: 14, fontWeight: '600', color: '#d4d4d4' },
});
