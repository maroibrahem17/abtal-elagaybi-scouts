import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { db } from "../firebase/config.js";

export async function getGeneralSettings() {
  if (!db) throw new Error("firebase-not-configured");
  const snapshot = await getDoc(doc(db, "settings", "general"));
  return snapshot.exists() ? snapshot.data() : {};
}

export async function updateGeneralSettings(data) {
  if (!db) throw new Error("firebase-not-configured");
  await setDoc(doc(db, "settings", "general"), { ...data, updatedAt: serverTimestamp() }, { merge: true });
}
