import React, { Suspense } from 'react';
import { DoubleBorderLightPanelless , DoubleBorderDarkPanelless} from 'survey-core/themes';
import { useTheme } from '../../context/themeContext';

// Lazy component factory: loads SurveyJS libs & CSS in parallel, returns a render component
const LazySurveyImpl = React.lazy(async () => {
  const [coreMod, uiMod] = await Promise.all([
    import(/* webpackChunkName: "survey-core" */ 'survey-core'),
    import(/* webpackChunkName: "survey-react-ui" */ 'survey-react-ui'),
    import(/* webpackChunkName: "survey-core-css" */ 'survey-core/survey-core.css')
  ]);
  try {
    if (coreMod.settings?.lazyRender) coreMod.settings.lazyRender.enabled = true;
  } catch { /* noop */ }
  const Impl: React.FC<{ surveyJson: any; onComplete?: (data: any)=>void; }> = ({ surveyJson, onComplete }) => {
    const { Model } = coreMod as any;
    const { Survey } = uiMod as any;
    const { isDark } = useTheme();
    const model = React.useMemo(() => new Model(surveyJson), [surveyJson]);
    model.applyTheme(isDark ? DoubleBorderDarkPanelless : DoubleBorderLightPanelless);
    React.useEffect(() => {
      const handler = (s: any) => {
        if (onComplete) onComplete(s.data); else alert('ลองใหม่อีกครั้ง');
      };
      model.onComplete.add(handler);
      return () => { try { model.onComplete.remove(handler); } catch { /* noop */ } };
    }, [model, onComplete]);
    return (
      <div className={`border border-gray-300 rounded-xl p-1 ${isDark ? 'bg-zinc-800' : 'bg-white'}`}>
        <Survey model={model} />
      </div>
    );
  };
  return { default: Impl };
});

// Error Boundary to catch dynamic import failures
class SurveyErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean; error?: any }> {
  constructor(props: any) { super(props); this.state = { hasError: false }; }
  static getDerivedStateFromError(error: any) { return { hasError: true, error }; }
  componentDidCatch(error: any, info: any) { if (process.env.NODE_ENV === 'development') console.error('Survey load failed', error, info); }
  render() {
    if (this.state.hasError) {
      return <div style={{ padding: 12, fontSize: 14, color: '#b91c1c' }}>Failed to load survey component. <button onClick={() => this.setState({ hasError: false })}>Retry</button></div>;
    }
    return this.props.children;
  }
}

// handle error
// handle submit data
// handle one time submit case
// redesign survey slug calling and id called
// batch question case quality check 

interface SurveyComponentProps { surveyJson: any; onComplete?: (data: any) => void; }

export default function SurveyComponent(props: SurveyComponentProps) {
  return (
    <SurveyErrorBoundary>
      <Suspense fallback={<div>Loading survey...</div>}>
        <LazySurveyImpl {...props} />
      </Suspense>
    </SurveyErrorBoundary>
  );
}