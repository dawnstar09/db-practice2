import { Metadata } from 'next';

export async function generateMetadata(): Promise<Metadata> {
  // 게시글 데이터를 가져와서 메타데이터 생성
  return {
    title: '게시글 상세',
    description: '게시글의 상세 내용을 확인하고 댓글을 작성해보세요.',
    openGraph: {
      title: '게시글 상세',
      description: '게시글의 상세 내용을 확인하고 댓글을 작성해보세요.',
      type: 'article',
    },
  };
}