import type {
  ConsentPreferences,
  ReportRecord,
  WellbeingCheckIn,
} from '../types/wellnest';

export const DEMO_REPORTS: ReportRecord[] = [
  {
    id: 'demo-lab-1',
    title: 'Comprehensive Preventive Panel (Demo)',
    category: 'lab',
    reportDate: '2026-10-14',
    labOrProviderName: 'Horizon Clinical Diagnostics (Sample Lab)',
    fileName: 'sample-preventive-panel.pdf',
    fileType: 'application/pdf',
    fileSizeBytes: 248320,
    uploadedAt: '2026-10-14T09:15:00.000Z',
    isDemo: true,
    findings: [
      {
        id: 'demo-f-1',
        reportId: 'demo-lab-1',
        category: 'lab',
        testName: '25-Hydroxy Vitamin D',
        result: '24',
        unit: 'ng/mL',
        reportDate: '2026-10-14',
        referenceRange: '30 - 100',
        rangeStatus: 'outside_range',
        uncertain: false,
        confirmedByUser: true,
        isDemo: true,
      },
      {
        id: 'demo-f-2',
        reportId: 'demo-lab-1',
        category: 'lab',
        testName: 'Fasting Glucose',
        result: '91',
        unit: 'mg/dL',
        reportDate: '2026-10-14',
        referenceRange: '70 - 99',
        rangeStatus: 'within_range',
        uncertain: false,
        confirmedByUser: true,
        isDemo: true,
      },
      {
        id: 'demo-f-3',
        reportId: 'demo-lab-1',
        category: 'lab',
        testName: 'HbA1c',
        result: '5.3',
        unit: '%',
        reportDate: '2026-10-14',
        referenceRange: '4.0 - 5.6',
        rangeStatus: 'within_range',
        uncertain: false,
        confirmedByUser: true,
        isDemo: true,
      },
      {
        id: 'demo-f-4',
        reportId: 'demo-lab-1',
        category: 'lab',
        testName: 'LDL Cholesterol',
        result: '118',
        unit: 'mg/dL',
        reportDate: '2026-10-14',
        referenceRange: '< 100',
        rangeStatus: 'outside_range',
        uncertain: false,
        confirmedByUser: true,
        isDemo: true,
      },
      {
        id: 'demo-f-5',
        reportId: 'demo-lab-1',
        category: 'lab',
        testName: 'Ferritin',
        result: '42',
        unit: 'ng/mL',
        reportDate: '2026-10-14',
        referenceRange: '30 - 300',
        rangeStatus: 'needs_review',
        uncertain: true,
        uncertaintyReason:
          'Sample OCR flagged faint decimal spacing on scan. Please confirm result and range before including in insights.',
        confirmedByUser: false,
        isDemo: true,
      },
    ],
  },
  {
    id: 'demo-gen-1',
    title: 'Clinical Pharmacogenomics & Carrier Summary (Demo)',
    category: 'interpreted_genetic',
    reportDate: '2026-09-28',
    labOrProviderName: 'Clarity Genomics Clinical Lab (Sample Interpreted Report)',
    fileName: 'sample-interpreted-genetics.pdf',
    fileType: 'application/pdf',
    fileSizeBytes: 412900,
    uploadedAt: '2026-09-28T14:20:00.000Z',
    isDemo: true,
    findings: [
      {
        id: 'demo-g-1',
        reportId: 'demo-gen-1',
        category: 'interpreted_genetic',
        testName: 'CYP2C19 Drug Metabolism Profile',
        result: 'Intermediate Metabolizer (*1/*2)',
        unit: 'Clinical interpretation',
        reportDate: '2026-09-28',
        referenceRange: 'Reported by board-certified geneticist',
        rangeStatus: 'interpreted_finding',
        uncertain: false,
        confirmedByUser: true,
        geneOrMarker: 'CYP2C19',
        clinicalInterpretation:
          'Risk & medication-processing information: some medications metabolized via CYP2C19 may be processed more slowly. Never adjust prescriptions without your prescribing clinician or pharmacist.',
        isDemo: true,
      },
      {
        id: 'demo-g-2',
        reportId: 'demo-gen-1',
        category: 'interpreted_genetic',
        testName: 'APOE / Lipid Risk Context',
        result: 'Typical population risk (e3/e3)',
        unit: 'Clinical interpretation',
        reportDate: '2026-09-28',
        referenceRange: 'Reported by clinical genetics panel',
        rangeStatus: 'interpreted_finding',
        uncertain: false,
        confirmedByUser: true,
        geneOrMarker: 'APOE',
        clinicalInterpretation:
          'Risk context only—not a diagnosis. Lifestyle habits and standard lipid bloodwork remain primary drivers for cardiovascular wellness.',
        isDemo: true,
      },
    ],
  },
];

export const DEMO_CHECKINS: WellbeingCheckIn[] = [
  {
    id: 'demo-checkin-1',
    date: '2026-11-12',
    energyLevel: 4,
    sleepQuality: 4,
    stressSelfRating: 2,
    sleepHours: 7.5,
    movementMinutes: 35,
    restingHeartRateBpm: 62,
    moodNote: 'Steady energy after morning walk and earlier bedtime.',
    isDemo: true,
  },
  {
    id: 'demo-checkin-2',
    date: '2026-11-08',
    energyLevel: 3,
    sleepQuality: 3,
    stressSelfRating: 3,
    sleepHours: 6.5,
    movementMinutes: 20,
    moodNote: 'Slightly tired mid-week; focused on hydration.',
    isDemo: true,
  },
];

export const DEFAULT_CONSENT_PREFERENCES: ConsentPreferences = {
  storeConfirmedReports: true,
  allowWellbeingCheckIns: true,
  requirePerRequestAiConsent: true,
  allowAiReportExtraction: false,
  updatedAt: '2026-11-13T00:00:00.000Z',
};

export const SAMPLE_LAB_PASTE_TEXT = `TSH: 2.15 mIU/L (Ref: 0.40 - 4.50)
Vitamin B12: 390 pg/mL (Ref: 200 - 900)
HDL Cholesterol: 56 mg/dL (Ref: > 40)
Triglycerides: 162 mg/dL (Ref: < 150)
Iron: 88 (Ref: 60 - 170)`;

export const SAMPLE_INTERPRETED_GENETIC_JSON = JSON.stringify(
  {
    findings: [
      {
        testName: 'SLCO1B1 Statin Transport Context',
        result: 'Decreased Function (*1/*5)',
        unit: 'Clinical interpretation',
        referenceRange: 'Interpreted by clinical geneticist',
        geneOrMarker: 'SLCO1B1',
        clinicalInterpretation:
          'Pharmacogenomic risk information indicating potential sensitivity to certain lipid-lowering medications. Share with your clinician before starting or changing therapy.',
      },
    ],
  },
  null,
  2,
);

export const OWNER_CONTACT = {
  name: 'DR. MUHAMMAD SHAMIL',
  phone: '8075235897',
  email: 'Shamildilu8@gmail.com',
};
