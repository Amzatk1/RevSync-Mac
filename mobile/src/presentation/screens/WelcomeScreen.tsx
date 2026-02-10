import React, { useEffect, useRef } from 'react';
import {
    View, Text, StyleSheet, Animated, Easing,
    Image, StatusBar, Platform, ScrollView, useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Theme } from '../theme';
import { PrimaryButton, SecondaryButton } from '../components/SharedComponents';
import { Ionicons } from '@expo/vector-icons';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const heroImage = require('../../../assets/welcome-hero.png');

const VALUE_PROPS = [
    { icon: 'speedometer-outline' as const, title: 'Browse Tunes', desc: 'Verified performance tunes for your bike' },
    { icon: 'shield-checkmark-outline' as const, title: 'Flash Safely', desc: 'Industry-leading safety checks protect your ECU' },
    { icon: 'flash-outline' as const, title: 'Zero Hassle', desc: 'OBD → Backup → Flash → Ride. That simple.' },
];

export const WelcomeScreen = ({ navigation }: any) => {
    const { height } = useWindowDimensions();
    const isCompactHeight = height < 760;
    const heroHeight = isCompactHeight ? height * 0.33 : height * 0.38;
    const contentTopPadding = isCompactHeight ? heroHeight * 0.8 : heroHeight * 0.84;

    // Animations
    const heroOpacity = useRef(new Animated.Value(0)).current;
    const heroScale = useRef(new Animated.Value(1.1)).current;
    const logoScale = useRef(new Animated.Value(0)).current;
    const logoGlow = useRef(new Animated.Value(0.3)).current;
    const titleOpacity = useRef(new Animated.Value(0)).current;
    const titleTranslateY = useRef(new Animated.Value(24)).current;
    const subtitleOpacity = useRef(new Animated.Value(0)).current;
    const cardAnims = VALUE_PROPS.map(() => ({
        opacity: useRef(new Animated.Value(0)).current,
        translateX: useRef(new Animated.Value(-30)).current,
    }));
    const buttonsOpacity = useRef(new Animated.Value(0)).current;
    const buttonsTranslateY = useRef(new Animated.Value(30)).current;
    const dividerWidth = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.sequence([
            // Hero image ken burns in
            Animated.parallel([
                Animated.timing(heroOpacity, { toValue: 1, duration: 800, useNativeDriver: true }),
                Animated.timing(heroScale, { toValue: 1, duration: 1200, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
            ]),
            // Logo spring in
            Animated.spring(logoScale, { toValue: 1, friction: 5, tension: 50, useNativeDriver: true }),
            // Title slide up
            Animated.parallel([
                Animated.timing(titleOpacity, { toValue: 1, duration: 350, useNativeDriver: true }),
                Animated.timing(titleTranslateY, { toValue: 0, duration: 350, easing: Easing.out(Easing.back(1.5)), useNativeDriver: true }),
            ]),
            // Subtitle
            Animated.timing(subtitleOpacity, { toValue: 1, duration: 250, useNativeDriver: true }),
            // Divider
            Animated.timing(dividerWidth, { toValue: 1, duration: 300, useNativeDriver: false }),
            // Cards stagger  
            Animated.stagger(120, cardAnims.map(a =>
                Animated.parallel([
                    Animated.timing(a.opacity, { toValue: 1, duration: 300, useNativeDriver: true }),
                    Animated.timing(a.translateX, { toValue: 0, duration: 300, easing: Easing.out(Easing.back(1.3)), useNativeDriver: true }),
                ])
            )),
            // Buttons
            Animated.parallel([
                Animated.timing(buttonsOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
                Animated.timing(buttonsTranslateY, { toValue: 0, duration: 300, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
            ]),
        ]).start();

        // Continuous glow pulse
        Animated.loop(
            Animated.sequence([
                Animated.timing(logoGlow, { toValue: 0.9, duration: 2000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
                Animated.timing(logoGlow, { toValue: 0.3, duration: 2000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
            ])
        ).start();
    }, []);

    return (
        <SafeAreaView style={styles.container} edges={[ 'top' ]}>
            <StatusBar barStyle="light-content" />
            <LinearGradient
                colors={['#09090B', '#0F0F11', '#1A0A10', '#09090B']}
                style={StyleSheet.absoluteFillObject}
                start={{ x: 0.5, y: 0 }}
                end={{ x: 0.5, y: 1 }}
            />

            {/* Hero Image with gradient overlay */}
            <Animated.View style={[styles.heroContainer, { height: heroHeight, opacity: heroOpacity, transform: [{ scale: heroScale }] }]}> 
                <Image source={heroImage} style={styles.heroImage} resizeMode="cover" />
                <LinearGradient
                    colors={['transparent', 'rgba(9,9,11,0.6)', '#09090B']}
                    style={styles.heroOverlay}
                />
            </Animated.View>

            {/* Background glow */}
            <Animated.View style={[styles.glowCircle, { top: heroHeight * 0.73, opacity: logoGlow }]} />

            {/* Content */}
            <ScrollView
                contentContainerStyle={[styles.content, { paddingTop: contentTopPadding }]}
                showsVerticalScrollIndicator={false}
                bounces={false}
            >
                {/* Logo */}
                <Animated.View style={[styles.logoContainer, { transform: [{ scale: logoScale }] }]}> 
                    <View style={styles.logoRing}>
                        <Ionicons name="speedometer" size={48} color={Theme.Colors.primary} />
                    </View>
                </Animated.View>

                {/* Title */}
                <Animated.Text style={[styles.title, isCompactHeight && styles.titleCompact, { opacity: titleOpacity, transform: [{ translateY: titleTranslateY }] }]}> 
                    RevSync
                </Animated.Text>

                {/* Subtitle */}
                <Animated.Text style={[styles.subtitle, { opacity: subtitleOpacity }]}> 
                    Unlock your ride's true potential
                </Animated.Text>

                {/* Animated Divider */}
                <View style={styles.dividerTrack}>
                    <Animated.View style={[styles.dividerFill, { width: dividerWidth.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) }]} />
                </View>

                {/* Value Props */}
                <View style={styles.propsContainer}>
                    {VALUE_PROPS.map((prop, i) => (
                        <Animated.View
                            key={prop.title}
                            style={[styles.propCard, { opacity: cardAnims[i].opacity, transform: [{ translateX: cardAnims[i].translateX }] }]}
                        >
                            <View style={styles.propIconBox}>
                                <Ionicons name={prop.icon} size={20} color={Theme.Colors.primary} />
                            </View>
                            <View style={styles.propText}>
                                <Text style={styles.propTitle}>{prop.title}</Text>
                                <Text style={styles.propDesc}>{prop.desc}</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.15)" />
                        </Animated.View>
                    ))}
                </View>

                {/* Buttons */}
                <Animated.View style={[styles.buttonContainer, { opacity: buttonsOpacity, transform: [{ translateY: buttonsTranslateY }] }]}> 
                    <PrimaryButton
                        title="Get Started"
                        onPress={() => navigation.navigate('SignIn')}
                        style={styles.primaryBtn}
                        textStyle={styles.primaryBtnText}
                        icon="arrow-forward"
                    />
                    <SecondaryButton
                        title="Create Account"
                        onPress={() => navigation.navigate('SignUp')}
                        style={styles.secondaryBtn}
                    />
                </Animated.View>
            </ScrollView>

            {/* Version tag */}
            <Text style={styles.version}>v1.0.0</Text>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#09090B',
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
    glowCircle: {
        position: 'absolute',
        alignSelf: 'center',
        width: 220,
        height: 220,
        borderRadius: 110,
        backgroundColor: Theme.Colors.primary,
        opacity: 0.06,
    },
    content: {
        paddingBottom: Platform.OS === 'ios' ? 120 : 96,
        paddingHorizontal: 24,
        alignItems: 'center',
    },
    logoContainer: {
        marginBottom: 12,
        ...Theme.Shadows.lg,
        shadowColor: Theme.Colors.primary,
    },
    logoRing: {
        width: 88,
        height: 88,
        borderRadius: 44,
        borderWidth: 2,
        borderColor: 'rgba(225, 29, 72, 0.45)',
        backgroundColor: 'rgba(225, 29, 72, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    title: {
        fontSize: 44,
        fontWeight: '800',
        color: '#FAFAFA',
        letterSpacing: -1,
        marginBottom: 4,
        textShadowColor: 'rgba(225, 29, 72, 0.4)',
        textShadowOffset: { width: 0, height: 4 },
        textShadowRadius: 20,
    },
    titleCompact: {
        fontSize: 38,
    },
    subtitle: {
        fontSize: 16,
        color: '#A1A1AA',
        textAlign: 'center',
        marginBottom: 16,
        letterSpacing: 0.5,
    },
    dividerTrack: {
        width: 48,
        height: 3,
        backgroundColor: 'rgba(255,255,255,0.04)',
        borderRadius: 2,
        marginBottom: 20,
        overflow: 'hidden',
    },
    dividerFill: {
        height: '100%',
        backgroundColor: Theme.Colors.primary,
        borderRadius: 2,
    },
    propsContainer: {
        width: '100%',
        gap: 10,
        marginBottom: 28,
    },
    propCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.035)',
        borderRadius: 14,
        paddingVertical: 12,
        paddingHorizontal: 14,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.06)',
    },
    propIconBox: {
        width: 40,
        height: 40,
        borderRadius: 10,
        backgroundColor: 'rgba(225, 29, 72, 0.12)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    propText: {
        flex: 1,
    },
    propTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#FAFAFA',
        marginBottom: 1,
    },
    propDesc: {
        fontSize: 12,
        color: '#71717A',
        lineHeight: 16,
    },
    buttonContainer: {
        width: '100%',
        gap: 10,
        alignItems: 'center',
    },
    primaryBtn: {
        width: '100%',
        paddingVertical: 16,
        borderRadius: 28,
        ...Theme.Shadows.lg,
        shadowColor: Theme.Colors.primary,
    },
    primaryBtnText: {
        fontSize: 16,
        fontWeight: '700',
        letterSpacing: 0.6,
        textTransform: 'uppercase',
    },
    secondaryBtn: {
        width: '100%',
        paddingVertical: 16,
        borderRadius: 28,
        borderColor: 'rgba(255,255,255,0.12)',
    },
    version: {
        position: 'absolute',
        bottom: Platform.OS === 'ios' ? 40 : 20,
        alignSelf: 'center',
        color: '#3F3F46',
        fontSize: 11,
        letterSpacing: 0.3,
    },
});
