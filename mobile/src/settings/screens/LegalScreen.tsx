import React from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { theme } from '../../styles/theme';
import { Button } from '../../components/ui/Button';
import { LEGAL_CONTENT } from '../data/legalContent';

type LegalDocType = keyof typeof LEGAL_CONTENT;

export default function LegalScreen() {
    const route = useRoute();
    const navigation = useNavigation();
    const { type } = route.params as { type: LegalDocType };
    const document = LEGAL_CONTENT[type];

    if (!document) {
        return (
            <View style={styles.container}>
                <Text style={styles.errorText}>Document not found</Text>
                <Button title="Go Back" onPress={() => navigation.goBack()} />
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Button
                    title="Back"
                    variant="ghost"
                    size="sm"
                    onPress={() => navigation.goBack()}
                    style={styles.backButton}
                />
                <Text style={styles.title}>{document.title}</Text>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <Text style={styles.lastUpdated}>Last Updated: {document.lastUpdated}</Text>
                <View style={styles.divider} />
                <Text style={styles.bodyText}>{document.content}</Text>
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
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
    },
    backButton: {
        marginRight: 16,
    },
    title: {
        ...theme.typography.h3,
        color: theme.colors.text,
        flex: 1,
    },
    content: {
        padding: 24,
    },
    lastUpdated: {
        ...theme.typography.caption,
        color: theme.colors.textSecondary,
        marginBottom: 16,
    },
    divider: {
        height: 1,
        backgroundColor: theme.colors.border,
        marginBottom: 24,
    },
    bodyText: {
        ...theme.typography.body,
        color: theme.colors.text,
        lineHeight: 24,
    },
    errorText: {
        color: theme.colors.error,
        fontSize: 18,
        marginBottom: 20,
    },
});
