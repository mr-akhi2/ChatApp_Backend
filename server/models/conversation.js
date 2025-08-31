import mongoose from "mongoose";

const conversation = new mongoose.Schema({
  participents: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  message: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "message",
    },
  ],
});

const Conversation = mongoose.model("conversation", conversation);
export default Conversation;
