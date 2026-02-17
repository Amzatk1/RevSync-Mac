import React, { useEffect, useState, useCallback } from 'react';
import {
    View, Text, StyleSheet, FlatList, TouchableOpacity,
    Alert, Animated, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { ServiceLocator } from '../../../di/ServiceLocator';
import type { DownloadProgress, DownloadState, TunePackage } from '../../../domain/services/DomainTypes';
import { StorageAdapter } from '../../../data/services/StorageAdapter';

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
    IDLE: { icon: 'cloud-download-outline', color: C.muted, label: 'Ready' },
    DOWNLOADING: { icon: 'cloud-download', color: '#3B82F6', label: 'Downloading' },
    EXTRACTING: { icon: 'folder-open', color: '#8B5CF6', label: 'Extracting' },
    HASHING: { icon: 'finger-print', color: '#F59E0B', label: 'Hashing' },
    VERIFYING_SIGNATURE: { icon: 'shield-checkmark', color: '#F59E0B', label: 'Verifying' },
    VERIFIED: { icon: 'checkmark-circle', color: C.success, label: 'Verified ✓' },
    REJECTED: { icon: 'close-circle', color: C.error, label: 'REJECTED' },
    READY: { icon: 'flash', color: C.success, label: 'Ready to Flash' },
    FAILED: { icon: 'alert-circle', color: C.error, label: 'Failed' },
};

// ─── Component ─────────────────────────────────────────────────

export const DownloadManagerScreen = ({ navigation, route }: any) => {
    const [packages, setPackages] = useState<PackageEntry[]>([]);
    const [activeDownload, setActiveDownload] = useState<ActiveDownload | null>(null);
    const [loading, setLoading] = useState(true);

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
            setTimeout(() => setActiveDownload(null), 2000);
        } else {
            setTimeout(() => setActiveDownload(null), 4000);
        }
    }, [packages]);

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

    // ─── Render Active Download ────────────────────────────────
    const renderActiveDownload = () => {
        if (!activeDownload) return null;
        const { progress } = activeDownload;
        const config = stateConfig[progress.state];

        return (
            <View style={s.activeCard}>
                <View style={s.activeHeader}>
                    <View style={[s.stateIconCircle, { backgroundColor: `${config.color}15` }]}>
                        <Ionicons name={config.icon as any} size={22} color={config.color} />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={s.activeTitle}>{activeDownload.title}</Text>
                        <Text style={[s.activeState, { color: config.color }]}>{config.label}</Text>
                    </View>
                    {(progress.state === 'DOWNLOADING' || progress.state === 'HASHING' || progress.state === 'VERIFYING_SIGNATURE') && (
                        <ActivityIndicator size="small" color={config.color} />
                    )}
                </View>

                <View style={s.progressBarBg}>
                    <Animated.View
                        style={[s.progressBarFill, {
                            width: `${progress.percent}%`,
                            backgroundColor: config.color,
                        }]}
                    />
                </View>

                <Text style={s.progressMessage}>{progress.message}</Text>

                {progress.state === 'REJECTED' && (
                    <View style={s.rejectedBanner}>
                        <Ionicons name="warning" size={16} color={C.error} />
                        <Text style={s.rejectedText}>
                            Package failed integrity verification. Files have been purged.
                        </Text>
                    </View>
                )}
            </View>
        );
    };

    // ─── Render Package Item ──────────────────────────────────
    const renderPackageItem = ({ item }: { item: PackageEntry }) => (
        <View style={s.pkgCard}>
            <View style={s.pkgRow}>
                <View style={[s.verifyBadge, {
                    backgroundColor: item.signatureVerified ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
                }]}>
                    <Ionicons
                        name={item.signatureVerified ? 'shield-checkmark' : 'shield-outline'}
                        size={22}
                        color={item.signatureVerified ? C.success : C.error}
                    />
                </View>
                <View style={{ flex: 1 }}>
                    <Text style={s.pkgTitle}>{item.title}</Text>
                    <Text style={s.pkgMeta}>
                        Downloaded {new Date(item.downloadedAt).toLocaleDateString()}
                    </Text>
                    <View style={s.chipRow}>
                        <VerifyChip ok={item.signatureVerified} label="Signed" />
                        <VerifyChip ok={item.hashesMatch} label="Hash ✓" />
                    </View>
                </View>
                <View style={s.actions}>
                    <TouchableOpacity onPress={() => handleReverify(item)} style={s.actionBtn}>
                        <Ionicons name="refresh-outline" size={18} color={C.primary} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleDelete(item)} style={s.actionBtn}>
                        <Ionicons name="trash-outline" size={18} color={C.error} />
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );

    return (
        <SafeAreaView style={s.root} edges={['top']}>
            {/* ─── Header ─── */}
            <View style={s.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
                    <Ionicons name="arrow-back" size={24} color={C.text} />
                </TouchableOpacity>
                <Text style={s.headerTitle}>Downloads & Storage</Text>
                <View style={s.countBadge}>
                    <Text style={s.countText}>{packages.length}</Text>
                </View>
            </View>

            {/* ─── Active Download ─── */}
            {renderActiveDownload()}

            {/* ─── Package List or Empty ─── */}
            {packages.length === 0 && !activeDownload ? (
                <View style={s.emptyState}>
                    <View style={s.emptyCircle}>
                        <Ionicons name="cloud-offline-outline" size={48} color={C.muted} />
                    </View>
                    <Text style={s.emptyTitle}>No Verified Packages</Text>
                    <Text style={s.emptySub}>
                        Purchase a tune and download it to see it here.{'\n'}
                        All packages are cryptographically verified before use.
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={packages}
                    keyExtractor={(item) => item.versionId}
                    renderItem={renderPackageItem}
                    contentContainerStyle={s.list}
                    showsVerticalScrollIndicator={false}
                />
            )}
        </SafeAreaView>
    );
};

// ─── Small Components ──────────────────────────────────────────
const VerifyChip = ({ ok, label }: { ok: boolean; label: string }) => (
    <View style={[s.chip, { backgroundColor: ok ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)' }]}>
        <Ionicons
            name={ok ? 'checkmark-circle' : 'close-circle'}
            size={12}
            color={ok ? C.success : C.error}
        />
        <Text style={[s.chipText, { color: ok ? C.success : C.error }]}>{label}</Text>
    </View>
);

// ─── Styles ────────────────────────────────────────────────────
const s = StyleSheet.create({
    root: { flex: 1, backgroundColor: C.bg },
    header: {
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: 16, height: 56,
        borderBottomWidth: 1, borderBottomColor: C.border,
    },
    backBtn: { marginRight: 16 },
    headerTitle: { fontSize: 18, fontWeight: '700', color: C.text, flex: 1 },
    countBadge: {
        backgroundColor: C.primary, borderRadius: 12,
        paddingHorizontal: 10, paddingVertical: 3,
        minWidth: 28, alignItems: 'center',
    },
    countText: { color: '#FFF', fontSize: 13, fontWeight: '700' },

    list: { padding: 16, paddingBottom: 100, gap: 12 },

    // Active Download Card
    activeCard: {
        margin: 16,
        backgroundColor: C.surface,
        borderRadius: 20, padding: 16,
        borderWidth: 1, borderColor: 'rgba(59,130,246,0.2)',
    },
    activeHeader: {
        flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12,
    },
    stateIconCircle: {
        width: 40, height: 40, borderRadius: 12,
        alignItems: 'center', justifyContent: 'center',
    },
    activeTitle: { fontSize: 16, fontWeight: '700', color: C.text },
    activeState: { fontSize: 13, fontWeight: '600', marginTop: 2 },
    progressBarBg: {
        height: 6, backgroundColor: 'rgba(255,255,255,0.06)',
        borderRadius: 3, overflow: 'hidden',
    },
    progressBarFill: { height: '100%', borderRadius: 3 },
    progressMessage: { fontSize: 12, color: C.muted, marginTop: 8 },
    rejectedBanner: {
        flexDirection: 'row', alignItems: 'center', gap: 8,
        backgroundColor: 'rgba(239,68,68,0.1)',
        padding: 10, borderRadius: 12, marginTop: 10,
        borderWidth: 1, borderColor: 'rgba(239,68,68,0.3)',
    },
    rejectedText: { color: C.error, fontSize: 12, flex: 1 },

    // Package Cards
    pkgCard: {
        backgroundColor: C.surface,
        borderRadius: 16, padding: 16,
    },
    pkgRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
    verifyBadge: {
        width: 44, height: 44, borderRadius: 12,
        justifyContent: 'center', alignItems: 'center',
    },
    pkgTitle: { fontSize: 16, fontWeight: '700', color: C.text },
    pkgMeta: { fontSize: 12, color: C.muted, marginTop: 2 },
    chipRow: { flexDirection: 'row', gap: 8, marginTop: 6 },
    chip: {
        flexDirection: 'row', alignItems: 'center', gap: 4,
        paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8,
    },
    chipText: { fontSize: 11, fontWeight: '600' },
    actions: { gap: 4 },
    actionBtn: { padding: 6 },

    // Empty State
    emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
    emptyCircle: {
        width: 88, height: 88, borderRadius: 44,
        backgroundColor: 'rgba(255,255,255,0.04)',
        justifyContent: 'center', alignItems: 'center',
        marginBottom: 20,
    },
    emptyTitle: { fontSize: 20, fontWeight: '800', color: C.text, textAlign: 'center' },
    emptySub: {
        fontSize: 14, color: C.muted, textAlign: 'center',
        marginTop: 8, lineHeight: 20,
    },
});
