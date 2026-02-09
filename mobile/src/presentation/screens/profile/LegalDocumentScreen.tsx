import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Theme } from '../../theme';
import { Screen, PrimaryButton, Card } from '../../components/SharedComponents';
import { Ionicons } from '@expo/vector-icons';
import { StorageAdapter } from '../../../data/services/StorageAdapter';

const ACCEPTANCE_KEY_PREFIX = 'legal_accepted_';

// Documents that require explicit acceptance
const REQUIRED_DOCS = ['Terms & Conditions', 'Privacy Policy', 'Safety Disclaimer'];

interface AcceptanceRecord {
    acceptedAt: string;
    version: string;
}

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
        <Screen scroll>
            <View style={styles.container}>
                <Text style={styles.title}>{title}</Text>

                {/* Version & Acceptance Badge */}
                <View style={styles.metaRow}>
                    <View style={styles.versionBadge}>
                        <Text style={styles.versionText}>v1.0</Text>
                    </View>
                    {acceptance && (
                        <View style={styles.acceptedBadge}>
                            <Ionicons name="checkmark-circle" size={14} color={Theme.Colors.success} />
                            <Text style={styles.acceptedText}>Accepted {formattedDate}</Text>
                        </View>
                    )}
                </View>

                <View style={styles.contentContainer}>
                    <Text style={styles.text}>{content}</Text>
                </View>

                {/* Accept Button (only for required docs) */}
                {isRequired && (
                    <View style={styles.footer}>
                        {acceptance ? (
                            <Card style={styles.confirmedCard}>
                                <View style={styles.confirmedRow}>
                                    <Ionicons name="shield-checkmark" size={24} color={Theme.Colors.success} />
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.confirmedTitle}>Accepted</Text>
                                        <Text style={styles.confirmedDate}>
                                            Version {acceptance.version} • {formattedDate}
                                        </Text>
                                    </View>
                                </View>
                            </Card>
                        ) : (
                            <PrimaryButton
                                title={accepting ? 'Saving...' : `I Accept ${title}`}
                                onPress={handleAccept}
                                loading={accepting}
                                icon="shield-checkmark-outline"
                            />
                        )}
                    </View>
                )}
            </View>
        </Screen>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: Theme.Spacing.md,
    },
    title: {
        ...Theme.Typography.h2,
        marginBottom: 8,
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: Theme.Spacing.lg,
    },
    versionBadge: {
        backgroundColor: Theme.Colors.surfaceHighlight,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    versionText: {
        fontSize: 12,
        fontWeight: '600',
        color: Theme.Colors.textSecondary,
    },
    acceptedBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    acceptedText: {
        fontSize: 12,
        color: Theme.Colors.success,
        fontWeight: '500',
    },
    contentContainer: {
        backgroundColor: Theme.Colors.surface,
        borderRadius: Theme.Layout.borderRadius,
        padding: 16,
        marginBottom: Theme.Spacing.lg,
        borderWidth: 1,
        borderColor: Theme.Colors.border,
    },
    text: {
        ...Theme.Typography.body,
        fontSize: 14,
        lineHeight: 22,
    },
    footer: {
        marginTop: 8,
    },
    confirmedCard: {
        borderColor: Theme.Colors.success,
        borderWidth: 1,
        backgroundColor: 'rgba(16, 185, 129, 0.08)',
    },
    confirmedRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
    },
    confirmedTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: Theme.Colors.success,
    },
    confirmedDate: {
        fontSize: 12,
        color: Theme.Colors.textSecondary,
        marginTop: 2,
    },
});
