document.addEventListener("DOMContentLoaded", function () {
  const popup = document.getElementById("welcomePopup");
  const startButton = document.getElementById("startButton");

  // Show popup only first time
  if (!localStorage.getItem("popupShown")) {
    popup.style.display = "block";
    startButton.addEventListener("click", function () {
      popup.style.display = "none";
      localStorage.setItem("popupShown", "true");
    });
  }

  const modeButtons = document.querySelectorAll("#mode-buttons button");
  const wedges = document.querySelectorAll(".wedge");

  modeButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      const mode = btn.dataset.mode;
      window.location.href = `${mode}.html`;
    });
  });

  wedges.forEach(wedge => {
    wedge.addEventListener("click", () => {
      const mode = wedge.dataset.mode;
      window.location.href = `${mode}.html`;
    });
  });
});