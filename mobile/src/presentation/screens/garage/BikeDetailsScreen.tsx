import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { ServiceLocator } from '../../../di/ServiceLocator';
import { useAppStore } from '../../store/useAppStore';

// ─── Color Tokens ──────────────────────────────────────────────
const C = {
    bg: '#1a1a1a',
    surface: '#252525',
    border: 'rgba(255,255,255,0.05)',
    divider: 'rgba(255,255,255,0.04)',
    text: '#FFFFFF',
    muted: '#9ca3af',
    primary: '#ea103c',
    success: '#22C55E',
};

export const BikeDetailsScreen = ({ navigation, route }: any) => {
    const { bikeId } = route.params;
    const [bike, setBike] = useState<any>(null);

    React.useEffect(() => {
        const load = async () => {
            const bikeService = ServiceLocator.getBikeService();
            const all = await bikeService.getBikes();
            const found = all.find(b => b.id === bikeId);
            setBike(found);

            if (found) {
                ServiceLocator.getAnalyticsService().logEvent('bike_details_viewed', {
                    bikeId: found.id,
                    make: found.make,
                    model: found.model,
                });
            }
        };
        load();
    }, [bikeId]);

    if (!bike) {
        return (
            <SafeAreaView style={s.root} edges={['top']}>
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <Text style={{ color: C.muted, fontSize: 16 }}>Loading...</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={s.root} edges={['top']}>
            {/* ─── Header ─── */}
            <View style={s.header}>
                <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color={C.text} />
                </TouchableOpacity>
                <Text style={s.headerTitle}>Bike Details</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
                {/* ─── Hero ─── */}
                <View style={s.heroCard}>
                    <View style={s.heroIcon}>
                        <Ionicons name="bicycle" size={40} color={C.primary} />
                    </View>
                    <Text style={s.heroTitle}>{bike.year} {bike.make} {bike.model}</Text>
                    <Text style={s.heroSub}>{bike.name || 'Vehicle Details'}</Text>
                </View>

                {/* ─── Details Card ─── */}
                <Text style={s.sectionLabel}>SPECIFICATIONS</Text>
                <View style={s.card}>
                    <DetailRow icon="barcode-outline" iconColor="#3B82F6" label="VIN" value={bike.vin || 'Not Set'} />
                    <View style={s.rowDivider} />
                    <DetailRow icon="hardware-chip-outline" iconColor="#A855F7" label="ECU ID" value={bike.ecuId || 'Not Linked'} />
                    <View style={s.rowDivider} />
                    <DetailRow icon="calendar-outline" iconColor="#F59E0B" label="Year" value={String(bike.year)} />
                    <View style={s.rowDivider} />
                    <DetailRow icon="flash-outline" iconColor={C.primary} label="Last Flash" value="Never" />
                </View>

                {/* ─── Actions ─── */}
                <Text style={s.sectionLabel}>ACTIONS</Text>
                <View style={s.actionsContainer}>
                    <TouchableOpacity
                        style={s.primaryBtn}
                        onPress={() => {
                            ServiceLocator.getAnalyticsService().logEvent('ecu_identify_initiated', { bikeId: bike.id });
                            navigation.navigate('Flash', {
                                screen: 'ECUIdentify',
                                params: { bikeId: bike.id },
                            });
                        }}
                        activeOpacity={0.85}
                    >
                        <Ionicons name="scan-outline" size={20} color="#FFF" />
                        <Text style={s.primaryBtnText}>Identify ECU</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={s.secondaryBtn}
                        onPress={() => {
                            navigation.navigate('Flash', {
                                screen: 'Backup',
                                params: { bikeId: bike.id },
                            });
                        }}
                        activeOpacity={0.7}
                    >
                        <Ionicons name="cloud-download-outline" size={20} color={C.text} />
                        <Text style={s.secondaryBtnText}>View Backups</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

// ─── Sub-components ────────────────────────────────────────────
const DetailRow = ({ icon, iconColor, label, value }: { icon: string; iconColor: string; label: string; value: string }) => (
    <View style={s.detailRow}>
        <View style={[s.detailIcon, { backgroundColor: `${iconColor}15` }]}>
            <Ionicons name={icon as any} size={18} color={iconColor} />
        </View>
        <Text style={s.detailLabel}>{label}</Text>
        <Text style={s.detailValue}>{value}</Text>
    </View>
);

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
    scrollContent: { padding: 16, paddingBottom: 48 },

    // Hero
    heroCard: {
        backgroundColor: C.surface, borderRadius: 20,
        padding: 24, alignItems: 'center', marginBottom: 8,
    },
    heroIcon: {
        width: 72, height: 72, borderRadius: 20,
        backgroundColor: 'rgba(234,16,60,0.08)',
        justifyContent: 'center', alignItems: 'center', marginBottom: 16,
    },
    heroTitle: { fontSize: 24, fontWeight: '800', color: C.text, letterSpacing: -0.5 },
    heroSub: { fontSize: 14, color: C.muted, marginTop: 4 },

    sectionLabel: {
        fontSize: 11, fontWeight: '700', letterSpacing: 1.2,
        textTransform: 'uppercase', color: C.muted,
        marginLeft: 16, marginBottom: 8, marginTop: 24,
    },

    // Details card
    card: { backgroundColor: C.surface, borderRadius: 20, overflow: 'hidden' },
    detailRow: {
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: 16, minHeight: 56,
    },
    detailIcon: {
        width: 32, height: 32, borderRadius: 10,
        alignItems: 'center', justifyContent: 'center',
        marginRight: 14,
    },
    detailLabel: { flex: 1, fontSize: 15, fontWeight: '500', color: C.muted },
    detailValue: { fontSize: 15, fontWeight: '600', color: C.text },
    rowDivider: { height: 1, backgroundColor: C.divider, marginLeft: 16 },

    // Actions
    actionsContainer: { gap: 12 },
    primaryBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
        height: 52, borderRadius: 26, backgroundColor: C.primary,
        shadowColor: C.primary, shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5, shadowRadius: 20,
    },
    primaryBtnText: { fontSize: 16, fontWeight: '700', color: '#FFF' },
    secondaryBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
        height: 48, borderRadius: 24, borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    secondaryBtnText: { fontSize: 15, fontWeight: '600', color: C.text },
});
