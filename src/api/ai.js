// src/api/ai.ts
import axios from 'axios';

export const fetchBillAnalysis = (payload) =>
  axios.post('http://localhost:8800/api/ai/analysis', payload).then(res => res.data);

