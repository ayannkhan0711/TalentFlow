import api from './client';

export const getJobsApi = async (params = {}) => {
  const response = await api.get('/jobs', { params });
  return response.data;
};

export const getJobByIdApi = async (id) => {
  const response = await api.get(`/jobs/${id}`);
  return response.data;
};

export const getMyJobsApi = async () => {
  const response = await api.get('/jobs/mine');
  return response.data;
};

export const createJobApi = async (jobData) => {
  const response = await api.post('/jobs', jobData);
  return response.data;
};

export const updateJobApi = async (id, jobData) => {
  const response = await api.put(`/jobs/${id}`, jobData);
  return response.data;
};

export const updateJobStatusApi = async (id, status) => {
  const response = await api.patch(`/jobs/${id}/status`, { status });
  return response.data;
};

export const deleteJobApi = async (id) => {
  const response = await api.delete(`/jobs/${id}`);
  return response.data;
};
