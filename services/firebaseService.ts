import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User
} from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyAdiyHMS80zHYt1YXPsqrBJaa0Cy0vYoHU",
    authDomain: "nutrilife-329ec.firebaseapp.com",
    projectId: "nutrilife-329ec",
    storageBucket: "nutrilife-329ec.firebasestorage.app",
    messagingSenderId: "867034962543",
    appId: "1:867034962543:web:110e2883a986aaebab0b9a"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

const provider = new GoogleAuthProvider();

export const signInWithGoogle = async (): Promise<User | null> => {
    try {
        const result = await signInWithPopup(auth, provider);
        return result.user;
    } catch (error) {
        console.error("Error during Google sign-in:", error);
        return null;
    }
};

export const signOutUser = async (): Promise<void> => {
    try {
        await signOut(auth);
    } catch (error) {
        console.error("Error signing out:", error);
    }
};

export { onAuthStateChanged };
export type { User };