# FYY-AI APK - Critical Issues & Solutions

## 1. AUTHENTICATION ISSUE (CLERK/GOOGLE) 🔐

### Problem
- Clerk authentication is blocked during APK build due to WebView restrictions
- Google OAuth doesn't work in Capacitor WebView (redirects fail)
- Users cannot login on APK, forced into guest mode

### Root Causes
- Clerk SDKs rely on browser popups and redirects (not supported in WebView)
- Capacitor WebView has different security model than regular browser
- Deep linking token sync is unreliable

### Solutions

#### Solution 1: Hybrid Auth (Recommended for APK)
Create a lightweight token-based auth backend:
```typescript
// Backend: POST /api/auth/mobile-token
// Generate a short-lived mobile token that can be used on APK
// Return: { token, expiresIn }

// APK: Use token to access APIs directly without Clerk SDK
```

#### Solution 2: WebView Auth Bridge
```typescript
// Use Capacitor Browser to open login in system browser:
// 1. Open login page in Browser plugin
// 2. Capture callback URL via deep linking
// 3. Extract session token from callback
// 4. Inject into WebView storage
```

#### Solution 3: Guest Mode Enhancement (Temporary)
```typescript
// Keep guest mode but with better limits and features
// Option to upgrade to account later
// Sync capabilities even for guests
```

---

## 2. MICROPHONE PERMISSION ISSUE 🎤

### Problem
- `RECORD_AUDIO` permission sometimes not granted on app launch
- Users don't see permission dialog or it's dismissed too quickly
- Speech recognition fails silently

### Root Causes
- Missing runtime permission handling in Capacitor
- Android 6+ requires explicit runtime permissions
- Permission dialog might appear before WebView is fully loaded

### Solutions

#### Fix 1: Add Runtime Permission Handling
File: `android/app/src/main/java/com/rapxcode/fyyai/MainActivity.java`

```java
import android.Manifest;
import android.content.pm.PackageManager;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;

@Override
public void onCreate(Bundle savedInstanceState) {
    // Request RECORD_AUDIO permission early
    if (ContextCompat.checkSelfPermission(this, Manifest.permission.RECORD_AUDIO)
            != PackageManager.PERMISSION_GRANTED) {
        ActivityCompat.requestPermissions(this,
                new String[]{Manifest.permission.RECORD_AUDIO}, 101);
    }
    super.onCreate(savedInstanceState);
}
```

#### Fix 2: Add Missing Permissions to AndroidManifest.xml
```xml
<!-- Add these: -->
<uses-permission android:name="android.permission.RECORD_AUDIO" />
<uses-permission android:name="android.permission.MODIFY_AUDIO_SETTINGS" />

<!-- For audio playback in background: -->
<uses-permission android:name="android.permission.INTERNET" />
```

#### Fix 3: Enhanced Permission Check Hook
File: `hooks/use-voice-input.ts`

```typescript
// Add Capacitor permission check before starting recognition
const checkMicPermission = async () => {
  if (typeof Capacitor !== 'undefined') {
    const { Permissions } = await import('@capacitor/permissions');
    const result = await Permissions.query({ name: 'Microphone' });
    
    if (result.state === 'denied') {
      const req = await Permissions.requestPermissions(['Microphone']);
      return req.Microphone === 'granted';
    }
    return result.state === 'granted';
  }
  return true; // Web environment
};
```

---

## 3. AUDIO OUTPUT ISSUE (TTS Not Playing) 🔊

### Problem
- Speech synthesis works but audio doesn't play on APK
- Audio is muted or routed incorrectly
- No fallback when TTS fails

### Root Causes
- Capacitor WebView might route audio differently
- System audio settings could be in vibrate/silent mode
- Browser audio context not properly initialized for APK

### Solutions

#### Solution 1: Audio Context Workaround
```typescript
// In useSpeechOutput hook, add:
const initAudioContext = async () => {
  if (typeof window !== 'undefined' && typeof AudioContext !== 'undefined') {
    const context = new (window.AudioContext || window.webkitAudioContext)();
    if (context.state === 'suspended') {
      await context.resume();
    }
    return context;
  }
  return null;
};
```

#### Solution 2: Fallback to Native Audio (Capacitor)
```typescript
// If speechSynthesis fails, use Capacitor media plugin:
import { Media } from '@capacitor/media';

// Generate audio file on server, stream to APK via Media plugin
const playAudioFallback = async (audioUrl: string) => {
  try {
    const media = new Media({
      fullPath: audioUrl,
      assetId: 'ai-response'
    });
    await media.play();
  } catch (error) {
    console.error('Audio playback failed:', error);
  }
};
```

#### Solution 3: Improve TTS Robustness
```typescript
export function useSpeechOutput(options?: { onStart?: () => void; onEnd?: () => void }) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [audioAvailable, setAudioAvailable] = useState(true);

  const speak = useCallback((text: string) => {
    if (!audioAvailable) {
      options?.onEnd?.();
      return;
    }

    if ("speechSynthesis" in window) {
      // Pre-check audio state
      if (window.speechSynthesis.pending) {
        console.warn('TTS pending, queueing...');
      }
      
      // Add timeout fallback
      const timeout = setTimeout(() => {
        console.warn('TTS timeout, marking unavailable');
        setAudioAvailable(false);
        setIsSpeaking(false);
        options?.onEnd?.();
      }, 15000); // 15 second timeout

      // ... existing speak code ...
      
      // Clear timeout on completion
      utterance.onend = () => {
        clearTimeout(timeout);
        // ... existing onend code ...
      };
    }
  }, [audioAvailable, options]);

  return { isSpeaking, speak, stop, audioAvailable };
}
```

---

## 4. WEB-APK SYNC ISSUE (Not Real-Time) 🔄

### Problem
- Sync banner only appears on mobile browsers, not in APK
- Manual sync requires deep linking which is unreliable
- Data sometimes out-of-sync between web and APK

### Root Causes
- Detection logic for APK vs mobile browser is flawed
- Sync is one-way only (token-based, not bidirectional)
- No real-time event listeners
- Deep linking unreliable for token passing

### Solutions

#### Fix 1: Detect APK Properly
```typescript
// File: app/chat/page.tsx - Replace detection logic
const detectAPKMode = () => {
  if (typeof window === 'undefined') return false;
  
  // Check for Capacitor
  if ('Capacitor' in window && window.Capacitor?.isNativePlatform?.()) {
    return true;
  }
  
  // Check user agent
  const ua = navigator.userAgent;
  if (ua.includes('wv') || ua.includes('Capacitor')) {
    return true;
  }
  
  // Check for Android bridge
  if ('__CAPACITOR_BRIDGE__' in window) {
    return true;
  }
  
  return false;
};
```

#### Fix 2: Implement Real-Time Sync via IndexedDB
```typescript
// Create IndexedDB sync service for multi-tab communication
const useRealtimeSync = () => {
  const dbRef = useRef<IDBDatabase | null>(null);

  useEffect(() => {
    const openDB = async () => {
      const db = await new Promise<IDBDatabase>((resolve, reject) => {
        const req = indexedDB.open('fyyai-sync', 1);
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
        req.onupgradeneeded = (e) => {
          const db = (e.target as IDBOpenDBRequest).result;
          if (!db.objectStoreNames.contains('conversations')) {
            db.createObjectStore('conversations', { keyPath: 'id' });
          }
        };
      });
      dbRef.current = db;
    };
    openDB();
  }, []);

  const syncConversations = (conversations: Conversation[]) => {
    if (!dbRef.current) return;
    const tx = dbRef.current.transaction('conversations', 'readwrite');
    const store = tx.objectStore('conversations');
    conversations.forEach(conv => store.put(conv));
  };

  return { syncConversations };
};
```

#### Fix 3: Implement Bidirectional Deep Linking
```typescript
// File: capacitor.config.ts
const config = {
  // ...
  server: {
    // Add messaging bridge
    allowNavigation: [
      'fyy-ai.vercel.app',
      '*.clerk.accounts.dev',
      'localhost:3000' // dev
    ],
    // Add custom scheme handler
    androidScheme: 'https'
  }
};

// File: app/chat/page.tsx - Improved sync
useEffect(() => {
  const handleStorageChange = (e: StorageEvent) => {
    if (e.key === 'fyy_sync_trigger') {
      // Trigger immediate sync
      setLiveModeTrigger(prev => prev + 1);
      syncFromServer();
    }
  };
  
  window.addEventListener('storage', handleStorageChange);
  return () => window.removeEventListener('storage', handleStorageChange);
}, []);
```

---

## 5. SECURITY VULNERABILITIES 🔒

### Issue 1: API Keys in localStorage
**Risk**: High - Exposed to XSS attacks
```typescript
// Current: API keys stored plainly
localStorage.setItem('huggingface_api_key', key);

// Fix: Use Capacitor Secure Storage
import { SecureStorage } from '@capacitor-community/secure-storage';

const storeAPIKey = async (key: string, value: string) => {
  await SecureStorage.set({ key, value });
};

const getAPIKey = async (key: string) => {
  const value = await SecureStorage.get({ key });
  return value;
};
```

### Issue 2: Missing Input Validation
**Risk**: Medium - Could cause injection attacks
```typescript
// Add comprehensive validation
const sanitizeInput = (text: string): string => {
  return text
    .trim()
    .slice(0, 2000) // Enforce max length
    .replace(/[<>]/g, '') // Remove potential HTML
    .replace(/[^\p{L}\p{N}\s.,!?'-]/gu, ''); // Allow only safe chars
};
```

### Issue 3: No CORS Headers on APK
**Risk**: Medium - APK can be exploited for API abuse
```typescript
// File: app/api/chat/route.ts - Add origin check
export async function POST(req: Request) {
  const origin = req.headers.get('origin');
  const referer = req.headers.get('referer');
  
  // Verify request comes from APK or web domain
  const isValidOrigin = origin?.includes('fyy-ai.vercel.app') || 
                       referer?.includes('com.rapxcode.fyyai');
  
  if (!isValidOrigin && process.env.NODE_ENV === 'production') {
    return new Response('Unauthorized', { status: 403 });
  }
  
  // ... rest of API
}
```

### Issue 4: Guest Mode Rate Limiting
**Risk**: High - Abuse/DoS potential
```typescript
// Implement rate limiting for guest users
const rateLimitGuest = (guestId: string) => {
  const key = `ratelimit_${guestId}`;
  const current = parseInt(localStorage.getItem(key) || '0');
  
  if (current >= 100) { // 100 requests per hour
    return false;
  }
  
  localStorage.setItem(key, (current + 1).toString());
  
  // Reset after 1 hour
  setTimeout(() => localStorage.removeItem(key), 3600000);
  
  return true;
};
```

---

## 6. ADDITIONAL BUGS TO CHECK ⚠️

### Bug 1: Live Voice Echo Still Persists
- Transcript filter might have false positives
- Solution: Use fuzzy matching instead of exact string match
- Check if AI transcript is still being captured during TTS

### Bug 2: Memory Leaks in WebView
- Voice recognition listeners not cleaned up properly
- Solution: Ensure all event listeners are removed on component unmount

### Bug 3: File Upload on APK
- File picker might not work properly
- Solution: Use Capacitor FilePicker plugin

### Bug 4: Battery Drain
- Live voice mode keeps CPU awake
- Solution: Implement aggressive timeout after 5 minutes of inactivity

---

## Implementation Priority

1. **CRITICAL** (Do First):
   - [ ] Fix microphone permission handling
   - [ ] Add audio fallback mechanism
   - [ ] Implement secure storage for API keys

2. **HIGH** (This Sprint):
   - [ ] Improve auth with hybrid approach
   - [ ] Fix real-time sync mechanism
   - [ ] Add input validation

3. **MEDIUM** (Next Sprint):
   - [ ] Add rate limiting for guests
   - [ ] Improve APK detection
   - [ ] Battery optimization

4. **LOW** (Polish):
   - [ ] UX improvements
   - [ ] Analytics integration
   - [ ] Performance monitoring

---

## Testing Checklist

- [ ] Test microphone permission request on fresh APK install
- [ ] Test audio output on silent mode enabled
- [ ] Test sync between 2 devices (web + APK)
- [ ] Test guest mode rate limiting
- [ ] Test API key security (check DevTools)
- [ ] Test deep linking with special characters
- [ ] Test with 100+ conversations
- [ ] Test with slow network (2G throttling)

