import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    Switch,
    TouchableOpacity,
    ScrollView,
    Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSettingsStore } from '../../store/useSettingsStore';
import { useAppStore } from '../../store/useAppStore';
import { AppScreen, TopBar, GlassCard, SectionLabel } from '../../components/AppUI';
import { Theme } from '../../theme';

export const SettingsScreen = ({ navigation }: any) => {
    const insets = useSafeAreaInsets();
    const { units, toggleUnits, notificationsEnabled, toggleNotifications } = useSettingsStore();
    const currentUser = useAppStore((s) => s.currentUser);

    const displayName = currentUser?.firstName
        ? `${currentUser.firstName}${currentUser.lastName ? ` ${currentUser.lastName}` : ''}`
        : currentUser?.email || 'Rider';

    const runRestorePurchases = async () => {
        try {
            const { ApiClient } = await import('../../../data/http/ApiClient');
            const response: any = await ApiClient.getInstance().get('/v1/marketplace/entitlements/');
            const count = response?.count || response?.results?.length || 0;
            Alert.alert('Restore complete', `${count} entitlement${count !== 1 ? 's' : ''} synchronized.`);
        } catch {
            Alert.alert('Restore failed', 'Could not sync purchases. Please check connection and retry.');
        }
    };

    return (
        <AppScreen
            scroll
            contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: insets.bottom + 60 }}
        >
            <TopBar title="Settings" subtitle="Security, hardware, and data controls" onBack={() => navigation.goBack()} />

            <SectionLabel label="Account" />
            <GlassCard style={styles.card}>
                <MenuRow
                    icon="person-outline"
                    iconColor="#93C5FD"
                    iconBg="rgba(59,130,246,0.16)"
                    label={displayName}
                    subtitle={currentUser?.email || 'Not signed in'}
                    onPress={() => navigation.navigate('ProfileEdit')}
                    first
                />
                <Divider />
                <MenuRow
                    icon="lock-closed-outline"
                    iconColor="#FB7185"
                    iconBg="rgba(234,16,60,0.15)"
                    label="Change Password"
                    subtitle="Protect your account credentials"
                    onPress={() => Alert.alert('Coming soon', 'Password reset flow will be available in the next update.')}
                />
                <Divider />
                <MenuRow
                    icon="refresh-circle-outline"
                    iconColor="#22D3EE"
                    iconBg="rgba(6,182,212,0.15)"
                    label="Restore Purchases"
                    subtitle="Sync marketplace entitlements"
                    onPress={runRestorePurchases}
                />
            </GlassCard>

            <SectionLabel label="Hardware & Safety" />
            <GlassCard style={styles.card}>
                <MenuRow
                    icon="bluetooth-outline"
                    iconColor="#60A5FA"
                    iconBg="rgba(59,130,246,0.16)"
                    label="Connect ECU Device"
                    subtitle="Pair and validate flashing connection"
                    onPress={() => navigation.navigate('Flash', { screen: 'DeviceConnect' })}
                    first
                />
                <Divider />
                <MenuRow
                    icon="shield-checkmark-outline"
                    iconColor="#FB7185"
                    iconBg="rgba(234,16,60,0.15)"
                    label="Flashing Safety Gates"
                    subtitle="Set safeguards and risk limits"
                    onPress={() => navigation.navigate('FlashingSafetySettings')}
                    badge="3 Active"
                />
                <Divider />
                <MenuRow
                    icon="analytics-outline"
                    iconColor="#34D399"
                    iconBg="rgba(16,185,129,0.15)"
                    label="Data Logging & Export"
                    subtitle="Access logs and diagnostics snapshots"
                    onPress={() => navigation.navigate('LogsExport')}
                />
            </GlassCard>

            <SectionLabel label="Preferences" />
            <GlassCard style={styles.card}>
                <View style={styles.rowStatic}>
                    <View style={styles.rowLeft}>
                        <View style={[styles.iconWrap, { backgroundColor: 'rgba(168,85,247,0.16)' }]}>
                            <Ionicons name="speedometer-outline" size={18} color="#C084FC" />
                        </View>
                        <View>
                            <Text style={styles.rowTitle}>Units</Text>
                            <Text style={styles.rowSub}>Choose your preferred measurement system</Text>
                        </View>
                    </View>
                    <TouchableOpacity style={styles.segment} onPress={toggleUnits} activeOpacity={0.8}>
                        <View style={[styles.segmentPill, units === 'metric' && styles.segmentActive]}>
                            <Text style={[styles.segmentText, units === 'metric' && styles.segmentTextActive]}>Metric</Text>
                        </View>
                        <View style={[styles.segmentPill, units === 'imperial' && styles.segmentActive]}>
                            <Text style={[styles.segmentText, units === 'imperial' && styles.segmentTextActive]}>Imperial</Text>
                        </View>
                    </TouchableOpacity>
                </View>
                <Divider />
                <View style={styles.rowStatic}>
                    <View style={styles.rowLeft}>
                        <View style={[styles.iconWrap, { backgroundColor: 'rgba(251,191,36,0.16)' }]}>
                            <Ionicons name="notifications-outline" size={18} color="#FBBF24" />
                        </View>
                        <View>
                            <Text style={styles.rowTitle}>Notifications</Text>
                            <Text style={styles.rowSub}>Tune alerts, flash status, and updates</Text>
                        </View>
                    </View>
                    <Switch
                        value={notificationsEnabled}
                        onValueChange={toggleNotifications}
                        trackColor={{ false: '#3f3f46', true: Theme.Colors.primary }}
                        thumbColor="#FFF"
                    />
                </View>
            </GlassCard>

            <SectionLabel label="Legal & Support" />
            <GlassCard style={styles.card}>
                <MenuRow
                    icon="document-text-outline"
                    iconColor="#94A3B8"
                    iconBg="rgba(148,163,184,0.15)"
                    label="Legal Documents"
                    subtitle="Terms, privacy, and safety disclaimer"
                    onPress={() => navigation.navigate('LegalMenu')}
                    first
                />
                <Divider />
                <MenuRow
                    icon="checkmark-done-outline"
                    iconColor="#60A5FA"
                    iconBg="rgba(59,130,246,0.16)"
                    label="Accepted Agreements"
                    subtitle="View your consent history"
                    onPress={() => navigation.navigate('Agreements')}
                />
                <Divider />
                <MenuRow
                    icon="help-buoy-outline"
                    iconColor="#2DD4BF"
                    iconBg="rgba(20,184,166,0.15)"
                    label="Support"
                    subtitle="Contact team and troubleshooting help"
                    onPress={() => navigation.navigate('Support')}
                />
            </GlassCard>

            <Text style={styles.footer}>RevSync App v2.4.1 (Build 8902)</Text>
        </AppScreen>
    );
};

const MenuRow = ({
    icon,
    iconColor,
    iconBg,
    label,
    subtitle,
    onPress,
    badge,
    first,
}: {
    icon: keyof typeof Ionicons.glyphMap;
    iconColor: string;
    iconBg: string;
    label: string;
    subtitle: string;
    onPress: () => void;
    badge?: string;
    first?: boolean;
}) => (
    <TouchableOpacity style={[styles.menuRow, first && { paddingTop: 2 }]} onPress={onPress} activeOpacity={0.8}>
        <View style={styles.rowLeft}>
            <View style={[styles.iconWrap, { backgroundColor: iconBg }]}>
                <Ionicons name={icon} size={18} color={iconColor} />
            </View>
            <View style={{ flex: 1 }}>
                <Text style={styles.rowTitle}>{label}</Text>
                <Text style={styles.rowSub}>{subtitle}</Text>
            </View>
        </View>
        <View style={styles.rowRight}>
            {badge && (
                <View style={styles.badgePill}>
                    <Text style={styles.badgeText}>{badge}</Text>
                </View>
            )}
            <Ionicons name="chevron-forward" size={17} color={Theme.Colors.textTertiary} />
        </View>
    </TouchableOpacity>
);

const Divider = () => <View style={styles.divider} />;

const styles = StyleSheet.create({
    card: {
        gap: 0,
        padding: 12,
    },
    menuRow: {
        minHeight: 56,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 8,
    },
    rowStatic: {
        minHeight: 56,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 8,
    },
    rowLeft: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        paddingRight: 8,
    },
    rowRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    iconWrap: {
        width: 34,
        height: 34,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: Theme.Colors.border,
    },
    rowTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: Theme.Colors.text,
    },
    rowSub: {
        marginTop: 2,
        fontSize: 12,
        color: Theme.Colors.textSecondary,
    },
    divider: {
        height: 1,
        backgroundColor: Theme.Colors.divider,
        marginLeft: 44,
    },
    badgePill: {
        borderRadius: 999,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderWidth: 1,
        borderColor: 'rgba(234,16,60,0.3)',
        backgroundColor: 'rgba(234,16,60,0.16)',
    },
    badgeText: {
        fontSize: 10,
        fontWeight: '800',
        color: '#FB7185',
        letterSpacing: 0.35,
        textTransform: 'uppercase',
    },
    segment: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 999,
        backgroundColor: 'rgba(0,0,0,0.35)',
        borderWidth: 1,
        borderColor: Theme.Colors.border,
        padding: 3,
    },
    segmentPill: {
        borderRadius: 999,
        paddingHorizontal: 12,
        paddingVertical: 6,
    },
    segmentActive: {
        backgroundColor: 'rgba(234,16,60,0.20)',
        borderWidth: 1,
        borderColor: 'rgba(234,16,60,0.35)',
    },
    segmentText: {
        fontSize: 11,
        fontWeight: '700',
        letterSpacing: 0.2,
        color: Theme.Colors.textSecondary,
    },
    segmentTextActive: {
        color: Theme.Colors.text,
    },
    footer: {
        marginTop: 18,
        marginBottom: 8,
        textAlign: 'center',
        fontSize: 11,
        color: Theme.Colors.textTertiary,
    },
});
