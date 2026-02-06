import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Alert, ScrollView } from 'react-native';
import { Theme } from '../../theme';
import { Screen, PrimaryButton, Card } from '../../components/SharedComponents';
import { ServiceLocator } from '../../../di/ServiceLocator';
import { useAppStore } from '../../store/useAppStore';

export const AddBikeScreen = ({ navigation }: any) => {
    const { loadActiveBike } = useAppStore();
    const [year, setYear] = useState('');
    const [make, setMake] = useState('');
    const [model, setModel] = useState('');
    const [vin, setVin] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const handleSave = async () => {
        if (!year || !make || !model) {
            Alert.alert('Error', 'Please fill in Year, Make, and Model.');
            return;
        }

        setSubmitting(true);
        try {
            const bikeService = ServiceLocator.getBikeService();
            await bikeService.addBike({
                year: parseInt(year),
                make,
                model,
                vin,
                name: `${year} ${make} ${model}`
            });
            await loadActiveBike();
            Alert.alert('Success', 'Bike added to garage.');
            navigation.goBack();
        } catch (e: any) {
            Alert.alert('Error', e.message || 'Failed to add bike.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Screen scroll>
            <View style={styles.header}>
                <Text style={styles.title}>Add New Bike</Text>
            </View>

            <Card style={styles.formCard}>
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Year</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="2024"
                        placeholderTextColor={Theme.Colors.textSecondary}
                        keyboardType="numeric"
                        value={year}
                        onChangeText={setYear}
                    />
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Make</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Kawasaki"
                        placeholderTextColor={Theme.Colors.textSecondary}
                        value={make}
                        onChangeText={setMake}
                    />
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Model</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="ZX-10R"
                        placeholderTextColor={Theme.Colors.textSecondary}
                        value={model}
                        onChangeText={setModel}
                    />
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>VIN (Optional)</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="17-character VIN"
                        placeholderTextColor={Theme.Colors.textSecondary}
                        value={vin}
                        onChangeText={setVin}
                        autoCapitalize="characters"
                    />
                </View>

                <PrimaryButton
                    title="Add Bike"
                    onPress={handleSave}
                    loading={submitting}
                    style={{ marginTop: 16 }}
                />
            </Card>
        </Screen>
    );
};

export const BikeDetailsScreen = ({ navigation, route }: any) => {
    const { bikeId } = route.params;
    const [bike, setBike] = useState<any>(null);

    React.useEffect(() => {
        const load = async () => {
            const bikeService = ServiceLocator.getBikeService();
            const all = await bikeService.getBikes();
            const found = all.find(b => b.id === bikeId);
            setBike(found);

            // Telemetry
            if (found) {
                ServiceLocator.getAnalyticsService().logEvent('bike_details_viewed', {
                    bikeId: found.id,
                    make: found.make,
                    model: found.model
                });
            }
        };
        load();
    }, [bikeId]);

    if (!bike) return <Screen><Text style={{ color: '#FFF' }}>Loading...</Text></Screen>;

    return (
        <Screen>
            <View style={styles.header}>
                <Text style={styles.title}>{bike.year} {bike.make} {bike.model}</Text>
                <Text style={styles.subtitle}>Vehicle Details</Text>
            </View>

            <Card style={styles.formCard}>
                <DetailRow label="VIN" value={bike.vin || 'Not Set'} />
                <DetailRow label="ECU ID" value={bike.ecuId || 'Not Linked'} />
                <DetailRow label="Last Flash" value="Never" />
            </Card>

            <View style={styles.footer}>
                <PrimaryButton
                    title="Identify ECU"
                    onPress={() => {
                        ServiceLocator.getAnalyticsService().logEvent('ecu_identify_initiated', { bikeId: bike.id });
                        // Navigate to Flash tab -> ECUIdentifyScreen
                        // Note: Navigation structure might require navigating to Tab 'Flash', then stack screen
                        navigation.navigate('Flash', {
                            screen: 'ECUIdentify',
                            params: { bikeId: bike.id }
                        });
                    }}
                    style={{ marginBottom: 12 }}
                />

                <PrimaryButton
                    title="View Backups"
                    onPress={() => {
                        navigation.navigate('Flash', {
                            screen: 'Backup',
                            params: { bikeId: bike.id }
                        });
                    }}
                    style={{ marginBottom: 12, backgroundColor: Theme.Colors.surfaceHighlight }}
                    textStyle={{ color: Theme.Colors.text }}
                />

                <PrimaryButton
                    title="Edit Details"
                    onPress={() => { }}
                    style={{ marginBottom: 16, backgroundColor: 'transparent', borderWidth: 1, borderColor: Theme.Colors.border }}
                    textStyle={{ color: Theme.Colors.textSecondary }}
                    disabled // Not implemented yet
                />
            </View>
        </Screen>
    );
};

const DetailRow = ({ label, value }: any) => (
    <View style={styles.detailRow}>
        <Text style={styles.rowLabel}>{label}</Text>
        <Text style={styles.rowValue}>{value}</Text>
    </View>
);

const styles = StyleSheet.create({
    header: {
        padding: Theme.Spacing.md,
    },
    title: {
        ...Theme.Typography.h2,
    },
    subtitle: {
        color: Theme.Colors.textSecondary,
    },
    formCard: {
        margin: Theme.Spacing.md,
    },
    inputGroup: {
        marginBottom: 16,
    },
    label: {
        color: Theme.Colors.textSecondary,
        marginBottom: 8,
        fontWeight: '600',
    },
    input: {
        backgroundColor: Theme.Colors.background,
        borderWidth: 1,
        borderColor: Theme.Colors.border,
        borderRadius: Theme.Layout.borderRadius,
        padding: 12,
        color: Theme.Colors.text,
        fontSize: 16,
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: Theme.Colors.border,
    },
    rowLabel: {
        color: Theme.Colors.textSecondary,
    },
    rowValue: {
        color: Theme.Colors.text,
        fontWeight: 'bold',
    },
    footer: {
        padding: Theme.Spacing.md,
        marginTop: 'auto',
    }
});
