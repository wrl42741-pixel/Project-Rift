const express = require("express");
const app = express();

const PORT = 3000;
const lobby = [];

app.use(express.static("public"));

app.get("/old", (req, res) => {
  res.send(`
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>C4S2 Project</title>
<style>
body {
  background:#111;
  color:white;
  font-family:Arial;
  text-align:center;
  padding-top:100px;
}
.box {
  display:inline-block;
  background:#222;
  padding:40px;
  border-radius:20px;
}
button {
  padding:15px 30px;
  font-size:18px;
  border:0;
  border-radius:10px;
}
</style>
</head>
<body>
<div class="box">
<h1>Fortnite C4S2 Project</h1>
<h2>Lobby</h2>
<p>Players online: <span id="count">0</span></p>
<button onclick="location.reload()">Refresh</button>
</div>
</body>
</html>
  `);
});

app.get("/api/lobby", (req, res) => {
  res.json({
    players: lobby,
    count: lobby.length
  });
});

app.listen(PORT, () => {
  console.log(`C4S2 server running on port ${PORT}`);
});
