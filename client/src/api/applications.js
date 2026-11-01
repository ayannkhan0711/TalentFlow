import api from './client';

export const applyToJobApi = async (jobId, formData) => {
  const response = await api.post(`/jobs/${jobId}/applications`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const getMyApplicationsApi = async () => {
  const response = await api.get('/applications/mine');
  return response.data;
};

export const withdrawApplicationApi = async (id) => {
  const response = await api.patch(`/applications/${id}/withdraw`);
  return response.data;
};

export const getJobApplicationsApi = async (jobId, stage) => {
  const params = stage ? { stage } : {};
  const response = await api.get(`/jobs/${jobId}/applications`, { params });
  return response.data;
};

export const updateApplicationStageApi = async (id, stage, note) => {
  const response = await api.patch(`/applications/${id}/stage`, { stage, note });
  return response.data;
};

export const getApplicationActivityApi = async (id) => {
  const response = await api.get(`/applications/${id}/activity`);
  return response.data;
};

/**
 * Downloads or opens an authorized file (resume) through the auth interceptor
 */
export const openAuthorizedFile = async (fileUrl, filename = 'resume.pdf') => {
  try {
    const response = await api.get(fileUrl, {
      responseType: 'blob',
    });
    const blob = new Blob([response.data], {
      type: response.headers['content-type'] || 'application/pdf',
    });
    const blobUrl = window.URL.createObjectURL(blob);
    window.open(blobUrl, '_blank');
    // Clean up after 1 minute
    setTimeout(() => window.URL.revokeObjectURL(blobUrl), 60000);
  } catch (err) {
    throw new Error('Unable to download resume file: ' + err.message);
  }
};
