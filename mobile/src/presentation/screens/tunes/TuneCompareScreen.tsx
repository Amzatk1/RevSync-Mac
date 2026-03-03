import React, { useEffect, useState } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    ActivityIndicator, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { ServiceLocator } from '../../../di/ServiceLocator';

const { width } = Dimensions.get('window');

const C = {
    bg: '#1a1a1a', surface: '#252525', border: 'rgba(255,255,255,0.05)',
    text: '#FFFFFF', muted: '#9ca3af', primary: '#ea103c',
    success: '#22C55E', error: '#EF4444', dim: '#525252',
};

interface SpecRow {
    label: string;
    unit: string;
    stock: number;
    tuned: number;
}

export const TuneCompareScreen = ({ navigation, route }: any) => {
    const { tuneId } = route.params || {};
    const [loading, setLoading] = useState(true);
    const [tuneName, setTuneName] = useState('');
    const [specs, setSpecs] = useState<SpecRow[]>([]);

    useEffect(() => {
        loadComparison();
    }, []);

    const loadComparison = async () => {
        try {
            const tuneService = ServiceLocator.getTuneService();
            const tune = await tuneService.getTuneDetails(tuneId);
            const t: any = tune || {};
            setTuneName(t?.title || 'Tune');

            // Build comparison from tune data (fields may come from backend extras)
            setSpecs([
                { label: 'Peak HP', unit: 'hp', stock: t?.stockHp || 120, tuned: t?.tunedHp || t?.hp || 145 },
                { label: 'Peak Torque', unit: 'Nm', stock: t?.stockTorque || 95, tuned: t?.tunedTorque || t?.torque || 115 },
                { label: 'Rev Limit', unit: 'rpm', stock: t?.stockRevLimit || 11000, tuned: t?.revLimit || 12500 },
                { label: 'Top Speed', unit: 'km/h', stock: t?.stockTopSpeed || 220, tuned: t?.topSpeed || 245 },
                { label: '0-100 km/h', unit: 's', stock: t?.stock0to100 || 3.8, tuned: t?.zeroTo100 || 3.2 },
                { label: 'Fuel Map', unit: '%', stock: 100, tuned: t?.fuelMapPct || 108 },
            ]);
        } catch {
            // Use placeholder data
            setSpecs([
                { label: 'Peak HP', unit: 'hp', stock: 120, tuned: 145 },
                { label: 'Peak Torque', unit: 'Nm', stock: 95, tuned: 115 },
                { label: 'Rev Limit', unit: 'rpm', stock: 11000, tuned: 12500 },
                { label: 'Top Speed', unit: 'km/h', stock: 220, tuned: 245 },
                { label: '0-100 km/h', unit: 's', stock: 3.8, tuned: 3.2 },
                { label: 'Fuel Map', unit: '%', stock: 100, tuned: 108 },
            ]);
        } finally {
            setLoading(false);
        }
    };

    const getDelta = (stock: number, tuned: number, label: string) => {
        const diff = tuned - stock;
        // For time-based metrics, lower is better
        const isTimeBased = label.includes('0-100') || label.includes('time');
        const isPositive = isTimeBased ? diff < 0 : diff > 0;
        const pct = ((Math.abs(diff) / stock) * 100).toFixed(1);
        return { diff, isPositive, pct, display: `${isPositive ? '+' : ''}${diff.toFixed(diff % 1 !== 0 ? 1 : 0)}` };
    };

    const renderBar = (stock: number, tuned: number, max: number, color: string) => {
        const barW = width - 80;
        return (
            <View style={{ gap: 4, marginTop: 8 }}>
                <View style={s.barBg}>
                    <View style={[s.barFill, { width: (stock / max) * barW, backgroundColor: C.dim }]} />
                </View>
                <View style={s.barBg}>
                    <View style={[s.barFill, { width: (tuned / max) * barW, backgroundColor: color }]} />
                </View>
            </View>
        );
    };

    if (loading) {
        return (
            <View style={[s.root, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color={C.primary} />
            </View>
        );
    }

    return (
        <SafeAreaView style={s.root} edges={['top']}>
            <View style={s.header}>
                <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={20} color={C.text} />
                </TouchableOpacity>
                <Text style={s.headerTitle}>Compare vs Stock</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
                {/* Legend */}
                <View style={s.legend}>
                    <View style={s.legendItem}>
                        <View style={[s.legendDot, { backgroundColor: C.dim }]} />
                        <Text style={s.legendText}>Stock</Text>
                    </View>
                    <View style={s.legendItem}>
                        <View style={[s.legendDot, { backgroundColor: C.primary }]} />
                        <Text style={s.legendText}>{tuneName}</Text>
                    </View>
                </View>

                {/* Specs */}
                {specs.map((spec, i) => {
                    const delta = getDelta(spec.stock, spec.tuned, spec.label);
                    const maxVal = Math.max(spec.stock, spec.tuned) * 1.15;
                    return (
                        <View key={spec.label} style={[s.specCard, i === specs.length - 1 && { marginBottom: 0 }]}>
                            <View style={s.specHeader}>
                                <Text style={s.specLabel}>{spec.label}</Text>
                                <View style={[s.deltaPill, {
                                    backgroundColor: delta.isPositive ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)',
                                }]}>
                                    <Ionicons
                                        name={delta.isPositive ? 'arrow-up' : 'arrow-down'}
                                        size={12}
                                        color={delta.isPositive ? C.success : C.error}
                                    />
                                    <Text style={[s.deltaText, {
                                        color: delta.isPositive ? C.success : C.error,
                                    }]}>{delta.display} {spec.unit} ({delta.pct}%)</Text>
                                </View>
                            </View>

                            <View style={s.valuesRow}>
                                <View style={s.valueBlock}>
                                    <Text style={s.valueLabel}>STOCK</Text>
                                    <Text style={s.valueNum}>{spec.stock}<Text style={s.valueUnit}> {spec.unit}</Text></Text>
                                </View>
                                <Ionicons name="arrow-forward" size={16} color={C.dim} />
                                <View style={s.valueBlock}>
                                    <Text style={[s.valueLabel, { color: C.primary }]}>TUNED</Text>
                                    <Text style={[s.valueNum, { color: C.primary }]}>
                                        {spec.tuned}<Text style={s.valueUnit}> {spec.unit}</Text>
                                    </Text>
                                </View>
                            </View>

                            {renderBar(spec.stock, spec.tuned, maxVal, C.primary)}
                        </View>
                    );
                })}
            </ScrollView>
        </SafeAreaView>
    );
};

const s = StyleSheet.create({
    root: { flex: 1, backgroundColor: C.bg },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 16, height: 56,
        borderBottomWidth: 1, borderBottomColor: C.border,
    },
    backBtn: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    headerTitle: { fontSize: 18, fontWeight: '700', color: C.text },
    scrollContent: { padding: 24, paddingBottom: 100 },

    // Legend
    legend: {
        flexDirection: 'row', gap: 20, marginBottom: 20,
        justifyContent: 'center',
    },
    legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    legendDot: { width: 10, height: 10, borderRadius: 5 },
    legendText: { fontSize: 13, fontWeight: '600', color: C.muted },

    // Spec Card
    specCard: {
        backgroundColor: C.surface, borderRadius: 16,
        padding: 16, marginBottom: 12,
        borderWidth: 1, borderColor: C.border,
    },
    specHeader: {
        flexDirection: 'row', justifyContent: 'space-between',
        alignItems: 'center', marginBottom: 12,
    },
    specLabel: { fontSize: 16, fontWeight: '700', color: C.text },
    deltaPill: {
        flexDirection: 'row', alignItems: 'center', gap: 4,
        paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12,
    },
    deltaText: { fontSize: 12, fontWeight: '700' },

    // Values
    valuesRow: {
        flexDirection: 'row', alignItems: 'center',
        justifyContent: 'space-between', marginBottom: 4,
    },
    valueBlock: { alignItems: 'center', flex: 1 },
    valueLabel: {
        fontSize: 10, fontWeight: '700', color: C.dim,
        letterSpacing: 1, marginBottom: 2,
    },
    valueNum: { fontSize: 22, fontWeight: '800', color: C.text },
    valueUnit: { fontSize: 12, fontWeight: '500' },

    // Bar chart
    barBg: {
        height: 6, borderRadius: 3,
        backgroundColor: 'rgba(255,255,255,0.04)',
        overflow: 'hidden',
    },
    barFill: { height: 6, borderRadius: 3 },
});
