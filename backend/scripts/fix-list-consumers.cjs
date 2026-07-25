const fs = require("fs");
const path = require("path");
const root = path.join(__dirname, "../../frontend/src");

const files = [
  "pages/admin/AdminVerificationPage.jsx",
  "pages/lawyer/LawyerOverviewPage.jsx",
  "pages/lawyer/LawyerBookingsPage.jsx",
  "pages/client/ClientBookingsPage.jsx",
  "pages/lawyer/LawyerEarningsPage.jsx",
  "pages/client/ClientOverviewPage.jsx",
  "pages/admin/AdminLawyersPage.jsx",
  "pages/public/LawyerProfile.jsx",
  "pages/client/ClientWalletPage.jsx",
  "pages/client/ClientReviewsPage.jsx",
  "pages/admin/AdminDisputesPage.jsx",
  "pages/admin/AdminUsersPage.jsx",
  "pages/admin/AdminOverviewPage.jsx",
  "pages/admin/AdminBookingsPage.jsx",
  "pages/lawyer/LawyerReviewsPage.jsx",
  "hooks/useAiChat.js",
  "components/ai/HeroAiSearch.jsx",
  "hooks/useCalendar.js"
];

const replacements = [
  [/res\.data \|\| \[\]/g, "res.items || []"],
  [/bookingsRes\.data \|\| \[\]/g, "bookingsRes.items || []"],
  [/earningsRes\.data \|\| \[\]/g, "earningsRes.items || []"],
  [/ledgerRes\.data \|\| \[\]/g, "ledgerRes.items || []"]
];

for (const f of files) {
  const fp = path.join(root, f);
  if (!fs.existsSync(fp)) {
    console.warn("missing", f);
    continue;
  }
  let s = fs.readFileSync(fp, "utf8");
  const before = s;
  for (const [re, to] of replacements) s = s.replace(re, to);
  if (s !== before) {
    fs.writeFileSync(fp, s);
    console.log("updated", f);
  } else {
    console.log("no change", f);
  }
}
