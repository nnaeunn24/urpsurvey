import { saveSurvey } from "./firebase.js";

const pages = [
  "page-consent",
  "page-company",
  "page-video",
  "page-check",
  "page-survey",
  "page-complete"
];

const CONDITIONS = ["A", "B", "C", "D"];

let participantId = null;
let condition = null;
let checkAnswer = null;
let currentQuestionIndex = 0;
let answers = {};

const progressBar = document.getElementById("progressBar");
const consentCheck = document.getElementById("consentCheck");
const startBtn = document.getElementById("startBtn");

const conditionDisplay = document.getElementById("conditionDisplay");

const checkQuestionText = document.getElementById("checkQuestionText");
const checkOptionsBox = document.getElementById("checkOptionsBox");
const checkNextBtn = document.getElementById("checkNextBtn");

const questionCount = document.getElementById("questionCount");
const questionText = document.getElementById("questionText");
const scaleGuide = document.getElementById("scaleGuide");
const optionsBox = document.getElementById("optionsBox");
const surveyNextBtn = document.getElementById("surveyNextBtn");

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

function showPage(pageId) {
  pages.forEach(id => {
    document.getElementById(id).classList.remove("active");
  });

  document.getElementById(pageId).classList.add("active");

  const progress = ((pages.indexOf(pageId) + 1) / pages.length) * 100;
  progressBar.style.width = progress + "%";
}

const checkQuestion = {
  text: "방금 소개된 기업의 이름은 무엇이었습니까?",
  options: ["A그룹", "B그룹", "C그룹", "D그룹"]
};

function renderCheckQuestion() {
  checkQuestionText.textContent = checkQuestion.text;
  checkOptionsBox.innerHTML = "";
  checkNextBtn.disabled = true;

  checkQuestion.options.forEach(option => {
    const label = document.createElement("label");
    label.className = "option-label";

    label.innerHTML = `
      <input type="radio" name="checkQuestion" value="${option}">
      <span>${option}</span>
    `;

    label.querySelector("input").addEventListener("change", e => {
      checkAnswer = e.target.value;
      checkNextBtn.disabled = false;
    });

    checkOptionsBox.appendChild(label);
  });
}

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

function renderSurveyQuestion() {
  const q = questions[currentQuestionIndex];

  questionCount.textContent = `${currentQuestionIndex + 1} / ${questions.length}`;
  questionText.textContent = q.text;
  scaleGuide.textContent = `${q.leftLabel} — ${q.rightLabel}`;
  optionsBox.innerHTML = "";
  surveyNextBtn.disabled = true;

  for (let i = 1; i <= q.scale; i++) {
    const label = document.createElement("label");
    label.className = "likert-option";

    label.innerHTML = `
      <input type="radio" name="${q.id}" value="${i}">
      <span>${i}</span>
    `;

    label.querySelector("input").addEventListener("change", e => {
      answers[q.id] = Number(e.target.value);
      surveyNextBtn.disabled = false;
    });

    optionsBox.appendChild(label);
  }

  surveyNextBtn.textContent =
    currentQuestionIndex === questions.length - 1 ? "제출하기" : "다음";
}

async function submitSurvey() {
  const result = {
    participantId,
    condition,
    consent: consentCheck.checked,
    checkAnswer,
    answers,
    submittedAt: new Date().toISOString()
  };

  await saveSurvey(result);
  showPage("page-complete");
}

setupParticipant();

consentCheck.addEventListener("change", () => {
  startBtn.disabled = !consentCheck.checked;
});

startBtn.addEventListener("click", () => {
  showPage("page-company");
});

document.getElementById("companyNextBtn").addEventListener("click", () => {
  conditionDisplay.textContent = condition;
  showPage("page-video");
});

document.getElementById("videoNextBtn").addEventListener("click", () => {
  renderCheckQuestion();
  showPage("page-check");
});

checkNextBtn.addEventListener("click", () => {
  currentQuestionIndex = 0;
  renderSurveyQuestion();
  showPage("page-survey");
});

surveyNextBtn.addEventListener("click", async () => {
  if (currentQuestionIndex < questions.length - 1) {
    currentQuestionIndex++;
    renderSurveyQuestion();
  } else {
    await submitSurvey();
  }
});