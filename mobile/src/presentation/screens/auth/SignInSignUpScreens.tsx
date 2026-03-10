import React, { useMemo, useRef, useState } from 'react';
import {
    Alert,
    Animated,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppStore } from '../../store/useAppStore';
import { Theme } from '../../theme';
import { ServiceLocator } from '../../../di/ServiceLocator';

const { Colors, Layout, Motion, Spacing, Typography } = Theme;

const getPasswordStrength = (pwd: string): { level: 'weak' | 'fair' | 'strong'; score: number; color: string } => {
    let score = 0;
    if (pwd.length >= 8) score++;
    if (pwd.length >= 12) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;
    if (score <= 1) return { level: 'weak', score: 0.33, color: Colors.error };
    if (score <= 3) return { level: 'fair', score: 0.66, color: Colors.warning };
    return { level: 'strong', score: 1, color: Colors.success };
};

const AuthShell = ({
    title,
    subtitle,
    children,
    footer,
}: {
    title: string;
    subtitle: string;
    children: React.ReactNode;
    footer?: React.ReactNode;
}) => {
    const insets = useSafeAreaInsets();

    return (
        <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardView}
                keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top : 0}
            >
                <View style={styles.background}>
                    <LinearGradient colors={[Colors.shell, Colors.surfaceMuted, Colors.shellAlt]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
                    <LinearGradient colors={[Colors.accentSoft, 'rgba(99,199,255,0)']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.orbTop} />
                    <LinearGradient colors={['rgba(234,16,60,0.12)', 'rgba(234,16,60,0)']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.orbBottom} />
                </View>

                <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
                    <View style={styles.brandWrap}>
                        <View style={styles.logoBadge}>
                            <Text style={styles.logoText}>R</Text>
                        </View>
                        <View>
                            <Text style={styles.brandTitle}>RevSync Mobile</Text>
                            <Text style={styles.brandSubtitle}>Guided, safety-critical ECU workflows</Text>
                        </View>
                    </View>

                    <View style={styles.heroCopy}>
                        <Text style={styles.kicker}>Operator Access</Text>
                        <Text style={styles.heroTitle}>{title}</Text>
                        <Text style={styles.heroSubtitle}>{subtitle}</Text>
                    </View>

                    <View style={styles.trustRow}>
                        {['Signed releases', 'Backup-first flashing', 'Recovery guidance'].map((item) => (
                            <View key={item} style={styles.trustChip}>
                                <Ionicons name="checkmark-circle" size={14} color={Colors.info} />
                                <Text style={styles.trustChipText}>{item}</Text>
                            </View>
                        ))}
                    </View>

                    <View style={styles.card}>{children}</View>

                    {footer}
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const Field = ({
    icon,
    placeholder,
    value,
    onChangeText,
    secureTextEntry,
    keyboardType,
    right,
}: {
    icon: keyof typeof Ionicons.glyphMap;
    placeholder: string;
    value: string;
    onChangeText: (value: string) => void;
    secureTextEntry?: boolean;
    keyboardType?: 'default' | 'email-address';
    right?: React.ReactNode;
}) => (
    <View style={styles.inputContainer}>
        <Ionicons name={icon} size={18} color={Colors.textTertiary} style={styles.inputIcon} />
        <TextInput
            style={styles.input}
            placeholder={placeholder}
            placeholderTextColor={Colors.textTertiary}
            value={value}
            onChangeText={onChangeText}
            autoCapitalize="none"
            keyboardType={keyboardType}
            secureTextEntry={secureTextEntry}
        />
        {right}
    </View>
);

export const SignInScreen = ({ navigation }: any) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const { signIn, isLoading } = useAppStore();
    const [resettingPassword, setResettingPassword] = useState(false);

    const handleSignIn = async () => {
        if (!email || !password) {
            Alert.alert('Missing details', 'Enter both email and password to continue.');
            return;
        }
        const success = await signIn(email, password);
        if (!success) {
            Alert.alert('Sign in failed', 'Invalid credentials. Try demo@revsync.com / garage.');
        }
    };

    const handlePasswordReset = async () => {
        if (!email) {
            Alert.alert('Email required', 'Enter your account email first so reset instructions can be sent.');
            return;
        }
        setResettingPassword(true);
        try {
            const success = await ServiceLocator.getAuthService().resetPassword(email);
            Alert.alert(
                success ? 'Reset requested' : 'Reset unavailable',
                success
                    ? 'If an account exists for that email, reset instructions have been sent.'
                    : 'Unable to start password reset right now.'
            );
        } finally {
            setResettingPassword(false);
        }
    };

    return (
        <AuthShell title="Sign in to continue" subtitle="Resume flashing, downloads, and garage workflows without losing your current safety state.">
            <Field icon="mail-outline" placeholder="Email address" value={email} onChangeText={setEmail} keyboardType="email-address" />
            <Field
                icon="lock-closed-outline"
                placeholder="Password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                right={
                    <TouchableOpacity onPress={() => setShowPassword((prev) => !prev)} style={styles.inputAction}>
                        <Ionicons name={showPassword ? 'eye-outline' : 'eye-off-outline'} size={18} color={Colors.textTertiary} />
                    </TouchableOpacity>
                }
            />

            <TouchableOpacity onPress={handlePasswordReset} style={styles.inlineAction} disabled={resettingPassword}>
                <Text style={styles.inlineActionText}>{resettingPassword ? 'Sending reset...' : 'Forgot password?'}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.primaryButton, isLoading && styles.buttonDisabled]} onPress={handleSignIn} disabled={isLoading} activeOpacity={0.88}>
                <Text style={styles.primaryButtonText}>{isLoading ? 'Signing in...' : 'Sign In'}</Text>
                {!isLoading && <Ionicons name="arrow-forward" size={18} color={Colors.white} />}
            </TouchableOpacity>

            <View style={styles.switchRow}>
                <Text style={styles.switchText}>Don&apos;t have an account?</Text>
                <TouchableOpacity onPress={() => navigation.navigate('SignUp')}>
                    <Text style={styles.switchLink}>Create account</Text>
                </TouchableOpacity>
            </View>
        </AuthShell>
    );
};

export const SignUpScreen = ({ navigation }: any) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [termsAccepted, setTermsAccepted] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const { signUp, isLoading } = useAppStore();
    const shakeAnim = useRef(new Animated.Value(0)).current;

    const strength = useMemo(() => getPasswordStrength(password), [password]);

    const shake = () => {
        Animated.sequence([
            Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
            Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
            Animated.timing(shakeAnim, { toValue: 6, duration: 50, useNativeDriver: true }),
            Animated.timing(shakeAnim, { toValue: -6, duration: 50, useNativeDriver: true }),
            Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
        ]).start();
    };

    const handleSignUp = async () => {
        if (!email || !password || !confirmPassword) {
            shake();
            Alert.alert('Missing details', 'Fill all fields before continuing.');
            return;
        }
        if (password !== confirmPassword) {
            shake();
            Alert.alert('Password mismatch', 'The confirmation password does not match.');
            return;
        }
        if (!termsAccepted) {
            shake();
            Alert.alert('Agreement required', 'Accept the terms and privacy policy to create an account.');
            return;
        }
        const success = await signUp(email, password);
        if (!success) {
            Alert.alert('Account creation failed', 'Unable to create account right now.');
        }
    };

    return (
        <AuthShell
            title="Create a RevSync account"
            subtitle="Set up access for guided mobile workflows, entitlement-backed downloads, and safety-gated flashing."
            footer={<Text style={styles.footerCopy}>Account creation keeps legal acceptance and safety onboarding explicit before any flashing action.</Text>}
        >
            <Animated.View style={{ transform: [{ translateX: shakeAnim }] }}>
                <Field icon="mail-outline" placeholder="Email address" value={email} onChangeText={setEmail} keyboardType="email-address" />
                <Field
                    icon="lock-closed-outline"
                    placeholder="Create password"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    right={
                        <TouchableOpacity onPress={() => setShowPassword((prev) => !prev)} style={styles.inputAction}>
                            <Ionicons name={showPassword ? 'eye-outline' : 'eye-off-outline'} size={18} color={Colors.textTertiary} />
                        </TouchableOpacity>
                    }
                />

                {password.length > 0 && (
                    <View style={styles.strengthWrap}>
                        <View style={styles.strengthTrack}>
                            <View style={[styles.strengthFill, { width: `${strength.score * 100}%`, backgroundColor: strength.color }]} />
                        </View>
                        <Text style={[styles.strengthLabel, { color: strength.color }]}>{strength.level}</Text>
                    </View>
                )}

                <Field icon="shield-checkmark-outline" placeholder="Confirm password" value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry />

                <Pressable style={styles.checkboxRow} onPress={() => setTermsAccepted((prev) => !prev)}>
                    <View style={[styles.checkbox, termsAccepted && styles.checkboxChecked]}>
                        {termsAccepted && <Ionicons name="checkmark" size={14} color={Colors.white} />}
                    </View>
                    <Text style={styles.checkboxText}>
                        I agree to the <Text style={styles.checkboxLink}>Terms</Text> and <Text style={styles.checkboxLink}>Privacy Policy</Text>
                    </Text>
                </Pressable>

                <TouchableOpacity
                    style={[styles.primaryButton, (!termsAccepted || isLoading) && styles.buttonDisabled]}
                    onPress={handleSignUp}
                    disabled={!termsAccepted || isLoading}
                    activeOpacity={0.88}
                >
                    <Text style={styles.primaryButtonText}>{isLoading ? 'Creating account...' : 'Create Account'}</Text>
                    {!isLoading && <Ionicons name="arrow-forward" size={18} color={Colors.white} />}
                </TouchableOpacity>

                <View style={styles.switchRow}>
                    <Text style={styles.switchText}>Already have an account?</Text>
                    <TouchableOpacity onPress={() => navigation.goBack()}>
                        <Text style={styles.switchLink}>Sign in</Text>
                    </TouchableOpacity>
                </View>
            </Animated.View>
        </AuthShell>
    );
};

const styles = StyleSheet.create({
    safe: {
        flex: 1,
        backgroundColor: Colors.shell,
    },
    keyboardView: {
        flex: 1,
    },
    background: {
        ...StyleSheet.absoluteFillObject,
    },
    orbTop: {
        position: 'absolute',
        width: 360,
        height: 360,
        borderRadius: 360,
        top: -160,
        left: -150,
    },
    orbBottom: {
        position: 'absolute',
        width: 320,
        height: 320,
        borderRadius: 320,
        right: -120,
        bottom: -140,
    },
    scrollContent: {
        paddingHorizontal: Spacing.lg,
        paddingTop: Spacing.xxl,
        paddingBottom: Spacing.max,
    },
    brandWrap: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    logoBadge: {
        width: 46,
        height: 46,
        borderRadius: 16,
        backgroundColor: Colors.surface2,
        borderWidth: 1,
        borderColor: Colors.strokeStrong,
        alignItems: 'center',
        justifyContent: 'center',
    },
    logoText: {
        color: Colors.textPrimary,
        fontSize: 20,
        fontWeight: '800',
    },
    brandTitle: {
        color: Colors.textPrimary,
        fontSize: 18,
        fontWeight: '800',
    },
    brandSubtitle: {
        color: Colors.textSecondary,
        fontSize: 12,
        marginTop: 2,
    },
    heroCopy: {
        marginTop: Spacing.hero,
        marginBottom: Spacing.xl,
    },
    kicker: {
        ...Typography.dataLabel,
        color: Colors.accent,
        marginBottom: 8,
    },
    heroTitle: {
        ...Typography.display,
    },
    heroSubtitle: {
        ...Typography.body,
        marginTop: 10,
        maxWidth: 340,
    },
    trustRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: Spacing.xl,
    },
    trustChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 999,
        backgroundColor: 'rgba(255,255,255,0.04)',
        borderWidth: 1,
        borderColor: Colors.strokeSoft,
    },
    trustChipText: {
        fontSize: 12,
        fontWeight: '700',
        color: Colors.textSecondary,
    },
    card: {
        borderRadius: Layout.radiusXl,
        backgroundColor: 'rgba(18,25,37,0.88)',
        borderWidth: 1,
        borderColor: Colors.strokeSoft,
        padding: Spacing.xl,
        gap: 14,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: Layout.radiusMd,
        borderWidth: 1,
        borderColor: Colors.strokeSoft,
        backgroundColor: 'rgba(255,255,255,0.03)',
        minHeight: 54,
    },
    inputIcon: {
        marginLeft: 14,
    },
    input: {
        flex: 1,
        paddingHorizontal: 12,
        paddingVertical: 14,
        color: Colors.textPrimary,
        fontSize: 15,
    },
    inputAction: {
        paddingHorizontal: 14,
        paddingVertical: 12,
    },
    inlineAction: {
        alignSelf: 'flex-start',
        paddingVertical: 4,
    },
    inlineActionText: {
        fontSize: 13,
        fontWeight: '600',
        color: Colors.accent,
    },
    primaryButton: {
        minHeight: 52,
        borderRadius: Layout.buttonRadius,
        backgroundColor: Colors.primary,
        borderWidth: 1,
        borderColor: 'rgba(255,122,147,0.18)',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        marginTop: 8,
    },
    primaryButtonText: {
        color: Colors.white,
        fontSize: 15,
        fontWeight: '800',
    },
    buttonDisabled: {
        opacity: 0.55,
    },
    switchRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 6,
        marginTop: 10,
    },
    switchText: {
        fontSize: 13,
        color: Colors.textSecondary,
    },
    switchLink: {
        fontSize: 13,
        fontWeight: '700',
        color: Colors.accent,
    },
    footerCopy: {
        ...Typography.small,
        marginTop: 14,
        textAlign: 'center',
        lineHeight: 18,
        color: Colors.textTertiary,
    },
    strengthWrap: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginTop: 10,
        marginBottom: 2,
    },
    strengthTrack: {
        flex: 1,
        height: 6,
        borderRadius: 999,
        backgroundColor: 'rgba(255,255,255,0.08)',
        overflow: 'hidden',
    },
    strengthFill: {
        height: '100%',
        borderRadius: 999,
    },
    strengthLabel: {
        minWidth: 48,
        textTransform: 'capitalize',
        fontSize: 12,
        fontWeight: '700',
    },
    checkboxRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 12,
        marginTop: 6,
    },
    checkbox: {
        width: 20,
        height: 20,
        marginTop: 2,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: Colors.strokeStrong,
        backgroundColor: 'rgba(255,255,255,0.03)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    checkboxChecked: {
        backgroundColor: Colors.primary,
        borderColor: Colors.primary,
    },
    checkboxText: {
        flex: 1,
        fontSize: 13,
        lineHeight: 19,
        color: Colors.textSecondary,
    },
    checkboxLink: {
        color: Colors.accent,
        fontWeight: '700',
    },
});
