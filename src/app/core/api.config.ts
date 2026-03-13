import { environment } from "../../environments/environment";

const UNITE_API_BASE_PATH = environment.unite_ApiUrl;
const UNITE_CHATTING_UNITE_API_BASE_PATH = environment.unite_chatting_ApiUrl;

export const API_URLS = {

  register: UNITE_API_BASE_PATH + '/auth/register',
  login: UNITE_API_BASE_PATH + '/auth/login',
  personal_data: UNITE_API_BASE_PATH + '/user/my-data',
  user_meta_info: UNITE_API_BASE_PATH + '/user/meta-info',
  posts: UNITE_API_BASE_PATH + '/post',
  area: UNITE_API_BASE_PATH + '/area',
  buildings: UNITE_API_BASE_PATH + '/building',
  users_to_add: UNITE_API_BASE_PATH + '/user/to-add',
  add_user_to_building: UNITE_API_BASE_PATH + '/building/user',
  announcements: UNITE_API_BASE_PATH + '/post/announcement',
  events: UNITE_API_BASE_PATH + '/post/event',
  conversations: UNITE_CHATTING_UNITE_API_BASE_PATH + '/conversation',
  messages: UNITE_CHATTING_UNITE_API_BASE_PATH + '/message',
  create_event: UNITE_API_BASE_PATH + '/post/event',
  create_announcement: UNITE_API_BASE_PATH + '/post/announcement',
  get_managers_area: UNITE_API_BASE_PATH + '/area',
  polls: UNITE_API_BASE_PATH + '/poll',
  facility: UNITE_API_BASE_PATH + '/facility',
  create_facilities: UNITE_API_BASE_PATH + '/building/facilities',
  facility_reserve: UNITE_API_BASE_PATH + '/facility/reserve',
  issue: UNITE_API_BASE_PATH + '/issue',
  building_issues: UNITE_API_BASE_PATH + '/issue/building',
  area_issues: UNITE_API_BASE_PATH + '/issue/area',
  facility_issues: UNITE_API_BASE_PATH + '/issue/facility',
  poll_issues: UNITE_API_BASE_PATH + '/issue/poll',
  
  // Manager notifications
  notifications: UNITE_API_BASE_PATH + '/notification',
  notification_seen: UNITE_API_BASE_PATH + '/notification',

  // Offerings
  offering: UNITE_API_BASE_PATH + '/offering',

  // Group conversations
  users_in_area: UNITE_API_BASE_PATH + '/user/in-area',
  group_conversation: UNITE_CHATTING_UNITE_API_BASE_PATH + '/conversation/group'

} as const;
