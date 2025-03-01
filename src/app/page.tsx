"use client";

import Footer from "@/components/Footer";
import Landing from "@/container/Landing";
import { ReactQueryProvider } from "@/config/apiClient";
import { MapFilterProvider } from "@/context/MapFilterContext";
import Header from "@/components/Header";
import { Toaster } from 'react-hot-toast';
import { useEffect } from "react";
import { config } from "@/config";

export default function Home() {
  const setupOneSignal = () => {
    const scriptSrc = 'https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js'
    const script = document.createElement('script');
    script.src = scriptSrc;
    script.async = true;
    document.head.appendChild(script);

    script.onload = () => {
      (window as any).OneSignalDeferred = (window as any).OneSignalDeferred || [];
      (window as any).OneSignalDeferred.push(async function(OneSignal: any) {
        console.log('OneSignalDeferred');
        await OneSignal.init({
          appId: config.onesignalAppId,
        });
      });
    }
  }

  useEffect(() => {
    setupOneSignal();
  }, []);

  return (
    <div className="flex-1 flex flex-col items-center justify-between min-h-screen p-5 sm:p-8 bg-background text-foreground relative">
      <Header />
      <ReactQueryProvider>
        <MapFilterProvider>
          <Toaster />
          <Landing />
        </MapFilterProvider>
      </ReactQueryProvider>
      <Footer />
    </div>
  );
}
