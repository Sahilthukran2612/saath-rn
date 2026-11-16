package expo.modules.saathsms

import android.Manifest
import android.content.pm.PackageManager
import android.os.Build
import android.telephony.SmsManager
import androidx.core.content.ContextCompat
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

// Sends one text message through the phone's own SMS plan. It does not read any message.
// Returns true when Android accepted the message for sending; it cannot know that it arrived.
class SaathSmsModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("SaathSms")

    Function("send") { phone: String, text: String ->
      val context = appContext.reactContext ?: return@Function false
      if (phone.isBlank() || text.isBlank()) return@Function false
      if (ContextCompat.checkSelfPermission(context, Manifest.permission.SEND_SMS) != PackageManager.PERMISSION_GRANTED) {
        return@Function false
      }
      try {
        val manager: SmsManager =
          if (Build.VERSION.SDK_INT >= 31) context.getSystemService(SmsManager::class.java)
          else @Suppress("DEPRECATION") SmsManager.getDefault()
        val parts = manager.divideMessage(text)
        manager.sendMultipartTextMessage(phone, null, parts, null, null)
        true
      } catch (e: Exception) {
        false
      }
    }
  }
}