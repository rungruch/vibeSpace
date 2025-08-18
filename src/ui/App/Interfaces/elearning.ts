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
    page_id : string;
    media_file_id : string;
    quiz_id : string;
    order_index : number;
    }