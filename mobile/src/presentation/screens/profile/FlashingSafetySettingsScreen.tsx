import React from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useSettingsStore } from '../../store/useSettingsStore';

// ─── Color Tokens ──────────────────────────────────────────────
const C = {
    bg: '#1a1a1a',
    surface: '#252525',
    border: 'rgba(255,255,255,0.05)',
    text: '#FFFFFF',
    muted: '#9ca3af',
    primary: '#ea103c',
    warning: '#F97316',
};

export const FlashingSafetySettingsScreen = ({ navigation }: any) => {
    const { safetyModeEnabled, toggleSafetyMode, keepScreenAwake, toggleKeepScreenAwake } = useSettingsStore();

    return (
        <SafeAreaView style={s.root} edges={['top']}>
            {/* ─── Header ─── */}
            <View style={s.header}>
                <TouchableOpacity style={s.backBtn} onPress={() => navigation?.goBack?.()}>
                    <Ionicons name="arrow-back" size={24} color={C.text} />
                </TouchableOpacity>
                <Text style={s.headerTitle}>Flashing Safety</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
                {/* ─── Warning Banner ─── */}
                <View style={s.warningBanner}>
                    <Ionicons name="warning-outline" size={24} color={C.warning} />
                    <Text style={s.warningText}>
                        Core protections are always active. These settings adjust additional safety checks.
                    </Text>
                </View>

                {/* ─── Safety Mode ─── */}
                <Text style={s.sectionLabel}>Safety Mode</Text>
                <View style={s.card}>
                    <View style={s.row}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 16 }}>
                            <View style={[s.iconCircle, { backgroundColor: 'rgba(234,16,60,0.1)' }]}>
                                <Ionicons name="shield-checkmark" size={20} color={C.primary} />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={s.rowLabel}>Safety Mode Enabled</Text>
                                <Text style={s.rowSub}>Enforce strict pre-checks before writing to ECU</Text>
                            </View>
                        </View>
                        <Switch
                            value={safetyModeEnabled}
                            onValueChange={toggleSafetyMode}
                            trackColor={{ false: '#3f3f46', true: C.primary }}
                            thumbColor="#FFF"
                        />
                    </View>
                </View>

                {/* ─── Connection Rules ─── */}
                <Text style={s.sectionLabel}>Connection Rules</Text>
                <View style={s.card}>
                    <View style={s.row}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 16 }}>
                            <View style={[s.iconCircle, { backgroundColor: 'rgba(59,130,246,0.1)' }]}>
                                <Ionicons name="phone-portrait-outline" size={20} color="#3B82F6" />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={s.rowLabel}>Keep Screen Awake</Text>
                                <Text style={s.rowSub}>Prevent phone sleep during critical operations</Text>
                            </View>
                        </View>
                        <Switch
                            value={keepScreenAwake}
                            onValueChange={toggleKeepScreenAwake}
                            trackColor={{ false: '#3f3f46', true: C.primary }}
                            thumbColor="#FFF"
                        />
                    </View>
                </View>

                {/* ─── Battery & Power ─── */}
                <Text style={s.sectionLabel}>Battery & Power</Text>
                <View style={s.card}>
                    <View style={s.row}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                            <View style={[s.iconCircle, { backgroundColor: 'rgba(234,179,8,0.1)' }]}>
                                <Ionicons name="battery-charging-outline" size={20} color="#EAB308" />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={s.rowLabel}>Power Check</Text>
                                <Text style={s.rowSub}>Always ensure stable power and follow on-screen checklists</Text>
                            </View>
                        </View>
                        <View style={s.statusPill}>
                            <View style={s.statusDot} />
                            <Text style={s.statusText}>Active</Text>
                        </View>
                    </View>
                </View>

                {/* ─── Info Note ─── */}
                <View style={s.infoNote}>
                    <Ionicons name="information-circle" size={16} color={C.muted} />
                    <Text style={s.infoText}>
                        RevSync will never allow flashing if safety-critical checks fail.
                        Safety Mode changes how strict the system is, but core protections always remain on.
                    </Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

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
    scrollContent: { padding: 16, paddingBottom: 40 },

    warningBanner: {
        flexDirection: 'row', alignItems: 'center', gap: 12,
        backgroundColor: 'rgba(249,115,22,0.08)',
        borderRadius: 16, padding: 16,
        borderWidth: 1, borderColor: 'rgba(249,115,22,0.2)',
        marginBottom: 8,
    },
    warningText: { flex: 1, fontSize: 13, color: C.warning, lineHeight: 18 },

    sectionLabel: {
        fontSize: 11, fontWeight: '700', letterSpacing: 1.2,
        textTransform: 'uppercase', color: C.muted,
        marginLeft: 16, marginBottom: 8, marginTop: 24,
    },
    card: { backgroundColor: C.surface, borderRadius: 20, overflow: 'hidden' },
    row: {
        flexDirection: 'row', alignItems: 'center',
        minHeight: 64, paddingHorizontal: 16,
    },
    iconCircle: {
        width: 32, height: 32, borderRadius: 8,
        alignItems: 'center', justifyContent: 'center',
        marginRight: 14,
    },
    rowLabel: { fontSize: 15, fontWeight: '600', color: C.text },
    rowSub: { fontSize: 12, color: C.muted, marginTop: 2 },

    statusPill: {
        flexDirection: 'row', alignItems: 'center', gap: 6,
        paddingHorizontal: 12, paddingVertical: 5,
        borderRadius: 12,
        backgroundColor: 'rgba(34,197,94,0.1)',
    },
    statusDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#22C55E' },
    statusText: { fontSize: 12, fontWeight: '700', color: '#22C55E' },

    infoNote: {
        flexDirection: 'row', alignItems: 'flex-start', gap: 8,
        paddingHorizontal: 16, paddingTop: 20,
    },
    infoText: { flex: 1, fontSize: 12, color: C.muted, lineHeight: 18, fontStyle: 'italic' },
});
