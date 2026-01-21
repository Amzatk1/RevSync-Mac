import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Theme } from '../../theme';
import { Screen, PrimaryButton, SecondaryButton, LoadingOverlay, Card, ErrorBanner } from '../../components/SharedComponents';
import { Ionicons } from '@expo/vector-icons';
import { ServiceLocator } from '../../../di/ServiceLocator';
import { SafetyReport } from '../../../domain/entities/SafetyReport';
import { useAppStore } from '../../store/useAppStore';

export const TuneValidationScreen = ({ route, navigation }: any) => {
    const { tuneId } = route.params;
    const { activeBike } = useAppStore();
    const [report, setReport] = useState<SafetyReport | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        runValidation();
    }, [tuneId]);

    const runValidation = async () => {
        setLoading(true);
        setError(null);
        try {
            const tuneService = ServiceLocator.getTuneService();
            const tune = await tuneService.getTuneDetails(tuneId);

            if (!tune) throw new Error('Tune not found');

            const validationService = ServiceLocator.getValidationService();
            const result = await validationService.validateTuneForBike(tune, activeBike);
            setReport(result);
        } catch (e: any) {
            setError(e.message || 'Validation failed');
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <LoadingOverlay visible={true} message="Analysing Safety..." />;

    if (error || !report) {
        return (
            <Screen center>
                <ErrorBanner message={error || 'Could not generate safety report'} onRetry={runValidation} />
            </Screen>
        );
    }

    const hasBlockers = report.blockers.length > 0;
    const scoreColor = report.score > 80 ? Theme.Colors.success : report.score > 50 ? Theme.Colors.warning : Theme.Colors.error;

    return (
        <Screen scroll>
            <View style={styles.header}>
                <Text style={styles.title}>Safety Validation</Text>
                <Text style={styles.subtitle}>Pre-flash analysis</Text>
            </View>

            {/* Score Card */}
            <View style={styles.scoreContainer}>
                <View style={[styles.scoreCircle, { borderColor: scoreColor }]}>
                    <Text style={[styles.scoreValue, { color: scoreColor }]}>{report.score}</Text>
                    <Text style={styles.scoreLabel}>Safety Score</Text>
                </View>
            </View>

            {/* Status Lists */}
            <View style={styles.section}>
                <Text style={styles.sectionHeader}>Analysis Results</Text>

                {report.blockers.map((msg, i) => (
                    <View key={`err-${i}`} style={styles.itemRow}>
                        <Ionicons name="close-circle" size={24} color={Theme.Colors.error} />
                        <Text style={styles.blockerText}>{msg}</Text>
                    </View>
                ))}

                {report.warnings.map((msg, i) => (
                    <View key={`warn-${i}`} style={styles.itemRow}>
                        <Ionicons name="warning" size={24} color={Theme.Colors.warning} />
                        <Text style={styles.warningText}>{msg}</Text>
                    </View>
                ))}

                {!hasBlockers && report.warnings.length === 0 && (
                    <View style={styles.itemRow}>
                        <Ionicons name="checkmark-circle" size={24} color={Theme.Colors.success} />
                        <Text style={styles.successText}>All checks passed. Ready to flash.</Text>
                    </View>
                )}
            </View>

            {/* Required Actions */}
            {report.requiredActions.length > 0 && (
                <View style={[styles.section, { borderBottomWidth: 0 }]}>
                    <Text style={styles.sectionHeader}>Required Actions</Text>
                    {report.requiredActions.includes('IDENTIFY_ECU') && (
                        <Card style={{ marginTop: 8 }}>
                            <Text style={styles.actionTitle}>Identify ECU</Text>
                            <Text style={styles.actionBody}>
                                We need to read your ECU identifiers to verify compatibility.
                            </Text>
                            <SecondaryButton
                                title="Identify ECU"
                                onPress={() => navigation.navigate('Flash', { screen: 'ECUIdentify' })}
                                style={{ marginTop: 8 }}
                            />
                        </Card>
                    )}
                    {/* Add download/backup actions here similarly */}
                </View>
            )}

            <View style={styles.footer}>
                {hasBlockers ? (
                    <ErrorBanner message="Resolve all blockers to proceed." />
                ) : (
                    <PrimaryButton
                        title="Continue to Connect"
                        onPress={() => navigation.navigate('Flash', {
                            screen: 'DeviceConnect',
                            params: { tuneId }
                        })}
                    />
                )}
            </View>
        </Screen>
    );
};

const styles = StyleSheet.create({
    header: {
        padding: Theme.Spacing.md,
        alignItems: 'center',
    },
    title: {
        ...Theme.Typography.h2,
    },
    subtitle: {
        ...Theme.Typography.caption,
        marginTop: 4,
    },
    scoreContainer: {
        alignItems: 'center',
        marginVertical: Theme.Spacing.md,
    },
    scoreCircle: {
        width: 120,
        height: 120,
        borderRadius: 60,
        borderWidth: 8,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: Theme.Colors.surface,
    },
    scoreValue: {
        fontSize: 36,
        fontWeight: 'bold',
    },
    scoreLabel: {
        fontSize: 12,
        color: Theme.Colors.textSecondary,
    },
    section: {
        padding: Theme.Spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: Theme.Colors.border,
    },
    sectionHeader: {
        ...Theme.Typography.h3,
        marginBottom: Theme.Spacing.md,
    },
    itemRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        gap: 12,
        backgroundColor: Theme.Colors.surface,
        padding: 12,
        borderRadius: 8,
    },
    blockerText: {
        color: Theme.Colors.error,
        flex: 1,
        fontWeight: '600',
    },
    warningText: {
        color: Theme.Colors.warning,
        flex: 1,
        fontWeight: '600',
    },
    successText: {
        color: Theme.Colors.success,
        flex: 1,
        fontWeight: '600',
    },
    actionTitle: {
        fontWeight: 'bold',
        color: Theme.Colors.text,
        marginBottom: 4,
    },
    actionBody: {
        color: Theme.Colors.textSecondary,
        fontSize: 14,
    },
    footer: {
        padding: Theme.Spacing.md,
        marginTop: Theme.Spacing.md,
    },
});
