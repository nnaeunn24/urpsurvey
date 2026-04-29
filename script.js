import { saveSurvey } from "./firebase.js";

// 페이지 순서
const pages = [
  "page-consent",
  "page-company",
  "page-video",
  "page-check",
  "page-survey",
  "page-complete"
];

let currentPageIndex = 0;

// 참여자 / 조건
const CONDITIONS = ["A", "B", "C", "D"];
let participantId = null;
let condition = null;

// 상태값
let checkAnswer = null;
let currentQuestionIndex = 0;
let answers = {};

// DOM
const progressBar = document.getElementById("progressBar");
const consentCheck = document.getElementById("consentCheck");
const startBtn = document.getElementById("startBtn");

// ----------------------
// 참가자 & 조건 설정 (핵심)
// ----------------------
function setupParticipant() {
  const params = new URLSearchParams(window.location.search);

  participantId = params.get("pid") || localStorage.getItem("participantId");
  condition = params.get("condition") || localStorage.getItem("condition");

  if (!participantId) {
    participantId = "u_" + crypto.randomUUID();
  }

  if (!condition) {
    condition = CONDITIONS[Math.floor(Math.random() * CONDITIONS.length)];
  }

  localStorage.setItem("participantId", participantId);
  localStorage.setItem("condition", condition);

  params.set("pid", participantId);
  params.set("condition", condition);

  const newUrl = `${window.location.pathname}?${params.toString()}`;
  window.history.replaceState({}, "", newUrl);

  console.log("참여자 ID:", participantId);
  console.log("조건:", condition);
}

setupParticipant();

// ----------------------
// 페이지 이동
// ----------------------
function showPage(pageId) {
  pages.forEach(id => {
    document.getElementById(id).classList.remove("active");
  });

  document.getElementById(pageId).classList.add("active");

  // 진행바
  const progress = ((pages.indexOf(pageId) + 1) / pages.length) * 100;
  progressBar.style.width = progress + "%";
}

// ----------------------
// 동의 체크 → 시작 버튼 활성화
// ----------------------
consentCheck.addEventListener("change", () => {
  startBtn.disabled = !consentCheck.checked;
});

// ----------------------
// 버튼 이벤트
// ----------------------
startBtn.addEventListener("click", () => {
  showPage("page-company");
});

document.getElementById("companyNextBtn").addEventListener("click", () => {
  document.getElementById("conditionDisplay").textContent = condition;
  showPage("page-video");
});

document.getElementById("videoNextBtn").addEventListener("click", () => {
  showPage("page-check");
});

document.getElementById("checkNextBtn").addEventListener("click", () => {
  showPage("page-survey");
});

// ----------------------
// 설문 질문
// ----------------------
const questions = [
  {
    id: "authenticity_1",
    text: "이 콘텐츠는 진정성 있게 느껴졌다.",
    scale: 5,
    leftLabel: "전혀 그렇지 않다",
    rightLabel: "매우 그렇다"
  },
  {
    id: "trust_1",
    text: "이 브랜드는 신뢰할 수 있다고 느껴졌다.",
    scale: 7,
    leftLabel: "전혀 그렇지 않다",
    rightLabel: "매우 그렇다"
  }
];

// ----------------------
// 설문 렌더링
// ----------------------
const surveyContainer = document.getElementById("surveyContainer");

function renderQuestions() {
  surveyContainer.innerHTML = "";

  questions.forEach(q => {
    const div = document.createElement("div");
    div.className = "question";

    let options = "";
    for (let i = 1; i <= q.scale; i++) {
      options += `
        <label>
          <input type="radio" name="${q.id}" value="${i}">
          ${i}
        </label>
      `;
    }

    div.innerHTML = `
      <p>${q.text}</p>
      <div>${q.leftLabel}</div>
      <div>${options}</div>
      <div>${q.rightLabel}</div>
    `;

    surveyContainer.appendChild(div);
  });
}

renderQuestions();

// ----------------------
// 제출
// ----------------------
document.getElementById("submitBtn").addEventListener("click", async () => {
  questions.forEach(q => {
    const selected = document.querySelector(`input[name="${q.id}"]:checked`);
    if (selected) {
      answers[q.id] = Number(selected.value);
    }
  });

  const result = {
    participantId,
    condition,
    consent: consentCheck.checked,
    answers,
    submittedAt: new Date().toISOString()
  };

  await saveSurvey(result);

  showPage("page-complete");
});