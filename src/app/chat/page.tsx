 'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/components/AuthProvider';
import Link from 'next/link';
import { collection, query, orderBy, limit, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { ChatMessage } from '../../../types';
import { Send, ArrowLeft, MessageCircle } from 'lucide-react';

export default function ChatPage() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;

    // globalChat 컬렉션을 구독 (최신 200개)
    const q = query(
      collection(db, 'globalChat'),
      orderBy('createdAt', 'desc'),
      limit(200)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const chatMsgs: ChatMessage[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as any),
        createdAt: (doc.data() as any).createdAt?.toDate?.() || new Date(),
      } as ChatMessage));

      // 오래된 것부터 보여주기 위해 역순 정렬
      chatMsgs.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
      setMessages(chatMsgs);
      setLoading(false);
    }, (error) => {
      console.error('채팅 구독 오류:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    // 새 메시지 수신 시 하단으로 스크롤
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!user || !newMessage.trim() || sending) return;

    setSending(true);
    try {
      await addDoc(collection(db, 'globalChat'), {
        senderId: user.uid,
        senderName: user.displayName || user.email,
        content: newMessage.trim(),
        createdAt: serverTimestamp(),
      });

      setNewMessage('');
    } catch (err) {
      console.error('메시지 전송 실패:', err);
      alert('메시지 전송에 실패했습니다.');
    } finally {
      setSending(false);
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (date: Date) => {
    const today = new Date();
    const msgDate = new Date(date);
    if (msgDate.toDateString() === today.toDateString()) return '오늘';
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (msgDate.toDateString() === yesterday.toDateString()) return '어제';
    return msgDate.toLocaleDateString('ko-KR');
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-4">로그인이 필요합니다</h2>
          <Link href="/auth/login" className="text-blue-400 hover:text-blue-300">로그인 페이지로 이동</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      {/* 간단한 헤더 */}
      <div className="bg-gray-900 border-b border-gray-800 p-3">
        <div className="flex items-center justify-center">
          <Link href="/" className="absolute left-4 text-gray-300 hover:text-white transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-lg font-bold text-white">전체 채팅</h1>
        </div>
      </div>

      {/* 메시지 영역 */}
      <div className="p-4 space-y-4 pb-32">
            {loading ? (
              <div className="text-center text-gray-400 py-8">메시지를 불러오는 중...</div>
            ) : messages.length === 0 ? (
              <div className="text-center text-gray-400 py-8">
                <MessageCircle className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg">첫 번째 메시지를 보내보세요!</p>
              </div>
            ) : (
              <>
                {messages.map((message, idx) => {
                  const isMine = message.senderId === user.uid;
                  const prev = idx > 0 ? messages[idx - 1] : null;
                  const showDate = !prev || formatDate(message.createdAt) !== formatDate(prev.createdAt);

                  return (
                    <div key={message.id}>
                      {showDate && (
                        <div className="text-center my-4">
                          <span className="bg-gray-800 text-gray-400 px-3 py-1 rounded-full text-sm">{formatDate(message.createdAt)}</span>
                        </div>
                      )}

                      <div className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-xs lg:max-w-md ${isMine ? 'order-2' : 'order-1'}`}>
                          {!isMine && (
                            <div className="text-sm text-gray-400 mb-1 px-3">{message.senderName}</div>
                          )}
                          <div className={`px-4 py-2 rounded-2xl ${isMine ? 'bg-blue-500 text-white' : 'bg-gray-800 text-white'}`}>
                            <p className="whitespace-pre-wrap break-words">{message.content}</p>
                          </div>
                          <div className={`text-xs text-gray-500 mt-1 px-3 ${isMine ? 'text-right' : 'text-left'}`}>{formatTime(message.createdAt)}</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </>
            )}
        <div ref={messagesEndRef} />
      </div>

      {/* 하단 고정 입력영역 */}
      <div className="fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-800 p-4 z-10">
        <div className="max-w-4xl mx-auto">
          <form onSubmit={sendMessage} className="flex space-x-3">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="메시지를 입력하세요..."
              className="flex-1 bg-gray-800 border border-gray-700 text-white px-4 py-3 rounded-lg focus:outline-none focus:border-blue-500"
              disabled={sending}
              maxLength={500}
            />
            <button
              type="submit"
              disabled={!newMessage.trim() || sending}
              className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-700 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg transition-colors flex items-center space-x-2"
            >
              <Send className="h-4 w-4" />
              {!sending && <span>전송</span>}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
