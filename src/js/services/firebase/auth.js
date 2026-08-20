import { createUserWithEmailAndPassword, onAuthStateChanged, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db, firebaseConfigured } from "./config.js";

const authMessages = {
  "auth/invalid-credential": "البريد الإلكتروني أو كلمة المرور غير صحيحة.",
  "auth/invalid-email": "أدخل بريدًا إلكترونيًا صحيحًا.",
  "auth/too-many-requests": "تكررت محاولات الدخول. حاول لاحقًا.",
  "auth/network-request-failed": "تعذر الاتصال بالخدمة. تحقق من الإنترنت وحاول مرة أخرى.",
  "auth/email-already-in-use": "هذا البريد الإلكتروني مستخدم بالفعل.",
  "auth/weak-password": "كلمة المرور ضعيفة.",
  "auth/operation-not-allowed": "تسجيل البريد الإلكتروني غير مفعل في Firebase.",
  "permission-denied": "لا يمكن إنشاء بيانات الحساب. تحقق من صلاحيات Firebase.",
  "unavailable": "تعذر الاتصال بالخدمة. تحقق من الإنترنت وحاول مرة أخرى.",
  "deadline-exceeded": "تعذر الاتصال بالخدمة. حاول مرة أخرى.",
  "not-found": "تعذر تحميل بيانات الحساب.",
};

export function firebaseAuthMessage(error) {
  return authMessages[error?.code] || "تعذر تسجيل الدخول حاليًا. حاول مرة أخرى.";
}

export async function signInAdmin(email, password) {
  if (!firebaseConfigured || !auth) throw new Error("firebase-not-configured");
  return signInWithEmailAndPassword(auth, email, password);
}

export async function signInUser(email, password) {
  if (!firebaseConfigured || !auth) throw new Error("firebase-not-configured");
  return signInWithEmailAndPassword(auth, email, password);
}

export async function signUpUser(email, password) {
  if (!firebaseConfigured || !auth) throw new Error("firebase-not-configured");
  return createUserWithEmailAndPassword(auth, email, password);
}

export function watchAuthState(callback) {
  if (!firebaseConfigured || !auth) return () => {};
  return onAuthStateChanged(auth, callback);
}

export async function getAdminProfile(user) {
  if (!user || !db) return null;
  const snapshot = await getDoc(doc(db, "users", user.uid));
  const profile = snapshot.exists() ? snapshot.data() : null;
  return profile?.role === "admin" ? profile : null;
}

export function signOutAdmin() {
  if (!auth) return Promise.resolve();
  return signOut(auth);
}
