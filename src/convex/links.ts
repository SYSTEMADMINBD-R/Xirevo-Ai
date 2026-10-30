// Link understanding for the chat backend.
//
// Two different problems, two different answers:
//   - YouTube links are handed to Gemini's native API as a video part (see
//     `generateGeminiVideo` in ./ai), which is how the model can actually
//     watch a video instead of guessing from the URL.
//   - Every other link is fetched here and reduced to readable text, so the
//     model reads the article/page the user is talking about.
//
// Everything here is best-effort: a blocked, paywalled, JS-only or slow page
// simply contributes nothing, and the chat carries on answering.

/** Every http(s) URL in a message, deduped and capped. */
const URL_PATTERN = /\bhttps?:\/\/[^\s<>"'`]+/gi;
const MAX_LINKS = 3;
/** Extracted page text per link — enough for a long article, small enough
 *  that three links can't crowd out the conversation. */
const MAX_TEXT_PER_LINK = 6000;
/** Hard cap on the whole context block handed to the model. */
const MAX_TOTAL_CONTEXT = 12000;
/** Per-request timeout. A dead host must never stall a chat reply. */
const FETCH_TIMEOUT_MS = 8000;

/** URLs found in the message, in the order they appear, without duplicates
 *  and without trailing punctuation picked up from the sentence. */
export function extractUrls(text: string): string[] {
  const found = text.match(URL_PATTERN) ?? [];
  const urls: string[] = [];
  for (const raw of found) {
    const url = raw.replace(/[.,;:!?)\]]+$/, "");
    if (!urls.includes(url) && urls.length < MAX_LINKS) urls.push(url);
  }
  return urls;
}

/** True for links Gemini can watch directly (YouTube's public video pages). */
export function isYoutubeUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, "").replace(/^m\./, "");
    if (host === "youtu.be") return parsed.pathname.length > 1;
    if (host === "youtube.com" || host === "music.youtube.com") {
      return (
        parsed.pathname === "/watch" ||
        parsed.pathname.startsWith("/shorts/") ||
        parsed.pathname.startsWith("/embed/") ||
        parsed.pathname.startsWith("/live/")
      );
    }
    return false;
  } catch {
    return false;
  }
}

/** YouTube links in a message — these go to the native video path. */
export function youtubeVideoUrls(text: string): string[] {
  return extractUrls(text).filter(isYoutubeUrl);
}

/** Pages worth scraping (http/https only, no video links). */
export function readableLinkUrls(text: string): string[] {
  return extractUrls(text).filter((url) => !isYoutubeUrl(url));
}

const NAMED_ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
  mdash: "—",
  ndash: "–",
  hellip: "…",
  rsquo: "’",
  lsquo: "‘",
  rdquo: "”",
  ldquo: "“",
};

function decodeEntities(text: string): string {
  return text.replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (match, code: string) => {
    if (code.startsWith("#")) {
      const hex = code[1] === "x" || code[1] === "X";
      const value = Number.parseInt(code.slice(hex ? 2 : 1), hex ? 16 : 10);
      return Number.isFinite(value) && value > 0 && value <= 0x10ffff
        ? String.fromCodePoint(value)
        : match;
    }
    return NAMED_ENTITIES[code.toLowerCase()] ?? match;
  });
}

/** HTML → readable text. Strips scripts/styles/markup, keeps paragraph
 *  breaks so headings and list items stay on their own lines. */
function htmlToText(html: string): string {
  return decodeEntities(
    html
      .replace(/<!--[\s\S]*?-->/g, " ")
      .replace(/<(script|style|noscript|svg|template)\b[\s\S]*?<\/\1>/gi, " ")
      .replace(/<\/(p|div|section|article|li|h[1-6]|tr|br)\s*>/gi, "\n")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<[^>]+>/g, " "),
  )
    .replace(/[ \t\f\v]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function metaContent(html: string, names: string[]): string | undefined {
  for (const name of names) {
    const pattern = new RegExp(
      `<meta[^>]+(?:name|property)=["']${name}["'][^>]*content=["']([^"']+)["']`,
      "i",
    );
    const match = pattern.exec(html);
    if (match?.[1]) return decodeEntities(match[1]).trim();
  }
  return undefined;
}

type FetchedLink = {
  url: string;
  title?: string;
  description?: string;
  text?: string;
};

/** Fetch one page and reduce it to a title/description/body snippet. Returns
 *  null when the page can't be read as text (timeouts, binaries, errors). */
async function fetchOneLink(url: string): Promise<FetchedLink | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      redirect: "follow",
      headers: {
        // Some sites serve a stub or 403 to unknown agents.
        "user-agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36",
        accept: "text/html,application/xhtml+xml,text/plain;q=0.9,*/*;q=0.5",
      },
    });
    if (!response.ok) return null;

    const type = (response.headers.get("content-type") ?? "").toLowerCase();
    if (type && !/text\/|json|xml/.test(type)) return null;

    const raw = (await response.text()).slice(0, 400_000);
    if (!raw.trim()) return null;

    if (!type.includes("html") && !raw.trimStart().startsWith("<")) {
      // Plain text / JSON / XML: send it through as-is.
      return { url, text: raw.trim().slice(0, MAX_TEXT_PER_LINK) };
    }

    const titleTag = /<title[^>]*>([\s\S]*?)<\/title>/i.exec(raw)?.[1];
    const title =
      metaContent(raw, ["og:title", "twitter:title"]) ??
      (titleTag ? decodeEntities(titleTag).trim() || undefined : undefined);
    const description = metaContent(raw, [
      "og:description",
      "twitter:description",
      "description",
    ]);
    const text = htmlToText(raw).slice(0, MAX_TEXT_PER_LINK) || undefined;
    return { url, title, description, text };
  } catch {
    // Timeout, DNS failure, TLS error, blocked host — skip this link.
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export type VideoMeta = { url: string; title: string; channel?: string };

/** Exact title/channel for a YouTube link, from YouTube's public oEmbed
 *  endpoint (no key, no quota, ~100ms). Gemini watches the video but never
 *  reports its title back, so without this the model invents a plausible one —
 *  which is exactly the bug this fixes. Falls back to the watch page's own
 *  <title> if oEmbed is unavailable. */
async function fetchVideoMeta(url: string): Promise<VideoMeta | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const response = await fetch(
      `https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(url)}`,
      { signal: controller.signal, headers: { accept: "application/json" } },
    );
    if (response.ok) {
      const data = (await response.json()) as {
        title?: string;
        author_name?: string;
      };
      if (data.title) {
        return {
          url,
          title: data.title,
          ...(data.author_name ? { channel: data.author_name } : {}),
        };
      }
    }
  } catch {
    // Blocked, rate-limited or offline — try the page itself below.
  } finally {
    clearTimeout(timer);
  }

  const page = await fetchOneLink(url);
  if (page?.title) {
    return { url, title: page.title.replace(/\s*-\s*YouTube\s*$/i, "").trim() };
  }
  return null;
}

/** Authoritative title/channel for the video links in a message. Video URL
 *  parts only carry pixels, so this is what keeps the model from guessing. */
export async function fetchVideoContext(urls: string[]): Promise<string> {
  const targets = urls.filter(isYoutubeUrl).slice(0, 2);
  if (targets.length === 0) return "";

  const fetched = await Promise.all(targets.map(fetchVideoMeta));
  const metas = fetched.filter((meta): meta is VideoMeta => meta !== null);
  if (metas.length === 0) return "";

  const blocks = metas.map((meta) =>
    [
      `### Video: ${meta.url}`,
      `Exact title: ${meta.title}`,
      ...(meta.channel ? [`Channel: ${meta.channel}`] : []),
    ].join("\n"),
  );

  return [
    "--- Video details, fetched from YouTube just now (authoritative) ---",
    blocks.join("\n\n"),
    "--- End of video details. If the user asks for the title, channel, uploader\n" +
      "or any upload metadata, reply with these exact strings — never invent,\n" +
      "translate or embellish a title. ---",
  ].join("\n");
}

/** Build the context block for the model from the links in a message.
 *  Returns "" when there is nothing to add, so callers can cheaply skip. */
export async function fetchLinkContext(urls: string[]): Promise<string> {
  const targets = urls.filter((url) => !isYoutubeUrl(url)).slice(0, MAX_LINKS);
  if (targets.length === 0) return "";

  const fetched = await Promise.all(targets.map(fetchOneLink));
  const blocks: string[] = [];
  for (const link of fetched) {
    if (!link) continue;
    const lines = [`### Link: ${link.url}`];
    if (link.title) lines.push(`Title: ${link.title}`);
    if (link.description) lines.push(`Description: ${link.description}`);
    if (link.text) lines.push("", link.text);
    blocks.push(lines.join("\n"));
  }
  if (blocks.length === 0) return "";

  const body = blocks.join("\n\n").slice(0, MAX_TOTAL_CONTEXT);
  return [
    "--- Web content the user shared (fetched just now) ---",
    body,
    "--- End of fetched content. Answer from it; if it is incomplete or",
    "the page blocked reading, say what is missing instead of inventing it. ---",
  ].join("\n");
}
