import axios from 'axios';
import { ELEARNING_URL } from '../constants/endpoints';
import { PageUpdate } from '../ui/App/Interfaces/interface';

const BASE_URL = ELEARNING_URL || 'http://localhost:4080/elearning';

export async function createPage(pageData) {
  try {
    const response = await axios.post(`${BASE_URL}/pages`, pageData);
    return response.data;
  } catch (error) {
    throw error;
  }
}

export async function getPageBySlug(slug) {
  try {
    const response = await axios.get(`${BASE_URL}/pages/slug/${slug}`);
    return response.data;
  } catch (error) {
    throw error;
  }
}

export async function getPageById(id) {
  try {
    const response = await axios.get(`${BASE_URL}/pages/${id}`);
    return response.data;
  } catch (error) {
    throw error;
  }
}

export async function fetchAllPages() {
  try {
    const response = await axios.get(`${BASE_URL}/pages`);
    return response.data;
  } catch (error) {
    throw error;
  }
}

export async function deletePageById(id) {
  try {
    const response = await axios.delete(`${BASE_URL}/pages/${id}`);
    return response.data;
  } catch (error) {
    throw error;
  }
}

export async function updatePageById(id, pageData: PageUpdate) {
  try {
    const response = await axios.put(`${BASE_URL}/pages/${id}`, pageData);
    return response.data;
  } catch (error) {
    throw error;
  }
}