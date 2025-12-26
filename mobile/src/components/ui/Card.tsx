import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { theme } from '../../styles/theme';

interface CardProps {
    children: React.ReactNode;
    style?: ViewStyle;
    title?: string;
    description?: string;
}

export const Card: React.FC<CardProps> = ({ children, style, title, description }) => {
    return (
        <View style={[styles.container, style]}>
            {(title || description) && (
                <View style={styles.header}>
                    {title && <Text style={styles.title}>{title}</Text>}
                    {description && <Text style={styles.description}>{description}</Text>}
                </View>
            )}
            <View style={styles.content}>
                {children}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: theme.colors.surface,
        borderRadius: theme.borderRadius.l,
        borderWidth: 1,
        borderColor: theme.colors.border,
        overflow: 'hidden',
    },
    header: {
        padding: 24,
        paddingBottom: 12,
    },
    title: {
        fontSize: 24,
        fontWeight: '600',
        color: theme.colors.text,
        marginBottom: 4,
    },
    description: {
        fontSize: 14,
        color: theme.colors.textSecondary,
    },
    content: {
        padding: 24,
        paddingTop: 0,
    },
});
