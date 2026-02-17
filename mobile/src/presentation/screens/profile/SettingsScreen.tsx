import React from 'react';
import {
    View, Text, StyleSheet, Switch, TouchableOpacity, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSettingsStore } from '../../store/useSettingsStore';
import { useAppStore } from '../../store/useAppStore';
import { Ionicons } from '@expo/vector-icons';

// ─── Color Tokens ──────────────────────────────────────────────
const C = {
    bg: '#1a1a1a',
    surface: '#252525',
    border: 'rgba(255,255,255,0.05)',
    divider: 'rgba(255,255,255,0.04)',
    text: '#FFFFFF',
    muted: '#9ca3af',
    primary: '#ea103c',
};

// ─── Tinted Icon Colors ────────────────────────────────────────
const tint = (hex: string, opacity = 0.1) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r},${g},${b},${opacity})`;
};

export const SettingsScreen = ({ navigation }: any) => {
    const { units, toggleUnits, notificationsEnabled, toggleNotifications } = useSettingsStore();
    const currentUser = useAppStore((s) => s.currentUser);

    const displayName = currentUser?.firstName
        ? `${currentUser.firstName}${currentUser.lastName ? ' ' + currentUser.lastName : ''}`
        : currentUser?.email || 'Rider';

    return (
        <SafeAreaView style={s.root} edges={['top']}>
            {/* ─── Header ─── */}
            <View style={s.header}>
                <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color={C.text} />
                </TouchableOpacity>
                <Text style={s.headerTitle}>Settings</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>

                {/* ─── Account & Security ─── */}
                <SectionLabel title="Account & Security" />
                <View style={s.card}>
                    <TouchableOpacity style={[s.row, { height: 72 }]} onPress={() => navigation.navigate('ProfileEdit')}>
                        <View style={s.avatarCircle}>
                            <Ionicons name="person" size={20} color={C.muted} />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={s.rowLabel}>{displayName}</Text>
                            <Text style={s.rowSub}>{currentUser?.email || 'Not signed in'}</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={24} color={C.muted} />
                    </TouchableOpacity>
                    <View style={s.divider} />
                    <MenuRow label="Change Password" iconName="lock-closed" iconColor={C.primary} iconBg={tint(C.primary)} onPress={() => { }} />
                </View>

                {/* ─── Hardware ─── */}
                <SectionLabel title="Hardware" />
                <View style={s.card}>
                    <MenuRow label="Connect ECU" iconName="bluetooth" iconColor="#3B82F6" iconBg={tint('#3B82F6')} onPress={() => navigation.navigate('Flash', { screen: 'DeviceConnect' })} badge="Connected" />
                    <View style={s.divider} />
                    <MenuRow label="Firmware Update" iconName="download-outline" iconColor="#F97316" iconBg={tint('#F97316')} onPress={() => { }} badgeDot versionText="v2.4.1" />
                </View>

                {/* ─── Data & Safety ─── */}
                <SectionLabel title="Data & Safety" />
                <View style={s.card}>
                    <MenuRow label="Data Logging" iconName="analytics-outline" iconColor="#22C55E" iconBg={tint('#22C55E')} onPress={() => navigation.navigate('LogsExport')} />
                    <View style={s.divider} />
                    <MenuRow label="Safety Limits" iconName="shield-half-outline" iconColor={C.primary} iconBg={tint(C.primary)} onPress={() => navigation.navigate('FlashingSafetySettings')} activeBadge="3 Active" />
                    <View style={s.divider} />
                    <MenuRow label="Privacy" iconName="eye-off-outline" iconColor="#A855F7" iconBg={tint('#A855F7')} onPress={() => navigation.navigate('Privacy')} />
                </View>

                {/* ─── Preferences ─── */}
                <SectionLabel title="Preferences" />
                <View style={s.card}>
                    {/* Units Segmented Control */}
                    <View style={s.row}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <View style={[s.iconCircle, { backgroundColor: tint('#A855F7') }]}>
                                <Ionicons name="speedometer-outline" size={20} color="#A855F7" />
                            </View>
                            <Text style={s.rowLabel}>Units</Text>
                        </View>
                        <TouchableOpacity style={s.segmentedControl} onPress={toggleUnits} activeOpacity={0.7}>
                            <View style={[s.segmentPill, units === 'metric' && s.segmentActive]}>
                                <Text style={[s.segmentText, units === 'metric' && s.segmentTextActive]}>Metric</Text>
                            </View>
                            <View style={[s.segmentPill, units === 'imperial' && s.segmentActive]}>
                                <Text style={[s.segmentText, units === 'imperial' && s.segmentTextActive]}>Imperial</Text>
                            </View>
                        </TouchableOpacity>
                    </View>
                    <View style={s.divider} />
                    {/* Notifications Toggle */}
                    <View style={s.row}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <View style={[s.iconCircle, { backgroundColor: tint('#EAB308') }]}>
                                <Ionicons name="notifications-outline" size={20} color="#EAB308" />
                            </View>
                            <Text style={s.rowLabel}>Notifications</Text>
                        </View>
                        <Switch
                            value={notificationsEnabled}
                            onValueChange={toggleNotifications}
                            trackColor={{ false: '#3f3f46', true: C.primary }}
                            thumbColor="#FFF"
                        />
                    </View>
                </View>

                {/* ─── Support & Legal ─── */}
                <SectionLabel title="Support & Legal" />
                <View style={s.card}>
                    <MenuRow label="Help Center" iconName="help-circle-outline" iconColor="#14B8A6" iconBg={tint('#14B8A6')} onPress={() => navigation.navigate('Support')} />
                    <View style={s.divider} />
                    <MenuRow label="Terms of Service" iconName="document-text-outline" iconColor="#6B7280" iconBg={tint('#6B7280')} onPress={() => navigation.navigate('LegalMenu')} />
                    <View style={s.divider} />
                    <MenuRow label="Agreements" iconName="checkmark-done-outline" iconColor="#3B82F6" iconBg={tint('#3B82F6')} onPress={() => navigation.navigate('Agreements')} />
                    <View style={s.divider} />
                    <MenuRow label="About" iconName="information-circle-outline" iconColor="#8B5CF6" iconBg={tint('#8B5CF6')} onPress={() => navigation.navigate('About')} />
                </View>

                {/* ─── Footer ─── */}
                <View style={s.footer}>
                    <Text style={s.footerText}>RevSync App v2.4.1 (Build 8902)</Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

// ─── Section Label ─────────────────────────────────────────────
const SectionLabel = ({ title }: { title: string }) => (
    <Text style={s.sectionLabel}>{title}</Text>
);

// ─── Menu Row ──────────────────────────────────────────────────
const MenuRow = ({ label, iconName, iconColor, iconBg, onPress, badge, badgeDot, versionText, activeBadge }: any) => (
    <TouchableOpacity style={s.row} onPress={onPress} activeOpacity={0.6}>
        <View style={[s.iconCircle, { backgroundColor: iconBg }]}>
            <Ionicons name={iconName} size={20} color={iconColor} />
        </View>
        <Text style={[s.rowLabel, { flex: 1 }]}>{label}</Text>
        {badge && <Text style={s.badge}>{badge}</Text>}
        {activeBadge && (
            <View style={s.activeBadgePill}>
                <View style={s.activeDot} />
                <Text style={s.activeBadgeText}>{activeBadge}</Text>
            </View>
        )}
        {badgeDot && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View style={s.pulseDot} />
                {versionText && <Text style={s.versionText}>{versionText}</Text>}
            </View>
        )}
        <Ionicons name="chevron-forward" size={24} color={C.muted} style={{ marginLeft: 8 }} />
    </TouchableOpacity>
);

// ─── Styles ────────────────────────────────────────────────────
const s = StyleSheet.create({
    root: { flex: 1, backgroundColor: C.bg },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        height: 56,
        borderBottomWidth: 1,
        borderBottomColor: C.border,
    },
    backBtn: {
        width: 40, height: 40,
        borderRadius: 20,
        alignItems: 'center', justifyContent: 'center',
    },
    headerTitle: { fontSize: 18, fontWeight: '700', color: C.text },
    scrollContent: { padding: 16, paddingBottom: 40 },

    sectionLabel: {
        fontSize: 11, fontWeight: '700', letterSpacing: 1.2,
        textTransform: 'uppercase', color: C.muted, marginLeft: 16,
        marginBottom: 8, marginTop: 24,
    },

    card: {
        backgroundColor: C.surface,
        borderRadius: 20, overflow: 'hidden',
    },

    row: {
        flexDirection: 'row',
        alignItems: 'center',
        minHeight: 56, paddingHorizontal: 16,
    },
    divider: {
        height: 1,
        backgroundColor: C.divider,
        marginHorizontal: 16,
    },

    avatarCircle: {
        width: 40, height: 40, borderRadius: 20,
        backgroundColor: '#374151',
        alignItems: 'center', justifyContent: 'center',
        marginRight: 16,
    },
    rowLabel: { fontSize: 16, fontWeight: '500', color: C.text },
    rowSub: { fontSize: 12, color: C.muted, marginTop: 2 },

    iconCircle: {
        width: 32, height: 32, borderRadius: 8,
        alignItems: 'center', justifyContent: 'center',
        marginRight: 16,
    },

    badge: { fontSize: 12, fontWeight: '600', color: C.primary, marginRight: 4 },
    pulseDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: C.primary },
    versionText: { fontSize: 12, color: C.muted },

    activeBadgePill: {
        flexDirection: 'row', alignItems: 'center', gap: 6,
        paddingHorizontal: 12, paddingVertical: 4,
        borderRadius: 20,
        backgroundColor: tint(C.primary),
        borderWidth: 1, borderColor: 'rgba(234,16,60,0.2)',
    },
    activeDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: C.primary },
    activeBadgeText: { fontSize: 12, fontWeight: '700', color: C.primary },

    // Segmented control
    segmentedControl: {
        flexDirection: 'row',
        backgroundColor: 'rgba(0,0,0,0.4)',
        borderRadius: 20, padding: 3,
    },
    segmentPill: {
        paddingHorizontal: 16, paddingVertical: 6,
        borderRadius: 17,
    },
    segmentActive: {
        backgroundColor: 'rgba(234,16,60,0.2)',
        borderWidth: 1, borderColor: C.primary,
    },
    segmentText: { fontSize: 12, fontWeight: '500', color: C.muted },
    segmentTextActive: { fontWeight: '700', color: C.text },

    footer: { paddingVertical: 32, alignItems: 'center' },
    footerText: { fontSize: 11, color: C.muted },
});
