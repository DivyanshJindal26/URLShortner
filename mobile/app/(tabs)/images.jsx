import { useState, useCallback } from 'react';
import {
  View, Text, FlatList, Pressable, StyleSheet,
  ActivityIndicator, Alert, RefreshControl, Image
} from 'react-native';
import * as ExpoClipboard from 'expo-clipboard';
import { useFocusEffect } from 'expo-router';
import { getImages, deleteImage } from '../../utils/api';
import { getConfig } from '../../utils/api';

export default function ImagesScreen() {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [baseUrl, setBaseUrl] = useState('https://softkernel.in');

  useFocusEffect(useCallback(() => { load(); }, []));

  async function load() {
    try {
      const [data, { serverUrl }] = await Promise.all([getImages(), getConfig()]);
      setImages(data);
      setBaseUrl(serverUrl);
    } catch {}
    finally { setLoading(false); setRefreshing(false); }
  }

  async function handleDelete(filename) {
    Alert.alert('Delete', `Delete ${filename}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          await deleteImage(filename);
          setImages(prev => prev.filter(i => i.filename !== filename));
        }
      },
    ]);
  }

  function formatBytes(bytes) {
    if (!bytes) return '';
    if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
  }

  function renderItem({ item }) {
    const embedUrl = `${baseUrl}/i/${item.filename}`;
    const rawUrl = `${baseUrl}/i/${item.filename}/raw`;
    return (
      <View style={s.item}>
        <Image source={{ uri: rawUrl }} style={s.thumb} />
        <View style={s.itemInfo}>
          <Text style={s.title} numberOfLines={1}>{item.original_name || item.filename}</Text>
          <Text style={s.meta}>{formatBytes(item.size)} · {item.visits} views</Text>
        </View>
        <View style={s.actions}>
          <Pressable style={s.btn} onPress={() => ExpoClipboard.setStringAsync(embedUrl)}>
            <Text style={s.btnText}>Embed</Text>
          </Pressable>
          <Pressable style={s.btn} onPress={() => ExpoClipboard.setStringAsync(rawUrl)}>
            <Text style={s.btnText}>Raw</Text>
          </Pressable>
          <Pressable style={[s.btn, s.btnDanger]} onPress={() => handleDelete(item.filename)}>
            <Text style={[s.btnText, s.btnDangerText]}>Del</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  if (loading) return <View style={s.center}><ActivityIndicator color="#6366f1" /></View>;

  return (
    <FlatList
      data={images}
      keyExtractor={i => i.filename}
      renderItem={renderItem}
      contentContainerStyle={s.list}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor="#6366f1" />}
      ListEmptyComponent={<Text style={s.empty}>No images yet</Text>}
    />
  );
}

const s = StyleSheet.create({
  center: { flex: 1, backgroundColor: '#0f0f0f', alignItems: 'center', justifyContent: 'center' },
  list: { backgroundColor: '#0f0f0f', padding: 16, gap: 8 },
  empty: { color: '#888', textAlign: 'center', marginTop: 40 },
  item: {
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#2a2a2a',
    borderRadius: 8,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  thumb: { width: 48, height: 48, borderRadius: 6, backgroundColor: '#2a2a2a' },
  itemInfo: { flex: 1 },
  title: { color: '#e5e5e5', fontWeight: '500', fontSize: 13 },
  meta: { color: '#888', fontSize: 11, marginTop: 2 },
  actions: { flexDirection: 'column', gap: 4 },
  btn: { borderWidth: 1, borderColor: '#6366f1', borderRadius: 5, paddingVertical: 3, paddingHorizontal: 8 },
  btnText: { color: '#818cf8', fontSize: 11 },
  btnDanger: { borderColor: '#ef4444' },
  btnDangerText: { color: '#ef4444' },
});
