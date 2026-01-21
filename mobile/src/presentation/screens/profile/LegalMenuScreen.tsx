import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Theme } from '../../theme';
import { Screen, Card } from '../../components/SharedComponents';
import { Ionicons } from '@expo/vector-icons';
import { LegalContent } from '../../constants/LegalContent';

export const LegalMenuScreen = ({ navigation }: any) => {

    const openDoc = (title: string, content: string) => {
        navigation.navigate('LegalDocument', { title, content });
    };

    return (
        <Screen scroll>
            <View style={styles.header}>
                <Text style={styles.title}>Legal & Support</Text>
            </View>

            <Card style={styles.card}>
                <LegalRow title="Terms & Conditions" onPress={() => openDoc('Terms & Conditions', LegalContent.TERMS)} />
                <Divider />
                <LegalRow title="Privacy Policy" onPress={() => openDoc('Privacy Policy', LegalContent.PRIVACY)} />
                <Divider />
                <LegalRow title="ECU Flashing Safety Disclaimer" onPress={() => openDoc('Safety Disclaimer', LegalContent.SAFETY)} />
                <Divider />
                <LegalRow title="Acceptable Use Policy" onPress={() => openDoc('Acceptable Use Policy', LegalContent.ACCEPTABLE_USE)} />
                <Divider />
                <LegalRow title="Refund Policy" onPress={() => openDoc('Refund Policy', LegalContent.REFUND)} />
                <Divider />
                <LegalRow title="Warranty & Liability Notice" onPress={() => openDoc('Warranty & Liability', LegalContent.WARRANTY)} />
                <Divider />
                <LegalRow title="Community Guidelines" onPress={() => openDoc('Community Guidelines', LegalContent.COMMUNITY)} />
                <Divider />
                <LegalRow title="Open Source Licences" onPress={() => openDoc('Open Source Licences', LegalContent.OPEN_SOURCE)} />
            </Card>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Contact</Text>
                <Card style={styles.card}>
                    <LegalRow title="Contact Support" icon="mail-outline" onPress={() => navigation.navigate('Support')} />
                </Card>
            </View>

        </Screen>
    );
};

const LegalRow = ({ title, onPress, icon }: any) => (
    <TouchableOpacity style={styles.row} onPress={onPress}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            {icon && <Ionicons name={icon} size={20} color={Theme.Colors.text} />}
            <Text style={styles.label}>{title}</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={Theme.Colors.textSecondary} />
    </TouchableOpacity>
);

const Divider = () => <View style={styles.divider} />;

const styles = StyleSheet.create({
    header: { padding: Theme.Spacing.md },
    title: { ...Theme.Typography.h2 },
    card: { padding: 0, overflow: 'hidden' },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        minHeight: 56,
    },
    label: { fontSize: 16, color: Theme.Colors.text },
    divider: { height: 1, backgroundColor: Theme.Colors.surfaceHighlight, marginLeft: 16 },
    section: { marginTop: 24 },
    sectionTitle: { marginLeft: 16, marginBottom: 8, color: Theme.Colors.textSecondary, fontWeight: 'bold' }
});
