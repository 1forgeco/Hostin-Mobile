import assert from 'node:assert/strict';
import test from 'node:test';

import { modules, modulesForRole } from '../src/modules';
import type { OrgRole } from '../src/types';

const roles: OrgRole[] = ['owner', 'warden', 'guard', 'staff', 'tenant', 'parent', 'platform'];

test('every supported role has a usable mobile workspace', () => {
  for (const role of roles) assert.ok(modulesForRole(role).length >= 3, `${role} should have at least three modules`);
});

test('module ids are unique and API-backed', () => {
  assert.equal(new Set(modules.map((module) => module.id)).size, modules.length);
  for (const module of modules) {
    assert.match(module.endpoint, /^\//);
    assert.ok(module.roles.length > 0, `${module.id} needs a role`);
  }
});

test('critical role workflows remain available', () => {
  const expected: Record<OrgRole, string[]> = {
    owner: ['overview', 'floors', 'rooms', 'parent-access', 'finance', 'documents'],
    warden: ['overview', 'floors', 'rooms', 'tenants', 'parent-access', 'announcements'],
    guard: ['gate', 'visitors', 'staff'],
    staff: ['community', 'mess', 'staff'],
    tenant: ['gate', 'finance', 'community', 'mess'],
    parent: ['parent-home', 'parent-child', 'parent-gate', 'parent-billing', 'parent-help'],
    platform: ['platform', 'platform-plans', 'platform-onboarding', 'platform-features'],
  };
  for (const role of roles) {
    const ids = new Set(modulesForRole(role).map((module) => module.id));
    for (const id of expected[role]) assert.ok(ids.has(id), `${role} is missing ${id}`);
  }
});
