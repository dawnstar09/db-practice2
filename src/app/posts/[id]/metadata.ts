import { Metadata } from 'next';

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  // 게시글 데이터를 가져와서 메타데이터 생성
  try {
    // 실제 구현에서는 Firebase에서 데이터를 가져올 수 있지만,
    // 클라이언트 컴포넌트이므로 기본값을 사용
    return {
      title: '게시글 상세',
      description: '게시글의 상세 내용을 확인하고 댓글을 작성해보세요.',
      openGraph: {
        title: '게시글 상세',
        description: '게시글의 상세 내용을 확인하고 댓글을 작성해보세요.',
        type: 'article',
      },
    };
  } catch (error) {
    return {
      title: '게시글을 찾을 수 없습니다',
      description: '요청하신 게시글을 찾을 수 없습니다.',
    };
  }
}