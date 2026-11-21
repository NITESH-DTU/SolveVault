(function () {
  let playlist = [];
  let playlistName = "";
  let solved = [];

  const style = document.createElement("style");
  style.textContent = `
    #solvevault-nav {
      position: fixed; bottom: 22px; left: 50%; transform: translateX(-50%); z-index: 99999;
      display: none; align-items: center; gap: 8px; padding: 7px;
      border: 1px solid rgba(255,255,255,.12); border-radius: 16px;
      background: rgba(24, 33, 29, .94); color: #f6f8f6;
      box-shadow: 0 12px 36px rgba(13, 26, 20, .24); backdrop-filter: blur(14px);
      font: 600 12px/1.2 Inter, ui-sans-serif, system-ui, sans-serif;
    }
    #solvevault-nav button {
      min-height: 36px; border: 0; border-radius: 10px; padding: 0 12px;
      background: transparent; color: #e9f0eb; cursor: pointer;
      font: inherit; transition: background .15s ease, color .15s ease;
    }
    #solvevault-nav button:hover { background: rgba(255,255,255,.1); }
    #solvevault-nav button:focus-visible { outline: 3px solid #9bd7bd; outline-offset: 2px; }
    #solvevault-nav .solvevault-next { background: #168565; color: #fff; }
    #solvevault-nav .solvevault-next:hover { background: #1a9873; }
    #solvevault-nav .solvevault-label { min-width: 96px; padding: 0 8px; color: #c6d2ca; text-align: center; font-variant-numeric: tabular-nums; }
    @media (max-width: 560px) {
      #solvevault-nav { bottom: 12px; width: calc(100% - 24px); justify-content: space-between; gap: 3px; }
      #solvevault-nav button { padding: 0 9px; font-size: 11px; }
      #solvevault-nav .solvevault-label { min-width: 72px; padding: 0 3px; font-size: 10px; }
    }
    @media (prefers-reduced-motion: reduce) { #solvevault-nav button { transition: none; } }
  `;
  document.documentElement.appendChild(style);

  function mkBtn(text, className, label) {
    const button = document.createElement("button");
    button.textContent = text;
    button.type = "button";
    button.className = className;
    button.setAttribute("aria-label", label);
    return button;
  }

  const bar = document.createElement("nav");
  bar.id = "solvevault-nav";
  bar.setAttribute("aria-label", "Solved problem navigation");
  const homeBtn = mkBtn("Dashboard", "", "Return to SolveVault dashboard");
  const prevBtn = mkBtn("← Previous", "", "Open previous solved problem");
  const label = document.createElement("span");
  label.className = "solvevault-label";
  label.setAttribute("aria-live", "polite");
  const nextBtn = mkBtn("Next →", "solvevault-next", "Open next solved problem");
  bar.append(homeBtn, prevBtn, label, nextBtn);
  document.body.appendChild(bar);

  function currentSlug() {
    const match = location.pathname.match(/^\/problems\/([^/]+)/);
    return match ? match[1] : null;
  }

  function getList() {
    const slug = currentSlug();
    if (playlist.includes(slug)) return { list: playlist, name: playlistName };
    const all = solved
      .slice()
      .sort((a, b) => Number(a.frontendQuestionId) - Number(b.frontendQuestionId))
      .map(problem => problem.titleSlug);
    return { list: all, name: "All solved" };
  }

  function go(delta) {
    const slug = currentSlug();
    const { list } = getList();
    if (!list.length) return;
    const index = list.indexOf(slug);
    const nextIndex = (index + delta + list.length) % list.length;
    location.replace(`/problems/${list[nextIndex]}/`);
  }

  homeBtn.onclick = () => chrome.runtime.sendMessage({ type: "goDashboard" });
  prevBtn.onclick = () => go(-1);
  nextBtn.onclick = () => go(1);

  function update() {
    const slug = currentSlug();
    if (!slug) {
      bar.style.display = "none";
      document.body.classList.remove("solvevault-on-question");
      return;
    }
    const { list, name } = getList();
    if (!list.length) {
      bar.style.display = "none";
      document.body.classList.remove("solvevault-on-question");
      return;
    }
    const index = list.indexOf(slug);
    label.textContent = `${name} · ${index === -1 ? "–" : index + 1}/${list.length}`;
    document.body.classList.add("solvevault-on-question");
    bar.style.display = "flex";
  }

  function load() {
    chrome.storage.local.get(["playlist", "playlistName", "solved"], data => {
      playlist = data.playlist || [];
      playlistName = data.playlistName || "";
      solved = data.solved || [];
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
