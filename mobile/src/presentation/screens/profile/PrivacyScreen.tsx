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
};

export const PrivacyScreen = ({ navigation }: any) => {
    const {
        analyticsEnabled, toggleAnalytics,
        crashReports, toggleCrashReports,
        recommendationsEnabled, toggleRecommendations,
    } = useSettingsStore();

    return (
        <SafeAreaView style={s.root} edges={['top']}>
            {/* ─── Header ─── */}
            <View style={s.header}>
                <TouchableOpacity style={s.backBtn} onPress={() => navigation?.goBack?.()}>
                    <Ionicons name="arrow-back" size={24} color={C.text} />
                </TouchableOpacity>
                <Text style={s.headerTitle}>Privacy & Data</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
                {/* ─── Shield Hero ─── */}
                <View style={s.heroSection}>
                    <View style={s.heroCircle}>
                        <Ionicons name="shield-checkmark" size={40} color={C.primary} />
                    </View>
                    <Text style={s.heroText}>Your privacy matters</Text>
                    <Text style={s.heroSub}>
                        Control what data is shared. We never sell your personal information.
                    </Text>
                </View>

                {/* ─── Privacy Preferences ─── */}
                <Text style={s.sectionLabel}>Privacy Preferences</Text>
                <View style={s.card}>
                    <PrivacyRow
                        icon="bar-chart-outline"
                        iconColor="#3B82F6"
                        label="Analytics"
                        sublabel="Share usage data to help us improve."
                        value={analyticsEnabled}
                        onValueChange={toggleAnalytics}
                    />
                    <View style={s.divider} />
                    <PrivacyRow
                        icon="bug-outline"
                        iconColor="#F97316"
                        label="Crash Reports"
                        sublabel="Automatically send anonymous crash logs."
                        value={crashReports}
                        onValueChange={toggleCrashReports}
                    />
                    <View style={s.divider} />
                    <PrivacyRow
                        icon="sparkles-outline"
                        iconColor="#A855F7"
                        label="Personalized Recommendations"
                        sublabel="Allow usage data to tailor suggestions."
                        value={recommendationsEnabled}
                        onValueChange={toggleRecommendations}
                    />
                </View>

                {/* ─── Data Access ─── */}
                <Text style={s.sectionLabel}>Data Access</Text>
                <View style={s.card}>
                    <TouchableOpacity style={s.row} activeOpacity={0.6}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                            <View style={[s.iconCircle, { backgroundColor: 'rgba(234,16,60,0.1)' }]}>
                                <Ionicons name="download-outline" size={20} color={C.primary} />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={s.rowLabel}>Export Account Data</Text>
                                <Text style={s.rowSub}>Download a copy of all your data</Text>
                            </View>
                        </View>
                        <View style={s.requestPill}>
                            <Text style={s.requestText}>Request</Text>
                        </View>
                    </TouchableOpacity>
                    <View style={s.divider} />
                    <TouchableOpacity style={s.row} activeOpacity={0.6}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                            <View style={[s.iconCircle, { backgroundColor: 'rgba(239,68,68,0.1)' }]}>
                                <Ionicons name="trash-outline" size={20} color="#EF4444" />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={s.rowLabel}>Delete Account</Text>
                                <Text style={s.rowSub}>Permanently remove all data</Text>
                            </View>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color={C.muted} />
                    </TouchableOpacity>
                </View>

                <Text style={s.noteText}>
                    We minimise data collection. You can change your preferences at any time.
                </Text>
            </ScrollView>
        </SafeAreaView>
    );
};

// ─── Privacy Row ───────────────────────────────────────────────
const PrivacyRow = ({ icon, iconColor, label, sublabel, value, onValueChange }: any) => (
    <View style={s.row}>
        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 16 }}>
            <View style={[s.iconCircle, { backgroundColor: `${iconColor}15` }]}>
                <Ionicons name={icon} size={20} color={iconColor} />
            </View>
            <View style={{ flex: 1 }}>
                <Text style={s.rowLabel}>{label}</Text>
                <Text style={s.rowSub}>{sublabel}</Text>
            </View>
        </View>
        <Switch
            value={value}
            onValueChange={onValueChange}
            trackColor={{ false: '#3f3f46', true: C.primary }}
            thumbColor="#FFF"
        />
    </View>
);

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

    heroSection: { alignItems: 'center', paddingVertical: 24 },
    heroCircle: {
        width: 72, height: 72, borderRadius: 36,
        backgroundColor: 'rgba(234,16,60,0.1)',
        alignItems: 'center', justifyContent: 'center',
        marginBottom: 16,
    },
    heroText: { fontSize: 22, fontWeight: '800', color: C.text },
    heroSub: { fontSize: 14, color: C.muted, textAlign: 'center', marginTop: 6, maxWidth: 280, lineHeight: 20 },

    sectionLabel: {
        fontSize: 11, fontWeight: '700', letterSpacing: 1.2,
        textTransform: 'uppercase', color: C.muted,
        marginLeft: 16, marginBottom: 8, marginTop: 20,
    },

    card: { backgroundColor: C.surface, borderRadius: 20, overflow: 'hidden' },
    row: {
        flexDirection: 'row', alignItems: 'center',
        minHeight: 64, paddingHorizontal: 16,
    },
    divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.04)', marginLeft: 16 },

    iconCircle: {
        width: 32, height: 32, borderRadius: 8,
        alignItems: 'center', justifyContent: 'center',
        marginRight: 14,
    },
    rowLabel: { fontSize: 15, fontWeight: '600', color: C.text },
    rowSub: { fontSize: 12, color: C.muted, marginTop: 2 },

    requestPill: {
        backgroundColor: 'rgba(234,16,60,0.1)',
        paddingHorizontal: 14, paddingVertical: 6,
        borderRadius: 20, borderWidth: 1,
        borderColor: 'rgba(234,16,60,0.2)',
    },
    requestText: { fontSize: 12, fontWeight: '700', color: C.primary },

    noteText: {
        fontSize: 12, color: C.muted, marginTop: 12,
        marginHorizontal: 16, fontStyle: 'italic', lineHeight: 18,
    },
});
