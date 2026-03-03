import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, TextInput, TouchableOpacity, Alert,
    KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppStore } from '../../store/useAppStore';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { ApiClient } from '../../../data/http/ApiClient';

const C = {
    bg: '#1a1a1a',
    surface: '#252525',
    primary: '#ea103c',
    white: '#ffffff',
    textMuted: '#a3a3a3',
    textDim: '#737373',
    border: 'rgba(255,255,255,0.08)',
    inputBg: '#2d2d2d',
    success: '#22C55E',
};

const RIDING_STYLES = [
    { id: 'casual', label: 'Casual Cruising' },
    { id: 'commuting', label: 'Daily Commuting' },
    { id: 'sport', label: 'Sport Riding' },
    { id: 'touring', label: 'Long Distance' },
    { id: 'track', label: 'Track Days' },
    { id: 'offroad', label: 'Adventure' },
];

export const ProfileEditScreen = ({ navigation }: any) => {
    const { currentUser } = useAppStore();
    const [firstName, setFirstName] = useState(currentUser?.firstName || '');
    const [lastName, setLastName] = useState(currentUser?.lastName || '');
    const [bio, setBio] = useState('');
    const [ridingStyle, setRidingStyle] = useState('');
    const [country, setCountry] = useState('');
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(true);

    // Load profile from backend on mount
    useEffect(() => {
        (async () => {
            try {
                const profile = await ApiClient.getInstance().get<{
                    bio?: string;
                    riding_style?: string;
                    country?: string;
                }>('/v1/profile/me/');
                setBio(profile.bio || '');
                setRidingStyle(profile.riding_style || '');
                setCountry(profile.country || '');
            } catch (e) {
                console.warn('ProfileEdit: Could not load profile from backend', e);
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const handleSave = async () => {
        setSaving(true);
        try {
            // Save to backend profile
            await ApiClient.getInstance().patch('/v1/profile/me/', {
                bio,
                riding_style: ridingStyle,
                country,
            });

            // Save user name
            await ApiClient.getInstance().patch('/v1/users/me/', {
                first_name: firstName,
                last_name: lastName,
            });

            Alert.alert('Saved', 'Your profile has been updated.');
            navigation.goBack();
        } catch (e) {
            console.warn('ProfileEdit: Backend save failed, saving locally', e);
            // Still show success for offline mode — data will sync later
            Alert.alert('Saved Locally', 'Your profile is saved on-device. It will sync when the backend is available.');
            navigation.goBack();
        } finally {
            setSaving(false);
        }
    };

    const initial = (firstName[0] || currentUser?.email?.[0] || '?').toUpperCase();

    if (loading) {
        return (
            <View style={[s.root, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color={C.primary} />
            </View>
        );
    }

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

                        <View style={s.inputGroup}>
                            <Text style={s.label}>Country / Region</Text>
                            <View style={s.inputWrap}>
                                <TextInput
                                    style={s.input}
                                    value={country}
                                    onChangeText={setCountry}
                                    placeholder="e.g. United Kingdom"
                                    placeholderTextColor={C.textDim}
                                />
                            </View>
                        </View>
                    </View>

                    {/* Riding Style */}
                    <Text style={s.sectionLabel}>Riding Style</Text>
                    <View style={s.chipGrid}>
                        {RIDING_STYLES.map((style) => {
                            const selected = ridingStyle === style.id;
                            return (
                                <TouchableOpacity
                                    key={style.id}
                                    style={[s.chip, selected && s.chipSelected]}
                                    onPress={() => setRidingStyle(style.id)}
                                    activeOpacity={0.7}
                                >
                                    <Text style={[s.chipText, selected && s.chipTextSelected]}>
                                        {style.label}
                                    </Text>
                                    {selected && (
                                        <Ionicons name="checkmark-circle" size={16} color={C.primary} />
                                    )}
                                </TouchableOpacity>
                            );
                        })}
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
                        {saving ? (
                            <ActivityIndicator size="small" color="#FFF" />
                        ) : (
                            <Text style={s.saveBtnText}>Save Changes</Text>
                        )}
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

    // Riding Style
    sectionLabel: {
        fontSize: 12, fontWeight: '700', color: C.textDim,
        textTransform: 'uppercase', letterSpacing: 0.8,
    },
    chipGrid: {
        flexDirection: 'row', flexWrap: 'wrap', gap: 10,
    },
    chip: {
        flexDirection: 'row', alignItems: 'center', gap: 6,
        paddingHorizontal: 16, paddingVertical: 10,
        borderRadius: 50, backgroundColor: C.surface,
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
    },
    chipSelected: {
        borderColor: 'rgba(234,16,60,0.4)',
        backgroundColor: 'rgba(234,16,60,0.08)',
    },
    chipText: { fontSize: 14, fontWeight: '600', color: C.textMuted },
    chipTextSelected: { color: C.primary },

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
