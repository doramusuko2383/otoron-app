import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function Success() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.push('/');
    }, 3000);
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      backgroundColor: '#fff',
      textAlign: 'center'
    }}>
      <img src="images/payment-success.webp" alt="決済完了" style={{ maxWidth: '90%', height: 'auto' }} />
      <p style={{ marginTop: '1rem', color: '#666' }}>3秒後にホーム画面に戻ります</p>
    </div>
  );
}
