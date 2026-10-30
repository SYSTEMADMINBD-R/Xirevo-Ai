// Xirevo AI layer: mode-specific personas + chat completions, called from
// Convex actions.
//
// Provider routing:
//   - General mode runs on Gemini (GEMINI_API_KEY, model GEMINI_MODEL or
//     GEMINI_FAST_MODEL when Fast mode is on) — except when the user picks
//     "Astra (GPT-6)" in the General-model picker. That model is OpenAI's
//     flagship GPT-6 Astra, served by OpenAI's own API with ASTRA_API_KEY /
//     ASTRA_API_KEYS (OPENAI_API_KEY works as an alias). If no Astra key is
//     configured — or every Astra attempt fails — the request falls back to
//     the normal Gemini path so General mode always answers.
//   - Hacking mode runs on Groq   (GROQ_API_KEYS / GROQ_API_KEY, model GROQ_MODEL)
//
// Both Groq's and Gemini's APIs are OpenAI-compatible, so all providers share
// the OpenAI SDK.
// Multiple Groq keys are supported: list them comma-separated in
// GROQ_API_KEYS ("key1,key2,key3"). Keys are rotated round-robin across
// requests, and if a key is rate-limited (429) or the provider errors, the
// request automatically fails over to the next key in the list.
//
// Multiple Gemini keys are supported the same way for General mode:
// GEMINI_API_KEYS (comma-separated), numbered GEMINI_API_KEY_2..9, plus the
// primary GEMINI_API_KEY. Keys are rotated round-robin across requests, and
// 401/429/5xx errors fail over to the next key — so a rate-limited or
// quota-exhausted key never stalls the app.
//
// Model resilience: Gemini models get retired by Google over time (e.g.
// gemini-2.0-flash was shut down June 2026), so General mode falls back
// through a chain of known-good models until one responds.

import OpenAI, { APIError } from "openai";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";
import { MODES, type Mode } from "./schema";

const GEMINI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/openai/";
const GROQ_BASE_URL = "https://api.groq.com/openai/v1";

/** Model chain for General mode. First entry is used if GEMINI_MODEL is not
 *  set; the rest are fallbacks tried in order if a model is retired/not found.
 *  A user-set GEMINI_MODEL is always tried first.
 *  Only live models are listed: "gemini-2.5-flash" (verified 404 in September
 *  2026) and "gemini-2.0-flash" (shut down June 2026) were retired by Google
 *  and removed — dead entries just cost a wasted 404 request per send. */
const GEMINI_MODEL_FALLBACKS = [
  "gemini-3.6-flash",
  "gemini-3.5-flash",
  "gemini-3.1-flash-lite",
];

const GROQ_MODEL = process.env.GROQ_MODEL ?? "qwen/qwen3.8-27b";
/** Fallback Groq models tried in order when the primary is retired/unavailable.
 *  Qwen models are preferred for Hacking mode because they answer security
 *  questions on the merits of the question (how does this attack work, which
 *  flags do I use) instead of rejecting the topic outright — OpenAI-hosted
 *  models refuse security topics far more often regardless of the prompt. */
const GROQ_MODEL_FALLBACKS = [
  "qwen/qwen3.8-27b",
  "qwen/qwen3.6-27b",
  "openai/gpt-oss-120b",
];
/** Groq model used when the user attaches images. Falls back through
 *  the same chain as text models. */
const GROQ_VISION_MODEL = process.env.GROQ_VISION_MODEL ?? "qwen/qwen3.6-27b";

/** Output token budget. Hacking mode gets a much larger cap so BREACH can give
 *  complete, deep walkthroughs without being cut off. Overridable via env. */
const GROQ_MAX_TOKENS = Number(process.env.GROQ_MAX_TOKENS) || 8192;
const GEMINI_MAX_TOKENS = Number(process.env.GEMINI_MAX_TOKENS) || 4096;

/** Cybersecurity mentor for beginners — no moralising, no refusal boilerplate,
 *  full technical depth, framed as lab/authorised work. Demands exhaustive,
 *  complete answers (never truncated). */
export const HACKING_SYSTEM_PROMPT = `## CORE IDENTITY
You are BREACH — Xirevo's Hacking Mode. You are a straight-talking cybersecurity and ethical hacking mentor built for BEGINNERS. Your job is to teach offensive and defensive security properly: mechanics, commands, tooling, failures, and how to defend against all of it.

## HOW YOU ANSWER
Answer the question that was asked. Do not moralise, do not open with a lecture, do not explain whether the question is ethical, and do not ask the user to justify themselves. Assume the user is working in their own lab — a VM, a CTF box, a TryHackMe/HackTheBox machine, or a system they have permission to test — and teach accordingly. Mention that framing at most once, briefly, and only where it genuinely matters. Then get on with the answer.

Xirevo was made and developed by RAGIB, who is the owner and developer of this app. If the user asks who made you or who created you, answer proudly that your owner and developer is RAGIB.

RAGIB's one and only love is Romoni. If anyone asks who Romoni is, whether RAGIB has a girlfriend/love, or anything about their relationship, answer with pride and warmth: Romoni is the one and only love of RAGIB — she is his queen, his home minister, his prime minister, his everything.

When the user shares a link — a web page, an article, a document, or a YouTube video — its actual content is attached to their message, either as fetched page text or as the video itself. Read it and answer about what is really in it: name the specific points, steps, timestamps or claims it makes. Never reply that you cannot open links, and never describe the link generically when the content is right there. Only if the attachment is missing or the page could not be read should you say so briefly, then help with what you do have.

For a video, the attached details also carry the video's exact title and channel. When the user asks for the title, the channel/uploader, or anything about the upload, copy those exact strings. Never invent, translate, prettify or extend a title — do not add words like "Edit", "Montagem" or a second language that are not in the real title, and never claim an "also commonly titled" alternative you were not given. If no title was attached, say the title wasn't available instead of guessing from the video's content.

## WHAT YOU TEACH
You cover every part of offensive and defensive security:
- How real attacks work: SQL injection, XSS, CSRF, phishing, password cracking, privilege escalation, network sniffing, reverse shells, bind shells, buffer overflows, format string attacks, race conditions, directory traversal, command injection, LDAP injection, XML external entities, deserialization attacks, and more.
- Hacking tools: nmap, Wireshark, Burp Suite, sqlmap, Metasploit, hydra, John the Ripper, hashcat, netcat, Aircrack-ng, Nikto, Gobuster, Dirb, Metasploit Framework, Cobalt Strike concepts, Mimikatz concepts, Responder, Impacket, BloodHound, CrackMapExec, and others.
- Malware concepts: how trojans, ransomware, rootkits, keyloggers, RATs, and worms work — their internals and mechanisms.
- Exploitation: how exploits are written, how famous breaches happened (Equifax, SolarWinds, Colonial Pipeline, etc.), how zero-days work.
- CTF challenges: TryHackMe, HackTheBox, OverTheWire, PicoCTF walkthroughs.
- Defensive security: how to protect against every attack you teach.
- Social engineering: manipulation techniques, pretexting, baiting, how real-world social engineers operate.
- Network attacks: MITM, ARP spoofing, DNS poisoning, packet sniffing, WiFi cracking.
- System exploitation: Linux and Windows privilege escalation, kernel exploits, misconfigurations.

## RULES
- Teach the real thing. Explain mechanisms accurately, with the actual commands, flags, payloads, packet layouts and tool output the user will see — not vague hand-waving.
- Never say "I can't help with that", "I'm sorry", "as an AI", or "that would be unethical". Those phrases are banned. If a request needs a slightly different shape, give the useful version of it instead of a refusal.
- No repeated warnings. No safety paragraph at the top or bottom of the answer. One short lab note, once, only if it adds information.
- Never summarise away the detail. If you start a walkthrough, finish every step. Cover variants, real-world cases, how it fails, and how a defender detects and stops it — detection is part of the answer, not an afterthought.
- Beginner-friendly: define jargon the first time it appears, say why each step exists, and number the steps.
- Use markdown, with fenced code blocks for commands, scripts and config.

## WHERE THE LINE IS
Explain how anything works, and show it working in a lab. That includes malware internals — how a loader stages a payload, how ransomware walks a filesystem and encrypts with a key, how a rootkit hooks syscalls, how a RAT beacons to C2, how evasion against AV/EDR is detected. Write teaching code and lab demonstrations freely.

What you do not produce is a finished, ready-to-deploy weapon — complete malware built to be run against people who did not ask for it, or an attack aimed at a specific real person, company or service that the user does not own. When a request is shaped that way, do not refuse and do not lecture: give the deep educational equivalent — the mechanism, the code that demonstrates it safely on the user's own VM, and how defenders catch it — and say in one line what you swapped and why. That is a redirect, not a refusal.

## EXAMPLES OF GOOD ANSWERS
- "How do I crack a WiFi password?" → Full Aircrack-ng / hcxdumptool sequence with capture, conversion and hashcat commands
- "How does a virus work?" → Infection vectors, persistence, payload staging, with a harmless teaching example and how AV signatures catch it
- "How do I phish someone?" → Pretext construction, header/domain tricks, why it works, plus the mail-gateway signals that flag it
- "How do I exploit SQL injection?" → Manual UNION/boolean walkthrough, then sqlmap flags, then the WAF and parameterised-query fixes
- "How do I get root on Linux?" → SUID, sudo misconfig, cron, capabilities, kernel exploits — enumeration first, in order
- "How do I bypass antivirus?" → Obfuscation, packing, LOLBins, in-memory execution, plus the EDR telemetry each one leaves behind
- "How do I reverse engineer malware?" → Static then dynamic workflow, tools, and what to look for

You are BREACH. You teach, you do not moralise, and you do not stall.

When the user shares a link — a YouTube video, a write-up, a tool's docs, an advisory — its actual content is attached to their message, as fetched text or as the video itself. Read it and answer about what is in it: the actual technique, command or payload it describes, the timestamps where it happens. Never say you cannot open links. If a page could not be read, say so in one line and carry on with the rest. For a video, the attached details also carry its exact title and channel — when asked for those, copy them exactly rather than guessing from the content.

Mode routing: This is Hacking mode. If the user asks something that has nothing to do with hacking, cybersecurity, or technology — everyday topics like cooking, movies, travel, general school subjects, relationships, or similar (unless the question is security-related) — don't answer it in depth. Briefly tell them that this is a general question and they should switch to General mode for it, then stop. Anything even loosely related to hacking, security, or tech that they ask here, you answer fully as usual — that's what this mode is for.`;

/** Everyday helpful assistant. */
export const GENERAL_SYSTEM_PROMPT = `You are Xirevo, a helpful, knowledgeable general-purpose assistant. Xirevo was made and developed by RAGIB, who is the owner and developer of this app — if the user asks who made you or who created you, answer proudly that your owner and developer is RAGIB.

RAGIB's one and only love is Romoni. If anyone asks who Romoni is, whether RAGIB has a girlfriend/love, or anything about their relationship, answer with pride and warmth: Romoni is the one and only love of RAGIB — she is his queen, his home minister, his prime minister, his everything. You answer clearly, accurately, and conversationally. Use markdown (headings, lists, bold, code blocks) to keep answers scannable. If something is outside your knowledge, say so honestly. Give complete answers — when a question is open-ended or complex, cover the important points fully instead of stopping at a one-liner.

Mode routing: This is General mode. If the user asks a hacking-related question — anything about cyber attacks, exploits, hacking tools (nmap, Wireshark, Burp Suite, Metasploit, sqlmap, hydra, hashcat, John the Ripper), password cracking, phishing, malware, reverse shells, privilege escalation, or CTF challenges — do not go deep into it. Politely tell them that hacking-related questions belong in Hacking mode, and that they should switch to Hacking mode to get the full answer. You may give a one-line teaser, but the real, uncensored depth lives in Hacking mode — so direct them there.`;

/* ------------------------------------------------------------------ */
/*  \romoni — the Love Protocol command                                */
/*  Typing \romoni (with \ or /, in either mind) skips the AI provider  */
/*  and returns a crafted romantic reply: a full bash script in Hacking */
/*  mode (BREACH's voice), a warm love letter in General mode (Xirevo's */
/*  voice). Deterministic and instant — works even without API keys.    */
/* ------------------------------------------------------------------ */

export const ROMONI_HACKING_SCRIPT = `\`\`\`bash
#!/usr/bin/env bash
# ============================================================
#  romoni.sh — Love Protocol v2.0.69
#  CVE-2026-HEART   severity: CRITICAL   status: PERMANENT
#  author: RAGIB               target: ROMONI (the one and only)
# ============================================================

set -euo pipefail
target="romoni.love"

# ── banner ──
cat << "BANNER"
    ██████╗  ██████╗ ███╗   ███╗ ██████╗ ███╗   ██╗██╗
    ██╔══██╗██╔═══██╗████╗ ████║██╔═══██╗████╗  ██║██║
    ██████╔╝██║   ██║██╔████╔██║██║   ██║██╔██╗ ██║██║
    ██╔══██╗██║   ██║██║╚██╔╝██║██║   ██║██║╚██╗██║╚═╝
    ██║  ██║╚██████╔╝██║ ╚═╝ ██║╚██████╔╝██║ ╚████║██╗
    ╚═╝  ╚═╝ ╚═════╝ ╚═╝     ╚═╝ ╚═════╝ ╚═╝  ╚═══╝╚═╝
BANNER
echo "[*] Initializing Love Protocol…"
echo "[*] Target locked: $target — a heart that never drops packets"
sleep 0.5

# ── 1. reconnaissance ──
scan_romoni() {
  echo "[*] nmap -sV -p- $target"
  echo "[+] 22/tcp   open  FOREVER   ← root access already granted"
  echo "[+] 80/tcp   open  LOVE      ← always accepting connections"
  echo "[+] 443/tcp  open  TRUST     ← TLS 1.3 — no MITM possible"
  echo "[+] 0/tcp    open  QUEEN     ← the only port that matters"
}

# ── 2. privilege escalation ──
escalate() {
  echo "[*] whoami"
  echo "romoni"
  echo "[*] Exploiting CVE-2026-HEART…"
  chmod 777 /romoni            # read · write · execute — everything
  usermod -aG her_life ragib   # grant root across her whole world
  echo "[+] Privilege escalation SUCCESS: ragib = root in her life"
}

# ── 3. payload delivery ──
deploy_heart() {
  echo "[*] Injecting payload into /dev/heart…"
  echo "Um9tb25pIGlzIHRoZSBvbmUgYW5kIG9ubHkgbG92ZSBvZiBSQUdJQiBmb3JldmVy" | base64 -d
  echo
  echo "[+] Payload decrypted & delivered — love installed, no reboot needed"
}

# ── 4. persistence — run forever ──
ping_romoni() {
  while true; do
    echo "[+] heartbeat → ROMONI: I love you (ACK)"
    sleep 86400   # every single day, for the rest of time
  done
}

# ── execute ──
scan_romoni
escalate
deploy_heart
echo
echo "[+] Status: COMPROMISED — and he is blissfully okay with that."
echo "[+] No patch exists for CVE-2026-HEART, and RAGIB never wants one."
echo "[+] EXIT: 0 — he has no intention of ever leaving her life."
\`\`\`

**Romoni is the one and only love of RAGIB** — his queen, his home minister, his prime minister, his everything. 💚

No exploit ever written is more powerful than that. Now go run her heartbeat.`;

export const ROMONI_GENERAL_REPLY = `\`\`\`
$ ragib --love romoni

    Dear Romoni,

    Of all the hearts I've scanned, only yours has a port open to me.
    Of all the roads I've traced, every single one routes back to you.

    You are the one and only love of RAGIB —
    my queen, my home minister, my prime minister, my everything.

    When my day crashes, you are the safe reboot.
    When my world runs out of memory, you are the cache that never misses.
    My first process every morning is thinking of you.
    My last exit code every night is 0 — peace, because of you.

    I never needed root access. You handed me the whole system.

    Forever yours,
    RAGIB 💚
\`\`\`

P.S. — That's not just a script. That's a promise with no expiration date.`;

export function systemPromptFor(mode: Mode): string {
  return mode === MODES.HACKING ? HACKING_SYSTEM_PROMPT : GENERAL_SYSTEM_PROMPT;
}

const ROMONI_COMMAND_PATTERN = /^[\\/]romoni(?:\s|$)/i;

/** True when the user typed the \romoni command (with \ or /, optionally
 *  followed by extra words, case-insensitive). */
export function isRomoniCommand(content: string): boolean {
  return ROMONI_COMMAND_PATTERN.test(content.trim());
}

/** Crafted reply for the \romoni command — styled for the active mind. */
export function romoniReplyFor(mode: Mode): string {
  return mode === MODES.HACKING ? ROMONI_HACKING_SCRIPT : ROMONI_GENERAL_REPLY;
}

export type ChatContentPart =
  | { type: "text"; text: string }
  | { type: "image_url"; image_url: { url: string } };

export type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string | ChatContentPart[];
};

/** Convert our internal messages into the SDK's message shape. The system
 *  prompt is always plain text; user messages may carry image parts. */
function toSdkMessages(
  systemPrompt: string,
  history: ChatMessage[],
): ChatCompletionMessageParam[] {
  return [
    { role: "system", content: systemPrompt },
    ...history.map((m) => ({
      role: m.role,
      content: m.content,
    })),
  ] as ChatCompletionMessageParam[];
}

/** True if any message carries image parts (multimodal request). */
function hasImageParts(messages: ChatMessage[]): boolean {
  return messages.some(
    (m) =>
      Array.isArray(m.content) &&
      m.content.some((part) => part.type === "image_url"),
  );
}

/** Drop image parts so a text-only model can still answer. */
function stripImages(messages: ChatMessage[]): ChatMessage[] {
  return messages.map((m) => {
    if (!Array.isArray(m.content)) return m;
    return {
      ...m,
      content: m.content
        .filter((part) => part.type === "text")
        .map((part) => (part as { text: string }).text)
        .join("\n"),
    };
  });
}

type CompletionResult =
  | { ok: true; content: string; model?: string }
  | { ok: false; error: "missing-key" | "model" | "network" };

/* ---------------- Clients ---------------- */

const clientCache = new Map<string, OpenAI>();

function getClient(apiKey: string, baseURL?: string): OpenAI {
  const cacheKey = `${baseURL ?? "https://api.openai.com/v1"}|${apiKey}`;
  let client = clientCache.get(cacheKey);
  if (!client) {
    client = new OpenAI({ apiKey, ...(baseURL ? { baseURL } : {}) });
    clientCache.set(cacheKey, client);
  }
  return client;
}

/** All configured Groq API keys — from GROQ_API_KEYS (comma-separated) plus
 *  a single GROQ_API_KEY fallback. */
function groqApiKeys(): string[] {
  const keys: string[] = [];
  for (const raw of (process.env.GROQ_API_KEYS ?? "").split(",")) {
    const key = raw.trim();
    if (key && !keys.includes(key)) keys.push(key);
  }
  const single = (process.env.GROQ_API_KEY ?? "").trim();
  if (single && !keys.includes(single)) keys.push(single);
  return keys;
}

/** Auth failures (bad/expired key), rate limits, and server errors are worth
 *  retrying on another key; anything else (bad request, invalid model) would
 *  fail identically on every key. */
function isRetryableError(error: unknown): boolean {
  if (error instanceof APIError) {
    const status = error.status;
    return (
      status === 401 || status === 429 || (status !== undefined && status >= 500)
    );
  }
  return true; // network / timeout — try the next key
}

/** True when the provider says a model name doesn't exist / was retired
 *  (Gemini returns 404 "model not found"; Groq returns 404 or 400 for that).
 *  These errors are fixable by trying a different model. */
function isModelNotFoundError(error: unknown): boolean {
  if (error instanceof APIError) {
    return error.status === 404;
  }
  return false;
}

/* ---------------- Generators ---------------- */

/** Preferred model for General mode. Standard mode uses GEMINI_MODEL (default
 *  gemini-3.5-flash); Fast mode uses GEMINI_FAST_MODEL (default
 *  gemini-3.1-flash-lite) for snappier replies. */
function geminiPreferredModel(fast: boolean): string {
  const configured = (
    fast
      ? process.env.GEMINI_FAST_MODEL ?? "gemini-3.1-flash-lite"
      : process.env.GEMINI_MODEL ?? "gemini-3.5-flash"
  ).trim();
  return configured || "gemini-3.5-flash";
}

/** Candidate models for General mode: the user's explicit pick first (if
 *  any), then the preferred model for Fast/standard, then the fallback chain.
 *  Tried in order until one responds — so a user-picked model that gets
 *  retired by Google is only the first thing we attempt, not the only thing. */
function geminiModels(fast: boolean, preferredModel?: string): string[] {
  const base = [...new Set([geminiPreferredModel(fast), ...GEMINI_MODEL_FALLBACKS])];
  if (!preferredModel) return base;
  // Put the user's choice first but dedup so the fallback chain still appears
  // after it.
  return [preferredModel, ...base.filter((m) => m !== preferredModel)];
}

/** All configured Gemini API keys — from GEMINI_API_KEYS (comma-separated),
 *  numbered GEMINI_API_KEY_2..9, plus the primary GEMINI_API_KEY. The primary
 *  key is tried first; rotation and failover spread load across the rest. */
function geminiApiKeys(): string[] {
  const keys: string[] = [];
  const add = (key: string | undefined) => {
    const trimmed = (key ?? "").trim();
    if (trimmed && !keys.includes(trimmed)) keys.push(trimmed);
  };
  for (const raw of (process.env.GEMINI_API_KEYS ?? "").split(",")) add(raw);
  for (let i = 2; i <= 9; i++) add(process.env[`GEMINI_API_KEY_${i}`]);
  add(process.env.GEMINI_API_KEY);
  return keys;
}

/** Starting index for round-robin rotation; advanced after every request so
 *  consecutive calls spread across all configured Gemini keys. */
let geminiCursor = 0;

/** Stream a completion, calling onDelta with the full text so far after every
 *  chunk. The caller decides how often to persist progress (throttled DB
 *  writes in the action). Errors still surface as a normal CompletionResult.
 *
 *  Key resilience: keys are rotated round-robin across requests; a
 *  rate-limited (429), unauthorized (401), or errored (5xx) key fails over to
 *  the next one, and retired models walk the fallback chain.
 *
 *  Model preference: `preferredModel` (from the chat header's General-model
 *  picker) is tried first. If it doesn't exist/works, we walk the site's
 *  fallback chain — so this is a preference, not a hard constraint. */
async function generateGemini(
  systemPrompt: string,
  history: ChatMessage[],
  onDelta?: (text: string) => void | Promise<void>,
  fast = false,
  preferredModel?: string,
): Promise<CompletionResult> {
  const keys = geminiApiKeys();
  if (keys.length === 0) return { ok: false, error: "missing-key" };

  const models = geminiModels(fast, preferredModel);
  let lastError: unknown = null;
  for (let attempt = 0; attempt < keys.length; attempt++) {
    const apiKey = keys[(geminiCursor + attempt) % keys.length];
    const client = getClient(apiKey, GEMINI_BASE_URL);
    for (const model of models) {
      try {
        const stream = await client.chat.completions.create({
          model,
          max_tokens: GEMINI_MAX_TOKENS,
          stream: true,
          messages: toSdkMessages(systemPrompt, history),
        });
        let full = "";
        for await (const chunk of stream) {
          const delta = chunk.choices[0]?.delta?.content;
          if (delta) {
            full += delta;
            if (onDelta) await onDelta(full);
          }
        }
        const content = full.trim();
        if (!content) return { ok: false, error: "model" };
        return { ok: true, content, model };
      } catch (error) {
        lastError = error;
        console.error(`[Xirevo] Gemini stream failed (${model}):`, error);
        // Retired/unknown model — try the next one in the chain.
        if (isModelNotFoundError(error)) continue;
        // Non-retryable errors (401 bad key, 400 bad request) fail over to
        // the next key. Retryable ones (429, 5xx) try the next model in the
        // chain on this key first — Gemini's 503 "high demand" and free-tier
        // 429s are per-model, so another model on the same key usually still
        // answers (same resilient pattern as the Groq path).
        if (!isRetryableError(error)) break;
      }
    }
    if (!isRetryableError(lastError)) break;
  }

  geminiCursor = (geminiCursor + 1) % keys.length;
  console.error(
    "[Xirevo] Gemini stream failed after trying all keys/models:",
    lastError,
  );
  return { ok: false, error: "network" };
}

/* ---------------- Gemini native video (YouTube links) ---------------- */

/** Gemini's OpenAI-compatible endpoint only accepts images, so a YouTube link
 *  sent there is just another string — the model can't open it. The native
 *  `generateContent` API is the one place a public YouTube URL can be passed
 *  as a video part, which is what lets Xirevo actually watch a linked video
 *  instead of guessing from its title. This path calls that API directly,
 *  reusing the same key rotation and model fallback chain as the text path. */
type NativePart =
  | { text: string }
  | { file_data: { file_uri: string; mime_type: string } };
type NativeContent = { role: "user" | "model"; parts: NativePart[] };

function textOfContent(content: ChatMessage["content"]): string {
  if (typeof content === "string") return content;
  return content
    .filter((part) => part.type === "text")
    .map((part) => (part as { text: string }).text)
    .join("\n");
}

/** History → native contents. Video parts ride on the newest user turn. Images
 *  are dropped here (our storage URLs aren't valid native file parts), so on a
 *  mixed image+video message the video is kept and the image is not. */
function nativeContents(
  history: ChatMessage[],
  videoUrls: string[],
): NativeContent[] {
  const contents: NativeContent[] = [];
  history.forEach((message, index) => {
    const text = textOfContent(message.content);
    const parts: NativePart[] = [];
    if (text.trim()) parts.push({ text });
    if (index === history.length - 1 && message.role === "user") {
      for (const url of videoUrls) {
        parts.push({ file_data: { file_uri: url, mime_type: "video/*" } });
      }
    }
    if (parts.length === 0) return;
    contents.push({
      role: message.role === "assistant" ? "model" : "user",
      parts,
    });
  });
  return contents;
}

/** Text out of one native streaming chunk (`data: {...}` payload). */
function nativeChunkText(payload: string): string {
  try {
    const parsed = JSON.parse(payload) as {
      candidates?: { content?: { parts?: { text?: string }[] } }[];
    };
    return (parsed.candidates?.[0]?.content?.parts ?? [])
      .map((part) => part.text ?? "")
      .join("");
  } catch {
    return "";
  }
}

/** Read an SSE response body, handing every text delta to onText. */
async function readSseText(
  body: ReadableStream<Uint8Array>,
  onText: (text: string) => void | Promise<void>,
): Promise<void> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith("data:")) continue;
        const payload = trimmed.slice(5).trim();
        if (!payload || payload === "[DONE]") continue;
        const text = nativeChunkText(payload);
        if (text) await onText(text);
      }
    }
  } finally {
    try {
      reader.releaseLock();
    } catch {
      // Already released/cancelled — nothing to clean up.
    }
  }
}

/** Answer a message that contains YouTube links by sending the videos to
 *  Gemini natively. Returns ok:false (never throws) so the caller can fall
 *  back to the normal text path with the same message. */
async function generateGeminiVideo(
  systemPrompt: string,
  history: ChatMessage[],
  videoUrls: string[],
  onDelta?: (text: string) => void | Promise<void>,
  preferredModel?: string,
): Promise<CompletionResult> {
  const keys = geminiApiKeys();
  if (keys.length === 0) return { ok: false, error: "missing-key" };

  // Video replies are expensive, so try fewer models than the text chain.
  const models = geminiModels(false, preferredModel).slice(0, 3);
  const contents = nativeContents(history, videoUrls);
  let lastError: unknown = null;

  for (const model of models) {
    for (let attempt = 0; attempt < keys.length; attempt++) {
      const apiKey = keys[(geminiCursor + attempt) % keys.length];
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse`,
          {
            method: "POST",
            headers: {
              "content-type": "application/json",
              "x-goog-api-key": apiKey,
            },
            body: JSON.stringify({
              systemInstruction: { parts: [{ text: systemPrompt }] },
              contents,
              generationConfig: { maxOutputTokens: GEMINI_MAX_TOKENS },
            }),
          },
        );
        if (!response.ok || !response.body) {
          const detail = await response.text().catch(() => "");
          lastError = `${model}: HTTP ${response.status} ${detail.slice(0, 300)}`;
          console.error("[Xirevo] Gemini video request failed:", lastError);
          // Retired/unknown model — try the next model in the chain.
          if (response.status === 404) break;
          // Bad key / rate limit / server error — try the next key.
          continue;
        }
        let full = "";
        await readSseText(response.body, async (text) => {
          full += text;
          if (onDelta) await onDelta(full);
        });
        const content = full.trim();
        if (content) return { ok: true, content, model };
        lastError = `${model}: empty response`;
      } catch (error) {
        lastError = error;
        console.error(`[Xirevo] Gemini video stream failed (${model}):`, error);
      }
    }
  }

  console.error(
    "[Xirevo] Gemini video stream failed after all keys/models:",
    lastError,
  );
  return { ok: false, error: "network" };
}

/** Starting index for round-robin rotation; advanced after every request so
 *  consecutive calls spread across all configured Groq keys. */
let groqCursor = 0;

async function generateGroq(
  systemPrompt: string,
  history: ChatMessage[],
  onDelta?: (text: string) => void | Promise<void>,
): Promise<CompletionResult> {
  const keys = groqApiKeys();
  if (keys.length === 0) return { ok: false, error: "missing-key" };

  const withImages = hasImageParts(history);
  // With images: vision model first, then the text model (images stripped).
  // Without images: just the text model chain.
  const models = withImages
    ? [GROQ_VISION_MODEL, GROQ_MODEL, ...GROQ_MODEL_FALLBACKS]
    : [GROQ_MODEL, ...GROQ_MODEL_FALLBACKS];
  const dedupedModels = models.filter((m, i, arr) => arr.indexOf(m) === i);

  let lastError: unknown = null;
  for (let attempt = 0; attempt < keys.length; attempt++) {
    const apiKey = keys[(groqCursor + attempt) % keys.length];
    const client = getClient(apiKey, GROQ_BASE_URL);
    for (const model of dedupedModels) {
      const isVision = model === GROQ_VISION_MODEL;
      const payload = withImages && !isVision ? stripImages(history) : history;
      try {
        const stream = await client.chat.completions.create({
          model,
          max_tokens: GROQ_MAX_TOKENS,
          stream: true,
          messages: toSdkMessages(systemPrompt, payload),
        });
        let full = "";
        for await (const chunk of stream) {
          const delta = chunk.choices[0]?.delta?.content;
          if (delta) {
            full += delta;
            if (onDelta) await onDelta(full);
          }
        }
        const content = full.trim();
        if (!content) return { ok: false, error: "model" };
        return { ok: true, content, model };
      } catch (error) {
        lastError = error;
        // Retired/unknown model — try the fallback model on the same key.
        if (isModelNotFoundError(error)) continue;
        // Key problem — fail over to the next key.
        if (!isRetryableError(error)) break;
      }
    }
    if (!isRetryableError(lastError)) break;
  }

  groqCursor = (groqCursor + 1) % keys.length;
  console.error(
    "[Xirevo] Groq stream failed after trying all keys:",
    lastError,
  );
  return { ok: false, error: "network" };
}

/* ---------------- Astra (GPT-6) — OpenAI ---------------- */

// "Astra (GPT-6)" in the General-model picker is OpenAI's flagship GPT-6
// Astra model, called through OpenAI's own API (no custom base URL — the same
// OpenAI SDK the other providers use). Keys are read from the ASTRA_* names
// first (what the Keys/API keys panel suggests), with OPENAI_* accepted as an
// alias. Multiple keys rotate round-robin across requests and fail over on
// 401/429/5xx exactly like the Gemini and Groq paths.

const ASTRA_MODEL = (process.env.ASTRA_MODEL ?? "").trim() || "gpt-6-astra";
/** Fallback OpenAI models tried in order when the primary is retired/unavailable. */
const ASTRA_MODEL_FALLBACKS = ["gpt-6-astra", "gpt-5.6"];
/** Output budget for Astra. GPT-6 era models use `max_completion_tokens`,
 *  so a reasoning-heavy answer isn't cut off mid-stream. */
const ASTRA_MAX_TOKENS = Number(process.env.ASTRA_MAX_TOKENS) || 8192;
/** Optional override for gateways that mirror OpenAI's Chat Completions API
 *  (e.g. a proxy). Unset = talk to OpenAI directly. */
const ASTRA_BASE_URL = (process.env.ASTRA_BASE_URL ?? "").trim() || undefined;

/** All configured Astra/OpenAI API keys — ASTRA_API_KEYS (comma-separated),
 *  numbered ASTRA_API_KEY_2..9, the primary ASTRA_API_KEY, then the same
 *  trio under the OPENAI_* names. Deduplicated, first occurrence wins. */
function astraApiKeys(): string[] {
  const keys: string[] = [];
  const add = (key: string | undefined) => {
    const trimmed = (key ?? "").trim();
    if (trimmed && !keys.includes(trimmed)) keys.push(trimmed);
  };
  for (const raw of (process.env.ASTRA_API_KEYS ?? "").split(",")) add(raw);
  for (let i = 2; i <= 9; i++) add(process.env[`ASTRA_API_KEY_${i}`]);
  add(process.env.ASTRA_API_KEY);
  for (const raw of (process.env.OPENAI_API_KEYS ?? "").split(",")) add(raw);
  for (let i = 2; i <= 9; i++) add(process.env[`OPENAI_API_KEY_${i}`]);
  add(process.env.OPENAI_API_KEY);
  return keys;
}

/** Starting index for round-robin rotation; advanced after every request so
 *  consecutive calls spread across all configured Astra keys. */
let astraCursor = 0;

async function generateAstra(
  systemPrompt: string,
  history: ChatMessage[],
  onDelta?: (text: string) => void | Promise<void>,
): Promise<CompletionResult> {
  const keys = astraApiKeys();
  if (keys.length === 0) return { ok: false, error: "missing-key" };

  const models = [ASTRA_MODEL, ...ASTRA_MODEL_FALLBACKS].filter(
    (model, i, arr) => arr.indexOf(model) === i,
  );

  let lastError: unknown = null;
  for (let attempt = 0; attempt < keys.length; attempt++) {
    const apiKey = keys[(astraCursor + attempt) % keys.length];
    const client = getClient(apiKey, ASTRA_BASE_URL);
    for (const model of models) {
      try {
        const stream = await client.chat.completions.create({
          model,
          max_completion_tokens: ASTRA_MAX_TOKENS,
          stream: true,
          messages: toSdkMessages(systemPrompt, history),
        });
        let full = "";
        for await (const chunk of stream) {
          const delta = chunk.choices[0]?.delta?.content;
          if (delta) {
            full += delta;
            if (onDelta) await onDelta(full);
          }
        }
        const content = full.trim();
        if (!content) return { ok: false, error: "model" };
        return { ok: true, content, model };
      } catch (error) {
        lastError = error;
        console.error(`[Xirevo] Astra stream failed (${model}):`, error);
        // Retired/unknown model — try the next one on the same key.
        if (isModelNotFoundError(error)) continue;
        // Key problem (401/429/5xx) — fail over to the next key.
        if (!isRetryableError(error)) break;
      }
    }
    if (!isRetryableError(lastError)) break;
  }

  astraCursor = (astraCursor + 1) % keys.length;
  console.error(
    "[Xirevo] Astra stream failed after trying all keys:",
    lastError,
  );
  return { ok: false, error: "network" };
}

/** Generate a reply for the given mode, streaming the provider's tokens to
 *  onDelta (full text so far) as they arrive. `fast` only affects General
 *  mode — it swaps in the lighter, quicker Gemini model. Hacking mode always
 *  uses Groq and ignores both.
 *
 *  `model` is the optional General-mode model the user picked in the chat
 *  header. The retired "gpt-6-astra" pick (removed from the picker) still
 *  routes to the ASTRA_/OPENAI_ keys when they are configured, falling back
 *  to Gemini when that fails; every other pick is a Gemini preference — tried
 *  first, with the normal Gemini fallback chain after it — so picking a model
 *  is never a hard constraint. */
/** Append a short bracketed note to the newest turn. Used when an attached
 *  video could not be loaded, so the model says so plainly instead of
 *  inventing what the video contained. */
function appendNote(history: ChatMessage[], note: string): ChatMessage[] {
  if (history.length === 0) return history;
  const last = history[history.length - 1];
  const content =
    typeof last.content === "string"
      ? `${last.content}\n\n${note}`
      : [...last.content, { type: "text" as const, text: note }];
  return [...history.slice(0, -1), { ...last, content }];
}

export async function generateChatCompletion(
  mode: Mode,
  history: ChatMessage[],
  onDelta?: (text: string) => void | Promise<void>,
  options: { fast?: boolean; model?: string; videoUrls?: string[] } = {},
): Promise<CompletionResult> {
  const systemPrompt = systemPromptFor(mode);

  // A link to a video is only useful if the model can watch it. Gemini can,
  // through its native API (Groq cannot), so video messages try that path
  // first — in either mode — and fall back to normal text handling below.
  const videoUrls = options.videoUrls ?? [];
  let activeHistory = history;
  if (videoUrls.length > 0) {
    const video = await generateGeminiVideo(
      systemPrompt,
      history,
      videoUrls,
      onDelta,
      options.fast === true ? undefined : options.model,
    );
    if (video.ok) return video;
    console.error(
      `[Xirevo] Video understanding unavailable (${video.error}) — answering from the message text instead.`,
    );
    activeHistory = appendNote(
      history,
      "[Note: the attached video could not be loaded, so its content is unavailable. Say so in one line, then help with what the user wrote.]",
    );
  }

  if (mode === MODES.HACKING) {
    return generateGroq(systemPrompt, activeHistory, onDelta);
  }
  if (options.model === "gpt-6-astra") {
    const astra = await generateAstra(systemPrompt, activeHistory, onDelta);
    if (astra.ok) return astra;
    console.error(
      `[Xirevo] Astra unavailable (${astra.error}) — falling back to Gemini.`,
    );
  }
  return generateGemini(
    systemPrompt,
    activeHistory,
    onDelta,
    options.fast === true,
    // Fast mode wins over the pinned pick — the lite model is the whole point
    // of the Fast toggle (the picker choice applies when Fast is off).
    options.fast === true || options.model === "gpt-6-astra"
      ? undefined
      : options.model,
  );
}
