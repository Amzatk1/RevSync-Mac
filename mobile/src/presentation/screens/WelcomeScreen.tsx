import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppScreen, GlassCard } from '../components/AppUI';
import { Theme } from '../theme';

const { Colors, Layout, Motion, Spacing, Typography } = Theme;

const FEATURES = [
    { icon: 'shield-checkmark-outline' as const, label: 'Signed releases' },
    { icon: 'speedometer-outline' as const, label: 'Guided flashing' },
    { icon: 'refresh-circle-outline' as const, label: 'Recovery ready' },
];

export const WelcomeScreen = ({ navigation }: any) => {
    const heroOpacity = useRef(new Animated.Value(0)).current;
    const heroTranslate = useRef(new Animated.Value(24)).current;
    const cardsOpacity = useRef(new Animated.Value(0)).current;
    const cardsTranslate = useRef(new Animated.Value(18)).current;
    const actionsOpacity = useRef(new Animated.Value(0)).current;
    const actionsTranslate = useRef(new Animated.Value(18)).current;

    useEffect(() => {
        Animated.sequence([
            Animated.parallel([
                Animated.timing(heroOpacity, {
                    toValue: 1,
                    duration: Motion.hero,
                    easing: Easing.out(Easing.cubic),
                    useNativeDriver: true,
                }),
                Animated.timing(heroTranslate, {
                    toValue: 0,
                    duration: Motion.hero,
                    easing: Easing.out(Easing.cubic),
                    useNativeDriver: true,
                }),
            ]),
            Animated.parallel([
                Animated.timing(cardsOpacity, {
                    toValue: 1,
                    duration: Motion.panel,
                    useNativeDriver: true,
                }),
                Animated.timing(cardsTranslate, {
                    toValue: 0,
                    duration: Motion.panel,
                    easing: Easing.out(Easing.cubic),
                    useNativeDriver: true,
                }),
            ]),
            Animated.parallel([
                Animated.timing(actionsOpacity, {
                    toValue: 1,
                    duration: Motion.panel,
                    useNativeDriver: true,
                }),
                Animated.timing(actionsTranslate, {
                    toValue: 0,
                    duration: Motion.panel,
                    easing: Easing.out(Easing.cubic),
                    useNativeDriver: true,
                }),
            ]),
        ]).start();
    }, [actionsOpacity, actionsTranslate, cardsOpacity, cardsTranslate, heroOpacity, heroTranslate]);

    return (
        <AppScreen scroll contentContainerStyle={styles.content}>
            <Animated.View style={[styles.hero, { opacity: heroOpacity, transform: [{ translateY: heroTranslate }] }]}>
                <View style={styles.badge}>
                    <Ionicons name="sparkles-outline" size={14} color={Colors.info} />
                    <Text style={styles.badgeText}>RevSync Mobile</Text>
                </View>

                <View style={styles.markWrap}>
                    <View style={styles.logoCircle}>
                        <Ionicons name="speedometer" size={34} color={Colors.primary} />
                    </View>
                </View>

                <Text style={styles.title}>A guided control layer for safe ECU flashing.</Text>
                <Text style={styles.subtitle}>
                    Browse verified tunes, confirm compatibility, create backups, and move through flashing with explicit gates instead of guesswork.
                </Text>
            </Animated.View>

            <Animated.View style={{ opacity: cardsOpacity, transform: [{ translateY: cardsTranslate }] }}>
                <GlassCard style={styles.heroCard}>
                    <View style={styles.heroCardHeader}>
                        <Text style={styles.heroCardKicker}>Operator Confidence</Text>
                        <Text style={styles.heroCardState}>Ready</Text>
                    </View>
                    <View style={styles.heroCardGrid}>
                        <View style={styles.heroMetric}>
                            <Text style={styles.heroMetricLabel}>Stage</Text>
                            <Text style={styles.heroMetricValue}>Verification first</Text>
                        </View>
                        <View style={styles.heroMetric}>
                            <Text style={styles.heroMetricLabel}>Policy</Text>
                            <Text style={styles.heroMetricValue}>Backup required</Text>
                        </View>
                        <View style={styles.heroMetric}>
                            <Text style={styles.heroMetricLabel}>Release</Text>
                            <Text style={styles.heroMetricValue}>Signed package</Text>
                        </View>
                    </View>
                </GlassCard>

                <View style={styles.features}>
                    {FEATURES.map((feature) => (
                        <GlassCard key={feature.label} style={styles.featureCard}>
                            <View style={styles.featureIcon}>
                                <Ionicons name={feature.icon} size={20} color={Colors.info} />
                            </View>
                            <Text style={styles.featureLabel}>{feature.label}</Text>
                        </GlassCard>
                    ))}
                </View>
            </Animated.View>

            <Animated.View style={[styles.actions, { opacity: actionsOpacity, transform: [{ translateY: actionsTranslate }] }]}>
                <Pressable style={styles.primaryButton} onPress={() => navigation.navigate('SignIn')}>
                    <Text style={styles.primaryButtonText}>Get Started</Text>
                </Pressable>
                <Pressable style={styles.secondaryButton} onPress={() => navigation.navigate('SignUp')}>
                    <Text style={styles.secondaryButtonText}>Create Account</Text>
                </Pressable>
                <Text style={styles.terms}>By continuing, you accept the legal and safety steps required before any flash operation.</Text>
            </Animated.View>
        </AppScreen>
    );
};

const styles = StyleSheet.create({
    content: {
        paddingHorizontal: Spacing.lg,
        paddingTop: Spacing.xxl,
        paddingBottom: 40,
    },
    hero: {
        alignItems: 'center',
        paddingTop: Spacing.xl,
    },
    badge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: Colors.strokeSoft,
        backgroundColor: 'rgba(255,255,255,0.04)',
        paddingHorizontal: 12,
        paddingVertical: 8,
    },
    badgeText: {
        fontSize: 12,
        fontWeight: '700',
        color: Colors.textSecondary,
    },
    markWrap: {
        marginTop: 22,
        marginBottom: 18,
    },
    logoCircle: {
        width: 92,
        height: 92,
        borderRadius: 46,
        backgroundColor: 'rgba(18,25,37,0.92)',
        borderWidth: 1,
        borderColor: Colors.strokeStrong,
        alignItems: 'center',
        justifyContent: 'center',
    },
    title: {
        ...Typography.display,
        textAlign: 'center',
        maxWidth: 320,
    },
    subtitle: {
        ...Typography.body,
        textAlign: 'center',
        maxWidth: 330,
        marginTop: 12,
    },
    heroCard: {
        marginTop: Spacing.xxl,
        padding: Spacing.xl,
    },
    heroCardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 14,
    },
    heroCardKicker: {
        ...Typography.dataLabel,
        color: Colors.accent,
    },
    heroCardState: {
        fontSize: 11,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 1,
        color: Colors.success,
    },
    heroCardGrid: {
        gap: 10,
    },
    heroMetric: {
        borderRadius: Layout.radiusMd,
        borderWidth: 1,
        borderColor: Colors.strokeSoft,
        backgroundColor: 'rgba(255,255,255,0.03)',
        padding: 14,
    },
    heroMetricLabel: {
        ...Typography.dataLabel,
    },
    heroMetricValue: {
        marginTop: 6,
        fontSize: 15,
        fontWeight: '700',
        color: Colors.textPrimary,
    },
    features: {
        flexDirection: 'row',
        gap: 10,
        marginTop: 12,
    },
    featureCard: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: 18,
        paddingHorizontal: 10,
    },
    featureIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: Colors.accentSoft,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 10,
    },
    featureLabel: {
        fontSize: 12,
        fontWeight: '700',
        textAlign: 'center',
        color: Colors.textSecondary,
    },
    actions: {
        marginTop: Spacing.xxl,
        gap: 12,
    },
    primaryButton: {
        minHeight: 52,
        borderRadius: Layout.buttonRadius,
        backgroundColor: Colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,122,147,0.18)',
    },
    primaryButtonText: {
        fontSize: 15,
        fontWeight: '800',
        color: Colors.white,
    },
    secondaryButton: {
        minHeight: 52,
        borderRadius: Layout.buttonRadius,
        backgroundColor: 'rgba(255,255,255,0.03)',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: Colors.strokeSoft,
    },
    secondaryButtonText: {
        fontSize: 15,
        fontWeight: '700',
        color: Colors.textPrimary,
    },
    terms: {
        ...Typography.small,
        textAlign: 'center',
        lineHeight: 18,
        color: Colors.textTertiary,
        marginTop: 6,
    },
});
