import api from "./apiClient";

export const walletApi = {
  me: () => api.get("/wallet/me").then((r) => r.data),
  topup: (payload) => api.post("/wallet/topup", payload).then((r) => r.data),
  ledger: (params) => api.get("/wallet/ledger", { params }).then((r) => r.data),
  hideLedgerEntry: (entryId) => api.delete(`/wallet/ledger/${entryId}`).then((r) => r.data)
};
