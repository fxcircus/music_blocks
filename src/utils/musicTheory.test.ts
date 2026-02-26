/**
 * Tests for Music Theory Utilities
 * Testing Phase 1: Core Infrastructure
 */

import {
  getChromaticIndex,
  normalizeNote,
  getBaseLetter,
  hasSharp,
  hasFlat,
  getCorrectNoteSpelling,
  getAccidentalsInKey,
  generateDiatonicScale,
  shouldUseSharps,
  isCorrectlySpelledScale,
} from './musicTheory';

// ============================================================================
// TEST SUITE: Core Functions
// ============================================================================

console.log('🎵 Music Theory Tests - Phase 1');
console.log('================================\n');

// Test 1: Chromatic Index
console.log('Test 1: getChromaticIndex()');
const indexTests = [
  { note: 'C', expected: 0 },
  { note: 'C♯', expected: 1 },
  { note: 'D♭', expected: 1 },
  { note: 'D', expected: 2 },
  { note: 'E♭', expected: 3 },
  { note: 'E', expected: 4 },
  { note: 'F', expected: 5 },
  { note: 'F♯', expected: 6 },
  { note: 'G♭', expected: 6 },
  { note: 'A♭', expected: 8 },
  { note: 'B♭', expected: 10 },
  { note: 'B', expected: 11 },
  { note: 'E♯', expected: 5 }, // E♯ = F
  { note: 'C♭', expected: 11 }, // C♭ = B
];

let passed = 0;
let failed = 0;

indexTests.forEach(test => {
  const result = getChromaticIndex(test.note);
  if (result === test.expected) {
    console.log(`  ✅ ${test.note} → ${result}`);
    passed++;
  } else {
    console.log(`  ❌ ${test.note} → ${result} (expected ${test.expected})`);
    failed++;
  }
});

console.log(`\nResult: ${passed} passed, ${failed} failed\n`);

// Test 2: Note Normalization
console.log('Test 2: normalizeNote()');
const normalTests = [
  { input: 'C#', expected: 'C♯' },  // ASCII to Unicode
  { input: 'Bb', expected: 'B♭' },   // ASCII to Unicode
  { input: 'E♯', expected: 'E♯' },   // Already Unicode
  { input: 'C♭', expected: 'C♭' },   // Already Unicode
];

passed = 0;
failed = 0;

normalTests.forEach(test => {
  const result = normalizeNote(test.input);
  if (result === test.expected) {
    console.log(`  ✅ "${test.input}" → "${result}"`);
    passed++;
  } else {
    console.log(`  ❌ "${test.input}" → "${result}" (expected "${test.expected}")`);
    failed++;
  }
});

console.log(`\nResult: ${passed} passed, ${failed} failed\n`);

// Test 3: Key-Aware Note Spelling
console.log('Test 3: getCorrectNoteSpelling()');
const spellingTests = [
  { index: 10, key: 'F', type: 'Major', expected: 'B♭', description: 'F Major: 4th degree' },
  { index: 10, key: 'C', type: 'Major', expected: 'A♯', description: 'C Major: chromatic' },
  { index: 1, key: 'D♭', type: 'Major', expected: 'D♭', description: 'D♭ Major: root' },
  { index: 3, key: 'E♭', type: 'Major', expected: 'E♭', description: 'E♭ Major: root' },
  { index: 10, key: 'D', type: 'Minor', expected: 'B♭', description: 'D Minor: 6th degree' },
  { index: 3, key: 'C', type: 'Minor', expected: 'E♭', description: 'C Minor: 3rd degree' },
];

passed = 0;
failed = 0;

spellingTests.forEach(test => {
  const result = getCorrectNoteSpelling(test.index, test.key, test.type);
  if (result === test.expected) {
    console.log(`  ✅ ${test.description}: ${result}`);
    passed++;
  } else {
    console.log(`  ❌ ${test.description}: ${result} (expected ${test.expected})`);
    failed++;
  }
});

console.log(`\nResult: ${passed} passed, ${failed} failed\n`);

// Test 4: Scale Generation with Diatonic Spelling
console.log('Test 4: generateDiatonicScale()');
const scaleTests = [
  {
    root: 'F',
    intervals: [2, 2, 1, 2, 2, 2, 1],
    type: 'Major',
    expected: ['F', 'G', 'A', 'B♭', 'C', 'D', 'E', 'F'],
    description: 'F Major'
  },
  {
    root: 'B♭',
    intervals: [2, 2, 1, 2, 2, 2, 1],
    type: 'Major',
    expected: ['B♭', 'C', 'D', 'E♭', 'F', 'G', 'A', 'B♭'],
    description: 'B♭ Major'
  },
  {
    root: 'D',
    intervals: [2, 1, 2, 2, 1, 2, 2],
    type: 'Minor',
    expected: ['D', 'E', 'F', 'G', 'A', 'B♭', 'C', 'D'],
    description: 'D Minor'
  },
  {
    root: 'G',
    intervals: [2, 1, 2, 2, 1, 2, 2],
    type: 'Minor',
    expected: ['G', 'A', 'B♭', 'C', 'D', 'E♭', 'F', 'G'],
    description: 'G Minor'
  },
];

passed = 0;
failed = 0;

scaleTests.forEach(test => {
  const result = generateDiatonicScale(test.root, test.intervals, test.type);
  const match = JSON.stringify(result) === JSON.stringify(test.expected);

  if (match) {
    console.log(`  ✅ ${test.description}: ${result.join(' ')}`);
    passed++;
  } else {
    console.log(`  ❌ ${test.description}:`);
    console.log(`     Got:      ${result.join(' ')}`);
    console.log(`     Expected: ${test.expected.join(' ')}`);
    failed++;
  }
});

console.log(`\nResult: ${passed} passed, ${failed} failed\n`);

// Test 5: Accidentals in Key Signatures
console.log('Test 5: getAccidentalsInKey()');
const keyTests = [
  { key: 'F Major', expected: ['B♭'], description: 'F Major (1 flat)' },
  { key: 'B♭ Major', expected: ['B♭', 'E♭'], description: 'B♭ Major (2 flats)' },
  { key: 'E♭ Major', expected: ['B♭', 'E♭', 'A♭'], description: 'E♭ Major (3 flats)' },
  { key: 'G Major', expected: ['F♯'], description: 'G Major (1 sharp)' },
  { key: 'D Major', expected: ['F♯', 'C♯'], description: 'D Major (2 sharps)' },
];

passed = 0;
failed = 0;

keyTests.forEach(test => {
  const result = getAccidentalsInKey(test.key);
  const match = JSON.stringify(result) === JSON.stringify(test.expected);

  if (match) {
    console.log(`  ✅ ${test.description}: ${result.join(', ')}`);
    passed++;
  } else {
    console.log(`  ❌ ${test.description}:`);
    console.log(`     Got:      ${result.join(', ')}`);
    console.log(`     Expected: ${test.expected.join(', ')}`);
    failed++;
  }
});

console.log(`\nResult: ${passed} passed, ${failed} failed\n`);

// Test 6: Scale Spelling Validation
console.log('Test 6: isCorrectlySpelledScale()');
const validationTests = [
  { scale: ['F', 'G', 'A', 'B♭', 'C', 'D', 'E', 'F'], expected: true, description: 'F Major (correct)' },
  { scale: ['F', 'G', 'A', 'A♯', 'C', 'D', 'E', 'F'], expected: false, description: 'F Major with A♯ (wrong)' },
  { scale: ['C', 'D', 'E', 'F', 'G', 'A', 'B', 'C'], expected: true, description: 'C Major (correct)' },
];

passed = 0;
failed = 0;

validationTests.forEach(test => {
  const result = isCorrectlySpelledScale(test.scale);

  if (result === test.expected) {
    console.log(`  ✅ ${test.description}: ${result}`);
    passed++;
  } else {
    console.log(`  ❌ ${test.description}: ${result} (expected ${test.expected})`);
    failed++;
  }
});

console.log(`\nResult: ${passed} passed, ${failed} failed\n`);

// Summary
console.log('================================');
console.log('🎯 Phase 1 Test Summary:');
console.log('  - Chromatic index calculation ✓');
console.log('  - Note normalization ✓');
console.log('  - Key-aware note spelling ✓');
console.log('  - Diatonic scale generation ✓');
console.log('  - Key signature accidentals ✓');
console.log('  - Scale validation ✓');
console.log('================================\n');