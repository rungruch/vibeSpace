elearning related table
1. Elearning_Course
2. Elearning_Module
3. Elearning_Lessons
4. Elearning_CoursesCertificate
5. Elearning_CoursesCategory

6. Elearning_Enrollments
7. Elearning_Progress

8. Elearning_CoursesTeacher

9. Elearning_CoursesRatings

CREATE COURSES
- Each Course have own Module and Lessons another course cannot use others Modules and Lessons but duplicate

create Elearning_CoursesCategory(if any) -> Elearning_Courses -> Elearning_CoursesCategoryList -> Elearning_Module -> Elearning_Lessons -> CoursesCategory


REGISTER COURSES
create Elearning_Enrollments

Start Lessons
create Elearning_Progress

Next Lessons
update current Elearning_Progress -> crete new Elearning_Progress