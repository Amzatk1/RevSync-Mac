import React from 'react';
import { View, Text, StyleSheet, Switch } from 'react-native';
import { Theme } from '../../theme';
import { Screen, Card, SecondaryButton } from '../../components/SharedComponents';
import { useSettingsStore } from '../../store/useSettingsStore';

export const FlashingSafetySettingsScreen = () => {
    const { safetyModeEnabled, toggleSafetyMode, keepScreenAwake, toggleKeepScreenAwake } = useSettingsStore();

    return (
        <Screen scroll>
            <View style={styles.header}>
                <Text style={styles.title}>Flashing Safety</Text>
                <Text style={styles.subtitle}>Critical safety configurations</Text>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Safety Mode</Text>
                <Card style={styles.card}>
                    <View style={styles.row}>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.label}>Safety Mode Enabled</Text>
                            <Text style={styles.subLabel}>Enforce strict pre-checks before writing to ECU.</Text>
                        </View>
                        <Switch
                            value={safetyModeEnabled}
                            onValueChange={toggleSafetyMode}
                            trackColor={{ false: '#767577', true: Theme.Colors.primary }}
                        />
                    </View>
                </Card>
                <Text style={styles.note}>
                    RevSync will never allow flashing if safety-critical checks fail. Safety Mode changes how strict the system is, but core protections always remain on.
                </Text>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Connection Rules</Text>
                <Card style={styles.card}>
                    <View style={styles.row}>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.label}>Keep Screen Awake</Text>
                            <Text style={styles.subLabel}>Prevent phone sleep during critical operations.</Text>
                        </View>
                        <Switch
                            value={keepScreenAwake}
                            onValueChange={toggleKeepScreenAwake}
                            trackColor={{ false: '#767577', true: Theme.Colors.primary }}
                        />
                    </View>
                </Card>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Battery & Power</Text>
                <Card style={styles.card}>
                    <View style={styles.row}>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.label}>Power Check</Text>
                            <Text style={styles.subLabel}>Always ensure stable power and follow on-screen checklists.</Text>
                        </View>
                    </View>
                </Card>
            </View>
        </Screen>
    );
};

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
    note: { marginHorizontal: 16, marginTop: 8, fontSize: 12, color: Theme.Colors.textSecondary, fontStyle: 'italic' }
});
