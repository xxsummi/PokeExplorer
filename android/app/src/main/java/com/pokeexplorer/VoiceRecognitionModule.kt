package com.pokeexplorer

import android.content.Intent
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.speech.RecognitionListener
import android.speech.RecognizerIntent
import android.speech.SpeechRecognizer
import com.facebook.react.bridge.*
import com.facebook.react.modules.core.DeviceEventManagerModule

class VoiceRecognitionModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
    
    private val mainHandler = Handler(Looper.getMainLooper())
    
    private var speechRecognizer: SpeechRecognizer? = null
    
    override fun getName() = "VoiceRecognition"
    
    @ReactMethod
    fun startListening(promise: Promise) {
        mainHandler.post {
            try {
                val intent = Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH).apply {
                    putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM)
                    putExtra(RecognizerIntent.EXTRA_LANGUAGE, "en-US")
                }
                
                speechRecognizer = SpeechRecognizer.createSpeechRecognizer(reactApplicationContext).apply {
                    setRecognitionListener(object : RecognitionListener {
                        override fun onResults(results: Bundle?) {
                            val matches = results?.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION)
                            if (!matches.isNullOrEmpty()) {
                                sendEvent("onSpeechResults", matches[0])
                            }
                        }
                        
                        override fun onError(error: Int) {
                            sendEvent("onSpeechError", "Error: $error")
                        }
                        
                        override fun onReadyForSpeech(params: Bundle?) {
                            sendEvent("onSpeechStart", null)
                        }
                        
                        override fun onEndOfSpeech() {
                            sendEvent("onSpeechEnd", null)
                        }
                        
                        override fun onBeginningOfSpeech() {}
                        override fun onRmsChanged(rmsdB: Float) {}
                        override fun onBufferReceived(buffer: ByteArray?) {}
                        override fun onPartialResults(partialResults: Bundle?) {}
                        override fun onEvent(eventType: Int, params: Bundle?) {}
                    })
                    startListening(intent)
                }
                promise.resolve(true)
            } catch (e: Exception) {
                promise.reject("ERROR", e.message)
            }
        }
    }
    
    @ReactMethod
    fun stopListening(promise: Promise) {
        try {
            speechRecognizer?.stopListening()
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("ERROR", e.message)
        }
    }
    
    @ReactMethod
    fun destroy(promise: Promise) {
        try {
            speechRecognizer?.destroy()
            speechRecognizer = null
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("ERROR", e.message)
        }
    }
    
    private fun sendEvent(eventName: String, data: String?) {
        reactApplicationContext
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
            .emit(eventName, data)
    }
}
