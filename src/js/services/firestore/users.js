import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { db } from "../firebase/config.js";

function requireDb() {
  if (!db) throw new Error("firebase-not-configured");
  return db;
}

export async function getUserProfile(uid) {
  const snapshot = await getDoc(doc(requireDb(), "users", uid));
  return snapshot.exists() ? { uid: snapshot.id, ...snapshot.data() } : null;
}

export async function createUserProfile(uid, data) {
  await setDoc(doc(requireDb(), "users", uid), {
    uid,
    ...data,
    role: "user",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function updateUserProfile(uid, data) {
  const { uid: ignoredUid, email: ignoredEmail, role: ignoredRole, ...editableData } = data;
  void ignoredUid;
  void ignoredEmail;
  void ignoredRole;
  await setDoc(doc(requireDb(), "users", uid), {
    ...editableData,
    updatedAt: serverTimestamp(),
  }, { merge: true });
}
