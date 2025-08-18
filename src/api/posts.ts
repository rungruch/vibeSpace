import axios from 'axios';
import { ELEARNING_URL } from '../constants/endpoints';
import { PageUpdate } from '../ui/interface';

const BASE_URL = ELEARNING_URL || 'http://localhost:4080/elearning';

// POST CATEGORY

export async function fetchAllPostsCategory() {
  try {
    const response = await axios.get(`${BASE_URL}/posts/categories`, {
    });
    return response.data;
  } catch (error) {
    throw error;
  }
}

export async function createPostCategory(categoryData) {
  try {
    const response = await axios.post(`${BASE_URL}/posts/categories`, categoryData);
    return response.data;
  } catch (error) {
    throw error;
  }
}

export async function deletePostCategory(categoryId) {
  try {
    const response = await axios.delete(`${BASE_URL}/posts/categories/${categoryId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
}

// POSTS

export async function fetchAllPosts(isActiveOnly: boolean, size: number, last_item: string | null) {
  try {
    const response = await axios.post(`${BASE_URL}/posts/list`, {
      isActiveOnly,
      size,
      last_item
    });
    return response.data;
  } catch (error) {
    throw error;
  }
}

export async function createPost(postData) {
  try {
    const response = await axios.post(`${BASE_URL}/posts`, postData);
    return response.data;
  } catch (error) {
    throw error;
  }
}

export async function getPostById(postId) {
  try {
    const response = await axios.get(`${BASE_URL}/posts/${postId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
}

export async function getPostBySlug(slug) {
  try {
    const response = await axios.get(`${BASE_URL}/posts/slug/${slug}`);
    return response.data;
  } catch (error) {
    throw error;
  }
}

export async function deletePostById(postId) {
  try {
    const response = await axios.delete(`${BASE_URL}/posts/${postId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
}

export async function updatePostById(id, postData) {
  try {
    const response = await axios.put(`${BASE_URL}/posts/${id}`, postData);
    return response.data;
  } catch (error) {
    throw error;
  }
}