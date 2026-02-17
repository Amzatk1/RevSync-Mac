import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Easing } from 'react-native';
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
    error: '#EF4444',
};

export const ECUIdentifyScreen = ({ navigation, route }: any) => {
    const { tuneId } = route.params || {};
    const { activeBike, loadActiveBike } = useAppStore();

    const [status, setStatus] = useState<'idle' | 'reading' | 'success' | 'failed'>('idle');
    const [ecuData, setEcuData] = useState<{ ecuId: string; hardwareVersion: string; firmwareVersion: string } | null>(null);
    const [error, setError] = useState<string | null>(null);
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const spinAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        startIdentification();
    }, []);

    useEffect(() => {
        if (status === 'reading') {
            Animated.loop(
                Animated.timing(spinAnim, { toValue: 1, duration: 1200, easing: Easing.linear, useNativeDriver: true })
            ).start();
        }
        if (status === 'success') {
            spinAnim.stopAnimation();
            Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseAnim, { toValue: 1.15, duration: 1000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
                    Animated.timing(pulseAnim, { toValue: 1, duration: 1000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
                ])
            ).start();
        }
    }, [status]);

    const startIdentification = async () => {
        setStatus('reading');
        setError(null);
        try {
            const ecuService = ServiceLocator.getECUService();
            const data = await ecuService.identifyECU();
            setEcuData(data);
            setStatus('success');

            if (activeBike) {
                console.log('Would save ECU info to bike:', activeBike.id, data);
            }
        } catch (e: any) {
            setError(e.message || 'Failed to identify ECU');
            setStatus('failed');
        }
    };

    const handleContinue = () => {
        if (tuneId) {
            navigation.navigate('Backup', { tuneId, ecuData });
        } else {
            navigation.popToTop();
        }
    };

    const spin = spinAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg'],
    });

    return (
        <SafeAreaView style={s.root} edges={['top']}>
            {/* ─── Header ─── */}
            <View style={s.header}>
                <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color={C.text} />
                </TouchableOpacity>
                <Text style={s.headerTitle}>ECU Identification</Text>
                <View style={{ width: 40 }} />
            </View>

            <View style={s.content}>
                {/* ─── Reading State ─── */}
                {status === 'reading' && (
                    <View style={s.centerCard}>
                        <Animated.View style={[s.spinCircle, { transform: [{ rotate: spin }] }]}>
                            <Ionicons name="sync-outline" size={48} color={C.primary} />
                        </Animated.View>
                        <Text style={s.statusTitle}>Reading ECU Identifiers...</Text>
                        <Text style={s.statusSub}>
                            Communicating with your ECU via BLE. Keep ignition on.
                        </Text>
                    </View>
                )}

                {/* ─── Error State ─── */}
                {status === 'failed' && error && (
                    <View style={s.centerCard}>
                        <View style={[s.iconCircleLarge, { backgroundColor: 'rgba(239,68,68,0.1)' }]}>
                            <Ionicons name="alert-circle" size={48} color={C.error} />
                        </View>
                        <Text style={s.errorTitle}>Identification Failed</Text>
                        <Text style={s.statusSub}>{error}</Text>
                        <TouchableOpacity style={s.retryBtn} onPress={startIdentification}>
                            <Ionicons name="refresh" size={20} color="#FFF" />
                            <Text style={s.retryBtnText}>Retry</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* ─── Success State ─── */}
                {status === 'success' && ecuData && (
                    <View style={s.successContainer}>
                        <Animated.View style={[s.successGlow, { transform: [{ scale: pulseAnim }] }]} />
                        <View style={s.successIconCircle}>
                            <Ionicons name="checkmark-circle" size={56} color={C.success} />
                        </View>
                        <Text style={s.successTitle}>ECU Identified</Text>
                        <Text style={s.successSub}>Hardware compatibility verified</Text>

                        {/* Details Card */}
                        <View style={s.detailsCard}>
                            <DetailRow label="ECU ID" value={ecuData.ecuId} />
                            <View style={s.divider} />
                            <DetailRow label="Hardware Ver" value={ecuData.hardwareVersion} />
                            <View style={s.divider} />
                            <DetailRow label="Firmware Ver" value={ecuData.firmwareVersion} />
                        </View>

                        <Text style={s.infoText}>
                            Your ECU matches the expected configuration. You can proceed safely.
                        </Text>
                    </View>
                )}
            </View>

            {/* ─── Footer ─── */}
            {status === 'success' && (
                <View style={s.footer}>
                    <TouchableOpacity style={s.continueBtn} onPress={handleContinue} activeOpacity={0.85}>
                        <Text style={s.continueBtnText}>
                            {tuneId ? 'Proceed to Backup' : 'Done'}
                        </Text>
                        <Ionicons name="arrow-forward" size={20} color="#FFF" />
                    </TouchableOpacity>
                </View>
            )}
        </SafeAreaView>
    );
};

const DetailRow = ({ label, value }: { label: string; value: string }) => (
    <View style={s.detailRow}>
        <Text style={s.detailLabel}>{label}</Text>
        <Text style={s.detailValue}>{value}</Text>
    </View>
);

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

    centerCard: { alignItems: 'center', padding: 32 },
    spinCircle: {
        width: 96, height: 96, borderRadius: 48,
        backgroundColor: 'rgba(234,16,60,0.08)',
        alignItems: 'center', justifyContent: 'center',
        marginBottom: 24,
    },
    iconCircleLarge: {
        width: 96, height: 96, borderRadius: 48,
        alignItems: 'center', justifyContent: 'center',
        marginBottom: 24,
    },
    statusTitle: { fontSize: 22, fontWeight: '800', color: C.text, marginBottom: 8 },
    errorTitle: { fontSize: 22, fontWeight: '800', color: C.error, marginBottom: 8 },
    statusSub: { fontSize: 14, color: C.muted, textAlign: 'center', maxWidth: 280, lineHeight: 20 },
    retryBtn: {
        flexDirection: 'row', alignItems: 'center', gap: 8,
        paddingHorizontal: 20, paddingVertical: 12,
        borderRadius: 24, backgroundColor: C.primary,
        marginTop: 24,
    },
    retryBtnText: { fontSize: 15, fontWeight: '700', color: '#FFF' },

    successContainer: { alignItems: 'center' },
    successGlow: {
        position: 'absolute', top: -20,
        width: 120, height: 120, borderRadius: 60,
        backgroundColor: 'rgba(34,197,94,0.15)',
    },
    successIconCircle: { marginBottom: 16 },
    successTitle: { fontSize: 26, fontWeight: '900', color: C.success, marginBottom: 4 },
    successSub: { fontSize: 14, color: C.muted, marginBottom: 24 },

    detailsCard: {
        width: '100%',
        backgroundColor: C.surface, borderRadius: 20,
        overflow: 'hidden', marginBottom: 16,
    },
    detailRow: {
        flexDirection: 'row', justifyContent: 'space-between',
        alignItems: 'center', paddingHorizontal: 16, minHeight: 52,
    },
    detailLabel: { color: C.muted, fontSize: 14 },
    detailValue: { color: C.text, fontWeight: '700', fontSize: 14, fontFamily: 'monospace' },
    divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.04)', marginLeft: 16 },

    infoText: { fontSize: 13, color: C.muted, textAlign: 'center', maxWidth: 280, lineHeight: 18 },

    footer: {
        paddingHorizontal: 16, paddingBottom: 24, paddingTop: 12,
        borderTopWidth: 1, borderTopColor: C.border,
    },
    continueBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
        height: 52, borderRadius: 26, backgroundColor: C.success,
        shadowColor: C.success, shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5, shadowRadius: 20,
    },
    continueBtnText: { fontSize: 16, fontWeight: '700', color: '#FFF' },
});
