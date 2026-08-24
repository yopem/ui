"use client";

import { Button } from "@/components/ui/tailwind/button";
import { toastManager } from "@/components/ui/tailwind/toast";

export default function Particle() {
  return (
    <Button
      onClick={() => {
        toastManager.add({
          description: "Please wait while we process your request.",
          title: "Loading…",
          type: "loading",
        });
      }}
      variant="outline"
    >
      Loading Toast
    </Button>
  );
}
