const year = document.querySelector("#year");
const loginForm = document.querySelector("#loginForm");
const loginMessage = document.querySelector("#loginMessage");

if (year) {
  year.textContent = new Date().getFullYear();
}

if (loginForm && loginMessage) {
  loginForm.addEventListener("submit", (event) => {
    event.preventDefault();
    loginMessage.textContent = "Portal visual criado. A autenticação real entra na próxima etapa.";
  });
}
