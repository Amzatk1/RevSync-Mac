import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Animated, Easing, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

// ─── Color Tokens ──────────────────────────────────────────────
const C = {
    bg: '#1a1a1a',
    surface: '#252525',
    border: 'rgba(255,255,255,0.05)',
    text: '#FFFFFF',
    muted: '#9ca3af',
    primary: '#ea103c',
};

const FEATURES = [
    { icon: 'flash-outline' as const, text: 'Live ECU Flash & Tuning' },
    { icon: 'shield-checkmark-outline' as const, text: 'Backup & Recovery System' },
    { icon: 'bluetooth-outline' as const, text: 'BLE OBD-II Communication' },
    { icon: 'analytics-outline' as const, text: 'Performance Analytics' },
    { icon: 'cloud-download-outline' as const, text: 'OTA Tune Downloads' },
    { icon: 'lock-closed-outline' as const, text: 'End-to-End Encryption' },
];

export const AboutScreen = ({ navigation }: any) => {
    const pulseAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, { toValue: 1.15, duration: 1200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
                Animated.timing(pulseAnim, { toValue: 1, duration: 1200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
            ])
        ).start();
    }, []);

    return (
        <SafeAreaView style={s.root} edges={['top']}>
            {/* ─── Header ─── */}
            <View style={s.header}>
                <TouchableOpacity style={s.backBtn} onPress={() => navigation?.goBack?.()}>
                    <Ionicons name="arrow-back" size={24} color={C.text} />
                </TouchableOpacity>
                <Text style={s.headerTitle}>About</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
                {/* ─── Logo Hero ─── */}
                <View style={s.heroSection}>
                    <Animated.View style={[s.logoGlow, { transform: [{ scale: pulseAnim }] }]} />
                    <View style={s.logoCircle}>
                        <Text style={s.logoText}>R</Text>
                    </View>
                    <Text style={s.appName}>RevSync</Text>
                    <Text style={s.version}>Version 2.4.1 (Build 8902)</Text>
                </View>

                {/* ─── Description ─── */}
                <View style={s.descCard}>
                    <Text style={s.descText}>
                        RevSync is a professional-grade ECU tuning platform designed for motorcycle
                        enthusiasts and professional tuners. Flash, tune, and optimize your ride
                        with confidence.
                    </Text>
                </View>

                {/* ─── Features ─── */}
                <Text style={s.sectionLabel}>Features</Text>
                <View style={s.featuresCard}>
                    {FEATURES.map((f, i) => (
                        <View key={i}>
                            <View style={s.featureRow}>
                                <View style={s.featureIcon}>
                                    <Ionicons name={f.icon} size={18} color={C.primary} />
                                </View>
                                <Text style={s.featureText}>{f.text}</Text>
                                <Ionicons name="checkmark" size={18} color="#22C55E" />
                            </View>
                            {i < FEATURES.length - 1 && <View style={s.divider} />}
                        </View>
                    ))}
                </View>

                {/* ─── Tech Stack ─── */}
                <Text style={s.sectionLabel}>System Info</Text>
                <View style={s.infoCard}>
                    <InfoRow label="Platform" value="React Native + Expo" />
                    <View style={s.divider} />
                    <InfoRow label="Protocol" value="BLE 5.0 / OBD-II" />
                    <View style={s.divider} />
                    <InfoRow label="Security" value="AES-256 + HMAC" />
                    <View style={s.divider} />
                    <InfoRow label="Backend" value="Django REST + Postgres" />
                </View>

                {/* ─── Footer ─── */}
                <View style={s.footer}>
                    <Text style={s.footerText}>Made with ❤️ for the riding community</Text>
                    <Text style={s.footerCopy}>© 2024 RevSync Technologies Ltd.</Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const InfoRow = ({ label, value }: { label: string; value: string }) => (
    <View style={s.infoRow}>
        <Text style={s.infoLabel}>{label}</Text>
        <Text style={s.infoValue}>{value}</Text>
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

    heroSection: { alignItems: 'center', paddingVertical: 32 },
    logoGlow: {
        position: 'absolute', top: 24,
        width: 100, height: 100, borderRadius: 50,
        backgroundColor: 'rgba(234,16,60,0.2)',
    },
    logoCircle: {
        width: 80, height: 80, borderRadius: 24,
        backgroundColor: C.primary,
        alignItems: 'center', justifyContent: 'center',
        marginBottom: 16,
    },
    logoText: { fontSize: 36, fontWeight: '900', color: '#FFF' },
    appName: { fontSize: 28, fontWeight: '900', color: C.text, letterSpacing: -0.5 },
    version: { fontSize: 13, color: C.muted, marginTop: 4 },

    descCard: {
        backgroundColor: C.surface,
        borderRadius: 16, padding: 20,
        marginBottom: 8,
    },
    descText: { fontSize: 15, color: C.muted, lineHeight: 24, textAlign: 'center' },

    sectionLabel: {
        fontSize: 11, fontWeight: '700', letterSpacing: 1.2,
        textTransform: 'uppercase', color: C.muted,
        marginLeft: 16, marginBottom: 8, marginTop: 24,
    },

    featuresCard: { backgroundColor: C.surface, borderRadius: 20, overflow: 'hidden' },
    featureRow: {
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: 16, minHeight: 52,
    },
    featureIcon: {
        width: 28, height: 28, borderRadius: 8,
        backgroundColor: 'rgba(234,16,60,0.1)',
        alignItems: 'center', justifyContent: 'center',
        marginRight: 14,
    },
    featureText: { flex: 1, fontSize: 15, fontWeight: '500', color: C.text },
    divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.04)', marginLeft: 16 },

    infoCard: { backgroundColor: C.surface, borderRadius: 20, overflow: 'hidden' },
    infoRow: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingHorizontal: 16, minHeight: 48,
    },
    infoLabel: { fontSize: 14, color: C.muted },
    infoValue: { fontSize: 14, fontWeight: '600', color: C.text },

    footer: { alignItems: 'center', paddingVertical: 32 },
    footerText: { fontSize: 14, color: C.muted },
    footerCopy: { fontSize: 12, color: C.muted, marginTop: 4, opacity: 0.6 },
});
