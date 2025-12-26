import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Card } from './Card';
import { theme } from '../../styles/theme';

interface BikeCardProps {
    name: string;
    model: string;
    vin?: string;
    imageUrl?: string;
    onPress: () => void;
}

export const BikeCard: React.FC<BikeCardProps> = ({ name, model, vin, imageUrl, onPress }) => {
    return (
        <TouchableOpacity onPress={onPress} activeOpacity={0.9}>
            <Card style={styles.card}>
                <View style={styles.imageContainer}>
                    {imageUrl ? (
                        <Image source={{ uri: imageUrl }} style={styles.image} resizeMode="cover" />
                    ) : (
                        <View style={styles.placeholderImage}>
                            <Text style={styles.placeholderIcon}>🏍️</Text>
                        </View>
                    )}
                    <View style={styles.statusBadge}>
                        <Text style={styles.statusText}>Connected</Text>
                    </View>
                </View>

                <View style={styles.content}>
                    <Text style={styles.name}>{name}</Text>
                    <Text style={styles.model}>{model}</Text>
                    {vin && <Text style={styles.vin}>VIN: {vin}</Text>}
                </View>
            </Card>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    card: {
        padding: 0, // Override default padding
        borderWidth: 0,
        ...theme.shadows.default,
    },
    imageContainer: {
        height: 160,
        backgroundColor: theme.colors.surfaceHighlight,
        position: 'relative',
    },
    image: {
        width: '100%',
        height: '100%',
    },
    placeholderImage: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    placeholderIcon: {
        fontSize: 48,
    },
    statusBadge: {
        position: 'absolute',
        top: 12,
        right: 12,
        backgroundColor: 'rgba(48, 209, 88, 0.9)', // Success color with opacity
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
    },
    statusText: {
        color: '#FFF',
        fontSize: 12,
        fontWeight: '700',
    },
    content: {
        padding: 16,
    },
    name: {
        fontSize: 20,
        fontWeight: '700',
        color: theme.colors.text,
        marginBottom: 4,
    },
    model: {
        fontSize: 16,
        color: theme.colors.textSecondary,
        marginBottom: 8,
    },
    vin: {
        fontSize: 12,
        color: theme.colors.textSecondary,
        fontFamily: 'monospace', // Monospace for VIN
    },
});
