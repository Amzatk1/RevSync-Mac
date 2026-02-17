import React, { useState } from 'react';
import {
    View, Text, StyleSheet, TextInput, ScrollView, TouchableOpacity,
    KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { ServiceLocator } from '../../../di/ServiceLocator';
import { Bike } from '../../../domain/services/DomainTypes';

// ─── Color Tokens ──────────────────────────────────────────────
const C = {
    bg: '#1a1a1a',
    surface: '#252525',
    surfaceHigh: '#2f2f2f',
    border: 'rgba(255,255,255,0.05)',
    text: '#FFFFFF',
    muted: '#9ca3af',
    primary: '#ea103c',
    inputBg: '#1f1f1f',
    error: '#EF4444',
};

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
            await bikeService.setActiveBike(created.id);

            navigation.goBack();
        } catch (e: any) {
            setError(e.message || 'Failed to add bike');
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={s.root} edges={['top']}>
            {/* ─── Header ─── */}
            <View style={s.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={s.headerBtn}>
                    <Ionicons name="close" size={24} color={C.text} />
                </TouchableOpacity>
                <Text style={s.headerTitle}>Add New Bike</Text>
                <View style={{ width: 40 }} />
            </View>

            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                keyboardVerticalOffset={0}
            >
                <ScrollView contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
                    {/* ─── Hero Icon ─── */}
                    <View style={s.heroCircle}>
                        <Ionicons name="bicycle" size={48} color={C.primary} />
                    </View>

                    {/* ─── Error ─── */}
                    {error && (
                        <View style={s.errorBanner}>
                            <Ionicons name="alert-circle" size={18} color={C.error} />
                            <Text style={s.errorText}>{error}</Text>
                        </View>
                    )}

                    {/* ─── Form ─── */}
                    <View style={s.formCard}>
                        <FormField label="Year *" value={year} onChangeText={setYear}
                            placeholder="e.g. 2024" keyboardType="numeric" maxLength={4} />
                        <View style={s.divider} />
                        <FormField label="Make *" value={make} onChangeText={setMake}
                            placeholder="e.g. Yamaha" />
                        <View style={s.divider} />
                        <FormField label="Model *" value={model} onChangeText={setModel}
                            placeholder="e.g. MT-07" />
                        <View style={s.divider} />
                        <FormField label="VIN (Optional)" value={vin} onChangeText={setVin}
                            placeholder="17 character VIN" />
                    </View>

                    <Text style={s.helperText}>
                        VIN helps us auto-identify your ECU variant and cross-check tune compatibility.
                    </Text>

                    {/* ─── Preview ─── */}
                    {isValid && (
                        <View style={s.previewCard}>
                            <Text style={s.previewLabel}>Preview</Text>
                            <Text style={s.previewName}>{year} {make} {model}</Text>
                            {vin ? <Text style={s.previewVin}>VIN: {vin}</Text> : null}
                        </View>
                    )}
                </ScrollView>

                {/* ─── Sticky Footer ─── */}
                <View style={s.footer}>
                    <TouchableOpacity
                        style={[s.addButton, (!isValid || loading) && s.addButtonDisabled]}
                        onPress={handleSave}
                        activeOpacity={0.85}
                        disabled={!isValid || loading}
                    >
                        <Ionicons name="add-circle" size={22} color="#FFF" />
                        <Text style={s.addButtonText}>
                            {loading ? 'Adding…' : 'Add Bike'}
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={s.cancelBtn}>
                        <Text style={s.cancelBtnText}>Cancel</Text>
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

// ─── Form Field ────────────────────────────────────────────────
const FormField = ({ label, value, onChangeText, placeholder, keyboardType, maxLength }: any) => (
    <View style={s.fieldRow}>
        <Text style={s.fieldLabel}>{label}</Text>
        <TextInput
            style={s.fieldInput}
            value={value}
            onChangeText={onChangeText}
            placeholder={placeholder}
            placeholderTextColor={C.muted}
            keyboardType={keyboardType}
            maxLength={maxLength}
        />
    </View>
);

// ─── Styles ────────────────────────────────────────────────────
const s = StyleSheet.create({
    root: { flex: 1, backgroundColor: C.bg },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 16, height: 56,
        borderBottomWidth: 1, borderBottomColor: C.border,
    },
    headerBtn: {
        width: 40, height: 40, borderRadius: 20,
        alignItems: 'center', justifyContent: 'center',
    },
    headerTitle: { fontSize: 18, fontWeight: '700', color: C.text },

    scrollContent: { padding: 16, paddingBottom: 40 },

    heroCircle: {
        width: 80, height: 80, borderRadius: 40,
        backgroundColor: 'rgba(234,16,60,0.1)',
        alignItems: 'center', justifyContent: 'center',
        alignSelf: 'center', marginVertical: 24,
    },

    errorBanner: {
        flexDirection: 'row', alignItems: 'center', gap: 10,
        backgroundColor: 'rgba(239,68,68,0.1)',
        paddingHorizontal: 16, paddingVertical: 12,
        borderRadius: 12, borderWidth: 1, borderColor: 'rgba(239,68,68,0.3)',
        marginBottom: 16,
    },
    errorText: { color: C.error, fontSize: 14, fontWeight: '500', flex: 1 },

    formCard: {
        backgroundColor: C.surface,
        borderRadius: 20, overflow: 'hidden',
    },
    divider: { height: 1, backgroundColor: C.border, marginLeft: 16 },

    fieldRow: {
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: 16, minHeight: 56,
    },
    fieldLabel: {
        width: 110, fontSize: 14, fontWeight: '600', color: C.muted,
    },
    fieldInput: {
        flex: 1, height: 56,
        fontSize: 16, color: C.text,
        textAlign: 'right',
    },

    helperText: {
        fontSize: 12, color: C.muted, marginTop: 12, marginLeft: 16,
        lineHeight: 18,
    },

    previewCard: {
        backgroundColor: C.surface,
        borderRadius: 16, padding: 20,
        marginTop: 24,
        borderWidth: 1, borderColor: 'rgba(234,16,60,0.15)',
    },
    previewLabel: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', color: C.primary, letterSpacing: 1.2, marginBottom: 8 },
    previewName: { fontSize: 20, fontWeight: '800', color: C.text },
    previewVin: { fontSize: 12, color: C.muted, fontFamily: 'monospace', marginTop: 4 },

    footer: {
        paddingHorizontal: 16, paddingBottom: 24, paddingTop: 12,
        borderTopWidth: 1, borderTopColor: C.border,
    },
    addButton: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
        height: 52, borderRadius: 26, backgroundColor: C.primary,
        shadowColor: C.primary, shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5, shadowRadius: 20,
    },
    addButtonDisabled: { backgroundColor: '#3f3f46', shadowOpacity: 0 },
    addButtonText: { fontSize: 16, fontWeight: '700', color: '#FFF' },
    cancelBtn: { height: 48, alignItems: 'center', justifyContent: 'center', marginTop: 4 },
    cancelBtnText: { fontSize: 16, fontWeight: '500', color: C.muted },
});
