import api from "./apiClient";
import { normalizeListResponse } from "../utils/listResponse";

export const walletApi = {
  me: () => api.get("/wallet/me").then((r) => r.data),
  topup: (payload) => api.post("/wallet/topup", payload).then((r) => r.data),
  ledger: (params) =>
    api.get("/wallet/ledger", { params }).then((r) => normalizeListResponse(r.data)),
  hideLedgerEntry: (entryId) => api.delete(`/wallet/ledger/${entryId}`).then((r) => r.data)
};
