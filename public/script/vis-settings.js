define(['jquery', 'd3', 'chroma'], function ($, d3, chroma) {

	'use strict';

	var widths = {
		frequency: 8,
		calendar: 12,
		score: 2.4,
		categories: 2,
		ratings: 6,
		beers: 7,
		when: 12,
		where: 7.8,
		day: 3.8,
		timeline: 7.9,
		behavior: 6,
        detail: 3,
        distinctive: 6,
        styles: 10
	};

	var heights = {
		frequency: 300,
		calendar: null,
		score: 260,
		categories: null,
		ratings: null,
		beers: null,
		when: 300,
		where: null,
		day: null,
		timeline: null,
		behavior: 350,
        detail: 280,
		distinctive: 50,
        style: null
	};
	var margins = {
		frequency: { top: 80, right: 30, bottom: 50, left: 70 },
		calendar: { top: 50, right: 40, bottom: 20, left: 50 },
		score: { top: 0, right: 20, bottom: 40, left: 54 },
		categories: { top: 60, right: 20, bottom: 10, left: 20 },
		ratings: { top: 60, right: 20, bottom: 20, left: 240 },
		beers: { top: 0, right: 20, bottom: 0, left: 20, oR: 20 , iR: 30 },
		when: { top: 60, right: 20, bottom: 40, left: 65 },
		where: { top: 20, right: 120, bottom: 0, left: 120 },
		day: { top: 0, right: 50, bottom: 20, left: 36 },
		timeline: { top: 140, right: 40, bottom: 0, left: 240 },
		behavior: { top: 20, right: 170, bottom: 20, left: 150 },
		detail: { top: 20, right: 20, bottom: 40, left: 40 },
        distinctive: { top: 10, right: 60, bottom: 10, left: 60 }
	};

   	var getWidth = function(div) {
        var w = parseInt($('body').width() * 0.9 / 12 * widths[div]);
        if (div !== 'beers' && div !== 'styles') {
            return Math.min(Math.max(w, 200), 4000);
        } else {
            return Math.min($(window).height() - 100, w);
        }
   	};

   	function drawSVG(vis, div) {
   		var svg = d3.select('#vis-' + div).append('svg')
			.attr('width', vis.dim.w + vis.margin.left + vis.margin.right)
			.attr('height', vis.dim.h + vis.margin.top + vis.margin.bottom)
			.append('g')
			.attr('transform',
                'translate(' + vis.margin.left + ', ' + vis.margin.top + ')');
		return svg;
   	};

   	var setVisNoSVG = function (div, callback) {
   		var w = getWidth(div);
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
				h: ((_.isNull(heights[div]) ?
                    getWidth(div) :
                    heights[div])) - margins[div].top - margins[div].bottom
			},
			margin: margins[div]
		}
		vis.svg = drawSVG(vis, div);
		callback(vis);
   	};

    var updateSelection = function (elm, tag) {
        elm.parent().find(tag).removeClass('selected');
        elm.addClass('selected');
        if (tag === 'span') {
            elm.parent().find('span').find('i')
                .removeClass('fa-dot-circle-o').addClass('fa-circle-o');
            elm.find('i')
                .removeClass('fa-circle-o').addClass('fa-dot-circle-o');
        }
    }

    var changeRadioSelection = function (elm, tag) {
        if (!tag) {
            tag = 'span';
        }
        if (elm.find('i').hasClass('fa-dot-circle-o')) {
            return false;
        } else {
            updateSelection(elm, tag);
            return true;
        }
    };

    var getChroma = function (range, count) {
        var scale = chroma.scale(range).domain([0, count - 1]);
        return _.map(_.range(count), function (i) {
            return scale(i).hex();
        });
    };

	return {
		setVisNoSVG: setVisNoSVG,
		setVis: setVis,
        changeRadioSelection: changeRadioSelection,
        updateSelection: updateSelection,
        getChroma: getChroma
	};

});