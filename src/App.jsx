import React, { useState, useEffect, useRef, useCallback } from "react";
import { Flag, Users, ChevronRight, Radio, Settings, Plus, X, Clipboard, Lock, FileText, Upload } from "lucide-react";
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
    { id: "W", label: "White", cr: 72.0, slope: 129 },
    { id: "Y", label: "Yellow", cr: 70.7, slope: 127 },
  ],
};

const DEFAULT_ORG_NAME = "Your Golf Society";
const STORAGE_PREFIX = "golf-live-scoreboard-v2";

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

function codeFromUrl() {
  try {
    return sanitizeCode(new URLSearchParams(window.location.search).get("code"));
  } catch {
    return "";
  }
}
const LIBRARY_KEY = "golf-course-library-v1";
const OUT = [1,2,3,4,5,6,7,8,9], IN = [10,11,12,13,14,15,16,17,18];

function coursePar(course) {
  return course.holes.reduce((sum, h) => sum + Number(h.par || 0), 0);
}

function getTee(course, teeId) {
  return course.tees.find((t) => t.id === teeId) || course.tees[0];
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
  const allowedA = allowedHandicap(rawA, allowancePct);
  const allowedB = allowedHandicap(rawB, allowancePct);
  return Math.floor((allowedA + allowedB) / 2 + 0.5);
}

function strokesOnHole(course, ph, holeIdx) {
  const si = course.holes[holeIdx].si;
  let s = ph >= si ? 1 : 0;
  if (ph > 18) s += (ph - 18) >= si ? 1 : 0;
  return s;
}

function holePoints(course, gross, holeIdx, ph) {
  if (gross == null || gross === "") return null;
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
    : allowedHandicap(playingHandicap(course, Number(player.index) || 0, player.tee), allowancePct);
  let pts = 0, thru = 0, netTotal = 0, parSoFar = 0;
  const scores = Array.isArray(player.scores) ? player.scores : Array(18).fill("");
  scores.forEach((g, i) => {
    if (g == null || g === "") return;
    thru += 1;
    const strokes = strokesOnHole(course, ph, i);
    netTotal += Number(g) - strokes;
    parSoFar += course.holes[i].par;
    const p = holePoints(course, g, i, ph);
    if (p !== null) pts += p;
  });
  return { ph, pts, thru, netTotal, relToPar: netTotal - parSoFar };
}

function emptyPlayer(course, isFoursomes = false) {
  const base = { id: crypto.randomUUID(), name: "", index: "", tee: course.tees[0]?.id || "W", scores: Array(18).fill("") };
  if (isFoursomes) {
    return { ...base, partnerName: "", partnerIndex: "", partnerTee: course.tees[0]?.id || "W" };
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
      let teeId = course.tees[0]?.id || "";
      if (teeRaw) {
        const match = course.tees.find(
          (t) => t.label.toLowerCase() === teeRaw || t.id.toLowerCase() === teeRaw
        );
        if (match) teeId = match.id;
      }
      return { id: crypto.randomUUID(), name, index, tee: teeId, scores: Array(18).fill("") };
    })
    .filter((p) => p.name);
}

function isValidCourse(c) {
  return !!c && Array.isArray(c.holes) && c.holes.length > 0 && Array.isArray(c.tees) && c.tees.length > 0;
}

const DEFAULT_PIN = "1234";

const MAX_ROUNDS = 3;

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
function findIndividualByName(rosterPlayers, name) {
  const target = (name || "").trim().toLowerCase();
  if (!target) return null;
  for (const p of rosterPlayers) {
    if ((p.name || "").trim().toLowerCase() === target) {
      return { index: p.index, tee: p.tee };
    }
    if ((p.partnerName || "").trim().toLowerCase() === target) {
      return { index: p.partnerIndex, tee: p.partnerTee };
    }
  }
  return null;
}

// Builds Foursomes roster pairs straight from the draw's groupings — every
// draw entry's names are taken two at a time (1st+2nd, 3rd+4th within that
// group), pulling each person's existing handicap/tee from the current
// roster by name. This replaces the whole roster with proper pairs.
function pairPlayersFromDraw(players, draw, course) {
  const validTee = (teeId) => (teeId && course.tees.some((t) => t.id === teeId)) ? teeId : course.tees[0]?.id || "";
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
        scores: Array(18).fill(""),
        partnerName: nameB || "",
        partnerIndex: pB ? pB.index : "",
        partnerTee: validTee(pB && pB.tee),
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
  return freshPairs.map((np) => {
    const existing = players.find(
      (p) => p.name === np.name && (p.partnerName || "") === (np.partnerName || "")
    );
    return existing
      ? { ...np, id: existing.id, index: existing.index, tee: existing.tee, partnerIndex: existing.partnerIndex, partnerTee: existing.partnerTee, scores: existing.scores }
      : np;
  });
}

function individualPH(course, rosterPlayer, allowancePct) {
  if (!rosterPlayer) return null;
  return allowedHandicap(playingHandicap(course, Number(rosterPlayer.index) || 0, rosterPlayer.tee), allowancePct);
}

function pairPH(course, rosterPlayers, allowancePct, nameA, nameB) {
  const a = findIndividualByName(rosterPlayers, nameA);
  const b = findIndividualByName(rosterPlayers, nameB);
  if (!a || !b) return null;
  const allowedA = individualPH(course, a, allowancePct);
  const allowedB = individualPH(course, b, allowancePct);
  return Math.floor((allowedA + allowedB) / 2 + 0.5);
}

// Draw groups only ever store names (not full player records), so shots are
// looked up against the current roster + course each time this renders —
// meaning it's always correct for whichever course this day is set to,
// with no separate step to keep it in sync.
function formatGroupNamesWithShots(names, course, rosterPlayers, allowancePct, isFoursomes) {
  if (!names || names.length === 0) return "";
  const withPh = (n) => {
    const p = findIndividualByName(rosterPlayers, n);
    const ph = individualPH(course, p, allowancePct);
    return ph !== null ? `${n} (${ph})` : n;
  };

  if (names.length === 4) {
    if (isFoursomes) {
      const phA = pairPH(course, rosterPlayers, allowancePct, names[0], names[1]);
      const phB = pairPH(course, rosterPlayers, allowancePct, names[2], names[3]);
      const pairAStr = `${names[0]} & ${names[1]}${phA !== null ? ` (${phA})` : ""}`;
      const pairBStr = `${names[2]} & ${names[3]}${phB !== null ? ` (${phB})` : ""}`;
      return `${pairAStr} v ${pairBStr}`;
    }
    return `${withPh(names[0])} & ${withPh(names[1])} v ${withPh(names[2])} & ${withPh(names[3])}`;
  }
  return names.map(withPh).join(" & ");
}

function emptyRound(label, course) {
  return {
    id: crypto.randomUUID(),
    label,
    course: course || DEFAULT_COURSE,
    players: [],
    draw: [],
    localRules: "",
    startingHole: "1st",
    format: "individual", // individual | foursomes
    scoring: "stableford", // stableford | medal
    handicapAllowance: 100, // percentage of course handicap allowed
    drawStartTime: "09:00",
    drawInterval: 8,
  };
}

function sanitizeRound(r, fallbackLabel) {
  return {
    id: typeof r.id === "string" && r.id ? r.id : crypto.randomUUID(),
    label: typeof r.label === "string" && r.label ? r.label : fallbackLabel,
    course: isValidCourse(r.course) ? r.course : DEFAULT_COURSE,
    players: Array.isArray(r.players) ? r.players : [],
    draw: Array.isArray(r.draw) ? r.draw : [],
    localRules: typeof r.localRules === "string" ? r.localRules : "",
    startingHole: typeof r.startingHole === "string" && r.startingHole ? r.startingHole : "1st",
    format: r.format === "foursomes" ? "foursomes" : "individual",
    scoring: r.scoring === "medal" ? "medal" : "stableford",
    handicapAllowance: typeof r.handicapAllowance === "number" && r.handicapAllowance > 0 ? r.handicapAllowance : 100,
    drawStartTime: typeof r.drawStartTime === "string" && r.drawStartTime ? r.drawStartTime : "09:00",
    drawInterval: typeof r.drawInterval === "number" && r.drawInterval > 0 ? r.drawInterval : 8,
  };
}

const DEFAULT_STATE = {
  orgName: DEFAULT_ORG_NAME,
  accentColor: "#3B6D8C",
  headerColor: "#1F2A37",
  pin: DEFAULT_PIN,
  rounds: [emptyRound("Day 1")],
  activeRoundId: null, // resolved to rounds[0].id at use-time if null/stale
  documents: [], // event-wide, not tied to any particular day
};

function sanitizeState(parsed) {
  let rounds;
  if (Array.isArray(parsed.rounds) && parsed.rounds.length > 0) {
    rounds = parsed.rounds.slice(0, MAX_ROUNDS).map((r, i) => sanitizeRound(r, `Day ${i + 1}`));
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
        "Day 1"
      ),
    ];
  } else {
    rounds = [emptyRound("Day 1")];
  }

  const activeRoundId = rounds.some((r) => r.id === parsed.activeRoundId) ? parsed.activeRoundId : rounds[0].id;

  return {
    orgName: typeof parsed.orgName === "string" && parsed.orgName ? parsed.orgName : DEFAULT_ORG_NAME,
    accentColor: typeof parsed.accentColor === "string" && parsed.accentColor ? parsed.accentColor : DEFAULT_STATE.accentColor,
    headerColor: typeof parsed.headerColor === "string" && parsed.headerColor ? parsed.headerColor : DEFAULT_STATE.headerColor,
    pin: typeof parsed.pin === "string" && parsed.pin ? parsed.pin : DEFAULT_PIN,
    rounds,
    activeRoundId,
    documents: Array.isArray(parsed.documents) ? parsed.documents : [],
  };
}

// ---- Combined standings across every round, matched by player name ----
function combinedStandings(rounds) {
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
    const effectivePlayers =
      round.format === "foursomes" && round.draw.length > 0
        ? mergedPairsFromDraw(round.players, round.draw, round.course)
        : round.players;
    effectivePlayers.forEach((p) => {
      const t = totals(round.course, p, round.handicapAllowance, round.format === "foursomes");
      credit(p.name, round.id, t);
      // On a Foursomes day, both partners earned this result together — the
      // combined-across-days table only makes sense (and stays comparable
      // to Individual/Medal days) if each person is credited individually,
      // not just whichever name happens to be stored first in the pair.
      if (round.format === "foursomes" && p.partnerName) {
        credit(p.partnerName, round.id, t);
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
    const effectivePlayers =
      round.draw.length > 0 ? mergedPairsFromDraw(round.players, round.draw, round.course) : round.players;
    effectivePlayers.forEach((p) => {
      const nameA = (p.name || "").trim();
      const nameB = (p.partnerName || "").trim();
      if (!nameA) return;
      const key = nameB ? [nameA, nameB].sort().join(" & ") : nameA;
      const display = nameB ? [nameA, nameB].sort().join(" & ") : nameA;
      const t = totals(round.course, p, round.handicapAllowance, true);
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
function parsePastedDraw(text) {
  const parsed = Papa.parse(text.trim(), { delimiter: "\t", skipEmptyLines: true });
  let rows = parsed.data;
  if (rows.length === 0) return [];

  // If the first row's time column has no digits at all, it's a header
  // row (e.g. "Time, Group") rather than an actual tee time — drop it.
  if (!/\d/.test(rows[0][0] || "")) {
    rows = rows.slice(1);
  }

  return rows
    .map((cols) => {
      const time = (cols[0] || "").trim();
      const players = cols.slice(1).map((c) => (c || "").trim()).filter(Boolean);
      return { id: crypto.randomUUID(), time, players };
    })
    .filter((r) => r.time || r.players.length > 0);
}

function CodeGate({ onSubmit }) {
  const [value, setValue] = useState("");

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
        <Flag size={26} color="#8A8774" style={{ marginBottom: 10 }} />
        <div style={{ fontSize: 19, fontWeight: 700, marginBottom: 4 }}>Live Leaderboard</div>
        <div style={{ fontSize: 13, color: "#6B6B5F", marginBottom: 18 }}>
          Enter the event code your scorer gave you.
        </div>
        <input
          autoFocus
          value={value}
          onChange={(e) => setValue(e.target.value.toUpperCase())}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder="e.g. LGS2026"
          className="mono"
          style={{
            width: "100%", fontSize: 20, textAlign: "center", letterSpacing: "0.15em", padding: "12px 0",
            borderRadius: 8, border: "1px solid #D8D4C0", marginBottom: 10, textTransform: "uppercase",
            background: "#FFFFFF",
          }}
        />
        <button
          onClick={submit}
          style={{ width: "100%", padding: "11px 0", borderRadius: 8, border: "none", background: "#1B2A4A", color: "#FFFFFF", fontWeight: 600, fontSize: 14 }}
        >
          Continue
        </button>
        <div style={{ fontSize: 11, color: "#9B9885", marginTop: 16 }}>
          Setting up a new meeting? Just type a new code to start it —
          your scorer PIN protects it from there.
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
  const eventCodeRef = useRef(eventCode);
  useEffect(() => { eventCodeRef.current = eventCode; }, [eventCode]);

  const [mode, setMode] = useState("board"); // board | draw | scorer
  // All persisted event state lives in one object now, saved with a single
  // functional update (setState(prev => ({...prev, ...patch}))) — this
  // avoids the class of bug where a stale positional argument silently
  // clobbers a different field than intended.
  const [state, setState] = useState(DEFAULT_STATE);
  const { orgName, accentColor, headerColor, pin, rounds, activeRoundId, documents } = state;
  const activeRound = rounds.find((r) => r.id === activeRoundId) || rounds[0];
  const { course, players, draw, localRules, startingHole, format, scoring, handicapAllowance, drawStartTime, drawInterval } = activeRound;
  const isFoursomes = format === "foursomes";
  const isMedal = scoring === "medal";
  const [loading, setLoading] = useState(true);
  const [live, setLive] = useState(false);
  const [syncError, setSyncError] = useState(false);
  const [activeId, setActiveId] = useState(null);
  const [showCourseSetup, setShowCourseSetup] = useState(false);
  const [showDrawSetup, setShowDrawSetup] = useState(false);
  const [showLocalRulesSetup, setShowLocalRulesSetup] = useState(false);
  const [showDocumentsSetup, setShowDocumentsSetup] = useState(false);
  const [library, setLibrary] = useState([]);
  // Unlocking Scorer entry is per-browser-tab, not persisted — anyone who
  // knows the PIN can enter it fresh each time they open the link, which
  // is the point (keeps casual players from fumbling into edit mode).
  const [scorerUnlocked, setScorerUnlocked] = useState(false);
  const [showPinPrompt, setShowPinPrompt] = useState(false);
  const [showDaySwitcher, setShowDaySwitcher] = useState(false);
  const pollRef = useRef(null);
  const modeRef = useRef(mode);
  useEffect(() => { modeRef.current = mode; }, [mode]);

  const load = useCallback(async () => {
    const code = eventCodeRef.current;
    if (!code) return;
    try {
      const res = await window.storage.get(storageKeyFor(code), true);
      if (modeRef.current !== "board") return;
      setState(res ? sanitizeState(JSON.parse(res.value)) : DEFAULT_STATE);
      setLive(true);
    } catch (err) {
      if (modeRef.current !== "board") return;
      if (String(err).toLowerCase().includes("not found") || String(err).toLowerCase().includes("404")) {
        setState(DEFAULT_STATE);
      }
      setLive(true);
    } finally {
      setLoading(false);
    }
  }, []);

  // patch is a partial update — e.g. save({ players: next }) or
  // save({ course: nextCourse }) — merged onto the latest state via the
  // functional setState form, so it's always correct even if several
  // saves fire close together.
  const save = useCallback((patch) => {
    const code = eventCodeRef.current;
    if (!code) return;
    setState((prev) => {
      const next = { ...prev, ...patch };
      window.storage.set(storageKeyFor(code), JSON.stringify(next), true)
        .then(() => setSyncError(false))
        .catch(() => setSyncError(true));
      return next;
    });
  }, []);

  // Switching event code means switching to a completely different data
  // set — reset everything local before the new code's load() runs, so
  // there's no flash of the previous event's players/course.
  useEffect(() => {
    if (!eventCode) return;
    setLoading(true);
    setState(DEFAULT_STATE);
    setActiveId(null);
    setShowCourseSetup(false);
    setScorerUnlocked(false);
    setMode("board");
  }, [eventCode]);

  const enterEventCode = (raw) => {
    const code = sanitizeCode(raw);
    if (!code) return;
    try {
      const url = new URL(window.location.href);
      url.searchParams.set("code", code);
      window.history.replaceState(null, "", url);
    } catch {
      // ignore — URL update is a nicety, not required for the app to work
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
    // Loading a different course means a different meeting — start with
    // a clean player list rather than mixing last year's scores in.
    updateRound({ course: entry.course, players: [] });
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

  useEffect(() => {
    if (mode !== "board") return;
    pollRef.current = setInterval(load, 5000);
    return () => clearInterval(pollRef.current);
  }, [mode, load]);

  // Every field that used to live at the top level (course, players, draw,
  // localRules, startingHole) now belongs to a specific round — this merges
  // a patch onto the currently active round and leaves the others untouched.
  const updateRound = (patch) => {
    save({ rounds: rounds.map((r) => (r.id === activeRoundId ? { ...r, ...patch } : r)) });
  };

  const addPlayer = () => {
    const next = [...players, emptyPlayer(course, isFoursomes)];
    updateRound({ players: next });
    setActiveId(next[next.length - 1].id);
  };

  const importPlayers = (newPlayers) => {
    updateRound({ players: [...players, ...newPlayers] });
  };

  const loadExample = () => updateRound({ players: exampleSeed(course) });

  const updatePlayer = (id, patch) => {
    updateRound({ players: players.map((p) => (p.id === id ? { ...p, ...patch } : p)) });
  };

  // Lets a handicap be edited straight from the draw builder — looks up
  // whoever has this name, whether they're currently a primary roster
  // entry or stored as someone's partner, and updates the right field.
  const updatePlayerIndexByName = (name, newIndex) => {
    const target = (name || "").trim().toLowerCase();
    updateRound({
      players: players.map((p) => {
        if ((p.name || "").trim().toLowerCase() === target) return { ...p, index: newIndex };
        if ((p.partnerName || "").trim().toLowerCase() === target) return { ...p, partnerIndex: newIndex };
        return p;
      }),
    });
  };

  const updateScore = (id, holeIdx, val) => {
    const clean = val === "" ? "" : Math.max(0, Math.min(15, Number(val)));
    updateRound({
      players: players.map((p) =>
        p.id === id
          ? { ...p, scores: p.scores.map((s, i) => (i === holeIdx ? clean : s)) }
          : p
      ),
    });
  };

  const removePlayer = (id) => updateRound({ players: players.filter((p) => p.id !== id) });

  const clearAllPlayers = () => updateRound({ players: [] });

  const copyPlayersFromRound = (sourceRoundId) => {
    const source = rounds.find((r) => r.id === sourceRoundId);
    if (!source) return;

    const validTee = (teeId) => (teeId && course.tees.some((t) => t.id === teeId)) ? teeId : course.tees[0]?.id || "";

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
          partnerTee: b ? validTee(b.tee) : course.tees[0]?.id || "",
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

  const updateOrgName = (name) => save({ orgName: name });

  const updateAccentColor = (color) => save({ accentColor: color });

  const updateHeaderColor = (color) => save({ headerColor: color });

  const updatePin = (newPin) => save({ pin: newPin });

  const updateDraw = (newDraw) => {
    if (!isFoursomes) {
      updateRound({ draw: newDraw });
      return;
    }
    updateRound({ draw: newDraw, players: syncPairsFromDraw(players, newDraw) });
  };

  const updateLocalRules = (text) => updateRound({ localRules: text });

  const updateStartingHole = (hole) => updateRound({ startingHole: hole });

  const updateFormat = (f) => {
    if (f === "foursomes" && draw.length > 0) {
      updateRound({ format: f, players: syncPairsFromDraw(players, draw) });
      return;
    }
    updateRound({ format: f });
  };

  const updateScoring = (s) => updateRound({ scoring: s });

  // Belt-and-braces: updateDraw/updateFormat above resync pairs the moment
  // you actively change something, but this catches everything else too —
  // data that was already stale before this fix existed, a page reload,
  // switching to a different day, etc. Runs a cheap comparison and only
  // writes if the roster's pairing genuinely doesn't match the draw.
  useEffect(() => {
    if (loading || !isFoursomes || draw.length === 0) return;
    const fresh = pairPlayersFromDraw(players, draw, course);
    const sig = (list) => list.map((p) => `${p.name}|${p.partnerName || ""}`).sort().join(",");
    if (sig(players) !== sig(fresh)) {
      updateRound({ players: syncPairsFromDraw(players, draw) });
    }
    // Deliberately not depending on `players` — this should react to the
    // draw/format changing (or a fresh load), not to every score edit.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isFoursomes, draw, activeRoundId, loading]);

  const updateDrawStartTime = (t) => updateRound({ drawStartTime: t });

  const updateDrawInterval = (mins) => updateRound({ drawInterval: mins });

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
    save({ documents: [...documents, entry] });
    return { ok: true };
  };

  const removeDocument = async (docId) => {
    const code = eventCodeRef.current;
    save({ documents: documents.filter((d) => d.id !== docId) });
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
    // Open the tab synchronously, inside the click itself — most browsers
    // block window.open() called after an await, treating it as an
    // unrequested popup rather than something the user just clicked.
    const w = window.open();
    (async () => {
      try {
        const res = await window.storage.get(docStorageKey(code, doc.id), true);
        const blobUrl = dataUrlToBlobUrl(res.value);
        if (w) w.location.href = blobUrl;
      } catch {
        if (w) w.close();
      }
    })();
  };

  const addRound = () => {
    if (rounds.length >= MAX_ROUNDS) return;
    const newRound = emptyRound(`Day ${rounds.length + 1}`, course);
    save({ rounds: [...rounds, newRound], activeRoundId: newRound.id });
  };

  const renameRound = (roundId, label) => {
    save({ rounds: rounds.map((r) => (r.id === roundId ? { ...r, label } : r)) });
  };

  const removeRound = (roundId) => {
    if (rounds.length <= 1) return;
    const next = rounds.filter((r) => r.id !== roundId);
    save({ rounds: next, activeRoundId: activeRoundId === roundId ? next[0].id : activeRoundId });
  };

  const setActiveRound = (roundId) => save({ activeRoundId: roundId });

  const handleScorerTap = () => {
    if (scorerUnlocked) {
      setMode("scorer");
    } else {
      setShowPinPrompt(true);
    }
  };

  const ranked = [...players]
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

  if (!eventCode) {
    return <CodeGate onSubmit={enterEventCode} />;
  }

  return (
    <div style={{ background: "#F1EFE3", minHeight: "100vh", fontFamily: "'Iowan Old Style','Georgia',serif", color: "#1B1B1B" }}>
      <style>{`
        .mono { font-family: 'Courier New', ui-monospace, monospace; }
        .scoreInput::-webkit-outer-spin-button, .scoreInput::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
        .scoreInput { -moz-appearance: textfield; }
      `}</style>

      {/* Header */}
      <div style={{ background: headerColor, color: "#F1EFE3", padding: "18px 16px 22px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Flag size={20} color={accentColor} />
            <span style={{ fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", opacity: 0.75 }}>
              {orgName}
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, opacity: 0.85 }}>
            <Radio size={13} color={live ? "#7FB88F" : accentColor} />
            {live ? "Live" : "Connecting…"}
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
            className="mono"
            style={{
              marginTop: 8, fontSize: 13, fontWeight: 700, padding: "6px 10px", borderRadius: 7,
              border: "1px solid rgba(241,239,227,0.4)", background: "rgba(241,239,227,0.12)", color: "#F1EFE3",
              display: "inline-flex", alignItems: "center", gap: 6,
            }}
          >
            {activeRound.label}
            <ChevronRight size={13} style={{ transform: "rotate(90deg)" }} />
          </button>
        )}
        <div style={{ fontSize: 12.5, opacity: 0.7, marginTop: 2, display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <span>Stableford · Par {coursePar(course)} · {players.length} {players.length === 1 ? "player" : "players"}</span>
          {scorerUnlocked && (
            <button
              onClick={switchEvent}
              style={{ background: "none", border: "none", color: "#F1EFE3", opacity: 0.7, fontSize: 11, textDecoration: "underline", padding: 0 }}
            >
              Switch event
            </button>
          )}
        </div>
        {syncError && (
          <div style={{ fontSize: 11, color: "#F1EFE3", background: "rgba(181,68,46,0.85)", borderRadius: 6, padding: "4px 8px", marginTop: 8 }}>
            Last change didn't save — check your connection and try again.
          </div>
        )}

        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 14 }}>
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
            onClick={handleScorerTap}
            style={{
              flex: "1 1 30%", padding: "8px 0", borderRadius: 7, border: "1px solid rgba(241,239,227,0.25)",
              background: mode === "scorer" ? "#F1EFE3" : "transparent",
              color: mode === "scorer" ? headerColor : "#F1EFE3",
              fontSize: 12, fontWeight: 600, letterSpacing: "0.02em",
            }}
          >
            Scorer entry
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: 40, textAlign: "center", color: "#6B6B5F" }}>Loading…</div>
      ) : mode === "board" ? (
        <Board rounds={rounds} headerColor={headerColor} accentColor={accentColor} />
      ) : mode === "draw" ? (
        // Public, like the leaderboard — no PIN needed just to see the draw.
        <DrawView draw={draw} startingHole={startingHole} headerColor={headerColor} accentColor={accentColor} course={course} players={players} handicapAllowance={handicapAllowance} isFoursomes={isFoursomes} />
      ) : mode === "rules" ? (
        // Public too — anyone can read the local rules without a PIN.
        <LocalRulesView text={localRules} headerColor={headerColor} accentColor={accentColor} />
      ) : mode === "docs" ? (
        // Public — a list of PDFs anyone can open, no PIN needed.
        <DocumentsView documents={documents} onOpen={openDocument} headerColor={headerColor} accentColor={accentColor} />
      ) : !scorerUnlocked ? (
        // Guard: mode can only reach "scorer" via handleScorerTap, which
        // requires scorerUnlocked — but if that state is ever false here
        // (e.g. a stale render), fall back to the board rather than
        // exposing the scorer screens.
        <Board rounds={rounds} headerColor={headerColor} accentColor={accentColor} />
      ) : showDrawSetup ? (
        <DrawSetup
          draw={draw}
          players={players}
          onUpdate={updateDraw}
          startingHole={startingHole}
          onUpdateStartingHole={updateStartingHole}
          onBack={() => setShowDrawSetup(false)}
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
          roundLabel={activeRound.label}
          onRenameRound={(label) => renameRound(activeRoundId, label)}
          onUpdatePlayerIndex={updatePlayerIndexByName}
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
      ) : showCourseSetup ? (
        <CourseSetup
          orgName={orgName}
          onUpdateOrgName={updateOrgName}
          accentColor={accentColor}
          onUpdateAccentColor={updateAccentColor}
          headerColor={headerColor}
          onUpdateHeaderColor={updateHeaderColor}
          pin={pin}
          onUpdatePin={updatePin}
          course={course}
          onUpdate={updateCourse}
          onBack={() => setShowCourseSetup(false)}
          library={library}
          onSaveToLibrary={saveCourseToLibrary}
          onLoadFromLibrary={loadCourseFromLibrary}
          onDeleteFromLibrary={deleteCourseFromLibrary}
          rounds={rounds}
          activeRoundId={activeRoundId}
          onAddRound={addRound}
          onRenameRound={renameRound}
          onRemoveRound={removeRound}
          onSetActiveRound={setActiveRound}
        />
      ) : active ? (
        <ScoreEntry
          course={course}
          player={active}
          onBack={() => setActiveId(null)}
          onUpdate={(patch) => updatePlayer(active.id, patch)}
          onScore={(hole, val) => updateScore(active.id, hole, val)}
          headerColor={headerColor}
          isFoursomes={format === "foursomes"}
          isMedal={isMedal}
          handicapAllowance={handicapAllowance}
        />
      ) : (
        <ScorerList
          course={course}
          ranked={ranked}
          onSelect={setActiveId}
          onAdd={addPlayer}
          onRemove={removePlayer}
          onLoadExample={loadExample}
          onOpenCourseSetup={() => setShowCourseSetup(true)}
          onOpenDrawSetup={() => setShowDrawSetup(true)}
          onOpenLocalRulesSetup={() => setShowLocalRulesSetup(true)}
          onOpenDocumentsSetup={() => setShowDocumentsSetup(true)}
          onImport={importPlayers}
          onClearAll={clearAllPlayers}
          headerColor={headerColor}
          accentColor={accentColor}
          onLock={() => { setScorerUnlocked(false); setMode("board"); setActiveId(null); setShowCourseSetup(false); setShowDrawSetup(false); setShowLocalRulesSetup(false); setShowDocumentsSetup(false); }}
          rounds={rounds}
          activeRoundId={activeRoundId}
          onCopyPlayers={copyPlayersFromRound}
          isFoursomes={isFoursomes}
        />
      )}

      {showPinPrompt && (
        <PinPrompt
          pin={pin}
          accentColor={accentColor}
          headerColor={headerColor}
          onSuccess={() => {
            setScorerUnlocked(true);
            setShowPinPrompt(false);
            setMode("scorer");
          }}
          onCancel={() => setShowPinPrompt(false)}
        />
      )}
      {showDaySwitcher && (
        <DaySwitcher
          rounds={rounds}
          activeRoundId={activeRoundId}
          headerColor={headerColor}
          accentColor={accentColor}
          onSelect={(id) => { setActiveRound(id); setShowDaySwitcher(false); }}
          onClose={() => setShowDaySwitcher(false)}
        />
      )}
    </div>
  );
}

function PinPrompt({ pin, accentColor, headerColor, onSuccess, onCancel }) {
  const [entry, setEntry] = useState("");
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
        <div style={{ fontSize: 15, fontWeight: 700, color: headerColor, marginBottom: 4 }}>Scorer PIN</div>
        <div style={{ fontSize: 12, color: "#8A8774", marginBottom: 14 }}>Enter the PIN to enter scores or edit the course.</div>
        <input
          autoFocus
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

function DaySwitcher({ rounds, activeRoundId, headerColor, accentColor, onSelect, onClose }) {
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
          return (
            <button
              key={r.id}
              onClick={() => onSelect(r.id)}
              style={{
                width: "100%", textAlign: "left", padding: "12px 12px", borderRadius: 9, marginBottom: 6,
                border: isActive ? `1px solid ${accentColor}` : "1px solid #E4E0D0",
                background: isActive ? `${accentColor}14` : "#FFFFFF",
                display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8,
              }}
            >
              <span style={{ fontSize: 14, fontWeight: 600, color: isActive ? accentColor : "#1B1B1B" }}>
                {r.label}
              </span>
              <span className="mono" style={{ fontSize: 10.5, color: "#8A8774", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                {r.format === "foursomes" ? "Foursomes" : "Singles"}
              </span>
            </button>
          );
        })}
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

function Board({ rounds, headerColor, accentColor }) {
  const [tab, setTab] = useState("singles"); // singles | foursomes
  const singlesRounds = rounds.filter((r) => r.format !== "foursomes");
  const foursomesRounds = rounds.filter((r) => r.format === "foursomes");
  const activeRounds = tab === "singles" ? singlesRounds : foursomesRounds;

  return (
    <div style={{ padding: "14px 12px 40px" }}>
      <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
        <button
          onClick={() => setTab("singles")}
          style={{
            flex: 1, padding: "8px 0", borderRadius: 7, border: `1px solid ${headerColor}`,
            background: tab === "singles" ? headerColor : "transparent",
            color: tab === "singles" ? "#FFFFFF" : headerColor, fontSize: 12.5, fontWeight: 600,
          }}
        >
          Singles
        </button>
        <button
          onClick={() => setTab("foursomes")}
          style={{
            flex: 1, padding: "8px 0", borderRadius: 7, border: `1px solid ${headerColor}`,
            background: tab === "foursomes" ? headerColor : "transparent",
            color: tab === "foursomes" ? "#FFFFFF" : headerColor, fontSize: 12.5, fontWeight: 600,
          }}
        >
          Foursomes
        </button>
      </div>
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
          computeStandings={tab === "foursomes" ? combinedPairStandings : combinedStandings}
          rowLabel={tab === "foursomes" ? "Pair" : "Player"}
        />
      )}
    </div>
  );
}

function OverallBoard({ rounds, headerColor, accentColor, computeStandings, rowLabel = "Player" }) {
  const standings = (computeStandings || combinedStandings)(rounds);

  if (standings.length === 0) {
    return (
      <div style={{ padding: "40px 12px", textAlign: "center", color: "#6B6B5F" }}>
        <Flag size={28} color={accentColor} style={{ marginBottom: 10 }} />
        <div style={{ fontSize: 15 }}>No scores posted yet on any day.</div>
      </div>
    );
  }

  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", background: "#FFFFFF", borderRadius: 10, overflow: "hidden" }}>
        <thead>
          <tr style={{ background: `${headerColor}12` }}>
            <th style={{ textAlign: "left", padding: "9px 10px", fontSize: 11, color: "#8A8774", fontWeight: 700 }}>#</th>
            <th style={{ textAlign: "left", padding: "9px 10px", fontSize: 11, color: "#8A8774", fontWeight: 700 }}>{rowLabel}</th>
            {rounds.map((r) => (
              <th key={r.id} className="mono" style={{ textAlign: "right", padding: "9px 10px", fontSize: 11, color: "#8A8774", fontWeight: 700, whiteSpace: "nowrap" }}>
                {r.label}
              </th>
            ))}
            <th className="mono" style={{ textAlign: "right", padding: "9px 10px", fontSize: 11, color: headerColor, fontWeight: 700 }}>Total</th>
          </tr>
        </thead>
        <tbody>
          {standings.map((row, i) => (
            <tr key={row.name} style={{ borderTop: "1px solid #EFEDE0" }}>
              <td className="mono" style={{ padding: "9px 10px", fontSize: 13, fontWeight: 700, color: i < 3 && row.anyPlayed ? headerColor : "#9B9885" }}>
                {i + 1}
              </td>
              <td style={{ padding: "9px 10px", fontSize: 13.5, fontWeight: 600 }}>{row.name}</td>
              {rounds.map((r) => {
                const t = row.perRound[r.id];
                return (
                  <td key={r.id} className="mono" style={{ textAlign: "right", padding: "9px 10px", fontSize: 13 }}>
                    {t && t.thru > 0 ? t.pts : "–"}
                  </td>
                );
              })}
              <td className="mono" style={{ textAlign: "right", padding: "9px 10px", fontSize: 14, fontWeight: 700, color: headerColor }}>
                {row.anyPlayed ? row.total : "–"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
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

function DrawView({ draw, startingHole, headerColor, accentColor, course, players, handicapAllowance, isFoursomes }) {
  if (draw.length === 0) {
    return (
      <div style={{ padding: "48px 24px", textAlign: "center", color: "#6B6B5F" }}>
        <Clipboard size={28} color={accentColor} style={{ marginBottom: 10 }} />
        <div style={{ fontSize: 15 }}>The draw hasn't been posted yet.</div>
        <div style={{ fontSize: 12.5, marginTop: 4 }}>Check back once your scorer has added tee times.</div>
      </div>
    );
  }
  return (
    <div style={{ padding: "14px 12px 40px" }}>
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
      {draw.map((entry) => (
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
          <div style={{ fontSize: 14, flex: 1 }}>
            {entry.players && entry.players.length > 0
              ? formatGroupNamesWithShots(entry.players, course, players, handicapAllowance, isFoursomes)
              : entry.group || "—"}
          </div>
        </div>
      ))}
    </div>
  );
}

function DrawSetup({ draw, players, onUpdate, startingHole, onUpdateStartingHole, onBack, headerColor, accentColor, course, format, onUpdateFormat, scoring, onUpdateScoring, handicapAllowance, onUpdateHandicapAllowance, library, onLoadFromLibrary, drawStartTime, onUpdateDrawStartTime, drawInterval, onUpdateDrawInterval, roundLabel, onRenameRound, onUpdatePlayerIndex }) {
  const [tab, setTab] = useState("build"); // build | paste
  const [pasteText, setPasteText] = useState("");
  const [msg, setMsg] = useState("");
  const [confirmLoadId, setConfirmLoadId] = useState(null);

  const doImport = () => {
    const parsed = parsePastedDraw(pasteText);
    if (parsed.length === 0) {
      setMsg("No rows found — make sure each line starts with a time.");
      return;
    }
    onUpdate(parsed);
    setMsg(`Draw set — ${parsed.length} group${parsed.length === 1 ? "" : "s"}.`);
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
          style={{ width: "100%", fontSize: 15, fontWeight: 700, border: "1px solid #D8D4C0", borderRadius: 7, padding: "7px 9px", fontFamily: "inherit" }}
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
                    <span style={{ fontSize: 10, color: "#8A8774", marginRight: 2 }}>Clears players?</span>
                    <button
                      onClick={() => { onLoadFromLibrary(entry); setConfirmLoadId(null); }}
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
        </div>
        {format === "foursomes" && (
          <div style={{ fontSize: 10.5, color: "#8A8774", marginBottom: 12 }}>
            Each roster entry becomes a pair. Combined handicap = (Player A's + Player B's course handicap) ÷ 2, exact halves rounded up.
          </div>
        )}

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
            onChange={(e) => onUpdateHandicapAllowance(Math.max(1, Math.min(100, Number(e.target.value) || 100)))}
            className="mono"
            style={{ width: 80, fontSize: 14, fontWeight: 700, padding: "7px 9px", borderRadius: 7, border: "1px solid #D8D4C0" }}
          />
          <span style={{ fontSize: 13, color: "#6B6B5F" }}>%</span>
        </div>
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
        <DrawBuilder draw={draw} players={players} onUpdate={onUpdate} headerColor={headerColor} accentColor={accentColor} course={course} handicapAllowance={handicapAllowance} isFoursomes={format === "foursomes"} startTime={drawStartTime} onUpdateStartTime={onUpdateDrawStartTime} intervalMinutes={drawInterval} onUpdateInterval={onUpdateDrawInterval} onUpdatePlayerIndex={onUpdatePlayerIndex} />
      ) : (
        <>
          <div style={{ background: "#FFFFFF", borderRadius: 10, padding: 14, border: "1px solid #E4E0D0", marginBottom: 12 }}>
            <div style={{ fontSize: 12.5, fontWeight: 700, marginBottom: 6 }}>Paste the draw</div>
            <div style={{ fontSize: 11.5, color: "#6B6B5F", marginBottom: 8 }}>
              One tee time per line: Time, then each player in their own column (copy straight from your
              spreadsheet). Pasting replaces the whole draw below.
            </div>
            <textarea
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
              placeholder={"9:00\tSmith\tJones\tBrown\tWhite\n9:10\tOkonkwo\tPetrov"}
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
                <div key={entry.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0", borderTop: "1px solid #EFEDE0" }}>
                  <div className="mono" style={{ fontWeight: 700, color: headerColor, fontSize: 12.5, minWidth: 56 }}>{entry.time}</div>
                  <div style={{ flex: 1, fontSize: 12.5 }}>
                    {entry.players && entry.players.length > 0
                      ? formatGroupNamesWithShots(entry.players, course, players, handicapAllowance, format === "foursomes")
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

function addMinutes(timeStr, minutesToAdd) {
  const m = /^(\d{1,2}):(\d{2})$/.exec((timeStr || "").trim());
  if (!m) return timeStr || "";
  const total = (parseInt(m[1], 10) * 60 + parseInt(m[2], 10) + minutesToAdd + 1440 * 10) % 1440;
  const hh = String(Math.floor(total / 60)).padStart(2, "0");
  const mm = String(total % 60).padStart(2, "0");
  return `${hh}:${mm}`;
}

function DrawBuilder({ draw, players, onUpdate, headerColor, accentColor, course, handicapAllowance, isFoursomes, startTime, onUpdateStartTime, intervalMinutes, onUpdateInterval, onUpdatePlayerIndex }) {
  // Local working copy — rows of up to 4 player slots each. Seeded from
  // whatever draw already exists so re-opening this doesn't lose work.
  const [rows, setRows] = useState(() => {
    if (draw.length > 0) {
      return draw.map((entry) => ({
        id: entry.id,
        time: entry.time || "",
        slots: [0, 1, 2, 3].map((i) => (entry.players && entry.players[i]) || null),
      }));
    }
    return [{ id: crypto.randomUUID(), time: "", slots: [null, null, null, null] }];
  });
  const [selected, setSelected] = useState(null); // player name currently picked up
  const [savedMsg, setSavedMsg] = useState(false);
  const [editingSlot, setEditingSlot] = useState(null); // { rowId, slotIdx, name } | null
  // startTime/intervalMinutes are now saved as part of the round (passed in
  // as props) rather than local state — previously these reset to defaults
  // any time this screen was left and re-opened.

  const assignedNames = new Set(rows.flatMap((r) => r.slots.filter(Boolean)));
  const pool = players
    .filter((p) => p.name && !assignedNames.has(p.name))
    .sort((a, b) => a.name.localeCompare(b.name));

  const pickUp = (name) => setSelected(selected === name ? null : name);

  const placeInSlot = (rowId, slotIdx) => {
    if (!selected) return;
    setRows((prev) =>
      prev.map((r) => (r.id === rowId ? { ...r, slots: r.slots.map((s, i) => (i === slotIdx ? selected : s)) } : r))
    );
    setSelected(null);
  };

  const clearSlot = (rowId, slotIdx) => {
    setRows((prev) =>
      prev.map((r) => (r.id === rowId ? { ...r, slots: r.slots.map((s, i) => (i === slotIdx ? null : s)) } : r))
    );
  };

  // First tap on a filled slot opens the handicap editor rather than
  // clearing it straight away — clearing now happens via the explicit
  // "Remove from pair" button inside that editor, which is far more
  // reliable on touch screens than trying to detect a genuine double-tap.
  const tapSlot = (rowId, slotIdx, name) => {
    if (name) {
      setEditingSlot({ rowId, slotIdx, name });
    } else {
      placeInSlot(rowId, slotIdx);
    }
  };

  const setTime = (rowId, time) => setRows((prev) => prev.map((r) => (r.id === rowId ? { ...r, time } : r)));

  const addRow = () =>
    setRows((prev) => [
      ...prev,
      { id: crypto.randomUUID(), time: addMinutes(startTime, intervalMinutes * prev.length), slots: [null, null, null, null] },
    ]);

  const fillAllTimes = () =>
    setRows((prev) => prev.map((r, i) => ({ ...r, time: addMinutes(startTime, intervalMinutes * i) })));

  const removeRow = (rowId) => setRows((prev) => prev.filter((r) => r.id !== rowId));

  const saveDraw = () => {
    const finalDraw = rows

      .filter((r) => r.time.trim() || r.slots.some(Boolean))
      .map((r) => ({ id: r.id, time: r.time.trim(), players: r.slots.filter(Boolean) }));
    onUpdate(finalDraw);
    setSavedMsg(true);
    setTimeout(() => setSavedMsg(false), 1500);
  };

  return (
    <div>
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
              onChange={(e) => onUpdateInterval(Math.max(1, Number(e.target.value) || 1))}
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
          New rows auto-fill from these. "Fill times" renumbers every row's time in order.
        </div>
      </div>

      <div
        style={{
          background: "#FFFFFF", borderRadius: 10, padding: 14, border: "1px solid #E4E0D0", marginBottom: 12,
          position: "sticky", top: 0, zIndex: 20, boxShadow: "0 4px 10px rgba(0,0,0,0.08)",
        }}
      >
        <div style={{ fontSize: 11.5, color: "#6B6B5F", marginBottom: 8 }}>
          Tap a player below, then tap a slot to place them there. Tap a filled slot to send them back to the pool.
        </div>
        <div style={{ fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", color: "#8A8774", marginBottom: 6 }}>
          Players {pool.length > 0 ? `(${pool.length} unplaced)` : "— all placed"}
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, maxHeight: 140, overflowY: "auto" }}>
          {pool.length === 0 && (
            <div style={{ fontSize: 12, color: "#9B9885" }}>
              {players.length === 0 ? "Add players in Scorer entry first." : "Every player has been placed below."}
            </div>
          )}
          {pool.map((p) => (
            <button
              key={p.id}
              onClick={() => pickUp(p.name)}
              style={{
                padding: "6px 11px", borderRadius: 20, fontSize: 12.5, fontWeight: 600,
                border: selected === p.name ? `2px solid ${accentColor}` : "1px solid #D8D4C0",
                background: selected === p.name ? `${accentColor}14` : "#FFFFFF",
                color: selected === p.name ? accentColor : "#1B1B1B",
              }}
            >
              {p.name}
            </button>
          ))}
        </div>
      </div>

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
            <button onClick={() => removeRow(row.id)} style={{ background: "none", border: "none", color: "#B5442E", padding: 4 }}>
              <X size={15} />
            </button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6 }}>
            {row.slots.map((name, slotIdx) => (
              <button
                key={slotIdx}
                onClick={() => tapSlot(row.id, slotIdx, name)}
                style={{
                  minHeight: 44, borderRadius: 7, fontSize: 11.5, fontWeight: 600, padding: "4px 4px",
                  border: name ? `1px solid ${headerColor}` : selected ? `1px dashed ${accentColor}` : "1px dashed #D8D4C0",
                  background: name ? `${headerColor}12` : "#FBFAF6",
                  color: name ? headerColor : "#C2BEA9",
                }}
              >
                {name || "—"}
              </button>
            ))}
          </div>
          {row.slots.some(Boolean) && (
            <div className="mono" style={{ fontSize: 10.5, color: "#8A8774", marginTop: 6 }}>
              {formatGroupNamesWithShots(row.slots.filter(Boolean), course, players, handicapAllowance, isFoursomes)}
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
          headerColor={headerColor}
          accentColor={accentColor}
          onSave={(newIndex) => {
            onUpdatePlayerIndex(editingSlot.name, newIndex);
            setEditingSlot(null);
          }}
          onRemove={() => {
            clearSlot(editingSlot.rowId, editingSlot.slotIdx);
            setEditingSlot(null);
          }}
          onClose={() => setEditingSlot(null)}
        />
      )}
    </div>
  );
}

function SlotHandicapEditor({ name, currentIndex, headerColor, accentColor, onSave, onRemove, onClose }) {
  const [value, setValue] = useState(currentIndex);

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
        <div style={{ fontSize: 11, color: "#8A8774", marginBottom: 4 }}>Handicap index</div>
        <input
          autoFocus
          type="number"
          inputMode="decimal"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="mono"
          style={{ width: "100%", fontSize: 18, padding: "9px 10px", borderRadius: 8, border: "1px solid #D8D4C0", marginBottom: 14 }}
        />
        <button
          onClick={() => onSave(value)}
          style={{ width: "100%", padding: "10px 0", borderRadius: 8, border: "none", background: headerColor, color: "#FFFFFF", fontWeight: 600, fontSize: 13.5, marginBottom: 8 }}
        >
          Save
        </button>
        <button
          onClick={onRemove}
          style={{ width: "100%", padding: "10px 0", borderRadius: 8, border: "1px solid #B5442E", background: "transparent", color: "#B5442E", fontWeight: 600, fontSize: 13.5, marginBottom: 8 }}
        >
          Remove from pair
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
        <div style={{ fontSize: 12.5, marginTop: 4 }}>Check back once your scorer has added them.</div>
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

function DocumentsView({ documents, onOpen, headerColor, accentColor }) {
  if (documents.length === 0) {
    return (
      <div style={{ padding: "48px 24px", textAlign: "center", color: "#6B6B5F" }}>
        <FileText size={28} color={accentColor} style={{ marginBottom: 10 }} />
        <div style={{ fontSize: 15 }}>No documents posted yet.</div>
        <div style={{ fontSize: 12.5, marginTop: 4 }}>Check back once your scorer has added something.</div>
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

function ScorerList({ course, ranked, onSelect, onAdd, onRemove, onLoadExample, onOpenCourseSetup, onOpenDrawSetup, onOpenLocalRulesSetup, onOpenDocumentsSetup, onImport, onClearAll, headerColor, accentColor, onLock, rounds, activeRoundId, onCopyPlayers, isFoursomes }) {
  const [pasteOpen, setPasteOpen] = useState(false);
  const [pasteText, setPasteText] = useState("");
  const [importMsg, setImportMsg] = useState("");
  const [confirmClear, setConfirmClear] = useState(false);

  // The roster here is for finding/editing a player, not for ranking — sort
  // it alphabetically rather than reusing the score-based leaderboard order.
  const alphaSorted = [...ranked].sort((a, b) =>
    (a.displayName || a.name || "").localeCompare(b.displayName || b.name || "")
  );
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
      <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
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
        <button
          onClick={onLock}
          title="Lock scorer mode"
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

      {ranked.length > 0 && (
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 10 }}>
          {confirmClear ? (
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 11, color: "#8A8774" }}>Remove all {ranked.length} players?</span>
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
      {ranked.length === 0 && !isFoursomes && (
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
              <div style={{ fontSize: 14, fontWeight: 600 }}>
                {isFoursomes
                  ? `${p.name || "New pair"}${p.partnerName ? ` & ${p.partnerName}` : " — add partner"}`
                  : p.name || "New player"}
              </div>
              <div className="mono" style={{ fontSize: 11, color: "#8A8774" }}>
                {getTee(course, p.tee)?.label} tee · thru {p.thru}/18 · {p.thru > 0 ? `${p.pts} pts` : "not started"}
              </div>
            </div>
            <ChevronRight size={16} color="#9B9885" />
          </button>
          <button onClick={() => onRemove(p.id)} style={{ background: "none", border: "none", color: "#B5442E", fontSize: 11, padding: "4px 6px" }}>
            Remove
          </button>
        </div>
      ))}
      {ranked.length === 0 && rounds && rounds.some((r) => r.id !== activeRoundId && r.players.length > 0) && (
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

function ScoreEntry({ course, player, onBack, onUpdate, onScore, headerColor, isFoursomes, isMedal, handicapAllowance }) {
  const { ph, pts, netTotal, relToPar } = totals(course, player, handicapAllowance, isFoursomes);
  const rawA = playingHandicap(course, Number(player.index) || 0, player.tee);
  const allowedA = allowedHandicap(rawA, handicapAllowance);
  const rawB = isFoursomes ? playingHandicap(course, Number(player.partnerIndex) || 0, player.partnerTee) : null;
  const allowedB = isFoursomes ? allowedHandicap(rawB, handicapAllowance) : null;
  const strokeHoles = course.holes.map((h, i) => strokesOnHole(course, ph, i)).map((s, i) => ({ hole: i + 1, strokes: s })).filter((h) => h.strokes > 0);
  const inputRefs = useRef({});
  const timers = useRef({});

  // Auto-advance to the next hole once a score looks "finished" — instantly
  // for single-digit scores that can't extend to two digits (2-9), after a
  // brief pause for scores starting "1" (which might become 10-15), and
  // immediately on Enter/Return regardless.
  useEffect(() => {
    return () => Object.values(timers.current).forEach(clearTimeout);
  }, []);

  const focusNext = (idx) => {
    const next = inputRefs.current[idx + 1];
    if (next) {
      next.focus();
      next.select?.();
    }
  };

  const handleChange = (idx, rawVal) => {
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
        const netVsPar = val !== "" ? (Number(val) - strokesOnHole(course, ph, idx)) - course.holes[idx].par : null;
        return (
          <div key={h} style={{ textAlign: "center" }}>
            <div className="mono" style={{ fontSize: 9.5, color: "#9B9885" }}>{h}</div>
            <div className="mono" style={{ fontSize: 8.5, color: "#C2BEA9" }}>Par {course.holes[idx].par}</div>
            <input
              ref={(el) => (inputRefs.current[idx] = el)}
              className="mono scoreInput"
              type="number"
              inputMode="numeric"
              value={val}
              onChange={(e) => handleChange(idx, e.target.value)}
              onKeyDown={(e) => handleKeyDown(idx, e)}
              style={{
                width: "100%", textAlign: "center", padding: "6px 0", marginTop: 2,
                borderRadius: 6, border: "1px solid #D8D4C0", fontSize: 14, fontWeight: 700,
                background: val !== "" ? `${headerColor}14` : "#FFF",
              }}
            />
            <div className="mono" style={{ fontSize: 9, color: headerColor, marginTop: 2, minHeight: 12 }}>
              {isMedal ? (netVsPar !== null ? formatRelToPar(netVsPar) : "") : (p !== null ? `${p}pt` : "")}
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

      <div style={{ background: "#FFFFFF", borderRadius: 10, padding: 14, border: "1px solid #E4E0D0", marginBottom: 12 }}>
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
                {course.tees.map((t) => (
                  <option key={t.id} value={t.id}>{t.label}</option>
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
                value={player.partnerTee || course.tees[0]?.id}
                onChange={(e) => onUpdate({ partnerTee: e.target.value })}
                style={{ fontSize: 13, padding: "8px 10px", borderRadius: 7, border: "1px solid #D8D4C0", background: "#FFF" }}
              >
                {course.tees.map((t) => (
                  <option key={t.id} value={t.id}>{t.label}</option>
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
                {course.tees.map((t) => (
                  <option key={t.id} value={t.id}>{t.label}</option>
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

      <div style={{ fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", color: "#8A8774", marginBottom: 6 }}>Out</div>
      {nine(OUT)}
      <div style={{ fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", color: "#8A8774", marginBottom: 6 }}>In</div>
      {nine(IN)}
    </div>
  );
}

function CourseSetup({ orgName, onUpdateOrgName, accentColor, onUpdateAccentColor, headerColor, onUpdateHeaderColor, pin, onUpdatePin, course, onUpdate, onBack, library, onSaveToLibrary, onLoadFromLibrary, onDeleteFromLibrary, rounds, activeRoundId, onAddRound, onRenameRound, onRemoveRound, onSetActiveRound }) {
  const [confirmLoadId, setConfirmLoadId] = useState(null);
  const [confirmRemoveRoundId, setConfirmRemoveRoundId] = useState(null);
  const [confirmOverwriteSave, setConfirmOverwriteSave] = useState(false);
  const setHole = (idx, field, val) => {
    const clean = val === "" ? "" : Math.max(1, Math.min(field === "par" ? 7 : 18, Number(val)));
    const holes = course.holes.map((h, i) => (i === idx ? { ...h, [field]: clean } : h));
    onUpdate({ holes });
  };

  const setTee = (id, field, val) => {
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
          Everything below (course, tees, holes) applies to whichever day is bold above. Players are separate per day too — use "Copy from another day" in Scorer entry to reuse a roster.
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
        <div style={{ marginTop: 14 }}>
          <div style={{ fontSize: 11, color: "#8A8774", marginBottom: 3 }}>
            Scorer PIN <span style={{ textTransform: "none", letterSpacing: 0 }}>(required to enter Scorer entry)</span>
          </div>
          <input
            value={pin}
            onChange={(e) => onUpdatePin(e.target.value.replace(/[^0-9]/g, "").slice(0, 6))}
            inputMode="numeric"
            className="mono"
            style={{ width: 120, fontSize: 15, fontWeight: 700, border: "1px solid #D8D4C0", borderRadius: 7, padding: "7px 9px", letterSpacing: "0.15em" }}
          />
        </div>
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
              onChange={(e) => setTee(t.id, "cr", Number(e.target.value))}
              placeholder="CR"
              style={{ flex: 1, fontSize: 12.5, padding: "6px 8px", borderRadius: 6, border: "1px solid #D8D4C0" }}
            />
            <input
              className="mono" type="number" inputMode="numeric"
              value={t.slope}
              onChange={(e) => setTee(t.id, "slope", Number(e.target.value))}
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
                  <span style={{ fontSize: 10, color: "#8A8774", marginRight: 2 }}>Clears players?</span>
                  <button
                    onClick={() => { onLoadFromLibrary(entry); setConfirmLoadId(null); }}
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
