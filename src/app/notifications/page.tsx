'use client';

import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/components/AuthProvider';
import { Notification } from '../../../types';
import { Bell, Heart, MessageCircle, Trash2, Check, CheckCheck, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function NotificationsPage() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  useEffect(() => {
    if (!user) return;

    const notificationsQuery = query(
      collection(db, 'notifications'),
      where('userId', '==', user.uid)
    );

    const unsubscribe = onSnapshot(notificationsQuery, (snapshot) => {
      const notifs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
      })) as Notification[];
      
      // 클라이언트 측에서 정렬
      notifs.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      
      setNotifications(notifs);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const markAsRead = async (notificationId: string) => {
    try {
      await updateDoc(doc(db, 'notifications', notificationId), {
        isRead: true
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      await deleteDoc(doc(db, 'notifications', notificationId));
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const markAllAsRead = async () => {
    const unreadNotifications = notifications.filter(n => !n.isRead);
    
    try {
      await Promise.all(
        unreadNotifications.map(notification =>
          updateDoc(doc(db, 'notifications', notification.id), {
            isRead: true
          })
        )
      );
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const deleteAllRead = async () => {
    const readNotifications = notifications.filter(n => n.isRead);
    
    try {
      await Promise.all(
        readNotifications.map(notification =>
          deleteDoc(doc(db, 'notifications', notification.id))
        )
      );
    } catch (error) {
      console.error('Error deleting read notifications:', error);
    }
  };

  const formatTimeAgo = (date: Date) => {
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

  const filteredNotifications = filter === 'all' 
    ? notifications 
    : notifications.filter(n => !n.isRead);

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
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 헤더 */}
        <div className="mb-8">
          <Link
            href="/posts"
            className="inline-flex items-center text-gray-400 hover:text-white mb-4 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            게시글 목록으로 돌아가기
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white">알림</h1>
              <p className="text-gray-400 mt-2">회원님의 모든 알림을 확인하세요</p>
            </div>
            
            <div className="flex items-center space-x-4">
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as 'all' | 'unread')}
                className="bg-gray-800 border border-gray-700 text-white px-3 py-2 rounded-lg"
              >
                <option value="all">전체 알림</option>
                <option value="unread">읽지 않은 알림</option>
              </select>
              
              {notifications.some(n => !n.isRead) && (
                <button
                  onClick={markAllAsRead}
                  className="flex items-center space-x-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  <CheckCheck className="h-4 w-4" />
                  <span>모두 읽음</span>
                </button>
              )}
              
              {notifications.some(n => n.isRead) && (
                <button
                  onClick={deleteAllRead}
                  className="flex items-center space-x-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                  <span>읽은 알림 삭제</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* 알림 목록 */}
        <div className="bg-gray-900 rounded-lg border border-gray-800">
          {loading ? (
            <div className="p-8 text-center text-gray-400">로딩 중...</div>
          ) : filteredNotifications.length === 0 ? (
            <div className="p-8 text-center text-gray-400">
              <Bell className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <h3 className="text-xl font-medium text-gray-300 mb-2">
                {filter === 'unread' ? '읽지 않은 알림이 없습니다' : '알림이 없습니다'}
              </h3>
              <p>새로운 활동이 있으면 알림을 받게 됩니다</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-800">
              {filteredNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-6 hover:bg-gray-800/50 transition-colors ${
                    !notification.isRead ? 'bg-blue-600/5 border-l-4 border-l-blue-500' : ''
                  }`}
                >
                  <div className="flex items-start space-x-4">
                    {/* 아이콘 */}
                    <div className={`p-3 rounded-full ${
                      notification.type === 'like' 
                        ? 'bg-red-600/20 text-red-400' 
                        : 'bg-blue-600/20 text-blue-400'
                    }`}>
                      {notification.type === 'like' ? (
                        <Heart className="h-5 w-5" />
                      ) : (
                        <MessageCircle className="h-5 w-5" />
                      )}
                    </div>

                    {/* 내용 */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="text-white">
                            <span className="font-medium text-blue-400">
                              {notification.actorName}
                            </span>
                            {notification.type === 'like' 
                              ? '님이 회원님의 게시글을 좋아합니다' 
                              : '님이 회원님의 게시글에 댓글을 달았습니다'
                            }
                          </p>
                          
                          <Link href={`/posts/${notification.postId}`}>
                            <p className="text-gray-400 mt-1 hover:text-blue-400 cursor-pointer">
                              &quot;{notification.postTitle}&quot;
                            </p>
                          </Link>

                          {notification.commentContent && (
                            <div className="mt-3 bg-gray-800 p-3 rounded-lg">
                              <p className="text-gray-300 text-sm">
                                {notification.commentContent}
                              </p>
                            </div>
                          )}

                          <p className="text-gray-500 text-sm mt-3">
                            {formatTimeAgo(notification.createdAt)}
                          </p>
                        </div>

                        {/* 액션 버튼들 */}
                        <div className="flex items-center space-x-2 ml-4">
                          {!notification.isRead && (
                            <button
                              onClick={() => markAsRead(notification.id)}
                              className="flex items-center space-x-1 text-gray-400 hover:text-blue-400 px-3 py-1 rounded transition-colors"
                              title="읽음으로 표시"
                            >
                              <Check className="h-4 w-4" />
                              <span className="text-sm">읽음</span>
                            </button>
                          )}
                          <button
                            onClick={() => deleteNotification(notification.id)}
                            className="flex items-center space-x-1 text-gray-400 hover:text-red-400 px-3 py-1 rounded transition-colors"
                            title="알림 삭제"
                          >
                            <Trash2 className="h-4 w-4" />
                            <span className="text-sm">삭제</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}