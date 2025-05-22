// backend/models/Character.js
import mongoose from "mongoose";

const CharacterSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  level: { type: Number, required: true },
  image: { type: String, required: true },
});

export default mongoose.model("Character", CharacterSchema);
