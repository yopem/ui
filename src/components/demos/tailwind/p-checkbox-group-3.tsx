"use client";

import { useState } from "react";
import { Checkbox } from "@/components/ui/tailwind/checkbox";
import { CheckboxGroup } from "@/components/ui/tailwind/checkbox-group";
import { Label } from "@/components/ui/tailwind/label";

const frameworks = [
  { id: "next", name: "Next.js" },
  { id: "vite", name: "Vite" },
  { id: "astro", name: "Astro" },
];

export default function Particle() {
  const [value, setValue] = useState<string[]>([]);

  return (
    <CheckboxGroup
      allValues={frameworks.map((framework) => framework.id)}
      aria-labelledby="frameworks-caption"
      onValueChange={setValue}
      value={value}
    >
      <Label id="frameworks-caption">
        <Checkbox name="frameworks" parent />
        Frameworks
      </Label>

      {frameworks.map((framework) => (
        <Label className="ms-4" key={framework.id}>
          <Checkbox value={framework.id} />
          {framework.name}
        </Label>
      ))}
    </CheckboxGroup>
  );
}
