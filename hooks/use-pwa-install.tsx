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
  const [isIOS, setIsIOS] = useState(false)
  const [isAndroid, setIsAndroid] = useState(false)

  useEffect(() => {
    // Detect device type
    const userAgent = navigator.userAgent.toLowerCase()
    const isIOSDevice = /ipad|iphone|ipod/.test(userAgent)
    const isAndroidDevice = /android/.test(userAgent)

    setIsIOS(isIOSDevice)
    setIsAndroid(isAndroidDevice)

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

    // Listen for the beforeinstallprompt event (mainly for Android Chrome)
    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt)
    window.addEventListener("appinstalled", handleAppInstalled)

    // For iOS and other browsers, we can still show install option
    if (isIOSDevice || isAndroidDevice || !checkIfInstalled()) {
      setIsInstallable(true)
    }

    console.log("PWA install listeners added", { isIOSDevice, isAndroidDevice })

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt)
      window.removeEventListener("appinstalled", handleAppInstalled)
    }
  }, [])

  const installApp = async () => {
    // For Android Chrome with beforeinstallprompt support
    if (deferredPrompt) {
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

    // For iOS Safari
    if (isIOS) {
      const isInStandaloneMode = (window.navigator as any).standalone
      const isInWebAppiOS = window.matchMedia("(display-mode: standalone)").matches

      if (!isInStandaloneMode && !isInWebAppiOS) {
        // Show iOS install instructions
        alert(`iOS дээр суулгахын тулд:
1. Safari browser ашиглана уу
2. Доод хэсгээс "Share" (Хуваалцах) товч дарна уу
3. "Add to Home Screen" (Нүүр хуудсанд нэмэх) сонгоно уу
4. "Add" (Нэмэх) товч дарна уу`)
        return false
      }
      return false
    }

    // For Android browsers without beforeinstallprompt
    if (isAndroid) {
      // Check if it's Chrome
      const isChrome = /chrome/.test(navigator.userAgent.toLowerCase())

      if (isChrome) {
        alert(`Chrome дээр суулгахын тулд:
1. Баруун дээд буланд байгаа цэс (⋮) дарна уу
2. "Add to Home screen" эсвэл "Install app" сонгоно уу
3. "Install" товч дарна уу`)
      } else {
        alert(`Android дээр суулгахын тулд:
1. Browser-ийн цэс нээнэ үү
2. "Add to Home screen" сонгоно уу
3. Нэр оруулаад "Add" дарна уу`)
      }
      return false
    }

    // For other browsers
    alert(`Энэ browser дээр суулгахын тулд:
1. Browser-ийн цэс нээнэ үү
2. "Add to Home screen" эсвэл "Install" сонгоно уу
3. Заавар дагуу суулгана уу`)
    return false
  }

  return {
    isInstallable: isInstallable && !isInstalled,
    isInstalled,
    installApp,
    canInstall: isInstallable && !isInstalled,
    isIOS,
    isAndroid,
  }
}
