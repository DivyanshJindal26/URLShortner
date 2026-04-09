import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const STORAGE_URL_KEY = 'sk_server_url';
const STORAGE_KEY_KEY = 'sk_api_key';

export async function getConfig() {
  const [serverUrl, apiKey] = await Promise.all([
    AsyncStorage.getItem(STORAGE_URL_KEY),
    AsyncStorage.getItem(STORAGE_KEY_KEY),
  ]);
  return {
    serverUrl: serverUrl || 'https://softkernel.in',
    apiKey: apiKey || '',
  };
}

export async function saveConfig(serverUrl, apiKey) {
  await Promise.all([
    AsyncStorage.setItem(STORAGE_URL_KEY, serverUrl),
    AsyncStorage.setItem(STORAGE_KEY_KEY, apiKey),
  ]);
}

async function client() {
  const { serverUrl, apiKey } = await getConfig();
  return axios.create({
    baseURL: `${serverUrl}/api`,
    headers: { Authorization: `Bearer ${apiKey}` },
  });
}

export async function shortenUrl(url, customCode) {
  const c = await client();
  const res = await c.post('/shorten', { url, customCode: customCode || undefined });
  return res.data;
}

export async function uploadImage(uri, filename, mimeType) {
  const { serverUrl, apiKey } = await getConfig();
  const form = new FormData();
  form.append('image', { uri, name: filename || 'image.jpg', type: mimeType || 'image/jpeg' });
  const res = await axios.post(`${serverUrl}/api/upload`, form, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'multipart/form-data',
    },
  });
  return res.data;
}

export async function getLinks() {
  const c = await client();
  const res = await c.get('/links');
  return res.data;
}

export async function deleteLink(code) {
  const c = await client();
  await c.delete(`/links/${code}`);
}

export async function getImages() {
  const c = await client();
  const res = await c.get('/images');
  return res.data;
}

export async function deleteImage(filename) {
  const c = await client();
  await c.delete(`/images/${filename}`);
}
