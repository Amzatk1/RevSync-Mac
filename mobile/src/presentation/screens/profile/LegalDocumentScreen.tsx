import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { StorageAdapter } from '../../../data/services/StorageAdapter';

const ACCEPTANCE_KEY_PREFIX = 'legal_accepted_';

// Documents that require explicit acceptance
const REQUIRED_DOCS = ['Terms & Conditions', 'Privacy Policy', 'Safety Disclaimer'];

interface AcceptanceRecord {
    acceptedAt: string;
    version: string;
}

// ─── Color Tokens ──────────────────────────────────────────────
const C = {
    bg: '#1a1a1a',
    surface: '#252525',
    border: 'rgba(255,255,255,0.05)',
    text: '#FFFFFF',
    muted: '#9ca3af',
    primary: '#ea103c',
    success: '#22C55E',
};

export const LegalDocumentScreen = ({ route, navigation }: any) => {
    const { title, content } = route.params;
    const [acceptance, setAcceptance] = useState<AcceptanceRecord | null>(null);
    const [accepting, setAccepting] = useState(false);
    const isRequired = REQUIRED_DOCS.some(d => title.includes(d));

    useEffect(() => {
        loadAcceptance();
    }, []);

    const loadAcceptance = async () => {
        const key = ACCEPTANCE_KEY_PREFIX + title.replace(/\s+/g, '_').toLowerCase();
        const stored = await StorageAdapter.get<AcceptanceRecord>(key);
        if (stored) {
            setAcceptance(stored);
        }
    };

    const handleAccept = async () => {
        setAccepting(true);
        try {
            const record: AcceptanceRecord = {
                acceptedAt: new Date().toISOString(),
                version: '1.0',
            };
            const key = ACCEPTANCE_KEY_PREFIX + title.replace(/\s+/g, '_').toLowerCase();
            await StorageAdapter.set(key, record);
            setAcceptance(record);
        } catch (e) {
            Alert.alert('Error', 'Failed to save acceptance.');
        } finally {
            setAccepting(false);
        }
    };

    const formattedDate = acceptance
        ? new Date(acceptance.acceptedAt).toLocaleDateString('en-GB', {
            day: 'numeric', month: 'short', year: 'numeric',
        })
        : null;

    return (
        <SafeAreaView style={s.root} edges={['top']}>
            {/* ─── Header ─── */}
            <View style={s.header}>
                <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color={C.text} />
                </TouchableOpacity>
                <Text style={s.headerTitle} numberOfLines={1}>{title}</Text>
                <View style={{ width: 40 }} />
            </View>

            {/* ─── Meta Row ─── */}
            <View style={s.metaRow}>
                <View style={s.versionPill}>
                    <Text style={s.versionText}>v1.0</Text>
                </View>
                {acceptance && (
                    <View style={s.acceptedPill}>
                        <Ionicons name="checkmark-circle" size={14} color={C.success} />
                        <Text style={s.acceptedText}>Accepted {formattedDate}</Text>
                    </View>
                )}
            </View>

            {/* ─── Content ─── */}
            <ScrollView contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
                <View style={s.contentCard}>
                    <Text style={s.documentText}>{content}</Text>
                </View>
            </ScrollView>

            {/* ─── Footer ─── */}
            {isRequired && (
                <View style={s.footer}>
                    {acceptance ? (
                        <View style={s.confirmedCard}>
                            <Ionicons name="shield-checkmark" size={24} color={C.success} />
                            <View style={{ flex: 1, marginLeft: 14 }}>
                                <Text style={s.confirmedTitle}>Accepted</Text>
                                <Text style={s.confirmedDate}>
                                    Version {acceptance.version} • {formattedDate}
                                </Text>
                            </View>
                        </View>
                    ) : (
                        <TouchableOpacity
                            style={s.acceptButton}
                            onPress={handleAccept}
                            disabled={accepting}
                            activeOpacity={0.85}
                        >
                            <Ionicons name="shield-checkmark-outline" size={20} color="#FFF" />
                            <Text style={s.acceptButtonText}>
                                {accepting ? 'Saving...' : `I Accept ${title}`}
                            </Text>
                        </TouchableOpacity>
                    )}
                </View>
            )}
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
    headerTitle: { fontSize: 17, fontWeight: '700', color: C.text, flex: 1, textAlign: 'center', marginHorizontal: 8 },

    metaRow: {
        flexDirection: 'row', alignItems: 'center', gap: 10,
        paddingHorizontal: 16, paddingVertical: 12,
    },
    versionPill: {
        backgroundColor: C.surface,
        paddingHorizontal: 12, paddingVertical: 4,
        borderRadius: 12,
    },
    versionText: { fontSize: 12, fontWeight: '600', color: C.muted },
    acceptedPill: {
        flexDirection: 'row', alignItems: 'center', gap: 4,
    },
    acceptedText: { fontSize: 12, color: C.success, fontWeight: '500' },

    scrollContent: { padding: 16, paddingBottom: 120 },
    contentCard: {
        backgroundColor: C.surface,
        borderRadius: 16, padding: 20,
        borderWidth: 1, borderColor: C.border,
    },
    documentText: { fontSize: 14, lineHeight: 22, color: C.muted },

    footer: {
        paddingHorizontal: 16, paddingBottom: 24, paddingTop: 12,
        borderTopWidth: 1, borderTopColor: C.border,
    },
    confirmedCard: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: 'rgba(34,197,94,0.08)',
        borderRadius: 16, padding: 16,
        borderWidth: 1, borderColor: 'rgba(34,197,94,0.2)',
    },
    confirmedTitle: { fontSize: 16, fontWeight: '700', color: C.success },
    confirmedDate: { fontSize: 12, color: C.muted, marginTop: 2 },
    acceptButton: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
        height: 52, borderRadius: 26,
        backgroundColor: C.primary,
        shadowColor: C.primary, shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5, shadowRadius: 20,
    },
    acceptButtonText: { fontSize: 16, fontWeight: '700', color: '#FFF' },
});
