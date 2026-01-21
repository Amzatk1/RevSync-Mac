import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Theme } from '../theme';
import { Tune } from '../../domain/services/DomainTypes';
import { Ionicons } from '@expo/vector-icons';

interface TuneCardProps {
    tune: Tune;
    onPress: () => void;
}

export const TuneCard = ({ tune, onPress }: TuneCardProps) => {
    return (
        <TouchableOpacity style={styles.card} onPress={onPress}>
            <View style={styles.header}>
                <View style={styles.titleRow}>
                    <Text style={styles.name}>{tune.name}</Text>
                    <View style={styles.badge}>
                        <Text style={styles.badgeText}>Stage {tune.stage}</Text>
                    </View>
                </View>
                <Text style={styles.price}>${tune.price.toFixed(2)}</Text>
            </View>

            <Text style={styles.description} numberOfLines={2}>
                {tune.description}
            </Text>

            <View style={styles.footer}>
                <View style={styles.ratingContainer}>
                    <Ionicons name="shield-checkmark" size={16} color={
                        tune.safetyRating > 90 ? Theme.Colors.success :
                            tune.safetyRating > 80 ? Theme.Colors.warning : Theme.Colors.error
                    } />
                    <Text style={styles.ratingText}>Safety: {tune.safetyRating}/100</Text>
                </View>
                <Text style={styles.version}>v{tune.version}</Text>
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: Theme.Colors.surface,
        borderRadius: 12,
        padding: Theme.Spacing.md,
        marginBottom: Theme.Spacing.md,
        borderWidth: 1,
        borderColor: Theme.Colors.border,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: Theme.Spacing.sm,
    },
    titleRow: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 8,
    },
    name: {
        fontSize: 18,
        fontWeight: 'bold',
        color: Theme.Colors.text,
    },
    badge: {
        backgroundColor: Theme.Colors.primary,
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
    },
    badgeText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#000',
    },
    price: {
        fontSize: 18,
        fontWeight: 'bold',
        color: Theme.Colors.success,
        marginLeft: 8,
    },
    description: {
        fontSize: 14,
        color: Theme.Colors.textSecondary,
        marginBottom: Theme.Spacing.md,
        lineHeight: 20,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: Theme.Colors.border,
        paddingTop: Theme.Spacing.sm,
    },
    ratingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    ratingText: {
        fontSize: 12,
        fontWeight: '600',
        color: Theme.Colors.text,
    },
    version: {
        fontSize: 12,
        color: Theme.Colors.textSecondary,
    },
});
