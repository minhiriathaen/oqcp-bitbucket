import axios from 'axios';

const openQualityCheckerApi = axios.create({
  baseURL: process.env.OQC_BASE_URL,
});

openQualityCheckerApi.interceptors.request.use(async (config) => ({
  ...config,
  headers: {
    ...config.headers,
    token: config.params.userToken,
  },
}));

export default openQualityCheckerApi;
