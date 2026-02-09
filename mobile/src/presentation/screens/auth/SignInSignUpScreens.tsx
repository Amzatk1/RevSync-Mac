import React, { useState, useRef, useMemo } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Alert, Animated } from 'react-native';
import { Theme } from '../../theme';
import { Screen, PrimaryButton } from '../../components/SharedComponents';
import { useAppStore } from '../../store/useAppStore';
import { Ionicons } from '@expo/vector-icons';

// Password strength utility
const getPasswordStrength = (pwd: string): { level: 'weak' | 'fair' | 'strong'; score: number; color: string } => {
    let score = 0;
    if (pwd.length >= 8) score++;
    if (pwd.length >= 12) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;
    if (score <= 1) return { level: 'weak', score: 0.33, color: Theme.Colors.error };
    if (score <= 3) return { level: 'fair', score: 0.66, color: Theme.Colors.warning };
    return { level: 'strong', score: 1, color: Theme.Colors.success };
};

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
        if (success) {
            // Navigation to Main is handled by AppNavigator observing isAuthenticated
        } else {
            Alert.alert('Login Failed', 'Invalid credentials. Try demo@revsync.com / garage');
        }
    };

    return (
        <Screen>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={Theme.Colors.text} />
                </TouchableOpacity>
                <Text style={styles.title}>Sign In</Text>
            </View>

            <View style={styles.form}>
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Email</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="rider@example.com"
                        placeholderTextColor={Theme.Colors.textSecondary}
                        value={email}
                        onChangeText={setEmail}
                        autoCapitalize="none"
                        keyboardType="email-address"
                    />
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Password</Text>
                    <View style={styles.passwordContainer}>
                        <TextInput
                            style={[styles.input, { flex: 1, borderWidth: 0, marginTop: 0 }]}
                            placeholder="Password"
                            placeholderTextColor={Theme.Colors.textSecondary}
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry={!showPassword}
                        />
                        <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={{ padding: 8 }}>
                            <Ionicons name={showPassword ? "eye-off" : "eye"} size={20} color={Theme.Colors.textSecondary} />
                        </TouchableOpacity>
                    </View>
                </View>

                <TouchableOpacity
                    style={styles.forgotPass}
                    onPress={() => Alert.alert('Forgot Password', 'Please check your email to reset your password.')}
                >
                    <Text style={styles.linkText}>Forgot Password?</Text>
                </TouchableOpacity>

                <PrimaryButton
                    title={isLoading ? 'Signing In...' : 'Sign In'}
                    onPress={handleSignIn}
                    loading={isLoading}
                    style={{ marginTop: Theme.Spacing.lg }}
                />

                <View style={styles.footerContainer}>
                    <Text style={styles.footerText}>Don't have an account?</Text>
                    <TouchableOpacity onPress={() => navigation.navigate('SignUp')}>
                        <Text style={styles.linkText}> Create Account</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Screen>
    );
};

export const SignUpScreen = ({ navigation }: any) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [termsAccepted, setTermsAccepted] = useState(false);
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
        if (success) {
            // Navigation handled by AppNavigator
        } else {
            Alert.alert('Error', 'Failed to create account.');
        }
    };

    return (
        <Screen>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={Theme.Colors.text} />
                </TouchableOpacity>
                <Text style={styles.title}>Create Account</Text>
            </View>

            <Animated.View style={[styles.form, { transform: [{ translateX: shakeAnim }] }]}>
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Email</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="rider@example.com"
                        placeholderTextColor={Theme.Colors.textSecondary}
                        value={email}
                        onChangeText={setEmail}
                        autoCapitalize="none"
                        keyboardType="email-address"
                    />
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Password</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Min 8 characters"
                        placeholderTextColor={Theme.Colors.textSecondary}
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry
                    />
                    {/* Password Strength Meter */}
                    {password.length > 0 && (
                        <View style={styles.strengthContainer}>
                            <View style={styles.strengthTrack}>
                                <View style={[styles.strengthFill, { width: `${strength.score * 100}%`, backgroundColor: strength.color }]} />
                            </View>
                            <Text style={[styles.strengthLabel, { color: strength.color }]}>
                                {strength.level.charAt(0).toUpperCase() + strength.level.slice(1)}
                            </Text>
                        </View>
                    )}
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Confirm Password</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Re-enter password"
                        placeholderTextColor={Theme.Colors.textSecondary}
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                        secureTextEntry
                    />
                </View>

                {/* Terms Checkbox */}
                <TouchableOpacity
                    style={styles.termsRow}
                    onPress={() => setTermsAccepted(!termsAccepted)}
                    activeOpacity={0.7}
                >
                    <View style={[styles.termsCheckbox, termsAccepted && styles.termsCheckboxChecked]}>
                        {termsAccepted && <Ionicons name="checkmark" size={14} color="#FFF" />}
                    </View>
                    <Text style={styles.termsText}>
                        I agree to the{' '}
                        <Text style={styles.termsLink}>Terms & Conditions</Text>
                        {' '}and{' '}
                        <Text style={styles.termsLink}>Privacy Policy</Text>
                    </Text>
                </TouchableOpacity>

                <PrimaryButton
                    title={isLoading ? 'Creating Account...' : 'Sign Up'}
                    onPress={handleSignUp}
                    loading={isLoading}
                    disabled={!termsAccepted}
                    style={{ marginTop: Theme.Spacing.md }}
                />
            </Animated.View>
        </Screen>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Theme.Colors.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: Theme.Spacing.md,
    },
    backButton: {
        marginRight: Theme.Spacing.md,
        padding: 8,
    },
    title: {
        ...Theme.Typography.h1,
        fontSize: 28,
    },
    form: {
        padding: Theme.Spacing.lg,
        gap: Theme.Spacing.md,
    },
    inputGroup: {
        gap: 8,
    },
    label: {
        ...Theme.Typography.body,
        fontWeight: '600',
        marginLeft: 4,
        color: Theme.Colors.textSecondary,
    },
    input: {
        backgroundColor: Theme.Colors.surface,
        borderColor: Theme.Colors.border,
        borderWidth: 1,
        borderRadius: Theme.Layout.borderRadius,
        padding: 16,
        color: Theme.Colors.text,
        fontSize: 16,
    },
    passwordContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Theme.Colors.surface,
        borderColor: Theme.Colors.border,
        borderWidth: 1,
        borderRadius: Theme.Layout.borderRadius,
    },
    forgotPass: {
        alignSelf: 'flex-end',
        marginTop: 8,
    },
    linkText: {
        color: Theme.Colors.primary,
        fontWeight: 'bold',
    },
    footerContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: Theme.Spacing.xl,
    },
    footerText: {
        color: Theme.Colors.textSecondary,
    },
    strengthContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 8,
        gap: 8,
    },
    strengthTrack: {
        flex: 1,
        height: 4,
        backgroundColor: Theme.Colors.surfaceHighlight,
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
        width: 50,
    },
    termsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingVertical: 4,
    },
    termsCheckbox: {
        width: 22,
        height: 22,
        borderRadius: 4,
        borderWidth: 2,
        borderColor: Theme.Colors.textSecondary,
        alignItems: 'center',
        justifyContent: 'center',
    },
    termsCheckboxChecked: {
        backgroundColor: Theme.Colors.primary,
        borderColor: Theme.Colors.primary,
    },
    termsText: {
        flex: 1,
        fontSize: 13,
        color: Theme.Colors.textSecondary,
        lineHeight: 18,
    },
    termsLink: {
        color: Theme.Colors.primary,
        fontWeight: '600',
    },
});
