'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import Link from 'next/link';
import { Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push('/posts');
    } catch (error: unknown) {
      console.error('Login error:', error);
      const firebaseError = error as { code?: string };
      switch (firebaseError.code) {
        case 'auth/user-not-found':
          setError('등록되지 않은 이메일입니다.');
          break;
        case 'auth/wrong-password':
          setError('비밀번호가 올바르지 않습니다.');
          break;
        case 'auth/invalid-email':
          setError('유효하지 않은 이메일 형식입니다.');
          break;
        case 'auth/too-many-requests':
          setError('너무 많은 시도로 인해 잠시 후 다시 시도해주세요.');
          break;
        default:
          setError('로그인 중 오류가 발생했습니다.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex">
      {/* 좌측 영역 */}
      <div className="flex-1 flex items-center justify-center px-8">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">로그인</h1>
            <p className="text-gray-400">계정에 로그인하여 커뮤니티에 참여하세요</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-900/20 border border-red-500 text-red-400 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                이메일
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="이메일을 입력하세요"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                비밀번호
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-12"
                  placeholder="비밀번호를 입력하세요"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? '로그인 중...' : '로그인'}
            </button>

            <div className="text-center">
              <span className="text-gray-400">계정이 없으신가요? </span>
              <Link href="/auth/signup" className="text-blue-400 hover:text-blue-300 font-medium">
                회원가입
              </Link>
            </div>
          </form>
        </div>
      </div>

      {/* 우측 영역 */}
      <div className="flex-1 bg-blue-600 flex items-center justify-center p-8">
        <div className="text-center text-white">
          <h2 className="text-4xl font-bold mb-6">환영합니다!</h2>
          <p className="text-xl mb-8 text-blue-100">
            커뮤니티에서 다양한 사람들과 소통하고<br />
            새로운 아이디어를 공유해보세요
          </p>
          <div className="grid grid-cols-2 gap-6 text-left">
            <div>
              <h3 className="font-semibold mb-2">💬 활발한 토론</h3>
              <p className="text-blue-100 text-sm">다양한 주제로 활발한 토론에 참여하세요</p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">🚀 최신 트렌드</h3>
              <p className="text-blue-100 text-sm">개발 트렌드와 새로운 기술을 함께 알아가요</p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">🤝 네트워킹</h3>
              <p className="text-blue-100 text-sm">같은 관심사를 가진 사람들과 연결되세요</p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">📚 지식 공유</h3>
              <p className="text-blue-100 text-sm">경험과 지식을 나누며 함께 성장해요</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}