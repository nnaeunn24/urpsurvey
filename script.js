import { saveSurvey } from "./firebase.js";

const pages = [
  "page-consent",
  "page-company",
  "page-video",
  "page-check",
  "page-survey",
  "page-complete"
];

let currentPageIndex = 0;
let condition = null;
let checkAnswer = null;
let currentQuestionIndex = 0;
let answers = {};

const progressBar = document.getElementById("progressBar");
const consentCheck = document.getElementById("consentCheck");
const startBtn = document.getElementById("startBtn");
const CONDITIONS = ["A", "B", "C", "D"];

function showPage(pageId) {
  pages.forEach(id => {
    document.getElementById(id).classList.remove("active");
  });

  document.getElementById(pageId).classList.add("active");
  currentPageIndex = pages.indexOf(pageId);
  updateProgress();
}

function updateProgress() {
  const progress = (currentPageIndex / (pages.length - 1)) * 100;
  progressBar.style.width = progress + "%";
}

/* 동의 체크 → 시작 버튼 활성화 */
consentCheck.addEventListener("change", () => {
  startBtn.disabled = !consentCheck.checked;
});

startBtn.addEventListener("click", () => {
  showPage("page-company");
});

/* 가상기업 설명 */
document.getElementById("companyNextBtn").addEventListener("click", () => {
  showPage("page-video");
});

/* 랜덤 배정 */
function setupParticipant() {
  const params = new URLSearchParams(window.location.search);

  // 1. URL에서 먼저 가져오기
  participantId = params.get("pid");
  condition = params.get("condition");

  // 2. URL에 없으면 localStorage에서 가져오기
  if (!participantId) {
    participantId = localStorage.getItem("participantId");
  }

  if (!condition) {
    condition = localStorage.getItem("condition");
  }

  // 3. 둘 다 없으면 새로 생성
  if (!participantId) {
    participantId = "u_" + crypto.randomUUID();
  }

  if (!condition) {
    condition = CONDITIONS[Math.floor(Math.random() * CONDITIONS.length)];
  }

  // 4. localStorage에 저장
  localStorage.setItem("participantId", participantId);
  localStorage.setItem("condition", condition);

  // 5. URL에도 저장
  params.set("pid", participantId);
  params.set("condition", condition);

  const newUrl = `${window.location.pathname}?${params.toString()}`;
  window.history.replaceState({}, "", newUrl);

  console.log("참여자 ID:", participantId);
  console.log("배정 조건:", condition);

  const conditionDisplay = document.getElementById("conditionDisplay");
  
  if (conditionDisplay) {
    conditionDisplay.textContent = condition;}
}

setupParticipant();

/* 영상 다음 */
document.getElementById("videoNextBtn").addEventListener("click", () => {
  renderCheckQuestion();
  showPage("page-check");
});

/* 내용 확인 질문 */
const checkQuestion = {
  id: "check_slogan",
  text: "A그룹의 슬로건은 무엇입니까?",
  options: [
    "기술로 연결하고, 사람을 향합니다",
    "사람을 넘어 기술로 향합니다",
    "미래를 만들고, 기업을 연결합니다",
    "새로운 일상을 디자인합니다"
  ],
  answer: "기술로 연결하고, 사람을 향합니다"
};

function renderCheckQuestion() {
  const textBox = document.getElementById("checkQuestionText");
  const optionsBox = document.getElementById("checkOptionsBox");
  const nextBtn = document.getElementById("checkNextBtn");

  textBox.textContent = checkQuestion.text;
  optionsBox.innerHTML = "";
  nextBtn.disabled = true;

  checkQuestion.options.forEach(option => {
    const button = document.createElement("button");
    button.className = "option-btn";
    button.textContent = option;

    button.addEventListener("click", () => {
      checkAnswer = option;

      document.querySelectorAll("#checkOptionsBox .option-btn").forEach(btn => {
        btn.classList.remove("selected");
      });

      button.classList.add("selected");
      nextBtn.disabled = false;
    });

    optionsBox.appendChild(button);
  });
}

document.getElementById("checkNextBtn").addEventListener("click", () => {
  renderSurveyQuestion();
  showPage("page-survey");
});

/* 본 설문: 5점 + 7점 섞기 */
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
  const question = questions[currentQuestionIndex];

  document.getElementById("questionCount").textContent =
    `${currentQuestionIndex + 1} / ${questions.length}`;

  document.getElementById("questionText").textContent = question.text;

  document.getElementById("scaleGuide").textContent =
    `1 = ${question.leftLabel}, ${question.scale} = ${question.rightLabel}`;

  const optionsBox = document.getElementById("optionsBox");
  const nextBtn = document.getElementById("surveyNextBtn");

  optionsBox.innerHTML = "";
  nextBtn.disabled = true;

  for (let i = 1; i <= question.scale; i++) {
    const label = document.createElement("label");
    label.className = "likert-option";

    const isLeft = i === 1;
    const isRight = i === question.scale;

    label.innerHTML = `
      <input type="radio" name="${question.id}" value="${i}">
      <div class="likert-circle">${i}</div>
      <div class="likert-label">
        ${isLeft ? question.leftLabel : isRight ? question.rightLabel : ""}
      </div>
    `;

    const input = label.querySelector("input");

    input.addEventListener("change", () => {
      answers[question.id] = Number(input.value);
      nextBtn.disabled = false;
    });

    optionsBox.appendChild(label);
  }

  nextBtn.textContent =
    currentQuestionIndex === questions.length - 1 ? "제출하기" : "다음";
}

document.getElementById("surveyNextBtn").addEventListener("click", () => {
  if (currentQuestionIndex < questions.length - 1) {
    currentQuestionIndex++;
    renderSurveyQuestion();
  } else {
    submitSurvey();
  }
});

/* 제출 */
function submitSurvey() {
  const result = {
    participantId: getParticipantId(),
    condition: condition,
    consent: consentCheck.checked,
    attentionCheck: {
      questionId: checkQuestion.id,
      answer: checkAnswer,
      isCorrect: checkAnswer === checkQuestion.answer
    },
    answers: answers,
    submittedAt: new Date().toISOString()
  };

  console.log("저장될 데이터:", result);
  saveSurvey(result);

  showPage("page-complete");
}

function getParticipantId() {
  let id = localStorage.getItem("participantId");

  if (!id) {
    id = "u_" + crypto.randomUUID();
    localStorage.setItem("participantId", id);
  }

  return id;
}

updateProgress();