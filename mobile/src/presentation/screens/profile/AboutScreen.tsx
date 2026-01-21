import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Theme } from '../../theme';
import { Screen, Card } from '../../components/SharedComponents';
import { Ionicons } from '@expo/vector-icons';

export const AboutScreen = () => {
    return (
        <Screen scroll>
            <View style={styles.header}>
                <Text style={styles.title}>About RevSync</Text>
            </View>

            <View style={styles.content}>
                <View style={styles.logoContainer}>
                    <Ionicons name="flash" size={64} color={Theme.Colors.primary} />
                    <Text style={styles.appName}>RevSync</Text>
                    <Text style={styles.version}>Version 1.0.0 (Build 102)</Text>
                </View>

                <Card style={styles.card}>
                    <Text style={styles.sectionHeader}>Objective</Text>
                    <Text style={styles.text}>
                        RevSync empowers riders to take control of their machine's performance.
                        Safe, reliable, and powerful ECU tuning from your pocket.
                    </Text>
                </Card>

                <Card style={styles.card}>
                    <Text style={styles.sectionHeader}>Credits</Text>
                    <View style={styles.row}>
                        <Text style={styles.label}>Development</Text>
                        <Text style={styles.value}>Google Deepmind Team</Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.label}>Design</Text>
                        <Text style={styles.value}>RevSync Design System</Text>
                    </View>
                </Card>

                <Text style={styles.copyright}>© 2026 RevSync. All rights reserved.</Text>
            </View>
        </Screen>
    );
};

const styles = StyleSheet.create({
    header: {
        padding: Theme.Spacing.md,
    },
    title: {
        ...Theme.Typography.h2,
    },
    content: {
        padding: Theme.Spacing.md,
    },
    logoContainer: {
        alignItems: 'center',
        marginBottom: 32,
        paddingTop: 16,
    },
    appName: {
        fontSize: 28,
        fontWeight: 'bold',
        color: Theme.Colors.text,
        marginTop: 16,
    },
    version: {
        fontSize: 14,
        color: Theme.Colors.textSecondary,
        marginTop: 4,
    },
    card: {
        marginBottom: 16,
    },
    sectionHeader: {
        fontSize: 16,
        fontWeight: 'bold',
        color: Theme.Colors.text,
        marginBottom: 8,
    },
    text: {
        color: Theme.Colors.textSecondary,
        lineHeight: 22,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: Theme.Colors.surfaceHighlight,
    },
    label: {
        color: Theme.Colors.textSecondary,
    },
    value: {
        color: Theme.Colors.text,
        fontWeight: '500',
    },
    copyright: {
        textAlign: 'center',
        color: Theme.Colors.textSecondary,
        fontSize: 12,
        marginTop: 24,
    },
});
