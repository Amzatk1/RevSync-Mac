import React, { useEffect, useRef } from 'react';
import {
    View, Text, StyleSheet, Animated, Easing,
    Image, StatusBar, Platform, Dimensions,
    TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');
const HERO_HEIGHT = height * 0.38;

// Brand colors matching the HTML design
const C = {
    primary: '#ea103c',
    primaryGlow: 'rgba(234, 16, 60, 0.60)',
    bg: '#0f0f0f',
    surface: '#18181b',
    card: '#232326',
    neutral300: '#d4d4d8',
    neutral400: '#a1a1aa',
    neutral500: '#71717a',
    white: '#ffffff',
    border: 'rgba(255,255,255,0.05)',
};

const heroImage = require('../../../assets/welcome-hero.png');

const FEATURES = [
    { icon: 'speedometer-outline' as const, label: 'Performance' },
    { icon: 'shield-checkmark-outline' as const, label: 'Safety' },
    { icon: 'analytics-outline' as const, label: 'Analytics' },
];

export const WelcomeScreen = ({ navigation }: any) => {
    // --- Animations ---
    const heroOpacity = useRef(new Animated.Value(0)).current;
    const heroScale = useRef(new Animated.Value(1.08)).current;
    const iconScale = useRef(new Animated.Value(0)).current;
    const iconGlow = useRef(new Animated.Value(0.3)).current;
    const titleOpacity = useRef(new Animated.Value(0)).current;
    const titleTranslateY = useRef(new Animated.Value(20)).current;
    const subtitleOpacity = useRef(new Animated.Value(0)).current;
    const cardAnims = FEATURES.map(() => ({
        opacity: useRef(new Animated.Value(0)).current,
        scale: useRef(new Animated.Value(0.85)).current,
    }));
    const buttonsOpacity = useRef(new Animated.Value(0)).current;
    const buttonsTranslateY = useRef(new Animated.Value(24)).current;
    const termsOpacity = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.sequence([
            // Hero fade in with subtle zoom
            Animated.parallel([
                Animated.timing(heroOpacity, { toValue: 1, duration: 700, useNativeDriver: true }),
                Animated.timing(heroScale, { toValue: 1, duration: 1100, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
            ]),
            // Icon spring
            Animated.spring(iconScale, { toValue: 1, friction: 5, tension: 50, useNativeDriver: true }),
            // Title
            Animated.parallel([
                Animated.timing(titleOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
                Animated.timing(titleTranslateY, { toValue: 0, duration: 300, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
            ]),
            // Subtitle
            Animated.timing(subtitleOpacity, { toValue: 1, duration: 250, useNativeDriver: true }),
            // Cards stagger
            Animated.stagger(100, cardAnims.map(a =>
                Animated.parallel([
                    Animated.timing(a.opacity, { toValue: 1, duration: 300, useNativeDriver: true }),
                    Animated.spring(a.scale, { toValue: 1, friction: 6, tension: 60, useNativeDriver: true }),
                ])
            )),
            // Buttons
            Animated.parallel([
                Animated.timing(buttonsOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
                Animated.timing(buttonsTranslateY, { toValue: 0, duration: 300, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
            ]),
            // Terms
            Animated.timing(termsOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
        ]).start();

        // Continuous glow pulse on icon
        Animated.loop(
            Animated.sequence([
                Animated.timing(iconGlow, { toValue: 0.7, duration: 2000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
                Animated.timing(iconGlow, { toValue: 0.3, duration: 2000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
            ])
        ).start();
    }, []);

    return (
        <View style={styles.root}>
            <StatusBar barStyle="light-content" />

            {/* ─── Hero Image ─── */}
            <Animated.View style={[styles.heroContainer, { opacity: heroOpacity, transform: [{ scale: heroScale }] }]}>
                <Image source={heroImage} style={styles.heroImage} resizeMode="cover" />
                <LinearGradient
                    colors={['transparent', 'rgba(15,15,15,0.4)', 'rgba(15,15,15,1)', C.bg]}
                    locations={[0, 0.5, 0.9, 1]}
                    style={StyleSheet.absoluteFillObject}
                />
            </Animated.View>

            {/* ─── Centered Icon with Glow ─── */}
            <View style={styles.iconAnchor}>
                <Animated.View style={[styles.glowOrb, { opacity: iconGlow }]} />
                <Animated.View style={[styles.iconCircle, { transform: [{ scale: iconScale }] }]}>
                    <Ionicons name="speedometer" size={40} color={C.primary} />
                </Animated.View>
            </View>

            {/* ─── Content ─── */}
            <View style={styles.content}>
                {/* Title + Subtitle */}
                <View style={styles.titleBlock}>
                    <Animated.Text style={[styles.title, { opacity: titleOpacity, transform: [{ translateY: titleTranslateY }] }]}>
                        RevSync
                    </Animated.Text>
                    <Animated.Text style={[styles.subtitle, { opacity: subtitleOpacity }]}>
                        Unlock your ride's true potential
                    </Animated.Text>
                </View>

                {/* ─── Feature Cards Grid ─── */}
                <View style={styles.grid}>
                    {FEATURES.map((feat, i) => (
                        <Animated.View
                            key={feat.label}
                            style={[
                                styles.featureCard,
                                { opacity: cardAnims[i].opacity, transform: [{ scale: cardAnims[i].scale }] },
                            ]}
                        >
                            <View style={styles.featureIconCircle}>
                                <Ionicons name={feat.icon} size={24} color={C.primary} />
                            </View>
                            <Text style={styles.featureLabel}>{feat.label}</Text>
                        </Animated.View>
                    ))}
                </View>

                {/* ─── Buttons ─── */}
                <Animated.View style={[styles.buttonGroup, { opacity: buttonsOpacity, transform: [{ translateY: buttonsTranslateY }] }]}>
                    <TouchableOpacity
                        style={styles.primaryBtn}
                        activeOpacity={0.85}
                        onPress={() => navigation.navigate('SignIn')}
                    >
                        <Text style={styles.primaryBtnText}>Get Started</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.secondaryBtn}
                        activeOpacity={0.7}
                        onPress={() => navigation.navigate('SignUp')}
                    >
                        <Text style={styles.secondaryBtnText}>Create Account</Text>
                    </TouchableOpacity>
                </Animated.View>

                {/* Terms */}
                <Animated.Text style={[styles.terms, { opacity: termsOpacity }]}>
                    By continuing you agree to our Terms of Service
                </Animated.Text>
            </View>
        </View>
    );
};

const CARD_SIZE = (width - 48 - 24) / 3; // 24px padding each side + 12px gaps

const styles = StyleSheet.create({
    root: {
        flex: 1,
        backgroundColor: C.bg,
    },

    // ── Hero ──
    heroContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: HERO_HEIGHT,
    },
    heroImage: {
        width: '100%',
        height: '100%',
    },

    // ── Centered Icon ──
    iconAnchor: {
        position: 'absolute',
        top: HERO_HEIGHT - 40,
        left: 0,
        right: 0,
        alignItems: 'center',
        zIndex: 20,
    },
    glowOrb: {
        position: 'absolute',
        width: 128,
        height: 128,
        borderRadius: 64,
        backgroundColor: C.primary,
        // blur is simulated via shadow on iOS
        shadowColor: C.primary,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 50,
    },
    iconCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: C.surface,
        borderWidth: 2,
        borderColor: 'rgba(234,16,60,0.30)',
        alignItems: 'center',
        justifyContent: 'center',
        // glow shadow
        shadowColor: C.primary,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 20,
        elevation: 12,
    },

    // ── Content ──
    content: {
        flex: 1,
        paddingTop: HERO_HEIGHT + 24,
        paddingHorizontal: 24,
        paddingBottom: Platform.OS === 'ios' ? 36 : 24,
        justifyContent: 'flex-start',
    },
    titleBlock: {
        alignItems: 'center',
        marginBottom: 32,
    },
    title: {
        fontSize: 36,
        fontWeight: '800',
        color: C.white,
        letterSpacing: -0.5,
    },
    subtitle: {
        fontSize: 18,
        fontWeight: '500',
        color: C.neutral400,
        marginTop: 6,
    },

    // ── Feature Grid ──
    grid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 12,
        marginBottom: 'auto' as any,
    },
    featureCard: {
        width: CARD_SIZE,
        aspectRatio: 1,
        backgroundColor: C.card,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: C.border,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
    },
    featureIconCircle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.05)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    featureLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: C.neutral300,
    },

    // ── Buttons ──
    buttonGroup: {
        gap: 12,
        marginTop: 32,
    },
    primaryBtn: {
        width: '100%',
        paddingVertical: 16,
        borderRadius: 14,
        backgroundColor: C.primary,
        alignItems: 'center',
        justifyContent: 'center',
        // subtle glow
        shadowColor: C.primary,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 6,
    },
    primaryBtnText: {
        fontSize: 18,
        fontWeight: '700',
        color: C.white,
    },
    secondaryBtn: {
        width: '100%',
        paddingVertical: 16,
        borderRadius: 14,
        backgroundColor: C.card,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.10)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    secondaryBtnText: {
        fontSize: 18,
        fontWeight: '600',
        color: C.white,
    },

    // ── Terms ──
    terms: {
        textAlign: 'center',
        fontSize: 11,
        color: C.neutral500,
        marginTop: 20,
    },
});
