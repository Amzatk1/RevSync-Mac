import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LegalContent } from '../../constants/LegalContent';
import { AppScreen, GlassCard, TopBar } from '../../components/AppUI';
import { Theme } from '../../theme';

const { Colors, Typography } = Theme;

const LEGAL_ROWS: Array<{ title: string; content: string; icon: string; iconColor: string }> = [
    { title: 'Terms & Conditions', content: LegalContent.TERMS, icon: 'document-text-outline', iconColor: Colors.info },
    { title: 'Privacy Policy', content: LegalContent.PRIVACY, icon: 'shield-checkmark-outline', iconColor: '#9B8CFF' },
    { title: 'ECU Flashing Safety Disclaimer', content: LegalContent.SAFETY, icon: 'warning-outline', iconColor: Colors.warning },
    { title: 'Acceptable Use Policy', content: LegalContent.ACCEPTABLE_USE, icon: 'hand-left-outline', iconColor: '#14B8A6' },
    { title: 'Refund Policy', content: LegalContent.REFUND, icon: 'cash-outline', iconColor: Colors.success },
    { title: 'Warranty & Liability Notice', content: LegalContent.WARRANTY, icon: 'ribbon-outline', iconColor: '#EAB308' },
    { title: 'Community Guidelines', content: LegalContent.COMMUNITY, icon: 'people-outline', iconColor: '#EC4899' },
    { title: 'Open Source Licences', content: LegalContent.OPEN_SOURCE, icon: 'code-slash-outline', iconColor: '#6B7280' },
];

export const LegalMenuScreen = ({ navigation }: any) => {
    const openDoc = (title: string, content: string) => {
        navigation.navigate('LegalDocument', { title, content });
    };

    return (
        <AppScreen scroll contentContainerStyle={styles.content}>
            <TopBar title="Legal" subtitle="Policies, required agreements, and support documents" onBack={() => navigation.goBack()} />

            <GlassCard style={styles.heroCard}>
                <Text style={styles.kicker}>Legal Center</Text>
                <Text style={styles.heroTitle}>Every policy used by the product should stay reachable from one place.</Text>
                <Text style={styles.heroBody}>This includes required agreements, safety disclaimers, support policies, and reference documents that affect flashing and purchases.</Text>
            </GlassCard>

            <Text style={styles.sectionLabel}>Documents</Text>
            <View style={styles.stack}>
                {LEGAL_ROWS.map((row) => (
                    <TouchableOpacity key={row.title} onPress={() => openDoc(row.title, row.content)} activeOpacity={0.8}>
                        <GlassCard style={styles.rowCard}>
                            <View style={[styles.iconCircle, { backgroundColor: `${row.iconColor}18` }]}>
                                <Ionicons name={row.icon as any} size={18} color={row.iconColor} />
                            </View>
                            <Text style={styles.rowLabel}>{row.title}</Text>
                            <Ionicons name="chevron-forward" size={18} color={Colors.textSecondary} />
                        </GlassCard>
                    </TouchableOpacity>
                ))}
            </View>

            <Text style={styles.sectionLabel}>Support</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Support')} activeOpacity={0.8}>
                <GlassCard style={styles.rowCard}>
                    <View style={[styles.iconCircle, { backgroundColor: 'rgba(234,16,60,0.10)' }]}>
                        <Ionicons name="mail-outline" size={18} color={Colors.primary} />
                    </View>
                    <Text style={styles.rowLabel}>Contact Support</Text>
                    <Ionicons name="chevron-forward" size={18} color={Colors.textSecondary} />
                </GlassCard>
            </TouchableOpacity>
        </AppScreen>
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
    sectionLabel: {
        ...Typography.dataLabel,
        marginLeft: 4,
        marginBottom: 8,
    },
    stack: {
        gap: 10,
        marginBottom: 14,
    },
    rowCard: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    iconCircle: {
        width: 34,
        height: 34,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    rowLabel: {
        flex: 1,
        fontSize: 14,
        fontWeight: '600',
        color: Colors.textPrimary,
    },
});
