const view = document.getElementById("view");
document.getElementById("year").textContent = new Date().getFullYear();

// Edit this list whenever you add a new post file:
const POSTS = [
  "/posts/first-post.md"
];

function escapeHtml(str) {
  return str.replace(/[&<>"']/g, (m) => ({
    "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#039;"
  }[m]));
}

function parseFrontmatter(md) {
  // Very small YAML-ish frontmatter parser:
  // ---
  // title: Something
  // date: 2026-02-03
  // description: short
  // cover: /uploads/x.png
  // ---
  if (!md.startsWith("---")) return { data: {}, body: md };

  const end = md.indexOf("\n---", 3);
  if (end === -1) return { data: {}, body: md };

  const raw = md.slice(3, end).trim();
  const body = md.slice(end + 4).trim();

  const data = {};
  raw.split("\n").forEach(line => {
    const idx = line.indexOf(":");
    if (idx === -1) return;
    const key = line.slice(0, idx).trim();
    const val = line.slice(idx + 1).trim();
    data[key] = val;
  });

  return { data, body };
}

async function fetchPost(url) {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to load ${url}`);
  const text = await res.text();
  const { data, body } = parseFrontmatter(text);
  return { url, data, body };
}

function route() {
  const hash = location.hash || "#/";
  const [path, param] = hash.replace("#", "").split("/").filter(Boolean);

  if (!path) return renderHome();
  if (path === "post" && param) return renderPost(decodeURIComponent(param));
  if (path === "about") return renderAbout();

  renderNotFound();
}

async function renderHome() {
  view.innerHTML = `
    <div class="card">
      <h1 class="post-title">Latest Posts</h1>
      <p class="meta">Clean formatting. No paragraph escapes. No editor chaos.</p>
    </div>
    <ul class="post-list" id="postList"></ul>
  `;

  const list = document.getElementById("postList");

  const posts = [];
  for (const url of POSTS) {
    try {
      const p = await fetchPost(url);
      posts.push(p);
    } catch (e) {
      console.error(e);
    }
  }

  // Sort newest first if date exists
  posts.sort((a,b) => (b.data.date || "").localeCompare(a.data.date || ""));

  list.innerHTML = posts.map(p => {
    const slug = encodeURIComponent(p.url);
    const title = escapeHtml(p.data.title || "Untitled");
    const desc = escapeHtml(p.data.description || "No description yet.");
    const date = escapeHtml(p.data.date || "");
    return `
      <li class="post-item">
        <a href="#/post/${slug}">
          <p class="title">${title}</p>
          <p class="desc">${desc}</p>
          ${date ? `<p class="meta">${date}</p>` : ``}
        </a>
      </li>
    `;
  }).join("");
}

async function renderPost(encodedUrl) {
  try {
    const url = decodeURIComponent(encodedUrl);
    const post = await fetchPost(url);

    const title = escapeHtml(post.data.title || "Untitled");
    const date = escapeHtml(post.data.date || "");
    const cover = post.data.cover ? post.data.cover.trim() : "";

    const html = marked.parse(post.body, { mangle: false, headerIds: false });

    view.innerHTML = `
      <article class="card article">
        <h1 class="post-title">${title}</h1>
        ${date ? `<p class="meta">${date}</p>` : ``}
        ${cover ? `<img src="${escapeHtml(cover)}" alt="Cover image" />` : ``}
        <div>${html}</div>
        <p class="meta"><a href="#/">← Back to Home</a></p>
      </article>
    `;
  } catch (e) {
    console.error(e);
    renderNotFound();
  }
}

function renderAbout() {
  view.innerHTML = `
    <section class="card article">
      <h1 class="post-title">About</h1>
      <p class="meta">A simple, free VS blog.</p>
      <p>
        This site is built so your writing stays clean, readable, and properly wrapped on all screens.
      </p>
      <p>
        Add posts by creating Markdown files in <code>/posts</code>.
      </p>
    </section>
  `;
}

function renderNotFound() {
  view.innerHTML = `
    <section class="card">
      <h1 class="post-title">404</h1>
      <p class="meta">That page doesn’t exist. (It got speed-blitzed.)</p>
      <p><a href="#/">Go Home</a></p>
    </section>
  `;
}

window.addEventListener("hashchange", route);
window.addEventListener("load", route);