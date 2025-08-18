import React, { useState, useEffect, lazy, Suspense } from "react";
import parse from "html-react-parser";
const SurveyComponent = lazy(() => import("../../../Component/Survey.tsx"));
const SurveyPreviewResults = lazy(() => import("../../../Component/SurveyPreviewResults.jsx"));
import { fetchFormById, fetchFormBySlug } from "../../../../api/forms.js";
import NoMatch from "../../no-match.js";
import { formClosedJson, FormTypes, formNotAcceptJson } from "../../../enum.ts";
import { FormCreate, FormSubmit, QuizSubmit } from "../../Interfaces/interface.ts";
import { useUserContext } from "../../context/userContext.tsx";
import { Button } from "antd";
import { formSubmit, getUserFormResponsesCount } from "../../../../api/forms.js";
import { useAppState } from "../../context/appStateContext.tsx";
import { validate as isValidUuid } from 'uuid'
import { App as AntdApp, message } from 'antd';
import Loading from "../../../Component/Loading.tsx";

export default function Survey() {
  const { setError, error } = useAppState();
  const user = useUserContext();
  const [formdata, setFormData] = useState<FormCreate | null>(null);
  const [surveyJsonData, setSurveyJsonData] = useState<any>(null);
  const [surveyResponseJsonData, setSurveyResponseJsonData] =
    useState<any>(null);
  const [surveyPreviewHtml, setSurveyPreviewHtml] = useState<string | null>(
    null
  );
  const [surveyPreviewEnable, setSurveyPreviewEnable] =
    useState<boolean>(false);
  const [isSurveyNotFound, setIsSurveyNotFound] = useState<boolean>(false);
  const [startAt, setStartAt] = useState<Date | null>(new Date());

    /**
     * Survey page get survey data from apis and sent to surveyComponent to render
     *
     * Forms are manual render fron json
     * IF Form Type Quiz, calculate score first and save
     *
     * final page and view results buttons are manually get data from form json and manually render it
     */


  const calculateScore = (response: any) => {
    // Calculate score across all pages
    let score = 0;
    let maxScore = 0;
    if (surveyJsonData && Array.isArray(surveyJsonData.pages)) {
      surveyJsonData.pages.forEach((page: any) => {
        if (Array.isArray(page.elements)) {
          page.elements.forEach((element: any) => {
            if (element.correctAnswer !== undefined) {
              maxScore += 1;
              if (response[element.name] === element.correctAnswer) {
                score += 1;
              }
            }
          });
        }
      });
    }
    let score_percentage = maxScore > 0 ? (score / maxScore) * 100 : 0;
    let passed = score >= (formdata?.passing_score || 0);
    return { score, maxScore, score_percentage, passed };
  };

  const handleSurveyResults = async (data: any) => {
    // calculate spent time
    let localSubmitAt = null;
    let localTimeSpentMinute = null;
    if (startAt) {
      localSubmitAt = new Date();
      const diffMs = localSubmitAt.getTime() - startAt.getTime();
      const timeSpent = diffMs / 1000 / 60; // minutes as float
      localTimeSpentMinute = Number(timeSpent.toFixed(2));
    }
    setSurveyResponseJsonData(data);
    try{
    if (formdata?.type === FormTypes.Form) {
      // prepare form submit data and save
      let formSubmitData: FormSubmit = {
        type: formdata.type,
        survey_id: formdata.id,
        user_id: user.id,
        response_content: JSON.stringify(data),
        created_at: new Date(),
        passing_score: 0,
        start_at: startAt,
        submit_at: localSubmitAt,
        time_spent_minute: localTimeSpentMinute
      };
      await formSubmit(formSubmitData);
    } else if (formdata?.type === FormTypes.Quiz) {
      const { score, maxScore, score_percentage, passed } =
        calculateScore(data);
      //prepare quiz submit data and save
      let quizSubmitData: QuizSubmit = {
        type: formdata.type,
        survey_id: formdata.id,
        user_id: user.id,
        response_content: JSON.stringify(data),
        score: score,
        passing_score: formdata?.passing_score || 0,
        max_score: maxScore,
        score_percentage: score_percentage,
        passed: passed,
        created_at: new Date(),
        start_at: startAt,
        submit_at: localSubmitAt,
        time_spent_minute: localTimeSpentMinute
      };
      await formSubmit(quizSubmitData);
    }
  
        // render surveyJsonData.completedHtml with see a results button options
      setSurveyPreviewHtml(surveyJsonData.completedHtml);

      // setSurveyPreviewEnable(true);
  
  
  } catch (error) {
      message.error("เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง");
    }
  };


  // find form id if not found find form slug and get survey data
  useEffect(() => {
    // Fetch form data by ID or slug

    // Get ID and Slug from url
    const formId =
      new URLSearchParams(window.location.search).get("id") ?? null;
    const formSlug =
      new URLSearchParams(window.location.search).get("slug") ?? null;

    // find id or slug is exist, else render not found
    if (formId || formSlug) {
      if ((formId && isValidUuid(formId)) || formSlug) {
        fetchForm();
      } else {
        setIsSurveyNotFound(true);
      }
    } else {
      setIsSurveyNotFound(true);
    }

    async function fetchForm() {
      if (formId) {
        try {
          const data = await fetchFormById(formId, null);
          setFormData(data);
        } catch (err: any) {
          if (err.status === 404) {
            setIsSurveyNotFound(true);
          } else {
            setError(new Error(err.response.data.message));
          }
          setFormData(null);
        }
      } else {
        try {
          const data = await fetchFormBySlug(formSlug);
          setFormData(data);
        } catch (err: any) {
          if (err.status === 404) {
            setIsSurveyNotFound(true);
          } else {
            setError(new Error(err.response.data.message));
          }
          setFormData(null);
        }
      }
    }
  }, []);

  // get survey data
  useEffect(() => {
    async function fetchData() {
      try {
        let formJson = formdata?.content ? JSON.parse(formdata.content) : null;
        if (!formdata && !formJson) {
          // CASE: Form not found or invalid data
          setSurveyJsonData(null);
          return;
        }
        if (formdata && !formdata.is_active) {
          // CASE: Form is closed
          let FormClosedJson = formClosedJson;
          FormClosedJson.title = formdata.title;
          setSurveyJsonData(FormClosedJson);
          setError(null);
          return;
        }
        // CASE: One time submit, one time submit True = limit submit
        if (formdata && formdata.is_retryable) {
          const userResponsesCount = await getUserFormResponsesCount(formdata.id, user.id);
          if(userResponsesCount.response_count >= formdata.retry_size) {
            let FormNotAcceptJson = formNotAcceptJson;
            FormNotAcceptJson.title = formdata.title;
            setSurveyJsonData(FormNotAcceptJson);
            setError(null);
            return;
          }
        }

        // CASE: Batch question
          // random remove a question to match the batch size or less, in case that there is less than batch size
          // questions with no element.correctAnswer should not remove, and random remove question with correctAnswer to match batch size
        if (
          formdata &&
          formdata.is_batch_question &&
          formdata.type === FormTypes.Quiz
        ) {
          // Only randomize/removal among questions with correctAnswer
          const batchSize = formdata.batch_question_size || 1;
          const jsonData = JSON.parse(formdata.content);
          let questions = jsonData.pages[1].elements || [];

          // Separate questions with and without correctAnswer
          const alwaysInclude = questions.filter((q: any) => q.correctAnswer === undefined);
          const canBeRandomized = questions.filter((q: any) => q.correctAnswer !== undefined);

          let selected: any[] = [];
          if (canBeRandomized.length > batchSize) {
            // Shuffle and pick batchSize from canBeRandomized
            const shuffled = canBeRandomized.sort(() => 0.5 - Math.random());
            selected = shuffled.slice(0, batchSize);
          } else {
            selected = canBeRandomized;
          }

          // Combine alwaysInclude and selected
          formJson.pages[1].elements = [...alwaysInclude, ...selected];
        }

        // Final Data Define
        let data = formJson;

        // Validate JSON: must be an object and have 'pages' or 'questions' or 'elements' (SurveyJS keys)
        if (
          typeof data === "object" &&
          data !== null &&
          (Array.isArray(data.pages) ||
            Array.isArray(data.questions) ||
            Array.isArray(data.elements))
        ) {
          setSurveyJsonData(data);
          setError(null);
        } else {
          setError(new Error("Invalid survey JSON structure."));
          setSurveyJsonData(null);
        }
      } catch (err: any) {
        if (err && err.status === 404) {
          setIsSurveyNotFound(true);
        } else {
          setError(new Error(err.response.data.message));
        }
        setSurveyJsonData(null);
      }
    }
    fetchData();
  }, [formdata]);

  if (isSurveyNotFound) return <NoMatch />;
  if (error) return <div style={{ color: "red" }}>Error: {error.message}</div>;
  if (!surveyJsonData) return <div>Loading...</div>;

  return (
    <>
      <AntdApp>
        <Suspense fallback={<Loading />}>
          {!surveyPreviewEnable && !surveyPreviewHtml && (
            <SurveyComponent
              surveyJson={surveyJsonData}
              onComplete={handleSurveyResults}
            />
          )}
          {surveyPreviewEnable && !surveyPreviewHtml && (
            <SurveyPreviewResults
              question={surveyJsonData}
              answer={surveyResponseJsonData}
            />
          )}
        </Suspense>
        {surveyPreviewHtml && (
          <div className="flex flex-col items-center space-y-4">
            <div className="w-full max-w-2xl p-6 bg-white rounded shadow">
              {parse(surveyPreviewHtml as string)}
            </div>
            {formdata.is_survey_preview && (
              <Button
                type="primary"
                className="mt-2"
                onClick={() => {
                  setSurveyPreviewEnable(true);
                  setSurveyPreviewHtml(null);
                }}
              >
                แสดงคำตอบ
              </Button>
            )}
          </div>
        )}
      </AntdApp>
    </>
  );
}
