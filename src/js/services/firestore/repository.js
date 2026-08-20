import { addDoc, collection, deleteDoc, doc, getDoc, getDocs, serverTimestamp, setDoc } from "firebase/firestore";
import { db } from "../firebase/config.js";

function requireDb() {
  if (!db) throw new Error("firebase-not-configured");
  return db;
}

function sortByOrder(items) {
  return items.sort((a, b) => (Number(a.order) || 0) - (Number(b.order) || 0));
}

export async function listDocuments(collectionName) {
  const snapshot = await getDocs(collection(requireDb(), collectionName));
  return sortByOrder(snapshot.docs.map((item) => ({ id: item.id, ...item.data() })));
}

export async function createDocument(collectionName, data) {
  const created = await addDoc(collection(requireDb(), collectionName), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return created.id;
}

export async function updateDocument(collectionName, id, data) {
  await setDoc(doc(requireDb(), collectionName, id), {
    ...data,
    updatedAt: serverTimestamp(),
  }, { merge: true });
}

export async function removeDocument(collectionName, id) {
  await deleteDoc(doc(requireDb(), collectionName, id));
}

export async function getDocument(collectionName, id) {
  const snapshot = await getDoc(doc(requireDb(), collectionName, id));
  return snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null;
}
