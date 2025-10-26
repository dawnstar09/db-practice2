# Firebase 게시판 웹사이트

Firebase를 활용한 현대적인 게시판 시스템입니다. Next.js 14와 TypeScript로 구축되었으며, 깔끔한 다크 테마를 제공합니다.

## 🚀 주요 기능

- **사용자 인증**: Firebase Authentication을 통한 안전한 로그인/회원가입
- **게시글 관리**: 완전한 CRUD 기능 (생성, 읽기, 수정, 삭제)
- **댓글 시스템**: 실시간 댓글 작성 및 조회
- **반응형 디자인**: 모든 디바이스에서 최적화된 사용자 경험
- **다크 테마**: 눈에 편안한 어두운 테마

## 🛠️ 기술 스택

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS
- **Backend**: Firebase (Authentication & Firestore)
- **UI 라이브러리**: Lucide React Icons
- **폼 관리**: React Hook Form

## 📁 프로젝트 구조

```
src/
├── app/
│   ├── auth/              # 인증 페이지 (로그인/회원가입)
│   │   ├── login/
│   │   └── signup/
│   ├── posts/             # 게시글 관련 페이지
│   │   ├── [id]/          # 게시글 상세 페이지
│   │   ├── create/        # 게시글 작성 페이지
│   │   └── page.tsx       # 게시글 목록 페이지
│   ├── components/        # 공통 컴포넌트
│   │   ├── AuthProvider.tsx
│   │   └── Navbar.tsx
│   ├── lib/               # Firebase 설정
│   │   └── firebase.ts
│   └── globals.css        # 전역 스타일
├── types/                 # TypeScript 타입 정의
│   └── index.ts
└── .env.local            # 환경 변수 (Firebase 설정)
```

## 🔧 설치 및 실행

### 1. 프로젝트 클론

```bash
git clone <repository-url>
cd db-practice
```

### 2. 의존성 설치

```bash
npm install
```

### 3. Firebase 설정

1. [Firebase Console](https://console.firebase.google.com/)에서 새 프로젝트 생성
2. Authentication 활성화 (이메일/비밀번호 로그인 방식 설정)
3. Firestore Database 생성
4. 프로젝트 설정에서 웹 앱 추가 후 설정 정보 확인

### 4. 환경 변수 설정

`.env.local` 파일을 열고 Firebase 설정 정보를 입력하세요:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

### 5. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)을 열어 애플리케이션을 확인하세요.

## 🔥 Firebase 보안 규칙

Firestore Database에 다음 보안 규칙을 설정하세요:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Posts collection
    match /posts/{postId} {
      // Allow read access to all users
      allow read: if true;
      // Allow write access only to authenticated users
      allow create: if request.auth != null;
      // Allow update/delete only to the author
      allow update, delete: if request.auth != null && request.auth.uid == resource.data.authorId;
      
      // Comments subcollection
      match /comments/{commentId} {
        allow read: if true;
        allow create: if request.auth != null;
        allow update, delete: if request.auth != null && request.auth.uid == resource.data.authorId;
      }
    }
  }
}
```

## 🚀 배포

### Vercel 배포

1. GitHub에 프로젝트 푸시
2. [Vercel](https://vercel.com)에서 프로젝트 import
3. 환경 변수 설정
4. 배포 완료

### 다른 플랫폼 배포

```bash
npm run build
```

빌드된 파일을 원하는 호스팅 플랫폼에 배포하세요.

## 📝 사용법

1. **회원가입/로그인**: 우측 상단의 버튼을 통해 계정을 생성하거나 로그인하세요.
2. **게시글 작성**: 로그인 후 "새 글 작성" 버튼을 클릭하여 게시글을 작성하세요.
3. **게시글 조회**: 홈페이지 또는 게시글 목록에서 원하는 글을 클릭하여 상세 내용을 확인하세요.
4. **댓글 작성**: 게시글 상세 페이지에서 댓글을 작성하고 다른 사용자와 소통하세요.

## 🤝 기여하기

프로젝트 개선에 기여하고 싶으시다면:

1. Fork 프로젝트
2. Feature 브랜치 생성 (`git checkout -b feature/AmazingFeature`)
3. 변경사항 커밋 (`git commit -m 'Add some AmazingFeature'`)
4. 브랜치에 푸시 (`git push origin feature/AmazingFeature`)
5. Pull Request 생성

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다.

## 📞 문의

프로젝트에 대한 질문이나 제안사항이 있으시면 이슈를 생성해 주세요.
