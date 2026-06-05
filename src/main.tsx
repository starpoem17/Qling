import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { registerSW } from 'virtual:pwa-register';

// Register service worker and log status
const updateSW = registerSW({
  onNeedRefresh() {
    window.dispatchEvent(new CustomEvent('qling:app-update-available', {
      detail: {
        update: () => updateSW(true),
      },
    }));
  },
  onOfflineReady() {
    console.log('PWA: 앱이 오프라인에서 사용할 준비가 되었습니다.');
  },
  onRegistered(r) {
    console.log('PWA: 서비스 워커가 정상적으로 등록되었습니다:', r);
  },
  onRegisterError(error) {
    console.error('PWA: 서비스 워커 등록 실패:', error);
  }
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
