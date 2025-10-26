'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '@/lib/firebase';
import { useAuth } from '@/components/AuthProvider';
import { Post } from '../../../../../types';
import { Save, ArrowLeft, Upload, X, Hash, File } from 'lucide-react';
import Link from 'next/link';

export default function EditPostPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [existingFiles, setExistingFiles] = useState<{ id: string; name: string; url: string; size: number }[]>([]);
  const [filesToDelete, setFilesToDelete] = useState<string[]>([]);
  const [category, setCategory] = useState('일반');
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    tags: '',
  });

  const postId = params.id as string;

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

  useEffect(() => {
    const fetchPost = async () => {
      if (!postId) return;

      try {
        const postDoc = await getDoc(doc(db, 'posts', postId));
        if (postDoc.exists()) {
          const postData = {
            id: postDoc.id,
            ...postDoc.data(),
            createdAt: postDoc.data().createdAt?.toDate() || new Date(),
            updatedAt: postDoc.data().updatedAt?.toDate() || new Date(),
            likes: postDoc.data().likes || [],
            attachments: postDoc.data().attachments || [],
            tags: postDoc.data().tags || [],
            category: postDoc.data().category || '일반',
          } as Post;

          setPost(postData);
          setFormData({
            title: postData.title,
            content: postData.content,
            tags: postData.tags?.join(', ') || '',
          });
          setCategory(postData.category || '일반');
          setExistingFiles(postData.attachments || []);
        }
      } catch (error) {
        console.error('Error fetching post:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [postId]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setFiles(prev => [...prev, ...newFiles]);
    }
  };

  const removeNewFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const removeExistingFile = (fileId: string) => {
    setFilesToDelete(prev => [...prev, fileId]);
    setExistingFiles(prev => prev.filter(file => file.id !== fileId));
  };

  const uploadFiles = async () => {
    const newAttachments = [];
    
    for (const file of files) {
      const fileRef = ref(storage, `posts/${Date.now()}_${file.name}`);
      const snapshot = await uploadBytes(fileRef, file);
      const url = await getDownloadURL(snapshot.ref);
      
      newAttachments.push({
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        name: file.name,
        url,
        type: file.type,
        size: file.size
      });
    }

    return newAttachments;
  };

  const deleteFiles = async () => {
    for (const fileId of filesToDelete) {
      const fileToDelete = post?.attachments?.find(f => f.id === fileId);
      if (fileToDelete) {
        try {
          const fileRef = ref(storage, fileToDelete.url);
          await deleteObject(fileRef);
        } catch (error) {
          console.error('Error deleting file:', error);
        }
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !post || user.uid !== post.authorId) return;

    setSaving(true);
    
    try {
      // 파일 업로드
      const newAttachments = await uploadFiles();
      
      // 기존 파일 삭제
      await deleteFiles();

      // 태그 처리
      const tags = formData.tags 
        ? formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0)
        : [];

      // 모든 첨부파일 (기존 + 새로운)
      const allAttachments = [...existingFiles, ...newAttachments];

      await updateDoc(doc(db, 'posts', postId), {
        title: formData.title,
        content: formData.content,
        tags,
        category,
        attachments: allAttachments,
        updatedAt: serverTimestamp(),
      });
      
      router.push(`/posts/${postId}`);
    } catch (error) {
      console.error('Error updating post:', error);
      alert('게시글 수정에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">로딩 중...</div>
      </div>
    );
  }

  if (!user || !post) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-4">게시글을 찾을 수 없습니다</h2>
          <Link href="/posts" className="text-blue-400 hover:text-blue-300">
            게시글 목록으로 돌아가기
          </Link>
        </div>
      </div>
    );
  }

  if (user.uid !== post.authorId) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-4">수정 권한이 없습니다</h2>
          <Link href={`/posts/${postId}`} className="text-blue-400 hover:text-blue-300">
            게시글로 돌아가기
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link
            href={`/posts/${postId}`}
            className="inline-flex items-center text-gray-400 hover:text-white mb-4 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            게시글로 돌아가기
          </Link>
          <h1 className="text-3xl font-bold text-white">게시글 수정</h1>
          <p className="text-gray-400 mt-2">게시글을 수정해보세요</p>
        </div>

        <div className="bg-gray-900 rounded-lg border border-gray-800">
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* 제목 */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-300 mb-2">
                제목 <span className="text-red-400">*</span>
              </label>
              <input
                name="title"
                type="text"
                value={formData.title}
                onChange={handleInputChange}
                required
                className="block w-full px-4 py-3 border border-gray-700 placeholder-gray-400 text-white bg-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="게시글 제목을 입력하세요"
              />
            </div>

            {/* 카테고리 */}
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-300 mb-2">
                카테고리 <span className="text-red-400">*</span>
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="block w-full px-4 py-3 border border-gray-700 text-white bg-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                name="tags"
                type="text"
                value={formData.tags}
                onChange={handleInputChange}
                className="block w-full px-4 py-3 border border-gray-700 placeholder-gray-400 text-white bg-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                name="content"
                value={formData.content}
                onChange={handleInputChange}
                required
                rows={10}
                className="block w-full px-4 py-3 border border-gray-700 placeholder-gray-400 text-white bg-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-vertical"
                placeholder="게시글 내용을 입력하세요"
              />
            </div>

            {/* 기존 첨부파일 */}
            {existingFiles.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-3">
                  <File className="inline h-4 w-4 mr-1" />
                  기존 첨부파일
                </label>
                <div className="space-y-2">
                  {existingFiles.map((file) => (
                    <div key={file.id} className="flex items-center justify-between bg-gray-800 rounded-lg p-3">
                      <div className="flex items-center space-x-3">
                        <File className="h-5 w-5 text-blue-400" />
                        <div>
                          <div className="text-white">{file.name}</div>
                          <div className="text-gray-400 text-sm">{formatFileSize(file.size)}</div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeExistingFile(file.id)}
                        className="text-red-400 hover:text-red-300 p-1"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 새 파일 첨부 */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-3">
                <Upload className="inline h-4 w-4 mr-1" />
                새 파일 첨부
              </label>
              <div className="border-2 border-dashed border-gray-600 rounded-lg p-6">
                <input
                  type="file"
                  multiple
                  onChange={handleFileChange}
                  className="hidden"
                  id="file-upload"
                  accept="image/*,.pdf,.doc,.docx,.txt"
                />
                <label
                  htmlFor="file-upload"
                  className="cursor-pointer flex flex-col items-center justify-center space-y-2 text-gray-400 hover:text-gray-300"
                >
                  <Upload className="h-8 w-8" />
                  <span>클릭하여 파일을 선택하세요</span>
                  <span className="text-sm">이미지, PDF, Word, 텍스트 파일 지원</span>
                </label>
              </div>

              {files.length > 0 && (
                <div className="mt-4 space-y-2">
                  <h4 className="text-sm font-medium text-gray-300">새로 추가할 파일:</h4>
                  {files.map((file, index) => (
                    <div key={index} className="flex items-center justify-between bg-gray-800 rounded-lg p-3">
                      <div className="flex items-center space-x-3">
                        <File className="h-5 w-5 text-green-400" />
                        <div>
                          <div className="text-white">{file.name}</div>
                          <div className="text-gray-400 text-sm">{formatFileSize(file.size)}</div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeNewFile(index)}
                        className="text-red-400 hover:text-red-300 p-1"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 버튼 */}
            <div className="flex justify-end space-x-4 pt-6 border-t border-gray-700">
              <Link
                href={`/posts/${postId}`}
                className="px-6 py-3 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-800 transition-colors"
              >
                취소
              </Link>
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
              >
                <Save className="h-4 w-4" />
                <span>{saving ? '저장 중...' : '수정 완료'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}