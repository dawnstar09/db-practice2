'use client';

import Link from 'next/link';
import { useAuth } from './AuthProvider';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { Search, MessageCircle } from 'lucide-react';
import NotificationDropdown from './NotificationDropdown';

export default function Navbar() {
  const { user } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-black/40 via-gray-900/30 to-black/40 backdrop-blur-xl border-b border-gray-700/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-8">
            <Link href="/" className="text-white text-xl font-bold drop-shadow-lg">
              게시판
            </Link>
            <div className="hidden md:flex space-x-6">
              <Link href="/posts" className="text-gray-300 hover:text-white transition-colors">
                전체글
              </Link>
              <Link href="/posts" className="text-gray-300 hover:text-white transition-colors">
                인기글
              </Link>
              <Link href="/posts" className="text-gray-300 hover:text-white transition-colors">
                공지사항
              </Link>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {/* 검색바 */}
            <div className="relative hidden sm:block">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                className="w-64 pl-10 pr-4 py-2 bg-gray-800/50 border border-gray-700/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/70 focus:border-transparent backdrop-blur-sm"
                placeholder="검색..."
              />
            </div>

            {user ? (
              <div className="flex items-center space-x-4">
                <NotificationDropdown />
                <Link href="/chat" className="text-gray-300 hover:text-white transition-colors">
                  <MessageCircle className="h-5 w-5" />
                </Link>
                <div className="flex items-center space-x-3">
                  <Link href="/mypage">
                    <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center hover:bg-blue-500 transition-colors cursor-pointer">
                      <span className="text-white text-sm font-medium">
                        {user.displayName ? user.displayName.charAt(0) : user.email.charAt(0)}
                      </span>
                    </div>
                  </Link>
                  <button
                    onClick={handleSignOut}
                    className="text-gray-300 hover:text-white text-sm transition-colors"
                  >
                    로그아웃
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link 
                  href="/auth/login" 
                  className="text-gray-300 hover:text-white px-3 py-1.5 text-sm transition-colors"
                >
                  로그인
                </Link>
                <Link 
                  href="/auth/signup" 
                  className="bg-blue-600/80 hover:bg-blue-700/90 text-white px-3 py-1.5 rounded text-sm transition-all backdrop-blur-sm border border-blue-500/30"
                >
                  회원가입
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}