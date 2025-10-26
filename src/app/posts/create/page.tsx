'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/lib/firebase';
import { useAuth } from '@/components/AuthProvider';
import { useForm } from 'react-hook-form';
import { Save, ArrowLeft, Upload, X, Hash, File } from 'lucide-react';
import Link from 'next/link';

interface PostForm {
  title: string;
  content: string;
  tags: string;
}

export default function CreatePostPage() {
  const [loading, setLoading] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [category, setCategory] = useState('일반');
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
      setFiles(prev => [...prev, ...newFiles]);
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const uploadFiles = async () => {
    const attachments = [];
    
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        console.log(`Uploading file ${i + 1}/${files.length}: ${file.name}`);
        
        // 파일 크기 제한 (10MB)
        if (file.size > 10 * 1024 * 1024) {
          throw new Error(`파일 "${file.name}"이 10MB를 초과합니다.`);
        }
        
        const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
        const fileRef = ref(storage, `posts/${user?.uid}/${Date.now()}_${sanitizedFileName}`);
        
        const snapshot = await uploadBytes(fileRef, file);
        const url = await getDownloadURL(snapshot.ref);
        
        attachments.push({
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          name: file.name,
          url,
          type: file.type,
          size: file.size
        });
        
        console.log(`File uploaded successfully: ${file.name}`);
      }
    } catch (error) {
      console.error('File upload error:', error);
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
                <div className="mt-4 space-y-2">
                  <h4 className="text-sm font-medium text-gray-300">선택된 파일 ({files.length})</h4>
                  {files.map((file, index) => (
                    <div key={index} className="flex items-center justify-between bg-gray-700 rounded-lg p-3">
                      <div className="flex items-center space-x-3">
                        <File className="h-4 w-4 text-blue-400" />
                        <div>
                          <div className="text-white text-sm">{file.name}</div>
                          <div className="text-gray-400 text-xs">{formatFileSize(file.size)}</div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFile(index)}
                        className="text-gray-400 hover:text-red-400 transition-colors"
                      >
                        <X className="h-4 w-4" />
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