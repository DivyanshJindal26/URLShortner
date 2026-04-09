import { useState, useCallback } from 'react';
import {
  View, Text, FlatList, Pressable, StyleSheet,
  ActivityIndicator, Alert, RefreshControl
} from 'react-native';
import * as ExpoClipboard from 'expo-clipboard';
import { useFocusEffect } from 'expo-router';
import { getLinks, deleteLink } from '../../utils/api';
import { getConfig } from '../../utils/api';

export default function LinksScreen() {
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [baseUrl, setBaseUrl] = useState('https://softkernel.in');

  useFocusEffect(useCallback(() => { load(); }, []));

  async function load() {
    try {
      const [data, { serverUrl }] = await Promise.all([getLinks(), getConfig()]);
      setLinks(data);
      setBaseUrl(serverUrl);
    } catch {}
    finally { setLoading(false); setRefreshing(false); }
  }

  async function handleDelete(code) {
    Alert.alert('Delete', `Delete /${code}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          await deleteLink(code);
          setLinks(prev => prev.filter(l => l.code !== code));
        }
      },
    ]);
  }

  function renderItem({ item }) {
    const shortUrl = `${baseUrl}/${item.code}`;
    return (
      <View style={s.item}>
        <View style={s.itemInfo}>
          <Text style={s.title} numberOfLines={1}>{item.title || item.original_url}</Text>
          <Text style={s.sub} numberOfLines={1}>{shortUrl}</Text>
          <Text style={s.meta}>{item.visits} visits · {new Date(item.created_at).toLocaleDateString()}</Text>
        </View>
        <View style={s.actions}>
          <Pressable style={s.btn} onPress={() => ExpoClipboard.setStringAsync(shortUrl)}>
            <Text style={s.btnText}>Copy</Text>
          </Pressable>
          <Pressable style={[s.btn, s.btnDanger]} onPress={() => handleDelete(item.code)}>
            <Text style={[s.btnText, s.btnDangerText]}>Del</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  if (loading) return <View style={s.center}><ActivityIndicator color="#6366f1" /></View>;

  return (
    <FlatList
      data={links}
      keyExtractor={i => i.code}
      renderItem={renderItem}
      contentContainerStyle={s.list}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor="#6366f1" />}
      ListEmptyComponent={<Text style={s.empty}>No links yet</Text>}
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
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  itemInfo: { flex: 1 },
  title: { color: '#e5e5e5', fontWeight: '500', fontSize: 13 },
  sub: { color: '#818cf8', fontSize: 12, marginTop: 2 },
  meta: { color: '#888', fontSize: 11, marginTop: 2 },
  actions: { flexDirection: 'row', gap: 6 },
  btn: { borderWidth: 1, borderColor: '#6366f1', borderRadius: 5, paddingVertical: 5, paddingHorizontal: 10 },
  btnText: { color: '#818cf8', fontSize: 12 },
  btnDanger: { borderColor: '#ef4444' },
  btnDangerText: { color: '#ef4444' },
});
