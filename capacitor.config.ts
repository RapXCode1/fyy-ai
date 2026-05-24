import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.rapxcode.fyyai',
  appName: 'FYY-AI',
  webDir: 'out',
  server: {
    androidScheme: 'https',
    // ==========================================
    // INTEGRASI HYBRID - PILIH SALAH SATU URL DI BAWAH:
    // ==========================================
    //
    // [1] MODE PENGEMBANGAN (Development / Emulator):
    // Hubungkan APK langsung ke PC lokalmu untuk testing real-time.
    // url: 'http://10.0.2.2:3000',
    // cleartext: true
    //
    // [2] MODE PRODUKSI (Self-hosted / VPS / Custom Domain):
    // Masukkan domain website Next.js yang sudah kamu deploy ke server sendiri.
    // Ini mengaktifkan update otomatis (tanpa perlu update APK) dan akses API 100% aman!
    url: 'https://fyy-ai.rapxcode.dev',
    allowNavigation: [
      'fyy-ai.rapxcode.dev',
      '*.clerk.accounts.dev',
      'mutual-drum-35.clerk.accounts.dev',
      'accounts.google.com',
      '*.google.com',
      '*.googleusercontent.com'
    ]
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: "#000000",
      androidScaleType: "CENTER_CROP",
      showSpinner: false,
    },
    StatusBar: {
      style: "DARK",
      backgroundColor: "#000000",
    }
  }
};

export default config;
