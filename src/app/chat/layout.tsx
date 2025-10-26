import { Metadata } from 'next';

export const metadata: Metadata = {
  title: '실시간 채팅',
  description: '커뮤니티 회원들과 실시간으로 대화해보세요. 글로벌 채팅룸에서 자유롭게 소통할 수 있습니다.',
  openGraph: {
    title: '실시간 채팅 - 실시간 게시판',
    description: '커뮤니티 회원들과 실시간으로 대화해보세요. 글로벌 채팅룸에서 자유롭게 소통할 수 있습니다.',
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "실시간 채팅 - 글로벌 채팅룸",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "실시간 채팅 - 실시간 게시판",
    description: "커뮤니티 회원들과 실시간으로 대화해보세요.",
    images: ["/og-image.png"],
  },
};

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}