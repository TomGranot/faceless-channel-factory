import {spawn} from "node:child_process";

export async function collectJsonCommandAccount(account, {timeoutMs = 90_000, maxOutputBytes = 20 * 1024 * 1024} = {}) {
  const command = account.provider.command;
  const result = await run(command, [], {
    input: JSON.stringify(account.provider.options || {}),
    timeoutMs: account.provider.timeoutMs ?? timeoutMs,
    maxOutputBytes,
  });
  if (result.code !== 0) throw new Error(`Collector for ${account.slug} failed: ${result.stderr.slice(-2_000)}`);
  let payload;
  try {
    payload = JSON.parse(result.stdout);
  } catch (error) {
    throw new Error(`Collector for ${account.slug} returned invalid JSON: ${error.message}`);
  }
  if (!Array.isArray(payload.posts)) throw new Error(`Collector for ${account.slug} returned no posts array.`);
  return {
    ...payload,
    slug: account.slug,
    source: payload.source || "json-command",
    posts: payload.posts.map(normalizePost),
  };
}

function normalizePost(post) {
  if (!post?.id) throw new Error("Collector returned a post without an id.");
  return {
    id: String(post.id),
    shortcode: stringOrNull(post.shortcode),
    url: stringOrNull(post.url),
    publishedAt: dateOrNull(post.publishedAt),
    caption: typeof post.caption === "string" ? post.caption : "",
    durationSeconds: finiteOrNull(post.durationSeconds),
    plays: finiteOrNull(post.plays),
    likes: finiteOrNull(post.likes),
    comments: finiteOrNull(post.comments),
    videoUrl: stringOrNull(post.videoUrl),
    thumbnailUrl: stringOrNull(post.thumbnailUrl),
  };
}

function run(command, args, {input, timeoutMs, maxOutputBytes}) {
  return new Promise((resolvePromise) => {
    const child = spawn(command, args, {stdio: ["pipe", "pipe", "pipe"]});
    let stdout = "";
    let stderr = "";
    let finished = false;
    const finish = (result) => {
      if (finished) return;
      finished = true;
      resolvePromise(result);
    };
    child.stdout.on("data", (chunk) => {
      stdout += chunk;
      if (Buffer.byteLength(stdout) > maxOutputBytes) child.kill("SIGTERM");
    });
    child.stderr.on("data", (chunk) => { stderr = `${stderr}${chunk}`.slice(-8_000); });
    child.on("error", (error) => finish({code: 1, stdout, stderr: `${stderr}\n${error.message}`}));
    child.on("close", (code) => finish({code: code ?? 1, stdout, stderr}));
    const timer = setTimeout(() => child.kill("SIGTERM"), timeoutMs);
    timer.unref();
    child.on("close", () => clearTimeout(timer));
    child.stdin.end(input);
  });
}

function finiteOrNull(value) {
  if (value === null || value === undefined || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function stringOrNull(value) {
  return typeof value === "string" && value ? value : null;
}

function dateOrNull(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}
