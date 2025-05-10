
const API = {
  
  fetch: async (endpoint, options = {}) => {
    const url = `${CONFIG.API_URL}${endpoint}`;

    
    const headers = {
      "Content-Type": "application/json",
      ...options.headers,
    };

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        credentials: "include", 
      });

      
      const data = await response.json();

      
      if (!response.ok) {
        throw new Error(data.error || "Something went wrong");
      }

      return data;
    } catch (error) {
      console.error("API Error:", error);
      throw error;
    }
  },

  
  uploadFile: async (endpoint, formData, options = {}) => {
    const url = `${CONFIG.API_URL}${endpoint}`;

    try {
      const response = await fetch(url, {
        method: "POST",
        body: formData,
        credentials: "include",
        ...options,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Something went wrong");
      }

      return data;
    } catch (error) {
      console.error("API Upload Error:", error);
      throw error;
    }
  },

  
  auth: {
    register: (userData) => {
      return API.fetch(CONFIG.ROUTES.AUTH.REGISTER, {
        method: "POST",
        body: JSON.stringify(userData),
      });
    },

    login: (credentials) => {
      return API.fetch(CONFIG.ROUTES.AUTH.LOGIN, {
        method: "POST",
        body: JSON.stringify(credentials),
      });
    },

    logout: () => {
      return API.fetch(CONFIG.ROUTES.AUTH.LOGOUT);
    },

    getMe: () => {
      return API.fetch(CONFIG.ROUTES.AUTH.ME);
    },

    forgotPassword: (email) => {
      return API.fetch(CONFIG.ROUTES.AUTH.FORGOT_PASSWORD, {
        method: "POST",
        body: JSON.stringify({ email }),
      });
    },

    resetPassword: (resetToken, password) => {
      return API.fetch(
        Utils.replaceUrlParams(CONFIG.ROUTES.AUTH.RESET_PASSWORD, {
          resetToken,
        }),
        {
          method: "PUT",
          body: JSON.stringify({ password }),
        }
      );
    },
  },

  
  courses: {
    getAll: () => {
      return API.fetch(CONFIG.ROUTES.COURSES.BASE);
    },

    getOne: (id) => {
      return API.fetch(`${CONFIG.ROUTES.COURSES.BASE}/${id}`);
    },

    create: (courseData) => {
      return API.fetch(CONFIG.ROUTES.COURSES.BASE, {
        method: "POST",
        body: JSON.stringify(courseData),
      });
    },

    update: (id, courseData) => {
      return API.fetch(`${CONFIG.ROUTES.COURSES.BASE}/${id}`, {
        method: "PUT",
        body: JSON.stringify(courseData),
      });
    },

    delete: (id) => {
      return API.fetch(`${CONFIG.ROUTES.COURSES.BASE}/${id}`, {
        method: "DELETE",
      });
    },

    enroll: (id) => {
      return API.fetch(
        Utils.replaceUrlParams(CONFIG.ROUTES.COURSES.ENROLL, { id }),
        {
          method: "POST",
        }
      );
    },

    getEnrolled: () => {
      return API.fetch(CONFIG.ROUTES.COURSES.ENROLLED);
    },
  },

  
  assignments: {
    getAll: () => {
      return API.fetch(CONFIG.ROUTES.ASSIGNMENTS.BASE);
    },

    getOne: (id) => {
      return API.fetch(`${CONFIG.ROUTES.ASSIGNMENTS.BASE}/${id}`);
    },

    create: (assignmentData) => {
      return API.fetch(CONFIG.ROUTES.ASSIGNMENTS.BASE, {
        method: "POST",
        body: JSON.stringify(assignmentData),
      });
    },

    update: (id, assignmentData) => {
      return API.fetch(`${CONFIG.ROUTES.ASSIGNMENTS.BASE}/${id}`, {
        method: "PUT",
        body: JSON.stringify(assignmentData),
      });
    },

    delete: (id) => {
      return API.fetch(`${CONFIG.ROUTES.ASSIGNMENTS.BASE}/${id}`, {
        method: "DELETE",
      });
    },

    getByCourse: (courseId) => {
      return API.fetch(
        Utils.replaceUrlParams(CONFIG.ROUTES.ASSIGNMENTS.BY_COURSE, {
          courseId,
        })
      );
    },
  },

  
  submissions: {
    getAll: () => {
      return API.fetch(CONFIG.ROUTES.SUBMISSIONS.BASE);
    },

    getOne: (id) => {
      return API.fetch(`${CONFIG.ROUTES.SUBMISSIONS.BASE}/${id}`);
    },

    create: (submissionData, file) => {
      if (!file && !submissionData.textAnswer) {
        throw new Error("Please provide either text answer or a file");
      }

      const formData = new FormData();
      formData.append("assignmentId", submissionData.assignmentId);

      if (submissionData.textAnswer) {
        formData.append("textAnswer", submissionData.textAnswer);
      }

      if (file) {
        formData.append("file", file);
      }

      return API.uploadFile(CONFIG.ROUTES.SUBMISSIONS.BASE, formData);
    },

    update: (id, submissionData, file) => {
      const formData = new FormData();

      if (submissionData.textAnswer) {
        formData.append("textAnswer", submissionData.textAnswer);
      }

      if (file) {
        formData.append("file", file);
      }

      return API.uploadFile(
        `${CONFIG.ROUTES.SUBMISSIONS.BASE}/${id}`,
        formData,
        {
          method: "PUT",
        }
      );
    },

    grade: (id, gradeData) => {
      return API.fetch(
        Utils.replaceUrlParams(CONFIG.ROUTES.SUBMISSIONS.GRADE, { id }),
        {
          method: "PUT",
          body: JSON.stringify(gradeData),
        }
      );
    },

    getByAssignment: (assignmentId) => {
      return API.fetch(
        Utils.replaceUrlParams(CONFIG.ROUTES.SUBMISSIONS.BY_ASSIGNMENT, {
          assignmentId,
        })
      );
    },
  },

  
  users: {
    updateProfile: (profileData) => {
      return API.fetch(CONFIG.ROUTES.USERS.UPDATE_PROFILE, {
        method: "PUT",
        body: JSON.stringify(profileData),
      });
    },

    updatePassword: (passwordData) => {
      return API.fetch(CONFIG.ROUTES.USERS.UPDATE_PASSWORD, {
        method: "PUT",
        body: JSON.stringify(passwordData),
      });
    },
  },
};
