import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, SafeAreaView, ActivityIndicator, RefreshControl } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { theme } from '../styles/theme';
import { Button } from '../components/ui/Button';
import { BikeCard } from '../components/ui/BikeCard';
import { garageService } from '../services/garageService';
import { Vehicle } from '../types/models';

export default function GarageScreen() {
    const navigation = useNavigation();
    const [bikes, setBikes] = useState<Vehicle[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchBikes = async () => {
        try {
            const data = await garageService.getVehicles();
            setBikes(data);
        } catch (error) {
            // Error is logged in service
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchBikes();
        }, [])
    );

    const onRefresh = () => {
        setRefreshing(true);
        fetchBikes();
    };

    const handleBikePress = (bike: Vehicle) => {
        navigation.navigate('BikeDetail' as never, {
            bikeId: bike.id,
            name: bike.name,
            model: `${bike.year} ${bike.make} ${bike.model}`,
            vin: bike.vin,
            imageUrl: bike.photo_url,
        } as never);
    };

    if (loading && !refreshing) {
        return (
            <View style={[styles.container, styles.center]}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <View>
                    <Text style={styles.title}>My Garage</Text>
                    <Text style={styles.subtitle}>{bikes.length} Motorcycle{bikes.length !== 1 ? 's' : ''}</Text>
                </View>
                <Button
                    title="Add Bike"
                    size="sm"
                    onPress={() => navigation.navigate('AddBike' as never)}
                    variant="secondary"
                />
            </View>

            <FlatList
                data={bikes}
                keyExtractor={(item) => item.id.toString()}
                contentContainerStyle={styles.listContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />
                }
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyText}>Your garage is empty.</Text>
                        <Button
                            title="Add Your First Bike"
                            onPress={() => navigation.navigate('AddBike' as never)}
                        />
                    </View>
                }
                renderItem={({ item }) => (
                    <View style={styles.cardWrapper}>
                        <BikeCard
                            name={item.name}
                            model={`${item.year} ${item.make} ${item.model}`}
                            vin={item.vin}
                            imageUrl={item.photo_url}
                            onPress={() => handleBikePress(item)}
                        />
                    </View>
                )}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    center: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 20,
    },
    title: {
        ...theme.typography.h1,
        color: theme.colors.text,
    },
    subtitle: {
        ...theme.typography.body,
        color: theme.colors.textSecondary,
    },
    listContent: {
        padding: 20,
        paddingTop: 0,
        flexGrow: 1,
    },
    cardWrapper: {
        marginBottom: 20,
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 100,
    },
    emptyText: {
        ...theme.typography.h3,
        color: theme.colors.textSecondary,
        marginBottom: 20,
    },
});
