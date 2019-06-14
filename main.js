d3.csv("nst-est2018-alldata.csv").then(csv => {
	////////////////////////////////////////////////////////////
	//// Process Data //////////////////////////////////////////
	////////////////////////////////////////////////////////////
	const yearStart = 2010;
	const yearEnd = 2018;
	const data = csv.map(d => ({
		key: d.NAME,
		values: d3.range(yearStart, yearEnd + 1).reduce((values, year) => {
			values.push([year, +d[`NPOPCHG_${year}`]]);
			return values;
		}, [])
	}));

	////////////////////////////////////////////////////////////
	//// Setup /////////////////////////////////////////////////
	////////////////////////////////////////////////////////////
	const margin = { left: 120, right: 40 };
	const rowHeight = 30;
	const chartContainer = d3.select(".chart-container");
	const rowWidth = chartContainer.node().clientWidth;
	const width = rowWidth - margin.left - margin.right;
	const expandedRowHeight = (yearEnd + 2 - yearStart) * rowHeight; // Add an extra row for x axis

	const x = d3
		.scaleLinear()
		.domain([
			d3.min(data, d => d3.min(d.values, e => e[1])),
			d3.max(data, d => d3.max(d.values, e => e[1]))
		])
		.range([0, width])
		.nice();

	const y = d3
		.scalePoint()
		.domain(d3.range(yearStart, yearEnd + 1))
		.range([0, expandedRowHeight - rowHeight])
		.padding(0.5);

	const line = d3
		.line()
		.x(d => x(d[1]))
		.y(d => y(d[0]))
		.curve(d3.curveCatmullRom);

	const lineCollapsed = d3
		.line()
		.x(d => x(d[1]))
		.y(d => y(yearStart))
		.curve(d3.curveCatmullRom);

	////////////////////////////////////////////////////////////
	//// Render ////////////////////////////////////////////////
	////////////////////////////////////////////////////////////
	// Top axis
	chartContainer
		.append("div")
		.attr("class", "axis")
		.append("svg")
		.attr("viewBox", [0, 0, rowWidth, rowHeight])
		.call(addMarkersDefs)
		.append("g")
		.attr("transform", `translate(${margin.left},${rowHeight - 1})`)
		.call(d3.axisTop(x).tickSizeOuter(0));

	// State row
	const state = chartContainer
		.selectAll(".state")
		.data(data)
		.join("div")
		.attr("class", "state")
		.append("svg")
		.on("mouseenter", expand)
		.on("mouseleave", collapse)
		.attr("viewBox", [0, 0, rowWidth, rowHeight])
		.append("g")
		.attr("transform", `translate(${margin.left},0)`);

	// Bottom axis
	chartContainer
		.append("div")
		.attr("class", "axis")
		.append("svg")
		.attr("viewBox", [0, 0, rowWidth, rowHeight])
		.append("g")
		.attr("id", "axis-bottom")
		.attr("transform", `translate(${margin.left},${1})`)
		.call(d3.axisBottom(x).tickSizeOuter(0));

	// Dumbbell dot chart
	state
		.append("text")
		.attr("x", d => x(d3.min(d.values, e => e[1])))
		.attr("dx", -8)
		.attr("y", rowHeight / 2)
		.attr("dy", "0.35em")
		.attr("text-anchor", "end")
		.text(d => d.key);

	state
		.append("path")
		.attr("class", "state-path")
		.attr("fill", "none")
		.attr("marker-start", "url(#dot)")
		.attr("marker-end", "url(#arrow)")
		.attr("d", d => lineCollapsed(d.values));

	function addMarkersDefs(svg) {
		// https://developer.mozilla.org/en-US/docs/Web/SVG/Element/marker
		const defs = svg.append("defs");

		// Arrowhead marker definition
		const arrowMarker = defs
			.append("marker")
			.attr("id", "arrow")
			.attr("orient", "auto")
			.attr("viewBox", [0, 0, 10, 10])
			.attr("refX", 5)
			.attr("refY", 5)
			.attr("markerWidth", 10)
			.attr("markerHeight", 10);
		arrowMarker.append("path").attr("d", "M 0 0 L 10 5 L 0 10 z");

		// Dot marker definition
		const dotMarker = defs
			.append("marker")
			.attr("id", "dot")
			.attr("viewBox", [0, 0, 10, 10])
			.attr("refX", 5)
			.attr("refY", 5)
			.attr("markerWidth", 10)
			.attr("markerHeight", 10);
		dotMarker
			.append("circle")
			.attr("cx", 5)
			.attr("cy", 5)
			.attr("r", 5);
	}

	function expand(d, i) {
		const t = d3.transition().duration(500);

		const svg = d3.select(this);

		// Adjust svg size
		svg
			.transition(t)
			.attr("viewBox", [
				0,
				0,
				rowWidth,
				i !== data.length - 1
					? expandedRowHeight
					: expandedRowHeight - rowHeight
			]);

		// Update state path
		svg
			.select(".state-path")
			.transition(t)
			.attr("d", d => line(d.values));

		// Add a bottom axis except for the last row
		if (i !== data.length - 1) {
			svg
				.append("use")
				.attr("xlink:href", "#axis-bottom")
				.attr("transform", `translate(0,${expandedRowHeight - rowHeight + 1})`);
		}

		// Add year axis
		const maxValue = d3.max(d.values, e => e[1]);
		svg
			.append("g")
			.attr("class", "year-axis")
			.attr("transform", `translate(${margin.left + x(maxValue) + 8},0)`)
			.call(d3.axisRight(y).tickSizeInner(8))
			.call(g => g.select(".domain").remove());
	}

	function collapse() {
		const t = d3.transition().duration(500);

		const svg = d3.select(this);

		svg.transition(t).attr("viewBox", [0, 0, rowWidth, rowHeight]);

		svg
			.select(".state-path")
			.transition(t)
			.attr("d", d => lineCollapsed(d.values));

		svg.select("use").remove();

		svg.select(".year-axis").remove();
	}
});
