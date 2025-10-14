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




