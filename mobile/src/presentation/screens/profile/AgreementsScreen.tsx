import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { legalService } from '../../../services/legalService';

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

interface Agreement {
    id: number;
    document_type: string;
    version: string;
    accepted_at: string;
}

export const AgreementsScreen = ({ navigation }: any) => {
    const [loading, setLoading] = useState(true);
    const [history, setHistory] = useState<Agreement[]>([]);

    useEffect(() => {
        loadHistory();
    }, []);

    const loadHistory = async () => {
        try {
            const data = await legalService.getHistory();
            setHistory(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'TERMS': return 'document-text-outline';
            case 'PRIVACY': return 'shield-checkmark-outline';
            case 'SAFETY': return 'warning-outline';
            default: return 'checkmark-circle-outline';
        }
    };

    const getIconColor = (type: string) => {
        switch (type) {
            case 'TERMS': return '#3B82F6';
            case 'PRIVACY': return '#A855F7';
            case 'SAFETY': return '#F97316';
            default: return C.primary;
        }
    };

    const getLabel = (type: string) => {
        switch (type) {
            case 'TERMS': return 'Terms & Conditions';
            case 'PRIVACY': return 'Privacy Policy';
            case 'SAFETY': return 'Safety Disclaimer';
            case 'REFUND': return 'Refund Policy';
            default: return type;
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString(undefined, {
            year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
        });
    };

    return (
        <SafeAreaView style={s.root} edges={['top']}>
            {/* ─── Header ─── */}
            <View style={s.header}>
                <TouchableOpacity style={s.backBtn} onPress={() => navigation?.goBack?.()}>
                    <Ionicons name="arrow-back" size={24} color={C.text} />
                </TouchableOpacity>
                <Text style={s.headerTitle}>Agreements</Text>
                <View style={{ width: 40 }} />
            </View>

            {/* ─── Title ─── */}
            <View style={s.titleSection}>
                <Text style={s.title}>Agreements & Consents</Text>
                <Text style={s.subtitle}>Legal documents you have accepted</Text>
            </View>

            {loading ? (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <ActivityIndicator color={C.primary} />
                </View>
            ) : (
                <ScrollView contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
                    {history.map((item) => {
                        const color = getIconColor(item.document_type);
                        return (
                            <View key={item.id} style={s.card}>
                                <View style={s.cardRow}>
                                    <View style={[s.iconCircle, { backgroundColor: `${color}15` }]}>
                                        <Ionicons name={getIcon(item.document_type) as any} size={22} color={color} />
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={s.docTitle}>{getLabel(item.document_type)}</Text>
                                        <Text style={s.docVersion}>Version {item.version}</Text>
                                        <Text style={s.docDate}>Accepted: {formatDate(item.accepted_at)}</Text>
                                    </View>
                                    <View style={s.checkCircle}>
                                        <Ionicons name="checkmark" size={14} color="#FFF" />
                                    </View>
                                </View>
                            </View>
                        );
                    })}

                    {history.length === 0 && (
                        <View style={s.emptyState}>
                            <Ionicons name="document-outline" size={48} color={C.muted} />
                            <Text style={s.emptyText}>No agreements found</Text>
                        </View>
                    )}

                    <View style={s.footer}>
                        <View style={s.footerIcon}>
                            <Ionicons name="lock-closed" size={14} color={C.muted} />
                        </View>
                        <Text style={s.footerText}>
                            Your IP address and timestamp are recorded for security and compliance verification.
                        </Text>
                    </View>
                </ScrollView>
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
    headerTitle: { fontSize: 18, fontWeight: '700', color: C.text },

    titleSection: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 },
    title: { fontSize: 24, fontWeight: '800', color: C.text, letterSpacing: -0.5 },
    subtitle: { fontSize: 14, color: C.muted, marginTop: 4 },

    scrollContent: { padding: 16, gap: 12 },

    card: {
        backgroundColor: C.surface,
        borderRadius: 16, padding: 16,
    },
    cardRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
    iconCircle: {
        width: 44, height: 44, borderRadius: 12,
        alignItems: 'center', justifyContent: 'center',
    },
    docTitle: { fontSize: 16, fontWeight: '700', color: C.text },
    docVersion: { fontSize: 12, color: C.muted, marginTop: 2 },
    docDate: { fontSize: 12, color: C.muted, marginTop: 1 },
    checkCircle: {
        width: 24, height: 24, borderRadius: 12,
        backgroundColor: C.success,
        alignItems: 'center', justifyContent: 'center',
    },

    emptyState: { alignItems: 'center', paddingVertical: 48 },
    emptyText: { fontSize: 16, color: C.muted, marginTop: 12 },

    footer: {
        flexDirection: 'row', alignItems: 'flex-start', gap: 8,
        paddingTop: 16, paddingHorizontal: 8,
    },
    footerIcon: { marginTop: 2 },
    footerText: { fontSize: 12, color: C.muted, flex: 1, lineHeight: 18 },
});
