import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppStore } from '../../store/useAppStore';
import { ServiceLocator } from '../../../di/ServiceLocator';
import { AppScreen, TopBar, GlassCard, SectionLabel } from '../../components/AppUI';
import { Theme } from '../../theme';

type QuickStat = { label: string; value: string; icon: keyof typeof Ionicons.glyphMap; color: string };

const MENU: Array<{ label: string; icon: keyof typeof Ionicons.glyphMap; screen: string; desc: string }> = [
    { label: 'Settings', icon: 'settings-outline', screen: 'Settings', desc: 'App controls and preferences' },
    { label: 'Support', icon: 'help-buoy-outline', screen: 'Support', desc: 'Get help and report issues' },
    { label: 'Legal', icon: 'shield-checkmark-outline', screen: 'LegalMenu', desc: 'Policies and agreements' },
    { label: 'Privacy', icon: 'eye-off-outline', screen: 'Privacy', desc: 'Data controls and export' },
    { label: 'About', icon: 'information-circle-outline', screen: 'About', desc: 'Version and platform details' },
];

export const ProfileScreen = ({ navigation }: any) => {
    const insets = useSafeAreaInsets();
    const { currentUser, activeBike, signOut } = useAppStore();
    const [stats, setStats] = useState({ tunesFlashed: 0, bikesOwned: 0 });

    useEffect(() => {
        (async () => {
            try {
                const bikes = await ServiceLocator.getBikeService().getBikes();
                let tunesFlashed = 0;
                try {
                    const { ApiClient } = await import('../../../data/http/ApiClient');
                    const flashJobs = await ApiClient.getInstance().get<{ count?: number; results?: any[] }>('/v1/garage/flash-jobs/');
                    tunesFlashed = flashJobs.count || flashJobs.results?.length || 0;
                } catch {
                    // ignore backend-offline path
                }
                setStats({ tunesFlashed, bikesOwned: bikes.length });
            } catch (e) {
                console.warn('Profile stats load failed', e);
            }
        })();
    }, []);

    const displayName = currentUser?.firstName
        ? `${currentUser.firstName}${currentUser.lastName ? ` ${currentUser.lastName}` : ''}`
        : currentUser?.email?.split('@')[0] || 'Rider';
    const initials = displayName.slice(0, 2).toUpperCase();

    const quickStats: QuickStat[] = [
        { label: 'Flashes', value: String(stats.tunesFlashed), icon: 'flash-outline', color: '#FB7185' },
        { label: 'Bikes', value: String(stats.bikesOwned), icon: 'bicycle-outline', color: '#60A5FA' },
        { label: 'Active', value: activeBike ? `${activeBike.make} ${activeBike.model}` : 'None', icon: 'checkmark-circle-outline', color: '#4ADE80' },
    ];

    return (
        <AppScreen>
            <TopBar
                title="Profile"
                subtitle="Account, safety, and workspace controls"
                right={
                    <TouchableOpacity style={styles.editBtn} onPress={() => navigation.navigate('ProfileEdit')} activeOpacity={0.8}>
                        <Ionicons name="pencil-outline" size={16} color={Theme.Colors.text} />
                    </TouchableOpacity>
                }
            />

            <FlatList
                data={MENU}
                keyExtractor={(item) => item.label}
                contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: insets.bottom + 110 }}
                showsVerticalScrollIndicator={false}
                ListHeaderComponent={
                    <>
                        <GlassCard style={styles.identityCard}>
                            <View style={styles.identityRow}>
                                <View style={styles.avatarWrap}>
                                    <Text style={styles.avatarText}>{initials}</Text>
                                </View>
                                <View style={{ flex: 1, minWidth: 0 }}>
                                    <Text style={styles.nameText} numberOfLines={1}>{displayName}</Text>
                                    <Text style={styles.emailText} numberOfLines={1}>{currentUser?.email || 'Not signed in'}</Text>
                                    <View style={styles.rolePill}>
                                        <Text style={styles.roleText}>RevSync Workspace</Text>
                                    </View>
                                </View>
                            </View>
                        </GlassCard>

                        <SectionLabel label="Quick Snapshot" />
                        <View style={styles.statsGrid}>
                            {quickStats.map((item) => (
                                <GlassCard key={item.label} style={styles.statCard}>
                                    <Ionicons name={item.icon} size={16} color={item.color} />
                                    <Text numberOfLines={1} style={styles.statValue}>{item.value}</Text>
                                    <Text style={styles.statLabel}>{item.label}</Text>
                                </GlassCard>
                            ))}
                        </View>

                        <SectionLabel label="Workspace" />
                    </>
                }
                renderItem={({ item }) => (
                    <TouchableOpacity
                        style={styles.menuRow}
                        onPress={() => navigation.navigate(item.screen)}
                        activeOpacity={0.8}
                    >
                        <View style={styles.menuLeft}>
                            <View style={styles.menuIconWrap}>
                                <Ionicons name={item.icon} size={18} color={Theme.Colors.textSecondary} />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.menuTitle}>{item.label}</Text>
                                <Text style={styles.menuDesc}>{item.desc}</Text>
                            </View>
                        </View>
                        <Ionicons name="chevron-forward" size={17} color={Theme.Colors.textTertiary} />
                    </TouchableOpacity>
                )}
                ListFooterComponent={
                    <View style={styles.footerBlock}>
                        <TouchableOpacity onPress={signOut} style={styles.signOutBtn} activeOpacity={0.8}>
                            <Ionicons name="log-out-outline" size={16} color="#FCA5A5" />
                            <Text style={styles.signOutText}>Sign Out</Text>
                        </TouchableOpacity>
                        <Text style={styles.version}>RevSync Mobile v2.4.1 (Build 8902)</Text>
                    </View>
                }
            />
        </AppScreen>
    );
};

const styles = StyleSheet.create({
    editBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: Theme.Colors.border,
        backgroundColor: 'rgba(255,255,255,0.06)',
    },
    identityCard: {
        marginTop: 4,
    },
    identityRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    avatarWrap: {
        width: 62,
        height: 62,
        borderRadius: 31,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1.5,
        borderColor: 'rgba(234,16,60,0.35)',
        backgroundColor: 'rgba(234,16,60,0.12)',
    },
    avatarText: {
        fontSize: 22,
        fontWeight: '800',
        color: Theme.Colors.primary,
    },
    nameText: {
        fontSize: 20,
        letterSpacing: -0.35,
        fontWeight: '800',
        color: Theme.Colors.text,
    },
    emailText: {
        marginTop: 2,
        fontSize: 12,
        color: Theme.Colors.textSecondary,
    },
    rolePill: {
        marginTop: 8,
        alignSelf: 'flex-start',
        borderRadius: 999,
        paddingHorizontal: 10,
        paddingVertical: 5,
        backgroundColor: 'rgba(234,16,60,0.16)',
        borderWidth: 1,
        borderColor: 'rgba(234,16,60,0.3)',
    },
    roleText: {
        fontSize: 10,
        letterSpacing: 0.9,
        fontWeight: '800',
        textTransform: 'uppercase',
        color: '#FB7185',
    },
    statsGrid: {
        flexDirection: 'row',
        gap: 8,
    },
    statCard: {
        flex: 1,
        paddingVertical: 12,
        gap: 2,
    },
    statValue: {
        marginTop: 2,
        fontSize: 15,
        fontWeight: '800',
        color: Theme.Colors.text,
    },
    statLabel: {
        fontSize: 10,
        letterSpacing: 0.8,
        textTransform: 'uppercase',
        fontWeight: '700',
        color: Theme.Colors.textSecondary,
    },
    menuRow: {
        marginBottom: 8,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: Theme.Colors.border,
        backgroundColor: 'rgba(20,22,33,0.74)',
        paddingHorizontal: 12,
        paddingVertical: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    menuLeft: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        paddingRight: 6,
    },
    menuIconWrap: {
        width: 34,
        height: 34,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderWidth: 1,
        borderColor: Theme.Colors.border,
    },
    menuTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: Theme.Colors.text,
    },
    menuDesc: {
        marginTop: 2,
        fontSize: 12,
        color: Theme.Colors.textSecondary,
    },
    footerBlock: {
        marginTop: 8,
        alignItems: 'center',
    },
    signOutBtn: {
        borderRadius: 999,
        borderWidth: 1,
        borderColor: 'rgba(239,68,68,0.25)',
        backgroundColor: 'rgba(239,68,68,0.12)',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 14,
        paddingVertical: 9,
    },
    signOutText: {
        fontSize: 12,
        fontWeight: '800',
        textTransform: 'uppercase',
        letterSpacing: 0.35,
        color: '#FCA5A5',
    },
    version: {
        marginTop: 12,
        fontSize: 11,
        color: Theme.Colors.textTertiary,
    },
});
