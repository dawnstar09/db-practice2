import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export const createNotification = async (
  userId: string,
  type: 'like' | 'comment',
  postId: string,
  postTitle: string,
  actorId: string,
  actorName: string,
  commentContent?: string
) => {
  try {
    // 자신의 게시글에 자신이 액션을 취한 경우 알림을 생성하지 않음
    if (userId === actorId) return;

    let message = '';
    if (type === 'like') {
      message = `${actorName}님이 회원님의 게시글을 좋아합니다`;
    } else if (type === 'comment') {
      message = `${actorName}님이 회원님의 게시글에 댓글을 달았습니다`;
    }

    await addDoc(collection(db, 'notifications'), {
      userId,
      type,
      postId,
      postTitle,
      actorId,
      actorName,
      message,
      isRead: false,
      createdAt: serverTimestamp(),
      commentContent: commentContent || null,
    });
  } catch (error) {
    console.error('Error creating notification:', error);
  }
};