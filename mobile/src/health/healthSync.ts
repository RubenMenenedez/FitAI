// Requiere paquetes nativos + un dev build (NO funciona en Expo Go):
//   npm install react-native-health react-native-health-connect
//   npx expo prebuild
// Estos SDKs se cargan con require() de forma perezosa para que el resto de la
// app compile y funcione sin ellos hasta que se genere el build nativo.
import { Platform } from 'react-native';
import { apiClient } from '../api/client';

export async function requestHealthPermissionsAndSync() {
  if (Platform.OS === 'ios') {
    const AppleHealthKit = (require('react-native-health') as any).default;
    const permissions = { permissions: { read: [AppleHealthKit.Constants.Permissions.Weight], write: [] } };
    await new Promise<void>((resolve, reject) => AppleHealthKit.initHealthKit(permissions, (err: string) => (err ? reject(new Error(err)) : resolve())));

    const options = { startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString() };
    const samples = await new Promise<any[]>((resolve, reject) =>
      AppleHealthKit.getWeightSamples(options, (err: string, results: any[]) => (err ? reject(new Error(err)) : resolve(results))));

    await apiClient.post('/health-sync/samples', {
      samples: samples.map((s) => ({ type: 'weight', valueKg: s.value, recordedAt: s.startDate })),
    });
  } else {
    const { initialize, requestPermission, readRecords } = require('react-native-health-connect') as any;
    await initialize();
    await requestPermission([{ accessType: 'read', recordType: 'Weight' }]);
    const { records } = await readRecords('Weight', { timeRangeFilter: { operator: 'after', startTime: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString() } });

    await apiClient.post('/health-sync/samples', {
      samples: records.map((r: any) => ({ type: 'weight', valueKg: r.weight.inKilograms, recordedAt: r.time })),
    });
  }
}
