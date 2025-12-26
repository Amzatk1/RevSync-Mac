import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, FlatList, ActivityIndicator, TouchableOpacity, TextInput, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { theme } from '../styles/theme';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { garageService } from '../services/garageService';
import { VehicleDefinition } from '../types/models';

export default function AddBikeScreen() {
    const navigation = useNavigation();
    const [query, setQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [isAdding, setIsAdding] = useState(false);
    const [results, setResults] = useState<VehicleDefinition[]>([]);

    // Simulate AI Search Debounce
    useEffect(() => {
        if (query.length < 2) {
            setResults([]);
            return;
        }

        setIsSearching(true);
        const timer = setTimeout(async () => {
            try {
                const data = await garageService.searchVehicleDefinitions(query);
                setResults(data);
            } catch (error) {
                console.error('Search error:', error);
            } finally {
                setIsSearching(false);
            }
        }, 600); // Keep debounce for better UX

        return () => clearTimeout(timer);
    }, [query]);

    const handleSelect = async (bikeDef: VehicleDefinition) => {
        if (isAdding) return;
        setIsAdding(true);
        try {
            await garageService.addVehicle({
                make: bikeDef.make,
                model: bikeDef.model,
                year: bikeDef.year,
                vehicle_type: bikeDef.vehicle_type,
                name: `${bikeDef.year} ${bikeDef.model}`, // Default nickname
                public_visibility: true,
            });
            // Success feedback
            Alert.alert('Success', 'Motorcycle added to your garage!', [
                { text: 'OK', onPress: () => navigation.goBack() }
            ]);
        } catch (error) {
            Alert.alert('Error', 'Failed to add bike. Please check your connection and try again.');
            setIsAdding(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Button
                    title="Cancel"
                    variant="ghost"
                    size="sm"
                    onPress={() => navigation.goBack()}
                />
                <Text style={styles.title}>Add Motorcycle</Text>
                <View style={{ width: 60 }} />
            </View>

            <View style={styles.content}>
                <View style={styles.searchContainer}>
                    <Text style={styles.label}>Smart Search</Text>
                    <TextInput
                        style={styles.searchInput}
                        placeholder="e.g. '2024 R1' or 'Ducati V4'"
                        placeholderTextColor={theme.colors.textSecondary}
                        value={query}
                        onChangeText={setQuery}
                        autoFocus
                        editable={!isAdding}
                    />
                    {isSearching && (
                        <ActivityIndicator style={styles.loader} color={theme.colors.primary} />
                    )}
                </View>

                <FlatList
                    data={results}
                    keyExtractor={item => item.id.toString()}
                    contentContainerStyle={styles.listContent}
                    ListEmptyComponent={() => (
                        query.length > 1 && !isSearching ? (
                            <View style={styles.emptyState}>
                                <Text style={styles.emptyText}>No bikes found.</Text>
                                <Button title="Enter Manually" variant="outline" onPress={() => { }} />
                            </View>
                        ) : (
                            <View style={styles.emptyState}>
                                <Text style={styles.helperText}>
                                    Type your bike's year, make, or model. Our AI will find the best match.
                                </Text>
                            </View>
                        )
                    )}
                    renderItem={({ item }) => (
                        <TouchableOpacity onPress={() => handleSelect(item)} disabled={isAdding}>
                            <Card style={[styles.resultCard, isAdding && styles.disabledCard]}>
                                <View style={styles.resultRow}>
                                    <View>
                                        <Text style={styles.bikeName}>{item.year} {item.make} {item.model}</Text>
                                        <Text style={styles.bikeCategory}>{item.vehicle_type === 'BIKE' ? 'Motorcycle' : 'Car'}</Text>
                                    </View>
                                    {isAdding ? (
                                        <ActivityIndicator size="small" color={theme.colors.primary} />
                                    ) : (
                                        <Text style={styles.addIcon}>+</Text>
                                    )}
                                </View>
                            </Card>
                        </TouchableOpacity>
                    )}
                />
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
    },
    title: {
        ...theme.typography.h3,
        color: theme.colors.text,
    },
    content: {
        flex: 1,
        padding: 20,
    },
    searchContainer: {
        marginBottom: 20,
        position: 'relative',
    },
    label: {
        ...theme.typography.caption,
        color: theme.colors.primary,
        marginBottom: 8,
        fontWeight: '600',
        textTransform: 'uppercase',
    },
    searchInput: {
        backgroundColor: theme.colors.surface,
        borderWidth: 1,
        borderColor: theme.colors.primary, // Highlighted border for "Smart" feel
        borderRadius: theme.borderRadius.m,
        padding: 16,
        fontSize: 18,
        color: theme.colors.text,
        ...theme.shadows.glow, // Glow effect
    },
    loader: {
        position: 'absolute',
        right: 16,
        top: 42,
    },
    listContent: {
        paddingBottom: 40,
    },
    resultCard: {
        marginBottom: 12,
        padding: 16,
    },
    disabledCard: {
        opacity: 0.7,
    },
    resultRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    bikeName: {
        fontSize: 16,
        fontWeight: '600',
        color: theme.colors.text,
        marginBottom: 4,
    },
    bikeCategory: {
        fontSize: 12,
        color: theme.colors.textSecondary,
    },
    addIcon: {
        fontSize: 24,
        color: theme.colors.primary,
        fontWeight: '300',
    },
    emptyState: {
        marginTop: 40,
        alignItems: 'center',
    },
    emptyText: {
        color: theme.colors.textSecondary,
        marginBottom: 16,
    },
    helperText: {
        color: theme.colors.textSecondary,
        textAlign: 'center',
        maxWidth: 240,
        lineHeight: 20,
    },
});
