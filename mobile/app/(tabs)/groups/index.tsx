import { useState } from 'react';
import { View, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../../src/api/client';
import {
  AppText,
  Card,
  Segmented,
  EmptyState,
  colors,
  spacing,
  radius,
  UsersIcon,
  PlusIcon,
  ChevronRightIcon,
} from '../../../src/ui';
import { useT } from '../../../src/i18n';

type Tab = 'forYou' | 'following' | 'groups';

export default function CommunityScreen() {
  const t = useT();
  const [tab, setTab] = useState<Tab>('groups');
  const { data: publicGroups } = useQuery({
    queryKey: ['public-groups'],
    queryFn: async () => (await apiClient.get('/groups/public')).data,
  });

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={{ padding: spacing.xl, paddingBottom: spacing.xxxl }} showsVerticalScrollIndicator={false}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.lg }}>
          <AppText variant="h1" weight="heavy">{t('app.community.title')}</AppText>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('app.community.create')}
            onPress={() => router.push('/(tabs)/groups/create')}
            style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' }}
          >
            <PlusIcon size={22} color={colors.white} />
          </Pressable>
        </View>

        <View style={{ marginBottom: spacing.lg }}>
          <Segmented
            value={tab}
            onChange={(v) => setTab(v as Tab)}
            options={[
              { value: 'forYou', label: t('app.community.tabForYou') },
              { value: 'following', label: t('app.community.tabFollowing') },
              { value: 'groups', label: t('app.community.tabGroups') },
            ]}
          />
        </View>

        {tab !== 'groups' ? (
          <EmptyState title={t('app.progress.soon')} />
        ) : (
          <>
            <AppText variant="small" weight="semibold" tone="muted" style={{ marginBottom: spacing.md }}>
              {t('app.community.public')}
            </AppText>
            {(publicGroups ?? []).length === 0 ? (
              <EmptyState title={t('social.groups.emptyTitle')} message={t('social.groups.emptyMessage')} />
            ) : (
              (publicGroups ?? []).map((item: any) => (
                <Card
                  key={item.id}
                  onPress={() => router.push({ pathname: '/(tabs)/groups/[groupId]', params: { groupId: item.id } })}
                  style={{ marginBottom: spacing.md, flexDirection: 'row', alignItems: 'center', gap: spacing.md }}
                >
                  <View style={{ width: 44, height: 44, borderRadius: radius.md, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' }}>
                    <UsersIcon size={22} color={colors.primary} />
                  </View>
                  <AppText variant="body" weight="bold" style={{ flex: 1 }}>{item.name}</AppText>
                  <ChevronRightIcon size={20} color={colors.textFaint} />
                </Card>
              ))
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
