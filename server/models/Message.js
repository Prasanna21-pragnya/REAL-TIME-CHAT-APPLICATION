const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    sender: String,

    text: String,

    time: String,

    seen: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "Message",
  messageSchema
);