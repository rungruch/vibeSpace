import axios from 'axios';
import { ELEARNING_URL } from '../constants/endpoints';
import { FileSubmit } from '../ui/App/Interfaces/interface';

const BASE_URL = ELEARNING_URL || 'http://localhost:4080/elearning';

// export const uploadFile = async (file) => {
//   const formData = new FormData();
//   formData.append('file', file);
//   const res = await axios.post(`${BASE_URL}/file/upload`, formData, {
//     headers: {
//       'Content-Type': 'multipart/form-data',
//     },
//   });
//   return res.data;
// };


export const uploadFile = async (file: File, fileSubmit: FileSubmit) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('fileSubmit', JSON.stringify(fileSubmit));
  const res = await axios.post(`${BASE_URL}/file/upload`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return res.data;
};

export const getHost = async () => {
  const res = await axios.get(`${BASE_URL}/file/get/host`);
  return res.data;
};

export const getFiles = async () => { // get files list
  const res = await axios.get(`${BASE_URL}/files`);
  return res.data;
};

export const deleteFile = async ({ id, path }: { id: string, path: string }) => {
  const res = await axios.post(`${BASE_URL}/file/delete`, { id, path });
  return res.data;
};


