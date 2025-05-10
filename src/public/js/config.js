const CONFIG = {
  API_URL: "/api",
  ROUTES: {
    AUTH: {
      REGISTER: "/auth/register",
      LOGIN: "/auth/login",
      LOGOUT: "/auth/logout",
      ME: "/auth/me",
      FORGOT_PASSWORD: "/auth/forgotpassword",
      RESET_PASSWORD: "/auth/resetpassword",
    },
    COURSES: {
      BASE: "/courses",
      ENROLLED: "/courses/enrolled",
      ENROLL: "/courses/:id/enroll",
    },
    ASSIGNMENTS: {
      BASE: "/assignments",
      BY_COURSE: "/assignments/course/:courseId",
    },
    SUBMISSIONS: {
      BASE: "/submissions",
      BY_ASSIGNMENT: "/submissions/assignment/:assignmentId",
      GRADE: "/submissions/:id/grade",
    },
    USERS: {
      BASE: "/users",
      UPDATE_PROFILE: "/users/updateprofile",
      UPDATE_PASSWORD: "/users/updatepassword",
    },
  },
  TOAST_DURATION: 3000,
};
