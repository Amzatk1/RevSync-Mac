import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Theme } from '../../theme';
import { Screen } from '../../components/SharedComponents';

export const LegalDocumentScreen = ({ route, navigation }: any) => {
    const { title, content } = route.params;

    return (
        <Screen scroll>
            <View style={styles.container}>
                <Text style={styles.title}>{title}</Text>
                <View style={styles.contentContainer}>
                    <Text style={styles.text}>{content}</Text>
                </View>
            </View>
        </Screen>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: Theme.Spacing.md,
    },
    title: {
        ...Theme.Typography.h2,
        marginBottom: Theme.Spacing.lg,
    },
    contentContainer: {
        backgroundColor: Theme.Colors.surface,
        borderRadius: Theme.Layout.borderRadius,
        padding: 16,
    },
    text: {
        ...Theme.Typography.body,
        fontSize: 14,
    },
});
