import '../styles/globals.css';
import type { AppProps } from 'next/app';
import { AuthProvider } from '../components/features/auth/AuthProvider';
import { ThemeProvider } from '../components/features/theme/ThemeProvider';

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Component {...pageProps} />
      </AuthProvider>
    </ThemeProvider>
  );
}

export default MyApp;
