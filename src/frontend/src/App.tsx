import { Toaster } from "@/components/ui/sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useEffect, useRef, useState } from "react";
import AdminView from "./components/AdminView";
import DriverView from "./components/DriverView";
import RiderView from "./components/RiderView";
import { useActor } from "./hooks/useActor";
import { useSeedSampleDrivers } from "./hooks/useQueries";

const SEED_KEY = "ambala_taxi_seeded_v1";

function AppInner() {
  const { actor, isFetching } = useActor();
  const seedMutation = useSeedSampleDrivers();
  const seededRef = useRef(false);

  // biome-ignore lint/correctness/useExhaustiveDependencies: seedMutation.mutate is stable
  useEffect(() => {
    if (!actor || isFetching || seededRef.current) return;
    const alreadySeeded = localStorage.getItem(SEED_KEY);
    if (alreadySeeded) return;

    seededRef.current = true;
    seedMutation.mutate(undefined, {
      onSuccess: () => {
        localStorage.setItem(SEED_KEY, "true");
      },
      onError: () => {
        seededRef.current = false;
      },
    });
  }, [actor, isFetching]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* ── App Header ─────────────────────────────────────────────────── */}
      <header className="app-header text-white sticky top-0 z-50 shadow-green">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-3">
          <div className="text-3xl">🚕</div>
          <div>
            <h1 className="font-display text-xl font-bold leading-tight tracking-tight">
              अंबाला टैक्सी सेवा
            </h1>
            <p className="text-xs text-white/75 font-body">
              Ambala Local Taxi Service
            </p>
          </div>
          <div className="ml-auto text-right text-xs text-white/70">
            <div className="font-semibold text-white text-sm">12 गाड़ियाँ</div>
            <div>12 Cars Only</div>
          </div>
        </div>
      </header>

      {/* ── Main Tabs ──────────────────────────────────────────────────── */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-0 pb-6">
        <Tabs defaultValue="rider" className="w-full">
          <TabsList className="w-full rounded-none border-b border-border bg-white sticky top-[72px] z-40 shadow-xs h-auto p-1 gap-1">
            <TabsTrigger
              value="rider"
              className="taxi-tab flex-1"
              data-ocid="rider.tab"
            >
              <span className="block text-lg">🧑</span>
              <span className="block text-sm mt-0.5">सवारी</span>
              <span className="block text-xs opacity-70">Rider</span>
            </TabsTrigger>
            <TabsTrigger
              value="driver"
              className="taxi-tab flex-1"
              data-ocid="driver.tab"
            >
              <span className="block text-lg">🚗</span>
              <span className="block text-sm mt-0.5">ड्राइवर</span>
              <span className="block text-xs opacity-70">Driver</span>
            </TabsTrigger>
            <TabsTrigger
              value="admin"
              className="taxi-tab flex-1"
              data-ocid="admin.tab"
            >
              <span className="block text-lg">⚙️</span>
              <span className="block text-sm mt-0.5">एडमिन</span>
              <span className="block text-xs opacity-70">Admin</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent
            value="rider"
            className="mt-0 focus-visible:outline-none"
          >
            <RiderView />
          </TabsContent>
          <TabsContent
            value="driver"
            className="mt-0 focus-visible:outline-none"
          >
            <DriverView />
          </TabsContent>
          <TabsContent
            value="admin"
            className="mt-0 focus-visible:outline-none"
          >
            <AdminView />
          </TabsContent>
        </Tabs>
      </main>

      {/* ── Footer ─────────────────────────────────────────────────────── */}
      <footer className="border-t border-border bg-white py-3 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()}.{" "}
        <a
          href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline"
        >
          Built with ❤️ using caffeine.ai
        </a>
      </footer>

      <Toaster richColors position="top-center" />
    </div>
  );
}

export default function App() {
  return <AppInner />;
}
