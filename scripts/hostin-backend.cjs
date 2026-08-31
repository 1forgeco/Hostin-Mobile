const { existsSync } = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const backend = path.join(root, '.hostin-backend');
const composeFile = path.join(backend, 'compose.yml');
const action = process.argv[2] ?? 'start';

function run(command, args, options = {}) {
  const result = spawnSync(command, args, { cwd: root, stdio: 'inherit', ...options });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}

function ensureBackend() {
  if (existsSync(composeFile)) return;
  console.log('Downloading the HostIn backend for local development...');
  run('git', ['clone', '--depth', '1', 'https://github.com/1forgeco/HostIn.git', backend]);
}

function compose(...args) {
  ensureBackend();
  run('docker', ['compose', '-f', composeFile, ...args], {
    env: { ...process.env, SEED_DATABASE: 'true' },
  });
}

function waitForBackend(attempts = 60) {
  return new Promise((resolve, reject) => {
    const check = (remaining) => {
      const request = http.get('http://127.0.0.1:5001/ready', (response) => {
        response.resume();
        if (response.statusCode === 200) return resolve();
        if (remaining <= 1) return reject(new Error(`Backend readiness returned HTTP ${response.statusCode}`));
        setTimeout(() => check(remaining - 1), 2000);
      });
      request.setTimeout(1500, () => request.destroy());
      request.on('error', () => {
        if (remaining <= 1) reject(new Error('HostIn backend did not become ready at http://127.0.0.1:5001/ready'));
        else setTimeout(() => check(remaining - 1), 2000);
      });
    };
    check(attempts);
  });
}

async function main() {
  if (action === 'start') {
    compose('up', '--build', '-d', 'postgres', 'server');
    await waitForBackend();
    console.log('HostIn backend is ready at http://localhost:5001');
    return;
  }
  if (action === 'status') return compose('ps');
  if (action === 'logs') return compose('logs', '-f', 'server');
  if (action === 'stop') return compose('down');
  console.error(`Unknown action: ${action}`);
  process.exit(1);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
