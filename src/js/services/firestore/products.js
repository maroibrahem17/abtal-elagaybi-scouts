import { createDocument, listDocuments, removeDocument, updateDocument } from "./repository.js";

const collectionName = "products";

export const getProducts = () => listDocuments(collectionName);
export const createProduct = (data) => createDocument(collectionName, data);
export const updateProduct = (id, data) => updateDocument(collectionName, id, data);
export const deleteProduct = (id) => removeDocument(collectionName, id);
