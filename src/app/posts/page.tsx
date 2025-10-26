'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { collection, query, orderBy, getDocs, limit, doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/components/AuthProvider';
import { Post } from '../../../types';
import { MessageCircle, User, Heart, Eye, Plus } from 'lucide-react';
import { createNotification } from '@/lib/notifications';

export default function PostsPage() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('전체');

  const categories = [
    '전체',
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
    const fetchPosts = async () => {
      try {
        const postsQuery = query(
          collection(db, 'posts'),
          orderBy('createdAt', 'desc'),
          limit(20)
        );
        const querySnapshot = await getDocs(postsQuery);
        const fetchedPosts = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date(),
          updatedAt: doc.data().updatedAt?.toDate() || new Date(),
          likes: doc.data().likes || [],
          attachments: doc.data().attachments || [],
          tags: doc.data().tags || [],
          viewCount: doc.data().viewCount || 0,
          category: doc.data().category || '일반',
        })) as Post[];
        setPosts(fetchedPosts);
      } catch (error) {
        console.error('Error fetching posts:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, []);

  // 카테고리별 필터링
  const filteredPosts = selectedCategory === '전체' 
    ? posts 
    : posts.filter(post => post.category === selectedCategory);

  const handleLike = async (postId: string, isLiked: boolean) => {
    if (!user) {
      alert('로그인이 필요합니다.');
      return;
    }

    try {
      const postRef = doc(db, 'posts', postId);
      if (isLiked) {
        await updateDoc(postRef, {
          likes: arrayRemove(user.uid)
        });
      } else {
        await updateDoc(postRef, {
          likes: arrayUnion(user.uid)
        });
      }

      // 로컬 상태 업데이트
      setPosts(prev => prev.map(post => {
        if (post.id === postId) {
          const newLikes = isLiked 
            ? post.likes.filter(uid => uid !== user.uid)
            : [...post.likes, user.uid];
          return { ...post, likes: newLikes };
        }
        return post;
      }));

      // 좋아요 추가 시 알림 생성
      if (!isLiked) {
        const post = posts.find(p => p.id === postId);
        if (post && post.authorId !== user.uid) {
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
      alert('좋아요 처리 중 오류가 발생했습니다.');
    }
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
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <div className="max-w-4xl mx-auto">
        {/* 헤더 */}
        <div className="bg-black border-b border-gray-800 px-6 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-white">자유 게시판</h1>
              <p className="text-gray-400 mt-1">다양한 주제로 소통하고 정보를 공유하세요</p>
            </div>
            <Link
              href="/posts/create"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-4 w-4 mr-2" />
              글쓰기
            </Link>
          </div>
        </div>

        {/* 사이드바와 메인 컨텐츠 */}
        <div className="flex">
          {/* 좌측 사이드바 */}
          <div className="w-80 bg-black border-r border-gray-800 min-h-screen">
            <div className="p-6">
              <div className="mb-8">
                <h3 className="text-white font-medium mb-4">공지사항</h3>
                <div className="space-y-3">
                  {posts.length > 0 ? (
                    <>
                      <div className="text-gray-400 text-sm">
                        {posts[0].title.length > 35 ? `${posts[0].title.substring(0, 35)}...` : posts[0].title}
                      </div>
                      {posts[0].tags && posts[0].tags.length > 0 && (
                        <div className="text-blue-400 text-sm">{posts[0].tags[0]}</div>
                      )}
                    </>
                  ) : (
                    <>
                      <div className="text-gray-400 text-sm">아직 게시글이 없습니다</div>
                      <div className="text-blue-400 text-sm">일반</div>
                    </>
                  )}
                </div>
              </div>

              <div className="mb-8">
                <h3 className="text-white font-medium mb-4">카테고리</h3>
                <div className="space-y-2">
                  {categories.map((category) => {
                    const count = category === '전체' 
                      ? posts.length 
                      : posts.filter(post => post.category === category).length;
                    
                    return (
                      <button
                        key={category}
                        onClick={() => setSelectedCategory(category)}
                        className={`w-full flex justify-between items-center p-2 rounded transition-colors ${
                          selectedCategory === category 
                            ? 'bg-blue-600/20 text-blue-400 border border-blue-600/30' 
                            : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                        }`}
                      >
                        <span className="text-sm"># {category}</span>
                        <span className="text-sm text-gray-500">{count}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <h3 className="text-white font-medium mb-4">인기 태그</h3>
                <div className="space-y-2">
                  {Array.from(new Set(posts.flatMap(post => post.tags || []))).slice(0, 5).map((tag, index) => (
                    <div key={index} className="text-blue-400 text-sm">#{tag}</div>
                  ))}
                  {Array.from(new Set(posts.flatMap(post => post.tags || []))).length === 0 && (
                    <div className="text-gray-500 text-sm">태그가 없습니다</div>
                  )}
                </div>
              </div>

              <div className="mt-8">
                <h3 className="text-white font-medium mb-4">인기글</h3>
                <div className="space-y-4">
                  {posts
                    .sort((a, b) => b.likes.length - a.likes.length)
                    .slice(0, 3)
                    .map((post) => (
                      <div key={post.id}>
                        <Link href={`/posts/${post.id}`}>
                          <div className="text-white text-sm font-medium mb-1 hover:text-blue-400 cursor-pointer">
                            {post.title.length > 30 ? `${post.title.substring(0, 30)}...` : post.title}
                          </div>
                        </Link>
                        <div className="text-gray-500 text-xs">{post.likes.length} 좋아요</div>
                      </div>
                    ))
                  }
                  {posts.length === 0 && (
                    <div className="text-gray-500 text-sm">게시글이 없습니다</div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* 메인 게시글 영역 */}
          <div className="flex-1 bg-black">
            {/* 카테고리 헤더 */}
            <div className="border-b border-gray-800 px-6 py-4">
              <h2 className="text-xl font-bold text-white">
                {selectedCategory} {selectedCategory !== '전체' && '게시글'}
              </h2>
              <p className="text-gray-400 text-sm mt-1">
                {filteredPosts.length}개의 게시글
              </p>
            </div>

            {filteredPosts.length === 0 ? (
              <div className="text-center py-12">
                <h3 className="text-lg font-medium text-gray-300 mb-2">
                  {selectedCategory === '전체' ? '아직 게시글이 없습니다' : `${selectedCategory} 게시글이 없습니다`}
                </h3>
                <p className="text-gray-400 mb-6">
                  {selectedCategory === '전체' ? '첫 번째 게시글을 작성해보세요!' : '이 카테고리의 첫 번째 게시글을 작성해보세요!'}
                </p>
                <Link
                  href="/posts/create"
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  새 글 작성하기
                </Link>
              </div>
            ) : (
              <div>
                {filteredPosts.map((post, index) => {
                  const isLiked = user ? post.likes.includes(user.uid) : false;
                  
                  return (
                    <div key={post.id} className={`border-b border-gray-800 p-6 hover:bg-gray-900/20 transition-colors ${index === 0 ? 'border-t-0' : ''}`}>
                      {/* 작성자 정보 */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                            <User className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <div className="text-white font-medium">{post.authorName}</div>
                            <div className="text-gray-400 text-sm">{formatDate(post.createdAt)}</div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-4 text-gray-400 text-sm">
                          <div className="flex items-center space-x-1">
                            <Eye className="h-4 w-4" />
                            <span>{post.viewCount || 0}</span>
                          </div>
                        </div>
                      </div>

                      {/* 카테고리 배지 */}
                      <div className="mb-3">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-600/20 text-blue-400 border border-blue-600/30">
                          {post.category || '일반'}
                        </span>
                      </div>

                      {/* 제목과 내용 */}
                      <Link href={`/posts/${post.id}`}>
                        <h2 className="text-xl font-semibold text-white mb-3 hover:text-blue-400 transition-colors cursor-pointer">
                          {post.title}
                        </h2>
                      </Link>
                      
                      <p className="text-gray-300 mb-4 leading-relaxed">
                        {post.content.length > 200 ? `${post.content.substring(0, 200)}...` : post.content}
                      </p>

                      {/* 태그 */}
                      {post.tags && post.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-4">
                          {post.tags.map((tag, tagIndex) => (
                            <span key={tagIndex} className="text-blue-400 text-sm">
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* 액션 버튼들 */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-6">
                          <button
                            onClick={() => handleLike(post.id, isLiked)}
                            className={`flex items-center space-x-1 transition-all duration-200 transform hover:scale-105 ${
                              isLiked 
                                ? 'text-red-500 hover:text-red-400' 
                                : 'text-gray-400 hover:text-red-500'
                            }`}
                            disabled={!user}
                            title={!user ? "로그인이 필요합니다" : isLiked ? "좋아요 취소" : "좋아요"}
                          >
                            <Heart className={`h-4 w-4 transition-all duration-200 ${isLiked ? 'fill-current scale-110' : ''}`} />
                            <span>{post.likes.length}</span>
                          </button>
                          
                          <Link
                            href={`/posts/${post.id}`}
                            className="flex items-center space-x-1 text-gray-400 hover:text-blue-400 transition-colors"
                          >
                            <MessageCircle className="h-4 w-4" />
                            <span>{post.commentCount || 0}</span>
                          </Link>
                        </div>

                        <Link
                          href={`/posts/${post.id}`}
                          className="text-blue-400 hover:text-blue-300 text-sm transition-colors"
                        >
                          자세히 보기
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}