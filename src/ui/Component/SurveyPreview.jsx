import React from 'react';
import 'survey-core/survey-core.css';
import { Model } from 'survey-core';
import { Survey } from 'survey-react-ui';
import { DoubleBorderLight } from "survey-core/themes";

export default function SurveyPreview(props) {
  const survey = new Model(props.json);
  survey.applyTheme(DoubleBorderLight);
  return <Survey model={survey} />;
}