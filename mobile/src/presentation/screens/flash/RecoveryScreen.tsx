import React, { useEffect, useRef, useState } from 'react';
import { Alert, BackHandler, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ServiceLocator } from '../../../di/ServiceLocator';
import { AppScreen, GlassCard, TopBar } from '../../components/AppUI';
import { Theme } from '../../theme';
import { garageService } from '../../../services/garageService';

const { Colors, Layout, Typography } = Theme;

export const RecoveryScreen = ({ navigation, route }: any) => {
    const { backupPath, backupId, deviceId, flashJobId } = route.params || {};
    const [status, setStatus] = useState<'idle' | 'restoring' | 'success' | 'failed'>('idle');
    const [progress, setProgress] = useState(0);
    const [log, setLog] = useState<string[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [backupRecord, setBackupRecord] = useState<any | null>(null);
    const scrollRef = useRef<ScrollView>(null);

    useEffect(() => {
        const onBackPress = () => {
            if (status === 'restoring') {
                Alert.alert('Recovery in progress', 'Interrupting the restore can corrupt the ECU. Stay on this screen until recovery finishes.');
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

    useEffect(() => {
        const loadBackupRecord = async () => {
            if (!backupId) {
                setBackupRecord(null);
                return;
            }
            const record = await garageService.getBackup(backupId);
            setBackupRecord(record);
            if (!record) {
                setError('The selected verified backup record is no longer available.');
            }
        };
        loadBackupRecord();
    }, [backupId]);

    const addLog = (message: string) => setLog((prev) => [...prev, message]);

    const startRecovery = async () => {
        if (!backupPath) {
            setError('No backup file provided.');
            return;
        }
        if (!backupId || !backupRecord) {
            setError('Recovery is blocked until a verified backup record is available.');
            return;
        }

        setStatus('restoring');
        setProgress(0);
        setError(null);
        setLog([]);
        addLog('Initializing recovery mode...');
        addLog(`Backup file detected: ${backupPath.split('/').pop()}`);
        addLog(`Verified backup record #${backupRecord.id} loaded`);

        try {
            const ecuService = ServiceLocator.getECUService();
            if (deviceId && 'setConnectedDevice' in ecuService) {
                (ecuService as any).setConnectedDevice(deviceId);
            }

            if (flashJobId) {
                await garageService.updateFlashJob(flashJobId, {
                    status: 'RECOVERING',
                    progress: 0,
                    log_message: `Recovery started with backup #${backupRecord.id}`,
                });
            }

            addLog('Writing backup to ECU...');
            await ecuService.restoreBackup(backupPath, (pct: number, message?: string) => {
                setProgress(pct);
                if (message) addLog(message);
                if (flashJobId && (pct === 100 || Math.floor(pct) % 10 === 0)) {
                    garageService.updateFlashJob(flashJobId, {
                        status: 'RECOVERING',
                        progress: Math.floor(pct),
                        log_message: message || `Recovery progress ${Math.floor(pct)}%`,
                    }).catch((syncError) => console.warn('Recovery progress sync failed', syncError));
                }
            });
            addLog('Restore complete. Verifying ECU response...');
            addLog('Recovery finished successfully.');
            if (flashJobId) {
                await garageService.updateFlashJob(flashJobId, {
                    status: 'COMPLETED',
                    progress: 100,
                    log_message: `Recovery completed successfully using backup #${backupRecord.id}`,
                });
            }
            setStatus('success');
        } catch (e: any) {
            const message = e.message || 'Recovery failed';
            setError(message);
            setStatus('failed');
            addLog(`Critical error: ${message}`);
            if (flashJobId) {
                await garageService.updateFlashJob(flashJobId, {
                    status: 'FAILED',
                    progress: Math.floor(progress),
                    error_message: message,
                    error_code: 'RECOVERY_FAILED',
                    log_message: `Recovery failed: ${message}`,
                }).catch((syncError) => console.warn('Recovery failure sync failed', syncError));
            }
        }
    };

    const handleFinish = () => navigation.reset({ index: 0, routes: [{ name: 'Garage' }] });

    if (status === 'success') {
        return (
            <AppScreen contentContainerStyle={styles.centeredScreen}>
                <TopBar title="Recovery" subtitle="ECU restore completed" />
                <View style={styles.centeredContent}>
                    <View style={[styles.centerIcon, { backgroundColor: 'rgba(46,211,154,0.12)' }]}>
                        <Ionicons name="checkmark" size={44} color={Colors.success} />
                    </View>
                    <Text style={styles.centerTitle}>Recovery successful</Text>
                    <Text style={styles.centerBody}>The ECU has been restored to its previous working state. Cycle ignition off, then on, before riding.</Text>
                    <TouchableOpacity style={styles.primaryButton} onPress={handleFinish}>
                        <Text style={styles.primaryButtonText}>Return to Garage</Text>
                    </TouchableOpacity>
                </View>
            </AppScreen>
        );
    }

    if (status === 'failed') {
        return (
            <AppScreen scroll contentContainerStyle={styles.content}>
                <TopBar title="Recovery" subtitle="Restore failed" />
                <GlassCard style={styles.warningCard}>
                    <Ionicons name="warning" size={18} color={Colors.error} />
                    <Text style={styles.warningText}>{error || 'Recovery operation failed.'}</Text>
                </GlassCard>

                <GlassCard style={styles.logCard}>
                    <Text style={styles.sectionLabel}>Session Log</Text>
                    {log.map((line, index) => (
                        <Text key={`${line}-${index}`} style={[styles.logLine, line.toLowerCase().includes('critical') && styles.logLineError]}>
                            {`> ${line}`}
                        </Text>
                    ))}
                </GlassCard>

                <View style={styles.actions}>
                    <TouchableOpacity style={styles.primaryButton} onPress={startRecovery}>
                        <Text style={styles.primaryButtonText}>Retry Recovery</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.secondaryButton} onPress={() => navigation.navigate('Profile', { screen: 'LogsExport' })}>
                        <Text style={styles.secondaryButtonText}>Export Session Logs</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.secondaryButton} onPress={() => navigation.navigate('Profile', { screen: 'Support' })}>
                        <Text style={styles.secondaryButtonText}>Contact Support</Text>
                    </TouchableOpacity>
                </View>
            </AppScreen>
        );
    }

    if (status === 'restoring') {
        return (
            <AppScreen scroll contentContainerStyle={styles.content}>
                <TopBar title="Recovery" subtitle="Emergency restore in progress" />

                <GlassCard style={styles.heroCard}>
                    <Text style={styles.kicker}>Emergency Recovery</Text>
                    <Text style={styles.heroTitle}>Do not disconnect power or close the app during restore.</Text>
                    <Text style={styles.heroSubtitle}>RevSync is rewriting the backup and validating ECU response step by step.</Text>
                </GlassCard>

                <GlassCard style={styles.progressCard}>
                    <View style={styles.progressHeader}>
                        <Text style={styles.progressLabel}>Recovery progress</Text>
                        <Text style={styles.progressValue}>{Math.round(progress)}%</Text>
                    </View>
                    <View style={styles.progressTrack}>
                        <View style={[styles.progressFill, { width: `${progress}%` }]} />
                    </View>
                </GlassCard>

                <GlassCard style={styles.logCard}>
                    <Text style={styles.sectionLabel}>Recovery Log</Text>
                    <ScrollView ref={scrollRef} style={{ maxHeight: 220 }}>
                        {log.map((line, index) => (
                            <Text key={`${line}-${index}`} style={styles.logLine}>
                                {`> ${line}`}
                            </Text>
                        ))}
                    </ScrollView>
                </GlassCard>
            </AppScreen>
        );
    }

    return (
        <AppScreen scroll contentContainerStyle={styles.content}>
            <TopBar title="Recovery" subtitle="Restore the ECU from a known-good backup" onBack={() => navigation.goBack()} />

            <GlassCard style={styles.heroCard}>
                <Text style={styles.kicker}>Fail-Closed Path</Text>
                <Text style={styles.heroTitle}>Use recovery only when a flash session has been interrupted or the ECU is no longer stable.</Text>
                <Text style={styles.heroSubtitle}>The backup package will replace the current state on the ECU. This is a serious operation and should only begin with stable power.</Text>
            </GlassCard>

            <View style={styles.precheckGrid}>
                {[
                    { icon: 'flash-outline', label: 'Ignition on', tone: Colors.warning },
                    { icon: 'battery-full-outline', label: 'Stable battery', tone: Colors.success },
                    { icon: 'link-outline', label: 'Keep device connected', tone: Colors.error },
                ].map((item) => (
                    <GlassCard key={item.label} style={styles.precheckCard}>
                        <View style={[styles.precheckIcon, { backgroundColor: `${item.tone}18` }]}>
                            <Ionicons name={item.icon as any} size={18} color={item.tone} />
                        </View>
                        <Text style={styles.precheckLabel}>{item.label}</Text>
                    </GlassCard>
                ))}
            </View>

            <GlassCard>
                <Text style={styles.sectionLabel}>Backup Authority</Text>
                <Text style={styles.backupFileName}>{backupPath ? backupPath.split('/').pop() : 'No backup available'}</Text>
                {backupRecord && (
                    <Text style={styles.backupMeta}>
                        Record #{backupRecord.id} • {backupRecord.file_size_kb} KB • {backupRecord.checksum.slice(0, 12)}...
                    </Text>
                )}
                {(!backupPath || !backupRecord) && (
                    <View style={styles.warningInline}>
                        <Ionicons name="alert-circle" size={16} color={Colors.error} />
                        <Text style={styles.warningInlineText}>Recovery is blocked until a valid backup file and verified backup record are available.</Text>
                    </View>
                )}
            </GlassCard>

            <View style={styles.actions}>
                <TouchableOpacity style={[styles.primaryButton, (!backupPath || !backupRecord) && styles.buttonDisabled]} onPress={startRecovery} disabled={!backupPath || !backupRecord}>
                    <Text style={styles.primaryButtonText}>Start Recovery</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.secondaryButton} onPress={() => navigation.goBack()}>
                    <Text style={styles.secondaryButtonText}>Cancel</Text>
                </TouchableOpacity>
            </View>
        </AppScreen>
    );
};

const styles = StyleSheet.create({
    content: {
        paddingBottom: 120,
    },
    centeredScreen: {
        paddingBottom: 80,
    },
    centeredContent: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 12,
    },
    centerIcon: {
        width: 88,
        height: 88,
        borderRadius: 28,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 40,
        marginBottom: 18,
    },
    centerTitle: {
        ...Typography.h1,
        textAlign: 'center',
    },
    centerBody: {
        ...Typography.body,
        textAlign: 'center',
        marginTop: 10,
        maxWidth: 320,
    },
    heroCard: {
        marginTop: 8,
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
    precheckGrid: {
        flexDirection: 'row',
        gap: 10,
        marginTop: 12,
    },
    precheckCard: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: 18,
        paddingHorizontal: 10,
    },
    precheckIcon: {
        width: 38,
        height: 38,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 10,
    },
    precheckLabel: {
        fontSize: 12,
        fontWeight: '700',
        color: Colors.textSecondary,
        textAlign: 'center',
    },
    progressCard: {
        marginTop: 12,
    },
    progressHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    progressLabel: {
        ...Typography.dataLabel,
    },
    progressValue: {
        fontSize: 14,
        fontWeight: '700',
        color: Colors.textPrimary,
    },
    progressTrack: {
        height: 8,
        borderRadius: 999,
        backgroundColor: 'rgba(255,255,255,0.08)',
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        borderRadius: 999,
        backgroundColor: Colors.primary,
    },
    logCard: {
        marginTop: 12,
    },
    sectionLabel: {
        ...Typography.dataLabel,
        marginBottom: 10,
    },
    logLine: {
        fontSize: 12,
        lineHeight: 18,
        color: Colors.textSecondary,
        marginBottom: 6,
        fontFamily: 'Courier',
    },
    logLineError: {
        color: Colors.error,
    },
    backupFileName: {
        fontSize: 14,
        fontWeight: '700',
        color: Colors.textPrimary,
    },
    backupMeta: {
        marginTop: 8,
        fontSize: 12,
        color: Colors.textSecondary,
    },
    warningCard: {
        marginTop: 8,
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 10,
        borderColor: 'rgba(255,107,121,0.22)',
        backgroundColor: 'rgba(255,107,121,0.08)',
    },
    warningText: {
        flex: 1,
        fontSize: 13,
        lineHeight: 19,
        color: Colors.error,
    },
    warningInline: {
        marginTop: 12,
        flexDirection: 'row',
        gap: 8,
        alignItems: 'flex-start',
    },
    warningInlineText: {
        flex: 1,
        fontSize: 12,
        lineHeight: 18,
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
    buttonDisabled: {
        opacity: 0.45,
    },
});
