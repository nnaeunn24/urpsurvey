import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  doc,
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
  const counterRef = doc(db, "meta", "conditionCounts");
  const responseRef = doc(collection(db, "responses"));

  await runTransaction(db, async transaction => {
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

    if (counts[data.condition] === undefined) {
      counts[data.condition] = 0;
    }

    counts[data.condition] += 1;

    transaction.set(counterRef, counts);

    transaction.set(responseRef, {
      ...data,
      submittedAt: serverTimestamp()
    });
  });
}