d3.csv("user_data/headerFile.csv", function(error, csv) {
  yearRange = [];
  valueRange = 0;

  var data = d3.nest()
    .key(function(d) {
        var year = parseInt(d.Day.substring(d.Day.length-2))
        if ((!(yearRange.indexOf(year) > -1)) && isNaN(year) == false) {
            yearRange.push(year)
        }
        return d.Day;
    })
    .rollup(function(d) { if (parseFloat(d[0].Cost.substring(d[0].Cost.indexOf('$') + 1)) > valueRange) {valueRange = parseFloat(d[0].Cost.substring(d[0].Cost.indexOf('$') + 1))};return d[0].Cost.trim(); })
    .map(csv);

  visualize(yearRange, valueRange);

  rect.filter(function(d) { return d in data; })
      .attr("class", function(d) { return "day " + color(data[d].substring(1)); })
    .select("title")
      .text(function(d) { return d + ": " + data[d]; });

  //  Tooltip
  rect.on("mouseover", mouseover);
  rect.on("mouseout", mouseout);
  function mouseover(d) {
    tooltip.style("visibility", "visible");
    var purchase_text = d + ": " + data[d];
    tooltip.transition()
                .duration(200)
                .style("opacity", .9);
    tooltip.html(purchase_text)
                .style("left", (d3.event.pageX)+30 + "px")
                .style("top", (d3.event.pageY) + "px");
  }
  function mouseout (d) {
    tooltip.transition()
            .duration(500)
            .style("opacity", 0);
    var $tooltip = $("#tooltip");
    $tooltip.empty();
  }

});

var width = 960,
    height = 750,
    cellSize = 25; // cell size

var no_months_in_a_row = Math.floor(width / (cellSize * 7 + 50));
var shift_up = cellSize * 3;

var day = d3.time.format("%w"), // day of the week
    day_of_month = d3.time.format("%e") // day of the month
    day_of_year = d3.time.format("%j")
    week = d3.time.format("%U"), // week number of the year
    month = d3.time.format("%m"), // month number
    year = d3.time.format("%Y"),
    percent = d3.format(".1%"),
    format = d3.time.format("%-m/%-d/%-Y");

var color;
var svg;
var rect;
var month_titles;
var year_title;
var tooltip;

function visualize(yearRange, valueRange){

  var ceiling = Math.ceil(valueRange/100)*100
  var firstYear = Array.min(yearRange) + 2000;
  var lastYear = Array.max(yearRange) + 2001;

  color = d3.scale.quantize()
      .domain([0, ceiling])
      .range(d3.range(10).map(function(d) { return "q" + d + "-10"; }));

  svg = d3.select("#chart").selectAll("svg")
      .data(d3.range(firstYear, lastYear))
    .enter().append("svg")
      .attr("width", width)
      .attr("height", height)
      .attr("class", "RdYlGn")
    .append("g")

  rect = svg.selectAll(".day")
      .data(function(d) {
        return d3.time.days(new Date(d, 0, 1), new Date(d + 1, 0, 1));
      })
    .enter().append("rect")
      .attr("class", "day")
      .attr("width", cellSize)
      .attr("height", cellSize)
      .attr("x", function(d) {
        var month_padding = 1.2 * cellSize*7 * ((month(d)-1) % (no_months_in_a_row));
        return day(d) * cellSize + month_padding;
      })
      .attr("y", function(d) {
        var week_diff = week(d) - week(new Date(year(d), month(d)-1, 1) );
        var row_level = Math.ceil(month(d) / (no_months_in_a_row));
        return (week_diff*cellSize) + row_level*cellSize*8 - cellSize/2 - shift_up;
      })
      .datum(format);

  month_titles = svg.selectAll(".month-title")  // Jan, Feb, Mar and the whatnot
        .data(function(d) {
          return d3.time.months(new Date(d, 0, 1), new Date(d + 1, 0, 1)); })
      .enter().append("text")
        .text(monthTitle)
        .attr("x", function(d, i) {
          var month_padding = 1.2 * cellSize*7* ((month(d)-1) % (no_months_in_a_row));
          return month_padding;
        })
        .attr("y", function(d, i) {
          var week_diff = week(d) - week(new Date(year(d), month(d)-1, 1) );
          var row_level = Math.ceil(month(d) / (no_months_in_a_row));
          return (week_diff*cellSize) + row_level*cellSize*8 - cellSize - shift_up;
        })
        .attr("class", "month-title")
        .attr("d", monthTitle);

  year_titles = svg.selectAll(".year-title")  // Jan, Feb, Mar and the whatnot
        .data(function(d) {
          return d3.time.years(new Date(d, 0, 1), new Date(d + 1, 0, 1)); })
      .enter().append("text")
        .text(yearTitle)
        .attr("x", function(d, i) { return width/2 - 100; })
        .attr("y", function(d, i) { return cellSize*5.5 - shift_up; })
        .attr("class", "year-title")
        .attr("d", yearTitle);

  tooltip = d3.select("body")
    .append("div").attr("id", "tooltip")
    .style("position", "absolute")
    .style("z-index", "10")
    .style("visibility", "hidden")
    .text("a simple tooltip");
};

function dayTitle (t0) {
  return t0.toString().split(" ")[2];
};
function monthTitle (t0) {
  return t0.toLocaleString("en-us", { month: "long" });
};
function yearTitle (t0) {
  return t0.toString().split(" ")[3];
};
Array.min = function( array ){
    return Math.min.apply( Math, array );
};
Array.max = function( array ){
    return Math.max.apply( Math, array );
};
