import { saveSurvey, getBalancedCondition } from "./firebase.js";

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
    title: "배신감",
    guide: "각 문항에 대해 가장 가까운 응답을 선택해 주세요.",
    type: "likert",
    scale: 7,
    questions: [
      { id: "betrayal_1", text: "나는 이 기업이 나를 배신했다고 느꼈다." },
      { id: "betrayal_2", text: "나는 이 기업이 나를 속였다고 느꼈다." },
      { id: "betrayal_3", text: "나는 이 기업이 소비자를 정직하게 대하지 않았다고 느꼈다." },
      { id: "betrayal_4", text: "이 기업은 AI 기술을 내세워 나를 이용하려 한다고 느낀다." },
      { id: "betrayal_5", text: "나는 이 기업이 \"광고는 시간과 비용을 일정 수준 들여야 한다\"는 소비자의 기대를 저버렸다고 느꼈다." },
    ]
  },
  {
    title: "진정성",
    guide: "각 문항에 대해 가장 가까운 응답을 선택해 주세요.",
    type: "likert",
    scale: 7,
    questions: [
      { id: "authenticity_1", text: "이 콘텐츠는 솔직한 내용을 담고 있다." },
      { id: "authenticity_2", text: "이 콘텐츠는 작위적이다." },
      { id: "authenticity_3", text: "이 콘텐츠는 객관적인 정보를 제공한다." },
      { id: "authenticity_4", text: "이 콘텐츠가 제공하는 정보는 믿을 만하다." },
      { id: "authenticity_5", text: "이 콘텐츠는 과장되지 않았다." },
      { id: "authenticity_6", text: "이 콘텐츠는 사실에 기반하고 있다." }
    ]
  },
  {
    title: "행동 의도-구매 의도",
    guide: "각 문항에 대해 가장 가까운 응답을 선택해 주세요.",
    type: "likert",
    scale: 7,
    questions: [
      { id: "purchase_1", text: "이 콘텐츠를 보고 해당 기업의 제품·서비스를 이용할 의향이 생겼다." },
      { id: "purchase_2", text: "이 콘텐츠는 해당 기업을 선택하려는 나의 의도에 긍정적인 영향을 미친다." },
      { id: "purchase_3", text: "향후 필요한 상황이 생긴다면, 이 기업을 우선적으로 선택할 것이다." },
      { id: "purchase_4", text: "이 콘텐츠를 보고 해당 기업을 주변 사람들에게 추천할 의향이 있다." },
      { id: "purchase_5", text: "이 콘텐츠를 보고 이 기업과 지속적인 관계를 유지하고 싶어졌다." },
      
    ]
  },
  {
    title: "행동 의도-브랜드 회피",
    guide: "각 문항에 대해 가장 가까운 응답을 선택해 주세요.",
    type: "likert",
    scale: 7,
    questions: [
      { id: "evasion_1", text: "이 콘텐츠를 보고 해당 기업을 다시는 만나고 싶지 않아졌다." },
      { id: "evasion_2", text: "이 콘텐츠를 보고 해당 기업의 소비를 최대한 피하고 싶어졌다." },
      { id: "evasion_3", text: "이 콘텐츠를 보고 해당 기업의 다른 광고도 보고 싶지 않아졌다." },
      { id: "evasion_4", text: "이 콘텐츠를 유튜브, 인스타그램 등 인터넷에서 광고로 보고 싶지 않다." },
      { id: "evasion_5", text: "이 콘텐츠를 텔레비전에서 광고로 보고 싶지 않다." },
    ]
  },
  {
    title: "행동 의도-부정적 구전",
    guide: "각 문항에 대해 가장 가까운 응답을 선택해 주세요.",
    type: "likert",
    scale: 7,
    questions: [
      { id: "negative_1", text: "이 기업에 대한 부정적 의견을 타인에게 공유할 것이다." },
      { id: "negative_2", text: "이 기업에 대한 부정적 의견을 SNS에 표출할 것이다." },
      { id: "negative_3", text: "이 기업에 대한 불만을 넘어서서 부정적 평가를 할 것이다." },
      { id: "negative_4", text: "친구가 해당 기업을 소비하지 않도록 강력하게 설득할 것이다." },
      { id: "negative_5", text: "가까운 지인뿐 아니라 다양한 사람들이 이 기업을 소비하지 않도록 설득할 것이다." },
    ]
  },
  {
    title: "콘텐츠 퀄리티",
    guide: "각 문항에 대해 가장 가까운 응답을 선택해 주세요.",
    type: "likert",
    scale: 7,
    questions: [
      { id: "quality_1", text: "이 콘텐츠는 자연스럽고 현실적으로 느껴진다." },
      { id: "quality_2", text: "이 콘텐츠는 완성도가 높다고 느껴진다." },
      { id: "quality_3", text: "이 콘텐츠의 전반적인 품질은 높다고 느껴진다." },
      { id: "quality_4", text: "이 콘텐츠에서 사람의 표정이나 움직임이 부자연스럽다고 느꼈다." }
    ]
  },
  
  {
  title: "",
  guide: "기본 정보를 입력해 주세요.",
  type: "choice",
  noBack: false, // ⭐ 이전 버튼 숨기기용
  questions: [
    {
      id: "age",
      text: "귀하의 나이는 어떻게 되십니까?",
      options: ["10대", "20대", "30대", "40대", "50대 이상"]
    },
    {
      id: "gender",
      text: "귀하의 성별은 어떻게 되십니까?",
      options: ["여성", "남성"]
    }
  ]
},
{
  title: "",
  guide: "다음 문항에 대해 해당되는 응답을 선택해 주세요.",
  type: "binary",
  questions: [
    { id: "ai_attitude_1", text: "나는 이미지나 영상 제작에 AI 도구를 사용해 본 경험이 있다." },
    { id: "ai_attitude_2", text: "AI가 생성한 이미지나 영상도 충분히 높은 품질을 가질 수 있다고 생각한다." },
    { id: "ai_attitude_3", text: "나는 이미지나 영상 제작에 AI 도구를 사용해 본 경험이 있다." },
    { id: "ai_attitude_4", text: "기업이 광고 제작에 AI를 활용하는 것은 효율적인 방법이라고 생각한다." },
    { id: "ai_attitude_5", text: "AI가 만든 광고 콘텐츠에 대해 거부감을 느낄 때가 있다." },
    { id: "ai_attitude_6", text: "기업이 AI를 활용해 광고를 제작하더라도 브랜드에 대한 신뢰는 크게 변하지 않을 것이라고 생각한다." },
    { id: "ai_attitude_7", text: "기업이 AI로 광고를 제작하는 것은 소비자를 오해하게 만들 수 있다고 생각한다." },
  ]
},
{
  title: "",
  guide: "",
  type: "final",
  noBack: false,
  questions: []
}
];

document.addEventListener("DOMContentLoaded", async () => {
  await setupParticipant();
  bindEvents();
  updateProgress();
});

async function setupParticipant() {
  const params = new URLSearchParams(window.location.search);

  participantId =
    params.get("pid") ||
    localStorage.getItem("participantId");

  condition =
    params.get("condition") ||
    localStorage.getItem("condition");

  if (!participantId) {
    participantId = "u_" + crypto.randomUUID();
  }

  if (!condition) {
    condition = await getBalancedCondition();
  }

  localStorage.setItem("participantId", participantId);
  localStorage.setItem("condition", condition);

  params.set("pid", participantId);
  params.set("condition", condition);

  const newUrl =
    window.location.pathname +
    "?" +
    params.toString();

  if (
    !window.location.search.includes("pid") ||
    !window.location.search.includes("condition")
  ) {
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

  setTimeout(() => {
    window.scrollTo(0, 0);
  }, 0);
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

  //document.getElementById("sectionTitle").textContent = section.title;
  document.getElementById("sectionGuide").textContent = section.guide;

  const questionsBox = document.getElementById("questionsBox");
  questionsBox.innerHTML = "";

  if (section.type === "final") {
    const message = document.createElement("div");
    message.className = "final-message";
    message.innerHTML = `
      <h3>설문에 참여해 주셔서 감사합니다.</h3>
      <p>모든 응답이 완료되었습니다.<br>귀하의 참여 덕에 신뢰도 있는 연구를 진행할 수 있습니다.<br>아래 제출하기 버튼을 눌러 설문을 종료해 주세요.</p>
    `;
    questionsBox.appendChild(message);
  }

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

        const padding = 11; // 좌우 여백 % (조절 가능)
        const position = padding + ((i - 1) / (section.scale - 1)) * (100 - padding * 2);
        label.style.left = position + "%";

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

        if (i === 1) {
          const leftText = document.createElement("small");
          leftText.className = "scale-end-label";
          leftText.textContent = "전혀 그렇지 않다";
          label.appendChild(leftText);
        }

        if (i === section.scale) {
          const rightText = document.createElement("small");
          rightText.className = "scale-end-label";
          rightText.textContent = "매우 그렇다";
          label.appendChild(rightText);
        }

        likertBox.appendChild(label);
      }

      questionBlock.appendChild(likertBox);
    }

    if (section.type === "binary") {
      const optionsBox = document.createElement("div");
      optionsBox.className = "binary-options";

      ["그렇다", "아니다"].forEach(option => {
        const btn = document.createElement("button");
        btn.className = "binary-btn";
        btn.textContent = option;

        if (answers[question.id] === option) {
          btn.classList.add("selected");
        }

        btn.addEventListener("click", () => {
          answers[question.id] = option;

          // 선택 상태 업데이트
          optionsBox.querySelectorAll(".binary-btn").forEach(b => {
            b.classList.remove("selected");
          });
          btn.classList.add("selected");

          updateSurveyNextButton();
        });

        optionsBox.appendChild(btn);
      });

      questionBlock.appendChild(optionsBox);
    }

    questionsBox.appendChild(questionBlock);
  });

  const surveyNextBtn = document.getElementById("surveyNextBtn");
  const surveyBackBtn = document.getElementById("surveyBackBtn");

  if (section.noBack === true) {
    surveyBackBtn.style.display = "none";
  } else {
    surveyBackBtn.style.display = "block";
  }

  surveyNextBtn.textContent =
    currentSectionIndex === surveySections.length - 1 ? "제출하기" : "다음";
  
  if (section.type === "final") {
    document.getElementById("surveyNextBtn").disabled = false;
  } else {
    updateSurveyNextButton();
  }
  updateProgress();

  setTimeout(() => {
    window.scrollTo(0, 0);
  }, 0);
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