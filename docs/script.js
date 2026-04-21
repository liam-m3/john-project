const CONFIG = {
  apiURL: "https://vas272pqy4.execute-api.eu-west-2.amazonaws.com/inquiry",
};

function turnstileCallback(token) {
  document.getElementById("turnstileToken").value = token;
}

function loadTurnstile() {
  const script = document.createElement("script");
  script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js";
  script.async = true;
  script.defer = true;
  document.head.appendChild(script);
}

function isMobile() {
  return window.innerWidth <= 768;
}

function handleSmoothScroll(targetId) {
  const targetElement = document.querySelector(targetId);
  if (!targetElement) return;

  const navbarHeight = document.querySelector(".navbar")?.offsetHeight || 0;
  const extraOffset = targetId === "#about" ? 435 : 20;

  let targetPosition;
  if (targetId === "#contact" && isMobile()) {
    const inquiryBox = document.querySelector(".inquiry-box");
    if (inquiryBox) {
      targetPosition = inquiryBox.getBoundingClientRect().top + window.pageYOffset - 90;
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

  window.scrollTo({ top: targetPosition, behavior: "smooth" });
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
    const turnstileToken = formData.get("turnstileToken");
    if (!turnstileToken) {
      alert("Please complete the security check before submitting.");
      return false;
    }

    const res = await fetch(CONFIG.apiURL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        first_name: formData.get("firstName"),
        last_name: formData.get("lastName"),
        email: formData.get("email"),
        phone: formData.get("phone").toString(),
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
    void thankYouElement.offsetWidth;
    thankYouElement.classList.add("visible");
  }, 300);
}

function formatPhoneNumber(input) {
  let value = input.value.replace(/\D/g, "");
  if (value.length >= 10) {
    value = value.slice(0, 10).replace(/(\d{3})(\d{3})(\d{4})/, "$1-$2-$3");
  }
  input.value = value;
}

function initializeAnimations() {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        entry.target.classList.toggle("in-view", entry.isIntersecting);
      });
    },
    { threshold: 0.1, rootMargin: "50px 0px" }
  );
  document.querySelectorAll(".fade").forEach((el) => observer.observe(el));
}

function initializeFormValidation() {
  document.querySelectorAll(".form-control").forEach((field) => {
    const markValid = () => field.parentElement.classList.toggle("valid", field.value.trim() !== "");
    markValid();
    field.addEventListener("input", markValid);
    field.addEventListener("blur", markValid);
    field.addEventListener("focus", () => field.parentElement.classList.add("focused"));
  });
}

function slideToIcon(textEl, iconEl) {
  if (textEl) {
    textEl.style.transform = "translateY(-100%)";
    textEl.style.opacity = "0";
  }
  if (iconEl) {
    iconEl.style.transform = "translateY(0)";
    iconEl.style.opacity = "1";
  }
}

function resetButton(textEl, iconEl) {
  if (textEl) {
    textEl.style.transform = "translateY(0)";
    textEl.style.opacity = "1";
  }
  if (iconEl) {
    iconEl.style.transform = "translateY(100%)";
    iconEl.style.opacity = "0";
  }
}

function followLink(anchor) {
  const href = anchor.getAttribute("href");
  const download = anchor.getAttribute("download");
  const target = anchor.getAttribute("target");

  if (download) {
    const link = document.createElement("a");
    link.href = href;
    link.download = download;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } else if (target === "_blank") {
    window.open(href, "_blank");
  } else {
    window.location.href = href;
  }
}

function handleButtonClick(e, button, actionFunction) {
  e.preventDefault();

  const textEl = button.querySelector(".button-text") || button.querySelector(".submit-text");
  const iconEl = button.querySelector(".button-icon") || button.querySelector(".submit-icon");

  const runAction = () => {
    if (actionFunction) {
      actionFunction(button);
    } else if (button.tagName === "A") {
      followLink(button);
    }
  };

  if (isMobile()) {
    runAction();
    return;
  }

  slideToIcon(textEl, iconEl);
  setTimeout(() => {
    runAction();
    setTimeout(() => resetButton(textEl, iconEl), 500);
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
      const textEl = submitBtn?.querySelector(".submit-text");
      const iconEl = submitBtn?.querySelector(".submit-icon");

      if (isMobile() || !submitBtn) {
        await handleFormSubmit(e.target);
        return;
      }

      slideToIcon(textEl, iconEl);
      setTimeout(async () => {
        const success = await handleFormSubmit(e.target);
        if (!success) {
          setTimeout(() => resetButton(textEl, iconEl), 500);
        }
      }, 300);
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
    document.querySelectorAll(buttonSelector).forEach((button) => {
      button.addEventListener("click", (e) => handleButtonClick(e, button, actionFunction));
    });
  }

  setupButtonAction(".download-btn");
  setupButtonAction(".book-btn");
  setupButtonAction(".submit-btn", function (button) {
    const form = button.closest("form");
    if (form) {
      form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    }
  });

  window.addEventListener("resize", function () {
    document
      .querySelectorAll(".button-text, .button-icon, .submit-text, .submit-icon")
      .forEach((el) => {
        const isText = el.classList.contains("button-text") || el.classList.contains("submit-text");
        el.style.transform = isText ? "translateY(0)" : "translateY(100%)";
        el.style.opacity = isText ? "1" : "0";
      });
  });

  initializeAnimations();
  initializeFormValidation();
});
