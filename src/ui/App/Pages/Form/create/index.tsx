import React from 'react';
import FormEditor from '../../../../Component/FormEditor.tsx';
import { useUserContext } from '../../../context/userContext.tsx';
import { createForm } from '../../../../../api/forms';
import { SurveyData, SurveyDataSettings, FormCreate } from '../../../../interface';
import { FormTypes, FormVisible } from '../../../../enum.ts';
import { nanoid } from 'nanoid';
import { useNavigate } from 'react-router-dom';
import { FormMode } from '../../../../enum.ts';
import NoMatch from '../../../no-match.js';
/*
FORM CREATION STRUCTURE
1. Form now contain 2 type (Form and Quiz)
1a. Form will contain a set of pages and each page will contain a set of questions
2. For now, Form contain 2 type of question (Text and Multiple Choice)
3. A Form Type Quiz will be only use a Multiple Choice question only for automated scoring calculation purpose 
4. A Form Type Quiz have 2 more question which is set correct answer and batch question (for example, choose 2 question of 5)
5. A Form Type Quiz will be fixed start page as a default
6. Form Type Quiz will be fixed page for (batch questions purpose)
6.(new) Batch question type equiz enable will be fixed page (only one page) for question selection logic
*/

const FormCreatePage: React.FC = () => {
  const user = useUserContext();
  const navigate = useNavigate();

  // Initial settings for a new form
  const initialSurveyDataSettings: SurveyDataSettings = {
    slug: '',
    visibility: FormVisible.Private,
    is_active: true,
    type: FormTypes.Form,
    is_retryable: false,
    retry_size: 1,
    is_batch_question: false,
    batch_question_size: 1,
    passing_score: 0,
    is_survey_preview: false
  };

  const initialSurveyData: SurveyData = {
    title: '',
    description: '',
    pages: [
      {
        name: 'page 1',
        elements: [
          {
            name: nanoid(),
            title: 'คำถามใหม่',
            type: 'text',
            isRequired: true
          }
        ]
      }
    ],
    showProgressBar: false,
    progressBarLocation: 'bottom',
    showTimer: false,
    timeLimit: 0,
    timeLimitPerPage: 0,
    firstPageIsStartPage: false,
    startSurveyText: 'Start Survey',
    completedHtml: '<h4>ขอบคุณ</h4> <strong>แบบทดสอบบันทึกเรียบร้อย</strong>',
    completedHtmlOnCondition: [],
    widthMode: 'responsive',
  };

  const handleSave = async (formData: FormCreate) => {
    await createForm(formData);
    navigate('/forms');
  };

  // If user is not logged in, render a fallback (do not call setError in render)
  if (!user) {
    return <NoMatch />;
  }

  return (
    <FormEditor
      mode={FormMode.Create}
      initialSurveyData={initialSurveyData}
      initialSurveyDataSettings={initialSurveyDataSettings}
      onSave={handleSave}
      user={user}
    />
  );
};

export default FormCreatePage;
