import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';
import scrollama from 'https://cdn.jsdelivr.net/npm/scrollama@3.2.0/+esm';

const loadData = async () => {
  const data = await d3.csv("loc.csv", row => ({
    ...row,
    line: +row.line,
    depth: Number(row.depth),
    length: +row.length,
    date: new Date(row.date + "T00:00" + row.timezone),
    datetime: new Date(row.time),
  }));



  return data;
}
let xScale;
let yScale;
const processCommits = (data) => {
  return d3
          .groups(data, d => d.commit)
          .map(([commit, lines]) => {
            let {author, date, time, timezone, datetime} = lines[0];
            let numLines = lines.length;  

            const hours = + time.split(":")[0];
            const minutes = time.split(":")[1] / 60;
            
            // Combine date and time into datetime
            const combinedDateTime = new Date(date);
            combinedDateTime.setHours(hours, Math.floor(minutes * 60), 0, 0);
            
            let ret = {
              id: commit,
              commit_url: `https://github.com/ICharmU/portfolio/commit/${commit}`,
              author,
              date,
              time,
              timezone,
              datetime: combinedDateTime,
              numLines,
              hourFrac: hours + minutes,
            };
            
            Object.defineProperty(ret, "lines", {
              value: lines,
              configurable: false,
              writable: false,
              enumerable: true,
            });

            return ret;
          });


}

const renderCommitInfo = (data, commits) => {
  d3.select("#stats").selectAll("*").remove(); // Clear existing content
  const dl = d3.select("#stats").append("dl").attr("class", "stats");
  dl.append("dt").html('Total <abbr title="Lines of Code">LOC</abbr>');
  dl.append("dd").text(data.length);

  dl.append("dt").text("Total Commits");
  dl.append("dd").text(commits.length);

  const commitDays = commits.reduce((acc, c) => {
    const day = c.date?.getDay()
    if (day !== null) {
      acc[day] = (acc[day] || 0) + 1;
    }
    return acc;
  }, {});

  let mostCommits = 0;
  let mostCommitsDay;
  for (let day in commitDays) {
    if (commitDays[day] > mostCommits) {
      mostCommits = commitDays[day];
      mostCommitsDay = day; 
    }
  }

  const weekday = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];

  dl.append("dt").text("Most Active");
  dl.append("dd").text(`${weekday[mostCommitsDay]}s`);

  const totalLOC = d3.count(data, d => d.line);

  dl.append("dt").text("LOC Modified");
  dl.append("dd").text(`${totalLOC} Lines`);

  const deepestLine = d3.max(data, d => d.depth);

  dl.append("dt").text("Max Depth");
  dl.append("dd").text(deepestLine);

  const workByPeriod = d3.rollups(
    data,
    v => v.length,
    d => new Date(d.date).toLocaleString("en", {dayPeriod: "short"}),
  );
  const maxPeriod = d3.greatest(workByPeriod, d => d[1])?.[0];
  dl.append("dt").text("Working...");
  dl.append("dd").text(maxPeriod);
}

const renderScatterPlot = (data, commits) => {
  const sortedCommits = d3.sort(commits, (d) => -d.totalLines);
  const width = 1000;
  const height = 600;

  const svg = d3.select("#chart")
                  .append("svg")
                  .attr("viewBox", `0 0 ${width} ${height}`)
                  .style("overflow", "visible")

  xScale = d3.scaleTime()
                    .domain(d3.extent(commits, d => d.date))
                    .range([0, width])
                    .nice();

  yScale = d3.scaleLinear().domain([0,24]).range([height, 0]);

  const margin = { top: 10, right: 10, bottom: 30, left: 20 };
  const usableArea = {
    top: margin.top,
    right: width - margin.right,
    bottom: height - margin.bottom,
    left: margin.left,
    width: width - margin.left - margin.right,
    height: height - margin.top - margin.bottom,
  };

  // Update scales with new ranges
  xScale.range([usableArea.left, usableArea.right]);
  yScale.range([usableArea.bottom, usableArea.top]);

  // Add gridlines BEFORE the axes
  // change gridline color by time of day
  const gridlines = svg
    .append('g')
    .attr('class', 'gridlines')
    .attr('transform', `translate(${usableArea.left}, 0)`)
  

  // Create gridlines as an axis with no labels and full-width ticks
  gridlines.call(d3.axisLeft(yScale).tickFormat('').tickSize(-usableArea.width));
  
  const yTicks = yScale.ticks();

  // sequential color scale across tick indices
  const color = d3.scaleSequential()
    .domain([Math.max(1, yTicks.length - 1), 0])
    .interpolator(d3.interpolateWarm);

  // create a <line> per tick and color it
  gridlines.selectAll('line.grid')
    .data(yTicks)
    .join('line')
    .attr('class', 'grid')
    .attr('x1', 0)
    .attr('x2', usableArea.width)
    .attr('y1', d => yScale(d))
    .attr('y2', d => yScale(d))
    .attr('stroke', (d, i) => color(i))
    .attr('stroke-width', 1)
    .attr('opacity', 0.8);

  // Create the axes
  const xAxis = d3.axisBottom(xScale);
  const yAxis = d3.axisLeft(yScale)
                  .tickFormat((d) => String(d % 24).padStart(2, '0') + ':00');;

  svg
    .append('g')
    .attr('transform', `translate(0, ${usableArea.bottom})`)
    .attr('class', 'x-axis') // new line to mark the g tag
    .call(xAxis);

  svg
    .append('g')
    .attr('transform', `translate(${usableArea.left}, 0)`)
    .attr('class', 'y-axis') // just for consistency
    .call(yAxis);

  const dots = svg.append("g").attr("class", "dots");
  const [minLines, maxLines] = d3.extent(commits, (d) => d.numLines);
  const rScale = d3.scaleSqrt().domain([minLines, maxLines]).range([12, 36]); // adjust these values based on your experimentation

  dots.selectAll("circle")
        .data(sortedCommits, (d) => d.id)
        .join("circle")
        .attr("cx", d => xScale(d.date))
        .attr("cy", d => yScale(d.hourFrac))
        .attr("r", 5)
        .attr("fill", "steelblue")
        .attr('r', (d) => rScale(d.numLines))
        .style('fill-opacity', 0.7) // Add transparency for overlapping dots
        .on('mouseenter', (event, commit) => {
          d3.select(event.currentTarget).style('fill-opacity', 1); // Full opacity on hover
          renderTooltipContent(commit);
          updateTooltipVisibility(true);
          updateTooltipPosition(event);
        })
        .on('mouseleave', (event) => {
          d3.select(event.currentTarget).style('fill-opacity', 0.7);
          updateTooltipVisibility(false);
        });



  function createBrushSelector(svg) {
    svg.call(d3.brush().on('start brush end', brushed));
    svg.selectAll('.dots, .overlay ~ *').raise();
  }

  function brushed(event) {
    const selection = event.selection;
    d3.selectAll('circle').classed('selected', (d) =>
      isCommitSelected(selection, d),
    );
    renderSelectionCount(selection);
    renderLanguageBreakdown(selection); 
  }

  function renderSelectionCount(selection) {
    const selectedCommits = selection
      ? commits.filter((d) => isCommitSelected(selection, d))
      : [];

    const countElement = document.querySelector('#selection-count');
    countElement.textContent = `${
      selectedCommits.length || 'No'
    } commits selected`;

    return selectedCommits;
  }

  function isCommitSelected(selection, commit) {
    if (!selection) {
      return false; 
    } 
    const [x0, x1] = selection.map((d) => d[0]);
    const [y0, y1] = selection.map((d) => d[1]); 
    const x = xScale(commit.date); 
    const y = yScale(commit.hourFrac); 

    return x >= x0 && x <= x1 && y >= y0 && y <= y1; 
  }

  createBrushSelector(svg);

  function renderLanguageBreakdown(selection) {
    const selectedCommits = selection
      ? commits.filter((d) => isCommitSelected(selection, d))
      : [];
    const container = d3.select('#language-breakdown');

    if (selectedCommits.length === 0) {
      container.selectAll('*').remove();
      return;
    }
    const requiredCommits = selectedCommits.length ? selectedCommits : commits;
    const lines = requiredCommits.flatMap((d) => d.lines);

    // Use d3.rollup to count lines per language
    const breakdown = d3.rollup(
      lines,
      (v) => v.length,
      (d) => d.type,
    );

    // Clear existing content
    container.selectAll('*').remove();

    // Create dt/dd pairs for each language
    Array.from(breakdown).forEach(([language, count]) => {
      const proportion = count / lines.length;
      const formatted = d3.format('.1~%')(proportion);
      
      container.append('dt').text(language);
      container.append('dd').text(`${count} lines (${formatted})`);
    });
  }
};

// Tooltip functions - accessible to both renderScatterPlot and updateScatterPlot
const renderTooltipContent = (commit) => {
  const link = document.getElementById('commit-link');
  const date = document.getElementById('commit-date');
  const time = document.getElementById('commit-time');
  const author = document.getElementById('commit-author');
  const linesEdited = document.getElementById('commit-lines-edited');

  if (Object.keys(commit).length === 0) return;

  link.href = commit.commit_url;
  link.textContent = commit.id;
  date.textContent = commit.date?.toLocaleString('en', {
    dateStyle: 'full',
  });
  time.textContent = commit.time;
  author.textContent = commit.author;
  linesEdited.textContent = commit.numLines;
};

function updateTooltipVisibility(isVisible) {
  const tooltip = document.getElementById('commit-tooltip');
  tooltip.hidden = !isVisible;
}

function updateTooltipPosition(event) {
  const tooltip = document.getElementById('commit-tooltip');
  tooltip.style.left = `${event.clientX+5}px`;
  tooltip.style.top = `${event.clientY+5}px`;
}

const tooltip = document.getElementById('commit-tooltip');
tooltip.classList.add("add-frost");

let data = await loadData();

let commits = processCommits(data);
// Sort commits by datetime for proper chronological scrollytelling
commits = d3.sort(commits, d => d.datetime);

renderCommitInfo(data, commits);
renderScatterPlot(data, commits);

console.log(commits);

let commitProgress = 100;
let timeScale = d3
  .scaleTime()
  .domain([
    d3.min(commits, (d) => d.datetime),
    d3.max(commits, (d) => d.datetime),
  ])
  .range([0, 100]);
let commitMaxTime = timeScale.invert(commitProgress);
let maxTimeReached = commitMaxTime; // Track the maximum time we've reached
console.log(commitMaxTime);

const dateSlider = document.getElementById("commit-progress");
const commitTime = document.getElementById("commit-slider-time");
commitTime.innerText = commitMaxTime.toLocaleString();  

let filteredCommits = commits;

// Create color scale once with all possible file types to ensure consistent colors
const allLines = commits.flatMap(d => d.lines);
const allFileTypes = [...new Set(allLines.map(d => d.type))].sort();
const colors = d3.scaleOrdinal(d3.schemeTableau10).domain(allFileTypes);

const updateFilesList = (filteredCommits) => {
  let lines = filteredCommits.flatMap((d) => d.lines);
  let files = d3
    .groups(lines, (d) => d.file)
    .map(([name, lines]) => {
      // Get the most common type for this file
      const typeCount = d3.rollup(lines, v => v.length, d => d.type);
      const mostCommonType = d3.greatest(Array.from(typeCount), ([type, count]) => count)[0];
      return { name, lines, type: mostCommonType };
    })
    .sort((a, b) => b.lines.length - a.lines.length);
  let filesContainer = d3
    .select('#files')
    .selectAll('div')
    .data(files, (d) => d.name)
    .join(
      // This code only runs when the div is initially rendered
      (enter) =>
        enter.append('div').call((div) => {
          const dt = div.append('dt');
          dt.append('code');
          dt.append('div').attr('class', 'line-count');
          div.append('dd');
        }),
    )
    .attr('style', (d) => `--color: ${colors(d.type)}`);
    

  filesContainer
    .select('dt > code')
    .text((d) => d.name);
  filesContainer
    .select('dt > .line-count')
    .text((d) => `${d.lines.length} lines`);
  
  // Clear dd and add dots for each line
  const ddSelection = filesContainer.select('dd');
  ddSelection.text(''); // Clear any existing text
  
  // Add dots for each line
  ddSelection
    .selectAll('div.commit-dot')
    .data((d) => d.lines)
    .join('div')
    .attr('class', 'commit-dot loc');
};

// Initialize files list
updateFilesList(filteredCommits);

const onTimeSliderChange = () => {
dateSlider.addEventListener("input", (event) => {
  commitProgress = event.target.value;
  commitMaxTime = timeScale.invert(commitProgress);
  commitTime.innerText = commitMaxTime.toLocaleString();  

  filteredCommits = commits.filter((d) => d.datetime <= commitMaxTime);
  updateScatterPlot(data, filteredCommits);
  updateFilesList(filteredCommits);
  console.log("updated");
});
};

function updateScatterPlot(data, commits) {
const width = 1000;
const height = 600;
const margin = { top: 10, right: 10, bottom: 30, left: 20 };
const usableArea = {
  top: margin.top,
  right: width - margin.right,
  bottom: height - margin.bottom,
  left: margin.left,
  width: width - margin.left - margin.right,
  height: height - margin.top - margin.bottom,
};

const svg = d3.select('#chart').select('svg');

xScale = xScale.domain(d3.extent(commits, (d) => d.datetime));

const [minLines, maxLines] = d3.extent(commits, (d) => d.numLines);
const rScale = d3.scaleSqrt().domain([minLines, maxLines]).range([12, 36]);

const xAxis = d3.axisBottom(xScale);

// CHANGE: we should clear out the existing xAxis and then create a new one.
const xAxisGroup = svg.select('g.x-axis');
xAxisGroup.selectAll('*').remove();
xAxisGroup.call(xAxis);

const dots = svg.select('g.dots');

const sortedCommits = d3.sort(commits, (d) => -d.numLines);
dots
  .selectAll('circle')
  .data(sortedCommits, (d) => d.id)
  .join('circle')
  .attr('cx', (d) => xScale(d.datetime))
  .attr('cy', (d) => yScale(d.hourFrac))
  .attr('r', (d) => rScale(d.numLines))
  .attr('fill', 'steelblue')
  .style('fill-opacity', 0.7) // Add transparency for overlapping dots
  .on('mouseenter', (event, commit) => {
    d3.select(event.currentTarget).style('fill-opacity', 1); // Full opacity on hover
    renderTooltipContent(commit);
    updateTooltipVisibility(true);
    updateTooltipPosition(event);
  })
  .on('mouseleave', (event) => {
    d3.select(event.currentTarget).style('fill-opacity', 0.7);
    updateTooltipVisibility(false);
  });
}

onTimeSliderChange();

console.log(timeScale.domain());

d3.select('#scatter-story')
  .selectAll('.step')
  .data(commits)
  .join('div')
  .attr('class', 'step')
  .html(
    (d, i) => `
		On ${d.datetime.toLocaleString('en', {
      dateStyle: 'full',
      timeStyle: 'short',
    })},
		I made <a href="${d.commit_url}" target="_blank">${
      i > 0 ? 'another glorious commit' : 'my first commit, and it was glorious'
    }</a>.
		I edited ${d.numLines} lines across ${
      d3.rollups(
        d.lines,
        (D) => D.length,
        (d) => d.file,
      ).length
    } files.
		Then I looked over all I had made, and I saw that it was very good.
	`,
  );

function onStepEnter(response) {
  console.log(response);
  
  // Get the step index from the response
  const rawStepIndex = response.index;
  
  if (rawStepIndex >= commits.length - 1) {
    // If we're past the last commit, stick to showing all commits
    commitMaxTime = d3.max(commits, (d) => d.datetime);
    maxTimeReached = commitMaxTime;
    
    // Update the time scale progress value
    commitProgress = 100;
    
    // Update the slider position to max
    dateSlider.value = commitProgress;
    commitTime.innerText = commitMaxTime.toLocaleString();
    
    // Show all commits
    filteredCommits = commits;
    
    // Update the visualizations
    updateScatterPlot(data, filteredCommits);
    updateFilesList(filteredCommits);
    
    console.log(`Scrolled past last commit (step ${rawStepIndex}), showing all ${filteredCommits.length} commits (sticky mode)`);
  } else {
    // Normal step progression - but only if we haven't been in sticky mode or we're going backwards
    const targetCommit = commits[rawStepIndex];
    
    if (targetCommit) {
      // Only update if this step's time is before or equal to our max reached time
      // This allows going backwards but prevents resetting when coming back from sticky mode
      const targetTime = targetCommit.datetime;
      
      if (targetTime <= maxTimeReached || rawStepIndex === 0) {
        commitMaxTime = targetTime;
        
        // Update max time reached if we're progressing forward
        if (targetTime > maxTimeReached) {
          maxTimeReached = targetTime;
        }
        
        // Update the time scale progress value
        commitProgress = timeScale(commitMaxTime);
        
        // Update the slider position to reflect the scroll position
        dateSlider.value = commitProgress;
        commitTime.innerText = commitMaxTime.toLocaleString();
        
        // Filter commits up to this time
        filteredCommits = commits.filter((d) => d.datetime <= commitMaxTime);
        
        // Update the visualizations
        updateScatterPlot(data, filteredCommits);
        updateFilesList(filteredCommits);
        
        console.log(`Scrolled to step ${rawStepIndex}, showing ${filteredCommits.length} commits up to ${commitMaxTime}`);
      }
    }
  }
}

const scroller = scrollama();
scroller
  .setup({
    container: '#scrolly-1',
    step: '#scrolly-1 .step',
  })
  .onStepEnter(onStepEnter);

