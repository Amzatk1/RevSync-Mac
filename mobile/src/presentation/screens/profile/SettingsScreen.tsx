import React from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity } from 'react-native';
import { Theme } from '../../theme';
import { Screen, Card } from '../../components/SharedComponents';
import { useSettingsStore } from '../../store/useSettingsStore';
import { Ionicons } from '@expo/vector-icons';

export const SettingsScreen = ({ navigation }: any) => {

    return (
        <Screen scroll>
            <View style={styles.header}>
                <Text style={styles.title}>Settings</Text>
            </View>

            <MenuSection title="Account & Security">
                <MenuRow
                    label="Account Profile"
                    icon="person-outline"
                    onPress={() => navigation.navigate('ProfileEdit')} // Reusing ProfileEdit as "Profile"
                />
                <MenuRow
                    label="Sign-in & Security"
                    icon="lock-closed-outline"
                    onPress={() => { }}
                />
            </MenuSection>

            <MenuSection title="Hardware">
                <MenuRow
                    label="Bikes & Devices"
                    icon="hardware-chip-outline"
                    onPress={() => navigation.navigate('Garage')} // Link to existing Garage
                />
            </MenuSection>

            <MenuSection title="Data">
                <MenuRow
                    label="Downloads & Storage"
                    icon="cloud-download-outline"
                    onPress={() => navigation.navigate('DownloadManager')}
                />
            </MenuSection>

            <MenuSection title="Safety">
                <MenuRow
                    label="Flashing Safety"
                    icon="shield-checkmark-outline"
                    onPress={() => navigation.navigate('FlashingSafetySettings')}
                />
            </MenuSection>

            <MenuSection title="Legal">
                <MenuRow
                    label="Privacy & Data"
                    icon="finger-print-outline"
                    onPress={() => navigation.navigate('Privacy')} // Reuse privacy screen but maybe rename later?
                />
                <MenuRow
                    label="Legal & Support"
                    icon="document-text-outline"
                    onPress={() => navigation.navigate('LegalMenu')}
                />
                <MenuRow
                    label="About RevSync"
                    icon="information-circle-outline"
                    onPress={() => navigation.navigate('About')}
                />
            </MenuSection>

        </Screen>
    );
};

const MenuSection = ({ title, children }: any) => (
    <View style={styles.section}>
        <Text style={styles.sectionTitle}>{title}</Text>
        <Card style={styles.card}>{children}</Card>
    </View>
);

const MenuRow = ({ label, icon, onPress }: any) => (
    <TouchableOpacity style={styles.row} onPress={onPress}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Ionicons name={icon} size={22} color={Theme.Colors.text} />
            <Text style={styles.label}>{label}</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={Theme.Colors.textSecondary} />
    </TouchableOpacity>
);

const styles = StyleSheet.create({
    header: { padding: Theme.Spacing.md },
    title: { ...Theme.Typography.h2 },
    section: { marginBottom: 24 },
    sectionTitle: { marginLeft: 16, marginBottom: 8, color: Theme.Colors.textSecondary, fontWeight: 'bold', textTransform: 'uppercase', fontSize: 12 },
    card: { padding: 0, overflow: 'hidden' },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        minHeight: 56,
        borderBottomWidth: 1,
        borderBottomColor: Theme.Colors.surfaceHighlight
    },
    label: { fontSize: 16, color: Theme.Colors.text },
});
