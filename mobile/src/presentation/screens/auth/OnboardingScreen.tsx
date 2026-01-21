import React, { useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    StyleSheet,
    Dimensions,
    Image,
    Platform,
    Alert,
    ActivityIndicator
} from 'react-native';
import * as Haptics from "expo-haptics";
import { Theme } from '../../theme';
import { Screen, PrimaryButton } from '../../components/SharedComponents';
import { Ionicons } from '@expo/vector-icons';
import { useAppStore } from '../../store/useAppStore';

const { width } = Dimensions.get('window');

interface OnboardingData {
    currentStep: number;
    motorcycleType: string;
    skillLevel: string;
    ridingStyle: string;
    goals: string[];
}

export const OnboardingScreen = () => {
    const { completeOnboarding } = useAppStore();

    const [onboardingData, setOnboardingData] = useState<OnboardingData>({
        currentStep: 0,
        motorcycleType: "",
        skillLevel: "",
        ridingStyle: "",
        goals: [],
    });

    const [isCompleting, setIsCompleting] = useState(false);

    // Data Definitions
    const motorcycleTypes = [
        { id: "sport", name: "Sportbike", icon: "flag", description: "Supersport, track-focused" },
        { id: "cruiser", name: "Cruiser", icon: "sunny", description: "Relaxed, low-slung" },
        { id: "touring", name: "Touring", icon: "map", description: "Long-distance comfort" },
        { id: "adventure", name: "Adventure", icon: "compass", description: "On/off-road capability" },
        { id: "standard", name: "Standard", icon: "business", description: "Urban riding, comfortable" },
        { id: "other", name: "Other", icon: "ellipsis-horizontal", description: "Other types" },
    ];

    const skillLevels = [
        { id: "beginner", name: "Beginner", description: "New to riding or limited experience." },
        { id: "intermediate", name: "Intermediate", description: "Comfortable with basic skills." },
        { id: "advanced", name: "Advanced", description: "Experienced rider with high confidence." },
    ];

    const ridingStyles = [
        { id: "casual", title: "Casual Cruising", description: "Relaxed rides, scenic routes" },
        { id: "commuting", title: "Daily Commuting", description: "City riding, traffic navigation" },
        { id: "sport", title: "Sport Riding", description: "Performance-focused, spirited rides" },
        { id: "touring", title: "Long Distance", description: "Extended journeys, reliability" },
        { id: "track", title: "Track Days", description: "Racing circuits, max performance" },
        { id: "adventure", title: "Adventure", description: "Off-road exploration" },
    ];

    const goals = [
        { id: "performance", name: "Improve Performance", description: "Unlock full potential." },
        { id: "efficiency", name: "Fuel Efficiency", description: "Go further on every tank." },
        { id: "track", name: "Track Times", description: "Shave seconds off your lap." },
    ];

    // Logic
    const updateData = (field: keyof OnboardingData, value: any) => {
        setOnboardingData((prev) => ({ ...prev, [field]: value }));
    };

    const toggleArrayValue = (field: "goals", value: string) => {
        setOnboardingData((prev) => ({
            ...prev,
            [field]: prev[field].includes(value)
                ? prev[field].filter((item) => item !== value)
                : [...prev[field], value],
        }));
    };

    const nextStep = () => {
        if (onboardingData.currentStep < 5) {
            setOnboardingData((prev) => ({ ...prev, currentStep: prev.currentStep + 1 }));
            if (Platform.OS === 'ios') Haptics.selectionAsync();
        }
    };

    const prevStep = () => {
        if (onboardingData.currentStep > 0) {
            setOnboardingData((prev) => ({ ...prev, currentStep: prev.currentStep - 1 }));
            if (Platform.OS === 'ios') Haptics.selectionAsync();
        }
    };

    const handleComplete = async () => {
        setIsCompleting(true);
        // Simulate api call
        setTimeout(async () => {
            await completeOnboarding(); // Update store
            setIsCompleting(false);
        }, 1500);
    };

    // Components
    const WelcomeStep = () => (
        <View style={styles.stepContainer}>
            <View style={styles.heroSection}>
                <Ionicons name="speedometer" size={120} color={Theme.Colors.primary} style={{ alignSelf: 'center', marginTop: 40 }} />
                <Text style={styles.welcomeTitle}>Welcome to RevSync</Text>
                <Text style={styles.welcomeDescription}>
                    Discover, purchase, and apply engine tunes to your motorcycle with ease.
                    Unleash your bike's true potential.
                </Text>
            </View>
        </View>
    );

    const MotorcycleTypeStep = () => (
        <View style={styles.stepContainer}>
            <Text style={styles.stepHeader}>Motorcycle Type</Text>
            <Text style={styles.stepSubHeader}>Select the type that best describes your ride.</Text>
            <View style={styles.grid}>
                {motorcycleTypes.map((type) => (
                    <TouchableOpacity
                        key={type.id}
                        style={[
                            styles.card,
                            onboardingData.motorcycleType === type.id && styles.cardSelected,
                        ]}
                        onPress={() => updateData("motorcycleType", type.id)}
                    >
                        <Ionicons name={type.icon as any} size={32} color={onboardingData.motorcycleType === type.id ? Theme.Colors.primary : Theme.Colors.text} />
                        <Text style={[styles.cardTitle, onboardingData.motorcycleType === type.id && styles.textSelected]}>{type.name}</Text>
                    </TouchableOpacity>
                ))}
            </View>
        </View>
    );

    const SkillLevelStep = () => (
        <View style={styles.stepContainer}>
            <Text style={styles.stepHeader}>Skill Level</Text>
            <Text style={styles.stepSubHeader}>Help us recommend safe tunes.</Text>
            <View style={styles.list}>
                {skillLevels.map((level) => (
                    <TouchableOpacity
                        key={level.id}
                        style={[
                            styles.rowCard,
                            onboardingData.skillLevel === level.id && styles.cardSelected,
                        ]}
                        onPress={() => updateData("skillLevel", level.id)}
                    >
                        <View style={{ flex: 1 }}>
                            <Text style={[styles.cardTitle, onboardingData.skillLevel === level.id && styles.textSelected]}>{level.name}</Text>
                            <Text style={styles.cardDesc}>{level.description}</Text>
                        </View>
                        <View style={[styles.radio, onboardingData.skillLevel === level.id && styles.radioSelected]}>
                            {onboardingData.skillLevel === level.id && <View style={styles.radioInner} />}
                        </View>
                    </TouchableOpacity>
                ))}
            </View>
        </View>
    );

    const RidingStyleStep = () => (
        <View style={styles.stepContainer}>
            <Text style={styles.stepHeader}>Riding Style</Text>
            <Text style={styles.stepSubHeader}>How do you ride?</Text>
            <View style={styles.list}>
                {ridingStyles.map((style) => (
                    <TouchableOpacity
                        key={style.id}
                        style={[
                            styles.rowCard,
                            onboardingData.ridingStyle === style.id && styles.cardSelected,
                        ]}
                        onPress={() => updateData("ridingStyle", style.id)}
                    >
                        <View style={{ flex: 1 }}>
                            <Text style={[styles.cardTitle, onboardingData.ridingStyle === style.id && styles.textSelected]}>{style.title}</Text>
                            <Text style={styles.cardDesc}>{style.description}</Text>
                        </View>
                        {onboardingData.ridingStyle === style.id && (
                            <Ionicons name="checkmark-circle" size={24} color={Theme.Colors.primary} />
                        )}
                    </TouchableOpacity>
                ))}
            </View>
        </View>
    );

    const GoalsStep = () => (
        <View style={styles.stepContainer}>
            <Text style={styles.stepHeader}>Your Goals</Text>
            <Text style={styles.stepSubHeader}>Select all that apply.</Text>
            <View style={styles.list}>
                {goals.map((goal) => (
                    <TouchableOpacity
                        key={goal.id}
                        style={[
                            styles.rowCard,
                            onboardingData.goals.includes(goal.id) && styles.cardSelected,
                        ]}
                        onPress={() => toggleArrayValue("goals", goal.id)}
                    >
                        <View style={{ flex: 1 }}>
                            <Text style={[styles.cardTitle, onboardingData.goals.includes(goal.id) && styles.textSelected]}>{goal.name}</Text>
                            <Text style={styles.cardDesc}>{goal.description}</Text>
                        </View>
                        <View style={[styles.checkbox, onboardingData.goals.includes(goal.id) && styles.checkboxSelected]}>
                            {onboardingData.goals.includes(goal.id) && <Ionicons name="checkmark" size={16} color="#FFF" />}
                        </View>
                    </TouchableOpacity>
                ))}
            </View>
        </View>
    );

    const SummaryStep = () => (
        <View style={styles.stepContainer}>
            <Text style={styles.stepHeader}>Review</Text>
            <Text style={styles.stepSubHeader}>You're all set!</Text>

            <View style={styles.summaryCard}>
                <SummaryRow label="Motorcycle Type" value={motorcycleTypes.find(t => t.id === onboardingData.motorcycleType)?.name} />
                <SummaryRow label="Skill Level" value={skillLevels.find(l => l.id === onboardingData.skillLevel)?.name} />
                <SummaryRow label="Riding Style" value={ridingStyles.find(s => s.id === onboardingData.ridingStyle)?.title} />
                <SummaryRow label="Goals" value={goals.filter(g => onboardingData.goals.includes(g.id)).map(g => g.name).join(', ')} />
            </View>

            <PrimaryButton
                title="Complete Onboarding"
                onPress={handleComplete}
                loading={isCompleting}
                style={{ marginTop: 32 }}
            />
        </View>
    );

    const SummaryRow = ({ label, value }: any) => (
        <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>{label}</Text>
            <Text style={styles.summaryValue}>{value || "Not selected"}</Text>
        </View>
    );

    const steps = [
        { component: WelcomeStep, canProceed: true },
        { component: MotorcycleTypeStep, canProceed: !!onboardingData.motorcycleType },
        { component: SkillLevelStep, canProceed: !!onboardingData.skillLevel },
        { component: RidingStyleStep, canProceed: !!onboardingData.ridingStyle },
        { component: GoalsStep, canProceed: onboardingData.goals.length > 0 },
        { component: SummaryStep, canProceed: true },
    ];

    const CurrentStepComponent = steps[onboardingData.currentStep].component;
    const canProceed = steps[onboardingData.currentStep].canProceed;
    const isLastStep = onboardingData.currentStep === steps.length - 1;
    const isFirstStep = onboardingData.currentStep === 0;

    return (
        <Screen>
            {/* Progress Bar */}
            <View style={styles.paramHeader}>
                <View style={styles.progressTrack}>
                    <View style={[styles.progressFill, { width: `${((onboardingData.currentStep + 1) / steps.length) * 100}%` }]} />
                </View>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <CurrentStepComponent />
            </ScrollView>

            {!isLastStep && (
                <View style={styles.footer}>
                    {!isFirstStep && (
                        <TouchableOpacity onPress={prevStep} style={styles.backBtn}>
                            <Text style={styles.backText}>Back</Text>
                        </TouchableOpacity>
                    )}
                    <PrimaryButton
                        title={isFirstStep ? "Get Started" : "Continue"}
                        onPress={nextStep}
                        disabled={!canProceed}
                        style={{ flex: 1, marginLeft: isFirstStep ? 0 : 16 }}
                    />
                </View>
            )}
        </Screen>
    );
};

const styles = StyleSheet.create({
    paramHeader: {
        paddingHorizontal: Theme.Spacing.md,
        paddingVertical: Theme.Spacing.sm,
    },
    progressTrack: {
        height: 4,
        backgroundColor: Theme.Colors.surfaceHighlight,
        borderRadius: 2,
    },
    progressFill: {
        height: '100%',
        backgroundColor: Theme.Colors.primary,
        borderRadius: 2,
    },
    content: {
        padding: Theme.Spacing.md,
        paddingBottom: 100,
    },
    stepContainer: {
        flex: 1,
    },
    heroSection: {
        alignItems: 'center',
        paddingVertical: 40,
    },
    welcomeTitle: {
        ...Theme.Typography.h1,
        textAlign: 'center',
        marginTop: 32,
        marginBottom: 16,
    },
    welcomeDescription: {
        ...Theme.Typography.body,
        textAlign: 'center',
        color: Theme.Colors.textSecondary,
        maxWidth: 300,
    },
    stepHeader: {
        ...Theme.Typography.h2,
        marginBottom: 8,
    },
    stepSubHeader: {
        ...Theme.Typography.body,
        color: Theme.Colors.textSecondary,
        marginBottom: 24,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 16,
    },
    list: {
        gap: 12,
    },
    card: {
        width: (width - 48) / 2, // 2 column
        backgroundColor: Theme.Colors.surface,
        padding: 16,
        borderRadius: Theme.Layout.borderRadius,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: 'transparent',
        gap: 12,
        minHeight: 120,
        justifyContent: 'center',
    },
    rowCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Theme.Colors.surface,
        padding: 16,
        borderRadius: Theme.Layout.borderRadius,
        borderWidth: 2,
        borderColor: 'transparent',
    },
    cardSelected: {
        borderColor: Theme.Colors.primary,
        backgroundColor: 'rgba(225, 29, 72, 0.1)',
    },
    cardTitle: {
        fontWeight: 'bold',
        color: Theme.Colors.text,
        fontSize: 16,
    },
    cardDesc: {
        color: Theme.Colors.textSecondary,
        fontSize: 12,
        marginTop: 4,
    },
    textSelected: {
        color: Theme.Colors.primary,
    },
    radio: {
        width: 20,
        height: 20,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: Theme.Colors.textSecondary,
        alignItems: 'center',
        justifyContent: 'center',
    },
    radioSelected: {
        borderColor: Theme.Colors.primary,
    },
    radioInner: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: Theme.Colors.primary,
    },
    checkbox: {
        width: 24,
        height: 24,
        borderRadius: 4,
        borderWidth: 2,
        borderColor: Theme.Colors.textSecondary,
        alignItems: 'center',
        justifyContent: 'center',
    },
    checkboxSelected: {
        borderColor: Theme.Colors.primary,
        backgroundColor: Theme.Colors.primary,
    },
    footer: {
        padding: Theme.Spacing.md,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Theme.Colors.background,
        borderTopWidth: 1,
        borderTopColor: Theme.Colors.surfaceHighlight,
    },
    backBtn: {
        paddingVertical: 12,
        paddingHorizontal: 16,
    },
    backText: {
        color: Theme.Colors.textSecondary,
        fontWeight: '600',
    },
    summaryCard: {
        backgroundColor: Theme.Colors.surface,
        padding: 16,
        borderRadius: Theme.Layout.borderRadius,
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: Theme.Colors.surfaceHighlight,
    },
    summaryLabel: {
        color: Theme.Colors.textSecondary,
    },
    summaryValue: {
        color: Theme.Colors.text,
        fontWeight: 'bold',
        maxWidth: '50%',
        textAlign: 'right',
    },
});
