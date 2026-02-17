import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Tune } from '../../domain/services/DomainTypes';

// ── Design tokens ──
const C = {
    primary: '#ea103c',
    primaryBadgeBg: 'rgba(225,29,72,0.15)',
    primaryBadgeText: '#FB7185',
    bg: '#1a1a1a',
    surface: '#2d2d2d',
    surfaceDark: '#262626',
    border: '#404040',
    neutral400: '#a3a3a3',
    neutral500: '#a3a3a3',
    neutral600: '#737373',
    neutral700: '#525252',
    white: '#ffffff',
    success: '#22C55E',
    successBg: 'rgba(34,197,94,0.15)',
    yellow: '#EAB308',
};

interface TuneCardProps {
    tune: Tune;
    onPress: () => void;
}

const getStageColor = (stage: number) => {
    if (stage === 1) return { bg: 'rgba(59,130,246,0.15)', text: '#60A5FA', label: 'Stage 1' };
    if (stage === 2) return { bg: C.primaryBadgeBg, text: C.primaryBadgeText, label: 'Stage 2' };
    if (stage === 3) return { bg: 'rgba(168,85,247,0.15)', text: '#C084FC', label: 'Stage 3' };
    return { bg: C.primaryBadgeBg, text: C.primaryBadgeText, label: `ECO` };
};

const getSafetyInfo = (rating: number) => {
    if (rating > 90) return { label: 'Safe', color: '#22C55E', bg: 'rgba(34,197,94,0.1)' };
    if (rating > 80) return { label: 'Moderate', color: '#F59E0B', bg: 'rgba(245,158,11,0.1)' };
    return { label: 'Risky', color: '#EF4444', bg: 'rgba(239,68,68,0.1)' };
};

export const TuneCard = ({ tune, onPress }: TuneCardProps) => {
    const stageStyle = getStageColor(tune.stage);
    const safety = getSafetyInfo(tune.safetyRating);
    const isCompatible = tune.safetyRating > 80; // simplified

    return (
        <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
            <View style={styles.cardContent}>
                {/* Top badges row */}
                <View style={styles.topRow}>
                    <View style={styles.badgesLeft}>
                        <View style={[styles.stageBadge, { backgroundColor: stageStyle.bg }]}>
                            <Text style={[styles.stageBadgeText, { color: stageStyle.text }]}>
                                {stageStyle.label}
                            </Text>
                        </View>
                        {isCompatible && (
                            <View style={styles.compatBadge}>
                                <Ionicons name="checkmark-circle" size={12} color={C.success} />
                                <Text style={styles.compatText}>COMPATIBLE</Text>
                            </View>
                        )}
                    </View>
                    {/* Star rating */}
                    <View style={styles.ratingBadge}>
                        <Ionicons name="star" size={12} color={C.yellow} />
                        <Text style={styles.ratingText}>
                            {(4.5 + (tune.safetyRating % 5) / 10).toFixed(1)}
                        </Text>
                    </View>
                </View>

                {/* Main content: Thumbnail + Info */}
                <View style={styles.mainRow}>
                    {/* Thumbnail */}
                    <View style={styles.thumbnail}>
                        <Ionicons name="bicycle" size={28} color={C.neutral600} />
                    </View>

                    {/* Info */}
                    <View style={styles.infoCol}>
                        <Text style={styles.title} numberOfLines={1}>{tune.title}</Text>
                        <View style={styles.authorRow}>
                            <Ionicons name="person-outline" size={12} color={C.neutral500} />
                            <Text style={styles.authorText}>
                                {tune.description?.split(' ').slice(0, 2).join(' ') || 'Tuner'}
                            </Text>
                        </View>
                        <Text style={styles.price}>
                            {tune.price === 0 ? 'Free' : `$${tune.price.toFixed(2)}`}
                        </Text>
                    </View>

                    {/* Arrow button */}
                    <TouchableOpacity style={styles.arrowBtn} onPress={onPress}>
                        <Ionicons name="arrow-forward" size={18} color={C.primary} />
                    </TouchableOpacity>
                </View>
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: C.surface,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: C.border,
        marginBottom: 12,
        overflow: 'hidden',
    },
    cardContent: {
        padding: 16,
    },

    // Top row
    topRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    badgesLeft: {
        flexDirection: 'row',
        gap: 8,
        alignItems: 'center',
    },
    stageBadge: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
    },
    stageBadgeText: {
        fontSize: 10,
        fontWeight: '700',
        letterSpacing: 0.3,
        textTransform: 'uppercase',
    },
    compatBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: C.successBg,
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
    },
    compatText: {
        fontSize: 10,
        fontWeight: '700',
        color: C.success,
        letterSpacing: 0.3,
    },
    ratingBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    ratingText: {
        fontSize: 12,
        fontWeight: '600',
        color: C.neutral400,
    },

    // Main row
    mainRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
    },
    thumbnail: {
        width: 64,
        height: 64,
        borderRadius: 12,
        backgroundColor: C.surfaceDark,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: C.border,
    },
    infoCol: {
        flex: 1,
        justifyContent: 'center',
    },
    title: {
        fontSize: 16,
        fontWeight: '700',
        color: C.white,
        marginBottom: 2,
    },
    authorRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginBottom: 4,
    },
    authorText: {
        fontSize: 12,
        color: C.neutral500,
    },
    price: {
        fontSize: 15,
        fontWeight: '700',
        color: C.primary,
    },

    // Arrow
    arrowBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(225,29,72,0.10)',
        alignItems: 'center',
        justifyContent: 'center',
    },
});
