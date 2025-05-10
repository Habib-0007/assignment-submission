const Utils = {
  formatDate: (dateString) => {
    const options = {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  },

  formatDateForInput: (dateString) => {
    const date = new Date(dateString);
    return date.toISOString().slice(0, 16);
  },

  showToast: (message, type = "success") => {
    const toast = document.getElementById("toast");
    toast.textContent = message;
    toast.className = `toast ${type} show`;

    setTimeout(() => {
      toast.className = "toast";
    }, Utils.TOAST_DURATION);
  },

  showModal: (templateId, setupCallback) => {
    const modalContainer = document.getElementById("modal-container");
    const template = document.getElementById(templateId);

    if (!template) return;

    const modalContent = template.content.cloneNode(true);
    modalContainer.innerHTML = "";
    modalContainer.appendChild(modalContent);

    const closeBtn = modalContainer.querySelector(".close-modal");
    if (closeBtn) {
      closeBtn.addEventListener("click", () => {
        modalContainer.innerHTML = "";
      });
    }

    modalContainer.querySelector(".modal").addEventListener("click", (e) => {
      if (e.target.classList.contains("modal")) {
        modalContainer.innerHTML = "";
      }
    });

    if (setupCallback && typeof setupCallback === "function") {
      setupCallback(modalContainer);
    }
  },

  replaceUrlParams: (url, params) => {
    let result = url;
    for (const key in params) {
      result = result.replace(`:${key}`, params[key]);
    }
    return result;
  },

  truncateText: (text, maxLength = 100) => {
    if (!text) return "";
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  },

  showPageLoader: (container, message = "Loading...") => {
    const template = document.getElementById("page-loader-template");
    if (!template) return;

    const loader = template.content.cloneNode(true);
    if (message !== "Loading...") {
      loader.querySelector("p").textContent = message;
    }

    container.innerHTML = "";
    container.appendChild(loader);
  },

  showLoader: (container) => {
    const template = document.getElementById("loader-template");
    if (!template) return;

    const loader = template.content.cloneNode(true);
    container.appendChild(loader);

    return container.querySelector(".loader-container");
  },

  removeLoader: (container) => {
    const loader = container.querySelector(".loader-container");
    if (loader) {
      loader.remove();
    }
  },

  showSkeletonLoading: (container, templateId, count = 3) => {
    const template = document.getElementById(templateId);
    if (!template) return;

    container.innerHTML = "";

    for (let i = 0; i < count; i++) {
      const skeleton = template.content.cloneNode(true);
      container.appendChild(skeleton);
    }
  },

  addButtonLoader: (button, originalText) => {
    if (!originalText) {
      originalText = button.textContent;
      button.dataset.originalText = originalText;
    }

    const spinner = document.createElement("span");
    spinner.className = "spinner";

    button.disabled = true;
    button.insertBefore(spinner, button.firstChild);
    button.textContent = " Loading...";
    button.insertBefore(spinner, button.firstChild);

    return originalText;
  },

  removeButtonLoader: (button, text) => {
    if (!text && button.dataset.originalText) {
      text = button.dataset.originalText;
    }

    const spinner = button.querySelector(".spinner");
    if (spinner) {
      spinner.remove();
    }

    button.disabled = false;
    button.textContent = text || "Submit";
  },

  TOAST_DURATION: 3000,
};
