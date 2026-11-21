let solved = [];
let difficulty = "All";
let query = "";
let topic = "All";
let currentList = [];

const $ = id => document.getElementById(id);

function el(tag, cls, text) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text !== undefined) e.textContent = text;
  return e;
}

function filtered() {
  const q = query.trim().toLowerCase();
  return solved.filter(p =>
    (difficulty === "All" || p.difficulty === difficulty) &&
    (!q || p.title.toLowerCase().includes(q) || String(p.frontendQuestionId) === q)
  );
}

function renderStats() {
  const c = { Easy: 0, Medium: 0, Hard: 0 };
  solved.forEach(p => { if (c[p.difficulty] !== undefined) c[p.difficulty]++; });
  const stats = $("stats");
  stats.textContent = "";
  [["Solved", solved.length, ""], ["Easy", c.Easy, "easy"], ["Medium", c.Medium, "med"], ["Hard", c.Hard, "hard"]]
    .forEach(([l, n, cls]) => {
      const card = el("div", "card " + cls);
      card.append(el("div", "num", n), el("div", "lbl", l));
      stats.appendChild(card);
    });
  const bar = $("bar");
  bar.textContent = "";
  const total = solved.length || 1;
  [["Easy", "var(--easy)"], ["Medium", "var(--med)"], ["Hard", "var(--hard)"]].forEach(([k, col]) => {
    const i = document.createElement("i");
    i.style.width = (c[k] / total) * 100 + "%";
    i.style.background = col;
    bar.appendChild(i);
  });
}

function render() {
  const list = filtered();
  const groups = {};
  for (const p of list) {
    const tags = p.topicTags.length ? p.topicTags : [{ name: "Untagged" }];
    for (const t of tags) (groups[t.name] ||= []).push(p);
  }
  const names = Object.keys(groups).sort((a, b) => groups[b].length - groups[a].length);
  if (topic !== "All" && !groups[topic]) topic = "All";

  const side = $("topics");
  side.textContent = "";
  side.appendChild(el("div", "side-label", "Browse topics"));
  const addTopic = (name, count) => {
    const b = el("button", "topic" + (name === topic ? " active" : ""));
    b.type = "button";
    b.setAttribute("aria-pressed", String(name === topic));
    b.append(el("span", "", name), el("span", "c", count));
    b.onclick = () => { topic = name; render(); };
    side.appendChild(b);
  };
  addTopic("All", list.length);
  names.forEach(n => addTopic(n, groups[n].length));

  currentList = (topic === "All" ? list : groups[topic])
    .slice()
    .sort((a, b) => Number(a.frontendQuestionId) - Number(b.frontendQuestionId));

  $("title").textContent = topic === "All" ? "All solved" : topic;
  $("count").textContent = currentList.length + " problems";

  const box = $("list");
  box.textContent = "";
  if (!currentList.length) {
    box.appendChild(el("div", "empty", "No problems match."));
    return;
  }

  const slugs = currentList.map(p => p.titleSlug);
  const pname = topic === "All" ? "All solved" : topic;

  currentList.forEach(p => {
    const a = el("a", "row");
    a.href = `https://leetcode.com/problems/${p.titleSlug}/`;
    a.onclick = async e => {
      const modifier = e.ctrlKey || e.metaKey || e.shiftKey;
      if (modifier) {
        chrome.storage.local.set({ playlist: slugs, playlistName: pname });
        return;
      }
      e.preventDefault();
      await chrome.storage.local.set({ playlist: slugs, playlistName: pname });
      location.href = a.href;
    };

    const mid = el("div");
    mid.appendChild(el("div", "t", p.title));
    const tags = el("div", "tags");
    p.topicTags.slice(0, 4).forEach(t => tags.appendChild(el("span", "tag", t.name)));
    mid.appendChild(tags);

    a.append(el("span", "id", "#" + p.frontendQuestionId), mid, el("span", "badge " + p.difficulty, p.difficulty));
    box.appendChild(a);
  });
}

document.querySelectorAll(".chip").forEach(chip => {
  chip.onclick = () => {
    document.querySelectorAll(".chip").forEach(c => {
      c.classList.remove("active");
      c.setAttribute("aria-pressed", "false");
    });
    chip.classList.add("active");
    chip.setAttribute("aria-pressed", "true");
    difficulty = chip.dataset.d;
    render();
  };
});

$("search").oninput = e => { query = e.target.value; render(); };

$("start").onclick = async () => {
  if (!currentList.length) return;
  const slugs = currentList.map(p => p.titleSlug);
  await chrome.storage.local.set({ playlist: slugs, playlistName: topic === "All" ? "All solved" : topic });
  location.href = `https://leetcode.com/problems/${slugs[0]}/`;
};

if (typeof chrome === "undefined" || !chrome.storage?.local) {
  $("meta").textContent = "Your private LeetCode practice library";
  $("list").appendChild(el("div", "empty", 'Open this dashboard from the SolveVault extension after syncing your solved problems.'));
} else {
  chrome.storage.local.get(["solved", "updatedAt"], data => {
    if (!data.solved) {
      $("list").appendChild(el("div", "empty", 'No data yet. Open leetcode.com and click the "My solved" button.'));
      return;
    }
    solved = data.solved;
    $("meta").textContent = `Updated ${new Date(data.updatedAt).toLocaleString()}`;
    renderStats();
    render();
  });
}
