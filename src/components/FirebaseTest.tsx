'use client';

import { useEffect, useState } from 'react';
import { auth } from '@/lib/firebase';

export default function FirebaseTest() {
  const [firebaseReady, setFirebaseReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      // Firebase가 제대로 초기화되었는지 확인
      if (auth) {
        console.log('Firebase Auth initialized successfully');
        console.log('Auth config:', auth.config);
        setFirebaseReady(true);
      }
    } catch (err: unknown) {
      console.error('Firebase initialization error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  }, []);

  return (
    <div className="fixed bottom-4 right-4 bg-gray-800 text-white p-4 rounded-lg border border-gray-600 max-w-sm">
      <h3 className="font-bold mb-2">Firebase 상태</h3>
      {firebaseReady ? (
        <div className="text-green-400">✅ Firebase 초기화 완료</div>
      ) : (
        <div className="text-red-400">❌ Firebase 초기화 실패</div>
      )}
      {error && (
        <div className="text-red-400 text-sm mt-2">
          Error: {error}
        </div>
      )}
      <div className="text-xs text-gray-400 mt-2">
        브라우저 콘솔에서 자세한 정보를 확인하세요.
      </div>
    </div>
  );
}