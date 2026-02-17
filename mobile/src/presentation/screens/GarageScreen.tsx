import React, { useEffect, useState, useCallback } from 'react';
import {
    View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAppStore } from '../store/useAppStore';
import { ServiceLocator } from '../../di/ServiceLocator';
import { Bike } from '../../domain/services/DomainTypes';
import { useFocusEffect } from '@react-navigation/native';

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

export const GarageScreen = ({ navigation }: any) => {
    const { activeBike, loadActiveBike } = useAppStore();
    const [bikes, setBikes] = useState<Bike[]>([]);
    const [loading, setLoading] = useState(false);

    const loadBikes = useCallback(async () => {
        setLoading(true);
        try {
            const bikeService = ServiceLocator.getBikeService();
            const allBikes = await bikeService.getBikes();
            setBikes(allBikes);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            loadBikes();
        }, [loadBikes])
    );

    const handleSelectBike = async (bike: Bike) => {
        const bikeService = ServiceLocator.getBikeService();
        await bikeService.setActiveBike(bike.id);
        await loadActiveBike();
        Alert.alert('Bike Selected', `${bike.year} ${bike.make} ${bike.model} is now active.`);
    };

    const renderBikeItem = ({ item }: { item: Bike }) => {
        const isActive = activeBike?.id === item.id;
        return (
            <TouchableOpacity
                style={[s.bikeCard, isActive && s.activeCard]}
                activeOpacity={0.7}
                onPress={() => navigation.navigate('BikeDetails', { bikeId: item.id })}
            >
                <View style={s.cardRow}>
                    <View style={[s.iconCircle, { backgroundColor: isActive ? 'rgba(234,16,60,0.1)' : 'rgba(255,255,255,0.06)' }]}>
                        <Ionicons name="bicycle" size={24} color={isActive ? C.primary : C.muted} />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={s.bikeTitle}>{item.year} {item.make} {item.model}</Text>
                        <Text style={s.bikeVin}>VIN: {item.vin || 'N/A'}</Text>
                    </View>
                    {isActive && (
                        <View style={s.activePill}>
                            <View style={s.activeDot} />
                            <Text style={s.activeText}>Active</Text>
                        </View>
                    )}
                </View>

                <View style={s.cardDivider} />

                <View style={s.cardActions}>
                    <TouchableOpacity
                        style={s.actionBtn}
                        onPress={() => handleSelectBike(item)}
                        disabled={isActive}
                    >
                        <Text style={[s.actionText, isActive && { color: C.muted }]}>
                            {isActive ? 'Current Ride' : 'Select Ride'}
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={s.actionBtn}
                        onPress={() => navigation.navigate('BikeDetails', { bikeId: item.id })}
                    >
                        <Text style={s.actionText}>Details</Text>
                        <Ionicons name="chevron-forward" size={16} color={C.primary} />
                    </TouchableOpacity>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={s.root} edges={['top']}>
            {/* ─── Header ─── */}
            <View style={s.header}>
                <Text style={s.headerTitle}>My Garage</Text>
                <TouchableOpacity style={s.addBtn} onPress={() => navigation.navigate('AddBike')} activeOpacity={0.7}>
                    <Ionicons name="add" size={24} color="#FFF" />
                </TouchableOpacity>
            </View>

            <FlatList
                data={bikes}
                renderItem={renderBikeItem}
                keyExtractor={item => item.id}
                contentContainerStyle={s.listContent}
                refreshControl={<RefreshControl refreshing={loading} onRefresh={loadBikes} tintColor={C.primary} />}
                ListEmptyComponent={
                    !loading ? (
                        <View style={s.emptyState}>
                            <View style={s.emptyCircle}>
                                <Ionicons name="construct-outline" size={48} color={C.muted} />
                            </View>
                            <Text style={s.emptyTitle}>Garage Empty</Text>
                            <Text style={s.emptySub}>Add your first bike to start tuning.</Text>
                            <TouchableOpacity style={s.emptyBtn} onPress={() => navigation.navigate('AddBike')} activeOpacity={0.85}>
                                <Ionicons name="add-circle-outline" size={20} color="#FFF" />
                                <Text style={s.emptyBtnText}>Add Bike</Text>
                            </TouchableOpacity>
                        </View>
                    ) : null
                }
            />
        </SafeAreaView>
    );
};

// ─── Styles ────────────────────────────────────────────────────
const s = StyleSheet.create({
    root: { flex: 1, backgroundColor: C.bg },
    header: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingHorizontal: 24, paddingVertical: 16,
        borderBottomWidth: 1, borderBottomColor: C.border,
    },
    headerTitle: { fontSize: 28, fontWeight: '800', color: C.text, letterSpacing: -0.5 },
    addBtn: {
        width: 44, height: 44, borderRadius: 22,
        backgroundColor: C.primary,
        justifyContent: 'center', alignItems: 'center',
        shadowColor: C.primary, shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.4, shadowRadius: 12,
    },
    listContent: { padding: 16, paddingBottom: 100, gap: 12 },

    bikeCard: {
        backgroundColor: C.surface,
        borderRadius: 20, overflow: 'hidden',
    },
    activeCard: {
        borderWidth: 1.5,
        borderColor: 'rgba(234,16,60,0.4)',
    },
    cardRow: {
        flexDirection: 'row', alignItems: 'center', padding: 16, gap: 14,
    },
    iconCircle: {
        width: 48, height: 48, borderRadius: 14,
        justifyContent: 'center', alignItems: 'center',
    },
    bikeTitle: { fontSize: 18, fontWeight: '700', color: C.text },
    bikeVin: { fontSize: 12, color: C.muted, marginTop: 2 },
    activePill: {
        flexDirection: 'row', alignItems: 'center', gap: 6,
        paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20,
        backgroundColor: 'rgba(234,16,60,0.1)',
        borderWidth: 1, borderColor: 'rgba(234,16,60,0.2)',
    },
    activeDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: C.primary },
    activeText: { fontSize: 11, fontWeight: '700', color: C.primary },
    cardDivider: { height: 1, backgroundColor: C.divider },
    cardActions: {
        flexDirection: 'row', paddingVertical: 10, paddingHorizontal: 12,
        backgroundColor: 'rgba(0,0,0,0.15)',
    },
    actionBtn: {
        flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
        padding: 8, gap: 4,
    },
    actionText: { color: C.primary, fontWeight: '600', fontSize: 14 },

    // Empty
    emptyState: {
        alignItems: 'center', justifyContent: 'center', padding: 48, paddingTop: 80,
    },
    emptyCircle: {
        width: 88, height: 88, borderRadius: 44,
        backgroundColor: 'rgba(255,255,255,0.04)',
        justifyContent: 'center', alignItems: 'center', marginBottom: 20,
    },
    emptyTitle: { fontSize: 20, fontWeight: '800', color: C.text },
    emptySub: { fontSize: 14, color: C.muted, marginTop: 8, textAlign: 'center' },
    emptyBtn: {
        flexDirection: 'row', alignItems: 'center', gap: 8,
        marginTop: 24, paddingHorizontal: 24, paddingVertical: 14,
        borderRadius: 26, backgroundColor: C.primary,
        shadowColor: C.primary, shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5, shadowRadius: 16,
    },
    emptyBtnText: { fontSize: 15, fontWeight: '700', color: '#FFF' },
});
