<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>The Reset Compass</title>
  <link rel="stylesheet" href="main.css?v=36" />
  <link rel="icon" href="splash-icon.png" />
</head>
<body>
  <div id="splashScreen">
    <img src="splash-icon.png" id="splashIcon" alt="App Icon" />
  </div>

  <div id="welcomePopup" class="modal hidden">
    <div class="modal-content">
      <h2>Welcome to The Reset Compass</h2>
      <p>Choose your current state and get personalized activities to feel better fast.</p>
      <button id="startButton">Start</button>
    </div>
  </div>

  <header>
    <h1>The Reset Compass</h1>
    <nav>
      <button onclick="goHome()">Home</button>
      <button onclick="showQuickWins()">Quick Wins</button>
      <button onclick="showHistory()">History</button>
      <button onclick="showAbout()">About</button>
    </nav>
  </header>

  <main id="appContent" class="hidden">
    <section id="homeSection">
      <div class="compass-container">
        <svg id="compass" width="300" height="300" viewBox="0 0 300 300">
          <g>
            <path class="wedge growing" d="M150,150 L150,0 A150,150 0 0,1 300,150 Z" onclick="selectMode('Growing')"/>
            <path class="wedge drifting" d="M150,150 L300,150 A150,150 0 0,1 150,300 Z" onclick="selectMode('Drifting')"/>
            <path class="wedge surviving" d="M150,150 L150,300 A150,150 0 0,1 0,150 Z" onclick="selectMode('Surviving')"/>
            <path class="wedge grounded" d="M150,150 L0,150 A150,150 0 0,1 150,0 Z" onclick="selectMode('Grounded')"/>
          </g>
          <text x="205" y="80" text-anchor="middle" class="wedge-label">Growing</text>
          <text x="220" y="230" text-anchor="middle" class="wedge-label">Drifting</text>
          <text x="90" y="240" text-anchor="middle" class="wedge-label">Surviving</text>
          <text x="80" y="90" text-anchor="middle" class="wedge-label">Grounded</text>
        </svg>
      </div>

      <div id="modeButtons">
        <button class="mode-button growing" onclick="selectMode('Growing')">🚀 Growing</button>
        <button class="mode-button drifting" onclick="selectMode('Drifting')">🧭 Drifting</button>
        <button class="mode-button surviving" onclick="selectMode('Surviving')">🩺 Surviving</button>
        <button class="mode-button grounded" onclick="selectMode('Grounded')">🌿 Grounded</button>
      </div>

      <div id="modeDescription"></div>
    </section>

    <section id="quickWinsSection" class="hidden">
      <h2>Quick Wins</h2>
      <p>Here’s something simple to boost your day right now.</p>
    </section>

    <section id="historySection" class="hidden">
      <h2>Your History</h2>
      <ul id="historyList"></ul>
      <div class="stats"><span id="streakDisplay">🔥 0</span></div>
    </section>

    <section id="aboutSection" class="hidden">
      <h2>About</h2>
      <p>This app was created by Marcus Clark to help you reconnect with your wellbeing in under 5 minutes.</p>
      <p>Need support? <a href="mailto:marcus@evolutionofwellness.com">Contact us</a></p>
    </section>
  </main>

  <script src="app.js?v=6"></script>
</body>
</html>
