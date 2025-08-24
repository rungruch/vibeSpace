import React, { useEffect, useState } from 'react';

// Dynamic import to reduce initial bundle size
let cachedSurveyLibs = null;
async function loadSurveyLibs() {
  if (cachedSurveyLibs) return cachedSurveyLibs;
  const [coreMod, uiMod] = await Promise.all([
    import(/* webpackChunkName: "survey-core" */ 'survey-core'),
    import(/* webpackChunkName: "survey-react-ui" */ 'survey-react-ui'),
    import(/* webpackChunkName: "survey-core-css" */ 'survey-core/survey-core.css')
  ]);
  cachedSurveyLibs = { 
    Model: coreMod.Model, 
    Survey: uiMod.Survey
  };
  return cachedSurveyLibs;
}

export default function SurveyPreview(props) {
  const [libs, setLibs] = useState(cachedSurveyLibs);
  
  useEffect(() => {
    if (!libs) {
      loadSurveyLibs().then(setLibs);
    }
  }, [libs]);

  if (!libs) {
    return <div>Loading survey...</div>;
  }

  const { Model, Survey } = libs;
  const survey = new Model(props.json);
  return <Survey model={survey} />;
}