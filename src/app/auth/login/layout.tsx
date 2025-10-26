import { Metadata } from 'next';

export const metadata: Metadata = {
  title: '로그인',
  description: '실시간 게시판에 로그인하여 다양한 기능을 이용해보세요.',
  openGraph: {
    title: '로그인',
    description: '실시간 게시판에 로그인하여 다양한 기능을 이용해보세요.',
  },
  robots: {
    index: false,
  },
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}