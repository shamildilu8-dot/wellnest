export type ReportCategory = 'lab' | 'interpreted_genetic';

export type RangeStatus =
  | 'within_range'
  | 'outside_range'
  | 'needs_review'
  | 'interpreted_finding';

export interface ExtractedFinding {
  id: string;
  reportId: string;
  category: ReportCategory;
  testName: string;
  result: string;
  unit: string;
  reportDate: string;
  referenceRange: string;
  rangeStatus: RangeStatus;
  uncertain: boolean;
  uncertaintyReason?: string;
  confirmedByUser: boolean;
  notes?: string;
  // For professionally interpreted genetic reports only:
  geneOrMarker?: string;
  clinicalInterpretation?: string;
  isDemo?: boolean;
}

export interface ReportRecord {
  id: string;
  title: string;
  category: ReportCategory;
  reportDate: string;
  labOrProviderName: string;
  fileName: string;
  fileType: string;
  fileSizeBytes: number;
  storagePath?: string;
  uploadedAt: string;
  isDemo?: boolean;
  findings: ExtractedFinding[];
}

export interface WellbeingCheckIn {
  id: string;
  date: string;
  energyLevel: number; // 1-5 self-reported
  sleepQuality: number; // 1-5 self-reported
  stressSelfRating: number; // 1-5 self-reported
  sleepHours?: number; // 0-24 self-reported
  movementMinutes?: number; // 0-600 self-reported
  restingHeartRateBpm?: number; // 30-220 manual wearable/cuff reading
  systolicMmHg?: number; // 60-250 manual cuff reading
  diastolicMmHg?: number; // 40-150 manual cuff reading
  moodNote: string;
  isDemo?: boolean;
}

export interface ConsentPreferences {
  storeConfirmedReports: boolean;
  allowWellbeingCheckIns: boolean;
  requirePerRequestAiConsent: boolean;
  allowAiReportExtraction: boolean;
  updatedAt: string;
}

export interface AiChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  sharedFindingIds?: string[];
  providerLabel?: string;
}

export interface HealthApiStatus {
  ok: boolean;
  aiConfigured: boolean;
  aiDataControlsVerified: boolean;
  aiProvider: string;
  aiModel: string;
  supabaseConfigured: boolean;
}

export interface UserProfile {
  id: string;
  email: string;
  fullName?: string;
  mode: 'authenticated' | 'demo';
}

export type AppView =
  | 'landing'
  | 'auth'
  | 'dashboard'
  | 'upload'
  | 'insights'
  | 'research'
  | 'ai-guide'
  | 'privacy'
  | 'contact'
  | 'settings';

export type NutritionTopicId =
  | 'human_biology'
  | 'food_science'
  | 'fitness_nutrition'
  | 'disease_prevention'
  | 'advanced_research';

export interface ResearchSourceEntry {
  id: string;
  name: string;
  shortLabel: string;
  url: string;
  group: 'organization' | 'scientific_database';
  isTopFive: boolean;
  topFiveRank?: number;
  summary: string;
  highlights: string[];
  topics: NutritionTopicId[];
}

export interface DailyResearchRow {
  id: string;
  topicId: NutritionTopicId;
  topicTitle: string;
  dailyInformation: string;
  upcomingResearchFocus: string;
  evidenceStandard: string;
  sourceId: string;
  sourceName: string;
  sourceUrl: string;
}

