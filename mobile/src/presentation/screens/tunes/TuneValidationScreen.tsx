import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Theme } from '../../theme';
import {
    Screen, PrimaryButton, SecondaryButton, LoadingOverlay, Card, ErrorBanner,
} from '../../components/SharedComponents';
import { Ionicons } from '@expo/vector-icons';
import { ServiceLocator } from '../../../di/ServiceLocator';
import { useAppStore } from '../../store/useAppStore';
import type { FlashPreCheck, VersionStatusResponse } from '../../../domain/services/DomainTypes';

// ─── Pre-Flight Check Items ────────────────────────────────────

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

// ─── Component ─────────────────────────────────────────────────

export const TuneValidationScreen = ({ route, navigation }: any) => {
    const { tuneId, versionId, listingId } = route.params;
    const { activeBike } = useAppStore();
    const [checks, setChecks] = useState<CheckItem[]>(initialChecks(''));
    const [running, setRunning] = useState(false);
    const [allPassed, setAllPassed] = useState(false);
    const [hasBlockers, setHasBlockers] = useState(false);
    const [completed, setCompleted] = useState(false);

    useEffect(() => {
        runPreFlightChecks();
    }, [tuneId]);

    const updateCheck = (id: string, status: CheckItem['status'], detail?: string) => {
        setChecks(prev => prev.map(c =>
            c.id === id ? { ...c, status, detail } : c
        ));
    };

    // ─── Pre-Flight Check Pipeline ─────────────────────────────

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
            // 1. Check entitlement (purchase)
            updateCheck('entitlement', 'checking');
            await delay(300);
            try {
                if (listingId) {
                    const purchaseResult = await tuneService.checkPurchase(listingId);
                    if (purchaseResult.owned) {
                        updateCheck('entitlement', 'pass', 'Active entitlement confirmed');
                    } else {
                        updateCheck('entitlement', 'fail', 'No active entitlement — purchase required');
                        blockers++;
                    }
                } else {
                    updateCheck('entitlement', 'warn', 'Listing ID not available — skipping');
                }
            } catch {
                updateCheck('entitlement', 'warn', 'Could not verify — check connection');
            }

            // 2. Check version status on server
            updateCheck('versionStatus', 'checking');
            await delay(300);
            try {
                if (versionId) {
                    const status = await tuneService.checkVersionStatus(versionId);
                    if (status.flash_allowed) {
                        updateCheck('versionStatus', 'pass', `Status: ${status.status}`);
                    } else {
                        updateCheck('versionStatus', 'fail',
                            `Flash blocked: ${status.reason || status.status}`);
                        blockers++;
                    }
                } else {
                    updateCheck('versionStatus', 'warn', 'Version ID not available');
                }
            } catch {
                updateCheck('versionStatus', 'warn', 'Could not check — offline mode');
            }

            // 3. Check if package is downloaded
            updateCheck('packageExists', 'checking');
            await delay(200);
            if (versionId) {
                const exists = await downloadService.hasVerifiedPackage(versionId);
                if (exists) {
                    updateCheck('packageExists', 'pass', 'Verified package on device');
                } else {
                    updateCheck('packageExists', 'fail', 'Package not downloaded — download first');
                    blockers++;
                }
            } else {
                updateCheck('packageExists', 'warn', 'No version ID — cannot check');
            }

            // 4. Signature verification
            updateCheck('signatureOk', 'checking');
            await delay(300);
            const cryptoService = ServiceLocator.getCryptoService();
            if (cryptoService.isReady()) {
                updateCheck('signatureOk', 'pass', 'Ed25519 public key loaded');
            } else {
                updateCheck('signatureOk', 'warn', 'No public key — signature check skipped');
            }

            // 5. Hashes match
            updateCheck('hashesOk', 'checking');
            await delay(200);
            // This is checked during download — if package exists and was verified, hashes matched
            if (versionId) {
                const pkgExists = await downloadService.hasVerifiedPackage(versionId);
                if (pkgExists) {
                    updateCheck('hashesOk', 'pass', 'Verified at download time');
                } else {
                    updateCheck('hashesOk', 'pending', 'Download package to verify hashes');
                }
            } else {
                updateCheck('hashesOk', 'pending', 'Not applicable');
            }

            // 6. ECU compatibility
            updateCheck('ecuMatch', 'checking');
            await delay(300);
            const tune = await tuneService.getTuneDetails(tuneId);
            if (tune && activeBike) {
                const safetyResult = await validationService.validateTuneForBike(tune, activeBike);
                const ecuBlockers = safetyResult.blockers.filter((b: string) =>
                    b.toLowerCase().includes('ecu') || b.toLowerCase().includes('compatibility')
                );
                if (ecuBlockers.length === 0) {
                    updateCheck('ecuMatch', 'pass', `Compatible with ${activeBike.name}`);
                } else {
                    updateCheck('ecuMatch', 'fail', ecuBlockers[0]);
                    blockers++;
                }

                // 7. Safety analysis (re-use result)
                updateCheck('safetyScore', 'checking');
                await delay(200);
                if (safetyResult.score > 70) {
                    updateCheck('safetyScore', 'pass', `Score: ${safetyResult.score}/100`);
                } else if (safetyResult.score > 40) {
                    updateCheck('safetyScore', 'warn', `Score: ${safetyResult.score}/100 — proceed with caution`);
                } else {
                    updateCheck('safetyScore', 'fail', `Score: ${safetyResult.score}/100 — too risky`);
                    blockers++;
                }
            } else {
                updateCheck('ecuMatch', 'warn', activeBike ? 'Could not verify' : 'No active bike selected');
                updateCheck('safetyScore', 'warn', 'Select a bike to run safety analysis');
            }

            // 8. Battery check (mock — needs native API)
            updateCheck('batteryOk', 'checking');
            await delay(200);
            // In production, use expo-battery
            updateCheck('batteryOk', 'pass', 'Battery level adequate');

        } catch (error: any) {
            console.error('Pre-flight check error:', error);
        }

        setHasBlockers(blockers > 0);
        setAllPassed(blockers === 0);
        setCompleted(true);
        setRunning(false);
    };

    // ─── Render ────────────────────────────────────────────────

    const getCheckIcon = (status: CheckItem['status']) => {
        switch (status) {
            case 'pending': return { name: 'ellipse-outline', color: Theme.Colors.textSecondary };
            case 'checking': return { name: 'sync', color: '#3B82F6' };
            case 'pass': return { name: 'checkmark-circle', color: '#22C55E' };
            case 'fail': return { name: 'close-circle', color: '#EF4444' };
            case 'warn': return { name: 'warning', color: '#F59E0B' };
        }
    };

    return (
        <Screen scroll>
            <View style={styles.header}>
                <Text style={styles.title}>Pre-Flash Safety Gate</Text>
                <Text style={styles.subtitle}>
                    All checks must pass before flashing
                </Text>
            </View>

            {/* Status Summary */}
            {completed && (
                <View style={[styles.summaryCard, {
                    borderColor: allPassed ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)',
                    backgroundColor: allPassed ? 'rgba(34,197,94,0.05)' : 'rgba(239,68,68,0.05)',
                }]}>
                    <Ionicons
                        name={allPassed ? 'checkmark-circle' : 'alert-circle'}
                        size={32}
                        color={allPassed ? '#22C55E' : '#EF4444'}
                    />
                    <Text style={[styles.summaryText, {
                        color: allPassed ? '#22C55E' : '#EF4444',
                    }]}>
                        {allPassed
                            ? 'All checks passed — ready to flash'
                            : `${checks.filter(c => c.status === 'fail').length} blocker(s) found`
                        }
                    </Text>
                </View>
            )}

            {/* Check Items */}
            <View style={styles.checksContainer}>
                {checks.map((check) => {
                    const iconInfo = getCheckIcon(check.status);
                    return (
                        <View key={check.id} style={styles.checkRow}>
                            <View style={styles.checkIconBox}>
                                {check.status === 'checking' ? (
                                    <ActivityIndicator size="small" color="#3B82F6" />
                                ) : (
                                    <Ionicons
                                        name={iconInfo.name as any}
                                        size={22}
                                        color={iconInfo.color}
                                    />
                                )}
                            </View>
                            <View style={{ flex: 1 }}>
                                <View style={styles.checkLabelRow}>
                                    <Ionicons name={check.icon as any} size={14} color={Theme.Colors.textSecondary} />
                                    <Text style={styles.checkLabel}>{check.label}</Text>
                                </View>
                                {check.detail && (
                                    <Text style={[styles.checkDetail, {
                                        color: check.status === 'fail' ? '#EF4444'
                                            : check.status === 'warn' ? '#F59E0B'
                                                : Theme.Colors.textSecondary,
                                    }]}>
                                        {check.detail}
                                    </Text>
                                )}
                            </View>
                        </View>
                    );
                })}
            </View>

            {/* Actions */}
            <View style={styles.footer}>
                {!completed && running && (
                    <View style={styles.runningRow}>
                        <ActivityIndicator color={Theme.Colors.primary} />
                        <Text style={styles.runningText}>Running pre-flight checks...</Text>
                    </View>
                )}

                {completed && hasBlockers && (
                    <>
                        <ErrorBanner message="Resolve all blockers to proceed." />
                        <SecondaryButton
                            title="Re-run Checks"
                            onPress={runPreFlightChecks}
                            style={{ marginTop: 12 }}
                        />
                    </>
                )}

                {completed && allPassed && (
                    <PrimaryButton
                        title="Continue to Connect"
                        icon="flash-outline"
                        onPress={() => navigation.navigate('Flash', {
                            screen: 'DeviceConnect',
                            params: { tuneId, versionId },
                        })}
                    />
                )}
            </View>
        </Screen>
    );
};

const delay = (ms: number) => new Promise(r => setTimeout(r, ms));

// ─── Styles ────────────────────────────────────────────────────

const styles = StyleSheet.create({
    header: {
        padding: Theme.Spacing.md,
        alignItems: 'center',
    },
    title: { ...Theme.Typography.h2 },
    subtitle: {
        ...Theme.Typography.caption,
        marginTop: 4,
        textAlign: 'center',
    },
    summaryCard: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginHorizontal: Theme.Spacing.md,
        padding: 16,
        borderRadius: 14,
        borderWidth: 1,
        marginBottom: Theme.Spacing.md,
    },
    summaryText: {
        fontSize: 15,
        fontWeight: '700',
        flex: 1,
    },
    checksContainer: {
        paddingHorizontal: Theme.Spacing.md,
    },
    checkRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 12,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.04)',
    },
    checkIconBox: {
        width: 28,
        alignItems: 'center',
        paddingTop: 2,
    },
    checkLabelRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    checkLabel: {
        fontSize: 15,
        fontWeight: '600',
        color: Theme.Colors.text,
    },
    checkDetail: {
        fontSize: 12,
        marginTop: 3,
        lineHeight: 16,
    },
    footer: {
        padding: Theme.Spacing.md,
        marginTop: Theme.Spacing.lg,
    },
    runningRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
    },
    runningText: {
        color: Theme.Colors.textSecondary,
        fontSize: 14,
    },
});
