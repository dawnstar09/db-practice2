# Firebase 설정 가이드

## 🚨 현재 문제: auth/configuration-not-found

이 오류는 Firebase Authentication이 프로젝트에서 활성화되지 않았을 때 발생합니다.

## ✅ 해결 방법

### 1. Firebase Console에서 Authentication 활성화

1. **Firebase Console 접속**: https://console.firebase.google.com/
2. **프로젝트 선택**: `data-sunlight-467707-r7`
3. **Authentication 설정**:
   ```
   좌측 메뉴 → Authentication → Get started (버튼 클릭)
   ```
4. **Email/Password 로그인 활성화**:
   ```
   Sign-in method 탭 → Email/Password → Enable 체크 → Save
   ```

### 2. Firestore Database 생성

1. **Firestore 설정**:
   ```
   좌측 메뉴 → Firestore Database → Create database
   ```
2. **보안 규칙 설정**:
   ```
   Start in test mode 선택 → 지역 선택 (asia-northeast3) → Done
   ```

### 3. 웹 앱 설정 확인

1. **Project Settings 접속**:
   ```
   톱니바퀴 아이콘 → Project settings → Your apps
   ```
2. **웹 앱 등록 확인**:
   - 웹 앱이 등록되어 있어야 함
   - 없다면 "Add app" → Web 아이콘 클릭하여 등록

## 🔧 임시 해결 방법 (로컬 테스트용)

Firebase 에뮬레이터를 사용하여 로컬에서 테스트할 수 있습니다:

```bash
# Firebase CLI 설치 (한 번만)
npm install -g firebase-tools

# Firebase 로그인
firebase login

# 프로젝트 디렉토리에서 에뮬레이터 시작
firebase emulators:start --only auth,firestore
```

## 📋 체크리스트

- [ ] Firebase Console에서 Authentication 활성화됨
- [ ] Email/Password 로그인 방식 활성화됨  
- [ ] Firestore Database 생성됨
- [ ] 웹 앱이 프로젝트에 등록됨
- [ ] .env.local 파일의 설정값이 정확함

## ⚡ 빠른 확인 방법

브라우저 개발자 도구(F12) → Console에서 다음 확인:
- Firebase Config Check 로그가 모든 항목에 "✓ Set"으로 표시되는지
- "Firebase initialized successfully" 메시지가 출력되는지

모든 설정이 완료되면 페이지를 새로고침하고 회원가입을 다시 시도해보세요.