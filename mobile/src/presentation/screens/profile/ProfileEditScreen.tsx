import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Image, TouchableOpacity, Alert } from 'react-native';
import { Theme } from '../../theme';
import { Screen, PrimaryButton, Card } from '../../components/SharedComponents';
import { useAppStore } from '../../store/useAppStore';
import { Ionicons } from '@expo/vector-icons';

export const ProfileEditScreen = ({ navigation }: any) => {
    const { currentUser } = useAppStore();
    const [firstName, setFirstName] = useState(currentUser?.firstName || '');
    const [lastName, setLastName] = useState(currentUser?.lastName || '');
    const [bio, setBio] = useState('Passionate rider. Tech enthusiast.'); // Mock bio
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        setSaving(true);
        // Simulate API call
        await new Promise(r => setTimeout(r, 1000));
        setSaving(false);
        Alert.alert('Success', 'Profile updated successfully.');
        navigation.goBack();
    };

    return (
        <Screen scroll>
            <View style={styles.header}>
                <Text style={styles.title}>Edit Profile</Text>
            </View>

            <View style={styles.avatarContainer}>
                <View style={styles.avatarWrapper}>
                    <View style={styles.avatarPlaceholder}>
                        <Text style={styles.avatarText}>
                            {(firstName[0] || currentUser?.email[0] || '?').toUpperCase()}
                        </Text>
                    </View>
                    <TouchableOpacity style={styles.cameraButton}>
                        <Ionicons name="camera" size={20} color="#FFF" />
                    </TouchableOpacity>
                </View>
                <Text style={styles.changePhotoText}>Change Profile Photo</Text>
            </View>

            <View style={styles.form}>
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>First Name</Text>
                    <TextInput
                        style={styles.input}
                        value={firstName}
                        onChangeText={setFirstName}
                        placeholder="Enter first name"
                        placeholderTextColor={Theme.Colors.textSecondary}
                    />
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Last Name</Text>
                    <TextInput
                        style={styles.input}
                        value={lastName}
                        onChangeText={setLastName}
                        placeholder="Enter last name"
                        placeholderTextColor={Theme.Colors.textSecondary}
                    />
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Bio</Text>
                    <TextInput
                        style={[styles.input, styles.textArea]}
                        value={bio}
                        onChangeText={setBio}
                        placeholder="Tell us about your riding style..."
                        placeholderTextColor={Theme.Colors.textSecondary}
                        multiline
                        numberOfLines={4}
                    />
                </View>
            </View>

            <View style={styles.footer}>
                <PrimaryButton title={saving ? "Saving..." : "Save Changes"} onPress={handleSave} disabled={saving} />
            </View>
        </Screen>
    );
};

const styles = StyleSheet.create({
    header: {
        padding: Theme.Spacing.md,
    },
    title: {
        ...Theme.Typography.h2,
    },
    avatarContainer: {
        alignItems: 'center',
        marginVertical: 24,
    },
    avatarWrapper: {
        position: 'relative',
    },
    avatarPlaceholder: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: Theme.Colors.surfaceHighlight,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: Theme.Colors.primary,
    },
    avatarText: {
        fontSize: 36,
        fontWeight: 'bold',
        color: Theme.Colors.primary,
    },
    cameraButton: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: Theme.Colors.primary,
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: Theme.Colors.background,
    },
    changePhotoText: {
        marginTop: 12,
        color: Theme.Colors.primary,
        fontWeight: '600',
    },
    form: {
        padding: Theme.Spacing.md,
        gap: 16,
    },
    inputGroup: {
        gap: 8,
    },
    label: {
        color: Theme.Colors.textSecondary,
        fontWeight: '500',
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
    textArea: {
        height: 100,
        textAlignVertical: 'top',
    },
    footer: {
        padding: Theme.Spacing.md,
        marginTop: 'auto',
    },
});
