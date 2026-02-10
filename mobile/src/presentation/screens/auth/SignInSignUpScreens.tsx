import React, { useMemo, useRef, useState } from 'react';
import {
    View,
    Text,
    TextInput,
    StyleSheet,
    TouchableOpacity,
    Alert,
    Animated,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Theme } from '../../theme';
import { Screen } from '../../components/SharedComponents';
import { useAppStore } from '../../store/useAppStore';
import { LegalContent } from '../../constants/LegalContent';

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

const openLegalDoc = (navigation: any, title: string, content: string) => {
    navigation.navigate('LegalDocument', { title, content });
};

const AuthField = ({
    icon,
    placeholder,
    value,
    onChangeText,
    secureTextEntry,
    keyboardType,
    autoCapitalize = 'none',
    trailing,
}: any) => (
    <View style={styles.fieldWrap}>
        <Ionicons name={icon} size={20} color={Theme.Colors.textSecondary} />
        <TextInput
            style={styles.input}
            placeholder={placeholder}
            placeholderTextColor={Theme.Colors.textSecondary}
            value={value}
            onChangeText={onChangeText}
            autoCapitalize={autoCapitalize}
            autoCorrect={false}
            keyboardType={keyboardType}
            secureTextEntry={secureTextEntry}
        />
        {trailing}
    </View>
);

export const SignInScreen = ({ navigation }: any) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const { signIn, isLoading } = useAppStore();

    const handleSignIn = async () => {
        if (!email.trim() || !password) {
            Alert.alert('Missing details', 'Please enter your email and password.');
            return;
        }

        const success = await signIn(email.trim(), password);
        if (!success) {
            Alert.alert('Login Failed', 'Invalid credentials. Try demo@revsync.com / garage');
        }
    };

    return (
        <Screen>
            <KeyboardAvoidingView
                style={styles.page}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                <View style={styles.contentTop}>
                    <Text style={styles.authTitle}>Sign In</Text>
                    <Text style={styles.authSubtitle}>Welcome back to RevSync.</Text>

                    <View style={styles.fieldsStack}>
                        <AuthField
                            icon="mail"
                            placeholder="Enter your email"
                            value={email}
                            onChangeText={setEmail}
                            keyboardType="email-address"
                        />

                        <AuthField
                            icon="lock-closed"
                            placeholder="Enter your password"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry={!showPassword}
                            trailing={(
                                <TouchableOpacity onPress={() => setShowPassword(prev => !prev)} style={styles.eyeBtn}>
                                    <Ionicons
                                        name={showPassword ? 'eye-off' : 'eye'}
                                        size={20}
                                        color={Theme.Colors.textSecondary}
                                    />
                                </TouchableOpacity>
                            )}
                        />
                    </View>

                    <TouchableOpacity
                        style={styles.forgotPass}
                        onPress={() => Alert.alert('Forgot password', 'Password recovery will be available soon.')}
                    >
                        <Text style={styles.subtleLink}>Forgot password?</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.primaryBtn, isLoading && styles.btnDisabled]}
                        onPress={handleSignIn}
                        disabled={isLoading}
                        activeOpacity={0.9}
                    >
                        <Text style={styles.primaryBtnText}>{isLoading ? 'Signing In...' : 'Sign In'}</Text>
                        <Ionicons name="arrow-forward" size={22} color="#FFF" />
                    </TouchableOpacity>

                    <View style={styles.switchRow}>
                        <Text style={styles.switchText}>Don’t have an account?</Text>
                        <TouchableOpacity onPress={() => navigation.navigate('SignUp')}>
                            <Text style={styles.switchLink}> Create account</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={styles.legalFooter}>
                    <Text style={styles.legalText}>By signing in, you agree to our </Text>
                    <TouchableOpacity onPress={() => openLegalDoc(navigation, 'Terms & Conditions', LegalContent.TERMS)}>
                        <Text style={styles.legalLink}>Terms of Service</Text>
                    </TouchableOpacity>
                    <Text style={styles.legalText}> and </Text>
                    <TouchableOpacity onPress={() => openLegalDoc(navigation, 'Privacy Policy', LegalContent.PRIVACY)}>
                        <Text style={styles.legalLink}>Privacy Policy</Text>
                    </TouchableOpacity>
                    <Text style={styles.legalText}>.</Text>
                </View>
            </KeyboardAvoidingView>
        </Screen>
    );
};

export const SignUpScreen = ({ navigation }: any) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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
        if (!email.trim() || !password || !confirmPassword) {
            shake();
            Alert.alert('Missing details', 'Please complete all fields.');
            return;
        }
        if (password !== confirmPassword) {
            shake();
            Alert.alert('Password mismatch', 'Passwords do not match.');
            return;
        }
        if (password.length < 8) {
            shake();
            Alert.alert('Weak password', 'Password must be at least 8 characters.');
            return;
        }
        if (!termsAccepted) {
            shake();
            Alert.alert('Terms required', 'Please accept Terms & Conditions and Privacy Policy.');
            return;
        }

        const success = await signUp(email.trim(), password);
        if (!success) {
            Alert.alert('Sign Up Failed', 'Could not create account. Try again.');
        }
    };

    return (
        <Screen scroll>
            <KeyboardAvoidingView
                style={styles.page}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                <View style={styles.contentTop}>
                    <Text style={styles.authTitle}>Create Account</Text>
                    <Text style={styles.authSubtitle}>Start your RevSync journey.</Text>

                    <Animated.View style={[styles.fieldsStack, { transform: [{ translateX: shakeAnim }] }]}>
                        <AuthField
                            icon="mail"
                            placeholder="Enter your email"
                            value={email}
                            onChangeText={setEmail}
                            keyboardType="email-address"
                        />

                        <AuthField
                            icon="lock-closed"
                            placeholder="Create your password"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry={!showPassword}
                            trailing={(
                                <TouchableOpacity onPress={() => setShowPassword(prev => !prev)} style={styles.eyeBtn}>
                                    <Ionicons
                                        name={showPassword ? 'eye-off' : 'eye'}
                                        size={20}
                                        color={Theme.Colors.textSecondary}
                                    />
                                </TouchableOpacity>
                            )}
                        />

                        {password.length > 0 && (
                            <View style={styles.strengthContainer}>
                                <View style={styles.strengthTrack}>
                                    <View
                                        style={[
                                            styles.strengthFill,
                                            { width: `${strength.score * 100}%`, backgroundColor: strength.color },
                                        ]}
                                    />
                                </View>
                                <Text style={[styles.strengthLabel, { color: strength.color }]}>
                                    {strength.level.charAt(0).toUpperCase() + strength.level.slice(1)}
                                </Text>
                            </View>
                        )}

                        <AuthField
                            icon="shield-checkmark"
                            placeholder="Confirm your password"
                            value={confirmPassword}
                            onChangeText={setConfirmPassword}
                            secureTextEntry={!showConfirmPassword}
                            trailing={(
                                <TouchableOpacity onPress={() => setShowConfirmPassword(prev => !prev)} style={styles.eyeBtn}>
                                    <Ionicons
                                        name={showConfirmPassword ? 'eye-off' : 'eye'}
                                        size={20}
                                        color={Theme.Colors.textSecondary}
                                    />
                                </TouchableOpacity>
                            )}
                        />
                    </Animated.View>

                    <TouchableOpacity
                        style={styles.termsRow}
                        onPress={() => setTermsAccepted(prev => !prev)}
                        activeOpacity={0.75}
                    >
                        <View style={[styles.checkbox, termsAccepted && styles.checkboxChecked]}>
                            {termsAccepted && <Ionicons name="checkmark" size={14} color="#FFF" />}
                        </View>
                        <Text style={styles.termsText}>I agree to the </Text>
                        <TouchableOpacity onPress={() => openLegalDoc(navigation, 'Terms & Conditions', LegalContent.TERMS)}>
                            <Text style={styles.termsLink}>Terms</Text>
                        </TouchableOpacity>
                        <Text style={styles.termsText}> and </Text>
                        <TouchableOpacity onPress={() => openLegalDoc(navigation, 'Privacy Policy', LegalContent.PRIVACY)}>
                            <Text style={styles.termsLink}>Privacy Policy</Text>
                        </TouchableOpacity>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.primaryBtn, isLoading && styles.btnDisabled]}
                        onPress={handleSignUp}
                        disabled={isLoading}
                        activeOpacity={0.9}
                    >
                        <Text style={styles.primaryBtnText}>{isLoading ? 'Creating...' : 'Create Account'}</Text>
                        <Ionicons name="arrow-forward" size={22} color="#FFF" />
                    </TouchableOpacity>

                    <View style={styles.switchRow}>
                        <Text style={styles.switchText}>Already have an account?</Text>
                        <TouchableOpacity onPress={() => navigation.navigate('SignIn')}>
                            <Text style={styles.switchLink}> Sign in</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </Screen>
    );
};

const styles = StyleSheet.create({
    page: {
        flex: 1,
        paddingHorizontal: 24,
        paddingTop: 70,
        paddingBottom: 28,
        justifyContent: 'space-between',
    },
    contentTop: {
        gap: 18,
    },
    authTitle: {
        color: Theme.Colors.text,
        fontSize: 56,
        fontWeight: '800',
        letterSpacing: -1,
    },
    authSubtitle: {
        color: Theme.Colors.textSecondary,
        fontSize: 18,
        marginTop: -8,
        marginBottom: 18,
    },
    fieldsStack: {
        gap: 14,
    },
    fieldWrap: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
        backgroundColor: '#2A2A2F',
        borderRadius: 18,
        paddingHorizontal: 14,
        height: 78,
    },
    input: {
        flex: 1,
        color: Theme.Colors.text,
        fontSize: 17,
        marginLeft: 10,
    },
    eyeBtn: {
        padding: 8,
    },
    forgotPass: {
        alignSelf: 'flex-end',
        marginTop: 2,
        marginBottom: 6,
    },
    subtleLink: {
        color: Theme.Colors.textSecondary,
        fontSize: 15,
        fontWeight: '500',
    },
    primaryBtn: {
        height: 78,
        borderRadius: 18,
        backgroundColor: Theme.Colors.primary,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        shadowColor: Theme.Colors.primary,
        shadowOpacity: 0.35,
        shadowRadius: 16,
        shadowOffset: { width: 0, height: 8 },
        elevation: 7,
        marginTop: 2,
    },
    primaryBtnText: {
        color: '#FFF',
        fontSize: 20,
        fontWeight: '800',
        letterSpacing: 0.2,
    },
    btnDisabled: {
        opacity: 0.6,
    },
    switchRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 16,
        marginBottom: 4,
    },
    switchText: {
        color: Theme.Colors.textSecondary,
        fontSize: 16,
    },
    switchLink: {
        color: Theme.Colors.primary,
        fontSize: 16,
        fontWeight: '700',
    },
    legalFooter: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 20,
        paddingHorizontal: 8,
    },
    legalText: {
        color: '#494952',
        fontSize: 12,
        textAlign: 'center',
    },
    legalLink: {
        color: '#757584',
        fontSize: 12,
        textDecorationLine: 'underline',
    },
    strengthContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginTop: -4,
        marginBottom: 2,
    },
    strengthTrack: {
        flex: 1,
        height: 5,
        backgroundColor: Theme.Colors.surface,
        borderRadius: 3,
        overflow: 'hidden',
    },
    strengthFill: {
        height: '100%',
        borderRadius: 3,
    },
    strengthLabel: {
        width: 52,
        fontSize: 12,
        fontWeight: '700',
        textTransform: 'capitalize',
    },
    termsRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        alignItems: 'center',
        marginTop: 2,
    },
    checkbox: {
        width: 22,
        height: 22,
        borderRadius: 5,
        borderWidth: 2,
        borderColor: Theme.Colors.textSecondary,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 10,
    },
    checkboxChecked: {
        backgroundColor: Theme.Colors.primary,
        borderColor: Theme.Colors.primary,
    },
    termsText: {
        color: Theme.Colors.textSecondary,
        fontSize: 14,
    },
    termsLink: {
        color: Theme.Colors.primary,
        fontSize: 14,
        fontWeight: '700',
    },
});
