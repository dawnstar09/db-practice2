'use client';

import { useAuth } from '../../../components/AuthProvider';
import { useEffect, useState, useRef } from 'react';
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  doc, 
  updateDoc,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { ChatMessage, ChatRoom } from '../../../../types';
import { useParams, useRouter } from 'next/navigation';
import { Send, ArrowLeft, MoreVertical } from 'lucide-react';

export default function ChatRoomPage() {
  const { user } = useAuth();
  const params = useParams();
  const router = useRouter();
  const roomId = params.id as string;
  
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatRoom, setChatRoom] = useState<ChatRoom | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!user || !roomId) return;

    const markMessagesAsRead = async () => {
      try {
        const roomRef = doc(db, 'chatRooms', roomId);
        await updateDoc(roomRef, {
          [`unreadCount.${user.uid}`]: 0
        });
      } catch (error) {
        console.error('메시지 읽음 처리 중 오류:', error);
      }
    };

    // 채팅방 정보 가져오기
    const roomRef = doc(db, 'chatRooms', roomId);
    const unsubscribeRoom = onSnapshot(roomRef, (doc) => {
      if (doc.exists()) {
        setChatRoom({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate(),
          lastMessageTime: doc.data().lastMessageTime?.toDate(),
        } as ChatRoom);
      }
      setLoading(false);
    });

    // 메시지 가져오기
    const messagesQuery = query(
      collection(db, 'chatRooms', roomId, 'messages'),
      orderBy('createdAt', 'asc')
    );

    const unsubscribeMessages = onSnapshot(messagesQuery, (snapshot) => {
      const messageList: ChatMessage[] = [];
      snapshot.forEach((doc) => {
        messageList.push({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate(),
        } as ChatMessage);
      });
      setMessages(messageList);

      // 읽지 않은 메시지를 읽음으로 표시
      if (messageList.length > 0) {
        markMessagesAsRead();
      }
    });

    return () => {
      unsubscribeRoom();
      unsubscribeMessages();
    };
  }, [user, roomId]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user || !roomId) return;

    try {
      // 메시지 추가
      await addDoc(collection(db, 'chatRooms', roomId, 'messages'), {
        senderId: user.uid,
        senderName: user.displayName || user.email,
        content: newMessage.trim(),
        createdAt: serverTimestamp(),
        isRead: false
      });

      // 채팅방 정보 업데이트
      const roomRef = doc(db, 'chatRooms', roomId);
      const updates: { [key: string]: unknown } = {
        lastMessage: newMessage.trim(),
        lastMessageTime: serverTimestamp()
      };

      // 다른 참가자들의 읽지 않은 메시지 수 증가
      if (chatRoom) {
        chatRoom.participants.forEach(participantId => {
          if (participantId !== user.uid) {
            updates[`unreadCount.${participantId}`] = (chatRoom.unreadCount?.[participantId] || 0) + 1;
          }
        });
      }

      await updateDoc(roomRef, updates);
      setNewMessage('');
    } catch (error) {
      console.error('메시지 전송 중 오류:', error);
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('ko-KR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getOtherParticipantName = () => {
    if (!user || !chatRoom) return '';
    const otherParticipantId = chatRoom.participants.find((id: string) => id !== user.uid);
    return otherParticipantId ? chatRoom.participantNames[otherParticipantId] || '알 수 없음' : '';
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl mb-4">로그인이 필요합니다</h1>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!chatRoom) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl mb-4">채팅방을 찾을 수 없습니다</h1>
          <button 
            onClick={() => router.back()}
            className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-lg transition-colors"
          >
            돌아가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-black text-white flex flex-col">
      {/* 헤더 */}
      <div className="bg-gray-900/50 backdrop-blur-sm border-b border-gray-800 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                <span className="text-white font-semibold">
                  {getOtherParticipantName().charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <h1 className="text-lg font-semibold">{getOtherParticipantName()}</h1>
                <p className="text-sm text-gray-400">온라인</p>
              </div>
            </div>
          </div>
          
          <button className="p-2 hover:bg-gray-800 rounded-lg transition-colors">
            <MoreVertical className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* 메시지 영역 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-500">메시지를 주고받아보세요!</p>
          </div>
        ) : (
          messages.map((message) => {
            const isMyMessage = message.senderId === user.uid;
            
            return (
              <div
                key={message.id}
                className={`flex ${isMyMessage ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-xs lg:max-w-md ${isMyMessage ? 'order-2' : 'order-1'}`}>
                  <div
                    className={`px-4 py-2 rounded-2xl ${
                      isMyMessage
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-800 text-white'
                    }`}
                  >
                    <p className="text-sm">{message.content}</p>
                  </div>
                  
                  <p className={`text-xs text-gray-500 mt-1 ${
                    isMyMessage ? 'text-right' : 'text-left'
                  }`}>
                    {formatTime(message.createdAt)}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* 메시지 입력 영역 */}
      <div className="bg-gray-900/50 backdrop-blur-sm border-t border-gray-800 p-4">
        <form onSubmit={sendMessage} className="flex items-center space-x-4">
          <div className="flex-1">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="메시지를 입력하세요..."
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-full 
                       text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
            />
          </div>
          
          <button
            type="submit"
            disabled={!newMessage.trim()}
            className="p-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 
                     disabled:cursor-not-allowed rounded-full transition-colors"
          >
            <Send className="h-5 w-5" />
          </button>
        </form>
      </div>
    </div>
  );
}