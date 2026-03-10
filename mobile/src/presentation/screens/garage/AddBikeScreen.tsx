import React, { useMemo, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ServiceLocator } from '../../../di/ServiceLocator';
import { Bike } from '../../../domain/services/DomainTypes';
import { AppScreen, GlassCard, TopBar } from '../../components/AppUI';
import { Theme } from '../../theme';

const { Colors, Layout, Typography } = Theme;

export const AddBikeScreen = ({ navigation }: any) => {
    const [make, setMake] = useState('');
    const [model, setModel] = useState('');
    const [year, setYear] = useState('');
    const [vin, setVin] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const isValid = make.trim().length > 0 && model.trim().length > 0 && year.length === 4;
    const previewName = useMemo(() => `${year} ${make} ${model}`.trim(), [make, model, year]);

    const handleSave = async () => {
        if (!isValid) return;

        setLoading(true);
        setError(null);

        try {
            const bikeService = ServiceLocator.getBikeService();
            const newBike: Omit<Bike, 'id'> = {
                make: make.trim(),
                model: model.trim(),
                year: parseInt(year, 10),
                vin: vin.trim() || undefined,
                name: previewName,
            };

            const created = await bikeService.addBike(newBike);
            await bikeService.setActiveBike(created.id);
            navigation.goBack();
        } catch (e: any) {
            const message = e.message || 'Failed to add bike';
            setError(message);
            Alert.alert('Unable to add bike', message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <AppScreen contentContainerStyle={styles.screen}>
            <TopBar title="Add Bike" subtitle="Create a garage profile for fitment-aware tuning" onBack={() => navigation.goBack()} />

            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                <GlassCard style={styles.heroCard}>
                    <View style={styles.heroIcon}>
                        <Ionicons name="bicycle" size={28} color={Colors.primary} />
                    </View>
                    <Text style={styles.heroTitle}>Bike profiles unlock safer tune selection.</Text>
                    <Text style={styles.heroBody}>Year, make, model, and VIN help RevSync narrow compatibility and reduce the chance of flashing the wrong package.</Text>
                </GlassCard>

                {error && (
                    <GlassCard style={styles.errorCard}>
                        <Ionicons name="alert-circle" size={18} color={Colors.error} />
                        <Text style={styles.errorText}>{error}</Text>
                    </GlassCard>
                )}

                <GlassCard style={styles.formCard}>
                    <Text style={styles.sectionLabel}>Vehicle Data</Text>
                    <FormField label="Year" value={year} onChangeText={setYear} placeholder="2024" keyboardType="numeric" maxLength={4} />
                    <FormField label="Make" value={make} onChangeText={setMake} placeholder="Yamaha" />
                    <FormField label="Model" value={model} onChangeText={setModel} placeholder="MT-07" />
                    <FormField label="VIN" value={vin} onChangeText={setVin} placeholder="17 character VIN (optional)" />
                    <Text style={styles.helperText}>VIN improves ECU identification and fitment confidence but is optional.</Text>
                </GlassCard>

                {isValid && (
                    <GlassCard style={styles.previewCard}>
                        <Text style={styles.sectionLabel}>Preview</Text>
                        <Text style={styles.previewName}>{previewName}</Text>
                        {!!vin.trim() && <Text style={styles.previewMeta}>VIN: {vin.trim()}</Text>}
                    </GlassCard>
                )}

                <View style={styles.actions}>
                    <TouchableOpacity style={[styles.primaryButton, (!isValid || loading) && styles.buttonDisabled]} onPress={handleSave} disabled={!isValid || loading}>
                        <Text style={styles.primaryButtonText}>{loading ? 'Adding Bike...' : 'Add Bike'}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.secondaryButton} onPress={() => navigation.goBack()}>
                        <Text style={styles.secondaryButtonText}>Cancel</Text>
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </AppScreen>
    );
};

const FormField = ({
    label,
    value,
    onChangeText,
    placeholder,
    keyboardType,
    maxLength,
}: {
    label: string;
    value: string;
    onChangeText: (value: string) => void;
    placeholder: string;
    keyboardType?: 'default' | 'numeric';
    maxLength?: number;
}) => (
    <View style={styles.field}>
        <Text style={styles.fieldLabel}>{label}</Text>
        <TextInput
            style={styles.fieldInput}
            value={value}
            onChangeText={onChangeText}
            placeholder={placeholder}
            placeholderTextColor={Colors.textTertiary}
            keyboardType={keyboardType}
            maxLength={maxLength}
            autoCapitalize="characters"
        />
    </View>
);

const styles = StyleSheet.create({
    screen: {
        paddingBottom: 120,
    },
    heroCard: {
        marginTop: 8,
    },
    heroIcon: {
        width: 54,
        height: 54,
        borderRadius: 18,
        backgroundColor: 'rgba(234,16,60,0.10)',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 14,
    },
    heroTitle: {
        ...Typography.h2,
    },
    heroBody: {
        ...Typography.caption,
        marginTop: 8,
        lineHeight: 20,
    },
    errorCard: {
        marginTop: 12,
        flexDirection: 'row',
        gap: 10,
        alignItems: 'flex-start',
        borderColor: 'rgba(255,107,121,0.22)',
        backgroundColor: 'rgba(255,107,121,0.08)',
    },
    errorText: {
        flex: 1,
        fontSize: 13,
        lineHeight: 19,
        color: Colors.error,
    },
    formCard: {
        marginTop: 12,
    },
    sectionLabel: {
        ...Typography.dataLabel,
        marginBottom: 10,
    },
    field: {
        marginBottom: 12,
    },
    fieldLabel: {
        fontSize: 12,
        fontWeight: '700',
        color: Colors.textSecondary,
        marginBottom: 6,
    },
    fieldInput: {
        minHeight: 48,
        borderRadius: Layout.radiusMd,
        borderWidth: 1,
        borderColor: Colors.strokeSoft,
        backgroundColor: 'rgba(255,255,255,0.03)',
        color: Colors.textPrimary,
        paddingHorizontal: 14,
        fontSize: 15,
    },
    helperText: {
        fontSize: 12,
        lineHeight: 18,
        color: Colors.textTertiary,
        marginTop: 4,
    },
    previewCard: {
        marginTop: 12,
    },
    previewName: {
        fontSize: 18,
        fontWeight: '800',
        color: Colors.textPrimary,
    },
    previewMeta: {
        marginTop: 6,
        fontSize: 12,
        color: Colors.textSecondary,
        fontFamily: 'Courier',
    },
    actions: {
        gap: 10,
        marginTop: 14,
    },
    primaryButton: {
        minHeight: 50,
        borderRadius: Layout.buttonRadius,
        backgroundColor: Colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
    },
    primaryButtonText: {
        fontSize: 15,
        fontWeight: '800',
        color: Colors.white,
    },
    secondaryButton: {
        minHeight: 48,
        borderRadius: Layout.buttonRadius,
        borderWidth: 1,
        borderColor: Colors.strokeSoft,
        backgroundColor: 'rgba(255,255,255,0.03)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    secondaryButtonText: {
        fontSize: 14,
        fontWeight: '700',
        color: Colors.textPrimary,
    },
    buttonDisabled: {
        opacity: 0.45,
    },
});
