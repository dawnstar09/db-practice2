'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { doc, getDoc, collection, query, orderBy, getDocs, addDoc, serverTimestamp, deleteDoc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/components/AuthProvider';
import { Post, Comment } from '../../../../types';
import { useForm } from 'react-hook-form';
import { ArrowLeft, User, MessageCircle, Send, Edit, Trash2, Heart, Download, File, Hash, Eye } from 'lucide-react';
import { createNotification } from '@/lib/notifications';
import { createOrGetChatRoom } from '@/lib/chatUtils';

interface CommentForm {
  content: string;
}

export default function PostDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [commentLoading, setCommentLoading] = useState(false);
  const { register, handleSubmit, reset, formState: { errors } } = useForm<CommentForm>();

  const postId = params.id as string;

  useEffect(() => {
    const fetchPostAndComments = async () => {
      try {
        // Fetch post
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
            viewCount: postDoc.data().viewCount || 0,
            category: postDoc.data().category || '일반',
          } as Post;
          setPost(postData);
          
          // 조회수 증가
          await updateDoc(doc(db, 'posts', postId), {
            viewCount: (postDoc.data().viewCount || 0) + 1
          });
          
          // 로컬 상태도 업데이트
          setPost(prev => prev ? { ...prev, viewCount: (prev.viewCount || 0) + 1 } : null);
        }

        // Fetch comments
        const commentsQuery = query(
          collection(db, 'posts', postId, 'comments'),
          orderBy('createdAt', 'asc')
        );
        const commentsSnapshot = await getDocs(commentsQuery);
        const fetchedComments = commentsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date(),
          updatedAt: doc.data().updatedAt?.toDate() || new Date(),
        })) as Comment[];
        setComments(fetchedComments);
      } catch (error) {
        console.error('Error fetching post and comments:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPostAndComments();
  }, [postId]);

  const handleLike = async () => {
    if (!user || !post) {
      alert('로그인이 필요합니다.');
      return;
    }

    const isLiked = post.likes.includes(user.uid);

    try {
      const postRef = doc(db, 'posts', postId);
      if (isLiked) {
        await updateDoc(postRef, {
          likes: arrayRemove(user.uid)
        });
        setPost(prev => prev ? { ...prev, likes: prev.likes.filter(uid => uid !== user.uid) } : null);
      } else {
        await updateDoc(postRef, {
          likes: arrayUnion(user.uid)
        });
        setPost(prev => prev ? { ...prev, likes: [...prev.likes, user.uid] } : null);
        
        // 좋아요 알림 생성
        if (post.authorId !== user.uid) {
          await createNotification(
            post.authorId,
            'like',
            postId,
            post.title,
            user.uid,
            user.displayName || user.email
          );
        }
      }
    } catch (error) {
      console.error('Error updating like:', error);
    }
  };

  const onSubmitComment = async (data: CommentForm) => {
    if (!user) {
      alert('로그인이 필요합니다.');
      return;
    }

    setCommentLoading(true);
    try {
      const newComment = {
        postId,
        content: data.content,
        authorId: user.uid,
        authorName: user.displayName || user.email,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      await addDoc(collection(db, 'posts', postId, 'comments'), newComment);
      
      // Update comment count
      if (post) {
        await updateDoc(doc(db, 'posts', postId), {
          commentCount: comments.length + 1
        });
        
        // 댓글 알림 생성
        if (post.authorId !== user.uid) {
          await createNotification(
            post.authorId,
            'comment',
            postId,
            post.title,
            user.uid,
            user.displayName || user.email,
            data.content
          );
        }
      }

      // Refresh comments
      const commentsQuery = query(
        collection(db, 'posts', postId, 'comments'),
        orderBy('createdAt', 'asc')
      );
      const commentsSnapshot = await getDocs(commentsQuery);
      const fetchedComments = commentsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
      })) as Comment[];
      setComments(fetchedComments);
      
      reset();
    } catch (error) {
      console.error('Error adding comment:', error);
      alert('댓글 작성에 실패했습니다.');
    } finally {
      setCommentLoading(false);
    }
  };

  const handleDeletePost = async () => {
    if (!user || !post || user.uid !== post.authorId) return;
    
    if (confirm('정말로 이 게시글을 삭제하시겠습니까?')) {
      try {
        await deleteDoc(doc(db, 'posts', postId));
        router.push('/posts');
      } catch (error) {
        console.error('Error deleting post:', error);
        alert('게시글 삭제에 실패했습니다.');
      }
    }
  };

  const startChat = async () => {
    if (!user || !post || user.uid === post.authorId) return;

    try {
      const chatRoomId = await createOrGetChatRoom(
        user.uid,
        user.displayName || user.email || '알 수 없음',
        post.authorId,
        post.authorName
      );
      router.push(`/chat/${chatRoomId}`);
    } catch (error) {
      console.error('채팅 시작 중 오류:', error);
      alert('채팅을 시작할 수 없습니다.');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return '방금 전';
    if (minutes < 60) return `${minutes}분 전`;
    if (hours < 24) return `${hours}시간 전`;
    if (days < 7) return `${days}일 전`;
    return date.toLocaleDateString('ko-KR');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white">로딩 중...</div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-4">게시글을 찾을 수 없습니다</h2>
          <Link href="/posts" className="text-blue-400 hover:text-blue-300">
            게시글 목록으로 돌아가기
          </Link>
        </div>
      </div>
    );
  }

  const isLiked = user ? post.likes.includes(user.uid) : false;

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
        </div>

        {/* Post */}
        <div className="bg-gray-800 rounded-lg border border-gray-700 mb-8">
          <div className="p-6">
            {/* 헤더 */}
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                  <User className="h-5 w-5 text-white" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={startChat}
                      disabled={!user || user.uid === post.authorId}
                      className={`font-medium transition-colors ${
                        user && user.uid !== post.authorId
                          ? 'text-blue-400 hover:text-blue-300 cursor-pointer'
                          : 'text-white cursor-default'
                      }`}
                    >
                      {post.authorName}
                    </button>
                    {user && user.uid !== post.authorId && (
                      <MessageCircle 
                        className="h-4 w-4 text-blue-400 cursor-pointer hover:text-blue-300" 
                        onClick={startChat}
                      />
                    )}
                  </div>
                  <div className="text-gray-400 text-sm">{formatDate(post.createdAt)}</div>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-4 text-gray-400 text-sm">
                  <div className="flex items-center space-x-1">
                    <Eye className="h-4 w-4" />
                    <span>{post.viewCount || 0}</span>
                  </div>
                </div>
                
                {user && user.uid === post.authorId && (
                  <div className="flex space-x-2">
                    <Link
                      href={`/posts/${postId}/edit`}
                      className="p-2 text-gray-400 hover:text-white transition-colors"
                    >
                      <Edit className="h-4 w-4" />
                    </Link>
                    <button
                      onClick={handleDeletePost}
                      className="p-2 text-gray-400 hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
            
            {/* 카테고리 */}
            <div className="mb-4">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-600/20 text-blue-400 border border-blue-600/30">
                {post.category || '일반'}
              </span>
            </div>

            {/* 제목 */}
            <h1 className="text-3xl font-bold text-white mb-6">{post.title}</h1>

            {/* 태그 */}
            {post.tags && post.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-6">
                {post.tags.map((tag, index) => (
                  <span key={index} className="inline-flex items-center px-3 py-1 bg-gray-700 text-blue-400 text-sm rounded-full">
                    <Hash className="h-3 w-3 mr-1" />
                    {tag}
                  </span>
                ))}
              </div>
            )}
            
            {/* 내용 */}
            <div className="prose prose-invert max-w-none mb-6">
              <p className="text-gray-300 whitespace-pre-wrap leading-relaxed">{post.content}</p>
            </div>

            {/* 첨부파일 */}
            {post.attachments && post.attachments.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-white mb-3">첨부파일 ({post.attachments.length})</h3>
                <div className="space-y-2">
                  {post.attachments.map((attachment) => (
                    <div key={attachment.id} className="flex items-center justify-between bg-gray-700 rounded-lg p-3">
                      <div className="flex items-center space-x-3">
                        <File className="h-5 w-5 text-blue-400" />
                        <div>
                          <div className="text-white">{attachment.name}</div>
                          <div className="text-gray-400 text-sm">{formatFileSize(attachment.size)}</div>
                        </div>
                      </div>
                      <a
                        href={attachment.url}
                        download={attachment.name}
                        className="flex items-center space-x-1 text-blue-400 hover:text-blue-300 transition-colors"
                      >
                        <Download className="h-4 w-4" />
                        <span className="text-sm">다운로드</span>
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 액션 버튼들 */}
            <div className="flex items-center justify-between pt-6 border-t border-gray-700">
              <div className="flex items-center space-x-6">
                <button
                  onClick={handleLike}
                  className={`flex items-center space-x-2 transition-colors ${
                    isLiked 
                      ? 'text-red-500 hover:text-red-400' 
                      : 'text-gray-400 hover:text-red-500'
                  }`}
                >
                  <Heart className={`h-5 w-5 ${isLiked ? 'fill-current' : ''}`} />
                  <span>{post.likes.length}</span>
                </button>
                
                <div className="flex items-center space-x-2 text-gray-400">
                  <MessageCircle className="h-5 w-5" />
                  <span>{comments.length}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Comments Section */}
        <div className="bg-gray-800 rounded-lg border border-gray-700">
          <div className="p-6">
            <h3 className="text-xl font-bold text-white mb-6">댓글 ({comments.length})</h3>
            
            {/* Comment Form */}
            {user ? (
              <form onSubmit={handleSubmit(onSubmitComment)} className="mb-8">
                <div className="flex space-x-4">
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <User className="h-4 w-4 text-white" />
                  </div>
                  <div className="flex-1">
                    <textarea
                      {...register('content', { required: '댓글을 입력해주세요' })}
                      rows={3}
                      className="w-full px-4 py-3 border border-gray-600 placeholder-gray-400 text-white bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                      placeholder="댓글을 입력하세요..."
                    />
                    {errors.content && (
                      <p className="mt-1 text-sm text-red-400">{errors.content.message}</p>
                    )}
                    <div className="flex justify-end mt-3">
                      <button
                        type="submit"
                        disabled={commentLoading}
                        className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 transition-colors"
                      >
                        <Send className="h-4 w-4 mr-2" />
                        댓글 작성
                      </button>
                    </div>
                  </div>
                </div>
              </form>
            ) : (
              <div className="mb-8 p-4 bg-gray-700 rounded-lg text-center">
                <p className="text-gray-300 mb-2">댓글을 작성하려면 로그인이 필요합니다.</p>
                <Link href="/auth/login" className="text-blue-400 hover:text-blue-300">
                  로그인하기
                </Link>
              </div>
            )}

            {/* Comments List */}
            <div className="space-y-6">
              {comments.length === 0 ? (
                <p className="text-gray-400 text-center py-8">아직 댓글이 없습니다.</p>
              ) : (
                comments.map((comment) => (
                  <div key={comment.id} className="flex space-x-4">
                    <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                      <User className="h-4 w-4 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="text-white font-medium">{comment.authorName}</span>
                        <span className="text-gray-400 text-sm">{formatDate(comment.createdAt)}</span>
                      </div>
                      <p className="text-gray-300 whitespace-pre-wrap">{comment.content}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}