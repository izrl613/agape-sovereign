import { 
  ref, 
  uploadBytesResumable, 
  getDownloadURL, 
  deleteObject,
  listAll
} from "firebase/storage";
import { storage } from "../firebase";

export const uploadProfilePicture = async (userId: string, file: File, onProgress?: (pct: number) => void): Promise<string> => {
  const storageRef = ref(storage, `users/${userId}/profile.jpg`);
  const uploadTask = uploadBytesResumable(storageRef, file);

  return new Promise((resolve, reject) => {
    uploadTask.on('state_changed', 
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        if (onProgress) onProgress(progress);
      }, 
      (error) => {
        console.error("Storage upload error:", error);
        reject(error);
      }, 
      async () => {
        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
        resolve(downloadURL);
      }
    );
  });
};

export const deleteUserFile = async (path: string) => {
  const fileRef = ref(storage, path);
  try {
    await deleteObject(fileRef);
    return true;
  } catch (error) {
    console.error("Storage delete error:", error);
    return false;
  }
};

export const listUserFiles = async (userId: string) => {
  const listRef = ref(storage, `users/${userId}`);
  try {
    const res = await listAll(listRef);
    return res.items;
  } catch (error) {
    console.error("Storage list error:", error);
    return [];
  }
};
