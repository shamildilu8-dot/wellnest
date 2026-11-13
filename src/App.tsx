import { useEffect, useState } from 'react';
import {
  DEFAULT_CONSENT_PREFERENCES,
  DEMO_CHECKINS,
  DEMO_REPORTS,
} from './data/demoData';
import { getSupabaseClient, isSupabaseConfigured } from './lib/supabase';
import type {
  AppView,
  ConsentPreferences,
  HealthApiStatus,
  ReportRecord,
  UserProfile,
  WellbeingCheckIn,
} from './types/wellnest';
import { AiGuideView } from './components/AiGuideView';
import { AuthView } from './components/AuthView';
import { ContactView } from './components/ContactView';
import { DashboardView } from './components/DashboardView';
import { Footer } from './components/Footer';
import { InsightsView } from './components/InsightsView';
import { LandingView } from './components/LandingView';
import { Navbar } from './components/Navbar';
import { NutritionResearchHub } from './components/NutritionResearchHub';
import { FrontPageCurtain } from './components/FrontPageCurtain';
import { PrivacyView } from './components/PrivacyView';
import { SettingsView } from './components/SettingsView';
import { UploadView } from './components/UploadView';

const STORAGE_KEY_REPORTS = 'wellnest_reports_v1';
const STORAGE_KEY_CHECKINS = 'wellnest_checkins_v1';
const STORAGE_KEY_CONSENTS = 'wellnest_consents_v1';

export default function App() {
  const [showFrontPage, setShowFrontPage] = useState(() => {
    if (typeof window === 'undefined') return false;
    const params = new URLSearchParams(window.location.search);
    return params.get('autostart') !== '1';
  });

  const [currentView, setCurrentView] = useState<AppView>(() => {
    if (typeof window === 'undefined') return 'landing';
    const params = new URLSearchParams(window.location.search);
    return params.get('autostart') === '1' ? 'dashboard' : 'landing';
  });

  const [user, setUser] = useState<UserProfile | null>(() => {
    if (typeof window === 'undefined') return null;
    const params = new URLSearchParams(window.location.search);
    if (params.get('autostart') === '1') {
      return { id: 'demo-user', email: 'demo@wellnest.local', mode: 'demo' };
    }
    return null;
  });

  const [apiStatus, setApiStatus] = useState<HealthApiStatus | null>(null);

  const [reports, setReports] = useState<ReportRecord[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_REPORTS);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore storage errors
    }
    return DEMO_REPORTS;
  });

  const [checkIns, setCheckIns] = useState<WellbeingCheckIn[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CHECKINS);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return DEMO_CHECKINS;
  });

  const [consents, setConsents] = useState<ConsentPreferences>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CONSENTS);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return DEFAULT_CONSENT_PREFERENCES;
  });

  useEffect(() => {
    fetch('/api/health')
      .then((res) => res.json())
      .then((data: HealthApiStatus) => setApiStatus(data))
      .catch(() => {
        setApiStatus({
          ok: false,
          aiConfigured: false,
          aiDataControlsVerified: false,
          aiProvider: 'Google Gemini API (server-side)',
          aiModel: 'gemini-4-hydrogen',
          supabaseConfigured: isSupabaseConfigured,
        });
      });
  }, []);

  useEffect(() => {
    const sb = getSupabaseClient();
    if (!sb) return;

    sb.auth.getSession().then(({ data }) => {
      const sessionUser = data.session?.user;
      if (sessionUser) {
        setUser({
          id: sessionUser.id,
          email: sessionUser.email ?? 'account@wellnest',
          fullName: sessionUser.user_metadata?.full_name as string | undefined,
          mode: 'authenticated',
        });
      }
    });

    const { data: listener } = sb.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email ?? 'account@wellnest',
          fullName: session.user.user_metadata?.full_name as string | undefined,
          mode: 'authenticated',
        });
      }
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!consents.storeConfirmedReports) return;
    try {
      localStorage.setItem(STORAGE_KEY_REPORTS, JSON.stringify(reports));
    } catch {
      // ignore
    }
  }, [reports, consents.storeConfirmedReports]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_CHECKINS, JSON.stringify(checkIns));
    } catch {
      // ignore
    }
  }, [checkIns]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_CONSENTS, JSON.stringify(consents));
    } catch {
      // ignore
    }
  }, [consents]);

  const handleEnterDemo = () => {
    setUser({
      id: 'demo-user',
      email: 'demo@wellnest.local',
      mode: 'demo',
    });
    setCurrentView('dashboard');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAuthenticated = (profile: UserProfile) => {
    setUser(profile);
    setCurrentView('dashboard');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavigate = (view: AppView) => {
    const protectedViews: AppView[] = [
      'dashboard',
      'upload',
      'insights',
      'ai-guide',
      'settings',
    ];
    if (protectedViews.includes(view) && !user) {
      // Require authenticated account or explicit Demo entry before personal records
      setCurrentView('auth');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    setCurrentView(view);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSaveReport = (newReport: ReportRecord) => {
    setReports((prev) => [newReport, ...prev]);
  };

  const handleConfirmFinding = (reportId: string, findingId: string) => {
    setReports((prev) =>
      prev.map((rep) => {
        if (rep.id !== reportId) return rep;
        return {
          ...rep,
          findings: rep.findings.map((f) =>
            f.id === findingId
              ? { ...f, confirmedByUser: true, uncertain: false }
              : f,
          ),
        };
      }),
    );
  };

  const handleAddCheckIn = (entry: WellbeingCheckIn) => {
    setCheckIns((prev) => [entry, ...prev]);
  };

  const handleDeleteAllData = () => {
    setReports([]);
    setCheckIns([]);
    try {
      localStorage.removeItem(STORAGE_KEY_REPORTS);
      localStorage.removeItem(STORAGE_KEY_CHECKINS);
    } catch {
      // ignore
    }
  };

  const handleResetDemoData = () => {
    setReports(DEMO_REPORTS);
    setCheckIns(DEMO_CHECKINS);
  };

  const handleSignOut = () => {
    setUser(null);
    setCurrentView('landing');
  };

  return (
    <div className="relative min-h-screen flex flex-col wn-ambient-bg text-[#F4F7F5] overflow-x-hidden">
      {/* Sculptural optical shapes behind frosted glass panes */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
      >
        <div
          className="wn-orb-float-a absolute -top-28 -left-24 w-[420px] h-[420px] rounded-full opacity-55 blur-md"
          style={{
            background:
              'radial-gradient(circle at 35% 35%, rgba(167, 243, 208, 0.35), rgba(22, 101, 74, 0.55) 55%, rgba(8, 22, 17, 0.1) 80%)',
          }}
        />
        <div
          className="wn-orb-float-b absolute top-[18%] right-[-90px] w-[360px] h-[360px] rounded-full opacity-50 blur-sm border-[36px] border-[#E87A3D]/25"
          style={{
            background:
              'radial-gradient(circle at 30% 30%, rgba(255, 220, 195, 0.22), rgba(232, 122, 61, 0.12) 60%, transparent 78%)',
          }}
        />
        <div
          className="wn-orb-float-a absolute top-[52%] left-[12%] w-[280px] h-[280px] rounded-full opacity-45 blur-md"
          style={{
            background:
              'radial-gradient(circle at 40% 30%, rgba(214, 235, 226, 0.28), rgba(34, 92, 68, 0.42) 55%, transparent 78%)',
          }}
        />
        <div
          className="wn-orb-float-b absolute -bottom-24 right-[14%] w-[440px] h-[440px] rounded-full opacity-45 blur-md border-[44px] border-[#34D399]/18"
          style={{
            background:
              'radial-gradient(circle at 35% 35%, rgba(232, 122, 61, 0.22), rgba(16, 48, 36, 0.35) 60%, transparent 80%)',
          }}
        />
      </div>

      {showFrontPage && (
        <FrontPageCurtain onOpen={() => setShowFrontPage(false)} />
      )}

      <Navbar currentView={currentView} user={user} onNavigate={handleNavigate} />

      <main className="relative z-10 flex-1">
        {currentView === 'landing' && (
          <LandingView onEnterDemo={handleEnterDemo} onNavigate={handleNavigate} />
        )}

        {currentView === 'auth' && (
          <AuthView
            onAuthenticated={handleAuthenticated}
            onEnterDemo={handleEnterDemo}
          />
        )}

        {currentView === 'dashboard' && user && (
          <DashboardView
            user={user}
            reports={reports}
            checkIns={checkIns}
            allowWellbeingCheckIns={consents.allowWellbeingCheckIns}
            onAddCheckIn={handleAddCheckIn}
            onNavigate={handleNavigate}
          />
        )}

        {currentView === 'upload' && user && (
          <UploadView
            user={user}
            apiStatus={apiStatus}
            consents={consents}
            onSaveReport={handleSaveReport}
            onNavigateToInsights={() => handleNavigate('insights')}
          />
        )}

        {currentView === 'insights' && user && (
          <InsightsView
            reports={reports}
            onConfirmFinding={handleConfirmFinding}
            onNavigate={handleNavigate}
          />
        )}

        {currentView === 'ai-guide' && user && (
          <AiGuideView
            reports={reports}
            checkIns={checkIns}
            apiStatus={apiStatus}
            consents={consents}
          />
        )}

        {currentView === 'privacy' && <PrivacyView />}

        {currentView === 'research' && <NutritionResearchHub />}

        {currentView === 'contact' && <ContactView />}

        {currentView === 'settings' && user && (
          <SettingsView
            user={user}
            reports={reports}
            checkIns={checkIns}
            consents={consents}
            onUpdateConsents={setConsents}
            onDeleteAllData={handleDeleteAllData}
            onResetDemoData={handleResetDemoData}
            onSignOut={handleSignOut}
          />
        )}
      </main>

      <Footer onNavigate={handleNavigate} />
    </div>
  );
}
