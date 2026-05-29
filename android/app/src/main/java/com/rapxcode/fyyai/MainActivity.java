package com.rapxcode.fyyai;

import android.os.Bundle;
import android.speech.tts.TextToSpeech;
import android.speech.tts.UtteranceProgressListener;
import android.webkit.JavascriptInterface;
import android.webkit.PermissionRequest;
import android.webkit.WebView;
import com.getcapacitor.BridgeActivity;
import com.getcapacitor.BridgeWebChromeClient;
import java.util.Locale;

public class MainActivity extends BridgeActivity {
    private TextToSpeech tts;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        final WebView webView = this.getBridge().getWebView();
        
        // Override User-Agent to standard Chrome to bypass Google OAuth WebView block
        // Append FYY_AI_ANDROID_APK to allow frontend APK detection logic to work correctly
        webView.getSettings().setUserAgentString("Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Mobile Safari/537.36 FYY_AI_ANDROID_APK");
        webView.getSettings().setMediaPlaybackRequiresUserGesture(false);

        // Subclass Capacitor's own BridgeWebChromeClient to prevent breaking native features (like file picker)
        webView.setWebChromeClient(new BridgeWebChromeClient(this.getBridge()) {
            @Override
            public void onPermissionRequest(final PermissionRequest request) {
                MainActivity.this.runOnUiThread(new Runnable() {
                    @Override
                    public void run() {
                        request.grant(request.getResources());
                    }
                });
            }
        });

        // Initialize Native TextToSpeech
        tts = new TextToSpeech(this, new TextToSpeech.OnInitListener() {
            @Override
            public void onInit(int status) {
                if (status == TextToSpeech.SUCCESS) {
                    tts.setLanguage(new Locale("id", "ID"));
                }
            }
        });

        tts.setOnUtteranceProgressListener(new UtteranceProgressListener() {
            @Override
            public void onStart(String utteranceId) {
                MainActivity.this.runOnUiThread(new Runnable() {
                    @Override
                    public void run() {
                        webView.evaluateJavascript("if (window.onNativeTTSStart) { window.onNativeTTSStart(); }", null);
                    }
                });
            }

            @Override
            public void onDone(String utteranceId) {
                MainActivity.this.runOnUiThread(new Runnable() {
                    @Override
                    public void run() {
                        webView.evaluateJavascript("if (window.onNativeTTSEnd) { window.onNativeTTSEnd(); }", null);
                    }
                });
            }

            @Override
            public void onError(String utteranceId) {
                MainActivity.this.runOnUiThread(new Runnable() {
                    @Override
                    public void run() {
                        webView.evaluateJavascript("if (window.onNativeTTSEnd) { window.onNativeTTSEnd(); }", null);
                    }
                });
            }
        });

        // Add Native TTS JavaScript Interface
        webView.addJavascriptInterface(new Object() {
            @JavascriptInterface
            public void speak(String text) {
                if (tts != null) {
                    Bundle params = new Bundle();
                    tts.speak(text, TextToSpeech.QUEUE_FLUSH, params, "FyyAiUtterance");
                }
            }

            @JavascriptInterface
            public void stop() {
                if (tts != null) {
                    tts.stop();
                }
            }

            @JavascriptInterface
            public boolean isNativeSupported() {
                return true;
            }
        }, "AndroidTTS");
    }

    @Override
    public void onDestroy() {
        if (tts != null) {
            tts.stop();
            tts.shutdown();
        }
        super.onDestroy();
    }
}
