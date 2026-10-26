package expo.modules.saathforeground

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Intent
import android.content.pm.ServiceInfo
import android.os.Build
import android.os.IBinder

/**
 * Keeps the app process alive while the person has "keep watching in the background" turned on.
 * It shows a persistent notification, so nothing is hidden. It does no sensing itself: the tested
 * JavaScript detector keeps running in the same process.
 */
class SaathForegroundService : Service() {
  override fun onBind(intent: Intent?): IBinder? = null

  override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
    val title = intent?.getStringExtra(EXTRA_TITLE) ?: "Saath"
    val text = intent?.getStringExtra(EXTRA_TEXT) ?: ""
    val notification = buildNotification(title, text)
    if (Build.VERSION.SDK_INT >= 34) {
      startForeground(NOTIFICATION_ID, notification, ServiceInfo.FOREGROUND_SERVICE_TYPE_SPECIAL_USE)
    } else {
      startForeground(NOTIFICATION_ID, notification)
    }
    running = true
    return START_STICKY
  }

  override fun onDestroy() {
    running = false
    super.onDestroy()
  }

  private fun buildNotification(title: String, text: String): Notification {
    val manager = getSystemService(NOTIFICATION_SERVICE) as NotificationManager
    val builder: Notification.Builder
    if (Build.VERSION.SDK_INT >= 26) {
      manager.createNotificationChannel(
        NotificationChannel(CHANNEL_ID, "Saath watching", NotificationManager.IMPORTANCE_LOW)
      )
      builder = Notification.Builder(this, CHANNEL_ID)
    } else {
      @Suppress("DEPRECATION")
      builder = Notification.Builder(this)
    }
    builder
      .setContentTitle(title)
      .setContentText(text)
      .setSmallIcon(android.R.drawable.ic_menu_info_details)
      .setOngoing(true)

    packageManager.getLaunchIntentForPackage(packageName)?.let { launch ->
      builder.setContentIntent(
        PendingIntent.getActivity(this, 0, launch, PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT)
      )
    }
    return builder.build()
  }

  companion object {
    const val CHANNEL_ID = "saath_watching"
    const val NOTIFICATION_ID = 4711
    const val EXTRA_TITLE = "title"
    const val EXTRA_TEXT = "text"

    @Volatile
    var running = false
  }
}
