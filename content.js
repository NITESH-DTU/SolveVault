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

const btn = document.createElement("button");
btn.textContent = "My solved";
btn.style.cssText =
  "position:fixed;bottom:20px;right:20px;z-index:99999;padding:10px 14px;" +
  "background:#ffa116;color:#000;border:none;border-radius:8px;cursor:pointer;font-weight:600;";

btn.onclick = async () => {
  btn.textContent = "Fetching...";
  try {
    const solved = await getSolved((done, total) => {
      btn.textContent = `Fetching ${done}/${total}`;
    });
    await chrome.storage.local.set({ solved, updatedAt: Date.now() });
    btn.textContent = `Done (${solved.length} solved)`;
    chrome.runtime.sendMessage({ type: "openDashboard" });
  } catch (e) {
    console.error(e);
    btn.textContent = "Failed: " + e.message.slice(0, 40);
  }
};

document.body.appendChild(btn);