import React from 'react';
import { View, Text, StyleSheet, ImageBackground } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Button } from '../components/ui/Button';
import { theme } from '../styles/theme';
import { LinearGradient } from 'expo-linear-gradient'; // Assuming expo-linear-gradient is available or we simulate it

export default function WelcomeOnboardingScreen() {
    const navigation = useNavigation();

    return (
        <View style={styles.container}>
            {/* Background Image Placeholder - In real app use a high-res bike image */}
            <View style={styles.backgroundImage} />

            {/* Gradient Overlay */}
            <View style={styles.overlay} />

            <View style={styles.content}>
                <View style={styles.header}>
                    <Text style={styles.brand}>RevSync</Text>
                    <Text style={styles.tagline}>Unlock Your Bike's True Potential</Text>
                </View>

                <View style={styles.footer}>
                    <Text style={styles.description}>
                        The world's first AI-powered community for motorcycle tuning.
                        Flash ECUs, track performance, and share your build.
                    </Text>

                    <Button
                        title="Get Started"
                        size="lg"
                        onPress={() => navigation.navigate('OnboardingSteps' as never)}
                        style={styles.button}
                    />

                    <Button
                        title="I already have an account"
                        variant="ghost"
                        onPress={() => navigation.navigate('Login' as never)}
                    />
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    backgroundImage: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: '#1a1a1a', // Fallback
        // Add Image component here
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.6)', // Darken background
    },
    content: {
        flex: 1,
        justifyContent: 'space-between',
        padding: theme.spacing.xl,
        paddingTop: 80,
        paddingBottom: 60,
    },
    header: {
        alignItems: 'center',
    },
    brand: {
        fontSize: 48,
        fontWeight: '800',
        color: theme.colors.primary,
        letterSpacing: -1,
        marginBottom: 8,
    },
    tagline: {
        fontSize: 20,
        color: theme.colors.text,
        fontWeight: '500',
        textAlign: 'center',
    },
    footer: {
        gap: 16,
    },
    description: {
        fontSize: 16,
        color: theme.colors.textSecondary,
        textAlign: 'center',
        marginBottom: 24,
        lineHeight: 24,
    },
    button: {
        width: '100%',
        ...theme.shadows.glow,
    },
});
