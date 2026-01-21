import React, { useState } from 'react';
import { View, Text, StyleSheet, Share, FlatList } from 'react-native';
import { Theme } from '../../theme';
import { Screen, PrimaryButton, Card } from '../../components/SharedComponents';
import { Ionicons } from '@expo/vector-icons';

// Mock logs for demonstration
const MOCK_LOGS = [
    { id: '1', timestamp: '2024-05-20 10:23:01', level: 'INFO', message: 'App started v1.0.0' },
    { id: '2', timestamp: '2024-05-20 10:23:02', level: 'DEBUG', message: 'AuthService: Session restored' },
    { id: '3', timestamp: '2024-05-20 10:25:15', level: 'INFO', message: 'BLE: Scanning for devices...' },
    { id: '4', timestamp: '2024-05-20 10:25:18', level: 'INFO', message: 'BLE: Connected to OBDLink LX (AABBCC)' },
    { id: '5', timestamp: '2024-05-20 10:26:00', level: 'INFO', message: 'ECU: Identification started' },
    { id: '6', timestamp: '2024-05-20 10:26:02', level: 'DEBUG', message: 'ECU: Read ID success [ZX-10R-2023]' },
    { id: '7', timestamp: '2024-05-20 10:30:00', level: 'WARN', message: 'Validation: Battery voltage marginal (12.4V)' },
];

export const LogsExportScreen = ({ navigation }: any) => {
    const [exporting, setExporting] = useState(false);

    const handleExport = async () => {
        setExporting(true);
        try {
            // In reality, this would read from a file logger
            const logContent = MOCK_LOGS.map(l => `[${l.timestamp}] [${l.level}] ${l.message}`).join('\n');

            await Share.share({
                title: 'RevSync Debug Logs',
                message: logContent,
            });
        } catch (error) {
            console.log('Error sharing logs', error);
        } finally {
            setExporting(false);
        }
    };

    const renderItem = ({ item }: { item: typeof MOCK_LOGS[0] }) => (
        <View style={styles.logRow}>
            <Text style={styles.logTime}>{item.timestamp.split(' ')[1]}</Text>
            <Text style={[
                styles.logLevel,
                item.level === 'WARN' ? { color: '#FFA500' } :
                    item.level === 'ERROR' ? { color: Theme.Colors.error } :
                        { color: Theme.Colors.primary }
            ]}>
                {item.level}
            </Text>
            <Text style={styles.logMessage} numberOfLines={2}>{item.message}</Text>
        </View>
    );

    return (
        <Screen>
            <View style={styles.header}>
                <Text style={styles.title}>System Logs</Text>
                <Text style={styles.subtitle}>Debug information for troubleshooting</Text>
            </View>

            <View style={styles.infoContainer}>
                <Ionicons name="bug-outline" size={24} color={Theme.Colors.textSecondary} />
                <Text style={styles.infoText}>
                    These logs contain technical details about app performance and ECU communication.
                    No personal data is included.
                </Text>
            </View>

            <Card style={styles.listCard}>
                <FlatList
                    data={MOCK_LOGS}
                    renderItem={renderItem}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={true}
                />
            </Card>

            <View style={styles.footer}>
                <PrimaryButton
                    title={exporting ? "Preparing..." : "Export Logs to File"}
                    onPress={handleExport}
                    icon="share-outline"
                />
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
    subtitle: {
        color: Theme.Colors.textSecondary,
        marginTop: 4,
    },
    infoContainer: {
        flexDirection: 'row',
        paddingHorizontal: Theme.Spacing.md,
        marginBottom: 16,
        gap: 12,
        alignItems: 'center',
    },
    infoText: {
        flex: 1,
        fontSize: 12,
        color: Theme.Colors.textSecondary,
        lineHeight: 18,
    },
    listCard: {
        flex: 1,
        marginHorizontal: Theme.Spacing.md,
        padding: 0,
        backgroundColor: '#111', // Console look
        overflow: 'hidden',
    },
    listContent: {
        padding: 12,
    },
    logRow: {
        flexDirection: 'row',
        marginBottom: 8,
        gap: 8,
    },
    logTime: {
        fontFamily: 'monospace',
        fontSize: 11,
        color: Theme.Colors.textSecondary,
        width: 60,
    },
    logLevel: {
        fontFamily: 'monospace',
        fontSize: 11,
        fontWeight: 'bold',
        width: 40,
    },
    logMessage: {
        fontFamily: 'monospace',
        fontSize: 11,
        color: '#DDD',
        flex: 1,
    },
    footer: {
        padding: Theme.Spacing.md,
    },
});
