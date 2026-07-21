// Requiere paquetes nativos + un dev build (NO funciona en Expo Go):
//   npm install react-native-health react-native-health-connect
//   npx expo prebuild
// Los require() van envueltos en try/catch a propósito: Metro trata un require
// dentro de try/catch como dependencia OPCIONAL, así que la app sigue empaquetando
// y funcionando aunque estos SDKs nativos no estén instalados todavía. En Expo Go /
// web el require lanza y se captura, y la función avisa que hace falta un dev build.
import { Platform } from 'react-native';
import { apiClient } from '../api/client';

function loadHealthKit(): any {
  try {
    return (require('react-native-health') as any).default;
  } catch {
    throw new Error('react-native-health no disponible: requiere un dev build (no funciona en Expo Go / web).');
  }
}

function loadHealthConnect(): any {
  try {
    return require('react-native-health-connect') as any;
  } catch {
    throw new Error('react-native-health-connect no disponible: requiere un dev build (no funciona en Expo Go / web).');
  }
}

export async function requestHealthPermissionsAndSync() {
  if (Platform.OS === 'ios') {
    const AppleHealthKit = loadHealthKit();
    const permissions = { permissions: { read: [AppleHealthKit.Constants.Permissions.Weight], write: [] } };
    await new Promise<void>((resolve, reject) => AppleHealthKit.initHealthKit(permissions, (err: string) => (err ? reject(new Error(err)) : resolve())));

    const options = { startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString() };
    const samples = await new Promise<any[]>((resolve, reject) =>
      AppleHealthKit.getWeightSamples(options, (err: string, results: any[]) => (err ? reject(new Error(err)) : resolve(results))));

    await apiClient.post('/health-sync/samples', {
      samples: samples.map((s) => ({ type: 'weight', valueKg: s.value, recordedAt: s.startDate })),
    });
  } else {
    const { initialize, requestPermission, readRecords } = loadHealthConnect();
    await initialize();
    await requestPermission([{ accessType: 'read', recordType: 'Weight' }]);
    const { records } = await readRecords('Weight', { timeRangeFilter: { operator: 'after', startTime: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString() } });

    await apiClient.post('/health-sync/samples', {
      samples: records.map((r: any) => ({ type: 'weight', valueKg: r.weight.inKilograms, recordedAt: r.time })),
    });
  }
}
