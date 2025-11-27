const API_PORT = '8080'
const API_BASE_PATH = `http://localhost:${API_PORT}/v1/api`

export const API_URLS = {

  register: API_BASE_PATH + '/auth/register',
  login: API_BASE_PATH + '/auth/login',
  personal_data: API_BASE_PATH + '/user/my-data',
  posts: API_BASE_PATH + '/post'

} as const;
