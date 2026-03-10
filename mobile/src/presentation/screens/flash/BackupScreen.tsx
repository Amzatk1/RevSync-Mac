import React, { useEffect, useRef, useState } from 'react';
import { Alert, Animated, BackHandler, Easing, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getInfoAsync } from 'expo-file-system/legacy';
import { ServiceLocator } from '../../../di/ServiceLocator';
import { useAppStore } from '../../store/useAppStore';
import { AppScreen, GlassCard, TopBar } from '../../components/AppUI';
import { Theme } from '../../theme';
import { garageService } from '../../../services/garageService';

const { Colors, Layout, Typography } = Theme;

export const BackupScreen = ({ navigation, route }: any) => {
    const { tuneId, versionId, deviceId, bikeId } = route.params || {};
    const { activeBike } = useAppStore();
    const [targetBike, setTargetBike] = useState<any | null>(null);
    const [status, setStatus] = useState<'idle' | 'reading' | 'uploading' | 'completed' | 'failed'>('idle');
    const [progress, setProgress] = useState(0);
    const [backupPath, setBackupPath] = useState<string | null>(null);
    const [backupId, setBackupId] = useState<number | null>(null);
    const [error, setError] = useState<string | null>(null);
    const pulseAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        const onBackPress = () => {
            if (status === 'reading' || status === 'uploading') {
                Alert.alert('Backup in progress', 'Do not interrupt the ECU backup process.');
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
                    Animated.timing(pulseAnim, { toValue: 1.08, duration: 1000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
                    Animated.timing(pulseAnim, { toValue: 1, duration: 1000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
                ]),
            ).start();
        }
    }, [pulseAnim, status]);

    useEffect(() => {
        const resolveTargetBike = async () => {
            const selectedBikeId = bikeId || activeBike?.id;
            if (!selectedBikeId) {
                setTargetBike(null);
                return;
            }
            try {
                const bikeService = ServiceLocator.getBikeService();
                const bikes = await bikeService.getBikes();
                setTargetBike(bikes.find((entry) => entry.id === selectedBikeId) || null);
            } catch {
                setTargetBike(null);
            }
        };
        resolveTargetBike();
    }, [bikeId, activeBike?.id]);

    const startBackup = async () => {
        setStatus('reading');
        setProgress(0);
        setError(null);
        setBackupId(null);

        try {
            const backupBike = targetBike || activeBike;
            if (!backupBike) {
                throw new Error('Select an active bike before creating a backup.');
            }

            const ecuService = ServiceLocator.getECUService();
            const path = await ecuService.readECU((pct: number) => setProgress(pct));
            setBackupPath(path);
            setStatus('uploading');

            const [info, checksum] = await Promise.all([
                getInfoAsync(path),
                ServiceLocator.getCryptoService().hashFile(path),
            ]);

            const sizeBytes = typeof (info as any).size === 'number' ? (info as any).size : 0;
            const fileSizeKb = Math.max(1, Math.ceil(sizeBytes / 1024));
            const fileName = path.split('/').pop() || `backup_${Date.now()}.bin`;

            const backup = await garageService.createBackup({
                vehicle: Number(backupBike.id),
                storage_key: `device-local/backups/${fileName}`,
                checksum,
                file_size_kb: fileSizeKb,
                notes: 'Captured on mobile via ECU read',
            });
            await garageService.registerLocalBackupPath(backup.id, path, backup.storage_key);

            setBackupId(backup.id);
            setStatus('completed');
        } catch (e: any) {
            setError(e.message || 'Backup failed');
            setStatus('failed');
        }
    };

    const handleNext = () =>
        navigation.navigate('FlashWizard', {
            tuneId,
            versionId,
            deviceId,
            bikeId: targetBike?.id || activeBike?.id,
            backupPath,
            backupId,
        });

    return (
        <AppScreen contentContainerStyle={styles.content}>
            <TopBar
                title="ECU Backup"
                subtitle={
                    targetBike
                        ? `Create a restore point for ${targetBike.year} ${targetBike.make} ${targetBike.model}`
                        : 'Create a restore point before any write operation'
                }
                onBack={() => {
                    if (status === 'reading' || status === 'uploading') {
                        Alert.alert('Backup in progress', 'Do not interrupt the ECU backup process.');
                        return;
                    }
                    navigation.goBack();
                }}
            />

            {status === 'idle' && (
                <>
                    <GlassCard style={styles.heroCard}>
                        <View style={styles.heroIcon}>
                            <Ionicons name="save-outline" size={28} color={Colors.primary} />
                        </View>
                        <Text style={styles.heroTitle}>Create a safety restore point before flashing.</Text>
                        <Text style={styles.heroBody}>RevSync requires a backup so the ECU can be restored if the write fails or the resulting calibration is unusable.</Text>
                    </GlassCard>

                    <GlassCard style={styles.warningCard}>
                        <Ionicons name="warning" size={18} color={Colors.warning} />
                        <Text style={styles.warningText}>Keep the device connected and maintain stable battery power while the backup is being read.</Text>
                    </GlassCard>
                </>
            )}

            {(status === 'reading' || status === 'uploading') && (
                <>
                    <GlassCard style={styles.heroCard}>
                        <Text style={styles.kicker}>{status === 'reading' ? 'Reading ECU' : 'Syncing Backup'}</Text>
                        <Text style={styles.heroTitle}>{status === 'reading' ? 'Reading the current ECU state...' : 'Registering the restore point...'}</Text>
                    </GlassCard>

                    <GlassCard>
                        <View style={styles.progressHeader}>
                            <Text style={styles.sectionLabel}>Progress</Text>
                            <Text style={styles.progressValue}>{Math.round(progress)}%</Text>
                        </View>
                        <View style={styles.progressTrack}>
                            <View style={[styles.progressFill, { width: `${progress}%` }]} />
                        </View>
                        <Text style={styles.progressText}>Do not disconnect power or exit the app during this step.</Text>
                    </GlassCard>
                </>
            )}

            {status === 'completed' && (
                <>
                    <GlassCard style={styles.completedCard}>
                        <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                            <Ionicons name="checkmark-circle" size={62} color={Colors.success} />
                        </Animated.View>
                        <Text style={styles.completedTitle}>Backup secure</Text>
                        {!!backupPath && <Text style={styles.completedPath}>{backupPath}</Text>}
                        {!!backupId && <Text style={styles.completedBody}>Backup record #{backupId} is now available for flash and recovery gating.</Text>}
                        {!backupId && <Text style={styles.completedBody}>The original ECU state is stored. You can now continue to the flash wizard with a restore path available.</Text>}
                    </GlassCard>
                </>
            )}

            {status === 'failed' && (
                <GlassCard style={styles.errorCard}>
                    <Ionicons name="alert-circle" size={18} color={Colors.error} />
                    <Text style={styles.errorText}>{error || 'An unexpected error occurred.'}</Text>
                </GlassCard>
            )}

            <View style={styles.actions}>
                {status === 'idle' && (
                    <TouchableOpacity style={styles.primaryButton} onPress={startBackup}>
                        <Text style={styles.primaryButtonText}>Start Backup</Text>
                    </TouchableOpacity>
                )}
                {status === 'completed' && (
                    <TouchableOpacity style={[styles.primaryButton, { backgroundColor: Colors.success }]} onPress={handleNext}>
                        <Text style={styles.primaryButtonText}>Continue to Flash</Text>
                    </TouchableOpacity>
                )}
                {status === 'failed' && (
                    <TouchableOpacity style={styles.primaryButton} onPress={startBackup}>
                        <Text style={styles.primaryButtonText}>Retry Backup</Text>
                    </TouchableOpacity>
                )}
            </View>
        </AppScreen>
    );
};

const styles = StyleSheet.create({
    content: {
        paddingBottom: 120,
    },
    heroCard: {
        marginTop: 8,
    },
    heroIcon: {
        width: 54,
        height: 54,
        borderRadius: 18,
        backgroundColor: 'rgba(234,16,60,0.10)',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 14,
    },
    kicker: {
        ...Typography.dataLabel,
        color: Colors.accent,
        marginBottom: 8,
    },
    heroTitle: {
        ...Typography.h2,
    },
    heroBody: {
        ...Typography.caption,
        marginTop: 8,
        lineHeight: 20,
    },
    warningCard: {
        marginTop: 12,
        flexDirection: 'row',
        gap: 10,
        alignItems: 'flex-start',
        borderColor: 'rgba(255,184,92,0.22)',
        backgroundColor: 'rgba(255,184,92,0.08)',
    },
    warningText: {
        flex: 1,
        fontSize: 13,
        lineHeight: 19,
        color: Colors.warning,
    },
    progressHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    sectionLabel: {
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
    progressText: {
        marginTop: 10,
        fontSize: 12,
        lineHeight: 18,
        color: Colors.textSecondary,
    },
    completedCard: {
        marginTop: 12,
        alignItems: 'center',
        paddingVertical: 24,
    },
    completedTitle: {
        marginTop: 14,
        fontSize: 22,
        fontWeight: '800',
        color: Colors.success,
    },
    completedPath: {
        marginTop: 10,
        fontSize: 11,
        fontFamily: 'Courier',
        color: Colors.textSecondary,
        textAlign: 'center',
    },
    completedBody: {
        ...Typography.caption,
        marginTop: 10,
        textAlign: 'center',
        maxWidth: 300,
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
});
