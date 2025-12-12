const API_PORT = '8080'
const API_BASE_PATH = `http://localhost:${API_PORT}/v1/api`

export const API_URLS = {

  register: API_BASE_PATH + '/auth/register',
  login: API_BASE_PATH + '/auth/login',
  personal_data: API_BASE_PATH + '/user/my-data',
  posts: API_BASE_PATH + '/post',
  area: API_BASE_PATH + '/area',
  buildings: API_BASE_PATH + '/building',
  users_to_add: API_BASE_PATH + '/user/to-add',
  add_user_to_building: API_BASE_PATH + '/building/user',
  create_event: API_BASE_PATH + '/post/event',
  create_announcement: API_BASE_PATH + '/post/announcement',
  get_managers_area: API_BASE_PATH + '/area'


} as const;
