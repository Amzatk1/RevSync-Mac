import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, Alert, RefreshControl } from 'react-native';
import { Theme } from '../theme';
import { Screen, Card, PrimaryButton, EmptyState } from '../components/SharedComponents';
import { Ionicons } from '@expo/vector-icons';
import { useAppStore } from '../store/useAppStore';
import { ServiceLocator } from '../../di/ServiceLocator';
import { Bike } from '../../domain/services/DomainTypes';
import { useFocusEffect } from '@react-navigation/native';

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
            <Card
                onPress={() => navigation.navigate('BikeDetails', { bikeId: item.id })}
                style={[styles.bikeCard, isActive && styles.activeCard]}
            >
                <View style={styles.cardHeader}>
                    <View style={styles.iconBox}>
                        <Ionicons name="bicycle" size={24} color={isActive ? Theme.Colors.primary : Theme.Colors.text} />
                    </View>
                    <View style={styles.bikeInfo}>
                        <Text style={styles.bikeTitle}>{item.year} {item.make} {item.model}</Text>
                        <Text style={styles.bikeVin}>VIN: {item.vin || 'N/A'}</Text>
                    </View>
                    {isActive && (
                        <View style={styles.activeBadge}>
                            <Text style={styles.activeText}>ACTIVE</Text>
                        </View>
                    )}
                </View>

                <View style={styles.divider} />

                <View style={styles.cardActions}>
                    <TouchableOpacity
                        style={styles.actionBtn}
                        onPress={() => handleSelectBike(item)}
                        disabled={isActive}
                    >
                        <Text style={[styles.actionText, isActive && { color: Theme.Colors.textSecondary }]}>
                            {isActive ? 'Current Ride' : 'Select Ride'}
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.actionBtn}
                        onPress={() => navigation.navigate('BikeDetails', { bikeId: item.id })}
                    >
                        <Text style={styles.actionText}>Details</Text>
                        <Ionicons name="chevron-forward" size={16} color={Theme.Colors.primary} />
                    </TouchableOpacity>
                </View>
            </Card>
        );
    };

    return (
        <Screen>
            <View style={styles.header}>
                <Text style={styles.title}>My Garage</Text>
                <TouchableOpacity onPress={() => navigation.navigate('AddBike')} style={styles.addBtn}>
                    <Ionicons name="add" size={24} color="#FFF" />
                </TouchableOpacity>
            </View>

            <FlatList
                data={bikes}
                renderItem={renderBikeItem}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.listContent}
                refreshControl={<RefreshControl refreshing={loading} onRefresh={loadBikes} tintColor={Theme.Colors.primary} />}
                ListEmptyComponent={
                    !loading ? (
                        <EmptyState
                            icon="construct-outline"
                            title="Garage Empty"
                            message="Add your first bike to start tuning."
                            action={{ label: "Add Bike", onPress: () => navigation.navigate('AddBike') }}
                        />
                    ) : null
                }
            />
        </Screen>
    );
};

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: Theme.Spacing.md,
    },
    title: {
        ...Theme.Typography.h2,
    },
    addBtn: {
        backgroundColor: Theme.Colors.primary,
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        ...Theme.Shadows.md,
    },
    listContent: {
        padding: Theme.Spacing.md,
    },
    bikeCard: {
        padding: 0,
        overflow: 'hidden',
    },
    activeCard: {
        borderColor: Theme.Colors.primary,
        borderWidth: 2,
    },
    cardHeader: {
        flexDirection: 'row',
        padding: 16,
        alignItems: 'center',
    },
    iconBox: {
        width: 48,
        height: 48,
        backgroundColor: Theme.Colors.surfaceHighlight,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    bikeInfo: {
        flex: 1,
    },
    bikeTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: Theme.Colors.text,
    },
    bikeVin: {
        fontSize: 12,
        color: Theme.Colors.textSecondary,
        marginTop: 2,
    },
    activeBadge: {
        backgroundColor: 'rgba(225, 29, 72, 0.2)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
    },
    activeText: {
        color: Theme.Colors.primary,
        fontSize: 10,
        fontWeight: 'bold',
    },
    divider: {
        height: 1,
        backgroundColor: Theme.Colors.border,
    },
    cardActions: {
        flexDirection: 'row',
        padding: 12,
        backgroundColor: 'rgba(0,0,0,0.2)', // slightly darker footer
    },
    actionBtn: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 8,
        gap: 4,
    },
    actionText: {
        color: Theme.Colors.primary,
        fontWeight: '600',
        fontSize: 14,
    },
});
