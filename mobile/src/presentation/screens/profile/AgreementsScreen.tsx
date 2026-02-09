import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { Theme } from '../../theme';
import { Screen, Card } from '../../components/SharedComponents';
import { Ionicons } from '@expo/vector-icons';
import { legalService } from '../../../services/legalService';

interface Agreement {
    id: number;
    document_type: string;
    version: string;
    accepted_at: string;
}

export const AgreementsScreen = () => {
    const [loading, setLoading] = useState(true);
    const [history, setHistory] = useState<Agreement[]>([]);

    useEffect(() => {
        loadHistory();
    }, []);

    const loadHistory = async () => {
        try {
            // In a real implementation with the new backend:
            // const data = await legalService.getHistory();
            // setHistory(data);

            // Mock data for immediate visualization until API client is fully regenerated
            // This mimics the structure of the Django UserLegalAcceptance model
            setTimeout(() => {
                setHistory([
                    { id: 1, document_type: 'TERMS', version: '1.0', accepted_at: '2025-11-18T10:00:00Z' },
                    { id: 2, document_type: 'PRIVACY', version: '1.0', accepted_at: '2025-11-18T10:00:05Z' },
                    { id: 3, document_type: 'SAFETY', version: '1.0', accepted_at: '2025-11-19T14:30:00Z' },
                ]);
                setLoading(false);
            }, 600);

        } catch (error) {
            console.error(error);
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
        <Screen scroll>
            <View style={styles.header}>
                <Text style={styles.title}>Agreements & Consents</Text>
                <Text style={styles.subtitle}>Legal documents you have accepted</Text>
            </View>

            {loading ? (
                <View style={{ padding: 20 }}>
                    <ActivityIndicator color={Theme.Colors.primary} />
                </View>
            ) : (
                <View style={styles.list}>
                    {history.map((item) => (
                        <Card key={item.id} style={styles.card}>
                            <View style={styles.row}>
                                <View style={styles.iconContainer}>
                                    <Ionicons name={getIcon(item.document_type) as any} size={24} color={Theme.Colors.primary} />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.docTitle}>{getLabel(item.document_type)}</Text>
                                    <Text style={styles.version}>Version {item.version}</Text>
                                    <Text style={styles.date}>Accepted: {formatDate(item.accepted_at)}</Text>
                                </View>
                                <Ionicons name="checkmark-circle" size={20} color={Theme.Colors.success} />
                            </View>
                        </Card>
                    ))}

                    {history.length === 0 && (
                        <Text style={{ textAlign: 'center', color: Theme.Colors.textSecondary, marginTop: 20 }}>
                            No agreements found.
                        </Text>
                    )}
                </View>
            )}

            <View style={{ padding: 16 }}>
                <Text style={{ color: Theme.Colors.textSecondary, fontSize: 12, textAlign: 'center' }}>
                    Your IP address and timestamp are recorded for security and compliance verification.
                </Text>
            </View>
        </Screen>
    );
};

const styles = StyleSheet.create({
    header: { padding: Theme.Spacing.md },
    title: { ...Theme.Typography.h2 },
    subtitle: { color: Theme.Colors.textSecondary, marginTop: 4 },
    list: { padding: 16, gap: 12 },
    card: { padding: 16 },
    row: { flexDirection: 'row', alignItems: 'center', gap: 16 },
    iconContainer: {
        width: 40, height: 40,
        borderRadius: 20,
        backgroundColor: Theme.Colors.surfaceHighlight,
        alignItems: 'center', justifyContent: 'center'
    },
    docTitle: { color: Theme.Colors.text, fontWeight: '600', fontSize: 16 },
    version: { color: Theme.Colors.textSecondary, fontSize: 12, marginTop: 2 },
    date: { color: Theme.Colors.textSecondary, fontSize: 12 },
});
