import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.konradprosto.sciencetok',
  appName: 'ScienceTok',
  webDir: '.next',
  server: {
    url: 'https://sciencetok-skoti88-5059s-projects.vercel.app',
    cleartext: false,
    allowNavigation: ['sciencetok-skoti88-5059s-projects.vercel.app'],
  },
  ios: {
    contentInset: 'automatic',
  },
}

export default config
