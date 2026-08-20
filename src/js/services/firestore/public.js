import { firebaseConfigured } from "../firebase/config.js";
import { getProducts } from "./products.js";
import { getChants } from "./chants.js";
import { getGallery } from "./gallery.js";
import { getGeneralSettings } from "./settings.js";

export async function loadPublicFirestoreContent() {
  if (!firebaseConfigured) return null;
  const [products, chants, gallery, settings] = await Promise.all([
    getProducts(),
    getChants(),
    getGallery(),
    getGeneralSettings(),
  ]);
  return { products, chants, gallery, settings };
}
