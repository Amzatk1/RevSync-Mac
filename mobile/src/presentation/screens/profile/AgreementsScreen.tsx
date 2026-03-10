import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { legalService } from '../../../services/legalService';
import { AppScreen, GlassCard, TopBar } from '../../components/AppUI';
import { Theme } from '../../theme';

const { Colors, Layout, Spacing, Typography } = Theme;

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
            case 'TERMS':
                return 'document-text-outline';
            case 'PRIVACY':
                return 'shield-checkmark-outline';
            case 'SAFETY':
                return 'warning-outline';
            default:
                return 'checkmark-circle-outline';
        }
    };

    const getIconColor = (type: string) => {
        switch (type) {
            case 'TERMS':
                return Colors.info;
            case 'PRIVACY':
                return '#9B8CFF';
            case 'SAFETY':
                return Colors.warning;
            default:
                return Colors.primary;
        }
    };

    const getLabel = (type: string) => {
        switch (type) {
            case 'TERMS':
                return 'Terms & Conditions';
            case 'PRIVACY':
                return 'Privacy Policy';
            case 'SAFETY':
                return 'Safety Disclaimer';
            case 'REFUND':
                return 'Refund Policy';
            default:
                return type;
        }
    };

    const formatDate = (dateString: string) =>
        new Date(dateString).toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });

    return (
        <AppScreen scroll contentContainerStyle={styles.content}>
            <TopBar title="Agreements" subtitle="Accepted legal and safety documents" onBack={() => navigation?.goBack?.()} />

            <View style={styles.hero}>
                <Text style={styles.kicker}>Compliance History</Text>
                <Text style={styles.title}>Every acceptance remains visible and timestamped.</Text>
                <Text style={styles.subtitle}>Legal versions, consent time, and document categories stay attached to the account for auditability and user trust.</Text>
            </View>

            {loading ? (
                <View style={styles.loadingWrap}>
                    <ActivityIndicator color={Colors.accent} />
                </View>
            ) : (
                <>
                    {history.map((item) => {
                        const color = getIconColor(item.document_type);
                        return (
                            <GlassCard key={item.id} style={styles.card}>
                                <View style={styles.cardRow}>
                                    <View style={[styles.iconCircle, { backgroundColor: `${color}18` }]}>
                                        <Ionicons name={getIcon(item.document_type) as any} size={20} color={color} />
                                    </View>
                                    <View style={styles.cardCopy}>
                                        <Text style={styles.docTitle}>{getLabel(item.document_type)}</Text>
                                        <Text style={styles.docVersion}>Version {item.version}</Text>
                                        <Text style={styles.docDate}>Accepted {formatDate(item.accepted_at)}</Text>
                                    </View>
                                    <View style={styles.checkCircle}>
                                        <Ionicons name="checkmark" size={14} color={Colors.white} />
                                    </View>
                                </View>
                            </GlassCard>
                        );
                    })}

                    {history.length === 0 && (
                        <GlassCard style={styles.emptyState}>
                            <Ionicons name="document-outline" size={42} color={Colors.textTertiary} />
                            <Text style={styles.emptyTitle}>No agreements found</Text>
                            <Text style={styles.emptyText}>Accepted legal documents will appear here after onboarding or account updates.</Text>
                        </GlassCard>
                    )}

                    <GlassCard style={styles.footer}>
                        <View style={styles.footerIcon}>
                            <Ionicons name="lock-closed" size={14} color={Colors.textTertiary} />
                        </View>
                        <Text style={styles.footerText}>
                            RevSync stores timestamps and related metadata for security, audit, and compliance validation.
                        </Text>
                    </GlassCard>
                </>
            )}
        </AppScreen>
    );
};

const styles = StyleSheet.create({
    content: {
        paddingBottom: 120,
    },
    hero: {
        marginTop: 8,
        marginBottom: 18,
        gap: 8,
    },
    kicker: {
        ...Typography.dataLabel,
        color: Colors.accent,
    },
    title: {
        ...Typography.h1,
        maxWidth: 320,
    },
    subtitle: {
        ...Typography.caption,
        lineHeight: 20,
        maxWidth: 340,
    },
    loadingWrap: {
        flex: 1,
        minHeight: 240,
        justifyContent: 'center',
        alignItems: 'center',
    },
    card: {
        marginBottom: 12,
    },
    cardRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
    },
    iconCircle: {
        width: 42,
        height: 42,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    cardCopy: {
        flex: 1,
    },
    docTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: Colors.textPrimary,
    },
    docVersion: {
        fontSize: 12,
        color: Colors.textSecondary,
        marginTop: 2,
    },
    docDate: {
        fontSize: 12,
        color: Colors.textTertiary,
        marginTop: 2,
    },
    checkCircle: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: Colors.success,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: 36,
        gap: 8,
    },
    emptyTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: Colors.textPrimary,
    },
    emptyText: {
        ...Typography.caption,
        textAlign: 'center',
        maxWidth: 280,
    },
    footer: {
        marginTop: 6,
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 10,
    },
    footerIcon: {
        marginTop: 2,
    },
    footerText: {
        flex: 1,
        fontSize: 12,
        lineHeight: 18,
        color: Colors.textTertiary,
    },
});
