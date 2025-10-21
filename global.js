let pages = [
    {url: "", title: "Home"},
    {url: "contact/", title: "Contact"},
    {url: "projects/", title: "Projects"},
    {url: "cv/", title: "Resume"},
    {url: "coursework/", title: "Coursework"},
    {url: "https://github.com/ICharmU", title: "GitHub"},
];

let nav = document.createElement("nav");
document.body.prepend(nav);

for (let p of pages) {
    let url = p.url;
    let title = p.title;
    const BASE_PATH = (location.hostname === "localhost" || location.hostname === "127.0.0.1") ? "/" : "/portfolio/";
    url = !url.startsWith("http") ? BASE_PATH + url : url;
    let a = document.createElement("a");
    a.href = url;
    a.textContent = title;
    nav.append(a);

    a.classList.toggle(
        "current",
        a.host === location.host && a.pathname === location.pathname,
    );

    a.target = "_blank";
    a.toggleAttribute(
        "target",
        a.host !== location.host,
    );
}

let preferredColorScheme = window.matchMedia("(prefers-color-scheme: light)").matches ? "Light" : "Dark";
document.body.insertAdjacentHTML(
    "afterbegin",
    `
    <label class="color-scheme">
        Theme:
        <select>
            <option value="light dark">Automatic (${preferredColorScheme})</option>
            <option value="light">Light</option>
            <option value="dark">Dark</option>
        </select>
    </label>
    `,
);

const setColorScheme = (preference) => {
    document.documentElement.style.setProperty("color-scheme", preference);
}

let select = document.querySelector("select");
select.addEventListener("input", event => {
    let preference = event.target.value
    setColorScheme(preference);
    localStorage.colorScheme = preference;
    // console.log(`color scheme changed to ${event.target.value}`);
});

if ("colorScheme" in localStorage) {
    let preference = localStorage.colorScheme;
    setColorScheme(preference);
    select.value = preference;
}

let form = document.querySelector("form");
form?.addEventListener("submit", event => {
    event.preventDefault();
    data = new FormData(form);
    build_url = `${form.action}?`;
    for (let [name, value] of data) {
        value = encodeURIComponent(value);
        build_url += `${name}=${value}&`;
        console.log(build_url);
    }
    location.href = build_url;
});

export async function fetchJSON(url) {
  try {
    // Fetch the JSON file from the given URL
    const response = await fetch(url);

    if (!response.ok) {
        throw new Error(`Failed to fetch projects: ${response.statusText}`);
    }
    console.log(response)

    const data = await response.json();
    return data;

  } catch (error) {
    console.error('Error fetching or parsing JSON data:', error);
  }
}

export function renderProjects(projects, containerElement, headingLevel='h2') {
    containerElement.innerHTML = '';
    const BASE_PATH = (location.hostname === "localhost" || location.hostname === "127.0.0.1") ? "/" : "/portfolio/";
    for (let project of projects) {
        const article = document.createElement('article');
        // include URL if it exists, otherwise don't hyperlink the project title
        console.log(project.image);
        const insert_url = project.url !== "none" ? project.url : "";
        let image_path = BASE_PATH + project.image;
        image_path = image_path.includes("https") && !image_path.includes("icharmu") ? project.image : image_path;
        console.log(image_path);
        article.innerHTML = `
            <${headingLevel}>${insert_url.length > 0 ? `<a href=${insert_url}>` : ""}${project.title}${insert_url?.length > 0 ? `</a>` : ""}</${headingLevel}>
            <img src="${image_path}" alt="${project.title}">
            <p>${project.description}</p>
        `;
        containerElement.appendChild(article);
    }
    return projects.length;
}

export async function fetchGithubData(username) {
    const URL = `https://api.github.com/users/${username}`;
    return fetchJSON(URL);
}

