import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, Image, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { theme } from '../styles/theme';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { garageService } from '../services/garageService';
import { Vehicle } from '../types/models';

export default function BikeDetailScreen() {
    const route = useRoute();
    const navigation = useNavigation();
    // Initial params from navigation, but we'll fetch fresh data
    const { bikeId } = route.params as any;

    const [bike, setBike] = useState<Vehicle | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchBikeDetails = async () => {
        try {
            const data = await garageService.getVehicle(bikeId);
            setBike(data);
        } catch (error) {
            Alert.alert('Error', 'Failed to load bike details.');
            navigation.goBack();
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBikeDetails();
    }, [bikeId]);

    if (loading) {
        return (
            <View style={[styles.container, styles.center]}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
        );
    }

    if (!bike) return null;

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* Header Image */}
                <View style={styles.imageContainer}>
                    {bike.photo_url ? (
                        <Image source={{ uri: bike.photo_url }} style={styles.image} resizeMode="cover" />
                    ) : (
                        <View style={styles.placeholderImage}>
                            <Text style={styles.placeholderIcon}>🏍️</Text>
                        </View>
                    )}
                    <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                        <Text style={styles.backButtonText}>← Back</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.content}>
                    <View style={styles.header}>
                        <Text style={styles.title}>{bike.name}</Text>
                        <Text style={styles.subtitle}>{bike.year} {bike.make} {bike.model}</Text>
                        <View style={styles.vinContainer}>
                            <Text style={styles.vinLabel}>VIN: </Text>
                            <Text style={styles.vin}>{bike.vin || 'N/A'}</Text>
                        </View>
                    </View>

                    {/* Quick Actions */}
                    <View style={styles.actionsGrid}>
                        <TouchableOpacity
                            style={styles.actionButton}
                            activeOpacity={0.8}
                            onPress={() => navigation.navigate('LiveMonitor' as never)}
                        >
                            <View style={[styles.iconCircle, { backgroundColor: 'rgba(48, 209, 88, 0.1)' }]}>
                                <Text style={{ fontSize: 24 }}>📊</Text>
                            </View>
                            <Text style={styles.actionLabel}>Live Monitor</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.actionButton} activeOpacity={0.8}>
                            <View style={[styles.iconCircle, { backgroundColor: 'rgba(255, 59, 48, 0.1)' }]}>
                                <Text style={{ fontSize: 24 }}>⚡️</Text>
                            </View>
                            <Text style={styles.actionLabel}>Flash Tune</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.actionButton} activeOpacity={0.8}>
                            <View style={[styles.iconCircle, { backgroundColor: 'rgba(10, 132, 255, 0.1)' }]}>
                                <Text style={{ fontSize: 24 }}>🛠️</Text>
                            </View>
                            <Text style={styles.actionLabel}>Diagnostics</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.actionButton} activeOpacity={0.8}>
                            <View style={[styles.iconCircle, { backgroundColor: 'rgba(255, 214, 10, 0.1)' }]}>
                                <Text style={{ fontSize: 24 }}>📝</Text>
                            </View>
                            <Text style={styles.actionLabel}>Service Log</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Specs Card */}
                    <Card style={styles.sectionCard} title="Specifications">
                        <View style={styles.specRow}>
                            <Text style={styles.specLabel}>Engine</Text>
                            <Text style={styles.specValue}>998cc Liquid-cooled Inline-4</Text>
                        </View>
                        <View style={styles.divider} />
                        <View style={styles.specRow}>
                            <Text style={styles.specLabel}>ECU Type</Text>
                            <Text style={styles.specValue}>{bike.ecu_type || 'Unknown'}</Text>
                        </View>
                        <View style={styles.divider} />
                        <View style={styles.specRow}>
                            <Text style={styles.specLabel}>ECU ID</Text>
                            <Text style={styles.specValue}>{bike.ecu_id || 'Not Read'}</Text>
                        </View>
                    </Card>

                    {/* Current Tune Card */}
                    <Card style={styles.sectionCard} title="Current Tune">
                        <View style={styles.tuneInfo}>
                            <View>
                                <Text style={styles.tuneName}>Stage 1 Street</Text>
                                <Text style={styles.tuneAuthor}>Flashed on Dec 1, 2025</Text>
                            </View>
                            <Button title="Restore Stock" size="sm" variant="outline" onPress={() => { }} />
                        </View>
                    </Card>

                </View>
            </ScrollView>
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
    scrollContent: {
        paddingBottom: 40,
    },
    imageContainer: {
        height: 250,
        backgroundColor: theme.colors.surfaceHighlight,
        position: 'relative',
    },
    image: {
        width: '100%',
        height: '100%',
    },
    placeholderImage: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    placeholderIcon: {
        fontSize: 64,
    },
    backButton: {
        position: 'absolute',
        top: 50,
        left: 20,
        backgroundColor: 'rgba(0,0,0,0.5)',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
    },
    backButtonText: {
        color: '#FFF',
        fontWeight: '600',
    },
    content: {
        padding: 20,
        marginTop: -20,
        backgroundColor: theme.colors.background,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
    },
    header: {
        marginBottom: 24,
    },
    title: {
        ...theme.typography.h1,
        color: theme.colors.text,
        marginBottom: 4,
    },
    subtitle: {
        ...theme.typography.h3,
        color: theme.colors.textSecondary,
        marginBottom: 8,
    },
    vinContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.surface,
        alignSelf: 'flex-start',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
    },
    vinLabel: {
        color: theme.colors.textSecondary,
        fontSize: 12,
    },
    vin: {
        color: theme.colors.text,
        fontSize: 12,
        fontFamily: 'monospace',
        fontWeight: '600',
    },
    actionsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        marginBottom: 24,
    },
    actionButton: {
        width: '48%', // Roughly half width minus gap
        backgroundColor: theme.colors.surface,
        padding: 16,
        borderRadius: theme.borderRadius.m,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    iconCircle: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    actionLabel: {
        color: theme.colors.text,
        fontWeight: '600',
        fontSize: 14,
    },
    sectionCard: {
        marginBottom: 20,
    },
    specRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 12,
    },
    specLabel: {
        color: theme.colors.textSecondary,
        fontSize: 16,
    },
    specValue: {
        color: theme.colors.text,
        fontSize: 16,
        fontWeight: '500',
    },
    divider: {
        height: 1,
        backgroundColor: theme.colors.surfaceHighlight,
    },
    tuneInfo: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    tuneName: {
        fontSize: 18,
        fontWeight: '600',
        color: theme.colors.primary,
        marginBottom: 4,
    },
    tuneAuthor: {
        fontSize: 14,
        color: theme.colors.textSecondary,
    },
});
