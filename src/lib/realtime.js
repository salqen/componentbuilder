// ═══════════════════════════════════════════════════════════════
//  Fáza 4 — Realtime synchronizácia (WebQuote broadcast pattern)
//  Ephemeral broadcast kanál "cb-page-<id>" + presence počítadlo.
//  Žiadny extra DB setup — broadcast nepotrebuje tabuľky.
// ═══════════════════════════════════════════════════════════════
import { supabase, hasSupabase } from "./supabase.js";

export const clientId = Math.random().toString(36).slice(2, 10);

/**
 * Pripojí sa na kanál stránky.
 *  onData(data)      — prišli dáta od iného klienta (vlastné správy sa filtrujú)
 *  onPresence(count) — zmenil sa počet pripojených klientov
 * Vracia { send(data), leave() }.
 */
export function joinPage(pageId, { onData, onPresence } = {}) {
  if (!hasSupabase) return { send: () => {}, leave: () => {} };

  const ch = supabase.channel("cb-page-" + pageId, {
    config: { presence: { key: clientId }, broadcast: { self: false } },
  });

  if (onData) {
    ch.on("broadcast", { event: "data" }, ({ payload }) => {
      if (payload?.from !== clientId && payload?.data) onData(payload.data);
    });
  }
  if (onPresence) {
    ch.on("presence", { event: "sync" }, () =>
      onPresence(Object.keys(ch.presenceState()).length));
  }

  ch.subscribe((status) => {
    if (status === "SUBSCRIBED") ch.track({ at: Date.now() });
  });

  // throttle 250 ms — pri písaní neposielame každý znak
  let t = null, pending = null;
  const send = (data) => {
    pending = data;
    if (t) return;
    t = setTimeout(() => {
      ch.send({ type: "broadcast", event: "data", payload: { from: clientId, data: pending } });
      t = null;
    }, 250);
  };

  return {
    send,
    leave: () => { clearTimeout(t); supabase.removeChannel(ch); },
  };
}
