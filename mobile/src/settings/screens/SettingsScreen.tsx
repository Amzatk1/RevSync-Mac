import React from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity, Switch } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { theme } from '../../styles/theme';
import { useAuth } from '../../auth/context/AuthContext';
import { Button } from '../../components/ui/Button';

interface SettingRowProps {
    label: string;
    value?: string;
    onPress?: () => void;
    isDestructive?: boolean;
    hasSwitch?: boolean;
    switchValue?: boolean;
    onSwitchChange?: (val: boolean) => void;
}

const SettingRow: React.FC<SettingRowProps> = ({
    label,
    value,
    onPress,
    isDestructive,
    hasSwitch,
    switchValue,
    onSwitchChange
}) => (
    <TouchableOpacity
        style={styles.row}
        onPress={onPress}
        disabled={hasSwitch}
        activeOpacity={0.7}
    >
        <Text style={[styles.rowLabel, isDestructive && styles.destructiveLabel]}>
            {label}
        </Text>
        <View style={styles.rowRight}>
            {value && <Text style={styles.rowValue}>{value}</Text>}
            {hasSwitch && (
                <Switch
                    value={switchValue}
                    onValueChange={onSwitchChange}
                    trackColor={{ false: theme.colors.surfaceHighlight, true: theme.colors.primary }}
                />
            )}
            {!hasSwitch && !value && <Text style={styles.chevron}>›</Text>}
        </View>
    </TouchableOpacity>
);

const SectionHeader: React.FC<{ title: string }> = ({ title }) => (
    <Text style={styles.sectionHeader}>{title}</Text>
);

export default function SettingsScreen() {
    const navigation = useNavigation();
    const { signOut, user } = useAuth();
    const [notificationsEnabled, setNotificationsEnabled] = React.useState(true);
    const [darkMode, setDarkMode] = React.useState(true);

    const navigateToLegal = (type: string) => {
        navigation.navigate('Legal' as never, { type } as never);
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Settings</Text>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <SectionHeader title="Account" />
                <View style={styles.section}>
                    <SettingRow label="Email" value={user?.email} />
                    <SettingRow label="Profile" onPress={() => navigation.navigate('Profile' as never)} />
                    <SettingRow label="Change Password" onPress={() => { }} />
                </View>

                <SectionHeader title="Preferences" />
                <View style={styles.section}>
                    <SettingRow
                        label="Push Notifications"
                        hasSwitch
                        switchValue={notificationsEnabled}
                        onSwitchChange={setNotificationsEnabled}
                    />
                    <SettingRow
                        label="Dark Mode"
                        hasSwitch
                        switchValue={darkMode}
                        onSwitchChange={setDarkMode}
                    />
                    <SettingRow label="Units" value="Imperial" onPress={() => { }} />
                </View>

                <SectionHeader title="Legal & Safety" />
                <View style={styles.section}>
                    <SettingRow label="Safety Disclaimer" onPress={() => navigateToLegal('safety')} />
                    <SettingRow label="Terms & Conditions" onPress={() => navigateToLegal('terms')} />
                    <SettingRow label="Privacy Policy" onPress={() => navigateToLegal('privacy')} />
                    <SettingRow label="EULA" onPress={() => navigateToLegal('eula')} />
                </View>

                <SectionHeader title="App Info" />
                <View style={styles.section}>
                    <SettingRow label="Version" value="1.0.0 (Build 42)" />
                    <SettingRow label="Support" onPress={() => { }} />
                </View>

                <View style={styles.logoutContainer}>
                    <Button
                        title="Sign Out"
                        variant="destructive"
                        onPress={signOut}
                        style={styles.logoutButton}
                    />
                </View>

                <Text style={styles.copyright}>
                    © 2025 RevSync Inc. All rights reserved.
                </Text>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    header: {
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
    },
    title: {
        ...theme.typography.h1,
        color: theme.colors.text,
    },
    content: {
        paddingVertical: 20,
    },
    sectionHeader: {
        ...theme.typography.caption,
        color: theme.colors.textSecondary,
        marginLeft: 20,
        marginBottom: 8,
        marginTop: 24,
        textTransform: 'uppercase',
    },
    section: {
        backgroundColor: theme.colors.surface,
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderColor: theme.colors.border,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.surfaceHighlight, // Inner separator
    },
    rowLabel: {
        ...theme.typography.body,
        color: theme.colors.text,
    },
    destructiveLabel: {
        color: theme.colors.error,
    },
    rowRight: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    rowValue: {
        ...theme.typography.body,
        color: theme.colors.textSecondary,
        marginRight: 8,
    },
    chevron: {
        fontSize: 20,
        color: theme.colors.textSecondary,
        marginLeft: 8,
    },
    logoutContainer: {
        marginTop: 40,
        paddingHorizontal: 20,
    },
    logoutButton: {
        width: '100%',
    },
    copyright: {
        ...theme.typography.caption,
        color: theme.colors.textSecondary,
        textAlign: 'center',
        marginTop: 24,
        marginBottom: 40,
    },
});
