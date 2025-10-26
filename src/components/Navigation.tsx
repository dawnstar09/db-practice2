'use client';

import { useState } from 'react';
import { useAuth } from './AuthProvider';
import NotificationDropdown from './NotificationDropdown';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { Menu, X, MessageSquare, FileText, Home, LogOut, User, Search } from 'lucide-react';

export default function Navigation() {
  const { user } = useAuth();
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      router.push('/auth/login');
      setIsMenuOpen(false);
    } catch (error) {
      console.error('로그아웃 오류:', error);
    }
  };

  return (
    <nav className="bg-black/95 backdrop-blur-sm border-b border-gray-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* 로고 */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="bg-blue-600 w-8 h-8 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">게</span>
            </div>
            <span className="text-white font-bold text-xl">게시판</span>
          </Link>

          {/* 데스크톱 메뉴 */}
          <div className="hidden md:flex items-center space-x-8">
            <Link
              href="/"
              className="flex items-center space-x-1 text-gray-300 hover:text-white transition-colors"
            >
              <Home className="h-4 w-4" />
              <span>홈</span>
            </Link>
            <Link
              href="/posts"
              className="flex items-center space-x-1 text-gray-300 hover:text-white transition-colors"
            >
              <FileText className="h-4 w-4" />
              <span>전체글</span>
            </Link>
            {user && (
              <Link
                href="/chat"
                className="flex items-center space-x-1 text-gray-300 hover:text-white transition-colors"
              >
                <MessageSquare className="h-4 w-4" />
                <span>채팅</span>
              </Link>
            )}
          </div>

          {/* 검색바 */}
          <div className="hidden md:flex flex-1 max-w-lg mx-8">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="게시글, 작성자 검색..."
                className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* 사용자 메뉴 */}
          <div className="flex items-center space-x-4">
            {user ? (
              <>
                {/* 알림 */}
                <NotificationDropdown />
                
                {/* 사용자 프로필 */}
                <div className="relative">
                  <button
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    className="flex items-center space-x-2 text-gray-300 hover:text-white transition-colors bg-gray-800 px-3 py-2 rounded-lg"
                  >
                    <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                      <User className="h-4 w-4 text-white" />
                    </div>
                    <span className="hidden sm:block font-medium">{user.displayName || user.email}</span>
                  </button>

                  {/* 드롭다운 메뉴 */}
                  {isMenuOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50">
                      <div className="py-2">
                        <div className="px-4 py-2 border-b border-gray-700">
                          <p className="text-white font-medium">{user.displayName || '사용자'}</p>
                          <p className="text-gray-400 text-sm">{user.email}</p>
                        </div>
                        <Link
                          href="/posts/new"
                          className="block px-4 py-2 text-gray-300 hover:text-white hover:bg-gray-700 transition-colors"
                          onClick={() => setIsMenuOpen(false)}
                        >
                          글 쓰기
                        </Link>
                        <Link
                          href="/notifications"
                          className="block px-4 py-2 text-gray-300 hover:text-white hover:bg-gray-700 transition-colors"
                          onClick={() => setIsMenuOpen(false)}
                        >
                          알림 설정
                        </Link>
                        <button
                          onClick={handleSignOut}
                          className="w-full text-left px-4 py-2 text-gray-300 hover:text-white hover:bg-gray-700 transition-colors flex items-center space-x-2"
                        >
                          <LogOut className="h-4 w-4" />
                          <span>로그아웃</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-4">
                <Link
                  href="/auth/login"
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  로그인
                </Link>
                <Link
                  href="/auth/signup"
                  className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
                >
                  회원가입
                </Link>
              </div>
            )}

            {/* 모바일 메뉴 버튼 */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden text-gray-300 hover:text-white"
            >
              {isMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>

        {/* 모바일 메뉴 */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-gray-800">
            <div className="py-4 space-y-2">
              {/* 검색바 */}
              <div className="px-4 pb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <input
                    type="text"
                    placeholder="게시글, 작성자 검색..."
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <Link
                href="/"
                className="block px-4 py-2 text-gray-300 hover:text-white hover:bg-gray-800 transition-colors flex items-center space-x-2"
                onClick={() => setIsMenuOpen(false)}
              >
                <Home className="h-4 w-4" />
                <span>홈</span>
              </Link>
              <Link
                href="/posts"
                className="block px-4 py-2 text-gray-300 hover:text-white hover:bg-gray-800 transition-colors flex items-center space-x-2"
                onClick={() => setIsMenuOpen(false)}
              >
                <FileText className="h-4 w-4" />
                <span>전체글</span>
              </Link>
              {user && (
                <>
                  <Link
                    href="/chat"
                    className="block px-4 py-2 text-gray-300 hover:text-white hover:bg-gray-800 transition-colors flex items-center space-x-2"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <MessageSquare className="h-4 w-4" />
                    <span>채팅</span>
                  </Link>
                  <Link
                    href="/posts/new"
                    className="block px-4 py-2 text-gray-300 hover:text-white hover:bg-gray-800 transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    글 쓰기
                  </Link>
                  <Link
                    href="/notifications"
                    className="block px-4 py-2 text-gray-300 hover:text-white hover:bg-gray-800 transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    알림
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}