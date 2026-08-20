import { collection, doc } from "firebase/firestore";
import { db } from "./config.js";

export const firestoreCollections = {
  users: () => collection(db, "users"),
  products: () => collection(db, "products"),
  chants: () => collection(db, "chants"),
  gallery: () => collection(db, "gallery"),
  orders: () => collection(db, "orders"),
  settings: () => collection(db, "settings"),
};

export const userDocument = (uid) => doc(db, "users", uid);
