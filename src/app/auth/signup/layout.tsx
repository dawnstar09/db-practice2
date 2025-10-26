import { Metadata } from 'next';

export const metadata: Metadata = {
  title: '회원가입',
  description: '실시간 게시판에 가입하여 커뮤니티의 일원이 되어보세요.',
  openGraph: {
    title: '회원가입',
    description: '실시간 게시판에 가입하여 커뮤니티의 일원이 되어보세요.',
  },
  robots: {
    index: false,
  },
};

export default function SignupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}