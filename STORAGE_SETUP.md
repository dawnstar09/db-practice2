# Firebase Storage 설정 가이드

## 이미지/파일 업로드가 안 될 때 확인사항

### 1. Firebase Console에서 Storage 보안 규칙 설정

Firebase Console (https://console.firebase.google.com) 접속 후:

1. 프로젝트 선택
2. 왼쪽 메뉴에서 **Storage** 클릭
3. 상단 탭에서 **Rules** 클릭
4. 아래 규칙으로 수정:

```
rules_version = '2';

service firebase.storage {
  match /b/{bucket}/o {
    // 인증된 사용자만 업로드 가능
    match /posts/{userId}/{allPaths=**} {
      allow read: if true;  // 모든 사용자가 읽기 가능
      allow write: if request.auth != null && request.auth.uid == userId;  // 본인만 업로드 가능
    }
    
    // 기본 규칙
    match /{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

5. **게시(Publish)** 버튼 클릭

### 2. Storage 활성화 확인

1. Firebase Console → **Storage**
2. Storage가 활성화되어 있는지 확인
3. 활성화되어 있지 않다면 **시작하기** 버튼 클릭

### 3. 환경변수 확인

`.env.local` 파일에 다음 내용이 정확히 설정되어 있는지 확인:

```env
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=data-sunlight-467707-r7.firebasestorage.app
```

### 4. 파일 크기 제한

- 현재 설정: **10MB**까지 업로드 가능
- 더 큰 파일이 필요하면 코드에서 제한 수정 가능

### 5. 지원 파일 형식

- **이미지**: jpg, jpeg, png, gif, webp 등
- **동영상**: mp4, mov, avi 등
- **문서**: pdf, doc, docx, txt 등

### 6. 브라우저 콘솔 확인

업로드가 안 될 때 브라우저 개발자 도구(F12)의 Console 탭에서 에러 메시지 확인:

- `permission-denied`: Storage 보안 규칙 문제
- `storage/unauthorized`: 인증 문제
- `storage/object-not-found`: Storage가 활성화되지 않음
- `CORS policy`: CORS 설정 문제 (아래 7번 참조)

### 7. Firebase Storage CORS 설정 (중요!)

CORS 에러가 발생하면 다음 단계를 따르세요:

#### 방법 1: Firebase Console에서 설정 (권장)

Firebase Storage는 기본적으로 모든 도메인에서의 접근을 허용하지만, 특정 경우에 CORS 에러가 발생할 수 있습니다.

1. Google Cloud Console (https://console.cloud.google.com) 접속
2. 프로젝트 선택 (data-sunlight-467707-r7)
3. 왼쪽 메뉴 → **Cloud Storage** → **버킷**
4. `data-sunlight-467707-r7.firebasestorage.app` 버킷 선택
5. 상단의 **권한** 탭 클릭
6. CORS 설정 확인 및 수정

#### 방법 2: gsutil 명령줄 도구 사용

`cors.json` 파일 생성:

```json
[
  {
    "origin": ["*"],
    "method": ["GET", "HEAD", "PUT", "POST", "DELETE"],
    "maxAgeSeconds": 3600,
    "responseHeader": ["Content-Type", "Access-Control-Allow-Origin"]
  }
]
```

명령 실행:
```bash
gsutil cors set cors.json gs://data-sunlight-467707-r7.firebasestorage.app
```

#### 방법 3: 특정 도메인만 허용 (보안 강화)

```json
[
  {
    "origin": [
      "https://db-practice2.vercel.app",
      "https://db-practice2-*.vercel.app",
      "http://localhost:3000"
    ],
    "method": ["GET", "HEAD", "PUT", "POST", "DELETE"],
    "maxAgeSeconds": 3600,
    "responseHeader": ["Content-Type", "Access-Control-Allow-Origin"]
  }
]
```

### 8. 테스트 방법

1. 로그인한 상태에서 게시글 작성 페이지로 이동
2. 작은 이미지 파일(1MB 이하) 선택
3. 브라우저 콘솔(F12)에서 로그 확인:
   - "파일 선택됨" 메시지
   - "=== 파일 업로드 시작 ===" 메시지
   - "✓ 파일 업로드 성공" 메시지

### 문제 해결

#### "CORS policy" 에러
→ Firebase Storage CORS 설정 필요 (위의 7번 참조)
→ 파일명에 특수문자가 너무 많으면 제거 (자동으로 처리됨)

#### "permission-denied" 에러
→ Firebase Console에서 Storage Rules 확인 및 수정

#### "storage/unauthorized" 에러
→ 로그인 상태 확인 (로그아웃 후 다시 로그인)

#### 파일이 선택되지 않음
→ 브라우저 권한 확인 (파일 접근 권한)

#### 업로드 중 멈춤
→ 네트워크 연결 확인, 파일 크기 확인

## 추가 도움이 필요하면

Firebase Console의 Storage 페이지에서 "Usage" 탭을 확인하여 업로드가 실제로 시도되고 있는지 확인할 수 있습니다.
