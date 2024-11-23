"use client";

import Footer from "@/components/Footer";
import Landing from "@/container/Landing";
import { ReactQueryProvider } from "@/config/apiClient";
import { MapFilterProvider } from "@/context/MapFilterContext";

export default function Home() {
  return (
    <div className="flex-1 flex flex-col items-center justify-between min-h-screen p-5 sm:p-8 bg-background text-foreground relative">
      <h1 className="text-2xl font-bold mb-4">Аналіз населення України</h1>
      <ReactQueryProvider>
        <MapFilterProvider>
          <Landing />
        </MapFilterProvider>
      </ReactQueryProvider>
      <Footer />
    </div>
  );
}
