import { useState } from 'react';
import {
  View, Text, TextInput, Pressable, StyleSheet,
  ActivityIndicator, Share, Clipboard
} from 'react-native';
import * as ExpoClipboard from 'expo-clipboard';
import { shortenUrl } from '../../utils/api';

export default function ShortenScreen() {
  const [url, setUrl] = useState('');
  const [customCode, setCustomCode] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleShorten() {
    if (!url.trim()) return;
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const data = await shortenUrl(url.trim(), customCode.trim());
      setResult(data);
      setUrl('');
      setCustomCode('');
    } catch (e) {
      setError(e.response?.data?.error || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  async function handleCopy() {
    await ExpoClipboard.setStringAsync(result.shortUrl);
  }

  async function handleShare() {
    await Share.share({ message: result.shortUrl });
  }

  return (
    <View style={s.container}>
      <Text style={s.label}>Paste a URL to shorten</Text>
      <TextInput
        style={s.input}
        value={url}
        onChangeText={setUrl}
        placeholder="https://example.com/very/long/url"
        placeholderTextColor="#555"
        autoCapitalize="none"
        keyboardType="url"
        returnKeyType="done"
        onSubmitEditing={handleShorten}
      />
      <TextInput
        style={[s.input, { marginTop: 8 }]}
        value={customCode}
        onChangeText={setCustomCode}
        placeholder="custom-code (optional)"
        placeholderTextColor="#555"
        autoCapitalize="none"
        returnKeyType="done"
      />

      <Pressable style={[s.btn, loading && s.btnDisabled]} onPress={handleShorten} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.btnText}>Shorten</Text>}
      </Pressable>

      {error ? <Text style={s.error}>{error}</Text> : null}

      {result && (
        <View style={s.resultCard}>
          <Text style={s.resultUrl}>{result.shortUrl}</Text>
          <View style={s.resultActions}>
            <Pressable style={s.outlineBtn} onPress={handleCopy}>
              <Text style={s.outlineBtnText}>Copy</Text>
            </Pressable>
            <Pressable style={s.outlineBtn} onPress={handleShare}>
              <Text style={s.outlineBtnText}>Share</Text>
            </Pressable>
          </View>
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f0f', padding: 20 },
  label: { color: '#888', fontSize: 13, marginBottom: 8 },
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
    marginTop: 16,
  },
  btnDisabled: { opacity: 0.5 },
  btnText: { color: '#fff', fontWeight: '600', fontSize: 15 },
  error: { color: '#ef4444', marginTop: 12, fontSize: 13 },
  resultCard: {
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#2a2a2a',
    borderRadius: 10,
    padding: 16,
    marginTop: 24,
  },
  resultUrl: { color: '#818cf8', fontSize: 16, fontWeight: '600', marginBottom: 12 },
  resultActions: { flexDirection: 'row', gap: 8 },
  outlineBtn: {
    borderWidth: 1,
    borderColor: '#6366f1',
    borderRadius: 6,
    paddingVertical: 6,
    paddingHorizontal: 14,
  },
  outlineBtnText: { color: '#818cf8', fontSize: 13, fontWeight: '500' },
});
