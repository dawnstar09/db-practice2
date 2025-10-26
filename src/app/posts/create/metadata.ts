import { Metadata } from 'next';

export const metadata: Metadata = {
  title: '새 게시글 작성',
  description: '새로운 게시글을 작성해보세요. 파일 첨부와 다양한 카테고리를 지원합니다.',
  openGraph: {
    title: '새 게시글 작성',
    description: '새로운 게시글을 작성해보세요. 파일 첨부와 다양한 카테고리를 지원합니다.',
  },
  robots: {
    index: false, // 작성 페이지는 검색엔진에서 제외
  },
};