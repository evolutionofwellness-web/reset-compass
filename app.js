// app.js?v=6

document.addEventListener("DOMContentLoaded", () => {
  const splashScreen = document.getElementById("splashScreen");
  const splashIcon = document.getElementById("splashIcon");
  const welcomePopup = document.getElementById("welcomePopup");
  const startButton = document.getElementById("startButton");

  // Splash animation
  splashScreen.style.display = "flex";
  setTimeout(() => {
    splashScreen.classList.add("fade-out");
    setTimeout(() => {
      splashScreen.style.display = "none";

      // Show popup only once
      if (!localStorage.getItem("popupShown")) {
        welcomePopup.style.display = "block";
      }
    }, 1000);
  }, 1200);

  // Welcome popup close
  if (startButton) {
    startButton.addEventListener("click", () => {
      welcomePopup.style.display = "none";
      localStorage.setItem("popupShown", "true");
    });
  }

  // Wedge rendering
  const compass = document.getElementById("compass");
  if (compass) {
    const ctx = compass.getContext("2d");
    const size = compass.width;
    const center = size / 2;
    const radius = center - 2;

    const wedges = [
      { label: "Growing", color: "#007BFF" },
      { label: "Drifting", color: "#FBC02D" },
      { label: "Surviving", color: "#E53935" },
      { label: "Grounded", color: "#43A047" },
    ];

    let startAngle = -0.5 * Math.PI;
    wedges.forEach((wedge, i) => {
      const endAngle = startAngle + (Math.PI * 2) / wedges.length;
      ctx.beginPath();
      ctx.moveTo(center, center);
      ctx.arc(center, center, radius, startAngle, endAngle);
      ctx.closePath();
      ctx.fillStyle = wedge.color;
      ctx.fill();

      // Text
      const angle = startAngle + (endAngle - startAngle) / 2;
      const textX = center + Math.cos(angle) * (radius * 0.6);
      const textY = center + Math.sin(angle) * (radius * 0.6);
      ctx.fillStyle = "white";
      ctx.font = "bold 14px system-ui";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(wedge.label, textX, textY);

      startAngle = endAngle;
    });
  }

  // Logging mode selection
  const log = JSON.parse(localStorage.getItem("activityLog")) || [];
  const streakElement = document.getElementById("streak");

  function updateStreak() {
    const today = new Date().toISOString().slice(0, 10);
    let streak = 0;
    for (let i = 0; i < log.length; i++) {
      const entryDate = log[log.length - 1 - i].date;
      const expectedDate = new Date();
      expectedDate.setDate(expectedDate.getDate() - i);
      const expected = expectedDate.toISOString().slice(0, 10);
      if (entryDate === expected) {
        streak++;
      } else {
        break;
      }
    }
    if (streakElement) {
      streakElement.innerHTML = `<span style="font-size: 20px;">🔥 ${streak}</span>`;
    }
  }

  updateStreak();

  document.querySelectorAll(".mode-button").forEach((btn) => {
    btn.addEventListener("click", () => {
      const mode = btn.dataset.mode;
      const today = new Date().toISOString().slice(0, 10);
      log.push({ date: today, mode });
      localStorage.setItem("activityLog", JSON.stringify(log));
      updateStreak();
    });
  });

  // Render history
  const historySection = document.getElementById("historyList");
  if (historySection && log.length > 0) {
    log.slice(-10).reverse().forEach((entry) => {
      const item = document.createElement("div");
      item.className = "history-entry";
      item.textContent = `${entry.date} — ${entry.mode}`;
      historySection.appendChild(item);
    });
  }
});
