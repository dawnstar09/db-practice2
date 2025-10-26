'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthProvider';
import Link from 'next/link';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Post } from '../../../types';
import { Heart, MessageCircle, Eye, Calendar, ArrowLeft, User } from 'lucide-react';

export default function MyPage() {
  const { user } = useAuth();
  const [myPosts, setMyPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMyPosts = async () => {
      if (!user) {
        console.log('사용자가 로그인하지 않음');
        setLoading(false);
        return;
      }
      
      console.log('현재 사용자 UID:', user.uid);
      console.log('내 게시글 조회 시작...');
      
      try {
        const postsQuery = query(
          collection(db, 'posts'),
          where('authorId', '==', user.uid)
          // orderBy('createdAt', 'desc') // 인덱스 생성 후 다시 활성화
        );
        
        console.log('Firestore 쿼리 실행 중...');
        const querySnapshot = await getDocs(postsQuery);
        console.log('조회된 문서 개수:', querySnapshot.docs.length);
        
        const posts = querySnapshot.docs.map(doc => {
          const data = doc.data();
          console.log('게시글 데이터:', data);
          return {
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate() || new Date(),
            likes: data.likes || [],
            attachments: data.attachments || [],
          };
        }).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()) as Post[];
        
        console.log('최종 게시글 목록:', posts);
        setMyPosts(posts);
      } catch (error) {
        console.error('내 게시글 로딩 오류:', error);
        console.error('오류 세부사항:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMyPosts();
  }, [user]);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
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
    <div className="min-h-screen bg-black">
      <div className="pt-12 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* 헤더 */}
          <div className="mb-6 sm:mb-8">
            <Link
              href="/"
              className="inline-flex items-center text-gray-300 hover:text-white mb-4 sm:mb-6 transition-colors"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">홈으로 돌아가기</span>
              <span className="sm:hidden">홈</span>
            </Link>
            
            <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-4 mb-6 sm:mb-8">
              <div className="bg-blue-500 w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center mx-auto sm:mx-0">
                <User className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
              </div>
              <div className="text-center sm:text-left">
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white">마이페이지</h1>
                <p className="text-gray-400 text-sm sm:text-base break-all sm:break-normal">{user.displayName || user.email}</p>
              </div>
            </div>

            {/* 통계 */}
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-6 sm:mb-8">
              <div className="bg-gray-900 rounded-lg border border-gray-800 p-3 sm:p-4 text-center">
                <div className="text-xl sm:text-2xl font-bold text-white">{myPosts.length}</div>
                <div className="text-gray-400 text-xs sm:text-sm">작성한 게시글</div>
              </div>
              <div className="bg-gray-900 rounded-lg border border-gray-800 p-3 sm:p-4 text-center">
                <div className="text-xl sm:text-2xl font-bold text-blue-400">
                  {myPosts.reduce((sum, post) => sum + (post.likes?.length || 0), 0)}
                </div>
                <div className="text-gray-400 text-xs sm:text-sm">받은 좋아요</div>
              </div>
              <div className="bg-gray-900 rounded-lg border border-gray-800 p-3 sm:p-4 text-center col-span-2 lg:col-span-1">
                <div className="text-xl sm:text-2xl font-bold text-green-400">
                  {myPosts.reduce((sum, post) => sum + (post.commentCount || 0), 0)}
                </div>
                <div className="text-gray-400 text-xs sm:text-sm">받은 댓글</div>
              </div>
            </div>
          </div>

          {/* 내가 쓴 글 목록 */}
          <div className="bg-gray-900 rounded-lg border border-gray-800">
            <div className="p-4 sm:p-6 border-b border-gray-800">
              <h2 className="text-lg sm:text-xl font-semibold text-white">내가 쓴 글</h2>
            </div>
            
            {loading ? (
              <div className="p-6 sm:p-8 text-center text-gray-400">로딩 중...</div>
            ) : myPosts.length === 0 ? (
              <div className="p-6 sm:p-8 text-center text-gray-400">
                <Calendar className="h-12 w-12 sm:h-16 sm:w-16 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg sm:text-xl font-medium text-gray-300 mb-2">작성한 게시글이 없습니다</h3>
                <p className="mb-4 text-sm sm:text-base">첫 번째 게시글을 작성해보세요!</p>
                <Link 
                  href="/posts/create"
                  className="bg-blue-500 text-white px-4 sm:px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors inline-block text-sm sm:text-base"
                >
                  글 쓰기
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-gray-800">
                {myPosts.map((post) => (
                  <Link key={post.id} href={`/posts/${post.id}`}>
                    <div className="p-4 sm:p-6 hover:bg-gray-800/50 transition-colors">
                      <div className="flex flex-col space-y-3">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-base sm:text-lg font-medium text-white mb-2 break-words">
                            {post.title}
                          </h3>
                          
                          {post.content && (
                            <p className="text-gray-400 text-xs sm:text-sm mb-3 line-clamp-2">
                              <span className="sm:hidden">
                                {post.content.length > 60 ? `${post.content.substring(0, 60)}...` : post.content}
                              </span>
                              <span className="hidden sm:inline">
                                {post.content.length > 100 ? `${post.content.substring(0, 100)}...` : post.content}
                              </span>
                            </p>
                          )}
                          
                          <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-500">
                            <div className="flex items-center space-x-1">
                              <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
                              <span className="hidden sm:inline">{formatDate(post.createdAt)}</span>
                              <span className="sm:hidden">{new Date(post.createdAt).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Heart className="h-3 w-3 sm:h-4 sm:w-4" />
                              <span>{post.likes?.length || 0}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <MessageCircle className="h-3 w-3 sm:h-4 sm:w-4" />
                              <span>{post.commentCount || 0}</span>
                            </div>
                            {post.viewCount !== undefined && (
                              <div className="flex items-center space-x-1">
                                <Eye className="h-3 w-3 sm:h-4 sm:w-4" />
                                <span>{post.viewCount}</span>
                              </div>
                            )}
                          </div>
                          
                          {post.category && (
                            <div className="mt-2">
                              <span className="bg-blue-500/20 text-blue-400 text-xs px-2 py-1 rounded">
                                {post.category}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* 빠른 액션 */}
          <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row justify-center space-y-3 sm:space-y-0 sm:space-x-4">
            <Link 
              href="/posts/create"
              className="bg-blue-500 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg hover:bg-blue-600 transition-colors text-center text-sm sm:text-base"
            >
              새 글 쓰기
            </Link>
            <Link 
              href="/posts"
              className="border border-gray-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg hover:bg-gray-800 transition-colors text-center text-sm sm:text-base"
            >
              전체 게시글 보기
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}