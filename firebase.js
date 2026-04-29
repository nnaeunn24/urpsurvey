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

export async function assignBalancedCondition(participantId) {
  const participantRef = doc(db, "participants", participantId);
  const counterRef = doc(db, "meta", "conditionCounts");

  return await runTransaction(db, async transaction => {
    const participantSnap = await transaction.get(participantRef);

    if (participantSnap.exists()) {
      return participantSnap.data().condition;
    }

    const counterSnap = await transaction.get(counterRef);

    let counts = {
      A: 0,
      B: 0,
      C: 0,
      D: 0
    };

    if (counterSnap.exists()) {
      counts = {
        ...counts,
        ...counterSnap.data()
      };
    }

    const minCount = Math.min(counts.A, counts.B, counts.C, counts.D);
    const candidates = ["A", "B", "C", "D"].filter(c => counts[c] === minCount);
    const selected = candidates[Math.floor(Math.random() * candidates.length)];

    counts[selected] += 1;

    transaction.set(counterRef, counts);
    transaction.set(participantRef, {
      participantId,
      condition: selected,
      createdAt: serverTimestamp()
    });

    return selected;
  });
}