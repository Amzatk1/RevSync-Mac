import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, RefreshControl } from 'react-native';
import { Theme } from '../theme';
import { Screen, PrimaryButton, LoadingOverlay, Card, EmptyState } from '../components/SharedComponents';
import { Ionicons } from '@expo/vector-icons';
import { ServiceLocator } from '../../di/ServiceLocator';
import { Bike } from '../../domain/services/DomainTypes';
import { useAppStore } from '../store/useAppStore';
import { useFocusEffect } from '@react-navigation/native';

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
        // In real app we would check if active and prompt appropriately
        Alert.alert(
            'Delete Bike',
            'Are you sure you want to remove this bike from your garage?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        // Implement delete in Service (missing in interface currently, adding stub support)
                        Alert.alert('Not Implemented', 'Delete feature coming soon');
                    }
                }
            ]
        );
    };

    const renderBikeItem = ({ item }: { item: Bike }) => {
        const isActive = activeBike?.id === item.id;

        return (
            <Card style={isActive ? styles.activeCard : undefined} onPress={() => navigation.navigate('BikeDetails', { bikeId: item.id })}>
                <View style={styles.cardHeader}>
                    <View>
                        <Text style={styles.bikeTitle}>{item.year} {item.make} {item.model}</Text>
                        {item.vin && <Text style={styles.vin}>VIN: {item.vin}</Text>}
                    </View>
                    {isActive && (
                        <View style={styles.activeBadge}>
                            <Text style={styles.activeBadgeText}>ACTIVE</Text>
                        </View>
                    )}
                </View>

                <View style={styles.cardFooter}>
                    <View style={styles.ecuStatus}>
                        <Ionicons
                            name={item.ecuId ? "checkmark-circle" : "alert-circle-outline"}
                            size={16}
                            color={item.ecuId ? Theme.Colors.success : Theme.Colors.textSecondary}
                        />
                        <Text style={styles.ecuText}>
                            {item.ecuId ? 'ECU Identified' : 'ECU Not Identified'}
                        </Text>
                    </View>

                    {!isActive && (
                        <TouchableOpacity style={styles.activateBtn} onPress={() => handleSetActive(item.id)}>
                            <Text style={styles.activateText}>Set Active</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </Card>
        );
    };

    return (
        <Screen edges={['top']}>
            <View style={styles.header}>
                <Text style={styles.title}>My Garage</Text>
                <TouchableOpacity onPress={() => navigation.navigate('AddBike')} style={styles.addBtn}>
                    <Ionicons name="add" size={24} color="#000" />
                </TouchableOpacity>
            </View>

            <FlatList
                data={bikes}
                keyExtractor={item => item.id}
                renderItem={renderBikeItem}
                contentContainerStyle={styles.list}
                refreshControl={<RefreshControl refreshing={loading} onRefresh={loadBikes} tintColor={Theme.Colors.primary} />}
                ListEmptyComponent={
                    !loading ? (
                        <EmptyState
                            icon="car-sport-outline"
                            title="Garage Empty"
                            message="Add your first bike to verify tunes and flash your ECU."
                            action={{ label: 'Add Bike', onPress: () => navigation.navigate('AddBike') }}
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
        paddingHorizontal: Theme.Spacing.md,
        paddingBottom: Theme.Spacing.md,
        backgroundColor: Theme.Colors.background,
    },
    title: {
        ...Theme.Typography.h2,
    },
    addBtn: {
        backgroundColor: Theme.Colors.primary,
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
    },
    list: {
        padding: Theme.Spacing.md,
    },
    activeCard: {
        borderColor: Theme.Colors.primary,
        borderWidth: 2,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    bikeTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: Theme.Colors.text,
    },
    vin: {
        fontSize: 12,
        color: Theme.Colors.textSecondary,
        marginTop: 2,
    },
    activeBadge: {
        backgroundColor: Theme.Colors.primary,
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
    },
    activeBadgeText: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#000',
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: Theme.Spacing.md,
        paddingTop: Theme.Spacing.md,
        borderTopWidth: 1,
        borderTopColor: Theme.Colors.border,
    },
    ecuStatus: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    ecuText: {
        fontSize: 12,
        color: Theme.Colors.textSecondary,
    },
    activateBtn: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 6,
    },
    activateText: {
        fontSize: 12,
        fontWeight: '600',
        color: Theme.Colors.text,
    },
});
