import React, { useState, useRef, useEffect } from 'react';
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
    ActivityIndicator,
    Animated,
    Easing,
} from 'react-native';
import * as Haptics from "expo-haptics";
import { Theme } from '../../theme';
import { Screen, PrimaryButton } from '../../components/SharedComponents';
import { Ionicons } from '@expo/vector-icons';
import { useAppStore } from '../../store/useAppStore';
import { useSettingsStore } from '../../store/useSettingsStore';

const { width } = Dimensions.get('window');

interface OnboardingData {
    currentStep: number;
    motorcycleType: string;
    skillLevel: string;
    ridingStyle: string;
    goals: string[];
}

const STEP_LABELS = ['Welcome', 'Legal', 'Bike Type', 'Skill', 'Style', 'Goals', 'Review'];

export const OnboardingScreen = () => {
    const { completeOnboarding } = useAppStore();
    const { toggleUnits } = useSettingsStore();

    const [onboardingData, setOnboardingData] = useState<OnboardingData>({
        currentStep: 0,
        motorcycleType: "",
        skillLevel: "",
        ridingStyle: "",
        goals: [],
    });

    const [isCompleting, setIsCompleting] = useState(false);

    // Animated slide transition
    const slideAnim = useRef(new Animated.Value(0)).current;
    const fadeAnim = useRef(new Animated.Value(1)).current;
    const prevStep = useRef(0);

    const animateStepTransition = (direction: 'forward' | 'back') => {
        const offset = direction === 'forward' ? width : -width;
        fadeAnim.setValue(0);
        slideAnim.setValue(offset * 0.3);
        Animated.parallel([
            Animated.timing(slideAnim, { toValue: 0, duration: 280, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
            Animated.timing(fadeAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
        ]).start();
    };

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
        if (onboardingData.currentStep < steps.length - 1) {
            setOnboardingData((prev) => ({ ...prev, currentStep: prev.currentStep + 1 }));
            animateStepTransition('forward');
            if (Platform.OS === 'ios') Haptics.selectionAsync();
        }
    };

    const goBack = () => {
        if (onboardingData.currentStep > 0) {
            setOnboardingData((prev) => ({ ...prev, currentStep: prev.currentStep - 1 }));
            animateStepTransition('back');
            if (Platform.OS === 'ios') Haptics.selectionAsync();
        }
    };

    const handleComplete = async () => {
        setIsCompleting(true);

        try {
            // Persist legal acceptances
            const { legalService } = await import('../../../services/legalService');

            if (legalState.termsAccepted) await legalService.acceptDocument('TERMS', '1.0');
            if (legalState.privacyAccepted) await legalService.acceptDocument('PRIVACY', '1.0');
            if (legalState.safetyAccepted) await legalService.acceptDocument('SAFETY', '1.0');
            if (legalState.analyticsConsent) await legalService.acceptDocument('ANALYTICS', '1.0');

            await completeOnboarding(); // Update store
        } catch (e) {
            console.error('Onboarding failed', e);
            Alert.alert('Error', 'Failed to complete onboarding. Please try again.');
        } finally {
            setIsCompleting(false);
        }
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

    // --- Legal Step Data ---
    const regions = [
        { id: 'UK', name: 'United Kingdom' },
        { id: 'EU', name: 'European Union' },
        { id: 'US', name: 'United States' },
        { id: 'ROW', name: 'Rest of World' },
    ];

    const [legalState, setLegalState] = useState({
        region: 'UK',
        termsAccepted: false,
        privacyAccepted: false,
        safetyAccepted: false,
        analyticsConsent: true,
        crashReportConsent: true,
        marketingConsent: false,
    });

    const [preferredUnits, setPreferredUnits] = useState<'metric' | 'imperial'>('metric');

    const updateLegal = (field: keyof typeof legalState, value: any) => {
        setLegalState(prev => ({ ...prev, [field]: value }));
    };

    const LegalStep = () => (
        <View style={styles.stepContainer}>
            <Text style={styles.stepHeader}>Region & Legal</Text>
            <Text style={styles.stepSubHeader}>To ensure compliance, please confirm your region and accept our terms.</Text>

            <View style={styles.section}>
                <Text style={styles.label}>Region</Text>
                <View style={styles.grid}>
                    {regions.map(r => (
                        <TouchableOpacity
                            key={r.id}
                            style={[
                                styles.chip,
                                legalState.region === r.id && styles.chipSelected
                            ]}
                            onPress={() => updateLegal('region', r.id)}
                        >
                            <Text style={[styles.chipText, legalState.region === r.id && styles.textSelected]}>{r.name}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            <View style={styles.section}>
                <Text style={[styles.label, { marginTop: 16 }]}>Required Agreements</Text>
                <Checkbox
                    label="I accept the Terms & Conditions"
                    checked={legalState.termsAccepted}
                    onPress={(v: boolean) => updateLegal('termsAccepted', v)}
                />
                <Checkbox
                    label="I accept the Privacy Policy"
                    checked={legalState.privacyAccepted}
                    onPress={(v: boolean) => updateLegal('privacyAccepted', v)}
                />
                <Checkbox
                    label="I accept the ECU Flashing Safety Disclaimer"
                    checked={legalState.safetyAccepted}
                    onPress={(v: boolean) => updateLegal('safetyAccepted', v)}
                />
            </View>

            <View style={styles.section}>
                <Text style={[styles.label, { marginTop: 16 }]}>Privacy Preferences</Text>
                <ToggleRow
                    label="Share Analytics"
                    sub="Help us improve RevSync"
                    value={legalState.analyticsConsent}
                    onValueChange={(v: boolean) => updateLegal('analyticsConsent', v)}
                />
                <ToggleRow
                    label="Crash Reporting"
                    sub="Send anonymous crash logs"
                    value={legalState.crashReportConsent}
                    onValueChange={(v: boolean) => updateLegal('crashReportConsent', v)}
                />
                <ToggleRow
                    label="Marketing Emails"
                    sub="Receive tune deals, updates & news"
                    value={legalState.marketingConsent}
                    onValueChange={(v: boolean) => updateLegal('marketingConsent', v)}
                />
            </View>

            <View style={styles.section}>
                <Text style={[styles.label, { marginTop: 16 }]}>Units Preference</Text>
                <View style={[styles.grid, { gap: 12 }]}>
                    {(['metric', 'imperial'] as const).map(u => (
                        <TouchableOpacity
                            key={u}
                            style={[styles.chip, preferredUnits === u && styles.chipSelected]}
                            onPress={() => setPreferredUnits(u)}
                        >
                            <Text style={[styles.chipText, preferredUnits === u && styles.textSelected]}>
                                {u === 'metric' ? '🏎️ Metric (km/h, °C)' : '🇺🇸 Imperial (mph, °F)'}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>
        </View>
    );

    const Checkbox = ({ label, checked, onPress }: any) => (
        <TouchableOpacity style={styles.checkboxRow} onPress={() => onPress(!checked)}>
            <View style={[styles.checkbox, checked && styles.checkboxSelected]}>
                {checked && <Ionicons name="checkmark" size={16} color="#FFF" />}
            </View>
            <Text style={styles.checkboxLabel}>{label}</Text>
        </TouchableOpacity>
    );

    const ToggleRow = ({ label, sub, value, onValueChange }: any) => (
        <TouchableOpacity style={styles.checkboxRow} onPress={() => onValueChange(!value)}>
            <View style={{ flex: 1 }}>
                <Text style={styles.checkboxLabel}>{label}</Text>
                <Text style={styles.cardDesc}>{sub}</Text>
            </View>
            <View style={[styles.radio, value && styles.radioSelected]}>
                {value && <View style={styles.radioInner} />}
            </View>
        </TouchableOpacity>
    );

    const steps = [
        { component: WelcomeStep, canProceed: true },
        {
            component: LegalStep,
            canProceed: legalState.termsAccepted && legalState.privacyAccepted && legalState.safetyAccepted
        },
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
                {/* Step Labels */}
                <View style={styles.stepLabelsRow}>
                    {STEP_LABELS.map((label, i) => (
                        <Text
                            key={label}
                            style={[
                                styles.stepLabel,
                                i === onboardingData.currentStep && styles.stepLabelActive,
                                i < onboardingData.currentStep && styles.stepLabelDone,
                            ]}
                            numberOfLines={1}
                        >
                            {label}
                        </Text>
                    ))}
                </View>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <Animated.View style={{ opacity: fadeAnim, transform: [{ translateX: slideAnim }] }}>
                    <CurrentStepComponent />
                </Animated.View>
            </ScrollView>

            {!isLastStep && (
                <View style={styles.footer}>
                    {!isFirstStep && (
                        <TouchableOpacity onPress={goBack} style={styles.backBtn}>
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
    stepLabelsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 8,
    },
    stepLabel: {
        fontSize: 10,
        color: Theme.Colors.textTertiary,
        fontWeight: '500',
    },
    stepLabelActive: {
        color: Theme.Colors.primary,
        fontWeight: '700',
    },
    stepLabelDone: {
        color: Theme.Colors.textSecondary,
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
    label: {
        ...Theme.Typography.h3,
        marginBottom: 8,
    },
    chip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: Theme.Colors.surface,
        borderWidth: 1,
        borderColor: Theme.Colors.border,
    },
    chipSelected: {
        borderColor: Theme.Colors.primary,
        backgroundColor: 'rgba(225, 29, 72, 0.1)',
    },
    chipText: {
        color: Theme.Colors.text,
    },
    section: {
        marginTop: 24,
    },
    checkboxRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        gap: 12,
    },
    checkboxLabel: {
        color: Theme.Colors.text,
        fontSize: 14,
        flex: 1,
    }
});
