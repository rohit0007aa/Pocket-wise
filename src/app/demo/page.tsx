"use client";

import React, { Suspense, useEffect } from "react";
import { useAppData } from "@/components/AppDataProvider";
import { WorkspaceShell } from "@/components/workspace/WorkspaceShell";

function DemoContent() {
  const { mode, setMode, dataset } = useAppData();

  useEffect(() => {
    if (mode !== "demo") {
      setMode("demo");
    }
  }, [mode, setMode]);

  if (!dataset || mode !== "demo") {
    return (
      <div className="min-h-screen bg-[#071510] flex items-center justify-center text-sm text-[#91A99B]">
        Loading interactive student demo...
      </div>
    );
  }

  return <WorkspaceShell />;
}

export default function DemoPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#071510] flex items-center justify-center text-sm text-[#91A99B]">
          Preparing PocketWise AI Demo...
        </div>
      }
    >
      <DemoContent />
    </Suspense>
  );
}
