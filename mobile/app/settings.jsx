import { useState, useEffect } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { getConfig, saveConfig } from '../utils/api';

export default function SettingsScreen() {
  const router = useRouter();
  const [serverUrl, setServerUrl] = useState('');
  const [apiKey, setApiKey] = useState('');

  useEffect(() => {
    getConfig().then(({ serverUrl, apiKey }) => {
      setServerUrl(serverUrl);
      setApiKey(apiKey);
    });
  }, []);

  async function save() {
    if (!serverUrl.trim()) { Alert.alert('Enter a server URL'); return; }
    await saveConfig(serverUrl.trim(), apiKey.trim());
    Alert.alert('Saved', 'Settings saved', [{ text: 'OK', onPress: () => router.back() }]);
  }

  return (
    <View style={s.container}>
      <Text style={s.label}>Server URL</Text>
      <TextInput
        style={s.input}
        value={serverUrl}
        onChangeText={setServerUrl}
        placeholder="https://softkernel.in"
        placeholderTextColor="#555"
        autoCapitalize="none"
        keyboardType="url"
      />

      <Text style={[s.label, { marginTop: 16 }]}>API Key</Text>
      <TextInput
        style={s.input}
        value={apiKey}
        onChangeText={setApiKey}
        placeholder="your-secret-api-key"
        placeholderTextColor="#555"
        secureTextEntry
        autoCapitalize="none"
      />

      <Pressable style={s.btn} onPress={save}>
        <Text style={s.btnText}>Save</Text>
      </Pressable>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f0f', padding: 20 },
  label: { color: '#888', fontSize: 12, marginBottom: 6 },
  input: {
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#2a2a2a',
    borderRadius: 8,
    color: '#e5e5e5',
    fontSize: 14,
    padding: 12,
  },
  btn: {
    backgroundColor: '#6366f1',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    marginTop: 24,
  },
  btnText: { color: '#fff', fontWeight: '600', fontSize: 15 },
});
