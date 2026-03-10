import React, { useMemo, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Animated,
    Easing,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppStore } from '../../store/useAppStore';
import { useSettingsStore } from '../../store/useSettingsStore';
import { Theme } from '../../theme';

const { Colors, Layout, Motion, Spacing, Typography } = Theme;

interface OnboardingData {
    currentStep: number;
    motorcycleType: string;
    skillLevel: string;
    ridingStyles: string[];
    goals: string[];
}

const motorcycleTypes = [
    { id: 'sport', name: 'Sport', sub: 'Track and road bias', icon: 'speedometer-outline' as const },
    { id: 'standard', name: 'Naked', sub: 'Balanced street setup', icon: 'flash-outline' as const },
    { id: 'adventure', name: 'Adventure', sub: 'Touring and mixed terrain', icon: 'compass-outline' as const },
    { id: 'cruiser', name: 'Cruiser', sub: 'Torque-first road comfort', icon: 'sunny-outline' as const },
];

const skillLevels = [
    { id: 'beginner', name: 'Beginner', description: 'New to tuning or still building confidence.', icon: 'leaf-outline' as const },
    { id: 'intermediate', name: 'Intermediate', description: 'Comfortable with tuning basics and guided flashing.', icon: 'flash-outline' as const },
    { id: 'advanced', name: 'Advanced', description: 'Experienced with performance workflows and setup tradeoffs.', icon: 'trophy-outline' as const },
];

const ridingStyles = [
    { id: 'casual', title: 'Casual cruising', description: 'Relaxed road use', icon: 'partly-sunny-outline' as const },
    { id: 'commuting', title: 'Daily commuting', description: 'Consistency and rideability', icon: 'briefcase-outline' as const },
    { id: 'sport', title: 'Sport riding', description: 'Sharper throttle and response', icon: 'speedometer-outline' as const },
    { id: 'touring', title: 'Long distance', description: 'Smoothness and reliability', icon: 'map-outline' as const },
    { id: 'track', title: 'Track days', description: 'Performance-first calibration', icon: 'flag-outline' as const },
    { id: 'offroad', title: 'Adventure', description: 'Mixed terrain confidence', icon: 'navigate-outline' as const },
];

const goalOptions = [
    { id: 'performance', name: 'Improve performance', description: 'Unlock power and sharper response.', icon: 'rocket-outline' as const },
    { id: 'efficiency', name: 'Improve efficiency', description: 'Preserve range and smoother delivery.', icon: 'leaf-outline' as const },
    { id: 'track', name: 'Prepare for track use', description: 'Bias the setup toward consistent output.', icon: 'timer-outline' as const },
];

const regions = [
    { id: 'UK', name: 'United Kingdom' },
    { id: 'EU', name: 'European Union' },
    { id: 'US', name: 'United States' },
    { id: 'ROW', name: 'Rest of World' },
];

const steps = ['Intro', 'Legal', 'Bike', 'Skill', 'Style', 'Goals', 'Review'];

export const OnboardingScreen = () => {
    const { completeOnboarding } = useAppStore();
    const { units, toggleUnits } = useSettingsStore();

    const [onboardingData, setOnboardingData] = useState<OnboardingData>({
        currentStep: 0,
        motorcycleType: '',
        skillLevel: '',
        ridingStyles: [],
        goals: [],
    });
    const [isCompleting, setIsCompleting] = useState(false);
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

    const slideAnim = useRef(new Animated.Value(0)).current;
    const fadeAnim = useRef(new Animated.Value(1)).current;

    const animateStepTransition = (direction: 'forward' | 'back') => {
        const offset = direction === 'forward' ? 16 : -16;
        fadeAnim.setValue(0);
        slideAnim.setValue(offset);
        Animated.parallel([
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: Motion.panel,
                easing: Easing.out(Easing.cubic),
                useNativeDriver: true,
            }),
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: Motion.panel,
                useNativeDriver: true,
            }),
        ]).start();
    };

    const updateData = (field: keyof OnboardingData, value: string | string[] | number) => {
        setOnboardingData((prev) => ({ ...prev, [field]: value as never }));
    };

    const toggleArrayValue = (field: 'goals' | 'ridingStyles', value: string) => {
        setOnboardingData((prev) => ({
            ...prev,
            [field]: prev[field].includes(value) ? prev[field].filter((item) => item !== value) : [...prev[field], value],
        }));
    };

    const updateLegal = (field: keyof typeof legalState, value: boolean | string) => {
        setLegalState((prev) => ({ ...prev, [field]: value }));
    };

    const nextStep = async () => {
        if (onboardingData.currentStep < steps.length - 1) {
            setOnboardingData((prev) => ({ ...prev, currentStep: prev.currentStep + 1 }));
            animateStepTransition('forward');
            if (Platform.OS === 'ios') await Haptics.selectionAsync();
        }
    };

    const goBack = async () => {
        if (onboardingData.currentStep > 0) {
            setOnboardingData((prev) => ({ ...prev, currentStep: prev.currentStep - 1 }));
            animateStepTransition('back');
            if (Platform.OS === 'ios') await Haptics.selectionAsync();
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

            try {
                const { ApiClient } = await import('../../../data/http/ApiClient');
                await ApiClient.getInstance().patch('/v1/profile/me/', {
                    riding_style: onboardingData.ridingStyles[0] || '',
                    experience_level: onboardingData.skillLevel,
                    country: legalState.region || '',
                });
            } catch {
                // Preferences will sync later if offline.
            }

            if (units !== preferredUnits) {
                toggleUnits();
            }

            await completeOnboarding();
        } catch (error) {
            console.error('Onboarding failed', error);
            Alert.alert('Unable to finish onboarding', 'Try again after checking connectivity.');
        } finally {
            setIsCompleting(false);
        }
    };

    const canProceed = useMemo(() => {
        switch (onboardingData.currentStep) {
            case 0:
                return true;
            case 1:
                return legalState.termsAccepted && legalState.privacyAccepted && legalState.safetyAccepted;
            case 2:
                return Boolean(onboardingData.motorcycleType);
            case 3:
                return Boolean(onboardingData.skillLevel);
            case 4:
                return onboardingData.ridingStyles.length > 0;
            case 5:
                return onboardingData.goals.length > 0;
            default:
                return true;
        }
    }, [legalState.privacyAccepted, legalState.safetyAccepted, legalState.termsAccepted, onboardingData.currentStep, onboardingData.goals.length, onboardingData.motorcycleType, onboardingData.ridingStyles.length, onboardingData.skillLevel]);

    const summary = useMemo(
        () => ({
            motorcycleType: motorcycleTypes.find((item) => item.id === onboardingData.motorcycleType)?.name || 'Not selected',
            skillLevel: skillLevels.find((item) => item.id === onboardingData.skillLevel)?.name || 'Not selected',
            ridingStyle: ridingStyles
                .filter((item) => onboardingData.ridingStyles.includes(item.id))
                .map((item) => item.title)
                .join(', ') || 'Not selected',
            goals:
                goalOptions
                    .filter((item) => onboardingData.goals.includes(item.id))
                    .map((item) => item.name)
                    .join(', ') || 'Not selected',
        }),
        [onboardingData.goals, onboardingData.motorcycleType, onboardingData.ridingStyles, onboardingData.skillLevel],
    );

    const IntroStep = () => (
        <View style={styles.stepWrap}>
            <View style={styles.heroMark}>
                <Ionicons name="shield-checkmark" size={38} color={Colors.info} />
            </View>
            <Text style={styles.stepKicker}>Guided Setup</Text>
            <Text style={styles.stepTitleCentered}>Set RevSync up for your bike, risk profile, and legal region.</Text>
            <Text style={styles.stepSubtitleCentered}>
                The first-run flow stays explicit on purpose: agreements, rider context, and safety preferences affect recommendations and flashing guidance.
            </Text>

            <View style={styles.trustList}>
                {['Legal acceptance before flashing', 'Backup-first safety posture', 'Fitment-aware recommendations'].map((item) => (
                    <View key={item} style={styles.inlineCard}>
                        <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
                        <Text style={styles.inlineCardText}>{item}</Text>
                    </View>
                ))}
            </View>
        </View>
    );

    const LegalStep = () => (
        <View style={styles.stepWrap}>
            <Text style={styles.stepKicker}>Legal and Region</Text>
            <Text style={styles.stepTitle}>Confirm your operating region and accept required safeguards.</Text>

            <Section label="Region">
                <View style={styles.chipWrap}>
                    {regions.map((region) => (
                        <ChoiceChip
                            key={region.id}
                            label={region.name}
                            active={legalState.region === region.id}
                            onPress={() => updateLegal('region', region.id)}
                        />
                    ))}
                </View>
            </Section>

            <Section label="Required agreements">
                <CheckRow label="I accept the Terms & Conditions" checked={legalState.termsAccepted} onPress={(value) => updateLegal('termsAccepted', value)} />
                <CheckRow label="I accept the Privacy Policy" checked={legalState.privacyAccepted} onPress={(value) => updateLegal('privacyAccepted', value)} />
                <CheckRow label="I accept the ECU flashing Safety Disclaimer" checked={legalState.safetyAccepted} onPress={(value) => updateLegal('safetyAccepted', value)} />
            </Section>

            <Section label="Privacy preferences">
                <ToggleRow label="Share analytics" sub="Improve recommendations and product quality" value={legalState.analyticsConsent} onValueChange={(value) => updateLegal('analyticsConsent', value)} />
                <ToggleRow label="Crash reporting" sub="Send anonymous crash logs to improve reliability" value={legalState.crashReportConsent} onValueChange={(value) => updateLegal('crashReportConsent', value)} />
                <ToggleRow label="Marketing emails" sub="Receive product updates and release news" value={legalState.marketingConsent} onValueChange={(value) => updateLegal('marketingConsent', value)} />
            </Section>

            <Section label="Units">
                <View style={styles.chipWrap}>
                    <ChoiceChip label="Metric (km/h, °C)" active={preferredUnits === 'metric'} onPress={() => setPreferredUnits('metric')} />
                    <ChoiceChip label="Imperial (mph, °F)" active={preferredUnits === 'imperial'} onPress={() => setPreferredUnits('imperial')} />
                </View>
            </Section>
        </View>
    );

    const MotorcycleStep = () => (
        <View style={styles.stepWrap}>
            <Text style={styles.stepKicker}>Bike Profile</Text>
            <Text style={styles.stepTitle}>What do you ride most often?</Text>
            <View style={styles.grid2}>
                {motorcycleTypes.map((type) => (
                    <SelectableCard
                        key={type.id}
                        active={onboardingData.motorcycleType === type.id}
                        icon={type.icon}
                        title={type.name}
                        subtitle={type.sub}
                        onPress={() => updateData('motorcycleType', type.id)}
                    />
                ))}
            </View>
        </View>
    );

    const SkillStep = () => (
        <View style={styles.stepWrap}>
            <Text style={styles.stepKicker}>Experience</Text>
            <Text style={styles.stepTitle}>Choose the level that best reflects your tuning confidence.</Text>
            <View style={styles.stack}>
                {skillLevels.map((level) => (
                    <SelectableRow
                        key={level.id}
                        active={onboardingData.skillLevel === level.id}
                        icon={level.icon}
                        title={level.name}
                        subtitle={level.description}
                        onPress={() => updateData('skillLevel', level.id)}
                    />
                ))}
            </View>
        </View>
    );

    const RidingStyleStep = () => (
        <View style={styles.stepWrap}>
            <Text style={styles.stepKicker}>Riding Style</Text>
            <Text style={styles.stepTitle}>Select the usage patterns that matter most.</Text>
            <View style={styles.stack}>
                {ridingStyles.map((item) => (
                    <SelectableRow
                        key={item.id}
                        active={onboardingData.ridingStyles.includes(item.id)}
                        multi
                        icon={item.icon}
                        title={item.title}
                        subtitle={item.description}
                        onPress={() => toggleArrayValue('ridingStyles', item.id)}
                    />
                ))}
            </View>
        </View>
    );

    const GoalsStep = () => (
        <View style={styles.stepWrap}>
            <Text style={styles.stepKicker}>Goals</Text>
            <Text style={styles.stepTitle}>Set the intent behind your tuning workflow.</Text>
            <View style={styles.stack}>
                {goalOptions.map((goal) => (
                    <SelectableRow
                        key={goal.id}
                        active={onboardingData.goals.includes(goal.id)}
                        multi
                        icon={goal.icon}
                        title={goal.name}
                        subtitle={goal.description}
                        onPress={() => toggleArrayValue('goals', goal.id)}
                    />
                ))}
            </View>
        </View>
    );

    const SummaryStep = () => (
        <View style={styles.stepWrap}>
            <View style={styles.summaryHero}>
                <View style={styles.summaryHeroBadge}>
                    <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
                    <Text style={styles.summaryHeroBadgeText}>Ready to complete</Text>
                </View>
                <Text style={styles.stepTitle}>Review your onboarding profile.</Text>
                <Text style={styles.stepSubtitle}>RevSync will use this to bias recommendations, risk framing, and first-run guidance.</Text>
            </View>

            <View style={styles.summaryCard}>
                <SummaryRow label="Motorcycle type" value={summary.motorcycleType} />
                <SummaryRow label="Skill level" value={summary.skillLevel} />
                <SummaryRow label="Riding style" value={summary.ridingStyle} />
                <SummaryRow label="Goals" value={summary.goals} />
                <SummaryRow label="Region" value={regions.find((item) => item.id === legalState.region)?.name || legalState.region} />
                <SummaryRow label="Units" value={preferredUnits === 'metric' ? 'Metric' : 'Imperial'} />
            </View>

            <TouchableOpacity style={[styles.completeButton, isCompleting && styles.disabledButton]} onPress={handleComplete} disabled={isCompleting}>
                {isCompleting ? <ActivityIndicator color={Colors.white} /> : <Text style={styles.completeButtonText}>Complete onboarding</Text>}
            </TouchableOpacity>
        </View>
    );

    const stepContent = [IntroStep, LegalStep, MotorcycleStep, SkillStep, RidingStyleStep, GoalsStep, SummaryStep][onboardingData.currentStep];
    const StepComponent = stepContent;
    const isFirstStep = onboardingData.currentStep === 0;
    const isLastStep = onboardingData.currentStep === steps.length - 1;

    return (
        <SafeAreaView style={styles.root}>
            <View style={styles.header}>
                <Text style={styles.headerLabel}>Setup progress</Text>
                <Text style={styles.headerStep}>
                    {onboardingData.currentStep + 1}/{steps.length}
                </Text>
            </View>

            <View style={styles.progressTrack}>
                {steps.map((item, index) => (
                    <View key={item} style={[styles.progressDot, index < onboardingData.currentStep ? styles.progressDone : index === onboardingData.currentStep ? styles.progressActive : styles.progressFuture]} />
                ))}
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <Animated.View style={{ opacity: fadeAnim, transform: [{ translateX: slideAnim }] }}>
                    <StepComponent />
                </Animated.View>
            </ScrollView>

            {!isLastStep && (
                <View style={styles.footer}>
                    <View style={styles.footerMeta}>
                        <Text style={styles.footerMetaLabel}>{steps[onboardingData.currentStep]}</Text>
                        <Text style={styles.footerMetaText}>Calm, explicit setup before first flash.</Text>
                    </View>
                    <View style={styles.footerActions}>
                        {!isFirstStep && (
                            <TouchableOpacity style={styles.backButton} onPress={goBack}>
                                <Text style={styles.backButtonText}>Back</Text>
                            </TouchableOpacity>
                        )}
                        <TouchableOpacity style={[styles.nextButton, !canProceed && styles.disabledButton]} onPress={nextStep} disabled={!canProceed}>
                            <Text style={styles.nextButtonText}>{isFirstStep ? 'Begin' : 'Next'}</Text>
                            <Ionicons name="arrow-forward" size={16} color={Colors.white} />
                        </TouchableOpacity>
                    </View>
                </View>
            )}
        </SafeAreaView>
    );
};

const Section = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <View style={styles.section}>
        <Text style={styles.sectionLabel}>{label}</Text>
        {children}
    </View>
);

const ChoiceChip = ({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) => (
    <Pressable style={[styles.choiceChip, active && styles.choiceChipActive]} onPress={onPress}>
        <Text style={[styles.choiceChipText, active && styles.choiceChipTextActive]}>{label}</Text>
    </Pressable>
);

const CheckRow = ({ label, checked, onPress }: { label: string; checked: boolean; onPress: (value: boolean) => void }) => (
    <Pressable style={styles.optionRow} onPress={() => onPress(!checked)}>
        <View style={[styles.checkBadge, checked && styles.checkBadgeActive]}>{checked && <Ionicons name="checkmark" size={14} color={Colors.white} />}</View>
        <Text style={styles.optionTitle}>{label}</Text>
    </Pressable>
);

const ToggleRow = ({
    label,
    sub,
    value,
    onValueChange,
}: {
    label: string;
    sub: string;
    value: boolean;
    onValueChange: (value: boolean) => void;
}) => (
    <Pressable style={styles.optionRow} onPress={() => onValueChange(!value)}>
        <View style={{ flex: 1 }}>
            <Text style={styles.optionTitle}>{label}</Text>
            <Text style={styles.optionSubtitle}>{sub}</Text>
        </View>
        <View style={[styles.toggleTrack, value && styles.toggleTrackActive]}>
            <View style={[styles.toggleThumb, value && styles.toggleThumbActive]} />
        </View>
    </Pressable>
);

const SelectableCard = ({
    active,
    icon,
    title,
    subtitle,
    onPress,
}: {
    active: boolean;
    icon: keyof typeof Ionicons.glyphMap;
    title: string;
    subtitle: string;
    onPress: () => void;
}) => (
    <Pressable style={[styles.selectCard, active && styles.selectCardActive]} onPress={onPress}>
        <View style={[styles.selectIconWrap, active && styles.selectIconWrapActive]}>
            <Ionicons name={icon} size={22} color={active ? Colors.info : Colors.textTertiary} />
        </View>
        <Text style={[styles.selectTitle, active && styles.selectTitleActive]}>{title}</Text>
        <Text style={styles.selectSubtitle}>{subtitle}</Text>
    </Pressable>
);

const SelectableRow = ({
    active,
    icon,
    title,
    subtitle,
    onPress,
    multi = false,
}: {
    active: boolean;
    icon: keyof typeof Ionicons.glyphMap;
    title: string;
    subtitle: string;
    onPress: () => void;
    multi?: boolean;
}) => (
    <Pressable style={[styles.selectRow, active && styles.selectRowActive]} onPress={onPress}>
        <View style={[styles.selectRowIcon, active && styles.selectRowIconActive]}>
            <Ionicons name={icon} size={18} color={active ? Colors.info : Colors.textTertiary} />
        </View>
        <View style={styles.selectRowCopy}>
            <Text style={[styles.selectRowTitle, active && styles.selectTitleActive]}>{title}</Text>
            <Text style={styles.selectRowSubtitle}>{subtitle}</Text>
        </View>
        <View style={[styles.checkBadge, active && styles.checkBadgeActive]}>
            {active ? <Ionicons name="checkmark" size={14} color={Colors.white} /> : <Ionicons name={multi ? 'add' : 'ellipse-outline'} size={14} color={Colors.textTertiary} />}
        </View>
    </Pressable>
);

const SummaryRow = ({ label, value }: { label: string; value: string }) => (
    <View style={styles.summaryRow}>
        <Text style={styles.summaryLabel}>{label}</Text>
        <Text style={styles.summaryValue}>{value}</Text>
    </View>
);

const styles = StyleSheet.create({
    root: {
        flex: 1,
        backgroundColor: Colors.shell,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: Spacing.lg,
        paddingTop: 10,
    },
    headerLabel: {
        ...Typography.dataLabel,
        color: Colors.accent,
    },
    headerStep: {
        fontSize: 12,
        fontWeight: '700',
        color: Colors.textSecondary,
    },
    progressTrack: {
        flexDirection: 'row',
        gap: 8,
        paddingHorizontal: Spacing.lg,
        paddingTop: 12,
        paddingBottom: 10,
    },
    progressDot: {
        height: 6,
        flex: 1,
        borderRadius: 999,
    },
    progressDone: {
        backgroundColor: 'rgba(99,199,255,0.42)',
    },
    progressActive: {
        backgroundColor: Colors.accent,
    },
    progressFuture: {
        backgroundColor: 'rgba(255,255,255,0.08)',
    },
    scrollContent: {
        paddingHorizontal: Spacing.lg,
        paddingBottom: 140,
    },
    stepWrap: {
        paddingTop: 12,
        paddingBottom: 20,
    },
    heroMark: {
        width: 88,
        height: 88,
        borderRadius: 44,
        backgroundColor: Colors.accentSoft,
        borderWidth: 1,
        borderColor: Colors.strokeStrong,
        alignItems: 'center',
        justifyContent: 'center',
        alignSelf: 'center',
        marginBottom: 18,
    },
    stepKicker: {
        ...Typography.dataLabel,
        color: Colors.accent,
        marginBottom: 8,
        textAlign: 'center',
    },
    stepTitleCentered: {
        ...Typography.h1,
        textAlign: 'center',
        maxWidth: 320,
        alignSelf: 'center',
    },
    stepSubtitleCentered: {
        ...Typography.body,
        textAlign: 'center',
        marginTop: 12,
    },
    stepTitle: {
        ...Typography.h1,
        marginBottom: 10,
    },
    stepSubtitle: {
        ...Typography.body,
        marginBottom: 18,
    },
    trustList: {
        gap: 10,
        marginTop: 18,
    },
    inlineCard: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        padding: 14,
        borderRadius: Layout.radiusMd,
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderWidth: 1,
        borderColor: Colors.strokeSoft,
    },
    inlineCardText: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.textSecondary,
    },
    section: {
        marginTop: 18,
        gap: 10,
    },
    sectionLabel: {
        ...Typography.dataLabel,
    },
    chipWrap: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    choiceChip: {
        paddingHorizontal: 12,
        paddingVertical: 9,
        borderRadius: 999,
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderWidth: 1,
        borderColor: Colors.strokeSoft,
    },
    choiceChipActive: {
        backgroundColor: Colors.accentSoft,
        borderColor: 'rgba(99,199,255,0.34)',
    },
    choiceChipText: {
        fontSize: 12,
        fontWeight: '700',
        color: Colors.textSecondary,
    },
    choiceChipTextActive: {
        color: Colors.textPrimary,
    },
    optionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        padding: 14,
        borderRadius: Layout.radiusMd,
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderWidth: 1,
        borderColor: Colors.strokeSoft,
    },
    optionTitle: {
        flex: 1,
        fontSize: 14,
        fontWeight: '600',
        color: Colors.textPrimary,
    },
    optionSubtitle: {
        fontSize: 12,
        lineHeight: 18,
        color: Colors.textSecondary,
        marginTop: 4,
    },
    checkBadge: {
        width: 22,
        height: 22,
        borderRadius: 7,
        borderWidth: 1,
        borderColor: Colors.strokeStrong,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255,255,255,0.02)',
    },
    checkBadgeActive: {
        backgroundColor: Colors.primary,
        borderColor: Colors.primary,
    },
    toggleTrack: {
        width: 42,
        height: 24,
        borderRadius: 999,
        backgroundColor: 'rgba(255,255,255,0.08)',
        justifyContent: 'center',
        paddingHorizontal: 3,
    },
    toggleTrackActive: {
        backgroundColor: Colors.accentSoft,
    },
    toggleThumb: {
        width: 18,
        height: 18,
        borderRadius: 9,
        backgroundColor: Colors.textSecondary,
    },
    toggleThumbActive: {
        transform: [{ translateX: 18 }],
        backgroundColor: Colors.accent,
    },
    grid2: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    selectCard: {
        width: '48%',
        minWidth: 150,
        borderRadius: Layout.radiusLg,
        borderWidth: 1,
        borderColor: Colors.strokeSoft,
        backgroundColor: 'rgba(255,255,255,0.03)',
        padding: 16,
    },
    selectCardActive: {
        borderColor: 'rgba(99,199,255,0.32)',
        backgroundColor: 'rgba(99,199,255,0.08)',
    },
    selectIconWrap: {
        width: 42,
        height: 42,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255,255,255,0.04)',
        marginBottom: 14,
    },
    selectIconWrapActive: {
        backgroundColor: Colors.accentSoft,
    },
    selectTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: Colors.textPrimary,
    },
    selectTitleActive: {
        color: Colors.textPrimary,
    },
    selectSubtitle: {
        fontSize: 12,
        lineHeight: 18,
        color: Colors.textSecondary,
        marginTop: 6,
    },
    stack: {
        gap: 12,
    },
    selectRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        borderRadius: Layout.radiusLg,
        borderWidth: 1,
        borderColor: Colors.strokeSoft,
        backgroundColor: 'rgba(255,255,255,0.03)',
        padding: 15,
    },
    selectRowActive: {
        borderColor: 'rgba(99,199,255,0.32)',
        backgroundColor: 'rgba(99,199,255,0.08)',
    },
    selectRowIcon: {
        width: 40,
        height: 40,
        borderRadius: 14,
        backgroundColor: 'rgba(255,255,255,0.04)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    selectRowIconActive: {
        backgroundColor: Colors.accentSoft,
    },
    selectRowCopy: {
        flex: 1,
    },
    selectRowTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: Colors.textPrimary,
    },
    selectRowSubtitle: {
        marginTop: 4,
        fontSize: 12,
        lineHeight: 18,
        color: Colors.textSecondary,
    },
    summaryHero: {
        gap: 10,
        marginBottom: 18,
    },
    summaryHeroBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        alignSelf: 'flex-start',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 999,
        backgroundColor: 'rgba(46,211,154,0.12)',
        borderWidth: 1,
        borderColor: 'rgba(46,211,154,0.22)',
    },
    summaryHeroBadgeText: {
        fontSize: 12,
        fontWeight: '700',
        color: Colors.success,
    },
    summaryCard: {
        borderRadius: Layout.radiusLg,
        borderWidth: 1,
        borderColor: Colors.strokeSoft,
        backgroundColor: 'rgba(18,25,37,0.82)',
        padding: 16,
        gap: 14,
    },
    summaryRow: {
        gap: 5,
    },
    summaryLabel: {
        ...Typography.dataLabel,
    },
    summaryValue: {
        fontSize: 14,
        lineHeight: 20,
        fontWeight: '600',
        color: Colors.textPrimary,
    },
    completeButton: {
        minHeight: 52,
        borderRadius: Layout.buttonRadius,
        backgroundColor: Colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 18,
        borderWidth: 1,
        borderColor: 'rgba(255,122,147,0.18)',
    },
    completeButtonText: {
        fontSize: 15,
        fontWeight: '800',
        color: Colors.white,
    },
    footer: {
        borderTopWidth: 1,
        borderTopColor: Colors.strokeSoft,
        backgroundColor: 'rgba(10,14,20,0.96)',
        paddingHorizontal: Spacing.lg,
        paddingTop: 12,
        paddingBottom: 18,
        gap: 12,
    },
    footerMeta: {
        gap: 4,
    },
    footerMetaLabel: {
        ...Typography.dataLabel,
        color: Colors.accent,
    },
    footerMetaText: {
        fontSize: 12,
        color: Colors.textSecondary,
    },
    footerActions: {
        flexDirection: 'row',
        gap: 10,
    },
    backButton: {
        minHeight: 48,
        minWidth: 92,
        borderRadius: Layout.buttonRadius,
        backgroundColor: 'rgba(255,255,255,0.04)',
        borderWidth: 1,
        borderColor: Colors.strokeSoft,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 16,
    },
    backButtonText: {
        fontSize: 14,
        fontWeight: '700',
        color: Colors.textPrimary,
    },
    nextButton: {
        flex: 1,
        minHeight: 48,
        borderRadius: Layout.buttonRadius,
        backgroundColor: Colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        gap: 8,
        borderWidth: 1,
        borderColor: 'rgba(255,122,147,0.18)',
    },
    nextButtonText: {
        fontSize: 14,
        fontWeight: '800',
        color: Colors.white,
    },
    disabledButton: {
        opacity: 0.45,
    },
});
