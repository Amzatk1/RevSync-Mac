import React, { useEffect, useState } from 'react';
import { Alert, FlatList, Share, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppScreen, GlassCard, TopBar } from '../../components/AppUI';
import { Theme } from '../../theme';

const { Colors, Layout, Typography } = Theme;

interface LogEntry {
    id: string;
    timestamp: string;
    level: 'INFO' | 'WARN' | 'ERROR';
    message: string;
}

const logBuffer: LogEntry[] = [];
let logIdCounter = 0;

const captureLog = (level: LogEntry['level'], args: any[]) => {
    const message = args.map((arg) => (typeof arg === 'string' ? arg : JSON.stringify(arg))).join(' ');
    logBuffer.unshift({
        id: String(++logIdCounter),
        timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
        level,
        message,
    });
    if (logBuffer.length > 200) logBuffer.length = 200;
};

const _origLog = console.log;
const _origWarn = console.warn;
const _origError = console.error;
let _patched = false;

const patchConsole = () => {
    if (_patched) return;
    _patched = true;

    console.log = (...args: any[]) => {
        captureLog('INFO', args);
        _origLog.apply(console, args);
    };
    console.warn = (...args: any[]) => {
        captureLog('WARN', args);
        _origWarn.apply(console, args);
    };
    console.error = (...args: any[]) => {
        captureLog('ERROR', args);
        _origError.apply(console, args);
    };
};

patchConsole();

export const LogsExportScreen = ({ navigation }: any) => {
    const [logs, setLogs] = useState<LogEntry[]>([]);

    useEffect(() => {
        setLogs([...logBuffer]);
        const interval = setInterval(() => setLogs([...logBuffer]), 2000);
        return () => clearInterval(interval);
    }, []);

    const handleExport = async () => {
        if (logs.length === 0) {
            Alert.alert('No logs', 'No log entries captured yet.');
            return;
        }

        const content = logs.map((log) => `[${log.timestamp}] [${log.level}] ${log.message}`).join('\n');
        try {
            await Share.share({ message: content, title: 'RevSync App Logs' });
        } catch (e) {
            console.error('Share failed:', e);
        }
    };

    const levelColor = (level: LogEntry['level']) => {
        switch (level) {
            case 'ERROR':
                return Colors.error;
            case 'WARN':
                return Colors.warning;
            default:
                return Colors.success;
        }
    };

    return (
        <AppScreen contentContainerStyle={styles.screen}>
            <TopBar title="Session Logs" subtitle="Captured console output for support and diagnostics" onBack={() => navigation.goBack()} />

            <GlassCard style={styles.consoleCard}>
                <View style={styles.consoleHeader}>
                    <Text style={styles.consoleTitle}>revsync-session.log</Text>
                    <Text style={styles.consoleCount}>{logs.length} entries</Text>
                </View>

                {logs.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Ionicons name="terminal-outline" size={36} color={Colors.textTertiary} />
                        <Text style={styles.emptyTitle}>No logs yet</Text>
                        <Text style={styles.emptyBody}>Use the app normally to generate log entries for export.</Text>
                    </View>
                ) : (
                    <FlatList
                        data={logs}
                        keyExtractor={(item) => item.id}
                        renderItem={({ item }) => (
                            <View style={styles.logRow}>
                                <Text style={styles.logTime}>{item.timestamp.slice(11)}</Text>
                                <View style={[styles.levelPill, { backgroundColor: `${levelColor(item.level)}15` }]}>
                                    <Text style={[styles.levelText, { color: levelColor(item.level) }]}>{item.level}</Text>
                                </View>
                                <Text style={styles.logMsg} numberOfLines={2}>
                                    {item.message}
                                </Text>
                            </View>
                        )}
                        style={styles.logList}
                    />
                )}
            </GlassCard>

            <GlassCard style={styles.infoCard}>
                <Ionicons name="information-circle-outline" size={16} color={Colors.textSecondary} />
                <Text style={styles.infoText}>These are live session logs captured from console output and intended for support diagnostics.</Text>
            </GlassCard>

            <TouchableOpacity style={styles.exportButton} onPress={handleExport}>
                <Text style={styles.exportButtonText}>Export Logs</Text>
            </TouchableOpacity>
        </AppScreen>
    );
};

const styles = StyleSheet.create({
    screen: {
        paddingBottom: 120,
    },
    consoleCard: {
        marginTop: 8,
        flex: 1,
        minHeight: 420,
        backgroundColor: 'rgba(13,17,23,0.94)',
        borderColor: 'rgba(255,255,255,0.08)',
    },
    consoleHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    consoleTitle: {
        fontSize: 12,
        fontWeight: '700',
        color: Colors.textSecondary,
        fontFamily: 'Courier',
    },
    consoleCount: {
        fontSize: 11,
        color: Colors.textTertiary,
    },
    logList: {
        flex: 1,
    },
    logRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingVertical: 4,
    },
    logTime: {
        width: 60,
        fontSize: 11,
        color: '#6E7681',
        fontFamily: 'Courier',
    },
    levelPill: {
        minWidth: 44,
        alignItems: 'center',
        borderRadius: 6,
        paddingHorizontal: 6,
        paddingVertical: 2,
    },
    levelText: {
        fontSize: 9,
        fontWeight: '800',
        fontFamily: 'Courier',
    },
    logMsg: {
        flex: 1,
        fontSize: 12,
        color: '#C9D1D9',
        fontFamily: 'Courier',
    },
    emptyState: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 40,
    },
    emptyTitle: {
        marginTop: 12,
        fontSize: 18,
        fontWeight: '800',
        color: Colors.textPrimary,
    },
    emptyBody: {
        ...Typography.caption,
        marginTop: 8,
        textAlign: 'center',
        maxWidth: 260,
    },
    infoCard: {
        marginTop: 12,
        flexDirection: 'row',
        gap: 10,
        alignItems: 'flex-start',
    },
    infoText: {
        flex: 1,
        fontSize: 12,
        lineHeight: 18,
        color: Colors.textSecondary,
    },
    exportButton: {
        minHeight: 50,
        borderRadius: Layout.buttonRadius,
        backgroundColor: Colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 14,
    },
    exportButtonText: {
        fontSize: 15,
        fontWeight: '800',
        color: Colors.white,
    },
});
