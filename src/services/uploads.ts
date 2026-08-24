import * as DocumentPicker from 'expo-document-picker';
import { File } from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';

const MAX_EMBEDDED_FILE_BYTES = 2_000_000;

export type PickedUpload = {
  dataUrl: string;
  fileName: string;
};

export async function pickImage(): Promise<PickedUpload | null> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) throw new Error('Photo library access is required to attach an image.');

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    base64: true,
    quality: 0.55,
  });
  if (result.canceled) return null;

  const asset = result.assets[0];
  if ((asset.fileSize ?? 0) > MAX_EMBEDDED_FILE_BYTES) throw new Error('Choose an image smaller than 2 MB.');
  if (!asset.base64) throw new Error('The selected image could not be read.');
  const mimeType = asset.mimeType ?? 'image/jpeg';
  return { dataUrl: `data:${mimeType};base64,${asset.base64}`, fileName: asset.fileName ?? `hostin-photo.${mimeType.split('/')[1] ?? 'jpg'}` };
}

export async function pickDocument(): Promise<PickedUpload | null> {
  const result = await DocumentPicker.getDocumentAsync({ copyToCacheDirectory: true, multiple: false, type: ['application/pdf', 'image/*'] });
  if (result.canceled) return null;
  const asset = result.assets[0];
  if ((asset.size ?? 0) > MAX_EMBEDDED_FILE_BYTES) throw new Error('Choose a PDF or image smaller than 2 MB.');
  const base64 = asset.base64 ?? await new File(asset.uri).base64();
  return { dataUrl: `data:${asset.mimeType ?? 'application/octet-stream'};base64,${base64}`, fileName: asset.name };
}
