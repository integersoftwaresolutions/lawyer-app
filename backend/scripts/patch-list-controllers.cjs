const fs = require("fs");
const path = require("path");
const dir = path.join(__dirname, "../src/controllers");

function patchFile(file, replacements) {
  const fp = path.join(dir, file);
  let s = fs.readFileSync(fp, "utf8");
  if (!s.includes("sendListSuccess")) {
    s = s.replace(
      'import { sendSuccess } from "../helpers/response.helper.js";',
      'import { sendSuccess, sendListSuccess } from "../helpers/response.helper.js";'
    );
  }
  for (const [from, to] of replacements) {
    if (!s.includes(from)) console.warn("MISSING in", file, ":", from.slice(0, 90));
    s = s.split(from).join(to);
  }
  fs.writeFileSync(fp, s);
  console.log("patched", file);
}

const listSwap = (msg) => [
  `return sendSuccess(res, { message: "${msg}", data: out.items, meta: out.meta });`,
  `return sendListSuccess(res, { message: "${msg}", ...out });`
];

patchFile("client.controller.js", [
  listSwap("Bookings"),
  listSwap("Reviews"),
  listSwap("Disputes")
]);

patchFile("admin.controller.js", [
  listSwap("Workspaces"),
  listSwap("Pending verifications"),
  listSwap("All lawyers"),
  listSwap("Users"),
  listSwap("Bookings"),
  listSwap("Disputes")
]);

patchFile("wallet.controller.js", [listSwap("Ledger")]);
patchFile("ai.controller.js", [listSwap("Sessions")]);
patchFile("rag.controller.js", [listSwap("Case law"), listSwap("Documents")]);

console.log("done");
