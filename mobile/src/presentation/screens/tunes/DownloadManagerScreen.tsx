import React, { useEffect, useState, useCallback } from 'react';
import {
    View, Text, StyleSheet, FlatList, TouchableOpacity,
    Alert, Animated, ActivityIndicator,
} from 'react-native';
import { Theme } from '../../theme';
import { Screen, Card, PrimaryButton } from '../../components/SharedComponents';
import { Ionicons } from '@expo/vector-icons';
import { ServiceLocator } from '../../../di/ServiceLocator';
import type { DownloadProgress, DownloadState, TunePackage } from '../../../domain/services/DomainTypes';
import { StorageAdapter } from '../../../data/services/StorageAdapter';

// ─── Persistent Storage Key ────────────────────────────────────
const VERIFIED_PACKAGES_KEY = 'verified_packages';

// ─── Types ─────────────────────────────────────────────────────
interface PackageEntry {
    versionId: string;
    listingId: string;
    title: string;
    downloadedAt: number;
    signatureVerified: boolean;
    hashesMatch: boolean;
    localPath: string;
}

interface ActiveDownload {
    versionId: string;
    title: string;
    progress: DownloadProgress;
}

// ─── State Color/Icon Maps ─────────────────────────────────────
const stateConfig: Record<DownloadState, { icon: string; color: string; label: string }> = {
    IDLE: { icon: 'cloud-download-outline', color: Theme.Colors.textSecondary, label: 'Ready' },
    DOWNLOADING: { icon: 'cloud-download', color: '#3B82F6', label: 'Downloading' },
    EXTRACTING: { icon: 'folder-open', color: '#8B5CF6', label: 'Extracting' },
    HASHING: { icon: 'finger-print', color: '#F59E0B', label: 'Hashing' },
    VERIFYING_SIGNATURE: { icon: 'shield-checkmark', color: '#F59E0B', label: 'Verifying' },
    VERIFIED: { icon: 'checkmark-circle', color: '#22C55E', label: 'Verified ✓' },
    REJECTED: { icon: 'close-circle', color: '#EF4444', label: 'REJECTED' },
    READY: { icon: 'flash', color: '#22C55E', label: 'Ready to Flash' },
    FAILED: { icon: 'alert-circle', color: '#EF4444', label: 'Failed' },
};

// ─── Component ─────────────────────────────────────────────────

export const DownloadManagerScreen = ({ navigation, route }: any) => {
    const [packages, setPackages] = useState<PackageEntry[]>([]);
    const [activeDownload, setActiveDownload] = useState<ActiveDownload | null>(null);
    const [loading, setLoading] = useState(true);

    // Optional: auto-start download if navigated with params
    const autoDownloadVersionId = route?.params?.versionId;
    const autoDownloadListingId = route?.params?.listingId;
    const autoDownloadTitle = route?.params?.title;

    useEffect(() => {
        loadPackages();
    }, []);

    useEffect(() => {
        if (autoDownloadVersionId && autoDownloadListingId) {
            startDownload(autoDownloadVersionId, autoDownloadListingId, autoDownloadTitle || 'Tune');
        }
    }, [autoDownloadVersionId]);

    // ─── Data Loading ──────────────────────────────────────────

    const loadPackages = async () => {
        setLoading(true);
        try {
            const stored = await StorageAdapter.get<PackageEntry[]>(VERIFIED_PACKAGES_KEY);
            setPackages(stored || []);
        } catch {
            setPackages([]);
        } finally {
            setLoading(false);
        }
    };

    // ─── Download Pipeline ─────────────────────────────────────

    const startDownload = useCallback(async (
        versionId: string,
        listingId: string,
        title: string
    ) => {
        const downloadService = ServiceLocator.getDownloadService();

        setActiveDownload({
            versionId,
            title,
            progress: {
                state: 'DOWNLOADING',
                bytesDownloaded: 0,
                totalBytes: 0,
                percent: 0,
                message: 'Starting download...',
            },
        });

        const result = await downloadService.downloadAndVerify(
            versionId,
            listingId,
            (progress) => {
                setActiveDownload(prev => prev ? { ...prev, progress } : null);
            }
        );

        if (result.success && result.package) {
            // Persist to storage
            const entry: PackageEntry = {
                versionId: result.package.versionId,
                listingId: result.package.listingId,
                title,
                downloadedAt: result.package.downloadedAt,
                signatureVerified: result.package.signatureVerified,
                hashesMatch: result.package.hashesMatch,
                localPath: result.package.localPkgPath,
            };
            const updated = [...packages.filter(p => p.versionId !== versionId), entry];
            setPackages(updated);
            await StorageAdapter.set(VERIFIED_PACKAGES_KEY, updated);

            // Clear active download after animation
            setTimeout(() => setActiveDownload(null), 2000);
        } else {
            // Keep error visible briefly
            setTimeout(() => setActiveDownload(null), 4000);
        }
    }, [packages]);

    // ─── Delete Package ────────────────────────────────────────

    const handleDelete = (entry: PackageEntry) => {
        Alert.alert(
            'Delete Package',
            `Remove "${entry.title}" from device storage?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        const downloadService = ServiceLocator.getDownloadService();
                        await downloadService.deletePackage(entry.versionId);
                        const updated = packages.filter(p => p.versionId !== entry.versionId);
                        setPackages(updated);
                        await StorageAdapter.set(VERIFIED_PACKAGES_KEY, updated);
                    },
                },
            ]
        );
    };

    // ─── Re-Verify ─────────────────────────────────────────────

    const handleReverify = async (entry: PackageEntry) => {
        const downloadService = ServiceLocator.getDownloadService();
        const pkg: TunePackage = {
            versionId: entry.versionId,
            listingId: entry.listingId,
            localPkgPath: entry.localPath,
            tuneBinPath: entry.localPath,
            manifestPath: '',
            signatureBase64: '',
            tuneHashSha256: '',
            serverHashes: {} as any,
            signatureVerified: entry.signatureVerified,
            hashesMatch: entry.hashesMatch,
            downloadedAt: entry.downloadedAt,
        };

        const isValid = await downloadService.reverify(pkg);
        Alert.alert(
            isValid ? '✅ Package Valid' : '❌ Verification Failed',
            isValid
                ? 'This package is still intact and ready to flash.'
                : 'The package integrity check failed. Re-download recommended.'
        );
    };

    // ─── Render ────────────────────────────────────────────────

    const renderActiveDownload = () => {
        if (!activeDownload) return null;
        const { progress } = activeDownload;
        const config = stateConfig[progress.state];

        return (
            <Card style={styles.activeCard}>
                <View style={styles.activeHeader}>
                    <Ionicons name={config.icon as any} size={24} color={config.color} />
                    <View style={{ flex: 1 }}>
                        <Text style={styles.activeTitle}>{activeDownload.title}</Text>
                        <Text style={[styles.activeState, { color: config.color }]}>{config.label}</Text>
                    </View>
                    {(progress.state === 'DOWNLOADING' || progress.state === 'HASHING' || progress.state === 'VERIFYING_SIGNATURE') && (
                        <ActivityIndicator size="small" color={config.color} />
                    )}
                </View>

                {/* Progress Bar */}
                <View style={styles.progressBarBg}>
                    <Animated.View
                        style={[
                            styles.progressBarFill,
                            {
                                width: `${progress.percent}%`,
                                backgroundColor: config.color,
                            },
                        ]}
                    />
                </View>

                <Text style={styles.progressMessage}>{progress.message}</Text>

                {progress.state === 'REJECTED' && (
                    <View style={styles.rejectedBanner}>
                        <Ionicons name="warning" size={16} color="#EF4444" />
                        <Text style={styles.rejectedText}>
                            Package failed integrity verification. Files have been purged.
                        </Text>
                    </View>
                )}
            </Card>
        );
    };

    const renderPackageItem = ({ item }: { item: PackageEntry }) => (
        <Card style={styles.card}>
            <View style={styles.cardRow}>
                <View style={[styles.verifyBadge, {
                    backgroundColor: item.signatureVerified ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
                }]}>
                    <Ionicons
                        name={item.signatureVerified ? 'shield-checkmark' : 'shield-outline'}
                        size={20}
                        color={item.signatureVerified ? '#22C55E' : '#EF4444'}
                    />
                </View>
                <View style={{ flex: 1 }}>
                    <Text style={styles.cardTitle}>{item.title}</Text>
                    <Text style={styles.cardMeta}>
                        Downloaded {new Date(item.downloadedAt).toLocaleDateString()}
                    </Text>
                    <View style={styles.verifyRow}>
                        <VerifyChip ok={item.signatureVerified} label="Signed" />
                        <VerifyChip ok={item.hashesMatch} label="Hash ✓" />
                    </View>
                </View>
                <View style={styles.actions}>
                    <TouchableOpacity onPress={() => handleReverify(item)} style={styles.actionBtn}>
                        <Ionicons name="refresh-outline" size={18} color={Theme.Colors.primary} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleDelete(item)} style={styles.actionBtn}>
                        <Ionicons name="trash-outline" size={18} color={Theme.Colors.error} />
                    </TouchableOpacity>
                </View>
            </View>
        </Card>
    );

    return (
        <Screen>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color={Theme.Colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Downloads & Storage</Text>
                <View style={styles.headerBadge}>
                    <Text style={styles.headerBadgeText}>{packages.length}</Text>
                </View>
            </View>

            {/* Active Download */}
            {renderActiveDownload()}

            {/* Package List */}
            {packages.length === 0 && !activeDownload ? (
                <View style={styles.emptyState}>
                    <View style={styles.emptyIcon}>
                        <Ionicons name="cloud-offline-outline" size={48} color={Theme.Colors.textSecondary} />
                    </View>
                    <Text style={styles.emptyText}>No Verified Packages</Text>
                    <Text style={styles.emptySubText}>
                        Purchase a tune and download it to see it here.{'\n'}
                        All packages are cryptographically verified before use.
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={packages}
                    keyExtractor={(item) => item.versionId}
                    renderItem={renderPackageItem}
                    contentContainerStyle={styles.list}
                    showsVerticalScrollIndicator={false}
                />
            )}
        </Screen>
    );
};

// ─── Small Components ──────────────────────────────────────────

const VerifyChip = ({ ok, label }: { ok: boolean; label: string }) => (
    <View style={[styles.chip, { backgroundColor: ok ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)' }]}>
        <Ionicons
            name={ok ? 'checkmark-circle' : 'close-circle'}
            size={12}
            color={ok ? '#22C55E' : '#EF4444'}
        />
        <Text style={[styles.chipText, { color: ok ? '#22C55E' : '#EF4444' }]}>{label}</Text>
    </View>
);

// ─── Styles ────────────────────────────────────────────────────

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: Theme.Spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: Theme.Colors.surfaceHighlight,
    },
    backBtn: { marginRight: 16 },
    headerTitle: { ...Theme.Typography.h2, fontSize: 20, flex: 1 },
    headerBadge: {
        backgroundColor: Theme.Colors.primary,
        borderRadius: 12,
        paddingHorizontal: 10,
        paddingVertical: 3,
        minWidth: 28,
        alignItems: 'center',
    },
    headerBadgeText: { color: '#FFF', fontSize: 13, fontWeight: '700' },
    list: { padding: Theme.Spacing.md, paddingBottom: 100 },
    // Active Download
    activeCard: {
        margin: Theme.Spacing.md,
        borderWidth: 1,
        borderColor: 'rgba(59,130,246,0.3)',
    },
    activeHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 12,
    },
    activeTitle: { ...Theme.Typography.body, fontWeight: '700' },
    activeState: { fontSize: 13, fontWeight: '600', marginTop: 2 },
    progressBarBg: {
        height: 6,
        backgroundColor: 'rgba(255,255,255,0.06)',
        borderRadius: 3,
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        borderRadius: 3,
    },
    progressMessage: {
        fontSize: 12,
        color: Theme.Colors.textSecondary,
        marginTop: 8,
    },
    rejectedBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: 'rgba(239,68,68,0.1)',
        padding: 10,
        borderRadius: 8,
        marginTop: 10,
        borderWidth: 1,
        borderColor: 'rgba(239,68,68,0.3)',
    },
    rejectedText: { color: '#EF4444', fontSize: 12, flex: 1 },
    // Package Cards
    card: { marginBottom: 12 },
    cardRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    verifyBadge: {
        width: 44,
        height: 44,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    cardTitle: { ...Theme.Typography.body, fontWeight: '700' },
    cardMeta: { fontSize: 12, color: Theme.Colors.textSecondary, marginTop: 2 },
    verifyRow: { flexDirection: 'row', gap: 8, marginTop: 6 },
    chip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 8,
    },
    chipText: { fontSize: 11, fontWeight: '600' },
    actions: { gap: 4 },
    actionBtn: { padding: 6 },
    // Empty State
    emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
    emptyIcon: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(255,255,255,0.04)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    emptyText: { ...Theme.Typography.h3, textAlign: 'center' },
    emptySubText: {
        ...Theme.Typography.body,
        color: Theme.Colors.textSecondary,
        textAlign: 'center',
        marginTop: 8,
        lineHeight: 20,
    },
});
