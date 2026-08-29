import mongoose from "mongoose";

const walletTransactionSchema = new mongoose.Schema({
  type: {
    type: String,

    enum: ["credit", "debit"],

    required: true,
  },

  amount: {
    type: Number,

    required: true,

    min: 0,
  },

  reason: {
    type: String,

    enum: [
      "Order Refund",
      "Order Payment",
      "Referral Bonus",
      "Wallet Recharge",
      "Admin Credit",
      "Admin Debit",
      "Order Cancelled",
      "Return Refund",
    ],

    required: true,
  },

  order: {
    type: mongoose.Schema.Types.ObjectId,

    ref: "Order",

    default: null,
  },

  description: {
    type: String,

    trim: true,

    default: "",
  },

  createdAt: {
    type: Date,

    default: Date.now,
  },
});

const walletSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,

      ref: "User",

      required: true,

      unique: true,
    },

    balance: {
      type: Number,

      default: 0,

      min: 0,
    },

    transactions: [walletTransactionSchema],
  },

  {
    timestamps: true,
  },
);

export default mongoose.model("Wallet", walletSchema);
