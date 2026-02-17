import React, { useState, useRef, useMemo } from 'react';
import {
    View, Text, TextInput, StyleSheet, TouchableOpacity,
    Alert, Animated, KeyboardAvoidingView, Platform, StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppStore } from '../../store/useAppStore';

// ── Design tokens matching the HTML mockup ──
const C = {
    primary: '#ea103c',
    bg: '#1a1a1a',
    surface: '#2d2d2d',
    border: '#404040',
    neutral100: '#f5f5f5',
    neutral400: '#a3a3a3',
    neutral500: '#a3a3a3',
    neutral700: '#525252',
    neutral800: '#404040',
    white: '#ffffff',
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
};

// ── Password strength utility ──
const getPasswordStrength = (pwd: string): { level: 'weak' | 'fair' | 'strong'; score: number; color: string } => {
    let score = 0;
    if (pwd.length >= 8) score++;
    if (pwd.length >= 12) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;
    if (score <= 1) return { level: 'weak', score: 0.33, color: C.error };
    if (score <= 3) return { level: 'fair', score: 0.66, color: C.warning };
    return { level: 'strong', score: 1, color: C.success };
};

// ════════════════════════════════════════════════════════════════════
//  SIGN IN
// ════════════════════════════════════════════════════════════════════
export const SignInScreen = ({ navigation }: any) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const { signIn, isLoading } = useAppStore();

    const handleSignIn = async () => {
        if (!email || !password) {
            Alert.alert('Error', 'Please enter both email and password.');
            return;
        }
        const success = await signIn(email, password);
        if (!success) {
            Alert.alert('Login Failed', 'Invalid credentials. Try demo@revsync.com / garage');
        }
    };

    return (
        <View style={styles.root}>
            <StatusBar barStyle="light-content" />
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardView}
            >
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.title}>Sign In</Text>
                    <Text style={styles.subtitle}>Welcome back to RevSync.</Text>
                </View>

                {/* Form */}
                <View style={styles.form}>
                    {/* Email Input */}
                    <View style={styles.inputContainer}>
                        <Ionicons name="mail-outline" size={20} color={C.neutral500} style={styles.inputIcon} />
                        <TextInput
                            style={styles.input}
                            placeholder="Enter your email"
                            placeholderTextColor={C.neutral500}
                            value={email}
                            onChangeText={setEmail}
                            autoCapitalize="none"
                            keyboardType="email-address"
                        />
                    </View>

                    {/* Password Input */}
                    <View style={styles.inputContainer}>
                        <Ionicons name="lock-closed-outline" size={20} color={C.neutral500} style={styles.inputIcon} />
                        <TextInput
                            style={styles.input}
                            placeholder="Enter your password"
                            placeholderTextColor={C.neutral500}
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry={!showPassword}
                        />
                        <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                            <Ionicons name={showPassword ? 'eye-outline' : 'eye-off-outline'} size={20} color={C.neutral500} />
                        </TouchableOpacity>
                    </View>

                    {/* Forgot Password */}
                    <TouchableOpacity
                        style={styles.forgotRow}
                        onPress={() => Alert.alert('Forgot Password', 'Please check your email to reset your password.')}
                    >
                        <Text style={styles.forgotText}>Forgot password?</Text>
                    </TouchableOpacity>

                    {/* Sign In Button */}
                    <TouchableOpacity
                        style={[styles.primaryBtn, isLoading && { opacity: 0.7 }]}
                        onPress={handleSignIn}
                        activeOpacity={0.85}
                        disabled={isLoading}
                    >
                        <Text style={styles.primaryBtnText}>
                            {isLoading ? 'Signing In...' : 'Sign In'}
                        </Text>
                        {!isLoading && <Ionicons name="arrow-forward" size={20} color={C.white} />}
                    </TouchableOpacity>

                    {/* Create Account Link */}
                    <View style={styles.switchRow}>
                        <Text style={styles.switchText}>Don't have an account?</Text>
                        <TouchableOpacity onPress={() => navigation.navigate('SignUp')}>
                            <Text style={styles.switchLink}> Create account</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </KeyboardAvoidingView>

            {/* Footer */}
            <Text style={styles.termsFooter}>
                By signing in, you agree to our Terms of Service and Privacy Policy.
            </Text>
        </View>
    );
};

// ════════════════════════════════════════════════════════════════════
//  SIGN UP
// ════════════════════════════════════════════════════════════════════
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
            Alert.alert('Error', 'Please fill all fields.');
            return;
        }
        if (password !== confirmPassword) {
            shake();
            Alert.alert('Error', 'Passwords do not match.');
            return;
        }
        if (!termsAccepted) {
            shake();
            Alert.alert('Error', 'Please accept the Terms & Conditions to continue.');
            return;
        }
        const success = await signUp(email, password);
        if (!success) {
            Alert.alert('Error', 'Failed to create account.');
        }
    };

    return (
        <View style={styles.root}>
            <StatusBar barStyle="light-content" />
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardView}
            >
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.title}>Create Account</Text>
                    <Text style={styles.subtitle}>Join the RevSync community.</Text>
                </View>

                <Animated.View style={[styles.form, { transform: [{ translateX: shakeAnim }] }]}>
                    {/* Email */}
                    <View style={styles.inputContainer}>
                        <Ionicons name="mail-outline" size={20} color={C.neutral500} style={styles.inputIcon} />
                        <TextInput
                            style={styles.input}
                            placeholder="Enter your email"
                            placeholderTextColor={C.neutral500}
                            value={email}
                            onChangeText={setEmail}
                            autoCapitalize="none"
                            keyboardType="email-address"
                        />
                    </View>

                    {/* Password */}
                    <View style={styles.inputContainer}>
                        <Ionicons name="lock-closed-outline" size={20} color={C.neutral500} style={styles.inputIcon} />
                        <TextInput
                            style={styles.input}
                            placeholder="Min 8 characters"
                            placeholderTextColor={C.neutral500}
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry={!showPassword}
                        />
                        <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                            <Ionicons name={showPassword ? 'eye-outline' : 'eye-off-outline'} size={20} color={C.neutral500} />
                        </TouchableOpacity>
                    </View>

                    {/* Strength meter */}
                    {password.length > 0 && (
                        <View style={styles.strengthRow}>
                            <View style={styles.strengthTrack}>
                                <View style={[styles.strengthFill, { width: `${strength.score * 100}%`, backgroundColor: strength.color }]} />
                            </View>
                            <Text style={[styles.strengthLabel, { color: strength.color }]}>
                                {strength.level.charAt(0).toUpperCase() + strength.level.slice(1)}
                            </Text>
                        </View>
                    )}

                    {/* Confirm Password */}
                    <View style={styles.inputContainer}>
                        <Ionicons name="lock-closed-outline" size={20} color={C.neutral500} style={styles.inputIcon} />
                        <TextInput
                            style={styles.input}
                            placeholder="Re-enter password"
                            placeholderTextColor={C.neutral500}
                            value={confirmPassword}
                            onChangeText={setConfirmPassword}
                            secureTextEntry
                        />
                    </View>

                    {/* Terms checkbox */}
                    <TouchableOpacity style={styles.termsRow} onPress={() => setTermsAccepted(!termsAccepted)} activeOpacity={0.7}>
                        <View style={[styles.checkbox, termsAccepted && styles.checkboxChecked]}>
                            {termsAccepted && <Ionicons name="checkmark" size={14} color="#FFF" />}
                        </View>
                        <Text style={styles.termsText}>
                            I agree to the <Text style={styles.termsLink}>Terms & Conditions</Text> and <Text style={styles.termsLink}>Privacy Policy</Text>
                        </Text>
                    </TouchableOpacity>

                    {/* Sign Up Button */}
                    <TouchableOpacity
                        style={[styles.primaryBtn, (!termsAccepted || isLoading) && { opacity: 0.5 }]}
                        onPress={handleSignUp}
                        activeOpacity={0.85}
                        disabled={!termsAccepted || isLoading}
                    >
                        <Text style={styles.primaryBtnText}>
                            {isLoading ? 'Creating Account...' : 'Create Account'}
                        </Text>
                        {!isLoading && <Ionicons name="arrow-forward" size={20} color={C.white} />}
                    </TouchableOpacity>

                    {/* Switch to Sign In */}
                    <View style={styles.switchRow}>
                        <Text style={styles.switchText}>Already have an account?</Text>
                        <TouchableOpacity onPress={() => navigation.goBack()}>
                            <Text style={styles.switchLink}> Sign In</Text>
                        </TouchableOpacity>
                    </View>
                </Animated.View>
            </KeyboardAvoidingView>

            <Text style={styles.termsFooter}>
                By creating an account, you agree to our Terms of Service and Privacy Policy.
            </Text>
        </View>
    );
};

// ════════════════════════════════════════════════════════════════════
//  STYLES
// ════════════════════════════════════════════════════════════════════
const styles = StyleSheet.create({
    root: {
        flex: 1,
        backgroundColor: C.bg,
        justifyContent: 'center',
        paddingHorizontal: 24,
    },
    keyboardView: {
        flex: 1,
        justifyContent: 'center',
    },

    // ── Header ──
    header: {
        marginBottom: 40,
    },
    title: {
        fontSize: 36,
        fontWeight: '800',
        color: C.white,
        letterSpacing: -0.5,
        marginBottom: 6,
    },
    subtitle: {
        fontSize: 18,
        color: C.neutral500,
    },

    // ── Form ──
    form: {
        gap: 16,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: C.surface,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: C.border,
        overflow: 'hidden',
    },
    inputIcon: {
        paddingLeft: 16,
    },
    input: {
        flex: 1,
        paddingVertical: 16,
        paddingHorizontal: 12,
        color: C.white,
        fontSize: 16,
    },
    eyeBtn: {
        paddingRight: 16,
        paddingVertical: 16,
    },

    // ── Forgot ──
    forgotRow: {
        alignSelf: 'flex-end',
    },
    forgotText: {
        fontSize: 14,
        fontWeight: '500',
        color: C.neutral500,
    },

    // ── Primary Button ──
    primaryBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: C.primary,
        paddingVertical: 16,
        borderRadius: 16,
        marginTop: 8,
        // glow
        shadowColor: C.primary,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.4,
        shadowRadius: 15,
        elevation: 6,
    },
    primaryBtnText: {
        fontSize: 18,
        fontWeight: '700',
        color: C.white,
    },

    // ── Switch row ──
    switchRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 24,
    },
    switchText: {
        color: C.neutral500,
        fontSize: 15,
    },
    switchLink: {
        color: C.primary,
        fontWeight: '700',
        fontSize: 15,
    },

    // ── Terms footer ──
    termsFooter: {
        position: 'absolute',
        bottom: Platform.OS === 'ios' ? 40 : 24,
        left: 24,
        right: 24,
        textAlign: 'center',
        fontSize: 11,
        color: C.neutral800,
    },

    // ── Password strength ──
    strengthRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginTop: -8,
    },
    strengthTrack: {
        flex: 1,
        height: 4,
        backgroundColor: 'rgba(255,255,255,0.06)',
        borderRadius: 2,
        overflow: 'hidden',
    },
    strengthFill: {
        height: '100%',
        borderRadius: 2,
    },
    strengthLabel: {
        fontSize: 12,
        fontWeight: '600',
        width: 48,
    },

    // ── Terms checkbox ──
    termsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingVertical: 4,
    },
    checkbox: {
        width: 22,
        height: 22,
        borderRadius: 4,
        borderWidth: 2,
        borderColor: C.neutral500,
        alignItems: 'center',
        justifyContent: 'center',
    },
    checkboxChecked: {
        backgroundColor: C.primary,
        borderColor: C.primary,
    },
    termsText: {
        flex: 1,
        fontSize: 13,
        color: C.neutral500,
        lineHeight: 18,
    },
    termsLink: {
        color: C.primary,
        fontWeight: '600',
    },
});
