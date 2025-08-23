import { ElearningVisibility, ElearningMediaType } from "../Enum/elearning";

export interface Elearning {
    id? : string;
    is_active : boolean;
    slug : string;
    pre_requisites : string;
    title : string;
    description : string;
    objective : string;
    duration_minute : number;
    certificate : boolean;
    visibility : ElearningVisibility;
    rating : number;
    password : string;
    start_date : Date | null;
    end_date : Date | null;
    enroll_duration_day : number;
    created_by : string;
    created_at : Date | null;
    updated_by : string;
    updated_at : Date | null;
    category? : string[] | ElearningCategory[];
    cover_image_url : string;
}

export interface ElearningCategory {
    id? : string;
    name : string;
    slug : string;
}

export interface ElearningModule {
    id? : string;
    course_id : string;
    title : string;
    order_index : number;
}

export interface ElearningLessons {
    id? : string;
    module_id : string;
    title : string;
    type : ElearningMediaType;
    page_slug : string;
    media_file_url : string;
    quiz_id : string;
    order_index : number;
    min_complete_minute : number;
}

// For creating a lesson
export type ElearningLessonsCreate = Omit<ElearningLessons, 'id' | 'module_id'>;

// For creating a module
// It will contain the lessons to be created.
export type ElearningModuleCreate = Omit<ElearningModule, 'id' | 'course_id'> & {
    lessons: ElearningLessonsCreate[];
};

// For creating a course, we omit all server-generated fields.
// It will contain the modules to be created.
export type ElearningCoursesCreate = Omit<Elearning, 'id' | 'rating' | 'created_at' | 'updated_at' | 'updated_by' | 'category'> & {
    modules: ElearningModuleCreate[];
    category: string[]; // keep a list of category id only for create Elearning_CoursesCategoryList
};

export type ElearningCourseGet = Elearning & {
    modules: ElearningModuleCreate[] | string ;
    is_enrolled: boolean;
};