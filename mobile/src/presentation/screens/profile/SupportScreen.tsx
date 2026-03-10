import React, { useEffect, useState } from 'react';
import { LayoutAnimation, Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppScreen, GlassCard, TopBar } from '../../components/AppUI';
import { Theme } from '../../theme';
import { useAppStore } from '../../store/useAppStore';
import { garageService } from '../../../services/garageService';

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
    const { isConnected, connectedDeviceId } = useAppStore();
    const [flashJobCount, setFlashJobCount] = useState(0);
    const [backupCount, setBackupCount] = useState(0);

    useEffect(() => {
        const loadSupportContext = async () => {
            try {
                const [flashJobs, backups] = await Promise.all([
                    garageService.getFlashJobs(),
                    garageService.getBackups(),
                ]);
                setFlashJobCount(flashJobs.results.length);
                setBackupCount(backups.results.length);
            } catch {
                setFlashJobCount(0);
                setBackupCount(0);
            }
        };
        loadSupportContext();
    }, []);

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

            <GlassCard style={styles.summaryCard}>
                <View style={styles.summaryItem}>
                    <Text style={styles.summaryValue}>{isConnected ? 'Yes' : 'No'}</Text>
                    <Text style={styles.summaryLabel}>Device</Text>
                </View>
                <View style={styles.summaryDivider} />
                <View style={styles.summaryItem}>
                    <Text style={styles.summaryValue}>{flashJobCount}</Text>
                    <Text style={styles.summaryLabel}>Flash Jobs</Text>
                </View>
                <View style={styles.summaryDivider} />
                <View style={styles.summaryItem}>
                    <Text style={styles.summaryValue}>{backupCount}</Text>
                    <Text style={styles.summaryLabel}>Backups</Text>
                </View>
            </GlassCard>

            <GlassCard style={styles.statusCard}>
                <Text style={styles.sectionTitle}>Current Support Context</Text>
                <ContextRow label="Connected device" value={connectedDeviceId || 'No active ECU session'} />
                <ContextRow label="Recommended first step" value={flashJobCount > 0 ? 'Review flash history and export logs' : 'Connect device and identify ECU'} />
                <ContextRow label="Recovery readiness" value={backupCount > 0 ? 'At least one backup record exists' : 'No backup records on file'} />
            </GlassCard>

            <GlassCard>
                <Text style={styles.sectionTitle}>Quick Actions</Text>
                <TouchableOpacity style={styles.quickAction} onPress={() => navigation.navigate('Flash', { screen: 'FlashHistory' })}>
                    <Ionicons name="time-outline" size={18} color={Colors.textPrimary} />
                    <Text style={styles.quickActionText}>Open flash history</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.quickAction} onPress={() => navigation.navigate('LogsExport')}>
                    <Ionicons name="document-text-outline" size={18} color={Colors.textPrimary} />
                    <Text style={styles.quickActionText}>Export support logs</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.quickAction} onPress={() => navigation.navigate('FlashingSafetySettings')}>
                    <Ionicons name="shield-checkmark-outline" size={18} color={Colors.textPrimary} />
                    <Text style={styles.quickActionText}>Review flashing safety settings</Text>
                </TouchableOpacity>
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

const ContextRow = ({ label, value }: { label: string; value: string }) => (
    <View style={styles.contextRow}>
        <Text style={styles.contextLabel}>{label}</Text>
        <Text style={styles.contextValue}>{value}</Text>
    </View>
);

const styles = StyleSheet.create({
    content: {
        paddingBottom: 120,
    },
    heroCard: {
        marginTop: 8,
        marginBottom: 12,
    },
    summaryCard: {
        marginBottom: 12,
        flexDirection: 'row',
        alignItems: 'center',
    },
    summaryItem: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: 4,
    },
    summaryValue: {
        fontSize: 18,
        fontWeight: '800',
        color: Colors.textPrimary,
    },
    summaryLabel: {
        marginTop: 2,
        fontSize: 10,
        letterSpacing: 0.8,
        fontWeight: '700',
        textTransform: 'uppercase',
        color: Colors.textSecondary,
    },
    summaryDivider: {
        width: 1,
        height: 32,
        backgroundColor: Colors.divider,
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
        marginTop: 12,
    },
    statusCard: {
        marginBottom: 12,
    },
    sectionTitle: {
        ...Typography.dataLabel,
        marginBottom: 10,
    },
    contextRow: {
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: Colors.divider,
    },
    contextLabel: {
        fontSize: 12,
        fontWeight: '700',
        color: Colors.textSecondary,
        marginBottom: 4,
    },
    contextValue: {
        fontSize: 14,
        lineHeight: 20,
        color: Colors.textPrimary,
    },
    quickAction: {
        minHeight: 48,
        borderRadius: Layout.radiusSm,
        borderWidth: 1,
        borderColor: Colors.strokeSoft,
        backgroundColor: 'rgba(255,255,255,0.03)',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        paddingHorizontal: 14,
        marginTop: 10,
    },
    quickActionText: {
        fontSize: 14,
        fontWeight: '700',
        color: Colors.textPrimary,
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
