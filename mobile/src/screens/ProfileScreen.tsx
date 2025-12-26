import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView, Image, ActivityIndicator } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { theme } from '../styles/theme';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { useAuth } from '../auth/context/AuthContext';
import { garageService } from '../services/garageService';
import { marketplaceService } from '../services/marketplaceService'; // Assuming we have an endpoint for user's tunes

export default function ProfileScreen() {
    const navigation = useNavigation();
    const { user, profile } = useAuth();
    const [stats, setStats] = useState({
        bikes: 0,
        tunes: 0,
        following: 0,
    });
    const [loading, setLoading] = useState(true);

    const fetchStats = async () => {
        try {
            // Fetch real counts. 
            // In a real app, these might come from a single /users/me/stats endpoint.
            // For now, we'll fetch the lists and count them.
            const bikes = await garageService.getVehicles();
            // const tunes = await marketplaceService.getMyTunes(); // TODO: Implement this

            setStats({
                bikes: bikes.length,
                tunes: 0, // Placeholder until endpoint exists
                following: 0, // Placeholder
            });
        } catch (error) {
            console.error('Error fetching stats:', error);
        } finally {
            setLoading(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchStats();
        }, [])
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Profile</Text>
                <Button
                    title="Settings"
                    variant="ghost"
                    size="sm"
                    onPress={() => navigation.navigate('Settings' as never)}
                />
            </View>

            <View style={styles.content}>
                <View style={styles.profileHeader}>
                    <View style={styles.avatarPlaceholder}>
                        <Text style={styles.avatarText}>{user?.email?.charAt(0).toUpperCase()}</Text>
                    </View>
                    <Text style={styles.username}>{user?.email}</Text>
                    <Text style={styles.role}>{profile?.role || 'Rider'}</Text>
                </View>

                <View style={styles.statsRow}>
                    <Card style={styles.statCard}>
                        {loading ? (
                            <ActivityIndicator color={theme.colors.primary} />
                        ) : (
                            <Text style={styles.statValue}>{stats.bikes}</Text>
                        )}
                        <Text style={styles.statLabel}>Bikes</Text>
                    </Card>
                    <Card style={styles.statCard}>
                        <Text style={styles.statValue}>{stats.tunes}</Text>
                        <Text style={styles.statLabel}>Tunes</Text>
                    </Card>
                    <Card style={styles.statCard}>
                        <Text style={styles.statValue}>{stats.following}</Text>
                        <Text style={styles.statLabel}>Following</Text>
                    </Card>
                </View>

                <Button
                    title="Edit Profile"
                    variant="outline"
                    onPress={() => { }}
                    style={styles.editButton}
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
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
    },
    title: {
        ...theme.typography.h1,
        color: theme.colors.text,
    },
    content: {
        padding: 20,
    },
    profileHeader: {
        alignItems: 'center',
        marginBottom: 32,
    },
    avatarPlaceholder: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: theme.colors.surfaceHighlight,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
        borderWidth: 2,
        borderColor: theme.colors.primary,
    },
    avatarText: {
        fontSize: 40,
        fontWeight: 'bold',
        color: theme.colors.text,
    },
    username: {
        ...theme.typography.h2,
        color: theme.colors.text,
        marginBottom: 4,
    },
    role: {
        ...theme.typography.body,
        color: theme.colors.textSecondary,
        textTransform: 'capitalize',
    },
    statsRow: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 32,
    },
    statCard: {
        flex: 1,
        alignItems: 'center',
        padding: 16,
    },
    statValue: {
        fontSize: 24,
        fontWeight: 'bold',
        color: theme.colors.primary,
    },
    statLabel: {
        fontSize: 12,
        color: theme.colors.textSecondary,
        marginTop: 4,
    },
    editButton: {
        width: '100%',
    },
});
