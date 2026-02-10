import React, { useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Animated,
    Easing,
    Image,
    StatusBar,
    Platform,
    ScrollView,
    useWindowDimensions,
    TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Theme } from '../theme';
import { Ionicons } from '@expo/vector-icons';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const heroImage = require('../../../assets/welcome-hero.png');

const FEATURE_CARDS = [
    { icon: 'options-outline' as const, title: 'Performance' },
    { icon: 'shield-checkmark-outline' as const, title: 'Safety' },
    { icon: 'stats-chart-outline' as const, title: 'Analytics' },
];

export const WelcomeScreen = ({ navigation }: any) => {
    const { height } = useWindowDimensions();
    const compact = height < 760;
    const heroHeight = compact ? height * 0.34 : height * 0.38;
    const contentTopPadding = compact ? heroHeight * 0.75 : heroHeight * 0.8;

    const heroOpacity = useRef(new Animated.Value(0)).current;
    const contentOpacity = useRef(new Animated.Value(0)).current;
    const contentTranslateY = useRef(new Animated.Value(18)).current;
    const glowOpacity = useRef(new Animated.Value(0.5)).current;

    useEffect(() => {
        Animated.sequence([
            Animated.timing(heroOpacity, {
                toValue: 1,
                duration: 700,
                easing: Easing.out(Easing.cubic),
                useNativeDriver: true,
            }),
            Animated.parallel([
                Animated.timing(contentOpacity, {
                    toValue: 1,
                    duration: 450,
                    useNativeDriver: true,
                }),
                Animated.timing(contentTranslateY, {
                    toValue: 0,
                    duration: 450,
                    easing: Easing.out(Easing.cubic),
                    useNativeDriver: true,
                }),
            ]),
        ]).start();

        Animated.loop(
            Animated.sequence([
                Animated.timing(glowOpacity, {
                    toValue: 0.9,
                    duration: 1800,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
                Animated.timing(glowOpacity, {
                    toValue: 0.45,
                    duration: 1800,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
            ])
        ).start();
    }, [contentOpacity, contentTranslateY, glowOpacity, heroOpacity]);

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <StatusBar barStyle="light-content" />

            <Animated.View style={[styles.heroContainer, { height: heroHeight, opacity: heroOpacity }]}> 
                <Image source={heroImage} style={styles.heroImage} resizeMode="cover" />
                <LinearGradient
                    colors={['rgba(15,15,15,0)', 'rgba(15,15,15,0.45)', '#0F0F10']}
                    locations={[0, 0.55, 1]}
                    style={styles.heroOverlay}
                />
            </Animated.View>

            <ScrollView
                contentContainerStyle={[styles.content, { paddingTop: contentTopPadding }]}
                bounces={false}
                showsVerticalScrollIndicator={false}
            >
                <Animated.View style={[styles.centerContent, { opacity: contentOpacity, transform: [{ translateY: contentTranslateY }] }]}> 
                    <View style={styles.logoStack}>
                        <Animated.View style={[styles.logoGlow, { opacity: glowOpacity }]} />
                        <View style={styles.logoRing}>
                            <Ionicons name="speedometer" size={40} color={Theme.Colors.primary} />
                        </View>
                    </View>

                    <Text style={[styles.title, compact && styles.titleCompact]}>RevSync</Text>
                    <Text style={styles.subtitle}>Unlock your ride’s true potential</Text>

                    <View style={styles.featureGrid}>
                        {FEATURE_CARDS.map(card => (
                            <View key={card.title} style={styles.featureCard}>
                                <View style={styles.featureIconWrap}>
                                    <Ionicons name={card.icon} size={24} color={Theme.Colors.primary} />
                                </View>
                                <Text style={styles.featureTitle}>{card.title}</Text>
                            </View>
                        ))}
                    </View>

                    <View style={styles.buttonsWrap}>
                        <TouchableOpacity
                            activeOpacity={0.88}
                            style={styles.primaryButton}
                            onPress={() => navigation.navigate('SignIn')}
                        >
                            <Text style={styles.primaryButtonText}>Get Started</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            activeOpacity={0.88}
                            style={styles.secondaryButton}
                            onPress={() => navigation.navigate('SignUp')}
                        >
                            <Text style={styles.secondaryButtonText}>Create Account</Text>
                        </TouchableOpacity>
                    </View>

                    <Text style={styles.footerText}>By continuing you agree to our Terms of Service</Text>
                </Animated.View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0F0F10',
    },
    heroContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
    },
    heroImage: {
        width: '100%',
        height: '100%',
    },
    heroOverlay: {
        ...StyleSheet.absoluteFillObject,
    },
    content: {
        paddingHorizontal: 22,
        paddingBottom: Platform.OS === 'ios' ? 42 : 28,
    },
    centerContent: {
        alignItems: 'center',
    },
    logoStack: {
        width: 150,
        height: 120,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 8,
    },
    logoGlow: {
        position: 'absolute',
        width: 130,
        height: 130,
        borderRadius: 65,
        backgroundColor: Theme.Colors.primary,
        opacity: 0.45,
        shadowColor: Theme.Colors.primary,
        shadowOpacity: 0.55,
        shadowRadius: 24,
        shadowOffset: { width: 0, height: 8 },
    },
    logoRing: {
        width: 84,
        height: 84,
        borderRadius: 42,
        backgroundColor: '#17171F',
        borderWidth: 1.5,
        borderColor: 'rgba(255,255,255,0.08)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    title: {
        color: '#FAFAFA',
        fontSize: 52,
        fontWeight: '800',
        letterSpacing: -1.2,
        marginBottom: 8,
    },
    titleCompact: {
        fontSize: 44,
    },
    subtitle: {
        color: '#9CA3AF',
        fontSize: 17,
        textAlign: 'center',
        marginBottom: 30,
    },
    featureGrid: {
        width: '100%',
        flexDirection: 'row',
        gap: 12,
        marginBottom: 34,
    },
    featureCard: {
        flex: 1,
        aspectRatio: 1,
        backgroundColor: '#232329',
        borderRadius: 18,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.06)',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
    },
    featureIconWrap: {
        width: 52,
        height: 52,
        borderRadius: 26,
        backgroundColor: 'rgba(255,255,255,0.04)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    featureTitle: {
        color: '#D4D4D8',
        fontSize: 14,
        fontWeight: '600',
    },
    buttonsWrap: {
        width: '100%',
        gap: 14,
        marginBottom: 28,
    },
    primaryButton: {
        height: 84,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: Theme.Colors.primary,
        shadowColor: Theme.Colors.primary,
        shadowOpacity: 0.38,
        shadowRadius: 20,
        shadowOffset: { width: 0, height: 8 },
        elevation: 8,
    },
    primaryButtonText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '800',
        letterSpacing: -0.8,
    },
    secondaryButton: {
        height: 84,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#232329',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.09)',
    },
    secondaryButtonText: {
        color: '#F4F4F5',
        fontSize: 18,
        fontWeight: '700',
        letterSpacing: -0.6,
    },
    footerText: {
        color: '#66656D',
        fontSize: 12,
        textAlign: 'center',
    },
});
