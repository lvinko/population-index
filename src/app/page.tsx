"use client";

import Footer from "@/components/Footer";
import Landing from "@/container/Landing";
import { ReactQueryProvider } from "@/apiClient";
import { MapFilterProvider } from "@/context/MapFilterContext";
export default function Home() {
  return (
    <div className="flex-1 flex flex-col items-center justify-between min-h-screen p-8 pb-20 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <h1>Population Index</h1>
      <ReactQueryProvider>
        <MapFilterProvider>
          <Landing />
        </MapFilterProvider>
      </ReactQueryProvider>
      <Footer />
    </div>
  );
}
