import React, { useEffect, useState, useRef } from 'react';
import {
    View, Text, StyleSheet, FlatList, TouchableOpacity, Share, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

// ─── Color Tokens ──────────────────────────────────────────────
const C = {
    bg: '#1a1a1a',
    surface: '#252525',
    border: 'rgba(255,255,255,0.05)',
    text: '#FFFFFF',
    muted: '#9ca3af',
    primary: '#ea103c',
};

// ─── Live Log Collector ────────────────────────────────────────
interface LogEntry {
    id: string;
    timestamp: string;
    level: 'INFO' | 'WARN' | 'ERROR';
    message: string;
}

const logBuffer: LogEntry[] = [];
let logIdCounter = 0;

const captureLog = (level: LogEntry['level'], args: any[]) => {
    const message = args.map(a => typeof a === 'string' ? a : JSON.stringify(a)).join(' ');
    logBuffer.unshift({
        id: String(++logIdCounter),
        timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
        level,
        message,
    });
    // Keep max 200 entries
    if (logBuffer.length > 200) logBuffer.length = 200;
};

// Intercept console methods once
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

// Start capturing immediately on import
patchConsole();

// ─── Component ─────────────────────────────────────────────────
export const LogsExportScreen = ({ navigation }: any) => {
    const [logs, setLogs] = useState<LogEntry[]>([]);

    useEffect(() => {
        // Snapshot current buffer
        setLogs([...logBuffer]);

        // Refresh every 2s
        const interval = setInterval(() => {
            setLogs([...logBuffer]);
        }, 2000);

        return () => clearInterval(interval);
    }, []);

    const handleExport = async () => {
        if (logs.length === 0) {
            Alert.alert('No Logs', 'No log entries captured yet.');
            return;
        }
        const logContent = logs.map(l => `[${l.timestamp}] [${l.level}] ${l.message}`).join('\n');
        try {
            await Share.share({ message: logContent, title: 'RevSync App Logs' });
        } catch (e) {
            console.error('Share failed:', e);
        }
    };

    const levelColor = (level: string) => {
        switch (level) {
            case 'ERROR': return '#EF4444';
            case 'WARN': return '#F59E0B';
            default: return '#22C55E';
        }
    };

    const renderItem = ({ item }: { item: LogEntry }) => (
        <View style={s.logRow}>
            <Text style={s.logTime}>{item.timestamp.slice(11)}</Text>
            <View style={[s.levelPill, { backgroundColor: `${levelColor(item.level)}15` }]}>
                <Text style={[s.levelText, { color: levelColor(item.level) }]}>{item.level}</Text>
            </View>
            <Text style={s.logMsg} numberOfLines={2}>{item.message}</Text>
        </View>
    );

    return (
        <SafeAreaView style={s.root} edges={['top']}>
            {/* ─── Header ─── */}
            <View style={s.header}>
                <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color={C.text} />
                </TouchableOpacity>
                <Text style={s.headerTitle}>App Logs</Text>
                <View style={{ width: 40 }} />
            </View>

            {/* ─── Console Frame ─── */}
            <View style={s.consoleFrame}>
                <View style={s.consoleTitleBar}>
                    <View style={s.trafficDots}>
                        <View style={[s.dot, { backgroundColor: '#FF5F57' }]} />
                        <View style={[s.dot, { backgroundColor: '#FEBC2E' }]} />
                        <View style={[s.dot, { backgroundColor: '#28C840' }]} />
                    </View>
                    <Text style={s.consoleTitle}>revsync — session logs</Text>
                    <Text style={s.consoleCount}>{logs.length} entries</Text>
                </View>

                {logs.length === 0 ? (
                    <View style={s.emptyState}>
                        <Ionicons name="terminal-outline" size={48} color={C.muted} />
                        <Text style={s.emptyTitle}>No Logs Yet</Text>
                        <Text style={s.emptySub}>Navigate around the app to generate log entries.</Text>
                    </View>
                ) : (
                    <FlatList
                        data={logs}
                        keyExtractor={(item) => item.id}
                        renderItem={renderItem}
                        contentContainerStyle={s.logList}
                        showsVerticalScrollIndicator={false}
                    />
                )}
            </View>

            {/* ─── Info Bar ─── */}
            <View style={s.infoBar}>
                <Ionicons name="information-circle-outline" size={16} color={C.muted} />
                <Text style={s.infoText}>Live session logs. Captured from console output.</Text>
            </View>

            {/* ─── Export Button ─── */}
            <View style={s.footer}>
                <TouchableOpacity style={s.exportBtn} onPress={handleExport} activeOpacity={0.85}>
                    <Ionicons name="share-outline" size={20} color="#FFF" />
                    <Text style={s.exportBtnText}>Export Logs</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

// ─── Styles ────────────────────────────────────────────────────
const s = StyleSheet.create({
    root: { flex: 1, backgroundColor: C.bg },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 16, height: 56,
        borderBottomWidth: 1, borderBottomColor: C.border,
    },
    backBtn: {
        width: 40, height: 40, borderRadius: 20,
        alignItems: 'center', justifyContent: 'center',
    },
    headerTitle: { fontSize: 18, fontWeight: '700', color: C.text },

    consoleFrame: {
        flex: 1, margin: 16,
        backgroundColor: '#0D1117',
        borderRadius: 16, overflow: 'hidden',
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    },
    consoleTitleBar: {
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: 14, paddingVertical: 10,
        backgroundColor: '#161B22',
        borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)',
    },
    trafficDots: { flexDirection: 'row', gap: 6, marginRight: 12 },
    dot: { width: 10, height: 10, borderRadius: 5 },
    consoleTitle: {
        flex: 1, fontSize: 12, fontWeight: '600',
        color: C.muted, fontFamily: 'Courier',
    },
    consoleCount: { fontSize: 11, color: C.muted },

    logList: { padding: 12, gap: 6 },
    logRow: {
        flexDirection: 'row', alignItems: 'center', gap: 8,
        paddingVertical: 4,
    },
    logTime: {
        fontSize: 11, color: '#6E7681',
        fontFamily: 'Courier', width: 60,
    },
    levelPill: {
        paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4,
        minWidth: 40, alignItems: 'center',
    },
    levelText: { fontSize: 9, fontWeight: '800', fontFamily: 'Courier' },
    logMsg: {
        flex: 1, fontSize: 12, color: '#C9D1D9',
        fontFamily: 'Courier',
    },

    emptyState: {
        flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32,
    },
    emptyTitle: {
        fontSize: 18, fontWeight: '700', color: C.text, marginTop: 12,
    },
    emptySub: { fontSize: 13, color: C.muted, marginTop: 4, textAlign: 'center' },

    infoBar: {
        flexDirection: 'row', alignItems: 'center', gap: 8,
        marginHorizontal: 16, marginBottom: 8,
    },
    infoText: { fontSize: 12, color: C.muted },

    footer: { paddingHorizontal: 16, paddingBottom: 24 },
    exportBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
        height: 52, borderRadius: 26,
        backgroundColor: C.primary,
        shadowColor: C.primary, shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5, shadowRadius: 20,
    },
    exportBtnText: { fontSize: 16, fontWeight: '700', color: '#FFF' },
});
