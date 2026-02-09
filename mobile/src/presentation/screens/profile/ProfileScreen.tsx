import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Theme } from '../../theme';
import { Screen, Card, SecondaryButton } from '../../components/SharedComponents';
import { Ionicons } from '@expo/vector-icons';
import { useAppStore } from '../../store/useAppStore';
import { ServiceLocator } from '../../../di/ServiceLocator';
import { useSettingsStore } from '../../store/useSettingsStore';

export const ProfileScreen = ({ navigation }: any) => {
    const { currentUser, signOut, activeBike } = useAppStore();
    const [stats, setStats] = useState({ tunesFlashed: 0, bikesOwned: 0 });

    useEffect(() => {
        loadStats();
    }, []);

    const loadStats = async () => {
        try {
            const bikeService = ServiceLocator.getBikeService();
            const bikes = await bikeService.getBikes();
            setStats({ tunesFlashed: 3, bikesOwned: bikes.length });
        } catch (e) {
            console.log('Failed to load profile stats');
        }
    };

    const handleSignOut = async () => {
        await signOut();
    };

    return (
        <Screen scroll>
            {/* Gradient Header */}
            <LinearGradient
                colors={['rgba(225, 29, 72, 0.15)', 'rgba(225, 29, 72, 0.03)', Theme.Colors.background]}
                style={styles.gradientHeader}
            >
                <View style={styles.header}>
                    <View style={styles.avatarContainer}>
                        <Text style={styles.avatarText}>
                            {currentUser?.email?.substring(0, 2).toUpperCase() || 'US'}
                        </Text>
                        <TouchableOpacity style={styles.editBadge} onPress={() => navigation.navigate('ProfileEdit')}>
                            <Ionicons name="pencil" size={12} color="#FFF" />
                        </TouchableOpacity>
                    </View>
                    <Text style={styles.email}>{currentUser?.email}</Text>
                    <Text style={styles.joined}>Member since 2024</Text>
                </View>
            </LinearGradient>

            <View style={styles.statsRow}>
                <StatsCard label="Bikes" value={stats.bikesOwned.toString()} icon="bicycle" />
                <StatsCard label="Flashes" value={stats.tunesFlashed.toString()} icon="flash" />
                <StatsCard label="Purchased" value="2" icon="cart" />
            </View>

            {/* Active Bike Summary */}
            {activeBike && (
                <Card style={styles.bikeCard}>
                    <View style={styles.bikeRow}>
                        <View style={styles.bikeIconBox}>
                            <Ionicons name="bicycle" size={24} color={Theme.Colors.primary} />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.bikeTitle}>Active Bike</Text>
                            <Text style={styles.bikeName}>{activeBike.year} {activeBike.make} {activeBike.model}</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color={Theme.Colors.textSecondary} />
                    </View>
                </Card>
            )}

            <View style={styles.menuContainer}>
                <MenuItem
                    icon="settings-outline"
                    label="Settings"
                    onPress={() => navigation.navigate('Settings')}
                />
                <MenuItem
                    icon="document-text-outline"
                    label="Export Logs"
                    onPress={() => navigation.navigate('LogsExport')}
                />
                <MenuItem
                    icon="help-buoy-outline"
                    label="Support"
                    onPress={() => navigation.navigate('Support')}
                />
            </View>

            <View style={styles.footer}>
                <SecondaryButton
                    title="Sign Out"
                    onPress={handleSignOut}
                    style={styles.signOutBtn}
                    textStyle={{ color: Theme.Colors.error }}
                />
                <Text style={styles.version}>RevSync v1.0.0 (Build 102)</Text>
            </View>
        </Screen>
    );
};

const StatsCard = ({ label, value, icon }: any) => (
    <Card style={styles.statsCard}>
        <View style={styles.iconCircle}>
            <Ionicons name={icon} size={20} color={Theme.Colors.primary} />
        </View>
        <Text style={styles.statsValue}>{value}</Text>
        <Text style={styles.statsLabel}>{label}</Text>
    </Card>
);

const MenuItem = ({ icon, label, onPress }: any) => (
    <TouchableOpacity style={styles.menuItem} onPress={onPress} activeOpacity={0.7}>
        <View style={styles.menuLeft}>
            <View style={styles.menuIconBox}>
                <Ionicons name={icon} size={20} color={Theme.Colors.primary} />
            </View>
            <Text style={styles.menuLabel}>{label}</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={Theme.Colors.textSecondary} />
    </TouchableOpacity>
);

const styles = StyleSheet.create({
    gradientHeader: {
        paddingTop: 16,
    },
    header: {
        alignItems: 'center',
        paddingVertical: 32,
    },
    avatarContainer: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: Theme.Colors.surface,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
        borderWidth: 2,
        borderColor: Theme.Colors.primary,
        ...Theme.Shadows.md,
    },
    avatarText: {
        fontSize: 36,
        fontWeight: 'bold',
        color: Theme.Colors.primary,
    },
    editBadge: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: Theme.Colors.primary,
        width: 28,
        height: 28,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: Theme.Colors.background,
    },
    email: {
        ...Theme.Typography.h2,
        marginBottom: 4,
    },
    joined: {
        color: Theme.Colors.textSecondary,
        fontSize: 14,
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: Theme.Spacing.md,
        gap: 12,
        marginBottom: 32,
    },
    statsCard: {
        flex: 1,
        alignItems: 'center',
        padding: 16,
        backgroundColor: Theme.Colors.surface,
        borderRadius: Theme.Layout.cardRadius,
    },
    iconCircle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(225, 29, 72, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    statsValue: {
        fontSize: 24,
        fontWeight: 'bold',
        color: Theme.Colors.text,
    },
    statsLabel: {
        fontSize: 12,
        color: Theme.Colors.textSecondary,
        marginTop: 4,
    },
    menuContainer: {
        paddingHorizontal: Theme.Spacing.md,
        marginBottom: 32,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 12,
        paddingHorizontal: 16,
        backgroundColor: Theme.Colors.surface,
        marginBottom: 8,
        borderRadius: Theme.Layout.borderRadius,
        borderWidth: 1,
        borderColor: Theme.Colors.border,
    },
    menuLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    menuIconBox: {
        width: 32,
        height: 32,
        borderRadius: 8,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    menuLabel: {
        fontSize: 16,
        fontWeight: '500',
        color: Theme.Colors.text,
    },
    footer: {
        paddingHorizontal: Theme.Spacing.md,
        marginTop: 'auto',
        marginBottom: 32,
        gap: 16,
    },
    signOutBtn: {
        borderColor: Theme.Colors.error,
    },
    version: {
        textAlign: 'center',
        color: Theme.Colors.textSecondary,
        fontSize: 12,
    },
    bikeCard: {
        marginHorizontal: Theme.Spacing.md,
        marginBottom: 16,
    },
    bikeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
    },
    bikeIconBox: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: 'rgba(225, 29, 72, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    bikeTitle: {
        fontSize: 12,
        color: Theme.Colors.textSecondary,
        fontWeight: '500',
    },
    bikeName: {
        fontSize: 16,
        fontWeight: '700',
        color: Theme.Colors.text,
        marginTop: 2,
    },
});
