var S = function() {
	this.widths = {
		frequency: 8,
		calendar: 12
	};

	this.heights = {
		frequency: 300,
		calendar: null
	};

	this.margins = {
		frequency: { top: 100, right: 40, bottom: 50, left: 60},
		calendar: { top: 50, bottom: 40, left: 40, right: 30}
	}
};

S.prototype.getWidth = function(div) {
	return $('.vis').find('.container').width() / 12 * widths[div] - 15 * 2; // 15 is margin
};

S.prototype.drawSVG = function(vis, div) {
	console.log(vis, div);
	var svg = d3.select('#vis-' + div).append('svg')
		.attr('width', vis.dim.w + vis.margin.left + vis.margin.right)
		.attr('height', vis.dim.h + vis.margin.top + vis.margin.bottom)
		.append('g')
		.attr('transform', 'translate(' + vis.margin.left + ', ' + vis.margin.top + ')');
	return svg;
};

S.prototype.setVisNoSVG = function (div) {
	var w = getWidth(div); // 15 is margin
	return {
		w: w,
		margin: margins[div],
		draw: drawSVG
	};
};

S.prototype.setVis = function(div, callback) {
	var vis = {
		dim: {
			w: getWidth(div) - margins[div].left - margins[div].right,
			h: heights[div] - margins[div].top - margins[div].bottom
		},
		margin: margins[div]
	}
	vis.svg = drawSVG(vis, div);
	callback(vis);
};
