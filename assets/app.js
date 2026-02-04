const view = document.getElementById("view");

const POSTS = ["./posts/first-post.md"];

async function load() {
  const res = await fetch(POSTS[0]);
  const text = await res.text();

  view.innerHTML = `
    <div class="card">
      <h1>My First VS Blog</h1>
      <pre>${text}</pre>
    </div>
  `;
}

load();
