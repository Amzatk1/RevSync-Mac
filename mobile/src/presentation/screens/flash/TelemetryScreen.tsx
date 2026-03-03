import React, { useEffect, useState, useRef } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    Animated, Easing, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

const C = {
    bg: '#1a1a1a', surface: '#252525', border: 'rgba(255,255,255,0.05)',
    text: '#FFFFFF', muted: '#9ca3af', primary: '#ea103c',
    success: '#22C55E', error: '#EF4444', blue: '#3B82F6', dim: '#525252',
};

interface GaugeData {
    label: string;
    value: number;
    max: number;
    unit: string;
    color: string;
    icon: string;
}

export const TelemetryScreen = ({ navigation }: any) => {
    const [gauges, setGauges] = useState<GaugeData[]>([
        { label: 'RPM', value: 0, max: 14000, unit: 'rpm', color: C.primary, icon: 'speedometer' },
        { label: 'Coolant', value: 0, max: 120, unit: '°C', color: '#3B82F6', icon: 'thermometer' },
        { label: 'Battery', value: 0, max: 16, unit: 'V', color: C.success, icon: 'battery-half' },
        { label: 'Throttle', value: 0, max: 100, unit: '%', color: '#F59E0B', icon: 'radio-button-on' },
    ]);
    const [connected, setConnected] = useState(false);
    const pulseAnims = useRef(gauges.map(() => new Animated.Value(0))).current;

    useEffect(() => {
        // Simulate live data in __DEV__
        if (__DEV__) {
            setConnected(true);
            const interval = setInterval(() => {
                setGauges(prev => prev.map(g => ({
                    ...g,
                    value: g.label === 'RPM'
                        ? Math.round(3000 + Math.random() * 5000)
                        : g.label === 'Coolant'
                            ? Math.round(75 + Math.random() * 20)
                            : g.label === 'Battery'
                                ? parseFloat((12.5 + Math.random() * 1.5).toFixed(1))
                                : Math.round(15 + Math.random() * 50),
                })));
            }, 500);
            return () => clearInterval(interval);
        }
    }, []);

    useEffect(() => {
        pulseAnims.forEach((anim, i) => {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(anim, {
                        toValue: 1, duration: 1500 + i * 200,
                        easing: Easing.inOut(Easing.ease), useNativeDriver: true,
                    }),
                    Animated.timing(anim, {
                        toValue: 0, duration: 1500 + i * 200,
                        easing: Easing.inOut(Easing.ease), useNativeDriver: true,
                    }),
                ])
            ).start();
        });
    }, []);

    const GaugeCard = ({ data, index }: { data: GaugeData; index: number }) => {
        const pct = Math.min(data.value / data.max, 1);
        const barWidth = (width / 2 - 36) * 0.85;
        const glowOpacity = pulseAnims[index].interpolate({
            inputRange: [0, 1], outputRange: [0.15, 0.4],
        });

        return (
            <View style={s.gaugeCard}>
                <Animated.View style={[s.gaugeGlow, {
                    backgroundColor: data.color,
                    opacity: connected ? glowOpacity : 0.05,
                }]} />
                <View style={s.gaugeHeader}>
                    <View style={[s.gaugeIconCircle, { backgroundColor: `${data.color}15` }]}>
                        <Ionicons name={data.icon as any} size={18} color={data.color} />
                    </View>
                    <Text style={s.gaugeLabel}>{data.label}</Text>
                </View>
                <Text style={[s.gaugeValue, { color: data.color }]}>
                    {data.value}<Text style={s.gaugeUnit}>{data.unit}</Text>
                </Text>
                <View style={s.gaugeBarBg}>
                    <View style={[s.gaugeBarFill, {
                        width: barWidth * pct,
                        backgroundColor: data.color,
                    }]} />
                </View>
            </View>
        );
    };

    return (
        <SafeAreaView style={s.root} edges={['top']}>
            <View style={s.header}>
                <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={20} color={C.text} />
                </TouchableOpacity>
                <Text style={s.headerTitle}>Live Telemetry</Text>
                <View style={[s.liveBadge, { backgroundColor: connected ? 'rgba(34,197,94,0.15)' : 'rgba(255,255,255,0.06)' }]}>
                    <View style={[s.liveDot, { backgroundColor: connected ? C.success : C.dim }]} />
                    <Text style={[s.liveText, { color: connected ? C.success : C.dim }]}>
                        {connected ? 'LIVE' : 'OFFLINE'}
                    </Text>
                </View>
            </View>

            <ScrollView contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
                {/* Gauges Grid */}
                <View style={s.gaugeGrid}>
                    {gauges.map((g, i) => <GaugeCard key={g.label} data={g} index={i} />)}
                </View>

                {/* Status Bar */}
                <View style={s.statusCard}>
                    <View style={s.statusRow}>
                        <Text style={s.statusLabel}>ECU Mode</Text>
                        <Text style={s.statusValue}>Application</Text>
                    </View>
                    <View style={s.divider} />
                    <View style={s.statusRow}>
                        <Text style={s.statusLabel}>Refresh Rate</Text>
                        <Text style={s.statusValue}>500ms</Text>
                    </View>
                    <View style={s.divider} />
                    <View style={s.statusRow}>
                        <Text style={s.statusLabel}>BLE Signal</Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <Ionicons name="wifi" size={14} color={C.success} />
                            <Text style={[s.statusValue, { color: C.success }]}>Strong</Text>
                        </View>
                    </View>
                </View>

                {!connected && (
                    <TouchableOpacity
                        style={s.connectBtn}
                        onPress={() => navigation.navigate('DeviceConnect')}
                        activeOpacity={0.85}
                    >
                        <Ionicons name="bluetooth" size={20} color="#FFF" />
                        <Text style={s.connectBtnText}>Connect ECU</Text>
                    </TouchableOpacity>
                )}
            </ScrollView>
        </SafeAreaView>
    );
};

const GAUGE_SIZE = (width - 48 - 12) / 2;

const s = StyleSheet.create({
    root: { flex: 1, backgroundColor: C.bg },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 16, height: 56,
        borderBottomWidth: 1, borderBottomColor: C.border,
    },
    backBtn: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    headerTitle: { fontSize: 18, fontWeight: '700', color: C.text },
    liveBadge: {
        flexDirection: 'row', alignItems: 'center', gap: 6,
        paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20,
    },
    liveDot: { width: 6, height: 6, borderRadius: 3 },
    liveText: { fontSize: 11, fontWeight: '800', letterSpacing: 1 },
    scrollContent: { padding: 24, paddingBottom: 100 },

    // Gauge Grid
    gaugeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
    gaugeCard: {
        width: GAUGE_SIZE, backgroundColor: C.surface,
        borderRadius: 20, padding: 18, borderWidth: 1, borderColor: C.border,
        overflow: 'hidden',
    },
    gaugeGlow: {
        position: 'absolute', top: -20, right: -20,
        width: 80, height: 80, borderRadius: 40,
    },
    gaugeHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
    gaugeIconCircle: {
        width: 32, height: 32, borderRadius: 10,
        alignItems: 'center', justifyContent: 'center',
    },
    gaugeLabel: { fontSize: 13, fontWeight: '600', color: C.muted },
    gaugeValue: { fontSize: 32, fontWeight: '800', letterSpacing: -1, marginBottom: 8 },
    gaugeUnit: { fontSize: 14, fontWeight: '500' },
    gaugeBarBg: {
        height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.06)',
        overflow: 'hidden',
    },
    gaugeBarFill: { height: 4, borderRadius: 2 },

    // Status
    statusCard: {
        backgroundColor: C.surface, borderRadius: 16,
        padding: 16, marginTop: 20, borderWidth: 1, borderColor: C.border,
    },
    statusRow: {
        flexDirection: 'row', justifyContent: 'space-between',
        alignItems: 'center', paddingVertical: 10,
    },
    statusLabel: { fontSize: 14, color: C.muted },
    statusValue: { fontSize: 14, fontWeight: '600', color: C.text },
    divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.04)' },

    // Connect
    connectBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
        height: 52, borderRadius: 26, backgroundColor: C.primary, marginTop: 24,
        shadowColor: C.primary, shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.4, shadowRadius: 20,
    },
    connectBtnText: { fontSize: 16, fontWeight: '700', color: '#FFF' },
});
