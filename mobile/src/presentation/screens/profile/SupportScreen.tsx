import React, { useState } from 'react';
import { LayoutAnimation, Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppScreen, GlassCard, TopBar } from '../../components/AppUI';
import { Theme } from '../../theme';

const { Colors, Layout, Typography } = Theme;

const FAQ_DATA = [
    {
        question: 'How do I connect to my ECU?',
        answer: "Turn the bike ignition on, enable Bluetooth, and connect to the RevSync ECU device before starting identification or flashing.",
    },
    {
        question: 'Is remapping safe?',
        answer: 'RevSync is designed around signed packages, backups, and guided safety checks, but aggressive tuning still carries mechanical risk if the vehicle setup is unsuitable.',
    },
    {
        question: 'How do I revert to stock?',
        answer: 'Use the recovery or backup restore path from the flash flow. A valid ECU backup must exist before this can happen safely.',
    },
    {
        question: 'What does a verification failure mean?',
        answer: 'Post-flash validation did not fully match the expected package or ECU state. Retry verification first, then use recovery if the ECU remains unstable.',
    },
];

export const SupportScreen = ({ navigation }: any) => {
    const handleContactSupport = () => {
        Linking.openURL('mailto:support@revsync.app?subject=RevSync Support Request');
    };

    return (
        <AppScreen scroll contentContainerStyle={styles.content}>
            <TopBar title="Support" subtitle="Help, FAQs, and escalation paths" onBack={() => navigation.goBack()} />

            <GlassCard style={styles.heroCard}>
                <Text style={styles.kicker}>Support Center</Text>
                <Text style={styles.heroTitle}>Guidance for connection, verification, and recovery workflows.</Text>
                <Text style={styles.heroBody}>This screen exists to resolve real operator issues quickly, not to act as a generic marketing FAQ.</Text>
            </GlassCard>

            <View style={styles.stack}>
                {FAQ_DATA.map((item) => (
                    <FAQItem key={item.question} question={item.question} answer={item.answer} />
                ))}
            </View>

            <GlassCard style={styles.ctaCard}>
                <View style={styles.ctaIcon}>
                    <Ionicons name="chatbubble-outline" size={22} color={Colors.primary} />
                </View>
                <Text style={styles.ctaTitle}>Still need help?</Text>
                <Text style={styles.ctaBody}>Use email support when the guided flow cannot resolve the issue or when you need human review of logs and recovery state.</Text>
                <TouchableOpacity style={styles.primaryButton} onPress={handleContactSupport}>
                    <Text style={styles.primaryButtonText}>Contact Support</Text>
                </TouchableOpacity>
            </GlassCard>
        </AppScreen>
    );
};

const FAQItem = ({ question, answer }: { question: string; answer: string }) => {
    const [expanded, setExpanded] = useState(false);

    const toggle = () => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setExpanded((prev) => !prev);
    };

    return (
        <TouchableOpacity onPress={toggle} activeOpacity={0.8}>
            <GlassCard style={styles.faqCard}>
                <View style={styles.faqHeader}>
                    <Text style={styles.faqQuestion}>{question}</Text>
                    <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={18} color={expanded ? Colors.accent : Colors.textSecondary} />
                </View>
                {expanded && <Text style={styles.faqAnswer}>{answer}</Text>}
            </GlassCard>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    content: {
        paddingBottom: 120,
    },
    heroCard: {
        marginTop: 8,
        marginBottom: 12,
    },
    kicker: {
        ...Typography.dataLabel,
        color: Colors.accent,
        marginBottom: 8,
    },
    heroTitle: {
        ...Typography.h2,
    },
    heroBody: {
        ...Typography.caption,
        marginTop: 8,
        lineHeight: 20,
    },
    stack: {
        gap: 10,
    },
    faqCard: {},
    faqHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 10,
    },
    faqQuestion: {
        flex: 1,
        fontSize: 15,
        fontWeight: '700',
        color: Colors.textPrimary,
    },
    faqAnswer: {
        marginTop: 10,
        fontSize: 13,
        lineHeight: 20,
        color: Colors.textSecondary,
    },
    ctaCard: {
        marginTop: 12,
        alignItems: 'center',
        paddingVertical: 22,
    },
    ctaIcon: {
        width: 52,
        height: 52,
        borderRadius: 18,
        backgroundColor: 'rgba(234,16,60,0.10)',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
    },
    ctaTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: Colors.textPrimary,
    },
    ctaBody: {
        ...Typography.caption,
        textAlign: 'center',
        marginTop: 8,
        maxWidth: 280,
    },
    primaryButton: {
        minHeight: 48,
        minWidth: 180,
        borderRadius: Layout.buttonRadius,
        backgroundColor: Colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 16,
        paddingHorizontal: 20,
    },
    primaryButtonText: {
        fontSize: 14,
        fontWeight: '800',
        color: Colors.white,
    },
});
