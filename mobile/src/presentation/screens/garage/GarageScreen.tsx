import React, { useCallback, useState } from 'react';
import {
    View, Text, StyleSheet, FlatList, TouchableOpacity, Alert,
    RefreshControl, Image, Dimensions, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ServiceLocator } from '../../../di/ServiceLocator';
import { Bike } from '../../../domain/services/DomainTypes';
import { useAppStore } from '../../store/useAppStore';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const C = {
    bg: '#1a1a1a',
    card: '#252525',
    primary: '#ea103c',
    white: '#ffffff',
    textMuted: '#a3a3a3',
    textDim: '#737373',
    border: '#404040',
    green: '#22c55e',
};

export const GarageScreen = ({ navigation }: any) => {
    const { activeBike, loadActiveBike } = useAppStore();
    const [bikes, setBikes] = useState<Bike[]>([]);
    const [loading, setLoading] = useState(false);

    const loadBikes = useCallback(async () => {
        setLoading(true);
        try {
            const bikeService = ServiceLocator.getBikeService();
            const list = await bikeService.getBikes();
            setBikes(list);
            await loadActiveBike();
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, [loadActiveBike]);

    useFocusEffect(
        useCallback(() => {
            loadBikes();
        }, [loadBikes])
    );

    const handleSetActive = async (bikeId: string) => {
        try {
            await ServiceLocator.getBikeService().setActiveBike(bikeId);
            await loadActiveBike();
        } catch (error) {
            Alert.alert('Error', 'Could not set active bike.');
        }
    };

    const handleDelete = (bikeId: string) => {
        Alert.alert(
            'Delete Bike',
            'Are you sure you want to remove this bike from your garage?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        Alert.alert('Not Implemented', 'Delete feature coming soon');
                    }
                }
            ]
        );
    };

    const renderBikeItem = ({ item, index }: { item: Bike; index: number }) => {
        const isActive = activeBike?.id === item.id;

        return (
            <TouchableOpacity
                style={[s.bikeCard, isActive && s.bikeCardActive]}
                onPress={() => navigation.navigate('BikeDetails', { bikeId: item.id })}
                activeOpacity={0.85}
            >
                {/* Active card top bar */}
                {isActive && <View style={s.topBar} />}

                <View style={s.cardInner}>
                    {/* Header Row */}
                    <View style={s.cardHeaderRow}>
                        <View style={{ flex: 1 }}>
                            <View style={s.ecuRow}>
                                <Ionicons
                                    name={item.ecuId ? 'checkmark-circle' : 'help-circle'}
                                    size={16}
                                    color={item.ecuId ? C.primary : C.textDim}
                                />
                                <Text style={[s.ecuLabel, item.ecuId && { color: C.primary }]}>
                                    {item.ecuId ? 'ECU Identified' : 'ECU Not Linked'}
                                </Text>
                            </View>
                            <Text style={s.bikeName}>{item.year} {item.make} {item.model}</Text>
                        </View>
                        {isActive && (
                            <View style={s.activeBadge}>
                                <Text style={s.activeBadgeText}>Active</Text>
                            </View>
                        )}
                    </View>

                    {/* Image Placeholder */}
                    <View style={[s.imageWrap, !isActive && { opacity: 0.7 }]}>
                        <View style={s.imagePlaceholder}>
                            <LinearGradient
                                colors={['transparent', 'rgba(0,0,0,0.8)']}
                                style={StyleSheet.absoluteFillObject}
                            />
                            <Ionicons name="bicycle" size={64} color="rgba(255,255,255,0.12)" style={{ position: 'absolute', top: '30%' }} />
                            {/* VIN overlay */}
                            <View style={s.vinOverlay}>
                                <Text style={s.vinLabel}>VIN Number</Text>
                                <Text style={s.vinValue}>{item.vin || 'Not Provided'}</Text>
                            </View>
                        </View>
                    </View>

                    {/* Footer */}
                    {isActive ? (
                        <View style={s.activeFooter}>
                            <View>
                                <Text style={s.syncLabel}>Last Synced</Text>
                                <Text style={s.syncValue}>Recently</Text>
                            </View>
                            <TouchableOpacity
                                style={s.tuneNowBtn}
                                onPress={() => navigation.navigate('TuneMarketplace')}
                                activeOpacity={0.85}
                            >
                                <Ionicons name="options" size={18} color="#FFF" />
                                <Text style={s.tuneNowText}>Tune Now</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <TouchableOpacity
                            style={s.setActiveBtn}
                            onPress={() => handleSetActive(item.id)}
                            activeOpacity={0.8}
                        >
                            <Text style={s.setActiveBtnText}>Set Active</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={s.root} edges={['top']}>
            {/* Header */}
            <View style={s.header}>
                <Text style={s.title}>My Garage</Text>
                <TouchableOpacity
                    style={s.addBtn}
                    onPress={() => navigation.navigate('AddBike')}
                    activeOpacity={0.8}
                >
                    <Ionicons name="add" size={28} color="#FFF" />
                </TouchableOpacity>
            </View>

            {/* Bike List */}
            <FlatList
                data={bikes}
                keyExtractor={item => item.id}
                renderItem={renderBikeItem}
                contentContainerStyle={s.list}
                refreshControl={
                    <RefreshControl refreshing={loading} onRefresh={loadBikes} tintColor={C.primary} />
                }
                ListEmptyComponent={
                    !loading ? (
                        <View style={s.emptyState}>
                            <View style={s.emptyIcon}>
                                <Ionicons name="bicycle" size={48} color={C.textDim} />
                            </View>
                            <Text style={s.emptyTitle}>Garage Empty</Text>
                            <Text style={s.emptySub}>Add your first bike to verify tunes and flash your ECU.</Text>
                            <TouchableOpacity
                                style={s.emptyBtn}
                                onPress={() => navigation.navigate('AddBike')}
                                activeOpacity={0.85}
                            >
                                <Ionicons name="add" size={20} color="#FFF" />
                                <Text style={s.emptyBtnText}>Add Bike</Text>
                            </TouchableOpacity>
                        </View>
                    ) : null
                }
            />
        </SafeAreaView>
    );
};

const s = StyleSheet.create({
    root: {
        flex: 1,
        backgroundColor: C.bg,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingVertical: 16,
    },
    title: {
        fontSize: 30,
        fontWeight: '800',
        color: C.white,
        letterSpacing: -0.5,
    },
    addBtn: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: C.primary,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: C.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
        elevation: 8,
    },
    list: {
        paddingHorizontal: 24,
        paddingBottom: 100,
        gap: 24,
    },

    // Bike Card
    bikeCard: {
        backgroundColor: C.card,
        borderRadius: 32,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#333',
    },
    bikeCardActive: {
        borderColor: 'rgba(234,16,60,0.3)',
        shadowColor: C.primary,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 10,
    },
    topBar: {
        height: 3,
        backgroundColor: C.primary,
    },
    cardInner: {
        padding: 20,
        gap: 16,
    },
    cardHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    ecuRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 4,
    },
    ecuLabel: {
        fontSize: 11,
        fontWeight: '700',
        letterSpacing: 0.5,
        textTransform: 'uppercase',
        color: C.textDim,
    },
    bikeName: {
        fontSize: 20,
        fontWeight: '700',
        color: C.white,
        lineHeight: 26,
    },
    activeBadge: {
        paddingHorizontal: 16,
        paddingVertical: 6,
        borderRadius: 50,
        backgroundColor: 'rgba(234,16,60,0.1)',
        borderWidth: 1,
        borderColor: 'rgba(234,16,60,0.2)',
    },
    activeBadgeText: {
        fontSize: 11,
        fontWeight: '700',
        color: C.primary,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },

    // Image
    imageWrap: {
        borderRadius: 16,
        overflow: 'hidden',
    },
    imagePlaceholder: {
        width: '100%',
        aspectRatio: 16 / 9,
        backgroundColor: '#333',
        justifyContent: 'flex-end',
        alignItems: 'center',
    },
    vinOverlay: {
        position: 'absolute',
        bottom: 12,
        left: 16,
    },
    vinLabel: {
        fontSize: 10,
        color: 'rgba(255,255,255,0.5)',
        fontWeight: '500',
        marginBottom: 2,
    },
    vinValue: {
        fontSize: 13,
        fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace' }),
        color: C.white,
        letterSpacing: 1,
    },

    // Footer
    activeFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 4,
    },
    syncLabel: {
        fontSize: 11,
        color: C.textDim,
    },
    syncValue: {
        fontSize: 14,
        fontWeight: '600',
        color: C.white,
    },
    tuneNowBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 50,
        backgroundColor: C.primary,
        shadowColor: C.primary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    tuneNowText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#FFF',
    },
    setActiveBtn: {
        width: '100%',
        paddingVertical: 14,
        borderRadius: 50,
        borderWidth: 1,
        borderColor: '#525252',
        alignItems: 'center',
        justifyContent: 'center',
    },
    setActiveBtnText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#d4d4d4',
    },

    // Empty State
    emptyState: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 100,
        paddingHorizontal: 32,
    },
    emptyIcon: {
        width: 96,
        height: 96,
        borderRadius: 48,
        backgroundColor: C.card,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 24,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: C.white,
        marginBottom: 8,
    },
    emptySub: {
        fontSize: 14,
        color: C.textMuted,
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: 24,
    },
    emptyBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingHorizontal: 24,
        paddingVertical: 14,
        borderRadius: 50,
        backgroundColor: C.primary,
    },
    emptyBtnText: {
        fontSize: 15,
        fontWeight: '700',
        color: '#FFF',
    },
});
