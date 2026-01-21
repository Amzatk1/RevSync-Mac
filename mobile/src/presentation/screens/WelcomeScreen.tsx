import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Theme } from '../theme';
import { Screen, PrimaryButton, SecondaryButton } from '../components/SharedComponents';

export const WelcomeScreen = ({ navigation }: any) => {
    return (
        <Screen center>
            <View style={styles.content}>
                <Text style={styles.title}>RevSync</Text>
                <Text style={styles.subtitle}>Unlock your ride's potential.</Text>

                <View style={styles.buttonContainer}>
                    <PrimaryButton
                        title="Get Started"
                        onPress={() => navigation.navigate('SignIn')}
                        style={styles.button}
                        textStyle={styles.buttonText}
                    />
                    <SecondaryButton
                        title="Create Account"
                        onPress={() => navigation.navigate('SignUp')}
                        style={styles.secondaryButton}
                    />
                </View>
            </View>
        </Screen>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Theme.Colors.background,
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: Theme.Spacing.lg,
    },
    title: {
        ...Theme.Typography.h1,
        fontSize: 42, // Bigger hero text
        marginBottom: Theme.Spacing.sm,
        color: Theme.Colors.primary,
        textShadowColor: 'rgba(225, 29, 72, 0.4)',
        textShadowOffset: { width: 0, height: 4 },
        textShadowRadius: 10,
    },
    subtitle: {
        ...Theme.Typography.body,
        fontSize: 18,
        textAlign: 'center',
        maxWidth: 300,
        marginBottom: Theme.Spacing.xxl,
        color: Theme.Colors.textSecondary,
    },
    buttonContainer: {
        width: '100%',
        gap: 16,
        alignItems: 'center',
    },
    button: {
        width: '80%',
        backgroundColor: Theme.Colors.primary,
        paddingVertical: 18,
        borderRadius: 30, // Capsule shape
        ...Theme.Shadows.lg,
        shadowColor: Theme.Colors.primary, // Colored shadow
    },
    buttonText: {
        color: Theme.Colors.white,
        fontWeight: 'bold',
        fontSize: 18,
        letterSpacing: 1,
        textTransform: 'uppercase',
    },
    secondaryButton: {
        width: '80%',
        paddingVertical: 18,
        borderRadius: 30,
        borderColor: Theme.Colors.textSecondary,
    }
});
