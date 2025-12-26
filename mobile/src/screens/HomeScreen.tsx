import React from 'react';
import { View, Text, StyleSheet, Button } from 'react-native';
import { useAuth } from '../auth/context/AuthContext';

export default function HomeScreen() {
    const { user, signOut } = useAuth();

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Welcome to RevSync!</Text>
            <Text style={styles.subtitle}>User: {user?.email}</Text>
            <Button title="Sign Out" onPress={signOut} />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    subtitle: {
        fontSize: 16,
        marginBottom: 20,
    },
});
