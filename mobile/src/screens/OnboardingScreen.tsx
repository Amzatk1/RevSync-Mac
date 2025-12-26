import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
import { theme } from '../styles/theme';
import { useAuth } from '../auth/context/AuthContext';
import { userService } from '../services/userService';

export default function OnboardingScreen() {
    const navigation = useNavigation();
    const { user, refreshProfile } = useAuth();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);

    // Form State
    const [bikeName, setBikeName] = useState('');
    const [ridingStyle, setRidingStyle] = useState<'street' | 'track' | 'touring' | null>(null);

    const handleFinish = async () => {
        if (!user) return;
        setLoading(true);

        // Save to Supabase
        // In a real app, we'd save the bike details to a 'garage' table too
        const { error } = await userService.completeOnboarding(user.id);

        if (!error) {
            await refreshProfile(); // This will trigger the AppNavigator to switch to MainTabs
        } else {
            console.error(error);
            // Show error toast
        }
        setLoading(false);
    };

    const renderStep1 = () => (
        <View>
            <Text style={styles.stepTitle}>What do you ride?</Text>
            <Text style={styles.stepDescription}>
                We'll personalize your experience based on your machine.
            </Text>

            <Input
                label="Motorcycle Model"
                placeholder="e.g. 2024 Yamaha R1"
                value={bikeName}
                onChangeText={setBikeName}
                autoFocus
            />

            <Button
                title="Next"
                onPress={() => setStep(2)}
                disabled={!bikeName}
                style={styles.nextButton}
            />
        </View>
    );

    const renderStep2 = () => (
        <View>
            <Text style={styles.stepTitle}>How do you ride?</Text>
            <Text style={styles.stepDescription}>
                Select your primary riding style for better tune recommendations.
            </Text>

            <View style={styles.optionsContainer}>
                {['street', 'track', 'touring'].map((style) => (
                    <TouchableOpacity
                        key={style}
                        style={[
                            styles.optionCard,
                            ridingStyle === style && styles.optionCardSelected
                        ]}
                        onPress={() => setRidingStyle(style as any)}
                        activeOpacity={0.8}
                    >
                        <Text style={[
                            styles.optionTitle,
                            ridingStyle === style && styles.optionTitleSelected
                        ]}>
                            {style.charAt(0).toUpperCase() + style.slice(1)}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            <View style={styles.buttonRow}>
                <Button
                    title="Back"
                    variant="ghost"
                    onPress={() => setStep(1)}
                    style={{ flex: 1 }}
                />
                <Button
                    title="Next"
                    onPress={() => setStep(3)}
                    disabled={!ridingStyle}
                    style={{ flex: 1 }}
                />
            </View>
        </View>
    );

    const renderStep3 = () => (
        <View style={styles.centerContent}>
            <View style={styles.successIcon}>
                <Text style={{ fontSize: 40 }}>🎉</Text>
            </View>

            <Text style={styles.stepTitle}>You're All Set!</Text>
            <Text style={styles.stepDescription}>
                Your {bikeName} is ready to be tuned. Let's get you to the garage.
            </Text>

            <Button
                title="Enter Garage"
                size="lg"
                onPress={handleFinish}
                loading={loading}
                style={styles.finishButton}
            />
        </View>
    );

    return (
        <View style={styles.container}>
            <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${(step / 3) * 100}%` }]} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                <Card style={styles.card}>
                    {step === 1 && renderStep1()}
                    {step === 2 && renderStep2()}
                    {step === 3 && renderStep3()}
                </Card>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
        paddingTop: 60,
    },
    progressBar: {
        height: 4,
        backgroundColor: theme.colors.surfaceHighlight,
        marginHorizontal: 20,
        borderRadius: 2,
        marginBottom: 20,
    },
    progressFill: {
        height: '100%',
        backgroundColor: theme.colors.primary,
        borderRadius: 2,
    },
    scrollContent: {
        padding: 20,
    },
    card: {
        minHeight: 400,
        justifyContent: 'center',
    },
    stepTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: theme.colors.text,
        marginBottom: 8,
        textAlign: 'center',
    },
    stepDescription: {
        fontSize: 16,
        color: theme.colors.textSecondary,
        textAlign: 'center',
        marginBottom: 32,
    },
    nextButton: {
        marginTop: 16,
    },
    optionsContainer: {
        gap: 12,
        marginBottom: 24,
    },
    optionCard: {
        padding: 20,
        borderRadius: theme.borderRadius.m,
        borderWidth: 1,
        borderColor: theme.colors.border,
        backgroundColor: theme.colors.surface,
        alignItems: 'center',
    },
    optionCardSelected: {
        borderColor: theme.colors.primary,
        backgroundColor: 'rgba(255, 59, 48, 0.1)',
    },
    optionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: theme.colors.text,
    },
    optionTitleSelected: {
        color: theme.colors.primary,
    },
    buttonRow: {
        flexDirection: 'row',
        gap: 12,
    },
    centerContent: {
        alignItems: 'center',
        paddingVertical: 40,
    },
    successIcon: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: theme.colors.surfaceHighlight,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
    },
    finishButton: {
        width: '100%',
        marginTop: 24,
        ...theme.shadows.glow,
    },
});
