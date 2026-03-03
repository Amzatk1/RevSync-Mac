import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    Alert,
    RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useAppStore } from '../store/useAppStore';
import { ServiceLocator } from '../../di/ServiceLocator';
import { Bike } from '../../domain/services/DomainTypes';
import { SkeletonBikeCard } from '../components/SkeletonCards';
import { AppScreen, TopBar, GlassCard, SectionLabel } from '../components/AppUI';
import { Theme } from '../theme';

export const GarageScreen = ({ navigation }: any) => {
    const insets = useSafeAreaInsets();
    const { activeBike, loadActiveBike } = useAppStore();
    const [bikes, setBikes] = useState<Bike[]>([]);
    const [loading, setLoading] = useState(false);

    const loadBikes = useCallback(async () => {
        setLoading(true);
        try {
            const bikeService = ServiceLocator.getBikeService();
            setBikes(await bikeService.getBikes());
        } catch (e) {
            console.warn('GarageScreen: load failed', e);
        } finally {
            setLoading(false);
        }
    }, []);

    useFocusEffect(useCallback(() => { loadBikes(); }, [loadBikes]));

    const handleSelectBike = async (bike: Bike) => {
        await ServiceLocator.getBikeService().setActiveBike(bike.id);
        await loadActiveBike();
        Alert.alert('Active bike updated', `${bike.year} ${bike.make} ${bike.model} is now selected.`);
    };

    const headerSubtitle = activeBike
        ? `Active: ${activeBike.make} ${activeBike.model}`
        : 'No active bike selected';

    return (
        <AppScreen>
            <TopBar
                title="Garage"
                subtitle={headerSubtitle}
                right={
                    <TouchableOpacity
                        style={styles.addAction}
                        onPress={() => navigation.navigate('AddBike')}
                        activeOpacity={0.8}
                    >
                        <Ionicons name="add" size={18} color={Theme.Colors.text} />
                    </TouchableOpacity>
                }
            />

            <FlatList
                data={loading ? [] : bikes}
                keyExtractor={item => item.id}
                contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: insets.bottom + 110 }}
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={loading} onRefresh={loadBikes} tintColor={Theme.Colors.primary} />}
                ListHeaderComponent={
                    <>
                        <GlassCard style={styles.overviewCard}>
                            <View style={styles.overviewItem}>
                                <Text style={styles.overviewValue}>{bikes.length}</Text>
                                <Text style={styles.overviewLabel}>Bikes</Text>
                            </View>
                            <View style={styles.overviewDivider} />
                            <View style={styles.overviewItem}>
                                <Text style={styles.overviewValue}>{activeBike ? '1' : '0'}</Text>
                                <Text style={styles.overviewLabel}>Active</Text>
                            </View>
                            <View style={styles.overviewDivider} />
                            <View style={styles.overviewItem}>
                                <Text style={styles.overviewValue}>{bikes.filter(b => !!b.vin).length}</Text>
                                <Text style={styles.overviewLabel}>VIN Tagged</Text>
                            </View>
                        </GlassCard>
                        <SectionLabel label="Your Bikes" />
                        {loading && (
                            <>
                                <SkeletonBikeCard />
                                <SkeletonBikeCard />
                            </>
                        )}
                    </>
                }
                renderItem={({ item }) => {
                    const isActive = activeBike?.id === item.id;
                    return (
                        <GlassCard style={[styles.bikeCard, isActive && styles.bikeCardActive]}>
                            <View style={styles.cardTop}>
                                <View style={styles.iconWrap}>
                                    <Ionicons name="bicycle" size={20} color={isActive ? Theme.Colors.primary : Theme.Colors.textSecondary} />
                                </View>
                                <View style={{ flex: 1, minWidth: 0 }}>
                                    <Text style={styles.bikeTitle} numberOfLines={1}>
                                        {item.year} {item.make} {item.model}
                                    </Text>
                                    <Text style={styles.bikeMeta} numberOfLines={1}>
                                        VIN: {item.vin || 'Not linked'}
                                    </Text>
                                </View>
                                {isActive && (
                                    <View style={styles.activeBadge}>
                                        <View style={styles.activeDot} />
                                        <Text style={styles.activeBadgeText}>ACTIVE</Text>
                                    </View>
                                )}
                            </View>
                            <View style={styles.actionsRow}>
                                <TouchableOpacity
                                    style={[styles.actionBtn, isActive && styles.actionBtnMuted]}
                                    disabled={isActive}
                                    onPress={() => handleSelectBike(item)}
                                >
                                    <Text style={[styles.actionText, isActive && styles.actionTextMuted]}>
                                        {isActive ? 'Current Bike' : 'Set Active'}
                                    </Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={styles.actionBtn}
                                    onPress={() => navigation.navigate('BikeDetails', { bikeId: item.id })}
                                >
                                    <Text style={styles.actionText}>Details</Text>
                                    <Ionicons name="chevron-forward" size={15} color={Theme.Colors.primary} />
                                </TouchableOpacity>
                            </View>
                        </GlassCard>
                    );
                }}
                ListEmptyComponent={
                    !loading ? (
                        <GlassCard style={styles.emptyCard}>
                            <Ionicons name="construct-outline" size={34} color={Theme.Colors.textSecondary} />
                            <Text style={styles.emptyTitle}>No bikes yet</Text>
                            <Text style={styles.emptyBody}>Add your bike to unlock fitment-aware tune recommendations.</Text>
                            <TouchableOpacity style={styles.emptyAction} onPress={() => navigation.navigate('AddBike')}>
                                <Ionicons name="add-circle-outline" size={16} color={Theme.Colors.text} />
                                <Text style={styles.emptyActionText}>Add Bike</Text>
                            </TouchableOpacity>
                        </GlassCard>
                    ) : null
                }
            />
        </AppScreen>
    );
};

const styles = StyleSheet.create({
    addAction: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(234,16,60,0.2)',
        borderWidth: 1,
        borderColor: 'rgba(234,16,60,0.34)',
    },
    overviewCard: {
        marginTop: 4,
        marginBottom: 2,
        flexDirection: 'row',
        alignItems: 'center',
    },
    overviewItem: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: 4,
    },
    overviewValue: {
        fontSize: 20,
        fontWeight: '800',
        color: Theme.Colors.text,
    },
    overviewLabel: {
        marginTop: 2,
        fontSize: 10,
        letterSpacing: 0.8,
        fontWeight: '700',
        textTransform: 'uppercase',
        color: Theme.Colors.textSecondary,
    },
    overviewDivider: {
        width: 1,
        height: 32,
        backgroundColor: Theme.Colors.divider,
    },
    bikeCard: {
        marginBottom: 10,
        padding: 12,
    },
    bikeCardActive: {
        borderColor: 'rgba(234,16,60,0.38)',
        backgroundColor: 'rgba(26,16,22,0.82)',
    },
    cardTop: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    iconWrap: {
        width: 44,
        height: 44,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderWidth: 1,
        borderColor: Theme.Colors.border,
    },
    bikeTitle: {
        fontSize: 16,
        fontWeight: '800',
        color: Theme.Colors.text,
    },
    bikeMeta: {
        marginTop: 2,
        fontSize: 12,
        color: Theme.Colors.textSecondary,
    },
    activeBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        borderRadius: 999,
        paddingHorizontal: 10,
        paddingVertical: 5,
        backgroundColor: 'rgba(234,16,60,0.16)',
        borderWidth: 1,
        borderColor: 'rgba(234,16,60,0.34)',
    },
    activeDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: Theme.Colors.primary,
    },
    activeBadgeText: {
        fontSize: 10,
        fontWeight: '800',
        letterSpacing: 0.4,
        color: '#FB7185',
    },
    actionsRow: {
        marginTop: 11,
        flexDirection: 'row',
        gap: 8,
    },
    actionBtn: {
        flex: 1,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: Theme.Colors.border,
        backgroundColor: 'rgba(255,255,255,0.04)',
        paddingVertical: 9,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
    },
    actionBtnMuted: {
        opacity: 0.5,
    },
    actionText: {
        fontSize: 12,
        fontWeight: '700',
        color: Theme.Colors.primary,
    },
    actionTextMuted: {
        color: Theme.Colors.textSecondary,
    },
    emptyCard: {
        marginTop: 14,
        alignItems: 'center',
        paddingVertical: 24,
        gap: 8,
    },
    emptyTitle: {
        marginTop: 2,
        fontSize: 18,
        fontWeight: '800',
        color: Theme.Colors.text,
    },
    emptyBody: {
        maxWidth: 270,
        textAlign: 'center',
        fontSize: 13,
        lineHeight: 19,
        color: Theme.Colors.textSecondary,
    },
    emptyAction: {
        marginTop: 8,
        borderRadius: 999,
        paddingHorizontal: 14,
        paddingVertical: 9,
        borderWidth: 1,
        borderColor: 'rgba(234,16,60,0.3)',
        backgroundColor: 'rgba(234,16,60,0.16)',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 7,
    },
    emptyActionText: {
        color: Theme.Colors.text,
        fontSize: 12,
        fontWeight: '800',
        textTransform: 'uppercase',
        letterSpacing: 0.3,
    },
});
