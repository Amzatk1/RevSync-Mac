import React, { useState } from 'react';
import {
    View, Text, StyleSheet, LayoutAnimation, TouchableOpacity, Linking, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

// ─── Color Tokens ──────────────────────────────────────────────
const C = {
    bg: '#1a1a1a',
    surface: '#252525',
    border: 'rgba(255,255,255,0.05)',
    text: '#FFFFFF',
    muted: '#a3a3a3',
    primary: '#ea103c',
};

const FAQ_DATA = [
    {
        question: 'How do I connect to my ECU?',
        answer: "Ensure your bike's ignition is on. Enable Bluetooth on your phone and select 'RevSync-ECU' from the device list. If prompted for a pin, enter 0000 or 1234.",
    },
    {
        question: 'Is remapping my engine safe?',
        answer: 'Yes, our maps are designed within safe factory tolerances. However, pushing components beyond their limits without proper hardware upgrades carries risks. Always monitor engine temps.',
    },
    {
        question: 'How do I revert to factory settings?',
        answer: 'Go to the "My Bike" tab, select your current map profile, and tap "Restore Stock Firmware". Ensure your battery is fully charged before starting this process.',
    },
    {
        question: 'What does Error Code 404 mean?',
        answer: "Error 404 usually indicates a connection timeout during a flash. Don't panic. Keep the ignition on, force close the app, restart it, and try the flash again immediately.",
    },
    {
        question: 'Can I share my tuning maps?',
        answer: 'Map sharing is available for Pro users. You can export your configuration as a .rsv file and share it via AirDrop or email directly from the map editor screen.',
    },
    {
        question: 'Does this void my warranty?',
        answer: 'Technically, modifying the ECU can give manufacturers grounds to deny warranty claims related to the engine. We recommend flashing back to stock before service visits.',
    },
];

export const SupportScreen = ({ navigation }: any) => {
    const handleContactSupport = () => {
        Linking.openURL('mailto:support@revsync.app?subject=Support Request');
    };

    return (
        <SafeAreaView style={s.root} edges={['top']}>
            {/* ─── Header ─── */}
            <View style={s.header}>
                <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color={C.text} />
                </TouchableOpacity>
                <View style={{ width: 40 }} />
            </View>

            {/* ─── Title ─── */}
            <View style={s.titleSection}>
                <Text style={s.title}>Help & Support</Text>
                <Text style={s.subtitle}>Frequently Asked Questions</Text>
            </View>

            {/* ─── FAQ List ─── */}
            <ScrollView
                contentContainerStyle={s.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {FAQ_DATA.map((item, i) => (
                    <FAQItem key={i} question={item.question} answer={item.answer} />
                ))}
                {/* spacer for fixed CTA */}
                <View style={{ height: 220 }} />
            </ScrollView>

            {/* ─── Fixed Bottom CTA ─── */}
            <View style={s.ctaContainer}>
                <View style={s.ctaCard}>
                    {/* decorative blur */}
                    <View style={s.ctaGlow} />
                    <View style={s.ctaIconCircle}>
                        <Ionicons name="chatbubble-outline" size={28} color={C.primary} />
                    </View>
                    <Text style={s.ctaTitle}>Still need help?</Text>
                    <Text style={s.ctaSubtitle}>
                        Our support team is available 24/7 to assist with your tuning needs.
                    </Text>
                    <TouchableOpacity style={s.ctaButton} onPress={handleContactSupport} activeOpacity={0.85}>
                        <Ionicons name="headset-outline" size={20} color="#FFF" />
                        <Text style={s.ctaButtonText}>Contact Support</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </SafeAreaView>
    );
};

// ─── FAQ Accordion Item ────────────────────────────────────────
const FAQItem = ({ question, answer }: { question: string; answer: string }) => {
    const [expanded, setExpanded] = useState(false);

    const toggle = () => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setExpanded(!expanded);
    };

    return (
        <TouchableOpacity onPress={toggle} activeOpacity={0.8} style={s.faqCard}>
            <View style={s.faqHeader}>
                <Text style={s.faqQuestion}>{question}</Text>
                <Ionicons
                    name={expanded ? 'chevron-up' : 'chevron-down'}
                    size={20}
                    color={expanded ? C.primary : C.muted}
                />
            </View>
            {expanded && <Text style={s.faqAnswer}>{answer}</Text>}
        </TouchableOpacity>
    );
};

// ─── Styles ────────────────────────────────────────────────────
const s = StyleSheet.create({
    root: { flex: 1, backgroundColor: C.bg },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 16, height: 56,
    },
    backBtn: {
        width: 40, height: 40, borderRadius: 20,
        alignItems: 'center', justifyContent: 'center',
    },
    titleSection: { paddingHorizontal: 16, marginBottom: 24 },
    title: { fontSize: 30, fontWeight: '800', color: C.text, letterSpacing: -0.5 },
    subtitle: { fontSize: 16, fontWeight: '500', color: C.muted, marginTop: 4 },

    scrollContent: { paddingHorizontal: 16, gap: 12 },

    faqCard: {
        backgroundColor: C.surface,
        borderRadius: 16, overflow: 'hidden',
    },
    faqHeader: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        padding: 16,
    },
    faqQuestion: { fontSize: 15, fontWeight: '700', color: C.text, flex: 1, marginRight: 16 },
    faqAnswer: { fontSize: 14, color: C.muted, lineHeight: 22, paddingHorizontal: 16, paddingBottom: 16 },

    // Fixed bottom CTA
    ctaContainer: {
        position: 'absolute', bottom: 0, left: 0, right: 0,
        paddingHorizontal: 16, paddingBottom: 24, paddingTop: 48,
        // gradient fade via background
    },
    ctaCard: {
        backgroundColor: C.surface,
        borderRadius: 24, padding: 20,
        alignItems: 'center',
        borderWidth: 1, borderColor: C.border,
        overflow: 'hidden',
    },
    ctaGlow: {
        position: 'absolute', top: -40, right: -40,
        width: 128, height: 128, borderRadius: 64,
        backgroundColor: 'rgba(234,16,60,0.1)',
    },
    ctaIconCircle: {
        width: 56, height: 56, borderRadius: 28,
        backgroundColor: 'rgba(234,16,60,0.1)',
        alignItems: 'center', justifyContent: 'center',
        marginBottom: 12,
    },
    ctaTitle: { fontSize: 20, fontWeight: '800', color: C.text, marginBottom: 4 },
    ctaSubtitle: { fontSize: 14, color: C.muted, textAlign: 'center', marginBottom: 20, maxWidth: 260 },
    ctaButton: {
        width: '100%', height: 48, borderRadius: 24,
        backgroundColor: C.primary,
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
        shadowColor: C.primary, shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5, shadowRadius: 20,
    },
    ctaButtonText: { fontSize: 16, fontWeight: '700', color: '#FFF' },
});
