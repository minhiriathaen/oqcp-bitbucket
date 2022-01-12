import axios from 'axios';
import jwt_decode, { JwtPayload } from 'jwt-decode';

const pluginApi = axios.create({
  baseURL: '/api',
});

let jwt = new URLSearchParams(window.location.search).get('jwt');
let timerId: ReturnType<typeof setTimeout>;

function setJwt(value: string) {
  jwt = value;
}

function renewJwtBeforeExp() {
  if (jwt) {
    const expTime = jwt_decode<JwtPayload>(jwt).exp;

    if (expTime) {
      if (timerId) {
        clearTimeout(timerId);
      }

      const timeout = expTime * 1000 - new Date().getTime() - 60000;

      timerId = setTimeout(async () => {
        await pluginApi.get<void>('/renewJwt');
      }, timeout);
    }
  }
}

renewJwtBeforeExp();

pluginApi.interceptors.request.use(async (config) => ({
  ...config,
  headers: { ...config.headers, Authorization: `JWT ${jwt}` },
}));

pluginApi.interceptors.response.use((response) => {
  setJwt(response.headers['x-acpt']);
  renewJwtBeforeExp();

  return response;
});

export default pluginApi;
