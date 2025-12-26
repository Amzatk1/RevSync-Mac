import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, SafeAreaView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { theme } from '../styles/theme';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { marketplaceService } from '../services/marketplaceService';
import { Tune } from '../types/models';

export default function MarketplaceScreen() {
    const navigation = useNavigation();
    const [tunes, setTunes] = useState<Tune[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchTunes = async () => {
        try {
            const data = await marketplaceService.getTunes();
            setTunes(data);
        } catch (error) {
            // Error logged in service
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchTunes();
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        fetchTunes();
    };

    const handleTunePress = (tune: Tune) => {
        navigation.navigate('TuneDetail' as never, {
            tuneId: tune.id,
            name: tune.name,
            author: 'Creator ' + tune.creator, // In real app, fetch creator name
            price: tune.price,
            rating: tune.safety_rating, // Using safety rating as proxy for now
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
                <Text style={styles.title}>Marketplace</Text>
                <Text style={styles.subtitle}>Discover tunes for your ride</Text>
            </View>

            <FlatList
                data={tunes}
                keyExtractor={(item) => item.id.toString()}
                contentContainerStyle={styles.listContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />
                }
                ListEmptyComponent={
                    <View style={styles.center}>
                        <Text style={{ color: theme.colors.textSecondary }}>No tunes found.</Text>
                    </View>
                }
                renderItem={({ item }) => (
                    <TouchableOpacity onPress={() => handleTunePress(item)} activeOpacity={0.9}>
                        <Card style={styles.tuneCard}>
                            <View style={styles.tuneHeader}>
                                <View>
                                    <Text style={styles.tuneName}>{item.name}</Text>
                                    <Text style={styles.tuneAuthor}>for {item.vehicle_make} {item.vehicle_model}</Text>
                                </View>
                                <View style={styles.ratingBadge}>
                                    <Text style={styles.ratingText}>Safety: {item.safety_rating}/10</Text>
                                </View>
                            </View>

                            <View style={styles.tuneFooter}>
                                <Text style={styles.price}>${item.price}</Text>
                                <Button
                                    title="View Details"
                                    size="sm"
                                    onPress={() => handleTunePress(item)}
                                />
                            </View>
                        </Card>
                    </TouchableOpacity>
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
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        padding: 20,
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
    tuneCard: {
        marginBottom: 16,
        padding: 16,
    },
    tuneHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 16,
    },
    tuneName: {
        fontSize: 18,
        fontWeight: '600',
        color: theme.colors.text,
        marginBottom: 4,
    },
    tuneAuthor: {
        fontSize: 14,
        color: theme.colors.textSecondary,
    },
    ratingBadge: {
        backgroundColor: theme.colors.surfaceHighlight,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
    },
    ratingText: {
        color: theme.colors.success,
        fontWeight: '700',
        fontSize: 12,
    },
    tuneFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 8,
    },
    price: {
        fontSize: 20,
        fontWeight: '700',
        color: theme.colors.primary,
    },
});
