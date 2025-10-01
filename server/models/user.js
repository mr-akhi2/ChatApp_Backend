import mongoose from "mongoose";

const User = new mongoose.Schema({
  FullName: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  Profile: {
    type: String,
    default:
      "https://cdn.pixabay.com/photo/2025/08/26/11/57/icon-9798055_1280.png",
  },
  system:{
    type:String,
  },
  token: {
    type: String,
    default: "",
  },
});

const Users = mongoose.model("Users", User);

export default Users;
