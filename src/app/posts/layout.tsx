import { Metadata } from 'next';

export const metadata: Metadata = {
  title: '전체 게시글',
  description: '커뮤니티의 모든 게시글을 확인해보세요. 카테고리별 필터링과 검색이 가능합니다.',
  openGraph: {
    title: '전체 게시글',
    description: '커뮤니티의 모든 게시글을 확인해보세요. 카테고리별 필터링과 검색이 가능합니다.',
  },
};

export default function PostsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}