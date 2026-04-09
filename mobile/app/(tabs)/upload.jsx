import { useState } from 'react';
import {
  View, Text, Pressable, StyleSheet, ActivityIndicator,
  Image, Share
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as ExpoClipboard from 'expo-clipboard';
import { uploadImage } from '../../utils/api';

export default function UploadScreen() {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [preview, setPreview] = useState(null);

  async function pickAndUpload(source) {
    let picked;
    if (source === 'camera') {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) { setError('Camera permission denied'); return; }
      picked = await ImagePicker.launchCameraAsync({ quality: 0.9 });
    } else {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) { setError('Gallery permission denied'); return; }
      picked = await ImagePicker.launchImageLibraryAsync({ quality: 0.9 });
    }

    if (picked.canceled || !picked.assets?.length) return;
    const asset = picked.assets[0];

    setPreview(asset.uri);
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const filename = asset.fileName || asset.uri.split('/').pop();
      const data = await uploadImage(asset.uri, filename, asset.mimeType || 'image/jpeg');
      setResult(data);
    } catch (e) {
      setError(e.response?.data?.error || 'Upload failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={s.container}>
      <View style={s.btns}>
        <Pressable style={s.btn} onPress={() => pickAndUpload('gallery')}>
          <Text style={s.btnText}>Pick from Gallery</Text>
        </Pressable>
        <Pressable style={[s.btn, s.btnOutline]} onPress={() => pickAndUpload('camera')}>
          <Text style={[s.btnText, s.btnOutlineText]}>Take Photo</Text>
        </Pressable>
      </View>

      {preview && <Image source={{ uri: preview }} style={s.preview} />}

      {loading && (
        <View style={s.loadingRow}>
          <ActivityIndicator color="#6366f1" />
          <Text style={s.muted}> Uploading…</Text>
        </View>
      )}

      {error ? <Text style={s.error}>{error}</Text> : null}

      {result && (
        <View style={s.resultCard}>
          <Text style={s.cardTitle}>Uploaded!</Text>

          <Text style={s.rowLabel}>Embed URL (for sharing — shows preview)</Text>
          <Text style={s.urlText}>{result.embedUrl}</Text>
          <View style={s.rowBtns}>
            <Pressable style={s.outlineBtn} onPress={() => ExpoClipboard.setStringAsync(result.embedUrl)}>
              <Text style={s.outlineBtnText}>Copy Embed</Text>
            </Pressable>
            <Pressable style={s.outlineBtn} onPress={() => Share.share({ message: result.embedUrl })}>
              <Text style={s.outlineBtnText}>Share</Text>
            </Pressable>
          </View>

          <Text style={[s.rowLabel, { marginTop: 12 }]}>Raw Image URL</Text>
          <Text style={s.urlText}>{result.rawUrl}</Text>
          <Pressable style={s.outlineBtn} onPress={() => ExpoClipboard.setStringAsync(result.rawUrl)}>
            <Text style={s.outlineBtnText}>Copy Raw</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f0f', padding: 20 },
  btns: { flexDirection: 'row', gap: 10 },
  btn: { flex: 1, backgroundColor: '#6366f1', borderRadius: 8, padding: 14, alignItems: 'center' },
  btnOutline: { backgroundColor: 'transparent', borderWidth: 1, borderColor: '#6366f1' },
  btnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  btnOutlineText: { color: '#818cf8' },
  preview: { width: '100%', height: 220, borderRadius: 10, marginTop: 20, resizeMode: 'cover' },
  loadingRow: { flexDirection: 'row', alignItems: 'center', marginTop: 16 },
  muted: { color: '#888', fontSize: 13 },
  error: { color: '#ef4444', marginTop: 12, fontSize: 13 },
  resultCard: {
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#2a2a2a',
    borderRadius: 10,
    padding: 16,
    marginTop: 20,
  },
  cardTitle: { color: '#e5e5e5', fontWeight: '700', fontSize: 16, marginBottom: 12 },
  rowLabel: { color: '#888', fontSize: 11, marginBottom: 4 },
  urlText: { color: '#818cf8', fontSize: 13, marginBottom: 8 },
  rowBtns: { flexDirection: 'row', gap: 8 },
  outlineBtn: { borderWidth: 1, borderColor: '#6366f1', borderRadius: 6, paddingVertical: 6, paddingHorizontal: 14 },
  outlineBtnText: { color: '#818cf8', fontSize: 13 },
});
