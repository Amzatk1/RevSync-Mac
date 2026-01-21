import React, { useState } from 'react';
import { View, Text, StyleSheet, LayoutAnimation, TouchableOpacity, Linking } from 'react-native';
import { Theme } from '../../theme';
import { Screen, Card, PrimaryButton } from '../../components/SharedComponents';
import { Ionicons } from '@expo/vector-icons';

export const SupportScreen = ({ navigation }: any) => {

    const handleContactSupport = () => {
        Linking.openURL('mailto:support@revsync.app?subject=Support Request');
    };

    return (
        <Screen scroll>
            <View style={styles.header}>
                <Text style={styles.title}>Help & Support</Text>
                <Text style={styles.subtitle}>Frequently Asked Questions</Text>
            </View>

            <View style={styles.faqContainer}>
                <FAQItem
                    question="Is it safe to flash my own ECU?"
                    answer="Yes, but with caution. RevSync includes strict safety checks (voltage, ignition status) and validation logic to prevent errors. always ensure your battery is fully charged."
                />
                <FAQItem
                    question="What if the flash fails?"
                    answer="Don't panic! RevSync creates a full backup before every flash. You can use the Recovery Mode to restore your ECU to its previous state."
                />
                <FAQItem
                    question="Which adapters are supported?"
                    answer="Currently, we support OBDLink LX/MX+ and generic ELM327 Bluetooth LE adapters. Ensure your adapter supports the specific protocol for your bike."
                />
                <FAQItem
                    question="How do I add a new bike?"
                    answer="Go to the Garage tab and tap 'Add Bike'. You'll need to know the Year, Make, and Model. Identifying the ECU via the Flash tab will also auto-populate details."
                />
            </View>

            <View style={styles.contactContainer}>
                <Card style={styles.contactCard}>
                    <Ionicons name="chatbubbles-outline" size={32} color={Theme.Colors.primary} />
                    <Text style={styles.contactTitle}>Still need help?</Text>
                    <Text style={styles.contactText}>
                        Our team of tuning experts is ready to assist you with any issues.
                    </Text>
                    <PrimaryButton title="Contact Support" onPress={handleContactSupport} />
                </Card>
            </View>
        </Screen>
    );
};

const FAQItem = ({ question, answer }: { question: string, answer: string }) => {
    const [expanded, setExpanded] = useState(false);

    const toggle = () => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setExpanded(!expanded);
    };

    return (
        <TouchableOpacity onPress={toggle} activeOpacity={0.8} style={styles.faqItem}>
            <View style={styles.faqHeader}>
                <Text style={styles.question}>{question}</Text>
                <Ionicons
                    name={expanded ? "chevron-up" : "chevron-down"}
                    size={20}
                    color={Theme.Colors.textSecondary}
                />
            </View>
            {expanded && (
                <Text style={styles.answer}>{answer}</Text>
            )}
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    header: {
        padding: Theme.Spacing.md,
    },
    title: {
        ...Theme.Typography.h2,
    },
    subtitle: {
        color: Theme.Colors.textSecondary,
        marginTop: 4,
    },
    faqContainer: {
        paddingHorizontal: Theme.Spacing.md,
    },
    faqItem: {
        backgroundColor: Theme.Colors.surface,
        borderRadius: 8,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: Theme.Colors.border,
    },
    faqHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    question: {
        fontSize: 16,
        fontWeight: '600',
        color: Theme.Colors.text,
        flex: 1,
        marginRight: 8,
    },
    answer: {
        fontSize: 14,
        color: Theme.Colors.textSecondary,
        marginTop: 12,
        lineHeight: 20,
    },
    contactContainer: {
        padding: Theme.Spacing.md,
        marginBottom: 24,
    },
    contactCard: {
        alignItems: 'center',
        padding: 24,
        ...Theme.Shadows.md,
    },
    contactTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: Theme.Colors.text,
        marginVertical: 12,
    },
    contactText: {
        textAlign: 'center',
        color: Theme.Colors.textSecondary,
        marginBottom: 24,
        fontSize: 16,
    },
});
