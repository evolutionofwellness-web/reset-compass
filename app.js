document.addEventListener("DOMContentLoaded", () => {
  const splash = document.getElementById("splashScreen");
  const welcome = document.getElementById("welcomePopup");
  const startButton = document.getElementById("startButton");

  if (!localStorage.getItem("welcomeShown")) {
    welcome.style.display = "block";
    startButton.addEventListener("click", () => {
      welcome.style.display = "none";
      localStorage.setItem("welcomeShown", "true");
    });
  }

  setTimeout(() => splash.style.display = "none", 3000);
});

function navigate(sectionId) {
  document.querySelectorAll("main .section").forEach(section => {
    section.style.display = "none";
  });
  document.getElementById(sectionId).style.display = "block";
}

function selectMode(mode) {
  const modeData = {
    growing: ["Take a bold step", "Tackle a challenge", "Create momentum"],
    drifting: ["Pause and reflect", "Refocus attention", "Break the cycle"],
    surviving: ["Breathe", "Drink water", "Do one small thing"],
    grounded: ["Reconnect to purpose", "Feel your body", "Move gently"]
  };

  const activityList = document.getElementById("activityList");
  const modeTitle = document.getElementById("modeTitle");

  modeTitle.textContent = `${mode.charAt(0).toUpperCase() + mode.slice(1)} Mode`;
  activityList.innerHTML = "";

  modeData[mode].forEach((activity, i) => {
    const li = document.createElement("li");
    li.innerHTML = `<strong>${activity}</strong><br/><textarea placeholder="What did you do?"></textarea>`;
    activityList.appendChild(li);
  });

  navigate("modeSection");
}