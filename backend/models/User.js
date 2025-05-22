// backend/models/User.js
import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  uid: { type: String, required: true, unique: true }, // Firebase Auth UID
  nickname: { type: String, required: true },
  email: { type: String },
});

export default mongoose.model("User", UserSchema);

