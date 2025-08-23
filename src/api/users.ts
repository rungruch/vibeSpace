import axios from "axios";
import { ELEARNING_URL } from "../constants/endpoints";

const BASE_URL = ELEARNING_URL || "http://localhost:4080/elearning";

// internal - employee approach
export async function fetchUserByEmpoyeeID(eID:string) {
  try {
    const response = await axios.get(`${BASE_URL}/users/eid/${eID}`);
    return response.data;
  } catch (error) {
    throw error;
  }
}

// generic approach
export async function fetchUserByID() {}

export async function createUser(data: any) {
  try {
    const response = await axios.post(`${BASE_URL}/users`, data);
    return response.data;
  } catch (error) {
    throw error;
  }
}
