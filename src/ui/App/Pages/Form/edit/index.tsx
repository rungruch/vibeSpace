import React, { useEffect, useState } from 'react';
import FormEditor from '../../../../Component/FormEditor.tsx';
import { useUserContext } from '../../../context/userContext.tsx';
import { fetchFormById, updateForm } from '../../../../../api/forms';
import { SurveyData, SurveyDataSettings, FormCreate } from '../../../../interface';
import { useParams, useNavigate } from 'react-router-dom';
import { FormMode } from '../../../../enum.ts';
import NoMatch from '../../../no-match.js';
import { useAppState } from '../../../context/appStateContext.tsx';
import Loading  from '../../../../Component/Loading.tsx';

/*
FORM EDITS LOGIC
1.User with permission can only edit surveys
2.User cannot delete question, survey type and slug, if delete question then delete all response is alternative
*/

const FormEditPage: React.FC = () => {
  const user = useUserContext();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const [surveyData, setSurveyData] = useState<SurveyData | null>(null);
  const [surveyDataSettings, setSurveyDataSettings] = useState<SurveyDataSettings | null>(null);
  const [isNotFound, setIsNotFound] = useState(false);
  const { setError } = useAppState();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!user || !id) {
        return;
      }
      try {
        setLoading(true);
        const response: FormCreate = await fetchFormById(id, user.id);
        setSurveyData(JSON.parse(response.content));
        setSurveyDataSettings({
          id: response.id,
          slug: response.slug,
          visibility: response.visibility,
          is_active: response.is_active,
          type: response.type,
          is_retryable: response.is_retryable,
          retry_size: response.retry_size,
          is_batch_question: response.is_batch_question,
          batch_question_size: response.batch_question_size,
          passing_score: response.passing_score,
          is_survey_preview: response.is_survey_preview,
        });
      } catch (err) {
        if (err.response && err.response.status === 404) {
          setIsNotFound(true);
          return;
        }
        setError(new Error(err.response.data.message));
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user, id]);

  const handleSave = async (formData: FormCreate) => {
    if (!surveyDataSettings) return;
    await updateForm(surveyDataSettings.id, formData);
    navigate('/forms');
  };

  if (loading) return <Loading />
  if (!user || !surveyData || !surveyDataSettings || isNotFound) return (<NoMatch />)
  return (
    <FormEditor
      mode={FormMode.Edit}
      initialSurveyData={surveyData}
      initialSurveyDataSettings={surveyDataSettings}
      onSave={handleSave}
      user={user}
    />
  );
};

export default FormEditPage;
