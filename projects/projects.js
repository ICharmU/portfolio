import { fetchJSON, renderProjects } from "../global.js";

let title = document.createElement("h1");
title.innerHTML = 'Projects';
document.body.append(title);
let projectsClass = document.createElement("div");
projectsClass.classList.add("projects");
projectsClass.innerHTML = '';
document.body.append(projectsClass);

const projects = await fetchJSON("lib/projects.json");
const projectsContainer = document.querySelector(".projects");

const numProjects = renderProjects(projects, projectsContainer, "h2");
const h1Selector = document.querySelector('h1');
h1Selector.innerHTML = `${numProjects} ${h1Selector.innerHTML}`;


