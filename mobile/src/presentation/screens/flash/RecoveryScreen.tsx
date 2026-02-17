import React, { useState, useEffect, useRef } from 'react';
import {
    View, Text, StyleSheet, BackHandler, Alert, ScrollView,
    TouchableOpacity, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ServiceLocator } from '../../../di/ServiceLocator';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

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

export const RecoveryScreen = ({ navigation, route }: any) => {
    const { backupPath, deviceId } = route.params || {};
    const [status, setStatus] = useState<'idle' | 'restoring' | 'success' | 'failed'>('idle');
    const [progress, setProgress] = useState(0);
    const [log, setLog] = useState<string[]>([]);
    const [error, setError] = useState<string | null>(null);
    const scrollRef = useRef<ScrollView>(null);

    useEffect(() => {
        const onBackPress = () => {
            if (status === 'restoring') {
                Alert.alert('⛔ CRITICAL', 'Recovery is in progress. Interrupting will corrupt your ECU.',
                    [{ text: 'I Understand', style: 'cancel' }]);
                return true;
            }
            return false;
        };
        const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
        return () => subscription.remove();
    }, [status]);

    useEffect(() => {
        setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    }, [log]);

    const addLog = (msg: string) => setLog(prev => [...prev, msg]);

    const startRecovery = async () => {
        if (!backupPath) { setError('No backup file provided.'); return; }
        setStatus('restoring');
        setProgress(0);
        setError(null);
        setLog([]);
        addLog('Initializing Recovery Mode...');
        addLog(`Backup file: ${backupPath.split('/').pop()}`);
        try {
            const ecuService = ServiceLocator.getECUService();
            if (deviceId && 'setConnectedDevice' in ecuService) {
                (ecuService as any).setConnectedDevice(deviceId);
            }
            addLog('Starting ECU restore...');
            await ecuService.restoreBackup(backupPath, (pct, msg) => {
                setProgress(pct);
                if (msg) {
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

    // ─── Restoring ────────────────────────────────────────────
    if (status === 'restoring') {
        return (
            <View style={s.root}>
                <SafeAreaView edges={['top']}>
                    <View style={s.header}>
                        <View style={{ width: 40 }} />
                        <Text style={s.headerTitle}>ECU Recovery</Text>
                        <View style={{ width: 40 }} />
                    </View>
                </SafeAreaView>
                <View style={s.centeredContent}>
                    <View style={s.emergencyBadge}>
                        <Ionicons name="warning" size={16} color={C.red} />
                        <Text style={s.emergencyText}>EMERGENCY RECOVERY</Text>
                    </View>
                    <Text style={s.progressPercent}>{Math.round(progress)}%</Text>
                    <Text style={s.restoringSubtitle}>Restoring original ECU state...</Text>
                    <View style={s.progressBarBg}>
                        <View style={[s.progressBarFill, { width: `${progress}%` }]} />
                    </View>
                    {/* Log */}
                    <View style={s.logCard}>
                        <ScrollView ref={scrollRef} style={{ maxHeight: 180 }}>
                            {log.map((line, i) => (
                                <Text key={i} style={[s.logText, {
                                    color: line.includes('ERROR') ? C.red
                                        : line.includes('✓') ? C.green : '#BBB',
                                }]}>{`> ${line}`}</Text>
                            ))}
                        </ScrollView>
                    </View>
                    <Text style={s.dangerWarning}>DO NOT DISCONNECT POWER.{'\n'}DO NOT CLOSE APP.</Text>
                </View>
            </View>
        );
    }

    // ─── Success ──────────────────────────────────────────────
    if (status === 'success') {
        return (
            <View style={[s.root, { justifyContent: 'center', alignItems: 'center', padding: 32 }]}>
                <View style={s.successCircle}>
                    <Ionicons name="checkmark" size={48} color="#FFF" />
                </View>
                <Text style={s.successTitle}>Recovery Successful</Text>
                <Text style={s.successDesc}>
                    Your ECU has been restored to its previous working state.{'\n'}
                    Cycle ignition (OFF → ON) to finalize.
                </Text>
                <TouchableOpacity style={s.primaryBtn} onPress={handleFinish} activeOpacity={0.85}>
                    <Text style={s.primaryBtnText}>Return to Garage</Text>
                </TouchableOpacity>
            </View>
        );
    }

    // ─── Failed ───────────────────────────────────────────────
    if (status === 'failed') {
        return (
            <View style={[s.root, { justifyContent: 'center', alignItems: 'center', padding: 32 }]}>
                <View style={s.failCircle}>
                    <Ionicons name="warning" size={48} color="#FFF" />
                </View>
                <Text style={s.failTitle}>Recovery Failed</Text>
                <Text style={s.failDesc}>{error || 'Recovery operation failed'}</Text>
                <View style={s.logCard}>
                    <ScrollView style={{ maxHeight: 120 }}>
                        {log.map((line, i) => (
                            <Text key={i} style={[s.logText, {
                                color: line.includes('ERROR') ? C.red : '#BBB',
                            }]}>{`> ${line}`}</Text>
                        ))}
                    </ScrollView>
                </View>
                <TouchableOpacity style={s.primaryBtn} onPress={startRecovery} activeOpacity={0.85}>
                    <Ionicons name="refresh" size={20} color="#FFF" />
                    <Text style={s.primaryBtnText}>Retry Recovery</Text>
                </TouchableOpacity>
                <TouchableOpacity style={s.secondaryBtn} onPress={() => { }} activeOpacity={0.7}>
                    <Text style={s.secondaryBtnText}>Contact Support</Text>
                </TouchableOpacity>
            </View>
        );
    }

    // ─── Idle ─────────────────────────────────────────────────
    return (
        <View style={s.root}>
            <SafeAreaView edges={['top']}>
                <View style={s.header}>
                    <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
                        <Ionicons name="arrow-back" size={20} color={C.white} />
                    </TouchableOpacity>
                    <Text style={s.headerTitle}>ECU Recovery</Text>
                    <View style={{ width: 40 }} />
                </View>
            </SafeAreaView>

            <ScrollView contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
                {/* Critical Warning */}
                <View style={s.criticalSection}>
                    <View style={s.criticalIcon}>
                        <Ionicons name="fitness" size={36} color={C.red} />
                    </View>
                    <Text style={s.criticalTitle}>Emergency Recovery</Text>
                    <Text style={s.criticalDesc}>
                        This will wipe the corrupted tune and restore the backup to your ECU.
                    </Text>
                </View>

                {/* Pre-check cards */}
                <View style={s.prechecksRow}>
                    <PreCheckCard icon="key" label="Keep Ignition ON" color={C.yellow} />
                    <PreCheckCard icon="battery-full" label="Check Battery" color={C.green} />
                    <PreCheckCard icon="link" label="Do Not Disconnect" color={C.red} />
                </View>

                {/* Backup File Card */}
                <View style={s.backupCard}>
                    <View style={s.backupCardHeader}>
                        <Ionicons name="document-text-outline" size={20} color={C.white} />
                        <Text style={s.backupLabel}>Backup File</Text>
                    </View>
                    <Text style={s.backupFileName} numberOfLines={1} ellipsizeMode="middle">
                        {backupPath ? backupPath.split('/').pop() : 'No backup available'}
                    </Text>
                </View>

                {!backupPath && (
                    <View style={s.noBakBanner}>
                        <Ionicons name="alert-circle" size={18} color={C.red} />
                        <Text style={s.noBakText}>No backup file available. Contact support.</Text>
                    </View>
                )}
            </ScrollView>

            {/* Bottom Actions */}
            <LinearGradient colors={['transparent', C.bg, C.bg]} style={s.bottomActions}>
                <SafeAreaView edges={['bottom']}>
                    <TouchableOpacity
                        style={[s.recoveryBtn, !backupPath && { opacity: 0.4 }]}
                        onPress={startRecovery}
                        disabled={!backupPath}
                        activeOpacity={0.85}
                    >
                        <Ionicons name="medical" size={20} color="#FFF" />
                        <Text style={s.recoveryBtnText}>Start Recovery</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={s.cancelOpBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}>
                        <Text style={s.cancelOpText}>Cancel Operation</Text>
                    </TouchableOpacity>
                </SafeAreaView>
            </LinearGradient>
        </View>
    );
};

const PreCheckCard = ({ icon, label, color }: { icon: string; label: string; color: string }) => (
    <View style={s.preCheckCard}>
        <View style={[s.preCheckIconWrap, { backgroundColor: `${color}15` }]}>
            <Ionicons name={icon as any} size={20} color={color} />
        </View>
        <Text style={s.preCheckLabel}>{label}</Text>
    </View>
);

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

    scrollContent: { paddingHorizontal: 24, paddingBottom: 200, gap: 24, paddingTop: 8 },

    // Critical
    criticalSection: { alignItems: 'center', paddingVertical: 24 },
    criticalIcon: {
        width: 72, height: 72, borderRadius: 36,
        backgroundColor: 'rgba(239,68,68,0.08)',
        alignItems: 'center', justifyContent: 'center', marginBottom: 16,
    },
    criticalTitle: { fontSize: 22, fontWeight: '800', color: C.white, marginBottom: 8 },
    criticalDesc: { fontSize: 14, color: C.textMuted, textAlign: 'center', lineHeight: 20 },

    // Prechecks
    prechecksRow: { flexDirection: 'row', gap: 12 },
    preCheckCard: {
        flex: 1, backgroundColor: C.surface, borderRadius: 16,
        padding: 16, alignItems: 'center', gap: 10,
        borderWidth: 1, borderColor: C.border,
    },
    preCheckIconWrap: {
        width: 40, height: 40, borderRadius: 20,
        alignItems: 'center', justifyContent: 'center',
    },
    preCheckLabel: {
        fontSize: 11, fontWeight: '600', color: C.textMuted,
        textAlign: 'center', lineHeight: 14,
    },

    // Backup
    backupCard: {
        backgroundColor: C.surface, borderRadius: 16, padding: 20,
        borderWidth: 1, borderColor: C.border,
    },
    backupCardHeader: {
        flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8,
    },
    backupLabel: { fontSize: 14, fontWeight: '600', color: C.white },
    backupFileName: {
        fontSize: 12, fontFamily: Platform.select({ ios: 'Menlo', default: 'monospace' }),
        color: C.textDim, letterSpacing: 0.5,
    },
    noBakBanner: {
        flexDirection: 'row', alignItems: 'center', gap: 8,
        backgroundColor: 'rgba(239,68,68,0.06)', padding: 14,
        borderRadius: 12, borderWidth: 1, borderColor: 'rgba(239,68,68,0.15)',
    },
    noBakText: { fontSize: 13, color: C.red, flex: 1 },

    // Bottom
    bottomActions: {
        position: 'absolute', bottom: 0, left: 0, right: 0,
        paddingHorizontal: 24, paddingTop: 48,
    },
    recoveryBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        gap: 10, height: 56, borderRadius: 50,
        backgroundColor: '#DC2626',
        shadowColor: '#DC2626', shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.3, shadowRadius: 20, elevation: 10,
        marginBottom: 12,
    },
    recoveryBtnText: { fontSize: 18, fontWeight: '700', color: '#FFF' },
    cancelOpBtn: {
        alignItems: 'center', paddingVertical: 12,
    },
    cancelOpText: { fontSize: 14, fontWeight: '600', color: C.textDim },

    // Restoring
    centeredContent: {
        flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32,
    },
    emergencyBadge: {
        flexDirection: 'row', alignItems: 'center', gap: 6,
        paddingHorizontal: 14, paddingVertical: 6,
        borderRadius: 50, backgroundColor: 'rgba(239,68,68,0.08)',
        borderWidth: 1, borderColor: 'rgba(239,68,68,0.2)',
        marginBottom: 24,
    },
    emergencyText: {
        fontSize: 11, fontWeight: '700', color: C.red,
        textTransform: 'uppercase', letterSpacing: 1,
    },
    progressPercent: {
        fontSize: 56, fontWeight: '800', color: C.red, marginBottom: 4,
    },
    restoringSubtitle: { fontSize: 14, color: C.textMuted, marginBottom: 24 },
    progressBarBg: {
        width: '100%', height: 8, borderRadius: 4,
        backgroundColor: 'rgba(255,255,255,0.05)', overflow: 'hidden',
        marginBottom: 24,
    },
    progressBarFill: { height: '100%', backgroundColor: C.red, borderRadius: 4 },
    logCard: {
        width: '100%', backgroundColor: '#111', borderRadius: 12,
        padding: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.04)',
        marginBottom: 16,
    },
    logText: {
        fontFamily: Platform.select({ ios: 'Menlo', default: 'monospace' }),
        fontSize: 11, marginBottom: 4, lineHeight: 16,
    },
    dangerWarning: {
        color: C.red, fontWeight: '700', textAlign: 'center',
        fontSize: 13, lineHeight: 20,
    },

    // Success
    successCircle: {
        width: 96, height: 96, borderRadius: 48,
        backgroundColor: C.green, alignItems: 'center', justifyContent: 'center',
        shadowColor: C.green, shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.4, shadowRadius: 20, marginBottom: 24,
    },
    successTitle: { fontSize: 24, fontWeight: '800', color: C.white, marginBottom: 8 },
    successDesc: {
        fontSize: 14, color: C.textMuted, textAlign: 'center', lineHeight: 22, marginBottom: 32,
    },

    // Failed
    failCircle: {
        width: 96, height: 96, borderRadius: 48,
        backgroundColor: C.red, alignItems: 'center', justifyContent: 'center',
        shadowColor: C.red, shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.4, shadowRadius: 20, marginBottom: 24,
    },
    failTitle: { fontSize: 24, fontWeight: '800', color: C.red, marginBottom: 8 },
    failDesc: {
        fontSize: 14, color: C.textMuted, textAlign: 'center', lineHeight: 22, marginBottom: 24,
    },

    // Common
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
