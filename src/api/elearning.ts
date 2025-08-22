import axios from "axios";
import { ELEARNING_URL } from "../constants/endpoints";
import {
  Elearning,
  ElearningCategory,
  ElearningModule,
  ElearningLessons,
} from "../ui/App/Interfaces/elearning";
import { ElearningEnrollmentsStatus } from "../ui/App/Enum/elearning.ts";

const BASE_URL = ELEARNING_URL || "http://localhost:4080/elearning";

// COURSES CATEGORY

export async function fetchAllCoursesCategory() {
  try {
    const response = await axios.get(`${BASE_URL}/courses/categories`, {});
    return response.data;
  } catch (error) {
    throw error;
  }
}

export async function createCourseCategory(categoryData) {
  try {
    const response = await axios.post(
      `${BASE_URL}/courses/categories`,
      categoryData
    );
    return response.data;
  } catch (error) {
    throw error;
  }
}

export async function deleteCourseCategory(categoryId) {
  try {
    const response = await axios.delete(
      `${BASE_URL}/courses/categories/${categoryId}`
    );
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

export async function getCourseBySlug(slug) {
  try {
    const response = await axios.get(`${BASE_URL}/courses/slug/${slug}`);
    return response.data;
  } catch (error) {
    throw error;
  }
}

export async function getCourseAndEnrollStatusBySlug(slug, data) {
  try {
    const response = await axios.post(`${BASE_URL}/courses/slug/${slug}`, data);
    return response.data;
  } catch (error) {
    throw error;
  }
}

export async function enrollCourses(courseId, userId) {
  try {
    const response = await axios.post(`${BASE_URL}/courses/enroll`, {
      userId: userId,
      courseId: courseId,
      status: ElearningEnrollmentsStatus.Enrolled
    });
    return response.data;
  } catch (error) {
    throw error;
  }
}
export async function updateEnrollCourses(id, courseId, userId) {
  try {
    const response = await axios.put(`${BASE_URL}/courses/enroll`, {
      id: id,
      userId: userId,
      courseId: courseId,
    });
    return response.data;
  } catch (error) {
    throw error;
  }
}
