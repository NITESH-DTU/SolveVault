const QUERY = `
query problemsetQuestionList($categorySlug: String, $limit: Int, $skip: Int, $filters: QuestionListFilterInput) {
  problemsetQuestionList: questionList(
    categorySlug: $categorySlug
    limit: $limit
    skip: $skip
    filters: $filters
  ) {
    total: totalNum
    questions: data {
      frontendQuestionId: questionFrontendId
      title
      titleSlug
      difficulty
      status
      topicTags { name slug }
    }
  }
}`;

let categorySlug = "all-code-essentials";

function getCsrf() {
  const m = document.cookie.match(/csrftoken=([^;]+)/);
  return m ? m[1] : "";
}

async function request(skip, limit) {
  const res = await fetch("https://leetcode.com/graphql", {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      "x-csrftoken": getCsrf(),
      "Referer": "https://leetcode.com/problemset/"
    },
    body: JSON.stringify({
      query: QUERY,
      variables: { categorySlug, skip, limit, filters: { status: "AC" } }
    })
  });
  if (!res.ok) throw new Error("HTTP " + res.status);
  const json = await res.json();
  if (json.errors) throw new Error(JSON.stringify(json.errors));
  return json.data.problemsetQuestionList;
}

async function fetchPage(skip, limit = 100) {
  try {
    return await request(skip, limit);
  } catch (e) {
    if (categorySlug !== "") {
      console.warn("Retrying with empty categorySlug", e);
      categorySlug = "";
      return await request(skip, limit);
    }
    throw e;
  }
}

async function getSolved(onProgress) {
  const first = await fetchPage(0);
  let all = first.questions;
  onProgress(all.length, first.total);
  for (let skip = 100; skip < first.total; skip += 100) {
    const page = await fetchPage(skip);
    all = all.concat(page.questions);
    onProgress(all.length, first.total);
    await new Promise(r => setTimeout(r, 300));
  }
  const counts = {};
  all.forEach(q => { counts[q.status] = (counts[q.status] || 0) + 1; });
  console.log("status counts:", counts, "total fetched:", all.length);
  const hasAC = all.some(q => q.status === "AC");
  return hasAC ? all.filter(q => q.status === "AC") : all;
}

const buttonStyle = document.createElement("style");
buttonStyle.textContent = `
  #solvevault-sync {
    position: fixed; bottom: 20px; right: 20px; z-index: 99999;
    display: inline-flex; align-items: center; justify-content: center; gap: 8px;
    min-height: 44px; padding: 0 16px; border: 1px solid #167a62;
    border-radius: 12px; background: #167a62; color: #fff;
    box-shadow: 0 4px 12px rgba(22, 122, 98, .2);
    font: 650 13px/1.2 Inter, ui-sans-serif, system-ui, sans-serif;
    cursor: pointer; transition: background .16s ease, transform .16s ease, box-shadow .16s ease;
  }
  #solvevault-sync:hover { background: #116851; box-shadow: 0 6px 16px rgba(22, 122, 98, .24); transform: translateY(-1px); }
  #solvevault-sync:focus-visible { outline: 3px solid rgba(22, 122, 98, .32); outline-offset: 3px; }
  #solvevault-sync:disabled { cursor: progress; opacity: .78; transform: none; }
  body.solvevault-on-question #solvevault-sync { bottom: 76px; }
  @media (max-width: 560px) {
    #solvevault-sync { bottom: 14px; right: 14px; min-height: 42px; }
    body.solvevault-on-question #solvevault-sync { bottom: 68px; }
  }
  @media (prefers-reduced-motion: reduce) { #solvevault-sync { transition: none; } }
`;
document.documentElement.appendChild(buttonStyle);

const btn = document.createElement("button");
btn.id = "solvevault-sync";
btn.type = "button";
btn.textContent = "My Solved";
btn.setAttribute("aria-label", "Sync solved problems to SolveVault");
btn.setAttribute("aria-live", "polite");

btn.onclick = async () => {
  btn.disabled = true;
  btn.setAttribute("aria-busy", "true");
  btn.textContent = "Syncing…";
  try {
    const solved = await getSolved((done, total) => {
      btn.textContent = `Syncing ${done}/${total}`;
    });
    await chrome.storage.local.set({ solved, updatedAt: Date.now() });
    btn.textContent = `Synced · ${solved.length} solved`;
    btn.removeAttribute("aria-busy");
    chrome.runtime.sendMessage({ type: "openDashboard" });
  } catch (e) {
    console.error(e);
    btn.textContent = "Sync failed — retry";
    btn.removeAttribute("aria-busy");
    btn.disabled = false;
  }
};

document.body.appendChild(btn);
