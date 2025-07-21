"use client"

import { useState, useEffect } from "react"

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[]
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed"
    platform: string
  }>
  prompt(): Promise<void>
}

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isInstallable, setIsInstallable] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)

  useEffect(() => {
    // Check if app is already installed
    const checkIfInstalled = () => {
      // Check for standalone mode (PWA is installed)
      if (window.matchMedia("(display-mode: standalone)").matches) {
        setIsInstalled(true)
        return true
      }

      // Check for iOS Safari standalone mode
      if ((window.navigator as any).standalone === true) {
        setIsInstalled(true)
        return true
      }

      // Check if running in TWA (Trusted Web Activity) on Android
      if (document.referrer.includes("android-app://")) {
        setIsInstalled(true)
        return true
      }

      return false
    }

    if (checkIfInstalled()) {
      return
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      console.log("beforeinstallprompt event fired")
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setIsInstallable(true)
    }

    const handleAppInstalled = () => {
      console.log("App was installed")
      setIsInstalled(true)
      setIsInstallable(false)
      setDeferredPrompt(null)
    }

    // Listen for the beforeinstallprompt event
    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt)
    window.addEventListener("appinstalled", handleAppInstalled)

    // For debugging - check if the event listeners are working
    console.log("PWA install listeners added")

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt)
      window.removeEventListener("appinstalled", handleAppInstalled)
    }
  }, [])

  const installApp = async () => {
    if (!deferredPrompt) {
      console.log("No deferred prompt available")

      // For iOS Safari, show instructions
      if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
        alert("iOS дээр суулгахын тулд: Safari-н доод хэсгээс 'Share' товч дарж, 'Add to Home Screen' сонгоно уу.")
        return false
      }

      // For other browsers that don't support install prompt
      alert("Таны browser PWA суулгахыг дэмжихгүй байна.")
      return false
    }

    try {
      console.log("Showing install prompt")
      deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      console.log("User choice:", outcome)

      setDeferredPrompt(null)
      setIsInstallable(false)

      if (outcome === "accepted") {
        console.log("User accepted the install prompt")
        return true
      } else {
        console.log("User dismissed the install prompt")
        return false
      }
    } catch (error) {
      console.error("Installation failed:", error)
      return false
    }
  }

  return {
    isInstallable,
    isInstalled,
    installApp,
    canInstall: isInstallable && !isInstalled,
  }
}
