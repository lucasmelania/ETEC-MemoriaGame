const input = document.querySelector(".login_input");
const button = document.querySelector(".login_button");
const form = document.querySelector(".login-form");
const rankingList = document.querySelector(".ranking-list");

input.addEventListener("input", validateInput);
form.addEventListener("submit", handleSubmit);

function renderRanking() {
  const ranking = window.HyruleRanking.getRanking();
  rankingList.replaceChildren();

  if (!ranking.length) {
    const emptyState = document.createElement("li");
    emptyState.className = "ranking-empty";
    emptyState.textContent = "Ainda não há tempos registrados.";
    rankingList.appendChild(emptyState);
    return;
  }

  ranking.forEach((entry, index) => {
    const item = document.createElement("li");
    const position = document.createElement("span");
    const name = document.createElement("strong");
    const time = document.createElement("time");

    position.className = "ranking-position";
    name.className = "ranking-name";
    time.className = "ranking-time";
    position.textContent = `#${index + 1}`;
    name.textContent = entry.name;
    time.textContent = window.HyruleRanking.formatTime(entry.seconds);
    time.dateTime = `PT${entry.seconds}S`;

    item.append(position, name, time);
    rankingList.appendChild(item);
  });
}

function validateInput({ target }) {
  if (target.value.length > 2) {
    button.removeAttribute("disabled");
  } else {
    button.setAttribute("disabled", "");
  }
}

function handleSubmit(event) {
  event.preventDefault();

  localStorage.setItem("player", input.value);
  window.location = "pages/game.html";
}

renderRanking();

const bgVideo = document.querySelector(".bg-video");
if (bgVideo) {
  bgVideo.play().catch(() => {});
}
