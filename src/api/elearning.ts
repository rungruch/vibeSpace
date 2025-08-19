import axios from 'axios';
import { ELEARNING_URL } from '../constants/endpoints';
import { Elearning, ElearningCategory, ElearningModule, ElearningLessons } from '../ui/App/Interfaces/elearning';

const BASE_URL = ELEARNING_URL || 'http://localhost:4080/elearning';

// COURSES CATEGORY

export async function fetchAllCoursesCategory() {
  try {
    const response = await axios.get(`${BASE_URL}/courses/categories`, {
    });
    return response.data;
  } catch (error) {
    throw error;
  }
}

export async function createCourseCategory(categoryData) {
  try {
    const response = await axios.post(`${BASE_URL}/courses/categories`, categoryData);
    return response.data;
  } catch (error) {
    throw error;
  }
}

export async function deleteCourseCategory(categoryId) {
  try {
    const response = await axios.delete(`${BASE_URL}/courses/categories/${categoryId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
}


// COURSES 

export async function createCourses(courseData) {
  try {
    const response = await axios.post(`${BASE_URL}/courses`, courseData);
    return response.data;
  } catch (error) {
    throw error;
  }
}
