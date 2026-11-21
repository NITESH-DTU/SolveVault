# SolveVault

A Chrome extension (Manifest V3) that shows every LeetCode problem you've solved, grouped by topic, in one dashboard. Click a problem to open it in the same tab, then use **Next solved →** to move through only the problems you've already solved.

## Features

- Solved problems grouped by topic (Array, DP, Graph, and more), sorted by how many you've solved
- Easy / Medium / Hard stats with a progress bar
- Search by title or number, and filter by difficulty
- Problems open in the same tab
- **Prev solved / Next solved** buttons on every problem page, which skip unsolved problems
- **Dashboard** button and the browser back arrow return you to the dashboard
- Your topic, filter and search are remembered
- Click the toolbar icon to open the dashboard

## Install

1. Download or clone this repo:
   ```
   git clone https://github.com/NITESH-DTU/SolveVault.git
   ```
2. Open `chrome://extensions` and turn on **Developer mode** (top right).
3. Click **Load unpacked** and select the project folder (the one that contains `manifest.json`).
4. Open [leetcode.com](https://leetcode.com) while logged in and click the orange **My solved** button at the bottom right. This fetches your solved problems and opens the dashboard.
5. Next time, click the extension icon to open the dashboard. Click **My solved** on LeetCode again whenever you want to refresh the data.

Works on Chrome, Edge and Brave.

## How to use

1. Open the dashboard and pick a topic from the sidebar.
2. Click a problem, or press **Start ▶** to begin from the first one.
3. On the problem page, use **← Prev solved** and **Next solved →** at the bottom center. The label shows your position, for example `Graph · 4/37`.
4. Press **☰ Dashboard** or the browser's back arrow to return to your list.

Prev/Next follows the list you opened the problem from, including your difficulty filter and search.

## How it works

- A content script on `leetcode.com` calls LeetCode's GraphQL endpoint using your logged-in session and fetches problems with status `AC` (accepted), 100 at a time.
- The result is saved in `chrome.storage.local`.
- The dashboard page reads it from storage and groups the problems by their topic tags.
- A second content script (`nav.js`) adds the Prev/Next bar on problem pages.

## Project structure

```
SolveVault/
├── manifest.json     # extension config (MV3)
├── background.js     # opens the dashboard, handles redirects
├── content.js        # "My solved" button, fetches problems via GraphQL
├── nav.js            # Prev / Next / Dashboard bar on problem pages
├── dashboard.html    # dashboard page and styles
└── dashboard.js      # dashboard logic: stats, topics, filters, list
```

## Privacy

Your data stays in your browser. SolveVault reads your solved list from leetcode.com while you're logged in and stores it locally with `chrome.storage.local`. It has no server and sends nothing anywhere.

## Limitations

- It uses LeetCode's web GraphQL endpoint, which isn't a public API and can change without notice.
- The list updates only when you click **My solved**, so new solves appear after the next sync.

## Disclaimer

SolveVault is an unofficial tool and is not affiliated with or endorsed by LeetCode.

## Author

Nitesh Kaushik · [GitHub](https://github.com/NITESH-DTU) · [LinkedIn](https://linkedin.com/in/nitesh-k1/)
