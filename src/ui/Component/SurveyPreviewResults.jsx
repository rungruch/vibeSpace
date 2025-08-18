import React, { useEffect, useState } from "react";
// Dynamic import to reduce initial bundle
let cachedSurveyLibs = null;
async function loadSurveyPreviewLibs() {
    if (cachedSurveyLibs) return cachedSurveyLibs;
    const [coreMod, uiMod, themeMod] = await Promise.all([
        import(/* webpackChunkName: "survey-core" */ "survey-core"),
        import(/* webpackChunkName: "survey-react-ui" */ "survey-react-ui"),
        import(/* webpackChunkName: "survey-themes" */ "survey-core/themes"),
        import(/* webpackChunkName: "survey-core-css" */ "survey-core/survey-core.min.css")
    ]);
    cachedSurveyLibs = { Model: coreMod.Model, Survey: uiMod.Survey, SurveyTheme: themeMod };
    return cachedSurveyLibs;
}
// import { json } from "./json";
import * as styles from '../App/index.module.scss'

function SurveyPreviewResults(props) {
    const [libs, setLibs] = useState(cachedSurveyLibs);
    useEffect(() => { if (!libs) loadSurveyPreviewLibs().then(setLibs); }, [libs]);
    if (!libs) return <div>Loading preview...</div>;
    const { Model, Survey, SurveyTheme } = libs;
    const survey = new Model(props.question);
    if (SurveyTheme && SurveyTheme.SharpLight) survey.applyTheme(SurveyTheme.SharpLight);
    survey.onComplete.add(() => {});
    survey.data = props.answer;
    survey.readOnly = true;
    survey.questionsOnPageMode = "singlePage";
    survey.showProgressBar = false;
    
    const correctStr = "Correct";
    const incorrectStr = "Incorrect";

    // Builds an HTML string to display in a question title
    function getTextHtml (text, str, isCorrect) {
        if (text.indexOf(str) < 0)
            return undefined;
    
        return text.substring(0, text.indexOf(str)) +
            "<span  class='" +  (isCorrect ? styles.correctAnswer : styles.incorrectAnswer ) + "'>" +
                str +
            "</span>";
    }
    
    // Adds "Correct" or "Incorrect" to a question title
    function changeTitle (q) {
        if (!q) return;

        // Only show correct/incorrect if correctAnswer is set
        if (q.correctAnswer === undefined) {
            if (!q.prevTitle) {
                q.prevTitle = q.title;
            }
            q.title = q.prevTitle;
            return;
        }

        const isCorrect = q.isAnswerCorrect();
        if (!q.prevTitle) {
            q.prevTitle = q.title;
        }
        if (isCorrect === undefined) {
            q.title = q.prevTitle;
            return;
        }
        q.title =  q.prevTitle + ' ' + (isCorrect ? correctStr : incorrectStr);
    }

    function changeDescription (q) {
        if (!q) return;
    
        const isCorrect = q.isAnswerCorrect();
        if (!q.prevDescription) {
            q.prevDescription = q.description || '';
        }
        
        if (isCorrect === undefined) {
            q.description = q.prevDescription;
            return;
        }
        
        // Show the correct answer in the description
        let correctAnswerText = '';
        if (q.correctAnswer !== undefined) {
            if (Array.isArray(q.choices)) {
                // For radiogroup/checkbox questions, show the choice text
                const correctChoice = q.choices.find(choice => 
                    (typeof choice === 'string' ? choice : choice.value) === q.correctAnswer
                );
                correctAnswerText = correctChoice 
                    ? (typeof correctChoice === 'string' ? correctChoice : correctChoice.text || correctChoice.value)
                    : q.correctAnswer;
            } else {
                correctAnswerText = q.correctAnswer;
            }
        }
        
        const statusText = isCorrect ? correctStr : incorrectStr;
        const answerText = correctAnswerText ? ` (Correct answer: ${correctAnswerText})` : '';
        q.description = correctAnswerText;
    }
    
    // Uncomment the following lines if you allow respondents to edit their answers
    // and want to display whether an answer is correct or not immediately after it has been given
    // survey.onValueChanged.add((_, options) => {
    //     changeTitle(options.question);
    // });
    
    survey.onTextMarkdown.add((_, options) => {
        const text = options.text;
        let html = getTextHtml(text, correctStr, true);
        if (!html) {
            html = getTextHtml(text, incorrectStr, false);
        }
        if (!!html) {
            // Set an HTML string with the "Correct" or "Incorrect" suffix for display
            options.html = html;
        }
    });
    
    // Indicate correct and incorrect answers at startup
    survey.getAllQuestions().forEach(question => changeTitle(question));
    survey.getAllQuestions().forEach(question => changeDescription(question));
    return (<Survey model={survey} />);
}

export default SurveyPreviewResults;