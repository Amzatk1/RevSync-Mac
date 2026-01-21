import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator,
    ScrollView,
    ViewStyle,
    TextStyle,
    Modal,
    StyleProp
} from 'react-native';
import { SafeAreaView, SafeAreaViewProps } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Theme } from '../theme/Theme';

// --- Screen Component ---
interface ScreenProps extends SafeAreaViewProps {
    children: React.ReactNode;
    style?: StyleProp<ViewStyle>;
    scroll?: boolean;
    center?: boolean;
}

export const Screen = ({ children, style, scroll, center, edges, ...props }: ScreenProps) => {
    const containerStyle = [
        scroll ? { flexGrow: 1 } : styles.screen,
        style,
        center && styles.center
    ] as StyleProp<ViewStyle>;

    if (scroll) {
        return (
            <SafeAreaView style={styles.screen} edges={edges} {...props}>
                <ScrollView contentContainerStyle={containerStyle} showsVerticalScrollIndicator={false}>
                    {children}
                </ScrollView>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={containerStyle} edges={edges} {...props}>
            {children}
        </SafeAreaView>
    );
};

// --- Buttons ---
interface ButtonProps {
    title: string;
    onPress: () => void;
    disabled?: boolean;
    loading?: boolean;
    style?: StyleProp<ViewStyle>;
    textStyle?: StyleProp<TextStyle>;
    icon?: keyof typeof Ionicons.glyphMap;
}

export const PrimaryButton = ({ title, onPress, disabled, loading, style, textStyle, icon }: ButtonProps) => (
    <TouchableOpacity
        style={[styles.primaryBtn, disabled && styles.disabledBtn, style]}
        onPress={onPress}
        disabled={disabled || loading}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityLabel={title}
    >
        {loading ? (
            <ActivityIndicator color="#000" />
        ) : (
            <View style={styles.btnContent}>
                {icon && <Ionicons name={icon} size={20} color="#000" style={styles.btnIcon} />}
                <Text style={[styles.primaryBtnText, textStyle]}>{title}</Text>
            </View>
        )}
    </TouchableOpacity>
);

export const SecondaryButton = ({ title, onPress, disabled, loading, style, textStyle, icon }: ButtonProps) => (
    <TouchableOpacity
        style={[styles.secondaryBtn, disabled && styles.disabledBtn, style]}
        onPress={onPress}
        disabled={disabled || loading}
        activeOpacity={0.6}
        accessibilityRole="button"
        accessibilityLabel={title}
    >
        {loading ? (
            <ActivityIndicator color={Theme.Colors.text} />
        ) : (
            <View style={styles.btnContent}>
                {icon && <Ionicons name={icon} size={20} color={Theme.Colors.text} style={styles.btnIcon} />}
                <Text style={[styles.secondaryBtnText, textStyle]}>{title}</Text>
            </View>
        )}
    </TouchableOpacity>
);

// --- Card ---
export const Card = ({ children, style, onPress }: { children: React.ReactNode; style?: StyleProp<ViewStyle>; onPress?: () => void }) => {
    const Component = onPress ? TouchableOpacity : View;
    return (
        <Component style={[styles.card, style]} onPress={onPress} activeOpacity={0.7}>
            {children}
        </Component>
    );
};

// --- States ---
export const ErrorBanner = ({ message, onRetry }: { message: string, onRetry?: () => void }) => (
    <View style={styles.errorBanner}>
        <Ionicons name="alert-circle" size={24} color={Theme.Colors.error} />
        <Text style={styles.errorText}>{message}</Text>
        {onRetry && (
            <TouchableOpacity onPress={onRetry} style={styles.retryBtn}>
                <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
        )}
    </View>
);

export const LoadingOverlay = ({ visible, message }: { visible: boolean, message?: string }) => (
    <Modal transparent visible={visible} animationType="fade">
        <View style={styles.loadingOverlay}>
            <View style={styles.loadingBox}>
                <ActivityIndicator size="large" color={Theme.Colors.primary} />
                {message && <Text style={styles.loadingText}>{message}</Text>}
            </View>
        </View>
    </Modal>
);

export const EmptyState = ({ icon, title, message, action }: { icon: keyof typeof Ionicons.glyphMap, title: string, message: string, action?: { label: string, onPress: () => void } }) => (
    <View style={styles.emptyState}>
        <Ionicons name={icon} size={48} color={Theme.Colors.textSecondary} />
        <Text style={styles.emptyTitle}>{title}</Text>
        <Text style={styles.emptyMessage}>{message}</Text>
        {action && (
            <PrimaryButton
                title={action.label}
                onPress={action.onPress}
                style={{ marginTop: Theme.Spacing.lg, minWidth: 150 }}
            />
        )}
    </View>
);

const styles = StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: Theme.Colors.background,
    },
    center: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    primaryBtn: {
        backgroundColor: Theme.Colors.primary,
        borderRadius: Theme.Layout.buttonRadius,
        paddingVertical: 16,
        paddingHorizontal: 24,
        alignItems: 'center',
        justifyContent: 'center',
        ...Theme.Shadows.md,
    },
    secondaryBtn: {
        backgroundColor: 'transparent',
        borderRadius: Theme.Layout.buttonRadius,
        paddingVertical: 16,
        paddingHorizontal: 24,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: Theme.Colors.border,
    },
    disabledBtn: {
        opacity: 0.5,
        ...Theme.Shadows.sm,
    },
    btnContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    btnIcon: {
        marginRight: 8,
    },
    primaryBtnText: {
        color: '#FFF', // Changed to White for better contrast on Red
        fontSize: 16,
        fontWeight: 'bold',
        letterSpacing: 0.5,
    },
    secondaryBtnText: {
        color: Theme.Colors.text,
        fontSize: 16,
        fontWeight: '600',
    },
    card: {
        backgroundColor: Theme.Colors.surface,
        borderRadius: Theme.Layout.cardRadius,
        padding: Theme.Spacing.md,
        marginBottom: Theme.Spacing.md,
        borderWidth: 1,
        borderColor: Theme.Colors.border,
        ...Theme.Shadows.sm,
    },
    errorBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 69, 58, 0.1)', // Error color with opacity
        borderRadius: 8,
        padding: Theme.Spacing.md,
        margin: Theme.Spacing.md,
        borderWidth: 1,
        borderColor: Theme.Colors.error,
    },
    errorText: {
        color: Theme.Colors.error,
        flex: 1,
        marginLeft: Theme.Spacing.sm,
        fontSize: 14,
    },
    retryBtn: {
        marginLeft: Theme.Spacing.sm,
    },
    retryText: {
        color: Theme.Colors.error,
        fontWeight: 'bold',
    },
    loadingOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingBox: {
        backgroundColor: Theme.Colors.surface,
        padding: Theme.Spacing.xl,
        borderRadius: 16,
        alignItems: 'center',
        minWidth: 150,
    },
    loadingText: {
        color: Theme.Colors.text,
        marginTop: Theme.Spacing.md,
        fontWeight: '600',
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: Theme.Spacing.xl,
    },
    emptyTitle: {
        ...Theme.Typography.h3,
        marginTop: Theme.Spacing.md,
    },
    emptyMessage: {
        ...Theme.Typography.body,
        textAlign: 'center',
        marginTop: Theme.Spacing.sm,
        opacity: 0.7,
    },
});
