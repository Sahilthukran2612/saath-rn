package expo.modules.saathforeground

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
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

    // Brings the alert in front of the lock screen: a high-priority, alarm-category notification with a
    // full-screen intent that opens Saath over the lock screen and turns the screen on. Without it, an app
    // in the background cannot open its own screen on Android 10 and later. Android 14 and later may need the
    // person to allow "full screen notifications" for Saath in the phone's settings.
    Function("raiseAlert") { title: String, text: String ->
      val context = appContext.reactContext ?: return@Function false
      try {
        val manager = context.getSystemService(NotificationManager::class.java)
        val builder: Notification.Builder
        if (Build.VERSION.SDK_INT >= 26) {
          val channel = NotificationChannel("saath_alert", "Saath alerts", NotificationManager.IMPORTANCE_HIGH)
          channel.lockscreenVisibility = Notification.VISIBILITY_PUBLIC
          channel.enableVibration(true)
          manager.createNotificationChannel(channel)
          builder = Notification.Builder(context, "saath_alert")
        } else {
          @Suppress("DEPRECATION")
          builder = Notification.Builder(context)
        }
        val launch = context.packageManager.getLaunchIntentForPackage(context.packageName)?.apply {
          addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP or Intent.FLAG_ACTIVITY_SINGLE_TOP)
        } ?: return@Function false
        val pending = PendingIntent.getActivity(
          context, 1, launch, PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
        )
        builder
          .setSmallIcon(android.R.drawable.ic_dialog_alert)
          .setContentTitle(title)
          .setContentText(text)
          .setCategory(Notification.CATEGORY_ALARM)
          .setAutoCancel(true)
          .setContentIntent(pending)
          .setFullScreenIntent(pending, true)
        manager.notify(4712, builder.build())
        true
      } catch (e: Exception) {
        false
      }
    }

    Function("clearAlert") {
      try {
        appContext.reactContext?.getSystemService(NotificationManager::class.java)?.cancel(4712)
      } catch (e: Exception) {
        // nothing to clear
      }
    }
  }
}
