import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, Switch } from 'react-native';
import { Theme } from '../../theme';
import { Screen, PrimaryButton, SecondaryButton, ErrorBanner } from '../../components/SharedComponents';
import { ServiceLocator } from '../../../di/ServiceLocator';
import { Bike } from '../../../domain/services/DomainTypes';

export const AddBikeScreen = ({ navigation }: any) => {
    const [make, setMake] = useState('');
    const [model, setModel] = useState('');
    const [year, setYear] = useState('');
    const [vin, setVin] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const isValid = make.length > 0 && model.length > 0 && year.length === 4;

    const handleSave = async () => {
        if (!isValid) return;
        setLoading(true);
        setError(null);

        try {
            const bikeService = ServiceLocator.getBikeService();
            const newBike: Omit<Bike, 'id'> = {
                make,
                model,
                year: parseInt(year),
                vin: vin || undefined,
                name: `${year} ${make} ${model}`,
            };

            const created = await bikeService.addBike(newBike);
            await bikeService.setActiveBike(created.id); // Auto-set active

            navigation.goBack();
        } catch (e: any) {
            setError(e.message || 'Failed to add bike');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Screen scroll>
            <View style={styles.formContainer}>
                <Text style={styles.header}>Add New Bike</Text>

                {error && <ErrorBanner message={error} />}

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Year *</Text>
                    <TextInput
                        style={styles.input}
                        value={year}
                        onChangeText={setYear}
                        keyboardType="numeric"
                        maxLength={4}
                        placeholder="2021"
                        placeholderTextColor={Theme.Colors.textSecondary}
                    />
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Make *</Text>
                    <TextInput
                        style={styles.input}
                        value={make}
                        onChangeText={setMake}
                        placeholder="Yamaha"
                        placeholderTextColor={Theme.Colors.textSecondary}
                    />
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Model *</Text>
                    <TextInput
                        style={styles.input}
                        value={model}
                        onChangeText={setModel}
                        placeholder="MT-07"
                        placeholderTextColor={Theme.Colors.textSecondary}
                    />
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>VIN (Optional)</Text>
                    <TextInput
                        style={styles.input}
                        value={vin}
                        onChangeText={setVin}
                        placeholder="17 character VIN"
                        placeholderTextColor={Theme.Colors.textSecondary}
                    />
                    <Text style={styles.helperText}>
                        VIN helps us auto-identify your specific ECU variant.
                    </Text>
                </View>

                <View style={styles.footer}>
                    <PrimaryButton
                        title="Add Bike"
                        onPress={handleSave}
                        loading={loading}
                        disabled={!isValid}
                    />
                    <SecondaryButton
                        title="Cancel"
                        onPress={() => navigation.goBack()}
                        style={{ marginTop: 12 }}
                    />
                </View>
            </View>
        </Screen>
    );
};

const styles = StyleSheet.create({
    formContainer: {
        padding: Theme.Spacing.md,
    },
    header: {
        ...Theme.Typography.h2,
        marginBottom: Theme.Spacing.xl,
    },
    inputGroup: {
        marginBottom: Theme.Spacing.lg,
    },
    label: {
        ...Theme.Typography.body,
        fontWeight: '600',
        marginBottom: 8,
    },
    input: {
        backgroundColor: Theme.Colors.surface,
        borderWidth: 1,
        borderColor: Theme.Colors.border,
        borderRadius: 8,
        padding: 12,
        color: Theme.Colors.text,
        fontSize: 16,
    },
    helperText: {
        color: Theme.Colors.textSecondary,
        fontSize: 12,
        marginTop: 6,
    },
    footer: {
        marginTop: Theme.Spacing.xl,
    }
});
