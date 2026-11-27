"use client";

import React, { Suspense, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppData } from "@/components/AppDataProvider";
import { WorkspaceShell } from "@/components/workspace/WorkspaceShell";

function DashboardContent() {
  const router = useRouter();
  const { mode, setMode, dataset, loading } = useAppData();

  useEffect(() => {
    if (mode !== "authenticated") {
      setMode("authenticated");
    }
  }, [mode, setMode]);

  useEffect(() => {
    if (mode === "authenticated" && !loading && !dataset) {
      router.replace("/auth?mode=login");
    }
  }, [mode, loading, dataset, router]);

  if (loading || mode !== "authenticated" || !dataset) {
    return (
      <div className="min-h-screen bg-[#071510] flex items-center justify-center text-sm text-[#91A99B]">
        Loading your student workspace...
      </div>
    );
  }

  return <WorkspaceShell />;
}

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#071510] flex items-center justify-center text-sm text-[#91A99B]">
          Loading PocketWise AI Workspace...
        </div>
      }
    >
      <DashboardContent />
    </Suspense>
  );
}
