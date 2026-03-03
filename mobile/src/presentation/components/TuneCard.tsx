import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Tune } from '../../domain/services/DomainTypes';
import { Theme } from '../theme';

interface TuneCardProps {
    tune: Tune;
    onPress: () => void;
}

const stageConfig = (stage: number) => {
    if (stage === 1) return { label: 'Stage 1', bg: 'rgba(59,130,246,0.16)', text: '#93C5FD' };
    if (stage === 2) return { label: 'Stage 2', bg: 'rgba(234,16,60,0.16)', text: '#FB7185' };
    if (stage === 3) return { label: 'Stage 3', bg: 'rgba(168,85,247,0.18)', text: '#D8B4FE' };
    return { label: 'Custom', bg: 'rgba(148,163,184,0.15)', text: '#CBD5E1' };
};

const safetyConfig = (score: number) => {
    if (score >= 90) return { label: 'SAFE', color: Theme.Colors.success };
    if (score >= 80) return { label: 'MOD', color: Theme.Colors.warning };
    return { label: 'RISK', color: Theme.Colors.error };
};

export const TuneCard = ({ tune, onPress }: TuneCardProps) => {
    const stage = stageConfig(tune.stage);
    const safety = safetyConfig(tune.safetyRating);
    const price = tune.price === 0 ? 'Free' : `$${tune.price.toFixed(2)}`;

    return (
        <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.78}>
            <View style={styles.rowTop}>
                <View style={styles.tags}>
                    <View style={[styles.tag, { backgroundColor: stage.bg }]}>
                        <Text style={[styles.tagText, { color: stage.text }]}>{stage.label}</Text>
                    </View>
                    <View style={styles.safetyTag}>
                        <View style={[styles.dot, { backgroundColor: safety.color }]} />
                        <Text style={[styles.safetyText, { color: safety.color }]}>{safety.label}</Text>
                    </View>
                </View>
                <View style={styles.ratingWrap}>
                    <Ionicons name="star" size={12} color="#FBBF24" />
                    <Text style={styles.ratingText}>{(4.2 + (tune.safetyRating % 6) / 10).toFixed(1)}</Text>
                </View>
            </View>

            <View style={styles.rowMain}>
                <LinearGradient
                    colors={['rgba(234,16,60,0.20)', 'rgba(22,24,36,0.65)']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.iconPlate}
                >
                    <Ionicons name="flash" size={24} color={Theme.Colors.primary} />
                </LinearGradient>

                <View style={styles.info}>
                    <Text numberOfLines={1} style={styles.title}>{tune.title}</Text>
                    <Text numberOfLines={1} style={styles.meta}>
                        {tune.version} • Safety {tune.safetyRating}
                    </Text>
                    <Text style={styles.price}>{price}</Text>
                </View>

                <View style={styles.arrow}>
                    <Ionicons name="chevron-forward" size={18} color={Theme.Colors.primary} />
                </View>
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    card: {
        marginBottom: 12,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.10)',
        backgroundColor: 'rgba(17,19,30,0.78)',
        padding: 14,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.22,
        shadowRadius: 16,
        elevation: 8,
    },
    rowTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    tags: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    tag: {
        borderRadius: 8,
        paddingHorizontal: 8,
        paddingVertical: 4,
    },
    tagText: {
        fontSize: 10,
        fontWeight: '800',
        letterSpacing: 0.4,
        textTransform: 'uppercase',
    },
    safetyTag: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        borderRadius: 999,
        paddingHorizontal: 8,
        paddingVertical: 4,
        backgroundColor: 'rgba(255,255,255,0.05)',
    },
    dot: {
        width: 6,
        height: 6,
        borderRadius: 3,
    },
    safetyText: {
        fontSize: 10,
        fontWeight: '800',
        letterSpacing: 0.35,
    },
    ratingWrap: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
    },
    ratingText: {
        fontSize: 12,
        fontWeight: '700',
        color: Theme.Colors.textSecondary,
    },
    rowMain: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    iconPlate: {
        width: 58,
        height: 58,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    info: {
        flex: 1,
        minWidth: 0,
    },
    title: {
        fontSize: 16,
        fontWeight: '800',
        letterSpacing: -0.2,
        color: Theme.Colors.text,
    },
    meta: {
        marginTop: 2,
        fontSize: 12,
        color: Theme.Colors.textSecondary,
    },
    price: {
        marginTop: 5,
        fontSize: 15,
        fontWeight: '800',
        color: Theme.Colors.primary,
    },
    arrow: {
        width: 34,
        height: 34,
        borderRadius: 17,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(234,16,60,0.12)',
    },
});
