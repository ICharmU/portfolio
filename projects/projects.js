import { fetchJSON, renderProjects } from "../global.js";
import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';

let title = document.querySelector("h1");
title.innerHTML = 'Projects';
let projectsClass = document.createElement("div");
projectsClass.classList.add("projects");
projectsClass.innerHTML = '';
document.body.append(projectsClass);

let projects = await fetchJSON("lib/projects.json");
const projectsContainer = document.querySelector(".projects");

let numProjects = await renderProjects(projects, projectsContainer, "h2");
title.innerHTML = `${numProjects} ${title.innerHTML}`;

// Search
const renderSearch = (selectedProjects) => {
    selectedProjects = selectedProjects.sort((b, a) => parseInt(a.year) - parseInt(b.year));

    let arcGenerator = d3.arc().innerRadius(0).outerRadius(50);
    let rolledData = d3.rollups(
        selectedProjects,
        v => v.length,
        d => d.year
    );

    let data = rolledData.map(([year, count]) => {
        return {value: count, label: year};
    });

    let sliceGenerator = d3.pie().value((d) => d.value);
    let arcData = sliceGenerator(data);
    let arcs = arcData.map((d) => arcGenerator(d));
    let colors = d3.scaleOrdinal(d3.schemeTableau10);

    arcs.forEach((arc, ix) => {
        d3.select("svg")
            .append("path")
            .attr("d", arc)
            .attr("fill", colors(ix));
    });

    let legend = d3.select(".legend");
    data.forEach((d, ix) => {
        let currYear = d.label;
        let yearColor = colors(ix);

        legend.append("li")
            .attr("style", `--color:${yearColor}`)
            .attr("class", `chart-${ix}`)
            .html(`<span class="swatch"></span> ${currYear} <em>(${d.value})</em>`);
    });
};

// trying to get unique years
renderSearch(projects);

let query = "";
let searchInput = document.querySelector(".searchBar");

searchInput.addEventListener("input", event => {
    query = event.target.value.toLowerCase();
    let searchProjects = projects.filter(project => {
        let projectFullData = Object.values(project).join("\n").toLowerCase();
        return projectFullData.includes(query);
    });
    renderProjects(searchProjects, projectsContainer, "h2");

    // Generate Query-specific Pie Chart
    document.querySelector("svg").innerHTML = "";
    document.querySelector(".legend").innerHTML = "";
    renderSearch(searchProjects);
});

// continue with making sure the colors don't change when querying