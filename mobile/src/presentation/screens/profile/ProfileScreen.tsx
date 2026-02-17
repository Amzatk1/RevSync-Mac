import React, { useEffect, useState } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform, StatusBar, Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppStore } from '../../store/useAppStore';
import { ServiceLocator } from '../../../di/ServiceLocator';

// ── Design tokens matching HTML mockup ──
const C = {
    primary: '#ea103c',
    primaryBadgeBg: 'rgba(225,29,72,0.15)',
    primaryBadgeText: '#FB7185',
    primaryBtnBg: 'rgba(225,29,72,0.10)',
    bg: '#1a1a1a',
    surface: '#2d2d2d',
    surfaceDark: '#262626',
    border: '#404040',
    neutral400: '#a3a3a3',
    neutral500: '#a3a3a3',
    neutral600: '#737373',
    neutral700: '#525252',
    neutral800: '#404040',
    white: '#ffffff',
    emerald: '#10B981',
    blue: '#3B82F6',
};

export const ProfileScreen = ({ navigation }: any) => {
    const { currentUser, signOut, activeBike } = useAppStore();
    const [stats, setStats] = useState({ tunesFlashed: 0, bikesOwned: 0 });

    useEffect(() => {
        loadStats();
    }, []);

    const loadStats = async () => {
        try {
            const bikeService = ServiceLocator.getBikeService();
            const bikes = await bikeService.getBikes();
            setStats({ tunesFlashed: 0, bikesOwned: bikes.length });
        } catch (e) {
            console.log('Failed to load profile stats');
        }
    };

    const handleSignOut = async () => {
        await signOut();
    };

    const initials = currentUser?.email?.substring(0, 2).toUpperCase() || 'US';

    return (
        <View style={styles.root}>
            <StatusBar barStyle="light-content" />

            {/* ─── Header ─── */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Profile</Text>
                <TouchableOpacity
                    style={styles.editBtn}
                    onPress={() => navigation.navigate('ProfileEdit')}
                >
                    <Ionicons name="pencil-outline" size={18} color={C.neutral400} />
                </TouchableOpacity>
            </View>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* ─── Profile Card ─── */}
                <View style={styles.profileCard}>
                    <View style={styles.profileRow}>
                        {/* Avatar */}
                        <View style={styles.avatarOuter}>
                            <View style={styles.avatar}>
                                <Text style={styles.avatarText}>{initials}</Text>
                            </View>
                        </View>
                        {/* Info */}
                        <View style={styles.profileInfo}>
                            <Text style={styles.profileName} numberOfLines={1}>
                                {currentUser?.firstName
                                    ? `${currentUser.firstName} ${currentUser.lastName || ''}`
                                    : currentUser?.email?.split('@')[0] || 'Rider'}
                            </Text>
                            <Text style={styles.profileEmail} numberOfLines={1}>
                                {currentUser?.email || 'rider@revsync.io'}
                            </Text>
                            <View style={styles.badgeRow}>
                                <View style={styles.badge}>
                                    <Text style={styles.badgeText}>PRO MEMBER</Text>
                                </View>
                            </View>
                        </View>
                    </View>
                </View>

                {/* ─── Quick Access ─── */}
                <Text style={styles.sectionTitle}>Quick Access</Text>
                <View style={styles.quickGrid}>
                    {/* Purchases */}
                    <TouchableOpacity style={styles.quickCard} activeOpacity={0.7}>
                        <View style={[styles.quickIconCircle, { backgroundColor: C.primaryBtnBg }]}>
                            <Ionicons name="bag-outline" size={20} color={C.primary} />
                        </View>
                        <View>
                            <Text style={styles.quickLabel}>Purchases</Text>
                            <Text style={styles.quickSub}>{stats.tunesFlashed} Orders</Text>
                        </View>
                    </TouchableOpacity>

                    {/* Active Bike */}
                    <TouchableOpacity style={styles.quickCard} activeOpacity={0.7}>
                        <View style={[styles.quickIconCircle, { backgroundColor: 'rgba(16,185,129,0.10)' }]}>
                            <Ionicons name="bicycle" size={20} color={C.emerald} />
                        </View>
                        <View>
                            <Text style={styles.quickLabel}>Active Bike</Text>
                            <Text style={styles.quickSub} numberOfLines={1}>
                                {activeBike
                                    ? `${activeBike.make} ${activeBike.model}`
                                    : 'None'}
                            </Text>
                        </View>
                    </TouchableOpacity>

                    {/* Tuner Status — full width */}
                    <TouchableOpacity style={[styles.quickCard, styles.quickCardFull]} activeOpacity={0.7}>
                        <View style={styles.quickCardFullInner}>
                            <View style={[styles.quickIconCircle, { backgroundColor: 'rgba(59,130,246,0.10)' }]}>
                                <Ionicons name="options-outline" size={20} color={C.blue} />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.quickLabel}>Tuner Status</Text>
                                <Text style={styles.quickSub}>Authorized Dealer</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color={C.neutral600} />
                        </View>
                    </TouchableOpacity>
                </View>

                {/* ─── General Menu ─── */}
                <Text style={[styles.sectionTitle, { marginTop: 24 }]}>General</Text>
                <View style={styles.menuCard}>
                    <MenuRow
                        icon="settings-outline"
                        label="Settings"
                        onPress={() => navigation.navigate('Settings')}
                        showBorder
                    />
                    <MenuRow
                        icon="help-buoy-outline"
                        label="Support"
                        onPress={() => navigation.navigate('Support')}
                        showBorder
                    />
                    <MenuRow
                        icon="shield-outline"
                        label="Legal"
                        onPress={() => navigation.navigate('LegalMenu')}
                        showBorder={false}
                    />
                </View>

                {/* ─── Sign Out + Version ─── */}
                <View style={styles.signOutRow}>
                    <TouchableOpacity onPress={handleSignOut}>
                        <Text style={styles.signOutText}>Sign Out</Text>
                    </TouchableOpacity>
                    <Text style={styles.versionText}> v2.4.1</Text>
                </View>

                {/* bottom spacer for tab bar */}
                <View style={{ height: 100 }} />
            </ScrollView>
        </View>
    );
};

// ── Menu Row ──
const MenuRow = ({ icon, label, onPress, showBorder }: any) => (
    <TouchableOpacity
        style={[styles.menuRow, showBorder && styles.menuRowBorder]}
        onPress={onPress}
        activeOpacity={0.6}
    >
        <View style={styles.menuRowLeft}>
            <Ionicons name={icon} size={22} color={C.neutral400} />
            <Text style={styles.menuRowLabel}>{label}</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={C.neutral600} />
    </TouchableOpacity>
);

// ════════════════════════════════════════════════════════════════════
const styles = StyleSheet.create({
    root: {
        flex: 1,
        backgroundColor: C.bg,
    },

    // ── Header ──
    header: {
        paddingTop: Platform.OS === 'ios' ? 60 : 44,
        paddingBottom: 20,
        paddingHorizontal: 24,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: 'rgba(26,26,26,0.95)',
    },
    headerTitle: {
        fontSize: 30,
        fontWeight: '800',
        color: C.white,
        letterSpacing: -0.5,
    },
    editBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: C.surface,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: C.border,
    },

    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 16,
        paddingTop: 8,
    },

    // ── Profile Card ──
    profileCard: {
        backgroundColor: C.surface,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: C.border,
        padding: 24,
        marginBottom: 8,
    },
    profileRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 20,
    },
    avatarOuter: {
        width: 80,
        height: 80,
        borderRadius: 40,
        borderWidth: 2,
        borderColor: 'rgba(225,29,72,0.2)',
        alignItems: 'center',
        justifyContent: 'center',
        // glow
        shadowColor: C.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
    },
    avatar: {
        width: 76,
        height: 76,
        borderRadius: 38,
        backgroundColor: C.surfaceDark,
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarText: {
        fontSize: 28,
        fontWeight: '700',
        color: C.primary,
    },
    profileInfo: {
        flex: 1,
        minWidth: 0,
    },
    profileName: {
        fontSize: 20,
        fontWeight: '700',
        color: C.white,
    },
    profileEmail: {
        fontSize: 14,
        color: C.neutral500,
        fontWeight: '500',
        marginTop: 2,
    },
    badgeRow: {
        flexDirection: 'row',
        marginTop: 10,
    },
    badge: {
        backgroundColor: C.neutral800,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 50,
        borderWidth: 1,
        borderColor: C.neutral700,
    },
    badgeText: {
        fontSize: 10,
        fontWeight: '700',
        color: C.neutral400,
        letterSpacing: 0.8,
    },

    // ── Section Title ──
    sectionTitle: {
        fontSize: 12,
        fontWeight: '700',
        color: C.neutral500,
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginLeft: 8,
        marginBottom: 10,
        marginTop: 6,
    },

    // ── Quick Access Grid ──
    quickGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 16,
    },
    quickCard: {
        flex: 1,
        minWidth: '40%',
        backgroundColor: C.surface,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: C.border,
        padding: 16,
        gap: 12,
    },
    quickCardFull: {
        flex: undefined,
        minWidth: '100%',
        width: '100%',
        paddingVertical: 16,
    },
    quickCardFullInner: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    quickIconCircle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    quickLabel: {
        fontSize: 14,
        fontWeight: '700',
        color: C.white,
    },
    quickSub: {
        fontSize: 12,
        color: C.neutral500,
        marginTop: 1,
    },

    // ── General Menu ──
    menuCard: {
        backgroundColor: C.surface,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: C.border,
        overflow: 'hidden',
    },
    menuRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 16,
        paddingHorizontal: 16,
    },
    menuRowBorder: {
        borderBottomWidth: 1,
        borderBottomColor: C.border,
    },
    menuRowLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    menuRowLabel: {
        fontSize: 14,
        fontWeight: '500',
        color: '#D4D4D4',
    },

    // ── Sign Out ──
    signOutRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 16,
        marginTop: 8,
    },
    signOutText: {
        fontSize: 12,
        fontWeight: '600',
        color: C.neutral500,
    },
    versionText: {
        fontSize: 12,
        color: C.neutral500,
    },
});
