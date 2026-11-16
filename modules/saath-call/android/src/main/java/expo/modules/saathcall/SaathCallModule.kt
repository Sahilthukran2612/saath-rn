package expo.modules.saathcall

import android.Manifest
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Build
import android.os.Handler
import android.os.Looper
import android.telephony.PhoneStateListener
import android.telephony.TelephonyCallback
import android.telephony.TelephonyManager
import androidx.core.content.ContextCompat
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

// Places a phone call without a tap, and reports when the phone's call state changes (offhook while a call is
// up or dialling, idle when it has ended). It does not read call history, contacts or numbers.
class SaathCallModule : Module() {
  private var telephony: TelephonyManager? = null
  private var legacyListener: PhoneStateListener? = null
  private var modernCallback: Any? = null

  private fun emit(state: Int) {
    val name = when (state) {
      TelephonyManager.CALL_STATE_OFFHOOK -> "offhook"
      TelephonyManager.CALL_STATE_RINGING -> "ringing"
      else -> "idle"
    }
    sendEvent("onCallState", mapOf("state" to name, "at" to System.currentTimeMillis()))
  }

  private fun stop() {
    val tm = telephony ?: return
    try {
      if (Build.VERSION.SDK_INT >= 31) {
        (modernCallback as? TelephonyCallback)?.let { tm.unregisterTelephonyCallback(it) }
      } else {
        @Suppress("DEPRECATION")
        legacyListener?.let { tm.listen(it, PhoneStateListener.LISTEN_NONE) }
      }
    } catch (e: Exception) {
      // already stopped
    }
    modernCallback = null
    legacyListener = null
  }

  override fun definition() = ModuleDefinition {
    Name("SaathCall")
    Events("onCallState")

    // Starts listening for call-state changes. Needs READ_PHONE_STATE. Returns false if it cannot.
    Function("startWatching") {
      val context = appContext.reactContext ?: return@Function false
      if (ContextCompat.checkSelfPermission(context, Manifest.permission.READ_PHONE_STATE) != PackageManager.PERMISSION_GRANTED) {
        return@Function false
      }
      stop()
      val tm = context.getSystemService(TelephonyManager::class.java) ?: return@Function false
      telephony = tm
      try {
        if (Build.VERSION.SDK_INT >= 31) {
          val callback = object : TelephonyCallback(), TelephonyCallback.CallStateListener {
            override fun onCallStateChanged(state: Int) = emit(state)
          }
          modernCallback = callback
          tm.registerTelephonyCallback(context.mainExecutor, callback)
        } else {
          Handler(Looper.getMainLooper()).post {
            @Suppress("DEPRECATION")
            val listener = object : PhoneStateListener() {
              @Deprecated("Deprecated in Java")
              override fun onCallStateChanged(state: Int, phoneNumber: String?) = emit(state)
            }
            legacyListener = listener
            @Suppress("DEPRECATION")
            tm.listen(listener, PhoneStateListener.LISTEN_CALL_STATE)
          }
        }
        true
      } catch (e: Exception) {
        false
      }
    }

    Function("stopWatching") { stop() }

    // Dials the number now. Needs CALL_PHONE. Returns false if it could not start the call.
    Function("call") { phone: String ->
      val context = appContext.reactContext ?: return@Function false
      if (phone.isBlank()) return@Function false
      if (ContextCompat.checkSelfPermission(context, Manifest.permission.CALL_PHONE) != PackageManager.PERMISSION_GRANTED) {
        return@Function false
      }
      try {
        val intent = Intent(Intent.ACTION_CALL, Uri.parse("tel:" + Uri.encode(phone)))
          .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        context.startActivity(intent)
        true
      } catch (e: Exception) {
        false
      }
    }
  }
}