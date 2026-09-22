import React, { useState, useEffect, useRef, useCallback } from "react";
import { Flag, Users, ChevronRight, Radio, Settings, Plus, X, Clipboard, Lock, FileText, Upload, Printer } from "lucide-react";
import Papa from "papaparse";

// ---- Default course data (Denham GC, Spring Meeting) — fully editable in-app now ----
const DEFAULT_COURSE = {
  name: "Your Golf Club",
  eventName: "Spring Meeting",
  holes: [
    { par: 4, si: 17 }, { par: 4, si: 11 }, { par: 4, si: 3 }, { par: 4, si: 9 },
    { par: 3, si: 13 }, { par: 4, si: 5 }, { par: 4, si: 1 }, { par: 3, si: 15 },
    { par: 4, si: 7 }, { par: 4, si: 12 }, { par: 4, si: 4 }, { par: 3, si: 16 },
    { par: 5, si: 8 }, { par: 5, si: 14 }, { par: 4, si: 2 }, { par: 3, si: 18 },
    { par: 4, si: 6 }, { par: 4, si: 10 },
  ],
  tees: [
    { id: "W", label: "Back", cr: 72.0, slope: 129 },
    { id: "Y", label: "Front", cr: 70.7, slope: 127 },
  ],
};

// Shown at the bottom of the Admin screen, so it's always possible to
// confirm which version of the app a phone or laptop is really running.
const APP_VERSION = "21 Sep 2026 · build 63";

const DEFAULT_ORG_NAME_FALLBACK = "Your Golf Society";

// ---- Society crests ----
// Embedded here (small images) rather than kept as separate files, so
// updating the app stays a one-file job. A crest is shown in front of the
// society's name — in the app header and on the printed draw and
// leaderboard — whenever that name matches; any other name gets the flag.
const LUCIFER_LOGO = "data:image/png;base64,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";
const RADLEY_LOGO = "data:image/png;base64,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";

function logoForOrgName(orgName) {
  if (/lucifer/i.test(orgName || "")) return LUCIFER_LOGO;
  if (/radle/i.test(orgName || "")) return RADLEY_LOGO;
  return null;
}

function SocietyLogo({ orgName, height }) {
  const src = logoForOrgName(orgName);
  if (!src) return null;
  return <img src={src} alt="" style={{ height, width: "auto", display: "block", flexShrink: 0 }} />;
}

// ---- Which society's site is this? ----
// The SAME App.jsx runs on both sites. It looks at the web address it's
// being served from and picks that society's settings, so one file can be
// dropped into either GitHub repo without editing anything:
//   • an address containing "orgs" or "radle"  -> Old Radleian Golfing Society
//   • anything else (seeyourscore.netlify.app)  -> Lucifer Golfing Society
// These are only the STARTING values for a brand-new event, plus the code
// pre-filled on the opening screen — every event still keeps its own name,
// colours and PINs once set up.
const BRANDS = {
  lucifer: {
    orgName: "Lucifer Golfing Society",
    defaultEventCode: "LGS2026",
    helperSuffix: "LGS",
    headerColor: "#1F2A37",
    accentColor: "#3B6D8C",
    printColor: "#14275A",
  },
  orgs: {
    orgName: "Old Radleian Golfing Society",
    defaultEventCode: "ORGS2026",
    helperSuffix: "ORGS",
    headerColor: "#9B1B26",
    accentColor: "#1F2A37",
    printColor: "#9B1B26",
  },
};

function detectBrand() {
  try {
    return /orgs|radle/i.test(window.location.hostname) ? BRANDS.orgs : BRANDS.lucifer;
  } catch {
    return BRANDS.lucifer;
  }
}
const BRAND = detectBrand();
const DEFAULT_ORG_NAME = BRAND.orgName || DEFAULT_ORG_NAME_FALLBACK;
const STORAGE_PREFIX = "golf-live-scoreboard-v2";

// The event code that's pre-filled on the opening screen, so members only
// have to press Continue. Set per society in the BRANDS block above
// (defaultEventCode) — change it there for next year's event.
const DEFAULT_EVENT_CODE = BRAND.defaultEventCode;
const LAST_CODE_KEY = "golf-last-event-code";

// Whichever code this phone last used takes priority (so someone following
// a different event isn't pushed back to the default each time); otherwise
// the default above. Wrapped in try/catch because some browsers block
// storage in private mode — the default still works then.
function prefilledEventCode() {
  try {
    const last = sanitizeCode(window.localStorage.getItem(LAST_CODE_KEY));
    if (last) return last;
  } catch {
    // ignore
  }
  return DEFAULT_EVENT_CODE;
}

function sanitizeCode(raw) {
  return (raw || "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 20);
}

function storageKeyFor(code) {
  return `${STORAGE_PREFIX}-${code}`;
}

// PDFs are stored individually under their own key (base64 data URL as the
// value) rather than embedded in the main event blob — keeps the main
// event load fast even with several documents, since each PDF is only
// fetched when a player actually taps to open it.
function docStorageKey(code, docId) {
  return `${STORAGE_PREFIX}-${code}-doc-${docId}`;
}

const MAX_DOC_SIZE_MB = 4;

// Data URLs can hit browser navigation restrictions; converting to an
// object/blob URL first is the reliable way to actually open a PDF.
function dataUrlToBlobUrl(dataUrl) {
  const [header, base64] = dataUrl.split(",");
  const mimeMatch = /data:(.*?);base64/.exec(header);
  const mime = mimeMatch ? mimeMatch[1] : "application/pdf";
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return URL.createObjectURL(new Blob([bytes], { type: mime }));
}

// iOS's WKWebView (Safari and, especially, an installed PWA's own
// standalone webview) has a long-standing bug rendering multi-page PDFs
// inside an <iframe> — it can silently show only the first page with no
// scroll. iPadOS reports as "MacIntel" but is touch-capable, unlike an
// actual Mac, so that combination is checked too.
function isIOSDevice() {
  if (typeof navigator === "undefined") return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}

// ---- Working without a signal ----
// Every time an event loads successfully, a copy is kept on the phone
// itself. When the app is next opened that copy is shown straight away —
// so the draw, local rules and the last-seen leaderboard are there even
// with no signal at all, and appear instantly on a weak one — and it's
// replaced by the live version as soon as the server answers. The copy
// carries the server's version marker, so anything changed while offline
// is still merged in safely (never blindly overwritten) once back online.
function readCachedEvent(code) {
  try {
    const raw = window.localStorage.getItem(`golf-event-cache-${code}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || !parsed.state || !Array.isArray(parsed.state.rounds)) return null;
    // "pending" = changes made on this phone that hadn't reached the server
    // when the app was last closed (scores typed with no signal, say).
    // They're kept for 12 hours and sent as soon as there's a connection.
    const pendingFresh = parsed.pending && Array.isArray(parsed.pending.rounds) && Date.now() - (parsed.pendingAt || 0) < 12 * 60 * 60 * 1000;
    return { state: sanitizeState(parsed.state), etag: parsed.etag || null, savedAt: parsed.savedAt || 0, pending: pendingFresh ? sanitizeState(parsed.pending) : null };
  } catch {
    return null;
  }
}

function writeCachedEvent(code, state, etag, pending) {
  try {
    window.localStorage.setItem(
      `golf-event-cache-${code}`,
      JSON.stringify({ state, etag: etag || null, savedAt: Date.now(), pending: pending || null, pendingAt: pending ? Date.now() : 0 })
    );
  } catch {
    // storage full or blocked — the app simply won't have an offline copy
  }
}

// A request on a very weak signal can hang for minutes without failing.
// Give up after 12 seconds so the phone's saved copy (or a clear message)
// is shown instead of an endless "Loading…".
function withTimeout(promise, ms) {
  return Promise.race([promise, new Promise((_, reject) => setTimeout(() => reject(new Error("timed out")), ms))]);
}

// ---- Organiser access ----
// Typing the event code with a suffix on the end opens the very same event
// as the plain code, but marks THIS phone or laptop as an organiser's
// device, which is what makes the Admin tab appear. Everyone using the
// plain code never sees an Admin tab at all. There are two levels:
//   • ORGS2026WESB  (OWNER_SUFFIX)  — full control, including the PINs,
//     Backup & restore and switching event.
//   • ORGS2026ORGS / LGS2026LGS (the society's own initials, set per site
//     in BRANDS) — a HELPER: everything needed to run the day (draw,
//     scores, rules, printing) but no access to PINs, backups or
//     switching event, so only the owner can change the locks.
// Either way the Admin PIN is still asked for — the suffix only decides
// whether the tab is shown and what's in it; the PIN remains the lock.
// The device keeps its level until "Hide the Admin tab on this device" is
// tapped in Admin.
const OWNER_SUFFIX = "WESB";
const ADMIN_SUFFIX = OWNER_SUFFIX; // kept for anything still using the old name

function helperSuffix() {
  return (BRAND.helperSuffix || "").toUpperCase();
}

// Returns { code, level } where level is "owner", "helper" or "" (plain code).
function splitAdminCode(raw) {
  const full = sanitizeCode(raw);
  const strip = (suffix) => (suffix && full.length > suffix.length && full.endsWith(suffix) ? full.slice(0, -suffix.length) : null);
  const asOwner = strip(OWNER_SUFFIX);
  if (asOwner) return { code: asOwner, level: "owner", admin: true };
  const asHelper = strip(helperSuffix());
  if (asHelper) return { code: asHelper, level: "helper", admin: true };
  return { code: full, level: "", admin: false };
}

// The level this device holds for an event: "owner", "helper" or "".
// (A device marked before levels existed holds "1" — treated as owner,
// since only the owner had the suffix then.)
function isAdminDevice(code) {
  if (!code) return "";
  try {
    const v = window.localStorage.getItem(`golf-admin-device-${code}`);
    if (v === "1" || v === "owner") return "owner";
    if (v === "helper") return "helper";
    return "";
  } catch {
    return "";
  }
}

function setAdminDevice(code, level) {
  if (!code) return;
  try {
    if (level) window.localStorage.setItem(`golf-admin-device-${code}`, level);
    else window.localStorage.removeItem(`golf-admin-device-${code}`);
  } catch {
    // ignore — without storage the suffix simply has to be typed each time
  }
}

// On an organiser's device the Admin PIN is remembered after the first
// successful unlock, so the PIN box comes up already filled in and it's
// just a press of Unlock. Forgotten again by "Hide the Admin tab on this
// device". (If the PIN is later changed, the remembered one simply fails
// once and the new one is remembered instead.)
function rememberedAdminPin(code) {
  try {
    return window.localStorage.getItem(`golf-admin-pin-${code}`) || "";
  } catch {
    return "";
  }
}

function rememberAdminPin(code, pin) {
  try {
    if (pin) window.localStorage.setItem(`golf-admin-pin-${code}`, pin);
    else window.localStorage.removeItem(`golf-admin-pin-${code}`);
  } catch {
    // ignore
  }
}

function codeFromUrl() {
  try {
    const { code, level } = splitAdminCode(new URLSearchParams(window.location.search).get("code"));
    if (level) {
      // Remember this device, then take the suffix straight back out of
      // the address bar so a copied or shared link never gives it away.
      setAdminDevice(code, level);
      const url = new URL(window.location.href);
      url.searchParams.set("code", code);
      window.history.replaceState(null, "", url);
    }
    return code;
  } catch {
    return "";
  }
}
const LIBRARY_KEY = "golf-course-library-v1";
const OUT = [1,2,3,4,5,6,7,8,9], IN = [10,11,12,13,14,15,16,17,18];

function coursePar(course) {
  return course.holes.reduce((sum, h) => sum + Number(h.par || 0), 0);
}

function getTee(course, teeLabel) {
  const target = (teeLabel || "").trim().toLowerCase();
  return course.tees.find((t) => t.label.trim().toLowerCase() === target) || course.tees[0];
}

// True if a player's stored tee doesn't exactly match any of this
// course's real tees — meaning getTee() is silently falling back to
// whichever tee happens to be listed first, which may not be the tee
// they're actually meant to be playing (and produces a wrong playing
// handicap without any obvious sign of it).
function teeMismatch(course, teeLabel) {
  if (!teeLabel) return true;
  const target = teeLabel.trim().toLowerCase();
  return !course.tees.some((t) => t.label.trim().toLowerCase() === target);
}

function playingHandicap(course, index, teeId) {
  const t = getTee(course, teeId);
  if (!t) return 0;
  return Math.round(index * (t.slope / 113) + (t.cr - coursePar(course)));
}

// A club's handicap allowance (e.g. 95%) is applied as a percentage of the
// already-calculated course handicap, not the raw index.
function allowedHandicap(rawCH, allowancePct) {
  return Math.round(rawCH * ((allowancePct ?? 100) / 100));
}

// Foursomes/alternate-shot combined handicap: each partner's own allowed
// course handicap, averaged, with an exact half rounding UP (14.5 -> 15).
function combinedHandicap(course, player, allowancePct) {
  const rawA = playingHandicap(course, Number(player.index) || 0, player.tee);
  const rawB = playingHandicap(course, Number(player.partnerIndex) || 0, player.partnerTee);
  const allowedA = allowedHandicap(rawA, allowancePct) + (Number(player.handicapAdjustment) || 0);
  const allowedB = allowedHandicap(rawB, allowancePct) + (Number(player.partnerHandicapAdjustment) || 0);
  return Math.floor((allowedA + allowedB) / 2 + 0.5);
}

function strokesOnHole(course, ph, holeIdx) {
  const si = course.holes[holeIdx].si;
  let s = ph >= si ? 1 : 0;
  if (ph > 18) s += (ph - 18) >= si ? 1 : 0;
  return s;
}

// A gross of 0 means the hole was picked up / not completed (a "wipe" in
// Stableford): 0 points, and the card has no gross or net score.
function isPickedUp(gross) {
  return gross !== "" && gross != null && Number(gross) === 0;
}

function holePoints(course, gross, holeIdx, ph) {
  if (gross == null || gross === "") return null;
  if (isPickedUp(gross)) return 0;
  const net = Number(gross) - strokesOnHole(course, ph, holeIdx);
  return Math.max(0, 2 - (net - course.holes[holeIdx].par));
}

// isFoursomes: whether this round is alternate-shot — determines whether ph
// comes from one player's allowed handicap or a combined pair handicap.
// Always computes both Stableford points and net/medal figures — cheap to
// do both, and it's the "scoring" mode that decides which one is shown.
function totals(course, player, allowancePct = 100, isFoursomes = false) {
  const ph = isFoursomes
    ? combinedHandicap(course, player, allowancePct)
    : allowedHandicap(playingHandicap(course, Number(player.index) || 0, player.tee), allowancePct) + (Number(player.handicapAdjustment) || 0);
  let pts = 0, thru = 0, netTotal = 0, parSoFar = 0, grossTotal = 0, pickedUp = 0;
  const scores = Array.isArray(player.scores) ? player.scores : Array(18).fill("");
  scores.forEach((g, i) => {
    if (g == null || g === "") return;
    thru += 1;
    if (isPickedUp(g)) { pickedUp += 1; return; } // 0 points, no gross/net for the card
    const strokes = strokesOnHole(course, ph, i);
    netTotal += Number(g) - strokes;
    grossTotal += Number(g);
    parSoFar += course.holes[i].par;
    const p = holePoints(course, g, i, ph);
    if (p !== null) pts += p;
  });
  // nr: a hole was picked up, so there is no gross or net score to return
  return { ph, pts, thru, netTotal, grossTotal, relToPar: netTotal - parSoFar, pickedUp, nr: pickedUp > 0 };
}

// A card only counts towards any leaderboard once Admin has pressed
// COMPLETE on it — until then the scores are saved (nothing is lost if
// you're interrupted halfway through a card) but stay private to Admin.
// Cards entered before this feature existed have no flag at all; those
// keep showing, so nothing already on a leaderboard disappears.
function isScoreComplete(p) {
  if (p.scoresComplete === true) return true;
  if (p.scoresComplete === false) return false;
  return Array.isArray(p.scores) && p.scores.some((s) => s !== "" && s != null);
}

// ---- Attesting a card (players' score entry only) ----
// When a marker presses COMPLETE on someone else's card from their own
// phone, the card isn't posted straight away: it's "submitted" and waits
// for the player to check it and sign, from a DIFFERENT phone (the one
// that submitted it can't sign it). Only then does scoresComplete go true
// and the card reach the leaderboard. Admin's own entry screen posts a
// card directly, as before, and Admin can sign any waiting card.
function awaitingSignature(p) {
  if (!p || !p.submitted || p.scoresComplete === true) return false;
  return Array.isArray(p.scores) && p.scores.some((v) => v !== "" && v != null);
}

// ---- A player's own private card ----
// While marking someone else's card on their phone, a player can keep
// their OWN scores alongside it. That copy lives only on this phone —
// it is never sent to the server and never reaches a leaderboard — and
// is there purely so that, when their marker's card comes to them to
// sign, they can compare the two hole by hole.
function ownCardKey(code, roundId) {
  return `golf-own-card-${code}-${roundId}`;
}
function readOwnCard(code, roundId) {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(ownCardKey(code, roundId)) || "null");
    if (!parsed || !Array.isArray(parsed.scores) || parsed.scores.length !== 18) return { name: "", scores: Array(18).fill("") };
    return { name: typeof parsed.name === "string" ? parsed.name : "", scores: parsed.scores };
  } catch {
    return { name: "", scores: Array(18).fill("") };
  }
}
function writeOwnCard(code, roundId, card) {
  try { window.localStorage.setItem(ownCardKey(code, roundId), JSON.stringify(card)); } catch { /* ignore */ }
}

// What the leaderboards are allowed to see of a player: their real card
// once complete, otherwise a blank one ("not started").
function forLeaderboard(p) {
  return isScoreComplete(p) ? p : { ...p, scores: Array(18).fill("") };
}

function emptyPlayer(course, isFoursomes = false) {
  const base = { id: crypto.randomUUID(), name: "", index: "", tee: course.tees[0]?.label || "W", competition: "", scores: Array(18).fill("") };
  if (isFoursomes) {
    return { ...base, partnerName: "", partnerIndex: "", partnerTee: course.tees[0]?.label || "W", partnerCompetition: "" };
  }
  return base;
}

// ---- Spreadsheet import via paste (no native file picker in this sandbox) ----
// Accepts rows copied straight out of Excel / Numbers / Google Sheets, with
// or without a header row, tab- or comma-separated: Name, Handicap Index, Tee.
function parsePastedPlayers(text, course) {
  // Real spreadsheet copy/paste always separates columns with tabs, never
  // commas — forcing tab-only parsing means a comma inside a name (e.g.
  // "Bailey, William") stays intact as one field instead of being split.
  const parsed = Papa.parse(text.trim(), { delimiter: "\t", skipEmptyLines: true });
  let rows = parsed.data;
  if (rows.length === 0) return [];

  // If the second column of the first row isn't a plausible handicap number,
  // treat that row as a header and drop it.
  const first = rows[0];
  const secondCell = (first[1] || "").replace(",", ".").trim();
  if (first.length > 1 && secondCell !== "" && isNaN(Number(secondCell))) {
    rows = rows.slice(1);
  }

  return rows
    .map((cols) => {
      const name = (cols[0] || "").trim();
      const index = (cols[1] || "").trim();
      const teeRaw = (cols[2] || "").trim().toLowerCase();
      let teeId = course.tees[0]?.label || "";
      if (teeRaw) {
        const match = course.tees.find(
          (t) => t.label.toLowerCase() === teeRaw || t.id.toLowerCase() === teeRaw
        );
        if (match) teeId = match.label; // the tee's NAME is what's stored on a player (it used to store the internal id, which never matched)
      }
      return { id: crypto.randomUUID(), name, index, tee: teeId, scores: Array(18).fill("") };
    })
    .filter((p) => p.name);
}

function isValidCourse(c) {
  return !!c && Array.isArray(c.holes) && c.holes.length > 0 && Array.isArray(c.tees) && c.tees.length > 0;
}

const DEFAULT_PIN = "1234";

const MAX_ROUNDS = 6;

function formatRelToPar(rel) {
  if (rel === 0) return "E";
  return rel > 0 ? `+${rel}` : `${rel}`;
}

// A 4-ball is two pairs playing each other — show it as "A & B v C & D"
// rather than joining all four names the same way.
function formatGroupNames(names) {
  if (!names || names.length === 0) return "";
  if (names.length === 4) {
    return `${names[0]} & ${names[1]} v ${names[2]} & ${names[3]}`;
  }
  return names.join(" & ");
}

// Searches BOTH the primary name and (for existing pairs) the partner name
// — necessary because once someone is stored as a partner rather than a
// primary roster entry, a plain name-only lookup can no longer see them,
// which would silently lose their handicap on a later re-pairing.
// Trims, lowercases, and collapses any run of whitespace to a single space
// — makes name-matching forgiving of things like a stray double-space from
// pasting, which would otherwise silently fail an exact-match lookup.
function normalizeName(name) {
  return (name || "").trim().replace(/\s+/g, " ").toLowerCase();
}

function findIndividualByName(rosterPlayers, name) {
  const target = normalizeName(name);
  if (!target) return null;
  for (const p of rosterPlayers) {
    if (normalizeName(p.name) === target) {
      return { index: p.index, tee: p.tee, competition: p.competition, handicapAdjustment: p.handicapAdjustment };
    }
    if (normalizeName(p.partnerName) === target) {
      return { index: p.partnerIndex, tee: p.partnerTee, competition: p.partnerCompetition, handicapAdjustment: p.partnerHandicapAdjustment };
    }
  }
  return null;
}

// Builds Foursomes roster pairs straight from the draw's groupings — every
// draw entry's names are taken two at a time (1st+2nd, 3rd+4th within that
// group), pulling each person's existing handicap/tee from the current
// roster by name. This replaces the whole roster with proper pairs.
function pairPlayersFromDraw(players, draw, course) {
  const validTee = (teeLabel) => (teeLabel && course.tees.some((t) => t.label === teeLabel)) ? teeLabel : course.tees[0]?.label || "";
  const pairs = [];
  draw.forEach((entry) => {
    const names = entry.players || [];
    for (let i = 0; i < names.length; i += 2) {
      const nameA = names[i];
      const nameB = names[i + 1];
      if (!nameA) continue;
      const pA = findIndividualByName(players, nameA);
      const pB = nameB ? findIndividualByName(players, nameB) : null;
      pairs.push({
        id: crypto.randomUUID(),
        name: nameA,
        index: pA ? pA.index : "",
        tee: validTee(pA && pA.tee),
        competition: pA ? pA.competition || "" : "",
        handicapAdjustment: pA ? Number(pA.handicapAdjustment) || 0 : 0,
        scores: Array(18).fill(""),
        partnerName: nameB || "",
        partnerIndex: pB ? pB.index : "",
        partnerTee: validTee(pB && pB.tee),
        partnerCompetition: pB ? pB.competition || "" : "",
        partnerHandicapAdjustment: pB ? Number(pB.handicapAdjustment) || 0 : 0,
      });
    }
  });
  return pairs;
}

// Same idea as pairPlayersFromDraw, but preserves real entered scores for
// any pair that's still grouped the same way — used for live display
// (e.g. the leaderboard) so results are always correct straight from the
// draw, without depending on the stored roster having been separately
// resynced first. Round-agnostic (course is a parameter, not a closure),
// so it works for any round, not just the one currently being viewed.
function mergedPairsFromDraw(players, draw, course) {
  const freshPairs = pairPlayersFromDraw(players, draw, course);
  const merged = freshPairs.map((np) => {
    const existing = players.find(
      (p) => normalizeName(p.name) === normalizeName(np.name) && normalizeName(p.partnerName) === normalizeName(np.partnerName)
    );
    return existing
      ? { ...np, id: existing.id, index: existing.index, tee: existing.tee, competition: existing.competition, partnerIndex: existing.partnerIndex, partnerTee: existing.partnerTee, partnerCompetition: existing.partnerCompetition, handicapAdjustment: Number(existing.handicapAdjustment) || 0, partnerHandicapAdjustment: Number(existing.partnerHandicapAdjustment) || 0, scores: existing.scores, scoresComplete: existing.scoresComplete, entryLock: existing.entryLock || null }
      : np;
  });
  // Preserve anyone on the roster who isn't part of the draw's groupings
  // at all yet — still sitting unassigned in the pool, not yet dragged
  // into a pairing. Without this, saving the draw would silently drop
  // them from the roster entirely, since this function otherwise only
  // ever returns pairs actually built from the draw itself.
  const namesInDraw = new Set(draw.flatMap((entry) => entry.players || []).map(normalizeName));
  const unassigned = players.filter(
    (p) => p.name && !namesInDraw.has(normalizeName(p.name)) && !namesInDraw.has(normalizeName(p.partnerName))
  );
  return [...merged, ...unassigned];
}

function individualPH(course, rosterPlayer, allowancePct) {
  if (!rosterPlayer) return null;
  const base = allowedHandicap(playingHandicap(course, Number(rosterPlayer.index) || 0, rosterPlayer.tee), allowancePct);
  return base + (Number(rosterPlayer.handicapAdjustment) || 0);
}

function pairPH(course, rosterPlayers, allowancePct, nameA, nameB) {
  const a = findIndividualByName(rosterPlayers, nameA);
  const b = findIndividualByName(rosterPlayers, nameB);
  if (!a || !b) return null;
  const allowedA = individualPH(course, a, allowancePct);
  const allowedB = individualPH(course, b, allowancePct);
  return Math.floor((allowedA + allowedB) / 2 + 0.5);
}

// One person's name with their handicap details — "Will Bailey (3.3/6)":
// handicap index / course handicap for THIS day's course (after the day's
// allowance and any one-off adjustment). Shown the same way on Singles and
// Foursomes days, so the "Course handicap" switch always does something;
// on a Foursomes day the pair's combined figure then follows the pair.
function nameWithHandicaps(n, course, rosterPlayers, allowancePct, showIndex, showCH) {
  const p = findIndividualByName(rosterPlayers, n);
  const idx = p && p.index !== "" && p.index != null ? p.index : null;
  const idxPart = showIndex && idx !== null ? idx : null;
  const ph = showCH && idx !== null ? individualPH(course, p, allowancePct) : null;
  // A * marks anyone whose handicap has been adjusted for this day only
  // (shots added or taken off in Draw setup / Enter scores).
  const star = p && Number(p.handicapAdjustment) ? "*" : "";
  if (idxPart !== null && ph !== null) return `${n} (${idxPart}/${ph}${star})`;
  if (idxPart !== null) return `${n} (${idxPart})${star}`;
  if (ph !== null) return `${n} (${ph}${star})`;
  return `${n}${star}`;
}

const ADJUSTED_FOOTNOTE = "* handicap adjusted for this competition";

function anyHandicapAdjusted(players) {
  return (players || []).some((p) => Number(p.handicapAdjustment) || Number(p.partnerHandicapAdjustment));
}

// Splits a Foursomes group into its pairs — names two at a time, however
// many there are (a lone pair, the usual two pairs, or an odd one left
// over while a draw is still being built).
function foursomesPairs(names) {
  const pairs = [];
  for (let i = 0; i < names.length; i += 2) pairs.push(names.slice(i, i + 2));
  return pairs;
}

function pairText(pair, course, rosterPlayers, allowancePct, showIndex, showCH) {
  const people = pair.map((n) => nameWithHandicaps(n, course, rosterPlayers, allowancePct, showIndex, showCH)).join(" & ");
  if (pair.length < 2 || !showCH) return people;
  const combined = pairPH(course, rosterPlayers, allowancePct, pair[0], pair[1]);
  const pairStar = pair.some((n) => Number((findIndividualByName(rosterPlayers, n) || {}).handicapAdjustment)) ? "*" : "";
  // The pair's playing handicap follows in brackets. The ⟦ ⟧ markers are
  // invisible to the reader: withBoldFigures (below) turns whatever sits
  // between them into bold when the line is put on screen or paper.
  return combined !== null ? `${people} ⟦(${combined}${pairStar})⟧` : people;
}

// Turns a draw line into what's actually displayed: any ⟦marked⟧ figure —
// a Foursomes pair's playing handicap — comes out in bold.
function withBoldFigures(line) {
  const parts = String(line).split(/⟦|⟧/);
  if (parts.length === 1) return line;
  return parts.map((part, i) => (i % 2 === 1 ? <strong key={i} style={{ fontWeight: 800 }}>{part}</strong> : <React.Fragment key={i}>{part}</React.Fragment>));
}

// Draw groups only ever store names (not full player records), so shots are
// looked up against the current roster + course each time this renders —
// meaning it's always correct for whichever course this day is set to,
// with no separate step to keep it in sync.
function formatGroupNamesWithShots(names, course, rosterPlayers, allowancePct, isFoursomes, opts) {
  if (!names || names.length === 0) return "";
  const { showIndex = true, showCH = true } = opts || {};
  if (isFoursomes) {
    return foursomesPairs(names).map((pair) => pairText(pair, course, rosterPlayers, allowancePct, showIndex, showCH)).join(" v ");
  }
  const each = names.map((n) => nameWithHandicaps(n, course, rosterPlayers, allowancePct, showIndex, showCH));
  if (each.length === 4) return `${each[0]} & ${each[1]} v ${each[2]} & ${each[3]}`;
  return each.join(" & ");
}

// Same calculation as formatGroupNamesWithShots, but returns an array of
// separate lines to stack vertically instead of one line joined with "&" —
// so a group of 3 or 4 never has to squeeze onto a single horizontal line,
// which doesn't fit a phone screen width. Singles gets one line per
// player; Foursomes gets one line per pair (each partner's own figures,
// then the pair's combined handicap).
function formatGroupLines(names, course, rosterPlayers, allowancePct, isFoursomes, opts) {
  if (!names || names.length === 0) return [];
  const { showIndex = true, showCH = true, showTee = true, showComp = true } = opts || {};

  // Tee and competition abbreviation, appended onto the same line — e.g.
  // "Will Bailey (3.3/6) – Club · PWC". showTee/showComp independently
  // control each half.
  const detailsFor = (n) => {
    const p = findIndividualByName(rosterPlayers, n);
    const parts = [];
    if (showTee && p && p.tee) parts.push(p.tee);
    if (showComp && p && p.competition) parts.push(p.competition);
    return parts.join(" · ");
  };

  if (isFoursomes) {
    return foursomesPairs(names).map((pair) => {
      const main = pairText(pair, course, rosterPlayers, allowancePct, showIndex, showCH);
      // If both partners share the same tee/competition, show it once
      // rather than repeating it — otherwise show each partner's own.
      const details = [...new Set(pair.map(detailsFor))].filter(Boolean).join(" / ");
      return details ? `${main} – ${details}` : main;
    });
  }
  return names.map((n) => {
    const main = nameWithHandicaps(n, course, rosterPlayers, allowancePct, showIndex, showCH);
    const details = detailsFor(n);
    return details ? `${main} – ${details}` : main;
  });
}

function emptyRound(label, course) {
  return {
    id: crypto.randomUUID(),
    label,
    date: "", // optional YYYY-MM-DD — when set, rounds sort chronologically by this
    course: course || DEFAULT_COURSE,
    players: [],
    draw: [],
    matches: [], // Match Play only — [{ id, playerA, playerB, result }]
    competitions: [], // this day's own sub-competitions — [{ id, abbreviation, fullName }] — a new day always starts with a clean sheet, separate from every other day's
    localRules: "",
    startingHole: "1st",
    format: "individual", // individual | foursomes | matchplay
    scoring: "stableford", // stableford | medal
    handicapAllowance: 100, // percentage of course handicap allowed
    drawStartTime: "09:00",
    drawInterval: 8,
    drawNote: "", // short note to players, shown at the top of the Draw screen and printed on scorecard labels
    publicShowIndex: true, // what the PUBLIC Draw tab shows — separate from the admin-only preview switches
    publicShowCH: true,
    publicShowTee: true,
    publicShowComp: true,
    publicShowStartTee: true,
    publicShowGross: true, // this day's leaderboard — gross/net/points columns
    publicShowNet: true,
    publicShowPoints: true,
    publicScoreEntry: false, // Admin switch — lets players open "Enter scores" for this day and help put cards in
    requireSignature: true, // ...and whether a card a player enters must then be signed by the player from their own phone
    publicShowDayBoard: false, // master switch — whether "This day" leaderboard is offered to the public at all
  };
}

function sanitizeRound(r, fallbackLabel, legacyCompetitions) {
  return {
    id: typeof r.id === "string" && r.id ? r.id : crypto.randomUUID(),
    label: typeof r.label === "string" && r.label ? r.label : fallbackLabel,
    date: typeof r.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(r.date) ? r.date : "",
    course: isValidCourse(r.course) ? r.course : DEFAULT_COURSE,
    players: Array.isArray(r.players) ? r.players : [],
    draw: Array.isArray(r.draw) ? r.draw : [],
    // A round saved before per-day competitions existed has no
    // r.competitions of its own — in that one case (and that case only)
    // fall back to whatever was in the old event-wide list, so an
    // existing day like "Day 1" keeps the competitions it already had
    // rather than appearing to lose them. Any round that already has
    // its own competitions array (including a deliberately empty one)
    // keeps exactly that.
    competitions: Array.isArray(r.competitions) ? r.competitions : (Array.isArray(legacyCompetitions) ? legacyCompetitions : []),
    matches: Array.isArray(r.matches)
      ? r.matches.filter((m) => m && typeof m === "object").map((m) => ({
          id: typeof m.id === "string" && m.id ? m.id : crypto.randomUUID(),
          playerA: typeof m.playerA === "string" ? m.playerA : "",
          partnerA: typeof m.partnerA === "string" ? m.partnerA : "", // optional — a second player makes this side's half of a Foursomes match
          playerB: typeof m.playerB === "string" ? m.playerB : "",
          partnerB: typeof m.partnerB === "string" ? m.partnerB : "",
          result: typeof m.result === "string" ? m.result : "",
        }))
      : [],
    localRules: typeof r.localRules === "string" ? r.localRules : "",
    startingHole: typeof r.startingHole === "string" && r.startingHole ? r.startingHole : "1st",
    format: r.format === "foursomes" ? "foursomes" : r.format === "matchplay" ? "matchplay" : "individual",
    scoring: r.scoring === "medal" ? "medal" : "stableford",
    handicapAllowance: typeof r.handicapAllowance === "number" && r.handicapAllowance > 0 ? r.handicapAllowance : 100,
    drawStartTime: typeof r.drawStartTime === "string" && r.drawStartTime ? r.drawStartTime : "09:00",
    drawInterval: typeof r.drawInterval === "number" && r.drawInterval > 0 ? r.drawInterval : 8,
    drawNote: typeof r.drawNote === "string" ? r.drawNote : "",
    publicShowIndex: r.publicShowIndex === false ? false : true,
    publicShowCH: r.publicShowCH === false ? false : true,
    publicShowTee: r.publicShowTee === false ? false : true,
    publicShowComp: r.publicShowComp === false ? false : true,
    publicShowStartTee: r.publicShowStartTee === false ? false : true,
    publicShowGross: r.publicShowGross === false ? false : true,
    publicShowNet: r.publicShowNet === false ? false : true,
    publicShowPoints: r.publicShowPoints === false ? false : true,
    publicScoreEntry: r.publicScoreEntry === true,
    requireSignature: r.requireSignature === false ? false : true,
    publicShowDayBoard: r.publicShowDayBoard === true ? true : false,
  };
}

// Sorts rounds by date when set — anyone without a date keeps their
// existing relative position, pushed after the dated ones.
function sortRoundsByDate(rounds) {
  const dated = rounds.filter((r) => r.date).sort((a, b) => a.date.localeCompare(b.date));
  const undated = rounds.filter((r) => !r.date);
  return [...dated, ...undated];
}

// Turns a stored YYYY-MM-DD into something readable, e.g. "23 Oct 2026" —
// used wherever a round's date is shown to players, not just admins.
function formatDisplayDate(dateStr) {
  if (!dateStr) return "";
  const [y, m, d] = dateStr.split("-").map(Number);
  if (!y || !m || !d) return "";
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

// Full month name, used specifically on printed labels for a more formal look.
function formatDisplayDateLong(dateStr) {
  if (!dateStr) return "";
  const [y, m, d] = dateStr.split("-").map(Number);
  if (!y || !m || !d) return "";
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

// ---- Card locks, for when players help enter scores ----
// Opening a card stamps it with { by: this device, claimedAt, at }. Other
// phones then show it as "being entered on another phone" and won't open
// it. There's no central server to grant locks, so two phones CAN tap the
// same card in the same few seconds; when their saves meet, the EARLIER
// claim wins (see pickLock, used by the merge below) and the later phone
// is sent back to the list. A lock lapses after 3 minutes without a score
// being typed, so a phone that's closed mid-card never blocks it for long.
const ENTRY_LOCK_MS = 3 * 60 * 1000;

function getDeviceId() {
  try {
    let id = window.localStorage.getItem("golf-device-id");
    if (!id) {
      id = crypto.randomUUID();
      window.localStorage.setItem("golf-device-id", id);
    }
    return id;
  } catch {
    return `session-${Math.random().toString(36).slice(2)}`;
  }
}

function lockHeldByOther(p, deviceId) {
  const l = p && p.entryLock;
  return !!(l && l.by && l.by !== deviceId && Date.now() - (l.at || 0) < ENTRY_LOCK_MS);
}

function pickLock(a, b) {
  if (!a) return b || null;
  if (!b) return a;
  if (a.by === b.by) return (a.at || 0) >= (b.at || 0) ? a : b;
  if ((a.claimedAt || 0) !== (b.claimedAt || 0)) return (a.claimedAt || 0) < (b.claimedAt || 0) ? a : b;
  return String(a.by) < String(b.by) ? a : b;
}

// ---- Three-way merge, used only when two devices saved at the same time ----
// base   = the last version this device knows the server had
// mine   = this device's current data (base + whatever was just changed here)
// theirs = what's actually on the server now (base + someone else's changes)
// The result keeps BOTH sets of changes. Only when both devices changed the
// very same value (e.g. the same player's score on the same hole) does one
// have to win — and that's this device's, since it's the most recent action.
function deepEqual(a, b) {
  if (a === b) return true;
  if (typeof a !== typeof b || a === null || b === null || typeof a !== "object") return false;
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  if (Array.isArray(a)) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) if (!deepEqual(a[i], b[i])) return false;
    return true;
  }
  const ka = Object.keys(a);
  const kb = Object.keys(b);
  if (ka.length !== kb.length) return false;
  for (const k of ka) if (!Object.prototype.hasOwnProperty.call(b, k) || !deepEqual(a[k], b[k])) return false;
  return true;
}

const isPlainObject = (v) => v !== null && typeof v === "object" && !Array.isArray(v);
const isKeyedList = (v) => Array.isArray(v) && v.every((x) => isPlainObject(x) && typeof x.id === "string" && x.id);
const isPrimitiveList = (v) => Array.isArray(v) && v.every((x) => x === null || typeof x !== "object");

function merge3(base, mine, theirs) {
  if (deepEqual(mine, theirs)) return mine;
  if (deepEqual(mine, base)) return theirs; // only they changed it
  if (deepEqual(theirs, base)) return mine; // only I changed it

  // Both changed it — try to combine at a finer grain.
  if (isPlainObject(mine) && isPlainObject(theirs)) {
    const b = isPlainObject(base) ? base : {};
    const out = {};
    const keys = new Set([...Object.keys(theirs), ...Object.keys(mine)]);
    for (const k of keys) {
      const inMine = Object.prototype.hasOwnProperty.call(mine, k);
      const inTheirs = Object.prototype.hasOwnProperty.call(theirs, k);
      if (k === "entryLock" && inMine && inTheirs && !deepEqual(mine[k], theirs[k])) out[k] = pickLock(mine[k], theirs[k]);
      else if (inMine && inTheirs) out[k] = merge3(b[k], mine[k], theirs[k]);
      else if (inMine) out[k] = mine[k];
      else out[k] = theirs[k];
    }
    return out;
  }

  // Lists of records that each carry an id (rounds, players, matches,
  // competitions, documents, roster) — merge record by record.
  if (isKeyedList(mine) && isKeyedList(theirs) && (mine.length > 0 || theirs.length > 0)) {
    const b = isKeyedList(base) ? base : [];
    const baseById = new Map(b.map((x) => [x.id, x]));
    const mineById = new Map(mine.map((x) => [x.id, x]));
    const theirsById = new Map(theirs.map((x) => [x.id, x]));
    const out = [];
    const seen = new Set();
    const consider = (id) => {
      if (seen.has(id)) return;
      seen.add(id);
      const bi = baseById.get(id);
      const mi = mineById.get(id);
      const ti = theirsById.get(id);
      if (mi && ti) out.push(merge3(bi, mi, ti));
      else if (mi && !ti) {
        // They removed it (or never had it). Keep it if it's new here, or
        // if I changed it since — never silently drop an edit.
        if (!bi || !deepEqual(mi, bi)) out.push(mi);
      } else if (ti && !mi) {
        if (!bi || !deepEqual(ti, bi)) out.push(ti);
      }
    };
    // Keep the order of whichever side reordered/added; default to mine.
    const mineOrderChanged = !deepEqual(mine.map((x) => x.id), b.map((x) => x.id));
    const first = mineOrderChanged ? mine : theirs;
    const second = mineOrderChanged ? theirs : mine;
    first.forEach((x) => consider(x.id));
    second.forEach((x) => consider(x.id));
    return out;
  }

  // Fixed-length lists of plain values (a player's 18 hole scores, a draw
  // row's 4 slots) — merge position by position.
  if (isPrimitiveList(mine) && isPrimitiveList(theirs) && mine.length === theirs.length) {
    const b = isPrimitiveList(base) && base.length === mine.length ? base : null;
    if (b) return mine.map((v, i) => (v !== b[i] ? v : theirs[i]));
  }

  // Genuinely the same value changed on both sides — most recent action wins.
  return mine;
}

const DEFAULT_STATE = {
  orgName: DEFAULT_ORG_NAME,
  accentColor: BRAND.accentColor,
  headerColor: BRAND.headerColor,
  rev: 0, // goes up by one with every save — lets a device recognise (and ignore) an out-of-date copy from the server
  pin: DEFAULT_PIN,
  handicapPin: "0000", // separate, lighter-weight code for players checking/updating their own handicap
  rounds: [emptyRound("Day 1")],
  activeRoundId: null, // resolved to rounds[0].id at use-time if null/stale
  documents: [], // event-wide, not tied to any particular day
  societyRoster: [], // event-wide list of known members — [{ id, name, index, tee }] — a source to pick from when building a day's draw, rather than re-entering names each time
};

// Which day the app opens on. Today's round if there is one (the first
// in the list when several share today's date), otherwise the next
// upcoming dated round, otherwise whatever was last saved as active.
function defaultRoundIdFor(rounds, savedActiveRoundId) {
  const d = new Date();
  const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const todays = rounds.find((r) => r.date === today);
  if (todays) return todays.id;
  const upcomingDates = rounds.filter((r) => r.date && r.date > today).map((r) => r.date).sort();
  if (upcomingDates.length > 0) return rounds.find((r) => r.date === upcomingDates[0]).id;
  return savedActiveRoundId;
}

function sanitizeState(parsed) {
  // Competitions used to be one event-wide list shared by every round.
  // They're now stored per-round instead, so a new day always starts
  // with a clean sheet — but any round saved under the old shape still
  // needs to inherit its share of that list, or an already-configured
  // day like "Day 1" would appear to have lost its competitions. Each
  // sanitizeRound call below falls back to this only for a round that
  // has no competitions array of its own yet.
  const legacyCompetitions = Array.isArray(parsed.competitions) ? parsed.competitions : [];
  let rounds;
  if (Array.isArray(parsed.rounds) && parsed.rounds.length > 0) {
    rounds = parsed.rounds.slice(0, MAX_ROUNDS).map((r, i) => sanitizeRound(r, `Day ${i + 1}`, legacyCompetitions));
  } else if (isValidCourse(parsed.course) || Array.isArray(parsed.players)) {
    // Migrating data saved before multi-round support existed — wrap the
    // old flat course/players/draw/localRules/startingHole into a single
    // "Day 1" round so nothing already live loses any data.
    rounds = [
      sanitizeRound(
        {
          course: parsed.course,
          players: parsed.players,
          draw: parsed.draw,
          localRules: parsed.localRules,
          startingHole: parsed.startingHole,
        },
        "Day 1",
        legacyCompetitions
      ),
    ];
  } else {
    rounds = [emptyRound("Day 1")];
  }
  rounds = sortRoundsByDate(rounds);

  const activeRoundId = rounds.some((r) => r.id === parsed.activeRoundId) ? parsed.activeRoundId : rounds[0].id;

  return {
    orgName: typeof parsed.orgName === "string" && parsed.orgName ? parsed.orgName : DEFAULT_ORG_NAME,
    accentColor: typeof parsed.accentColor === "string" && parsed.accentColor ? parsed.accentColor : DEFAULT_STATE.accentColor,
    headerColor: typeof parsed.headerColor === "string" && parsed.headerColor ? parsed.headerColor : DEFAULT_STATE.headerColor,
    rev: typeof parsed.rev === "number" && parsed.rev > 0 ? parsed.rev : 0,
    pin: typeof parsed.pin === "string" && parsed.pin ? parsed.pin : DEFAULT_PIN,
    handicapPin: typeof parsed.handicapPin === "string" && parsed.handicapPin ? parsed.handicapPin : "0000",
    rounds,
    activeRoundId,
    documents: Array.isArray(parsed.documents) ? parsed.documents : [],
    societyRoster: Array.isArray(parsed.societyRoster)
      ? parsed.societyRoster
          .filter((m) => m && typeof m.name === "string" && m.name.trim())
          .map((m) => ({ ...m, isLady: !!m.isLady }))
      : [],
  };
}

// ---- Who is actually playing a day ----
// Once a day has a draw, only the people IN it are playing: anyone still
// sitting unplaced in the Build tab's pool (a reserve, a late withdrawal,
// a name that arrived on a paste but was never given a tee time) is kept
// on the day's list but stays off the score sheet and every leaderboard.
// With no draw yet, everyone on the list counts, as before.
function isPlayingOnDay(round, p) {
  if (!round.draw || round.draw.length === 0) return true;
  const inDraw = new Set(round.draw.flatMap((entry) => entry.players || []).filter(Boolean).map(normalizeName));
  return inDraw.has(normalizeName(p.name)) || (!!p.partnerName && inDraw.has(normalizeName(p.partnerName)));
}
function playersOnDay(round) {
  const list = round.format === "foursomes" && round.draw.length > 0 ? mergedPairsFromDraw(round.players, round.draw, round.course) : round.players;
  return list.filter((p) => isPlayingOnDay(round, p));
}

// ---- Combined standings across every round, matched by player name ----
function combinedStandings(rounds, competitionFilter) {
  const byName = new Map();
  const credit = (name, roundId, t) => {
    const trimmed = (name || "").trim();
    if (!trimmed) return;
    if (!byName.has(trimmed)) byName.set(trimmed, { name: trimmed, perRound: {} });
    byName.get(trimmed).perRound[roundId] = t;
  };
  rounds.forEach((round) => {
    // A Foursomes round's stored roster only reflects the draw if it's
    // been "visited" and resynced — computing it fresh here means the
    // leaderboard is always correct straight from the draw for every
    // round, not just whichever one happens to be currently selected.
    playersOnDay(round).forEach((p) => {
      const t = totals(round.course, forLeaderboard(p), round.handicapAllowance, round.format === "foursomes");
      if (!competitionFilter || p.competition === competitionFilter) credit(p.name, round.id, t);
      // On a Foursomes day, both partners earned this result together — the
      // combined-across-days table only makes sense (and stays comparable
      // to Individual/Medal days) if each person is credited individually,
      // not just whichever name happens to be stored first in the pair.
      if (round.format === "foursomes" && p.partnerName) {
        if (!competitionFilter || p.partnerCompetition === competitionFilter) credit(p.partnerName, round.id, t);
      }
    });
  });
  return [...byName.values()].map((row) => {
    let total = 0;
    let anyPlayed = false;
    rounds.forEach((round) => {
      const t = row.perRound[round.id];
      if (t && t.thru > 0) {
        total += t.pts;
        anyPlayed = true;
      }
    });
    return { ...row, total, anyPlayed };
  }).sort((a, b) => b.total - a.total);
}

// For the dedicated Foursomes leaderboard specifically — pairs are ranked
// as a single team row (e.g. "Andrew Brice & Angus Chilvers"), not split
// into two individual rows sharing the same score, which would just look
// like singles scoring. Keyed by the sorted pair of names so the same
// partnership across multiple days combines into one row.
function combinedPairStandings(rounds) {
  const byPairKey = new Map();
  rounds.forEach((round) => {
    playersOnDay({ ...round, format: "foursomes" }).forEach((p) => {
      const nameA = (p.name || "").trim();
      const nameB = (p.partnerName || "").trim();
      if (!nameA) return;
      const key = nameB ? [nameA, nameB].sort().join(" & ") : nameA;
      const display = nameB ? [nameA, nameB].sort().join(" & ") : nameA;
      const t = totals(round.course, forLeaderboard(p), round.handicapAllowance, true);
      if (!byPairKey.has(key)) byPairKey.set(key, { name: display, perRound: {} });
      byPairKey.get(key).perRound[round.id] = t;
    });
  });
  return [...byPairKey.values()].map((row) => {
    let total = 0;
    let anyPlayed = false;
    rounds.forEach((round) => {
      const t = row.perRound[round.id];
      if (t && t.thru > 0) {
        total += t.pts;
        anyPlayed = true;
      }
    });
    return { ...row, total, anyPlayed };
  }).sort((a, b) => b.total - a.total);
}

// ---- Draw import via paste: Time, then one or more player-name columns ----
function isNumericToken(raw) {
  return /^-?\d+(\.\d+)?$/.test((raw || "").trim());
}

// Strips everything except letters before comparing, so a hidden character
// Excel sometimes inserts on copy/paste (a non-breaking space, a stray
// mark) can't cause a real "Back"/"Front" to be missed.
// Finds which of the course's own tees a raw token refers to, if any —
// shared by isTeeToken and normalizeTeeIndicator so both match the exact
// same way. Checks two things: the token against the label's letters as a
// whole (handles hidden characters Excel sometimes inserts on copy/paste,
// and single-word labels like "Purple"), AND the token against each
// individual word of the label (handles a multi-word label like "Purple
// Tee" or "Tee Club", where the CSV/paste only gives the meaningful word
// — "Purple" — not the whole label). Concatenating the whole label into
// one string before comparing, with no word-boundary check at all, would
// turn "Purple Tee" into "purpletee", which "Purple" alone can never
// match.
function matchCourseTeeLabel(raw, courseTeeLabels) {
  const cleaned = (raw || "").replace(/[^a-zA-Z]/g, "").toLowerCase();
  if (!cleaned) return null;
  for (const label of courseTeeLabels || []) {
    const labelWhole = (label || "").replace(/[^a-zA-Z]/g, "").toLowerCase();
    if (labelWhole === cleaned) return label;
    const words = (label || "").split(/\s+/).map((w) => w.replace(/[^a-zA-Z]/g, "").toLowerCase()).filter(Boolean);
    if (words.includes(cleaned)) return label;
  }
  return null;
}

function isTeeToken(raw, courseTeeLabels) {
  const cleaned = (raw || "").replace(/[^a-zA-Z]/g, "").toLowerCase();
  if (!cleaned) return false;
  if (cleaned === "back" || cleaned === "front" || cleaned === "b" || cleaned === "f") return true;
  // Also matches whatever this specific course actually calls its own
  // tees (e.g. "Club"/"Purple" at Royal Cinque Ports) — different courses
  // routinely use completely different tee names/colours, so recognizing
  // only "Back"/"Front" would miss every one of them.
  return matchCourseTeeLabel(raw, courseTeeLabels) !== null;
}

function normalizeTeeIndicator(raw, courseTeeLabels) {
  const cleaned = (raw || "").replace(/[^a-zA-Z]/g, "").toLowerCase();
  // "Back"/"Front" (or B/F) in a spreadsheet only mean something if THIS
  // course actually has a tee called that. They used to be written onto
  // the player regardless — so a file saying "Back", loaded into a day at
  // a course whose tees are called something else, left everyone on a tee
  // that doesn't exist ("Tee "Back" doesn't match this course"), and
  // re-uploading the file put it straight back after it had been fixed.
  // Now a word that matches none of the course's tees returns null and is
  // reported, and the player's existing tee is left alone.
  const generic = cleaned === "b" || cleaned === "back" ? "Back" : cleaned === "f" || cleaned === "front" ? "Front" : null;
  if (generic) return matchCourseTeeLabel(generic, courseTeeLabels);
  // Return the course's own actual label (correctly cased, and in full —
  // e.g. "Purple Tee" even though the token itself was just "Purple") if
  // this token matches one, so the stored value exactly matches an entry
  // in the course's tees list.
  return matchCourseTeeLabel(raw, courseTeeLabels);
}

// Single shared pass over a pasted draw sheet — classifies every column
// after Time as a name, a handicap number, or a tee indicator (in any
// order, and regardless of which sits next to which), and returns all
// three kinds of data together. Used by parsePastedDraw and the two
// roster-import extractors below, so there's exactly one place that
// understands the row shape rather than three separate, driftable copies.
// A short, all-caps token that isn't a known tee word and isn't a number
// is almost certainly a competition code someone's about to register, not
// a person's name — real names are virtually never written in pure caps
// this short. Recognizing it even before it's formally added in Admin
// means paste order never matters.
function looksLikeCompetitionCode(raw) {
  // Case-insensitive on purpose — a code pasted in lowercase (e.g. "pwc")
  // is still meant as a competition code, not a name. The trade-off: a
  // genuine short name sitting alone in its own cell (e.g. "Al", "Amy",
  // "Kim") could in principle also match this 2-6 letter pattern and get
  // misread as a code — same risk that already existed for an all-caps
  // name, just now covering lowercase/mixed-case ones too.
  return /^[A-Za-z]{2,6}$/.test((raw || "").trim());
}

// Does this look like a tee time? 9:00, 09.05, 12.24, 0905, 9:00am…
function looksLikeTime(raw) {
  const v = (raw || "").trim();
  return /^\d{1,2}\s*[:.h]\s*\d{2}\s*(am|pm)?$/i.test(v) || /^\d{3,4}$/.test(v);
}

// Splits pasted or uploaded text into rows and columns. A spreadsheet
// paste separates columns with tabs and a .csv file with commas; if there
// is a tab anywhere, tabs win. (Left to guess, the parser can pick the
// wrong one when many lines have only a single column — a list where most
// players have just a name — and then glues a whole line into one "name".)
function splitPastedRows(text) {
  const t = (text || "").trim();
  return Papa.parse(t, t.includes("\t") ? { delimiter: "\t", skipEmptyLines: true } : { skipEmptyLines: true }).data;
}

// A draw file/paste has the tee time in its first column. A plain list of
// players (Name, Handicap, Tee…) doesn't — and reading one as a draw used
// to put each NAME where the tee time belongs, with nobody in the group.
function pasteHasTeeTimes(text) {
  return splitPastedRows(text).some((cols) => looksLikeTime(cols[0]));
}

function looksLikeHeaderRow(cols) {
  return (cols || []).some((c) => /^(name|player|players|handicap|hcp|h'?cap|index|whs|tee|tees|time|tee time|comp|competition)s?$/i.test((c || "").trim()));
}

function walkPastedDrawRows(text, knownAbbreviations, courseTeeLabels, opts) {
  // Auto-detects the delimiter (rather than forcing tabs) so this works
  // equally well with a tab-separated spreadsheet paste and a genuine
  // comma-separated .csv file upload.
  let rows = splitPastedRows(text);
  if (rows.length === 0) return [];
  if (opts && opts.noTimeColumn) {
    // A players-only list: drop a header row if there is one, then give
    // every row a placeholder first cell so the same column-reading logic
    // (names, handicaps, tees, competitions in any order) can be reused.
    if (looksLikeHeaderRow(rows[0])) rows = rows.slice(1);
    rows = rows.map((cols, i) => [`row${i}`, ...cols]);
  } else if (!/\d/.test(rows[0][0] || "")) rows = rows.slice(1);

  const abbrevSet = new Set((knownAbbreviations || []).map((a) => a.trim().toUpperCase()).filter(Boolean));

  const perRow = rows.map((cols) => {
    const time = (cols[0] || "").trim();
    const names = [];
    const handicaps = [];
    const tees = [];
    const comps = [];
    const unmatchedTees = []; // tee words in the file that this course has no tee for
    let lastName = null;
    for (let i = 1; i < cols.length; i++) {
      const val = (cols[i] || "").trim();
      if (!val) continue;
      if (isNumericToken(val)) {
        if (lastName) handicaps.push({ name: lastName, index: val });
      } else if (isTeeToken(val, courseTeeLabels)) {
        const teeLabel = normalizeTeeIndicator(val, courseTeeLabels);
        if (lastName && teeLabel) tees.push({ name: lastName, tee: teeLabel });
        else if (lastName) unmatchedTees.push({ name: lastName, raw: val });
      } else if (abbrevSet.has(val.toUpperCase()) || looksLikeCompetitionCode(val)) {
        if (lastName) comps.push({ name: lastName, abbreviation: val.toUpperCase() });
      } else {
        names.push(val);
        lastName = val;
      }
    }
    // A tee column is often only stated once for a whole group sharing a
    // tee time, rather than repeated for every name on the line — so
    // anyone without their own explicit tee inherits whichever tee the
    // nearest preceding name on this same line had, instead of being left
    // to silently fall back to the course's first tee later.
    let carryTee = null;
    names.forEach((name) => {
      const own = tees.find((t) => t.name === name);
      if (own) {
        carryTee = own.tee;
      } else if (carryTee) {
        tees.push({ name, tee: carryTee });
      }
    });
    return { time, names, handicaps, tees, comps, unmatchedTees };
  });

  // Merges consecutive rows that share the same tee time — or that have a
  // blank time, inheriting whichever time the previous row had — into one
  // combined group. This is what lets a spreadsheet be laid out with one
  // player per row (several rows to a tee time, as in a typical exported
  // tee sheet) rather than requiring every player for a group to be packed
  // onto a single line. A sheet that already has multiple players per row
  // is completely unaffected, since each of its rows already carries its
  // own distinct time and so never merges with its neighbour.
  const merged = [];
  perRow.forEach((row) => {
    const last = merged[merged.length - 1];
    const sameGroup = last && (!row.time || row.time === last.time);
    if (sameGroup) {
      last.names.push(...row.names);
      last.handicaps.push(...row.handicaps);
      last.tees.push(...row.tees);
      last.comps.push(...row.comps);
      last.unmatchedTees.push(...row.unmatchedTees);
    } else {
      merged.push({
        time: row.time || (last ? last.time : ""),
        names: [...row.names],
        handicaps: [...row.handicaps],
        tees: [...row.tees],
        comps: [...row.comps],
        unmatchedTees: [...row.unmatchedTees],
      });
    }
  });
  return merged;
}

// Reads a players-only list into [{ name, index, tee, competition }].
function parsePastedPeople(text, knownAbbreviations, courseTeeLabels) {
  const rows = walkPastedDrawRows(text, knownAbbreviations, courseTeeLabels, { noTimeColumn: true });
  const people = [];
  rows.forEach((r) => {
    r.names.forEach((name) => {
      const h = r.handicaps.find((x) => x.name === name);
      const t = r.tees.find((x) => x.name === name);
      const c = r.comps.find((x) => x.name === name);
      people.push({ name: name.trim(), index: h ? h.index : "", tee: t ? t.tee : "", competition: c ? c.abbreviation : "" });
    });
  });
  return people.filter((p) => p.name);
}

function parsePastedDraw(text, knownAbbreviations, courseTeeLabels) {
  return walkPastedDrawRows(text, knownAbbreviations, courseTeeLabels)
    .map((r) => ({ id: crypto.randomUUID(), time: r.time, players: r.names }))
    // A genuine tee time always has an actual time — this also filters out
    // trailing blank/noise rows further down a spreadsheet (e.g. a stray
    // "Total" footer label sitting alone in an otherwise empty row), which
    // would otherwise get swept up and added as a phantom player.
    .filter((r) => r.time && r.time.trim());
}

// Pulls {name, index} handicap pairs out of the same draw paste, so that
// data can populate the roster too rather than being discarded just
// because it arrived via the draw paste.
function extractHandicapsFromDrawPaste(text, knownAbbreviations, courseTeeLabels) {
  return walkPastedDrawRows(text, knownAbbreviations, courseTeeLabels).flatMap((r) => r.handicaps);
}

// Pulls {name, abbreviation} sub-competition tags out of the same draw
// paste — only recognized if the token exactly matches an abbreviation
// already defined in Admin, so a genuine name can never be mistaken for one.
function extractCompetitionsFromDrawPaste(text, knownAbbreviations, courseTeeLabels) {
  return walkPastedDrawRows(text, knownAbbreviations, courseTeeLabels).flatMap((r) => r.comps);
}

// Tee words in the paste that don't match any tee on this day's course —
// reported back to the organiser rather than silently stored or dropped.
function unmatchedTeeWordsInPaste(text, knownAbbreviations, courseTeeLabels, opts) {
  return [...new Set(walkPastedDrawRows(text, knownAbbreviations, courseTeeLabels, opts).flatMap((r) => r.unmatchedTees.map((u) => u.raw.trim())))];
}

// Pulls {name, tee} pairs out of the same draw paste, in any column order
// relative to the handicap.
function extractTeesFromDrawPaste(text, knownAbbreviations, courseTeeLabels) {
  return walkPastedDrawRows(text, knownAbbreviations, courseTeeLabels).flatMap((r) => r.tees);

}

function PlayerMenu({ rounds, activeRoundId, headerColor, accentColor, onSelectDay, onSelectLeaderboard, onSelectRules, onSelectInfo, onSelectHandicap }) {
  const sectionCard = (title, items) => (
    <div style={{ background: "#FFFFFF", borderRadius: 12, border: "1px solid #E4E0D0", marginBottom: 12, overflow: "hidden" }}>
      <div
        style={{
          fontSize: 12, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase",
          color: "#FFFFFF", background: headerColor, padding: "10px 14px",
        }}
      >
        {title}
      </div>
      {items}
    </div>
  );

  const row = (label, onClick, key, sublabel, isActive) => (
    <button
      key={key || label}
      onClick={onClick}
      style={{
        width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "14px 16px", background: isActive ? `${accentColor}14` : "none", border: "none",
        borderTop: "1px solid #EFEDE0", borderLeft: isActive ? `4px solid ${accentColor}` : "4px solid transparent",
        textAlign: "left",
      }}
    >
      <span>
        <span style={{ fontSize: 15, fontWeight: isActive ? 800 : 600, color: isActive ? accentColor : "#1B1B1B", display: "block" }}>
          {label}{isActive ? " — viewing now" : ""}
        </span>
        {sublabel && (
          <span className="mono" style={{ fontSize: 11.5, color: "#8A8774" }}>{sublabel}</span>
        )}
      </span>
      <ChevronRight size={16} color="#9B9885" />
    </button>
  );

  const standaloneRow = (label, onClick) => (
    <button
      onClick={onClick}
      style={{
        width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "16px", background: "#FFFFFF", border: "1px solid #E4E0D0", borderRadius: 12,
        marginBottom: 10, textAlign: "left",
      }}
    >
      <span style={{ fontSize: 15, fontWeight: 700, color: headerColor }}>{label}</span>
      <ChevronRight size={16} color="#9B9885" />
    </button>
  );

  return (
    <div style={{ padding: "14px 14px 40px" }}>
      {sectionCard("Draw Sheets", rounds.map((r) => row(r.label, () => onSelectDay(r.id), r.id, formatDisplayDate(r.date), r.id === activeRoundId)))}
      {standaloneRow("Leaderboard", () => onSelectLeaderboard())}
      {standaloneRow("Information", onSelectInfo)}
      {standaloneRow("Local Rules", onSelectRules)}
      {standaloneRow("Your Handicap", onSelectHandicap)}
    </div>
  );
}

function CodeGate({ onSubmit }) {
  const [value, setValue] = useState(prefilledEventCode);

  const submit = () => {
    if (value.trim()) onSubmit(value);
  };

  return (
    <div
      style={{
        background: "#F1EFE3", minHeight: "100vh", fontFamily: "'Iowan Old Style','Georgia',serif",
        color: "#1B1B1B", display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
      }}
    >
      <style>{`.mono { font-family: 'Courier New', ui-monospace, monospace; }`}</style>
      <div style={{ width: "100%", maxWidth: 320, textAlign: "center" }}>
        {logoForOrgName(BRAND.orgName) ? (
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 10 }}>
            <SocietyLogo orgName={BRAND.orgName} height={96} />
          </div>
        ) : (
          <Flag size={26} color="#8A8774" style={{ marginBottom: 10 }} />
        )}
        <div style={{ fontSize: 19, fontWeight: 700, marginBottom: 2 }}>{BRAND.orgName}</div>
        <div style={{ fontSize: 14, fontWeight: 600, color: "#6B6B5F", marginBottom: 6 }}>Live Leaderboard</div>
        <div style={{ fontSize: 13, color: "#6B6B5F", marginBottom: 18 }}>
          Press Continue to open the event — or type a different code first.
        </div>
        <input
          value={value}
          onChange={(e) => setValue(e.target.value.toUpperCase())}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder={`e.g. ${BRAND.defaultEventCode}`}
          className="mono"
          style={{
            width: "100%", fontSize: 20, textAlign: "center", letterSpacing: "0.15em", padding: "12px 0",
            borderRadius: 8, border: "1px solid #D8D4C0", marginBottom: 10, textTransform: "uppercase",
            background: "#FFFFFF",
          }}
        />
        <button
          onClick={submit}
          style={{ width: "100%", padding: "11px 0", borderRadius: 8, border: "none", background: BRAND.headerColor, color: "#FFFFFF", fontWeight: 600, fontSize: 14 }}
        >
          Continue
        </button>
        <div style={{ fontSize: 11, color: "#9B9885", marginTop: 16 }}>
          Setting up a new meeting? Just type a new code to start it —
          the Admin PIN protects it from there.
        </div>
      </div>
    </div>
  );
}

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error) {
    return { error };
  }
  render() {
    if (this.state.error) {
      return (
        <div
          style={{
            background: "#F1EFE3", minHeight: "100vh", fontFamily: "'Iowan Old Style','Georgia',serif",
            color: "#1B1B1B", display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
          }}
        >
          <div style={{ width: "100%", maxWidth: 340, textAlign: "center" }}>
            <div style={{ fontSize: 17, fontWeight: 700, marginBottom: 8 }}>Something went wrong</div>
            <div style={{ fontSize: 13, color: "#6B6B5F", marginBottom: 16 }}>
              This screen hit an unexpected error rather than just showing a blank page. Reloading usually fixes it —
              your data is saved separately and won't be lost.
            </div>
            <button
              onClick={() => window.location.reload()}
              style={{ padding: "11px 20px", borderRadius: 8, border: "none", background: "#1B2A4A", color: "#FFFFFF", fontWeight: 600, fontSize: 14 }}
            >
              Reload
            </button>
            <div className="mono" style={{ fontSize: 10, color: "#9B9885", marginTop: 16, wordBreak: "break-word" }}>
              {String(this.state.error && this.state.error.message)}
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function AppInner() {
  // The event code is what actually separates one club/meeting's data from
  // another — everyone who knows the same code shares the same live board;
  // nobody else can see or reach it. It seeds from a ?code= URL param so a
  // link can be pre-filled, but players can also just type it in.
  const [eventCode, setEventCode] = useState(codeFromUrl);
  // "owner", "helper" or "" — what this device is allowed to see in Admin
  // (see OWNER_SUFFIX above). adminVisible is simply "any level at all".
  const [adminLevel, setAdminLevel] = useState(() => isAdminDevice(codeFromUrl()));
  const adminVisible = !!adminLevel;
  const isOwner = adminLevel === "owner";
  const setAdminVisible = (v) => setAdminLevel(v ? adminLevel || "owner" : "");
  const eventCodeRef = useRef(eventCode);
  useEffect(() => { eventCodeRef.current = eventCode; }, [eventCode]);

  const [mode, setMode] = useState("menu"); // menu | board | draw | rules | docs | handicap | scorer
  // All persisted event state lives in one object now, saved with a single
  // functional update (setState(prev => ({...prev, ...patch}))) — this
  // avoids the class of bug where a stale positional argument silently
  // clobbers a different field than intended.
  const [state, setState] = useState(DEFAULT_STATE);
  const { orgName, accentColor, headerColor, pin, handicapPin, rounds, activeRoundId: savedActiveRoundId, documents, societyRoster } = state;
  // Which day THIS device is currently looking at — deliberately kept
  // separate from the shared/polled server state. If it lived inside
  // `state`, the 5-second Leaderboard refresh could fetch a slightly
  // stale server snapshot moments after you switch days and silently
  // overwrite your choice back — which is exactly the "snaps back after
  // a few seconds" bug. Seeded once from the server's last-saved value
  // when an event first loads (falls back to that saved value until
  // then), and never touched by later polls after that.
  const [localActiveRoundId, setLocalActiveRoundId] = useState(null);
  const hasSeededActiveRoundRef = useRef(false);
  // Tracks when this device last wrote a change locally — the background
  // poll checks this before trusting a fetch over what's already on
  // screen, since a save's write and the very next poll's read can race:
  // if the poll's fetch happens to land on the backend a moment before
  // this device's own write has fully propagated, it would otherwise
  // silently overwrite a genuinely newer local change with a stale
  // server copy.
  const lastLocalSaveAtRef = useRef(0);
  // ---- Multi-device save safety ----
  // stateRef always holds this device's latest data, updated the instant a
  // change is made (React's own state can lag by a render). syncedRef holds
  // the last version this device KNOWS the server has, plus its version
  // marker (etag). Every save sends that marker; if another device has
  // saved in the meantime the server refuses, and we fetch their version,
  // merge our change into it, and send again — so nobody's scores or edits
  // are ever overwritten by someone else's older copy.
  const stateRef = useRef(DEFAULT_STATE);
  const syncedRef = useRef({ state: DEFAULT_STATE, etag: null });
  const dirtyRef = useRef(false);
  const staleSinceRef = useRef(0);
  const entryDebounceRef = useRef(null);
  const pendingCacheTimerRef = useRef(null);
  const deviceIdRef = useRef(null);
  if (!deviceIdRef.current) deviceIdRef.current = getDeviceId();
  const deviceId = deviceIdRef.current;
  const [entryNotice, setEntryNotice] = useState("");
  const [offline, setOffline] = useState(false);       // the last attempt to reach the server failed
  const [loadFailed, setLoadFailed] = useState(false); // ...and there was no saved copy on this phone to fall back on
  const hasDataRef = useRef(false);                    // something real (live or saved copy) is on screen
  const lastSyncAtRef = useRef(0);
  const cachedMarkRef = useRef("");
  const backoffUntilRef = useRef(0);
  const backoffStepRef = useRef(0);
  const pumpingRef = useRef(false);
  const applyState = useCallback((next) => {
    stateRef.current = next;
    setState(next);
  }, []);
  // Always resolves to a day that really exists. On a brand-new event
  // neither value is set yet, and every day-level change (course, draw,
  // players, format…) is applied to "the day whose id matches" — with no
  // id to match, those changes were silently dropped until the event had
  // been saved and reloaded once. Falling back to the first day fixes that.
  const activeRoundId =
    (localActiveRoundId && rounds.some((r) => r.id === localActiveRoundId) && localActiveRoundId) ||
    (savedActiveRoundId && rounds.some((r) => r.id === savedActiveRoundId) && savedActiveRoundId) ||
    rounds[0].id;
  const activeRound = rounds.find((r) => r.id === activeRoundId) || rounds[0];
  const { course, players, draw, matches, localRules, startingHole, format, scoring, handicapAllowance, drawStartTime, drawInterval, competitions } = activeRound;
  const isFoursomes = format === "foursomes";
  const isMatchPlay = format === "matchplay";
  const isMedal = scoring === "medal";
  // The Leaderboard has no memory of its own — it's always exactly
  // whichever format the currently-selected day actually is, computed
  // fresh on every render. Previously this was a separate piece of state
  // kept "in sync" with the active day via an effect, which is inherently
  // fragile — there's a whole class of bug where the two drift apart, as
  // happened here. A value that's directly derived, with nothing else to
  // store or synchronize, can't have that problem.
  const boardTab = isFoursomes ? "foursomes" : "singles";

  const [loading, setLoading] = useState(true);
  const [live, setLive] = useState(false);
  const [syncError, setSyncError] = useState(false);
  const [activeId, setActiveId] = useState(null);
  const [showCourseSetup, setShowCourseSetup] = useState(false);
  const [showDrawSetup, setShowDrawSetup] = useState(false);
  const [showLocalRulesSetup, setShowLocalRulesSetup] = useState(false);
  const [showDocumentsSetup, setShowDocumentsSetup] = useState(false);
  const [showCompetitionsSetup, setShowCompetitionsSetup] = useState(false);
  const [showPrintLabels, setShowPrintLabels] = useState(false);
  const [showPrintDraw, setShowPrintDraw] = useState(false);
  const [showPrintBoard, setShowPrintBoard] = useState(false);
  const [showBackup, setShowBackup] = useState(false);
  const [showEnterScores, setShowEnterScores] = useState(false);
  const [showSocietyRoster, setShowSocietyRoster] = useState(false);
  const [showMatchesSetup, setShowMatchesSetup] = useState(false);
  const [viewingDoc, setViewingDoc] = useState(null); // { name, blobUrl, loading, error } | null
  const [library, setLibrary] = useState([]);
  // Unlocking Admin is per-browser-tab, not persisted — anyone who
  // knows the PIN can enter it fresh each time they open the link, which
  // is the point (keeps casual players from fumbling into edit mode).
  const [scorerUnlocked, setScorerUnlocked] = useState(false);
  const [showPinPrompt, setShowPinPrompt] = useState(false);
  const [handicapUnlocked, setHandicapUnlocked] = useState(false);
  const [showHandicapPinPrompt, setShowHandicapPinPrompt] = useState(false);
  const [showDaySwitcher, setShowDaySwitcher] = useState(false);
  const pollRef = useRef(null);
  const modeRef = useRef(mode);
  useEffect(() => { modeRef.current = mode; }, [mode]);

  const load = useCallback(async () => {
    const code = eventCodeRef.current;
    if (!code) return;
    // True when it's unsafe to replace what's on screen with a server copy.
    const busy = () =>
      modeRef.current === "scorer" ||
      dirtyRef.current ||
      pumpingRef.current ||
      Date.now() - lastLocalSaveAtRef.current < 4000 ||
      eventCodeRef.current !== code;
    // Being a good citizen when many phones are using the app at once:
    //  • a phone whose app is in the background doesn't refresh at all;
    //  • if the server ever says "too many requests", this phone backs
    //    right off (30s, then 1, 2, 4… up to 5 minutes) instead of trying
    //    again every few seconds and making matters worse;
    //  • a routine refresh first asks "has anything changed since the
    //    version I've got?" and gets a few bytes back when it hasn't —
    //    rather than downloading the whole event every time.
    if (hasDataRef.current && typeof document !== "undefined" && document.hidden) return;
    if (Date.now() < backoffUntilRef.current) { setLoading(false); return; }
    try {
      const inStep = hasDataRef.current && stateRef.current === syncedRef.current.state && syncedRef.current.etag && syncedRef.current.etag !== "new";
      const res = await withTimeout(
        inStep && typeof window.storage.getIfChanged === "function"
          ? window.storage.getIfChanged(storageKeyFor(code), syncedRef.current.etag)
          : window.storage.get(storageKeyFor(code), true),
        12000
      );
      backoffStepRef.current = 0;
      if (eventCodeRef.current === code) { setOffline(false); setLoadFailed(false); lastSyncAtRef.current = Date.now(); }
      if (res && res.unchanged) { setLive(true); return; }
      // Only skip applying a refresh while actively in the scorer screens
      // (Admin) — that's the one place a background update could yank the
      // screen out from under someone mid-edit — or while this device has
      // a change of its own still on its way to the server (including the
      // few seconds right after a save, when a read can lag the write).
      // Every other screen, including the very first load right after
      // entering an event code, should always get the real data. Anything
      // skipped here isn't lost: the save path merges it in (see pump).
      if (busy()) return;
      const loaded = res ? sanitizeState(JSON.parse(res.value)) : DEFAULT_STATE;
      // The server can briefly hand back a copy from BEFORE this device's
      // latest save (reads can lag writes by up to a minute). Showing it
      // would make changes appear to vanish a few seconds after being
      // made — so anything older than what's already on screen is ignored;
      // the next refresh will bring the up-to-date copy.
      // (If the server STILL says the same after 90 seconds, it isn't lag
      // — e.g. a phone on an older app version saved — so accept it.)
      if ((loaded.rev || 0) < (stateRef.current.rev || 0)) {
        if (!staleSinceRef.current) staleSinceRef.current = Date.now();
        if (Date.now() - staleSinceRef.current < 90000) return;
      }
      staleSinceRef.current = 0;
      syncedRef.current = { state: loaded, etag: res ? res.etag || null : "new" };
      applyState(loaded);
      hasDataRef.current = true;
      if (res) {
        const mark = `${code}:${res.etag || ""}:${loaded.rev || 0}`;
        if (mark !== cachedMarkRef.current) { cachedMarkRef.current = mark; writeCachedEvent(code, loaded, res.etag); }
      }
      if (!hasSeededActiveRoundRef.current) {
        setLocalActiveRoundId(defaultRoundIdFor(loaded.rounds, loaded.activeRoundId));
        hasSeededActiveRoundRef.current = true;
      }
      setLive(true);
    } catch (err) {
      if (/\(429\)|too many/i.test(String(err))) {
        backoffStepRef.current = Math.min(backoffStepRef.current + 1, 5);
        backoffUntilRef.current = Date.now() + Math.min(15000 * 2 ** backoffStepRef.current, 5 * 60 * 1000);
      }
      const notFound = String(err).toLowerCase().includes("not found") || String(err).toLowerCase().includes("404");
      if (!notFound && eventCodeRef.current === code) {
        // No signal (or the server didn't answer in time). Whatever is on
        // screen — the live copy from earlier, or this phone's saved copy —
        // stays there, marked as offline. Only if there is nothing at all
        // to show does the "can't load" message appear; never a blank,
        // made-up event that could be mistaken for the real one.
        setOffline(true);
        if (!hasDataRef.current) setLoadFailed(true);
      }
      if (busy()) return;
      if (notFound) {
        syncedRef.current = { state: DEFAULT_STATE, etag: "new" };
        applyState(DEFAULT_STATE);
        hasDataRef.current = true;
        setOffline(false); setLoadFailed(false);
      }
      setLive(true);
    } finally {
      setLoading(false);
    }
  }, [applyState]);

  // Sends this device's latest data to the server — one request at a time,
  // always carrying the version marker of the copy it was based on.
  const pump = useCallback(async () => {
    if (pumpingRef.current) return;
    pumpingRef.current = true;
    const code = eventCodeRef.current;
    const key = storageKeyFor(code);
    const wait = (ms) => new Promise((r) => setTimeout(r, ms));
    // Reads the server's current copy -> { state, etag } ("new" if none yet)
    const fetchTheirs = async () => {
      try {
        const res = await window.storage.get(key, true);
        return { state: sanitizeState(JSON.parse(res.value)), etag: res.etag || null };
      } catch (err) {
        const msg = String(err).toLowerCase();
        if (msg.includes("not found") || msg.includes("404")) return { state: DEFAULT_STATE, etag: "new" };
        throw err;
      }
    };
    let failures = 0;
    try {
      while (dirtyRef.current && eventCodeRef.current === code) {
        dirtyRef.current = false;
        const mine = stateRef.current;
        try {
          // Older storage helper without safe saves — behave as before.
          if (typeof window.storage.setIfMatch !== "function") {
            await window.storage.set(key, JSON.stringify(mine), true);
            syncedRef.current = { state: mine, etag: null };
            setSyncError(false);
            continue;
          }
          // No version marker yet (e.g. the very first load never landed):
          // find out what the server has before sending anything.
          if (!syncedRef.current.etag) {
            const theirs = await fetchTheirs();
            if (eventCodeRef.current !== code) return;
            if (!theirs.etag) {
              // Server can't supply version markers — plain save, as before.
              await window.storage.set(key, JSON.stringify(mine), true);
              syncedRef.current = { state: mine, etag: null };
              setSyncError(false);
              continue;
            }
            const merged = { ...merge3(syncedRef.current.state, stateRef.current, theirs.state), rev: Math.max(stateRef.current.rev || 0, theirs.state.rev || 0) + 1 };
            syncedRef.current = theirs;
            applyState(merged);
            dirtyRef.current = true;
            continue;
          }
          const sentEtag = syncedRef.current.etag;
          const result = await window.storage.setIfMatch(key, JSON.stringify(mine), sentEtag);
          if (eventCodeRef.current !== code) return;
          if (result.ok) {
            syncedRef.current = { state: mine, etag: result.etag };
            setOffline(false);
            clearTimeout(pendingCacheTimerRef.current);
            writeCachedEvent(code, mine, result.etag, stateRef.current !== mine ? stateRef.current : null);
            lastLocalSaveAtRef.current = Date.now();
            failures = 0;
            setSyncError(false);
            continue;
          }
          // Refused: another device saved since our copy was loaded. Get
          // their version and fold this device's changes into it.
          const theirs = await fetchTheirs();
          if (eventCodeRef.current !== code) return;
          dirtyRef.current = true;
          if (!theirs.etag || theirs.etag === sentEtag || (failures < 5 && (theirs.state.rev || 0) < (syncedRef.current.state.rev || 0))) {
            // The read hasn't caught up with their save yet — it handed
            // back the same version we already had. Wait and try again.
            failures += 1;
            if (failures > 12) throw new Error("Could not get an up-to-date copy");
            await wait(Math.min(1000 * failures, 6000));
            continue;
          }
          const merged = { ...merge3(syncedRef.current.state, stateRef.current, theirs.state), rev: Math.max(stateRef.current.rev || 0, theirs.state.rev || 0) + 1 };
          syncedRef.current = theirs;
          applyState(merged);
        } catch (err) {
          // Offline / server error — keep the change, show the warning,
          // and keep retrying in the background with growing gaps.
          dirtyRef.current = true;
          failures += 1;
          setSyncError(true);
          setOffline(true);
          if (failures > 12) return; // give up for now; the next change restarts it
          await wait(Math.min(1500 * failures, 10000));
        }
      }
    } finally {
      pumpingRef.current = false;
      // A change may have landed in the instant between the loop ending
      // and the flag clearing — make sure it isn't left behind.
      if (dirtyRef.current && failures <= 12) pump();
    }
  }, [applyState]);

  // patch is a partial update — e.g. save({ players: next }) or
  // save({ course: nextCourse }) — merged onto the latest state via the
  // functional setState form, so it's always correct even if several
  // saves fire close together.
  const save = useCallback((patch, opts) => {
    const code = eventCodeRef.current;
    if (!code) return;
    // Accepting a function here (rather than only a plain object) means
    // the patch is computed from the ACTUAL latest state at the moment
    // this update applies, not from whatever "rounds"/"players" closure
    // variable happened to be captured back when the click handler that
    // triggered this call was created. Two updates fired in quick
    // succession — e.g. tapping two switches back-to-back, before React
    // has re-rendered in between — would otherwise each build their
    // patch from the SAME pre-update snapshot, and the second call's
    // save would silently overwrite (undo) the first's. stateRef is
    // updated synchronously right here, so that can't happen.
    const prev = stateRef.current;
    const resolvedPatch = typeof patch === "function" ? patch(prev) : patch;
    const next = { ...prev, ...resolvedPatch, rev: (prev.rev || 0) + 1 };
    lastLocalSaveAtRef.current = Date.now();
    applyState(next);
    dirtyRef.current = true;
    // Keep the not-yet-sent version on the phone too, so closing the app
    // with no signal doesn't lose what was typed. (Half a second's grace,
    // so a run of keystrokes is written once rather than eighteen times.)
    clearTimeout(pendingCacheTimerRef.current);
    pendingCacheTimerRef.current = setTimeout(() => {
      if (dirtyRef.current || pumpingRef.current) writeCachedEvent(code, syncedRef.current.state, syncedRef.current.etag, stateRef.current);
    }, 500);
    // While players are helping enter scores, several phones are typing
    // at once — so their keystrokes are bundled into one save about a
    // second after the last one, rather than one save per hole. Far fewer
    // collisions between phones, and nothing is lost: the change is
    // already on this screen and marked as waiting to go. Opening,
    // closing and completing a card still go straight away.
    clearTimeout(entryDebounceRef.current);
    if (modeRef.current === "entry" && !(opts && opts.immediate)) {
      entryDebounceRef.current = setTimeout(pump, 900);
    } else {
      pump();
    }
  }, [applyState, pump]);

  // Switching event code means switching to a completely different data
  // set — reset everything local before the new code's load() runs, so
  // there's no flash of the previous event's players/course.
  useEffect(() => {
    if (!eventCode) return;
    setLoading(true);
    setOffline(false);
    setLoadFailed(false);
    hasDataRef.current = false;
    cachedMarkRef.current = "";
    dirtyRef.current = false;
    const saved = readCachedEvent(eventCode);
    if (saved) {
      applyState(saved.pending || saved.state);
      syncedRef.current = { state: saved.state, etag: saved.etag };
      if (saved.pending) {
        // Changes from last time that never reached the server — send them
        // now (they're merged with anything others have done since).
        dirtyRef.current = true;
        setTimeout(() => pump(), 0);
      }
      hasDataRef.current = true;
      lastSyncAtRef.current = saved.savedAt;
      setLocalActiveRoundId(defaultRoundIdFor(saved.state.rounds, saved.state.activeRoundId));
      hasSeededActiveRoundRef.current = true;
      setLoading(false);
    } else {
      applyState(DEFAULT_STATE);
      syncedRef.current = { state: DEFAULT_STATE, etag: null };
      setLocalActiveRoundId(null);
      hasSeededActiveRoundRef.current = false;
    }
    setActiveId(null);
    setShowCourseSetup(false);
    setShowEnterScores(false);
    setShowSocietyRoster(false);
    setShowMatchesSetup(false);
    setScorerUnlocked(false);
    setMode("menu");
  }, [eventCode]);

  const enterEventCode = (raw) => {
    const { code, level } = splitAdminCode(raw);
    if (!code) return;
    if (level) setAdminDevice(code, level);
    setAdminLevel(level || isAdminDevice(code));
    try {
      const url = new URL(window.location.href);
      url.searchParams.set("code", code);
      window.history.replaceState(null, "", url);
    } catch {
      // ignore — URL update is a nicety, not required for the app to work
    }
    try {
      window.localStorage.setItem(LAST_CODE_KEY, code);
    } catch {
      // ignore — remembering the code is a convenience only
    }
    setEventCode(code);
  };

  const switchEvent = () => {
    try {
      const url = new URL(window.location.href);
      url.searchParams.delete("code");
      window.history.replaceState(null, "", url);
    } catch {
      // ignore
    }
    setEventCode("");
  };

  // A named library of course setups, stored separately from the live
  // event data — this is what lets you come back next year, load last
  // year's course, and start a clean sheet of players.
  useEffect(() => {
    (async () => {
      try {
        const res = await window.storage.get(LIBRARY_KEY, true);
        setLibrary(res ? JSON.parse(res.value) : []);
      } catch {
        setLibrary([]);
      }
    })();
  }, []);

  const saveCourseToLibrary = async (name) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const existing = library.find((e) => e.name.toLowerCase() === trimmed.toLowerCase());
    const entry = { id: existing ? existing.id : crypto.randomUUID(), name: trimmed, course };
    const next = existing ? library.map((e) => (e.id === existing.id ? entry : e)) : [...library, entry];
    setLibrary(next);
    try {
      await window.storage.set(LIBRARY_KEY, JSON.stringify(next), true);
    } catch {
      // local list still reflects the save even if the write failed
    }
  };

  const loadCourseFromLibrary = (entry) => {
    // A handicap index is portable across courses — only the course's own
    // par/slope/stroke-index data changes here, so the roster stays put.
    // (This used to also clear players, on the assumption that a course
    // switch always meant starting a brand new event — but it's also used
    // to compare different saved courses for the *same* day/draw, where
    // wiping the roster loses real work for no reason.)
    //
    // What DOES have to change is each player's tee: it's stored as the tee's
    // name, and the new course very likely names its tees differently
    // ("Weekday" rather than "Back"). Left alone, the old name stays on the
    // player — the draw goes on SHOWING "Back" while every calculation
    // quietly uses the new course's first tee. So anyone on a tee this
    // course doesn't have is moved to its first tee (blank tees are left
    // blank, so "no tee set" still shows). Returns how many were moved.
    let moved = 0;
    const labels = (entry.course.tees || []).map((t) => t.label);
    const first = labels[0] || "";
    const fix = (tee) => {
      if (!tee || labels.some((l) => normalizeName(l) === normalizeName(tee))) return tee;
      moved += 1;
      return first;
    };
    updateRound((prevRound) => {
      moved = 0;
      return {
        course: entry.course,
        players: prevRound.players.map((p) => ({ ...p, tee: fix(p.tee), ...(p.partnerName ? { partnerTee: fix(p.partnerTee) } : {}) })),
      };
    });
    return { moved, tee: first };
  };

  // Brings saved courses in from a file exported on another site (e.g.
  // Lucifer's Royal St George's into the ORGS app). A course with the same
  // name as one already saved here replaces it; everything else is added.
  const importCoursesToLibrary = async (entries) => {
    const valid = (entries || []).filter((e) => e && typeof e.name === "string" && e.name.trim() && isValidCourse(e.course));
    if (valid.length === 0) return { added: 0, replaced: 0 };
    let added = 0, replaced = 0;
    let next = [...library];
    valid.forEach((e) => {
      const i = next.findIndex((x) => x.name.trim().toLowerCase() === e.name.trim().toLowerCase());
      const entry = { id: i >= 0 ? next[i].id : crypto.randomUUID(), name: e.name.trim(), course: e.course };
      if (i >= 0) { next[i] = entry; replaced += 1; } else { next.push(entry); added += 1; }
    });
    setLibrary(next);
    try {
      await window.storage.set(LIBRARY_KEY, JSON.stringify(next), true);
    } catch {
      return { added, replaced, failed: true };
    }
    return { added, replaced };
  };

  const deleteCourseFromLibrary = async (id) => {
    const next = library.filter((e) => e.id !== id);
    setLibrary(next);
    try {
      await window.storage.set(LIBRARY_KEY, JSON.stringify(next), true);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    if (!eventCode) return;
    load();
  }, [eventCode, load]);

  // Back in range: send anything that's waiting, then fetch the latest.
  const resync = useCallback(() => {
    if (dirtyRef.current) pump();
    load();
  }, [pump, load]);

  useEffect(() => {
    window.addEventListener("online", resync);
    return () => window.removeEventListener("online", resync);
  }, [resync]);

  // While offline, keep trying every 15 seconds on every screen (the usual
  // refresh only runs on some of them).
  useEffect(() => {
    if (!offline) return;
    const t = setInterval(resync, 15000);
    return () => clearInterval(t);
  }, [offline, resync]);

  useEffect(() => {
    // The leaderboard refreshes itself — and so does the players' "Enter
    // scores" screen, so everyone sees which cards are done or in hand.
    // Every other public screen (Menu, Draw, Local rules, Information)
    // refreshes too, just less often — so something Admin switches on,
    // like players' score entry or a changed draw, reaches a phone that's
    // simply sitting open, without the app having to be reopened. Admin
    // and the handicap screen are left alone so nothing moves mid-edit.
    if (mode === "scorer" || mode === "handicap") return;
    // Leaderboard every 10s, the players' score list every 5s (few people,
    // and they need to see each other's cards being taken), other screens
    // every 20s. Each refresh is now only a few bytes unless something has
    // actually changed.
    const every = mode === "entry" ? 5000 : mode === "board" ? 10000 : 20000;
    pollRef.current = setInterval(load, every);
    // ...and straight away whenever the app is brought back to the front.
    const onVisible = () => { if (document.visibilityState === "visible") load(); };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(pollRef.current);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [mode, load]);

  // Leaving the score screens lets go of whichever card was open.
  useEffect(() => {
    if (mode === "entry" || mode === "scorer" || !activeId) return;
    releaseCard(activeId);
    setActiveId(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  // A player's phone is sent back to the list if the card it has open
  // turns out to belong to someone else (they claimed it first), has been
  // completed, or Admin has switched players' score entry off.
  useEffect(() => {
    if (mode !== "entry") return;
    if (!activeRound.publicScoreEntry || isMatchPlay) {
      setActiveId(null);
      setMode("menu");
      return;
    }
    if (!activeId) return;
    const card = players.find((p) => p.id === activeId);
    if (!card) { setActiveId(null); return; }
    if (!awaitingSignature(card) && lockHeldByOther(card, deviceId)) {
      setEntryNotice(`${card.name}'s card is being entered on another phone — please pick a different one.`);
      setActiveId(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, activeId, players, activeRound.publicScoreEntry]);

  // Every field that used to live at the top level (course, players, draw,
  // localRules, startingHole) now belongs to a specific round — this merges
  // a patch onto the currently active round and leaves the others untouched.
  const updateRound = (patch, opts) => {
    save((prevState) => ({
      rounds: prevState.rounds.map((r) => (r.id === activeRoundId ? { ...r, ...(typeof patch === "function" ? patch(r) : patch) } : r)),
    }), opts);
  };

  const addPlayer = () => {
    const next = [...players, emptyPlayer(course, isFoursomes)];
    updateRound({ players: next });
    setActiveId(next[next.length - 1].id);
  };

  // Lets a player be added straight from the Draw screen (name + handicap
  // in one go) rather than needing to jump to Admin. Always creates
  // a plain individual entry — pairing itself still happens by placing them
  // into the draw's slots, and gets folded into a proper pair record the
  // next time the draw is saved.
  const addPlayerQuick = (name, index) => {
    const trimmed = (name || "").trim();
    if (!trimmed) return;
    const newPlayer = { id: crypto.randomUUID(), name: trimmed, index, tee: course.tees[0]?.label || "", scores: Array(18).fill("") };
    updateRound({ players: [...players, newPlayer] });
  };

  // Adds a new roster entry for any name not already present, and fills in
  // a blank handicap for anyone who has one — never overwrites a value
  // someone's already deliberately entered. Used when a draw paste also
  // carries handicap figures alongside the names.
  // Merges {name, index} handicap pairs onto a player list in memory —
  // adds anyone missing, fills a blank index, never overwrites a value
  // already entered. Doesn't write to state itself; the caller combines
  // this with whatever else needs to happen in the same update.
  const mergeHandicapsIntoPlayers = (currentPlayers, pairs) => {
    if (!pairs || pairs.length === 0) return currentPlayers;
    let next = [...currentPlayers];
    pairs.forEach(({ name, index }) => {
      const target = normalizeName(name);
      const existingIdx = next.findIndex((p) => normalizeName(p.name) === target);
      if (existingIdx === -1) {
        next.push({ id: crypto.randomUUID(), name: name.trim(), index, tee: course.tees[0]?.label || "", scores: Array(18).fill("") });
      } else if (!next[existingIdx].index) {
        next[existingIdx] = { ...next[existingIdx], index };
      }
    });
    return next;
  };

  // Sets which tee a player uses, straight from a draw paste's tee-indicator
  // column. Runs on the (already handicap-merged) individual player list —
  // if this round is Foursomes, the pairing step right after will correctly
  // carry this into the pair record's tee/partnerTee fields on its own.
  const mergeTeesIntoPlayers = (currentPlayers, teePairs) => {
    if (!teePairs || teePairs.length === 0) return currentPlayers;
    let next = [...currentPlayers];
    teePairs.forEach(({ name, tee }) => {
      const target = normalizeName(name);
      const idx = next.findIndex((p) => normalizeName(p.name) === target);
      if (idx !== -1) next[idx] = { ...next[idx], tee };
    });
    return next;
  };

  // Same idea, for a sub-competition abbreviation straight from the draw
  // paste — runs before pairing, same as tees, for the same reason.
  // For every name that appears anywhere in THIS paste, their competition
  // is set to exactly whatever this paste says — including being cleared
  // if this paste doesn't mention a competition for them at all. A day's
  // own paste is always the source of truth for that day's tagging, so a
  // tag from an earlier paste (or a different day entirely) never lingers
  // just because this particular re-paste didn't repeat it. Anyone NOT
  // part of this paste at all (a different, unrelated player already on
  // the roster) is left completely untouched.
  const mergeCompetitionsIntoPlayers = (currentPlayers, compPairs, namesInThisPaste) => {
    const compMap = new Map((compPairs || []).map(({ name, abbreviation }) => [normalizeName(name), abbreviation]));
    const pasteSet = new Set((namesInThisPaste || []).map(normalizeName));
    return currentPlayers.map((p) => {
      // On a Foursomes day one record holds two people, each with their
      // own tag — so the partner's half is updated too, not just the
      // first-named player's. (Previously only the first name was, so a
      // partner's competition from a re-upload was silently dropped.)
      const patch = {};
      const target = normalizeName(p.name);
      if (target && pasteSet.has(target)) patch.competition = compMap.get(target) || "";
      const partnerTarget = normalizeName(p.partnerName);
      if (partnerTarget && pasteSet.has(partnerTarget)) patch.partnerCompetition = compMap.get(partnerTarget) || "";
      return Object.keys(patch).length > 0 ? { ...p, ...patch } : p;
    });
  };

  const importPlayers = (newPlayers) => {
    updateRound({ players: [...players, ...newPlayers] });
  };

  const loadExample = () => updateRound({ players: exampleSeed(course) });

  // Built from the latest saved round (not this render's snapshot), so an
  // update from one phone can never carry along an out-of-date copy of
  // somebody else's card.
  const updatePlayer = (id, patch) => {
    updateRound((prevRound) => ({ players: prevRound.players.map((p) => (p.id === id ? { ...p, ...patch } : p)) }), { immediate: true });
    if ("index" in patch || "partnerIndex" in patch) {
      const round = stateRef.current.rounds.find((r) => r.id === activeRoundId);
      const card = round && round.players.find((p) => p.id === id);
      if (card && "index" in patch) syncIndexElsewhere(card.name, patch.index);
      if (card && "partnerIndex" in patch) syncIndexElsewhere(card.partnerName, patch.partnerIndex);
    }
  };

  // ---- Card locks (see ENTRY_LOCK_MS above) ----
  const claimCard = (id, { force = false } = {}) => {
    const round = stateRef.current.rounds.find((r) => r.id === activeRoundId);
    const card = round && round.players.find((p) => p.id === id);
    if (!card) return;
    if (!force) {
      if (card.scoresComplete === true || (card.scoresComplete === undefined && isScoreComplete(card))) {
        setEntryNotice(`${card.name}'s card has already been completed.`);
        return;
      }
      if (lockHeldByOther(card, deviceId)) {
        setEntryNotice(`${card.name}'s card is being entered on another phone.`);
        return;
      }
    }
    setEntryNotice("");
    const now = Date.now();
    updateRound((prevRound) => ({
      players: prevRound.players.map((p) => (p.id === id ? { ...p, entryLock: { by: deviceId, claimedAt: now, at: now } } : p)),
    }), { immediate: true });
    setActiveId(id);
  };

  const releaseCard = (id) => {
    if (!id) return;
    const round = stateRef.current.rounds.find((r) => r.id === activeRoundId);
    const card = round && round.players.find((p) => p.id === id);
    if (!card || !card.entryLock || card.entryLock.by !== deviceId) return;
    updateRound((prevRound) => ({
      players: prevRound.players.map((p) => (p.id === id && p.entryLock && p.entryLock.by === deviceId ? { ...p, entryLock: null } : p)),
    }), { immediate: true });
  };

  const closeCard = () => {
    releaseCard(activeId);
    setActiveId(null);
  };

  // Lets a handicap be edited straight from the draw builder — looks up
  // whoever has this name, whether they're currently a primary roster
  // entry or stored as someone's partner, and updates the right field.
  // A player's handicap index is kept in more than one place: on each
  // day's own list, and in the Society roster (which is where "Add from
  // society roster" copies it from). Changing it on one day used to leave
  // the other copies alone — so an old figure kept coming back whenever
  // the player was re-added from the roster, or when looking at another
  // day. Now a change made on any day is also written to:
  //   • the Society roster, and
  //   • every OTHER day on which that player has no scores entered yet.
  // A day that already has scores for them is deliberately left alone, so
  // correcting a handicap later can never quietly rewrite a finished result.
  const syncIndexElsewhere = (name, newIndex) => {
    const target = normalizeName(name);
    if (!target) return;
    save((prev) => ({
      societyRoster: prev.societyRoster.map((m) => (normalizeName(m.name) === target ? { ...m, index: newIndex } : m)),
      rounds: prev.rounds.map((r) => {
        if (r.id === activeRoundId) return r;
        return {
          ...r,
          players: r.players.map((p) => {
            const played = (p.scores || []).some((v) => v !== "" && v != null);
            if (played) return p;
            if (normalizeName(p.name) === target) return { ...p, index: newIndex };
            if (normalizeName(p.partnerName) === target) return { ...p, partnerIndex: newIndex };
            return p;
          }),
        };
      }),
    }));
  };

  const updatePlayerIndexByName = (name, newIndex) => {
    const target = normalizeName(name);
    updateRound((prevRound) => ({
      players: prevRound.players.map((p) => {
        if (normalizeName(p.name) === target) return { ...p, index: newIndex };
        if (normalizeName(p.partnerName) === target) return { ...p, partnerIndex: newIndex };
        return p;
      }),
    }));
    syncIndexElsewhere(name, newIndex);
  };

  // Updates both handicap and tee for whoever matches this name in one
  // write — used by the draw's slot editor, which edits both at once.
  const updatePlayerDetailsByName = (name, newIndex, newTee, newCompetition) => {
    // Matched with the same forgiving comparison used to FIND the player
    // (ignores capitals and stray double spaces). It used to use a
    // stricter one — so for a name stored with, say, a double space, the
    // pop-up showed the player but the save matched nobody and silently
    // did nothing, and the old handicap "came back".
    const target = normalizeName(name);
    updateRound((prevRound) => ({
      players: prevRound.players.map((p) => {
        if (normalizeName(p.name) === target) return { ...p, index: newIndex, tee: newTee, competition: newCompetition };
        if (normalizeName(p.partnerName) === target) return { ...p, partnerIndex: newIndex, partnerTee: newTee, partnerCompetition: newCompetition };
        return p;
      }),
    }));
    syncIndexElsewhere(name, newIndex);
  };

  const updateScore = (id, holeIdx, val) => {
    // No upper limit on a hole's score — whatever is on the card goes in
    // (e.g. a 9, or whatever maximum applies that day). Only guards
    // against a negative or non-numeric entry.
    const num = Number(val);
    const clean = val === "" || isNaN(num) ? "" : Math.max(0, Math.round(num));
    updateRound((prevRound) => ({
      players: prevRound.players.map((p) =>
        p.id === id
          ? {
              ...p,
              scores: p.scores.map((s, i) => (i === holeIdx ? clean : s)),
              // typing keeps this phone's hold on the card alive
              entryLock: p.entryLock && p.entryLock.by === deviceId ? { ...p.entryLock, at: Date.now() } : p.entryLock,
              // Pin down the card's status the first time it's touched:
              // a brand-new card starts as "in progress" (hidden from the
              // leaderboard until COMPLETE is pressed); a card that already
              // had scores from before this feature stays visible.
              scoresComplete: p.scoresComplete === undefined ? isScoreComplete(p) : p.scoresComplete,
            }
          : p
      ),
    }));
  };

  const removePlayer = (id) => updateRound((prevRound) => ({ players: prevRound.players.filter((p) => p.id !== id) }));

  // Removes a given set of players from this day in one go — used by the
  // Build tab's "Remove all unplaced" button, which passes exactly the
  // players showing in its pool (so someone just dropped into a slot, but
  // not yet auto-saved, is never caught by it).
  const removePlayersByIds = (ids) => {
    const gone = new Set(ids);
    updateRound((prevRound) => ({ players: prevRound.players.filter((p) => !gone.has(p.id)) }));
  };

  const clearAllPlayers = () => updateRound({ players: [], draw: [] });

  // Removes anyone from the roster who isn't currently placed in the draw
  // at all — for cleaning up after restructuring a draw (e.g. pulling a
  // whole group out into its own separate day), where their roster
  // records would otherwise be left behind as invisible leftovers.
  // Deliberately does NOT touch anyone still sitting unassigned in the
  // pool who's genuinely mid-setup — only ones with neither their name
  // nor (for a Foursomes pair) their partner's name anywhere in the
  // saved draw.
  const removePlayersNotInDraw = () => {
    const namesInDraw = new Set(draw.flatMap((entry) => entry.players || []).map(normalizeName));
    updateRound({
      players: players.filter(
        (p) => namesInDraw.has(normalizeName(p.name)) || namesInDraw.has(normalizeName(p.partnerName))
      ),
    });
  };

  // A full withdrawal — for someone pulling out on the day. Removes them
  // from wherever they are in the draw AND from the roster/leaderboard,
  // in one persisted action, so nothing needs a separate "Save draw" tap
  // or a re-upload to fully reflect it. On a Foursomes day, a record
  // holds two people sharing one row: if the person leaving is the
  // primary and has a partner, the partner is promoted into the primary
  // slot (rather than deleting the whole record, which would wrongly
  // remove the partner too); if they're the partner, just their half is
  // cleared, leaving the primary in place.
  const withdrawPlayer = (name) => {
    const target = normalizeName(name);
    const newDraw = draw.map((entry) => ({
      ...entry,
      players: (entry.players || []).filter((n) => normalizeName(n) !== target),
    }));
    const newPlayers = players
      .map((p) => {
        if (normalizeName(p.name) === target) {
          if (p.partnerName) {
            return {
              ...p,
              name: p.partnerName, index: p.partnerIndex, tee: p.partnerTee, competition: p.partnerCompetition, handicapAdjustment: p.partnerHandicapAdjustment,
              partnerName: "", partnerIndex: "", partnerTee: "", partnerCompetition: "", partnerHandicapAdjustment: 0,
            };
          }
          return null;
        }
        if (normalizeName(p.partnerName) === target) {
          return { ...p, partnerName: "", partnerIndex: "", partnerTee: "", partnerCompetition: "", partnerHandicapAdjustment: 0 };
        }
        return p;
      })
      .filter(Boolean);
    updateRound({ draw: newDraw, players: newPlayers });
  };

  const copyPlayersFromRound = (sourceRoundId) => {
    const source = rounds.find((r) => r.id === sourceRoundId);
    if (!source) return;

    const validTee = (teeLabel) => (teeLabel && course.tees.some((t) => t.label === teeLabel)) ? teeLabel : course.tees[0]?.label || "";

    if (isFoursomes && source.format !== "foursomes") {
      // Source players are individuals, but this day needs pairs — pair
      // them up two-by-two (1st+2nd, 3rd+4th, ...) instead of creating a
      // half-empty pair per person.
      const copied = [];
      for (let i = 0; i < source.players.length; i += 2) {
        const a = source.players[i];
        const b = source.players[i + 1];
        copied.push({
          id: crypto.randomUUID(),
          name: a.name,
          index: a.index,
          tee: validTee(a.tee),
          scores: Array(18).fill(""),
          partnerName: b ? b.name : "",
          partnerIndex: b ? b.index : "",
          partnerTee: b ? validTee(b.tee) : course.tees[0]?.label || "",
        });
      }
      updateRound({ players: copied });
      return;
    }

    const copied = source.players.map((p) => {
      const base = {
        id: crypto.randomUUID(),
        name: p.name,
        index: p.index,
        tee: validTee(p.tee),
        scores: Array(18).fill(""),
      };
      if (isFoursomes) {
        return {
          ...base,
          partnerName: p.partnerName || "",
          partnerIndex: p.partnerIndex || "",
          partnerTee: validTee(p.partnerTee),
        };
      }
      return base;
    });
    updateRound({ players: copied });
  };

  // Merges a fresh set of pairs derived from the draw onto the current
  // roster — a pair still grouped the same way keeps its existing scores
  // and handicaps rather than being reset. Shared by both "the draw
  // changed" and "format just switched to Foursomes" triggers, so pairs
  // stay correct automatically in either case, with no manual step.
  const syncPairsFromDraw = (currentPlayers, currentDraw) => mergedPairsFromDraw(currentPlayers, currentDraw, course);

  const updateCourse = (patch) => updateRound({ course: { ...course, ...patch } });

  // A tee's label is just a plain string on each player record (not a
  // reference to the tee object), so renaming it in Course setup would
  // otherwise silently orphan everyone already set to the old name —
  // getTee() would stop finding a match and quietly fall back to
  // whichever tee is listed first, producing a wrong handicap with no
  // obvious sign anything's changed. This brings every current player
  // (and Foursomes partner) on the old label across to the new one —
  // in the SAME updateRound call as the tee list change itself, since
  // two separate calls fired back-to-back would each build their patch
  // from the same pre-update snapshot of the round, and the second one
  // would silently overwrite (undo) the first.
  const renameTee = (teeId, newLabel) => {
    const existing = course.tees.find((t) => t.id === teeId);
    if (!existing) return;
    const oldLabel = existing.label;
    const tees = course.tees.map((t) => (t.id === teeId ? { ...t, label: newLabel } : t));
    if (!oldLabel || oldLabel === newLabel) {
      updateRound({ course: { ...course, tees } });
      return;
    }
    const target = normalizeName(oldLabel);
    updateRound({
      course: { ...course, tees },
      players: players.map((p) => ({
        ...p,
        ...(normalizeName(p.tee) === target ? { tee: newLabel } : {}),
        ...(normalizeName(p.partnerTee) === target ? { partnerTee: newLabel } : {}),
      })),
    });
  };

  const updateOrgName = (name) => save({ orgName: name });

  const updateAccentColor = (color) => save({ accentColor: color });

  const updateHeaderColor = (color) => save({ headerColor: color });

  const updatePin = (newPin) => save({ pin: newPin });

  const updateHandicapPin = (newPin) => save({ handicapPin: newPin });

  // Sub-competitions (e.g. a seniors' trophy) — freeform, since the actual
  // trophies change through the year. Just an abbreviation + full name;
  // players get tagged with the abbreviation, same idea as the tee field.
  // Each day keeps its own list — a new day always starts with a clean
  // sheet, and adding, editing, or removing one here never touches any
  // other day's competitions.
  const addCompetition = () => {
    updateRound((prevRound) => ({ competitions: [...prevRound.competitions, { id: crypto.randomUUID(), abbreviation: "", fullName: "" }] }));
  };

  const updateCompetition = (id, patch) => {
    updateRound((prevRound) => ({ competitions: prevRound.competitions.map((c) => (c.id === id ? { ...c, ...patch } : c)) }));
  };

  const removeCompetition = (id) => {
    updateRound((prevRound) => ({ competitions: prevRound.competitions.filter((c) => c.id !== id) }));
  };

  // ---- Society roster: a persistent list of known members, separate from
  // any single day's own player list — a source to pick from when building
  // a draw, rather than re-typing/re-pasting names and handicaps fresh
  // every time (which is where names could previously go missing if a
  // handicap didn't parse correctly).
  const addSocietyMember = () => {
    save((prev) => ({ societyRoster: [...prev.societyRoster, { id: crypto.randomUUID(), name: "", index: "", tee: course.tees[0]?.label || "" }] }));
  };

  const updateSocietyMember = (id, patch) => {
    save((prev) => ({ societyRoster: prev.societyRoster.map((m) => (m.id === id ? { ...m, ...patch } : m)) }));
  };

  // Empties the Society roster in one go (it only ever removes the ids it
  // is given, so a member added on another device in the meantime stays).
  const clearSocietyRoster = (ids) => {
    const gone = new Set(ids);
    save((prev) => ({ societyRoster: prev.societyRoster.filter((m) => !gone.has(m.id)) }));
  };

  const removeSocietyMember = (id) => {
    save((prev) => ({ societyRoster: prev.societyRoster.filter((m) => m.id !== id) }));
  };

  // Bulk-add via the same paste format used elsewhere (Name, Handicap,
  // Tee) — duplicates (matched by name) are skipped rather than added
  // twice.
  const importSocietyMembers = (newMembers) => {
    let addedCount = 0;
    save((prev) => {
      const existingNames = new Set(prev.societyRoster.map((m) => normalizeName(m.name)));
      const toAdd = newMembers.filter((m) => !existingNames.has(normalizeName(m.name)));
      addedCount = toAdd.length;
      return { societyRoster: [...prev.societyRoster, ...toAdd] };
    });
    return addedCount;
  };

  // Adds a set of society-roster members into the CURRENT round's own
  // player list, copying their handicap/tee as a starting point — this is
  // the actual "pull known players into today's draw" step. Anyone already
  // in this round's roster (matched by name) is left untouched rather than
  // duplicated.
  const addSocietyMembersToRound = (memberIds) => {
    const toAdd = societyRoster.filter((m) => memberIds.includes(m.id));
    const existingNames = new Set(players.map((p) => normalizeName(p.name)));
    // Deliberately does NOT carry over the member's stored tee — that tee
    // is very likely from whichever course they were last added on, which
    // may be a completely different venue with completely different tee
    // names. Left blank here (rather than silently guessing a default),
    // it'll show up flagged in the roster so it gets set correctly for
    // THIS day's actual course — see the bulk "Set tee" tool for doing
    // that quickly for everyone at once.
    const newPlayers = toAdd
      .filter((m) => !existingNames.has(normalizeName(m.name)))
      .map((m) => ({ id: crypto.randomUUID(), name: m.name, index: m.index || "", tee: "", scores: Array(18).fill("") }));
    if (newPlayers.length > 0) updateRound({ players: [...players, ...newPlayers] });
    return newPlayers.length;
  };

  // Sets the same tee for a whole batch of INDIVIDUAL PEOPLE at once — not
  // records. On a Foursomes day, one player record holds two people (a
  // primary and a partner), so a selection is { recordId, role } and this
  // writes to .tee for "primary" or .partnerTee for "partner" on the
  // matching record, rather than assuming one row = one person.
  const bulkSetTee = (selections, tee) => {
    updateRound((prevRound) => ({
      players: prevRound.players.map((p) => {
        const setsPrimary = selections.some((s) => s.recordId === p.id && s.role === "primary");
        const setsPartner = selections.some((s) => s.recordId === p.id && s.role === "partner");
        if (!setsPrimary && !setsPartner) return p;
        return { ...p, ...(setsPrimary ? { tee } : {}), ...(setsPartner ? { partnerTee: tee } : {}) };
      }),
    }));
  };

  // Sets ONE person's per-day handicap adjustment — addressed the same way
  // as bulkSetTee, since a Foursomes record holds two people.
  const setHandicapAdjustment = (recordId, role, value) => {
    updateRound((prevRound) => ({
      players: prevRound.players.map((p) => {
        if (p.id !== recordId) return p;
        return role === "partner" ? { ...p, partnerHandicapAdjustment: value } : { ...p, handicapAdjustment: value };
      }),
    }));
  };

  // Applies the SAME adjustment to a whole batch of people at once — e.g.
  // "all ladies get +2 shots for this competition".
  const bulkSetHandicapAdjustment = (selections, value) => {
    updateRound((prevRound) => ({
      players: prevRound.players.map((p) => {
        const setsPrimary = selections.some((s) => s.recordId === p.id && s.role === "primary");
        const setsPartner = selections.some((s) => s.recordId === p.id && s.role === "partner");
        if (!setsPrimary && !setsPartner) return p;
        return { ...p, ...(setsPrimary ? { handicapAdjustment: value } : {}), ...(setsPartner ? { partnerHandicapAdjustment: value } : {}) };
      }),
    }));
  };

  // Auto-registers a placeholder entry for any abbreviation seen in a draw
  // paste that isn't already in this day's Competitions list — so a code
  // works the moment it appears, with no requirement to set it up first.
  // Scoped to the active round only, same as the rest of this day's
  // competitions. Returns the list of genuinely new abbreviations, so the
  // caller can tell the user what still needs a proper full name.
  const ensureCompetitionsExist = (abbreviations) => {
    let fresh = [];
    updateRound((prevRound) => {
      const existing = new Set(prevRound.competitions.map((c) => c.abbreviation.toUpperCase()));
      fresh = [...new Set(abbreviations.map((a) => a.toUpperCase()))].filter((a) => !existing.has(a));
      if (fresh.length === 0) return {};
      return { competitions: [...prevRound.competitions, ...fresh.map((abbreviation) => ({ id: crypto.randomUUID(), abbreviation, fullName: "" }))] };
    });
    return fresh;
  };

  // Updates a player's handicap index everywhere they appear, across every
  // day of the event — matches by name, checking both the primary name and
  // (for Foursomes pairs) the partner name, since it's the same portable
  // index either way.
  // Index and competition are the same regardless of which course a
  // player is on, so these stay synced everywhere the name appears.
  const updateIndexAndCompetitionEverywhere = (name, newIndex, newCompetition) => {
    const target = normalizeName(name);
    save((prev) => ({
      societyRoster: prev.societyRoster.map((m) => (normalizeName(m.name) === target ? { ...m, index: newIndex } : m)),
      rounds: prev.rounds.map((r) => ({
        ...r,
        players: r.players.map((p) => {
          if (normalizeName(p.name) === target) return { ...p, index: newIndex, competition: newCompetition };
          if (normalizeName(p.partnerName) === target) return { ...p, partnerIndex: newIndex, partnerCompetition: newCompetition };
          return p;
        }),
      })),
    }));
  };

  // Tee is deliberately NOT synced across rounds — different courses
  // often use entirely different tee names/colours for equivalent tees
  // (e.g. "Club"/"Purple" at one course, "Back"/"Front" at another), so a
  // single "this player's tee" choice doesn't make sense event-wide. Each
  // round keeps its own tee for a player, set independently.
  const updateTeeForRound = (roundId, name, newTee) => {
    const target = normalizeName(name);
    save((prev) => ({
      rounds: prev.rounds.map((r) => {
        if (r.id !== roundId) return r;
        return {
          ...r,
          players: r.players.map((p) => {
            if (normalizeName(p.name) === target) return { ...p, tee: newTee };
            if (normalizeName(p.partnerName) === target) return { ...p, partnerTee: newTee };
            return p;
          }),
        };
      }),
    }));
  };

  // Sets a competition tag for a whole set of players at once, on THIS
  // day only — competitions are per-day now, so a bulk-tag here should
  // never reach into another day's players, even one with the same name.
  // Selecting someone sets the tag; leaving someone unselected clears it
  // ONLY if they currently carry this specific competition (so it never
  // touches a different tag they might already have).
  const bulkTagCompetition = (selectedNames, abbreviation) => {
    const selectedSet = new Set(selectedNames.map(normalizeName));
    updateRound((prevRound) => ({
      players: prevRound.players.map((p) => {
        let patch = {};
        if (p.name) {
          if (selectedSet.has(normalizeName(p.name))) patch.competition = abbreviation;
          else if (p.competition === abbreviation) patch.competition = "";
        }
        if (p.partnerName) {
          if (selectedSet.has(normalizeName(p.partnerName))) patch.partnerCompetition = abbreviation;
          else if (p.partnerCompetition === abbreviation) patch.partnerCompetition = "";
        }
        return Object.keys(patch).length > 0 ? { ...p, ...patch } : p;
      }),
    }));
  };

  // Competitions are per-day now, so a view that spans every round (the
  // combined leaderboard, the cross-day handicap check) needs the union
  // of every day's own list to correctly resolve any abbreviation it
  // might encounter — deduplicated by abbreviation, keeping the first
  // full name seen for each.
  const allCompetitionsAcrossRounds = () => {
    const seen = new Set();
    const merged = [];
    rounds.forEach((r) => {
      (r.competitions || []).forEach((c) => {
        const key = (c.abbreviation || "").toUpperCase();
        if (!key || seen.has(key)) return;
        seen.add(key);
        merged.push(c);
      });
    });
    return merged;
  };

  // Every distinct player name across every day, each with whatever
  // handicap, tee, and competition tag they currently have on their most
  // recent appearance — the list the handicap-check screen searches against.
  const allPlayersAcrossRounds = () => {
    const byName = new Map();
    rounds.forEach((r) => {
      r.players.forEach((p) => {
        const addEntry = (name, index, tee, competition) => {
          if (!name) return;
          const key = normalizeName(name);
          if (!byName.has(key)) byName.set(key, { name, index, competition, rounds: [] });
          const entry = byName.get(key);
          // Index/competition are the same regardless of which round we
          // saw them on last — but keep whichever is actually set, in case
          // an earlier round for this name has it blank.
          if (index) entry.index = index;
          if (competition) entry.competition = competition;
          // Never add a second entry for a round we've already recorded —
          // this can otherwise happen if a stale partnerName field is
          // still sitting on a different player's record (e.g. left over
          // from a day that was briefly set to Foursomes format and then
          // switched back), which would wrongly look like the same name
          // appearing twice in one round.
          if (!entry.rounds.some((rd) => rd.roundId === r.id)) {
            entry.rounds.push({ roundId: r.id, roundLabel: r.label, tee, teeOptions: r.course.tees.map((t) => t.label) });
          }
        };
        addEntry(p.name, p.index, p.tee, p.competition);
        addEntry(p.partnerName, p.partnerIndex, p.partnerTee, p.partnerCompetition);
      });
    });
    return [...byName.values()].sort((a, b) => a.name.localeCompare(b.name));
  };

  // Guarantees every name appearing anywhere in the draw has a roster
  // entry — even one whose handicap/tee didn't get picked up correctly
  // from the paste (e.g. depending on column order). The draw itself is
  // always the source of truth for "who is actually playing"; a missing
  // handicap should never mean a missing player.
  const ensureAllDrawPlayersExist = (currentPlayers, newDraw) => {
    let next = [...currentPlayers];
    const allDrawNames = newDraw.flatMap((entry) => entry.players || []).filter(Boolean);
    allDrawNames.forEach((name) => {
      const target = normalizeName(name);
      if (!next.some((p) => normalizeName(p.name) === target)) {
        next.push({ id: crypto.randomUUID(), name: name.trim(), index: "", tee: course.tees[0]?.label || "", scores: Array(18).fill("") });
      }
    });
    return next;
  };

  const updateDraw = (newDraw, hcpPairs, teePairs, compPairs) => {
    // Everything the draw paste can touch (roster handicaps, tees,
    // competitions, then pairing) gets computed here in one pass from the
    // same starting snapshot of players, and written in a single update —
    // doing this as separate save() calls previously meant a later one
    // could work from stale data and silently undo an earlier one.
    //
    // It all happens inside save(), working from the LATEST saved list of
    // players rather than the copy this screen was drawn with. The Build
    // tab's auto-save fires a couple of seconds after a change, and by
    // then its copy could be out of date — it would then write back a
    // handicap, tee or adjustment that had just been corrected.
    save((prev) => {
    const liveRound = prev.rounds.find((r) => r.id === activeRoundId);
    const players = liveRound ? liveRound.players : [];
    const course = liveRound ? liveRound.course : activeRound.course;
    const isFoursomes = liveRound ? liveRound.format === "foursomes" : false;
    const withHandicaps = mergeHandicapsIntoPlayers(players, hcpPairs);
    const withTees = mergeTeesIntoPlayers(withHandicaps, teePairs);
    const namesInThisPaste = newDraw.flatMap((entry) => entry.players || []);
    // Competition tags are only rewritten when this really IS a paste/CSV
    // import (which always passes a compPairs list, even an empty one).
    // Every other save of the draw — the Build tab's Save button and its
    // auto-save, removing a tee time — passes nothing here, and must leave
    // everyone's tags alone. It used to be treated as "a paste that
    // mentions no competitions", which wiped every tagged player in the
    // draw a couple of seconds after the Build tab was opened.
    const withComps = Array.isArray(compPairs)
      ? mergeCompetitionsIntoPlayers(withTees, compPairs, namesInThisPaste)
      : withTees;
    const withAllDrawPlayers = ensureAllDrawPlayersExist(withComps, newDraw);
    // On a Singles day, strip any partner fields that might be lingering
    // on a player's record — e.g. leftover from a day that was briefly,
    // incorrectly set to Foursomes at some point in the past. A stale
    // partnerName can otherwise cause a completely different bug later:
    // looking up "who is this person" can match the WRONG record (the
    // stale partner entry) before ever reaching the player's own correct,
    // freshly-imported one.
    const cleanedDrawPlayers = isFoursomes
      ? withAllDrawPlayers
      : withAllDrawPlayers.map((p) => ({ ...p, partnerName: "", partnerIndex: "", partnerTee: "", partnerCompetition: "" }));
    const finalPlayers = isFoursomes
      ? mergedPairsFromDraw(cleanedDrawPlayers, newDraw, course)
      : cleanedDrawPlayers;

    // Any brand-new name from this paste also joins the Society Roster —
    // checked against the individual (pre-pairing) list, since the roster
    // holds individuals even on a Foursomes day — so it builds itself up
    // over time rather than needing separate upkeep.
    {
      const existingRosterNames = new Set(prev.societyRoster.map((m) => normalizeName(m.name)));
      const newRosterMembers = cleanedDrawPlayers
        .filter((p) => p.name && !existingRosterNames.has(normalizeName(p.name)))
        .map((p) => ({ id: crypto.randomUUID(), name: p.name, index: p.index || "", tee: p.tee || course.tees[0]?.label || "" }));
      return {
        rounds: prev.rounds.map((r) => (r.id === activeRoundId ? { ...r, draw: newDraw, players: finalPlayers } : r)),
        societyRoster: newRosterMembers.length > 0 ? [...prev.societyRoster, ...newRosterMembers] : prev.societyRoster,
      };
    }
    });
  };

  // A players-only list pasted/uploaded on the Draw screen: everyone is
  // added to this day's list (the pool on the Build tab) ready to be
  // placed; anyone already there has any blank details filled in. New
  // names also join the Society roster, as they do from a draw.
  const addPeopleToDay = (people) => {
    let added = 0, updated = 0;
    save((prev) => {
      const round = prev.rounds.find((r) => r.id === activeRoundId);
      if (!round) return {};
      const firstTee = round.course.tees[0]?.label || "";
      let nextPlayers = [...round.players];
      people.forEach((person) => {
        const target = normalizeName(person.name);
        const i = nextPlayers.findIndex((p) => normalizeName(p.name) === target);
        if (i === -1) {
          nextPlayers.push({ id: crypto.randomUUID(), name: person.name, index: person.index || "", tee: person.tee || firstTee, competition: person.competition || "", scores: Array(18).fill("") });
          added += 1;
        } else {
          const p = nextPlayers[i];
          const patched = { ...p, index: person.index || p.index, tee: person.tee || p.tee, competition: person.competition || p.competition };
          if (patched.index !== p.index || patched.tee !== p.tee || patched.competition !== p.competition) updated += 1;
          nextPlayers[i] = patched;
        }
      });
      const rosterNames = new Set(prev.societyRoster.map((m) => normalizeName(m.name)));
      const newRoster = people
        .filter((person) => !rosterNames.has(normalizeName(person.name)))
        .map((person) => ({ id: crypto.randomUUID(), name: person.name, index: person.index || "", tee: person.tee || firstTee }));
      return {
        rounds: prev.rounds.map((r) => (r.id === activeRoundId ? { ...r, players: nextPlayers } : r)),
        societyRoster: newRoster.length > 0 ? [...prev.societyRoster, ...newRoster] : prev.societyRoster,
      };
    });
    return { added, updated };
  };

  const updateLocalRules = (text) => updateRound({ localRules: text });

  const updateStartingHole = (hole) => updateRound({ startingHole: hole });

  const updateFormat = (f) => {
    if (f === "foursomes" && draw.length > 0) {
      updateRound({ format: f, players: syncPairsFromDraw(players, draw) });
      return;
    }
    if (f !== "foursomes") {
      // Switching to Individual — clear out any partner fields left over
      // from Foursomes pairing. Otherwise a stale partnerName can linger
      // on a player's record indefinitely and get wrongly read elsewhere
      // as a second, phantom entry for whoever that name belonged to.
      updateRound({
        format: f,
        players: players.map((p) => ({ ...p, partnerName: "", partnerIndex: "", partnerTee: "", partnerCompetition: "" })),
      });
      return;
    }
    updateRound({ format: f });
  };

  const updateScoring = (s) => updateRound({ scoring: s });

  const updateDrawStartTime = (t) => updateRound({ drawStartTime: t });

  const updateDrawInterval = (mins) => updateRound({ drawInterval: mins });

  const updateDrawNote = (note) => updateRound({ drawNote: note });

  const updatePublicVis = (patch) => updateRound(patch);

  // ---- Match Play: simple pairings with a free-text final result (e.g.
  // "3&2"), rather than hole-by-hole scoring.
  const addMatch = () => {
    updateRound({ matches: [...matches, { id: crypto.randomUUID(), playerA: "", partnerA: "", playerB: "", partnerB: "", result: "" }] });
  };

  const updateMatch = (id, patch) => {
    updateRound({ matches: matches.map((m) => (m.id === id ? { ...m, ...patch } : m)) });
  };

  const removeMatch = (id) => {
    updateRound({ matches: matches.filter((m) => m.id !== id) });
  };

  const uploadDocument = async (file) => {
    const code = eventCodeRef.current;
    if (!code || !file) return { ok: false, error: "No event code." };
    if (file.size > MAX_DOC_SIZE_MB * 1024 * 1024) {
      return { ok: false, error: `That file is too large — please keep PDFs under ${MAX_DOC_SIZE_MB}MB.` };
    }
    const dataUrl = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error("Couldn't read that file."));
      reader.readAsDataURL(file);
    });
    const docId = crypto.randomUUID();
    try {
      await window.storage.set(docStorageKey(code, docId), dataUrl, true);
    } catch {
      return { ok: false, error: "Upload failed — check your connection and try again." };
    }
    const entry = { id: docId, name: file.name, sizeKB: Math.round(file.size / 1024) };
    save((prev) => ({ documents: [...prev.documents, entry] }));
    return { ok: true };
  };

  const removeDocument = async (docId) => {
    const code = eventCodeRef.current;
    save((prev) => ({ documents: prev.documents.filter((d) => d.id !== docId) }));
    if (code) {
      try {
        await window.storage.delete(docStorageKey(code, docId), true);
      } catch {
        // metadata is already removed from the list either way; a leftover
        // orphaned blob costs nothing and isn't reachable from the UI
      }
    }
  };

  const openDocument = (doc) => {
    const code = eventCodeRef.current;
    if (!code) return;
    // On iOS, skip the in-app iframe viewer entirely — it can silently
    // truncate a multi-page PDF to just the first page. Handing the file
    // to iOS's own PDF viewer instead is fully reliable. The window has
    // to be opened synchronously, right on the tap, or Safari's popup
    // blocker kills it once the fetch below finishes asynchronously.
    if (isIOSDevice()) {
      const newWindow = window.open("", "_blank");
      (async () => {
        try {
          const res = await window.storage.get(docStorageKey(code, doc.id), true);
          const blobUrl = dataUrlToBlobUrl(res.value);
          if (newWindow) newWindow.location.href = blobUrl;
          else setViewingDoc({ name: doc.name, blobUrl, loading: false }); // popup was blocked — fall back to the in-app viewer rather than fail silently
        } catch {
          if (newWindow) newWindow.close();
          setViewingDoc({ name: doc.name, blobUrl: null, loading: false, error: true });
        }
      })();
      return;
    }
    setViewingDoc({ name: doc.name, blobUrl: null, loading: true });
    (async () => {
      try {
        const res = await window.storage.get(docStorageKey(code, doc.id), true);
        const blobUrl = dataUrlToBlobUrl(res.value);
        setViewingDoc({ name: doc.name, blobUrl, loading: false });
      } catch {
        setViewingDoc({ name: doc.name, blobUrl: null, loading: false, error: true });
      }
    })();
  };

  const closeDocument = () => {
    setViewingDoc((prev) => {
      if (prev && prev.blobUrl) URL.revokeObjectURL(prev.blobUrl);
      return null;
    });
  };

  const addRound = () => {
    if (rounds.length >= MAX_ROUNDS) return;
    const newRound = emptyRound(`Day ${rounds.length + 1}`, course);
    save((prev) => ({ rounds: [...prev.rounds, newRound], activeRoundId: newRound.id }));
    setLocalActiveRoundId(newRound.id);
  };

  const renameRound = (roundId, label) => {
    save((prev) => ({ rounds: prev.rounds.map((r) => (r.id === roundId ? { ...r, label } : r)) }));
  };

  const updateRoundDate = (roundId, date) => {
    // A genuine YYYY-MM-DD only — guards against a stray extra keystroke
    // producing something like a 5-digit year, which would otherwise sort
    // to a bizarre position without any obvious error.
    if (date && !/^\d{4}-\d{2}-\d{2}$/.test(date)) return;
    save((prev) => ({ rounds: sortRoundsByDate(prev.rounds.map((r) => (r.id === roundId ? { ...r, date } : r))) }));
  };

  const removeRound = (roundId) => {
    if (rounds.length <= 1) return;
    let nextActiveId = activeRoundId;
    save((prev) => {
      const next = prev.rounds.filter((r) => r.id !== roundId);
      nextActiveId = prev.activeRoundId === roundId ? next[0].id : prev.activeRoundId;
      return { rounds: next, activeRoundId: nextActiveId };
    });
    if (activeRoundId === roundId) setLocalActiveRoundId(nextActiveId);
  };

  const setActiveRound = (roundId) => setLocalActiveRoundId(roundId);

  const handleScorerTap = () => {
    if (!adminVisible) return;
    if (scorerUnlocked) {
      setMode("scorer");
    } else {
      setShowPinPrompt(true);
    }
  };

  const handleHandicapTap = () => {
    if (handicapUnlocked) {
      setMode("handicap");
    } else {
      setShowHandicapPinPrompt(true);
    }
  };

  const unplaced = players.filter((p) => !isPlayingOnDay(activeRound, p));
  const ranked = players
    .filter((p) => isPlayingOnDay(activeRound, p))
    .map((p) => ({
      ...p,
      displayName: isFoursomes && p.partnerName ? `${p.name} & ${p.partnerName}` : p.name,
      ...totals(course, p, handicapAllowance, isFoursomes),
    }))
    .sort((a, b) => {
      if (isMedal) {
        if (a.thru === 0 && b.thru === 0) return 0;
        if (a.thru === 0) return 1;
        if (b.thru === 0) return -1;
        return a.relToPar - b.relToPar || b.thru - a.thru;
      }
      return b.pts - a.pts || b.thru - a.thru;
    });

  const active = players.find((p) => p.id === activeId);

  // The "N players" figure in the header counts PEOPLE actually playing:
  // everyone placed in the draw once there is one (so anyone still sitting
  // unplaced in the pool isn't counted); before a draw exists, everyone
  // named on the day's list. It used to count list entries — which on a
  // Foursomes day are pairs, so a field of 40 showed as "20 players", and
  // blank or unplaced entries were counted too.
  const namesPlaying = new Set(draw.flatMap((entry) => entry.players || []).filter(Boolean).map(normalizeName));
  const namesListed = new Set(players.flatMap((p) => [p.name, p.partnerName]).filter(Boolean).map(normalizeName));
  const playingCount = namesPlaying.size > 0 ? namesPlaying.size : namesListed.size;
  // ...and the format shown beside it is the day's real one, rather than
  // always saying Stableford.
  const headerFormatLabel = isMatchPlay ? "Match Play" : `${isMedal ? "Medal" : "Stableford"}${isFoursomes ? " Foursomes" : ""}`;

  if (!eventCode) {
    return <CodeGate onSubmit={enterEventCode} />;
  }

  return (
    <div style={{ background: "#F1EFE3", minHeight: "100vh", fontFamily: "'Iowan Old Style','Georgia',serif", color: "#1B1B1B" }}>
      <style>{`
        .mono { font-family: 'Courier New', ui-monospace, monospace; }
        .scoreInput::-webkit-outer-spin-button, .scoreInput::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
        .scoreInput { -moz-appearance: textfield; }
        @keyframes menuPulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(241,239,227,0.55); }
          50% { box-shadow: 0 0 0 7px rgba(241,239,227,0); }
        }
        .menu-pulse { animation: menuPulse 1.8s ease-in-out infinite; }
      `}</style>

      {/* Header */}
      <div className="no-print" style={{ background: headerColor, color: "#F1EFE3", padding: "18px 16px 22px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {logoForOrgName(orgName) ? <SocietyLogo orgName={orgName} height={50} /> : <Flag size={20} color={accentColor} />}
            <span style={{ fontSize: 22, letterSpacing: "0.08em", textTransform: "uppercase", opacity: 0.75 }}>
              {orgName}
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, opacity: 0.85 }}>
            <Radio size={13} color={offline ? "#E0A33A" : live ? "#7FB88F" : accentColor} />
            {offline ? "Offline" : live ? "Live" : "Connecting…"}
          </div>
        </div>
        <div style={{ fontSize: 26, fontWeight: 700, marginTop: 6, letterSpacing: "-0.01em" }}>
          {course.eventName}
        </div>
        <div style={{ fontSize: 13, opacity: 0.85, marginTop: 1 }}>
          {course.name}
        </div>
        {rounds.length > 1 && (
          <button
            onClick={() => setShowDaySwitcher(true)}
            style={{
              marginTop: 10, width: "100%", fontSize: 14, fontWeight: 800, padding: "10px 12px", borderRadius: 8,
              border: `2px solid ${accentColor}`, background: accentColor, color: "#FFFFFF",
              display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8,
            }}
          >
            <span>{activeRound.label}</span>
            <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, fontWeight: 700, opacity: 0.9 }}>
              Switch <ChevronRight size={14} style={{ transform: "rotate(90deg)" }} />
            </span>
          </button>
        )}
        <div style={{ fontSize: 12.5, opacity: 0.7, marginTop: 2, display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <span>{headerFormatLabel} · Par {coursePar(course)} · {playingCount} {playingCount === 1 ? "player" : "players"}</span>
          {scorerUnlocked && isOwner && (
            <button
              onClick={switchEvent}
              style={{ background: "none", border: "none", color: "#F1EFE3", opacity: 0.7, fontSize: 11, textDecoration: "underline", padding: 0 }}
            >
              Switch event
            </button>
          )}
        </div>
        {offline && !loadFailed && (
          <div style={{ fontSize: 11.5, color: "#1B1B1B", background: "#F3D58A", borderRadius: 6, padding: "5px 8px", marginTop: 8, fontWeight: 600 }}>
            No signal — showing the copy saved on this phone
            {lastSyncAtRef.current ? ` at ${new Date(lastSyncAtRef.current).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}` : ""}.
            It will update by itself when the signal returns.
          </div>
        )}
        {syncError && (
          <div style={{ fontSize: 11, color: "#F1EFE3", background: "rgba(181,68,46,0.85)", borderRadius: 6, padding: "4px 8px", marginTop: 8 }}>
            Last change didn't save — check your connection and try again.
          </div>
        )}

        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 14 }}>
          <button
            onClick={() => { setMode("menu"); setShowCourseSetup(false); }}
            className={mode === "menu" ? "" : "menu-pulse"}
            style={{
              flex: "1 1 30%", padding: "8px 0", borderRadius: 7,
              border: mode === "menu" ? "1px solid rgba(241,239,227,0.25)" : `2px solid ${accentColor}`,
              background: mode === "menu" ? "#F1EFE3" : "transparent",
              color: mode === "menu" ? headerColor : "#F1EFE3",
              fontSize: 12, fontWeight: 800, letterSpacing: "0.02em",
            }}
          >
            Menu
          </button>
          <button
            onClick={() => { setMode("board"); setShowCourseSetup(false); }}
            style={{
              flex: "1 1 30%", padding: "8px 0", borderRadius: 7, border: "1px solid rgba(241,239,227,0.25)",
              background: mode === "board" ? "#F1EFE3" : "transparent",
              color: mode === "board" ? headerColor : "#F1EFE3",
              fontSize: 12, fontWeight: 600, letterSpacing: "0.02em",
            }}
          >
            Leaderboard
          </button>
          <button
            onClick={() => { setMode("draw"); setShowCourseSetup(false); }}
            style={{
              flex: "1 1 30%", padding: "8px 0", borderRadius: 7, border: "1px solid rgba(241,239,227,0.25)",
              background: mode === "draw" ? "#F1EFE3" : "transparent",
              color: mode === "draw" ? headerColor : "#F1EFE3",
              fontSize: 12, fontWeight: 600, letterSpacing: "0.02em",
            }}
          >
            Draw
          </button>
          <button
            onClick={() => { setMode("rules"); setShowCourseSetup(false); }}
            style={{
              flex: "1 1 30%", padding: "8px 0", borderRadius: 7, border: "1px solid rgba(241,239,227,0.25)",
              background: mode === "rules" ? "#F1EFE3" : "transparent",
              color: mode === "rules" ? headerColor : "#F1EFE3",
              fontSize: 12, fontWeight: 600, letterSpacing: "0.02em",
            }}
          >
            Local rules
          </button>
          <button
            onClick={() => { setMode("docs"); setShowCourseSetup(false); }}
            style={{
              flex: "1 1 30%", padding: "8px 0", borderRadius: 7, border: "1px solid rgba(241,239,227,0.25)",
              background: mode === "docs" ? "#F1EFE3" : "transparent",
              color: mode === "docs" ? headerColor : "#F1EFE3",
              fontSize: 12, fontWeight: 600, letterSpacing: "0.02em",
            }}
          >
            Information
          </button>
          <button
            onClick={handleHandicapTap}
            style={{
              flex: "1 1 30%", padding: "8px 0", borderRadius: 7, border: "1px solid rgba(241,239,227,0.25)",
              background: mode === "handicap" ? "#F1EFE3" : "transparent",
              color: mode === "handicap" ? headerColor : "#F1EFE3",
              fontSize: 12, fontWeight: 600, letterSpacing: "0.02em",
            }}
          >
            Your Handicap
          </button>
          {activeRound.publicScoreEntry && !isMatchPlay && (
          <button
            onClick={() => { closeCard(); setEntryNotice(""); setMode("entry"); setShowCourseSetup(false); load(); }}
            style={{
              flex: "1 1 100%", padding: "10px 0", borderRadius: 7, border: `2px solid ${accentColor}`,
              background: mode === "entry" ? "#F1EFE3" : accentColor,
              color: mode === "entry" ? headerColor : "#FFFFFF",
              fontSize: 13, fontWeight: 800, letterSpacing: "0.04em",
            }}
          >
            Enter scores
          </button>
          )}
          {adminVisible && (
          <button
            onClick={handleScorerTap}
            style={{
              flex: "1 1 30%", padding: "8px 0", borderRadius: 7, border: "1px solid rgba(241,239,227,0.25)",
              background: mode === "scorer" ? "#F1EFE3" : "transparent",
              color: mode === "scorer" ? headerColor : "#F1EFE3",
              fontSize: 12, fontWeight: 600, letterSpacing: "0.02em",
            }}
          >
            Admin
          </button>
          )}
        </div>
      </div>

      {loading ? (
        <div style={{ padding: 40, textAlign: "center", color: "#6B6B5F" }}>Loading…</div>
      ) : loadFailed ? (
        <div style={{ padding: "40px 24px", textAlign: "center", color: "#1B1B1B" }}>
          <div style={{ fontSize: 17, fontWeight: 800, marginBottom: 8 }}>No signal</div>
          <div style={{ fontSize: 13.5, color: "#6B6B5F", marginBottom: 18, lineHeight: 1.5 }}>
            This phone hasn't opened <strong>{eventCode}</strong> before, so there's no saved copy to show yet.
            Once it has loaded once with a signal, the draw, rules and leaderboard will open here even without one.
          </div>
          <button
            onClick={() => { setLoading(true); load(); }}
            style={{ padding: "11px 26px", borderRadius: 8, border: "none", background: headerColor, color: "#FFFFFF", fontWeight: 700, fontSize: 14 }}
          >
            Try again
          </button>
        </div>
      ) : mode === "menu" ? (
        <PlayerMenu
          rounds={rounds}
          activeRoundId={activeRoundId}
          headerColor={headerColor}
          accentColor={accentColor}
          onSelectDay={(roundId) => { setActiveRound(roundId); setMode("draw"); }}
          onSelectLeaderboard={() => setMode("board")}
          onSelectRules={() => setMode("rules")}
          onSelectInfo={() => setMode("docs")}
          onSelectHandicap={handleHandicapTap}
        />
      ) : mode === "board" ? (
        <Board rounds={rounds} tab={boardTab} competitions={allCompetitionsAcrossRounds()} headerColor={headerColor} accentColor={accentColor} activeRound={activeRound} />
      ) : mode === "draw" ? (
        // Public, like the leaderboard — no PIN needed just to see the draw.
        isMatchPlay
          ? <MatchResultsView matches={matches} players={players} course={course} drawNote={activeRound.drawNote} headerColor={headerColor} accentColor={accentColor} />
          : <DrawView draw={draw} startingHole={startingHole} drawNote={activeRound.drawNote} headerColor={headerColor} accentColor={accentColor} course={course} players={players} handicapAllowance={handicapAllowance} isFoursomes={isFoursomes} publicShowIndex={activeRound.publicShowIndex} publicShowCH={activeRound.publicShowCH} publicShowTee={activeRound.publicShowTee} publicShowComp={activeRound.publicShowComp} publicShowStartTee={activeRound.publicShowStartTee} />
      ) : mode === "rules" ? (
        // Public too — anyone can read the local rules without a PIN.
        <LocalRulesView text={localRules} headerColor={headerColor} accentColor={accentColor} />
      ) : mode === "docs" ? (
        // Public — a list of PDFs anyone can open, no PIN needed.
        <DocumentsView documents={documents} onOpen={openDocument} headerColor={headerColor} accentColor={accentColor} />
      ) : mode === "handicap" && handicapUnlocked ? (
        <HandicapCheck
          players={allPlayersAcrossRounds()}
          competitions={allCompetitionsAcrossRounds()}
          onUpdateIndexAndCompetition={updateIndexAndCompetitionEverywhere}
          onUpdateTeeForRound={updateTeeForRound}
          headerColor={headerColor}
          accentColor={accentColor}
        />
      ) : mode === "entry" && activeRound.publicScoreEntry && !isMatchPlay ? (
        // Players helping to put cards in — only while Admin has it switched on.
        active ? (
          <ScoreEntry
            publicMode
            requireSignature={activeRound.requireSignature !== false}
            deviceId={deviceId}
            ownCardStore={{ code: eventCode, roundId: activeRoundId }}
            groupNames={(() => {
              const target = normalizeName(active.name);
              const entry = draw.find((e) => (e.players || []).some((n) => normalizeName(n) === target));
              const names = entry ? entry.players.filter((n) => normalizeName(n) !== target) : [];
              return names.length > 0 ? names : players.map((p) => p.name).filter((n) => n && normalizeName(n) !== target);
            })()}
            course={course}
            player={active}
            onBack={closeCard}
            onUpdate={(patch) => updatePlayer(active.id, patch)}
            onScore={(hole, val) => updateScore(active.id, hole, val)}
            headerColor={headerColor}
            isFoursomes={format === "foursomes"}
            isMedal={isMedal}
            handicapAllowance={handicapAllowance}
          />
        ) : (
          <PublicScoreList
            ranked={ranked}
            isFoursomes={isFoursomes}
            deviceId={deviceId}
            notice={entryNotice}
            roundLabel={activeRound.label}
            onSelect={async (id) => {
              // Fetch the very latest first, so a card someone else opened a
              // moment ago is refused here rather than sorted out afterwards.
              await load();
              claimCard(id);
            }}
            onReview={async (id) => { await load(); setEntryNotice(""); setActiveId(id); }}
            headerColor={headerColor}
            accentColor={accentColor}
          />
        )
      ) : !scorerUnlocked ? (
        // Guard: mode can only reach "scorer" via handleScorerTap, which
        // requires scorerUnlocked — but if that state is ever false here
        // (e.g. a stale render), fall back to the board rather than
        // exposing the scorer screens.
        <Board rounds={rounds} tab={boardTab} competitions={allCompetitionsAcrossRounds()} headerColor={headerColor} accentColor={accentColor} activeRound={activeRound} />
      ) : active ? (
        <ScoreEntry
          course={course}
          player={active}
          onBack={closeCard}
          onUpdate={(patch) => updatePlayer(active.id, patch)}
          onScore={(hole, val) => updateScore(active.id, hole, val)}
          headerColor={headerColor}
          isFoursomes={format === "foursomes"}
          isMedal={isMedal}
          handicapAllowance={handicapAllowance}
        />
      ) : showMatchesSetup ? (
        <MatchesSetup
          matches={matches}
          players={players}
          onAdd={addMatch}
          onUpdate={updateMatch}
          onRemove={removeMatch}
          onBack={() => setShowMatchesSetup(false)}
          headerColor={headerColor}
          accentColor={accentColor}
        />
      ) : showDrawSetup ? (
        <DrawSetup
          draw={draw}
          players={players}
          onUpdate={updateDraw}
          startingHole={startingHole}
          onUpdateStartingHole={updateStartingHole}
          onBack={() => setShowDrawSetup(false)}
          roundKey={activeRoundId}
          societyRoster={societyRoster}
          onAddFromRoster={addSocietyMembersToRound}
          onBulkSetTee={bulkSetTee}
          onSetHandicapAdjustment={setHandicapAdjustment}
          onWithdrawPlayer={withdrawPlayer}
          onBulkSetHandicapAdjustment={bulkSetHandicapAdjustment}
          publicShowIndex={activeRound.publicShowIndex}
          publicShowCH={activeRound.publicShowCH}
          publicShowTee={activeRound.publicShowTee}
          publicShowComp={activeRound.publicShowComp}
          publicShowStartTee={activeRound.publicShowStartTee}
          publicShowGross={activeRound.publicShowGross}
          publicShowNet={activeRound.publicShowNet}
          publicShowPoints={activeRound.publicShowPoints}
          publicShowDayBoard={activeRound.publicShowDayBoard}
          onUpdatePublicVis={updatePublicVis}
          headerColor={headerColor}
          accentColor={accentColor}
          course={course}
          format={format}
          onUpdateFormat={updateFormat}
          scoring={scoring}
          onUpdateScoring={updateScoring}
          handicapAllowance={handicapAllowance}
          onUpdateHandicapAllowance={(pct) => updateRound({ handicapAllowance: pct })}
          library={library}
          onLoadFromLibrary={loadCourseFromLibrary}
          drawStartTime={drawStartTime}
          onUpdateDrawStartTime={updateDrawStartTime}
          drawInterval={drawInterval}
          onUpdateDrawInterval={updateDrawInterval}
          drawNote={activeRound.drawNote}
          onUpdateDrawNote={updateDrawNote}
          roundLabel={activeRound.label}
          onRenameRound={(label) => renameRound(activeRoundId, label)}
          roundDate={activeRound.date}
          onUpdateRoundDate={(date) => updateRoundDate(activeRoundId, date)}
          onUpdatePlayerIndex={updatePlayerIndexByName}
          onUpdatePlayerDetails={updatePlayerDetailsByName}
          competitions={competitions}
          onEnsureCompetitionsExist={ensureCompetitionsExist}
          onAddPeople={addPeopleToDay}
          onAddPlayerQuick={addPlayerQuick}
          onRemovePlayer={removePlayer}
          onRemovePlayers={removePlayersByIds}
        />
      ) : showLocalRulesSetup ? (
        <LocalRulesSetup
          text={localRules}
          onUpdate={updateLocalRules}
          onBack={() => setShowLocalRulesSetup(false)}
          headerColor={headerColor}
        />
      ) : showDocumentsSetup ? (
        <DocumentsSetup
          documents={documents}
          onUpload={uploadDocument}
          onRemove={removeDocument}
          onOpen={openDocument}
          onBack={() => setShowDocumentsSetup(false)}
          headerColor={headerColor}
          accentColor={accentColor}
        />
      ) : showCompetitionsSetup ? (
        <CompetitionsSetup
          competitions={competitions}
          onAdd={addCompetition}
          onUpdate={updateCompetition}
          onRemove={removeCompetition}
          allPlayers={players}
          onBulkTag={bulkTagCompetition}
          onBack={() => setShowCompetitionsSetup(false)}
          headerColor={headerColor}
          accentColor={accentColor}
          roundLabel={activeRound.label}
        />
      ) : showBackup && isOwner ? (
        <BackupRestore
          eventCode={eventCode}
          state={state}
          onRestore={(restored) => {
            // Goes through the normal safe-save, so every phone picks it up.
            // Card locks from the moment of the backup are dropped — nobody
            // has those cards open now.
            const clean = sanitizeState(restored);
            clean.rounds = clean.rounds.map((r) => ({ ...r, players: r.players.map((p) => ({ ...p, entryLock: null })) }));
            save(() => clean, { immediate: true });
            setLocalActiveRoundId(defaultRoundIdFor(clean.rounds, clean.activeRoundId));
          }}
          onBack={() => setShowBackup(false)}
          headerColor={headerColor}
          accentColor={accentColor}
        />
      ) : showPrintBoard ? (
        <PrintLeaderboard
          rounds={rounds}
          activeRound={activeRound}
          competitions={allCompetitionsAcrossRounds()}
          orgName={state.orgName}
          onBack={() => setShowPrintBoard(false)}
          headerColor={headerColor}
        />
      ) : showPrintDraw ? (
        <PrintDraw
          draw={draw}
          players={players}
          course={course}
          handicapAllowance={handicapAllowance}
          isFoursomes={isFoursomes}
          visOpts={{
            showIndex: activeRound.publicShowIndex,
            showCH: activeRound.publicShowCH,
            showTee: activeRound.publicShowTee,
            showComp: activeRound.publicShowComp,
            showStartTee: activeRound.publicShowStartTee,
          }}
          startingHole={startingHole}
          drawNote={activeRound.drawNote}
          roundLabel={activeRound.label}
          roundDateDisplay={formatDisplayDateLong(activeRound.date)}
          orgName={state.orgName}
          onBack={() => setShowPrintDraw(false)}
          headerColor={headerColor}
        />
      ) : showPrintLabels ? (
        <PrintLabels
          societyRoster={societyRoster}
          course={course}
          players={players}
          draw={draw}
          roundDateDisplay={formatDisplayDateLong(activeRound.date)}
          drawNote={activeRound.drawNote}
          competitions={competitions}
          handicapAllowance={handicapAllowance}
          isFoursomes={isFoursomes}
          scoring={scoring}
          roundLabel={activeRound.label}
          onBack={() => setShowPrintLabels(false)}
          headerColor={headerColor}
          accentColor={accentColor}
        />
      ) : showEnterScores ? (
        <EnterScores
          course={course}
          ranked={ranked}
          unplaced={unplaced}
          onSelect={(id) => claimCard(id, { force: true })}
          deviceId={deviceId}
          onAdd={addPlayer}
          onRemove={removePlayer}
          onLoadExample={loadExample}
          onImport={importPlayers}
          onClearAll={clearAllPlayers}
          onRemoveNotInDraw={removePlayersNotInDraw}
          onBack={() => setShowEnterScores(false)}
          headerColor={headerColor}
          accentColor={accentColor}
          rounds={rounds}
          activeRoundId={activeRoundId}
          onCopyPlayers={copyPlayersFromRound}
          isFoursomes={isFoursomes}
          onBulkSetTee={bulkSetTee}
        />
      ) : showSocietyRoster ? (
        <SocietyRosterSetup
          roster={societyRoster}
          onAdd={addSocietyMember}
          onUpdate={updateSocietyMember}
          onRemove={removeSocietyMember}
          onImport={importSocietyMembers}
          onClearAll={clearSocietyRoster}
          course={course}
          roundPlayers={players}
          roundLabel={activeRound.label}
          onAddToRound={(id) => addSocietyMembersToRound([id])}
          onBack={() => setShowSocietyRoster(false)}
          headerColor={headerColor}
          accentColor={accentColor}
        />
      ) : showCourseSetup && isOwner ? (
        <CourseSetup
          orgName={orgName}
          onUpdateOrgName={updateOrgName}
          accentColor={accentColor}
          onUpdateAccentColor={updateAccentColor}
          headerColor={headerColor}
          onUpdateHeaderColor={updateHeaderColor}
          pin={pin}
          onUpdatePin={updatePin}
          handicapPin={handicapPin}
          onUpdateHandicapPin={updateHandicapPin}
          canEditPins={isOwner}
          course={course}
          onUpdate={updateCourse}
          onRenameTee={renameTee}
          onBack={() => setShowCourseSetup(false)}
          library={library}
          onSaveToLibrary={saveCourseToLibrary}
          onLoadFromLibrary={loadCourseFromLibrary}
          onDeleteFromLibrary={deleteCourseFromLibrary}
          onImportLibrary={importCoursesToLibrary}
          rounds={rounds}
          activeRoundId={activeRoundId}
          onAddRound={addRound}
          onRenameRound={renameRound}
          onRemoveRound={removeRound}
          onSetActiveRound={setActiveRound}
        />
      ) : (
        <ScorerList
          course={course}
          isMatchPlay={format === "matchplay"}
          onOpenEnterScores={() => setShowEnterScores(true)}
          onOpenCourseSetup={() => setShowCourseSetup(true)}
          onOpenDrawSetup={() => setShowDrawSetup(true)}
          onOpenMatchesSetup={() => setShowMatchesSetup(true)}
          onOpenLocalRulesSetup={() => setShowLocalRulesSetup(true)}
          onOpenDocumentsSetup={() => setShowDocumentsSetup(true)}
          onOpenCompetitionsSetup={() => setShowCompetitionsSetup(true)}
          onOpenSocietyRoster={() => setShowSocietyRoster(true)}
          onOpenPrintLabels={() => setShowPrintLabels(true)}
          onOpenPrintDraw={() => setShowPrintDraw(true)}
          onOpenPrintBoard={() => setShowPrintBoard(true)}
          onOpenBackup={() => setShowBackup(true)}
          isOwner={isOwner}
          headerColor={headerColor}
          accentColor={accentColor}
          onLock={() => { setScorerUnlocked(false); setMode("board"); setActiveId(null); setShowCourseSetup(false); setShowDrawSetup(false); setShowMatchesSetup(false); setShowLocalRulesSetup(false); setShowDocumentsSetup(false); setShowCompetitionsSetup(false); setShowPrintLabels(false); setShowPrintDraw(false); setShowPrintBoard(false); setShowBackup(false); setShowEnterScores(false); setShowSocietyRoster(false); }}
          publicScoreEntry={activeRound.publicScoreEntry}
          onTogglePublicScoreEntry={() => updateRound((prevRound) => ({ publicScoreEntry: !prevRound.publicScoreEntry }))}
          requireSignature={activeRound.requireSignature !== false}
          onToggleRequireSignature={() => updateRound((prevRound) => ({ requireSignature: prevRound.requireSignature === false }))}
          roundLabel={activeRound.label}
          onHideAdmin={() => { setAdminDevice(eventCode, ""); rememberAdminPin(eventCode, ""); setAdminLevel(""); setScorerUnlocked(false); setMode("menu"); setActiveId(null); setShowCourseSetup(false); setShowDrawSetup(false); setShowMatchesSetup(false); setShowLocalRulesSetup(false); setShowDocumentsSetup(false); setShowCompetitionsSetup(false); setShowPrintLabels(false); setShowPrintDraw(false); setShowPrintBoard(false); setShowBackup(false); setShowEnterScores(false); setShowSocietyRoster(false); }}
        />
      )}

      {showPinPrompt && (
        <PinPrompt
          pin={pin}
          accentColor={accentColor}
          headerColor={headerColor}
          initialEntry={adminVisible ? rememberedAdminPin(eventCode) : ""}
          description={adminVisible && rememberedAdminPin(eventCode) ? "Your PIN is filled in — just press Unlock." : undefined}
          onSuccess={() => {
            if (adminVisible) rememberAdminPin(eventCode, pin);
            setScorerUnlocked(true);
            setShowPinPrompt(false);
            setMode("scorer");
          }}
          onCancel={() => setShowPinPrompt(false)}
        />
      )}
      {showHandicapPinPrompt && (
        <PinPrompt
          pin={handicapPin}
          accentColor={accentColor}
          headerColor={headerColor}
          title="Handicap code"
          description="Enter the code to check or update a player's handicap index."
          onSuccess={() => {
            setHandicapUnlocked(true);
            setShowHandicapPinPrompt(false);
            setMode("handicap");
          }}
          onCancel={() => setShowHandicapPinPrompt(false)}
        />
      )}
      {showDaySwitcher && (
        <DaySwitcher
          rounds={rounds}
          activeRoundId={activeRoundId}
          headerColor={headerColor}
          accentColor={accentColor}
          isAdmin={scorerUnlocked}
          onAdd={addRound}
          onRemove={removeRound}
          onSelect={(id) => { setActiveRound(id); setShowDaySwitcher(false); }}
          onClose={() => setShowDaySwitcher(false)}
        />
      )}
      {viewingDoc && (
        <div style={{ position: "fixed", inset: 0, background: "#1B1B1B", zIndex: 60, display: "flex", flexDirection: "column" }}>
          <div style={{ background: headerColor, padding: "10px 12px", display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
            <button
              onClick={closeDocument}
              style={{
                display: "flex", alignItems: "center", gap: 5, padding: "8px 14px", borderRadius: 8,
                border: "none", background: "#F1EFE3", color: headerColor, fontWeight: 700, fontSize: 13.5,
              }}
            >
              <X size={15} /> Close
            </button>
            <span style={{ color: "#F1EFE3", fontSize: 13, fontWeight: 600, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {viewingDoc.name}
            </span>
          </div>
          <div style={{ flex: 1, background: "#525659" }}>
            {viewingDoc.loading ? (
              <div style={{ color: "#F1EFE3", textAlign: "center", padding: 40 }}>Loading…</div>
            ) : viewingDoc.error ? (
              <div style={{ color: "#F1EFE3", textAlign: "center", padding: 40 }}>Couldn't load this document — check your connection and try again.</div>
            ) : (
              <iframe src={viewingDoc.blobUrl} title={viewingDoc.name} style={{ width: "100%", height: "100%", border: "none" }} />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function PinPrompt({ pin, accentColor, headerColor, onSuccess, onCancel, title = "Admin PIN", description = "Enter the PIN to enter scores or edit the course.", initialEntry = "" }) {
  const [entry, setEntry] = useState(initialEntry);
  const [error, setError] = useState(false);

  const submit = () => {
    if (entry === pin) {
      onSuccess();
    } else {
      setError(true);
      setEntry("");
    }
  };

  return (
    <div
      style={{
        position: "fixed", inset: 0, background: "rgba(27,27,27,0.45)",
        display: "flex", alignItems: "center", justifyContent: "center", padding: 20, zIndex: 50,
      }}
      onClick={onCancel}
    >
      <div
        style={{ background: "#FFFFFF", borderRadius: 12, padding: 22, width: "100%", maxWidth: 300, textAlign: "center" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ fontSize: 15, fontWeight: 700, color: headerColor, marginBottom: 4 }}>{title}</div>
        <div style={{ fontSize: 12, color: "#8A8774", marginBottom: 14 }}>{description}</div>
        <input
          type="password"
          inputMode="numeric"
          value={entry}
          onChange={(e) => { setEntry(e.target.value); setError(false); }}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          className="mono"
          style={{
            width: "100%", fontSize: 20, textAlign: "center", letterSpacing: "0.3em", padding: "10px 0",
            borderRadius: 8, border: error ? "1px solid #B5442E" : "1px solid #D8D4C0", marginBottom: 6,
          }}
        />
        {error && <div style={{ fontSize: 11.5, color: "#B5442E", marginBottom: 8 }}>Incorrect PIN — try again.</div>}
        <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
          <button
            onClick={onCancel}
            style={{ flex: 1, padding: "9px 0", borderRadius: 7, border: "1px solid #D8D4C0", background: "transparent", color: "#6B6B5F", fontWeight: 600, fontSize: 13 }}
          >
            Cancel
          </button>
          <button
            onClick={submit}
            style={{ flex: 1, padding: "9px 0", borderRadius: 7, border: "none", background: accentColor, color: "#FFFFFF", fontWeight: 600, fontSize: 13 }}
          >
            Unlock
          </button>
        </div>
      </div>
    </div>
  );
}

function DaySwitcher({ rounds, activeRoundId, headerColor, accentColor, isAdmin, onAdd, onRemove, onSelect, onClose }) {
  const [confirmRemoveId, setConfirmRemoveId] = useState(null);

  return (
    <div
      style={{
        position: "fixed", inset: 0, background: "rgba(27,27,27,0.45)",
        display: "flex", alignItems: "center", justifyContent: "center", padding: 20, zIndex: 50,
      }}
      onClick={onClose}
    >
      <div
        style={{ background: "#FFFFFF", borderRadius: 12, padding: 16, width: "100%", maxWidth: 320 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ fontSize: 15, fontWeight: 700, color: headerColor, marginBottom: 10, padding: "0 4px" }}>
          Switch day
        </div>
        {rounds.map((r) => {
          const isActive = r.id === activeRoundId;
          const confirming = confirmRemoveId === r.id;
          return (
            <div
              key={r.id}
              style={{
                display: "flex", alignItems: "center", gap: 6, marginBottom: 6,
                borderRadius: 9, border: isActive ? `1px solid ${accentColor}` : "1px solid #E4E0D0",
                background: isActive ? `${accentColor}14` : "#FFFFFF", overflow: "hidden",
              }}
            >
              <button
                onClick={() => onSelect(r.id)}
                style={{
                  flex: 1, textAlign: "left", padding: "12px 12px", border: "none", background: "none",
                  display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8,
                }}
              >
                <span>
                  <span style={{ fontSize: 14, fontWeight: 600, color: isActive ? accentColor : "#1B1B1B", display: "block" }}>
                    {r.label}
                  </span>
                  {r.date && (
                    <span className="mono" style={{ fontSize: 10.5, color: "#8A8774" }}>{formatDisplayDate(r.date)}</span>
                  )}
                </span>
                <span className="mono" style={{ fontSize: 10.5, color: "#8A8774", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                  {r.format === "foursomes" ? "Foursomes" : "Singles"}
                </span>
              </button>
              {isAdmin && rounds.length > 1 && (
                confirming ? (
                  <div style={{ display: "flex", gap: 3, paddingRight: 8 }}>
                    <button
                      onClick={() => { onRemove(r.id); setConfirmRemoveId(null); }}
                      style={{ fontSize: 10.5, fontWeight: 700, color: "#B5442E", background: "none", border: "none", padding: "4px 5px" }}
                    >
                      Delete
                    </button>
                    <button
                      onClick={() => setConfirmRemoveId(null)}
                      style={{ fontSize: 10.5, color: "#9B9885", background: "none", border: "none", padding: "4px 5px" }}
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmRemoveId(r.id)}
                    style={{ padding: "0 10px", alignSelf: "stretch", background: "none", border: "none", color: "#B5442E" }}
                  >
                    <X size={15} />
                  </button>
                )
              )}
            </div>
          );
        })}
        {isAdmin && (
          <button
            onClick={onAdd}
            style={{
              width: "100%", padding: "10px 0", borderRadius: 9, border: `1px dashed ${headerColor}`,
              background: "transparent", color: headerColor, fontWeight: 600, fontSize: 13, marginTop: 2, marginBottom: 4,
              display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
            }}
          >
            <Plus size={14} /> Add a new day
          </button>
        )}
        <button
          onClick={onClose}
          style={{ width: "100%", padding: "10px 0", borderRadius: 9, border: "none", background: "transparent", color: "#8A8774", fontSize: 13, marginTop: 4 }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

function Board({ rounds, tab, competitions, headerColor, accentColor, activeRound }) {
  const [subFilter, setSubFilter] = useState(""); // competition abbreviation, or "" for all
  const singlesRounds = rounds.filter((r) => r.format !== "foursomes");
  const foursomesRounds = rounds.filter((r) => r.format === "foursomes");
  const activeRounds = tab === "singles" ? singlesRounds : foursomesRounds;

  // "This day" is only offered when the currently-active round is a
  // scored (Individual/Foursomes) day matching the tab being viewed —
  // Match Play days have no gross/net/points to show here at all — AND
  // the admin has explicitly switched it on for this day.
  const todayAvailable =
    activeRound &&
    activeRound.publicShowDayBoard &&
    activeRound.format !== "matchplay" &&
    ((tab === "singles" && activeRound.format !== "foursomes") || (tab === "foursomes" && activeRound.format === "foursomes"));

  return (
    <div style={{ padding: "14px 12px 40px" }}>
      <div
        style={{
          padding: "9px 0", borderRadius: 7, border: `1px solid ${headerColor}`, marginBottom: 12,
          background: headerColor, color: "#FFFFFF", fontSize: 12.5, fontWeight: 700, textAlign: "center",
        }}
      >
        {tab === "singles" ? "Singles" : "Foursomes"} — matches the day you're currently viewing
      </div>
      {todayAvailable ? (
        <SingleDayBoard round={activeRound} competitions={competitions} headerColor={headerColor} accentColor={accentColor} />
      ) : (
        <>
      {tab === "singles" && competitions.length > 0 && (() => {
        // Only offer a pill for a competition actually in use across
        // these rounds — showing every competition ever registered
        // globally, even ones nobody currently playing is tagged with
        // (e.g. one only used on a different day), is misleading. Same
        // guards as This day's own filter: a record needs an actual name
        // (not a blank leftover) to count its competition tag, and
        // partnerCompetition only counts with a genuine partner name.
        const combinedAbbrsInUse = new Set(
          activeRounds.flatMap((r) => r.players.flatMap((p) => [p.name ? p.competition : null, p.partnerName ? p.partnerCompetition : null])).filter(Boolean)
        );
        const combinedCompsInUse = competitions.filter((c) => combinedAbbrsInUse.has(c.abbreviation));
        if (combinedCompsInUse.length === 0) return null;
        return (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
          <button
            onClick={() => setSubFilter("")}
            style={{
              padding: "5px 11px", borderRadius: 20, fontSize: 11.5, fontWeight: 600,
              border: `1px solid ${accentColor}`,
              background: subFilter === "" ? accentColor : "transparent",
              color: subFilter === "" ? "#FFFFFF" : accentColor,
            }}
          >
            All
          </button>
          {combinedCompsInUse.map((c) => (
            <button
              key={c.id}
              onClick={() => setSubFilter(c.abbreviation)}
              style={{
                padding: "5px 11px", borderRadius: 20, fontSize: 11.5, fontWeight: 600,
                border: `1px solid ${accentColor}`,
                background: subFilter === c.abbreviation ? accentColor : "transparent",
                color: subFilter === c.abbreviation ? "#FFFFFF" : accentColor,
              }}
            >
              {c.fullName || c.abbreviation}
            </button>
          ))}
        </div>
        );
      })()}
      {activeRounds.length === 0 ? (
        <div style={{ padding: "48px 24px", textAlign: "center", color: "#6B6B5F" }}>
          <Flag size={28} color={accentColor} style={{ marginBottom: 10 }} />
          <div style={{ fontSize: 15 }}>
            No {tab === "singles" ? "singles" : "foursomes"} days set up yet.
          </div>
          <div style={{ fontSize: 12.5, marginTop: 4 }}>
            Set a day's Format in Draw setup to {tab === "singles" ? "Individual" : "Foursomes"} and it'll appear here.
          </div>
        </div>
      ) : (
        <OverallBoard
          rounds={activeRounds}
          headerColor={headerColor}
          accentColor={accentColor}
          computeStandings={
            tab === "foursomes"
              ? combinedPairStandings
              : (rs) => combinedStandings(rs, tab === "singles" ? subFilter : "")
          }
          rowLabel={tab === "foursomes" ? "Pair" : "Player"}
        />
      )}
        </>
      )}
    </div>
  );
}

// ---- Results-sheet look for the leaderboards ----
// Modelled on a traditional club results sheet: a plain serif title and
// sub-title, a solid bar across the head of the table, then one quiet row
// per player — position ("1st"), name with the playing handicap in
// brackets, and the score on the right — divided by hairlines, with every
// other row very faintly shaded.
const RESULTS_FONT = "Georgia, 'Iowan Old Style', 'Times New Roman', serif";

function ordinal(n) {
  const v = n % 100;
  if (v >= 11 && v <= 13) return `${n}th`;
  return `${n}${["th", "st", "nd", "rd"][n % 10] || "th"}`;
}

// "Monday 21st September 2026"
function formatResultsDate(dateStr) {
  if (!dateStr) return "";
  const [y, m, d] = dateStr.split("-").map(Number);
  if (!y || !m || !d) return "";
  const date = new Date(y, m - 1, d);
  return `${date.toLocaleDateString("en-GB", { weekday: "long" })} ${ordinal(d)} ${date.toLocaleDateString("en-GB", { month: "long" })} ${y}`;
}

// "Black & Green Tees" — the tees actually in use, in the course's own order.
function teesInUseText(course, players) {
  const used = new Set(players.flatMap((p) => [p.name ? p.tee : null, p.partnerName ? p.partnerTee : null]).filter(Boolean).map(normalizeName));
  const labels = course.tees.map((t) => t.label).filter((l) => used.has(normalizeName(l)));
  if (labels.length === 0) return "";
  const joined = labels.length === 1 ? labels[0] : `${labels.slice(0, -1).join(", ")} & ${labels[labels.length - 1]}`;
  return `${joined} Tee${labels.length === 1 ? "" : "s"}`;
}

function ResultsHeading({ title, subtitle, note }) {
  return (
    <div style={{ fontFamily: RESULTS_FONT, marginBottom: 12 }}>
      <div style={{ fontSize: 23, fontWeight: 400, lineHeight: 1.2, color: "#2B2B2B" }}>{title}</div>
      {subtitle && <div style={{ fontSize: 16.5, fontWeight: 400, lineHeight: 1.3, color: "#2B2B2B", marginTop: 6 }}>{subtitle}</div>}
      {note && <div style={{ fontSize: 12.5, color: "#3F3F38", marginTop: 8 }}>{note}</div>}
    </div>
  );
}

const resultsStyles = (headerColor) => ({
  frame: { background: "#FBFBFB", border: `1px solid ${headerColor}`, padding: "16px 14px 14px", fontFamily: RESULTS_FONT },
  table: { width: "100%", borderCollapse: "collapse", fontFamily: RESULTS_FONT },
  headRow: { background: headerColor },
  // The name column takes whatever width is left (and wraps if it has to);
  // the position and score columns hug their contents, so on a phone the
  // scores sit close in beside the names instead of pushing off the edge.
  th: { textAlign: "left", padding: "11px 8px", fontSize: 14, fontWeight: 400, color: "#FFFFFF", whiteSpace: "nowrap", userSelect: "none" },
  thRight: { textAlign: "right", padding: "11px 6px", fontSize: 13.5, fontWeight: 400, color: "#FFFFFF", whiteSpace: "nowrap", userSelect: "none", width: "1%" },
  row: (i) => ({ borderBottom: "1px solid #DDDDDD", background: i % 2 === 0 ? "#F7F7F7" : "#FBFBFB" }),
  pos: { padding: "12px 4px 12px 8px", fontSize: 14.5, color: "#2B2B2B", whiteSpace: "nowrap", width: "1%" },
  name: { padding: "12px 6px", fontSize: 15, color: headerColor, lineHeight: 1.25 },
  num: { padding: "12px 6px", fontSize: 15, color: headerColor, textAlign: "right", whiteSpace: "nowrap", width: "1%" },
});

// A single day's own leaderboard — as opposed to OverallBoard's running
// total across every day — with gross, net, and Stableford points each
// shown as their own independently switchable, independently sortable
// column. Which columns actually show is controlled by that round's own
// publicShowGross/Net/Points settings (set in Draw setup), same pattern
// as the public draw-tab switches.
function SingleDayBoard({ round, competitions, headerColor, accentColor }) {
  const [search, setSearch] = useState("");
  const [subFilter, setSubFilter] = useState(""); // competition abbreviation, or "" for all
  const [sortBy, setSortBy] = useState(round.scoring === "medal" ? "net" : "points");
  const [sortDir, setSortDir] = useState(round.scoring === "medal" ? "asc" : "desc"); // lower net is better; higher points is better

  const isFoursomes = round.format === "foursomes";
  const totalHoles = round.course.holes.length;
  const effectivePlayers = playersOnDay(round);

  // Which competition tags actually appear on this day's roster — only
  // offer filter pills for ones that are actually in use here, in case
  // a day only uses a subset of the event's overall competition list.
  // Both halves are gated on there being an actual person there: a
  // record with no name at all could still carry a stale competition
  // tag from before it was cleared out, and partnerCompetition only
  // counts when there's a genuine partner name attached — otherwise
  // either is a leftover with nobody really behind it, and would
  // phantom-show a filter pill for a competition nobody currently
  // visible on this day is actually in.
  const compsInUse = [...new Set(
    effectivePlayers.flatMap((p) => [p.name ? p.competition : null, p.partnerName ? p.partnerCompetition : null]).filter(Boolean)
  )];
  const filteredPlayers = subFilter
    ? effectivePlayers.filter((p) => (p.name && p.competition === subFilter) || (p.partnerName && p.partnerCompetition === subFilter))
    : effectivePlayers;

  const rows = filteredPlayers
    .filter((p) => p.name)
    .map((p) => {
      const t = totals(round.course, forLeaderboard(p), round.handicapAllowance, isFoursomes);
      const complete = t.thru === totalHoles && !t.nr;
      // Gross/Net are only ever shown as an actual number once every hole
      // is in — a partial total isn't a real score to compare, so it's
      // null for sorting purposes either way (not started or incomplete),
      // and the display string distinguishes "–" (nothing entered yet)
      // from "NR" (started but didn't finish — No Return). Points still
      // show as a running total throughout, since that's the normal way
      // to follow a Stableford leaderboard live.
      return {
        name: isFoursomes && p.partnerName ? `${p.name} & ${p.partnerName}` : p.name,
        ph: t.ph,
        // "19.9/26" — handicap index, then what they play off today. For
        // a pair: both indexes, then the pair's combined figure.
        whs: (() => {
          const show = (v) => (v !== "" && v != null ? v : "–");
          return isFoursomes && p.partnerName ? `${show(p.index)} & ${show(p.partnerIndex)}` : show(p.index);
        })(),
        adjusted: !!(Number(p.handicapAdjustment) || (isFoursomes && Number(p.partnerHandicapAdjustment))),
        gross: complete ? t.grossTotal : null,
        net: complete ? t.netTotal : null,
        grossDisplay: complete ? t.grossTotal : t.thru > 0 ? "NR" : "–",
        netDisplay: complete ? t.netTotal : t.thru > 0 ? "NR" : "–",
        points: t.thru > 0 ? t.pts : null,
        thru: t.thru,
      };
    });

  const sortField = (row) => (sortBy === "name" ? row.name.toLowerCase() : row[sortBy]);
  const sorted = [...rows].sort((a, b) => {
    const av = sortField(a), bv = sortField(b);
    // Anyone who hasn't started always sorts to the bottom, regardless of
    // sort direction — an empty score is never meaningfully "first".
    if (sortBy !== "name") {
      if (av === null && bv === null) return 0;
      if (av === null) return 1;
      if (bv === null) return -1;
    }
    if (av < bv) return sortDir === "asc" ? -1 : 1;
    if (av > bv) return sortDir === "asc" ? 1 : -1;
    return 0;
  }).map((row, i) => ({ ...row, rank: i + 1 }));

  const standings = search.trim()
    ? sorted.filter((row) => row.name.toLowerCase().includes(search.trim().toLowerCase()))
    : sorted;

  const clickSort = (field) => {
    if (sortBy === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(field);
      setSortDir(field === "net" || field === "name" ? "asc" : "desc"); // net's default is ascending (lower is better); points/gross default varies by convention, but ascending name reads naturally A-Z
    }
  };
  const sortArrow = (field) => (sortBy === field ? (sortDir === "asc" ? " ▲" : " ▼") : "");

  const anyPlayersAtAll = effectivePlayers.some((p) => p.name);
  if (!anyPlayersAtAll) {
    return (
      <div style={{ padding: "40px 12px", textAlign: "center", color: "#6B6B5F" }}>
        <Flag size={28} color={accentColor} style={{ marginBottom: 10 }} />
        <div style={{ fontSize: 15 }}>No players on this day yet.</div>
      </div>
    );
  }

  const rs = resultsStyles(headerColor);
  const subFilterName = subFilter ? ((competitions.find((c) => c.abbreviation.toUpperCase() === subFilter.toUpperCase()) || {}).fullName || subFilter) : "";
  return (
    <div style={rs.frame}>
      <ResultsHeading
        title={[round.label, subFilterName].filter(Boolean).join(" — ")}
        subtitle={[formatResultsDate(round.date), teesInUseText(round.course, effectivePlayers), round.course.name].filter(Boolean).join(", ")}
        note={`${round.scoring === "medal" ? "Medal" : "Stableford"}${isFoursomes ? " Foursomes" : ""}${round.handicapAllowance !== 100 ? ` (${round.handicapAllowance}% handicap allowance)` : ""}`}
      />
      {compsInUse.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
          <button
            onClick={() => setSubFilter("")}
            style={{
              padding: "5px 11px", borderRadius: 20, fontSize: 11.5, fontWeight: 600,
              border: `1px solid ${accentColor}`,
              background: subFilter === "" ? accentColor : "transparent",
              color: subFilter === "" ? "#FFFFFF" : accentColor,
            }}
          >
            All
          </button>
          {compsInUse.map((abbr) => {
            const full = competitions.find((c) => c.abbreviation.toUpperCase() === abbr.toUpperCase());
            return (
              <button
                key={abbr}
                onClick={() => setSubFilter(abbr)}
                style={{
                  padding: "5px 11px", borderRadius: 20, fontSize: 11.5, fontWeight: 600,
                  border: `1px solid ${accentColor}`,
                  background: subFilter === abbr ? accentColor : "transparent",
                  color: subFilter === abbr ? "#FFFFFF" : accentColor,
                }}
              >
                {(full && full.fullName) || abbr}
              </button>
            );
          })}
        </div>
      )}
      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder={`Search ${isFoursomes ? "pair" : "player"}…`}
        style={{ width: "100%", fontSize: 14, padding: "9px 12px", borderRadius: 8, border: "1px solid #D8D4C0", marginBottom: 10, fontFamily: "inherit", boxSizing: "border-box" }}
      />
      {standings.length === 0 ? (
        <div style={{ padding: "24px 12px", textAlign: "center", color: "#9B9885", fontSize: 13 }}>
          {search.trim()
            ? `No ${isFoursomes ? "pair" : "player"} matching "${search.trim()}".`
            : `No ${isFoursomes ? "pair" : "player"} in this competition yet.`}
        </div>
      ) : (
      <>
      <div style={{ overflowX: "auto" }}>
      <table style={rs.table}>
        <thead>
          <tr style={rs.headRow}>
            <th colSpan={2} onClick={() => clickSort("name")} style={{ ...rs.th, cursor: "pointer" }}>Results{sortArrow("name")}</th>
            {round.publicShowGross !== false && (
              <th onClick={() => clickSort("gross")} style={{ ...rs.thRight, cursor: "pointer" }}>Gross{sortArrow("gross")}</th>
            )}
            {round.publicShowNet !== false && (
              <th onClick={() => clickSort("net")} style={{ ...rs.thRight, cursor: "pointer" }}>Nett{sortArrow("net")}</th>
            )}
            {round.publicShowPoints !== false && (
              <th onClick={() => clickSort("points")} style={{ ...rs.thRight, cursor: "pointer" }}>Points{sortArrow("points")}</th>
            )}
          </tr>
        </thead>
        <tbody>
          {standings.map((row, i) => (
            <tr key={row.name} style={rs.row(i)}>
              <td style={rs.pos}>{sortBy === "name" ? "" : row.thru > 0 ? ordinal(row.rank) : "–"}</td>
              <td style={rs.name}>{row.name} ({row.whs}/{row.ph}{row.adjusted ? "*" : ""})</td>
              {round.publicShowGross !== false && <td style={rs.num}>{row.grossDisplay}</td>}
              {round.publicShowNet !== false && <td style={rs.num}>{row.netDisplay}</td>}
              {round.publicShowPoints !== false && <td style={rs.num}>{row.points ?? "–"}</td>}
            </tr>
          ))}
        </tbody>
      </table>
      </div>
      {standings.some((row) => row.adjusted) && (
        <div style={{ fontSize: 11.5, fontStyle: "italic", color: "#3F3F38", marginTop: 8 }}>{ADJUSTED_FOOTNOTE}</div>
      )}
      </>
      )}
    </div>
  );
}

function OverallBoard({ rounds, headerColor, accentColor, computeStandings, rowLabel = "Player" }) {
  const [sortAlpha, setSortAlpha] = useState(false);
  const [search, setSearch] = useState("");
  // Attach each row's real rank BEFORE any alphabetical resort, so the #
  // column and top-3 highlight always reflect true standing regardless of
  // which order the rows are currently displayed in.
  const rankedStandings = (computeStandings || combinedStandings)(rounds).map((row, i) => ({ ...row, rank: i + 1 }));
  // Rank order is the default (score-based, exactly as computed above).
  // Alphabetical just reorders the same rows for quickly finding someone —
  // the # column still shows their real rank either way. For a Foursomes
  // pair, sorting is by whichever name happens to be first in the pair
  // string — not a precise "by either player" sort, but a consistent one.
  const sorted = sortAlpha
    ? [...rankedStandings].sort((a, b) => a.name.localeCompare(b.name))
    : rankedStandings;
  const standings = search.trim()
    ? sorted.filter((row) => row.name.toLowerCase().includes(search.trim().toLowerCase()))
    : sorted;

  if (rankedStandings.length === 0) {
    return (
      <div style={{ padding: "40px 12px", textAlign: "center", color: "#6B6B5F" }}>
        <Flag size={28} color={accentColor} style={{ marginBottom: 10 }} />
        <div style={{ fontSize: 15 }}>No scores posted yet on any day.</div>
      </div>
    );
  }

  const rs = resultsStyles(headerColor);
  return (
    <div style={rs.frame}>
      <ResultsHeading
        title={`Overall Leaderboard${rowLabel === "Pair" ? " — Foursomes" : ""}`}
        subtitle={rounds.map((r) => r.label).join(", ")}
        note="Stableford points, all days added together"
      />
      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder={`Search ${rowLabel.toLowerCase()}…`}
        style={{ width: "100%", fontSize: 14, padding: "9px 12px", borderRadius: 8, border: "1px solid #D8D4C0", marginBottom: 10, fontFamily: "inherit", boxSizing: "border-box" }}
      />
      {standings.length === 0 ? (
        <div style={{ padding: "24px 12px", textAlign: "center", color: "#9B9885", fontSize: 13 }}>
          No {rowLabel.toLowerCase()} matching "{search.trim()}".
        </div>
      ) : (
      <div style={{ overflowX: "auto" }}>
      <table style={rs.table}>
        <thead>
          <tr style={rs.headRow}>
            <th colSpan={2} onClick={() => setSortAlpha((v) => !v)} style={{ ...rs.th, cursor: "pointer" }}>
              Results{sortAlpha ? " ▲ A–Z" : ""}
            </th>
            {rounds.length > 1 && rounds.map((r) => (
              <th key={r.id} style={{ ...rs.thRight, whiteSpace: "normal", maxWidth: 92, fontSize: 12.5, lineHeight: 1.2 }}>{r.label}</th>
            ))}
            <th style={rs.thRight}>{rounds.length > 1 ? "Total" : "Points"}</th>
          </tr>
        </thead>
        <tbody>
          {standings.map((row, i) => (
            <tr key={row.name} style={rs.row(i)}>
              <td style={rs.pos}>{row.anyPlayed ? ordinal(row.rank) : "–"}</td>
              <td style={rs.name}>{row.name}</td>
              {rounds.length > 1 && rounds.map((r) => {
                const t = row.perRound[r.id];
                return <td key={r.id} style={{ ...rs.num, color: "#2B2B2B" }}>{t && t.thru > 0 ? t.pts : "–"}</td>;
              })}
              <td style={rs.num}>{row.anyPlayed ? row.total : "–"}</td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
      )}
    </div>
  );
}

function HoleByHole({ course, player, headerColor, isMedal }) {
  const row = (holes, label) => (
    <div style={{ marginBottom: 8 }}>
      <div style={{ fontSize: 9.5, letterSpacing: "0.08em", textTransform: "uppercase", color: "#8A8774", marginBottom: 4 }}>{label}</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(9, 1fr)", gap: 4 }}>
        {holes.map((h) => {
          const idx = h - 1;
          const gross = Array.isArray(player.scores) ? player.scores[idx] : "";
          const pts = holePoints(course, gross, idx, player.ph);
          const netVsPar = gross !== "" ? (Number(gross) - strokesOnHole(course, player.ph, idx)) - course.holes[idx].par : null;
          return (
            <div key={h} style={{ textAlign: "center" }}>
              <div className="mono" style={{ fontSize: 8.5, color: "#C2BEA9" }}>{h}</div>
              <div
                className="mono"
                style={{
                  fontSize: 13, fontWeight: 700, padding: "5px 0", borderRadius: 5, marginTop: 2,
                  background: gross !== "" ? "#F7E1EC" : "#F5F3E9",
                  color: gross !== "" ? headerColor : "#C2BEA9",
                }}
              >
                {gross !== "" ? gross : "–"}
              </div>
              <div className="mono" style={{ fontSize: 8.5, color: "#8A8774", marginTop: 2 }}>
                {isMedal ? (netVsPar !== null ? formatRelToPar(netVsPar) : "") : (pts !== null ? `${pts}pt` : "")}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
  return (
    <div style={{ padding: "0 14px 14px", borderTop: "1px solid #EFEDE0" }}>
      <div style={{ height: 10 }} />
      {row(OUT, "Out")}
      {row(IN, "In")}
    </div>
  );
}

// Public view of a Match Play day's results — each match as its own card,
// showing both players (with their handicap index) and the result once
// it's been entered, or "Not yet played" until then.
function MatchResultsView({ matches, players, course, drawNote, headerColor, accentColor }) {
  // Each player's own course handicap from their tee — never a combined
  // or allowance-adjusted figure. Working out the actual match allowance
  // between the two sides is left to the players themselves.
  const nameWithCH = (name) => {
    if (!name) return "";
    const p = findIndividualByName(players, name);
    if (!p || p.index === "" || p.index == null) return name;
    const ch = playingHandicap(course, Number(p.index) || 0, p.tee);
    return `${name} (${ch})`;
  };
  const sideLabel = (name, partner) => {
    if (!name && !partner) return "TBC";
    const parts = [nameWithCH(name)];
    if (partner) parts.push(nameWithCH(partner));
    return parts.filter(Boolean).join(" & ");
  };
  const realMatches = matches.filter((m) => m.playerA || m.playerB);

  return (
    <div style={{ padding: "14px 12px 40px" }}>
      {drawNote && drawNote.trim() && (
        <div
          style={{
            background: `${accentColor}14`, border: `1px solid ${accentColor}`, borderRadius: 8,
            padding: "10px 12px", marginBottom: 10, fontSize: 13, fontWeight: 600, color: "#1B1B1B",
          }}
        >
          {drawNote}
        </div>
      )}
      {realMatches.length === 0 ? (
        <div style={{ padding: "48px 24px", textAlign: "center", color: "#6B6B5F" }}>
          <Flag size={28} color={accentColor} style={{ marginBottom: 10 }} />
          <div style={{ fontSize: 15 }}>The matches haven't been set up yet.</div>
          <div style={{ fontSize: 12.5, marginTop: 4 }}>Check back once matches have been added.</div>
        </div>
      ) : (
        realMatches.map((m) => (
          <div
            key={m.id}
            style={{ background: "#FFFFFF", borderRadius: 10, padding: "12px 14px", marginBottom: 8, border: "1px solid #E4E0D0" }}
          >
            <div style={{ fontSize: 14, fontWeight: 600 }}>{sideLabel(m.playerA, m.partnerA)}</div>
            <div style={{ fontSize: 12, color: "#8A8774", fontWeight: 700, margin: "2px 0" }}>v</div>
            <div style={{ fontSize: 14, fontWeight: 600 }}>{sideLabel(m.playerB, m.partnerB)}</div>
            <div
              className="mono"
              style={{ fontSize: 13, fontWeight: 700, color: m.result ? headerColor : "#9B9885", marginTop: 6 }}
            >
              {m.result || "Not yet played"}
            </div>
          </div>
        ))
      )}
    </div>
  );
}

function DrawView({ draw, startingHole, drawNote, headerColor, accentColor, course, players, handicapAllowance, isFoursomes, publicShowIndex, publicShowCH, publicShowTee, publicShowComp, publicShowStartTee }) {
  const [viewMode, setViewMode] = useState("times"); // times | individual
  const [filter, setFilter] = useState("");

  const noteBanner = drawNote && drawNote.trim() && (
    <div
      style={{
        background: `${accentColor}14`, border: `1px solid ${accentColor}`, borderRadius: 8,
        padding: "10px 12px", marginBottom: 10, fontSize: 13, fontWeight: 600, color: "#1B1B1B",
      }}
    >
      {drawNote}
    </div>
  );

  if (draw.length === 0) {
    return (
      <div style={{ padding: "14px 12px 40px" }}>
        {noteBanner}
        <div style={{ padding: "34px 24px", textAlign: "center", color: "#6B6B5F" }}>
          <Clipboard size={28} color={accentColor} style={{ marginBottom: 10 }} />
          <div style={{ fontSize: 15 }}>The draw hasn't been posted yet.</div>
          <div style={{ fontSize: 12.5, marginTop: 4 }}>Check back once tee times have been added.</div>
        </div>
      </div>
    );
  }

  // One row per player, flattened out of every tee-time group — each
  // showing their own tee time, their own tee, and everyone else sharing
  // that tee time with them. This is what "By Individual" below is built
  // from, and what the filter box searches against.
  const individualRows = draw
    .flatMap((entry) =>
      (entry.players || []).map((name) => ({
        name,
        time: entry.time,
        tee: (findIndividualByName(players, name) || {}).tee || course.tees[0]?.label || "",
        others: (entry.players || []).filter((n) => n !== name),
      }))
    )
    .sort((a, b) => a.name.localeCompare(b.name));
  const filteredRows = filter.trim()
    ? individualRows.filter((r) => r.name.toLowerCase().includes(filter.trim().toLowerCase()))
    : individualRows;

  return (
    <div style={{ padding: "14px 12px 40px" }}>
      {noteBanner}
      {startingHole && startingHole.trim() && (
        <div
          style={{
            background: `${headerColor}12`, border: `1px solid ${headerColor}`, borderRadius: 8,
            padding: "8px 12px", marginBottom: 10, fontSize: 12.5, fontWeight: 600, color: headerColor, textAlign: "center",
          }}
        >
          Starting from the {startingHole} tee
        </div>
      )}
      <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
        <button
          onClick={() => setViewMode("times")}
          style={{
            flex: 1, padding: "9px 0", borderRadius: 7, border: `1px solid ${headerColor}`,
            background: viewMode === "times" ? headerColor : "transparent",
            color: viewMode === "times" ? "#FFFFFF" : headerColor, fontSize: 12.5, fontWeight: 600,
          }}
        >
          By Tee Times
        </button>
        <button
          onClick={() => setViewMode("individual")}
          style={{
            flex: 1, padding: "9px 0", borderRadius: 7, border: `1px solid ${headerColor}`,
            background: viewMode === "individual" ? headerColor : "transparent",
            color: viewMode === "individual" ? "#FFFFFF" : headerColor, fontSize: 12.5, fontWeight: 600,
          }}
        >
          By Individual
        </button>
      </div>

      {viewMode === "times" && (publicShowIndex || publicShowCH) && anyHandicapAdjusted(players) && (
        <div style={{ fontSize: 11.5, color: "#6B6B5F", fontStyle: "italic", marginBottom: 8 }}>{ADJUSTED_FOOTNOTE}</div>
      )}
      {viewMode === "individual" && (
        <input
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Filter players…"
          style={{ width: "100%", fontSize: 14, padding: "9px 12px", borderRadius: 8, border: "1px solid #D8D4C0", marginBottom: 10, fontFamily: "inherit", boxSizing: "border-box" }}
        />
      )}

      {viewMode === "times" ? (
        draw.map((entry) => (
          <div
            key={entry.id}
            style={{
              display: "flex", gap: 12, background: "#FFFFFF", borderRadius: 10,
              padding: "12px 14px", marginBottom: 8, border: "1px solid #E4E0D0",
            }}
          >
            <div className="mono" style={{ fontWeight: 700, color: headerColor, fontSize: 14, minWidth: 66 }}>
              {entry.time}
            </div>
            {publicShowStartTee && entry.startTee && (
              <div style={{ fontWeight: 700, color: accentColor, fontSize: 12, minWidth: 44, paddingTop: 2 }}>
                {entry.startTee}
              </div>
            )}
            <div style={{ fontSize: 14, flex: 1 }}>
              {entry.players && entry.players.length > 0
                ? formatGroupLines(entry.players, course, players, handicapAllowance, isFoursomes, { showIndex: publicShowIndex, showCH: publicShowCH, showTee: publicShowTee, showComp: publicShowComp }).map((line, i) => (
                    <div key={i} style={{ marginBottom: i < entry.players.length - 1 ? 2 : 0 }}>{withBoldFigures(line)}</div>
                  ))
                : entry.group || "—"}
            </div>
          </div>
        ))
      ) : filteredRows.length === 0 ? (
        <div style={{ padding: "24px 12px", textAlign: "center", color: "#9B9885", fontSize: 13 }}>
          No players matching "{filter.trim()}".
        </div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", background: "#FFFFFF", borderRadius: 10, overflow: "hidden" }}>
            <thead>
              <tr style={{ background: `${headerColor}12` }}>
                <th style={{ textAlign: "left", padding: "9px 10px", fontSize: 11, color: "#8A8774", fontWeight: 700 }}>Player</th>
                <th className="mono" style={{ textAlign: "left", padding: "9px 10px", fontSize: 11, color: "#8A8774", fontWeight: 700, whiteSpace: "nowrap" }}>Tee Time</th>
                {publicShowTee && <th style={{ textAlign: "left", padding: "9px 10px", fontSize: 11, color: "#8A8774", fontWeight: 700 }}>Tee</th>}
                <th style={{ textAlign: "left", padding: "9px 10px", fontSize: 11, color: "#8A8774", fontWeight: 700 }}>Other Players</th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((r) => (
                <tr key={r.name} style={{ borderTop: "1px solid #EFEDE0" }}>
                  <td style={{ padding: "9px 10px", fontSize: 13.5, fontWeight: 600, whiteSpace: "nowrap" }}>{r.name}</td>
                  <td className="mono" style={{ padding: "9px 10px", fontSize: 13.5, fontWeight: 700, color: headerColor, whiteSpace: "nowrap" }}>{r.time}</td>
                  {publicShowTee && <td style={{ padding: "9px 10px", fontSize: 12.5 }}>{r.tee}</td>}
                  <td style={{ padding: "9px 10px", fontSize: 12.5 }}>{r.others.join(" + ") || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function DrawSetup({ draw, players, onUpdate, startingHole, onUpdateStartingHole, onBack, headerColor, accentColor, course, format, onUpdateFormat, scoring, onUpdateScoring, handicapAllowance, onUpdateHandicapAllowance, library, onLoadFromLibrary, drawStartTime, onUpdateDrawStartTime, drawInterval, onUpdateDrawInterval, drawNote, onUpdateDrawNote, roundLabel, onRenameRound, roundDate, onUpdateRoundDate, onUpdatePlayerIndex, onUpdatePlayerDetails, onAddPlayerQuick, onRemovePlayer, onRemovePlayers, competitions, onEnsureCompetitionsExist, onAddPeople, roundKey, societyRoster, onAddFromRoster, onBulkSetTee, onSetHandicapAdjustment, onBulkSetHandicapAdjustment, onWithdrawPlayer, publicShowIndex, publicShowCH, publicShowTee, publicShowComp, publicShowStartTee, publicShowGross, publicShowNet, publicShowPoints, publicShowDayBoard, onUpdatePublicVis }) {
  const [tab, setTab] = useState("build"); // build | paste
  const [pasteText, setPasteText] = useState("");
  const [msg, setMsg] = useState("");
  const [confirmLoadId, setConfirmLoadId] = useState(null);
  const csvFileInputRef = useRef(null);
  // Admin-only visibility switches for the draw-building/preview displays
  // (never affects what players see on the public draw screen).
  // The admin-side previews always show every detail (index, course
  // handicap, tee, competition, start tee) — the switches for what
  // PLAYERS see are the "Show on public draw tab" ones below.
  const showStartTee = true;
  const visOpts = { showIndex: true, showCH: true, showTee: true, showComp: true, showStartTee: true };

  const doImport = () => {
    const abbrevs = competitions.map((c) => c.abbreviation).filter(Boolean);
    const courseTeeLabels = course.tees.map((t) => t.label);
    if (pasteText.trim() && !pasteHasTeeTimes(pasteText)) {
      // No tee times anywhere in the first column: this is a list of
      // players, not a draw. Add them to the day instead of making a
      // nonsense draw out of their names.
      const people = parsePastedPeople(pasteText, abbrevs, courseTeeLabels);
      if (people.length === 0) {
        setMsg("Nothing usable found. For a draw, each line starts with a tee time (e.g. 9:00); for a list of players, each line starts with a name.");
        return;
      }
      const newAbbrevs = onEnsureCompetitionsExist(people.map((p) => p.competition).filter(Boolean));
      const r = onAddPeople(people);
      const strayWords = unmatchedTeeWordsInPaste(pasteText, abbrevs, courseTeeLabels, { noTimeColumn: true });
      setMsg(
        (strayWords.length > 0 ? `NOTE: the file's tee column says ${strayWords.map((w) => `"${w}"`).join(", ")}, but ${course.name}'s tees are ${courseTeeLabels.map((l) => `"${l}"`).join(", ")} — those entries were ignored, so check everyone's tee (Bulk-set tee). ` : "") +
        `No tee times in this file, so it's been read as a list of players rather than a draw: ${r.added} added to ${roundLabel}` +
        `${r.updated ? `, ${r.updated} already there had details filled in` : ""}. The draw itself hasn't changed — go to "Build from players" to place them into tee times.` +
        (newAbbrevs.length > 0 ? ` New competition code${newAbbrevs.length === 1 ? "" : "s"}: ${newAbbrevs.join(", ")}.` : "")
      );
      setPasteText("");
      return;
    }
    const parsed = parsePastedDraw(pasteText, abbrevs, courseTeeLabels);
    if (parsed.length === 0) {
      setMsg("No rows found — make sure each line starts with a time.");
      return;
    }
    const hcpPairs = extractHandicapsFromDrawPaste(pasteText, abbrevs, courseTeeLabels);
    const teePairs = extractTeesFromDrawPaste(pasteText, abbrevs, courseTeeLabels);
    const compPairs = extractCompetitionsFromDrawPaste(pasteText, abbrevs, courseTeeLabels);
    const newAbbrevs = onEnsureCompetitionsExist(compPairs.map((c) => c.abbreviation));
    onUpdate(parsed, hcpPairs, teePairs, compPairs);
    const extras = [];
    if (hcpPairs.length > 0) extras.push(`${hcpPairs.length} handicap${hcpPairs.length === 1 ? "" : "s"}`);
    if (teePairs.length > 0) extras.push(`${teePairs.length} tee${teePairs.length === 1 ? "" : "s"}`);
    if (compPairs.length > 0) extras.push(`${compPairs.length} competition tag${compPairs.length === 1 ? "" : "s"}`);
    let message =
      `Draw set — ${parsed.length} group${parsed.length === 1 ? "" : "s"}` +
      (extras.length > 0 ? `, ${extras.join(", ")} added to the roster.` : ".");
    const strayWords = unmatchedTeeWordsInPaste(pasteText, abbrevs, courseTeeLabels);
    if (strayWords.length > 0) {
      message += ` NOTE: the file's tee column says ${strayWords.map((w) => `"${w}"`).join(", ")}, but ${course.name}'s tees are ${courseTeeLabels.map((l) => `"${l}"`).join(", ")} — those entries were ignored, so check everyone's tee (Bulk-set tee).`;
    }
    if (newAbbrevs.length > 0) {
      message += ` New competition code${newAbbrevs.length === 1 ? "" : "s"} found: ${newAbbrevs.join(", ")} — give ${newAbbrevs.length === 1 ? "it" : "them"} a full name in Admin.`;
    }
    setMsg(message);
    setPasteText("");
  };

  const removeEntry = (id) => onUpdate(draw.filter((e) => e.id !== id));
  const clearAll = () => { onUpdate([]); setMsg(""); };

  return (
    <div style={{ padding: "12px 14px 40px" }}>
      <button onClick={onBack} style={{ background: "none", border: "none", color: headerColor, fontSize: 13, marginBottom: 10, padding: 0, fontWeight: 600 }}>
        ← Back
      </button>

      <div style={{ background: "#FFFFFF", borderRadius: 10, padding: 14, border: "1px solid #E4E0D0", marginBottom: 12 }}>
        <div style={{ fontSize: 11, color: "#8A8774", marginBottom: 3 }}>
          Label this day <span style={{ textTransform: "none", letterSpacing: 0 }}>(shows in the day switcher — e.g. a date or the competition name)</span>
        </div>
        <input
          value={roundLabel}
          onChange={(e) => onRenameRound(e.target.value)}
          placeholder="e.g. 15 June — Spring Foursomes"
          style={{ width: "100%", fontSize: 15, fontWeight: 700, border: "1px solid #D8D4C0", borderRadius: 7, padding: "7px 9px", marginBottom: 12, fontFamily: "inherit" }}
        />
        <div style={{ fontSize: 11, color: "#8A8774", marginBottom: 3 }}>
          Date <span style={{ textTransform: "none", letterSpacing: 0 }}>(optional — set this on each day and they'll always sort in date order, whatever order you entered them in)</span>
        </div>
        <input
          type="date"
          value={roundDate}
          min="2020-01-01"
          max="2035-12-31"
          onChange={(e) => onUpdateRoundDate(e.target.value)}
          className="mono"
          style={{ fontSize: 14, fontWeight: 600, border: "1px solid #D8D4C0", borderRadius: 7, padding: "7px 9px", fontFamily: "inherit", marginBottom: 12 }}
        />
        <div style={{ fontSize: 11, color: "#8A8774", marginBottom: 3 }}>
          Note to competitors <span style={{ textTransform: "none", letterSpacing: 0 }}>(optional — shows at the top of the Draw screen, and prints on scorecard labels for this day)</span>
        </div>
        <input
          value={drawNote}
          onChange={(e) => onUpdateDrawNote(e.target.value)}
          placeholder="e.g. Stableford off white tees, buggies permitted"
          style={{ width: "100%", fontSize: 14, border: "1px solid #D8D4C0", borderRadius: 7, padding: "7px 9px", fontFamily: "inherit" }}
        />
      </div>

      <div style={{ background: "#FFFFFF", borderRadius: 10, padding: 14, border: "1px solid #E4E0D0", marginBottom: 12 }}>
        <div style={{ fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", color: "#8A8774", marginBottom: 8 }}>
          Course
        </div>
        <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 8 }}>{course.name}</div>
        {library.length === 0 ? (
          <div style={{ fontSize: 11.5, color: "#9B9885" }}>
            No saved courses yet — save one from Course setup to switch quickly here.
          </div>
        ) : (
          <>
            <div style={{ fontSize: 10.5, color: "#8A8774", marginBottom: 6 }}>Switch to a saved course:</div>
            {library.map((entry) => (
              <div key={entry.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0", borderTop: "1px solid #EFEDE0" }}>
                <div style={{ flex: 1, fontSize: 13, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {entry.name}
                </div>
                {confirmLoadId === entry.id ? (
                  <>
                    <span style={{ fontSize: 10, color: "#8A8774", marginRight: 2 }}>Load this course?</span>
                    <button
                      onClick={() => {
                        const r = onLoadFromLibrary(entry);
                        setConfirmLoadId(null);
                        if (r && r.moved > 0) window.alert(`${r.moved} player${r.moved === 1 ? " was" : "s were"} on a tee that ${entry.name} doesn't have, and ${r.moved === 1 ? "has" : "have"} been moved to its "${r.tee}" tee. Use Bulk-set tee to change anyone who plays a different one.`);
                      }}
                      style={{ fontSize: 11.5, fontWeight: 700, color: headerColor, background: "none", border: "none", padding: "4px 6px" }}
                    >
                      Yes, switch
                    </button>
                    <button
                      onClick={() => setConfirmLoadId(null)}
                      style={{ fontSize: 11.5, color: "#9B9885", background: "none", border: "none", padding: "4px 6px" }}
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setConfirmLoadId(entry.id)}
                    style={{ fontSize: 11.5, fontWeight: 600, color: headerColor, background: "none", border: `1px solid ${headerColor}`, borderRadius: 6, padding: "4px 9px" }}
                  >
                    Switch
                  </button>
                )}
              </div>
            ))}
          </>
        )}
        <div style={{ fontSize: 10, color: "#9B9885", marginTop: 8 }}>
          Full course editing (tees, holes, par/SI) still lives in Course setup.
        </div>
      </div>

      <div style={{ background: "#FFFFFF", borderRadius: 10, padding: 14, border: "1px solid #E4E0D0", marginBottom: 12 }}>
        <div style={{ fontSize: 11, color: "#8A8774", marginBottom: 3 }}>Starting tee (same for everyone)</div>
        <input
          value={startingHole}
          onChange={(e) => onUpdateStartingHole(e.target.value)}
          placeholder="e.g. 1st"
          style={{ width: 140, fontSize: 14, fontWeight: 700, border: "1px solid #D8D4C0", borderRadius: 7, padding: "7px 9px", fontFamily: "inherit" }}
        />
      </div>

      <div style={{ background: "#FFFFFF", borderRadius: 10, padding: 14, border: "1px solid #E4E0D0", marginBottom: 12 }}>
        <div style={{ fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", color: "#8A8774", marginBottom: 8 }}>
          Format
        </div>
        <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
          <button
            onClick={() => onUpdateFormat("individual")}
            style={{
              flex: 1, padding: "9px 0", borderRadius: 7, border: `1px solid ${headerColor}`,
              background: format === "individual" ? headerColor : "transparent",
              color: format === "individual" ? "#FFFFFF" : headerColor, fontWeight: 600, fontSize: 12.5,
            }}
          >
            Individual
          </button>
          <button
            onClick={() => onUpdateFormat("foursomes")}
            style={{
              flex: 1, padding: "9px 0", borderRadius: 7, border: `1px solid ${headerColor}`,
              background: format === "foursomes" ? headerColor : "transparent",
              color: format === "foursomes" ? "#FFFFFF" : headerColor, fontWeight: 600, fontSize: 12.5,
            }}
          >
            Foursomes
          </button>
          <button
            onClick={() => onUpdateFormat("matchplay")}
            style={{
              flex: 1, padding: "9px 0", borderRadius: 7, border: `1px solid ${headerColor}`,
              background: format === "matchplay" ? headerColor : "transparent",
              color: format === "matchplay" ? "#FFFFFF" : headerColor, fontWeight: 600, fontSize: 12.5,
            }}
          >
            Match Play
          </button>
        </div>
        {format === "foursomes" && (
          <div style={{ fontSize: 10.5, color: "#8A8774", marginBottom: 12 }}>
            Each roster entry becomes a pair. Combined handicap = (Player A's + Player B's course handicap) ÷ 2, exact halves rounded up.
          </div>
        )}
        {format === "matchplay" && (
          <div style={{ fontSize: 10.5, color: "#8A8774", marginBottom: 12 }}>
            Add players with their handicap and tee (no competition needed) — different players can be on
            different tees. Set up matches — Singles or Foursomes — and enter each result (e.g. "3&2") in the
            Matches screen. Each player's own course handicap is shown from their tee; working out the actual
            match allowance between the two sides is left to the players.
          </div>
        )}

        {format !== "matchplay" && (
          <>
            <div style={{ fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", color: "#8A8774", marginBottom: 8 }}>
              Scoring
            </div>
            <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
              <button
                onClick={() => onUpdateScoring("stableford")}
                style={{
                  flex: 1, padding: "9px 0", borderRadius: 7, border: `1px solid ${headerColor}`,
                  background: scoring === "stableford" ? headerColor : "transparent",
                  color: scoring === "stableford" ? "#FFFFFF" : headerColor, fontWeight: 600, fontSize: 12.5,
                }}
              >
                Stableford
              </button>
              <button
                onClick={() => onUpdateScoring("medal")}
                style={{
                  flex: 1, padding: "9px 0", borderRadius: 7, border: `1px solid ${headerColor}`,
                  background: scoring === "medal" ? headerColor : "transparent",
                  color: scoring === "medal" ? "#FFFFFF" : headerColor, fontWeight: 600, fontSize: 12.5,
                }}
              >
                Medal
              </button>
            </div>
            {scoring === "medal" && (
              <div style={{ fontSize: 10.5, color: "#8A8774", marginBottom: 12 }}>
                Leaderboard sorts by lowest net score (relative to par), not points.
              </div>
            )}
          </>
        )}

        <div style={{ fontSize: 11, color: "#8A8774", marginBottom: 3 }}>
          Handicap allowance <span style={{ textTransform: "none", letterSpacing: 0 }}>(% of course handicap — most comps use 100%)</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <input
            type="number"
            inputMode="numeric"
            min={1}
            max={100}
            value={handicapAllowance}
            onChange={(e) => {
              const val = e.target.value;
              if (val === "") {
                onUpdateHandicapAllowance("");
                return;
              }
              const num = Number(val);
              if (!isNaN(num)) onUpdateHandicapAllowance(Math.max(1, Math.min(100, num)));
            }}
            onBlur={(e) => {
              if (e.target.value === "") onUpdateHandicapAllowance(100);
            }}
            className="mono"
            style={{ width: 80, fontSize: 14, fontWeight: 700, padding: "7px 9px", borderRadius: 7, border: "1px solid #D8D4C0" }}
          />
          <span style={{ fontSize: 13, color: "#6B6B5F" }}>%</span>
        </div>
      </div>

      <div style={{ background: "#FFFFFF", borderRadius: 10, padding: 12, border: `1px solid ${accentColor}`, marginBottom: 12 }}>
        <div style={{ fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", color: accentColor, marginBottom: 8 }}>
          Show on public draw tab (what players see)
        </div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {[
            { key: "index", label: "Handicap index", value: publicShowIndex, field: "publicShowIndex" },
            { key: "ch", label: "Course handicap", value: publicShowCH, field: "publicShowCH" },
            { key: "tee", label: "Tee", value: publicShowTee, field: "publicShowTee" },
            { key: "comp", label: "Competition", value: publicShowComp, field: "publicShowComp" },
            { key: "starttee", label: "Start tee", value: publicShowStartTee, field: "publicShowStartTee" },
          ].map((sw) => (
            <button
              key={sw.key}
              onClick={() => onUpdatePublicVis({ [sw.field]: !sw.value })}
              style={{
                flex: "1 1 30%", padding: "8px 4px", borderRadius: 7, border: `1px solid ${sw.value ? accentColor : "#D8D4C0"}`,
                background: sw.value ? accentColor : "transparent", color: sw.value ? "#FFFFFF" : "#9B9885",
                fontWeight: 600, fontSize: 11.5,
              }}
            >
              {sw.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ background: "#FFFFFF", borderRadius: 10, padding: 12, border: `1px solid ${accentColor}`, marginBottom: 12 }}>
        <div style={{ fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", color: accentColor, marginBottom: 8 }}>
          This day's leaderboard
        </div>
        <button
          onClick={() => onUpdatePublicVis({ publicShowDayBoard: !publicShowDayBoard })}
          style={{
            width: "100%", padding: "9px 0", borderRadius: 7, border: `1px solid ${publicShowDayBoard ? accentColor : "#D8D4C0"}`,
            background: publicShowDayBoard ? accentColor : "transparent", color: publicShowDayBoard ? "#FFFFFF" : "#9B9885",
            fontWeight: 700, fontSize: 12.5, marginBottom: publicShowDayBoard ? 10 : 0,
          }}
        >
          {publicShowDayBoard ? "Visible to players" : "Hidden from players"}
        </button>
        {publicShowDayBoard && (
          <>
            <div style={{ fontSize: 10.5, color: "#8A8774", marginBottom: 8 }}>Which columns show:</div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {[
                { key: "gross", label: "Gross", value: publicShowGross, field: "publicShowGross" },
                { key: "net", label: "Net", value: publicShowNet, field: "publicShowNet" },
                { key: "points", label: "Stableford points", value: publicShowPoints, field: "publicShowPoints" },
              ].map((sw) => (
                <button
                  key={sw.key}
                  onClick={() => onUpdatePublicVis({ [sw.field]: !sw.value })}
                  style={{
                    flex: "1 1 30%", padding: "8px 4px", borderRadius: 7, border: `1px solid ${sw.value ? accentColor : "#D8D4C0"}`,
                    background: sw.value ? accentColor : "transparent", color: sw.value ? "#FFFFFF" : "#9B9885",
                    fontWeight: 600, fontSize: 11.5,
                  }}
                >
                  {sw.label}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
        <button
          onClick={() => setTab("build")}
          style={{
            flex: 1, padding: "8px 0", borderRadius: 7, border: `1px solid ${headerColor}`,
            background: tab === "build" ? headerColor : "transparent",
            color: tab === "build" ? "#FFFFFF" : headerColor, fontSize: 12.5, fontWeight: 600,
          }}
        >
          Build from players
        </button>
        <button
          onClick={() => setTab("paste")}
          style={{
            flex: 1, padding: "8px 0", borderRadius: 7, border: `1px solid ${headerColor}`,
            background: tab === "paste" ? headerColor : "transparent",
            color: tab === "paste" ? "#FFFFFF" : headerColor, fontSize: 12.5, fontWeight: 600,
          }}
        >
          Paste
        </button>
      </div>

      {tab === "build" ? (
        <DrawBuilder draw={draw} players={players} onUpdate={onUpdate} headerColor={headerColor} accentColor={accentColor} course={course} handicapAllowance={handicapAllowance} isFoursomes={format === "foursomes"} startTime={drawStartTime} onUpdateStartTime={onUpdateDrawStartTime} intervalMinutes={drawInterval} onUpdateInterval={onUpdateDrawInterval} onUpdatePlayerIndex={onUpdatePlayerIndex} onUpdatePlayerDetails={onUpdatePlayerDetails} onAddPlayerQuick={onAddPlayerQuick} onRemovePlayer={onRemovePlayer} onRemovePlayers={onRemovePlayers} roundKey={roundKey} societyRoster={societyRoster} onAddFromRoster={onAddFromRoster} onBulkSetTee={onBulkSetTee} onSetHandicapAdjustment={onSetHandicapAdjustment} onBulkSetHandicapAdjustment={onBulkSetHandicapAdjustment} onWithdrawPlayer={onWithdrawPlayer} competitions={competitions} visOpts={visOpts} />
      ) : (
        <>
          <div style={{ background: "#FFFFFF", borderRadius: 10, padding: 14, border: "1px solid #E4E0D0", marginBottom: 12 }}>
            <div style={{ fontSize: 12.5, fontWeight: 700, marginBottom: 6 }}>Paste the draw</div>
            <div style={{ fontSize: 11.5, color: "#6B6B5F", marginBottom: 8 }}>
              <strong>For a draw:</strong> one tee time per line: Time, then each player in their own column (copy straight from your
              spreadsheet, or upload a .csv file below). A handicap number right after a name is picked up
              automatically, so is a tee column — write "Back" or "Front" (or just B/F) — and so is a competition
              abbreviation you've already set up in Admin (e.g. "JHB"). All added straight to the roster. Pasting
              or uploading replaces the whole draw below. <strong>For a list of players with no tee times</strong> (each
              line starting with a name), they're simply added to this day ready to place in "Build from players" —
              the draw isn't touched.
            </div>
            <input
              ref={csvFileInputRef}
              type="file"
              accept=".csv,text/csv"
              style={{ display: "none" }}
              onChange={(e) => {
                const file = e.target.files && e.target.files[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = () => {
                  setPasteText(String(reader.result || ""));
                  setMsg(`Loaded ${file.name} — check it below, then tap Set draw.`);
                };
                reader.readAsText(file);
                e.target.value = ""; // allow re-selecting the same file later
              }}
            />
            <button
              onClick={() => csvFileInputRef.current && csvFileInputRef.current.click()}
              style={{
                width: "100%", padding: "9px 0", borderRadius: 7, border: `1px dashed ${headerColor}`,
                background: "transparent", color: headerColor, fontWeight: 600, fontSize: 12.5, marginBottom: 10,
                display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              }}
            >
              <Upload size={14} /> Upload a .csv file instead
            </button>
            <textarea
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
              placeholder={"9:00\tSmith\t8.4\tBack\tJones\t14.1\tFront\tBrown\t9.9\tBack\n9:10\tOkonkwo\t12\tFront\tPetrov\t6\tBack"}
              rows={6}
              className="mono"
              style={{ width: "100%", fontSize: 12, padding: 8, borderRadius: 7, border: "1px solid #D8D4C0", resize: "vertical", fontFamily: "inherit" }}
            />
            <button
              onClick={doImport}
              style={{ width: "100%", marginTop: 8, padding: "10px 0", borderRadius: 7, border: "none", background: headerColor, color: "#FFFFFF", fontWeight: 600, fontSize: 13 }}
            >
              Set draw
            </button>
            {msg && <div style={{ fontSize: 11.5, color: headerColor, textAlign: "center", marginTop: 8 }}>{msg}</div>}
          </div>

          {draw.length > 0 && (
            <div style={{ background: "#FFFFFF", borderRadius: 10, padding: 14, border: "1px solid #E4E0D0" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <div style={{ fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", color: "#8A8774" }}>Current draw</div>
                <button onClick={clearAll} style={{ fontSize: 11, color: "#B5442E", background: "none", border: "none" }}>Clear all</button>
              </div>
              {draw.map((entry) => (
                <div key={entry.id} style={{ display: "flex", alignItems: "flex-start", gap: 8, padding: "6px 0", borderTop: "1px solid #EFEDE0" }}>
                  <div className="mono" style={{ fontWeight: 700, color: headerColor, fontSize: 12.5, minWidth: 56, paddingTop: 1 }}>{entry.time}</div>
                  {showStartTee && entry.startTee && (
                    <div style={{ fontWeight: 700, color: accentColor, fontSize: 11.5, minWidth: 40, paddingTop: 1 }}>{entry.startTee}</div>
                  )}
                  <div style={{ flex: 1, fontSize: 12.5 }}>
                    {entry.players && entry.players.length > 0
                      ? formatGroupLines(entry.players, course, players, handicapAllowance, format === "foursomes", visOpts).map((line, i) => (
                          <div key={i} style={{ marginBottom: i < entry.players.length - 1 ? 2 : 0 }}>{withBoldFigures(line)}</div>
                        ))
                      : entry.group || "—"}
                  </div>
                  <button onClick={() => removeEntry(entry.id)} style={{ background: "none", border: "none", color: "#B5442E", padding: 4 }}>
                    <X size={13} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// Accepts the ways a tee time gets typed — 9:05, 09:05, 9.05, 0905 — and
// returns HH:MM, or "" if it isn't a time at all.
function parseTeeTime(timeStr) {
  const v = (timeStr || "").trim().replace(/\s*(am|pm)$/i, "");
  let m = /^(\d{1,2})\s*[:.h]\s*(\d{2})$/.exec(v);
  if (!m) m = /^(\d{1,2})(\d{2})$/.exec(v);
  if (!m) return "";
  const h = parseInt(m[1], 10), mm = parseInt(m[2], 10);
  if (h > 23 || mm > 59) return "";
  return `${String(h).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}

function addMinutes(timeStr, minutesToAdd) {
  const m = /^(\d{1,2}):(\d{2})$/.exec(parseTeeTime(timeStr));
  if (!m) return timeStr || "";
  const total = (parseInt(m[1], 10) * 60 + parseInt(m[2], 10) + minutesToAdd + 1440 * 10) % 1440;
  const hh = String(Math.floor(total / 60)).padStart(2, "0");
  const mm = String(total % 60).padStart(2, "0");
  return `${hh}:${mm}`;
}

// Turns a draw's stored groups into the working-copy shape DrawBuilder
// edits — shared between the initial mount and the resync effect below,
// so both use exactly the same logic.
function buildRowsFromDraw(draw) {
  if (draw.length > 0) {
    return draw.map((entry) => ({
      id: entry.id,
      time: entry.time || "",
      startTee: entry.startTee || "",
      slots: [0, 1, 2, 3].map((i) => (entry.players && entry.players[i]) || null),
    }));
  }
  return [{ id: crypto.randomUUID(), time: "", startTee: "", slots: [null, null, null, null] }];
}

function DrawBuilder({ onRemovePlayers, draw, players, onUpdate, headerColor, accentColor, course, handicapAllowance, isFoursomes, startTime, onUpdateStartTime, intervalMinutes, onUpdateInterval, onUpdatePlayerIndex, onUpdatePlayerDetails, onAddPlayerQuick, onRemovePlayer, roundKey, societyRoster, onAddFromRoster, onBulkSetTee, onSetHandicapAdjustment, onBulkSetHandicapAdjustment, onWithdrawPlayer, competitions, visOpts }) {
  // Local working copy — rows of up to 4 player slots each. Seeded from
  // whatever draw already exists so re-opening this doesn't lose work.
  const [rows, setRows] = useState(() => buildRowsFromDraw(draw));
  const [selected, setSelected] = useState(null); // player name currently picked up
  const [savedMsg, setSavedMsg] = useState(false);
  const [editingSlot, setEditingSlot] = useState(null); // { rowId, slotIdx, name } | null
  const [dragOverSlot, setDragOverSlot] = useState(null); // { rowId, slotIdx } | null — visual feedback for mouse drag-and-drop
  const [showAddPlayer, setShowAddPlayer] = useState(false);
  const [confirmDeleteName, setConfirmDeleteName] = useState(null);
  const [confirmClearRows, setConfirmClearRows] = useState(false);
  const [confirmClearPool, setConfirmClearPool] = useState(false);
  const [bulkTeeTarget, setBulkTeeTarget] = useState("");
  const [selectedTeeIds, setSelectedTeeIds] = useState(new Set());
  const [teeSavedMsg, setTeeSavedMsg] = useState(false);
  const [selectedAdjustKeys, setSelectedAdjustKeys] = useState(new Set()); // which people are ticked
  const [adjustBulkValue, setAdjustBulkValue] = useState(0); // value to apply to all ticked
  const [adjustSavedMsg, setAdjustSavedMsg] = useState(false);
  const [showAdjustPanel, setShowAdjustPanel] = useState(false); // closed by default — rarely used
  const [showBulkTeePanel, setShowBulkTeePanel] = useState(false); // closed by default — rarely used
  const [adjustGenderFilter, setAdjustGenderFilter] = useState("all"); // all | ladies | gents
  const [showRosterPicker, setShowRosterPicker] = useState(false);
  const [rosterSearch, setRosterSearch] = useState("");
  const [rosterGenderFilter, setRosterGenderFilter] = useState("all"); // all | ladies | gents
  const [selectedRosterIds, setSelectedRosterIds] = useState(new Set());
  const [newPlayerName, setNewPlayerName] = useState("");
  const [newPlayerIndex, setNewPlayerIndex] = useState("");
  // startTime/intervalMinutes are now saved as part of the round (passed in
  // as props) rather than local state — previously these reset to defaults
  // any time this screen was left and re-opened.

  // This screen doesn't unmount when you switch to a different day while
  // staying on Draw setup — it just receives new props — so the working
  // copy above (only ever set once, at mount) would otherwise keep showing
  // whichever day was open when you first arrived here. Re-sync it (and
  // clear any in-progress selection) whenever the actual round changes.
  useEffect(() => {
    setRows(buildRowsFromDraw(draw));
    setSelected(null);
    setEditingSlot(null);
    setDragOverSlot(null);
    setShowAddPlayer(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roundKey]);

  const assignedNames = new Set(rows.flatMap((r) => r.slots.filter(Boolean)));
  const pool = players
    .filter((p) => p.name && !assignedNames.has(p.name))
    .sort((a, b) => a.name.localeCompare(b.name));

  // Flattened to one row per PERSON, not per record — on a Foursomes day
  // a single player record holds two people (primary + partner), and each
  // needs their own tee set independently.
  const teeableePeople = (isFoursomes
    ? players.flatMap((p) => {
        const list = [];
        if (p.name) list.push({ key: `${p.id}:primary`, recordId: p.id, role: "primary", name: p.name, tee: p.tee, adj: Number(p.handicapAdjustment) || 0 });
        if (p.partnerName) list.push({ key: `${p.id}:partner`, recordId: p.id, role: "partner", name: p.partnerName, tee: p.partnerTee, adj: Number(p.partnerHandicapAdjustment) || 0 });
        return list;
      })
    : players.filter((p) => p.name).map((p) => ({ key: `${p.id}:primary`, recordId: p.id, role: "primary", name: p.name, tee: p.tee, adj: Number(p.handicapAdjustment) || 0 }))
  ).sort((a, b) => a.name.localeCompare(b.name));

  // isLady lives on the Society Roster, not the day's own player record,
  // so it's looked up by name here rather than carried on teeableePeople.
  const isLadyByName = (name) => {
    const target = normalizeName(name);
    const m = societyRoster.find((r) => normalizeName(r.name) === target);
    return m ? !!m.isLady : false;
  };
  const adjustablePeople = teeableePeople.filter(
    (person) => adjustGenderFilter === "all" || (adjustGenderFilter === "ladies" ? isLadyByName(person.name) : !isLadyByName(person.name))
  );
  const toggleAdjustSelect = (key) => {
    setSelectedAdjustKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };
  const selectAllAdjustable = () => setSelectedAdjustKeys(new Set(adjustablePeople.map((p) => p.key)));
  const applyBulkAdjustment = () => {
    const selections = adjustablePeople.filter((p) => selectedAdjustKeys.has(p.key)).map(({ recordId, role }) => ({ recordId, role }));
    onBulkSetHandicapAdjustment(selections, adjustBulkValue);
    setAdjustSavedMsg(true);
    setTimeout(() => setAdjustSavedMsg(false), 1500);
  };

  const chooseBulkTeeTarget = (tee) => {
    setBulkTeeTarget(tee);
    setSelectedTeeIds(new Set(teeableePeople.filter((person) => person.tee === tee).map((person) => person.key)));
  };
  const toggleTeeSelect = (key) => {
    setSelectedTeeIds((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };
  const applyBulkTee = () => {
    const selections = teeableePeople.filter((person) => selectedTeeIds.has(person.key)).map(({ recordId, role }) => ({ recordId, role }));
    onBulkSetTee(selections, bulkTeeTarget);
    setTeeSavedMsg(true);
    setTimeout(() => setTeeSavedMsg(false), 1500);
  };

  // `selected` is now { name, from } — from is null when picked up from
  // the pool, or { rowId, slotIdx } when picked up out of an existing
  // slot (a move-in-progress).
  const pickUp = (name) => setSelected((prev) => (prev && prev.name === name && !prev.from ? null : { name, from: null }));

  const pickUpFromSlot = (rowId, slotIdx, name) => {
    setSelected({ name, from: { rowId, slotIdx } });
    setEditingSlot(null);
  };

  const clearSlot = (rowId, slotIdx) => {
    setRows((prev) =>
      prev.map((r) => (r.id === rowId ? { ...r, slots: r.slots.map((s, i) => (i === slotIdx ? null : s)) } : r))
    );
  };

  // Places whoever's picked up into a slot — if a move was in progress
  // (picked up from another slot) and the destination is occupied, the
  // two players swap; the pool naturally reabsorbs anyone displaced from
  // a pool-originated placement, since it's derived from who's assigned.
  const placeOrSwap = (targetRowId, targetSlotIdx, explicitSelection) => {
    const sel = explicitSelection || selected;
    if (!sel) return;
    const { name, from } = sel;
    if (from && from.rowId === targetRowId && from.slotIdx === targetSlotIdx) {
      setSelected(null);
      return;
    }
    setRows((prev) => {
      const targetRow = prev.find((r) => r.id === targetRowId);
      const occupant = targetRow ? targetRow.slots[targetSlotIdx] : null;
      return prev.map((r) => {
        const touchesTarget = r.id === targetRowId;
        const touchesOrigin = from && r.id === from.rowId;
        if (!touchesTarget && !touchesOrigin) return r;
        const slots = r.slots.map((s, i) => {
          if (touchesTarget && i === targetSlotIdx) return name;
          if (touchesOrigin && i === from.slotIdx) return occupant || null;
          return s;
        });
        return { ...r, slots };
      });
    });
    setSelected(null);
  };

  // Tap-tap swapping. Tapping a player in the draw picks them up (they're
  // highlighted); tapping a second player swaps the two, and tapping an
  // empty slot moves them there. Tapping the SAME player a second time
  // opens their details instead (handicap, tee, competition, withdraw) —
  // as does "Edit details" in the bar at the top. An empty slot with
  // nobody picked up does nothing.
  const tapSlot = (rowId, slotIdx, name) => {
    if (selected) {
      const sameSlot = selected.from && selected.from.rowId === rowId && selected.from.slotIdx === slotIdx;
      if (sameSlot) {
        setSelected(null);
        if (name) setEditingSlot({ rowId, slotIdx, name });
        return;
      }
      placeOrSwap(rowId, slotIdx);
      return;
    }
    if (name) pickUpFromSlot(rowId, slotIdx, name);
  };

  const setTime = (rowId, time) => setRows((prev) => prev.map((r) => (r.id === rowId ? { ...r, time } : r)));
  const setStartTee = (rowId, startTee) => setRows((prev) => prev.map((r) => (r.id === rowId ? { ...r, startTee } : r)));

  // A new tee time follows on from the LAST one in the draw, one interval
  // later — so after 09:00, 09:08, 09:16 the next is 09:24 whatever the
  // start-time setting says. Only when no row has a time yet does it fall
  // back to the start time.
  const addRow = () =>
    setRows((prev) => {
      const lastTimed = [...prev].reverse().find((r) => parseTeeTime(r.time));
      const time = lastTimed ? addMinutes(lastTimed.time, Number(intervalMinutes) || 0) : startTime;
      // ...and starts from the same tee as the last row (a 10th-tee start
      // carries on down the sheet until it's changed on a later row).
      const lastRow = prev[prev.length - 1];
      const startTee = lastRow ? lastRow.startTee || "" : "";
      return [...prev, { id: crypto.randomUUID(), time, startTee, slots: [null, null, null, null] }];
    });

  const fillAllTimes = () =>
    setRows((prev) => prev.map((r, i) => ({ ...r, time: addMinutes(startTime, intervalMinutes * i) })));

  const removeRow = (rowId) => setRows((prev) => prev.filter((r) => r.id !== rowId));

  const clearAllRows = () => setRows([{ id: crypto.randomUUID(), time: "", startTee: "", slots: [null, null, null, null] }]);

  const saveDraw = () => {
    const finalDraw = rows
      .filter((r) => r.time.trim() || r.slots.some(Boolean))
      .map((r) => ({ id: r.id, time: r.time.trim(), startTee: (r.startTee || "").trim(), players: r.slots.filter(Boolean) }));
    onUpdate(finalDraw);
    setSavedMsg(true);
    setTimeout(() => setSavedMsg(false), 1500);
  };

  // Auto-save — a safety net against losing work if the screen closes
  // unexpectedly mid-edit. Debounced rather than saving on every single
  // drag: waits until the rows have been still for a couple of seconds,
  // so a flurry of quick changes settles into one save rather than many.
  // Skips the very first render, since that's just the draw loading in,
  // not a user edit. The manual "Save draw" button above still saves
  // immediately whenever it's tapped.
  const rowsMountedRef = useRef(false);
  useEffect(() => {
    if (!rowsMountedRef.current) {
      rowsMountedRef.current = true;
      return;
    }
    const timer = setTimeout(saveDraw, 2500);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows]);

  const strayTeePeople = teeableePeople.filter((person) => person.tee && teeMismatch(course, person.tee));
  const strayTeeNames = [...new Set(strayTeePeople.map((person) => person.tee))];

  return (
    <div>
      {strayTeePeople.length > 0 && (
        <div style={{ background: "#FFF6E0", border: "1px solid #D9A400", borderRadius: 10, padding: 12, marginBottom: 12 }}>
          <div style={{ fontSize: 12.5, fontWeight: 700, color: "#6B4E00", marginBottom: 4 }}>
            {strayTeePeople.length} player{strayTeePeople.length === 1 ? " is" : "s are"} on a tee this course doesn't have ({strayTeeNames.map((t) => `"${t}"`).join(", ")})
          </div>
          <div style={{ fontSize: 11.5, color: "#6B4E00", marginBottom: 8 }}>
            Left over from before {course.name} was loaded into this day. Their handicaps are being worked out off "{course.tees[0]?.label}", but the draw still shows the old name. Move them all at once:
          </div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {course.tees.map((t) => (
              <button
                key={t.id}
                onClick={() => onBulkSetTee(strayTeePeople.map(({ recordId, role }) => ({ recordId, role })), t.label)}
                style={{ padding: "8px 12px", borderRadius: 7, border: "none", background: headerColor, color: "#FFFFFF", fontWeight: 700, fontSize: 12.5 }}
              >
                Move all {strayTeePeople.length} to {t.label}
              </button>
            ))}
          </div>
        </div>
      )}
      <button
        onClick={saveDraw}
        style={{ width: "100%", padding: "11px 0", borderRadius: 10, border: "none", background: headerColor, color: "#FFFFFF", fontWeight: 700, fontSize: 14, marginBottom: 12 }}
      >
        {savedMsg ? "Saved" : "Save draw"}
      </button>

      <div style={{ background: "#FFFFFF", borderRadius: 10, padding: 14, border: "1px solid #E4E0D0", marginBottom: 12 }}>
        <div style={{ fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", color: "#8A8774", marginBottom: 8 }}>
          Tee time settings
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "flex-end" }}>
          <label style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4 }}>
            <span style={{ fontSize: 11, color: "#8A8774" }}>Start time</span>
            <input
              type="time"
              value={startTime}
              onChange={(e) => onUpdateStartTime(e.target.value)}
              className="mono"
              style={{ fontSize: 13, padding: "7px 8px", borderRadius: 6, border: "1px solid #D8D4C0" }}
            />
          </label>
          <label style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4 }}>
            <span style={{ fontSize: 11, color: "#8A8774" }}>Interval (mins)</span>
            <input
              type="number"
              inputMode="numeric"
              min={1}
              value={intervalMinutes}
              onChange={(e) => {
                const val = e.target.value;
                if (val === "") { onUpdateInterval(""); return; }
                const num = Number(val);
                if (!isNaN(num)) onUpdateInterval(Math.max(1, num));
              }}
              onBlur={(e) => {
                if (e.target.value === "") onUpdateInterval(1);
              }}
              className="mono"
              style={{ fontSize: 13, padding: "7px 8px", borderRadius: 6, border: "1px solid #D8D4C0" }}
            />
          </label>
          <button
            onClick={fillAllTimes}
            style={{ padding: "8px 12px", borderRadius: 6, border: `1px solid ${headerColor}`, background: "transparent", color: headerColor, fontSize: 12, fontWeight: 600, whiteSpace: "nowrap" }}
          >
            Fill times
          </button>
        </div>
        <div style={{ fontSize: 10.5, color: "#9B9885", marginTop: 6 }}>
          "Add tee time" adds one interval to the last time in the draw. "Fill times" renumbers every row from the start time.
        </div>
      </div>

      <div
        style={{
          background: "#FFFFFF", borderRadius: 10, padding: 14, border: "1px solid #E4E0D0", marginBottom: 12,
          position: "sticky", top: 0, zIndex: 20, boxShadow: "0 4px 10px rgba(0,0,0,0.08)",
        }}
      >
        <div style={{ fontSize: 11.5, color: "#6B6B5F", marginBottom: 8 }}>
          <strong>To swap two players:</strong> tap one, then tap the other. To move someone, tap them, then tap an
          empty slot. To see or change a player's details, tap them twice. New players: tap a name below, then a
          slot. On a computer you can also drag. Changes save by themselves after a couple of seconds.
        </div>
        {selected && (
          <div
            style={{
              fontSize: 11.5, fontWeight: 600, color: accentColor, background: `${accentColor}14`,
              borderRadius: 7, padding: "6px 9px", marginBottom: 8, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8,
            }}
          >
            <span style={{ flex: 1 }}>
              {selected.from ? `${selected.name} picked up — tap another player to swap, or an empty slot to move` : `Placing ${selected.name} — tap a slot`}
            </span>
            {selected.from && (
              <button
                onClick={() => { const { rowId, slotIdx } = selected.from; const name = selected.name; setSelected(null); setEditingSlot({ rowId, slotIdx, name }); }}
                style={{ background: "none", border: `1px solid ${accentColor}`, borderRadius: 6, color: accentColor, fontWeight: 700, padding: "3px 8px", whiteSpace: "nowrap" }}
              >
                Edit details
              </button>
            )}
            <button onClick={() => setSelected(null)} style={{ background: "none", border: "none", color: accentColor, fontWeight: 700, padding: 0 }}>
              Cancel
            </button>
          </div>
        )}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 6 }}>
          <div style={{ fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", color: "#8A8774" }}>
            Players {pool.length > 0 ? `(${pool.length} unplaced)` : "— all placed"}
          </div>
          {pool.length > 1 && !confirmClearPool && (
            <button onClick={() => setConfirmClearPool(true)} style={{ fontSize: 11.5, fontWeight: 600, color: "#B5442E", background: "none", border: "none", padding: 0 }}>
              Remove all {pool.length} unplaced
            </button>
          )}
        </div>
        {confirmClearPool && (
          <div style={{ background: "#FDF2EF", border: "1px solid #B5442E", borderRadius: 8, padding: 10, marginBottom: 8 }}>
            <div style={{ fontSize: 12.5, fontWeight: 700, color: "#B5442E", marginBottom: 4 }}>
              Remove all {pool.length} unplaced players from this day?
            </div>
            <div style={{ fontSize: 11.5, color: "#6B6B5F", marginBottom: 8 }}>
              Everyone already placed in a tee time stays. They also stay on the Society roster, so they can be added back.
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={() => { onRemovePlayers(pool.filter((p) => !(p.partnerName && assignedNames.has(p.partnerName))).map((p) => p.id)); setConfirmClearPool(false); setSelected(null); }}
                style={{ flex: 1, padding: "8px 0", borderRadius: 7, border: "none", background: "#B5442E", color: "#FFFFFF", fontWeight: 700, fontSize: 12.5 }}
              >
                Yes, remove them
              </button>
              <button
                onClick={() => setConfirmClearPool(false)}
                style={{ flex: 1, padding: "8px 0", borderRadius: 7, border: "1px solid #D8D4C0", background: "#FFFFFF", color: "#6B6B5F", fontWeight: 600, fontSize: 12.5 }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, maxHeight: 140, overflowY: "auto" }}>
          {pool.length === 0 && (
            <div style={{ fontSize: 12, color: "#9B9885" }}>
              {players.length === 0 ? "No players yet — add one below." : "Every player has been placed below."}
            </div>
          )}
          {pool.map((p) => (
            confirmDeleteName === p.name ? (
              <div
                key={p.id}
                style={{
                  display: "flex", alignItems: "center", gap: 6, padding: "6px 10px", borderRadius: 20,
                  border: "1px solid #B5442E", background: "#FDF2EF", fontSize: 12,
                }}
              >
                <span>Remove {p.name}?</span>
                <button
                  onClick={() => { onRemovePlayer(p.id); setConfirmDeleteName(null); }}
                  style={{ fontWeight: 700, color: "#B5442E", background: "none", border: "none", padding: "2px 4px" }}
                >
                  Yes
                </button>
                <button
                  onClick={() => setConfirmDeleteName(null)}
                  style={{ color: "#9B9885", background: "none", border: "none", padding: "2px 4px" }}
                >
                  No
                </button>
              </div>
            ) : (
              <div
                key={p.id}
                style={{
                  display: "flex", alignItems: "center", borderRadius: 20,
                  border: selected && selected.name === p.name ? `2px solid ${accentColor}` : "1px solid #D8D4C0",
                  background: selected && selected.name === p.name ? `${accentColor}14` : "#FFFFFF",
                  overflow: "hidden",
                }}
              >
                <button
                  draggable
                  onDragStart={(e) => e.dataTransfer.setData("text/plain", JSON.stringify({ name: p.name, from: null }))}
                  onClick={() => pickUp(p.name)}
                  style={{
                    padding: "6px 4px 6px 11px", fontSize: 12.5, fontWeight: 600, border: "none", background: "none",
                    color: selected && selected.name === p.name ? accentColor : "#1B1B1B",
                    cursor: "grab",
                  }}
                >
                  {p.name}
                </button>
                <button
                  onClick={() => setConfirmDeleteName(p.name)}
                  title={`Remove ${p.name} from the roster`}
                  style={{ padding: "6px 9px 6px 3px", background: "none", border: "none", color: "#B5442E" }}
                >
                  <X size={13} />
                </button>
              </div>
            )
          ))}
        </div>

        {showAddPlayer ? (
          <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
            <input
              value={newPlayerName}
              onChange={(e) => setNewPlayerName(e.target.value)}
              placeholder="Name"
              style={{ flex: 1.4, fontSize: 12.5, padding: "7px 8px", borderRadius: 6, border: "1px solid #D8D4C0" }}
            />
            <input
              value={newPlayerIndex}
              onChange={(e) => setNewPlayerIndex(e.target.value)}
              placeholder="HCP"
              type="number"
              inputMode="decimal"
              className="mono"
              style={{ flex: 0.7, fontSize: 12.5, padding: "7px 8px", borderRadius: 6, border: "1px solid #D8D4C0" }}
            />
            <button
              onClick={() => {
                if (!newPlayerName.trim()) return;
                onAddPlayerQuick(newPlayerName, newPlayerIndex);
                setNewPlayerName("");
                setNewPlayerIndex("");
              }}
              style={{ padding: "0 12px", borderRadius: 6, border: "none", background: headerColor, color: "#FFFFFF", fontSize: 12.5, fontWeight: 600 }}
            >
              Add
            </button>
            <button
              onClick={() => { setShowAddPlayer(false); setNewPlayerName(""); setNewPlayerIndex(""); }}
              style={{ padding: "0 10px", borderRadius: 6, border: "1px solid #D8D4C0", background: "transparent", color: "#6B6B5F", fontSize: 12.5 }}
            >
              ✕
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowAddPlayer(true)}
            style={{
              width: "100%", marginTop: 10, padding: "8px 0", borderRadius: 7, border: `1px dashed ${headerColor}`,
              background: "transparent", color: headerColor, fontWeight: 600, fontSize: 12.5,
              display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
            }}
          >
            <Plus size={13} /> Add player
          </button>
        )}

        {societyRoster && societyRoster.length > 0 && (
          showRosterPicker ? (
            <div style={{ background: "#FAF8F0", borderRadius: 8, padding: 10, border: `1px solid ${headerColor}`, marginTop: 10 }}>
              <input
                value={rosterSearch}
                onChange={(e) => setRosterSearch(e.target.value)}
                placeholder="Search society roster…"
                style={{ width: "100%", fontSize: 13, padding: "7px 9px", borderRadius: 6, border: "1px solid #D8D4C0", marginBottom: 8, boxSizing: "border-box" }}
              />
              <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
                {[
                  { key: "all", label: "All" },
                  { key: "ladies", label: "Ladies" },
                  { key: "gents", label: "Gents" },
                ].map((opt) => (
                  <button
                    key={opt.key}
                    onClick={() => setRosterGenderFilter(opt.key)}
                    style={{
                      flex: 1, padding: "6px 0", borderRadius: 6, border: `1px solid ${headerColor}`,
                      background: rosterGenderFilter === opt.key ? headerColor : "transparent",
                      color: rosterGenderFilter === opt.key ? "#FFFFFF" : headerColor, fontWeight: 600, fontSize: 11.5,
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              <div style={{ maxHeight: 220, overflowY: "auto" }}>
                {(() => {
                  const visibleRosterMembers = societyRoster
                    .filter((m) => !players.some((p) => normalizeName(p.name) === normalizeName(m.name)))
                    .filter((m) => !rosterSearch.trim() || m.name.toLowerCase().includes(rosterSearch.trim().toLowerCase()))
                    .filter((m) => rosterGenderFilter === "all" || (rosterGenderFilter === "ladies" ? m.isLady : !m.isLady))
                    .sort((a, b) => a.name.localeCompare(b.name));
                  const allVisibleSelected = visibleRosterMembers.length > 0 && visibleRosterMembers.every((m) => selectedRosterIds.has(m.id));
                  return (
                    <>
                      {visibleRosterMembers.length > 0 && (
                        <button
                          onClick={() => setSelectedRosterIds((prev) => {
                            const next = new Set(prev);
                            if (allVisibleSelected) visibleRosterMembers.forEach((m) => next.delete(m.id));
                            else visibleRosterMembers.forEach((m) => next.add(m.id));
                            return next;
                          })}
                          style={{ fontSize: 11.5, fontWeight: 600, color: headerColor, background: "none", border: "none", padding: "4px 2px 8px", textAlign: "left" }}
                        >
                          {allVisibleSelected ? "Deselect all" : `Select all (${visibleRosterMembers.length})`}
                        </button>
                      )}
                      {visibleRosterMembers.map((m) => (
                        <label key={m.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 2px", borderTop: "1px solid #EFEDE0", cursor: "pointer" }}>
                          <input
                            type="checkbox"
                            checked={selectedRosterIds.has(m.id)}
                            onChange={() => setSelectedRosterIds((prev) => {
                              const next = new Set(prev);
                              if (next.has(m.id)) next.delete(m.id);
                              else next.add(m.id);
                              return next;
                            })}
                          />
                          <span style={{ flex: 1, fontSize: 13, fontWeight: 600 }}>{m.name}</span>
                          <span className="mono" style={{ fontSize: 11, color: "#8A8774" }}>{m.index || "no HCP"}</span>
                        </label>
                      ))}
                    </>
                  );
                })()}
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                <button
                  onClick={() => {
                    onAddFromRoster([...selectedRosterIds]);
                    setSelectedRosterIds(new Set());
                    setRosterSearch("");
                    setRosterGenderFilter("all");
                    setShowRosterPicker(false);
                  }}
                  disabled={selectedRosterIds.size === 0}
                  style={{
                    flex: 1, padding: "9px 0", borderRadius: 7, border: "none",
                    background: selectedRosterIds.size === 0 ? "#D8D4C0" : headerColor, color: "#FFFFFF", fontWeight: 600, fontSize: 12.5,
                  }}
                >
                  Add {selectedRosterIds.size || ""}
                </button>
                <button
                  onClick={() => { setShowRosterPicker(false); setSelectedRosterIds(new Set()); setRosterSearch(""); setRosterGenderFilter("all"); }}
                  style={{ flex: 1, padding: "9px 0", borderRadius: 7, border: "1px solid #D8D4C0", background: "transparent", color: "#6B6B5F", fontWeight: 600, fontSize: 12.5 }}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowRosterPicker(true)}
              style={{
                width: "100%", marginTop: 8, padding: "8px 0", borderRadius: 7, border: `1px dashed ${accentColor}`,
                background: "transparent", color: accentColor, fontWeight: 600, fontSize: 12.5,
                display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
              }}
            >
              <Users size={13} /> Add from society roster
            </button>
          )
        )}
      </div>

      {players.some((p) => p.name) && (
        <div style={{ background: "#FFFFFF", borderRadius: 10, padding: 12, border: "1px solid #E4E0D0", marginBottom: 12 }}>
          <button
            onClick={() => setShowBulkTeePanel((v) => !v)}
            style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", background: "none", border: "none", padding: 0, cursor: "pointer" }}
          >
            <span style={{ fontSize: 12, fontWeight: 700 }}>Bulk-set tee</span>
            <ChevronRight size={15} color="#9B9885" style={{ transform: showBulkTeePanel ? "rotate(90deg)" : "none", transition: "transform 0.15s" }} />
          </button>
          {showBulkTeePanel && (
            <>
          <div style={{ fontSize: 11, color: "#6B6B5F", marginTop: 6, marginBottom: 8 }}>
            Handy right here after dragging people in from the Society Roster, since their tee never carries over
            automatically. Pick a tee, tick everyone playing off it, apply.
          </div>
          <select
            value={bulkTeeTarget}
            onChange={(e) => chooseBulkTeeTarget(e.target.value)}
            style={{ width: "100%", fontSize: 13, fontWeight: 600, padding: "8px 10px", borderRadius: 7, border: "1px solid #D8D4C0", marginBottom: 8, background: "#FFF" }}
          >
            <option value="">Choose a tee…</option>
            {course.tees.map((t) => (
              <option key={t.id} value={t.label}>{t.label}</option>
            ))}
          </select>
          {bulkTeeTarget && (
            <>
              <div style={{ maxHeight: 200, overflowY: "auto", border: "1px solid #EFEDE0", borderRadius: 7, marginBottom: 8 }}>
                {teeableePeople.map((person) => (
                  <label
                    key={person.key}
                    style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 10px", borderTop: "1px solid #EFEDE0", cursor: "pointer" }}
                  >
                    <input type="checkbox" checked={selectedTeeIds.has(person.key)} onChange={() => toggleTeeSelect(person.key)} />
                    <span style={{ flex: 1, fontSize: 12.5, fontWeight: 600 }}>{person.name}</span>
                    <span
                      className="mono"
                      style={{ fontSize: 10.5, fontWeight: person.tee && teeMismatch(course, person.tee) ? 700 : 400, color: person.tee && teeMismatch(course, person.tee) ? "#B5442E" : "#8A8774" }}
                    >
                      {person.tee ? (teeMismatch(course, person.tee) ? `⚠ ${person.tee}` : person.tee) : "no tee set"}
                    </span>
                  </label>
                ))}
              </div>
              <button
                onClick={applyBulkTee}
                style={{ width: "100%", padding: "9px 0", borderRadius: 7, border: "none", background: headerColor, color: "#FFFFFF", fontWeight: 700, fontSize: 13 }}
              >
                {teeSavedMsg ? "Saved" : `Apply to ${selectedTeeIds.size} player${selectedTeeIds.size === 1 ? "" : "s"}`}
              </button>
            </>
          )}
            </>
          )}
        </div>
      )}
      {players.some((p) => p.name) && (
        <div style={{ background: "#FFFFFF", borderRadius: 10, padding: 12, border: "1px solid #E4E0D0", marginBottom: 12 }}>
          <button
            onClick={() => setShowAdjustPanel((v) => !v)}
            style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", background: "none", border: "none", padding: 0, cursor: "pointer" }}
          >
            <span style={{ fontSize: 12, fontWeight: 700 }}>
              Adjust handicap{teeableePeople.some((x) => x.adj !== 0) ? ` — ${teeableePeople.filter((x) => x.adj !== 0).length} adjusted` : ""}
            </span>
            <ChevronRight size={15} color="#9B9885" style={{ transform: showAdjustPanel ? "rotate(90deg)" : "none", transition: "transform 0.15s" }} />
          </button>
          {showAdjustPanel && (
            <>
          <div style={{ fontSize: 11, color: "#6B6B5F", marginTop: 6, marginBottom: 8 }}>
            A one-off shots adjustment for this competition only — e.g. shots deducted for winning too often, or
            extra shots for a lady. Never touches their actual index or any other day.
          </div>
          <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
            {[
              { key: "all", label: "All" },
              { key: "ladies", label: "Ladies" },
              { key: "gents", label: "Gents" },
            ].map((opt) => (
              <button
                key={opt.key}
                onClick={() => setAdjustGenderFilter(opt.key)}
                style={{
                  flex: 1, padding: "6px 0", borderRadius: 6, border: `1px solid ${headerColor}`,
                  background: adjustGenderFilter === opt.key ? headerColor : "transparent",
                  color: adjustGenderFilter === opt.key ? "#FFFFFF" : headerColor, fontWeight: 600, fontSize: 11.5,
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <button
            onClick={selectAllAdjustable}
            style={{ width: "100%", padding: "7px 0", borderRadius: 6, border: `1px dashed ${headerColor}`, background: "transparent", color: headerColor, fontWeight: 600, fontSize: 11.5, marginBottom: 8 }}
          >
            Select all {adjustGenderFilter === "all" ? "" : adjustGenderFilter} ({adjustablePeople.length})
          </button>
          <div style={{ maxHeight: 200, overflowY: "auto", border: "1px solid #EFEDE0", borderRadius: 7, marginBottom: 8 }}>
            {adjustablePeople.map((person) => (
              <label
                key={person.key}
                style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 10px", borderTop: "1px solid #EFEDE0", cursor: "pointer" }}
              >
                <input type="checkbox" checked={selectedAdjustKeys.has(person.key)} onChange={() => toggleAdjustSelect(person.key)} />
                <span style={{ flex: 1, fontSize: 12.5, fontWeight: 600 }}>{person.name}</span>
                {person.adj !== 0 && (
                  <span className="mono" style={{ fontSize: 11, fontWeight: 700, color: "#FFFFFF", background: headerColor, borderRadius: 4, padding: "1px 6px" }}>
                    {person.adj > 0 ? `+${person.adj}` : person.adj} {Math.abs(person.adj) === 1 ? "shot" : "shots"}
                  </span>
                )}
              </label>
            ))}
          </div>
          {selectedAdjustKeys.size > 0 && (
            <>
              <HandicapAdjuster value={adjustBulkValue} onChange={setAdjustBulkValue} headerColor={headerColor} />
              <button
                onClick={applyBulkAdjustment}
                style={{ width: "100%", padding: "9px 0", borderRadius: 7, border: "none", background: headerColor, color: "#FFFFFF", fontWeight: 700, fontSize: 13, marginTop: 8 }}
              >
                {adjustSavedMsg ? "Saved" : `Apply to ${selectedAdjustKeys.size} player${selectedAdjustKeys.size === 1 ? "" : "s"}`}
              </button>
            </>
          )}
            </>
          )}
        </div>
      )}

      {rows.length > 1 && (
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 8 }}>
          {confirmClearRows ? (
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 11, color: "#8A8774" }}>Remove all {rows.length} tee times?</span>
              <button
                onClick={() => { clearAllRows(); setConfirmClearRows(false); }}
                style={{ fontSize: 11.5, fontWeight: 700, color: "#B5442E", background: "none", border: "none", padding: "4px 6px" }}
              >
                Yes, clear
              </button>
              <button
                onClick={() => setConfirmClearRows(false)}
                style={{ fontSize: 11.5, color: "#9B9885", background: "none", border: "none", padding: "4px 6px" }}
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmClearRows(true)}
              style={{ fontSize: 11.5, color: "#B5442E", background: "none", border: "none", padding: "4px 2px" }}
            >
              Clear all tee times
            </button>
          )}
        </div>
      )}

      {rows.map((row, rowIdx) => (
        <div key={row.id} style={{ background: "#FFFFFF", borderRadius: 10, padding: 12, border: "1px solid #E4E0D0", marginBottom: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <input
              value={row.time}
              onChange={(e) => setTime(row.id, e.target.value)}
              placeholder={`Time (e.g. 9:0${rowIdx})`}
              className="mono"
              style={{ flex: 1, fontSize: 13, fontWeight: 700, padding: "6px 9px", borderRadius: 6, border: "1px solid #D8D4C0" }}
            />
            <input
              value={row.startTee}
              onChange={(e) => setStartTee(row.id, e.target.value)}
              placeholder="Tee (e.g. 10th)"
              style={{ width: 96, fontSize: 12.5, fontWeight: 600, padding: "6px 8px", borderRadius: 6, border: "1px solid #D8D4C0" }}
            />
            <button onClick={() => removeRow(row.id)} style={{ background: "none", border: "none", color: "#B5442E", padding: 4 }}>
              <X size={15} />
            </button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6 }}>
            {row.slots.map((name, slotIdx) => {
              const isMoveOrigin = selected && selected.from && selected.from.rowId === row.id && selected.from.slotIdx === slotIdx;
              const isDragOver = dragOverSlot && dragOverSlot.rowId === row.id && dragOverSlot.slotIdx === slotIdx;
              return (
                <button
                  key={slotIdx}
                  draggable={!!name}
                  onDragStart={(e) => {
                    if (!name) return;
                    e.dataTransfer.setData("text/plain", JSON.stringify({ name, from: { rowId: row.id, slotIdx } }));
                  }}
                  onDragOver={(e) => e.preventDefault()}
                  onDragEnter={(e) => { e.preventDefault(); setDragOverSlot({ rowId: row.id, slotIdx }); }}
                  onDragLeave={() => setDragOverSlot((prev) => (prev && prev.rowId === row.id && prev.slotIdx === slotIdx ? null : prev))}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDragOverSlot(null);
                    try {
                      const data = JSON.parse(e.dataTransfer.getData("text/plain"));
                      placeOrSwap(row.id, slotIdx, data);
                    } catch {
                      // ignore a drop that isn't one of our own player chips
                    }
                  }}
                  onClick={() => tapSlot(row.id, slotIdx, name)}
                  style={{
                    minHeight: 44, borderRadius: 7, fontSize: 11.5, fontWeight: 600, padding: "4px 4px",
                    border: isDragOver
                      ? `2px dashed ${accentColor}`
                      : isMoveOrigin
                      ? `2px solid ${accentColor}`
                      : name
                      ? `1px solid ${headerColor}`
                      : selected
                      ? `1px dashed ${accentColor}`
                      : "1px dashed #D8D4C0",
                    background: isDragOver ? `${accentColor}22` : isMoveOrigin ? `${accentColor}14` : name ? `${headerColor}12` : "#FBFAF6",
                    color: isMoveOrigin ? accentColor : name ? headerColor : "#C2BEA9",
                    cursor: name ? "grab" : "default",
                  }}
                >
                  {name || "—"}
                </button>
              );
            })}
          </div>
          {row.slots.some(Boolean) && (
            <div style={{ fontSize: 12.5, color: "#1B1B1B", marginTop: 8, lineHeight: 1.5 }}>
              {formatGroupLines(row.slots.filter(Boolean), course, players, handicapAllowance, isFoursomes, visOpts).map((line, i) => (
                <div key={i}>{withBoldFigures(line)}</div>
              ))}
            </div>
          )}
        </div>
      ))}

      <button
        onClick={addRow}
        style={{
          width: "100%", padding: "10px 0", borderRadius: 10, border: `1px dashed ${headerColor}`,
          background: "transparent", color: headerColor, fontWeight: 600, fontSize: 13, marginBottom: 12,
        }}
      >
        + Add tee time
      </button>

      <button
        onClick={saveDraw}
        style={{ width: "100%", padding: "11px 0", borderRadius: 10, border: "none", background: headerColor, color: "#FFFFFF", fontWeight: 700, fontSize: 14 }}
      >
        {savedMsg ? "Saved" : "Save draw"}
      </button>

      {editingSlot && (
        <SlotHandicapEditor
          name={editingSlot.name}
          currentIndex={(findIndividualByName(players, editingSlot.name) || {}).index || ""}
          currentTee={(findIndividualByName(players, editingSlot.name) || {}).tee || ""}
          currentCompetition={(findIndividualByName(players, editingSlot.name) || {}).competition || ""}
          currentAdjustment={Number((findIndividualByName(players, editingSlot.name) || {}).handicapAdjustment) || 0}
          competitions={competitions}
          course={course}
          headerColor={headerColor}
          accentColor={accentColor}
          onSave={(newIndex, newTee, newCompetition) => {
            onUpdatePlayerDetails(editingSlot.name, newIndex, newTee, newCompetition);
            setEditingSlot(null);
          }}
          onRemove={() => {
            clearSlot(editingSlot.rowId, editingSlot.slotIdx);
            onWithdrawPlayer(editingSlot.name);
            setEditingSlot(null);
          }}
          onMove={() => pickUpFromSlot(editingSlot.rowId, editingSlot.slotIdx, editingSlot.name)}
          onClose={() => setEditingSlot(null)}
        />
      )}
    </div>
  );
}

function SlotHandicapEditor({ currentAdjustment = 0, name, currentIndex, currentTee, currentCompetition, competitions, course, headerColor, accentColor, onSave, onRemove, onMove, onClose }) {
  const [value, setValue] = useState(currentIndex);
  const [tee, setTee] = useState(currentTee);
  const [competition, setCompetition] = useState(currentCompetition || (competitions[0] && competitions[0].abbreviation) || "");

  return (
    <div
      style={{
        position: "fixed", inset: 0, background: "rgba(27,27,27,0.45)",
        display: "flex", alignItems: "center", justifyContent: "center", padding: 20, zIndex: 50,
      }}
      onClick={onClose}
    >
      <div
        style={{ background: "#FFFFFF", borderRadius: 12, padding: 22, width: "100%", maxWidth: 300 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ fontSize: 15, fontWeight: 700, color: headerColor, marginBottom: 12 }}>{name}</div>
        {currentAdjustment !== 0 && (
          <div style={{ fontSize: 12, fontWeight: 700, color: "#FFFFFF", background: headerColor, borderRadius: 7, padding: "7px 10px", marginBottom: 12 }}>
            * Handicap adjusted for this day: {currentAdjustment > 0 ? `+${currentAdjustment}` : currentAdjustment} {Math.abs(currentAdjustment) === 1 ? "shot" : "shots"}
            <div style={{ fontWeight: 400, fontSize: 11, marginTop: 2, opacity: 0.9 }}>Change it under "Adjust handicap" on the Draw screen.</div>
          </div>
        )}
        <div style={{ fontSize: 11, color: "#8A8774", marginBottom: 4 }}>Handicap index</div>
        <input
          type="number"
          inputMode="decimal"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="mono"
          style={{ width: "100%", fontSize: 18, padding: "9px 10px", borderRadius: 8, border: "1px solid #D8D4C0", marginBottom: 14 }}
        />
        <div style={{ fontSize: 11, color: "#8A8774", marginBottom: 4 }}>Tee</div>
        <select
          value={tee}
          onChange={(e) => setTee(e.target.value)}
          style={{ width: "100%", fontSize: 15, fontWeight: 600, padding: "9px 10px", borderRadius: 8, border: "1px solid #D8D4C0", marginBottom: 14, background: "#FFF" }}
        >
          {teeMismatch(course, tee) && (
            <option value={tee || ""}>{tee ? `⚠ ${tee} — not a tee here` : "Choose tee…"}</option>
          )}
          {course.tees.map((t) => (
            <option key={t.id} value={t.label}>{t.label}</option>
          ))}
        </select>
        {competitions.length > 0 && (
          <>
            <div style={{ fontSize: 11, color: "#8A8774", marginBottom: 4 }}>Competition</div>
            <select
              value={competition}
              onChange={(e) => setCompetition(e.target.value)}
              style={{ width: "100%", fontSize: 15, fontWeight: 600, padding: "9px 10px", borderRadius: 8, border: "1px solid #D8D4C0", marginBottom: 14, background: "#FFF" }}
            >
              {competitions.map((c) => (
                <option key={c.id} value={c.abbreviation}>{c.fullName || c.abbreviation}</option>
              ))}
            </select>
          </>
        )}
        <button
          onClick={() => onSave(value, tee, competition)}
          style={{ width: "100%", padding: "10px 0", borderRadius: 8, border: "none", background: headerColor, color: "#FFFFFF", fontWeight: 600, fontSize: 13.5, marginBottom: 8 }}
        >
          Save
        </button>
        <button
          onClick={onMove}
          style={{ width: "100%", padding: "10px 0", borderRadius: 8, border: `1px solid ${accentColor}`, background: "transparent", color: accentColor, fontWeight: 600, fontSize: 13.5, marginBottom: 8 }}
        >
          Move to another slot
        </button>
        <button
          onClick={onRemove}
          style={{ width: "100%", padding: "10px 0", borderRadius: 8, border: "1px solid #B5442E", background: "transparent", color: "#B5442E", fontWeight: 600, fontSize: 13.5, marginBottom: 8 }}
        >
          Withdrawn — remove entirely
        </button>
        <button
          onClick={onClose}
          style={{ width: "100%", padding: "8px 0", borderRadius: 8, border: "none", background: "transparent", color: "#8A8774", fontSize: 13 }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

function LocalRulesView({ text, headerColor, accentColor }) {
  if (!text.trim()) {
    return (
      <div style={{ padding: "48px 24px", textAlign: "center", color: "#6B6B5F" }}>
        <Flag size={28} color={accentColor} style={{ marginBottom: 10 }} />
        <div style={{ fontSize: 15 }}>No local rules posted yet.</div>
        <div style={{ fontSize: 12.5, marginTop: 4 }}>Check back once they've been posted.</div>
      </div>
    );
  }
  return (
    <div style={{ padding: "14px 16px 40px" }}>
      <div
        style={{
          background: "#FFFFFF", borderRadius: 10, padding: "16px 18px", border: "1px solid #E4E0D0",
          fontSize: 14, lineHeight: 1.6, color: "#1B1B1B", whiteSpace: "pre-wrap",
        }}
      >
        {text}
      </div>
    </div>
  );
}

// Sizes the name line so it always fits the label's width (63.5mm, about
// 212px of usable space) instead of wrapping untidily or being cut off.
// A single name, or a pair short enough, stays on ONE line and is shrunk
// only as far as needed (never below 11px). A pair too long for that is
// deliberately set on two lines — one name per line — at a larger size,
// which reads better than one line of tiny type. 0.66 is the average width
// of a bold Bookman-style letter relative to the font size, measured with
// a little margin.
function fitLabelName(names) {
  const WIDTH = 212, PER_CHAR = 0.66, MAX = 17, MIN_ONE_LINE = 11;
  const fit = (chars, cap) => Math.floor(Math.min(cap, WIDTH / (PER_CHAR * Math.max(chars, 1))) * 10) / 10;
  const oneLine = fit(names.join(" & ").length, MAX);
  if (names.length < 2 || oneLine >= MIN_ONE_LINE) return { stack: false, size: Math.max(oneLine, 9) };
  const longest = Math.max(...names.map((n, i) => n.length + (i < names.length - 1 ? 2 : 0)));
  return { stack: true, size: Math.max(fit(longest, 15.5), 9) };
}

// ---- Label alignment, fine-tuned per device ----
// Printers don't all feed a sheet identically, and browsers/printer drivers
// sometimes nudge or very slightly shrink a page. These four small
// corrections (in mm) are remembered on the device that does the printing,
// so once the labels line up on a given computer + printer they stay so.
const LABEL_CAL_KEY = "golf-label-calibration-v1";
const LABEL_CAL_DEFAULT = { x: 0, y: 0, colGap: 0, rowPitch: 0 };
function readLabelCal() {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(LABEL_CAL_KEY) || "null");
    if (!parsed) return LABEL_CAL_DEFAULT;
    const num = (v, lim) => (typeof v === "number" && isFinite(v) ? Math.max(-lim, Math.min(lim, v)) : 0);
    return { x: num(parsed.x, 5), y: num(parsed.y, 5), colGap: num(parsed.colGap, 3), rowPitch: num(parsed.rowPitch, 1.5) };
  } catch {
    return LABEL_CAL_DEFAULT;
  }
}
function writeLabelCal(cal) {
  try { window.localStorage.setItem(LABEL_CAL_KEY, JSON.stringify(cal)); } catch { /* ignore */ }
}

function PrintLabels({ societyRoster = [], course, players, draw, roundDateDisplay, drawNote, competitions, handicapAllowance, isFoursomes, scoring, roundLabel, onBack, headerColor, accentColor }) {
  const strokeHolesFor = (ph) =>
    course.holes
      .map((h, i) => strokesOnHole(course, ph, i))
      .map((s, i) => ({ hole: i + 1, strokes: s }))
      .filter((h) => h.strokes > 0);

  // Finds whichever draw group this name appears in, returning the tee
  // time and everyone else in that same group (their playing partner(s),
  // as distinct from a Foursomes teammate — this is "who else tees off
  // with me at this time", from the actual draw, not the roster.
  const drawInfoFor = (name) => {
    const target = normalizeName(name);
    for (const entry of draw) {
      const names = entry.players || [];
      if (names.some((n) => normalizeName(n) === target)) {
        return { time: entry.time, startTee: entry.startTee || "", others: names.filter((n) => normalizeName(n) !== target) };
      }
    }
    return null;
  };

  // Only the sub-competition this specific player is tagged into on the
  // roster (e.g. "Prince of Wales Cup" or "Sir John Hay Bowl") — blank for
  // anyone not tagged into one.
  const competitionNameFor = (abbreviation) => {
    if (!abbreviation) return "";
    const match = competitions.find((c) => c.abbreviation.toUpperCase() === abbreviation.toUpperCase());
    return match ? match.fullName || match.abbreviation : "";
  };

  // Once a draw exists, labels are only printed for people actually IN it —
  // anyone still sitting unplaced in the pool (a reserve, a withdrawal
  // that's been pulled out of the draw) doesn't get one. With no draw at
  // all yet, everyone on the day's list still prints, as before.
  const namesInDraw = new Set(draw.flatMap((entry) => entry.players || []).filter(Boolean).map(normalizeName));
  const inDraw = (p) => namesInDraw.size === 0 || namesInDraw.has(normalizeName(p.name)) || (p.partnerName && namesInDraw.has(normalizeName(p.partnerName)));
  const leftOut = players.filter((p) => p.name && !inDraw(p)).length;

  const cards = players
    .filter((p) => p.name && inDraw(p))
    .map((p) => {
      if (isFoursomes) {
        const ph = combinedHandicap(course, p, handicapAllowance);
        // Exclude their own Foursomes partner from "others" — that's
        // already shown in the title — leaving just the opposing pair.
        const info = drawInfoFor(p.name);
        const others = info ? info.others.filter((n) => normalizeName(n) !== normalizeName(p.partnerName || "")) : [];
        return {
          id: p.id,
          title: p.partnerName ? `${p.name} & ${p.partnerName}` : p.name,
          hcpLine: p.partnerName ? `HCP ${p.index || "–"} / ${p.partnerIndex || "–"}` : `HCP ${p.index || "–"}`,
          ph,
          adjusted: !!(Number(p.handicapAdjustment) || Number(p.partnerHandicapAdjustment)),
          strokeHoles: strokeHolesFor(ph),
          time: info ? info.time : "",
          startTee: info ? info.startTee : "",
          teeLine: [...new Set([p.tee, p.partnerTee].filter(Boolean))].join(" / "),
          partners: others,
          competitionName: competitionNameFor(p.competition),
        };
      }
      const rawPh = playingHandicap(course, Number(p.index) || 0, p.tee);
      const ph = allowedHandicap(rawPh, handicapAllowance) + (Number(p.handicapAdjustment) || 0);
      const info = drawInfoFor(p.name);
      return {
        id: p.id,
        title: p.name,
        hcpLine: `HCP ${p.index || "–"}`,
        ph,
        adjusted: !!Number(p.handicapAdjustment),
        strokeHoles: strokeHolesFor(ph),
        time: info ? info.time : "",
        startTee: info ? info.startTee : "",
        teeLine: p.tee || "",
        partners: info ? info.others : [],
        competitionName: competitionNameFor(p.competition),
      };
    });

  const sheets = Math.ceil(cards.length / 18);
  const ladyNames = new Set(societyRoster.filter((m) => m.isLady).map((m) => normalizeName(m.name)));
  const isLadyName = (name) => ladyNames.has(normalizeName(name));
  // One block per physical sheet of 18, so each sheet is laid out (and
  // page-broken) on its own rather than trusting the browser to wrap a
  // single long grid at exactly the right row.
  const sheetsOfCards = [];
  for (let i = 0; i < cards.length; i += 18) sheetsOfCards.push(cards.slice(i, i + 18));

  const [cal, setCal] = useState(readLabelCal);
  const [outlines, setOutlines] = useState(false);
  const [showCal, setShowCal] = useState(false);
  const calLimits = { x: 5, y: 5, colGap: 3, rowPitch: 1.5 };
  const nudge = (field, by) => setCal((prev) => {
    const lim = calLimits[field];
    const next = { ...prev, [field]: Math.round(Math.max(-lim, Math.min(lim, prev[field] + by)) * 100) / 100 };
    writeLabelCal(next);
    return next;
  });
  const resetCal = () => { setCal(LABEL_CAL_DEFAULT); writeLabelCal(LABEL_CAL_DEFAULT); };
  const calChanged = cal.x !== 0 || cal.y !== 0 || cal.colGap !== 0 || cal.rowPitch !== 0;
  const fmtMm = (v) => `${v > 0 ? "+" : ""}${v.toFixed(2)} mm`;
  const calRow = (field, title, minusLabel, plusLabel, step) => (
    <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 0", borderTop: "1px solid #EFEDE0" }}>
      <div style={{ flex: 1, fontSize: 12.5, fontWeight: 600 }}>{title}</div>
      <button onClick={() => nudge(field, -step)} style={{ padding: "7px 9px", borderRadius: 7, border: "1px solid #D8D4C0", background: "#FFF", fontSize: 11.5, fontWeight: 700, color: "#3F3F38" }}>{minusLabel}</button>
      <span className="mono" style={{ minWidth: 70, textAlign: "center", fontSize: 12.5, fontWeight: 700, color: cal[field] !== 0 ? headerColor : "#9B9885" }}>{fmtMm(cal[field])}</span>
      <button onClick={() => nudge(field, step)} style={{ padding: "7px 9px", borderRadius: 7, border: "1px solid #D8D4C0", background: "#FFF", fontSize: 11.5, fontWeight: 700, color: "#3F3F38" }}>{plusLabel}</button>
    </div>
  );

  return (
    <div
      className={`label-page${outlines ? " label-outlines" : ""}`}
      style={{ padding: "12px 14px 40px", "--lx": `${cal.x}mm`, "--ly": `${cal.y}mm`, "--lcg": `${cal.colGap}mm`, "--lrp": `${cal.rowPitch}mm` }}
    >
      <div className="no-print" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
        <button onClick={onBack} style={{ background: "none", border: "none", color: headerColor, fontSize: 13, padding: 0, fontWeight: 600 }}>
          ← Back
        </button>
        <button
          onClick={() => window.print()}
          style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 16px", borderRadius: 8, border: "none", background: headerColor, color: "#FFFFFF", fontWeight: 700, fontSize: 13.5 }}
        >
          <Printer size={15} /> Print
        </button>
      </div>
      <div className="no-print" style={{ fontSize: 11.5, color: "#6B6B5F", marginBottom: 6 }}>
        {cards.length} label{cards.length === 1 ? "" : "s"} for {roundLabel} — {sheets} sheet{sheets === 1 ? "" : "s"}
        of Avery L7161 (18 per sheet, 3×6, 63.5×46.6mm).
        {leftOut > 0 ? ` ${leftOut} ${leftOut === 1 ? "player isn't" : "players aren't"} in the draw, so ${leftOut === 1 ? "has" : "have"} no label.` : ""}
      </div>
      <div className="no-print" style={{ fontSize: 11, color: "#B5442E", marginBottom: 14, fontWeight: 600 }}>
        In the print dialog, set Scale to "100%" or "Actual size" — not "Fit to page" — or the labels won't line up
        with the sheet — and leave Margins on "Default". Worth a test print on plain paper first (with the label
        outlines switched on, below), held up against a real sheet to the light.
      </div>
      <div className="no-print" style={{ background: "#FFFFFF", borderRadius: 10, border: `1px solid ${calChanged ? headerColor : "#E4E0D0"}`, padding: 12, marginBottom: 14 }}>
        <button
          onClick={() => setShowCal((v) => !v)}
          style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", background: "none", border: "none", padding: 0 }}
        >
          <span style={{ fontSize: 12.5, fontWeight: 700, color: headerColor }}>
            Line the labels up with your printer{calChanged ? " — adjusted" : ""}
          </span>
          <ChevronRight size={15} color="#9B9885" style={{ transform: showCal ? "rotate(90deg)" : "none", transition: "transform 0.15s" }} />
        </button>
        {showCal && (
          <div style={{ marginTop: 8 }}>
            <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, fontWeight: 600, padding: "4px 0 8px", cursor: "pointer" }}>
              <input type="checkbox" checked={outlines} onChange={() => setOutlines((v) => !v)} />
              Print an outline round every label (for a test on plain paper — switch off for the real sheet)
            </label>
            <div style={{ fontSize: 11.5, color: "#6B6B5F", marginBottom: 6 }}>
              Print a test page with outlines on plain paper and hold it against a label sheet to the light. Then
              correct whatever is out. Each tap is a quarter of a millimetre; the settings are remembered on this device.
            </div>
            {calRow("x", "Whole page left / right", "◀ Left", "Right ▶", 0.25)}
            {calRow("y", "Whole page up / down", "▲ Up", "Down ▼", 0.25)}
            {calRow("colGap", "Space between columns", "Narrower", "Wider", 0.25)}
            {calRow("rowPitch", "Height of each row", "Shorter", "Taller", 0.1)}
            <div style={{ fontSize: 11, color: "#8A8774", marginTop: 8 }}>
              If the first column is right but the third is off, change "Space between columns". If the top row is
              right but the bottom row has drifted, change "Height of each row". If everything is out by the same
              amount, move the whole page.
            </div>
            {calChanged && (
              <button onClick={resetCal} style={{ marginTop: 8, background: "none", border: "none", color: "#B5442E", fontSize: 11.5, fontWeight: 600, padding: 0, textDecoration: "underline" }}>
                Reset to Avery's standard measurements
              </button>
            )}
          </div>
        )}
      </div>
      {cards.length === 0 ? (
        <div style={{ fontSize: 13, color: "#9B9885", textAlign: "center", padding: 30 }}>No players yet on this day.</div>
      ) : (
        sheetsOfCards.map((sheetCards, sheetIdx) => (
        <div className="label-grid" key={sheetIdx}>
          {sheetCards.map((c) => (
            <div className="label-card" key={c.id}>
              {c.competitionName && (
                <div className="label-competition">{c.competitionName}</div>
              )}
              <div className="label-meta">
                {roundDateDisplay}{roundDateDisplay && c.time ? " – " : ""}{c.time}{c.startTee ? ` – ${c.startTee}` : ""}
              </div>
              <div className="label-name" style={{ "--label-name-size": `${fitLabelName(c.title.split(" & ")).size}px`, whiteSpace: "nowrap" }}>
                {c.title.split(" & ").map((name, i, all) => (
                  <React.Fragment key={i}>
                    {i > 0 ? (fitLabelName(all).stack ? <> &amp;<br /></> : " & ") : ""}
                    {/* Ladies (marked "L" in the Society roster) print in red and
                        the men in dark blue, both bold, so the cards are easy
                        to sort at a glance. */}
                    <span style={{ color: isLadyName(name) ? "#C00000" : "#14275A", fontWeight: 800, WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}>{name}</span>
                  </React.Fragment>
                ))}
              </div>
              {c.partners.length > 0 && (
                <div className="label-partners">({c.partners.join(", ")})</div>
              )}
              <div className="label-hcp">{c.hcpLine} – Playing {c.ph}{c.adjusted ? "*" : ""}</div>
              {drawNote && drawNote.trim() && (
                <div className="label-note">{drawNote}</div>
              )}
            </div>
          ))}
        </div>
        ))
      )}
      <style>{`
        /* On-screen preview only — doesn't need to be exact, just readable */
        .label-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; margin-bottom: 18px; }
        .label-card {
          border: 1px dashed #B5AF9A; padding: 10px 12px; min-height: 112px;
          display: flex; flex-direction: column; justify-content: center;
          font-family: "Bookman Old Style", "URW Bookman", Georgia, "Times New Roman", serif;
        }
        .label-name { font-weight: 700; font-size: var(--label-name-size, 16px); margin: 6px 0; line-height: 1.25; }
        .label-meta { font-size: 10.5px; color: #1B1B1B; font-weight: 700; margin: 5px 0; }
        .label-competition { font-size: 10.5px; color: #1B1B1B; font-weight: 700; margin-bottom: 3px; }
        .label-partners { font-size: 9.5px; color: #6B6B5F; margin-bottom: 4px; }
        .label-hcp { font-size: 10.5px; color: #555; margin-bottom: 6px; }
        .label-note { font-size: 11px; color: #6B6B5F; font-style: italic; margin-top: 6px; }

        /* Print output — matched to Avery L7161's published measurements,
           so each card lands on a real adhesive label:
             label 63.5 x 46.6mm, 3 across x 6 down on A4 (210 x 297mm)
             across: 7.21 margin, then labels every 66.04mm (a 2.54mm gap)
             down:   8.7 margin, then labels every 46.6mm (no gap)
           The page itself has NO margin — the sheet's margins are built
           into each page's own padding instead — so the position of the
           labels doesn't depend on how a particular browser or printer
           treats page margins. The four --l* values are the per-device
           corrections from "Line the labels up with your printer". */
        @media print {
          .no-print { display: none !important; }
          @page { size: A4; margin: 0; }
          html, body { margin: 0 !important; padding: 0 !important; background: #FFFFFF !important; }
          .label-page { padding: 0 !important; margin: 0 !important; }
          .label-grid {
            display: grid;
            box-sizing: border-box;
            width: 209mm;
            height: 296mm;
            margin: 0 !important;
            padding: calc(8.7mm + var(--ly, 0mm)) 0 0 calc(7.21mm + var(--lx, 0mm));
            grid-template-columns: repeat(3, 63.5mm);
            grid-template-rows: repeat(6, calc(46.6mm + var(--lrp, 0mm)));
            column-gap: calc(2.54mm + var(--lcg, 0mm));
            row-gap: 0mm;
            justify-content: start;
            align-content: start;
            overflow: hidden;
            break-inside: avoid; page-break-inside: avoid;
            break-after: page; page-break-after: always;
          }
          .label-grid:last-of-type { break-after: auto; page-break-after: auto; }
          .label-outlines .label-card { outline: 0.25mm solid #000; outline-offset: -0.125mm; border-radius: 2mm; }
          .label-card {
            border: none; padding: 1mm 2.5mm; min-height: 0;
            width: 63.5mm; height: 46.6mm; align-self: start;
            box-sizing: border-box; overflow: hidden;
            break-inside: avoid;
            font-family: "Bookman Old Style", "URW Bookman", Georgia, "Times New Roman", serif;
          }
          .label-meta { font-size: 11px !important; color: #000 !important; font-weight: 700 !important; margin: 2.5px 0 !important; line-height: 1.1 !important; }
          .label-competition { font-size: 11px !important; color: #000 !important; font-weight: 700 !important; margin-bottom: 1px !important; line-height: 1.15 !important; }
          .label-name { font-size: var(--label-name-size, 17px) !important; font-weight: 700 !important; margin: 3px 0 !important; line-height: 1.12 !important; }
          .label-partners { font-size: 9px !important; color: #000 !important; margin-bottom: 1px !important; line-height: 1.1 !important; }
          .label-hcp { font-size: 11px !important; color: #000 !important; font-weight: 800 !important; margin-bottom: 2px !important; line-height: 1.1 !important; }
          .label-note { font-size: 10.5px !important; color: #000 !important; font-style: italic !important; font-weight: 600 !important; line-height: 1.15 !important; margin-top: 5px !important; }
        }
      `}</style>
    </div>
  );
}

// Printable draw for anyone without the app — reached from Admin. Two
// sheets, either or both: the draw in tee-time order, and an A–Z list
// of players each with their own tee time and playing partners. Shows
// the same handicap/tee/competition details as the public Draw tab, so
// paper and phone always agree.
// The society's name at the head of every printed sheet (draw and
// leaderboard): large, bold serif capitals in dark blue with a rule
// beneath, so it reads as the masthead rather than a small caption.
// Text colour prints reliably — unlike backgrounds, which browsers drop
// unless "Background graphics" is ticked.
const PRINT_ORG_NAME_STYLE = {
  fontFamily: '"Bookman Old Style", "URW Bookman", Georgia, "Times New Roman", serif',
  fontSize: 26, fontWeight: 800, letterSpacing: "0.06em", textTransform: "uppercase",
  color: BRAND.printColor, lineHeight: 1.15, paddingBottom: 5, marginBottom: 8, borderBottom: `3px solid ${BRAND.printColor}`,
  WebkitPrintColorAdjust: "exact", printColorAdjust: "exact",
};

// ---- Backup & restore ----
// A backup is the whole event — every day, draw, handicap, competition,
// score, the society roster, colours and PINs — written to one dated file
// on THIS device (it goes wherever the browser saves downloads). Restoring
// puts a chosen backup back as the live event for everyone. PDFs under
// Information are not inside the file (they're large, and stored
// separately); their list is, and the PDFs themselves are untouched.
function backupFileName(eventCode) {
  const d = new Date();
  const p = (n) => String(n).padStart(2, "0");
  return `${eventCode}-backup-${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}.json`;
}

function buildBackup(eventCode, state) {
  return JSON.stringify({ kind: "golf-event-backup", formatVersion: 1, eventCode, savedAt: new Date().toISOString(), appVersion: APP_VERSION, state }, null, 1);
}

function downloadTextFile(name, text) {
  const url = URL.createObjectURL(new Blob([text], { type: "application/json" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}

function describeState(st) {
  const rounds = Array.isArray(st.rounds) ? st.rounds : [];
  const people = new Set(rounds.flatMap((r) => (r.players || []).flatMap((p) => [p.name, p.partnerName])).filter(Boolean).map(normalizeName));
  const cards = rounds.reduce((n, r) => n + (r.players || []).filter((p) => (p.scores || []).some((v) => v !== "" && v != null)).length, 0);
  return `${rounds.length} day${rounds.length === 1 ? "" : "s"}, ${people.size} player${people.size === 1 ? "" : "s"}, ${cards} card${cards === 1 ? "" : "s"} with scores`;
}

function BackupRestore({ eventCode, state, onRestore, onBack, headerColor, accentColor }) {
  const fileRef = useRef(null);
  const lastKey = `golf-last-backup-${eventCode}`;
  const readLast = () => { try { return window.localStorage.getItem(lastKey) || ""; } catch { return ""; } };
  const [lastBackup, setLastBackup] = useState(readLast);
  const [msg, setMsg] = useState("");
  const [pending, setPending] = useState(null); // a backup file that's been read and is awaiting confirmation
  const canShare = typeof navigator !== "undefined" && typeof navigator.canShare === "function" && typeof File !== "undefined";

  const noteBackupTaken = () => {
    const when = new Date().toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
    try { window.localStorage.setItem(lastKey, when); } catch { /* ignore */ }
    setLastBackup(when);
  };

  const download = () => {
    const name = backupFileName(eventCode);
    downloadTextFile(name, buildBackup(eventCode, state));
    noteBackupTaken();
    setMsg(`Saved "${name}" to this device's downloads.`);
  };

  const share = async () => {
    try {
      const file = new File([buildBackup(eventCode, state)], backupFileName(eventCode), { type: "application/json" });
      if (!navigator.canShare({ files: [file] })) { download(); return; }
      await navigator.share({ files: [file], title: `${eventCode} backup` });
      noteBackupTaken();
      setMsg("Backup shared.");
    } catch {
      // cancelled — nothing to do
    }
  };

  const readFile = (e) => {
    const file = e.target.files && e.target.files[0];
    e.target.value = "";
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result || ""));
        const st = parsed && parsed.kind === "golf-event-backup" ? parsed.state : null;
        if (!st || !Array.isArray(st.rounds) || st.rounds.length === 0) throw new Error("not a backup");
        setPending({ fileName: file.name, eventCode: parsed.eventCode || "?", savedAt: parsed.savedAt || "", state: st });
        setMsg("");
      } catch {
        setPending(null);
        setMsg(`"${file.name}" isn't a backup file from this app — nothing has been changed.`);
      }
    };
    reader.readAsText(file);
  };

  const confirmRestore = () => {
    // Safety net first: keep a copy of what's about to be replaced.
    downloadTextFile(backupFileName(`${eventCode}-before-restore`), buildBackup(eventCode, state));
    onRestore(pending.state);
    setMsg(`Restored from "${pending.fileName}". A copy of what was there before has been saved to this device too, in case you need to go back.`);
    setPending(null);
  };

  const card = { background: "#FFFFFF", borderRadius: 10, padding: 14, border: "1px solid #E4E0D0", marginBottom: 12 };
  const bigBtn = (bg, fg, border) => ({ width: "100%", padding: "12px 0", borderRadius: 8, border: border || "none", background: bg, color: fg, fontWeight: 700, fontSize: 14 });
  const fmtWhen = (iso) => { const d = new Date(iso); return isNaN(d) ? "unknown time" : d.toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }); };

  return (
    <div style={{ padding: "12px 14px 40px" }}>
      <button onClick={onBack} style={{ background: "none", border: "none", color: headerColor, fontSize: 13, marginBottom: 10, padding: 0, fontWeight: 600 }}>
        ← Back
      </button>

      <div style={card}>
        <div style={{ fontSize: 14, fontWeight: 800, color: headerColor, marginBottom: 4 }}>Back up this event</div>
        <div style={{ fontSize: 12, color: "#6B6B5F", marginBottom: 10 }}>
          Saves everything in <strong>{eventCode}</strong> — {describeState(state)} — as one dated file on this device.
          Worth doing before each day's play, and again once the last card is in.
        </div>
        <button onClick={download} style={bigBtn(headerColor, "#FFFFFF")}>Download backup</button>
        {canShare && (
          <button onClick={share} style={{ ...bigBtn("transparent", headerColor, `1px solid ${headerColor}`), marginTop: 8 }}>
            Share / email backup instead
          </button>
        )}
        <div style={{ fontSize: 11.5, color: "#8A8774", marginTop: 8 }}>
          {lastBackup ? `Last backup taken on this device: ${lastBackup}.` : "No backup has been taken on this device yet."}
        </div>
      </div>

      <div style={card}>
        <div style={{ fontSize: 14, fontWeight: 800, color: "#B5442E", marginBottom: 4 }}>Restore from a backup</div>
        <div style={{ fontSize: 12, color: "#6B6B5F", marginBottom: 10 }}>
          Replaces the live event — for everyone — with the contents of a backup file. Anything entered since that
          backup was taken will be lost, so this is for putting right a mistake, not for everyday use.
        </div>
        <input ref={fileRef} type="file" accept=".json,application/json" style={{ display: "none" }} onChange={readFile} />
        {!pending ? (
          <button onClick={() => fileRef.current && fileRef.current.click()} style={bigBtn("transparent", "#B5442E", "1px solid #B5442E")}>
            Choose a backup file…
          </button>
        ) : (
          <div style={{ background: "#FDF2EF", border: "1px solid #B5442E", borderRadius: 8, padding: 12 }}>
            <div style={{ fontSize: 12.5, fontWeight: 700, marginBottom: 6 }}>{pending.fileName}</div>
            <div style={{ fontSize: 12, color: "#1B1B1B", marginBottom: 4 }}>Taken {fmtWhen(pending.savedAt)} · {describeState(pending.state)}</div>
            <div style={{ fontSize: 12, color: "#1B1B1B", marginBottom: 8 }}>Live event now: {describeState(state)}</div>
            {pending.eventCode !== eventCode && (
              <div style={{ fontSize: 12, fontWeight: 700, color: "#B5442E", marginBottom: 8 }}>
                Careful: this backup came from event {pending.eventCode}, not {eventCode}.
              </div>
            )}
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={confirmRestore} style={{ ...bigBtn("#B5442E", "#FFFFFF"), flex: 1, fontSize: 13 }}>Yes, replace the live event</button>
              <button onClick={() => setPending(null)} style={{ ...bigBtn("#FFFFFF", "#6B6B5F", "1px solid #D8D4C0"), flex: 1, fontSize: 13 }}>Cancel</button>
            </div>
          </div>
        )}
      </div>

      {msg && <div style={{ fontSize: 12.5, fontWeight: 600, color: headerColor, textAlign: "center", padding: "0 6px" }}>{msg}</div>}
    </div>
  );
}

// Printable leaderboard, reached from Admin. Two views: the selected
// day on its own (gross / net / points) or the running total across all
// days of the same format. Only cards that have been marked COMPLETE
// count, exactly as on the live leaderboard, so paper and phone agree.
function PrintLeaderboard({ rounds, activeRound, competitions, orgName, onBack, headerColor, initialFilter = "" }) {
  const isFoursomes = activeRound.format === "foursomes";
  const isMatchPlay = activeRound.format === "matchplay";
  const isMedal = activeRound.scoring === "medal";
  const [view, setView] = useState("day"); // day | overall
  const [compFilter, setCompFilter] = useState(initialFilter);
  const [cols, setCols] = useState({ gross: true, net: true, points: true });

  const sameFormatRounds = rounds.filter((r) => r.format !== "matchplay" && (r.format === "foursomes") === isFoursomes);

  const compName = (abbr) => { const c = competitions.find((x) => x.abbreviation === abbr); return (c && c.fullName) || abbr; };

  // ---- This day ----
  const dayPlayers = playersOnDay(activeRound).filter((p) => p.name);
  const compsInUse = [...new Set(dayPlayers.flatMap((p) => [p.competition, p.partnerName ? p.partnerCompetition : null]).filter(Boolean))];
  const totalHoles = activeRound.course.holes.length;
  // filter: "" = everyone, an abbreviation = that competition only,
  // "__none__" = players not tagged into any competition.
  const inFilter = (p, filter) => {
    if (!filter) return true;
    if (filter === "__none__") return !p.competition && !(p.partnerName && p.partnerCompetition);
    return p.competition === filter || (p.partnerName && p.partnerCompetition === filter);
  };
  const dayRowsFor = (filter) => dayPlayers
    .filter((p) => inFilter(p, filter))
    .map((p) => {
      const t = totals(activeRound.course, forLeaderboard(p), activeRound.handicapAllowance, isFoursomes);
      const complete = t.thru === totalHoles && !t.nr;
      return {
        name: isFoursomes && p.partnerName ? `${p.name} & ${p.partnerName}` : p.name,
        ph: t.ph,
        adjusted: !!(Number(p.handicapAdjustment) || (isFoursomes && Number(p.partnerHandicapAdjustment))),
        thru: t.thru,
        gross: complete ? t.grossTotal : null,
        net: complete ? t.netTotal : null,
        points: t.thru > 0 ? t.pts : null,
        // what the ranking is decided on: net for Medal, points otherwise
        sortValue: isMedal ? (complete ? t.netTotal : null) : (t.thru > 0 ? t.pts : null),
      };
    })
    .sort((a, b) => {
      if (a.sortValue === null && b.sortValue === null) return a.name.localeCompare(b.name);
      if (a.sortValue === null) return 1;
      if (b.sortValue === null) return -1;
      return isMedal ? a.sortValue - b.sortValue : b.sortValue - a.sortValue;
    });
  // Level scores share a position ("3=") — the app doesn't do countback.
  const withPositions = (rows, valueOf) => {
    let lastValue = null, lastPos = 0;
    return rows.map((row, i) => {
      const v = valueOf(row);
      if (v === null) return { ...row, pos: "" };
      const pos = v === lastValue ? lastPos : i + 1;
      lastValue = v; lastPos = pos;
      return { ...row, pos };
    }).map((row, i, all) => {
      if (row.pos === "") return row;
      const tied = all.filter((o) => o.pos === row.pos).length > 1;
      return { ...row, pos: tied ? `${row.pos}=` : `${row.pos}` };
    });
  };
  const dayRankedFor = (filter) => withPositions(dayRowsFor(filter), (r) => r.sortValue);

  // ---- Overall ----
  const overallRankedFor = (filter) => withPositions(
    (isFoursomes ? combinedPairStandings(sameFormatRounds) : combinedStandings(sameFormatRounds, filter))
      .map((r) => ({ ...r, sortValue: r.anyPlayed ? r.total : null })).sort((a, b) => {
        if (a.sortValue === null && b.sortValue === null) return a.name.localeCompare(b.name);
        if (a.sortValue === null) return 1;
        if (b.sortValue === null) return -1;
        return b.sortValue - a.sortValue;
      }),
    (r) => r.sortValue
  );

  // What actually gets printed: one section normally, or — with "Each
  // competition separately" — one section per competition, each ranked
  // on its own and each starting on a fresh page.
  const canFilter = !(view === "overall" && isFoursomes);
  const activeFilter = canFilter ? compFilter : "";
  let sections;
  if (activeFilter === "__split__") {
    sections = compsInUse.map((abbr) => ({ key: abbr, heading: compName(abbr), filter: abbr }));
    if (view === "day" && dayPlayers.some((p) => inFilter(p, "__none__"))) {
      sections.push({ key: "__none__", heading: "Not in a competition", filter: "__none__" });
    }
  } else {
    sections = [{ key: activeFilter || "all", heading: activeFilter ? compName(activeFilter) : "", filter: activeFilter }];
  }
  sections = sections
    .map((sec) => ({ ...sec, rows: view === "day" ? dayRankedFor(sec.filter) : overallRankedFor(sec.filter) }))
    .filter((sec) => sec.rows.length > 0);

  const th = { textAlign: "left", padding: "5px 8px", fontSize: 11, fontWeight: 700, borderBottom: "2px solid #000", whiteSpace: "nowrap" };
  const thR = { ...th, textAlign: "right" };
  const td = { padding: "6px 8px", fontSize: 13, borderBottom: "1px solid #999" };
  const tdR = { ...td, textAlign: "right" };
  const pill = (active) => ({
    flex: 1, padding: "8px 6px", borderRadius: 8, fontSize: 12.5, fontWeight: 700, border: `1px solid ${headerColor}`,
    background: active ? headerColor : "#FFFFFF", color: active ? "#FFFFFF" : headerColor,
  });
  const nothingToPrint = isMatchPlay || sections.length === 0;
  const printedAt = new Date().toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

  return (
    <div style={{ padding: "12px 14px 40px" }}>
      <div className="no-print" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <button onClick={onBack} style={{ background: "none", border: "none", color: headerColor, fontSize: 13, padding: 0, fontWeight: 600 }}>
          ← Back
        </button>
        <button
          onClick={() => window.print()}
          disabled={nothingToPrint}
          style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 16px", borderRadius: 8, border: "none", background: headerColor, color: "#FFFFFF", fontWeight: 700, fontSize: 13.5, opacity: nothingToPrint ? 0.5 : 1 }}
        >
          <Printer size={15} /> Print
        </button>
      </div>
      <div className="no-print" style={{ display: "flex", gap: 6, marginBottom: 8 }}>
        <button onClick={() => setView("day")} style={pill(view === "day")}>{activeRound.label} only</button>
        <button onClick={() => setView("overall")} style={pill(view === "overall")}>Overall ({sameFormatRounds.length} day{sameFormatRounds.length === 1 ? "" : "s"})</button>
      </div>
      {compsInUse.length > 0 && !(view === "overall" && isFoursomes) && (
        <select
          className="no-print"
          value={compFilter}
          onChange={(e) => setCompFilter(e.target.value)}
          style={{ width: "100%", fontSize: 13, fontWeight: 600, padding: "8px 10px", borderRadius: 7, border: "1px solid #D8D4C0", marginBottom: 8, background: "#FFF" }}
        >
          <option value="">Everyone together</option>
          {compsInUse.length > 0 && <option value="__split__">Each competition separately (one page each)</option>}
          {compsInUse.map((abbr) => <option key={abbr} value={abbr}>{compName(abbr)} only</option>)}
        </select>
      )}
      {view === "day" && (
        <div className="no-print" style={{ display: "flex", gap: 6, marginBottom: 8 }}>
          {[["gross", "Gross"], ["net", "Net"], ["points", "Points"]].map(([k, label]) => (
            <button key={k} onClick={() => setCols((c) => ({ ...c, [k]: !c[k] }))} style={{ ...pill(cols[k]), fontSize: 11.5, padding: "6px 4px" }}>
              {cols[k] ? "✓ " : ""}{label}
            </button>
          ))}
        </div>
      )}
      <div className="no-print" style={{ fontSize: 11.5, color: "#6B6B5F", marginBottom: 14 }}>
        Preview below — prints on A4. Only cards marked COMPLETE are counted, the same as the live leaderboard.
        Players level on {isMedal && view === "day" ? "net score" : "points"} share a position (shown as "3="); any countback is for you to apply.
      </div>

      {isMatchPlay ? (
        <div style={{ padding: "30px 12px", textAlign: "center", color: "#6B6B5F", fontSize: 14 }}>
          {activeRound.label} is a Match Play day, which has no leaderboard. Switch to another day to print one.
        </div>
      ) : nothingToPrint ? (
        <div style={{ padding: "30px 12px", textAlign: "center", color: "#6B6B5F", fontSize: 14 }}>No players to show yet.</div>
      ) : (
        <div className="print-area" style={{ background: "#FFFFFF", color: "#000", padding: 14, borderRadius: 10, border: "1px solid #E4E0D0" }}>
          {sections.map((sec, secIdx) => (
            <div key={sec.key} className={secIdx > 0 ? "print-newpage" : ""} style={{ marginTop: secIdx > 0 ? 28 : 0 }}>
          <div style={{ marginBottom: 10 }}>
            {orgName && (
              <div style={{ ...PRINT_ORG_NAME_STYLE, display: "flex", alignItems: "center", gap: 12 }}>
                <SocietyLogo orgName={orgName} height={70} />
                <span>{orgName}</span>
              </div>
            )}
            <div style={{ fontSize: 20, fontWeight: 800, lineHeight: 1.2 }}>
              {view === "day" ? `${activeRound.label} — Leaderboard` : `Overall Leaderboard${isFoursomes ? " — Foursomes" : ""}`}
              {sec.heading ? ` — ${sec.heading}` : ""}
            </div>
            <div style={{ fontSize: 13, marginTop: 2 }}>
              {view === "day"
                ? [activeRound.course.name, formatDisplayDateLong(activeRound.date), isMedal ? "Medal" : "Stableford", activeRound.handicapAllowance !== 100 ? `${activeRound.handicapAllowance}% allowance` : ""].filter(Boolean).join("  ·  ")
                : sameFormatRounds.map((r) => r.label).join("  ·  ")}
            </div>
          </div>
          {view === "day" ? (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={{ ...th, width: 36 }}>Pos</th>
                  <th style={th}>{isFoursomes ? "Pair" : "Player"}</th>
                  <th style={thR}>HCP</th>
                  {cols.gross && <th style={thR}>Gross</th>}
                  {cols.net && <th style={thR}>Net</th>}
                  {cols.points && <th style={thR}>Points</th>}
                </tr>
              </thead>
              <tbody>
                {sec.rows.map((r) => (
                  <tr key={r.name} className="print-row">
                    <td className="mono" style={{ ...td, fontWeight: 700 }}>{r.pos}</td>
                    <td style={{ ...td, fontWeight: 600 }}>{r.name}</td>
                    <td className="mono" style={tdR}>{r.ph}{r.adjusted ? "*" : ""}</td>
                    {cols.gross && <td className="mono" style={tdR}>{r.gross !== null ? r.gross : r.thru > 0 ? "NR" : "–"}</td>}
                    {cols.net && <td className="mono" style={{ ...tdR, fontWeight: isMedal ? 800 : 400 }}>{r.net !== null ? r.net : r.thru > 0 ? "NR" : "–"}</td>}
                    {cols.points && <td className="mono" style={{ ...tdR, fontWeight: isMedal ? 400 : 800 }}>{r.points !== null ? r.points : "–"}</td>}
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={{ ...th, width: 36 }}>Pos</th>
                  <th style={th}>{isFoursomes ? "Pair" : "Player"}</th>
                  {sameFormatRounds.map((r) => <th key={r.id} style={thR}>{r.label}</th>)}
                  <th style={thR}>Total</th>
                </tr>
              </thead>
              <tbody>
                {sec.rows.map((row) => (
                  <tr key={row.name} className="print-row">
                    <td className="mono" style={{ ...td, fontWeight: 700 }}>{row.pos}</td>
                    <td style={{ ...td, fontWeight: 600 }}>{row.name}</td>
                    {sameFormatRounds.map((r) => {
                      const t = row.perRound[r.id];
                      return <td key={r.id} className="mono" style={tdR}>{t && t.thru > 0 ? t.pts : "–"}</td>;
                    })}
                    <td className="mono" style={{ ...tdR, fontWeight: 800 }}>{row.anyPlayed ? row.total : "–"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
              <div style={{ fontSize: 10, marginTop: 8, color: "#444" }}>
                {view === "day" && sec.rows.some((r) => r.adjusted) ? `${ADJUSTED_FOOTNOTE}  ·  ` : ""}Printed {printedAt}
              </div>
            </div>
          ))}
        </div>
      )}

      <style>{`
        @media print {
          .no-print { display: none !important; }
          @page { size: A4; margin: 12mm; }
          body { background: #FFFFFF !important; }
          .print-area { border: none !important; padding: 0 !important; border-radius: 0 !important; }
          .print-row { break-inside: avoid; page-break-inside: avoid; }
          .print-newpage { break-before: page; page-break-before: always; margin-top: 0 !important; }
          thead { display: table-header-group; }
        }
      `}</style>
    </div>
  );
}

function PrintDraw({ draw, players, course, handicapAllowance, isFoursomes, visOpts, startingHole, drawNote, roundLabel, roundDateDisplay, orgName, onBack, headerColor }) {
  const [which, setWhich] = useState("both"); // times | individual | both
  const { showIndex, showCH, showTee, showComp, showStartTee } = visOpts;
  const anyStartTee = showStartTee && draw.some((e) => e.startTee);

  const individualRows = draw
    .flatMap((entry) =>
      (entry.players || []).filter(Boolean).map((name) => ({
        name,
        time: entry.time,
        startTee: entry.startTee || "",
        tee: (findIndividualByName(players, name) || {}).tee || course.tees[0]?.label || "",
        others: (entry.players || []).filter((n) => n && n !== name),
      }))
    )
    .sort((a, b) => a.name.localeCompare(b.name));

  const sheetHeader = (subtitle) => (
    <div style={{ marginBottom: 10 }}>
      {orgName && (
              <div style={{ ...PRINT_ORG_NAME_STYLE, display: "flex", alignItems: "center", gap: 12 }}>
                <SocietyLogo orgName={orgName} height={70} />
                <span>{orgName}</span>
              </div>
            )}
      <div style={{ fontSize: 20, fontWeight: 800, lineHeight: 1.2 }}>{roundLabel} — {subtitle}</div>
      <div style={{ fontSize: 13, marginTop: 2 }}>
        {[course.name, roundDateDisplay, startingHole && startingHole.trim() ? `Starting from the ${startingHole} tee` : ""].filter(Boolean).join("  ·  ")}
      </div>
      {drawNote && drawNote.trim() && (
        <div style={{ fontSize: 12.5, fontWeight: 600, marginTop: 6, padding: "5px 8px", border: "1px solid #000" }}>{drawNote}</div>
      )}
    </div>
  );

  const th = { textAlign: "left", padding: "5px 8px", fontSize: 11, fontWeight: 700, borderBottom: "2px solid #000", whiteSpace: "nowrap" };
  const td = { padding: "6px 8px", fontSize: 13, borderBottom: "1px solid #999", verticalAlign: "top" };
  const timeCell = { ...td, fontWeight: 800, fontSize: 14, whiteSpace: "nowrap" };

  const timesSheet = (
    <div className="print-sheet">
      {sheetHeader("Draw")}
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th style={th}>Tee Time</th>
            {anyStartTee && <th style={th}>Start</th>}
            <th style={th}>Players</th>
          </tr>
        </thead>
        <tbody>
          {draw.map((entry) => (
            <tr key={entry.id} className="print-row">
              <td className="mono" style={timeCell}>{entry.time}</td>
              {anyStartTee && <td style={{ ...td, fontWeight: 700, whiteSpace: "nowrap" }}>{entry.startTee || ""}</td>}
              <td style={td}>
                {entry.players && entry.players.filter(Boolean).length > 0
                  ? formatGroupLines(entry.players, course, players, handicapAllowance, isFoursomes, { showIndex, showCH, showTee, showComp }).map((line, i) => (
                      <div key={i} style={{ marginBottom: 1 }}>{withBoldFigures(line)}</div>
                    ))
                  : entry.group || "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {(showIndex || showCH) && anyHandicapAdjusted(players) && (
        <div style={{ fontSize: 11, fontStyle: "italic", marginTop: 6 }}>{ADJUSTED_FOOTNOTE}</div>
      )}
    </div>
  );

  const individualSheet = (
    <div className="print-sheet">
      {sheetHeader("Draw by Player (A–Z)")}
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th style={th}>Player</th>
            <th style={th}>Tee Time</th>
            {anyStartTee && <th style={th}>Start</th>}
            {showTee && <th style={th}>Tee</th>}
            <th style={th}>Playing With</th>
          </tr>
        </thead>
        <tbody>
          {individualRows.map((r) => (
            <tr key={r.name} className="print-row">
              <td style={{ ...td, fontWeight: 700, whiteSpace: "nowrap" }}>{r.name}</td>
              <td className="mono" style={timeCell}>{r.time}</td>
              {anyStartTee && <td style={{ ...td, whiteSpace: "nowrap" }}>{r.startTee}</td>}
              {showTee && <td style={{ ...td, whiteSpace: "nowrap" }}>{r.tee}</td>}
              <td style={td}>{r.others.join(", ") || "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const choice = (value, label) => (
    <button
      onClick={() => setWhich(value)}
      style={{
        flex: 1, padding: "8px 6px", borderRadius: 8, fontSize: 12.5, fontWeight: 700,
        border: `1px solid ${headerColor}`,
        background: which === value ? headerColor : "#FFFFFF",
        color: which === value ? "#FFFFFF" : headerColor,
      }}
    >
      {label}
    </button>
  );

  return (
    <div style={{ padding: "12px 14px 40px" }}>
      <div className="no-print" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <button onClick={onBack} style={{ background: "none", border: "none", color: headerColor, fontSize: 13, padding: 0, fontWeight: 600 }}>
          ← Back
        </button>
        <button
          onClick={() => window.print()}
          disabled={draw.length === 0}
          style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 16px", borderRadius: 8, border: "none", background: headerColor, color: "#FFFFFF", fontWeight: 700, fontSize: 13.5, opacity: draw.length === 0 ? 0.5 : 1 }}
        >
          <Printer size={15} /> Print
        </button>
      </div>
      <div className="no-print" style={{ display: "flex", gap: 6, marginBottom: 8 }}>
        {choice("both", "Both sheets")}
        {choice("times", "Tee time order")}
        {choice("individual", "By player")}
      </div>
      <div className="no-print" style={{ fontSize: 11.5, color: "#6B6B5F", marginBottom: 14 }}>
        Preview below. Prints on A4; with "Both sheets" the by-player list starts on a new page. Handicaps, tees and
        competitions follow the "Show on public draw tab" switches in Draw setup, so paper matches what players see.
      </div>

      {draw.length === 0 ? (
        <div style={{ padding: "30px 12px", textAlign: "center", color: "#6B6B5F", fontSize: 14 }}>
          There's no draw for {roundLabel} yet — add one under Draw first.
        </div>
      ) : (
        <div className="print-area" style={{ background: "#FFFFFF", color: "#000", padding: 14, borderRadius: 10, border: "1px solid #E4E0D0" }}>
          {(which === "both" || which === "times") && timesSheet}
          {which === "both" && <div className="print-break" style={{ height: 24 }} />}
          {(which === "both" || which === "individual") && individualSheet}
        </div>
      )}

      <style>{`
        @media print {
          .no-print { display: none !important; }
          @page { size: A4; margin: 12mm; }
          body { background: #FFFFFF !important; }
          .print-area { border: none !important; padding: 0 !important; border-radius: 0 !important; }
          .print-break { break-after: page; page-break-after: always; height: 0 !important; }
          .print-row { break-inside: avoid; page-break-inside: avoid; }
          thead { display: table-header-group; }
        }
      `}</style>
    </div>
  );
}

function MatchesSetup({ matches, players, onAdd, onUpdate, onRemove, onBack, headerColor, accentColor }) {
  const [confirmRemoveId, setConfirmRemoveId] = useState(null);
  const namedPlayers = players.filter((p) => p.name);

  const sideSelect = (label, value, onChange) => (
    <select
      value={value}
      onChange={onChange}
      style={{ flex: 1, fontSize: 13, padding: "7px 6px", borderRadius: 7, border: "1px solid #D8D4C0", background: "#FFF", minWidth: 0 }}
    >
      <option value="">{label}</option>
      {namedPlayers.map((p) => (
        <option key={p.id} value={p.name}>{p.name}{p.index ? ` (${p.index}${p.tee ? ` · ${p.tee}` : ""})` : ""}</option>
      ))}
    </select>
  );

  return (
    <div style={{ padding: "12px 14px 40px" }}>
      <button onClick={onBack} style={{ background: "none", border: "none", color: headerColor, fontSize: 13, marginBottom: 10, padding: 0, fontWeight: 600 }}>
        ← Back
      </button>

      <div style={{ background: "#FFFFFF", borderRadius: 10, padding: 14, border: "1px solid #E4E0D0" }}>
        <div style={{ fontSize: 12.5, fontWeight: 700, marginBottom: 6 }}>Matches</div>
        <div style={{ fontSize: 11.5, color: "#6B6B5F", marginBottom: 12 }}>
          Pick each side's player (and, for a Foursomes match, their partner too — leave blank for a Singles
          match), then type in the final result once it's known (e.g. "3&2", "1 up", "AS" for a halved match).
          Leave the result blank until the match has been played. Each player's own course handicap is shown from
          their tee — working out the actual match allowance between them is up to the players.
        </div>

        {namedPlayers.length < 2 && (
          <div style={{ fontSize: 12, color: "#9B9885", marginBottom: 12 }}>
            Add at least two players to this day first — via Enter scores, the Society Roster, or a paste/CSV
            import — before setting up matches.
          </div>
        )}

        {matches.map((m) => (
          <div key={m.id} style={{ borderTop: "1px solid #EFEDE0", paddingTop: 10, marginTop: 10 }}>
            <div style={{ fontSize: 10, letterSpacing: "0.06em", textTransform: "uppercase", color: "#8A8774", marginBottom: 3 }}>Side A</div>
            <div style={{ display: "flex", gap: 6, marginBottom: 6 }}>
              {sideSelect("Player…", m.playerA, (e) => onUpdate(m.id, { playerA: e.target.value }))}
              {sideSelect("+ Partner (optional)…", m.partnerA, (e) => onUpdate(m.id, { partnerA: e.target.value }))}
            </div>
            <div style={{ textAlign: "center", fontSize: 12, color: "#8A8774", fontWeight: 700, marginBottom: 6 }}>v</div>
            <div style={{ fontSize: 10, letterSpacing: "0.06em", textTransform: "uppercase", color: "#8A8774", marginBottom: 3 }}>Side B</div>
            <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
              {sideSelect("Player…", m.playerB, (e) => onUpdate(m.id, { playerB: e.target.value }))}
              {sideSelect("+ Partner (optional)…", m.partnerB, (e) => onUpdate(m.id, { partnerB: e.target.value }))}
            </div>
            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
              <input
                value={m.result}
                onChange={(e) => onUpdate(m.id, { result: e.target.value })}
                placeholder="Result — e.g. 3&2, 1 up, AS"
                style={{ flex: 1, fontSize: 13, padding: "7px 9px", borderRadius: 7, border: "1px solid #D8D4C0", fontFamily: "inherit" }}
              />
              {confirmRemoveId === m.id ? (
                <div style={{ display: "flex", gap: 2 }}>
                  <button onClick={() => { onRemove(m.id); setConfirmRemoveId(null); }} style={{ fontSize: 10.5, fontWeight: 700, color: "#B5442E", background: "none", border: "none", padding: "4px" }}>
                    Yes
                  </button>
                  <button onClick={() => setConfirmRemoveId(null)} style={{ fontSize: 10.5, color: "#9B9885", background: "none", border: "none", padding: "4px" }}>
                    No
                  </button>
                </div>
              ) : (
                <button onClick={() => setConfirmRemoveId(m.id)} style={{ background: "none", border: "none", color: "#B5442E", padding: "4px" }}>
                  <X size={15} />
                </button>
              )}
            </div>
          </div>
        ))}

        <button
          onClick={onAdd}
          disabled={namedPlayers.length < 2}
          style={{
            width: "100%", padding: "9px 0", borderRadius: 7, border: `1px dashed ${namedPlayers.length < 2 ? "#D8D4C0" : headerColor}`,
            background: "transparent", color: namedPlayers.length < 2 ? "#D8D4C0" : headerColor, fontWeight: 600, fontSize: 12.5, marginTop: 12,
            display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
          }}
        >
          <Plus size={13} /> Add match
        </button>
      </div>
    </div>
  );
}

function SocietyRosterSetup({ onClearAll, roster, onAdd, onUpdate, onRemove, onImport, course, roundPlayers, roundLabel, onAddToRound, onBack, headerColor, accentColor }) {
  const [pasteOpen, setPasteOpen] = useState(false);
  const [pasteText, setPasteText] = useState("");
  const [importMsg, setImportMsg] = useState("");
  const [confirmRemoveId, setConfirmRemoveId] = useState(null);
  const [genderFilter, setGenderFilter] = useState("all"); // all | ladies | gents
  const [confirmClearRoster, setConfirmClearRoster] = useState(false);

  const alphaSorted = [...roster]
    .filter((m) => genderFilter === "all" || (genderFilter === "ladies" ? m.isLady : !m.isLady))
    .sort((a, b) => (a.name || "").localeCompare(b.name || ""));

  const doImport = () => {
    const parsed = parsePastedPlayers(pasteText, course);
    if (parsed.length === 0) {
      setImportMsg("No rows found — check there's a name in the first column.");
      return;
    }
    const added = onImport(parsed);
    const skipped = parsed.length - added;
    setImportMsg(
      `Added ${added} member${added === 1 ? "" : "s"}.` + (skipped > 0 ? ` ${skipped} already on the roster, skipped.` : "")
    );
    setPasteText("");
    setPasteOpen(false);
  };

  return (
    <div style={{ padding: "12px 14px 40px" }}>
      <button onClick={onBack} style={{ background: "none", border: "none", color: headerColor, fontSize: 13, marginBottom: 10, padding: 0, fontWeight: 600 }}>
        ← Back
      </button>

      <div style={{ background: "#FFFFFF", borderRadius: 10, padding: 14, border: "1px solid #E4E0D0", marginBottom: 12 }}>
        <div style={{ fontSize: 12.5, fontWeight: 700, marginBottom: 6 }}>Society roster</div>
        <div style={{ fontSize: 11.5, color: "#6B6B5F", marginBottom: 12 }}>
          Every member of your society, entered once with their current handicap. When building a day's draw, pull
          people straight in from here instead of re-typing or re-pasting names each time — this list is completely
          separate from any single day's own player list, and updating it here doesn't change anyone already added
          to a day.
        </div>

        {!pasteOpen ? (
          <button
            onClick={() => { setPasteOpen(true); setImportMsg(""); }}
            style={{
              width: "100%", padding: "11px 0", borderRadius: 8, border: `1px solid ${headerColor}`,
              background: "transparent", color: headerColor, fontWeight: 600, fontSize: 13, marginBottom: 12,
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            }}
          >
            <Clipboard size={14} /> Bulk-add (paste from spreadsheet)
          </button>
        ) : (
          <div style={{ background: "#FAF8F0", borderRadius: 8, padding: 10, border: `1px solid ${headerColor}`, marginBottom: 12 }}>
            <div style={{ fontSize: 11, color: "#6B6B5F", marginBottom: 6 }}>
              Name, Handicap Index, Tee — one member per line. Header row optional. Anyone already on the roster
              (matched by name) is skipped, not duplicated.
            </div>
            <textarea
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
              placeholder={"A. Whitmore\t8.4\tBack\nR. Okonkwo\t14.1\tFront"}
              rows={6}
              className="mono"
              style={{ width: "100%", fontSize: 12, padding: 8, borderRadius: 7, border: "1px solid #D8D4C0", resize: "vertical", fontFamily: "inherit", boxSizing: "border-box" }}
            />
            <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
              <button
                onClick={doImport}
                style={{ flex: 1, padding: "9px 0", borderRadius: 7, border: "none", background: headerColor, color: "#FFFFFF", fontWeight: 600, fontSize: 12.5 }}
              >
                Import
              </button>
              <button
                onClick={() => { setPasteOpen(false); setImportMsg(""); }}
                style={{ flex: 1, padding: "9px 0", borderRadius: 7, border: "1px solid #D8D4C0", background: "transparent", color: "#6B6B5F", fontWeight: 600, fontSize: 12.5 }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
        {importMsg && !pasteOpen && (
          <div style={{ fontSize: 11.5, color: headerColor, textAlign: "center", marginBottom: 8 }}>{importMsg}</div>
        )}

        {roster.length > 0 && (
          <div style={{ marginBottom: 12 }}>
            {confirmClearRoster ? (
              <div style={{ background: "#FDF2EF", border: "1px solid #B5442E", borderRadius: 8, padding: 10 }}>
                <div style={{ fontSize: 12.5, fontWeight: 700, color: "#B5442E", marginBottom: 4 }}>
                  Remove all {roster.length} member{roster.length === 1 ? "" : "s"} from the Society roster?
                </div>
                <div style={{ fontSize: 11.5, color: "#6B6B5F", marginBottom: 8 }}>
                  This only empties this list. Players already on a day's draw or scoresheet are not touched.
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    onClick={() => { onClearAll(roster.map((m) => m.id)); setConfirmClearRoster(false); setImportMsg("Society roster emptied."); }}
                    style={{ flex: 1, padding: "9px 0", borderRadius: 7, border: "none", background: "#B5442E", color: "#FFFFFF", fontWeight: 700, fontSize: 12.5 }}
                  >
                    Yes, remove them all
                  </button>
                  <button
                    onClick={() => setConfirmClearRoster(false)}
                    style={{ flex: 1, padding: "9px 0", borderRadius: 7, border: "1px solid #D8D4C0", background: "#FFFFFF", color: "#6B6B5F", fontWeight: 600, fontSize: 12.5 }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ textAlign: "right" }}>
                <button onClick={() => setConfirmClearRoster(true)} style={{ fontSize: 11.5, color: "#B5442E", background: "none", border: "none", padding: "2px 0" }}>
                  Empty the whole roster ({roster.length})
                </button>
              </div>
            )}
          </div>
        )}

        <div style={{ fontSize: 11, color: "#8A8774", marginBottom: 4 }}>
          Tap <Plus size={11} style={{ verticalAlign: "middle" }} /> to add someone straight into <strong>{roundLabel}</strong>'s draw.
        </div>

        <div style={{ display: "flex", gap: 6, margin: "10px 0" }}>
          {[
            { key: "all", label: "All" },
            { key: "ladies", label: "Ladies" },
            { key: "gents", label: "Gents" },
          ].map((opt) => (
            <button
              key={opt.key}
              onClick={() => setGenderFilter(opt.key)}
              style={{
                flex: 1, padding: "7px 0", borderRadius: 7, border: `1px solid ${headerColor}`,
                background: genderFilter === opt.key ? headerColor : "transparent",
                color: genderFilter === opt.key ? "#FFFFFF" : headerColor, fontWeight: 600, fontSize: 12,
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {alphaSorted.map((m) => (
          <div
            key={m.id}
            style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6, borderTop: "1px solid #EFEDE0", paddingTop: 8 }}
          >
            <input
              value={m.name}
              onChange={(e) => onUpdate(m.id, { name: e.target.value })}
              placeholder="Name"
              style={{ flex: 2, fontSize: 13, fontWeight: 600, padding: "7px 9px", borderRadius: 7, border: "1px solid #D8D4C0", minWidth: 0 }}
            />
            <input
              value={m.index}
              onChange={(e) => onUpdate(m.id, { index: e.target.value })}
              placeholder="HCP"
              inputMode="decimal"
              className="mono"
              style={{ width: 56, fontSize: 13, padding: "7px 6px", borderRadius: 7, border: "1px solid #D8D4C0" }}
            />
            <select
              value={m.tee}
              onChange={(e) => onUpdate(m.id, { tee: e.target.value })}
              style={{ width: 76, fontSize: 12, padding: "7px 4px", borderRadius: 7, border: "1px solid #D8D4C0", background: "#FFF" }}
            >
              {course.tees.map((t) => (
                <option key={t.id} value={t.label}>{t.label}</option>
              ))}
            </select>
            <button
              onClick={() => onUpdate(m.id, { isLady: !m.isLady })}
              title={m.isLady ? "Marked as a lady — tap to unmark" : "Tap to mark as a lady"}
              style={{
                width: 26, height: 26, borderRadius: "50%", flexShrink: 0,
                border: `1px solid ${m.isLady ? accentColor : "#D8D4C0"}`,
                background: m.isLady ? accentColor : "transparent",
                color: m.isLady ? "#FFFFFF" : "#9B9885",
                fontWeight: 700, fontSize: 13, lineHeight: "24px", padding: 0,
              }}
            >
              L
            </button>
            {roundPlayers.some((p) => normalizeName(p.name) === normalizeName(m.name)) ? (
              <span
                title={`Already in ${roundLabel}`}
                style={{ width: 30, textAlign: "center", color: accentColor, fontSize: 15 }}
              >
                ✓
              </span>
            ) : (
              <button
                onClick={() => onAddToRound(m.id)}
                title={`Add to ${roundLabel}`}
                style={{ width: 30, background: "none", border: "none", color: headerColor, padding: "4px" }}
              >
                <Plus size={16} />
              </button>
            )}
            {confirmRemoveId === m.id ? (
              <div style={{ display: "flex", gap: 2 }}>
                <button onClick={() => { onRemove(m.id); setConfirmRemoveId(null); }} style={{ fontSize: 10.5, fontWeight: 700, color: "#B5442E", background: "none", border: "none", padding: "4px" }}>
                  Yes
                </button>
                <button onClick={() => setConfirmRemoveId(null)} style={{ fontSize: 10.5, color: "#9B9885", background: "none", border: "none", padding: "4px" }}>
                  No
                </button>
              </div>
            ) : (
              <button onClick={() => setConfirmRemoveId(m.id)} style={{ background: "none", border: "none", color: "#B5442E", padding: "4px" }}>
                <X size={15} />
              </button>
            )}
          </div>
        ))}

        <button
          onClick={onAdd}
          style={{
            width: "100%", padding: "9px 0", borderRadius: 7, border: `1px dashed ${headerColor}`,
            background: "transparent", color: headerColor, fontWeight: 600, fontSize: 12.5, marginTop: 10,
            display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
          }}
        >
          <Plus size={13} /> Add member
        </button>
      </div>
    </div>
  );
}

function CompetitionsSetup({ competitions, onAdd, onUpdate, onRemove, allPlayers, onBulkTag, onBack, headerColor, accentColor, roundLabel }) {
  const [bulkTarget, setBulkTarget] = useState(""); // abbreviation being edited, or "" if none chosen
  const [selectedNames, setSelectedNames] = useState(new Set());

  const chooseBulkTarget = (abbreviation) => {
    setBulkTarget(abbreviation);
    setSelectedNames(new Set(allPlayers.filter((p) => p.competition === abbreviation).map((p) => p.name)));
  };

  const toggleName = (name) => {
    setSelectedNames((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  const [savedMsg, setSavedMsg] = useState(false);
  const apply = () => {
    onBulkTag([...selectedNames], bulkTarget);
    setSavedMsg(true);
    setTimeout(() => setSavedMsg(false), 1500);
  };

  return (
    <div style={{ padding: "12px 14px 40px" }}>
      <button onClick={onBack} style={{ background: "none", border: "none", color: headerColor, fontSize: 13, marginBottom: 10, padding: 0, fontWeight: 600 }}>
        ← Back
      </button>

      <div style={{ background: "#FFFFFF", borderRadius: 10, padding: 14, border: "1px solid #E4E0D0" }}>
        <div style={{ fontSize: 12.5, fontWeight: 700, marginBottom: 6 }}>Competitions{roundLabel ? ` — ${roundLabel}` : ""}</div>
        <div style={{ fontSize: 11.5, color: "#6B6B5F", marginBottom: 12 }}>
          Sub-competitions running alongside the main one — e.g. a seniors' trophy or a ladies' event. Give each a
          short abbreviation (matched automatically when you paste a draw with that abbreviation next to a name,
          or add it here yourself) and a full name for display. This list belongs to this day only — every day
          keeps its own competitions, so setting these up here never changes what any other day has.
        </div>
        {competitions.map((c) => (
          <div key={c.id} style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 8 }}>
            <input
              value={c.abbreviation}
              onChange={(e) => onUpdate(c.id, { abbreviation: e.target.value.toUpperCase() })}
              placeholder="JHB"
              className="mono"
              style={{ width: 64, fontSize: 13, fontWeight: 700, border: "1px solid #D8D4C0", borderRadius: 6, padding: "6px 8px" }}
            />
            <input
              value={c.fullName}
              onChange={(e) => onUpdate(c.id, { fullName: e.target.value })}
              placeholder="John Hay Bowl"
              style={{ flex: 1, fontSize: 13, border: "1px solid #D8D4C0", borderRadius: 6, padding: "6px 8px", fontFamily: "inherit" }}
            />
            <button onClick={() => onRemove(c.id)} style={{ background: "none", border: "none", color: "#B5442E", padding: 4 }}>
              <X size={15} />
            </button>
          </div>
        ))}
        {competitions.length === 0 && (
          <div style={{ fontSize: 12, color: "#9B9885", marginBottom: 10 }}>
            None yet — just the one main competition. Add one below whenever you need a sub-trophy running alongside it.
          </div>
        )}
        <button
          onClick={onAdd}
          style={{
            width: "100%", padding: "9px 0", borderRadius: 7, border: `1px dashed ${headerColor}`,
            background: "transparent", color: headerColor, fontWeight: 600, fontSize: 12.5,
            display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
          }}
        >
          <Plus size={13} /> Add competition
        </button>
      </div>

      {competitions.length > 0 && (
        <div style={{ background: "#FFFFFF", borderRadius: 10, padding: 14, border: "1px solid #E4E0D0", marginTop: 12 }}>
          <div style={{ fontSize: 12.5, fontWeight: 700, marginBottom: 6 }}>Bulk-tag players</div>
          <div style={{ fontSize: 11.5, color: "#6B6B5F", marginBottom: 10 }}>
            Pick a competition, tick everyone who belongs to it, and apply — updates all of them at once, everywhere
            they appear across the event. Anyone already tagged is pre-ticked.
          </div>
          <select
            value={bulkTarget}
            onChange={(e) => chooseBulkTarget(e.target.value)}
            style={{ width: "100%", fontSize: 14, fontWeight: 600, padding: "9px 10px", borderRadius: 7, border: "1px solid #D8D4C0", marginBottom: 12, background: "#FFF" }}
          >
            <option value="">Choose a competition…</option>
            {competitions.filter((c) => c.abbreviation).map((c) => (
              <option key={c.id} value={c.abbreviation}>{c.fullName || c.abbreviation}</option>
            ))}
          </select>
          {bulkTarget && (
            <>
              <div style={{ maxHeight: 260, overflowY: "auto", border: "1px solid #EFEDE0", borderRadius: 7, marginBottom: 12 }}>
                {allPlayers.length === 0 ? (
                  <div style={{ fontSize: 12, color: "#9B9885", padding: 12 }}>No players yet.</div>
                ) : (
                  allPlayers.map((p) => (
                    <label
                      key={p.name}
                      style={{
                        display: "flex", alignItems: "center", gap: 10, padding: "9px 10px",
                        borderTop: "1px solid #EFEDE0", cursor: "pointer",
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={selectedNames.has(p.name)}
                        onChange={() => toggleName(p.name)}
                        style={{ width: 16, height: 16 }}
                      />
                      <span style={{ flex: 1, fontSize: 13.5, fontWeight: 600 }}>{p.name}</span>
                      <span className="mono" style={{ fontSize: 11, color: "#8A8774" }}>
                        {p.index !== "" && p.index != null ? `HCP ${p.index}` : "no HCP"}
                        {p.competition && p.competition !== bulkTarget ? ` · ${p.competition}` : ""}
                      </span>
                    </label>
                  ))
                )}
              </div>
              <button
                onClick={apply}
                style={{ width: "100%", padding: "10px 0", borderRadius: 8, border: "none", background: headerColor, color: "#FFFFFF", fontWeight: 700, fontSize: 14 }}
              >
                {savedMsg ? "Saved" : `Apply to ${selectedNames.size} player${selectedNames.size === 1 ? "" : "s"}`}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function LocalRulesSetup({ text, onUpdate, onBack, headerColor }) {
  const [draft, setDraft] = useState(text);
  const [saved, setSaved] = useState(false);

  const save = () => {
    onUpdate(draft);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  return (
    <div style={{ padding: "12px 14px 40px" }}>
      <button onClick={onBack} style={{ background: "none", border: "none", color: headerColor, fontSize: 13, marginBottom: 10, padding: 0, fontWeight: 600 }}>
        ← Back
      </button>

      <div style={{ background: "#FFFFFF", borderRadius: 10, padding: 14, border: "1px solid #E4E0D0" }}>
        <div style={{ fontSize: 12.5, fontWeight: 700, marginBottom: 6 }}>Local rules</div>
        <div style={{ fontSize: 11.5, color: "#6B6B5F", marginBottom: 8 }}>
          Type or paste anything players should know — out of bounds, temporary greens, dress code, whatever's relevant today.
        </div>
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={"e.g. Preferred lies on all fairways. OOB left of the 4th. Please replace all divots."}
          rows={10}
          style={{ width: "100%", fontSize: 13.5, padding: 10, borderRadius: 7, border: "1px solid #D8D4C0", resize: "vertical", fontFamily: "inherit", lineHeight: 1.5 }}
        />
        <button
          onClick={save}
          style={{ width: "100%", marginTop: 8, padding: "10px 0", borderRadius: 7, border: "none", background: headerColor, color: "#FFFFFF", fontWeight: 600, fontSize: 13 }}
        >
          {saved ? "Saved" : "Save"}
        </button>
      </div>
    </div>
  );
}

function HandicapCheck({ players, competitions, onUpdateIndexAndCompetition, onUpdateTeeForRound, headerColor, accentColor }) {
  const [query, setQuery] = useState("");
  const [selectedName, setSelectedName] = useState(null);
  const [value, setValue] = useState("");
  const [competition, setCompetition] = useState("");
  const [savedMsg, setSavedMsg] = useState(false);
  const [teeSavedRoundId, setTeeSavedRoundId] = useState(null);

  const filtered = query.trim()
    ? players.filter((p) => p.name.toLowerCase().includes(query.trim().toLowerCase()))
    : players;
  const selectedPlayer = players.find((p) => p.name === selectedName);

  const selectPlayer = (p) => {
    setSelectedName(p.name);
    setValue(p.index || "");
    setCompetition(p.competition || "");
    setSavedMsg(false);
  };

  const save = () => {
    onUpdateIndexAndCompetition(selectedName, value, competition);
    setSavedMsg(true);
    setTimeout(() => setSavedMsg(false), 1500);
  };

  const saveTee = (roundId, newTee) => {
    onUpdateTeeForRound(roundId, selectedName, newTee);
    setTeeSavedRoundId(roundId);
    setTimeout(() => setTeeSavedRoundId(null), 1200);
  };

  if (selectedName && selectedPlayer) {
    return (
      <div style={{ padding: "14px 14px 40px" }}>
        <button
          onClick={() => setSelectedName(null)}
          style={{ background: "none", border: "none", color: headerColor, fontSize: 13, marginBottom: 12, padding: 0, fontWeight: 600 }}
        >
          ← Back to search
        </button>
        <div style={{ background: "#FFFFFF", borderRadius: 10, padding: 16, border: "1px solid #E4E0D0", marginBottom: 12 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: headerColor, marginBottom: 12 }}>{selectedName}</div>
          <div style={{ fontSize: 11, color: "#8A8774", marginBottom: 4 }}>Handicap index</div>
          <input
            type="number"
            inputMode="decimal"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="mono"
            style={{ width: "100%", fontSize: 20, padding: "10px 12px", borderRadius: 8, border: "1px solid #D8D4C0", marginBottom: 14 }}
          />
          {competitions.length > 0 && (
            <>
              <div style={{ fontSize: 11, color: "#8A8774", marginBottom: 4 }}>Competition</div>
              <select
                value={competition}
                onChange={(e) => setCompetition(e.target.value)}
                style={{ width: "100%", fontSize: 16, fontWeight: 600, padding: "10px 12px", borderRadius: 8, border: "1px solid #D8D4C0", marginBottom: 14, background: "#FFF" }}
              >
                <option value="">Main competition (no sub-trophy)</option>
                {competitions.map((c) => (
                  <option key={c.id} value={c.abbreviation}>{c.fullName || c.abbreviation}</option>
                ))}
              </select>
            </>
          )}
          <button
            onClick={save}
            style={{ width: "100%", padding: "11px 0", borderRadius: 8, border: "none", background: headerColor, color: "#FFFFFF", fontWeight: 700, fontSize: 14 }}
          >
            {savedMsg ? "Saved" : "Save"}
          </button>
          <div style={{ fontSize: 10.5, color: "#9B9885", marginTop: 10 }}>
            Updates everywhere {selectedName} appears across the whole event, not just one day.
          </div>
        </div>

        <div style={{ background: "#FFFFFF", borderRadius: 10, padding: 16, border: "1px solid #E4E0D0" }}>
          <div style={{ fontSize: 12.5, fontWeight: 700, marginBottom: 4 }}>Tee</div>
          <div style={{ fontSize: 11, color: "#8A8774", marginBottom: 12 }}>
            Set separately for each day — different courses often name their tees differently, so this doesn't
            carry over automatically between days.
          </div>
          {selectedPlayer.rounds.map((r) => (
            <div key={r.roundId} style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 11.5, fontWeight: 600, color: headerColor, marginBottom: 4 }}>{r.roundLabel}</div>
              <select
                value={r.tee}
                onChange={(e) => saveTee(r.roundId, e.target.value)}
                style={{ width: "100%", fontSize: 15, fontWeight: 600, padding: "9px 12px", borderRadius: 8, border: "1px solid #D8D4C0", background: "#FFF" }}
              >
                {!r.teeOptions.includes(r.tee) && (
                  <option value={r.tee || ""}>{r.tee ? `⚠ ${r.tee} — not a tee on this day's course` : "Choose tee…"}</option>
                )}
                {r.teeOptions.map((label) => (
                  <option key={label} value={label}>{label}</option>
                ))}
              </select>
              {teeSavedRoundId === r.roundId && (
                <div style={{ fontSize: 10.5, color: headerColor, marginTop: 3 }}>Saved</div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: "14px 14px 40px" }}>
      <div style={{ fontSize: 12.5, color: "#6B6B5F", marginBottom: 10 }}>
        Find your name to check or update your handicap index.
      </div>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search your name…"
        style={{ width: "100%", fontSize: 15, padding: "10px 12px", borderRadius: 8, border: "1px solid #D8D4C0", marginBottom: 12, fontFamily: "inherit" }}
      />
      {filtered.length === 0 ? (
        <div style={{ fontSize: 12.5, color: "#9B9885", textAlign: "center", padding: "24px 0" }}>
          No matching players yet.
        </div>
      ) : (
        filtered.map((p) => (
          <button
            key={p.name}
            onClick={() => selectPlayer(p)}
            style={{
              width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "12px 14px", background: "#FFFFFF", borderRadius: 10, marginBottom: 8, border: "1px solid #E4E0D0",
              textAlign: "left",
            }}
          >
            <span style={{ fontSize: 14, fontWeight: 600 }}>{p.name}</span>
            <span className="mono" style={{ fontSize: 13, color: "#8A8774" }}>
              {p.index !== "" && p.index != null ? `HCP ${p.index}` : "no HCP set"}{p.competition ? ` · ${p.competition}` : ""}
            </span>
          </button>
        ))
      )}
    </div>
  );
}

function DocumentsView({ documents, onOpen, headerColor, accentColor }) {
  if (documents.length === 0) {
    return (
      <div style={{ padding: "48px 24px", textAlign: "center", color: "#6B6B5F" }}>
        <FileText size={28} color={accentColor} style={{ marginBottom: 10 }} />
        <div style={{ fontSize: 15 }}>No documents posted yet.</div>
        <div style={{ fontSize: 12.5, marginTop: 4 }}>Check back once something's been posted.</div>
      </div>
    );
  }
  return (
    <div style={{ padding: "14px 12px 40px" }}>
      {documents.map((doc) => (
        <button
          key={doc.id}
          onClick={() => onOpen(doc)}
          style={{
            width: "100%", display: "flex", alignItems: "center", gap: 12, textAlign: "left",
            background: "#FFFFFF", borderRadius: 10, padding: "12px 14px", marginBottom: 8, border: "1px solid #E4E0D0",
          }}
        >
          <FileText size={20} color={headerColor} style={{ flexShrink: 0 }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {doc.name}
            </div>
            <div className="mono" style={{ fontSize: 11, color: "#8A8774", marginTop: 1 }}>
              {doc.sizeKB < 1024 ? `${doc.sizeKB} KB` : `${(doc.sizeKB / 1024).toFixed(1)} MB`}
            </div>
          </div>
          <ChevronRight size={16} color="#9B9885" />
        </button>
      ))}
    </div>
  );
}

function DocumentsSetup({ documents, onUpload, onRemove, onOpen, onBack, headerColor, accentColor }) {
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState("");

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploading(true);
    setMsg("");
    const result = await onUpload(file);
    setUploading(false);
    setMsg(result.ok ? `Uploaded "${file.name}".` : result.error || "Upload failed.");
  };

  return (
    <div style={{ padding: "12px 14px 40px" }}>
      <button onClick={onBack} style={{ background: "none", border: "none", color: headerColor, fontSize: 13, marginBottom: 10, padding: 0, fontWeight: 600 }}>
        ← Back
      </button>

      <div style={{ background: "#FFFFFF", borderRadius: 10, padding: 14, border: "1px solid #E4E0D0", marginBottom: 12 }}>
        <div style={{ fontSize: 12.5, fontWeight: 700, marginBottom: 6 }}>Add a PDF</div>
        <div style={{ fontSize: 11.5, color: "#6B6B5F", marginBottom: 10 }}>
          Anything players should be able to read — a dinner table plan, a programme, rules of golf notes. Shared across every day, not tied to whichever day you're currently on. Max {MAX_DOC_SIZE_MB}MB per file.
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/pdf"
          onChange={handleFile}
          style={{ display: "none" }}
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          style={{
            width: "100%", padding: "10px 0", borderRadius: 7, border: `1px solid ${headerColor}`,
            background: "transparent", color: headerColor, fontWeight: 600, fontSize: 13,
            display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            opacity: uploading ? 0.6 : 1,
          }}
        >
          <Upload size={15} /> {uploading ? "Uploading…" : "Choose PDF"}
        </button>
        {msg && <div style={{ fontSize: 11.5, color: headerColor, textAlign: "center", marginTop: 8 }}>{msg}</div>}
      </div>

      {documents.length > 0 && (
        <div style={{ background: "#FFFFFF", borderRadius: 10, padding: 14, border: "1px solid #E4E0D0" }}>
          <div style={{ fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", color: "#8A8774", marginBottom: 8 }}>
            Posted documents
          </div>
          {documents.map((doc) => (
            <div key={doc.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 0", borderTop: "1px solid #EFEDE0" }}>
              <button
                onClick={() => onOpen(doc)}
                style={{ flex: 1, display: "flex", alignItems: "center", gap: 8, background: "none", border: "none", textAlign: "left", padding: 0 }}
              >
                <FileText size={15} color={headerColor} />
                <span style={{ fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{doc.name}</span>
              </button>
              <button onClick={() => onRemove(doc.id)} style={{ background: "none", border: "none", color: "#B5442E", padding: 4 }}>
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ScorerList({ isOwner = true, course, isMatchPlay, onOpenEnterScores, onOpenCourseSetup, onOpenDrawSetup, onOpenMatchesSetup, onOpenLocalRulesSetup, onOpenDocumentsSetup, onOpenCompetitionsSetup, onOpenSocietyRoster, onOpenPrintLabels, onOpenPrintDraw, onOpenPrintBoard, onOpenBackup, headerColor, accentColor, onLock, onHideAdmin, publicScoreEntry, onTogglePublicScoreEntry, requireSignature = true, onToggleRequireSignature, roundLabel }) {
  return (
    <div style={{ padding: "14px 12px 40px" }}>
      <button
        onClick={onOpenEnterScores}
        style={{
          width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          padding: "13px 12px", borderRadius: 10, border: "none", background: accentColor,
          color: "#FFFFFF", fontWeight: 800, fontSize: 14.5, marginBottom: 12,
        }}
      >
        <Clipboard size={16} /> Enter scores
      </button>
      {!isMatchPlay && (
        <div style={{ background: "#FFFFFF", borderRadius: 10, border: `1px solid ${publicScoreEntry ? accentColor : "#E4E0D0"}`, padding: 12, marginBottom: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: headerColor }}>Players can enter scores — {roundLabel}</div>
              <div style={{ fontSize: 11, color: "#6B6B5F", marginTop: 2 }}>
                {publicScoreEntry
                  ? "ON — everyone sees an Enter scores button. Switch off when the cards are in."
                  : "Off — only Admin can enter scores."}
              </div>
            </div>
            <button
              onClick={onTogglePublicScoreEntry}
              style={{
                minWidth: 64, padding: "9px 0", borderRadius: 20, border: "none", fontWeight: 800, fontSize: 12.5,
                background: publicScoreEntry ? accentColor : "#D8D4C0", color: "#FFFFFF",
              }}
            >
              {publicScoreEntry ? "ON" : "OFF"}
            </button>
          </div>
          {publicScoreEntry && (
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 10, paddingTop: 10, borderTop: "1px solid #EFEDE0" }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: headerColor }}>Player must sign their card</div>
                <div style={{ fontSize: 11, color: "#6B6B5F", marginTop: 2 }}>
                  {requireSignature
                    ? "ON — a card entered by a marker waits for the player to check and sign it on their own phone."
                    : "Off — a card entered by a player goes straight onto the leaderboard when COMPLETE is pressed."}
                </div>
              </div>
              <button
                onClick={onToggleRequireSignature}
                style={{
                  minWidth: 64, padding: "9px 0", borderRadius: 20, border: "none", fontWeight: 800, fontSize: 12.5,
                  background: requireSignature ? accentColor : "#D8D4C0", color: "#FFFFFF",
                }}
              >
                {requireSignature ? "ON" : "OFF"}
              </button>
            </div>
          )}
        </div>
      )}
      <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
        {isOwner ? (
        <button
          onClick={onOpenCourseSetup}
          style={{
            flex: 1, display: "flex", alignItems: "center", gap: 8, padding: "10px 12px",
            borderRadius: 10, border: "1px solid #E4E0D0", background: "#FFFFFF",
            color: headerColor, fontSize: 12.5, fontWeight: 600,
          }}
        >
          <Settings size={14} />
          <span style={{ flex: 1, textAlign: "left" }}>{course.name} · {course.eventName}</span>
          <ChevronRight size={15} color="#9B9885" />
        </button>
        ) : (
        <div
          style={{
            flex: 1, display: "flex", alignItems: "center", gap: 8, padding: "10px 12px",
            borderRadius: 10, border: "1px solid #E4E0D0", background: "#F5F3E9",
            color: "#8A8774", fontSize: 12.5, fontWeight: 600,
          }}
        >
          <Lock size={14} />
          <span style={{ flex: 1, textAlign: "left" }}>{course.name} · {course.eventName}</span>
        </div>
        )}
        <button
          onClick={onLock}
          title="Lock Admin"
          style={{
            width: 42, display: "flex", alignItems: "center", justifyContent: "center",
            borderRadius: 10, border: "1px solid #E4E0D0", background: "#FFFFFF",
          }}
        >
          <Lock size={15} color="#8A8774" />
        </button>
      </div>

      <button
        onClick={onOpenDrawSetup}
        style={{
          width: "100%", display: "flex", alignItems: "center", gap: 8, padding: "10px 12px",
          borderRadius: 10, border: "1px solid #E4E0D0", background: "#FFFFFF", marginBottom: 10,
          color: headerColor, fontSize: 12.5, fontWeight: 600,
        }}
      >
        <Clipboard size={14} />
        <span style={{ flex: 1, textAlign: "left" }}>Draw / tee times</span>
        <ChevronRight size={15} color="#9B9885" />
      </button>

      {isMatchPlay && (
        <button
          onClick={onOpenMatchesSetup}
          style={{
            width: "100%", display: "flex", alignItems: "center", gap: 8, padding: "10px 12px",
            borderRadius: 10, border: "1px solid #E4E0D0", background: "#FFFFFF", marginBottom: 10,
            color: headerColor, fontSize: 12.5, fontWeight: 600,
          }}
        >
          <Users size={14} />
          <span style={{ flex: 1, textAlign: "left" }}>Matches</span>
          <ChevronRight size={15} color="#9B9885" />
        </button>
      )}

      <button
        onClick={onOpenLocalRulesSetup}
        style={{
          width: "100%", display: "flex", alignItems: "center", gap: 8, padding: "10px 12px",
          borderRadius: 10, border: "1px solid #E4E0D0", background: "#FFFFFF", marginBottom: 10,
          color: headerColor, fontSize: 12.5, fontWeight: 600,
        }}
      >
        <Flag size={14} />
        <span style={{ flex: 1, textAlign: "left" }}>Local rules</span>
        <ChevronRight size={15} color="#9B9885" />
      </button>

      <button
        onClick={onOpenDocumentsSetup}
        style={{
          width: "100%", display: "flex", alignItems: "center", gap: 8, padding: "10px 12px",
          borderRadius: 10, border: "1px solid #E4E0D0", background: "#FFFFFF", marginBottom: 10,
          color: headerColor, fontSize: 12.5, fontWeight: 600,
        }}
      >
        <FileText size={14} />
        <span style={{ flex: 1, textAlign: "left" }}>Information (PDFs)</span>
        <ChevronRight size={15} color="#9B9885" />
      </button>

      <button
        onClick={onOpenCompetitionsSetup}
        style={{
          width: "100%", display: "flex", alignItems: "center", gap: 8, padding: "10px 12px",
          borderRadius: 10, border: "1px solid #E4E0D0", background: "#FFFFFF", marginBottom: 10,
          color: headerColor, fontSize: 12.5, fontWeight: 600,
        }}
      >
        <Flag size={14} />
        <span style={{ flex: 1, textAlign: "left" }}>Competitions</span>
        <ChevronRight size={15} color="#9B9885" />
      </button>

      <button
        onClick={onOpenSocietyRoster}
        style={{
          width: "100%", display: "flex", alignItems: "center", gap: 8, padding: "10px 12px",
          borderRadius: 10, border: "1px solid #E4E0D0", background: "#FFFFFF", marginBottom: 10,
          color: headerColor, fontSize: 12.5, fontWeight: 600,
        }}
      >
        <Users size={14} />
        <span style={{ flex: 1, textAlign: "left" }}>Society roster</span>
        <ChevronRight size={15} color="#9B9885" />
      </button>

      <button
        onClick={onOpenPrintLabels}
        style={{
          width: "100%", display: "flex", alignItems: "center", gap: 8, padding: "10px 12px",
          borderRadius: 10, border: "1px solid #E4E0D0", background: "#FFFFFF", marginBottom: 10,
          color: headerColor, fontSize: 12.5, fontWeight: 600,
        }}
      >
        <Printer size={14} />
        <span style={{ flex: 1, textAlign: "left" }}>Print scorecard labels</span>
        <ChevronRight size={15} color="#9B9885" />
      </button>

      <button
        onClick={onOpenPrintDraw}
        style={{
          width: "100%", display: "flex", alignItems: "center", gap: 8, padding: "10px 12px",
          borderRadius: 10, border: "1px solid #E4E0D0", background: "#FFFFFF", marginBottom: 10,
          color: headerColor, fontSize: 12.5, fontWeight: 600,
        }}
      >
        <Printer size={14} />
        <span style={{ flex: 1, textAlign: "left" }}>Print the draw (tee time order &amp; by player)</span>
        <ChevronRight size={15} color="#9B9885" />
      </button>

      <button
        onClick={onOpenPrintBoard}
        style={{
          width: "100%", display: "flex", alignItems: "center", gap: 8, padding: "10px 12px",
          borderRadius: 10, border: "1px solid #E4E0D0", background: "#FFFFFF", marginBottom: 10,
          color: headerColor, fontSize: 12.5, fontWeight: 600,
        }}
      >
        <Printer size={14} />
        <span style={{ flex: 1, textAlign: "left" }}>Print the leaderboard</span>
        <ChevronRight size={15} color="#9B9885" />
      </button>

      {isOwner && (
      <button
        onClick={onOpenBackup}
        style={{
          width: "100%", display: "flex", alignItems: "center", gap: 8, padding: "10px 12px",
          borderRadius: 10, border: "1px solid #E4E0D0", background: "#FFFFFF", marginBottom: 10,
          color: headerColor, fontSize: 12.5, fontWeight: 600,
        }}
      >
        <Upload size={14} style={{ transform: "rotate(180deg)" }} />
        <span style={{ flex: 1, textAlign: "left" }}>Backup &amp; restore</span>
        <ChevronRight size={15} color="#9B9885" />
      </button>
      )}
      {!isOwner && (
        <div style={{ fontSize: 11.5, color: "#8A8774", textAlign: "center", marginTop: 4 }}>
          Helper access — Course setup (tees, slope, holes), PINs, backups and switching event are the organiser's only.
        </div>
      )}

      <div style={{ textAlign: "center", marginTop: 16 }}>
        <button
          onClick={onHideAdmin}
          style={{ background: "none", border: "none", color: "#8A8774", fontSize: 11.5, textDecoration: "underline", padding: 0 }}
        >
          Hide the Admin tab on this device
        </button>
      </div>

      <div className="mono" style={{ textAlign: "center", fontSize: 10.5, color: "#9B9885", marginTop: 14 }}>
        App version: {APP_VERSION}
      </div>
    </div>
  );
}

// The actual roster — its own full screen now (reached via the "Enter
// scores" button), rather than a section further down the Admin home
// screen. Scrolling to a section on a shared page turned out to be
// unreliable on some devices ("Enter scores" would land, but the page
// then refused to scroll any further) — a genuine separate screen, which
// every other Admin destination already is, sidesteps that class of bug
// entirely rather than patching around it.
function EnterScores({ deviceId, course, ranked, unplaced = [], onSelect, onAdd, onRemove, onLoadExample, onImport, onClearAll, onRemoveNotInDraw, onBack, headerColor, accentColor, rounds, activeRoundId, onCopyPlayers, isFoursomes, onBulkSetTee }) {
  const [pasteOpen, setPasteOpen] = useState(false);
  const [pasteText, setPasteText] = useState("");
  const [importMsg, setImportMsg] = useState("");
  const [confirmClear, setConfirmClear] = useState(false);
  const [confirmCleanup, setConfirmCleanup] = useState(false);
  const [bulkTeeTarget, setBulkTeeTarget] = useState("");
  const [selectedTeeIds, setSelectedTeeIds] = useState(new Set());

  // The roster here is for finding/editing a player, not for ranking — sort
  // it alphabetically rather than reusing the score-based leaderboard order.
  const alphaSorted = [...ranked].sort((a, b) =>
    (a.displayName || a.name || "").localeCompare(b.displayName || b.name || "")
  );

  // Flattened to one row per PERSON, not per record — on a Foursomes day a
  // single player record holds two people (primary + partner), and each
  // needs their own tee set independently.
  const teeableePeople = (isFoursomes
    ? ranked.flatMap((p) => {
        const list = [];
        if (p.name) list.push({ key: `${p.id}:primary`, recordId: p.id, role: "primary", name: p.name, tee: p.tee });
        if (p.partnerName) list.push({ key: `${p.id}:partner`, recordId: p.id, role: "partner", name: p.partnerName, tee: p.partnerTee });
        return list;
      })
    : ranked.filter((p) => p.name).map((p) => ({ key: `${p.id}:primary`, recordId: p.id, role: "primary", name: p.name, tee: p.tee }))
  ).sort((a, b) => a.name.localeCompare(b.name));

  const chooseBulkTeeTarget = (tee) => {
    setBulkTeeTarget(tee);
    setSelectedTeeIds(new Set(teeableePeople.filter((person) => person.tee === tee).map((person) => person.key)));
  };
  const toggleTeeSelect = (key) => {
    setSelectedTeeIds((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };
  const [teeSavedMsg, setTeeSavedMsg] = useState(false);
  const applyBulkTee = () => {
    const selections = teeableePeople.filter((person) => selectedTeeIds.has(person.key)).map(({ recordId, role }) => ({ recordId, role }));
    onBulkSetTee(selections, bulkTeeTarget);
    setTeeSavedMsg(true);
    setTimeout(() => setTeeSavedMsg(false), 1500);
  };

  const doImport = () => {
    const newPlayers = parsePastedPlayers(pasteText, course);
    if (newPlayers.length === 0) {
      setImportMsg("No player rows found — check there's a name in the first column.");
      return;
    }
    onImport(newPlayers);
    setImportMsg(`Imported ${newPlayers.length} player${newPlayers.length === 1 ? "" : "s"}.`);
    setPasteText("");
    setPasteOpen(false);
  };

  return (
    <div style={{ padding: "14px 12px 40px" }}>
      <button onClick={onBack} style={{ background: "none", border: "none", color: headerColor, fontSize: 13, marginBottom: 10, padding: 0, fontWeight: 600 }}>
        ← Back
      </button>

      {(() => {
        const stray = teeableePeople.filter((person) => teeMismatch(course, person.tee));
        if (stray.length === 0) return null;
        const words = [...new Set(stray.map((person) => person.tee || "no tee"))];
        return (
          <div style={{ background: "#FFF6E0", border: "1px solid #D9A400", borderRadius: 10, padding: 12, marginBottom: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#6B4E00", marginBottom: 4 }}>
              {stray.length} player{stray.length === 1 ? " is" : "s are"} on a tee {course.name} doesn't have ({words.map((t) => `"${t}"`).join(", ")})
            </div>
            <div style={{ fontSize: 11.5, color: "#6B4E00", marginBottom: 8 }}>
              Until it's put right their playing handicaps are worked out off "{course.tees[0]?.label}". Put them all on the right tee in one go
              (then use Bulk-set tee below for anyone who plays a different one):
            </div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {course.tees.map((t) => (
                <button
                  key={t.id}
                  onClick={() => onBulkSetTee(stray.map(({ recordId, role }) => ({ recordId, role })), t.label)}
                  style={{ padding: "9px 12px", borderRadius: 7, border: "none", background: headerColor, color: "#FFFFFF", fontWeight: 700, fontSize: 12.5 }}
                >
                  Move all {stray.length} to {t.label}
                </button>
              ))}
            </div>
          </div>
        );
      })()}
      {ranked.length > 0 && (
        <div style={{ background: "#FFFFFF", borderRadius: 10, padding: 12, border: "1px solid #E4E0D0", marginBottom: 12 }}>
          <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 6 }}>Bulk-set tee</div>
          <div style={{ fontSize: 11, color: "#6B6B5F", marginBottom: 8 }}>
            Handy after dragging people in fresh from the Society Roster, since their tee never carries over
            automatically. Pick a tee, tick everyone playing off it, apply.
          </div>
          <select
            value={bulkTeeTarget}
            onChange={(e) => chooseBulkTeeTarget(e.target.value)}
            style={{ width: "100%", fontSize: 13, fontWeight: 600, padding: "8px 10px", borderRadius: 7, border: "1px solid #D8D4C0", marginBottom: 8, background: "#FFF" }}
          >
            <option value="">Choose a tee…</option>
            {course.tees.map((t) => (
              <option key={t.id} value={t.label}>{t.label}</option>
            ))}
          </select>
          {bulkTeeTarget && (
            <>
              <div style={{ maxHeight: 200, overflowY: "auto", border: "1px solid #EFEDE0", borderRadius: 7, marginBottom: 8 }}>
                {teeableePeople.map((person) => (
                  <label
                    key={person.key}
                    style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 10px", borderTop: "1px solid #EFEDE0", cursor: "pointer" }}
                  >
                    <input type="checkbox" checked={selectedTeeIds.has(person.key)} onChange={() => toggleTeeSelect(person.key)} />
                    <span style={{ flex: 1, fontSize: 12.5, fontWeight: 600 }}>{person.name}</span>
                    <span
                      className="mono"
                      style={{ fontSize: 10.5, fontWeight: person.tee && teeMismatch(course, person.tee) ? 700 : 400, color: person.tee && teeMismatch(course, person.tee) ? "#B5442E" : "#8A8774" }}
                    >
                      {person.tee ? (teeMismatch(course, person.tee) ? `⚠ ${person.tee}` : person.tee) : "no tee set"}
                    </span>
                  </label>
                ))}
              </div>
              <button
                onClick={applyBulkTee}
                style={{ width: "100%", padding: "9px 0", borderRadius: 7, border: "none", background: headerColor, color: "#FFFFFF", fontWeight: 700, fontSize: 13 }}
              >
                {teeSavedMsg ? "Saved" : `Apply to ${selectedTeeIds.size} player${selectedTeeIds.size === 1 ? "" : "s"}`}
              </button>
            </>
          )}
        </div>
      )}

      <div style={{ fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", color: "#8A8774", marginTop: 4, marginBottom: 8 }}>
        Players — tap a name to enter their score
      </div>
      {ranked.length > 0 && (
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 10 }}>
          {confirmClear ? (
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 11, color: "#8A8774" }}>Remove all {ranked.length} players and clear the draw?</span>
              <button
                onClick={() => { onClearAll(); setConfirmClear(false); }}
                style={{ fontSize: 11.5, fontWeight: 700, color: "#B5442E", background: "none", border: "none", padding: "4px 6px" }}
              >
                Yes, clear
              </button>
              <button
                onClick={() => setConfirmClear(false)}
                style={{ fontSize: 11.5, color: "#9B9885", background: "none", border: "none", padding: "4px 6px" }}
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmClear(true)}
              style={{ fontSize: 11.5, color: "#B5442E", background: "none", border: "none", padding: "4px 2px" }}
            >
              Clear all players
            </button>
          )}
        </div>
      )}
      {ranked.length > 0 && (
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 10 }}>
          {confirmCleanup ? (
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
              <span style={{ fontSize: 11, color: "#8A8774" }}>Remove anyone not currently placed in the draw?</span>
              <button
                onClick={() => { onRemoveNotInDraw(); setConfirmCleanup(false); }}
                style={{ fontSize: 11.5, fontWeight: 700, color: "#B5442E", background: "none", border: "none", padding: "4px 6px" }}
              >
                Yes, remove
              </button>
              <button
                onClick={() => setConfirmCleanup(false)}
                style={{ fontSize: 11.5, color: "#9B9885", background: "none", border: "none", padding: "4px 6px" }}
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmCleanup(true)}
              style={{ fontSize: 11.5, color: "#8A8774", background: "none", border: "none", padding: "4px 2px" }}
            >
              Remove players not in the draw
            </button>
          )}
        </div>
      )}
      {ranked.length === 0 && unplaced.length === 0 && !isFoursomes && (
        <button
          onClick={onLoadExample}
          style={{
            width: "100%", padding: "10px 0", borderRadius: 10, border: `1px solid ${accentColor}`,
            background: `${accentColor}14`, color: accentColor, fontWeight: 600, fontSize: 12.5, marginBottom: 10,
          }}
        >
          Load example players (demo)
        </button>
      )}
      {alphaSorted.map((p) => (
        <div
          key={p.id}
          style={{
            display: "flex", alignItems: "center", gap: 10,
            background: "#FFFFFF", borderRadius: 10, padding: "10px 12px", marginBottom: 8,
            border: "1px solid #E4E0D0",
          }}
        >
          <button onClick={() => onSelect(p.id)} style={{ flex: 1, display: "flex", alignItems: "center", gap: 10, textAlign: "left", background: "none", border: "none", padding: 0 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}>
                <span>
                  {isFoursomes
                    ? `${p.name || "New pair"}${p.partnerName ? ` & ${p.partnerName}` : " — add partner"}`
                    : p.name || "New player"}
                </span>
                {(Number(p.handicapAdjustment) || Number(p.partnerHandicapAdjustment)) ? (
                  <span className="mono" style={{ fontSize: 10, fontWeight: 700, color: "#FFFFFF", background: headerColor, borderRadius: 4, padding: "1px 5px" }}>
                    adj {[p.handicapAdjustment, p.partnerHandicapAdjustment].map((v) => Number(v) || 0).filter((v) => v !== 0).map((v) => (v > 0 ? `+${v}` : `${v}`)).join(" / ")}
                  </span>
                ) : null}
              </div>
              <div className="mono" style={{ fontSize: 12, fontWeight: 700, color: handicapSummary(p, isFoursomes).missing ? "#B5442E" : headerColor, margin: "1px 0" }}>
                {handicapSummary(p, isFoursomes).text}{handicapSummary(p, isFoursomes).missing ? " — handicap missing" : ""}
              </div>
              <div className="mono" style={{ fontSize: 11, color: teeMismatch(course, p.tee) ? "#B5442E" : "#8A8774" }}>
                {teeMismatch(course, p.tee)
                  ? `⚠ Tee "${p.tee || "not set"}" doesn't match this course — check it`
                  : `${getTee(course, p.tee)?.label} tee`}
                {" "}· thru {p.thru}/18 · {p.thru > 0 ? `${p.pts} pts` : "not started"}
              </div>
              {lockHeldByOther(p, deviceId) && (
                <div style={{ fontSize: 11, fontWeight: 700, marginTop: 2, color: "#8A5A00" }}>● Being entered on another phone right now</div>
              )}
              {p.thru > 0 && (
                <div style={{ fontSize: 11, fontWeight: 700, marginTop: 2, color: isScoreComplete(p) ? "#2F6B3F" : "#B5442E" }}>
                  {isScoreComplete(p) ? "✓ Complete — on the leaderboard" : awaitingSignature(p) ? "✍ Submitted by a marker — waiting for the player to sign (or press COMPLETE here to post it)" : "In progress — not on the leaderboard yet"}
                </div>
              )}
            </div>
            <ChevronRight size={16} color="#9B9885" />
          </button>
          <button onClick={() => onRemove(p.id)} style={{ background: "none", border: "none", color: "#B5442E", fontSize: 11, padding: "4px 6px" }}>
            Remove
          </button>
        </div>
      ))}
      {unplaced.length > 0 && (
        <div style={{ background: "#F5F3E9", borderRadius: 10, padding: 12, border: "1px dashed #C2BEA9", marginTop: 6, marginBottom: 12 }}>
          <div style={{ fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", color: "#8A8774", marginBottom: 4 }}>
            Not in the draw — {unplaced.length}
          </div>
          <div style={{ fontSize: 11.5, color: "#6B6B5F", marginBottom: 8 }}>
            On this day's list but not given a tee time, so they have no card and don't appear on any leaderboard.
            Place them in the draw (Admin → Draw / tee times) to score them, or remove them here.
          </div>
          {[...unplaced].sort((a, b) => (a.name || "").localeCompare(b.name || "")).map((p) => (
            <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0", borderTop: "1px solid #E4E0D0" }}>
              <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: "#6B6B5F" }}>{p.name || "(no name)"}{p.partnerName ? ` & ${p.partnerName}` : ""}</span>
              <span className="mono" style={{ fontSize: 11, color: "#9B9885" }}>{p.index !== "" && p.index != null ? `HCP ${p.index}` : ""}</span>
              <button onClick={() => onRemove(p.id)} style={{ background: "none", border: "none", color: "#B5442E", fontSize: 11, padding: "4px 6px" }}>Remove</button>
            </div>
          ))}
        </div>
      )}
      {ranked.length === 0 && unplaced.length === 0 && rounds && rounds.some((r) => r.id !== activeRoundId && r.players.length > 0) && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
          {rounds.filter((r) => r.id !== activeRoundId && r.players.length > 0).map((r) => (
            <button
              key={r.id}
              onClick={() => onCopyPlayers(r.id)}
              style={{
                fontSize: 12, fontWeight: 600, color: headerColor, background: "#FFFFFF",
                border: `1px solid ${headerColor}`, borderRadius: 8, padding: "8px 12px",
              }}
            >
              Copy players from {r.label} ({r.players.length})
            </button>
          ))}
        </div>
      )}
      {!isFoursomes && (pasteOpen ? (
        <div style={{ background: "#FFFFFF", borderRadius: 10, padding: 12, border: `1px solid ${headerColor}`, marginBottom: 10 }}>
          <div style={{ fontSize: 11.5, color: "#6B6B5F", marginBottom: 6 }}>
            Paste rows copied from your spreadsheet — Name, Handicap Index, Tee (Tee optional, header row optional).
          </div>
          <textarea
            value={pasteText}
            onChange={(e) => setPasteText(e.target.value)}
            placeholder={"A. Whitmore\t8.4\tWhite\nR. Okonkwo\t14.1\tYellow"}
            rows={6}
            className="mono"
            style={{ width: "100%", fontSize: 12, padding: 8, borderRadius: 7, border: "1px solid #D8D4C0", resize: "vertical", fontFamily: "inherit" }}
          />
          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
            <button
              onClick={doImport}
              style={{ flex: 1, padding: "9px 0", borderRadius: 7, border: "none", background: headerColor, color: "#FFFFFF", fontWeight: 600, fontSize: 12.5 }}
            >
              Import
            </button>
            <button
              onClick={() => { setPasteOpen(false); setImportMsg(""); }}
              style={{ flex: 1, padding: "9px 0", borderRadius: 7, border: "1px solid #D8D4C0", background: "transparent", color: "#6B6B5F", fontWeight: 600, fontSize: 12.5 }}
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => { setPasteOpen(true); setImportMsg(""); }}
          style={{
            width: "100%", padding: "12px 0", borderRadius: 10, border: `1px solid ${headerColor}`,
            background: "transparent", color: headerColor, fontWeight: 600, fontSize: 13.5,
            display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 4, marginBottom: 4,
          }}
        >
          <Clipboard size={15} /> Import players (paste from spreadsheet)
        </button>
      ))}
      {importMsg && !pasteOpen && (
        <div style={{ fontSize: 11.5, color: headerColor, textAlign: "center", marginBottom: 8 }}>{importMsg}</div>
      )}
      <button
        onClick={onAdd}
        style={{
          width: "100%", padding: "12px 0", borderRadius: 10, border: `1px dashed ${headerColor}`,
          background: "transparent", color: headerColor, fontWeight: 600, fontSize: 13.5,
          display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 4,
        }}
      >
        <Users size={15} /> {isFoursomes ? "Add pair" : "Add player"}
      </button>
    </div>
  );
}

// "WHS 17.1 · Playing 28" — a player's handicap index followed by what
// they actually play off on this day's course (after the day's allowance
// and any one-off adjustment, marked *). For a Foursomes pair: both
// partners' indexes, then the pair's combined playing handicap.
function handicapSummary(p, isFoursomes) {
  const show = (v) => (v !== "" && v != null ? v : "–");
  const missing = p.index === "" || p.index == null || (isFoursomes && p.partnerName && (p.partnerIndex === "" || p.partnerIndex == null));
  const adjusted = Number(p.handicapAdjustment) || (isFoursomes && Number(p.partnerHandicapAdjustment));
  const whs = isFoursomes && p.partnerName ? `${show(p.index)} / ${show(p.partnerIndex)}` : show(p.index);
  return { text: `WHS ${whs} · Playing ${p.ph}${adjusted ? "*" : ""}`, missing };
}

// What players see under "Enter scores" when Admin has switched it on: a
// searchable list of this day's cards. A finished card can't be reopened
// from here (only Admin can), and one that's open on another phone is
// greyed out until that phone finishes or lets go of it.
function PublicScoreList({ ranked, isFoursomes, deviceId, notice, roundLabel, onSelect, onReview, headerColor, accentColor }) {
  const waiting = ranked.filter((p) => p.name && awaitingSignature(p));
  const waitingForMe = waiting.filter((p) => p.submittedBy !== deviceId);
  const [search, setSearch] = useState("");
  const cards = [...ranked]
    .filter((p) => p.name)
    .map((p) => ({ ...p, label: isFoursomes && p.partnerName ? `${p.name} & ${p.partnerName}` : p.name }))
    .filter((p) => !search.trim() || p.label.toLowerCase().includes(search.trim().toLowerCase()))
    .sort((a, b) => a.label.localeCompare(b.label));
  const doneCount = ranked.filter((p) => p.name && p.thru > 0 && isScoreComplete(p)).length;
  const totalCount = ranked.filter((p) => p.name).length;

  return (
    <div style={{ padding: "14px 12px 40px" }}>
      <div style={{ fontSize: 15, fontWeight: 800, color: headerColor }}>Enter scores — {roundLabel}</div>
      <div style={{ fontSize: 12, color: "#6B6B5F", margin: "4px 0 10px" }}>
        Tap a card, type in the gross score for each hole, then press COMPLETE. {doneCount} of {totalCount} cards done.
      </div>
      {notice && (
        <div style={{ background: "#FFF6E0", border: "1px solid #D9A400", color: "#6B4E00", borderRadius: 8, padding: "9px 12px", fontSize: 12.5, fontWeight: 600, marginBottom: 10 }}>
          {notice}
        </div>
      )}
      {waitingForMe.length > 0 && (
        <div style={{ background: "#EEF3FB", border: `1px solid ${accentColor}`, color: "#1B1B1B", borderRadius: 8, padding: "9px 12px", fontSize: 12.5, fontWeight: 600, marginBottom: 10 }}>
          ✍ {waitingForMe.length === 1 ? "1 card is" : `${waitingForMe.length} cards are`} waiting to be signed: {waitingForMe.map((p) => p.label).join(", ")}.
          If one of them is yours, tap it, check every hole, and sign it.
        </div>
      )}
      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder={`Search ${isFoursomes ? "pair" : "player"}…`}
        style={{ width: "100%", fontSize: 15, padding: "10px 12px", borderRadius: 8, border: "1px solid #D8D4C0", marginBottom: 10, fontFamily: "inherit", boxSizing: "border-box" }}
      />
      {cards.length === 0 && (
        <div style={{ padding: "24px 12px", textAlign: "center", color: "#9B9885", fontSize: 13 }}>No matching cards.</div>
      )}
      {cards.map((p) => {
        const done = p.thru > 0 && isScoreComplete(p);
        const waitingSig = !done && awaitingSignature(p);
        const mine = waitingSig && p.submittedBy === deviceId;
        const busy = !done && !waitingSig && lockHeldByOther(p, deviceId);
        const disabled = done || busy || mine;
        const status = done
          ? "✓ Complete — signed"
          : mine
          ? "✍ Submitted — waiting for the player to sign it on their own phone"
          : waitingSig
          ? "✍ Waiting to be signed — tap to check and sign"
          : busy
          ? "● Being entered on another phone"
          : p.thru > 0
          ? `In progress (${p.thru}/18) — tap to continue`
          : "Tap to enter";
        return (
          <button
            key={p.id}
            onClick={() => !disabled && (waitingSig ? onReview(p.id) : onSelect(p.id))}
            disabled={disabled}
            style={{
              width: "100%", display: "flex", alignItems: "center", gap: 10, textAlign: "left",
              background: disabled ? "#F5F3E9" : waitingSig ? "#EEF3FB" : "#FFFFFF", borderRadius: 10, padding: "12px 14px", marginBottom: 8,
              border: `1px solid ${disabled ? "#E4E0D0" : waitingSig ? accentColor : headerColor}`, opacity: disabled ? 0.75 : 1,
            }}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14.5, fontWeight: 700, color: disabled ? "#8A8774" : "#1B1B1B" }}>{p.label}</div>
              <div className="mono" style={{ fontSize: 12, fontWeight: 700, color: disabled ? "#8A8774" : headerColor, marginTop: 1 }}>{handicapSummary(p, isFoursomes).text}</div>
              <div style={{ fontSize: 11.5, fontWeight: 600, marginTop: 2, color: done ? "#2F6B3F" : waitingSig ? accentColor : busy ? "#8A5A00" : p.thru > 0 ? "#B5442E" : accentColor }}>{status}</div>
            </div>
            {!disabled && <ChevronRight size={16} color="#9B9885" />}
          </button>
        );
      })}
    </div>
  );
}

// A small +/- stepper for a one-off, per-day handicap adjustment — e.g. a
// player who's won too many recent competitions getting shots deducted, or
// a lady receiving extra shots for that specific event. Deliberately
// stored on the player's record for THIS round only, never touching their
// actual index, so it has no effect on any other day or on their Society
// Roster entry.
function HandicapAdjuster({ value, onChange, headerColor }) {
  const v = Number(value) || 0;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <button
        onClick={() => onChange(v - 1)}
        style={{ width: 30, height: 30, borderRadius: 7, border: "1px solid #D8D4C0", background: "#FFF", fontSize: 16, fontWeight: 700, color: "#6B6B5F" }}
      >
        −
      </button>
      <span className="mono" style={{ minWidth: 34, textAlign: "center", fontSize: 14, fontWeight: 700, color: v !== 0 ? headerColor : "#9B9885" }}>
        {v > 0 ? `+${v}` : v}
      </span>
      <button
        onClick={() => onChange(v + 1)}
        style={{ width: 30, height: 30, borderRadius: 7, border: "1px solid #D8D4C0", background: "#FFF", fontSize: 16, fontWeight: 700, color: "#6B6B5F" }}
      >
        +
      </button>
      {v !== 0 && (
        <button onClick={() => onChange(0)} style={{ background: "none", border: "none", color: "#B5442E", fontSize: 11, fontWeight: 600, padding: "0 4px" }}>
          Reset
        </button>
      )}
    </div>
  );
}

function ScoreEntry({ course, player, onBack, onUpdate, onScore, headerColor, isFoursomes, isMedal, handicapAllowance, publicMode = false, deviceId = "", requireSignature = true, ownCardStore = null, groupNames = [] }) {
  // The marker's own private card (see readOwnCard) — only in players' mode.
  const [ownCard, setOwnCard] = useState(() => (ownCardStore ? readOwnCard(ownCardStore.code, ownCardStore.roundId) : { name: "", scores: Array(18).fill("") }));
  const [showOwnCard, setShowOwnCard] = useState(() => !!(ownCardStore && readOwnCard(ownCardStore.code, ownCardStore.roundId).scores.some((v) => v !== "")));
  const updateOwnCard = (patch) => setOwnCard((prev) => {
    const next = { ...prev, ...patch };
    if (ownCardStore) writeOwnCard(ownCardStore.code, ownCardStore.roundId, next);
    return next;
  });
  const setOwnScore = (idx, raw) => {
    const num = Number(raw);
    const clean = raw === "" || isNaN(num) ? "" : Math.max(0, Math.round(num));
    updateOwnCard({ scores: ownCard.scores.map((v, i) => (i === idx ? clean : v)) });
  };
  // When reviewing a card that's mine, compare it with my private notes.
  const ownMatchesThisCard = !!(ownCardStore && ownCard.name && normalizeName(ownCard.name) === normalizeName(player.name));
  // Review mode: a card a marker has submitted, now being checked and
  // signed by the player on their own phone. Scores can't be changed here —
  // either sign it, or send it back to the marker to correct.
  const reviewing = publicMode && awaitingSignature(player);
  const submittedHere = reviewing && player.submittedBy === deviceId;
  const [agreed, setAgreed] = useState(false);
  const { ph, pts, netTotal, relToPar } = totals(course, player, handicapAllowance, isFoursomes);
  const rawA = playingHandicap(course, Number(player.index) || 0, player.tee);
  const allowedA = allowedHandicap(rawA, handicapAllowance) + (Number(player.handicapAdjustment) || 0);
  const rawB = isFoursomes ? playingHandicap(course, Number(player.partnerIndex) || 0, player.partnerTee) : null;
  const allowedB = isFoursomes ? allowedHandicap(rawB, handicapAllowance) + (Number(player.partnerHandicapAdjustment) || 0) : null;
  const strokeHoles = course.holes.map((h, i) => strokesOnHole(course, ph, i)).map((s, i) => ({ hole: i + 1, strokes: s })).filter((h) => h.strokes > 0);
  const inputRefs = useRef({});
  const timers = useRef({});
  const [confirmClearScores, setConfirmClearScores] = useState(false);

  // ---- Pocket-proofing ----
  // A hole's score locks 5 seconds after it was last typed, and any hole
  // that already has a score when the card is opened starts locked. A
  // locked hole can't be changed by a stray touch (a phone dropped in a
  // pocket mid-round); tapping "Edit scores" makes every scored hole live
  // again, and they re-lock 5 seconds after the last change. Empty holes
  // are always live, so the next hole can simply be typed in. After 10
  // quiet seconds (5) the keyboard is also put away, so nothing is left armed.
  const LOCK_AFTER_MS = 5000;
  const touchedAt = useRef({});           // hole index -> when it was last typed
  const lastActivityAt = useRef(Date.now());
  const [editUntil, setEditUntil] = useState(0);
  const [lockHint, setLockHint] = useState(false);
  const [, setTick] = useState(0);
  const scoreAt = (idx) => (Array.isArray(player.scores) ? player.scores[idx] : "");
  const isLocked = (idx) => {
    const v = scoreAt(idx);
    if (v === "" || v == null) return false;
    const now = Date.now();
    return now > editUntil && now - (touchedAt.current[idx] || 0) > LOCK_AFTER_MS;
  };
  const anyLocked = course.holes.some((_, i) => isLocked(i));
  const editing = Date.now() <= editUntil;
  useEffect(() => {
    // Re-check once a second so locks appear on time, and drop the
    // keyboard once everything has gone quiet.
    const t = setInterval(() => {
      setTick((n) => n + 1);
      const el = document.activeElement;
      if (el && el.classList && el.classList.contains("scoreInput") && Date.now() - lastActivityAt.current > LOCK_AFTER_MS) el.blur();
    }, 1000);
    return () => clearInterval(t);
  }, []);
  useEffect(() => {
    if (!lockHint) return;
    const t = setTimeout(() => setLockHint(false), 2500);
    return () => clearTimeout(t);
  }, [lockHint]);

  // Auto-advance to the next hole once a score looks "finished" — instantly
  // for single-digit scores that can't extend to two digits (2-9), after a
  // brief pause for scores starting "1" (which might become 10 or more), and
  // immediately on Enter/Return regardless.
  useEffect(() => {
    return () => Object.values(timers.current).forEach(clearTimeout);
  }, []);

  const focusNext = (idx) => {
    const next = inputRefs.current[idx + 1];
    if (next && !isLocked(idx + 1)) {
      next.focus();
      next.select?.();
    }
  };

  const handleChange = (idx, rawVal) => {
    if (isLocked(idx) || reviewing) return; // belt and braces — a locked box is read-only anyway
    touchedAt.current[idx] = Date.now();
    lastActivityAt.current = Date.now();
    if (Date.now() <= editUntil) setEditUntil(Date.now() + LOCK_AFTER_MS); // still correcting: keep the card open a little longer
    onScore(idx, rawVal);
    if (timers.current[idx]) clearTimeout(timers.current[idx]);
    if (rawVal === "") return;
    const isAmbiguousOne = rawVal.length === 1 && Number(rawVal) === 1;
    const delay = isAmbiguousOne ? 700 : 150;
    timers.current[idx] = setTimeout(() => focusNext(idx), delay);
  };

  const handleKeyDown = (idx, e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (timers.current[idx]) clearTimeout(timers.current[idx]);
      focusNext(idx);
    }
  };

  const nine = (holes) => (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(9, 1fr)", gap: 4, marginBottom: 10 }}>
      {holes.map((h) => {
        const idx = h - 1;
        const val = Array.isArray(player.scores) ? player.scores[idx] : "";
        const p = holePoints(course, val, idx, ph);
        const netVsPar = val !== "" && !isPickedUp(val) ? (Number(val) - strokesOnHole(course, ph, idx)) - course.holes[idx].par : null;
        // Shot holes are marked the way they are on a card: a red * above
        // the box for one shot, ** for two, and a red ring round the box.
        const shots = strokesOnHole(course, ph, idx);
        return (
          <div key={h} style={{ textAlign: "center" }}>
            <div className="mono" style={{ fontSize: 13, fontWeight: 800, color: headerColor, lineHeight: 1.15 }}>
              {h}{shots > 0 && <span style={{ color: "#C00000", fontSize: 14, marginLeft: 1 }}>{"*".repeat(shots)}</span>}
            </div>
            <div className="mono" style={{ fontSize: 10.5, fontWeight: 700, color: "#3F3F38", lineHeight: 1.2 }}>Par {course.holes[idx].par}</div>
            <input
              ref={(el) => (inputRefs.current[idx] = el)}
              className="mono scoreInput"
              type="number"
              inputMode="numeric"
              value={val}
              readOnly={isLocked(idx) || reviewing}
              onFocus={() => { lastActivityAt.current = Date.now(); }}
              onClick={() => { if (isLocked(idx)) setLockHint(true); }}
              onChange={(e) => handleChange(idx, e.target.value)}
              onKeyDown={(e) => handleKeyDown(idx, e)}
              style={{
                width: "100%", textAlign: "center", padding: "6px 0", marginTop: 2,
                borderRadius: 6, fontSize: 14, fontWeight: 700,
                // locked: solid tint, no outline. live with a score: white with a strong outline.
                // shot hole: red ring (thicker once a live score is in it).
                border: shots > 0 && !isLocked(idx)
                  ? `${val !== "" ? 2 : 1.5}px solid #C00000`
                  : val !== "" && !isLocked(idx) ? `2px solid ${headerColor}` : "1px solid #D8D4C0",
                background: isLocked(idx) ? `${headerColor}22` : shots > 0 ? "#FFF3F3" : "#FFF",
                color: isLocked(idx) ? headerColor : "#1B1B1B",
              }}
            />
            <div className="mono" style={{ fontSize: 10.5, fontWeight: 700, color: headerColor, marginTop: 2, minHeight: 14 }}>
              {isPickedUp(val) ? "NR" : isMedal ? (netVsPar !== null ? formatRelToPar(netVsPar) : "") : (p !== null ? `${p}pt` : "")}
            </div>
          </div>
        );
      })}
    </div>
  );

  return (
    <div style={{ padding: "12px 14px 40px" }}>
      <button onClick={onBack} style={{ background: "none", border: "none", color: headerColor, fontSize: 13, marginBottom: 10, padding: 0, fontWeight: 600 }}>
        ← All players
      </button>

      {publicMode && (
        <div style={{ background: "#FFFFFF", borderRadius: 10, padding: 14, border: "1px solid #E4E0D0", marginBottom: 12 }}>
          <div style={{ fontSize: 17, fontWeight: 800, color: headerColor }}>
            {isFoursomes && player.partnerName ? `${player.name} & ${player.partnerName}` : player.name}
          </div>
          <div className="mono" style={{ fontSize: 12, color: "#6B6B5F", marginTop: 4 }}>
            {handicapSummary({ ...player, ph }, isFoursomes).text}{player.tee ? ` · ${player.tee} tee` : ""}
          </div>
          <div style={{ fontSize: 11.5, color: "#8A5A00", marginTop: 8 }}>
            Check this is the right card before you start. Enter the GROSS score for each hole — put 0 for a hole that
            was picked up (0 points) — then press COMPLETE.
          </div>
        </div>
      )}

      <div style={{ display: publicMode ? "none" : "block", background: "#FFFFFF", borderRadius: 10, padding: 14, border: "1px solid #E4E0D0", marginBottom: 12 }}>
        {isFoursomes ? (
          <>
            <div style={{ fontSize: 10.5, letterSpacing: "0.06em", textTransform: "uppercase", color: "#8A8774", marginBottom: 4 }}>Player A</div>
            <input
              placeholder="Player A name"
              value={player.name}
              onChange={(e) => onUpdate({ name: e.target.value })}
              style={{ width: "100%", fontSize: 15, fontWeight: 700, border: "none", outline: "none", fontFamily: "inherit", marginBottom: 6 }}
            />
            <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
              <input
                placeholder="Handicap index"
                type="number"
                inputMode="decimal"
                value={player.index}
                onChange={(e) => onUpdate({ index: e.target.value })}
                className="mono"
                style={{ flex: 1, fontSize: 13, padding: "8px 10px", borderRadius: 7, border: "1px solid #D8D4C0" }}
              />
              <select
                value={player.tee}
                onChange={(e) => onUpdate({ tee: e.target.value })}
                style={{ fontSize: 13, padding: "8px 10px", borderRadius: 7, border: "1px solid #D8D4C0", background: "#FFF" }}
              >
                {teeMismatch(course, player.tee) && (
                  <option value={player.tee || ""}>{player.tee ? `⚠ ${player.tee} — not a tee here` : "Choose tee…"}</option>
                )}
                {course.tees.map((t) => (
                  <option key={t.id} value={t.label}>{t.label}</option>
                ))}
              </select>
            </div>
            <div style={{ fontSize: 10.5, letterSpacing: "0.06em", textTransform: "uppercase", color: "#8A8774", marginBottom: 4 }}>Player B</div>
            <input
              placeholder="Player B name"
              value={player.partnerName || ""}
              onChange={(e) => onUpdate({ partnerName: e.target.value })}
              style={{ width: "100%", fontSize: 15, fontWeight: 700, border: "none", outline: "none", fontFamily: "inherit", marginBottom: 6 }}
            />
            <div style={{ display: "flex", gap: 8 }}>
              <input
                placeholder="Handicap index"
                type="number"
                inputMode="decimal"
                value={player.partnerIndex || ""}
                onChange={(e) => onUpdate({ partnerIndex: e.target.value })}
                className="mono"
                style={{ flex: 1, fontSize: 13, padding: "8px 10px", borderRadius: 7, border: "1px solid #D8D4C0" }}
              />
              <select
                value={player.partnerTee || ""}
                onChange={(e) => onUpdate({ partnerTee: e.target.value })}
                style={{ fontSize: 13, padding: "8px 10px", borderRadius: 7, border: "1px solid #D8D4C0", background: "#FFF" }}
              >
                {teeMismatch(course, player.partnerTee) && (
                  <option value={player.partnerTee || ""}>{player.partnerTee ? `⚠ ${player.partnerTee} — not a tee here` : "Choose tee…"}</option>
                )}
                {course.tees.map((t) => (
                  <option key={t.id} value={t.label}>{t.label}</option>
                ))}
              </select>
            </div>
            <div className="mono" style={{ fontSize: 11.5, color: "#6B6B5F", marginTop: 10 }}>
              {allowedA} + {allowedB} → ({allowedA}+{allowedB})/2 = <strong style={{ color: headerColor }}>{ph}</strong> combined
              {handicapAllowance !== 100 ? ` (at ${handicapAllowance}% allowance)` : ""}
            </div>
          </>
        ) : (
          <>
            <input
              placeholder="Player name"
              value={player.name}
              onChange={(e) => onUpdate({ name: e.target.value })}
              style={{ width: "100%", fontSize: 16, fontWeight: 700, border: "none", outline: "none", fontFamily: "inherit", marginBottom: 8 }}
            />
            <div style={{ display: "flex", gap: 8 }}>
              <input
                placeholder="Handicap index"
                type="number"
                inputMode="decimal"
                value={player.index}
                onChange={(e) => onUpdate({ index: e.target.value })}
                className="mono"
                style={{ flex: 1, fontSize: 13, padding: "8px 10px", borderRadius: 7, border: "1px solid #D8D4C0" }}
              />
              <select
                value={player.tee}
                onChange={(e) => onUpdate({ tee: e.target.value })}
                style={{ fontSize: 13, padding: "8px 10px", borderRadius: 7, border: "1px solid #D8D4C0", background: "#FFF" }}
              >
                {teeMismatch(course, player.tee) && (
                  <option value={player.tee || ""}>{player.tee ? `⚠ ${player.tee} — not a tee here` : "Choose tee…"}</option>
                )}
                {course.tees.map((t) => (
                  <option key={t.id} value={t.label}>{t.label}</option>
                ))}
              </select>
            </div>
            {handicapAllowance !== 100 && (
              <div className="mono" style={{ fontSize: 11, color: "#6B6B5F", marginTop: 6 }}>
                Course HCP {rawA} at {handicapAllowance}% → {ph}
              </div>
            )}
          </>
        )}
        <div className="mono" style={{ fontSize: 12, color: "#6B6B5F", marginTop: 8 }}>
          Playing HCP {ph} · {isMedal ? `net ${netTotal} (${formatRelToPar(relToPar)})` : `${pts} pts`} so far
        </div>
        <div style={{ fontSize: 11, color: "#8A8774", marginTop: 4 }}>
          Put 0 for a hole that was picked up: 0 points, and the card shows NR for gross and net.
        </div>

        {/* Adjustments are made in one place only — Admin → Draw / tee times
            → Adjust handicap — never from the scoring screen, where a slip
            of the thumb mid-card could change what someone plays off. If
            this player HAS been adjusted, that's shown here (read-only) so
            the playing handicap above makes sense. */}
        {(() => {
          const fmt = (v) => (v > 0 ? `+${v}` : `${v}`);
          const parts = [];
          const a = Number(player.handicapAdjustment) || 0;
          const b = isFoursomes ? Number(player.partnerHandicapAdjustment) || 0 : 0;
          if (a) parts.push(`${isFoursomes ? `${player.name || "Player A"} ` : ""}${fmt(a)}`);
          if (b) parts.push(`${player.partnerName || "Player B"} ${fmt(b)}`);
          if (parts.length === 0) return null;
          return (
            <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid #EFEDE0", fontSize: 11.5, color: "#6B6B5F" }}>
              <strong style={{ color: headerColor }}>* Handicap adjusted for this competition: {parts.join(", ")} {parts.length === 1 && Math.abs(a || b) === 1 ? "shot" : "shots"}.</strong>{" "}
              To change it, go to Admin → Draw / tee times → Adjust handicap.
            </div>
          );
        })()}
      </div>

      <div style={{ background: "#FFFFFF", borderRadius: 10, padding: 14, border: "1px solid #E4E0D0", marginBottom: 12 }}>
        <div style={{ fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", color: "#8A8774", marginBottom: 6 }}>
          Shots received — {ph}
        </div>
        {strokeHoles.length === 0 ? (
          <div style={{ fontSize: 12, color: "#9B9885" }}>No strokes at this handicap.</div>
        ) : (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {strokeHoles.map((h) => (
              <div
                key={h.hole}
                className="mono"
                style={{
                  minWidth: 30, textAlign: "center", padding: "5px 6px", borderRadius: 6,
                  background: `${headerColor}12`, color: headerColor, fontSize: 12, fontWeight: 700,
                }}
              >
                {h.hole}{h.strokes > 1 ? `×${h.strokes}` : ""}
              </div>
            ))}
          </div>
        )}
      </div>

      {reviewing && (
        <div style={{ background: "#EEF3FB", border: `1px solid ${headerColor}`, borderRadius: 10, padding: 12, marginBottom: 12 }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: headerColor }}>
            {submittedHere ? "Submitted — waiting for the player's signature" : "Check this card, then sign it"}
          </div>
          <div style={{ fontSize: 12, color: "#3F3F38", marginTop: 4 }}>
            {submittedHere
              ? "The player signs it on their own phone (Enter scores → tap the card). The card can't be signed from the phone that entered it."
              : "Go through every hole against your paper card. If it's all correct, tick the box and sign; if anything's wrong, send it back and the marker can correct it."}
          </div>
        </div>
      )}
      {!reviewing && (anyLocked || editing) && (
        <div
          style={{
            display: "flex", alignItems: "center", gap: 10, marginBottom: 10, padding: "8px 10px", borderRadius: 9,
            background: editing ? "#FFF6E0" : "#FFFFFF", border: `1px solid ${editing ? "#D9A400" : "#E4E0D0"}`,
          }}
        >
          <Lock size={15} color={editing ? "#8A5A00" : "#8A8774"} style={{ flexShrink: 0 }} />
          <div style={{ flex: 1, fontSize: 11.5, color: editing ? "#6B4E00" : "#6B6B5F", fontWeight: lockHint ? 700 : 400 }}>
            {editing
              ? "Editing — scored holes are live. They lock again 5 seconds after your last change."
              : lockHint
              ? "That hole is locked. Tap Edit scores to change it."
              : "Entered scores are locked so they can't be changed by accident."}
          </div>
          <button
            onClick={() => { lastActivityAt.current = Date.now(); setLockHint(false); setEditUntil(editing ? 0 : Date.now() + LOCK_AFTER_MS); if (editing) touchedAt.current = {}; }}
            style={{
              flexShrink: 0, padding: "8px 12px", borderRadius: 8, fontWeight: 700, fontSize: 12.5,
              border: `1px solid ${headerColor}`, background: editing ? "#FFFFFF" : headerColor, color: editing ? headerColor : "#FFFFFF",
            }}
          >
            {editing ? "Lock now" : "Edit scores"}
          </button>
        </div>
      )}
      <div style={{ fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", color: "#8A8774", marginBottom: 6 }}>Out</div>
      {nine(OUT)}
      <div style={{ fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", color: "#8A8774", marginBottom: 6 }}>In</div>
      {nine(IN)}

      {reviewing && ownMatchesThisCard && (() => {
        const diffs = [];
        for (let i = 0; i < 18; i++) {
          const mine = ownCard.scores[i], theirs = Array.isArray(player.scores) ? player.scores[i] : "";
          if (mine === "" || mine == null) continue;
          if (String(mine) !== String(theirs)) diffs.push({ hole: i + 1, mine, theirs: theirs === "" || theirs == null ? "–" : theirs });
        }
        const noted = ownCard.scores.filter((v) => v !== "" && v != null).length;
        return (
          <div style={{ background: diffs.length ? "#FFF6E0" : "#EEF6EF", border: `1px solid ${diffs.length ? "#D9A400" : "#7FB88F"}`, borderRadius: 10, padding: 12, marginTop: 4, marginBottom: 10 }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: diffs.length ? "#6B4E00" : "#2F6B3F" }}>
              {diffs.length === 0 ? `Matches your own card on all ${noted} holes you noted` : `Differs from your own card on ${diffs.length} hole${diffs.length === 1 ? "" : "s"}`}
            </div>
            {diffs.length > 0 && (
              <div className="mono" style={{ fontSize: 12, color: "#6B4E00", marginTop: 4 }}>
                {diffs.map((d) => `Hole ${d.hole}: marker ${d.theirs}, you ${d.mine}`).join(" · ")}
              </div>
            )}
            <div style={{ fontSize: 11, color: "#6B6B5F", marginTop: 4 }}>Your own card is a private note on this phone; the marker's card is the one that counts.</div>
          </div>
        );
      })()}

      {publicMode && !reviewing && ownCardStore && (
        <div style={{ background: "#FFFFFF", borderRadius: 10, border: "1px dashed #B5AF9A", padding: 12, marginTop: 4, marginBottom: 10 }}>
          <button
            onClick={() => setShowOwnCard((v) => !v)}
            style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", background: "none", border: "none", padding: 0 }}
          >
            <span style={{ fontSize: 13, fontWeight: 700, color: headerColor }}>My own card{ownCard.name ? ` — ${ownCard.name}` : ""} (private, this phone only)</span>
            <ChevronRight size={15} color="#9B9885" style={{ transform: showOwnCard ? "rotate(90deg)" : "none", transition: "transform 0.15s" }} />
          </button>
          {showOwnCard && (
            <div style={{ marginTop: 8 }}>
              <div style={{ fontSize: 11.5, color: "#6B6B5F", marginBottom: 8 }}>
                Keep your own scores here while you mark {player.name || "this"} card. Nothing here is sent anywhere or shown to anyone —
                it's just so you can check your marker's card against it when it comes to you to sign.
              </div>
              <select
                value={ownCard.name}
                onChange={(e) => updateOwnCard({ name: e.target.value })}
                style={{ width: "100%", fontSize: 13, fontWeight: 600, padding: "8px 10px", borderRadius: 7, border: "1px solid #D8D4C0", background: "#FFF", marginBottom: 8 }}
              >
                <option value="">I am…</option>
                {[...new Set([ownCard.name, ...groupNames].filter(Boolean))].map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
              {[OUT, IN].map((holes, hi) => (
                <div key={hi} style={{ display: "grid", gridTemplateColumns: "repeat(9, 1fr)", gap: 4, marginBottom: 6 }}>
                  {holes.map((h) => (
                    <div key={h} style={{ textAlign: "center" }}>
                      <div className="mono" style={{ fontSize: 10.5, fontWeight: 700, color: "#8A8774" }}>{h}</div>
                      <input
                        className="mono scoreInput"
                        type="number"
                        inputMode="numeric"
                        value={ownCard.scores[h - 1]}
                        onChange={(e) => setOwnScore(h - 1, e.target.value)}
                        style={{ width: "100%", textAlign: "center", padding: "6px 0", borderRadius: 6, fontSize: 13, fontWeight: 700, border: "1px solid #D8D4C0", background: "#FBFAF6" }}
                      />
                    </div>
                  ))}
                </div>
              ))}
              {ownCard.scores.some((v) => v !== "") && (
                <button onClick={() => updateOwnCard({ scores: Array(18).fill("") })} style={{ background: "none", border: "none", color: "#B5442E", fontSize: 11.5, fontWeight: 600, padding: 0, textDecoration: "underline" }}>
                  Clear my own card
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {(() => {
        // Card totals — Out / In / Total for gross, net and Stableford
        // points — so the card can be checked against the signed paper
        // one at a glance before pressing COMPLETE. Only counts holes
        // that actually have a score in them.
        const sumFor = (holes) => {
          let gross = 0, net = 0, points = 0, played = 0, nr = false;
          holes.forEach((h) => {
            const idx = h - 1;
            const v = Array.isArray(player.scores) ? player.scores[idx] : "";
            if (v === "" || v == null) return;
            played += 1;
            if (isPickedUp(v)) { nr = true; return; }
            gross += Number(v);
            net += Number(v) - strokesOnHole(course, ph, idx);
            points += holePoints(course, v, idx, ph) || 0;
          });
          return { gross, net, points, played, nr };
        };
        const out = sumFor(OUT), inn = sumFor(IN);
        const all = { gross: out.gross + inn.gross, net: out.net + inn.net, points: out.points + inn.points, played: out.played + inn.played, nr: out.nr || inn.nr };
        const show = (part, field) => (part.played === 0 ? "–" : field !== "points" && part.nr ? "NR" : part[field]);
        const cell = { textAlign: "right", padding: "7px 10px", fontSize: 14 };
        const head = { textAlign: "right", padding: "6px 10px", fontSize: 10.5, color: "#8A8774", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase" };
        const rowLabel = { textAlign: "left", padding: "7px 10px", fontSize: 13, fontWeight: 700 };
        return (
          <div style={{ background: "#FFFFFF", borderRadius: 10, border: "1px solid #E4E0D0", marginTop: 6, overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: `${headerColor}12` }}>
                  <th style={{ ...head, textAlign: "left" }}>{all.played === 18 ? "Card totals" : `Thru ${all.played} of 18`}</th>
                  <th style={head}>Out</th>
                  <th style={head}>In</th>
                  <th style={{ ...head, color: headerColor }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { label: "Gross", field: "gross" },
                  { label: "Net", field: "net" },
                  { label: "Points", field: "points" },
                ].map((r) => (
                  <tr key={r.field} style={{ borderTop: "1px solid #EFEDE0" }}>
                    <td style={rowLabel}>{r.label}</td>
                    <td className="mono" style={cell}>{show(out, r.field)}</td>
                    <td className="mono" style={cell}>{show(inn, r.field)}</td>
                    <td className="mono" style={{ ...cell, fontWeight: 800, fontSize: 16, color: headerColor }}>{show(all, r.field)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      })()}

      {(() => {
        const entered = (Array.isArray(player.scores) ? player.scores : []).filter((v) => v !== "" && v != null).length;
        const complete = isScoreComplete(player) && entered > 0;
        if (complete) {
          return (
            <div style={{ marginTop: 14, background: "#EEF6EF", border: "1px solid #7FB88F", borderRadius: 10, padding: 14, textAlign: "center" }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: "#2F6B3F" }}>✓ Complete — showing on the leaderboard</div>
              <div style={{ fontSize: 11.5, color: "#4F6B55", marginTop: 4 }}>Any correction you make above shows on the leaderboard straight away.</div>
              {!publicMode && (
              <button
                onClick={() => onUpdate({ scoresComplete: false, submitted: false, submittedBy: null })}
                style={{ marginTop: 10, background: "none", border: "none", color: "#B5442E", fontSize: 12, fontWeight: 600, textDecoration: "underline" }}
              >
                Reopen — take this card off the leaderboard
              </button>
              )}
            </div>
          );
        }
        if (reviewing) {
          if (submittedHere) return null;
          return (
            <div style={{ marginTop: 14, background: "#FFFFFF", border: `1px solid ${headerColor}`, borderRadius: 10, padding: 14 }}>
              <label style={{ display: "flex", alignItems: "flex-start", gap: 10, fontSize: 13.5, fontWeight: 600, cursor: "pointer" }}>
                <input type="checkbox" checked={agreed} onChange={() => setAgreed((v) => !v)} style={{ width: 20, height: 20, marginTop: 1, flexShrink: 0 }} />
                <span>I have checked this card hole by hole and it is correct.</span>
              </label>
              <button
                onClick={() => { onUpdate({ scoresComplete: true, signedBy: deviceId, signedAt: Date.now() }); onBack(); }}
                disabled={!agreed}
                style={{
                  width: "100%", marginTop: 12, padding: "15px 0", borderRadius: 10, border: "none",
                  background: agreed ? headerColor : "#D8D4C0", color: "#FFFFFF", fontWeight: 800, fontSize: 16, letterSpacing: "0.08em",
                }}
              >
                SIGN CARD
              </button>
              <button
                onClick={() => { onUpdate({ submitted: false, submittedBy: null, submittedAt: null, scoresComplete: false }); onBack(); }}
                style={{ width: "100%", marginTop: 8, padding: "10px 0", borderRadius: 8, border: "1px solid #B5442E", background: "transparent", color: "#B5442E", fontWeight: 600, fontSize: 13 }}
              >
                Something's wrong — send it back to be corrected
              </button>
            </div>
          );
        }
        return (
          <div style={{ marginTop: 14 }}>
            <button
              onClick={() => {
                if (publicMode && requireSignature) onUpdate({ submitted: true, submittedBy: deviceId, submittedAt: Date.now(), scoresComplete: false });
                else onUpdate({ scoresComplete: true });
                onBack();
              }}
              disabled={entered === 0}
              style={{
                width: "100%", padding: "15px 0", borderRadius: 10, border: "none",
                background: entered === 0 ? "#D8D4C0" : headerColor, color: "#FFFFFF",
                fontWeight: 800, fontSize: 16, letterSpacing: "0.08em",
              }}
            >
              {!publicMode && awaitingSignature(player) ? "APPROVE — SIGNED CARD SEEN" : "COMPLETE"}
            </button>
            <div style={{ fontSize: 11.5, color: "#6B6B5F", textAlign: "center", marginTop: 6 }}>
              {!publicMode && awaitingSignature(player)
                ? <>This card was entered by a marker on their phone and is waiting for the player to sign it. If you've seen the signed paper card, approve it here and it goes on the leaderboard.{" "}
                    <button onClick={() => onUpdate({ submitted: false, submittedBy: null, submittedAt: null, scoresComplete: false })} style={{ background: "none", border: "none", color: "#B5442E", fontSize: 11.5, fontWeight: 700, padding: 0, textDecoration: "underline" }}>
                      Or cancel the submission
                    </button> — the scores stay, the card just goes back to "in progress".</>
                : entered === 0
                ? `Enter the scores, then press COMPLETE${publicMode && requireSignature ? " to send the card to the player to sign" : " to post them to the leaderboard"}.`
                : entered < 18
                ? `${entered} of 18 holes entered. Saved, but NOT on the leaderboard until ${publicMode && requireSignature ? "it's completed and signed" : "you press COMPLETE"} (an unfinished card will show as NR).`
                : publicMode && requireSignature
                ? "All 18 holes entered. Press COMPLETE, then the player checks and signs it on their own phone before it goes on the leaderboard."
                : "All 18 holes entered. Saved, but NOT on the leaderboard until you press COMPLETE."}
            </div>
          </div>
        );
      })()}

      {/* For when scores have gone onto the wrong player's card: wipes
          all 18 holes and takes the card back off the leaderboard. Asks
          first, since it can't be undone. */}
      {(Array.isArray(player.scores) ? player.scores : []).some((v) => v !== "" && v != null) && (
        <div style={{ marginTop: 18, textAlign: "center" }}>
          {confirmClearScores ? (
            <div style={{ background: "#FDF2EF", border: "1px solid #B5442E", borderRadius: 10, padding: 12 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#B5442E", marginBottom: 10 }}>
                Remove all scores for {isFoursomes && player.partnerName ? `${player.name} & ${player.partnerName}` : player.name || "this player"}?
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  onClick={() => {
                    Object.values(timers.current).forEach(clearTimeout);
                    onUpdate({ scores: Array(18).fill(""), scoresComplete: false, submitted: false, submittedBy: null, submittedAt: null });
                    setConfirmClearScores(false);
                    const first = inputRefs.current[0];
                    if (first) first.focus();
                  }}
                  style={{ flex: 1, padding: "10px 0", borderRadius: 8, border: "none", background: "#B5442E", color: "#FFFFFF", fontWeight: 700, fontSize: 13 }}
                >
                  Yes, clear them
                </button>
                <button
                  onClick={() => setConfirmClearScores(false)}
                  style={{ flex: 1, padding: "10px 0", borderRadius: 8, border: "1px solid #D8D4C0", background: "#FFFFFF", color: "#6B6B5F", fontWeight: 600, fontSize: 13 }}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setConfirmClearScores(true)}
              style={{ padding: "9px 16px", borderRadius: 8, border: "1px solid #B5442E", background: "transparent", color: "#B5442E", fontWeight: 600, fontSize: 12.5 }}
            >
              Clear all scores and start again
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function CourseSetup({ canEditPins = true, orgName, onUpdateOrgName, accentColor, onUpdateAccentColor, headerColor, onUpdateHeaderColor, pin, onUpdatePin, handicapPin, onUpdateHandicapPin, course, onUpdate, onRenameTee, onBack, library, onSaveToLibrary, onLoadFromLibrary, onDeleteFromLibrary, onImportLibrary, rounds, activeRoundId, onAddRound, onRenameRound, onRemoveRound, onSetActiveRound }) {
  const [confirmLoadId, setConfirmLoadId] = useState(null);
  const [confirmRemoveRoundId, setConfirmRemoveRoundId] = useState(null);
  const [confirmOverwriteSave, setConfirmOverwriteSave] = useState(false);
  const [libraryMsg, setLibraryMsg] = useState("");
  const libraryFileRef = useRef(null);
  const setHole = (idx, field, val) => {
    const clean = val === "" ? "" : Math.max(1, Math.min(field === "par" ? 7 : 18, Number(val)));
    const holes = course.holes.map((h, i) => (i === idx ? { ...h, [field]: clean } : h));
    onUpdate({ holes });
  };

  const setTee = (id, field, val) => {
    if (field === "label") {
      onRenameTee(id, val);
      return;
    }
    const tees = course.tees.map((t) => (t.id === id ? { ...t, [field]: val } : t));
    onUpdate({ tees });
  };

  const addTee = () => {
    const id = crypto.randomUUID().slice(0, 4);
    onUpdate({ tees: [...course.tees, { id, label: "New tee", cr: 72.0, slope: 125 }] });
  };

  const removeTee = (id) => {
    if (course.tees.length <= 1) return;
    onUpdate({ tees: course.tees.filter((t) => t.id !== id) });
  };

  const parRefs = useRef({});
  const siRefs = useRef({});

  // Enter follows the natural reading order down the card: Par → SI for
  // the same hole, then on to the next hole's Par — rather than jumping
  // straight down one column. Selects the destination's existing value so
  // the next keystroke replaces it outright instead of needing a manual
  // clear first.
  const handleHoleKeyDown = (e, field, idx) => {
    if (e.key !== "Enter") return;
    e.preventDefault();
    const next = field === "par" ? siRefs.current[idx] : parRefs.current[idx + 1];
    if (next) {
      next.focus();
      next.select();
    }
  };

  const holeGrid = (holes, label) => (
    <div style={{ marginBottom: 10 }}>
      <div style={{ fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", color: "#8A8774", marginBottom: 6 }}>{label}</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(9, 1fr)", gap: 4 }}>
        {holes.map((h) => {
          const idx = h - 1;
          return (
            <div key={h} style={{ textAlign: "center" }}>
              <div className="mono" style={{ fontSize: 9, color: "#9B9885", marginBottom: 2 }}>{h}</div>
              <input
                ref={(el) => (parRefs.current[idx] = el)}
                className="mono scoreInput" type="number" inputMode="numeric"
                value={course.holes[idx].par}
                onChange={(e) => setHole(idx, "par", e.target.value)}
                onKeyDown={(e) => handleHoleKeyDown(e, "par", idx)}
                placeholder="Par"
                style={{ width: "100%", textAlign: "center", padding: "4px 0", borderRadius: 5, border: "1px solid #D8D4C0", fontSize: 12.5, fontWeight: 700, marginBottom: 3 }}
              />
              <input
                ref={(el) => (siRefs.current[idx] = el)}
                className="mono scoreInput" type="number" inputMode="numeric"
                value={course.holes[idx].si}
                onChange={(e) => setHole(idx, "si", e.target.value)}
                onKeyDown={(e) => handleHoleKeyDown(e, "si", idx)}
                placeholder="SI"
                style={{ width: "100%", textAlign: "center", padding: "4px 0", borderRadius: 5, border: "1px solid #D8D4C0", fontSize: 11, color: "#6B6B5F" }}
              />
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <div style={{ padding: "12px 14px 40px" }}>
      <button onClick={onBack} style={{ background: "none", border: "none", color: headerColor, fontSize: 13, marginBottom: 10, padding: 0, fontWeight: 600 }}>
        ← Back
      </button>

      <div style={{ background: "#FFFFFF", borderRadius: 10, padding: 14, border: "1px solid #E4E0D0", marginBottom: 12 }}>
        <div style={{ fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", color: "#8A8774", marginBottom: 8 }}>
          Days
        </div>
        {rounds.map((r) => (
          <div key={r.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0", borderTop: "1px solid #EFEDE0" }}>
            <input
              value={r.label}
              onChange={(e) => onRenameRound(r.id, e.target.value)}
              style={{
                flex: 1, fontSize: 13, fontWeight: r.id === activeRoundId ? 700 : 500,
                padding: "6px 8px", borderRadius: 6, border: "1px solid #D8D4C0",
                background: r.id === activeRoundId ? `${headerColor}12` : "#FFFFFF",
              }}
            />
            {r.id !== activeRoundId && (
              <button
                onClick={() => onSetActiveRound(r.id)}
                style={{ fontSize: 11.5, fontWeight: 600, color: headerColor, background: "none", border: `1px solid ${headerColor}`, borderRadius: 6, padding: "5px 9px" }}
              >
                Switch to
              </button>
            )}
            {rounds.length > 1 && (
              confirmRemoveRoundId === r.id ? (
                <>
                  <button
                    onClick={() => { onRemoveRound(r.id); setConfirmRemoveRoundId(null); }}
                    style={{ fontSize: 11, color: "#B5442E", background: "none", border: "none", fontWeight: 700 }}
                  >
                    Confirm
                  </button>
                  <button onClick={() => setConfirmRemoveRoundId(null)} style={{ fontSize: 11, color: "#9B9885", background: "none", border: "none" }}>
                    Cancel
                  </button>
                </>
              ) : (
                <button onClick={() => setConfirmRemoveRoundId(r.id)} style={{ background: "none", border: "none", color: "#B5442E", padding: 4 }}>
                  <X size={14} />
                </button>
              )
            )}
          </div>
        ))}
        {rounds.length < MAX_ROUNDS ? (
          <button
            onClick={onAddRound}
            style={{
              width: "100%", marginTop: 10, padding: "9px 0", borderRadius: 7, border: `1px dashed ${headerColor}`,
              background: "transparent", color: headerColor, fontWeight: 600, fontSize: 12.5,
              display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
            }}
          >
            <Plus size={13} /> Add another day
          </button>
        ) : (
          <div style={{ fontSize: 11, color: "#9B9885", marginTop: 10 }}>Maximum of {MAX_ROUNDS} days.</div>
        )}
        <div style={{ fontSize: 10.5, color: "#9B9885", marginTop: 8 }}>
          Everything below (course, tees, holes) applies to whichever day is bold above. Players are separate per day too — use "Copy from another day" in Admin to reuse a roster.
        </div>
      </div>

      <div style={{ background: "#FFFFFF", borderRadius: 10, padding: 14, border: "1px solid #E4E0D0", marginBottom: 12 }}>
        <div style={{ fontSize: 11, color: "#8A8774", marginBottom: 3 }}>
          Society name <span style={{ textTransform: "none", letterSpacing: 0 }}>(stays fixed however you change the course below)</span>
        </div>
        <input
          value={orgName}
          onChange={(e) => onUpdateOrgName(e.target.value)}
          style={{ width: "100%", fontSize: 15, fontWeight: 700, border: "1px solid #D8D4C0", borderRadius: 7, padding: "7px 9px", marginBottom: 14, fontFamily: "inherit" }}
        />
        <div style={{ display: "flex", gap: 14, marginTop: 10 }}>
          <label style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4 }}>
            <span style={{ fontSize: 11, color: "#8A8774" }}>Header colour</span>
            <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <input
                type="color"
                value={headerColor}
                onChange={(e) => onUpdateHeaderColor(e.target.value)}
                style={{ width: 34, height: 30, padding: 0, border: "1px solid #D8D4C0", borderRadius: 6, background: "none" }}
              />
              <span className="mono" style={{ fontSize: 11.5, color: "#6B6B5F" }}>{headerColor}</span>
            </span>
          </label>
          <label style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4 }}>
            <span style={{ fontSize: 11, color: "#8A8774" }}>Accent colour</span>
            <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <input
                type="color"
                value={accentColor}
                onChange={(e) => onUpdateAccentColor(e.target.value)}
                style={{ width: 34, height: 30, padding: 0, border: "1px solid #D8D4C0", borderRadius: 6, background: "none" }}
              />
              <span className="mono" style={{ fontSize: 11.5, color: "#6B6B5F" }}>{accentColor}</span>
            </span>
          </label>
        </div>
        {!canEditPins && (
          <div style={{ marginTop: 14, fontSize: 11.5, color: "#8A8774" }}>
            The Admin PIN and handicap code can only be changed by the organiser.
          </div>
        )}
        {canEditPins && (
        <>
        <div style={{ marginTop: 14 }}>
          <div style={{ fontSize: 11, color: "#8A8774", marginBottom: 3 }}>
            Admin PIN <span style={{ textTransform: "none", letterSpacing: 0 }}>(required to enter Admin)</span>
          </div>
          <input
            value={pin}
            onChange={(e) => onUpdatePin(e.target.value.replace(/[^0-9]/g, "").slice(0, 6))}
            inputMode="numeric"
            className="mono"
            style={{ width: 120, fontSize: 15, fontWeight: 700, border: "1px solid #D8D4C0", borderRadius: 7, padding: "7px 9px", letterSpacing: "0.15em" }}
          />
        </div>
        <div style={{ marginTop: 14 }}>
          <div style={{ fontSize: 11, color: "#8A8774", marginBottom: 3 }}>
            Handicap code <span style={{ textTransform: "none", letterSpacing: 0 }}>(separate, lighter code — share with all players so they can check/update their own handicap)</span>
          </div>
          <input
            value={handicapPin}
            onChange={(e) => onUpdateHandicapPin(e.target.value.replace(/[^0-9]/g, "").slice(0, 6))}
            inputMode="numeric"
            className="mono"
            style={{ width: 120, fontSize: 15, fontWeight: 700, border: "1px solid #D8D4C0", borderRadius: 7, padding: "7px 9px", letterSpacing: "0.15em" }}
          />
        </div>
        </>
        )}
      </div>


      <div style={{ background: "#FFFFFF", borderRadius: 10, padding: 14, border: "1px solid #E4E0D0", marginBottom: 12 }}>
        <div style={{ fontSize: 11, color: "#8A8774", marginBottom: 3 }}>Course / venue name</div>
        <input
          value={course.name}
          onChange={(e) => onUpdate({ name: e.target.value })}
          style={{ width: "100%", fontSize: 15, fontWeight: 700, border: "1px solid #D8D4C0", borderRadius: 7, padding: "7px 9px", marginBottom: 10, fontFamily: "inherit" }}
        />
        <div style={{ fontSize: 11, color: "#8A8774", marginBottom: 3 }}>Event name</div>
        <input
          value={course.eventName}
          onChange={(e) => onUpdate({ eventName: e.target.value })}
          style={{ width: "100%", fontSize: 14, border: "1px solid #D8D4C0", borderRadius: 7, padding: "7px 9px", fontFamily: "inherit" }}
        />
      </div>

      <div style={{ background: "#FFFFFF", borderRadius: 10, padding: 14, border: "1px solid #E4E0D0", marginBottom: 12 }}>
        <div style={{ fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", color: "#8A8774", marginBottom: 8 }}>
          Tees
        </div>
        <div style={{ fontSize: 10.5, color: "#8A8774", marginBottom: 10 }}>
          Use whichever names this course actually calls its tees (e.g. "Club" and "Purple") — there's no need to
          keep labels consistent across different courses. Each day's players have their tee set independently for
          that day's own course, so different naming from one venue to the next isn't a problem.
        </div>
        {course.tees.map((t) => (
          <div key={t.id} style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 8 }}>
            <input
              value={t.label}
              onChange={(e) => setTee(t.id, "label", e.target.value)}
              placeholder="Label"
              style={{ flex: 1.3, fontSize: 12.5, padding: "6px 8px", borderRadius: 6, border: "1px solid #D8D4C0" }}
            />
            <input
              className="mono" type="number" inputMode="decimal"
              value={t.cr}
              onChange={(e) => {
                const val = e.target.value;
                setTee(t.id, "cr", val === "" ? "" : Number(val));
              }}
              onBlur={(e) => {
                if (e.target.value === "") setTee(t.id, "cr", 72.0);
              }}
              placeholder="CR"
              style={{ flex: 1, fontSize: 12.5, padding: "6px 8px", borderRadius: 6, border: "1px solid #D8D4C0" }}
            />
            <input
              className="mono" type="number" inputMode="numeric"
              value={t.slope}
              onChange={(e) => {
                const val = e.target.value;
                setTee(t.id, "slope", val === "" ? "" : Number(val));
              }}
              onBlur={(e) => {
                if (e.target.value === "") setTee(t.id, "slope", 125);
              }}
              placeholder="Slope"
              style={{ flex: 1, fontSize: 12.5, padding: "6px 8px", borderRadius: 6, border: "1px solid #D8D4C0" }}
            />
            <button
              onClick={() => removeTee(t.id)}
              disabled={course.tees.length <= 1}
              style={{ background: "none", border: "none", color: course.tees.length <= 1 ? "#D8D4C0" : "#B5442E", padding: 4 }}
            >
              <X size={15} />
            </button>
          </div>
        ))}
        <div className="mono" style={{ fontSize: 9.5, color: "#8A8774", marginBottom: 8, display: "flex", gap: 12 }}>
          <span style={{ flex: 1.3 }}>Label</span><span style={{ flex: 1 }}>Course rating</span><span style={{ flex: 1 }}>Slope</span><span style={{ width: 15 }} />
        </div>
        <button
          onClick={addTee}
          style={{
            width: "100%", padding: "8px 0", borderRadius: 7, border: `1px dashed ${headerColor}`,
            background: "transparent", color: headerColor, fontWeight: 600, fontSize: 12.5,
            display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
          }}
        >
          <Plus size={13} /> Add tee
        </button>
      </div>

      <div style={{ background: "#FFFFFF", borderRadius: 10, padding: 14, border: "1px solid #E4E0D0" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
          <div style={{ fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", color: "#8A8774" }}>
            Holes — par / stroke index
          </div>
          <div className="mono" style={{ fontSize: 12, fontWeight: 700, color: headerColor }}>
            Total par {coursePar(course)}
          </div>
        </div>
        {holeGrid(OUT, "Out")}
        {holeGrid(IN, "In")}
      </div>

      <div style={{ background: "#FFFFFF", borderRadius: 10, padding: 14, border: "1px solid #E4E0D0", marginTop: 12 }}>
        <div style={{ fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", color: "#8A8774", marginBottom: 8 }}>
          Saved courses
        </div>
        <div style={{ fontSize: 11.5, color: "#6B6B5F", marginBottom: 8 }}>
          Saves whatever's currently in the "Course / venue name" field above — <strong>{course.name}</strong> — as its own entry.
        </div>
        {(() => {
          const existingMatch = library.find((e) => e.name.trim().toLowerCase() === course.name.trim().toLowerCase());
          if (existingMatch && !confirmOverwriteSave) {
            return (
              <button
                onClick={() => setConfirmOverwriteSave(true)}
                style={{ width: "100%", padding: "9px 0", borderRadius: 7, border: `1px solid #B5442E`, background: "#FBEDEA", color: "#B5442E", fontSize: 13, fontWeight: 600, marginBottom: 10 }}
              >
                ⚠ This will overwrite "{existingMatch.name}"
              </button>
            );
          }
          if (existingMatch && confirmOverwriteSave) {
            return (
              <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
                <button
                  onClick={() => { onSaveToLibrary(course.name); setConfirmOverwriteSave(false); }}
                  style={{ flex: 1, padding: "9px 0", borderRadius: 7, border: "none", background: "#B5442E", color: "#FFFFFF", fontSize: 12.5, fontWeight: 600 }}
                >
                  Yes, overwrite it
                </button>
                <button
                  onClick={() => setConfirmOverwriteSave(false)}
                  style={{ flex: 1, padding: "9px 0", borderRadius: 7, border: "1px solid #D8D4C0", background: "transparent", color: "#6B6B5F", fontSize: 12.5, fontWeight: 600 }}
                >
                  Cancel
                </button>
              </div>
            );
          }
          return (
            <button
              onClick={() => onSaveToLibrary(course.name)}
              style={{ width: "100%", padding: "9px 0", borderRadius: 7, border: "none", background: headerColor, color: "#FFFFFF", fontSize: 13, fontWeight: 600, marginBottom: 10 }}
            >
              Save "{course.name}" to library
            </button>
          );
        })()}
        <button
          onClick={() => onUpdate({ name: "New course", tees: DEFAULT_COURSE.tees, holes: DEFAULT_COURSE.holes })}
          style={{ width: "100%", padding: "9px 0", borderRadius: 7, border: `1px dashed ${headerColor}`, background: "transparent", color: headerColor, fontSize: 13, fontWeight: 600, marginBottom: 12 }}
        >
          + Add new course (start blank)
        </button>
        {library.length === 0 ? (
          <div style={{ fontSize: 12, color: "#9B9885" }}>No courses saved yet — save this one to reuse it next year.</div>
        ) : (
          library.map((entry) => (
            <div key={entry.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 0", borderTop: "1px solid #EFEDE0" }}>
              <div style={{ flex: 1, fontSize: 13, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{entry.name}</div>
              {confirmLoadId === entry.id ? (
                <>
                  <span style={{ fontSize: 10, color: "#8A8774", marginRight: 2 }}>Load this course?</span>
                  <button
                    onClick={() => {
                        const r = onLoadFromLibrary(entry);
                        setConfirmLoadId(null);
                        if (r && r.moved > 0) window.alert(`${r.moved} player${r.moved === 1 ? " was" : "s were"} on a tee that ${entry.name} doesn't have, and ${r.moved === 1 ? "has" : "have"} been moved to its "${r.tee}" tee. Use Bulk-set tee to change anyone who plays a different one.`);
                      }}
                    style={{ fontSize: 11.5, fontWeight: 700, color: headerColor, background: "none", border: "none", padding: "4px 6px" }}
                  >
                    Yes, load
                  </button>
                  <button
                    onClick={() => setConfirmLoadId(null)}
                    style={{ fontSize: 11.5, color: "#9B9885", background: "none", border: "none", padding: "4px 6px" }}
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setConfirmLoadId(entry.id)}
                    style={{ fontSize: 11.5, fontWeight: 600, color: headerColor, background: "none", border: `1px solid ${headerColor}`, borderRadius: 6, padding: "4px 9px" }}
                  >
                    Load
                  </button>
                  <button
                    onClick={() => onDeleteFromLibrary(entry.id)}
                    style={{ background: "none", border: "none", color: "#B5442E", padding: 4 }}
                  >
                    <X size={14} />
                  </button>
                </>
              )}
            </div>
          ))
        )}

        {/* Moving saved courses between sites (e.g. Lucifer -> ORGS): each
            site keeps its own library, so a course is carried across as a
            small file — downloaded here, imported there. */}
        <div style={{ borderTop: "1px solid #EFEDE0", marginTop: 12, paddingTop: 12 }}>
          <div style={{ fontSize: 11.5, color: "#6B6B5F", marginBottom: 8 }}>
            <strong>Use a course on another of your sites:</strong> download the saved courses here, then on the other
            site come to this same screen and import the file. It then appears in that site's list to Load.
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              disabled={library.length === 0}
              onClick={() => {
                const d = new Date();
                const stamp = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
                downloadTextFile(`golf-courses-${stamp}.json`, JSON.stringify({ kind: "golf-course-library", formatVersion: 1, courses: library }, null, 1));
                setLibraryMsg(`Saved ${library.length} course${library.length === 1 ? "" : "s"} to this device's downloads.`);
              }}
              style={{ flex: 1, padding: "9px 0", borderRadius: 7, border: `1px solid ${headerColor}`, background: "transparent", color: headerColor, fontSize: 12.5, fontWeight: 600, opacity: library.length === 0 ? 0.45 : 1 }}
            >
              Download saved courses
            </button>
            <button
              onClick={() => libraryFileRef.current && libraryFileRef.current.click()}
              style={{ flex: 1, padding: "9px 0", borderRadius: 7, border: `1px solid ${headerColor}`, background: "transparent", color: headerColor, fontSize: 12.5, fontWeight: 600 }}
            >
              Import courses file…
            </button>
          </div>
          <input
            ref={libraryFileRef}
            type="file"
            accept=".json,application/json"
            style={{ display: "none" }}
            onChange={(e) => {
              const file = e.target.files && e.target.files[0];
              e.target.value = "";
              if (!file) return;
              const reader = new FileReader();
              reader.onload = async () => {
                try {
                  const parsed = JSON.parse(String(reader.result || ""));
                  if (!parsed || parsed.kind !== "golf-course-library" || !Array.isArray(parsed.courses)) throw new Error("wrong file");
                  const r = await onImportLibrary(parsed.courses);
                  if (r.added + r.replaced === 0) setLibraryMsg(`"${file.name}" had no usable courses in it — nothing changed.`);
                  else setLibraryMsg(`Imported: ${r.added} added${r.replaced ? `, ${r.replaced} updated` : ""}${r.failed ? " — but it couldn't be saved; check your connection and try again" : ""}. Tap Load next to a course to use it for this day.`);
                } catch {
                  setLibraryMsg(`"${file.name}" isn't a courses file from this app — nothing changed.`);
                }
              };
              reader.readAsText(file);
            }}
          />
          {libraryMsg && <div style={{ fontSize: 11.5, fontWeight: 600, color: headerColor, marginTop: 8 }}>{libraryMsg}</div>}
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AppInner />
    </ErrorBoundary>
  );
}
