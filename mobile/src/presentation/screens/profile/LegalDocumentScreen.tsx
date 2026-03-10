import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { legalService } from '../../../services/legalService';
import { AppScreen, GlassCard, TopBar } from '../../components/AppUI';
import { Theme } from '../../theme';

const { Colors, Layout, Typography } = Theme;

const REQUIRED_DOCS = ['Terms & Conditions', 'Privacy Policy', 'ECU Flashing Safety Disclaimer'];

const DOCUMENT_TYPE_MAP: Record<string, 'TERMS' | 'PRIVACY' | 'SAFETY' | 'REFUND' | undefined> = {
    'Terms & Conditions': 'TERMS',
    'Privacy Policy': 'PRIVACY',
    'ECU Flashing Safety Disclaimer': 'SAFETY',
    'Refund Policy': 'REFUND',
};

interface AcceptanceRecord {
    acceptedAt: string;
    version: string;
}

export const LegalDocumentScreen = ({ route, navigation }: any) => {
    const { title, content } = route.params;
    const [acceptance, setAcceptance] = useState<AcceptanceRecord | null>(null);
    const [accepting, setAccepting] = useState(false);
    const isRequired = REQUIRED_DOCS.some((doc) => title.includes(doc));
    const documentType = DOCUMENT_TYPE_MAP[title];

    useEffect(() => {
        loadAcceptance();
    }, [title]);

    const loadAcceptance = async () => {
        if (!documentType) {
            setAcceptance(null);
            return;
        }
        const history = await legalService.getHistory();
        const match = history.find((item) => item.document_type === documentType);
        if (match) {
            setAcceptance({
                acceptedAt: match.accepted_at,
                version: match.version,
            });
        } else {
            setAcceptance(null);
        }
    };

    const handleAccept = async () => {
        if (!documentType) return;
        setAccepting(true);
        try {
            const response = await legalService.acceptDocument(documentType, '1.0');
            const acceptedAt = response?.accepted_at || new Date().toISOString();
            const version = response?.version || '1.0';
            const record: AcceptanceRecord = { acceptedAt, version };
            setAcceptance(record);
        } catch {
            Alert.alert('Unable to save acceptance', 'Try again in a moment.');
        } finally {
            setAccepting(false);
        }
    };

    const formattedDate = acceptance
        ? new Date(acceptance.acceptedAt).toLocaleDateString('en-GB', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
          })
        : null;

    return (
        <AppScreen contentContainerStyle={styles.screen}>
            <TopBar title={title} subtitle="Legal content and acceptance state" onBack={() => navigation.goBack()} />

            <View style={styles.metaRow}>
                <GlassCard style={styles.metaPill}>
                    <Text style={styles.metaPillText}>Version 1.0</Text>
                </GlassCard>
                {acceptance && (
                    <GlassCard style={styles.metaPill}>
                        <View style={styles.acceptedRow}>
                            <Ionicons name="checkmark-circle" size={14} color={Colors.success} />
                            <Text style={styles.acceptedText}>Accepted {formattedDate}</Text>
                        </View>
                    </GlassCard>
                )}
            </View>

            <GlassCard style={styles.documentCard}>
                <ScrollView showsVerticalScrollIndicator={false}>
                    <Text style={styles.documentText}>{content}</Text>
                </ScrollView>
            </GlassCard>

            {isRequired && documentType && (
                <View style={styles.footer}>
                    {acceptance ? (
                        <GlassCard style={styles.acceptedCard}>
                            <Ionicons name="shield-checkmark" size={20} color={Colors.success} />
                            <View style={{ flex: 1 }}>
                                <Text style={styles.acceptedTitle}>Accepted</Text>
                                <Text style={styles.acceptedMeta}>
                                    Version {acceptance.version} • {formattedDate}
                                </Text>
                            </View>
                        </GlassCard>
                    ) : (
                        <TouchableOpacity style={styles.acceptButton} onPress={handleAccept} disabled={accepting}>
                            <Text style={styles.acceptButtonText}>{accepting ? 'Saving Acceptance...' : `Accept ${title}`}</Text>
                        </TouchableOpacity>
                    )}
                </View>
            )}
        </AppScreen>
    );
};

const styles = StyleSheet.create({
    screen: {
        paddingBottom: 120,
    },
    metaRow: {
        flexDirection: 'row',
        gap: 8,
        marginTop: 8,
        marginBottom: 12,
    },
    metaPill: {
        paddingVertical: 8,
        paddingHorizontal: 12,
    },
    metaPillText: {
        fontSize: 12,
        fontWeight: '700',
        color: Colors.textSecondary,
    },
    acceptedRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    acceptedText: {
        fontSize: 12,
        fontWeight: '700',
        color: Colors.success,
    },
    documentCard: {
        flex: 1,
        minHeight: 360,
    },
    documentText: {
        fontSize: 14,
        lineHeight: 22,
        color: Colors.textSecondary,
    },
    footer: {
        marginTop: 12,
    },
    acceptedCard: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    acceptedTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: Colors.success,
    },
    acceptedMeta: {
        fontSize: 12,
        color: Colors.textSecondary,
        marginTop: 2,
    },
    acceptButton: {
        minHeight: 50,
        borderRadius: Layout.buttonRadius,
        backgroundColor: Colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
    },
    acceptButtonText: {
        fontSize: 14,
        fontWeight: '800',
        color: Colors.white,
        textAlign: 'center',
        paddingHorizontal: 12,
    },
});
