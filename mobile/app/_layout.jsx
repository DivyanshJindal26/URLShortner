import { Tabs } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Pressable, Text } from 'react-native';
import { useRouter } from 'expo-router';

export default function RootLayout() {
  const router = useRouter();

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <Tabs
        screenOptions={{
          headerStyle: { backgroundColor: '#0f0f0f' },
          headerTintColor: '#e5e5e5',
          headerTitleStyle: { fontWeight: '700' },
          tabBarStyle: { backgroundColor: '#1a1a1a', borderTopColor: '#2a2a2a' },
          tabBarActiveTintColor: '#6366f1',
          tabBarInactiveTintColor: '#888',
          headerRight: () => (
            <Pressable onPress={() => router.push('/settings')} style={{ marginRight: 16 }}>
              <Text style={{ color: '#888', fontSize: 13 }}>Settings</Text>
            </Pressable>
          ),
        }}
      >
        <Tabs.Screen name="(tabs)/index" options={{ title: 'Shorten', tabBarLabel: 'Shorten' }} />
        <Tabs.Screen name="(tabs)/upload" options={{ title: 'Upload', tabBarLabel: 'Upload' }} />
        <Tabs.Screen name="(tabs)/links" options={{ title: 'My Links', tabBarLabel: 'Links' }} />
        <Tabs.Screen name="(tabs)/images" options={{ title: 'My Images', tabBarLabel: 'Images' }} />
        <Tabs.Screen name="settings" options={{ href: null }} />
      </Tabs>
    </SafeAreaProvider>
  );
}
