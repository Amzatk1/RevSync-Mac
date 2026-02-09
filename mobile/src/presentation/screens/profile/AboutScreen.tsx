import React from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Theme } from '../../theme';
import { Screen, Card } from '../../components/SharedComponents';
import { Ionicons } from '@expo/vector-icons';

export const AboutScreen = () => {
    const logoScale = React.useRef(new Animated.Value(0)).current;
    const contentOpacity = React.useRef(new Animated.Value(0)).current;

    React.useEffect(() => {
        Animated.sequence([
            Animated.spring(logoScale, { toValue: 1, friction: 5, tension: 50, useNativeDriver: true }),
            Animated.timing(contentOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
        ]).start();
    }, []);

    return (
        <Screen scroll>
            <LinearGradient
                colors={['rgba(225,29,72,0.08)', 'transparent']}
                style={styles.headerGradient}
            />

            <View style={styles.content}>
                {/* Logo */}
                <Animated.View style={[styles.logoContainer, { transform: [{ scale: logoScale }] }]}>
                    <View style={styles.logoRing}>
                        <Ionicons name="speedometer" size={48} color={Theme.Colors.primary} />
                    </View>
                    <Text style={styles.appName}>RevSync</Text>
                    <Text style={styles.tagline}>Unlock your ride's true potential</Text>
                    <View style={styles.versionBadge}>
                        <Text style={styles.versionText}>v1.0.0 • Build 102</Text>
                    </View>
                </Animated.View>

                <Animated.View style={{ opacity: contentOpacity }}>
                    {/* Mission */}
                    <Card style={styles.card}>
                        <View style={styles.cardHeader}>
                            <Ionicons name="rocket-outline" size={18} color={Theme.Colors.primary} />
                            <Text style={styles.sectionHeader}>Our Mission</Text>
                        </View>
                        <Text style={styles.text}>
                            RevSync empowers riders to take control of their machine's performance.
                            Safe, reliable, and powerful ECU tuning — from your pocket.
                        </Text>
                    </Card>

                    {/* Stats */}
                    <View style={styles.statsRow}>
                        <View style={styles.statCard}>
                            <Text style={styles.statNumber}>500+</Text>
                            <Text style={styles.statLabel}>Tunes Available</Text>
                        </View>
                        <View style={styles.statCard}>
                            <Text style={styles.statNumber}>99.9%</Text>
                            <Text style={styles.statLabel}>Flash Success</Text>
                        </View>
                        <View style={styles.statCard}>
                            <Text style={styles.statNumber}>100+</Text>
                            <Text style={styles.statLabel}>Bikes Supported</Text>
                        </View>
                    </View>

                    {/* Credits */}
                    <Card style={styles.card}>
                        <View style={styles.cardHeader}>
                            <Ionicons name="people-outline" size={18} color={Theme.Colors.primary} />
                            <Text style={styles.sectionHeader}>Credits</Text>
                        </View>
                        <View style={styles.creditRow}>
                            <Text style={styles.creditLabel}>Development</Text>
                            <Text style={styles.creditValue}>RevSync Engineering</Text>
                        </View>
                        <View style={[styles.creditRow, { borderBottomWidth: 0 }]}>
                            <Text style={styles.creditLabel}>Design System</Text>
                            <Text style={styles.creditValue}>Glow Up v2</Text>
                        </View>
                    </Card>

                    {/* Features */}
                    <Card style={styles.card}>
                        <View style={styles.cardHeader}>
                            <Ionicons name="shield-checkmark-outline" size={18} color={Theme.Colors.primary} />
                            <Text style={styles.sectionHeader}>Key Features</Text>
                        </View>
                        <FeatureRow icon="flash-outline" text="OTA ECU flashing over Bluetooth" />
                        <FeatureRow icon="shield-checkmark-outline" text="Multi-layer safety verification" />
                        <FeatureRow icon="save-outline" text="Automatic ECU backup & restore" />
                        <FeatureRow icon="speedometer-outline" text="500+ verified performance tunes" />
                        <FeatureRow icon="lock-closed-outline" text="End-to-end encryption" />
                    </Card>
                </Animated.View>

                <Text style={styles.copyright}>© 2026 RevSync. All rights reserved.</Text>
            </View>
        </Screen>
    );
};

const FeatureRow = ({ icon, text }: { icon: any; text: string }) => (
    <View style={styles.featureRow}>
        <Ionicons name={icon} size={16} color="#52525B" />
        <Text style={styles.featureText}>{text}</Text>
    </View>
);

const styles = StyleSheet.create({
    headerGradient: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 250,
    },
    content: {
        padding: 20,
    },
    logoContainer: {
        alignItems: 'center',
        marginBottom: 32,
        paddingTop: 24,
    },
    logoRing: {
        width: 88,
        height: 88,
        borderRadius: 44,
        borderWidth: 2,
        borderColor: 'rgba(225,29,72,0.45)',
        backgroundColor: 'rgba(225,29,72,0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#E11D48',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
    },
    appName: {
        fontSize: 36,
        fontWeight: '800',
        color: '#FAFAFA',
        marginTop: 16,
        letterSpacing: -0.5,
        textShadowColor: 'rgba(225,29,72,0.3)',
        textShadowOffset: { width: 0, height: 4 },
        textShadowRadius: 16,
    },
    tagline: {
        fontSize: 15,
        color: '#71717A',
        marginTop: 4,
    },
    versionBadge: {
        marginTop: 12,
        backgroundColor: 'rgba(255,255,255,0.04)',
        paddingHorizontal: 14,
        paddingVertical: 6,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.06)',
    },
    versionText: {
        fontSize: 12,
        color: '#52525B',
        fontWeight: '600',
    },
    card: {
        marginBottom: 12,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 10,
    },
    sectionHeader: {
        fontSize: 15,
        fontWeight: '700',
        color: '#FAFAFA',
    },
    text: {
        color: '#A1A1AA',
        lineHeight: 22,
        fontSize: 14,
    },
    statsRow: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 12,
    },
    statCard: {
        flex: 1,
        backgroundColor: 'rgba(255,255,255,0.035)',
        borderRadius: 14,
        padding: 14,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.06)',
    },
    statNumber: {
        fontSize: 20,
        fontWeight: '800',
        color: Theme.Colors.primary,
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 10,
        color: '#52525B',
        fontWeight: '600',
        textAlign: 'center',
    },
    creditRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.04)',
    },
    creditLabel: {
        color: '#71717A',
        fontSize: 14,
    },
    creditValue: {
        color: '#FAFAFA',
        fontWeight: '600',
        fontSize: 14,
    },
    featureRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        paddingVertical: 7,
    },
    featureText: {
        color: '#A1A1AA',
        fontSize: 14,
    },
    copyright: {
        textAlign: 'center',
        color: '#3F3F46',
        fontSize: 11,
        marginTop: 24,
        paddingBottom: 16,
    },
});
