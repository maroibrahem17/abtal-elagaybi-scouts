import { createDocument, listDocuments, removeDocument, updateDocument } from "./repository.js";

const collectionName = "chants";

export const getChants = () => listDocuments(collectionName);
export const createChant = (data) => createDocument(collectionName, data);
export const updateChant = (id, data) => updateDocument(collectionName, id, data);
export const deleteChant = (id) => removeDocument(collectionName, id);
