/// <reference lib="webworker" />

import { defaultCache } from "@serwist/next/worker"
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist"
import { Serwist } from "serwist"

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined
  }
}

declare const self: ServiceWorkerGlobalScope

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: defaultCache,
})

serwist.addEventListeners()

self.addEventListener("push", (event) => {
  if (!event.data) return
  let data: { title?: string; body?: string; tag?: string }
  try {
    data = event.data.json()
  } catch {
    data = { body: event.data.text() }
  }
  event.waitUntil(
    self.registration.showNotification(data.title ?? "LayerFarm", {
      body: data.body,
      icon: "/icon-192.png",
      badge: "/icon-192.png",
      tag: data.tag,
    })
  )
})

self.addEventListener("notificationclick", (event) => {
  event.notification.close()
  event.waitUntil(self.clients.openWindow("/alerts"))
})
