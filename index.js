import {fetchJSON, renderProjects, fetchGithubData} from './global.js';

const projects = await fetchJSON('./projects/lib/projects.json');
const latestProjects = projects?.slice(0,3);

const projectsContainer = document.querySelector('.projects');
renderProjects(latestProjects, projectsContainer);

const githubData = await fetchGithubData('icharmu');
const profileStats = document.querySelector('#profile-stats');

if (profileStats) {
    profileStats.innerHTML = `
        <dl>
            <dt>Public Repos</dt><dd>${githubData.public_repos}</dd>
            <dt>Public Gists</dt><dd>${githubData.public_gists}</dd>
            <dt>Followers</dt><dd>${githubData.followers}</dd>
            <dt>Following</dt><dd>${githubData.following}</dd>
        </dl>
    `;
}

