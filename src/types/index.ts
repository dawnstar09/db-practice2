export interface User {
  uid: string;
  email: string;
  displayName?: string;
}

export interface Post {
  id: string;
  title: string;
  content: string;
  authorId: string;
  authorName: string;
  createdAt: Date;
  updatedAt: Date;
  commentCount: number;
  likes: string[]; // 좋아요한 사용자 ID 배열
  attachments?: Attachment[]; // 첨부파일 배열
  tags?: string[]; // 태그 배열
  viewCount?: number; // 조회수
  category?: string; // 카테고리
}

export interface Comment {
  id: string;
  postId: string;
  content: string;
  authorId: string;
  authorName: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Attachment {
  id: string;
  name: string;
  url: string;
  type: string;
  size: number;
}

export interface Notification {
  id: string;
  userId: string; // 알림을 받을 사용자 ID
  type: 'like' | 'comment'; // 알림 타입
  postId: string; // 관련 게시글 ID
  postTitle: string; // 게시글 제목
  actorId: string; // 액션을 수행한 사용자 ID
  actorName: string; // 액션을 수행한 사용자 이름
  message: string; // 알림 메시지
  isRead: boolean; // 읽음 여부
  createdAt: Date; // 생성 시간
  commentContent?: string; // 댓글 내용 (댓글 알림인 경우)
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  createdAt: Date;
  isRead: boolean;
}

export interface ChatRoom {
  id: string;
  participants: string[]; // 참가자 ID 배열
  participantNames: { [key: string]: string }; // 참가자 이름 맵
  lastMessage?: string;
  lastMessageTime?: Date;
  unreadCount: { [key: string]: number }; // 각 사용자별 읽지 않은 메시지 수
  createdAt: Date;
}