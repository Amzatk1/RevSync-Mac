import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Theme } from '../../theme';
import { Screen, PrimaryButton } from '../../components/SharedComponents';
import { useAppStore } from '../../store/useAppStore';
import { Ionicons } from '@expo/vector-icons';

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
    const { signUp, isLoading } = useAppStore();

    const handleSignUp = async () => {
        if (!email || !password || !confirmPassword) {
            Alert.alert('Error', 'Please fill all fields.');
            return;
        }
        if (password !== confirmPassword) {
            Alert.alert('Error', 'Passwords do not match.');
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
                    <TextInput
                        style={styles.input}
                        placeholder="Min 8 characters"
                        placeholderTextColor={Theme.Colors.textSecondary}
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry
                    />
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

                <PrimaryButton
                    title={isLoading ? 'Creating Account...' : 'Sign Up'}
                    onPress={handleSignUp}
                    loading={isLoading}
                    style={{ marginTop: Theme.Spacing.lg }}
                />
            </View>
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
});
