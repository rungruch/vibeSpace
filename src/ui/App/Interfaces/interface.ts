import { FormTypes } from "../../enum";
/*
    USER 
*/
export interface CreateUser{
    name: string;
    email: string;
    password: string | null;
    employeeCode: string;
    is_active: boolean;
    is_internal: boolean;
}

export interface CurrentUser {
    id?: string;
    email?: string;
    name: string;
    permissions: string[];
    isInternal: boolean | string;
    EmployeeCode?: string;
    EmployeeData?: EmployeeData;
    isActive: boolean | string;
    createdAt: Date | string;
    updatedAt: Date | string;
}


export interface EmployeeData {
    EmployeeCode: string;
    TH_Name: string;
    ENG_Name: string;
    ADUser: string;
    Email: string;
    [key: string]: any;
}


/*
    FORM 
*/

export interface SurveyPage {
    name: string;
    elements: any[];
};

export interface SurveyDataSettings{
    id?: string | null;
    slug: string | null;
    visibility: 'public' | 'private';
    is_active: boolean;
    type: FormTypes;
    is_retryable: boolean;
    retry_size: number;
    is_batch_question: boolean;
    batch_question_size: number;
    passing_score: number;
    is_survey_preview: boolean;
}
export interface FormCreate extends SurveyDataSettings {
    title: string;
    description: string;
    content: string; // survey data json format string 
    created_by: string;
    updated_by: string;
    created_at: Date;
    updated_at: Date;
}
export interface SurveyData {
    title: string;
    description: string;
    pages: SurveyPage[];
    questionOrder?: string;
    showProgressBar: boolean;
    progressBarLocation: string;
    showTimer: boolean;
    timeLimit: number;
    timeLimitPerPage: number;
    firstPageIsStartPage: boolean;
    startSurveyText: string;
    completedHtml: string;
    completedHtmlOnCondition: any[];
    widthMode: string;
};

export interface FormSubmit {
    type: FormTypes;
    survey_id: string;
    user_id: string;
    response_content: any;
    created_at: Date;
    passing_score: number; // accidently set not null
    start_at: Date;
    submit_at: Date;
    time_spent_minute: number;
}

export interface QuizSubmit extends FormSubmit {
    score: number;
    passing_score: number;
    max_score: number;
    score_percentage: number;
    passed: boolean;
}


export interface FileSubmit {
    type: string; // MIME type (e.g., 'image/jpeg', 'application/pdf', 'text/plain')
    uploaded_by: string;
    uploaded_at: Date;
}

export interface FileResponse extends FileSubmit {
    fileName: string;
    path: string;
}

// PAGES

export interface PageSettings {
    id?: string;
    is_active: boolean;
    title: string;
    slug: string;
    content: string;
    created_by: string;
    created_at: Date;
    updated_by: string;
    updated_at: Date;
}

export interface PageUpdate {
    id?: string;
    is_active: boolean;
    title: string;
    slug: string;
    content: string;
    updated_by: string;
    updated_at: Date;
}

export interface PostSettings extends PageSettings { // use in create flow
    cover_image_url: string;
    category: string[];
}

export interface PostsData extends PageSettings { // use in fetch flow
    cover_image_url: string;
    category: string;
}

// SETTINGS 

export interface SettingsData {
    name: string;
    data: string;
} 

export interface Settings {
    mainpage: SettingsData;
    notification: SettingsData;
    announcement: SettingsData;
    herosection: SettingsData;
    [key: string]: SettingsData;
}
export interface MainPageSettings {
    [key: string]: MainPageData[];
}

export interface MainPageData {
    title: string;
    route: string;
}

export interface NotificationSettings {
    title: string;
    message: string;
    route: string;
    createdBy: string;
    createdAt: Date;
    expiredAt: Date;
}

export interface AnnouncementSettings {
    title: string;
    img_url: string;
    route: string;
    createdBy: string;
    createdAt: Date;
    expiredAt: Date;
}

export interface HeroSectionData {
    title: string;
    img_url: string;
    route: string;
}

export interface HeroSectionSettings {
    posts_show_length : number;
    data: HeroSectionData[];
}