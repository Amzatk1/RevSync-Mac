import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing, ViewStyle } from 'react-native';

interface SkeletonProps {
    width?: number | string;
    height?: number;
    borderRadius?: number;
    style?: ViewStyle;
}

const SkeletonPulse = ({ width = '100%', height = 16, borderRadius = 8, style }: SkeletonProps) => {
    const pulse = useRef(new Animated.Value(0.3)).current;

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulse, { toValue: 0.7, duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
                Animated.timing(pulse, { toValue: 0.3, duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
            ])
        ).start();
    }, []);

    return (
        <Animated.View
            style={[
                { width: width as any, height, borderRadius, backgroundColor: '#333', opacity: pulse },
                style,
            ]}
        />
    );
};

// ─── Skeleton Cards ────────────────────────────────────────────

export const SkeletonBikeCard = () => (
    <View style={s.bikeCard}>
        <View style={s.row}>
            <SkeletonPulse width={48} height={48} borderRadius={14} />
            <View style={{ flex: 1, marginLeft: 16, gap: 8 }}>
                <SkeletonPulse width="70%" height={18} />
                <SkeletonPulse width="40%" height={12} />
            </View>
        </View>
        <View style={[s.divider, { marginVertical: 14 }]} />
        <View style={s.row}>
            <SkeletonPulse width={100} height={14} />
            <SkeletonPulse width={80} height={14} />
        </View>
    </View>
);

export const SkeletonTuneCard = () => (
    <View style={s.tuneCard}>
        <View style={s.row}>
            <SkeletonPulse width={56} height={56} borderRadius={12} />
            <View style={{ flex: 1, marginLeft: 14, gap: 6 }}>
                <SkeletonPulse width="80%" height={16} />
                <SkeletonPulse width="50%" height={12} />
                <View style={[s.row, { marginTop: 4 }]}>
                    <SkeletonPulse width={60} height={22} borderRadius={11} />
                    <SkeletonPulse width={70} height={22} borderRadius={11} style={{ marginLeft: 8 }} />
                </View>
            </View>
            <SkeletonPulse width={52} height={20} borderRadius={10} />
        </View>
    </View>
);

export const SkeletonDetailHeader = () => (
    <View style={{ padding: 24, gap: 12 }}>
        <SkeletonPulse width={80} height={20} borderRadius={10} />
        <SkeletonPulse width="60%" height={28} />
        <SkeletonPulse width="90%" height={14} />
        <SkeletonPulse width="100%" height={14} />
        <View style={[s.row, { marginTop: 8 }]}>
            <SkeletonPulse width={100} height={40} borderRadius={12} />
            <SkeletonPulse width={100} height={40} borderRadius={12} style={{ marginLeft: 12 }} />
        </View>
    </View>
);

// ─── Styles ────────────────────────────────────────────────────

const s = StyleSheet.create({
    bikeCard: {
        backgroundColor: '#252525',
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
        padding: 18,
        marginBottom: 14,
    },
    tuneCard: {
        backgroundColor: '#252525',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
        padding: 16,
        marginBottom: 12,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    divider: {
        height: 1,
        backgroundColor: 'rgba(255,255,255,0.04)',
    },
});
