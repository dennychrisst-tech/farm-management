"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"
import { Bell, BellOff } from "lucide-react"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/")
  const rawData = atob(base64)
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)))
}

export function PushNotificationsCard({ userId }: { userId: string }) {
  const [supported, setSupported] = useState(false)
  const [subscribed, setSubscribed] = useState(false)
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    async function check() {
      if (!("serviceWorker" in navigator) || !("PushManager" in window) || !VAPID_PUBLIC_KEY) {
        setSupported(false)
        setChecking(false)
        return
      }
      setSupported(true)
      try {
        const registration = await navigator.serviceWorker.ready
        const existing = await registration.pushManager.getSubscription()
        setSubscribed(!!existing)
      } finally {
        setChecking(false)
      }
    }
    check()
  }, [])

  async function handleSubscribe() {
    if (!VAPID_PUBLIC_KEY) return
    setLoading(true)
    try {
      const permission = await Notification.requestPermission()
      if (permission !== "granted") {
        toast.error("Izin notifikasi ditolak")
        return
      }
      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      })
      const json = subscription.toJSON()
      const supabase = createClient()
      const { error } = await supabase.from("push_subscriptions").upsert(
        {
          user_id: userId,
          endpoint: subscription.endpoint,
          p256dh: json.keys?.p256dh ?? "",
          auth: json.keys?.auth ?? "",
        },
        { onConflict: "endpoint" }
      )
      if (error) throw error
      setSubscribed(true)
      toast.success("Notifikasi alert diaktifkan")
    } catch (err) {
      toast.error("Gagal mengaktifkan notifikasi", {
        description: err instanceof Error ? err.message : undefined,
      })
    } finally {
      setLoading(false)
    }
  }

  async function handleUnsubscribe() {
    setLoading(true)
    try {
      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.getSubscription()
      if (subscription) {
        const supabase = createClient()
        await supabase.from("push_subscriptions").delete().eq("endpoint", subscription.endpoint)
        await subscription.unsubscribe()
      }
      setSubscribed(false)
      toast.success("Notifikasi alert dinonaktifkan")
    } catch (err) {
      toast.error("Gagal menonaktifkan notifikasi", {
        description: err instanceof Error ? err.message : undefined,
      })
    } finally {
      setLoading(false)
    }
  }

  if (checking) return null

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          <Bell className="size-4" /> Notifikasi Alert
        </CardTitle>
        <CardDescription>
          {supported
            ? "Dapatkan notifikasi langsung di HP saat ada alert penting (stok kritis, mortalitas melonjak, dll), walau aplikasi sedang tidak dibuka."
            : "Perangkat/browser ini tidak mendukung notifikasi push. Coba buka dari aplikasi yang sudah di-install (Add to Home Screen)."}
        </CardDescription>
      </CardHeader>
      {supported && (
        <CardContent>
          {subscribed ? (
            <Button variant="outline" size="sm" onClick={handleUnsubscribe} disabled={loading}>
              <BellOff className="size-4" /> {loading ? "Memproses..." : "Nonaktifkan"}
            </Button>
          ) : (
            <Button size="sm" onClick={handleSubscribe} disabled={loading}>
              <Bell className="size-4" /> {loading ? "Memproses..." : "Aktifkan Notifikasi"}
            </Button>
          )}
        </CardContent>
      )}
    </Card>
  )
}
