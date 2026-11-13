import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildCautiousDietContext,
  buildMinimalAiPayload,
  canCompareLabValues,
  checkRateLimit,
  DAILY_RESEARCH_ROWS,
  detectRawDnaContent,
  DIET_PATTERN_GUIDES,
  evaluateBiomarkerAgainstReportRange,
  filterResearchContent,
  parseLabReportText,
  TRUSTED_NUTRITION_SOURCES,
  validateUploadFile,
  validateWellbeingCheckInInput,
} from './wellnestLogic';
import type { ExtractedFinding, WellbeingCheckIn } from '../types/wellnest';

test('validateUploadFile accepts valid report types under 10 MB and rejects invalid files', () => {
  assert.equal(validateUploadFile('panel.pdf', 'application/pdf', 1024).valid, true);
  assert.equal(validateUploadFile('scan.png', 'image/png', 2048).valid, true);
  assert.equal(validateUploadFile('lab.csv', 'text/csv', 512).valid, true);

  const badExt = validateUploadFile('macro.exe', 'application/octet-stream', 500);
  assert.equal(badExt.valid, false);

  const tooBig = validateUploadFile('huge.pdf', 'application/pdf', 11 * 1024 * 1024);
  assert.equal(tooBig.valid, false);

  const empty = validateUploadFile('empty.txt', 'text/plain', 0);
  assert.equal(empty.valid, false);
});

test('detectRawDnaContent blocks 23andMe, AncestryDNA, VCF, and raw SNP genotype files', () => {
  assert.equal(detectRawDnaContent('anything', 'genome_23andme_v5.txt').isRawDna, true);
  assert.equal(detectRawDnaContent('##fileformat=VCFv4.2\n#CHROM', 'sample.txt').isRawDna, true);

  const rawRows = [
    '# rsid\tchromosome\tposition\tgenotype',
    'rs4477212\t1\t82154\tAA',
    'rs3094315\t1\t752566\tAG',
    'rs3131972\t1\t752721\tGG',
  ].join('\n');
  assert.equal(detectRawDnaContent(rawRows, 'export.txt').isRawDna, true);

  const interpretedReport =
    'CYP2C19 Pharmacogenomic Summary: Intermediate metabolizer (Professionally interpreted risk info)';
  assert.equal(detectRawDnaContent(interpretedReport, 'genetics-summary.pdf').isRawDna, false);
});

test('evaluateBiomarkerAgainstReportRange uses cautious non-diagnostic labels', () => {
  const within = evaluateBiomarkerAgainstReportRange('88', 'mg/dL', '70 - 99', 'lab');
  assert.equal(within.status, 'within_range');

  const outside = evaluateBiomarkerAgainstReportRange('24', 'ng/mL', '30 - 100', 'lab');
  assert.equal(outside.status, 'outside_range');
  assert.match(outside.explanation, /Outside this report's reference range/i);
  assert.equal(/disease/i.test(outside.explanation), false);

  const missingUnit = evaluateBiomarkerAgainstReportRange('24', '', '30 - 100', 'lab');
  assert.equal(missingUnit.status, 'needs_review');
});

test('canCompareLabValues blocks comparisons when units or reference ranges differ', () => {
  const a: Pick<ExtractedFinding, 'testName' | 'unit' | 'referenceRange' | 'category'> = {
    category: 'lab',
    testName: 'Vitamin D (25-OH)',
    unit: 'ng/mL',
    referenceRange: '30 - 100',
  };
  const bSame: typeof a = {
    category: 'lab',
    testName: 'Vitamin D (25-OH)',
    unit: 'ng/mL',
    referenceRange: '30 - 100',
  };
  const cDiffUnit: typeof a = {
    category: 'lab',
    testName: 'Vitamin D (25-OH)',
    unit: 'nmol/L',
    referenceRange: '75 - 250',
  };

  assert.equal(canCompareLabValues(a, bSame).comparable, true);
  assert.equal(canCompareLabValues(a, cDiffUnit).comparable, false);
});

test('parseLabReportText marks missing unit or reference range as uncertain', () => {
  const sample = [
    'Fasting Glucose: 91 mg/dL (Ref: 70 - 99)',
    'Ferritin: 18 (Ref: 30 - 400)', // missing unit
  ].join('\n');

  const parsed = parseLabReportText(sample, '2026-10-20', 'lab', 'rep-1');
  assert.equal(parsed.length, 2);
  assert.equal(parsed[0].uncertain, false);
  assert.equal(parsed[0].rangeStatus, 'within_range');
  assert.equal(parsed[1].uncertain, true);
  assert.equal(parsed[1].rangeStatus, 'needs_review');
  assert.equal(parsed[1].confirmedByUser, false);
});

test('buildMinimalAiPayload excludes unconfirmed findings, moodNote PII, and forwards structured metrics', () => {
  const findings: ExtractedFinding[] = [
    {
      id: 'f1',
      reportId: 'r1',
      category: 'lab',
      testName: 'Vitamin D',
      result: '24',
      unit: 'ng/mL',
      reportDate: '2026-10-10',
      referenceRange: '30 - 100',
      rangeStatus: 'outside_range',
      uncertain: false,
      confirmedByUser: true,
      notes: 'Private note should not be sent',
    },
    {
      id: 'f2',
      reportId: 'r1',
      category: 'lab',
      testName: 'TSH',
      result: '2.1',
      unit: 'mIU/L',
      reportDate: '2026-10-10',
      referenceRange: '0.4 - 4.5',
      rangeStatus: 'within_range',
      uncertain: true,
      confirmedByUser: false,
    },
  ];

  const latestCheckIn: WellbeingCheckIn = {
    id: 'c1',
    date: '2026-11-12',
    energyLevel: 4,
    sleepQuality: 4,
    stressSelfRating: 2,
    sleepHours: 7.5,
    movementMinutes: 35,
    restingHeartRateBpm: 62,
    systolicMmHg: 118,
    diastolicMmHg: 76,
    moodNote: 'Personal diary note should stay private',
  };

  const payload = buildMinimalAiPayload(
    findings,
    'What does Vitamin D mean?',
    latestCheckIn,
  );
  assert.equal(payload.confirmedFindings.length, 1);
  assert.equal(payload.confirmedFindings[0].testName, 'Vitamin D');
  assert.equal('notes' in payload.confirmedFindings[0], false);
  assert.equal(payload.latestWellbeingCheckIn?.sleepHours, 7.5);
  assert.equal(payload.latestWellbeingCheckIn?.movementMinutes, 35);
  assert.equal(payload.latestWellbeingCheckIn?.restingHeartRateBpm, 62);
  assert.equal(payload.latestWellbeingCheckIn?.systolicMmHg, 118);
  assert.equal(payload.latestWellbeingCheckIn?.diastolicMmHg, 76);
  assert.equal(
    'moodNote' in (payload.latestWellbeingCheckIn ?? {}),
    false,
  );
});

test('validateWellbeingCheckInInput enforces safe bounds and blood pressure pairing', () => {
  const validMinimal = validateWellbeingCheckInInput({
    energyLevel: 4,
    sleepQuality: 4,
    stressSelfRating: 2,
  });
  assert.equal(validMinimal.valid, true);

  const validFull = validateWellbeingCheckInInput({
    energyLevel: 4,
    sleepQuality: 4,
    stressSelfRating: 2,
    sleepHours: '7.5',
    movementMinutes: '35',
    restingHeartRateBpm: '62',
    systolicMmHg: '118',
    diastolicMmHg: '76',
    moodNote: 'Calm morning',
  });
  assert.equal(validFull.valid, true);
  assert.equal(validFull.normalized?.sleepHours, 7.5);
  assert.equal(validFull.normalized?.systolicMmHg, 118);

  const badHr = validateWellbeingCheckInInput({
    energyLevel: 4,
    sleepQuality: 4,
    stressSelfRating: 2,
    restingHeartRateBpm: '22',
  });
  assert.equal(badHr.valid, false);

  const partialBp = validateWellbeingCheckInInput({
    energyLevel: 4,
    sleepQuality: 4,
    stressSelfRating: 2,
    systolicMmHg: '120',
    diastolicMmHg: '',
  });
  assert.equal(partialBp.valid, false);

  const invertedBp = validateWellbeingCheckInInput({
    energyLevel: 4,
    sleepQuality: 4,
    stressSelfRating: 2,
    systolicMmHg: '100',
    diastolicMmHg: '120',
  });
  assert.equal(invertedBp.valid, false);
});

test('buildCautiousDietContext ignores unconfirmed items and avoids diagnostic claims', () => {
  const unconfirmedOnly: ExtractedFinding[] = [
    {
      id: 'u1',
      reportId: 'r1',
      category: 'lab',
      testName: 'LDL Cholesterol',
      result: '160',
      unit: 'mg/dL',
      reportDate: '2026-10-10',
      referenceRange: '< 100',
      rangeStatus: 'outside_range',
      uncertain: true,
      confirmedByUser: false,
    },
  ];
  const fallbackCtx = buildCautiousDietContext(unconfirmedOnly);
  assert.equal(fallbackCtx.recommendedPatternId, 'balanced');

  const confirmedVitD: ExtractedFinding[] = [
    {
      ...unconfirmedOnly[0],
      id: 'c1',
      testName: '25-Hydroxy Vitamin D',
      confirmedByUser: true,
      uncertain: false,
    },
  ];
  const vitDCtx = buildCautiousDietContext(confirmedVitD);
  assert.equal(vitDCtx.recommendedPatternId, 'vitamin_d_recovery');
  assert.equal(/disease|cure|diagnos/i.test(vitDCtx.note), false);
  assert.equal(DIET_PATTERN_GUIDES.length, 3);
});

test('filterResearchContent includes all 10 official HTTPS sources, top-5 bookmarks, and topic filtering', () => {
  assert.equal(TRUSTED_NUTRITION_SOURCES.length, 10);
  assert.ok(TRUSTED_NUTRITION_SOURCES.every((s) => s.url.startsWith('https://')));
  const topFive = TRUSTED_NUTRITION_SOURCES.filter((s) => s.isTopFive);
  assert.equal(topFive.length, 5);

  const all = filterResearchContent('all');
  assert.equal(all.rows.length, DAILY_RESEARCH_ROWS.length);
  assert.equal(all.sources.length, 10);

  const foodScience = filterResearchContent('food_science');
  assert.ok(foodScience.rows.length >= 2);
  assert.ok(foodScience.rows.every((r) => r.topicId === 'food_science'));
  assert.ok(foodScience.sources.some((s) => s.id === 'nih-ods'));
});

test('checkRateLimit enforces sliding window quota', () => {
  const bucket = { timestamps: [] };
  assert.equal(checkRateLimit(bucket, 1000, 2, 60000).allowed, true);
  assert.equal(checkRateLimit(bucket, 2000, 2, 60000).allowed, true);
  const third = checkRateLimit(bucket, 3000, 2, 60000);
  assert.equal(third.allowed, false);
  assert.ok(third.retryAfterSeconds > 0);
});
