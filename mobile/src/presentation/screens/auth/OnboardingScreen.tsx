import React, { useState, useRef } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    StyleSheet,
    Dimensions,
    Platform,
    Alert,
    Animated,
    Easing,
    ActivityIndicator,
} from 'react-native';
import * as Haptics from "expo-haptics";
import { Ionicons } from '@expo/vector-icons';
import { useAppStore } from '../../store/useAppStore';
import { useSettingsStore } from '../../store/useSettingsStore';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

// ─── Colors ──────────────────────────────────────────────────
const C = {
    bg: '#1a1a1a',
    surface: '#262626',
    surfaceLight: '#333',
    primary: '#ea103c',
    white: '#ffffff',
    textMuted: '#94a3b8',
    textDim: '#64748b',
    border: '#404040',
};

// ─── Data Definitions ────────────────────────────────────────
interface OnboardingData {
    currentStep: number;
    motorcycleType: string;
    skillLevel: string;
    ridingStyle: string;
    goals: string[];
}

const motorcycleTypes = [
    { id: 'sport', name: 'Sport', sub: 'Recommended', icon: 'bicycle' },
    { id: 'standard', name: 'Naked', sub: 'Standard', icon: 'car-sport' },
    { id: 'adventure', name: 'Adventure', sub: 'Dual-Sport', icon: 'compass' },
    { id: 'cruiser', name: 'Cruiser', sub: 'Low-slung', icon: 'sunny' },
];

const skillLevels = [
    { id: 'beginner', name: 'Beginner', description: 'New to riding or limited experience.', icon: 'leaf' },
    { id: 'intermediate', name: 'Intermediate', description: 'Comfortable with basic skills.', icon: 'flash' },
    { id: 'advanced', name: 'Advanced', description: 'Experienced rider with high confidence.', icon: 'trophy' },
];

const ridingStyles = [
    { id: 'casual', title: 'Casual Cruising', description: 'Relaxed rides, scenic routes', icon: 'partly-sunny' },
    { id: 'commuting', title: 'Daily Commuting', description: 'City riding, traffic navigation', icon: 'business' },
    { id: 'sport', title: 'Sport Riding', description: 'Performance-focused, spirited rides', icon: 'speedometer' },
    { id: 'touring', title: 'Long Distance', description: 'Extended journeys, reliability', icon: 'map' },
    { id: 'track', title: 'Track Days', description: 'Racing circuits, max performance', icon: 'flag' },
    { id: 'offroad', title: 'Adventure', description: 'Off-road exploration', icon: 'navigate' },
];

const goalOptions = [
    { id: 'performance', name: 'Improve Performance', description: 'Unlock full potential.', icon: 'rocket' },
    { id: 'efficiency', name: 'Fuel Efficiency', description: 'Go further on every tank.', icon: 'leaf' },
    { id: 'track', name: 'Track Times', description: 'Shave seconds off your lap.', icon: 'timer' },
];

const regions = [
    { id: 'UK', name: 'United Kingdom' },
    { id: 'EU', name: 'European Union' },
    { id: 'US', name: 'United States' },
    { id: 'ROW', name: 'Rest of World' },
];

// ─── Component ───────────────────────────────────────────────
export const OnboardingScreen = () => {
    const { completeOnboarding } = useAppStore();
    const { toggleUnits } = useSettingsStore();

    const [onboardingData, setOnboardingData] = useState<OnboardingData>({
        currentStep: 0,
        motorcycleType: '',
        skillLevel: '',
        ridingStyle: '',
        goals: [],
    });

    const [isCompleting, setIsCompleting] = useState(false);

    // Legal state
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

    // Animation
    const slideAnim = useRef(new Animated.Value(0)).current;
    const fadeAnim = useRef(new Animated.Value(1)).current;

    const animateStepTransition = (direction: 'forward' | 'back') => {
        const offset = direction === 'forward' ? width : -width;
        fadeAnim.setValue(0);
        slideAnim.setValue(offset * 0.3);
        Animated.parallel([
            Animated.timing(slideAnim, { toValue: 0, duration: 280, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
            Animated.timing(fadeAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
        ]).start();
    };

    // ─── Logic ───────────────────────────────────────────────
    const updateData = (field: keyof OnboardingData, value: any) => {
        setOnboardingData((prev) => ({ ...prev, [field]: value }));
    };

    const toggleArrayValue = (field: 'goals', value: string) => {
        setOnboardingData((prev) => ({
            ...prev,
            [field]: prev[field].includes(value)
                ? prev[field].filter((item) => item !== value)
                : [...prev[field], value],
        }));
    };

    const updateLegal = (field: keyof typeof legalState, value: any) => {
        setLegalState(prev => ({ ...prev, [field]: value }));
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
            const { legalService } = await import('../../../services/legalService');
            if (legalState.termsAccepted) await legalService.acceptDocument('TERMS', '1.0');
            if (legalState.privacyAccepted) await legalService.acceptDocument('PRIVACY', '1.0');
            if (legalState.safetyAccepted) await legalService.acceptDocument('SAFETY', '1.0');
            if (legalState.analyticsConsent) await legalService.acceptDocument('ANALYTICS', '1.0');
            await completeOnboarding();
        } catch (e) {
            console.error('Onboarding failed', e);
            Alert.alert('Error', 'Failed to complete onboarding. Please try again.');
        } finally {
            setIsCompleting(false);
        }
    };

    // ─── Step Components ─────────────────────────────────────

    // Step: Welcome
    const WelcomeStep = () => (
        <View style={s.stepCenter}>
            <View style={s.heroIconWrap}>
                <Ionicons name="speedometer" size={64} color={C.primary} />
            </View>
            <Text style={s.heroTitle}>Welcome to RevSync</Text>
            <Text style={s.heroSub}>
                Discover, purchase, and apply engine tunes to your motorcycle with ease. Unleash your bike's true potential.
            </Text>
        </View>
    );

    // Step: Legal
    const LegalStep = () => (
        <View style={s.stepContainer}>
            <Text style={s.stepTitle}>Region & Legal</Text>
            <Text style={s.stepSub}>Confirm your region and accept our terms.</Text>

            {/* Region chips */}
            <Text style={s.sectionLabel}>Region</Text>
            <View style={s.chipRow}>
                {regions.map(r => (
                    <TouchableOpacity
                        key={r.id}
                        style={[s.chip, legalState.region === r.id && s.chipActive]}
                        onPress={() => updateLegal('region', r.id)}
                    >
                        <Text style={[s.chipText, legalState.region === r.id && { color: C.primary }]}>{r.name}</Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Required Agreements */}
            <Text style={[s.sectionLabel, { marginTop: 24 }]}>Required Agreements</Text>
            <CheckboxRow label="I accept the Terms & Conditions" checked={legalState.termsAccepted} onPress={(v: boolean) => updateLegal('termsAccepted', v)} />
            <CheckboxRow label="I accept the Privacy Policy" checked={legalState.privacyAccepted} onPress={(v: boolean) => updateLegal('privacyAccepted', v)} />
            <CheckboxRow label="I accept the ECU Flashing Safety Disclaimer" checked={legalState.safetyAccepted} onPress={(v: boolean) => updateLegal('safetyAccepted', v)} />

            {/* Privacy Preferences */}
            <Text style={[s.sectionLabel, { marginTop: 24 }]}>Privacy Preferences</Text>
            <ToggleRow label="Share Analytics" sub="Help us improve RevSync" value={legalState.analyticsConsent} onValueChange={(v: boolean) => updateLegal('analyticsConsent', v)} />
            <ToggleRow label="Crash Reporting" sub="Send anonymous crash logs" value={legalState.crashReportConsent} onValueChange={(v: boolean) => updateLegal('crashReportConsent', v)} />
            <ToggleRow label="Marketing Emails" sub="Receive tune deals, updates & news" value={legalState.marketingConsent} onValueChange={(v: boolean) => updateLegal('marketingConsent', v)} />

            {/* Units */}
            <Text style={[s.sectionLabel, { marginTop: 24 }]}>Units Preference</Text>
            <View style={s.chipRow}>
                {(['metric', 'imperial'] as const).map(u => (
                    <TouchableOpacity
                        key={u}
                        style={[s.chip, preferredUnits === u && s.chipActive]}
                        onPress={() => setPreferredUnits(u)}
                    >
                        <Text style={[s.chipText, preferredUnits === u && { color: C.primary }]}>
                            {u === 'metric' ? '🏎️ Metric (km/h, °C)' : '🇺🇸 Imperial (mph, °F)'}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>
        </View>
    );

    // Step: Motorcycle Type (matches the HTML mockup)
    const MotorcycleTypeStep = () => (
        <View style={s.stepContainer}>
            <View style={{ alignItems: 'center', marginBottom: 8 }}>
                <Text style={[s.stepTitle, { textAlign: 'center' }]}>What do you ride?</Text>
                <Text style={[s.stepSub, { textAlign: 'center', maxWidth: 280 }]}>
                    Select your chassis style to initialize the ECU profile for optimal tuning.
                </Text>
            </View>
            <View style={s.typeGrid}>
                {motorcycleTypes.map((type) => {
                    const selected = onboardingData.motorcycleType === type.id;
                    return (
                        <TouchableOpacity
                            key={type.id}
                            style={[s.typeCard, selected && s.typeCardSelected]}
                            onPress={() => updateData('motorcycleType', type.id)}
                            activeOpacity={0.7}
                        >
                            {selected && (
                                <View style={s.typeCheckBadge}>
                                    <Ionicons name="checkmark-circle" size={20} color={C.primary} />
                                </View>
                            )}
                            <View style={[s.typeIconCircle, selected && s.typeIconCircleActive]}>
                                <Ionicons name={type.icon as any} size={32} color={selected ? C.primary : C.textMuted} />
                            </View>
                            <Text style={[s.typeLabel, selected && { color: C.white }]}>{type.name}</Text>
                            <Text style={[s.typeSub, selected && { color: C.primary }]}>{type.sub}</Text>
                        </TouchableOpacity>
                    );
                })}
            </View>
        </View>
    );

    // Step: Skill Level
    const SkillLevelStep = () => (
        <View style={s.stepContainer}>
            <View style={{ alignItems: 'center', marginBottom: 8 }}>
                <Text style={[s.stepTitle, { textAlign: 'center' }]}>Skill Level</Text>
                <Text style={[s.stepSub, { textAlign: 'center', maxWidth: 280 }]}>
                    Help us recommend safe tunes for your experience.
                </Text>
            </View>
            <View style={s.listGap}>
                {skillLevels.map((level) => {
                    const selected = onboardingData.skillLevel === level.id;
                    return (
                        <TouchableOpacity
                            key={level.id}
                            style={[s.listCard, selected && s.listCardSelected]}
                            onPress={() => updateData('skillLevel', level.id)}
                            activeOpacity={0.7}
                        >
                            <View style={[s.listIconCircle, selected && s.listIconCircleActive]}>
                                <Ionicons name={level.icon as any} size={24} color={selected ? C.primary : C.textMuted} />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={[s.listTitle, selected && { color: C.white }]}>{level.name}</Text>
                                <Text style={s.listDesc}>{level.description}</Text>
                            </View>
                            {selected && <Ionicons name="checkmark-circle" size={22} color={C.primary} />}
                        </TouchableOpacity>
                    );
                })}
            </View>
        </View>
    );

    // Step: Riding Style
    const RidingStyleStep = () => (
        <View style={s.stepContainer}>
            <View style={{ alignItems: 'center', marginBottom: 8 }}>
                <Text style={[s.stepTitle, { textAlign: 'center' }]}>Riding Style</Text>
                <Text style={[s.stepSub, { textAlign: 'center', maxWidth: 280 }]}>
                    How do you use your motorcycle?
                </Text>
            </View>
            <View style={s.typeGrid}>
                {ridingStyles.map((style) => {
                    const selected = onboardingData.ridingStyle === style.id;
                    return (
                        <TouchableOpacity
                            key={style.id}
                            style={[s.typeCard, selected && s.typeCardSelected]}
                            onPress={() => updateData('ridingStyle', style.id)}
                            activeOpacity={0.7}
                        >
                            {selected && (
                                <View style={s.typeCheckBadge}>
                                    <Ionicons name="checkmark-circle" size={20} color={C.primary} />
                                </View>
                            )}
                            <View style={[s.typeIconCircle, selected && s.typeIconCircleActive]}>
                                <Ionicons name={style.icon as any} size={28} color={selected ? C.primary : C.textMuted} />
                            </View>
                            <Text style={[s.typeLabel, selected && { color: C.white }]}>{style.title}</Text>
                            <Text style={s.typeSub} numberOfLines={1}>{style.description}</Text>
                        </TouchableOpacity>
                    );
                })}
            </View>
        </View>
    );

    // Step: Goals
    const GoalsStep = () => (
        <View style={s.stepContainer}>
            <View style={{ alignItems: 'center', marginBottom: 8 }}>
                <Text style={[s.stepTitle, { textAlign: 'center' }]}>Your Goals</Text>
                <Text style={[s.stepSub, { textAlign: 'center', maxWidth: 280 }]}>
                    Select all that apply to personalize your experience.
                </Text>
            </View>
            <View style={s.listGap}>
                {goalOptions.map((goal) => {
                    const selected = onboardingData.goals.includes(goal.id);
                    return (
                        <TouchableOpacity
                            key={goal.id}
                            style={[s.listCard, selected && s.listCardSelected]}
                            onPress={() => toggleArrayValue('goals', goal.id)}
                            activeOpacity={0.7}
                        >
                            <View style={[s.listIconCircle, selected && s.listIconCircleActive]}>
                                <Ionicons name={goal.icon as any} size={24} color={selected ? C.primary : C.textMuted} />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={[s.listTitle, selected && { color: C.white }]}>{goal.name}</Text>
                                <Text style={s.listDesc}>{goal.description}</Text>
                            </View>
                            <View style={[s.checkBox, selected && s.checkBoxSelected]}>
                                {selected && <Ionicons name="checkmark" size={16} color="#FFF" />}
                            </View>
                        </TouchableOpacity>
                    );
                })}
            </View>
        </View>
    );

    // Step: Summary
    const SummaryStep = () => (
        <View style={s.stepContainer}>
            <View style={{ alignItems: 'center', marginBottom: 16 }}>
                <View style={[s.heroIconWrap, { marginBottom: 16 }]}>
                    <Ionicons name="checkmark-circle" size={56} color="#22c55e" />
                </View>
                <Text style={[s.stepTitle, { textAlign: 'center' }]}>You're All Set!</Text>
                <Text style={[s.stepSub, { textAlign: 'center', maxWidth: 280 }]}>
                    Review your profile below and complete onboarding.
                </Text>
            </View>

            <View style={s.summaryCard}>
                <SummaryRow label="Motorcycle Type" value={motorcycleTypes.find(t => t.id === onboardingData.motorcycleType)?.name} />
                <SummaryRow label="Skill Level" value={skillLevels.find(l => l.id === onboardingData.skillLevel)?.name} />
                <SummaryRow label="Riding Style" value={ridingStyles.find(st => st.id === onboardingData.ridingStyle)?.title} />
                <SummaryRow label="Goals" value={goalOptions.filter(g => onboardingData.goals.includes(g.id)).map(g => g.name).join(', ')} />
            </View>

            <TouchableOpacity
                style={[s.primaryBtn, isCompleting && { opacity: 0.6 }]}
                onPress={handleComplete}
                disabled={isCompleting}
                activeOpacity={0.85}
            >
                {isCompleting ? (
                    <ActivityIndicator color="#FFF" />
                ) : (
                    <>
                        <Text style={s.primaryBtnText}>Complete Onboarding</Text>
                        <Ionicons name="arrow-forward" size={18} color="#FFF" />
                    </>
                )}
            </TouchableOpacity>
        </View>
    );

    // ─── Helpers ──────────────────────────────────────────────

    const SummaryRow = ({ label, value }: any) => (
        <View style={s.summaryRow}>
            <Text style={s.summaryLabel}>{label}</Text>
            <Text style={s.summaryValue}>{value || 'Not selected'}</Text>
        </View>
    );

    const CheckboxRow = ({ label, checked, onPress }: any) => (
        <TouchableOpacity style={s.checkRow} onPress={() => onPress(!checked)}>
            <View style={[s.checkBox, checked && s.checkBoxSelected]}>
                {checked && <Ionicons name="checkmark" size={16} color="#FFF" />}
            </View>
            <Text style={s.checkLabel}>{label}</Text>
        </TouchableOpacity>
    );

    const ToggleRow = ({ label, sub, value, onValueChange }: any) => (
        <TouchableOpacity style={s.checkRow} onPress={() => onValueChange(!value)}>
            <View style={{ flex: 1 }}>
                <Text style={s.checkLabel}>{label}</Text>
                <Text style={s.listDesc}>{sub}</Text>
            </View>
            <View style={[s.toggleDot, value && s.toggleDotActive]}>
                {value && <View style={s.toggleInner} />}
            </View>
        </TouchableOpacity>
    );

    // ─── Steps Array ─────────────────────────────────────────
    const steps = [
        { component: WelcomeStep, canProceed: true },
        { component: LegalStep, canProceed: legalState.termsAccepted && legalState.privacyAccepted && legalState.safetyAccepted },
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

    // ─── Render ──────────────────────────────────────────────
    return (
        <SafeAreaView style={s.root}>
            {/* Dot Step Indicator */}
            <View style={s.dotsRow}>
                {steps.map((_, i) => (
                    <View
                        key={i}
                        style={[
                            s.dot,
                            i < onboardingData.currentStep && s.dotCompleted,
                            i === onboardingData.currentStep && s.dotActive,
                            i > onboardingData.currentStep && s.dotFuture,
                        ]}
                    />
                ))}
            </View>

            {/* Content */}
            <ScrollView
                contentContainerStyle={s.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                <Animated.View style={{ opacity: fadeAnim, transform: [{ translateX: slideAnim }] }}>
                    <CurrentStepComponent />
                </Animated.View>
            </ScrollView>

            {/* Footer Navigation */}
            {!isLastStep && (
                <View style={s.footer}>
                    {!isFirstStep ? (
                        <TouchableOpacity style={s.backBtn} onPress={goBack} activeOpacity={0.7}>
                            <Text style={s.backBtnText}>Back</Text>
                        </TouchableOpacity>
                    ) : (
                        <View style={{ flex: 1 / 3 }} />
                    )}
                    <TouchableOpacity
                        style={[s.nextBtn, !canProceed && { opacity: 0.4 }]}
                        onPress={nextStep}
                        disabled={!canProceed}
                        activeOpacity={0.85}
                    >
                        <Text style={s.nextBtnText}>{isFirstStep ? 'Get Started' : 'Next'}</Text>
                        <Ionicons name="arrow-forward" size={16} color="#FFF" />
                    </TouchableOpacity>
                </View>
            )}
        </SafeAreaView>
    );
};

// ─── Styles ──────────────────────────────────────────────────
const CARD_WIDTH = (width - 48 - 16) / 2; // 24px padding each side + 16px gap

const s = StyleSheet.create({
    root: {
        flex: 1,
        backgroundColor: C.bg,
    },

    // Dots
    dotsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 16,
        paddingHorizontal: 24,
    },
    dot: {
        height: 6,
        width: 6,
        borderRadius: 3,
        backgroundColor: C.surface,
    },
    dotCompleted: {
        backgroundColor: 'rgba(234,16,60,0.4)',
    },
    dotActive: {
        width: 24,
        borderRadius: 3,
        backgroundColor: C.primary,
        shadowColor: C.primary,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.6,
        shadowRadius: 8,
        elevation: 6,
    },
    dotFuture: {
        backgroundColor: C.surface,
    },

    // Content
    scrollContent: {
        paddingHorizontal: 24,
        paddingBottom: 120,
    },

    // Steps
    stepContainer: {
        paddingVertical: 16,
    },
    stepCenter: {
        alignItems: 'center',
        paddingVertical: 60,
    },
    heroIconWrap: {
        width: 96,
        height: 96,
        borderRadius: 48,
        backgroundColor: 'rgba(234,16,60,0.1)',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 24,
    },
    heroTitle: {
        fontSize: 28,
        fontWeight: '800',
        color: C.white,
        textAlign: 'center',
        letterSpacing: -0.5,
        marginBottom: 12,
    },
    heroSub: {
        fontSize: 14,
        color: C.textMuted,
        textAlign: 'center',
        lineHeight: 22,
        maxWidth: 280,
    },

    stepTitle: {
        fontSize: 28,
        fontWeight: '800',
        color: C.white,
        letterSpacing: -0.5,
        marginBottom: 8,
    },
    stepSub: {
        fontSize: 14,
        color: C.textMuted,
        lineHeight: 22,
        marginBottom: 24,
    },

    // Section Labels
    sectionLabel: {
        fontSize: 14,
        fontWeight: '700',
        color: C.white,
        marginBottom: 12,
        marginTop: 8,
    },

    // 2-column Type Grid (Bike Type / Riding Style)
    typeGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 16,
        justifyContent: 'center',
        paddingVertical: 16,
    },
    typeCard: {
        width: CARD_WIDTH,
        backgroundColor: C.surface,
        borderRadius: 24,
        paddingVertical: 20,
        paddingHorizontal: 16,
        alignItems: 'center',
        gap: 12,
        borderWidth: 2,
        borderColor: 'transparent',
    },
    typeCardSelected: {
        borderColor: C.primary,
        shadowColor: C.primary,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.4,
        shadowRadius: 15,
        elevation: 8,
    },
    typeCheckBadge: {
        position: 'absolute',
        top: 12,
        right: 12,
    },
    typeIconCircle: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: C.surfaceLight,
        alignItems: 'center',
        justifyContent: 'center',
    },
    typeIconCircleActive: {
        backgroundColor: 'rgba(234,16,60,0.1)',
    },
    typeLabel: {
        fontSize: 18,
        fontWeight: '700',
        color: '#e2e8f0',
        textAlign: 'center',
    },
    typeSub: {
        fontSize: 12,
        fontWeight: '500',
        color: C.textDim,
        textAlign: 'center',
    },

    // List Cards (Skill / Goals)
    listGap: {
        gap: 12,
        paddingVertical: 16,
    },
    listCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: C.surface,
        borderRadius: 20,
        padding: 16,
        gap: 14,
        borderWidth: 2,
        borderColor: 'transparent',
    },
    listCardSelected: {
        borderColor: C.primary,
        shadowColor: C.primary,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 6,
    },
    listIconCircle: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: C.surfaceLight,
        alignItems: 'center',
        justifyContent: 'center',
    },
    listIconCircleActive: {
        backgroundColor: 'rgba(234,16,60,0.1)',
    },
    listTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#e2e8f0',
        marginBottom: 2,
    },
    listDesc: {
        fontSize: 12,
        color: C.textDim,
    },

    // Chips
    chipRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    chip: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 50,
        backgroundColor: C.surface,
        borderWidth: 1,
        borderColor: C.border,
    },
    chipActive: {
        borderColor: C.primary,
        backgroundColor: 'rgba(234,16,60,0.1)',
    },
    chipText: {
        fontSize: 13,
        fontWeight: '600',
        color: C.white,
    },

    // Checkbox & Toggle
    checkRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        gap: 12,
    },
    checkBox: {
        width: 24,
        height: 24,
        borderRadius: 6,
        borderWidth: 2,
        borderColor: C.textMuted,
        alignItems: 'center',
        justifyContent: 'center',
    },
    checkBoxSelected: {
        borderColor: C.primary,
        backgroundColor: C.primary,
    },
    checkLabel: {
        fontSize: 14,
        color: C.white,
        flex: 1,
    },
    toggleDot: {
        width: 22,
        height: 22,
        borderRadius: 11,
        borderWidth: 2,
        borderColor: C.textMuted,
        alignItems: 'center',
        justifyContent: 'center',
    },
    toggleDotActive: {
        borderColor: C.primary,
    },
    toggleInner: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: C.primary,
    },

    // Summary
    summaryCard: {
        backgroundColor: C.surface,
        borderRadius: 20,
        padding: 20,
        marginBottom: 24,
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.05)',
    },
    summaryLabel: {
        fontSize: 14,
        color: C.textMuted,
    },
    summaryValue: {
        fontSize: 14,
        fontWeight: '700',
        color: C.white,
        maxWidth: '50%',
        textAlign: 'right',
    },

    // Footer
    footer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 24,
        paddingVertical: 16,
        paddingBottom: 24,
        gap: 16,
    },
    backBtn: {
        flex: 1 / 3,
        height: 56,
        borderRadius: 50,
        borderWidth: 1,
        borderColor: C.surface,
        alignItems: 'center',
        justifyContent: 'center',
    },
    backBtnText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#cbd5e1',
    },
    nextBtn: {
        flex: 2 / 3,
        height: 56,
        borderRadius: 50,
        backgroundColor: C.primary,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        shadowColor: C.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.35,
        shadowRadius: 12,
        elevation: 8,
    },
    nextBtnText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#FFF',
    },
    primaryBtn: {
        height: 56,
        borderRadius: 50,
        backgroundColor: C.primary,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        shadowColor: C.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.35,
        shadowRadius: 12,
        elevation: 8,
    },
    primaryBtnText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#FFF',
    },
});
