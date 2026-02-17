import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LegalContent } from '../../constants/LegalContent';

// ─── Color Tokens ──────────────────────────────────────────────
const C = {
    bg: '#1a1a1a',
    surface: '#252525',
    border: 'rgba(255,255,255,0.05)',
    text: '#FFFFFF',
    muted: '#9ca3af',
    primary: '#ea103c',
};

const LEGAL_ROWS: Array<{ title: string; content: string; icon: string; iconColor: string }> = [
    { title: 'Terms & Conditions', content: LegalContent.TERMS, icon: 'document-text-outline', iconColor: '#3B82F6' },
    { title: 'Privacy Policy', content: LegalContent.PRIVACY, icon: 'shield-checkmark-outline', iconColor: '#A855F7' },
    { title: 'ECU Flashing Safety Disclaimer', content: LegalContent.SAFETY, icon: 'warning-outline', iconColor: '#F97316' },
    { title: 'Acceptable Use Policy', content: LegalContent.ACCEPTABLE_USE, icon: 'hand-left-outline', iconColor: '#14B8A6' },
    { title: 'Refund Policy', content: LegalContent.REFUND, icon: 'cash-outline', iconColor: '#22C55E' },
    { title: 'Warranty & Liability Notice', content: LegalContent.WARRANTY, icon: 'ribbon-outline', iconColor: '#EAB308' },
    { title: 'Community Guidelines', content: LegalContent.COMMUNITY, icon: 'people-outline', iconColor: '#EC4899' },
    { title: 'Open Source Licences', content: LegalContent.OPEN_SOURCE, icon: 'code-slash-outline', iconColor: '#6B7280' },
];

export const LegalMenuScreen = ({ navigation }: any) => {

    const openDoc = (title: string, content: string) => {
        navigation.navigate('LegalDocument', { title, content });
    };

    return (
        <SafeAreaView style={s.root} edges={['top']}>
            {/* ─── Header ─── */}
            <View style={s.header}>
                <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color={C.text} />
                </TouchableOpacity>
                <Text style={s.headerTitle}>Legal & Support</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
                {/* ─── Documents ─── */}
                <Text style={s.sectionLabel}>Documents</Text>
                <View style={s.card}>
                    {LEGAL_ROWS.map((row, i) => (
                        <View key={i}>
                            <TouchableOpacity
                                style={s.row}
                                activeOpacity={0.6}
                                onPress={() => openDoc(row.title, row.content)}
                            >
                                <View style={[s.iconCircle, { backgroundColor: `${row.iconColor}15` }]}>
                                    <Ionicons name={row.icon as any} size={18} color={row.iconColor} />
                                </View>
                                <Text style={s.rowLabel}>{row.title}</Text>
                                <Ionicons name="chevron-forward" size={20} color={C.muted} />
                            </TouchableOpacity>
                            {i < LEGAL_ROWS.length - 1 && <View style={s.divider} />}
                        </View>
                    ))}
                </View>

                {/* ─── Contact ─── */}
                <Text style={s.sectionLabel}>Contact</Text>
                <View style={s.card}>
                    <TouchableOpacity
                        style={s.row}
                        activeOpacity={0.6}
                        onPress={() => navigation.navigate('Support')}
                    >
                        <View style={[s.iconCircle, { backgroundColor: 'rgba(234,16,60,0.1)' }]}>
                            <Ionicons name="mail-outline" size={18} color={C.primary} />
                        </View>
                        <Text style={s.rowLabel}>Contact Support</Text>
                        <Ionicons name="chevron-forward" size={20} color={C.muted} />
                    </TouchableOpacity>
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

    sectionLabel: {
        fontSize: 11, fontWeight: '700', letterSpacing: 1.2,
        textTransform: 'uppercase', color: C.muted,
        marginLeft: 16, marginBottom: 8, marginTop: 20,
    },

    card: { backgroundColor: C.surface, borderRadius: 20, overflow: 'hidden' },
    row: {
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: 16, minHeight: 56,
    },
    rowLabel: { flex: 1, fontSize: 15, fontWeight: '500', color: C.text },
    divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.04)', marginLeft: 16 },

    iconCircle: {
        width: 32, height: 32, borderRadius: 8,
        alignItems: 'center', justifyContent: 'center',
        marginRight: 14,
    },
});
