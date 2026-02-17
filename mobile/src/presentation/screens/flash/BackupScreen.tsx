import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, BackHandler, Alert, TouchableOpacity, Animated, Easing } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { ServiceLocator } from '../../../di/ServiceLocator';
import { useAppStore } from '../../store/useAppStore';

// ─── Color Tokens ──────────────────────────────────────────────
const C = {
    bg: '#1a1a1a',
    surface: '#252525',
    border: 'rgba(255,255,255,0.05)',
    text: '#FFFFFF',
    muted: '#9ca3af',
    primary: '#ea103c',
    success: '#22C55E',
    warning: '#F97316',
    error: '#EF4444',
};

export const BackupScreen = ({ navigation, route }: any) => {
    const { tuneId, ecuData } = route.params || {};
    const [status, setStatus] = useState<'idle' | 'reading' | 'uploading' | 'completed' | 'failed'>('idle');
    const [progress, setProgress] = useState(0);
    const [backupPath, setBackupPath] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const pulseAnim = useRef(new Animated.Value(1)).current;

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

    useEffect(() => {
        if (status === 'completed') {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseAnim, { toValue: 1.15, duration: 1200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
                    Animated.timing(pulseAnim, { toValue: 1, duration: 1200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
                ])
            ).start();
        }
    }, [status]);

    const startBackup = async () => {
        setStatus('reading');
        setProgress(0);
        setError(null);

        try {
            const ecuService = ServiceLocator.getECUService();

            const path = await ecuService.readECU((pct) => {
                setProgress(pct);
            });

            setBackupPath(path);

            setStatus('uploading');
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
        <SafeAreaView style={s.root} edges={['top']}>
            {/* ─── Header ─── */}
            <View style={s.header}>
                <TouchableOpacity
                    style={s.backBtn}
                    onPress={() => {
                        if (status === 'reading' || status === 'uploading') {
                            Alert.alert('Backup in Progress', 'Please do not interrupt the backup process.');
                        } else {
                            navigation.goBack();
                        }
                    }}
                >
                    <Ionicons name="arrow-back" size={24} color={C.text} />
                </TouchableOpacity>
                <Text style={s.headerTitle}>ECU Backup</Text>
                <View style={{ width: 40 }} />
            </View>

            <View style={s.content}>
                {/* ─── Idle State ─── */}
                {status === 'idle' && (
                    <View style={s.centerSection}>
                        <View style={s.heroCircle}>
                            <Ionicons name="save-outline" size={48} color={C.primary} />
                        </View>
                        <Text style={s.title}>Create Safety Restore Point</Text>
                        <Text style={s.subtitle}>
                            Before flashing, we must create a full backup of your current ECU state.
                            This allows you to revert to stock if anything goes wrong.
                        </Text>

                        <View style={s.warningCard}>
                            <View style={[s.iconCircle, { backgroundColor: 'rgba(249,115,22,0.1)' }]}>
                                <Ionicons name="warning" size={20} color={C.warning} />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={s.warningTitle}>Do not unplug</Text>
                                <Text style={s.warningText}>
                                    Ensure your device stays connected and your bike battery is charged.
                                </Text>
                            </View>
                        </View>
                    </View>
                )}

                {/* ─── Reading / Uploading State ─── */}
                {(status === 'reading' || status === 'uploading') && (
                    <View style={s.centerSection}>
                        <View style={s.progressCircle}>
                            <Ionicons
                                name={status === 'reading' ? 'hardware-chip-outline' : 'cloud-upload-outline'}
                                size={40}
                                color={C.primary}
                            />
                        </View>
                        <Text style={s.progressPhase}>
                            {status === 'reading' ? 'Reading ECU Memory...' : 'Syncing to Cloud...'}
                        </Text>
                        <Text style={s.progressPercent}>{Math.round(progress)}%</Text>
                        <View style={s.progressBarContainer}>
                            <View style={[s.progressBarFill, { width: `${progress}%` }]} />
                        </View>
                        <Text style={s.waitText}>Please wait...</Text>
                    </View>
                )}

                {/* ─── Success State ─── */}
                {status === 'completed' && (
                    <View style={s.centerSection}>
                        <Animated.View style={[s.successGlow, { transform: [{ scale: pulseAnim }] }]} />
                        <View style={s.successIcon}>
                            <Ionicons name="checkmark-circle" size={64} color={C.success} />
                        </View>
                        <Text style={s.successTitle}>Backup Secure</Text>
                        {backupPath && (
                            <View style={s.pathPill}>
                                <Text style={s.pathText} numberOfLines={1}>{backupPath}</Text>
                            </View>
                        )}
                        <Text style={s.successSub}>
                            Your original ECU data is safe. We can now proceed to flash the new tune.
                        </Text>
                    </View>
                )}

                {/* ─── Failed State ─── */}
                {status === 'failed' && (
                    <View style={s.centerSection}>
                        <View style={[s.heroCircle, { backgroundColor: 'rgba(239,68,68,0.1)' }]}>
                            <Ionicons name="alert-circle" size={48} color={C.error} />
                        </View>
                        <Text style={[s.title, { color: C.error }]}>Backup Failed</Text>
                        <Text style={s.subtitle}>{error || 'An unexpected error occurred'}</Text>
                    </View>
                )}
            </View>

            {/* ─── Footer ─── */}
            <View style={s.footer}>
                {status === 'idle' && (
                    <TouchableOpacity style={s.primaryBtn} onPress={startBackup} activeOpacity={0.85}>
                        <Ionicons name="cloud-upload-outline" size={20} color="#FFF" />
                        <Text style={s.primaryBtnText}>Start Backup</Text>
                    </TouchableOpacity>
                )}
                {status === 'completed' && (
                    <TouchableOpacity style={[s.primaryBtn, { backgroundColor: C.success }]} onPress={handleNext} activeOpacity={0.85}>
                        <Text style={s.primaryBtnText}>Continue to Flash</Text>
                        <Ionicons name="arrow-forward" size={20} color="#FFF" />
                    </TouchableOpacity>
                )}
                {status === 'failed' && (
                    <TouchableOpacity style={s.primaryBtn} onPress={startBackup} activeOpacity={0.85}>
                        <Ionicons name="refresh" size={20} color="#FFF" />
                        <Text style={s.primaryBtnText}>Retry Backup</Text>
                    </TouchableOpacity>
                )}
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
    backBtn: {
        width: 40, height: 40, borderRadius: 20,
        alignItems: 'center', justifyContent: 'center',
    },
    headerTitle: { fontSize: 18, fontWeight: '700', color: C.text },

    content: { flex: 1, justifyContent: 'center', paddingHorizontal: 16 },

    centerSection: { alignItems: 'center', padding: 16 },

    heroCircle: {
        width: 96, height: 96, borderRadius: 48,
        backgroundColor: 'rgba(234,16,60,0.08)',
        alignItems: 'center', justifyContent: 'center',
        marginBottom: 24,
    },
    title: { fontSize: 24, fontWeight: '900', color: C.text, textAlign: 'center', marginBottom: 12 },
    subtitle: { fontSize: 15, color: C.muted, textAlign: 'center', lineHeight: 22, maxWidth: 300, marginBottom: 24 },

    warningCard: {
        flexDirection: 'row', alignItems: 'center', gap: 14,
        backgroundColor: 'rgba(249,115,22,0.06)',
        borderRadius: 16, padding: 16, width: '100%',
        borderWidth: 1, borderColor: 'rgba(249,115,22,0.2)',
    },
    iconCircle: {
        width: 36, height: 36, borderRadius: 10,
        alignItems: 'center', justifyContent: 'center',
    },
    warningTitle: { color: C.warning, fontWeight: '700', fontSize: 14, marginBottom: 2 },
    warningText: { color: C.muted, fontSize: 13, lineHeight: 18 },

    progressCircle: {
        width: 96, height: 96, borderRadius: 48,
        backgroundColor: 'rgba(234,16,60,0.08)',
        alignItems: 'center', justifyContent: 'center',
        marginBottom: 24,
    },
    progressPhase: { fontSize: 18, fontWeight: '700', color: C.text, marginBottom: 8 },
    progressPercent: { fontSize: 36, fontWeight: '900', color: C.primary, marginBottom: 16 },
    progressBarContainer: {
        width: '100%', height: 8,
        backgroundColor: C.surface, borderRadius: 4,
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%', backgroundColor: C.primary, borderRadius: 4,
    },
    waitText: { fontSize: 14, color: C.muted, marginTop: 16 },

    successGlow: {
        position: 'absolute', top: -20,
        width: 120, height: 120, borderRadius: 60,
        backgroundColor: 'rgba(34,197,94,0.15)',
    },
    successIcon: { marginBottom: 16, zIndex: 1 },
    successTitle: { fontSize: 26, fontWeight: '900', color: C.success, marginBottom: 12, zIndex: 1 },
    pathPill: {
        backgroundColor: C.surface,
        paddingHorizontal: 16, paddingVertical: 8,
        borderRadius: 12, marginBottom: 12,
    },
    pathText: { fontSize: 11, fontFamily: 'monospace', color: C.muted },
    successSub: { fontSize: 14, color: C.muted, textAlign: 'center', lineHeight: 20, maxWidth: 280, zIndex: 1 },

    footer: {
        paddingHorizontal: 16, paddingBottom: 24, paddingTop: 12,
        borderTopWidth: 1, borderTopColor: C.border,
    },
    primaryBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
        height: 52, borderRadius: 26, backgroundColor: C.primary,
        shadowColor: C.primary, shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5, shadowRadius: 20,
    },
    primaryBtnText: { fontSize: 16, fontWeight: '700', color: '#FFF' },
});
