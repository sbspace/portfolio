import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// Yahoo Finance는 브라우저에서 직접 호출 시 CORS 오류가 발생합니다.
// 개발 서버에서 Vite proxy를 통해 우회합니다.
// 프로덕션 배포 시에는 별도 백엔드 프록시 또는 로컬 실행(`npm run dev`)을 사용하세요.
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    proxy: {
      '/api/yahoo': {
        target: 'https://query1.finance.yahoo.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/yahoo/, ''),
        headers: {
          // Yahoo Finance가 브라우저 User-Agent를 요구하는 경우 대비
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0',
        },
      },
    },
  },
})
