var lookupTable = {};
var reverseLookupTable = {};
var matrix = [];
var channelCount = {};


d3.csv("user_data/noHeaderFile.csv", function(error, rows) {
  var mappedArray = d3.entries(rows[0]);
  var channelsColumn = mappedArray[0].key;
  var conversionsColumn = mappedArray[1].key;

  for(var i = 0; i < rows.length; i++) {
    var stringConversions = rows[i][conversionsColumn];
    var channels = rows[i][channelsColumn];

    if ((typeof stringConversions != 'undefined') && (typeof channels != 'undefined') && (stringConversions != '')){
      var intConversions = parseInt(stringConversions.replace(',',''));
      var channelList = channels.split(' > ');

      for (var j = 0; j < channelList.length-1; j++){
        var channel1 = channelList[j];
        var channel2 = channelList[j+1];

        if (!(channel1 in lookupTable)){
          var l = Object.keys(lookupTable).length;
          lookupTable[channel1] = l;
          reverseLookupTable[l] = channel1;
          for (var k = 0; k < matrix.length; k++){
            matrix[k].push(0);
          }
          arr = Array.apply(null, new Array(matrix.length+1)).map(Number.prototype.valueOf,0);
          matrix.push(arr);
        }

        if (!(channel2 in lookupTable)){
          var l = Object.keys(lookupTable).length;
          lookupTable[channel2] = l
          reverseLookupTable[l] = channel2;
          for (var k = 0; k < matrix.length; k++){
            matrix[k].push(0);
          }
          arr = Array.apply(null, new Array(matrix.length+1)).map(Number.prototype.valueOf,0);
          matrix.push(arr);
        }

        matrix[lookupTable[channel1]][lookupTable[channel2]] += intConversions;
      }

      // Counting channel occurences
      for (var m = 0; m < channelList.length; m++){
        var channel = channelList[m];
        if (channel != ''){
          if (channel in channelCount){
            channelCount[channel] += 1;
          }
          else{
            channelCount[channel] = 1;
          }
        }
      }

    }
  }

  // Displaying channel occurences in HTML
  for (key in channelCount){
    var value = channelCount[key]
    $("ul").append( "<li>" + key + ": " + value + "</li>" );
  }

  var fill = d3.scale.category10();

  // Visualize
  var chord = d3.layout.chord()
  .padding(.05)
  .sortSubgroups(d3.descending)
  .matrix(matrix);

  var width = 960,
  height = 500,
  r1 = height / 2,
  innerRadius = Math.min(width, height) * .41,
  outerRadius = innerRadius * 1.1,
  outer

  var svg = d3.select("#d3Viz").append("svg")
  .attr("width", width+200)
  .attr("height", height+200)
  .append("g")
  .attr("transform", "translate(" + (width+200) / 2 + "," + (height+200) / 2 + ")");

  svg.append("g").selectAll("path")
  .data(chord.groups)
  .enter().append("path")
  .attr("class", "arc")
  .style("fill", function(d) {
    return fill(d.index);
  })
  .attr("d", d3.svg.arc().innerRadius(innerRadius).outerRadius(outerRadius))
  .on("mouseover", fade(.1))
  .on("mouseout", fade(.7));

  svg.append("g")
  .attr("class", "chord")
  .selectAll("path")
  .data(chord.chords)
  .enter().append("path")
  .attr("d", d3.svg.chord().radius(innerRadius))
  .style("fill", function(d) { return fill(d.target.index); })
  .style("opacity", 0.7);

  svg.append("g").selectAll(".arc")
  .data(chord.groups)
  .enter().append("svg:text")
  .attr("dy", ".35em")
  .attr("text-anchor", function(d) { return ((d.startAngle + d.endAngle) / 2) > Math.PI ? "end" : null; })
  .attr("transform", function(d) {
    return "rotate(" + (((d.startAngle + d.endAngle) / 2) * 180 / Math.PI - 90) + ")"
    + "translate(" + (r1 - 15) + ")"
    + (((d.startAngle + d.endAngle) / 2) > Math.PI ? "rotate(180)" : "");
  })
  .text(function(d) {
    return reverseLookupTable[d.index] + ' [' + channelCount[reverseLookupTable[d.index]] + ']';
  });

  // Returns an event handler for fading a given chord group.
  function fade(opacity) {
    return function(g, i) {
      svg.selectAll(".chord path")
      .filter(function(d) { return d.source.index != i && d.target.index != i; })
      .transition()
      .style("opacity", opacity);
    };
  }
});
