import { 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from './firebase';

export const createOrGetChatRoom = async (currentUserId: string, currentUserName: string, targetUserId: string, targetUserName: string): Promise<string> => {
  try {
    // 기존 채팅방이 있는지 확인
    const chatRoomsRef = collection(db, 'chatRooms');
    const q = query(
      chatRoomsRef,
      where('participants', 'array-contains', currentUserId)
    );
    
    const querySnapshot = await getDocs(q);
    
    for (const docSnapshot of querySnapshot.docs) {
      const data = docSnapshot.data();
      if (data.participants.includes(targetUserId)) {
        return docSnapshot.id;
      }
    }

    // 새 채팅방 생성
    const newChatRoom = {
      participants: [currentUserId, targetUserId],
      participantNames: {
        [currentUserId]: currentUserName,
        [targetUserId]: targetUserName
      },
      unreadCount: {
        [currentUserId]: 0,
        [targetUserId]: 0
      },
      createdAt: serverTimestamp()
    };

    const docRef = await addDoc(chatRoomsRef, newChatRoom);
    return docRef.id;
  } catch (error) {
    console.error('채팅방 생성/조회 중 오류:', error);
    throw error;
  }
};