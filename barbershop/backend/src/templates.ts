// templates.ts — render the {name} {time} {service} {shop} tokens (FR6).
// Shared by the live send path and the dry-run preview so they never diverge.

export interface TemplateContext {
  name?: string | null;
  startAt?: string | null; // ISO
  service?: string | null;
  shop?: string | null;
  timezone?: string;
}

function fmtTime(iso: string | null | undefined, timeZone?: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat("en-US", {
    timeZone, hour: "numeric", minute: "2-digit", hour12: true,
  }).format(d);
}

export function renderTemplate(tpl: string, ctx: TemplateContext): string {
  const map: Record<string, string> = {
    name: ctx.name ?? "",
    time: fmtTime(ctx.startAt, ctx.timezone),
    service: ctx.service ?? "appointment",
    shop: ctx.shop ?? "",
  };
  return tpl.replace(/\{(name|time|service|shop)\}/g, (_, k) => map[k] ?? "");
}
