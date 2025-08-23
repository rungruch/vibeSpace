export enum ErrorTypes {
  NotFound = "notfound",
  InvalidData = "invalid_data",
  FetchFailed = "fetch_failed"
}

export enum FormMode {
  Create = "create",
  Edit = "edit"
}

export enum EditorType {
  Page = "page",
  Post = "post"
}

export enum EditorMode {
  Page = "page",
  Post = "post",
  Elearning = "elearning",
  ReadOnly = "readonly"
}

export enum FormTypes {
  Form = "form",
  Quiz = "quiz"
}

export enum FormVisible {
  Public = "public",
  Private = "private"
}

export enum SelectFileFilter {
  ALL = 'ALL',
  IMAGE = 'IMAGE',
  VIDEO = 'VIDEO',
  PDF = 'PDF'
}

export const formClosedJson = {
  "title": "Form Closed",
  "pages": [
    {
      "name": "page1",
      "elements": [
        {
          "type": "html",
          "name": "question1",
          "html": "<h4>แบบฟอร์มนี้ไม่รับคำตอบแล้ว</h4><p>โปรดลองติดต่อเจ้าของแบบฟอร์ม หากคิดว่าเกิดความผิดพลาด</p>"
        }
      ]
    }
  ],
  "readOnly": true,
  "mode": "display",
  "firstPageIsStartPage": true
}

export const formNotAcceptJson = {
  "title": "Form Not Accepting Responses",
  "pages": [
    {
      "name": "page1",
      "elements": [
        {
          "type": "html",
          "name": "question1",
          "html": "<h4>แบบฟอร์มนี้ไม่รับคำตอบแล้ว</h4><p>โปรดลองติดต่อเจ้าของแบบฟอร์ม หากคิดว่าเกิดความผิดพลาด</p>"
        }
      ]
    }
  ],
  "readOnly": true,
  "mode": "display",
  "firstPageIsStartPage": true
};

export const simpleSurveyJson = {
  elements: [{
    name: "FirstName",
    title: "Enter your first name:",
    type: "text"
  }, {
    name: "LastName",
    title: "Enter your last name:",
    type: "text"
  }]
};

export const simpleQuizSurveyJson = {
  title: "American History",
  pages: [{
    elements: [{
      type: "radiogroup",
      name: "civilwar",
      title: "When was the American Civil War?",
      choices: [
        "1796-1803", "1810-1814", "1861-1865", "1939-1945"
      ],
      correctAnswer: "1861-1865"
    }]
  }, {
    elements: [{
      type: "radiogroup",
      name: "libertyordeath",
      title: "Whose quote is this: \"Give me liberty, or give me death\"?",
      choicesOrder: "random",
      choices: [
        "John Hancock", "James Madison", "Patrick Henry", "Samuel Adams"
      ],
      correctAnswer: "Patrick Henry"
    }]
  }, {
    elements: [{
      type: "radiogroup",
      name: "magnacarta",
      title: "What is Magna Carta?",
      choicesOrder: "random",
      choices: [
        "The foundation of the British parliamentary system",
        "The Great Seal of the monarchs of England",
        "The French Declaration of the Rights of Man",
        "The charter signed by the Pilgrims on the Mayflower"
      ],
      correctAnswer: "The foundation of the British parliamentary system"
    }]
  }]
};

export const simpleQuizTimeSurveyJson = {
  title: "American History",
  showProgressBar: true,
  progressBarLocation: "bottom",
  showTimer: true,
  timeLimitPerPage: 10,
  timeLimit: 25,
  pages: [{
    elements: [{
      type: "radiogroup",
      name: "civilwar",
      title: "When was the American Civil War?",
      choices: [
        "1796-1803", "1810-1814", "1861-1865", "1939-1945"
      ],
      correctAnswer: "1861-1865"
    }]
  }, {
    elements: [{
      type: "radiogroup",
      name: "libertyordeath",
      title: "Whose quote is this: \"Give me liberty, or give me death\"?",
      choicesOrder: "random",
      choices: [
        "John Hancock", "James Madison", "Patrick Henry", "Samuel Adams"
      ],
      correctAnswer: "Patrick Henry"
    }]
  }, {
    elements: [{
      type: "radiogroup",
      name: "magnacarta",
      title: "What is Magna Carta?",
      choicesOrder: "random",
      choices: [
        "The foundation of the British parliamentary system",
        "The Great Seal of the monarchs of England",
        "The French Declaration of the Rights of Man",
        "The charter signed by the Pilgrims on the Mayflower"
      ],
      correctAnswer: "The foundation of the British parliamentary system"
    }]
  }]
};

export const fullQuizSurveyAnswer = {
        civilwar: "1861-1865",
        libertyordeath: "Samuel Adams",
        magnacarta: "The foundation of the British parliamentary system"
    };

export const fullQuizSurvey = {
  title: "American History",
  description: "example description",
  showProgressBar: true,
  progressBarLocation: "bottom",
  showTimer: true,
  timeLimit: 25,
  firstPageIsStartPage: true,
  startSurveyText: "Start Quiz",
  pages: [{
    elements: [{
      type: "html",
      html: "You are about to start a quiz on American history. <br>You will have 10 seconds for every question and 25 seconds to end the quiz.<br>Enter your name below and click <b>Start Quiz</b> to begin."
    }, {
      type: "text",
      name: "username",
      titleLocation: "hidden",
      isRequired: true
    }]
  }, {
    elements: [{
      type: "radiogroup",
      name: "civilwar",
      title: "When was the American Civil War?",
      choices: [
        "1796-1803", "1810-1814", "1861-1865", "1939-1945"
      ],
      correctAnswer: "1861-1865"
    }]
  }, {
    elements: [{
      type: "radiogroup",
      name: "libertyordeath",
      title: "Whose quote is this: \"Give me liberty, or give me death\"?",
      choicesOrder: "random",
      choices: [
        "John Hancock", "James Madison", "Patrick Henry", "Samuel Adams"
      ],
      correctAnswer: "Patrick Henry"
    }]
  }, {
    elements: [{
      type: "radiogroup",
      name: "magnacarta",
      title: "What is Magna Carta?",
      choicesOrder: "random",
      choices: [
        "The foundation of the British parliamentary system",
        "The Great Seal of the monarchs of England",
        "The French Declaration of the Rights of Man",
        "The charter signed by the Pilgrims on the Mayflower"
      ],
      correctAnswer: "The foundation of the British parliamentary system"
    }]
  }],
  completedHtml: "<h4>You got <b>{correctAnswers}</b> out of <b>{questionCount}</b> correct answers.</h4>",
  completedHtmlOnCondition: [{
    expression: "{correctAnswers} == 0",
    html: "<h4>Unfortunately, none of your answers are correct. Please try again.</h4>"
  }, {
    expression: "{correctAnswers} == {questionCount}",
    html: "<h4>Congratulations! You answered all the questions correctly!</h4>"
  }]
};

export enum SettingsGroup {
  MainPage = "mainpage",
  Notification = "notification",
  Announcement = "announcement",
  HeroSection = "herosection"
}