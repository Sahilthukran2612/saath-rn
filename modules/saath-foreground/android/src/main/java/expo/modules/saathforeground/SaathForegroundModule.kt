package expo.modules.saathforeground

import android.content.Intent
import android.os.Build
import expo.modules.kotlin.exception.CodedException
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class SaathForegroundModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("SaathForeground")

    Function("start") { title: String, text: String ->
      val context = appContext.reactContext ?: throw CodedException("ERR_NO_CONTEXT", "No Android context", null)
      val intent = Intent(context, SaathForegroundService::class.java)
        .putExtra(SaathForegroundService.EXTRA_TITLE, title)
        .putExtra(SaathForegroundService.EXTRA_TEXT, text)
      if (Build.VERSION.SDK_INT >= 26) context.startForegroundService(intent) else context.startService(intent)
    }

    Function("stop") {
      val context = appContext.reactContext ?: throw CodedException("ERR_NO_CONTEXT", "No Android context", null)
      context.stopService(Intent(context, SaathForegroundService::class.java))
    }

    Function("isRunning") {
      SaathForegroundService.running
    }
  }
}
