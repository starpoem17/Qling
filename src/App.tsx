import {
  useState,
  useEffect,
} from 'react';
import {
  onAuthStateChanged,
  signInWithPopup,
  User as FirebaseUser,
} from 'firebase/auth';
import {
  serverTimestamp,
  doc,
  updateDoc,
  getDoc,
} from 'firebase/firestore';
import { onMessage } from 'firebase/messaging';
import { auth, db, firebaseRuntimeConfig, googleProvider, isDevRuntime, messaging } from './firebase';
import { motion, AnimatePresence } from 'motion/react';
import {
  XCircle,
} from 'lucide-react';
import { cn } from './lib/utils';
import { usePushRegistration } from './services/pushRegistration';
import {
  PRD_APP_TABS,
  routeAfterAuthProfileLoad,
  routeAfterAccountDeletion,
  routeAfterOnboardingComplete,
  routeAfterProfileReadDenied,
  type AppRouteViewState,
} from './services/appShell/prdNavigationPolicy';
import { routeRenderingBoundaryForRoute } from './services/appShell/routeRenderingBoundary';
import { withAuthProfileUid } from './services/authProfile/profileIdentity';
import {
  ReceivedWorriesContainer,
  type SelectedReceivedWorry,
} from './screens/receivedWorries/ReceivedWorriesContainer';
import { WriteWorryContainer } from './screens/writeForm/WriteWorryContainer';
import { WriteWorrySuccessContainer } from './screens/writeForm/WriteWorrySuccessContainer';
import { WriteReplyContainer } from './screens/writeForm/WriteReplyContainer';
import { WriteReplySuccessContainer } from './screens/writeForm/WriteReplySuccessContainer';
import { MyPageContainer } from './screens/myPage/MyPageContainer';
import { MyAnswersContainer } from './screens/myPage/MyAnswersContainer';
import {
  MyWorriesContainer,
  type SelectedMyReply,
  type SelectedMyWorry,
} from './screens/myPage/MyWorriesContainer';
import { AnswerCheckContainer } from './screens/answerCheck/AnswerCheckContainer';
import { OnboardingContainer } from './screens/onboarding/OnboardingContainer';
import {
  BottomNavigation,
  MobileAppShell,
} from './screens/shared/ui';
import { LoadingShellScreen } from './screens/loadingShell/LoadingShellScreen';
import { LoginScreen } from './screens/loadingShell/LoginScreen';
import { ChatScreen } from './screens/chat/ChatScreen';
import { RankingContainer } from './screens/ranking/RankingContainer';

// --- Types ---
interface UserProfile {
  uid: string;
  nickname?: string;
  normalizedNickname?: string;
  gender: string;
  age?: number;
  interests: string[];
  profileColor?: string;
  helpedCount?: number;
  createdAt?: unknown;
  onboardingCompletedAt?: unknown;
  exampleWorriesCreatedAt?: unknown;
  exampleWorrySeedIds?: string[];
  exampleDeliveryIds?: string[];
}

async function createExampleWorriesForCurrentUser(user: FirebaseUser) {
  const token = await user.getIdToken();
  const response = await fetch('/api/users/me/example-worries', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({}),
  });
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.error?.message ?? 'Example worry creation failed.');
  }
  return response.json();
}

// --- App Component ---
export default function App() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [view, setView] = useState<AppRouteViewState>('login');
  
  const [selectedWorry, setSelectedWorry] = useState<SelectedReceivedWorry | null>(null);
  const [answeredDeliveryIds, setAnsweredDeliveryIds] = useState<Set<string>>(() => new Set());
  const [selectedMyWorry, setSelectedMyWorry] = useState<SelectedMyWorry | null>(null);
  const [selectedReply, setSelectedReply] = useState<SelectedMyReply | null>(null);
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  const {
    notificationPermission,
    pushRegistrationStatus,
    requestNotificationPermission,
    resetPushRegistrationOnSignOut,
  } = usePushRegistration({ user, loading });

  // Auth & Profile Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      try {
        setLoading(true);
        if (currentUser) {
          try {
            await currentUser.getIdToken();
            if (isDevRuntime) {
              console.info('[Firebase diagnostics] auth ready', {
                projectId: firebaseRuntimeConfig.projectId,
                firestoreDatabaseId: firebaseRuntimeConfig.firestoreDatabaseId,
                authCurrentUserUid: auth.currentUser?.uid ?? null,
                callbackUid: currentUser.uid,
                getIdTokenSucceeded: true,
              });
            }
          } catch (tokenError) {
            const firebaseError = tokenError as { code?: unknown; message?: unknown };
            console.error('[Firebase diagnostics] getIdToken failed', {
              projectId: firebaseRuntimeConfig.projectId,
              firestoreDatabaseId: firebaseRuntimeConfig.firestoreDatabaseId,
              authCurrentUserUid: auth.currentUser?.uid ?? null,
              callbackUid: currentUser.uid,
              code: typeof firebaseError.code === 'string' ? firebaseError.code : 'unknown',
              message: typeof firebaseError.message === 'string' ? firebaseError.message : String(tokenError),
              error: tokenError,
            });
            throw tokenError;
          }
          setUser(currentUser);
          
          const userRef = doc(db, 'users', currentUser.uid);
          let userSnap;
          try {
            userSnap = await getDoc(userRef);
          } catch (profileReadError) {
            console.error('Profile read failed after auth sign-in:', profileReadError);
            setProfile(null);
            setView(routeAfterProfileReadDenied());
            return;
          }
          
          if (userSnap.exists()) {
            const userData = userSnap.data() as UserProfile;
            setProfile(withAuthProfileUid(userData, currentUser.uid));
            setView(prev => routeAfterAuthProfileLoad(prev));
            if (!userData.exampleWorriesCreatedAt) {
              void createExampleWorriesForCurrentUser(currentUser)
                .then(async () => {
                  const refreshed = await getDoc(userRef);
                  if (refreshed.exists()) setProfile(withAuthProfileUid(refreshed.data() as UserProfile, currentUser.uid));
                })
                .catch(err => {
                  console.error('Example worry retry failed:', err);
                });
            }
          } else {
            setProfile(null);
            setView('onboarding');
          }
        } else {
          if (isDevRuntime) {
            console.info('[Firebase diagnostics] auth signed out', {
              projectId: firebaseRuntimeConfig.projectId,
              firestoreDatabaseId: firebaseRuntimeConfig.firestoreDatabaseId,
              authCurrentUserUid: auth.currentUser?.uid ?? null,
              getIdTokenSucceeded: false,
            });
          }
          setUser(null);
          setProfile(null);
          setAnsweredDeliveryIds(new Set());
          setView('login');
          void resetPushRegistrationOnSignOut();
        }
      } catch (err) {
        console.error("Auth State Error", err);
      } finally {
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, [resetPushRegistrationOnSignOut]);


  // Foreground Message Listener
  useEffect(() => {
    if (!messaging || !user) return;
    const unsubMessaging = onMessage(messaging, (payload) => {
      console.log("Foreground Message received:", payload);
      if (Notification.permission === 'granted') {
        new Notification(payload.notification?.title || "Qling", {
          body: payload.notification?.body,
          icon: '/pwa-192x192.png'
        });
      }
    });
    return () => unsubMessaging();
  }, [user]);

  const handleGoogleLogin = async () => {
    setIsProcessing(true);
    setLoginError(null);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      console.error("Login Error", err);
      setLoginError("구글 로그인에 실패했습니다.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAccountDeleted = () => {
    setUser(null);
    setProfile(null);
    setSelectedWorry(null);
    setAnsweredDeliveryIds(new Set());
    setSelectedMyWorry(null);
    setSelectedReply(null);
    setLoginError(null);
    setFilterAlert(null);
    setView(routeAfterAccountDeletion());
    window.scrollTo(0, 0);
  };

  // Presence Updater
  useEffect(() => {
    if (!profile) return;
    const updatePresence = async () => {
      try {
        await updateDoc(doc(db, 'users', profile.uid), {
          lastActive: serverTimestamp()
        });
      } catch (e) {
        console.error("Presence update failed", e);
      }
    };
    const interval = setInterval(updatePresence, 60000);
    return () => clearInterval(interval);
  }, [profile]);

  const [filterAlert, setFilterAlert] = useState<string | null>(null);

  const routeBoundary = routeRenderingBoundaryForRoute(view);
  const currentRoute = routeBoundary.currentRoute;
  const currentWriteReplyRoute = typeof view === 'object' && view.route === 'write_reply' ? view : null;
  const currentWriteReplySuccessRoute = typeof view === 'object' && view.route === 'write_reply_success' ? view : null;
  const currentAnswerCheckRoute = typeof view === 'object' && view.route === 'answer_check' ? view : null;

  useEffect(() => {
    if (currentRoute !== 'write_worry' && currentRoute !== 'write_reply') return;

    const themeMeta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
    const root = document.getElementById('root');
    const previousThemeColor = themeMeta?.getAttribute('content') ?? null;
    const previousHtmlBackground = document.documentElement.style.backgroundColor;
    const previousBodyBackground = document.body.style.backgroundColor;
    const previousRootBackground = root?.style.backgroundColor ?? null;

    themeMeta?.setAttribute('content', '#fff1d1');
    document.documentElement.style.backgroundColor = '#fff1d1';
    document.body.style.backgroundColor = '#fff1d1';
    if (root) root.style.backgroundColor = '#fff1d1';

    return () => {
      if (themeMeta && previousThemeColor !== null) themeMeta.setAttribute('content', previousThemeColor);
      document.documentElement.style.backgroundColor = previousHtmlBackground;
      document.body.style.backgroundColor = previousBodyBackground;
      if (root && previousRootBackground !== null) root.style.backgroundColor = previousRootBackground;
    };
  }, [currentRoute]);

  if (loading) {
    return (
      <LoadingShellScreen
        reason="session-loading"
        accessibleLabel="로그인 상태 확인 중"
      />
    );
  }

  if (currentRoute === 'login') {
    return (
      <LoginScreen
        sessionState={isProcessing ? 'signing-in' : loginError ? 'failed' : 'signed-out'}
        errorMessage={loginError ?? undefined}
        isProcessing={isProcessing}
        disabled={false}
        onSignIn={handleGoogleLogin}
      />
    );
  }

  return (
    <MobileAppShell
      bottomNavigation={routeBoundary.mountsBottomNavigation && (
        <BottomNavigation
          tabs={PRD_APP_TABS.map(tab => ({ tab, label: tab }))}
          activeTab={routeBoundary.authenticatedTab}
          onSelectTab={(tab) => setView(tab)}
        />
      )}
      hasBottomNavigation={routeBoundary.mountsBottomNavigation}
      mainClassName={cn(
        currentRoute === 'write_worry' || currentRoute === 'write_reply'
          ? 'qling-write-form-main'
          : [
            routeBoundary.routeGroup === 'onboarding flow'
              ? 'px-0 pt-0 pb-0 overflow-hidden bg-[#ff8b0d]'
              : 'pt-6',
            routeBoundary.mainScrollMode === 'document' && 'overflow-y-auto',
            currentRoute === '순위' || currentRoute === 'ranking' || currentRoute === 'privacy_policy' || currentRoute === '마이페이지' || currentRoute === 'my_page' || currentRoute === 'edit_interests'
              ? 'overflow-hidden'
              : undefined,
            currentRoute === 'edit_interests' ? 'pb-0' : undefined,
          ],
      )}
    >
      <AnimatePresence>
        {filterAlert && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm px-4"
          >
            <motion.div 
              initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              className="bg-white rounded-2xl p-6 shadow-2xl max-w-sm w-full text-center space-y-6"
            >
              <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mx-auto text-red-500">
                <XCircle className="w-6 h-6" />
              </div>
              <p className="font-bold text-lg text-gray-800">{filterAlert}</p>
              <button 
                onClick={() => setFilterAlert(null)}
                className="w-full py-3 bg-[#5A5A40] text-white rounded-xl font-bold transition-all hover:bg-[#4A4A30]"
              >
                확인
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence mode="wait">
          
          {/* 1. Onboarding View */}
          {currentRoute === 'onboarding' && (
            <motion.div key="onboarding" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full">
              <OnboardingContainer
                user={user}
                isProcessing={isProcessing}
                setIsProcessing={setIsProcessing}
                onComplete={(completedProfile) => {
                  setProfile(withAuthProfileUid(completedProfile as UserProfile, user?.uid ?? ''));
                  setView(routeAfterOnboardingComplete());
                  window.scrollTo(0, 0);
                }}
                onError={message => setFilterAlert(message)}
              />
            </motion.div>
          )}

          {currentRoute === 'my_answers' && (
            <motion.div key="my_answers" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-6">
              <MyAnswersContainer
                user={user}
                setView={setView}
              />
            </motion.div>
          )}

          {(
            currentRoute === '마이페이지'
            || currentRoute === 'my_page'
            || currentRoute === 'edit_interests'
            || currentRoute === 'privacy_policy'
            || currentRoute === 'logout_confirmation'
            || currentRoute === 'account_deletion_confirmation'
          ) && (
            <motion.div key="my_page_account" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="min-h-full">
              <MyPageContainer
                route={view}
                user={user}
                profile={profile}
                setView={setView}
                setFilterAlert={setFilterAlert}
                notificationPermission={notificationPermission}
                pushRegistrationStatus={pushRegistrationStatus}
                requestNotificationPermission={requestNotificationPermission}
                resetPushRegistrationOnSignOut={resetPushRegistrationOnSignOut}
                onAccountDeleted={handleAccountDeleted}
              />
            </motion.div>
          )}

          {/* 2. Answer View (Feed) */}
          {(currentRoute === '답변하기' || currentRoute === 'received_worries') && (
            <motion.div key="answer" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-8">
              <ReceivedWorriesContainer
                user={user}
                profile={profile}
                setView={setView}
                selectedWorry={selectedWorry}
                setSelectedWorry={setSelectedWorry}
                setFilterAlert={setFilterAlert}
                answeredDeliveryIds={answeredDeliveryIds}
              />
            </motion.div>
          )}

          {/* 3. Write Worry View */}
          {currentRoute === 'write_worry' && (
            <motion.div key="write_worry" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              <WriteWorryContainer
                user={user}
                profile={profile}
                setView={setView}
                clearSelectedMyWorry={() => setSelectedMyWorry(null)}
                setFilterAlert={setFilterAlert}
              />
            </motion.div>
          )}

          {currentRoute === 'write_worry_success' && (
            <motion.div key="write_worry_success" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <WriteWorrySuccessContainer setView={setView} />
            </motion.div>
          )}

          {/* 4. Write Reply View */}
          {currentRoute === 'write_reply' && currentWriteReplyRoute && selectedWorry?.deliveryId === currentWriteReplyRoute.deliveryId && selectedWorry.worryId === currentWriteReplyRoute.worryId && (
            <motion.div key="write_reply" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              <WriteReplyContainer
                user={user}
                selectedWorry={selectedWorry}
                setView={setView}
                clearSelectedWorry={() => setSelectedWorry(null)}
                clearSelectedReply={() => setSelectedReply(null)}
                setFilterAlert={setFilterAlert}
              />
            </motion.div>
          )}

          {currentRoute === 'write_reply_success' && (
            <motion.div key="write_reply_success" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <WriteReplySuccessContainer
                deliveryId={currentWriteReplySuccessRoute?.deliveryId}
                setView={setView}
                onConfirmAnsweredDelivery={deliveryId => {
                  setAnsweredDeliveryIds(prev => new Set(prev).add(deliveryId));
                }}
              />
            </motion.div>
          )}

          {/* 5. My Worries View */}
          {(currentRoute === '나의 고민' || currentRoute === 'my_worries' || currentRoute === 'my_worry_detail') && (
            <motion.div key="my_worries" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
              <MyWorriesContainer
                user={user}
                setSelectedMyWorry={setSelectedMyWorry}
                setView={setView}
              />
            </motion.div>
          )}

          {(currentRoute === '채팅' || currentRoute === 'chat') && (
            <motion.div key="chat" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <ChatScreen />
            </motion.div>
          )}

          {(currentRoute === '순위' || currentRoute === 'ranking') && (
            <motion.div key="ranking" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <RankingContainer user={user} onOpenMyPage={() => setView('마이페이지')} />
            </motion.div>
          )}

          {/* 6. Answer Check View */}
          {currentRoute === 'answer_check' && currentAnswerCheckRoute && (
            <motion.div key="answer_check" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-6">
              <AnswerCheckContainer
                user={user}
                route={currentAnswerCheckRoute}
                setView={setView}
                setFilterAlert={setFilterAlert}
              />
            </motion.div>
          )}

      </AnimatePresence>
    </MobileAppShell>
  );
}
