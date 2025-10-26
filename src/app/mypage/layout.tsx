import { Metadata } from 'next';

export const metadata: Metadata = {
  title: '마이페이지',
  description: '내가 작성한 게시글과 활동 통계를 확인할 수 있습니다.',
  openGraph: {
    title: '마이페이지',
    description: '내가 작성한 게시글과 활동 통계를 확인할 수 있습니다.',
  },
  robots: {
    index: false, // 개인 페이지는 검색엔진에서 제외
  },
};

export default function MyPageLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}