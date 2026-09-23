const input = document.querySelector(".login_input");
const button = document.querySelector(".login_button");
const form = document.querySelector(".login-form");

input.addEventListener("input", validateInput);
form.addEventListener("submit", handleSubmit);

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
