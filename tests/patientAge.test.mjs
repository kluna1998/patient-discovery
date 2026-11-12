import assert from 'node:assert/strict';
import { test } from 'node:test';
import { calculate_age, withPatientAges } from '../src/services/patientAge.ts';

const day = (year, month, date) => new Date(year, month - 1, date, 12);

test('age counts completed birthdays using local calendar dates', () => {
  const today = day(2026, 11, 12);
  assert.equal(calculate_age('2000-11-11', today), 26);
  assert.equal(calculate_age('2000-11-12', today), 26);
  assert.equal(calculate_age('2000-11-13', today), 25);
  assert.equal(calculate_age('2026-11-12', today), 0);
  assert.equal(calculate_age(' 2000-11-12 ', today), 26);
});

test('age changes across year boundaries and treats Feb 29 birthdays as March 1 in non-leap years', () => {
  assert.equal(calculate_age('2000-01-01', day(2025, 12, 31)), 25);
  assert.equal(calculate_age('2000-01-01', day(2026, 1, 1)), 26);
  assert.equal(calculate_age('2000-02-29', day(2026, 2, 28)), 25);
  assert.equal(calculate_age('2000-02-29', day(2026, 3, 1)), 26);
  assert.equal(calculate_age('2000-02-29', day(2024, 2, 29)), 24);
});

test('invalid, missing and future dates produce no age, never a guessed date', () => {
  for (const value of [undefined, '', ' ', 'null', '2025-02-29', '1900-02-29', '2000-04-31',
    '2000-00-12', '2000-13-12', '2000-01-00', '0000-01-01', '12/11/2000',
    '2000-1-1', '2000-01-01T00:00:00Z', '2026-11-13', '2027-01-01']) {
    assert.equal(calculate_age(value, day(2026, 11, 12)), null, String(value));
  }
  assert.equal(calculate_age('2000-01-01', new Date(NaN)), null);
});

test('derived dataset retains all original data and does not mutate it', () => {
  const source = {fileName: 'patients.csv', columns: ['patient_ref', 'birth_date', 'other'],
    rows: [{patient_ref:'test', birth_date:'2000-11-12', other:'unchanged'}]};
  const snapshot = structuredClone(source);
  const result = withPatientAges(source, day(2026, 11, 12));
  assert.deepEqual(source, snapshot);
  assert.deepEqual(result.columns, ['patient_ref', 'birth_date', 'age', 'other']);
  assert.deepEqual(result.rows, [{...source.rows[0], age:'26'}]);
  assert.equal(result.fileName, source.fileName);
});

test('birth date overrides a stale age, including invalid dates, without duplicating age', () => {
  const source = {fileName:'test.csv', columns:['birth_date','age'], rows:[
    {birth_date:'2000-11-12',age:'1'}, {birth_date:'',age:'50'}, {birth_date:'invalid',age:'60'}]};
  const result = withPatientAges(source, day(2026, 11, 12));
  assert.deepEqual(result.columns, source.columns);
  assert.deepEqual(result.rows.map(row=>row.age), ['26','','']);
  assert.equal(source.rows[0].age, '1');
});

test('old files without birth_date keep their age and structure', () => {
  const legacy = {fileName:'legacy.csv',columns:['age'],rows:[{age:'62'}]};
  assert.equal(withPatientAges(legacy), legacy);
});

test('recomputing for a new date preserves patient order and updates age', () => {
  const source = {fileName:'test.csv',columns:['patient_ref','birth_date'],rows:[
    {patient_ref:'one',birth_date:'2000-11-13'}, {patient_ref:'two',birth_date:'1990-05-01'}]};
  const before = withPatientAges(source, day(2026,11,12));
  const after = withPatientAges(source, day(2026,11,13));
  assert.deepEqual(before.rows.map(row=>row.age), ['25','36']);
  assert.deepEqual(after.rows.map(row=>row.age), ['26','36']);
  assert.deepEqual(after.rows.map(row=>row.patient_ref), ['one','two']);
});
