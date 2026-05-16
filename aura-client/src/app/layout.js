import { Poppins, JetBrains_Mono } from 'next/font/google';
import "./globals.css";

// Configure Poppins (Sans Serif)
const poppins = Poppins({ 
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
  variable: '--font-poppins',
});

// Configure JetBrains Mono (Monospace)
const jetbrains = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
});

export const metadata = {
  title: "AURA | Next-Gen Routine Intelligence",
  description: "Assistive User Routine Analyzer",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${poppins.variable} ${jetbrains.variable}`}>
      <body className="bg-[#050505] text-white antialiased font-sans">
        {children}
      </body>
    </html>
  );
}