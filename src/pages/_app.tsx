import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { AuthProvider } from '../components/features/auth/AuthProvider';
import { ThemeProvider } from '../components/features/theme/ThemeProvider';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Component {...pageProps} />
      </AuthProvider>
    </ThemeProvider>
  );
}
