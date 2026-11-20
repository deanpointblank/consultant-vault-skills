import test from 'node:test';
import assert from 'node:assert/strict';
import { planShapeErrors } from '../lib/plan.mjs';
import { tempRoot, ledgerRepo, samplePlan } from './helpers.mjs';

test('extend is refused in plan mode', t => {
  const r = ledgerRepo(tempRoot(t));
  assert.ok(planShapeErrors({ ...samplePlan(r), extend: [{}] }).includes('a plan has no extend points; put the work in plan.tasks'));
});
