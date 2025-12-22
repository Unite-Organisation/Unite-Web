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
  announcements: API_BASE_PATH + '/post/announcement',
  events: API_BASE_PATH + '/post/event',
  conversations: API_BASE_PATH + '/conversation',
  messages: API_BASE_PATH + '/message',
  create_event: API_BASE_PATH + '/post/event',
  create_announcement: API_BASE_PATH + '/post/announcement',
  get_managers_area: API_BASE_PATH + '/area',
  polls: API_BASE_PATH + '/poll',
  facility: API_BASE_PATH + '/facility',
  create_facilities: API_BASE_PATH + '/building/facilities',
  facility_reserve: API_BASE_PATH + '/facility/reserve',
  issue: API_BASE_PATH + '/issue',
  building_issues: API_BASE_PATH + '/issue/building',
  area_issues: API_BASE_PATH + '/issue/area',
  facility_issues: API_BASE_PATH + '/issue/facility',
  poll_issues: API_BASE_PATH + '/issue/poll',
  
  // Manager notifications
  notifications: API_BASE_PATH + '/notification',
  notification_seen: API_BASE_PATH + '/notification',

  // Offerings
  offering: API_BASE_PATH + '/offering',

  // Group conversations
  users_in_area: API_BASE_PATH + '/user/in-area',
  group_conversation: API_BASE_PATH + '/conversation/group'

} as const;
