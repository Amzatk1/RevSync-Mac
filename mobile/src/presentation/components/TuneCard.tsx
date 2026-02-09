import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { Theme } from '../theme';
import { Tune } from '../../domain/services/DomainTypes';
import { Ionicons } from '@expo/vector-icons';

interface TuneCardProps {
    tune: Tune;
    onPress: () => void;
}

const getSafetyInfo = (rating: number) => {
    if (rating > 90) return { label: 'Safe', icon: 'shield-checkmark' as const, color: '#22C55E', bg: 'rgba(34,197,94,0.1)' };
    if (rating > 80) return { label: 'Moderate', icon: 'shield-half' as const, color: '#F59E0B', bg: 'rgba(245,158,11,0.1)' };
    return { label: 'Risky', icon: 'warning' as const, color: '#EF4444', bg: 'rgba(239,68,68,0.1)' };
};

const getStageColor = (stage: number) => {
    if (stage === 1) return { bg: 'rgba(59,130,246,0.15)', text: '#60A5FA' };
    if (stage === 2) return { bg: 'rgba(225,29,72,0.15)', text: '#FB7185' };
    return { bg: 'rgba(168,85,247,0.15)', text: '#C084FC' };
};

export const TuneCard = ({ tune, onPress }: TuneCardProps) => {
    const safety = getSafetyInfo(tune.safetyRating);
    const stageStyle = getStageColor(tune.stage);

    return (
        <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
            {/* Header: Title + Price */}
            <View style={styles.header}>
                <View style={styles.titleRow}>
                    <Text style={styles.title} numberOfLines={1}>{tune.title}</Text>
                    <View style={[styles.stageBadge, { backgroundColor: stageStyle.bg }]}>
                        <Ionicons name="flash" size={10} color={stageStyle.text} />
                        <Text style={[styles.stageBadgeText, { color: stageStyle.text }]}>
                            Stage {tune.stage}
                        </Text>
                    </View>
                </View>
                <Text style={styles.price}>${tune.price.toFixed(2)}</Text>
            </View>

            {/* Description */}
            <Text style={styles.description} numberOfLines={2}>
                {tune.description}
            </Text>

            {/* Footer: Safety + Version */}
            <View style={styles.footer}>
                <View style={[styles.safetyBadge, { backgroundColor: safety.bg }]}>
                    <Ionicons name={safety.icon} size={14} color={safety.color} />
                    <Text style={[styles.safetyText, { color: safety.color }]}>
                        {safety.label} ({tune.safetyRating})
                    </Text>
                </View>
                <View style={styles.versionRow}>
                    <Ionicons name="git-branch-outline" size={12} color="#52525B" />
                    <Text style={styles.version}>v{tune.version}</Text>
                </View>
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.06)',
        // Glassmorphism shadow
        shadowColor: '#E11D48',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 12,
        elevation: 3,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 8,
        gap: 12,
    },
    titleRow: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        flexWrap: 'wrap',
    },
    title: {
        fontSize: 16,
        fontWeight: '700',
        color: '#FAFAFA',
        flexShrink: 1,
    },
    stageBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 10,
    },
    stageBadgeText: {
        fontSize: 11,
        fontWeight: '700',
        letterSpacing: 0.2,
    },
    price: {
        fontSize: 17,
        fontWeight: '800',
        color: '#22C55E',
        letterSpacing: -0.3,
    },
    description: {
        fontSize: 13,
        color: '#71717A',
        lineHeight: 18,
        marginBottom: 12,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 10,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.04)',
    },
    safetyBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    safetyText: {
        fontSize: 11,
        fontWeight: '700',
    },
    versionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    version: {
        fontSize: 11,
        color: '#52525B',
        fontWeight: '500',
    },
});
