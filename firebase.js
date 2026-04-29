// Firebase SDK 불러오기
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore, collection, addDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// config 그대로 넣기
const firebaseConfig = {
  apiKey: "AIzaSyCX4bB7zgJa-YoaVUXVXYY_CLlagfPIxac",
  authDomain: "urp-survey.firebaseapp.com",
  projectId: "urp-survey",
  storageBucket: "urp-survey.firebasestorage.app",
  messagingSenderId: "1085277341715",
  appId: "1:1085277341715:web:fe00502354eebffba297e6",
  measurementId: "G-NSXLSY2KCP"
};

// 초기화
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// 🔥 이 함수가 핵심 (설문 저장)
export async function saveSurvey(data) {
  try {
    await addDoc(collection(db, "responses"), data);
    console.log("저장 완료");
  } catch (e) {
    console.error("저장 실패", e);
  }
}