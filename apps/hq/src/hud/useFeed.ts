"use client";

import { useEffect, useRef } from "react";
import { useHQ } from "../store";
import type { Feed, HqMode, OwnerFeed, PublicFeed } from "../types";

const POLL_MS = 4000;

/** Near-live polling. Handoffs become light pulses along the island paths. */
export function useFeed(mode: HqMode) {
  const setFeed = useHQ((s) => s.setFeed);
  const setFeedError = useHQ((s) => s.setFeedError);
  const addPulse = useHQ((s) => s.addPulse);
  const lastId = useRef(0);
  const routeCounts = useRef(new Map<string, number>());
  const firstLoad = useRef(true);

  useEffect(() => {
    let stopped = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const applyOwner = (feed: OwnerFeed) => {
      const fresh = feed.events.filter((e) => e.id > lastId.current);
      if (!firstLoad.current) {
        for (const e of fresh) {
          if (e.eventType === "handoff" && e.fromDivisionId && e.toDivisionId) {
            addPulse(e.fromDivisionId, e.toDivisionId, "handoff", 6);
          }
        }
      }
      lastId.current = feed.events.reduce((m, e) => Math.max(m, e.id), lastId.current);
    };

    const applyPublic = (feed: PublicFeed) => {
      for (const r of feed.routes) {
        const key = `${r.from}>${r.to}`;
        const before = routeCounts.current.get(key);
        if (!firstLoad.current && before !== undefined && r.count > before) addPulse(r.from, r.to, "handoff", 6);
        routeCounts.current.set(key, r.count);
      }
    };

    const poll = async () => {
      if (!document.hidden) {
        try {
          const res = await fetch(`/api/hq/events?mode=${mode}`, { credentials: "same-origin" });
          if (res.status === 401) {
            window.location.href = "/login";
            return;
          }
          if (!res.ok) throw new Error(String(res.status));
          const feed = (await res.json()) as Feed;
          if (stopped) return;
          if (feed.mode === "owner") applyOwner(feed);
          else applyPublic(feed);
          firstLoad.current = false;
          setFeed(feed);
        } catch {
          if (!stopped) setFeedError(true);
        }
      }
      if (!stopped) timer = setTimeout(poll, POLL_MS);
    };
    void poll();
    return () => {
      stopped = true;
      if (timer) clearTimeout(timer);
    };
  }, [mode, setFeed, setFeedError, addPulse]);
}
