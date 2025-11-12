"use client";

import Footer from "@/components/Footer";
import Landing from "@/container/Landing";
import { ReactQueryProvider } from "@/config/apiClient";
import { MapFilterProvider } from "@/context/MapFilterContext";
import Header from "@/components/Header";
import { Toaster } from 'react-hot-toast';

export default function Home() {
  return (
    <div className="flex-1 flex flex-col items-center justify-between min-h-screen bg-base-100 text-base-content relative">
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
