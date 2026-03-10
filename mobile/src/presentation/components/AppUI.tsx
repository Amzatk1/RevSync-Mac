import React, { type ReactNode } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    type ScrollViewProps,
    type ViewStyle,
    type StyleProp,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Theme } from '../theme';

interface AppScreenProps {
    children: ReactNode;
    scroll?: boolean;
    contentContainerStyle?: StyleProp<ViewStyle>;
    scrollProps?: Omit<ScrollViewProps, 'contentContainerStyle'>;
}

export const AppScreen = ({ children, scroll = false, contentContainerStyle, scrollProps }: AppScreenProps) => {
    const content = scroll ? (
        <ScrollView
            {...scrollProps}
            contentContainerStyle={[styles.scrollContent, contentContainerStyle]}
            showsVerticalScrollIndicator={false}
        >
            {children}
        </ScrollView>
    ) : (
        <View style={[styles.fill, contentContainerStyle]}>{children}</View>
    );

    return (
        <SafeAreaView style={styles.safe} edges={['top']}>
            <View style={styles.root}>
                <View style={styles.background}>
                    <LinearGradient
                        colors={[Theme.Colors.shell, Theme.Colors.surfaceMuted, Theme.Colors.shellAlt]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={StyleSheet.absoluteFill}
                    />
                    <LinearGradient
                        colors={[Theme.Colors.accentSoft, 'rgba(99,199,255,0)']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 0.85, y: 0.65 }}
                        style={styles.orbTop}
                    />
                    <LinearGradient
                        colors={['rgba(234,16,60,0.14)', 'rgba(234,16,60,0)']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.orbBottom}
                    />
                </View>
                {content}
            </View>
        </SafeAreaView>
    );
};

interface TopBarProps {
    title: string;
    subtitle?: string;
    onBack?: () => void;
    right?: ReactNode;
}

export const TopBar = ({ title, subtitle, onBack, right }: TopBarProps) => (
    <View style={styles.topBar}>
        <View style={styles.topBarLeft}>
            {onBack && (
                <TouchableOpacity style={styles.backButton} onPress={onBack} activeOpacity={0.7}>
                    <Ionicons name="arrow-back" size={20} color={Theme.Colors.text} />
                </TouchableOpacity>
            )}
            <View style={styles.topBarTextWrap}>
                <Text style={styles.topBarTitle}>{title}</Text>
                {!!subtitle && <Text style={styles.topBarSubtitle}>{subtitle}</Text>}
            </View>
        </View>
        {right}
    </View>
);

export const GlassCard = ({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) => (
    <View style={[styles.glassCard, style]}>{children}</View>
);

export const SectionLabel = ({ label }: { label: string }) => <Text style={styles.sectionLabel}>{label}</Text>;

interface ChipProps {
    label: string;
    active?: boolean;
    onPress?: () => void;
    icon?: keyof typeof Ionicons.glyphMap;
}

export const Chip = ({ label, active = false, onPress, icon }: ChipProps) => (
    <TouchableOpacity
        disabled={!onPress}
        onPress={onPress}
        activeOpacity={0.75}
        style={[styles.chip, active && styles.chipActive]}
    >
        {icon && <Ionicons name={icon} size={14} color={active ? '#111' : Theme.Colors.textSecondary} />}
        <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </TouchableOpacity>
);

const styles = StyleSheet.create({
    safe: {
        flex: 1,
        backgroundColor: Theme.Colors.shell,
    },
    root: {
        flex: 1,
    },
    fill: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 16,
        paddingBottom: 110,
    },
    background: {
        ...StyleSheet.absoluteFillObject,
    },
    orbTop: {
        position: 'absolute',
        width: 380,
        height: 380,
        borderRadius: 380,
        top: -160,
        left: -160,
    },
    orbBottom: {
        position: 'absolute',
        width: 320,
        height: 320,
        borderRadius: 320,
        right: -130,
        bottom: -120,
    },
    topBar: {
        paddingHorizontal: 16,
        paddingTop: 6,
        paddingBottom: 10,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    topBarLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        flex: 1,
        paddingRight: 8,
    },
    backButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.09)',
    },
    topBarTextWrap: {
        flex: 1,
    },
    topBarTitle: {
        fontSize: 28,
        fontWeight: '800',
        color: Theme.Colors.textPrimary,
        letterSpacing: -0.6,
    },
    topBarSubtitle: {
        marginTop: 1,
        fontSize: 12,
        color: Theme.Colors.textSecondary,
        fontWeight: '500',
    },
    glassCard: {
        borderRadius: 18,
        borderWidth: 1,
        borderColor: Theme.Colors.strokeSoft,
        backgroundColor: 'rgba(18,25,37,0.82)',
        padding: 14,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.25,
        shadowRadius: 18,
        elevation: 8,
    },
    sectionLabel: {
        marginTop: 18,
        marginBottom: 8,
        marginLeft: 4,
        fontSize: 11,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 1.2,
        color: Theme.Colors.textTertiary,
    },
    chip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        borderRadius: 999,
        paddingHorizontal: 12,
        paddingVertical: 8,
        backgroundColor: 'rgba(255,255,255,0.04)',
        borderWidth: 1,
        borderColor: Theme.Colors.strokeSoft,
    },
    chipActive: {
        backgroundColor: Theme.Colors.accent,
        borderColor: Theme.Colors.accent,
    },
    chipText: {
        fontSize: 12,
        fontWeight: '700',
        letterSpacing: 0.2,
        color: Theme.Colors.textSecondary,
    },
    chipTextActive: {
        color: '#081018',
    },
});
