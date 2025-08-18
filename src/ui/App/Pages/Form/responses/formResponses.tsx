import React, { useState, useEffect, Suspense } from "react";
import {
  FormCreate,
  FormSubmit,
  QuizSubmit,
  SurveyData,
} from "../../../Interfaces/interface.ts";
import { useUserContext } from "../../../context/userContext.tsx";
import { Button, Collapse, Table } from "antd";
import { useAppState } from "../../../context/appStateContext.tsx";
import { validate as isValidUuid } from "uuid";
import { getResponses, fetchFormById } from "../../../../../api/forms.js";
import { useParams } from "react-router-dom";
import { FormTypes } from "../../../../enum.ts";
import NoMatch from "../../../no-match.js";
import { useTheme } from "../../../../../context/themeContext.js";
import { Box, Typography, Paper } from '@mui/material';
// Lazy load charts to reduce initial bundle size

// Cache the charts import promise to avoid multiple requests
let chartsPromise: Promise<any> | null = null;
const loadCharts = () => {
  if (!chartsPromise) {
    chartsPromise = import(/* webpackChunkName: "charts" */ '@mui/x-charts');
  }
  return chartsPromise;
};

const BarChartLazy: any = React.lazy(() => loadCharts().then(m => ({ default: m.BarChart })));
const PieChartLazy: any = React.lazy(() => loadCharts().then(m => ({ default: m.PieChart })));

const ChartFallback: React.FC<{height?: number}> = ({height = 300}) => (
  <div style={{height, display:'flex', alignItems:'center', justifyContent:'center', color:'#888', fontSize:14}}>
    Loading chart...
  </div>
);

export default function FormResponses() {
  const { setLoading, setError, clearError, setUserRegistration, error } =
    useAppState();
  const user = useUserContext();
  const [formdata, setFormData] = useState<FormCreate | null>(null);
  const [surveyJsonData, setSurveyJsonData] = useState<SurveyData>();
  const [surveyQuestions, setSurveyQuestions] = useState<any[]>([]);
  const [surveyResponsesJsonData, setSurveyResponsesJsonData] =
    useState<any>(null);
  const [isSurveyNotFound, setIsSurveyNotFound] = useState<boolean>(false);
  const { id } = useParams<{ id: string }>();
  const { isDark } = useTheme();


  // IDEA: a dashboard display by questions and submit data report and exports, 



// Visualization section for survey questions using MUI X Charts

const COLORS = ['#1976d2', '#00C49F', '#FFBB28', '#FF8042', '#A28EFF', '#FF6F91', '#FFB347', '#B6FFB0'];

const getChartData = (question, responsesArray) => {
  const dataMap = {};
  responsesArray.forEach((resp) => {
    let responseContent = {};
    try {
      if (typeof resp.response_content === 'string') {
        responseContent = JSON.parse(resp.response_content);
      } else {
        responseContent = resp.response_content || {};
      }
    } catch {
      responseContent = {};
    }
    const answer = responseContent[question.name] ?? null;
    if (answer !== null && answer !== undefined && answer !== '') {
      if (Array.isArray(answer)) {
        answer.forEach((a) => {
          dataMap[a] = (dataMap[a] || 0) + 1;
        });
      } else {
        dataMap[answer] = (dataMap[answer] || 0) + 1;
      }
    }
  });
  return Object.entries(dataMap).map(([key, value]) => ({ label: key, value }));
};

const RenderVisualization = () => {
  if (!surveyQuestions.length || !surveyResponsesJsonData) return null;
  const responsesArray = Array.isArray(surveyResponsesJsonData) ? surveyResponsesJsonData : [];
  const [showAllTextAnswers, setShowAllTextAnswers] = React.useState({});
  return (
    <div className="mt-4">
      <h3 className="text-xl font-bold mb-4">ภาพรวมคำตอบแต่ละข้อ</h3>
      {surveyQuestions.filter(q => q.type === 'radiogroup' || q.type === 'text' || q.type === 'rating' || q.type === 'checkbox').map((question, idx) => {
        const chartData = getChartData(question, responsesArray);
        let textAnswers = [];
        let textAnswerCounts = [];
        if (question.type === 'text') {
          textAnswers = responsesArray
            .map((resp) => {
              let responseContent = {};
              try {
                if (typeof resp.response_content === 'string') {
                  responseContent = JSON.parse(resp.response_content);
                } else {
                  responseContent = resp.response_content || {};
                }
              } catch {
                responseContent = {};
              }
              return responseContent[question.name];
            })
            .filter((ans) => ans !== undefined && ans !== null && ans !== '');
          const freqMap = {};
          textAnswers.forEach(ans => {
            freqMap[ans] = (freqMap[ans] || 0) + 1;
          });
          textAnswerCounts = Object.entries(freqMap)
            .map(([ans, count]) => ({ ans, count: Number(count) }))
            .sort((a, b) => b.count - a.count);
        }
        return (
          <div key={question.name || idx} className={`mb-6 p-4 rounded-lg shadow transition-colors duration-300 ${isDark ? 'bg-zinc-900' : 'bg-white'}`}>
            <h4 className={`text-lg font-semibold mb-2 ${isDark ? 'text-zinc-100' : 'text-gray-800'}`}>{question.title || question.name}</h4>
            {/* For text questions, show bar chart for top 5 and a Show all button for full list */}
            {question.type === 'text' ? (
              textAnswers.length > 0 ? (
                <>
                  {textAnswerCounts.length > 1 && (
                    <Suspense fallback={<ChartFallback height={220} />}>
                      <BarChartLazy
                        series={[{ data: textAnswerCounts.slice(0, 5).map(d => d.count), label: 'จำนวน', color: COLORS[0] }]}
                        xAxis={[{ scaleType: 'linear' }]}
                        yAxis={[{ data: textAnswerCounts.slice(0, 5).map(d => d.ans), scaleType: 'band' }]}
                        height={220}
                        layout="horizontal"
                      />
                    </Suspense>
                  )}
                  <div className="mt-2">
                    <Button
                      size="small"
                      onClick={() => setShowAllTextAnswers((prev) => ({ ...prev, [question.name]: !prev[question.name] }))}
                      style={{ marginBottom: 8 }}
                    >
                      {showAllTextAnswers[question.name] ? 'ซ่อนทั้งหมด' : 'แสดงทั้งหมด'}
                    </Button>
                    {showAllTextAnswers[question.name] && (
                      <div className={`max-h-52 overflow-y-auto border border-gray-200 rounded p-2 ${isDark ? 'bg-zinc-900' : 'bg-gray-50'}`}>
                        {textAnswers.map((ans, i) => (
                          <span key={i} className={`block mb-1 break-words ${isDark ? 'text-zinc-100' : 'text-gray-800'}`}>- {ans}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <span className="text-gray-500 dark:text-zinc-400">ไม่มีข้อมูลสำหรับข้อนี้</span>
              )
            ) : null}
            {(question.type === 'rating' || (question.type === 'checkbox')) && chartData.length > 0 && (
              <Suspense fallback={<ChartFallback height={300} />}>
                <BarChartLazy
                  series={[{ data: chartData.map(d => Number(d.value)), label: 'จำนวน', color: COLORS[0] }]}
                  xAxis={[{ scaleType: 'linear' }]}
                  yAxis={[{ data: chartData.map(d => d.label), scaleType: 'band' }]}
                  height={300}
                  layout="horizontal"
                />
              </Suspense>
            )}
            {question.type === 'radiogroup' && chartData.length > 0 && (
              <Suspense fallback={<ChartFallback height={300} />}>
                <PieChartLazy
                  series={[{
                    data: chartData.map((d, i) => ({
                      id: i,
                      value: typeof d.value === 'number' ? d.value : Number(d.value) || 0,
                      label: d.label,
                      color: COLORS[i % COLORS.length]
                    })),
                    innerRadius: 40,
                    outerRadius: 100,
                    paddingAngle: 2,
                  }]}
                  height={300}
                />
              </Suspense>
            )}
            {question.type !== 'text' && chartData.length === 0 && (
              <span className="text-gray-500 dark:text-zinc-400">ไม่มีข้อมูลสำหรับข้อนี้</span>
            )}
          </div>
        );
      })}
    </div>
  );
};



  // report sections show raw submit data as a table and export excel from surveyQuestions mapping with surveyResponsesJsonData
  const RenderReportTable = () => {
    if (!surveyQuestions.length || !surveyResponsesJsonData)
      return <div>No data available.</div>;

    // Prepare columns: each question is a column
    const columns = surveyQuestions
      .filter((question) => question.name !== "startPageDialog")
      .map((question, idx) => ({
      title: question.title || question.name || `Q${idx + 1}`,
      dataIndex: question.name || question.id || `q${idx + 1}`,
      key: question.name || question.id || `q${idx + 1}`,
      }));

    // Prepare dataSource: each response is a row, in each array, response data will in surveyResponsesJsonData[<index>].response_contents (JSON.parse first) then map keys with question.name
    const responsesArray = Array.isArray(surveyResponsesJsonData)
      ? surveyResponsesJsonData
      : [];

    const dataSource = responsesArray.map((resp, rIdx) => {
      let responseContent = {};
      try {
      if (typeof resp.response_content === "string") {
        responseContent = JSON.parse(resp.response_content);
      } else {
        responseContent = resp.response_content || {};
      }
      } catch {
      responseContent = {};
      }
      const row: any = { key: rIdx };

      // If form type is Quiz, add score and passed at the front
      if (formdata?.type === FormTypes.Quiz) {
      row["score"] = resp.score ?? "N/A";
      row["passed"] = resp.passed !== undefined ? (resp.passed ? "ผ่าน" : "ไม่ผ่าน") : "N/A";
      }

      surveyQuestions.forEach((question, qIdx) => {
      const qKey = question.name || question.id || `q${qIdx + 1}`;
      const answer = responseContent[qKey];
      row[qKey] = Array.isArray(answer) ? answer.join(", ") : (answer ?? "No response");
      });
      return row;
    });

    // If form type is Quiz, add score and passed columns at the front
    let finalColumns = columns;
    if (formdata?.type === FormTypes.Quiz) {
      finalColumns = [
        ...columns,
      { title: "คะแนน", dataIndex: "score", key: "score" },
      { title: "ผลการประเมิน", dataIndex: "passed", key: "passed" },
      ];
    }

    // Export to Excel handler (lazy load xlsx only when user clicks)
    const handleExportExcel = async () => {
      try {
  // Dynamic import of xlsx (chunk will be placed in xlsx-lib split chunk)
  const XLSX = await import('xlsx');
        // Prepare header row
        const header = columns.map((col) => col.title);
        // Prepare data rows
        const rows = dataSource.map((row) =>
          columns.map((col) => row[col.dataIndex])
        );
        // Combine header and rows
        const worksheetData = [header, ...rows];
        const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Responses");
        // Sanitize formdata.title for filename (remove invalid characters)
        const safeTitle = (formdata?.title || "survey_responses").replace(
          /[^a-zA-Z0-9ก-๙ _-]/g,
          ""
        );
        XLSX.writeFile(workbook, `${safeTitle}.xlsx`);
      } catch (e) {
        console.error('Failed to export Excel', e);
      }
    };

    return (
      <div style={{ position: "relative" }}>
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>
          <Button type="primary" onClick={handleExportExcel} disabled={!dataSource.length}>
            Export to Excel
          </Button>
        </div>
        <div style={{ width: '100%', overflowX: 'auto' }}>
          <Table columns={finalColumns} dataSource={dataSource} pagination={false} />
        </div>
      </div>
    );
  };


        // Calculate average score for quiz responses
  const getAverageScore = () => {
    if (!Array.isArray(surveyResponsesJsonData) || !surveyResponsesJsonData.length) return 0;
    const scores = surveyResponsesJsonData
      .map(resp => typeof resp.score === 'number' ? resp.score : null)
      .filter(score => score !== null);
    if (!scores.length) return 0;
    const sum = scores.reduce((acc, curr) => acc + curr, 0);
    return Math.round((sum / scores.length) * 100) / 100;
  };

  // for quiz type summarize points and performance

  useEffect(() => {
    if (id && isValidUuid(id)) {
      if (!user) {
        setLoading(true);
        return;
      }
      const fetchResponses = async () => {
        try {
          // You may want to pass an ID or params here
          const responses = await getResponses(id);
          setSurveyResponsesJsonData(responses);
        } catch (err) {
          setError && setError(new Error(err as any));
        }
      };

      const getFormById = async () => {
        try {
          const form = await fetchFormById(id, user.id);
          const formContent = JSON.parse(form.content);
          setFormData(form);
          setSurveyJsonData(formContent);

          // call function gather question formContent.pages  in each {}.elements
          const gatherQuestions = (pages: any[]) => {
            const questions: any[] = [];
            pages.forEach((page) => {
              if (page.elements) {
                questions.push(...page.elements);
              }
            });
            return questions;
          };
          setSurveyQuestions(gatherQuestions(formContent.pages));
        } catch (err) {
          setError && setError(new Error(err as any));
        }
      };
      fetchResponses();
      getFormById();
    } else {
      setIsSurveyNotFound(true);
    }
  }, [id, user]);

  if (isSurveyNotFound) {
    return <NoMatch />;
  }

  return (
    <div className={isDark ? 'dark' : ''}>
      <div className="p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <div>
            <h2 className=" text-2xl font-bold mb-2 dark:text-grey-400">
              {formdata ? `แบบสำรวจ - ${formdata.title}` : ''}
            </h2>
            <p className="text-gray-500 text-lg dark:text-gray-400">ภาพรวมการตอบกลับ</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className={`${isDark ? 'bg-zinc-700' : 'bg-white'} rounded-lg shadow p-6 text-center`}>
            <div className="text-3xl font-bold text-blue-600 mb-2">{Array.isArray(surveyResponsesJsonData) ? surveyResponsesJsonData.length : 0}</div>
            <div className={`text-sm ${isDark ? 'text-zinc-200' : 'text-gray-500'}`}>การตอบกลับทั้งหมด</div>
          </div>
          <div className={`${isDark ? 'bg-zinc-700' : 'bg-white'} rounded-lg shadow p-6 text-center`}>
            <div className="text-3xl font-bold text-blue-600 mb-2">
              {(() => {
                if (!Array.isArray(surveyResponsesJsonData) || !surveyResponsesJsonData.length) return '0 นาที';
                const total = surveyResponsesJsonData.reduce((sum, resp) => {
                  const val = typeof resp.time_spent_minute === 'number' ? resp.time_spent_minute : Number(resp.time_spent_minute);
                  return sum + (isNaN(val) ? 0 : val);
                }, 0);
                const mean = total / surveyResponsesJsonData.length;
                return `${mean.toFixed(2)} นาที`;
              })()}
            </div>
            <div className={`text-sm ${isDark ? 'text-zinc-200' : 'text-gray-500'}`}>เวลาเฉลี่ย</div>
          </div>
          {formdata && formdata.type === FormTypes.Quiz && (
            <>
              <div className={`${isDark ? 'bg-zinc-700' : 'bg-white'} rounded-lg shadow p-6 text-center`}>
                <div className="text-3xl font-bold text-purple-600 mb-2">{formdata?.passing_score ?? 0}</div>
                <div className={`text-sm ${isDark ? 'text-zinc-200' : 'text-gray-500'}`}>เกณฑ์คะแนนผ่าน</div>
              </div>
              <div className={`${isDark ? 'bg-zinc-700' : 'bg-white'} rounded-lg shadow p-6 text-center`}>
                <div className="text-3xl font-bold text-green-600 mb-2">{getAverageScore()}</div>
                <div className={`text-sm ${isDark ? 'text-zinc-200' : 'text-gray-500'}`}>คะแนนเฉลี่ย</div>
              </div>
            </>
          )}
        </div>
        <div className="p-6">
          <Collapse defaultActiveKey={["report"]}>
            <Collapse.Panel header="ตารางรายงาน" key="report">
              <RenderReportTable />
            </Collapse.Panel>
            <Collapse.Panel header="กราฟภาพรวม" key="visualization">
              <RenderVisualization />
            </Collapse.Panel>
          </Collapse>
        </div>
      </div>
    </div>
  );
}
