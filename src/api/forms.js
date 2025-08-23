import axios from 'axios';
import { ELEARNING_URL } from '../constants/endpoints';

const BASE_URL = ELEARNING_URL || 'http://localhost:4080/elearning';

export async function fetchAllForms(uid) {
  try {
    const response = await axios.get(`${BASE_URL}/forms?uid=${uid}`);
    return response.data;
  } catch (error) {
    throw error;
  }
}

export async function fetchFormById(formId, uid) {
  try {
    if(uid) {
      const response = await axios.get(`${BASE_URL}/forms/${formId}?uid=${uid}`);
      return response.data;
    }else {
      const response = await axios.get(`${BASE_URL}/forms/${formId}`);
      return response.data;
    }
  } catch (error) {
    throw error;
  }
}

export async function fetchFormBySlug(slug) {
  try {
    const response = await axios.get(`${BASE_URL}/forms/slug/${slug}`);
    return response.data;
  } catch (error) {
    throw error;
  }
}

export async function createForm(formData) {
  try {
    const response = await axios.post(`${BASE_URL}/forms`, formData);
    return response.data;
  } catch (error) {
    throw error;
  }
}

export async function formSubmit(formData) {
  try {
    const response = await axios.post(`${BASE_URL}/forms/submit`, formData);
    return response.data;
  } catch (error) {
    throw error;
  }
}

export async function updateForm(formId, formData) {
  try {
    const response = await axios.put(`${BASE_URL}/forms/${formId}`, formData);
    return response.data;
  } catch (error) {
    throw error;
  }
}

export async function deleteForm(formId) {
  try {
    const response = await axios.delete(`${BASE_URL}/forms/${formId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
}

export async function getResponses(formId) {
  try {
    const response = await axios.get(`${BASE_URL}/forms/responses/${formId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
}

export async function getUserFormResponsesCount(formId, uid) {
  try {
    const response = await axios.get(`${BASE_URL}/forms/responses/${formId}/count?uid=${uid}`);
    return response.data;
  } catch (error) {
    throw error;
  }
}