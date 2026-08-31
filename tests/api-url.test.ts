import assert from 'node:assert/strict';
import test from 'node:test';

import { apiConnectionMessage, resolveApiUrl } from '../src/services/api-url';

test('keeps localhost for the iOS Simulator and web', () => {
  assert.equal(resolveApiUrl('http://localhost:5001/api/', 'ios', 'localhost:8081', true), 'http://localhost:5001/api');
  assert.equal(resolveApiUrl('http://localhost:5001/api', 'web', '192.168.1.8:8081', true), 'http://localhost:5001/api');
});

test('uses the Android emulator host alias when Metro is local', () => {
  assert.equal(resolveApiUrl('http://localhost:5001/api', 'android', 'localhost:8081', true), 'http://10.0.2.2:5001/api');
});

test('uses Expo Metro host on physical development devices', () => {
  assert.equal(resolveApiUrl('http://127.0.0.1:5001/api', 'ios', '192.168.1.42:8081', true), 'http://192.168.1.42:5001/api');
});

test('never rewrites production or remote API URLs', () => {
  assert.equal(resolveApiUrl('https://api.hostin.example/api', 'android', '192.168.1.42:8081', true), 'https://api.hostin.example/api');
  assert.equal(resolveApiUrl('http://localhost:5001/api', 'android', '192.168.1.42:8081', false), 'http://localhost:5001/api');
});

test('connection errors identify the endpoint and recovery command', () => {
  assert.match(apiConnectionMessage('http://localhost:5001/api'), /npm run backend:start/);
});
