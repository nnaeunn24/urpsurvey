import { saveSurvey } from "./firebase.js";

const CONDITIONS = ["A", "B", "C", "D"];

let participantId = null;
let condition = null;
let currentStep = 0;
let answers = {};

const steps = [
  "page-consent",
  "page-company",
  "page-video",
  "survey-0",
  "survey-1",
  "survey-2",
  "survey-3",
  "survey-4",
  "page-complete"
];

const surveySections = [
  {
    title: "내용 확인 질문",
    guide: "영상을 바탕으로 가장 적절한 답을 선택해 주세요.",
    type: "choice",
    questions: [
      {
        id: "check_1",
        text: "방금 시청한 영상에 등장한 기업은 무엇입니까?",
        options: ["A그룹", "B그룹", "C그룹", "D그룹"]
      },
      {
        id: "check_2",
        text: "영상은 어떤 목적의 콘텐츠에 가까웠습니까?",
        options: ["기업 브랜딩", "제품 할인 안내", "채용 공고", "뉴스 보도"]
      }
    ]
  },
  {
    title: "콘텐츠 진정성",
    guide: "1점: 전혀 그렇지 않다 / 5점: 매우 그렇다",
    type: "likert",
    scale: 5,
    questions: [
      { id: "authenticity_1", text: "이 콘텐츠는 진정성 있게 느껴졌다." },
      { id: "authenticity_2", text: "이 콘텐츠는 솔직하게 느껴졌다." },
      { id: "authenticity_3", text: "이 콘텐츠는 작위적이지 않게 느껴졌다." },
      { id: "authenticity_4", text: "이 콘텐츠는 기업의 메시지를 자연스럽게 전달한다고 느껴졌다." }
    ]
  },
  {
    title: "브랜드 신뢰",
    guide: "1점: 전혀 그렇지 않다 / 5점: 매우 그렇다",
    type: "likert",
    scale: 5,
    questions: [
      { id: "trust_1", text: "이 브랜드는 신뢰할 수 있다고 느껴졌다." },
      { id: "trust_2", text: "이 브랜드는 정직하게 느껴졌다." },
      { id: "trust_3", text: "이 브랜드는 소비자를 중요하게 생각한다고 느껴졌다." },
      { id: "trust_4", text: "이 브랜드의 메시지는 믿을 만하다고 느껴졌다." }
    ]
  },
  {
    title: "배신감",
    guide: "1점: 전혀 그렇지 않다 / 5점: 매우 그렇다",
    type: "likert",
    scale: 5,
    questions: [
      { id: "betrayal_1", text: "이 브랜드가 나를 속였다고 느꼈다." },
      { id: "betrayal_2", text: "이 브랜드가 나를 정직하게 대하지 않았다고 느꼈다." },
      { id: "betrayal_3", text: "이 브랜드가 소비자의 기대를 저버렸다고 느꼈다." },
      { id: "betrayal_4", text: "이 브랜드에 대해 배신감을 느꼈다." }
    ]
  },
  {
    title: "행동 의도",
    guide: "1점: 전혀 그렇지 않다 / 7점: 매우 그렇다",
    type: "likert",
    scale: 7,
    questions: [
      { id: "behavior_1", text: "앞으로 이 브랜드에 대해 긍정적으로 생각할 것 같다." },
      { id: "behavior_2", text: "이 브랜드의 콘텐츠를 다시 볼 의향이 있다." },
      { id: "behavior_3", text: "이 브랜드를 주변 사람에게 긍정적으로 이야기할 의향이 있다." },
      { id: "behavior_4", text: "이 브랜드의 제품이나 서비스를 이용할 의향이 있다." }
    ]
  }
];

const progressBar = document.getElementById("progressBar");
const consentCheck = document.getElementById("consentCheck");
const startBtn = document.getElementById("startBtn");
const conditionDisplay = document.getElementById("conditionDisplay");

const sectionCount = document.getElementById("sectionCount");
const sectionTitle = document.getElementById("sectionTitle");
const sectionGuide = document.getElementById("sectionGuide");
const questionsBox = document.getElementById("questionsBox");
const surveyBackBtn = document.getElementById("surveyBackBtn");
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

function showStep(index) {
  currentStep = index;

  document.querySelectorAll(".page").forEach(page => {
    page.classList.remove("active");
  });

  const step = steps[currentStep];

  if (step.startsWith("survey-")) {
    document.getElementById("page-survey").classList.add("active");
    const sectionIndex = Number(step.split("-")[1]);
    renderSurveySection(sectionIndex);
  } else {
    document.getElementById(step).classList.add("active");
  }

  updateProgress();
}

function updateProgress() {
  const progress = ((currentStep + 1) / steps.length) * 100;
  progressBar.style.width = `${progress}%`;
}

function renderSurveySection(sectionIndex) {
  const section = surveySections[sectionIndex];

  if (!section) {
    console.error("해당 surveySections가 없습니다:", sectionIndex);
    return;
  }

  if (!sectionCount || !sectionTitle || !sectionGuide || !questionsBox || !surveyNextBtn) {
    console.error("설문 영역 HTML id가 맞지 않습니다.");
    return;
  }

  sectionCount.textContent = `${sectionIndex + 1} / ${surveySections.length}`;
  sectionTitle.textContent = section.title;
  sectionGuide.textContent = section.guide;
  questionsBox.innerHTML = "";
  
  sectionTitle.textContent = section.title;
  sectionGuide.textContent = section.guide;
  questionsBox.innerHTML = "";

  section.questions.forEach((q, qIndex) => {
    const questionDiv = document.createElement("div");
    questionDiv.className = "question-block";

    const questionText = document.createElement("p");
    questionText.className = "question-text";
    questionText.textContent = `${qIndex + 1}. ${q.text}`;

    questionDiv.appendChild(questionText);

    if (section.type === "choice") {
      const optionsDiv = document.createElement("div");
      optionsDiv.className = "choice-options";

      q.options.forEach(option => {
        const label = document.createElement("label");
        label.className = "choice-option";

        label.innerHTML = `
          <input type="radio" name="${q.id}" value="${option}">
          <span>${option}</span>
        `;

        const input = label.querySelector("input");

        if (answers[q.id] === option) {
          input.checked = true;
        }

        input.addEventListener("change", () => {
          answers[q.id] = option;
          updateSurveyNextButton(sectionIndex);
        });

        optionsDiv.appendChild(label);
      });

      questionDiv.appendChild(optionsDiv);
    }

    if (section.type === "likert") {
      const likertDiv = document.createElement("div");
      likertDiv.className = "likert-row";

      for (let i = 1; i <= section.scale; i++) {
        const label = document.createElement("label");
        label.className = "likert-option";

        label.innerHTML = `
          <input type="radio" name="${q.id}" value="${i}">
          <span>${i}</span>
        `;

        const input = label.querySelector("input");

        if (answers[q.id] === i) {
          input.checked = true;
        }

        input.addEventListener("change", () => {
          answers[q.id] = i;
          updateSurveyNextButton(sectionIndex);
        });

        likertDiv.appendChild(label);
      }

      questionDiv.appendChild(likertDiv);
    }

    questionsBox.appendChild(questionDiv);
  });

  surveyNextBtn.textContent =
    sectionIndex === surveySections.length - 1 ? "제출하기" : "다음";

  updateSurveyNextButton(sectionIndex);
}

function updateSurveyNextButton(sectionIndex) {
  const section = surveySections[sectionIndex];

  const isComplete = section.questions.every(q => {
    return answers[q.id] !== undefined && answers[q.id] !== null && answers[q.id] !== "";
  });

  surveyNextBtn.disabled = !isComplete;
}

async function submitSurvey() {
  const result = {
    participantId,
    condition,
    consent: consentCheck.checked,
    answers,
    submittedAt: new Date().toISOString()
  };

  await saveSurvey(result);
  showStep(steps.length - 1);
}

setupParticipant();
updateProgress();

consentCheck.addEventListener("change", () => {
  startBtn.disabled = !consentCheck.checked;
});

startBtn.addEventListener("click", () => {
  showStep(1);
});

document.getElementById("companyBackBtn").addEventListener("click", () => {
  showStep(0);
});

document.getElementById("companyNextBtn").addEventListener("click", () => {
  conditionDisplay.textContent = condition;
  showStep(2);
});

document.getElementById("videoBackBtn").addEventListener("click", () => {
  showStep(1);
});

document.getElementById("videoNextBtn").addEventListener("click", () => {
  renderSurveySection(0);

  document.querySelectorAll(".page").forEach(page => {
    page.classList.remove("active");
  });

  document.getElementById("page-survey").classList.add("active");

  currentStep = 3;
  updateProgress();
});

surveyBackBtn.addEventListener("click", () => {
  if (currentStep > 0) {
    showStep(currentStep - 1);
  }
});

surveyNextBtn.addEventListener("click", async () => {
  const currentSurveyIndex = currentStep - 3;

  if (currentSurveyIndex < surveySections.length - 1) {
    showStep(currentStep + 1);
  } else {
    await submitSurvey();
  }
});