const UI = {
  init: () => {
    document.addEventListener("click", (e) => {
      if (e.target.id === "logout-btn") {
        e.preventDefault();

        const logoutBtn = e.target;
        const originalText = Utils.addButtonLoader(logoutBtn);

        Auth.logout().finally(() => {
          Utils.removeButtonLoader(logoutBtn, originalText);
        });
      }
    });
  },

  renderTemplate: (templateId, container, data = {}) => {
    const template = document.getElementById(templateId);
    if (!template) return;

    const content = template.content.cloneNode(true);

    if (Object.keys(data).length > 0) {
      const elements = content.querySelectorAll("[id]");
      elements.forEach((el) => {
        const id = el.id;
        if (data[id]) {
          el.textContent = data[id];
        }
      });
    }

    container.innerHTML = "";
    container.appendChild(content);

    return container.firstElementChild;
  },

  auth: {
    renderLogin: () => {
      const content = document.getElementById("content");
      const loginUI = UI.renderTemplate("login-template", content);

      const form = loginUI.querySelector("#login-form");
      form.addEventListener("submit", async (e) => {
        e.preventDefault();

        const submitBtn = form.querySelector('button[type="submit"]');
        const emailInput = form.email;
        const passwordInput = form.password;

        submitBtn.disabled = true;
        emailInput.disabled = true;
        passwordInput.disabled = true;

        Utils.addButtonLoader(submitBtn);

        try {
          const email = emailInput.value;
          const password = passwordInput.value;

          await Auth.login({ email, password });
          Router.navigate("dashboard");
          Utils.showToast("Logged in successfully");
        } catch (error) {
          Utils.showToast(error.message, "error");
        } finally {
          submitBtn.disabled = false;
          emailInput.disabled = false;
          passwordInput.disabled = false;

          Utils.removeButtonLoader(submitBtn, "Sign In");
        }
      });

      const registerLink = loginUI.querySelector("#register-link");
      registerLink.addEventListener("click", (e) => {
        e.preventDefault();
        Router.navigate("register");
      });

      const forgotPasswordLink = loginUI.querySelector("#forgot-password-link");
      forgotPasswordLink.addEventListener("click", (e) => {
        e.preventDefault();
        Router.navigate("forgot-password");
      });
    },

    renderRegister: () => {
      const content = document.getElementById("content");
      const registerUI = UI.renderTemplate("register-template", content);

      const form = registerUI.querySelector("#register-form");
      form.addEventListener("submit", async (e) => {
        e.preventDefault();

        const submitBtn = form.querySelector('button[type="submit"]');
        const formInputs = form.querySelectorAll("input, select");

        submitBtn.disabled = true;
        formInputs.forEach((input) => (input.disabled = true));

        Utils.addButtonLoader(submitBtn);

        try {
          const name = form.name.value;
          const email = form.email.value;
          const password = form.password.value;
          const role = form.role.value;

          await Auth.register({ name, email, password, role });
          Router.navigate("dashboard");
          Utils.showToast("Account created successfully");
        } catch (error) {
          Utils.showToast(error.message, "error");
        } finally {
          submitBtn.disabled = false;
          formInputs.forEach((input) => (input.disabled = false));

          Utils.removeButtonLoader(submitBtn, "Create Account");
        }
      });

      const loginLink = registerUI.querySelector("#login-link");
      loginLink.addEventListener("click", (e) => {
        e.preventDefault();
        Router.navigate("login");
      });
    },

    renderForgotPassword: () => {
      const content = document.getElementById("content");
      const forgotPasswordUI = UI.renderTemplate(
        "forgot-password-template",
        content
      );

      const form = forgotPasswordUI.querySelector("#forgot-password-form");
      form.addEventListener("submit", async (e) => {
        e.preventDefault();

        const submitBtn = form.querySelector('button[type="submit"]');
        const emailInput = form.email;

        submitBtn.disabled = true;
        emailInput.disabled = true;

        Utils.addButtonLoader(submitBtn);

        try {
          const email = emailInput.value;

          await Auth.forgotPassword(email);
          Utils.showToast("Password reset email sent");
          Router.navigate("login");
        } catch (error) {
          Utils.showToast(error.message, "error");
        } finally {
          submitBtn.disabled = false;
          emailInput.disabled = false;

          Utils.removeButtonLoader(submitBtn, "Send Reset Link");
        }
      });

      const backToLoginLink = forgotPasswordUI.querySelector("#back-to-login");
      backToLoginLink.addEventListener("click", (e) => {
        e.preventDefault();
        Router.navigate("login");
      });
    },
  },

  dashboard: {
    renderDashboard: async () => {
      const content = document.getElementById("content");
      const dashboardUI = UI.renderTemplate("dashboard-template", content);

      const userNameEl = dashboardUI.querySelector("#user-name");
      userNameEl.textContent = Auth.user.name;

      const navLinks = dashboardUI.querySelectorAll(".nav-links a");
      navLinks.forEach((link) => {
        link.addEventListener("click", (e) => {
          e.preventDefault();

          navLinks.forEach((l) => l.classList.remove("active"));

          e.target.classList.add("active");

          const page = e.target.getAttribute("data-page");
          UI.dashboard.renderPage(page);
        });
      });

      UI.dashboard.renderPage("dashboard");
    },

    renderPage: (page) => {
      const dashboardContent = document.getElementById("dashboard-content");

      Utils.showPageLoader(dashboardContent, `Loading ${page}...`);

      setTimeout(() => {
        switch (page) {
          case "dashboard":
            UI.dashboard.renderHome(dashboardContent);
            break;
          case "courses":
            UI.courses.renderCourses(dashboardContent);
            break;
          case "assignments":
            UI.assignments.renderAssignments(dashboardContent);
            break;
          case "submissions":
            UI.submissions.renderSubmissions(dashboardContent);
            break;
          case "my-courses":
            UI.courses.renderMyCourses(dashboardContent);
            break;
          case "my-assignments":
            UI.assignments.renderMyAssignments(dashboardContent);
            break;
          case "student-submissions":
            UI.submissions.renderStudentSubmissions(dashboardContent);
            break;
          case "profile":
            UI.profile.renderProfile(dashboardContent);
            break;
          default:
            UI.dashboard.renderHome(dashboardContent);
        }
      }, 300);
    },

    renderHome: async (container) => {
      const homeUI = UI.renderTemplate("dashboard-home-template", container);

      const welcomeNameEl = homeUI.querySelector("#welcome-name");
      welcomeNameEl.textContent = Auth.user.name;

      const loader = Utils.showLoader(container);

      try {
        if (Auth.user.role === "student") {
          const enrolledCourses = await API.courses.getEnrolled();
          const assignments = await API.assignments.getAll();
          const submissions = await API.submissions.getAll();

          homeUI.querySelector("#enrolled-courses-count").textContent =
            enrolledCourses.data.length;

          const pendingAssignments = assignments.data.filter((assignment) => {
            return !submissions.data.some(
              (submission) => submission.assignment._id === assignment._id
            );
          });

          homeUI.querySelector("#pending-assignments-count").textContent =
            pendingAssignments.length;
          homeUI.querySelector("#submitted-assignments-count").textContent =
            submissions.data.length;
        } else if (Auth.user.role === "lecturer") {
          const courses = await API.courses.getAll();
          const assignments = await API.assignments.getAll();
          const submissions = await API.submissions.getAll();

          homeUI.querySelector("#lecturer-courses-count").textContent =
            courses.data.length;
          homeUI.querySelector("#active-assignments-count").textContent =
            assignments.data.length;

          const pendingReviews = submissions.data.filter(
            (submission) => submission.marks === null
          );

          homeUI.querySelector("#pending-reviews-count").textContent =
            pendingReviews.length;
        }

        const activityList = homeUI.querySelector("#recent-activity-list");
        activityList.innerHTML =
          '<p class="empty-state">No recent activity</p>';
      } catch (error) {
        console.error("Error loading dashboard data:", error);
        Utils.showToast("Error loading dashboard data", "error");
      } finally {
        Utils.removeLoader(container);
      }
    },
  },

  courses: {
    renderCourses: async (container) => {
      const coursesUI = UI.renderTemplate("courses-template", container);
      const coursesGrid = coursesUI.querySelector("#courses-grid");

      Utils.showSkeletonLoading(coursesGrid, "skeleton-course-template", 6);

      try {
        const response = await API.courses.getAll();

        coursesGrid.innerHTML = "";

        if (response.data.length === 0) {
          coursesGrid.innerHTML =
            '<p class="empty-state">No courses available</p>';
          return;
        }

        response.data.forEach((course) => {
          const courseTemplate = document.getElementById(
            "course-card-template"
          );
          const courseCard = courseTemplate.content.cloneNode(true);

          courseCard.querySelector(".course-title").textContent = course.title;
          courseCard.querySelector(
            ".course-code"
          ).textContent = `Code: ${course.code}`;
          courseCard.querySelector(".course-description").textContent =
            Utils.truncateText(course.description, 150);

          const lecturerName = course.lecturer.name || "Unknown";
          courseCard.querySelector(
            ".course-lecturer"
          ).textContent = `Lecturer: ${lecturerName}`;

          const enrollBtn = courseCard.querySelector(".enroll-btn");

          const isEnrolled = course.students.some(
            (student) => student._id === Auth.user.id
          );

          if (isEnrolled) {
            enrollBtn.textContent = "Enrolled";
            enrollBtn.disabled = true;
            enrollBtn.classList.add("btn-disabled");
          } else {
            enrollBtn.addEventListener("click", async (e) => {
              const originalText = Utils.addButtonLoader(enrollBtn);

              try {
                await API.courses.enroll(course._id);
                Utils.showToast(`Enrolled in ${course.title} successfully`);
                UI.courses.renderCourses(container);
              } catch (error) {
                Utils.showToast(error.message, "error");

                Utils.removeButtonLoader(enrollBtn, originalText);
              }
            });
          }

          coursesGrid.appendChild(courseCard);
        });
      } catch (error) {
        console.error("Error loading courses:", error);
        Utils.showToast("Error loading courses", "error");
        coursesGrid.innerHTML =
          '<p class="empty-state">Failed to load courses</p>';
      }
    },

    renderMyCourses: async (container) => {
      const myCoursesUI = UI.renderTemplate("my-courses-template", container);
      const myCoursesGrid = myCoursesUI.querySelector("#my-courses-grid");

      Utils.showSkeletonLoading(myCoursesGrid, "skeleton-course-template", 6);

      try {
        const response = await API.courses.getAll();

        myCoursesGrid.innerHTML = "";

        if (response.data.length === 0) {
          myCoursesGrid.innerHTML =
            '<p class="empty-state">You have no courses yet</p>';
          return;
        }

        response.data.forEach((course) => {
          const courseTemplate = document.getElementById(
            "course-card-template"
          );
          const courseCard = courseTemplate.content.cloneNode(true);

          courseCard.querySelector(".course-title").textContent = course.title;
          courseCard.querySelector(
            ".course-code"
          ).textContent = `Code: ${course.code}`;
          courseCard.querySelector(".course-description").textContent =
            Utils.truncateText(course.description, 150);

          const studentCount = course.students ? course.students.length : 0;
          courseCard.querySelector(
            ".course-lecturer"
          ).textContent = `Students: ${studentCount}`;

          const enrollBtn = courseCard.querySelector(".enroll-btn");
          enrollBtn.textContent = "View Details";
          enrollBtn.classList.remove("enroll-btn");
          enrollBtn.classList.add("view-course-btn");

          enrollBtn.addEventListener("click", async () => {
            Utils.addButtonLoader(enrollBtn);

            try {
              const courseDetails = await API.courses.getOne(course._id);
              UI.courses.renderCourseDetails(container, courseDetails.data);
            } catch (error) {
              Utils.showToast(error.message, "error");

              Utils.removeButtonLoader(enrollBtn, "View Details");
            }
          });

          myCoursesGrid.appendChild(courseCard);
        });

        const addCourseBtn = myCoursesUI.querySelector("#add-course-btn");
        addCourseBtn.addEventListener("click", () => {
          Utils.showModal("add-course-template", (modal) => {
            const form = modal.querySelector("#add-course-form");

            form.addEventListener("submit", async (e) => {
              e.preventDefault();

              const submitBtn = form.querySelector('button[type="submit"]');
              const formInputs = form.querySelectorAll("input, textarea");

              submitBtn.disabled = true;
              formInputs.forEach((input) => (input.disabled = true));

              Utils.addButtonLoader(submitBtn);

              try {
                const courseData = {
                  title: form.title.value,
                  code: form.code.value,
                  description: form.description.value,
                };

                await API.courses.create(courseData);
                Utils.showToast("Course created successfully");
                modal.innerHTML = "";
                UI.courses.renderMyCourses(container);
              } catch (error) {
                Utils.showToast(error.message, "error");

                submitBtn.disabled = false;
                formInputs.forEach((input) => (input.disabled = false));

                Utils.removeButtonLoader(submitBtn, "Create Course");
              }
            });
          });
        });
      } catch (error) {
        console.error("Error loading courses:", error);
        Utils.showToast("Error loading courses", "error");
        myCoursesGrid.innerHTML =
          '<p class="empty-state">Failed to load courses</p>';
      }
    },

    renderCourseDetails: (container, course) => {
      const detailsHTML = `
        <div class="course-details">
          <div class="back-link">
            <a href="#" id="back-to-courses">&larr; Back to Courses</a>
          </div>
          <div class="course-header">
            <h2>${course.title}</h2>
            <p class="course-code">Code: ${course.code}</p>
          </div>
          <div class="course-info">
            <p><strong>Description:</strong> ${course.description}</p>
            <p><strong>Created:</strong> ${Utils.formatDate(
              course.createdAt
            )}</p>
            <p><strong>Last Updated:</strong> ${Utils.formatDate(
              course.updatedAt
            )}</p>
          </div>
          <div class="course-students">
            <h3>Enrolled Students (${course.students.length})</h3>
            <div class="students-list" id="students-list">
              ${
                course.students.length > 0
                  ? `<ul>${course.students
                      .map(
                        (student) =>
                          `<li>${student.name} (${student.email})</li>`
                      )
                      .join("")}</ul>`
                  : '<p class="empty-state">No students enrolled yet</p>'
              }
            </div>
          </div>
          <div class="course-actions">
            <button id="edit-course-btn" class="btn btn-primary">Edit Course</button>
            <button id="delete-course-btn" class="btn btn-danger">Delete Course</button>
          </div>
        </div>
      `;

      container.innerHTML = detailsHTML;

      const backBtn = container.querySelector("#back-to-courses");
      backBtn.addEventListener("click", (e) => {
        e.preventDefault();
        UI.courses.renderMyCourses(container);
      });

      const editBtn = container.querySelector("#edit-course-btn");
      editBtn.addEventListener("click", () => {
        Utils.showModal("add-course-template", (modal) => {
          modal.querySelector(".modal-header h2").textContent = "Edit Course";

          const form = modal.querySelector("#add-course-form");
          form.title.value = course.title;
          form.code.value = course.code;
          form.description.value = course.description;

          form.querySelector('button[type="submit"]').textContent =
            "Update Course";

          form.addEventListener("submit", async (e) => {
            e.preventDefault();

            const submitBtn = form.querySelector('button[type="submit"]');
            const formInputs = form.querySelectorAll("input, textarea");

            submitBtn.disabled = true;
            formInputs.forEach((input) => (input.disabled = true));

            Utils.addButtonLoader(submitBtn);

            try {
              const courseData = {
                title: form.title.value,
                code: form.code.value,
                description: form.description.value,
              };

              await API.courses.update(course._id, courseData);
              Utils.showToast("Course updated successfully");
              modal.innerHTML = "";

              Utils.showPageLoader(container, "Refreshing course details...");

              const updatedCourse = await API.courses.getOne(course._id);
              UI.courses.renderCourseDetails(container, updatedCourse.data);
            } catch (error) {
              Utils.showToast(error.message, "error");

              submitBtn.disabled = false;
              formInputs.forEach((input) => (input.disabled = false));

              Utils.removeButtonLoader(submitBtn, "Update Course");
            }
          });
        });
      });

      const deleteBtn = container.querySelector("#delete-course-btn");
      deleteBtn.addEventListener("click", async () => {
        if (
          confirm(
            `Are you sure you want to delete "${course.title}"? This action cannot be undone.`
          )
        ) {
          Utils.addButtonLoader(deleteBtn);

          try {
            await API.courses.delete(course._id);
            Utils.showToast("Course deleted successfully");

            Utils.showPageLoader(container, "Redirecting...");

            setTimeout(() => {
              UI.courses.renderMyCourses(container);
            }, 500);
          } catch (error) {
            Utils.showToast(error.message, "error");

            Utils.removeButtonLoader(deleteBtn, "Delete Course");
          }
        }
      });
    },
  },

  assignments: {
    renderAssignments: async (container) => {
      const assignmentsUI = UI.renderTemplate(
        "assignments-template",
        container
      );
      const assignmentsList = assignmentsUI.querySelector("#assignments-list");

      Utils.showSkeletonLoading(
        assignmentsList,
        "skeleton-assignment-template",
        6
      );

      try {
        const response = await API.assignments.getAll();

        assignmentsList.innerHTML = "";

        if (response.data.length === 0) {
          assignmentsList.innerHTML =
            '<p class="empty-state">No assignments available</p>';
          return;
        }

        response.data.forEach((assignment) => {
          const assignmentTemplate = document.getElementById(
            "assignment-card-template"
          );
          const assignmentCard = assignmentTemplate.content.cloneNode(true);

          assignmentCard.querySelector(".assignment-title").textContent =
            assignment.title;
          assignmentCard.querySelector(".assignment-course").textContent =
            assignment.course.title;
          assignmentCard.querySelector(".assignment-description").textContent =
            Utils.truncateText(assignment.description, 150);
          assignmentCard.querySelector(
            ".assignment-due-date span"
          ).textContent = Utils.formatDate(assignment.dueDate);
          assignmentCard.querySelector(
            ".assignment-max-marks span"
          ).textContent = assignment.maxMarks;

          const viewBtn = assignmentCard.querySelector(".view-assignment-btn");
          viewBtn.addEventListener("click", () => {
            Utils.addButtonLoader(viewBtn);

            UI.assignments.renderAssignmentDetail(container, assignment._id);
          });

          assignmentsList.appendChild(assignmentCard);
        });
      } catch (error) {
        console.error("Error loading assignments:", error);
        Utils.showToast("Error loading assignments", "error");
        assignmentsList.innerHTML =
          '<p class="empty-state">Failed to load assignments</p>';
      }
    },

    renderMyAssignments: async (container) => {
      const myAssignmentsUI = UI.renderTemplate(
        "my-assignments-template",
        container
      );
      const myAssignmentsList = myAssignmentsUI.querySelector(
        "#my-assignments-list"
      );

      Utils.showSkeletonLoading(
        myAssignmentsList,
        "skeleton-assignment-template",
        6
      );

      try {
        const response = await API.assignments.getAll();

        myAssignmentsList.innerHTML = "";

        if (response.data.length === 0) {
          myAssignmentsList.innerHTML =
            '<p class="empty-state">You have no assignments yet</p>';
        } else {
          response.data.forEach((assignment) => {
            const assignmentTemplate = document.getElementById(
              "assignment-card-template"
            );
            const assignmentCard = assignmentTemplate.content.cloneNode(true);

            assignmentCard.querySelector(".assignment-title").textContent =
              assignment.title;
            assignmentCard.querySelector(".assignment-course").textContent =
              assignment.course.title;
            assignmentCard.querySelector(
              ".assignment-description"
            ).textContent = Utils.truncateText(assignment.description, 150);
            assignmentCard.querySelector(
              ".assignment-due-date span"
            ).textContent = Utils.formatDate(assignment.dueDate);
            assignmentCard.querySelector(
              ".assignment-max-marks span"
            ).textContent = assignment.maxMarks;

            const viewBtn = assignmentCard.querySelector(
              ".view-assignment-btn"
            );
            viewBtn.textContent = "View Submissions";
            viewBtn.addEventListener("click", () => {
              Utils.addButtonLoader(viewBtn);

              UI.submissions.renderSubmissionsByAssignment(
                container,
                assignment._id
              );
            });

            myAssignmentsList.appendChild(assignmentCard);
          });
        }

        const addAssignmentBtn = myAssignmentsUI.querySelector(
          "#add-assignment-btn"
        );

        addAssignmentBtn.addEventListener("click", () => {
          const originalText = Utils.addButtonLoader(addAssignmentBtn);

          loadCoursesAndShowModal().catch(() => {
            Utils.removeButtonLoader(addAssignmentBtn, originalText);
          });
        });

        async function loadCoursesAndShowModal() {
          try {
            const coursesResponse = await API.courses.getAll();

            Utils.removeButtonLoader(addAssignmentBtn, "Add Assignment");

            if (!coursesResponse.data || coursesResponse.data.length === 0) {
              Utils.showToast("You need to create a course first", "warning");
              return;
            }

            Utils.showModal("add-assignment-template", (modal) => {
              const form = modal.querySelector("#add-assignment-form");
              const courseSelect = form.querySelector("#assignment-course");

              courseSelect.innerHTML = "";

              coursesResponse.data.forEach((course) => {
                const option = document.createElement("option");
                option.value = course._id;
                option.textContent = `${course.title} (${course.code})`;
                courseSelect.appendChild(option);
              });

              form.addEventListener("submit", async (e) => {
                e.preventDefault();

                const submitBtn = form.querySelector('button[type="submit"]');
                const formInputs = form.querySelectorAll(
                  "input, textarea, select"
                );

                if (
                  !form.title.value ||
                  !form.description.value ||
                  !form.course.value ||
                  !form.dueDate.value ||
                  !form.maxMarks.value
                ) {
                  Utils.showToast("Please fill in all fields", "error");
                  return;
                }

                submitBtn.disabled = true;
                formInputs.forEach((input) => (input.disabled = true));

                Utils.addButtonLoader(submitBtn);

                try {
                  const assignmentData = {
                    title: form.title.value,
                    description: form.description.value,
                    course: form.course.value,
                    dueDate: form.dueDate.value,
                    maxMarks: Number.parseInt(form.maxMarks.value),
                  };

                  console.log("Creating assignment with data:", assignmentData);

                  await API.assignments.create(assignmentData);

                  Utils.showToast("Assignment created successfully");

                  modal.innerHTML = "";

                  Utils.showPageLoader(container, "Refreshing assignments...");

                  setTimeout(() => {
                    UI.assignments.renderMyAssignments(container);
                  }, 500);
                } catch (error) {
                  console.error("Error creating assignment:", error);
                  Utils.showToast(
                    error.message || "Error creating assignment",
                    "error"
                  );

                  submitBtn.disabled = false;
                  formInputs.forEach((input) => (input.disabled = false));

                  Utils.removeButtonLoader(submitBtn, "Create Assignment");
                }
              });
            });
          } catch (error) {
            console.error("Error loading courses:", error);
            Utils.showToast("Error loading courses", "error");
            throw error;
          }
        }
      } catch (error) {
        console.error("Error loading assignments:", error);
        Utils.showToast("Error loading assignments", "error");
        myAssignmentsList.innerHTML =
          '<p class="empty-state">Failed to load assignments</p>';
      }
    },

    renderAssignmentDetail: async (container, assignmentId) => {
      Utils.showPageLoader(container, "Loading assignment details...");

      try {
        const assignment = await API.assignments.getOne(assignmentId);

        const assignmentDetailUI = UI.renderTemplate(
          "assignment-detail-template",
          container
        );

        assignmentDetailUI.querySelector(
          "#detail-assignment-title"
        ).textContent = assignment.data.title;
        assignmentDetailUI.querySelector(
          "#detail-assignment-course"
        ).textContent = assignment.data.course.title;
        assignmentDetailUI.querySelector(
          "#detail-assignment-description"
        ).textContent = assignment.data.description;
        assignmentDetailUI.querySelector(
          "#detail-assignment-due-date"
        ).textContent = Utils.formatDate(assignment.data.dueDate);
        assignmentDetailUI.querySelector(
          "#detail-assignment-max-marks"
        ).textContent = assignment.data.maxMarks;

        const backBtn = assignmentDetailUI.querySelector(
          "#back-to-assignments"
        );
        backBtn.addEventListener("click", (e) => {
          e.preventDefault();
          UI.assignments.renderAssignments(container);
        });

        if (Auth.user.role === "student") {
          const submitForm = assignmentDetailUI.querySelector(
            "#submit-assignment-form"
          );

          submitForm.addEventListener("submit", async (e) => {
            e.preventDefault();

            const submitBtn = submitForm.querySelector('button[type="submit"]');
            const textArea = submitForm.textAnswer;
            const fileInput = submitForm.file;

            if (!textArea.value && !fileInput.files[0]) {
              Utils.showToast(
                "Please provide either text answer or a file",
                "error"
              );
              return;
            }

            submitBtn.disabled = true;
            textArea.disabled = true;
            fileInput.disabled = true;

            Utils.addButtonLoader(submitBtn);

            try {
              const textAnswer = textArea.value;
              const file = fileInput.files[0];

              await API.submissions.create(
                {
                  assignmentId: assignmentId,
                  textAnswer: textAnswer,
                },
                file
              );

              Utils.showToast("Assignment submitted successfully");

              Utils.showPageLoader(container, "Redirecting...");

              setTimeout(() => {
                UI.assignments.renderAssignments(container);
              }, 500);
            } catch (error) {
              Utils.showToast(error.message, "error");

              submitBtn.disabled = false;
              textArea.disabled = false;
              fileInput.disabled = false;

              Utils.removeButtonLoader(submitBtn, "Submit Assignment");
            }
          });
        }
      } catch (error) {
        console.error("Error loading assignment details:", error);
        Utils.showToast("Error loading assignment details", "error");
        container.innerHTML =
          '<p class="empty-state">Failed to load assignment details</p>';
      }
    },
  },

  submissions: {
    renderSubmissions: async (container) => {
      const submissionsUI = UI.renderTemplate(
        "submissions-template",
        container
      );
      const submissionsList = submissionsUI.querySelector("#submissions-list");

      Utils.showSkeletonLoading(
        submissionsList,
        "skeleton-assignment-template",
        6
      );

      try {
        const response = await API.submissions.getAll();

        submissionsList.innerHTML = "";

        if (response.data.length === 0) {
          submissionsList.innerHTML =
            '<p class="empty-state">You have no submissions yet</p>';
          return;
        }

        response.data.forEach((submission) => {
          const submissionTemplate = document.getElementById(
            "submission-card-template"
          );
          const submissionCard = submissionTemplate.content.cloneNode(true);

          submissionCard.querySelector(".submission-assignment").textContent =
            submission.assignment.title;
          submissionCard.querySelector(".submission-course").textContent =
            submission.assignment.course.title;
          submissionCard.querySelector(".submission-date span").textContent =
            Utils.formatDate(submission.submittedAt);

          const statusSpan = submissionCard.querySelector(
            ".submission-status span"
          );
          const marksSpan = submissionCard.querySelector(
            ".submission-marks span:first-child"
          );
          const feedbackSpan = submissionCard.querySelector(
            ".submission-marks span:last-child"
          );

          if (submission.marks !== null) {
            statusSpan.textContent = "Graded";
            statusSpan.classList.add("status-graded");
            marksSpan.textContent = `${submission.marks}/${submission.assignment.maxMarks}`;
            feedbackSpan.textContent =
              submission.feedback || "No feedback provided";
          } else {
            statusSpan.textContent = "Pending";
            statusSpan.classList.add("status-pending");
            marksSpan.textContent = "Not graded yet";
            feedbackSpan.textContent = "No feedback yet";
          }

          const viewBtn = submissionCard.querySelector(".view-submission-btn");
          viewBtn.addEventListener("click", () => {
            Utils.addButtonLoader(viewBtn);

            UI.submissions.renderSubmissionDetail(container, submission._id);
          });

          submissionsList.appendChild(submissionCard);
        });
      } catch (error) {
        console.error("Error loading submissions:", error);
        Utils.showToast("Error loading submissions", "error");
        submissionsList.innerHTML =
          '<p class="empty-state">Failed to load submissions</p>';
      }
    },

    renderStudentSubmissions: async (container) => {
      const studentSubmissionsUI = UI.renderTemplate(
        "student-submissions-template",
        container
      );
      const submissionsList = studentSubmissionsUI.querySelector(
        "#student-submissions-list"
      );
      const filterCourse = studentSubmissionsUI.querySelector("#filter-course");
      const filterAssignment =
        studentSubmissionsUI.querySelector("#filter-assignment");

      const loader = Utils.showLoader(container);

      try {
        const coursesResponse = await API.courses.getAll();

        filterCourse.innerHTML = '<option value="">All Courses</option>';
        coursesResponse.data.forEach((course) => {
          const option = document.createElement("option");
          option.value = course._id;
          option.textContent = course.title;
          filterCourse.appendChild(option);
        });

        filterCourse.addEventListener("change", async () => {
          const courseId = filterCourse.value;

          filterAssignment.innerHTML =
            '<option value="">All Assignments</option>';

          if (courseId) {
            const filterLoader = Utils.showLoader(submissionsList);

            try {
              const assignmentsResponse = await API.assignments.getByCourse(
                courseId
              );

              assignmentsResponse.data.forEach((assignment) => {
                const option = document.createElement("option");
                option.value = assignment._id;
                option.textContent = assignment.title;
                filterAssignment.appendChild(option);
              });
            } catch (error) {
              console.error("Error loading assignments:", error);
              Utils.showToast("Error loading assignments", "error");
            } finally {
              Utils.removeLoader(submissionsList);
            }
          }

          loadSubmissions();
        });

        filterAssignment.addEventListener("change", () => {
          loadSubmissions();
        });

        const loadSubmissions = async () => {
          const courseId = filterCourse.value;
          const assignmentId = filterAssignment.value;

          const filterLoader = Utils.showLoader(submissionsList);

          try {
            let submissions = [];

            if (assignmentId) {
              const response = await API.submissions.getByAssignment(
                assignmentId
              );
              submissions = response.data;
            } else {
              const response = await API.submissions.getAll();
              submissions = response.data;

              if (courseId) {
                submissions = submissions.filter(
                  (submission) => submission.assignment.course._id === courseId
                );
              }
            }

            renderSubmissionsList(submissions);
          } catch (error) {
            console.error("Error loading submissions:", error);
            Utils.showToast("Error loading submissions", "error");
            submissionsList.innerHTML =
              '<p class="empty-state">Failed to load submissions</p>';
          } finally {
            Utils.removeLoader(submissionsList);
          }
        };

        const renderSubmissionsList = (submissions) => {
          if (submissions.length === 0) {
            submissionsList.innerHTML =
              '<p class="empty-state">No submissions found</p>';
            return;
          }

          submissionsList.innerHTML = "";

          submissions.forEach((submission) => {
            const submissionTemplate = document.getElementById(
              "submission-card-template"
            );
            const submissionCard = submissionTemplate.content.cloneNode(true);

            submissionCard.querySelector(".submission-assignment").textContent =
              submission.assignment.title;

            const courseSpan =
              submissionCard.querySelector(".submission-course");
            courseSpan.textContent = `${submission.student.name} - ${submission.assignment.course.title}`;

            submissionCard.querySelector(".submission-date span").textContent =
              Utils.formatDate(submission.submittedAt);

            const statusSpan = submissionCard.querySelector(
              ".submission-status span"
            );
            const marksSpan = submissionCard.querySelector(
              ".submission-marks span:first-child"
            );
            const feedbackSpan = submissionCard.querySelector(
              ".submission-marks span:last-child"
            );

            if (submission.marks !== null) {
              statusSpan.textContent = "Graded";
              statusSpan.classList.add("status-graded");
              marksSpan.textContent = `${submission.marks}/${submission.assignment.maxMarks}`;
              feedbackSpan.textContent =
                submission.feedback || "No feedback provided";
            } else {
              statusSpan.textContent = "Pending";
              statusSpan.classList.add("status-pending");
              marksSpan.textContent = "Not graded yet";
              feedbackSpan.textContent = "No feedback yet";
            }

            const viewBtn = submissionCard.querySelector(
              ".view-submission-btn"
            );
            viewBtn.textContent = "Grade Submission";
            viewBtn.addEventListener("click", () => {
              Utils.addButtonLoader(viewBtn);

              UI.submissions.renderGradeSubmission(container, submission._id);
            });

            submissionsList.appendChild(submissionCard);
          });
        };

        Utils.removeLoader(container);

        loadSubmissions();
      } catch (error) {
        console.error("Error loading submissions:", error);
        Utils.showToast("Error loading submissions", "error");
        submissionsList.innerHTML =
          '<p class="empty-state">Failed to load submissions</p>';

        Utils.removeLoader(container);
      }
    },

    renderSubmissionDetail: async (container, submissionId) => {
      Utils.showPageLoader(container, "Loading submission details...");

      try {
        const submission = await API.submissions.getOne(submissionId);

        const submissionDetailUI = UI.renderTemplate(
          "submission-detail-template",
          container
        );

        submissionDetailUI.querySelector(
          "#detail-submission-assignment"
        ).textContent = submission.data.assignment.title;
        submissionDetailUI.querySelector(
          "#detail-submission-course"
        ).textContent = submission.data.assignment.course.title;
        submissionDetailUI.querySelector(
          "#detail-submission-date"
        ).textContent = Utils.formatDate(submission.data.submittedAt);

        const statusSpan = submissionDetailUI.querySelector(
          "#detail-submission-status"
        );
        if (submission.data.marks !== null) {
          statusSpan.textContent = "Graded";
          statusSpan.classList.add("status-graded");
          submissionDetailUI.querySelector(
            "#detail-submission-marks"
          ).textContent = `${submission.data.marks}/${submission.data.assignment.maxMarks}`;
          submissionDetailUI.querySelector(
            "#detail-submission-feedback"
          ).textContent = submission.data.feedback || "No feedback provided";
        } else {
          statusSpan.textContent = "Pending";
          statusSpan.classList.add("status-pending");
          submissionDetailUI.querySelector(
            "#detail-submission-marks"
          ).textContent = "Not graded yet";
          submissionDetailUI.querySelector(
            "#detail-submission-feedback"
          ).textContent = "No feedback yet";
        }

        submissionDetailUI.querySelector(
          "#detail-submission-text"
        ).textContent = submission.data.textAnswer || "No text answer provided";

        const fileContainer = submissionDetailUI.querySelector(
          "#detail-submission-file"
        );
        if (submission.data.fileUrl) {
          const fileLink = document.createElement("a");
          fileLink.href = submission.data.fileUrl;
          fileLink.target = "_blank";
          fileLink.textContent = "View Submitted File";
          fileLink.classList.add("btn", "btn-primary");
          fileContainer.appendChild(fileLink);
        } else {
          fileContainer.textContent = "No file submitted";
        }

        const backBtn = submissionDetailUI.querySelector(
          "#back-to-submissions"
        );
        backBtn.addEventListener("click", (e) => {
          e.preventDefault();
          UI.submissions.renderSubmissions(container);
        });
      } catch (error) {
        console.error("Error loading submission details:", error);
        Utils.showToast("Error loading submission details", "error");
        container.innerHTML =
          '<p class="empty-state">Failed to load submission details</p>';
      }
    },

    renderGradeSubmission: async (container, submissionId) => {
      Utils.showPageLoader(container, "Loading submission for grading...");

      try {
        const submission = await API.submissions.getOne(submissionId);

        const gradeSubmissionUI = UI.renderTemplate(
          "grade-submission-template",
          container
        );

        gradeSubmissionUI.querySelector(
          "#grade-submission-assignment"
        ).textContent = submission.data.assignment.title;
        gradeSubmissionUI.querySelector(
          "#grade-submission-student"
        ).textContent = `Student: ${submission.data.student.name}`;
        gradeSubmissionUI.querySelector("#grade-submission-date").textContent =
          Utils.formatDate(submission.data.submittedAt);

        gradeSubmissionUI.querySelector("#grade-submission-text").textContent =
          submission.data.textAnswer || "No text answer provided";

        const fileContainer = gradeSubmissionUI.querySelector(
          "#grade-submission-file"
        );
        if (submission.data.fileUrl) {
          const fileLink = document.createElement("a");
          fileLink.href = submission.data.fileUrl;
          fileLink.target = "_blank";
          fileLink.textContent = "View Submitted File";
          fileLink.classList.add("btn", "btn-primary");
          fileContainer.appendChild(fileLink);
        } else {
          fileContainer.textContent = "No file submitted";
        }

        const gradeForm = gradeSubmissionUI.querySelector(
          "#grade-submission-form"
        );
        const marksInput = gradeForm.querySelector("#grade-marks");

        marksInput.setAttribute("max", submission.data.assignment.maxMarks);

        if (submission.data.marks !== null) {
          marksInput.value = submission.data.marks;
          gradeForm.querySelector("#grade-feedback").value =
            submission.data.feedback || "";
        }

        gradeForm.addEventListener("submit", async (e) => {
          e.preventDefault();

          const submitBtn = gradeForm.querySelector('button[type="submit"]');
          const formInputs = gradeForm.querySelectorAll("input, textarea");

          submitBtn.disabled = true;
          formInputs.forEach((input) => (input.disabled = true));

          Utils.addButtonLoader(submitBtn);

          try {
            const gradeData = {
              marks: marksInput.value,
              feedback: gradeForm.feedback.value,
            };

            await API.submissions.grade(submissionId, gradeData);
            Utils.showToast("Submission graded successfully");

            Utils.showPageLoader(container, "Redirecting...");

            setTimeout(() => {
              UI.submissions.renderStudentSubmissions(container);
            }, 500);
          } catch (error) {
            Utils.showToast(error.message, "error");

            submitBtn.disabled = false;
            formInputs.forEach((input) => (input.disabled = false));

            Utils.removeButtonLoader(submitBtn, "Submit Grade");
          }
        });

        const backBtn = gradeSubmissionUI.querySelector(
          "#back-to-student-submissions"
        );
        backBtn.addEventListener("click", (e) => {
          e.preventDefault();
          UI.submissions.renderStudentSubmissions(container);
        });
      } catch (error) {
        console.error("Error loading submission details:", error);
        Utils.showToast("Error loading submission details", "error");
        container.innerHTML =
          '<p class="empty-state">Failed to load submission details</p>';
      }
    },

    renderSubmissionsByAssignment: async (container, assignmentId) => {
      Utils.showPageLoader(container, "Loading submissions...");

      try {
        const assignment = await API.assignments.getOne(assignmentId);
        const submissions = await API.submissions.getByAssignment(assignmentId);

        const studentSubmissionsUI = UI.renderTemplate(
          "student-submissions-template",
          container
        );

        studentSubmissionsUI.querySelector(
          ".page-header h2"
        ).textContent = `Submissions for: ${assignment.data.title}`;

        studentSubmissionsUI.querySelector(".filter-controls").style.display =
          "none";

        const submissionsList = studentSubmissionsUI.querySelector(
          "#student-submissions-list"
        );

        if (submissions.data.length === 0) {
          submissionsList.innerHTML =
            '<p class="empty-state">No submissions for this assignment yet</p>';
          return;
        }

        submissionsList.innerHTML = "";

        submissions.data.forEach((submission) => {
          const submissionTemplate = document.getElementById(
            "submission-card-template"
          );
          const submissionCard = submissionTemplate.content.cloneNode(true);

          submissionCard.querySelector(".submission-assignment").textContent =
            assignment.data.title;

          const courseSpan = submissionCard.querySelector(".submission-course");
          courseSpan.textContent = `Student: ${submission.student.name}`;

          submissionCard.querySelector(".submission-date span").textContent =
            Utils.formatDate(submission.submittedAt);

          const statusSpan = submissionCard.querySelector(
            ".submission-status span"
          );
          const marksSpan = submissionCard.querySelector(
            ".submission-marks span:first-child"
          );
          const feedbackSpan = submissionCard.querySelector(
            ".submission-marks span:last-child"
          );

          if (submission.marks !== null) {
            statusSpan.textContent = "Graded";
            statusSpan.classList.add("status-graded");
            marksSpan.textContent = `${submission.marks}/${assignment.data.maxMarks}`;
            feedbackSpan.textContent =
              submission.feedback || "No feedback provided";
          } else {
            statusSpan.textContent = "Pending";
            statusSpan.classList.add("status-pending");
            marksSpan.textContent = "Not graded yet";
            feedbackSpan.textContent = "No feedback yet";
          }

          const viewBtn = submissionCard.querySelector(".view-submission-btn");
          viewBtn.textContent = "Grade Submission";
          viewBtn.addEventListener("click", () => {
            Utils.addButtonLoader(viewBtn);

            UI.submissions.renderGradeSubmission(container, submission._id);
          });

          submissionsList.appendChild(submissionCard);
        });

        const backBtn = document.createElement("button");
        backBtn.textContent = "Back to Assignments";
        backBtn.classList.add("btn", "btn-primary");
        backBtn.style.marginBottom = "2rem";
        backBtn.addEventListener("click", () => {
          Utils.addButtonLoader(backBtn);

          UI.assignments.renderMyAssignments(container);
        });

        studentSubmissionsUI.insertBefore(
          backBtn,
          studentSubmissionsUI.firstChild
        );
      } catch (error) {
        console.error("Error loading submissions:", error);
        Utils.showToast("Error loading submissions", "error");
        container.innerHTML =
          '<p class="empty-state">Failed to load submissions</p>';
      }
    },
  },

  profile: {
    renderProfile: async (container) => {
      const profileUI = UI.renderTemplate("profile-template", container);

      const loader = Utils.showLoader(container);

      try {
        const response = await API.auth.getMe();
        const user = response.user;

        const profileForm = profileUI.querySelector("#update-profile-form");
        profileForm.name.value = user.name;
        profileForm.email.value = user.email;

        const roleInput = profileForm.querySelector("#profile-role");
        roleInput.value =
          user.role.charAt(0).toUpperCase() + user.role.slice(1);

        profileForm.addEventListener("submit", async (e) => {
          e.preventDefault();

          const submitBtn = profileForm.querySelector('button[type="submit"]');
          const formInputs = profileForm.querySelectorAll(
            "input:not([disabled])"
          );

          submitBtn.disabled = true;
          formInputs.forEach((input) => (input.disabled = true));

          Utils.addButtonLoader(submitBtn);

          try {
            const profileData = {
              name: profileForm.name.value,
              email: profileForm.email.value,
            };

            await API.users.updateProfile(profileData);

            Auth.user.name = profileData.name;
            Auth.user.email = profileData.email;

            document.getElementById("user-name").textContent = Auth.user.name;

            Utils.showToast("Profile updated successfully");
          } catch (error) {
            Utils.showToast(error.message, "error");
          } finally {
            submitBtn.disabled = false;
            formInputs.forEach((input) => (input.disabled = false));

            Utils.removeButtonLoader(submitBtn, "Update Profile");
          }
        });

        const passwordForm = profileUI.querySelector("#change-password-form");
        passwordForm.addEventListener("submit", async (e) => {
          e.preventDefault();

          const submitBtn = passwordForm.querySelector('button[type="submit"]');
          const formInputs = passwordForm.querySelectorAll("input");

          submitBtn.disabled = true;
          formInputs.forEach((input) => (input.disabled = true));

          Utils.addButtonLoader(submitBtn);

          try {
            const passwordData = {
              currentPassword: passwordForm.currentPassword.value,
              newPassword: passwordForm.newPassword.value,
            };

            await API.users.updatePassword(passwordData);
            Utils.showToast("Password updated successfully");

            passwordForm.reset();
          } catch (error) {
            Utils.showToast(error.message, "error");
          } finally {
            submitBtn.disabled = false;
            formInputs.forEach((input) => (input.disabled = false));

            Utils.removeButtonLoader(submitBtn, "Change Password");
          }
        });

        Utils.removeLoader(container);
      } catch (error) {
        console.error("Error loading profile:", error);
        Utils.showToast("Error loading profile", "error");

        Utils.removeLoader(container);
      }
    },
  },
};
