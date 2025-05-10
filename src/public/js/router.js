const Router = {
  currentRoute: null,

  routes: {
    login: {
      render: () => UI.auth.renderLogin(),
      requiresAuth: false,
    },
    register: {
      render: () => UI.auth.renderRegister(),
      requiresAuth: false,
    },
    "forgot-password": {
      render: () => UI.auth.renderForgotPassword(),
      requiresAuth: false,
    },
    dashboard: {
      render: () => UI.dashboard.renderDashboard(),
      requiresAuth: true,
    },
  },

  init: async () => {
    const isAuthenticated = await Auth.init();

    const hash = window.location.hash.substring(1);
    const route = hash || (isAuthenticated ? "dashboard" : "login");

    Router.navigate(route);

    window.addEventListener("hashchange", () => {
      const hash = window.location.hash.substring(1);
      if (hash) {
        Router.navigate(hash);
      }
    });
  },

  navigate: (route) => {
    const routeConfig = Router.routes[route];

    if (!routeConfig) {
      window.location.hash = "#login";
      return;
    }

    if (routeConfig.requiresAuth && !Auth.isAuthenticated()) {
      window.location.hash = "#login";
      return;
    }

    Router.currentRoute = route;

    if (window.location.hash.substring(1) !== route) {
      window.location.hash = `#${route}`;
    }

    routeConfig.render();
  },
};
