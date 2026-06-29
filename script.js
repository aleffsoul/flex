const SUPABASE_URL = "https://xonietulfhwsowoptaid.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_exd-0pOYim4Nm_0SouXykA_pSDisouE";

const year = document.querySelector("#year");
const publicShell = document.querySelectorAll("[data-public-shell]");
const appShell = document.querySelector("#appShell");
const loginForm = document.querySelector("#loginForm");
const signupButton = document.querySelector("#signupButton");
const logoutButton = document.querySelector("#logoutButton");
const loginMessage = document.querySelector("#loginMessage");
const appUserEmail = document.querySelector("#appUserEmail");
const profileForm = document.querySelector("#profileForm");
const profileMessage = document.querySelector("#profileMessage");
const releaseForm = document.querySelector("#releaseForm");
const releaseArtistSelect = document.querySelector("#releaseArtistSelect");

const appState = {
  session: null,
  selectedView: "dashboard",
  selectedArtistId: "lia-vector",
  selectedSongId: "neon-heart",
  calendarDate: new Date(),
  artists: [
    {
      id: "lia-vector",
      name: "Lia Vector",
      genre: "Pop futurista",
      avatar: "LV",
      bio: "Vocalista virtual com estética cyber, refrões luminosos e narrativa de cidade noturna.",
      socials: {
        instagram: "@liavector.ai",
        tiktok: "@liavector",
        youtube: "Lia Vector"
      },
      songs: [
        {
          id: "neon-heart",
          title: "Neon Heart",
          distributor: "Aurora Distro",
          releaseDate: "2026-07-18",
          streams: [12000, 18000, 24000, 33000, 47000, 62000]
        },
        {
          id: "synthetic-love",
          title: "Synthetic Love",
          distributor: "Aurora Distro",
          releaseDate: "2026-05-02",
          streams: [9000, 14000, 21000, 26000, 31000, 39000]
        }
      ]
    },
    {
      id: "nox-vale",
      name: "Nox Vale",
      genre: "Trap digital",
      avatar: "NV",
      bio: "Artista virtual de atmosfera escura, rimas fragmentadas e capítulos semanais.",
      socials: {
        instagram: "@noxvale",
        tiktok: "@noxverse",
        youtube: "Nox Vale"
      },
      songs: [
        {
          id: "black-cache",
          title: "Black Cache",
          distributor: "Midnight Flow",
          releaseDate: "2026-04-12",
          streams: [22000, 28000, 36000, 46000, 54000, 71000]
        }
      ]
    },
    {
      id: "mika-pulse",
      name: "Mika Pulse",
      genre: "Dance urbano",
      avatar: "MP",
      bio: "Performer digital para faixas dançantes, clipes curtos e campanhas de comunidade.",
      socials: {
        instagram: "@mikapulse",
        tiktok: "@pulse.mika",
        youtube: "Mika Pulse"
      },
      songs: [
        {
          id: "afterglow-step",
          title: "Afterglow Step",
          distributor: "Clubline",
          releaseDate: "2026-06-21",
          streams: [15000, 19000, 25000, 37000, 49000, 58000]
        }
      ]
    }
  ],
  releases: [
    {
      id: "release-1",
      date: "2026-07-05",
      title: "Pixel Rain",
      artistId: "lia-vector",
      distributor: "Aurora Distro"
    },
    {
      id: "release-2",
      date: "2026-07-19",
      title: "Ghost Mode",
      artistId: "nox-vale",
      distributor: "Midnight Flow"
    },
    {
      id: "release-3",
      date: "2026-08-02",
      title: "City BPM",
      artistId: "mika-pulse",
      distributor: "Clubline"
    }
  ],
  profile: {
    name: "Flex Music Admin",
    email: "",
    phone: "",
    country: "Brasil",
    currency: "BRL"
  }
};

if (year) {
  year.textContent = new Date().getFullYear();
}

function setMessage(element, text, type = "info") {
  if (!element) return;
  element.textContent = text;
  element.dataset.type = type;
}

if (!window.supabase) {
  setMessage(loginMessage, "Não foi possível carregar o Supabase. Recarregue a página em alguns segundos.", "error");
  throw new Error("Supabase client library was not loaded.");
}

const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY
);

function formatNumber(value) {
  return new Intl.NumberFormat("pt-BR").format(value);
}

function formatDate(dateString) {
  const date = new Date(`${dateString}T12:00:00`);
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", year: "numeric" }).format(date);
}

function getArtist(artistId) {
  return appState.artists.find((artist) => artist.id === artistId);
}

function getAllSongs() {
  return appState.artists.flatMap((artist) =>
    artist.songs.map((song) => ({
      ...song,
      artistId: artist.id,
      artistName: artist.name
    }))
  );
}

function getSongTotal(song) {
  return song.streams.reduce((total, value) => total + value, 0);
}

function createId(prefix) {
  if (crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return `${prefix}-${Date.now()}-${Math.round(Math.random() * 10000)}`;
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
  const userEmail = session?.user?.email || "";
  const isLoggedIn = Boolean(userEmail);

  appState.session = session;
  appState.profile.email = userEmail || appState.profile.email;

  publicShell.forEach((element) => {
    element.hidden = isLoggedIn;
  });

  if (appShell) appShell.hidden = !isLoggedIn;
  if (appUserEmail) appUserEmail.textContent = userEmail || "Sessão conectada";

  if (isLoggedIn) {
    setMessage(loginMessage, "");
    renderApp();
  }
}

async function signIn(email, password) {
  setLoading(true);
  setMessage(loginMessage, "Conectando ao Supabase...");

  const { error } = await supabaseClient.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    setMessage(loginMessage, error.message, "error");
  }

  setLoading(false);
}

async function signUp(email, password) {
  setLoading(true);
  setMessage(loginMessage, "Criando conta...");

  const { data, error } = await supabaseClient.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: window.location.href
    }
  });

  if (error) {
    setMessage(loginMessage, error.message, "error");
  } else if (data.session) {
    setMessage(loginMessage, "Conta criada e sessão iniciada.", "success");
  } else {
    setMessage(loginMessage, "Conta criada. Confira seu e-mail para confirmar o acesso.", "success");
  }

  setLoading(false);
}

function renderApp() {
  renderNavigation();
  renderDashboard();
  renderArtists();
  renderCalendar();
  renderProfile();
}

function renderNavigation() {
  document.querySelectorAll(".app-nav-item").forEach((button) => {
    button.classList.toggle("active", button.dataset.view === appState.selectedView);
  });

  document.querySelectorAll("[data-view-panel]").forEach((panel) => {
    panel.classList.toggle("active", panel.dataset.viewPanel === appState.selectedView);
  });
}

function renderDashboard() {
  const songs = getAllSongs();
  const totalStreams = songs.reduce((total, song) => total + getSongTotal(song), 0);

  document.querySelector("#metricArtists").textContent = formatNumber(appState.artists.length);
  document.querySelector("#metricSongs").textContent = formatNumber(songs.length);
  document.querySelector("#metricReleases").textContent = formatNumber(appState.releases.length);
  document.querySelector("#metricStreams").textContent = formatNumber(totalStreams);

  const topSongs = document.querySelector("#topSongs");
  topSongs.innerHTML = songs
    .sort((a, b) => getSongTotal(b) - getSongTotal(a))
    .slice(0, 5)
    .map((song) => `
      <button class="song-row" type="button" data-view-song="${song.artistId}:${song.id}">
        <span>
          <strong>${song.title}</strong>
          <small>${song.artistName}</small>
        </span>
        <b>${formatNumber(getSongTotal(song))}</b>
      </button>
    `)
    .join("");

  document.querySelector("#dashboardReleases").innerHTML = renderReleaseItems(appState.releases.slice(0, 4));
}

function renderArtists() {
  const artistList = document.querySelector("#artistList");
  const artistCountLabel = document.querySelector("#artistCountLabel");
  const selectedArtist = getArtist(appState.selectedArtistId) || appState.artists[0];
  const selectedSong = selectedArtist.songs.find((song) => song.id === appState.selectedSongId) || selectedArtist.songs[0];

  appState.selectedArtistId = selectedArtist.id;
  appState.selectedSongId = selectedSong?.id;
  artistCountLabel.textContent = `${appState.artists.length} artistas`;

  artistList.innerHTML = appState.artists
    .map((artist) => `
      <button class="artist-list-item ${artist.id === selectedArtist.id ? "active" : ""}" type="button" data-artist-id="${artist.id}">
        <span class="avatar">${artist.avatar}</span>
        <span>
          <strong>${artist.name}</strong>
          <small>${artist.genre}</small>
        </span>
      </button>
    `)
    .join("");

  document.querySelector("#artistDetail").innerHTML = `
    <div class="artist-profile">
      <span class="avatar large">${selectedArtist.avatar}</span>
      <div>
        <p class="artist-tag">${selectedArtist.genre}</p>
        <h3>${selectedArtist.name}</h3>
        <p>${selectedArtist.bio}</p>
      </div>
    </div>

    <div class="social-grid">
      <span>Instagram <strong>${selectedArtist.socials.instagram}</strong></span>
      <span>TikTok <strong>${selectedArtist.socials.tiktok}</strong></span>
      <span>YouTube <strong>${selectedArtist.socials.youtube}</strong></span>
    </div>

    <div class="catalog-layout">
      <div>
        <div class="panel-header">
          <h3>Catálogo</h3>
          <span>${selectedArtist.songs.length} músicas</span>
        </div>
        <div class="song-list">
          ${selectedArtist.songs.map((song) => `
            <button class="song-row ${song.id === selectedSong?.id ? "active" : ""}" type="button" data-song-id="${song.id}">
              <span>
                <strong>${song.title}</strong>
                <small>${formatDate(song.releaseDate)} • ${song.distributor}</small>
              </span>
              <b>${formatNumber(getSongTotal(song))}</b>
            </button>
          `).join("")}
        </div>
      </div>

      <div class="song-insights">
        ${selectedSong ? renderSongInsights(selectedSong) : "<p>Nenhuma música cadastrada.</p>"}
      </div>
    </div>

    <form class="compact-form add-song-form" id="songForm">
      <input type="text" name="title" placeholder="Nova música" required>
      <input type="date" name="releaseDate" required>
      <input type="text" name="distributor" placeholder="Distribuidora" required>
      <button class="button primary" type="submit">Cadastrar música</button>
    </form>
  `;
}

function renderSongInsights(song) {
  const months = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun"];
  const maxStreams = Math.max(...song.streams, 1);

  return `
    <div class="panel-header">
      <h3>${song.title}</h3>
      <span>${formatNumber(getSongTotal(song))} streams</span>
    </div>
    <div class="stream-chart">
      ${song.streams.map((value, index) => `
        <div class="bar-row">
          <span>${months[index]}</span>
          <div class="bar-track">
            <div class="bar-fill" style="width: ${(value / maxStreams) * 100}%"></div>
          </div>
          <strong>${formatNumber(value)}</strong>
        </div>
      `).join("")}
    </div>
  `;
}

function renderCalendar() {
  const calendarGrid = document.querySelector("#calendarGrid");
  const calendarTitle = document.querySelector("#calendarTitle");
  const month = appState.calendarDate.getMonth();
  const yearValue = appState.calendarDate.getFullYear();
  const firstDay = new Date(yearValue, month, 1);
  const daysInMonth = new Date(yearValue, month + 1, 0).getDate();
  const startOffset = firstDay.getDay();
  const monthName = new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" }).format(firstDay);

  calendarTitle.textContent = monthName;

  const dayNames = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
  const blanks = Array.from({ length: startOffset }, () => "<span class='calendar-empty'></span>");
  const days = Array.from({ length: daysInMonth }, (_item, index) => {
    const day = index + 1;
    const date = `${yearValue}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const releases = appState.releases.filter((release) => release.date === date);
    return `
      <button class="calendar-day" type="button" data-calendar-date="${date}">
        <strong>${day}</strong>
        ${releases.map((release) => `<span>${release.title}</span>`).join("")}
      </button>
    `;
  });

  calendarGrid.innerHTML = [
    ...dayNames.map((day) => `<b class="calendar-weekday">${day}</b>`),
    ...blanks,
    ...days
  ].join("");

  releaseArtistSelect.innerHTML = appState.artists
    .map((artist) => `<option value="${artist.id}">${artist.name}</option>`)
    .join("");

  document.querySelector("#releaseQueue").innerHTML = renderReleaseItems(appState.releases);
}

function renderReleaseItems(releases) {
  return releases
    .slice()
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((release) => {
      const artist = getArtist(release.artistId);
      return `
        <article class="release-item">
          <strong>${release.title}</strong>
          <span>${formatDate(release.date)} • ${artist?.name || "Artista"} • ${release.distributor}</span>
        </article>
      `;
    })
    .join("");
}

function renderProfile() {
  if (!profileForm) return;
  profileForm.elements.name.value = appState.profile.name;
  profileForm.elements.email.value = appState.profile.email;
  profileForm.elements.phone.value = appState.profile.phone;
  profileForm.elements.country.value = appState.profile.country;
  profileForm.elements.currency.value = appState.profile.currency;
}

document.addEventListener("click", (event) => {
  const navButton = event.target.closest("[data-view]");
  const artistButton = event.target.closest("[data-artist-id]");
  const songButton = event.target.closest("[data-song-id]");
  const dashboardSong = event.target.closest("[data-view-song]");
  const calendarDay = event.target.closest("[data-calendar-date]");

  if (navButton) {
    appState.selectedView = navButton.dataset.view;
    renderApp();
  }

  if (artistButton) {
    appState.selectedArtistId = artistButton.dataset.artistId;
    appState.selectedSongId = getArtist(appState.selectedArtistId).songs[0]?.id;
    renderArtists();
  }

  if (songButton) {
    appState.selectedSongId = songButton.dataset.songId;
    renderArtists();
  }

  if (dashboardSong) {
    const [artistId, songId] = dashboardSong.dataset.viewSong.split(":");
    appState.selectedView = "artists";
    appState.selectedArtistId = artistId;
    appState.selectedSongId = songId;
    renderApp();
  }

  if (calendarDay && releaseForm) {
    releaseForm.date.value = calendarDay.dataset.calendarDate;
    releaseForm.title.focus();
  }
});

document.querySelector("#prevMonth")?.addEventListener("click", () => {
  appState.calendarDate.setMonth(appState.calendarDate.getMonth() - 1);
  renderCalendar();
});

document.querySelector("#nextMonth")?.addEventListener("click", () => {
  appState.calendarDate.setMonth(appState.calendarDate.getMonth() + 1);
  renderCalendar();
});

document.addEventListener("submit", (event) => {
  if (event.target.id === "songForm") {
    event.preventDefault();
    const formData = new FormData(event.target);
    const artist = getArtist(appState.selectedArtistId);
    const newSong = {
      id: createId("song"),
      title: String(formData.get("title")),
      releaseDate: String(formData.get("releaseDate")),
      distributor: String(formData.get("distributor")),
      streams: [0, 0, 0, 0, 0, 0]
    };

    artist.songs.push(newSong);
    appState.selectedSongId = newSong.id;
    event.target.reset();
    renderApp();
  }
});

if (releaseForm) {
  releaseForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const formData = new FormData(releaseForm);
    appState.releases.push({
      id: createId("release"),
      date: String(formData.get("date")),
      title: String(formData.get("title")),
      artistId: String(formData.get("artistId")),
      distributor: String(formData.get("distributor"))
    });
    releaseForm.reset();
    renderApp();
  });
}

if (profileForm) {
  profileForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const formData = new FormData(profileForm);
    const newPassword = String(formData.get("newPassword") || "");

    appState.profile = {
      name: String(formData.get("name") || ""),
      email: String(formData.get("email") || ""),
      phone: String(formData.get("phone") || ""),
      country: String(formData.get("country") || ""),
      currency: String(formData.get("currency") || "BRL")
    };

    if (newPassword) {
      const { error } = await supabaseClient.auth.updateUser({ password: newPassword });
      if (error) {
        setMessage(profileMessage, error.message, "error");
        return;
      }
    }

    profileForm.elements.newPassword.value = "";
    setMessage(profileMessage, "Perfil salvo com sucesso.", "success");
  });
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
