// templates.test.ts — token rendering (Deno test).
import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { renderTemplate } from "./templates.ts";

Deno.test("renders all tokens", () => {
  const out = renderTemplate(
    "Hi {name}, {service} tomorrow at {time} at {shop}.",
    { name: "Sam", startAt: "2026-06-02T18:30:00Z", service: "Cut", shop: "Fades", timezone: "America/New_York" },
  );
  // 18:30Z = 2:30 PM EDT
  assertEquals(out, "Hi Sam, Cut tomorrow at 2:30 PM at Fades.");
});

Deno.test("missing service falls back to 'appointment'; empty tokens blank", () => {
  const out = renderTemplate("{name}: {service}", { name: "Pat" });
  assertEquals(out, "Pat: appointment");
});
