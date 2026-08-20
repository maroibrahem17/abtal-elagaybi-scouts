import { createDocument, listDocuments, removeDocument, updateDocument } from "./repository.js";

const collectionName = "gallery";

export const getGallery = () => listDocuments(collectionName);
export const createGalleryItem = (data) => createDocument(collectionName, data);
export const updateGalleryItem = (id, data) => updateDocument(collectionName, id, data);
export const deleteGalleryItem = (id) => removeDocument(collectionName, id);
