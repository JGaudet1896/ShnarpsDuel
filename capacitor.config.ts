import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.shnarps.cardgame',
  appName: 'Shnarps Card Game',
  webDir: 'dist/public',
  server: {
    androidScheme: 'https'
  }
};

export default config;
