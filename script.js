const SUPABASE_URL = "https://xonietulfhwsowoptaid.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_exd-0pOYim4Nm_0SouXykA_pSDisouE";

const year = document.querySelector("#year");
const loginForm = document.querySelector("#loginForm");
const signupButton = document.querySelector("#signupButton");
const logoutButton = document.querySelector("#logoutButton");
const loginMessage = document.querySelector("#loginMessage");
const accountPanel = document.querySelector("#accountPanel");
const accountEmail = document.querySelector("#accountEmail");

const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY
);

if (year) {
  year.textContent = new Date().getFullYear();
}

function setMessage(text, type = "info") {
  if (!loginMessage) return;
  loginMessage.textContent = text;
  loginMessage.dataset.type = type;
}

function setLoading(isLoading) {
  const buttons = [loginForm?.querySelector("button[type='submit']"), signupButton, logoutButton];
  buttons.forEach((button) => {
    if (button) button.disabled = isLoading;
  });
}

function getCredentials() {
  const formData = new FormData(loginForm);
  return {
    email: String(formData.get("email") || "").trim(),
    password: String(formData.get("password") || "")
  };
}

function renderSession(session) {
  const userEmail = session?.user?.email;
  const isLoggedIn = Boolean(userEmail);

  if (loginForm) loginForm.hidden = isLoggedIn;
  if (accountPanel) accountPanel.hidden = !isLoggedIn;
  if (accountEmail) accountEmail.textContent = userEmail || "Sessão conectada";

  if (isLoggedIn) {
    setMessage("");
  }
}

async function signIn(email, password) {
  setLoading(true);
  setMessage("Conectando ao Supabase...");

  const { error } = await supabaseClient.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    setMessage(error.message, "error");
  }

  setLoading(false);
}

async function signUp(email, password) {
  setLoading(true);
  setMessage("Criando conta...");

  const { data, error } = await supabaseClient.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: window.location.href
    }
  });

  if (error) {
    setMessage(error.message, "error");
  } else if (data.session) {
    setMessage("Conta criada e sessão iniciada.", "success");
  } else {
    setMessage("Conta criada. Confira seu e-mail para confirmar o acesso.", "success");
  }

  setLoading(false);
}

if (loginForm) {
  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const { email, password } = getCredentials();
    await signIn(email, password);
  });
}

if (signupButton) {
  signupButton.addEventListener("click", async () => {
    const { email, password } = getCredentials();
    await signUp(email, password);
  });
}

if (logoutButton) {
  logoutButton.addEventListener("click", async () => {
    setLoading(true);
    await supabaseClient.auth.signOut();
    setLoading(false);
  });
}

supabaseClient.auth.onAuthStateChange((_event, session) => {
  renderSession(session);
});

supabaseClient.auth.getSession().then(({ data }) => {
  renderSession(data.session);
});
