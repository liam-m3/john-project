const CONFIG = {
  apiURL: "https://vas272pqy4.execute-api.eu-west-2.amazonaws.com/inquiry",
};

function loadTurnstile() {
  const script = document.createElement("script");
  script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js";
  script.async = true;
  script.defer = true;
  document.head.appendChild(script);
}

function handleSmoothScroll(targetId) {
  const targetElement = document.querySelector(targetId);
  if (!targetElement) return;

  const navbarHeight = document.querySelector(".navbar")?.offsetHeight || 0;
  const extraOffset = targetId === "#about" ? 435 : 20;

  let targetPosition;
  if (targetId === "#contact" && window.innerWidth <= 768) {
    const contactSection = document.querySelector("#contact");
    const inquiryBox = document.querySelector(".inquiry-box");

    if (contactSection && inquiryBox) {
      const inquiryBoxRect = inquiryBox.getBoundingClientRect();
      const inquiryBoxTop = inquiryBoxRect.top + window.pageYOffset;

      targetPosition = inquiryBoxTop - 90;
    } else {
      targetPosition = document.body.scrollHeight - window.innerHeight;
    }
  } else {
    targetPosition =
      targetElement.getBoundingClientRect().top +
      window.pageYOffset -
      navbarHeight -
      extraOffset;
  }

  window.scrollTo({
    top: targetPosition,
    behavior: "smooth",
  });
}

async function handleFormSubmit(form) {
  const formData = new FormData(form);
  const formLoadTime = form.dataset.loadTime;
  const honeypotValue = document.getElementById("website").value;

  if (honeypotValue || Date.now() - formLoadTime < 3000) {
    console.log("Spam detection triggered");
    return false;
  }

  try {
    const firstName = formData.get("firstName");
    const lastName = formData.get("lastName");
    const userEmail = formData.get("email");
    const phone = formData.get("phone").toString();
    const turnstileToken = formData.get("turnstileToken");

    if (!turnstileToken) {
      alert("Please complete the security check before submitting.");
      return false;
    }

    const res = await fetch(CONFIG.apiURL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        first_name: firstName,
        last_name: lastName,
        email: userEmail,
        phone: phone,
        turnstile_token: turnstileToken,
      }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error || `api responded ${res.status}`);
    }

    showThankYouMessage();
    return true;
  } catch (error) {
    console.error("Form submission error:", error);
    alert(
      "There was an error processing your inquiry. Please try again later. " +
        (error.message || "Unknown error")
    );
    return false;
  }
}

function showThankYouMessage() {
  const formElement = document.getElementById("contactForm");
  const thankYouElement = document.getElementById("thankYouMessage");

  formElement.style.opacity = "0";
  formElement.style.transform = "translateY(-20px)";

  setTimeout(() => {
    formElement.style.display = "none";
    thankYouElement.style.display = "block";
    thankYouElement.style.textAlign = "center";

    const elements = thankYouElement.querySelectorAll("h2, h3, p, li");
    elements.forEach((el) => {
      el.style.textAlign = "center";
    });

    const listItems = thankYouElement.querySelectorAll("li");
    listItems.forEach((item) => {
      item.style.listStyle = "none";
      item.style.paddingLeft = "0";
    });

    void thankYouElement.offsetWidth;
    thankYouElement.classList.add("visible");
  }, 300);
}

function formatPhoneNumber(input) {
  let value = input.value.replace(/\D/g, "");
  if (value.length >= 10) {
    value = value.slice(0, 10);
    value = value.replace(/(\d{3})(\d{3})(\d{4})/, "$1-$2-$3");
  }
  input.value = value;
}

function initializeAnimations() {
  const fadeElements = document.querySelectorAll(".fade");

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("in-view");
        } else {
          entry.target.classList.remove("in-view");
        }
      });
    },
    {
      threshold: 0.1,
      rootMargin: "50px 0px",
    }
  );
  fadeElements.forEach((el) => observer.observe(el));
}

function initializeFormValidation() {
  const formFields = document.querySelectorAll(".form-control");

  formFields.forEach((field) => {
    if (field.value.trim() !== "") {
      field.parentElement.classList.add("valid");
    }

    field.addEventListener("input", function () {
      if (this.value.trim() !== "") {
        this.parentElement.classList.add("valid");
      } else {
        this.parentElement.classList.remove("valid");
      }

      if (this.type === "email") {
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (emailPattern.test(this.value)) {
          this.parentElement.classList.add("valid");
        } else {
          this.parentElement.classList.remove("valid");
        }
      }

      if (this.type === "tel") {
        const phonePattern = /^[0-9\+\-\s]+$/;
        if (phonePattern.test(this.value) && this.value.length >= 10) {
          this.parentElement.classList.add("valid");
        } else {
          this.parentElement.classList.remove("valid");
        }
      }
    });

    field.addEventListener("focus", function () {
      this.parentElement.classList.add("focused");
    });

    field.addEventListener("blur", function () {
      this.parentElement.classList.remove("focused");
      if (this.value.trim() !== "") {
        this.parentElement.classList.add("valid");
      } else {
        this.parentElement.classList.remove("valid");
      }
    });
  });
}

function isMobileOrTablet() {
  return window.innerWidth <= 1024;
}

function handleButtonClick(e, button, actionFunction) {
  e.preventDefault();

  const textElement =
    button.querySelector(".button-text") ||
    button.querySelector(".submit-text");
  const iconElement =
    button.querySelector(".button-icon") ||
    button.querySelector(".submit-icon");

  if (isMobileOrTablet()) {
    if (actionFunction) {
      actionFunction(button);
    } else if (button.tagName === "A") {
      const originalHref = button.getAttribute("href");
      const originalDownload = button.getAttribute("download");
      const originalTarget = button.getAttribute("target");

      if (originalDownload) {
        const link = document.createElement("a");
        link.href = originalHref;
        link.download = originalDownload || "";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else if (originalTarget === "_blank") {
        window.open(originalHref, "_blank");
      } else {
        window.location.href = originalHref;
      }
    }
    return;
  }

  if (textElement) textElement.style.transform = "translateY(-100%)";
  if (textElement) textElement.style.opacity = "0";
  if (iconElement) iconElement.style.transform = "translateY(0)";
  if (iconElement) iconElement.style.opacity = "1";

  setTimeout(() => {
    if (actionFunction) {
      actionFunction(button);
    } else if (button.tagName === "A") {
      const originalHref = button.getAttribute("href");
      const originalDownload = button.getAttribute("download");
      const originalTarget = button.getAttribute("target");

      if (originalDownload) {
        const link = document.createElement("a");
        link.href = originalHref;
        link.download = originalDownload || "";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else if (originalTarget === "_blank") {
        window.open(originalHref, "_blank");
      } else {
        window.location.href = originalHref;
      }
    }

    setTimeout(() => {
      if (textElement) textElement.style.transform = "translateY(0)";
      if (textElement) textElement.style.opacity = "1";
      if (iconElement) iconElement.style.transform = "translateY(100%)";
      if (iconElement) iconElement.style.opacity = "0";
    }, 500);
  }, 300);
}

document.addEventListener("DOMContentLoaded", function () {
  loadTurnstile();

  const contactForm = document.getElementById("contactForm");
  if (contactForm) {
    contactForm.dataset.loadTime = Date.now();

    contactForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const submitBtn = contactForm.querySelector(".submit-btn");

      if (submitBtn) {
        const textElement = submitBtn.querySelector(".submit-text");
        const iconElement = submitBtn.querySelector(".submit-icon");

        if (isMobileOrTablet()) {
          const success = await handleFormSubmit(e.target);
          return;
        }

        if (textElement) textElement.style.transform = "translateY(-100%)";
        if (textElement) textElement.style.opacity = "0";
        if (iconElement) iconElement.style.transform = "translateY(0)";
        if (iconElement) iconElement.style.opacity = "1";

        setTimeout(async () => {
          const success = await handleFormSubmit(e.target);
          if (!success) {
            setTimeout(() => {
              if (textElement) textElement.style.transform = "translateY(0)";
              if (textElement) textElement.style.opacity = "1";
              if (iconElement) iconElement.style.transform = "translateY(100%)";
              if (iconElement) iconElement.style.opacity = "0";
            }, 500);
          }
        }, 300);
      } else {
        await handleFormSubmit(e.target);
      }
    });

    const phoneInput = contactForm.querySelector('input[name="phone"]');
    if (phoneInput) {
      phoneInput.addEventListener("input", (e) => formatPhoneNumber(e.target));
    }
  }

  document.querySelectorAll(".nav-links a, .bottom-nav a").forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const targetId = link.getAttribute("href");
      handleSmoothScroll(targetId);
      window.history.pushState(null, null, targetId);
    });
  });

  function setupButtonAction(buttonSelector, actionFunction) {
    const buttons = document.querySelectorAll(buttonSelector);

    buttons.forEach((button) => {
      button.addEventListener("click", function (e) {
        handleButtonClick(e, button, actionFunction);
      });
    });
  }

  setupButtonAction(".download-btn");
  setupButtonAction(".book-btn");
  setupButtonAction(".submit-btn", function (button) {
    const form = button.closest("form");
    if (form) {
      const submitEvent = new Event("submit", {
        bubbles: true,
        cancelable: true,
      });
      form.dispatchEvent(submitEvent);
    }
  });

  window.addEventListener("resize", function () {
    document
      .querySelectorAll(
        ".button-text, .button-icon, .submit-text, .submit-icon"
      )
      .forEach((el) => {
        if (
          el.classList.contains("button-text") ||
          el.classList.contains("submit-text")
        ) {
          el.style.transform = "translateY(0)";
          el.style.opacity = "1";
        } else {
          el.style.transform = "translateY(100%)";
          el.style.opacity = "0";
        }
      });
  });

  initializeAnimations();
  initializeFormValidation();
});
