import mongoose from "mongoose";

const BillingInvoiceSchema = new mongoose.Schema(
  {
    workspaceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Workspace",
      required: true,
      index: true
    },
    stripeInvoiceId: { type: String, required: true, unique: true, index: true },
    number: { type: String, default: "" },
    status: { type: String, default: "", index: true },
    amountDue: { type: Number, default: 0 },
    amountPaid: { type: Number, default: 0 },
    currency: { type: String, default: "usd" },
    hostedInvoiceUrl: { type: String, default: "" },
    pdfUrl: { type: String, default: "" },
    periodStart: { type: Date, default: null },
    periodEnd: { type: Date, default: null },
    paidAt: { type: Date, default: null }
  },
  { timestamps: true }
);

BillingInvoiceSchema.index({ workspaceId: 1, createdAt: -1 });

export default mongoose.model("BillingInvoice", BillingInvoiceSchema);
