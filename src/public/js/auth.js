const Auth = {
  user: null,

  isAuthenticated: () => {
    return !!Auth.user;
  },

  getRole: () => {
    return Auth.user ? Auth.user.role : null;
  },

  init: async () => {
    try {
      const response = await API.auth.getMe();
      Auth.user = response.user;
      document.body.setAttribute("data-role", Auth.user.role);
      return true;
    } catch (error) {
      Auth.user = null;
      return false;
    }
  },

  register: async (userData) => {
    try {
      const response = await API.auth.register(userData);
      Auth.user = response.user;
      document.body.setAttribute("data-role", Auth.user.role);
      return response;
    } catch (error) {
      throw error;
    }
  },

  login: async (credentials) => {
    try {
      const response = await API.auth.login(credentials);
      Auth.user = response.user;
      document.body.setAttribute("data-role", Auth.user.role);
      return response;
    } catch (error) {
      throw error;
    }
  },

  logout: async () => {
    try {
      await API.auth.logout();
      Auth.user = null;
      document.body.removeAttribute("data-role");
      Router.navigate("login");
    } catch (error) {
      console.error("Logout error:", error);
    }
  },

  forgotPassword: async (email) => {
    try {
      return await API.auth.forgotPassword(email);
    } catch (error) {
      throw error;
    }
  },

  resetPassword: async (resetToken, password) => {
    try {
      const response = await API.auth.resetPassword(resetToken, password);
      Auth.user = response.user;
      document.body.setAttribute("data-role", Auth.user.role);
      return response;
    } catch (error) {
      throw error;
    }
  },
};
