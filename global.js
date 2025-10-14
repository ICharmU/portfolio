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

preferredColorScheme = matchMedia("(prefers-color-scheme: light)").matches ? "Light" : "Dark";
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

select = document.querySelector("select");
select.addEventListener("input", event => {
    preference = event.target.value
    setColorScheme(preference);
    localStorage.colorScheme = preference;
    // console.log(`color scheme changed to ${event.target.value}`);
});

if ("colorScheme" in localStorage) {
    preference = localStorage.colorScheme;
    setColorScheme(preference);
    select.value = preference;
}

form = document.querySelector("form");
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




