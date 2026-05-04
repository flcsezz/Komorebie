import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Eager load LandingPage for fast initial render if it's the first visit
import LandingPage from './pages/LandingPage';

// Eager load core app components to diagnose loading issues
import AppLayout from './components/layout/AppLayout';
import TaskCapture from './pages/TaskCapture';

// Lazy load non-critical components
const FocusSession = lazy(() => import('./pages/FocusSession'));
const FlowAnalytics = lazy(() => import('./pages/FlowAnalytics'));
const ZenEnvironment = lazy(() => import('./components/three/ZenEnvironment'));
const SchedulePage = lazy(() => import('./pages/SchedulePage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const FlashcardLibrary = lazy(() => import('./pages/FlashcardLibrary'));
const FlashcardDeckPage = lazy(() => import('./pages/FlashcardDeck'));
const FriendsPage = lazy(() => import('./pages/FriendsPage'));
const FriendProfilePage = lazy(() => import('./pages/FriendProfilePage'));
const BackgroundPage = lazy(() => import('./pages/BackgroundPage'));
const LeaderboardPage = lazy(() => import('./pages/LeaderboardPage'));

// Placeholders
import { TasksPage, NotesPage, RoomPage, SocialPage, PlaceholderPage } from './pages/Placeholders';

import ZenLoader from './components/ui/ZenLoader';
import InitialLoader from './components/ui/InitialLoader';
import ErrorBoundary from './components/ErrorBoundary';
import { ZenClockProvider } from './context/ZenClockContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SoundscapeProvider } from './context/SoundscapeContext';
import { BackgroundProvider } from './context/BackgroundContext';
import AuthGateway from './pages/AuthGateway';

// Global loading fallback
const PageLoader = () => <ZenLoader fullscreen />;

// Protected Route Wrapper
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  
  if (loading) return <PageLoader />;
  if (!user) return <Navigate to="/gateway" replace />;
  
  return <>{children}</>;
};

// App Root Layout that includes the 3D Zen Environment
const AppRoot = ({ children }: { children: React.ReactNode }) => (
  <>
    <Suspense fallback={null}>
      <ZenEnvironment />
    </Suspense>
    {children}
  </>
);

// Root route handler to determine where to drop the user
const RootHandler = () => {
  const { user, loading } = useAuth();
  const hasVisited = localStorage.getItem('hasVisitedKomorebie') === 'true';
  
  if (loading) return <PageLoader />;
  if (user) return <Navigate to="/app" replace />;
  if (hasVisited) return <Navigate to="/gateway" replace />;
  
  return <LandingPage />;
};

function App() {
  return (
    <div className="relative text-white font-sans selection:bg-sage-200/30 min-h-screen bg-slate-950">
      {/* Premium initial loading animation */}
      <InitialLoader minDuration={1300} />
      
      <Suspense fallback={null}>
        <ErrorBoundary>
        <AuthProvider>
          <ZenClockProvider>
            <BackgroundProvider>
              <SoundscapeProvider>
                <Routes>
                {/* Landing Page with visit check */}
                <Route path="/" element={<RootHandler />} />
                
                {/* Auth Gateway */}
                <Route path="/gateway" element={<AppRoot><AuthGateway /></AppRoot>} />
                
                {/* Main App (Sanctuary Mode) */}
                <Route path="/app" element={<ProtectedRoute><AppRoot><AppLayout /></AppRoot></ProtectedRoute>}>
                  <Route index element={<TaskCapture />} />
                  <Route path="tasks" element={<TasksPage />} />
                  <Route path="notes" element={<NotesPage />} />
                  <Route path="flashcards" element={<FlashcardLibrary />} />
                  <Route path="flashcards/:deckId" element={<FlashcardDeckPage />} />
                  <Route path="analytics" element={<FlowAnalytics />} />
                  <Route path="room" element={<RoomPage />} />
                  <Route path="social" element={<SocialPage />} />
                  <Route path="calendar" element={<SchedulePage />} />
                  <Route path="profile" element={<ProfilePage />} />
                  <Route path="customize" element={<PlaceholderPage title="Customize" description="Personalize your sanctuary's visual and interactive experience." />} />
                  <Route path="music" element={<PlaceholderPage title="Music" description="Manage your lo-fi beats and ambient soundscapes." />} />
                  <Route path="background" element={<BackgroundPage />} />
                  <Route path="leaderboard" element={<LeaderboardPage />} />
                  <Route path="friends" element={<FriendsPage />} />
                  <Route path="friends/:username" element={<FriendProfilePage />} />
                  <Route path="contact" element={<PlaceholderPage title="Contact Us" description="Get in touch with the Komorebie support team." />} />
                  <Route path="settings" element={<PlaceholderPage title="Settings" description="Manage your account, focus defaults, and sanctuary preferences." />} />
                </Route>
                
                {/* Focus Mode Flow */}
                <Route path="/app/focus">
                  <Route index element={<Navigate to="/app" replace />} /> {/* Focus setup is currently part of Sanctuary/Dashboard */}
                  <Route path="session" element={<ProtectedRoute><AppRoot><FocusSession /></AppRoot></ProtectedRoute>} />
                </Route>
                
                {/* Fallback for unknown routes inside /app, or redirect back to app/landing */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </SoundscapeProvider>
          </BackgroundProvider>
        </ZenClockProvider>
      </AuthProvider>
        </ErrorBoundary>
      </Suspense>
    </div>
  );
}


export default App;
