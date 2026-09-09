import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = { title: 'Grad Quest｜研究所備考作戰台', description: '把每日研究所讀書計畫變成可持續推進的 RPG 任務。' };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="zh-Hant"><body>{children}</body></html>;
}
