import { saveSurvey } from "./firebase.js";

const CONDITIONS = ["A", "B", "C", "D"];

const VIDEO_URLS = {
  A: "videos/video-a.mp4",
  B: "videos/video-b.mp4",
  C: "videos/video-c.mp4",
  D: "videos/video-d.mp4"
};

let participantId = "";
let condition = "";
let currentPageIndex = 0;
let currentSectionIndex = 0;
let answers = {};

const pages = [
  "page-consent",
  "page-company",
  "page-video",
  "page-survey",
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
        text: "방금 시청한 영상은 어떤 목적의 콘텐츠에 가까웠습니까?",
        options: ["기업 브랜딩", "제품 판매", "채용 안내", "뉴스 보도"]
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
    guide: "1점: 전혀 그렇지 않다 / 5점: 매우 그렇다",
    type: "likert",
    scale: 5,
    questions: [
      { id: "behavior_1", text: "앞으로 이 브랜드에 대해 긍정적으로 생각할 것 같다." },
      { id: "behavior_2", text: "이 브랜드의 콘텐츠를 다시 볼 의향이 있다." },
      { id: "behavior_3", text: "이 브랜드를 주변 사람에게 긍정적으로 이야기할 의향이 있다." },
      { id: "behavior_4", text: "이 브랜드의 제품이나 서비스를 이용할 의향이 있다." }
    ]
  }
];

document.addEventListener("DOMContentLoaded", () => {
  setupParticipant();
  bindEvents();
  updateProgress();
});

function setupParticipant() {
  const params = new URLSearchParams(window.location.search);

  participantId =
    params.get("pid") ||
    localStorage.getItem("participantId") ||
    "u_" + crypto.randomUUID();

  condition =
    params.get("condition") ||
    localStorage.getItem("condition") ||
    CONDITIONS[Math.floor(Math.random() * CONDITIONS.length)];

  localStorage.setItem("participantId", participantId);
  localStorage.setItem("condition", condition);

  params.set("pid", participantId);
  params.set("condition", condition);

  const newUrl =
    window.location.pathname +
    "?" +
    params.toString();
  if (!window.location.search.includes("pid") || !window.location.search.includes("condition")) {
    window.location.replace(newUrl);
    return;
  }

  console.log("participantId:", participantId);
  console.log("condition:", condition);
}

function bindEvents() {
  const consentCheck = document.getElementById("consentCheck");
  const startBtn = document.getElementById("startBtn");

  consentCheck.addEventListener("change", () => {
    startBtn.disabled = !consentCheck.checked;
  });

  startBtn.addEventListener("click", () => {
    showPage(1);
  });

  document.getElementById("companyBackBtn").addEventListener("click", () => {
    showPage(0);
  });

  document.getElementById("companyNextBtn").addEventListener("click", () => {
  document.getElementById("conditionDisplay").textContent = condition;

  const video = document.getElementById("surveyVideo");
  const source = document.getElementById("videoSource");

  source.src = VIDEO_URLS[condition];
  video.load();

  showPage(2);
});

  document.getElementById("videoBackBtn").addEventListener("click", () => {
    showPage(1);
  });

  document.getElementById("videoNextBtn").addEventListener("click", () => {
    currentSectionIndex = 0;
    renderSurveySection();
    showPage(3);
  });

  document.getElementById("surveyBackBtn").addEventListener("click", () => {
    if (currentSectionIndex > 0) {
      currentSectionIndex--;
      renderSurveySection();
    } else {
      showPage(2);
    }
  });

  document.getElementById("surveyNextBtn").addEventListener("click", async () => {
    if (currentSectionIndex < surveySections.length - 1) {
      currentSectionIndex++;
      renderSurveySection();
    } else {
      await submitSurvey();
    }
  });
}

function showPage(index) {
  currentPageIndex = index;

  document.querySelectorAll(".page").forEach(page => {
    page.classList.remove("active");
  });

  document.getElementById(pages[index]).classList.add("active");
  updateProgress();
}

function updateProgress() {
  const progressBar = document.getElementById("progressBar");

  let progress = 0;

  if (currentPageIndex < 3) {
    progress = ((currentPageIndex + 1) / (pages.length + surveySections.length - 1)) * 100;
  } else if (currentPageIndex === 3) {
    progress = ((3 + currentSectionIndex + 1) / (pages.length + surveySections.length - 1)) * 100;
  } else {
    progress = 100;
  }

  progressBar.style.width = progress + "%";
}

function renderSurveySection() {
  const section = surveySections[currentSectionIndex];

  document.getElementById("sectionCount").textContent =
    `${currentSectionIndex + 1} / ${surveySections.length}`;

  document.getElementById("sectionTitle").textContent = section.title;
  document.getElementById("sectionGuide").textContent = section.guide;

  const questionsBox = document.getElementById("questionsBox");
  questionsBox.innerHTML = "";

  section.questions.forEach((question, index) => {
    const questionBlock = document.createElement("div");
    questionBlock.className = "question-block";

    const questionText = document.createElement("p");
    questionText.className = "question-text";
    questionText.textContent = `${index + 1}. ${question.text}`;
    questionBlock.appendChild(questionText);

    if (section.type === "choice") {
      const optionsBox = document.createElement("div");
      optionsBox.className = "choice-options";

      question.options.forEach(option => {
        const label = document.createElement("label");
        label.className = "choice-option";

        const input = document.createElement("input");
        input.type = "radio";
        input.name = question.id;
        input.value = option;

        if (answers[question.id] === option) {
          input.checked = true;
        }

        input.addEventListener("change", () => {
          answers[question.id] = option;
          updateSurveyNextButton();
        });

        const span = document.createElement("span");
        span.textContent = option;

        label.appendChild(input);
        label.appendChild(span);
        optionsBox.appendChild(label);
      });

      questionBlock.appendChild(optionsBox);
    }

    if (section.type === "likert") {
      const likertBox = document.createElement("div");
      likertBox.className = "likert-row";

      for (let i = 1; i <= section.scale; i++) {
        const label = document.createElement("label");
        label.className = "likert-option";

        const input = document.createElement("input");
        input.type = "radio";
        input.name = question.id;
        input.value = i;

        if (answers[question.id] === i) {
          input.checked = true;
        }

        input.addEventListener("change", () => {
          answers[question.id] = i;
          updateSurveyNextButton();
        });

        const span = document.createElement("span");
        span.textContent = i;

        label.appendChild(input);
        label.appendChild(span);
        likertBox.appendChild(label);
      }

      questionBlock.appendChild(likertBox);
    }

    questionsBox.appendChild(questionBlock);
  });

  const surveyNextBtn = document.getElementById("surveyNextBtn");

  surveyNextBtn.textContent =
    currentSectionIndex === surveySections.length - 1 ? "제출하기" : "다음";

  updateSurveyNextButton();
  updateProgress();
}

function updateSurveyNextButton() {
  const section = surveySections[currentSectionIndex];

  const complete = section.questions.every(question => {
    return answers[question.id] !== undefined;
  });

  document.getElementById("surveyNextBtn").disabled = !complete;
}

async function submitSurvey() {
  const result = {
    participantId,
    condition,
    consent: true,
    answers,
    submittedAtClient: new Date().toISOString()
  };

  try {
    await saveSurvey(result);
  } catch (error) {
    console.error("저장 실패:", error);
  }

  showPage(4);
}