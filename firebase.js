import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  doc,
  getDoc,
  setDoc,
  runTransaction,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCX4bB7zgJa-YoaVUXVXYY_CLlagfPIxac",
  authDomain: "urp-survey.firebaseapp.com",
  projectId: "urp-survey",
  storageBucket: "urp-survey.firebasestorage.app",
  messagingSenderId: "1085277341715",
  appId: "1:1085277341715:web:fe00502354eebffba297e6",
  measurementId: "G-NSXLSY2KCP"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export async function saveSurvey(data) {
  await addDoc(collection(db, "responses"), {
    ...data,
    submittedAt: serverTimestamp()
  });
}

export async function saveSurvey(data) {
  const counterRef = doc(db, "meta", "conditionCounts");

  await runTransaction(db, async transaction => {
    const snap = await transaction.get(counterRef);

    let counts = { A: 0, B: 0, C: 0, D: 0 };

    if (snap.exists()) {
      counts = { ...counts, ...snap.data() };
    }

    counts[data.condition] += 1;

    transaction.set(counterRef, counts);
    transaction.set(doc(collection(db, "responses")), {
      ...data,
      submittedAt: serverTimestamp()
    });
  });
}