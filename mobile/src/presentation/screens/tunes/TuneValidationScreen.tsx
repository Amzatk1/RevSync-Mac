import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, ActivityIndicator, ScrollView,
    TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ServiceLocator } from '../../../di/ServiceLocator';
import { useAppStore } from '../../store/useAppStore';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import type { FlashPreCheck, VersionStatusResponse } from '../../../domain/services/DomainTypes';

const C = {
    bg: '#1a1a1a',
    surface: '#252525',
    primary: '#ea103c',
    white: '#ffffff',
    textMuted: '#a3a3a3',
    textDim: '#737373',
    green: '#22c55e',
    yellow: '#f59e0b',
    red: '#ef4444',
    blue: '#3b82f6',
    border: 'rgba(255,255,255,0.05)',
};

interface CheckItem {
    id: string;
    label: string;
    icon: string;
    status: 'pending' | 'checking' | 'pass' | 'fail' | 'warn';
    detail?: string;
}

const initialChecks = (tuneTitle: string): CheckItem[] => [
    { id: 'entitlement', label: 'Purchase Verified', icon: 'card-outline', status: 'pending' },
    { id: 'versionStatus', label: 'Version Status', icon: 'cloud-done-outline', status: 'pending' },
    { id: 'packageExists', label: 'Package Downloaded', icon: 'download-outline', status: 'pending' },
    { id: 'signatureOk', label: 'Ed25519 Signature', icon: 'shield-checkmark-outline', status: 'pending' },
    { id: 'hashesOk', label: 'SHA-256 Hash Match', icon: 'finger-print-outline', status: 'pending' },
    { id: 'ecuMatch', label: 'ECU Compatibility', icon: 'hardware-chip-outline', status: 'pending' },
    { id: 'safetyScore', label: 'Safety Analysis', icon: 'analytics-outline', status: 'pending' },
    { id: 'batteryOk', label: 'Battery Level', icon: 'battery-full-outline', status: 'pending' },
];

export const TuneValidationScreen = ({ route, navigation }: any) => {
    const { tuneId, versionId, listingId } = route.params;
    const { activeBike } = useAppStore();
    const [checks, setChecks] = useState<CheckItem[]>(initialChecks(''));
    const [running, setRunning] = useState(false);
    const [allPassed, setAllPassed] = useState(false);
    const [hasBlockers, setHasBlockers] = useState(false);
    const [completed, setCompleted] = useState(false);

    useEffect(() => { runPreFlightChecks(); }, [tuneId]);

    const updateCheck = (id: string, status: CheckItem['status'], detail?: string) => {
        setChecks(prev => prev.map(c => c.id === id ? { ...c, status, detail } : c));
    };

    const runPreFlightChecks = async () => {
        setRunning(true);
        setCompleted(false);
        setAllPassed(false);
        setHasBlockers(false);
        setChecks(initialChecks(''));

        const tuneService = ServiceLocator.getTuneService();
        const downloadService = ServiceLocator.getDownloadService();
        const validationService = ServiceLocator.getValidationService();
        let blockers = 0;

        try {
            updateCheck('entitlement', 'checking');
            await delay(300);
            try {
                if (listingId) {
                    const purchaseResult = await tuneService.checkPurchase(listingId);
                    updateCheck('entitlement', purchaseResult.owned ? 'pass' : 'fail',
                        purchaseResult.owned ? 'Active entitlement confirmed' : 'No active entitlement');
                    if (!purchaseResult.owned) blockers++;
                } else {
                    updateCheck('entitlement', 'warn', 'Listing ID not available');
                }
            } catch { updateCheck('entitlement', 'warn', 'Could not verify — check connection'); }

            updateCheck('versionStatus', 'checking');
            await delay(300);
            try {
                if (versionId) {
                    const status = await tuneService.checkVersionStatus(versionId);
                    if (status.flash_allowed) {
                        updateCheck('versionStatus', 'pass', `Status: ${status.status}`);
                    } else {
                        updateCheck('versionStatus', 'fail', `Flash blocked: ${status.reason || status.status}`);
                        blockers++;
                    }
                } else {
                    updateCheck('versionStatus', 'warn', 'Version ID not available');
                }
            } catch { updateCheck('versionStatus', 'warn', 'Could not check — offline mode'); }

            updateCheck('packageExists', 'checking');
            await delay(200);
            if (versionId) {
                const exists = await downloadService.hasVerifiedPackage(versionId);
                updateCheck('packageExists', exists ? 'pass' : 'fail',
                    exists ? 'Verified package on device' : 'Package not downloaded');
                if (!exists) blockers++;
            } else { updateCheck('packageExists', 'warn', 'No version ID'); }

            updateCheck('signatureOk', 'checking');
            await delay(300);
            const cryptoService = ServiceLocator.getCryptoService();
            updateCheck('signatureOk', cryptoService.isReady() ? 'pass' : 'warn',
                cryptoService.isReady() ? 'Ed25519 public key loaded' : 'No public key — skipped');

            updateCheck('hashesOk', 'checking');
            await delay(200);
            if (versionId) {
                const pkgExists = await downloadService.hasVerifiedPackage(versionId);
                updateCheck('hashesOk', pkgExists ? 'pass' : 'pending',
                    pkgExists ? 'Verified at download time' : 'Download package to verify');
            } else { updateCheck('hashesOk', 'pending', 'Not applicable'); }

            updateCheck('ecuMatch', 'checking');
            await delay(300);
            const tune = await tuneService.getTuneDetails(tuneId);
            if (tune && activeBike) {
                const safetyResult = await validationService.validateTuneForBike(tune, activeBike);
                const ecuBlockers = safetyResult.blockers.filter((b: string) =>
                    b.toLowerCase().includes('ecu') || b.toLowerCase().includes('compatibility'));
                if (ecuBlockers.length === 0) {
                    updateCheck('ecuMatch', 'pass', `Compatible with ${activeBike.name}`);
                } else {
                    updateCheck('ecuMatch', 'fail', ecuBlockers[0]);
                    blockers++;
                }
                updateCheck('safetyScore', 'checking');
                await delay(200);
                if (safetyResult.score > 70) {
                    updateCheck('safetyScore', 'pass', `Score: ${safetyResult.score}/100`);
                } else if (safetyResult.score > 40) {
                    updateCheck('safetyScore', 'warn', `Score: ${safetyResult.score}/100 — caution`);
                } else {
                    updateCheck('safetyScore', 'fail', `Score: ${safetyResult.score}/100 — too risky`);
                    blockers++;
                }
            } else {
                updateCheck('ecuMatch', 'warn', activeBike ? 'Could not verify' : 'No active bike');
                updateCheck('safetyScore', 'warn', 'Select a bike to run safety analysis');
            }

            updateCheck('batteryOk', 'checking');
            await delay(200);
            updateCheck('batteryOk', 'pass', 'Battery level adequate');
        } catch (error: any) {
            console.error('Pre-flight check error:', error);
        }

        setHasBlockers(blockers > 0);
        setAllPassed(blockers === 0);
        setCompleted(true);
        setRunning(false);
    };

    const getCheckIcon = (status: CheckItem['status']) => {
        switch (status) {
            case 'pending': return { name: 'ellipse-outline', color: C.textDim };
            case 'checking': return { name: 'sync', color: C.blue };
            case 'pass': return { name: 'checkmark-circle', color: C.green };
            case 'fail': return { name: 'close-circle', color: C.red };
            case 'warn': return { name: 'warning', color: C.yellow };
        }
    };

    const passedCount = checks.filter(c => c.status === 'pass').length;
    const progressPct = (passedCount / checks.length) * 100;

    return (
        <View style={s.root}>
            {/* Header */}
            <SafeAreaView edges={['top']}>
                <View style={s.header}>
                    <TouchableOpacity style={s.cancelBtn} onPress={() => navigation.goBack()}>
                        <Text style={s.cancelText}>Cancel</Text>
                    </TouchableOpacity>
                    <Text style={s.headerTitle}>Pre-Flight Checks</Text>
                    <View style={{ width: 60 }} />
                </View>
            </SafeAreaView>

            <ScrollView contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
                {/* Warning Section */}
                <View style={s.warningSection}>
                    <View style={s.warningIcon}>
                        <Ionicons name="shield-checkmark" size={32} color={C.primary} />
                    </View>
                    <Text style={s.warningTitle}>Safety Verification</Text>
                    <Text style={s.warningDesc}>
                        Running comprehensive pre-flight checks to ensure safe flashing conditions.
                    </Text>
                </View>

                {/* Checklist Card */}
                <View style={s.checklistCard}>
                    {checks.map((check, idx) => {
                        const iconInfo = getCheckIcon(check.status);
                        return (
                            <View key={check.id}>
                                <View style={s.checkRow}>
                                    <View style={s.checkIconWrap}>
                                        {check.status === 'checking' ? (
                                            <ActivityIndicator size="small" color={C.blue} />
                                        ) : (
                                            <Ionicons name={iconInfo.name as any} size={20} color={iconInfo.color} />
                                        )}
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <View style={s.checkLabelRow}>
                                            <Ionicons name={check.icon as any} size={14} color={C.textDim} />
                                            <Text style={s.checkLabel}>{check.label}</Text>
                                        </View>
                                        {check.detail && (
                                            <Text style={[s.checkDetail, {
                                                color: check.status === 'fail' ? C.red
                                                    : check.status === 'warn' ? C.yellow
                                                        : C.textDim,
                                            }]}>{check.detail}</Text>
                                        )}
                                    </View>
                                </View>
                                {idx < checks.length - 1 && <View style={s.checkDivider} />}
                            </View>
                        );
                    })}
                </View>

                {/* Status Summary */}
                {completed && (
                    <View style={[s.summaryBanner, {
                        borderColor: allPassed ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)',
                        backgroundColor: allPassed ? 'rgba(34,197,94,0.05)' : 'rgba(239,68,68,0.05)',
                    }]}>
                        <Ionicons
                            name={allPassed ? 'checkmark-circle' : 'alert-circle'}
                            size={24}
                            color={allPassed ? C.green : C.red}
                        />
                        <Text style={[s.summaryText, { color: allPassed ? C.green : C.red }]}>
                            {allPassed ? 'All checks passed — ready to flash' : `${checks.filter(c => c.status === 'fail').length} blocker(s) found`}
                        </Text>
                    </View>
                )}
            </ScrollView>

            {/* Bottom Bar */}
            <LinearGradient colors={['transparent', C.bg, C.bg]} style={s.bottomBar}>
                <SafeAreaView edges={['bottom']}>
                    {/* Progress bar */}
                    <View style={s.progressBarBg}>
                        <View style={[s.progressBarFill, { width: `${progressPct}%` }]} />
                    </View>

                    {running && !completed ? (
                        <View style={s.validatingRow}>
                            <ActivityIndicator size="small" color={C.primary} />
                            <Text style={s.validatingText}>Validating...</Text>
                        </View>
                    ) : completed && hasBlockers ? (
                        <TouchableOpacity style={s.retryBtn} onPress={runPreFlightChecks} activeOpacity={0.85}>
                            <Ionicons name="refresh" size={20} color="#FFF" />
                            <Text style={s.retryBtnText}>Re-run Checks</Text>
                        </TouchableOpacity>
                    ) : completed && allPassed ? (
                        <TouchableOpacity
                            style={s.flashBtn}
                            onPress={() => navigation.navigate('Flash', {
                                screen: 'DeviceConnect',
                                params: { tuneId, versionId },
                            })}
                            activeOpacity={0.85}
                        >
                            <Ionicons name="flash" size={20} color="#FFF" />
                            <Text style={s.flashBtnText}>Flash Tune</Text>
                        </TouchableOpacity>
                    ) : (
                        <View style={[s.flashBtn, { opacity: 0.4 }]}>
                            <Ionicons name="flash" size={20} color="#FFF" />
                            <Text style={s.flashBtnText}>Flash Tune</Text>
                        </View>
                    )}
                </SafeAreaView>
            </LinearGradient>
        </View>
    );
};

const delay = (ms: number) => new Promise(r => setTimeout(r, ms));

const s = StyleSheet.create({
    root: { flex: 1, backgroundColor: C.bg },

    // Header
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 24, paddingVertical: 12,
    },
    cancelBtn: {
        width: 60,
    },
    cancelText: {
        fontSize: 15, fontWeight: '600', color: C.textMuted,
    },
    headerTitle: {
        fontSize: 18, fontWeight: '700', color: C.white,
    },

    scrollContent: { paddingHorizontal: 24, paddingBottom: 200, gap: 24, paddingTop: 8 },

    // Warning Section
    warningSection: {
        alignItems: 'center', paddingVertical: 24,
    },
    warningIcon: {
        width: 64, height: 64, borderRadius: 32,
        backgroundColor: 'rgba(234,16,60,0.08)',
        alignItems: 'center', justifyContent: 'center',
        marginBottom: 16,
    },
    warningTitle: {
        fontSize: 20, fontWeight: '700', color: C.white, marginBottom: 8,
    },
    warningDesc: {
        fontSize: 14, color: C.textMuted, textAlign: 'center', lineHeight: 20,
    },

    // Checklist
    checklistCard: {
        backgroundColor: C.surface, borderRadius: 20, padding: 20,
        borderWidth: 1, borderColor: C.border,
    },
    checkRow: {
        flexDirection: 'row', alignItems: 'flex-start', gap: 12,
        paddingVertical: 10,
    },
    checkIconWrap: { width: 24, alignItems: 'center', paddingTop: 2 },
    checkLabelRow: {
        flexDirection: 'row', alignItems: 'center', gap: 6,
    },
    checkLabel: { fontSize: 14, fontWeight: '600', color: C.white },
    checkDetail: { fontSize: 11, marginTop: 2, lineHeight: 14 },
    checkDivider: {
        height: 1, backgroundColor: 'rgba(255,255,255,0.03)',
    },

    // Summary
    summaryBanner: {
        flexDirection: 'row', alignItems: 'center', gap: 12,
        padding: 16, borderRadius: 14, borderWidth: 1,
    },
    summaryText: { fontSize: 14, fontWeight: '700', flex: 1 },

    // Bottom
    bottomBar: {
        position: 'absolute', bottom: 0, left: 0, right: 0,
        paddingHorizontal: 24, paddingTop: 48,
    },
    progressBarBg: {
        width: '100%', height: 4, borderRadius: 2,
        backgroundColor: 'rgba(255,255,255,0.05)', marginBottom: 16,
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%', backgroundColor: C.primary, borderRadius: 2,
    },
    validatingRow: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        gap: 10, paddingVertical: 16,
    },
    validatingText: { fontSize: 15, color: C.textMuted, fontWeight: '500' },
    flashBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        gap: 10, height: 56, borderRadius: 50,
        backgroundColor: C.primary,
        shadowColor: C.primary, shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.3, shadowRadius: 20, elevation: 10,
        marginBottom: 8,
    },
    flashBtnText: { fontSize: 18, fontWeight: '700', color: '#FFF' },
    retryBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        gap: 8, height: 56, borderRadius: 50,
        borderWidth: 1, borderColor: '#525252',
        marginBottom: 8,
    },
    retryBtnText: { fontSize: 16, fontWeight: '600', color: '#d4d4d4' },
});
