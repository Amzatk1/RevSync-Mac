import React, { useState } from 'react';
import {
    View, Text, StyleSheet, TextInput, TouchableOpacity, Alert,
    KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppStore } from '../../store/useAppStore';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

const C = {
    bg: '#1a1a1a',
    surface: '#252525',
    primary: '#ea103c',
    white: '#ffffff',
    textMuted: '#a3a3a3',
    textDim: '#737373',
    border: 'rgba(255,255,255,0.08)',
    inputBg: '#2d2d2d',
};

export const ProfileEditScreen = ({ navigation }: any) => {
    const { currentUser } = useAppStore();
    const [firstName, setFirstName] = useState(currentUser?.firstName || '');
    const [lastName, setLastName] = useState(currentUser?.lastName || '');
    const [bio, setBio] = useState('Passionate rider. Tech enthusiast.');
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        setSaving(true);
        await new Promise(r => setTimeout(r, 1000));
        setSaving(false);
        Alert.alert('Success', 'Profile updated successfully.');
        navigation.goBack();
    };

    const initial = (firstName[0] || currentUser?.email?.[0] || '?').toUpperCase();

    return (
        <View style={s.root}>
            {/* Header */}
            <SafeAreaView edges={['top']}>
                <View style={s.header}>
                    <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
                        <Ionicons name="arrow-back" size={20} color={C.white} />
                    </TouchableOpacity>
                    <Text style={s.headerTitle}>Edit Profile</Text>
                    <View style={{ width: 40 }} />
                </View>
            </SafeAreaView>

            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                <ScrollView contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
                    {/* Avatar */}
                    <View style={s.avatarSection}>
                        <View style={s.avatarWrap}>
                            <View style={s.avatar}>
                                <Text style={s.avatarText}>{initial}</Text>
                            </View>
                            <TouchableOpacity style={s.cameraBtn} activeOpacity={0.8}>
                                <Ionicons name="camera" size={16} color="#FFF" />
                            </TouchableOpacity>
                        </View>
                        <Text style={s.changePhotoText}>Change Profile Photo</Text>
                    </View>

                    {/* Form */}
                    <View style={s.formCard}>
                        <View style={s.inputGroup}>
                            <Text style={s.label}>First Name</Text>
                            <View style={s.inputWrap}>
                                <TextInput
                                    style={s.input}
                                    value={firstName}
                                    onChangeText={setFirstName}
                                    placeholder="Enter first name"
                                    placeholderTextColor={C.textDim}
                                />
                            </View>
                        </View>

                        <View style={s.inputGroup}>
                            <Text style={s.label}>Last Name</Text>
                            <View style={s.inputWrap}>
                                <TextInput
                                    style={s.input}
                                    value={lastName}
                                    onChangeText={setLastName}
                                    placeholder="Enter last name"
                                    placeholderTextColor={C.textDim}
                                />
                            </View>
                        </View>

                        <View style={s.inputGroup}>
                            <Text style={s.label}>Bio</Text>
                            <View style={[s.inputWrap, { height: 100 }]}>
                                <TextInput
                                    style={[s.input, { height: 88, textAlignVertical: 'top' }]}
                                    value={bio}
                                    onChangeText={setBio}
                                    placeholder="Tell us about your riding style..."
                                    placeholderTextColor={C.textDim}
                                    multiline
                                    numberOfLines={4}
                                />
                            </View>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>

            {/* Sticky Footer */}
            <LinearGradient colors={['transparent', C.bg]} style={s.footer}>
                <SafeAreaView edges={['bottom']}>
                    <TouchableOpacity
                        style={[s.saveBtn, saving && { opacity: 0.7 }]}
                        onPress={handleSave}
                        disabled={saving}
                        activeOpacity={0.85}
                    >
                        <Text style={s.saveBtnText}>{saving ? 'Saving...' : 'Save Changes'}</Text>
                    </TouchableOpacity>
                </SafeAreaView>
            </LinearGradient>
        </View>
    );
};

const s = StyleSheet.create({
    root: { flex: 1, backgroundColor: C.bg },

    // Header
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 24, paddingVertical: 12,
    },
    backBtn: {
        width: 40, height: 40, borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.05)',
        alignItems: 'center', justifyContent: 'center',
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)',
    },
    headerTitle: { fontSize: 18, fontWeight: '700', color: C.white },

    scrollContent: { paddingHorizontal: 24, paddingBottom: 140, gap: 24 },

    // Avatar
    avatarSection: { alignItems: 'center', paddingVertical: 24 },
    avatarWrap: { position: 'relative' },
    avatar: {
        width: 100, height: 100, borderRadius: 50,
        backgroundColor: C.surface,
        alignItems: 'center', justifyContent: 'center',
        borderWidth: 2, borderColor: C.primary,
    },
    avatarText: { fontSize: 36, fontWeight: '800', color: C.primary },
    cameraBtn: {
        position: 'absolute', bottom: 0, right: 0,
        width: 32, height: 32, borderRadius: 16,
        backgroundColor: C.primary,
        alignItems: 'center', justifyContent: 'center',
        borderWidth: 3, borderColor: C.bg,
    },
    changePhotoText: {
        marginTop: 12, fontSize: 14, fontWeight: '600', color: C.primary,
    },

    // Form
    formCard: {
        backgroundColor: C.surface, borderRadius: 20, padding: 24,
        borderWidth: 1, borderColor: C.border, gap: 20,
    },
    inputGroup: { gap: 8 },
    label: {
        fontSize: 12, fontWeight: '600', color: C.textDim,
        textTransform: 'uppercase', letterSpacing: 0.5,
    },
    inputWrap: {
        backgroundColor: C.inputBg,
        borderRadius: 14, borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.06)',
        overflow: 'hidden',
    },
    input: {
        padding: 14, color: C.white, fontSize: 16,
    },

    // Footer
    footer: {
        position: 'absolute', bottom: 0, left: 0, right: 0,
        paddingHorizontal: 24, paddingTop: 32,
    },
    saveBtn: {
        height: 56, borderRadius: 50,
        backgroundColor: C.primary,
        alignItems: 'center', justifyContent: 'center',
        shadowColor: C.primary, shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.3, shadowRadius: 20, elevation: 10,
        marginBottom: 8,
    },
    saveBtnText: { fontSize: 18, fontWeight: '700', color: '#FFF' },
});
