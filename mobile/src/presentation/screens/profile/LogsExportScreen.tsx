import React, { useEffect, useState } from 'react';
import { Alert, FlatList, Share, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppScreen, GlassCard, TopBar } from '../../components/AppUI';
import { Theme } from '../../theme';
import { garageService } from '../../../services/garageService';

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
    const [flashSessionCount, setFlashSessionCount] = useState(0);
    const [backupCount, setBackupCount] = useState(0);

    useEffect(() => {
        setLogs([...logBuffer]);
        const interval = setInterval(() => setLogs([...logBuffer]), 2000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const loadSupportContext = async () => {
            try {
                const [flashJobs, backups] = await Promise.all([
                    garageService.getAllFlashJobs(),
                    garageService.getAllBackups(),
                ]);
                setFlashSessionCount(flashJobs.length);
                setBackupCount(backups.length);
            } catch {
                setFlashSessionCount(0);
                setBackupCount(0);
            }
        };
        loadSupportContext();
    }, []);

    const handleExport = async () => {
        if (logs.length === 0) {
            Alert.alert('No logs', 'No log entries captured yet.');
            return;
        }

        let supportSnapshot = '';
        try {
            const [flashJobs, backups] = await Promise.all([
                garageService.getAllFlashJobs(),
                garageService.getAllBackups(),
            ]);

            const flashLines = flashJobs.slice(0, 10).map((job) =>
                `[${job.created_at}] ${job.status} ${job.progress ?? 0}% ${job.tune_detail?.title || job.tune_detail?.name || 'Untitled Tune'}`
            );
            const backupLines = backups.slice(0, 10).map((backup) =>
                `[${backup.created_at}] backup#${backup.id} ${backup.file_size_kb}KB ${backup.checksum.slice(0, 12)}...`
            );

            supportSnapshot = [
                '=== Backend Support Snapshot ===',
                `Flash jobs: ${flashJobs.length}`,
                ...flashLines,
                `Backups: ${backups.length}`,
                ...backupLines,
                '',
            ].join('\n');
        } catch {
            supportSnapshot = '=== Backend Support Snapshot ===\nUnavailable while offline.\n\n';
        }

        const consoleLogs = logs.map((log) => `[${log.timestamp}] [${log.level}] ${log.message}`).join('\n');
        const content = `${supportSnapshot}=== Console Logs ===\n${consoleLogs}`;
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
                <Text style={styles.infoText}>
                    Support export includes live console logs plus persisted flash/backups context when the backend is reachable.
                </Text>
            </GlassCard>

            <GlassCard style={styles.summaryCard}>
                <View style={styles.summaryItem}>
                    <Text style={styles.summaryValue}>{logs.length}</Text>
                    <Text style={styles.summaryLabel}>Console Logs</Text>
                </View>
                <View style={styles.summaryDivider} />
                <View style={styles.summaryItem}>
                    <Text style={styles.summaryValue}>{flashSessionCount}</Text>
                    <Text style={styles.summaryLabel}>Flash Jobs</Text>
                </View>
                <View style={styles.summaryDivider} />
                <View style={styles.summaryItem}>
                    <Text style={styles.summaryValue}>{backupCount}</Text>
                    <Text style={styles.summaryLabel}>Backups</Text>
                </View>
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
    summaryCard: {
        marginTop: 12,
        flexDirection: 'row',
        alignItems: 'center',
    },
    summaryItem: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: 4,
    },
    summaryValue: {
        fontSize: 20,
        fontWeight: '800',
        color: Colors.textPrimary,
    },
    summaryLabel: {
        marginTop: 2,
        fontSize: 10,
        letterSpacing: 0.8,
        fontWeight: '700',
        textTransform: 'uppercase',
        color: Colors.textSecondary,
    },
    summaryDivider: {
        width: 1,
        height: 32,
        backgroundColor: Colors.divider,
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
