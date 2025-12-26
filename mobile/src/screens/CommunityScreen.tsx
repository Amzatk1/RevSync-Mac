import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, ActivityIndicator, RefreshControl } from 'react-native';
import { theme } from '../styles/theme';
import { Card } from '../components/ui/Card';
import { communityService, Topic } from '../services/communityService';

export default function CommunityScreen() {
    const [topics, setTopics] = useState<Topic[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchTopics = async () => {
        try {
            const data = await communityService.getTrendingTopics();
            setTopics(data);
        } catch (error) {
            // Error logged in service
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchTopics();
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        fetchTopics();
    };

    if (loading && !refreshing) {
        return (
            <View style={[styles.container, styles.center]}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Community</Text>
                <Text style={styles.subtitle}>Connect with 10k+ riders</Text>
            </View>

            <ScrollView
                contentContainerStyle={styles.content}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />
                }
            >
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Trending Topics</Text>
                    {topics.map((topic) => (
                        <Card key={topic.id} style={styles.topicCard}>
                            <Text style={styles.topicTitle}>{topic.title}</Text>
                            <Text style={styles.topicMeta}>
                                {topic.replies_count} replies • {topic.created_at}
                            </Text>
                        </Card>
                    ))}
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Top Tuners</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
                        {[1, 2, 3].map((i) => (
                            <View key={i} style={styles.tunerAvatar}>
                                <View style={styles.avatarPlaceholder} />
                                <Text style={styles.tunerName}>Tuner {i}</Text>
                            </View>
                        ))}
                    </ScrollView>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    center: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        padding: 20,
    },
    title: {
        ...theme.typography.h1,
        color: theme.colors.text,
    },
    subtitle: {
        ...theme.typography.body,
        color: theme.colors.textSecondary,
    },
    content: {
        padding: 20,
        paddingTop: 0,
    },
    section: {
        marginBottom: 32,
    },
    sectionTitle: {
        ...theme.typography.h3,
        color: theme.colors.text,
        marginBottom: 16,
    },
    topicCard: {
        marginBottom: 12,
        padding: 16,
    },
    topicTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: theme.colors.text,
        marginBottom: 4,
    },
    topicMeta: {
        fontSize: 12,
        color: theme.colors.textSecondary,
    },
    horizontalScroll: {
        marginHorizontal: -20,
        paddingHorizontal: 20,
    },
    tunerAvatar: {
        marginRight: 20,
        alignItems: 'center',
    },
    avatarPlaceholder: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: theme.colors.surfaceHighlight,
        marginBottom: 8,
    },
    tunerName: {
        fontSize: 14,
        color: theme.colors.text,
    },
});
