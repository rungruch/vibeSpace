import React, { useState } from 'react';
import { nanoid } from 'nanoid'
import { message, Input, Select, Button, Card, Typography, Space, Tag, Row, Col, Collapse, Tooltip, Switch, InputNumber, Modal, Table } from 'antd';
import { PlusOutlined, DeleteOutlined, EditOutlined, EyeOutlined, SettingOutlined, FileTextOutlined, QuestionCircleOutlined, LinkOutlined } from '@ant-design/icons';
import SurveyPreview from './SurveyPreview.jsx';
import { FormCreate, SurveyData, SurveyDataSettings } from '../App/Interfaces/interface.ts';
import { FormTypes, FormVisible, FormMode } from '../enum.ts';
import { StarOutlined as StarsIcon } from '@ant-design/icons';

const { Title, Text } = Typography;
const { TextArea } = Input;

// TODOS
// slug check url prevention x/
// slug edit on form edit?
// import question quiz type accept answer
// remove slug require and check url prevention on db
//


interface FormCreatorProps {
  mode: FormMode;
  initialSurveyData: SurveyData;
  initialSurveyDataSettings: SurveyDataSettings;
  onSave: (formData: FormCreate) => Promise<void>;
  user: any;
}

const FormEditor: React.FC<FormCreatorProps> = ({
  mode,
  initialSurveyData,
  initialSurveyDataSettings,
  onSave,
  user
}) => {

    // STATE MANAGEMENT
    const [surveyDataSettings, setSurveyDataSettings] = useState<SurveyDataSettings>(initialSurveyDataSettings);
    const [surveyData, setSurveyData] = useState<SurveyData>(initialSurveyData);
    const [activePage, setActivePage] = useState<number>(0);
    const [showPreview, setShowPreview] = useState<boolean>(false);
    const [showImportGuide, setShowImportGuide] = useState<boolean>(false);

    // SURVEY SETTINGS HANDLERS

    const handleSurveyTypeChange = (value: FormTypes) => {
        setSurveyDataSettings({ ...surveyDataSettings, type: value,  });
        if(value === FormTypes.Quiz){
            setSurveyData({ ...surveyData, firstPageIsStartPage: true , pages: [
             {
                 name: 'startPage',
                 elements: [
                        {
                        name: 'startPageDialog',
                        type: "html",
                        html: "แบบทดสอบ <br>คุณกำลังเริ่มทำแบบทดสอบ.<br>คลิกปุ่มด้านล่างเพื่อเริ่ม <b>แบบทดสอบ</b>"
                        }
                    ]
             },
             {
                 name: 'page 1',
                 elements: [
                 ]
             }
            ] });
        } else {
            setSurveyData({ ...surveyData, firstPageIsStartPage: false, pages: [
                {
                    name: 'page 1',
                    elements: [
                    {
                         name: nanoid(),
                         type: "text",
                         title: "คำถามใหม่",
                         isRequired: true
                     }
                    ]
                }
            ] });
        }
    };

    const handleBatchQuestionChange = (checked: boolean) => {
        setSurveyDataSettings(prev => ({
            ...prev,
            is_batch_question: checked
        }));
        // Optionally reset batch_question_size if disabling
        if (!checked) {
            setSurveyDataSettings(prev => ({
                ...prev,
                batch_question_size: 1
            }));
        }
        if (surveyDataSettings.type === FormTypes.Quiz) {
            setSurveyData({ ...surveyData, firstPageIsStartPage: true , pages: [
             {
                 name: 'startPage',
                 elements: [
                        {
                        name: 'startPageDialog',
                        type: "html",
                        html: "แบบทดสอบ <br>คุณกำลังเริ่มทำแบบทดสอบ.<br>คลิกปุ่มด้านล่างเพื่อเริ่ม <b>แบบทดสอบ</b>"
                        }
                    ]
             },
             {
                 name: 'page 1',
                 elements: [
                 ]
             }
            ] });
        } else {
            setSurveyData({ ...surveyData, firstPageIsStartPage: false, pages: [
                {
                    name: 'page 1',
                    elements: [
                    {
                         name: nanoid(),
                         type: "text",
                         title: "คำถามใหม่",
                         isRequired: true
                     }
                    ]
                }
            ] });
        }
    };

    const setQuestionOrder = (value: string | false) => {
        setSurveyData(prev => {
            const newData = { ...prev };
            if (value) {
                newData.questionOrder = value;
            } else {
                delete newData.questionOrder;
            }
            return newData;
        });
    };

    const handleStartPageChange = (checked: boolean) => {
        setSurveyData(prevData => {
            const updatedPages = [...prevData.pages];
            
            if (checked) {
                // Add start page if it doesn't exist
                const hasStartPage = updatedPages.some(page => page.name === 'startPage');
                if (!hasStartPage) {
                    updatedPages.unshift({
                        name: 'startPage',
                        elements: [
                            {
                                name: 'startPageDialog',
                                type: "html",
                                html: "แบบทดสอบ <br>คุณกำลังเริ่มทำแบบทดสอบ.<br>คลิกปุ่มด้านล่างเพื่อเริ่ม <b>แบบทดสอบ</b>"
                            }
                        ]
                    });
                }
            } else {
                // Remove start page if it exists
                const startPageIndex = updatedPages.findIndex(page => page.name === 'startPage');
                if (startPageIndex !== -1) {
                    updatedPages.splice(startPageIndex, 1);
                }
            }
            
            return { ...prevData, firstPageIsStartPage: checked, pages: updatedPages };
        });
    };
    const addPage = () => {
        const newPageName = `page ${surveyData.pages.length + 1}`;
        setSurveyData(prevData => ({
            ...prevData,
            pages: [...prevData.pages, { name: newPageName, elements: [] }]
        }));
        setActivePage(surveyData.pages.length);
    };

    const addQuestion = (questionType: string, questionTitle?: string, options?: string[]) => {
        let newQuestion: any = {
            name: nanoid(),
            title: questionTitle || 'คำถามใหม่',
            type: questionType,
            isRequired: true
        };
        if (questionType === 'radiogroup') {
            newQuestion.choices = options || ['ตัวเลือก 1', 'ตัวเลือก 2'];
        } else if (questionType === 'rating') {
            newQuestion = {
                ...newQuestion,
                rateCount: 11,
                rateMin: 0,
                rateMax: 10,
                minRateDescription: '(Most unlikely)',
                maxRateDescription: '(Most likely)'
            };
        } else if (questionType === 'checkbox') {
            newQuestion = {
                ...newQuestion,
                description: '',
                choices: options || [
                    'A',
                    'B',
                    'C',
                    'D',
                    'E'
                ],
                showOtherItem: true,
                otherText: 'อื่นๆ:',
                colCount: 2
            };
        }
        setSurveyData(prevData => {
            const updatedPages = [...prevData.pages];
            updatedPages[activePage] = {
                ...updatedPages[activePage],
                elements: [...updatedPages[activePage].elements, newQuestion]
            };
            return { ...prevData, pages: updatedPages };
        });
    };

    // Import questions from CSV
    const handleImportQuestions = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) {
            return;
        }
        
        message.info('Processing CSV file...');
        
        const reader = new FileReader();
        reader.onerror = () => {
            message.error('Failed to read the file. Please try again.');
            e.target.value = '';
        };
        
        reader.onload = (evt) => {
            try {
                const data = evt.target?.result as string;
                
                if (!data) {
                    message.error('Failed to read file data.');
                    e.target.value = '';
                    return;
                }
                
                // Parse CSV data
                const lines = data.split('\n').map(line => line.trim()).filter(line => line);
                
                if (lines.length === 0) {
                    message.error('The CSV file is empty.');
                    e.target.value = '';
                    return;
                }
                
                // Parse CSV rows
                const rows = lines.map(line => {
                    const result = [];
                    let current = '';
                    let inQuotes = false;
                    
                    for (let i = 0; i < line.length; i++) {
                        const char = line[i];
                        if (char === '"') {
                            inQuotes = !inQuotes;
                        } else if (char === ',' && !inQuotes) {
                            result.push(current.trim());
                            current = '';
                        } else {
                            current += char;
                        }
                    }
                    result.push(current.trim());
                    return result;
                });
                
                // Expect header row: TYPE, QUESTION, OPTIONS
                const header = rows[0];
                
                const typeIdx = header.findIndex((h: any) => h && h.toString().toUpperCase() === 'TYPE');
                const questionIdx = header.findIndex((h: any) => h && h.toString().toUpperCase() === 'QUESTION');
                const optionsIdx = header.findIndex((h: any) => h && h.toString().toUpperCase() === 'OPTIONS');
                
                if (typeIdx === -1 || questionIdx === -1) {
                    message.error('CSV must have TYPE and QUESTION columns. Found columns: ' + header.join(', '));
                    e.target.value = '';
                    return;
                }
                
                const importedQuestions: any[] = [];
                for (let i = 1; i < rows.length; i++) {
                    const row = rows[i];
                    if (!row || row.length === 0) continue; // Skip empty rows
                    
                    const type = row[typeIdx]?.toString().toUpperCase();
                    const question = row[questionIdx]?.toString() || '';
                    const optionsRaw = optionsIdx !== -1 ? row[optionsIdx]?.toString() : '';
                    
                    if (!type || !question.trim()) {
                        continue;
                    }
                    
                    if (type === 'TEXT') {
                        importedQuestions.push({ type: 'text', title: question });
                    } else if (type === 'CHOICE') {
                        const options = optionsRaw ? optionsRaw.split('/').map((opt: string) => opt.trim()).filter((opt: string) => opt) : ['Option 1', 'Option 2'];
                        importedQuestions.push({ type: 'radiogroup', title: question, choices: options });
                    }
                }
        
                
                if (importedQuestions.length === 0) {
                    message.warning('No valid questions found in the CSV file. Make sure TYPE column contains "TEXT" or "CHOICE" values.');
                    e.target.value = '';
                    return;
                }
                
                // Add imported questions to current page
                setSurveyData(prevData => {
                    const updatedPages = [...prevData.pages];
                    const elements = [...updatedPages[activePage].elements];
                    importedQuestions.forEach(q => {
                        const newQ: any = {
                            name: nanoid(),
                            title: q.title,
                            type: q.type,
                            isRequired: true
                        };
                        if (q.type === 'radiogroup') {
                            newQ.choices = q.choices;
                            if (surveyDataSettings.type === FormTypes.Quiz) {
                                newQ.correctAnswer = q.choices && q.choices.length > 0 ? q.choices[0] : '';
                            }
                        }
                        elements.push(newQ);
                    });
                    updatedPages[activePage] = {
                        ...updatedPages[activePage],
                        elements
                    };
                    return { ...prevData, pages: updatedPages };
                });
                
                message.success(`Successfully imported ${importedQuestions.length} questions!`);
                e.target.value = '';
                
            } catch (error) {
                message.error('Error processing CSV file: ' + (error as Error).message);
                e.target.value = '';
            }
        };
        
        reader.readAsText(file);
    };

    const handleImportClick = () => {
        setShowImportGuide(true);
    };

    const handleConfirmImport = () => {
        setShowImportGuide(false);
        document.getElementById('import-questions')?.click();
    };

    const importGuideColumns = [
        {
            title: 'ชื่อคอลัมน์',
            dataIndex: 'column',
            key: 'column',
        },
        {
            title: 'บังคับ',
            dataIndex: 'required',
            key: 'required',
        },
        {
            title: 'คำอธิบาย',
            dataIndex: 'description',
            key: 'description',
        },
        {
            title: 'ตัวอย่าง',
            dataIndex: 'example',
            key: 'example',
        },
    ];

    const importGuideData = [
        {
            key: '1',
            column: 'TYPE',
            required: 'Yes',
            description: 'ประเภทคำถาม',
            example: 'TEXT และ CHOICE',
        },
        {
            key: '2',
            column: 'QUESTION',
            required: 'Yes',
            description: 'คำถามที่ต้องการ',
            example: 'What is your name?',
        },
        {
            key: '3',
            column: 'OPTIONS',
            required: 'No',
            description: 'ตัวเลือกสำหรับคำถามแบบ CHOICE (แยกด้วย /)',
            example: 'Option 1/Option 2/Option 3',
        },
    ];

    const updateQuestionTitle = (pageIndex: number, questionIndex: number, newTitle: string) => {
        setSurveyData(prevData => {
            const updatedPages = [...prevData.pages];
            updatedPages[pageIndex].elements[questionIndex].title = newTitle;
            return { ...prevData, pages: updatedPages };
        });
    };

    const updateRadioChoice = (
        pageIndex: number,
        questionIndex: number,
        key: number | string,
        newValue: any
    ) => {
        setSurveyData(prevData => {
            const updatedPages = [...prevData.pages];
            const question = updatedPages[pageIndex].elements[questionIndex];
            if (typeof key === 'number') {
                // Update choices array by index
                if (Array.isArray(question.choices)) {
                    question.choices[key] = newValue;
                }
            } else {
                // Update property by key
                question[key] = newValue;
            }
            return { ...prevData, pages: updatedPages };
        });
    };

    const addRadioChoice = (pageIndex: number, questionIndex: number) => {
        setSurveyData(prevData => {
            const updatedPages = [...prevData.pages];
            updatedPages[pageIndex].elements[questionIndex].choices.push(`ตัวเลือก ${updatedPages[pageIndex].elements[questionIndex].choices.length + 1}`);
            return { ...prevData, pages: updatedPages };
        });
    };

    const removeRadioChoice = (pageIndex: number, questionIndex: number, choiceIndex: number) => {
        setSurveyData(prevData => {
            const updatedPages = [...prevData.pages];
            updatedPages[pageIndex].elements[questionIndex].choices.splice(choiceIndex, 1);
            return { ...prevData, pages: updatedPages };
        });
    };

    const updateStartHtmlContentQuiz = (pageIndex: number, questionIndex: number, value: string): void => {
        setSurveyData(prevData => {
            const updatedPages = [...prevData.pages];
            if (updatedPages[pageIndex] && updatedPages[pageIndex].elements[questionIndex]) {
                updatedPages[pageIndex].elements[questionIndex].html = value;
            }
            return { ...prevData, pages: updatedPages };
        });
    };

    const updateCorrectAnswer = (pageIndex: number, questionIndex: number, choiceIndex: number, choice: string): void => {
        setSurveyData(prevData => {
            const updatedPages = [...prevData.pages];
            if (updatedPages[pageIndex] && updatedPages[pageIndex].elements[questionIndex]) {
                updatedPages[pageIndex].elements[questionIndex].correctAnswer = choice;
            }
            return { ...prevData, pages: updatedPages };
        });
    };

    const toggleQuestionRequired = (pageIndex: number, questionIndex: number): void => {
        setSurveyData(prevData => {
            const updatedPages = [...prevData.pages];
            if (updatedPages[pageIndex] && updatedPages[pageIndex].elements[questionIndex]) {
                const question = updatedPages[pageIndex].elements[questionIndex];
                question.isRequired = !question.isRequired;
            }
            return { ...prevData, pages: updatedPages };
        });
    };

    const renderQuestionEditor = (question: any, pageIndex: number, questionIndex: number) => {
        switch (question.type) {
            case 'text':
                return (
                    <Card 
                        size="small" 
                        style={{ marginBottom: 12, border: '1px solid #e8f4fd' }}
                        title={
                            <Space>
                                <FileTextOutlined style={{ color: '#1890ff' }} />
                                <Text strong>คำถามข้อความ #{questionIndex + 1}</Text>
                                <Tag color="blue" style={{ fontSize: '12px', padding: '0 6px' }}>Text Input</Tag>
                            </Space>
                        }
                        extra={
                            <>
                            <Tooltip title={question.isRequired ? "Remove required" : "Make required"}>
                                <div style={{ display: 'inline-block', marginRight: 8 }}> 
                                    <Button
                                        type={question.isRequired ? "primary" : "default"}
                                        danger={question.isRequired}
                                        size="small"
                                        onClick={() => toggleQuestionRequired(pageIndex, questionIndex)}
                                    >
                                        {question.isRequired ? "บังคับ" : "ไม่บังคับ"}
                                    </Button>
                                </div>
                            </Tooltip>
                            <Tooltip title="Delete Question">
                                <Button 
                                    icon={<DeleteOutlined />} 
                                    size="small" 
                                    disabled={mode === FormMode.Edit}
                                    danger 
                                    type="text"
                                    onClick={() => removeQuestion(pageIndex, questionIndex)}
                                />
                            </Tooltip>
                            </>
                        }
                    >
                        <Input
                            value={question.title}
                            onChange={(e) => updateQuestionTitle(pageIndex, questionIndex, e.target.value)}
                            placeholder="Enter your question here..."
                            size="large"
                        />
                    </Card>
                );
            case 'radiogroup':
                return (
                    <Card 
                        size="small" 
                        style={{ marginBottom: 12, border: '1px solid #f6ffed' }}
                        title={
                            <Space>
                                <QuestionCircleOutlined style={{ color: '#52c41a' }} />
                                <Text strong>คำถามตัวเลือก #{questionIndex + 1}</Text>
                                <Tag color="green" style={{ fontSize: '12px', padding: '0 6px' }}>Radio Group</Tag>
                            </Space>
                        }
                        extra={
                            <>
                            <Tooltip title={question.isRequired ? "Remove required" : "Make required"}>
                                <div style={{ display: 'inline-block', marginRight: 8 }}> 
                                    <Button 
                                        type={question.isRequired ? "primary" : "default"}
                                        danger={question.isRequired}
                                        size="small"
                                        onClick={() => toggleQuestionRequired(pageIndex, questionIndex)}
                                    >
                                        {question.isRequired ? "บังคับ" : "ไม่บังคับ"}
                                    </Button>
                                </div>
                            </Tooltip>
                            <Tooltip title="Delete Question">
                                <Button 
                                    icon={<DeleteOutlined />} 
                                    size="small" 
                                    disabled={mode === FormMode.Edit}
                                    danger 
                                    type="text"
                                    onClick={() => removeQuestion(pageIndex, questionIndex)}
                                />
                            </Tooltip>
                            </>
                        }
                    >
                        <Space direction="vertical" style={{ width: '100%' }}>
                            <Input
                                value={question.title}
                                onChange={(e) => updateQuestionTitle(pageIndex, questionIndex, e.target.value)}
                                placeholder="Enter your question here..."
                                size="large"
                            />
                            <div>
                                <Text strong style={{ fontSize: '12px', color: '#666' }}>Answer Options:</Text> 
                                { surveyDataSettings.type === FormTypes.Quiz && (
                                    <Text style={{ fontSize: '9px', color: '#666' }}> กรุณาเลือกคำตอบที่ถูกต้องด้านล่าง:</Text>
                                )}
                                <div style={{ marginTop: 8 }}>
                                    {question.choices.map((choice: string, choiceIndex: number) => (
                                        <div key={choiceIndex} style={{ display: 'flex', marginBottom: 6, alignItems: 'center' }}>
                                            {/* Custom correct answer icon for quiz UX */}
                                            {surveyDataSettings.type === FormTypes.Quiz && (
                                                <Tooltip title={question.correctAnswer === choice ? 'คำตอบที่ถูกต้อง' : 'เลือกเป็นคำตอบที่ถูกต้อง'}>
                                                    <Button
                                                        type={question.correctAnswer === choice ? 'primary' : 'default'}
                                                        shape="circle"
                                                        icon={question.correctAnswer === choice ? <span style={{ color: '#52c41a', fontSize: 18 }}>&#10003;</span> : <span style={{ color: '#bbb', fontSize: 18 }}>&#10003;</span>}
                                                        onClick={() => updateCorrectAnswer(pageIndex, questionIndex, choiceIndex, choice)}
                                                        style={{ marginRight: 8, borderColor: question.correctAnswer === choice ? '#52c41a' : '#bbb', background: question.correctAnswer === choice ? '#e6ffed' : undefined }}
                                                        size="small"
                                                    />
                                                </Tooltip>
                                            )}
                                            <Text style={{ marginRight: 8, minWidth: 20, color: '#999' }}>
                                                {String.fromCharCode(65 + choiceIndex)}.
                                            </Text>
                                            <Input
                                                value={choice}
                                                onChange={(e) => updateRadioChoice(pageIndex, questionIndex, choiceIndex, e.target.value)}
                                                placeholder={`Option ${choiceIndex + 1}`}
                                                style={{ marginRight: 8 }}
                                                size="small"
                                            />
                                            {question.choices.length > 2 && (
                                                <Button 
                                                    icon={<DeleteOutlined />} 
                                                    size="small" 
                                                    danger
                                                    type="text"
                                                    onClick={() => removeRadioChoice(pageIndex, questionIndex, choiceIndex)}
                                                />
                                            )}
                                        </div>
                                    ))}
                                    <Button 
                                        type="dashed" 
                                        icon={<PlusOutlined />} 
                                        onClick={() => addRadioChoice(pageIndex, questionIndex)}
                                        size="small"
                                        style={{ width: '100%', marginTop: 4 }}
                                    >
                                        เพิ่มตัวเลือก
                                    </Button>
                                </div>
                            </div>
                        </Space>
                    </Card>
                );
            case 'rating':
                // Ensure rateCount is always max - min + 1
                const handleRatingMinChange = (val: number) => {
                    updateRadioChoice(pageIndex, questionIndex, 'rateMin', val);
                    const max = question.rateMax;
                    if (typeof max === 'number' && val <= max) {
                        updateRadioChoice(pageIndex, questionIndex, 'rateCount', max - val + 1);
                    }
                };
                const handleRatingMaxChange = (val: number) => {
                    updateRadioChoice(pageIndex, questionIndex, 'rateMax', val);
                    const min = question.rateMin;
                    if (typeof min === 'number' && val >= min) {
                        updateRadioChoice(pageIndex, questionIndex, 'rateCount', val - min + 1);
                    }
                };
                return (
                    <Card
                        size="small"
                        style={{ marginBottom: 12, border: '1px solid #ffe7ba' }}
                        title={
                            <Space>
                                <StarsIcon style={{ color: '#faad14' }} />
                                <Text strong>คำถามเรตติ้ง #{questionIndex + 1}</Text>
                                <Tag color="orange" style={{ fontSize: '12px', padding: '0 6px' }}>Rating</Tag>
                            </Space>
                        }
                        extra={
                            <>
                                <Tooltip title={question.isRequired ? "Remove required" : "Make required"}>
                                    <div style={{ display: 'inline-block', marginRight: 8 }}>
                                        <Button
                                            type={question.isRequired ? "primary" : "default"}
                                            danger={question.isRequired}
                                            size="small"
                                            onClick={() => toggleQuestionRequired(pageIndex, questionIndex)}
                                        >
                                            {question.isRequired ? "บังคับ" : "ไม่บังคับ"}
                                        </Button>
                                    </div>
                                </Tooltip>
                                <Tooltip title="Delete Question">
                                    <Button
                                        icon={<DeleteOutlined />}
                                        size="small"
                                        disabled={mode === FormMode.Edit}
                                        danger
                                        type="text"
                                        onClick={() => removeQuestion(pageIndex, questionIndex)}
                                    />
                                </Tooltip>
                            </>
                        }
                    >
                        <Space direction="vertical" style={{ width: '100%' }}>
                            <Input
                                value={question.title}
                                onChange={e => updateQuestionTitle(pageIndex, questionIndex, e.target.value)}
                                placeholder="Enter your question here..."
                                size="large"
                            />
                            <Row gutter={8} style={{ marginTop: 8 }}>
                                <Col span={6}>
                                    <Text strong>ต่ำสุด:</Text>
                                    <InputNumber
                                        min={0}
                                        value={question.rateMin}
                                        onChange={handleRatingMinChange}
                                        style={{ width: '100%' }}
                                    />
                                </Col>
                                <Col span={6}>
                                    <Text strong>สูงสุด:</Text>
                                    <InputNumber
                                        min={question.rateMin}
                                        value={question.rateMax}
                                        onChange={handleRatingMaxChange}
                                        style={{ width: '100%' }}
                                    />
                                </Col>
                                <Col span={6}>
                                    <Text strong>จำนวน:</Text>
                                    <InputNumber
                                        min={2}
                                        value={typeof question.rateMin === 'number' && typeof question.rateMax === 'number' ? question.rateMax - question.rateMin + 1 : question.rateCount}
                                        disabled
                                        style={{ width: '100%' }}
                                    />
                                </Col>
                            </Row>
                            <Row gutter={8} style={{ marginTop: 8 }}>
                                <Col span={12}>
                                    <Text strong>Min Desc:</Text>
                                    <Input
                                        value={question.minRateDescription}
                                        onChange={e => updateRadioChoice(pageIndex, questionIndex, 'minRateDescription', e.target.value)}
                                        style={{ width: '100%' }}
                                    />
                                </Col>
                                <Col span={12}>
                                    <Text strong>Max Desc:</Text>
                                    <Input
                                        value={question.maxRateDescription}
                                        onChange={e => updateRadioChoice(pageIndex, questionIndex, 'maxRateDescription', e.target.value)}
                                        style={{ width: '100%' }}
                                    />
                                </Col>
                            </Row>
                        </Space>
                    </Card>
                );
            case 'checkbox':
                return (
                    <Card
                        size="small"
                        style={{ marginBottom: 12, border: '1px solid #e6f7ff' }}
                        title={
                            <Space>
                                <QuestionCircleOutlined style={{ color: '#1890ff' }} />
                                <Text strong>คำถาม Checkbox #{questionIndex + 1}</Text>
                                <Tag color="blue" style={{ fontSize: '12px', padding: '0 6px' }}>Checkbox</Tag>
                            </Space>
                        }
                        extra={
                            <>
                                <Tooltip title={question.isRequired ? "Remove required" : "Make required"}>
                                    <div style={{ display: 'inline-block', marginRight: 8 }}>
                                        <Button
                                            type={question.isRequired ? "primary" : "default"}
                                            danger={question.isRequired}
                                            size="small"
                                            onClick={() => toggleQuestionRequired(pageIndex, questionIndex)}
                                        >
                                            {question.isRequired ? "บังคับ" : "ไม่บังคับ"}
                                        </Button>
                                    </div>
                                </Tooltip>
                                <Tooltip title="Delete Question">
                                    <Button
                                        icon={<DeleteOutlined />}
                                        size="small"
                                        disabled={mode === FormMode.Edit}
                                        danger
                                        type="text"
                                        onClick={() => removeQuestion(pageIndex, questionIndex)}
                                    />
                                </Tooltip>
                            </>
                        }
                    >
                        <Space direction="vertical" style={{ width: '100%' }}>
                            <Input
                                value={question.title}
                                onChange={e => updateQuestionTitle(pageIndex, questionIndex, e.target.value)}
                                placeholder="Enter your question here..."
                                size="large"
                            />
                            <Input
                                value={question.description}
                                onChange={e => updateRadioChoice(pageIndex, questionIndex, 'description', e.target.value)}
                                placeholder="คำอธิบาย (ไม่บังคับ)"
                                style={{ marginTop: 8 }}
                            />
                            <div style={{ marginTop: 8 }}>
                                <Text strong>Choices:</Text>
                                {question.choices && question.choices.map((choice: string, choiceIndex: number) => (
                                    <div key={choiceIndex} style={{ display: 'flex', alignItems: 'center', marginBottom: 4 }}>
                                        <Input
                                            value={choice}
                                            onChange={e => updateRadioChoice(pageIndex, questionIndex, choiceIndex, e.target.value)}
                                            placeholder={`Choice ${choiceIndex + 1}`}
                                            size="small"
                                            style={{ marginRight: 8 }}
                                        />
                                        {question.choices.length > 1 && (
                                            <Button
                                                icon={<DeleteOutlined />}
                                                size="small"
                                                danger
                                                type="text"
                                                onClick={() => removeRadioChoice(pageIndex, questionIndex, choiceIndex)}
                                            />
                                        )}
                                    </div>
                                ))}
                                <Button
                                    type="dashed"
                                    icon={<PlusOutlined />}
                                    onClick={() => addRadioChoice(pageIndex, questionIndex)}
                                    size="small"
                                    style={{ width: '100%', marginTop: 4 }}
                                >
                                    เพิ่มตัวเลือก
                                </Button>
                            </div>
                            <Input
                                value={question.otherText}
                                onChange={e => updateRadioChoice(pageIndex, questionIndex, 'otherText', e.target.value)}
                                placeholder="Other text label"
                                style={{ marginTop: 8 }}
                            />
                            <Row gutter={8} style={{ marginTop: 8 }}>
                                <Col span={12}>
                                    <Text strong>จำนวนคอลัมน์:</Text>
                                    <InputNumber
                                        min={1}
                                        max={4}
                                        value={question.colCount}
                                        onChange={val => updateRadioChoice(pageIndex, questionIndex, 'colCount', val)}
                                        style={{ width: '100%' }}
                                    />
                                </Col>
                                <Col span={12}>
                                    <Text strong>แสดงตัวเลือกอื่นๆ:</Text>
                                    <Switch
                                        checked={!!question.showOtherItem}
                                        onChange={checked => updateRadioChoice(pageIndex, questionIndex, 'showOtherItem', checked)}
                                    />
                                </Col>
                            </Row>
                        </Space>
                    </Card>
                );
            case 'html':
            return(
                <>
                <div>HTML Editor</div>
                <Input.TextArea
                    value={question.html}
                    onChange={(e) => updateStartHtmlContentQuiz(pageIndex, questionIndex, e.target.value)}
                    placeholder="Enter HTML content here..."
                    rows={4}
                    style={{ marginTop: 8 }}
                />
                </>
            )
            default:
                return <Text type="secondary">Unknown question type</Text>;
        }
    };

    const removeQuestion = (pageIndex: number, questionIndex: number) => {
        setSurveyData(prevData => {
            const updatedPages = [...prevData.pages];
            updatedPages[pageIndex].elements.splice(questionIndex, 1);
            return { ...prevData, pages: updatedPages };
        });
    };

    const handleSaveForm = async () => {

        try {
            const correctAnswersCount = surveyData.pages.reduce((count, page) => {
                return count + page.elements.filter(q => q.type === 'radiogroup' && q.correctAnswer).length;
            }, 0);

            // if passing score is 0 ask a confirmation to set passing score 0 and show amount of correct answers
            if (surveyDataSettings.passing_score === 0 && surveyDataSettings.type === FormTypes.Quiz) {
                const confirm = await new Promise<boolean>((resolve) => {
                    Modal.confirm({
                        title: 'ยืนยันการตั้งค่าคะแนนที่ผ่านเป็น 0',
                        content: `จำนวนคำถามที่กำหนดข้อถูกต้อง: ${correctAnswersCount}`,
                        onOk: () => resolve(true),
                        onCancel: () => resolve(false),
                    });
                });
                if (!confirm) {
                    return;
                }
            }

            // check survey title is not empty
            if (!surveyData.title || surveyData.title.trim() === '') {
                message.error('กรุณากรอกหัวข้อแบบฟอร์ม');
                return;
            }

            // check element is not empty
            if (!surveyData.pages || surveyData.pages.length === 0) {
                message.error('แบบฟอร์มต้องมีอย่างน้อย 1 หน้า');
                return;
            }

            // check every page must have at least one question
            for (const page of surveyData.pages) {
                if (!page.elements || page.elements.length === 0) {
                    message.error('ทุกหน้าของแบบฟอร์มต้องมีคำถามอย่างน้อย 1 ข้อ');
                    return;
                }
            }

            // check CountCorrectAnswers is >= passing_score
            if (surveyDataSettings.type === FormTypes.Quiz && correctAnswersCount < surveyDataSettings.passing_score) {
                message.error(`จำนวนคำถามกำหนดข้อถูก (${correctAnswersCount}) ต้องมากกว่าหรือเท่ากับคะแนนที่กำหนด (${surveyDataSettings.passing_score})`);
                return;
            }

            if (!user) {
                message.error('กรุณาเข้าสู่ระบบหรือลองอีกครั้ง');
                return;
            }
            const formData: FormCreate = {
                slug: surveyDataSettings.slug && surveyDataSettings.slug.trim() !== '' ? surveyDataSettings.slug : null,
                title: surveyData.title,
                type: surveyDataSettings.type,
                description: surveyData.description,
                is_retryable: surveyDataSettings.is_retryable,
                retry_size: surveyDataSettings.retry_size,
                is_active: surveyDataSettings.is_active,
                is_batch_question: surveyDataSettings.is_batch_question,
                batch_question_size: surveyDataSettings.batch_question_size,
                passing_score: surveyDataSettings.passing_score,
                visibility: surveyDataSettings.visibility,
                content: JSON.stringify(surveyData),
                created_by: user.id,
                updated_by: user.id,
                created_at: new Date(),
                updated_at: new Date(),
                is_survey_preview: surveyDataSettings.is_survey_preview
            };
            if (mode === FormMode.Edit) {
                (formData as any).id = surveyDataSettings.id;
            }
            await onSave(formData);
        } catch (err) {
            message.error('เกิดข้อผิดพลาดในการบันทึกแบบฟอร์ม: ' + ((err as any)?.response?.data?.message || (err as Error).message));
            console.error(err);
        }
    };

    return (
        <div style={{ padding: '16px', maxWidth: '100%', height: '100vh', overflow: 'hidden' }}>
            <Row gutter={16} style={{ height: '100%' }}>
                <Col span={24} style={{ height: '100%' }}>
                    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                        {/* Header */}
                        <div style={{ marginBottom: 16 }}>
                            <Row justify="space-between" align="middle">
                                <Col>
                                    <Title level={3} style={{ margin: 0, color: '#1890ff' }}>
                                        <EditOutlined /> สร้างฟอร์มใหม่
                                    </Title>
                                </Col>
                                <Col>
                                    <Space>
                                        <Button 
                                            icon={<EyeOutlined />}
                                            onClick={() => setShowPreview(!showPreview)}
                                            type={showPreview ? "primary" : "default"}
                                        >
                                            {showPreview ? "ซ่อนตัวอย่าง" : "แสดงตัวอย่าง"}
                                        </Button>
                                        {process.env.DEV_MODE == "development" && (
                                        <Button
                                            type="primary"
                                            onClick={() => console.log(JSON.stringify(surveyData, null, 2))}
                                            style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }}
                                        >
                                            Export JSON
                                        </Button>
                                        )}
                                        <Button
                                            type="primary"
                                            onClick={handleSaveForm}
                                            style={{ backgroundColor: '#1890ff', borderColor: '#1890ff' }}
                                        >
                                            บันทึกฟอร์ม
                                        </Button>
                                        {mode === FormMode.Edit && (
                                            <Button
                                                icon={<LinkOutlined />}
                                                onClick={() => {
                                                    const url = `${window.location.origin}/form?id=${surveyDataSettings.id}`;
                                                    navigator.clipboard.writeText(url);
                                                    message.success('คัดลอกลิงก์แบบฟอร์มแล้ว!');
                                                }}
                                            >
                                                แชร์ลิงก์
                                            </Button>
                                        )}
                                    </Space>
                                </Col>
                            </Row>
                        </div>

                        {/* Preview Panel at Top */}
                        {showPreview && (
                            <Card 
                                title={
                                    <Space>
                                        <EyeOutlined />
                                        <Text strong>แสดงตัวอย่าง</Text>
                                    </Space>
                                }
                                style={{ marginBottom: 16 }}
                            >
                                <div style={{ maxHeight: '500px', overflow: 'auto', padding: '16px' }}>
                                    <SurveyPreview json={surveyData} />
                                </div>
                            </Card>
                        )}

                        {/* Main Content - Scrollable */}
                        <div style={{ flex: 1, overflow: 'auto' }}>

                            {/* Page Management */}
                            <Card style={{ marginBottom: 16 }} size="small">
                                <Row justify="space-between" align="middle" style={{ marginBottom: 12 }}>
                                    <Col>
                                        <Text strong>หน้า ({surveyData.pages.length})</Text>
                                    </Col>
                                    {!surveyDataSettings.is_batch_question && (
                                        <Col>
                                            <Button
                                                type="primary"
                                                icon={<PlusOutlined />}
                                                onClick={addPage}
                                            size="small"
                                        >
                                            เพิ่มหน้าใหม่
                                        </Button>
                                    </Col>
                                 )} 
                                </Row>
                                <div>
                                    {surveyData.pages.map((page, index) => (
                                        <Button
                                            key={index}
                                            type={activePage === index ? "primary" : "default"}
                                            onClick={() => setActivePage(index)}
                                            style={{ marginRight: 8, marginBottom: 4 }}
                                            size="small"
                                        >
                                            {page.name} ({page.elements.length})
                                        </Button>
                                    ))}
                                </div>
                            </Card>

                            {/* Question Builder */}
                            <Card 
                                title={
                                    <Space>
                                        <FileTextOutlined />
                                        <Text strong>คำถาม - {surveyData.pages[activePage]?.name}</Text>
                                        <Tag color="blue">จำนวนคำถาม - {surveyData.pages[activePage]?.elements.length || 0} </Tag>
                                    </Space>
                                }
                                extra={
                                <>
                                    { true && ( // surveyData.pages[activePage]?.name !== 'startPage' && (
                                    <Space>
                                        <Button 
                                            type="dashed" 
                                            icon={<PlusOutlined />} 
                                            onClick={() => addQuestion('text')}
                                            size="small"
                                        >
                                            ข้อความ
                                        </Button>
                                        <Button 
                                            type="dashed" 
                                            icon={<PlusOutlined />} 
                                            onClick={() => addQuestion('radiogroup')}
                                            size="small"
                                        >
                                            ตัวเลือก
                                        </Button>
                                        <Button 
                                            type="dashed" 
                                            icon={<PlusOutlined />} 
                                            onClick={() => addQuestion('rating')}
                                            size="small"
                                        >
                                            เรตติ้ง
                                        </Button>
                                        <Button 
                                            type="dashed" 
                                            icon={<PlusOutlined />} 
                                            onClick={() => addQuestion('checkbox')}
                                            size="small"
                                        >
                                            Checkbox
                                        </Button>
                                        {/* Use ref to trigger input click */}
                                        <Button
                                            type="default"
                                            size="small"
                                            style={{ marginLeft: 8 }}
                                            onClick={handleImportClick}
                                        >
                                            เพิ่มชุดคำถาม
                                        </Button>
                                        <input
                                            id="import-questions"
                                            type="file"
                                            accept=".csv"
                                            style={{ display: 'none' }}
                                            onChange={handleImportQuestions}
                                        />
                                    </Space>
                                    )}
                                </>
                                }
                                size="small"
                                style={{ marginBottom: 16 }}
                            >
                                <div style={{ maxHeight: '400px', overflow: 'auto' }}>
                                    {surveyData.pages[activePage]?.elements.length === 0 ? (
                                        <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
                                            <Text type="secondary">
                                                ยังไม่มีคำถามในหน้านี้. คลิกปุ่มด้านบนเพื่อเพิ่มคำถาม
                                            </Text>
                                        </div>
                                    ) : (
                                        surveyData.pages[activePage]?.elements.map((question, qIndex) => (
                                            <div key={qIndex}>
                                                {renderQuestionEditor(question, activePage, qIndex)}
                                            </div>
                                        ))
                                    )}
                                </div>
                            </Card>

                            {/* Survey Settings */}
                            <Collapse 
                                defaultActiveKey={['1']} 
                                style={{ marginBottom: 16 }}
                                items={[
                                    {
                                        key: '1',
                                        label: (
                                            <Space>
                                                <SettingOutlined />
                                                <Text strong>ตั้งค่าทั่วไป</Text>
                                            </Space>
                                        ),
                                        children: (
                                            <>
                                            <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
                                                <Col xs={24} sm={12} md={8}>
                                                    <Text strong>เปิดใช้งาน: </Text>
                                                    <Switch checked={surveyDataSettings.is_active} onChange={checked => setSurveyDataSettings({ ...surveyDataSettings, is_active: checked })} />
                                                </Col>
                                                <Col xs={24} sm={12} md={8}>
                                                    <Text strong>ตอบได้หลายครั้ง: </Text>
                                                    <Switch
                                                        checked={surveyDataSettings.is_retryable}
                                                        onChange={checked => setSurveyDataSettings({ ...surveyDataSettings, is_retryable: checked })}
                                                        style={{ marginRight: 8 }}
                                                    />
                                                    {surveyDataSettings.is_retryable && (
                                                        <InputNumber
                                                            min={1}
                                                            value={surveyDataSettings.retry_size}
                                                            onChange={value => setSurveyDataSettings({ ...surveyDataSettings, retry_size: value })}
                                                            style={{ width: 80, marginLeft: 8 }}
                                                            size="small"
                                                            placeholder="จำนวนครั้ง"
                                                        />
                                                    )}
                                                </Col>
                                                <Col xs={24} sm={12} md={8}>
                                                    <Text strong>สุ่มลำดับคำถาม:</Text>
                                                    <Switch
                                                        checked={!!surveyData.questionOrder}
                                                        onChange={checked => setQuestionOrder(checked ? 'random' : false)}
                                                        style={{ marginLeft: 8 }}
                                                    />
                                                </Col>
                                                <Col xs={24} sm={12} md={8}>
                                                    <Text strong>แสดงตัวอย่างแบบสำรวจ:</Text>
                                                    <Switch
                                                        checked={surveyDataSettings.is_survey_preview}
                                                        onChange={checked => setSurveyDataSettings({ ...surveyDataSettings, is_survey_preview: checked })}
                                                        style={{ marginLeft: 8 }}
                                                    />
                                                </Col>
                                            </Row>
                                            <Row gutter={13}>
                                                <Col span={12} style={{display: 'none'}}>
                                                    <Text strong>Visible: </Text>
                                                    <Select 
                                                        value={surveyDataSettings.visibility as FormVisible} 
                                                        onChange={value => setSurveyDataSettings({ ...surveyDataSettings, visibility: value as FormVisible })} 
                                                        style={{ width: '100%', marginTop: 8 }}
                                                        size="large"
                                                    >
                                                        <Select.Option value={FormVisible.Public}>Public</Select.Option>
                                                        <Select.Option value={FormVisible.Private}>Private</Select.Option>
                                                    </Select>
                                                </Col>
                                                <Col span={12} style={{ marginTop: 8 }}>
                                                    <Text strong>Slug (ไม่บังคับ):</Text>
                                                    <Tooltip title="Slug คือการกำหนด URL ในการเข้าถึงฟอร์มด้วยตนเอง">
                                                        <Button
                                                            size="small"
                                                            style={{ marginLeft: 8, padding: '0 6px' }}
                                                            icon={<QuestionCircleOutlined />}
                                                        />
                                                    </Tooltip>
                                                    <Input
                                                        placeholder="example-survey"
                                                        value={surveyDataSettings.slug}
                                                        onChange={value => setSurveyDataSettings({ ...surveyDataSettings, slug: value.target.value })}
                                                        style={{ marginTop: 8 }}
                                                        size="large"
                                                        disabled={mode === FormMode.Edit}
                                                    />
                                                </Col>
                                                <Col span={12} style={{ marginTop: 8 }}>
                                                    <Text strong>ประเภทฟอร์ม:</Text>
                                                    <Select 
                                                        value={surveyDataSettings.type} 
                                                        onChange={handleSurveyTypeChange} 
                                                        style={{ width: '100%', marginTop: 8 }}
                                                        size="large"
                                                        disabled={mode === FormMode.Edit}
                                                    >
                                                        <Select.Option value="form">แบบสอบถาม</Select.Option>
                                                        <Select.Option value="quiz">แบบทดสอบ</Select.Option>
                                                    </Select>
                                                </Col>
                                                <Col span={12} style={{ marginTop: 8 }}>
                                                    <Text strong>
                                                        หัวข้อแบบสอบถาม: <span style={{ color: 'red' }}>*</span>
                                                    </Text>
                                                    <Input 
                                                        placeholder="แบบทดสอบ" 
                                                        value={surveyData.title} 
                                                        onChange={value => setSurveyData({ ...surveyData, title: value.target.value })}
                                                        style={{ marginTop: 8 }}
                                                        size="large"
                                                    />
                                                </Col>
                                                {surveyDataSettings.type === FormTypes.Quiz && (
                                                <Col span={12} style={{marginTop: 8}}>
                                                    <Text strong>
                                                        คะแนนแบบทดสอบผ่าน: <span style={{ color: 'red' }}>*</span>
                                                    </Text>
                                                    <InputNumber
                                                        min={0}
                                                        value={surveyDataSettings.passing_score}
                                                        onChange={value => setSurveyDataSettings({ ...surveyDataSettings, passing_score: value })}
                                                        style={{ marginTop: 8, width: '100%' }}
                                                        size="large"
                                                    />
                                                </Col>
                                                )}

                                                <Col span={24} style={{ marginTop: 16 }}>
                                                    <Text strong>คำอธิยาย:</Text>
                                                    <TextArea 
                                                        placeholder="เพิ่มคำอธิบาย(ไม่บังคับ)" 
                                                        value={surveyData.description} 
                                                        onChange={value => setSurveyData({ ...surveyData, description: value.target.value })}
                                                        style={{ marginTop: 8 }}
                                                        rows={3}
                                                    />
                                                </Col>
                                            </Row>
                                            </>
                                        )
                                    },
                                    {
                                        key: '2',
                                        label: (
                                            <Space>
                                                <SettingOutlined />
                                                <Text strong>ความคืบหน้าและเวลา</Text>
                                            </Space>
                                        ),
                                        children: (
                                            <Row gutter={16}>
                                                <Col span={12}>
                                                    <Space direction="vertical" style={{ width: '100%' }}>
                                                        <div>
                                                            <Text strong>แสดง Progress Bar:</Text>
                                                            <Switch 
                                                                checked={surveyData.showProgressBar}
                                                                onChange={value => setSurveyData({ ...surveyData, showProgressBar: value })}
                                                                style={{ marginLeft: 8 }}
                                                            />
                                                        </div>
                                                        {surveyData.showProgressBar && (
                                                            <div>
                                                                <Text strong>ตำแหน่ง Progress Bar:</Text>
                                                                <Select 
                                                                    value={surveyData.progressBarLocation} 
                                                                    onChange={value => setSurveyData({ ...surveyData, progressBarLocation: value })} 
                                                                    style={{ width: '100%', marginTop: 8 }}
                                                                >
                                                                    <Select.Option value="top">บน</Select.Option>
                                                                    <Select.Option value="bottom">ล่าง</Select.Option>
                                                                </Select>
                                                            </div>
                                                        )}
                                                    </Space>
                                                </Col>
                                                <Col span={12}>
                                                    <Space direction="vertical" style={{ width: '100%' }}>
                                                        <div>
                                                            <Text strong>ตั้งเวลา:</Text>
                                                            <Switch 
                                                                checked={surveyData.showTimer}
                                                                onChange={value => setSurveyData({ ...surveyData, showTimer: value })}
                                                                style={{ marginLeft: 8 }}
                                                            />
                                                        </div>
                                                        {surveyData.showTimer && (
                                                            <>
                                                                <div>
                                                                    <Text strong>เวลาทั้งหมด (วินาที):</Text>
                                                                    <InputNumber 
                                                                        value={surveyData.timeLimit} 
                                                                        onChange={value => setSurveyData({ ...surveyData, timeLimit: value || 0 })}
                                                                        style={{ width: '100%', marginTop: 8 }}
                                                                        min={0}
                                                                        placeholder="0 = no limit"
                                                                    />
                                                                </div>
                                                                <div>
                                                                    <Text strong>เวลาต่อหน้า (วินาที):</Text>
                                                                    <InputNumber 
                                                                        value={surveyData.timeLimitPerPage} 
                                                                        onChange={value => setSurveyData({ ...surveyData, timeLimitPerPage: value || 0 })}
                                                                        style={{ width: '100%', marginTop: 8 }}
                                                                        min={0}
                                                                        placeholder="0 = no limit"
                                                                    />
                                                                </div>
                                                            </>
                                                        )}
                                                    </Space>
                                                </Col>
                                            </Row>
                                        )
                                    },
                                    {
                                        key: '3',
                                        label: (
                                            <Space>
                                                <SettingOutlined />
                                                <Text strong>หน้าเริ่มต้นและหน้าสุดท้าย</Text>
                                            </Space>
                                        ),
                                        children: (
                                            <Row gutter={16}>
                                                <Col span={12}>
                                                    <Space direction="vertical" style={{ width: '100%' }}>
                                                        <div>
                                                            <Text strong>ตั้งค่าหน้าเริ่มต้น:</Text>
                                                        <Tooltip title="หน้าเริ่มต้นคือหน้าที่จะแสดงก่อนเริ่มทำแบบสอบถาม">
                                                        <Button
                                                            size="small"
                                                            style={{ marginLeft: 8, padding: '0 6px' }}
                                                            icon={<QuestionCircleOutlined />}
                                                        />
                                                    </Tooltip>
                                                            <Switch 
                                                                checked={surveyData.firstPageIsStartPage}
                                                                onChange={handleStartPageChange}
                                                                style={{ marginLeft: 8 }}
                                                                disabled={surveyDataSettings.type === FormTypes.Quiz}
                                                            />
                                                        </div>
                                                        {surveyData.firstPageIsStartPage && (
                                                            <div>
                                                                <Text strong>ข้อความปุ่มเริ่มต้น:</Text>
                                                                <Input 
                                                                    value={surveyData.startSurveyText} 
                                                                    onChange={e => setSurveyData({ ...surveyData, startSurveyText: e.target.value })}
                                                                    style={{ marginTop: 8 }}
                                                                    placeholder="Start Survey"
                                                                />
                                                            </div>
                                                        )}
                                                    </Space>
                                                </Col>
                                                <Col span={12}>
                                                    <div>
                                                        <Text strong>ข้อความจบแบบสอบถาม (HTML):</Text>
                                                        <TextArea 
                                                            value={surveyData.completedHtml} 
                                                            onChange={e => setSurveyData({ ...surveyData, completedHtml: e.target.value })}
                                                            style={{ marginTop: 8 }}
                                                            rows={4}
                                                            placeholder="ขอบคุณที่ทำแบบสอบถาม"
                                                        />
                                                    </div>
                                                </Col>
                                            </Row>
                                        )
                                    },
                                    {
                                        key: '4',
                                        label: (
                                            <Space>
                                                <SettingOutlined />
                                                <Text strong>กลุ่มคำถาม</Text>
                                            </Space>
                                        ),
                                        children: (
                                            <>
                                            {surveyDataSettings.type === FormTypes.Quiz && (
                                            <Row gutter={16}>
                                                <Col span={12}>
                                                    <div>
                                                        <Text strong>เปิดใช้งานกลุ่มคำถาม:</Text>
                                                        <Switch 
                                                            checked={surveyDataSettings.is_batch_question}
                                                            onChange={handleBatchQuestionChange}
                                                            style={{ marginLeft: 8 }}
                                                            disabled={mode === FormMode.Edit}
                                                        />
                                                    </div>
                                                </Col>
                                                <Col span={12}>
                                                    <div>
                                                        <Text strong>จำนวนคำถาม (ข้อ):</Text>
                                                        <InputNumber 
                                                            min={1}
                                                            defaultValue={1}
                                                            value={surveyDataSettings.batch_question_size}
                                                            onChange={(value) => setSurveyDataSettings({ ...surveyDataSettings, batch_question_size: value ?? 1 })}
                                                            style={{ marginLeft: 8 }}
                                                        />
                                                    </div>
                                                </Col>
                                            </Row>
                                            )}
                                        </>
                                        )
                                    }
                                ]}
                            />
                        </div>
                    </div>
                </Col>
            </Row>

            {/* Import Guide Modal */}
            <Modal
                title="คำแนะนำการนำเข้าคำถามจาก CSV"
                open={showImportGuide}
                onOk={handleConfirmImport}
                onCancel={() => setShowImportGuide(false)}
                okText="Select CSV File"
                cancelText="Cancel"
                width={700}
            >
                <div style={{ marginBottom: 16 }}>
                    <Text strong>กรุณาเตรียมไฟล์ CSV ตามรูปแบบดังนี้</Text>
                </div>
                <Button
                    type="primary"
                    style={{ marginBottom: 16 }}
                    onClick={() => {
                        const wsData = [
                            ['TYPE', 'QUESTION', 'OPTIONS'],
                            ['TEXT', 'What is your name?', ''],
                            ['CHOICE', 'What is your favorite color?', 'Red/Blue/Green/Yellow'],
                            ['TEXT', 'Any additional comments?', ''],
                            ['CHOICE', 'How did you hear about us?', 'Website/Social Media/Friend/Advertisement']
                        ];
                        // simple CSV writer
                        const csv = wsData.map(row => row.map(cell => {
                            if (cell === null || cell === undefined) return '';
                            const s = String(cell);
                            // escape double quotes
                            return '"' + s.replace(/"/g, '""') + '"';
                        }).join(',')).join('\n');
                        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = 'template_questions.csv';
                        document.body.appendChild(a);
                        a.click();
                        a.remove();
                        URL.revokeObjectURL(url);
                    }}
                >
                    ดาวน์โหลดไฟล์ตัวอย่าง (CSV)
                </Button>
                <div style={{ marginBottom: 8, color: '#888' }}>
                    <span>
                        ดาวน์โหลดไฟล์ตัวอย่าง แล้วเปิดด้วย Excel หรือ Google Sheets จากนั้น <b>Export เป็น CSV</b> ก่อนนำเข้า
                    </span>
                </div>
                <Table
                    columns={importGuideColumns}
                    dataSource={importGuideData}
                    pagination={false}
                    size="small"
                    style={{ marginBottom: 16 }}
                />
                <div style={{ marginBottom: 16 }}>
                    <Text strong>Example CSV Format:</Text>
                    <div style={{ 
                        backgroundColor: '#f5f5f5', 
                        padding: '12px', 
                        marginTop: '8px', 
                        borderRadius: '4px',
                        fontFamily: 'monospace',
                        fontSize: '12px'
                    }}>
                        <div style={{ marginBottom: '4px', fontWeight: 'bold' }}>
                            TYPE,QUESTION,OPTIONS
                        </div>
                        <div style={{ marginBottom: '2px' }}>
                            TEXT,What is your name?,
                        </div>
                        <div style={{ marginBottom: '2px' }}>
                            CHOICE,What is your favorite color?,Red/Blue/Green/Yellow
                        </div>
                        <div style={{ marginBottom: '2px' }}>
                            TEXT,Any additional comments?,
                        </div>
                        <div>
                            CHOICE,How did you hear about us?,Website/Social Media/Friend/Advertisement
                        </div>
                    </div>
                </div>
                <div>
                    <Text strong style={{ color: '#1890ff' }}>Important Notes:</Text>
                    <ul style={{ marginTop: 8, paddingLeft: 20 }}>
                        <li>แถวแรกต้องมีหัวข้อคอลัมน์: TYPE,QUESTION,OPTIONS</li>
                        <li>คอลัมน์ TYPE รองรับ: "TEXT" สำหรับข้อความ หรือ "CHOICE" สำหรับตัวเลือก</li>
                        <li>สำหรับคำถามแบบ CHOICE ให้แยกตัวเลือกด้วย "/" (forward slash)</li>
                        <li>คอลัมน์ OPTIONS สามารถเว้นว่างสำหรับคำถามแบบ TEXT ได้</li>
                        <li>คำถามจะถูกเพิ่มไปยังหน้าที่เลือกในปัจจุบัน</li>
                        <li>ดาวน์โหลดไฟล์ตัวอย่าง เปิดด้วย Excel หรือ Google Sheets แล้ว Export เป็น CSV ก่อนนำเข้า</li>
                    </ul>
                </div>
            </Modal>
        </div>
    );
};
export default FormEditor;
