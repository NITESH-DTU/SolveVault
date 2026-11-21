(function () {
  let playlist = [];
  let playlistName = "";
  let solved = [];

  function mkBtn(text, primary) {
    const b = document.createElement("button");
    b.textContent = text;
    b.style.cssText =
      "border:none;border-radius:999px;padding:7px 14px;cursor:pointer;font-weight:600;font-size:13px;" +
      (primary
        ? "background:#ffa116;color:#000;"
        : "background:#3a3f4b;color:#eee;");
    return b;
  }

  const bar = document.createElement("div");
  bar.style.cssText =
    "position:fixed;bottom:20px;left:50%;transform:translateX(-50%);z-index:99999;display:none;" +
    "gap:10px;align-items:center;background:#262626;border:1px solid #444;border-radius:999px;" +
    "padding:6px 10px;font:600 13px system-ui,sans-serif;color:#eee;";

  const homeBtn = mkBtn("☰ Dashboard", false);
  const prevBtn = mkBtn("← Prev solved", true);
  const label = document.createElement("span");
  const nextBtn = mkBtn("Next solved →", true);
  bar.append(homeBtn, prevBtn, label, nextBtn);
  document.body.appendChild(bar);

  function currentSlug() {
    const m = location.pathname.match(/^\/problems\/([^/]+)/);
    return m ? m[1] : null;
  }

  function getList() {
    const slug = currentSlug();
    if (playlist.includes(slug)) return { list: playlist, name: playlistName };
    const all = solved
      .slice()
      .sort((a, b) => Number(a.frontendQuestionId) - Number(b.frontendQuestionId))
      .map(p => p.titleSlug);
    return { list: all, name: "All solved" };
  }

  function go(delta) {
    const slug = currentSlug();
    const { list } = getList();
    if (!list.length) return;
    const i = list.indexOf(slug);
    const j = (i + delta + list.length) % list.length;
    location.replace(`/problems/${list[j]}/`);
  }

  homeBtn.onclick = () => chrome.runtime.sendMessage({ type: "goDashboard" });
  prevBtn.onclick = () => go(-1);
  nextBtn.onclick = () => go(1);

  function update() {
    const slug = currentSlug();
    if (!slug) { bar.style.display = "none"; return; }
    const { list, name } = getList();
    if (!list.length) { bar.style.display = "none"; return; }
    const i = list.indexOf(slug);
    label.textContent = `${name} · ${i === -1 ? "–" : i + 1}/${list.length}`;
    bar.style.display = "flex";
  }

  function load() {
    chrome.storage.local.get(["playlist", "playlistName", "solved"], d => {
      playlist = d.playlist || [];
      playlistName = d.playlistName || "";
      solved = d.solved || [];
      update();
    });
  }

  window.addEventListener("popstate", () => {
    if (!currentSlug()) return;
    if (!playlist.length) return;
    chrome.runtime.sendMessage({ type: "goDashboard" });
  });

  chrome.storage.onChanged.addListener(load);
  setInterval(update, 500);
  load();
})();