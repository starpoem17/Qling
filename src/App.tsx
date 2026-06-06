import {
  useState,
  useEffect,
} from 'react';
import {
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
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
import { cn } from './lib/utils';
import { usePushRegistration } from './services/pushRegistration';
import {
  PRD_APP_TABS,
  routeAfterAuthProfileLoad,
  routeAfterAccountDeletion,
  routeAfterOnboardingComplete,
  routeAfterTutorialComplete,
  routeAfterProfileReadDenied,
  type AppRoute,
  type AppRouteViewState,
} from './services/appShell/prdNavigationPolicy';
import { routeRenderingBoundaryForRoute } from './services/appShell/routeRenderingBoundary';
import { shouldRenderFilterAlert } from './services/appShell/filterAlertPolicy';
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
import { TutorialContainer } from './screens/tutorial/TutorialContainer';
import {
  BottomNavigation,
  MobileAppShell,
  QlingAlertDialog,
  QlingDialog,
} from './screens/shared/ui';
import { LoadingShellScreen } from './screens/loadingShell/LoadingShellScreen';
import { ReportUserContainer } from './screens/report/ReportUserContainer';
import { LoginScreen } from './screens/loadingShell/LoginScreen';
import { ChatScreen } from './screens/chat/ChatScreen';
import { ChatListContainer } from './screens/chat/ChatListContainer';
import { ChatRoomContainer } from './screens/chat/ChatRoomContainer';
import { RankingContainer } from './screens/ranking/RankingContainer';
import { useTotalUnreadCount } from './services/chat/useTotalUnreadCount';

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
  tutorialCompletedAt?: unknown;
  exampleWorriesCreatedAt?: unknown;
  exampleWorrySeedIds?: string[];
  exampleDeliveryIds?: string[];
}

type AppUpdateHandler = () => void;

type AppUpdateEvent = CustomEvent<{
  readonly update: AppUpdateHandler;
}>;

type AppAlertEvent = CustomEvent<{
  readonly message: string;
}>;

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

function pwaRouteChromeForRoute(route: AppRoute): { readonly top: string; readonly bottom: string } | null {
  if (route === 'write_worry' || route === 'write_reply' || route === 'answer_check') {
    return { top: '#fff1d1', bottom: '#fff5eb' };
  }
  if (route === 'privacy_policy') {
    return { top: '#ff8b0d', bottom: '#fff5eb' };
  }
  if (route === 'edit_interests') {
    return { top: '#ff8b3d', bottom: '#fff7e3' };
  }
  if (route === '마이페이지' || route === 'my_page' || route === 'my_answers') {
    return { top: '#ff8b3d', bottom: '#fff5eb' };
  }
  return null;
}

async function refillWorryInboxForCurrentUser(user: FirebaseUser): Promise<{ refillDeliveryCount: number }> {
  const token = await user.getIdToken();
  const response = await fetch('/api/users/me/worry-inbox-refill', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({}),
  });
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.error?.message ?? 'Worry inbox refill failed.');
  }
  const body = await response.json();
  return {
    refillDeliveryCount: typeof body?.refillDeliveryCount === 'number' ? body.refillDeliveryCount : 0,
  };
}

function shouldFallbackToRedirectLogin(error: unknown): boolean {
  const code = typeof error === 'object' && error !== null && 'code' in error
    ? String((error as { code?: unknown }).code)
    : '';
  return code !== 'auth/popup-closed-by-user'
    && code !== 'auth/cancelled-popup-request';
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
  const [pendingAppUpdate, setPendingAppUpdate] = useState<AppUpdateHandler | null>(null);

  const totalChatUnreadCount = useTotalUnreadCount(user);

  const {
    notificationPermission,
    pushRegistrationStatus,
    pushDisabledForCurrentDevice,
    requestNotificationPermission,
    disablePushRegistrationForCurrentDevice,
    resetPushRegistrationOnSignOut,
  } = usePushRegistration({ user, loading });

  useEffect(() => {
    const handleAppAlert = (event: Event) => {
      const message = (event as AppAlertEvent).detail?.message;
      if (message) setFilterAlert(message);
    };
    const handleAppUpdateAvailable = (event: Event) => {
      const update = (event as AppUpdateEvent).detail?.update;
      if (typeof update === 'function') setPendingAppUpdate(() => update);
    };

    window.addEventListener('qling:app-alert', handleAppAlert);
    window.addEventListener('qling:app-update-available', handleAppUpdateAvailable);
    return () => {
      window.removeEventListener('qling:app-alert', handleAppAlert);
      window.removeEventListener('qling:app-update-available', handleAppUpdateAvailable);
    };
  }, []);

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
            setView(prev => routeAfterAuthProfileLoad(prev, {
              tutorialCompletedAt: userData.tutorialCompletedAt,
            }));
            void refillWorryInboxForCurrentUser(currentUser)
              .then(async result => {
                if (result.refillDeliveryCount <= 0 && !userData.exampleWorriesCreatedAt) {
                  await createExampleWorriesForCurrentUser(currentUser);
                }
                const refreshed = await getDoc(userRef);
                if (refreshed.exists()) setProfile(withAuthProfileUid(refreshed.data() as UserProfile, currentUser.uid));
              })
              .catch(async err => {
                console.error('Worry inbox refill failed:', err);
                if (!userData.exampleWorriesCreatedAt) {
                  await createExampleWorriesForCurrentUser(currentUser)
                    .then(async () => {
                      const refreshed = await getDoc(userRef);
                      if (refreshed.exists()) setProfile(withAuthProfileUid(refreshed.data() as UserProfile, currentUser.uid));
                    })
                    .catch(exampleError => {
                      console.error('Example worry retry failed:', exampleError);
                    });
                }
              });
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
      if (shouldFallbackToRedirectLogin(err)) {
        try {
          await signInWithRedirect(auth, googleProvider);
          return;
        } catch (redirectError) {
          console.error("Redirect Login Error", redirectError);
        }
      }
      setLoginError("구글 로그인에 실패했습니다. 브라우저에서 팝업 또는 리디렉션 로그인을 허용해 주세요.");
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
    const standalonePwaRouteChrome = pwaRouteChromeForRoute(currentRoute);
    if (!standalonePwaRouteChrome) return;
    if (!document.documentElement.classList.contains('qling-ios-standalone-pwa')) return;

    const themeMeta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
    const root = document.getElementById('root');
    const previousThemeColor = themeMeta?.getAttribute('content') ?? null;
    const previousHtmlBackground = document.documentElement.style.backgroundColor;
    const previousBodyBackground = document.body.style.backgroundColor;
    const previousRootBackground = root?.style.backgroundColor ?? null;

    themeMeta?.setAttribute('content', standalonePwaRouteChrome.top);
    document.documentElement.style.backgroundColor = standalonePwaRouteChrome.bottom;
    document.body.style.backgroundColor = standalonePwaRouteChrome.bottom;
    if (root) root.style.backgroundColor = standalonePwaRouteChrome.bottom;

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
          tabs={PRD_APP_TABS.map(tab => ({ 
            tab, 
            label: tab,
            unreadCount: tab === '채팅' ? totalChatUnreadCount : 0
          }))}
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
              : routeBoundary.mountsBottomNavigation ? 'pt-0' : 'pt-6',
            routeBoundary.mainScrollMode === 'document' && 'overflow-y-auto',
            currentRoute === '답변하기' || currentRoute === 'received_worries' || currentRoute === '나의 고민' || currentRoute === 'my_worries' || currentRoute === 'my_worry_detail' || currentRoute === 'answer_check' || currentRoute === '순위' || currentRoute === 'ranking' || currentRoute === 'privacy_policy' || currentRoute === '마이페이지' || currentRoute === 'my_page' || currentRoute === 'my_answers' || currentRoute === 'edit_interests' || currentRoute === '채팅' || currentRoute === 'chat' || currentRoute === 'chat_room' || currentRoute === 'report_user'
              ? 'overflow-hidden'
              : undefined,
            currentRoute === 'chat_room' ? 'px-0 pb-0 pt-0 bg-[#fff1d1]' : undefined,
            currentRoute === 'edit_interests' ? 'pt-0 pb-0' : undefined,
          ],
      )}
    >
      <QlingAlertDialog
        isOpen={shouldRenderFilterAlert(filterAlert)}
        title="확인이 필요해요"
        description={filterAlert ?? ''}
        accessibilityLabel="앱 알림 확인"
        onConfirm={() => setFilterAlert(null)}
      />
      <QlingDialog
        isOpen={Boolean(pendingAppUpdate)}
        title="새 버전이 있어요"
        description="지금 업데이트하면 최신 화면으로 다시 시작합니다."
        cancelLabel="나중에"
        confirmLabel="업데이트"
        onCancel={() => setPendingAppUpdate(null)}
        onConfirm={() => {
          const update = pendingAppUpdate;
          setPendingAppUpdate(null);
          update?.();
        }}
      />
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

          {currentRoute === 'tutorial' && (
            <motion.div key="tutorial" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full">
              <TutorialContainer
                user={user}
                onComplete={(completedAt) => {
                  setProfile(current => current ? { ...current, tutorialCompletedAt: completedAt } : current);
                  setView(routeAfterTutorialComplete());
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
                setFilterAlert={setFilterAlert}
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
            <motion.div
              key="my_page_account"
              initial={{ opacity: 0, y: currentRoute === 'edit_interests' ? 0 : 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: currentRoute === 'edit_interests' ? 0 : -20 }}
              className="min-h-full"
            >
              <MyPageContainer
                route={view}
                user={user}
                profile={profile}
                setView={setView}
                setFilterAlert={setFilterAlert}
                notificationPermission={notificationPermission}
                pushRegistrationStatus={pushRegistrationStatus}
                pushDisabledForCurrentDevice={pushDisabledForCurrentDevice}
                requestNotificationPermission={requestNotificationPermission}
                disablePushRegistrationForCurrentDevice={disablePushRegistrationForCurrentDevice}
                resetPushRegistrationOnSignOut={resetPushRegistrationOnSignOut}
                onAccountDeleted={handleAccountDeleted}
                onInterestsUpdated={interests => {
                  setProfile(current => current ? { ...current, interests: [...interests] } : current);
                }}
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
            <motion.div key="chat" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full">
              <ChatListContainer user={user} setView={setView} setFilterAlert={setFilterAlert} />
            </motion.div>
          )}

          {currentRoute === 'chat_room' && typeof view === 'object' && view.route === 'chat_room' && (
            <motion.div key="chat_room" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full">
              <ChatRoomContainer
                user={user}
                chatId={view.chatId}
                setView={setView}
                setFilterAlert={setFilterAlert}
              />
            </motion.div>
          )}

          {currentRoute === 'report_user' && typeof view === 'object' && view.route === 'report_user' && (
            <motion.div key="report_user" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="h-full">
              <ReportUserContainer
                user={user}
                targetUid={view.targetUid}
                targetNickname={view.targetNickname}
                chatId={view.chatId}
                onBack={() => setView(view.fromRoute || { route: 'chat_room', chatId: view.chatId })}
                onSuccess={() => setView(view.fromRoute || { route: 'chat_room', chatId: view.chatId })}
              />
            </motion.div>
          )}

          {(currentRoute === '순위' || currentRoute === 'ranking') && (
            <motion.div key="ranking" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full min-h-0">
              <RankingContainer user={user} onOpenMyPage={() => setView('마이페이지')} />
            </motion.div>
          )}

          {/* 6. Answer Check View */}
          {currentRoute === 'answer_check' && currentAnswerCheckRoute && (
            <motion.div key="answer_check" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="h-full min-h-0">
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
