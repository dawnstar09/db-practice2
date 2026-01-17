'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/components/AuthProvider';
import { useForm } from 'react-hook-form';
import { Save, ArrowLeft, Upload, X, Hash, File, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

interface PostForm {
  title: string;
  content: string;
  tags: string;
}

export default function CreatePostPage() {
  const [loading, setLoading] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [filePreviewUrls, setFilePreviewUrls] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [category, setCategory] = useState('일반');
  const [storageTestResult, setStorageTestResult] = useState<string>('');
  const router = useRouter();
  const { user } = useAuth();
  const { register, handleSubmit, formState: { errors } } = useForm<PostForm>();

  const categories = [
    '일반',
    '공지사항',
    '자유 토론',
    '질문/답변',
    '개발',
    '디자인',
    '커뮤니티',
    '기타'
  ];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      console.log('파일 선택됨:', newFiles.map(f => ({
        name: f.name,
        type: f.type,
        size: `${(f.size / 1024 / 1024).toFixed(2)} MB`
      })));
      
      // 파일 크기 체크 (32MB - ImgBB 무료 제한)
      const oversizedFiles = newFiles.filter(f => f.size > 32 * 1024 * 1024);
      if (oversizedFiles.length > 0) {
        alert(`다음 파일들이 32MB를 초과합니다:\n${oversizedFiles.map(f => `- ${f.name} (${(f.size / 1024 / 1024).toFixed(2)} MB)`).join('\n')}`);
        return;
      }
      
      // 이미지 미리보기 URL 생성
      const newPreviewUrls: string[] = [];
      newFiles.forEach(file => {
        if (file.type.startsWith('image/')) {
          const previewUrl = URL.createObjectURL(file);
          newPreviewUrls.push(previewUrl);
        } else {
          newPreviewUrls.push('');
        }
      });
      
      setFiles(prev => [...prev, ...newFiles]);
      setFilePreviewUrls(prev => [...prev, ...newPreviewUrls]);
    }
  };

  const removeFile = (index: number) => {
    // 미리보기 URL 해제
    if (filePreviewUrls[index]) {
      URL.revokeObjectURL(filePreviewUrls[index]);
    }
    setFiles(prev => prev.filter((_, i) => i !== index));
    setFilePreviewUrls(prev => prev.filter((_, i) => i !== index));
  };

  const testStorageConnection = async () => {
    setStorageTestResult('테스트 중...');
    console.log('=== ImgBB 연결 테스트 시작 ===');
    
    try {
      if (!user) {
        setStorageTestResult('❌ 로그인이 필요합니다');
        return;
      }
      
      // 1x1 픽셀 테스트 이미지 생성
      const canvas = document.createElement('canvas');
      canvas.width = 1;
      canvas.height = 1;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, 1, 1);
      }
      
      const base64 = canvas.toDataURL('image/png').split(',')[1];
      
      console.log('테스트 이미지 생성 완료, ImgBB에 업로드 중...');
      
      const formData = new FormData();
      formData.append('image', base64);
      
      const response = await fetch(`https://api.imgbb.com/1/upload?key=${process.env.NEXT_PUBLIC_IMGBB_API_KEY}`, {
        method: 'POST',
        body: formData
      });
      
      const result = await response.json();
      
      if (result.success) {
        setStorageTestResult('✅ ImgBB 연결 정상! 이미지 업로드가 가능합니다. (무료 서비스)');
        console.log('=== ImgBB 테스트 성공 ===');
      } else {
        throw new Error('ImgBB 업로드 실패');
      }
      
    } catch (error) {
      console.error('=== ImgBB 테스트 실패 ===');
      console.error('Error:', error);
      
      setStorageTestResult('❌ ImgBB 연결 오류: 잠시 후 다시 시도해주세요.');
    }
  };

  const uploadFiles = async () => {
    const attachments = [];
    
    try {
      console.log('=== 파일 업로드 시작 (ImgBB 사용) ===');
      console.log('업로드할 파일 수:', files.length);
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        console.log(`\n[${i + 1}/${files.length}] 파일 업로드 시작:`, {
          name: file.name,
          type: file.type,
          size: `${(file.size / 1024 / 1024).toFixed(2)} MB`
        });
        
        // 파일 크기 제한 (32MB - ImgBB 무료 제한)
        if (file.size > 32 * 1024 * 1024) {
          throw new Error(`파일 "${file.name}"이 32MB를 초과합니다. (${(file.size / 1024 / 1024).toFixed(2)} MB)`);
        }
        
        try {
          // 파일을 base64로 변환
          const base64 = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
              const base64String = reader.result as string;
              // "data:image/png;base64," 부분 제거
              const base64Data = base64String.split(',')[1];
              resolve(base64Data);
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
          });
          
          console.log('Base64 변환 완료, ImgBB에 업로드 중...');
          
          // ImgBB API로 업로드 (무료 API 키 사용)
          const formData = new FormData();
          formData.append('image', base64);
          
          const response = await fetch(`https://api.imgbb.com/1/upload?key=${process.env.NEXT_PUBLIC_IMGBB_API_KEY}`, {
            method: 'POST',
            body: formData
          });
          
          if (!response.ok) {
            throw new Error(`ImgBB 업로드 실패: ${response.statusText}`);
          }
          
          const result = await response.json();
          
          if (!result.success) {
            throw new Error('ImgBB 업로드 실패');
          }
          
          const url = result.data.url;
          console.log('업로드 완료, URL:', url);
          
          attachments.push({
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            name: file.name,
            url,
            type: file.type,
            size: file.size
          });
          
          console.log(`✓ 파일 업로드 성공: ${file.name}`);
        } catch (fileError) {
          console.error(`✗ 파일 업로드 실패 (${file.name}):`, fileError);
          throw new Error(`"${file.name}" 업로드 실패: ${fileError instanceof Error ? fileError.message : '알 수 없는 오류'}`);
        }
      }
      
      console.log('=== 모든 파일 업로드 완료 ===\n');
    } catch (error) {
      console.error('\n=== 파일 업로드 오류 ===');
      console.error('Error:', error);
      if (error instanceof Error) {
        console.error('Error name:', error.name);
        console.error('Error message:', error.message);
      }
      throw error;
    }
    
    return attachments;
  };

  const onSubmit = async (data: PostForm) => {
    if (!user) {
      alert('로그인이 필요합니다.');
      return;
    }

    setLoading(true);
    
    try {
      let attachments: { name: string; url: string; type: string }[] = [];
      
      // 파일 업로드
      if (files.length > 0) {
        setUploading(true);
        console.log(`Starting upload of ${files.length} files...`);
        attachments = await uploadFiles();
        console.log('All files uploaded successfully');
        setUploading(false);
      }
      
      // 태그 처리
      const tags = data.tags 
        ? data.tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0)
        : [];

      console.log('Creating post with data:', {
        title: data.title,
        contentLength: data.content.length,
        attachmentsCount: attachments.length,
        tagsCount: tags.length,
        category
      });

      await addDoc(collection(db, 'posts'), {
        title: data.title,
        content: data.content,
        authorId: user.uid,
        authorName: user.displayName || user.email,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        commentCount: 0,
        likes: [],
        attachments,
        tags,
        viewCount: 0,
        category,
      });
      
      console.log('Post created successfully');
      router.push('/posts');
    } catch (error) {
      console.error('Error creating post:', error);
      const errorMessage = error instanceof Error ? error.message : '게시글 작성에 실패했습니다.';
      alert(errorMessage);
    } finally {
      setLoading(false);
      setUploading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-4">로그인이 필요합니다</h2>
          <Link href="/auth/login" className="text-blue-400 hover:text-blue-300">
            로그인 페이지로 이동
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link
            href="/posts"
            className="inline-flex items-center text-gray-400 hover:text-white mb-4 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            게시글 목록으로 돌아가기
          </Link>
          <h1 className="text-3xl font-bold text-white">새 글 작성</h1>
          <p className="text-gray-400 mt-2">커뮤니티와 함께 나누고 싶은 이야기를 작성해보세요</p>
          
          {/* ImgBB 연결 테스트 */}
          <div className="mt-4 bg-green-900/20 border border-green-700 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <AlertCircle className="h-5 w-5 text-green-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="text-sm font-medium text-green-300 mb-2">
                  🆓 무료 이미지 호스팅 (ImgBB) 사용 중
                </h3>
                <p className="text-xs text-green-200 mb-2">
                  Firebase Storage 대신 무료 이미지 호스팅 서비스를 사용합니다.
                </p>
                <button
                  type="button"
                  onClick={testStorageConnection}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded text-sm transition-colors"
                >
                  연결 테스트
                </button>
                {storageTestResult && (
                  <div className={`mt-3 p-3 rounded text-sm whitespace-pre-line ${
                    storageTestResult.startsWith('✅') 
                      ? 'bg-green-900/30 text-green-300 border border-green-700' 
                      : 'bg-red-900/30 text-red-300 border border-red-700'
                  }`}>
                    {storageTestResult}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg border border-gray-700">
          <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
            {/* 제목 */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-300 mb-2">
                제목 <span className="text-red-400">*</span>
              </label>
              <input
                {...register('title', { required: '제목을 입력해주세요' })}
                type="text"
                className="block w-full px-4 py-3 border border-gray-600 placeholder-gray-400 text-white bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="게시글 제목을 입력하세요"
              />
              {errors.title && (
                <p className="mt-1 text-sm text-red-400">{errors.title.message}</p>
              )}
            </div>

            {/* 카테고리 */}
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-300 mb-2">
                카테고리 <span className="text-red-400">*</span>
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="block w-full px-4 py-3 border border-gray-600 text-white bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* 태그 */}
            <div>
              <label htmlFor="tags" className="block text-sm font-medium text-gray-300 mb-2">
                <Hash className="inline h-4 w-4 mr-1" />
                태그
              </label>
              <input
                {...register('tags')}
                type="text"
                className="block w-full px-4 py-3 border border-gray-600 placeholder-gray-400 text-white bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="태그를 쉼표로 구분하여 입력하세요 (예: React, TypeScript, 개발)"
              />
              <p className="mt-1 text-sm text-gray-400">태그는 쉼표(,)로 구분하여 입력해주세요</p>
            </div>

            {/* 내용 */}
            <div>
              <label htmlFor="content" className="block text-sm font-medium text-gray-300 mb-2">
                내용 <span className="text-red-400">*</span>
              </label>
              <textarea
                {...register('content', { required: '내용을 입력해주세요' })}
                rows={12}
                className="block w-full px-4 py-3 border border-gray-600 placeholder-gray-400 text-white bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                placeholder="게시글 내용을 입력하세요"
              />
              {errors.content && (
                <p className="mt-1 text-sm text-red-400">{errors.content.message}</p>
              )}
            </div>

            {/* 파일 업로드 */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                <Upload className="inline h-4 w-4 mr-1" />
                첨부파일
              </label>
              
              <div className="border-2 border-dashed border-gray-600 rounded-lg p-6 text-center hover:border-gray-500 transition-colors">
                <input
                  type="file"
                  multiple
                  onChange={handleFileChange}
                  className="hidden"
                  id="file-upload"
                  accept="image/*,video/*,.pdf,.doc,.docx,.txt"
                />
                <label
                  htmlFor="file-upload"
                  className="cursor-pointer flex flex-col items-center"
                >
                  <Upload className="h-8 w-8 text-gray-400 mb-2" />
                  <span className="text-gray-300">파일을 선택하거나 드래그하여 업로드</span>
                  <span className="text-gray-400 text-sm mt-1">
                    이미지, 동영상, PDF, 문서 파일 지원
                  </span>
                </label>
              </div>

              {/* 선택된 파일 목록 */}
              {files.length > 0 && (
                <div className="mt-4 space-y-3">
                  <h4 className="text-sm font-medium text-gray-300">선택된 파일 ({files.length})</h4>
                  {files.map((file, index) => (
                    <div key={index} className="flex items-start space-x-3 bg-gray-700 rounded-lg p-3">
                      {/* 이미지 미리보기 */}
                      {file.type.startsWith('image/') && filePreviewUrls[index] && (
                        <div className="flex-shrink-0 relative w-16 h-16">
                          <Image
                            src={filePreviewUrls[index]}
                            alt={file.name}
                            fill
                            className="object-cover rounded border border-gray-600"
                          />
                        </div>
                      )}
                      
                      {/* 파일 아이콘 (이미지가 아닌 경우) */}
                      {!file.type.startsWith('image/') && (
                        <div className="flex-shrink-0">
                          <File className="h-8 w-8 text-blue-400 mt-2" />
                        </div>
                      )}
                      
                      {/* 파일 정보 */}
                      <div className="flex-1 min-w-0">
                        <div className="text-white text-sm font-medium truncate">{file.name}</div>
                        <div className="text-gray-400 text-xs mt-1">
                          {file.type || '알 수 없는 타입'} • {formatFileSize(file.size)}
                        </div>
                      </div>
                      
                      {/* 삭제 버튼 */}
                      <button
                        type="button"
                        onClick={() => removeFile(index)}
                        className="flex-shrink-0 text-gray-400 hover:text-red-400 transition-colors p-1"
                        title="파일 제거"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 버튼 */}
            <div className="flex justify-end space-x-3 pt-6 border-t border-gray-700">
              <Link
                href="/posts"
                className="px-6 py-3 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
              >
                취소
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center px-6 py-3 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Save className="h-4 w-4 mr-2" />
                {loading ? (uploading ? '파일 업로드 중...' : '저장 중...') : '게시글 저장'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}