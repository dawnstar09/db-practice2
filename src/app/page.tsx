'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthProvider';
import Link from 'next/link';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Post } from '../../types';
import { Heart, Eye, TrendingUp, Clock } from 'lucide-react';

export default function Home() {
  const { user } = useAuth();
  const [popularPosts, setPopularPosts] = useState<Post[]>([]);
  const [recentPosts, setRecentPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        // 인기글 (좋아요 많은 순)
        const postsQuery = query(
          collection(db, 'posts'),
          orderBy('createdAt', 'desc'),
          limit(50)
        );
        const querySnapshot = await getDocs(postsQuery);
        const allPosts = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date(),
          updatedAt: doc.data().updatedAt?.toDate() || new Date(),
          likes: doc.data().likes || [],
          attachments: doc.data().attachments || [],
        })) as Post[];

        // 좋아요 수로 정렬하여 인기글 추출
        const popular = allPosts
          .sort((a, b) => (b.likes?.length || 0) - (a.likes?.length || 0))
          .slice(0, 6);
        
        // 최신글 추출
        const recent = allPosts
          .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
          .slice(0, 6);

        setPopularPosts(popular);
        setRecentPosts(recent);
      } catch (error) {
        console.error('게시글 로딩 오류:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, []);

  const formatDate = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (hours < 1) return '방금 전';
    if (hours < 24) return `${hours}시간 전`;
    if (days < 7) return `${days}일 전`;
    return date.toLocaleDateString('ko-KR');
  };

  return (
    <div className="min-h-screen bg-black">
      {/* 메인 섹션 */}
      <div className="pt-12 pb-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* 헤더 */}
          <div className="text-center mb-12">
            <h1 className="text-3xl font-bold text-white mb-4">자유 게시판</h1>
            <p className="text-gray-400">모든 사람이 자유롭게 소통할 수 있는 공간입니다</p>
            
            {!user && (
              <div className="flex gap-4 justify-center mt-8">
                <Link 
                  href="/auth/login" 
                  className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors"
                >
                  로그인
                </Link>
                <Link 
                  href="/auth/signup" 
                  className="border border-blue-400 text-blue-400 px-6 py-3 rounded-lg hover:bg-blue-500 hover:text-white transition-colors"
                >
                  회원가입
                </Link>
              </div>
            )}
          </div>

          {loading ? (
            <div className="text-center text-gray-400 py-12">
              로딩 중...
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* 인기글 섹션 */}
              <div className="bg-gray-900 rounded-lg border border-gray-800">
                <div className="p-6 border-b border-gray-800">
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="h-5 w-5 text-blue-400" />
                    <h2 className="text-xl font-semibold text-white">인기글</h2>
                  </div>
                </div>
                <div className="divide-y divide-gray-800">
                  {popularPosts.length === 0 ? (
                    <div className="p-6 text-center text-gray-400">
                      아직 게시글이 없습니다
                    </div>
                  ) : (
                    popularPosts.map((post, index) => (
                      <Link key={post.id} href={`/posts/${post.id}`}>
                        <div className="p-4 hover:bg-gray-800/50 transition-colors">
                          <div className="flex items-start space-x-3">
                            <div className="bg-blue-500 text-white text-xs font-bold px-2 py-1 rounded flex-shrink-0">
                              {index + 1}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="text-white font-medium truncate">{post.title}</h3>
                              <div className="flex items-center space-x-4 mt-2 text-sm text-gray-400">
                                <span>{post.authorName}</span>
                                <div className="flex items-center space-x-1">
                                  <Heart className="h-3 w-3" />
                                  <span>{post.likes?.length || 0}</span>
                                </div>
                                <div className="flex items-center space-x-1">
                                  <Eye className="h-3 w-3" />
                                  <span>{post.viewCount || 0}</span>
                                </div>
                                <span>{formatDate(post.createdAt)}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))
                  )}
                </div>
                <div className="p-4 border-t border-gray-800 text-center">
                  <Link 
                    href="/posts" 
                    className="text-blue-400 hover:text-blue-300 text-sm"
                  >
                    더 많은 인기글 보기 →
                  </Link>
                </div>
              </div>

              {/* 최신글 섹션 */}
              <div className="bg-gray-900 rounded-lg border border-gray-800">
                <div className="p-6 border-b border-gray-800">
                  <div className="flex items-center space-x-2">
                    <Clock className="h-5 w-5 text-blue-500" />
                    <h2 className="text-xl font-semibold text-white">최신글</h2>
                  </div>
                </div>
                <div className="divide-y divide-gray-800">
                  {recentPosts.length === 0 ? (
                    <div className="p-6 text-center text-gray-400">
                      아직 게시글이 없습니다
                    </div>
                  ) : (
                    recentPosts.map((post) => (
                      <Link key={post.id} href={`/posts/${post.id}`}>
                        <div className="p-4 hover:bg-gray-800/50 transition-colors">
                          <h3 className="text-white font-medium mb-2 truncate">{post.title}</h3>
                          <div className="flex items-center space-x-4 text-sm text-gray-400">
                            <span>{post.authorName}</span>
                            <div className="flex items-center space-x-1">
                              <Heart className="h-3 w-3" />
                              <span>{post.likes?.length || 0}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Eye className="h-3 w-3" />
                              <span>{post.viewCount || 0}</span>
                            </div>
                            <span>{formatDate(post.createdAt)}</span>
                          </div>
                        </div>
                      </Link>
                    ))
                  )}
                </div>
                <div className="p-4 border-t border-gray-800 text-center">
                  <Link 
                    href="/posts" 
                    className="text-blue-400 hover:text-blue-300 text-sm"
                  >
                    모든 게시글 보기 →
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* 빠른 액션 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-12">
            <Link 
              href="/posts/create" 
              className="bg-blue-500 text-white p-6 rounded-lg hover:bg-blue-600 transition-colors text-center"
            >
              <h3 className="font-semibold mb-2">글 쓰기</h3>
              <p className="text-blue-100 text-sm">새로운 글을 작성해보세요</p>
            </Link>
            <Link 
              href="/chat" 
              className="bg-blue-600 text-white p-6 rounded-lg hover:bg-blue-700 transition-colors text-center"
            >
              <h3 className="font-semibold mb-2">실시간 채팅</h3>
              <p className="text-blue-100 text-sm">다른 사용자들과 대화해보세요</p>
            </Link>
            <Link 
              href="/posts" 
              className="bg-slate-600 text-white p-6 rounded-lg hover:bg-slate-700 transition-colors text-center"
            >
              <h3 className="font-semibold mb-2">전체 게시글</h3>
              <p className="text-slate-100 text-sm">모든 게시글을 둘러보세요</p>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}