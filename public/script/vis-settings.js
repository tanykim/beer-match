define(['jquery', 'd3'], function ($, d3) {

	var widths = {
		frequency: 8,
		calendar: 12,
		score: 8,
		categories: 2,
		ratings: 12
	};

	var heights = {
		frequency: 300,
		calendar: null,
		score: 200,
		categories: null,
		ratings: null
	};

	var margins = {
		frequency: { top: 100, right: 40, bottom: 50, left: 60 },
		calendar: { top: 50, right: 20, bottom: 20, left: 40 },
		score: { top: 40, right: 40, bottom: 50, left: 60 },
		categories: { top: 10, right: 2, bottom: 10, left: 2 },
		ratings: { top: 60, right: 40, bottom: 20, left: 300 }
	}

   	var getWidth = function(div) {
   		return $('.vis').find('.container').outerWidth() / 12 * widths[div] - 15 * 2; // 15 is margin
   	};

   	function drawSVG(vis, div) {
   		var svg = d3.select('#vis-' + div).append('svg')
			.attr('width', vis.dim.w + vis.margin.left + vis.margin.right)
			.attr('height', vis.dim.h + vis.margin.top + vis.margin.bottom)
			.append('g')
			.attr('transform', 'translate(' + vis.margin.left + ', ' + vis.margin.top + ')');
		return svg;
   	};

   	var setVisNoSVG = function (div, callback) {
   		var w = getWidth(div); // 15 is margin
   		var vis = {
   			w: w,
   			margin: margins[div],
   			draw: drawSVG
   		};
   		if (callback) {
	   		callback(vis);
   		} else {
   			return vis;
   		}
   	};

   	var setVis = function(div, callback) {
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

	return {
		setVisNoSVG: setVisNoSVG,
		setVis: setVis
	};

});