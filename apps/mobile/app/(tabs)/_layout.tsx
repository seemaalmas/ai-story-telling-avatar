import { Tabs } from 'expo-router';
import { Text, StyleSheet } from 'react-native';
import { theme } from '@/theme';

function TabIcon({ icon, focused }: { icon: string; focused: boolean }) {
  return <Text style={[styles.icon, focused && styles.iconFocused]}>{icon}</Text>;
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textLight,
        tabBarLabelStyle: styles.label,
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: ({ focused }) => <TabIcon icon="🏠" focused={focused} />,
          tabBarAccessibilityLabel: 'Home tab',
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Explore',
          tabBarIcon: ({ focused }) => <TabIcon icon="🔍" focused={focused} />,
          tabBarAccessibilityLabel: 'Explore stories tab',
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ focused }) => <TabIcon icon="👤" focused={focused} />,
          tabBarAccessibilityLabel: 'Profile tab',
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: theme.colors.background,
    borderTopColor: theme.colors.divider,
    height: 60,
    paddingBottom: 6,
  },
  label: { fontSize: 11, fontWeight: '600' },
  icon: { fontSize: 22 },
  iconFocused: { fontSize: 24 },
});
