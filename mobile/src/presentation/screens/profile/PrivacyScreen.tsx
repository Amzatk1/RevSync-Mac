import React from 'react';
import { View, Text, StyleSheet, Switch } from 'react-native';
import { Theme } from '../../theme';
import { Screen, Card } from '../../components/SharedComponents';

import { useSettingsStore } from '../../store/useSettingsStore';

export const PrivacyScreen = () => {
    const {
        analyticsEnabled, toggleAnalytics,
        crashReports, toggleCrashReports,
        recommendationsEnabled, toggleRecommendations
    } = useSettingsStore();

    return (
        <Screen scroll>
            <View style={styles.header}>
                <Text style={styles.title}>Privacy & Data</Text>
                <Text style={styles.subtitle}>Manage what you share with us</Text>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Privacy Preferences</Text>
                <Card style={styles.card}>
                    <PrivacyRow
                        label="Analytics"
                        subLabel="Share usage data to help us improve."
                        value={analyticsEnabled}
                        onValueChange={toggleAnalytics}
                    />
                    <Divider />
                    <PrivacyRow
                        label="Crash Reports"
                        subLabel="Automatically send anonymous crash logs."
                        value={crashReports}
                        onValueChange={toggleCrashReports}
                    />
                    <Divider />
                    <PrivacyRow
                        label="Personalized Recommendations"
                        subLabel="Allow usage data to tailor suggestions."
                        value={recommendationsEnabled}
                        onValueChange={toggleRecommendations}
                    />
                </Card>
                <Text style={styles.note}>
                    We minimise data collection. You can change your preferences at any time. We do not sell personal data.
                </Text>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Data Access</Text>
                <Card style={styles.card}>
                    <View style={styles.row}>
                        <Text style={styles.label}>Export Account Data</Text>
                        <Text style={styles.link}>Request</Text>
                    </View>
                </Card>
            </View>
        </Screen>
    );
};

const PrivacyRow = ({ label, subLabel, value, onValueChange }: any) => (
    <View style={styles.row}>
        <View style={{ flex: 1, marginRight: 16 }}>
            <Text style={styles.label}>{label}</Text>
            <Text style={styles.subLabel}>{subLabel}</Text>
        </View>
        <Switch
            value={value}
            onValueChange={onValueChange}
            trackColor={{ false: '#767577', true: Theme.Colors.primary }}
        />
    </View>
);

const Divider = () => <View style={styles.divider} />;

const styles = StyleSheet.create({
    header: { padding: Theme.Spacing.md },
    title: { ...Theme.Typography.h2 },
    subtitle: { color: Theme.Colors.textSecondary, marginTop: 4 },
    section: { marginBottom: 24 },
    sectionTitle: { marginLeft: 16, marginBottom: 8, color: Theme.Colors.textSecondary, fontWeight: 'bold' },
    card: { padding: 0 },
    row: { padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    label: { color: Theme.Colors.text, fontSize: 16, fontWeight: '600' },
    subLabel: { color: Theme.Colors.textSecondary, fontSize: 13, marginTop: 2 },
    link: { color: Theme.Colors.primary, fontWeight: 'bold' },
    note: { marginHorizontal: 16, marginTop: 8, fontSize: 12, color: Theme.Colors.textSecondary, fontStyle: 'italic' },
    divider: { height: 1, backgroundColor: Theme.Colors.surfaceHighlight, marginLeft: 16 },
});
