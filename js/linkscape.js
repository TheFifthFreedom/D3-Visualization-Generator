var width = $(document).width() - 10,
    height = $(document).height() - 78;

var colors = ['#f6faaa','#FEE08B','#FDAE61','#F46D43','#D53E4F','#9E0142'];

var svg = d3.select("body").append("svg")
    .attr("width", width)
    .attr("height", height)
    .attr("pointer-events", "all")
      .call(d3.behavior.zoom().scaleExtent([0.1, 3]).on("zoom", redraw))
    .append('svg:g');

var force = d3.layout.force()
    .size([width, height])
    .charge(-200);

function redraw() {
  svg.attr("transform",
      "translate(" + d3.event.translate + ")"
      + " scale(" + d3.event.scale + ")");
}

d3.csv("user_data/uploadedFile.csv", function(links) {
  var nodesByName = {};
  var numberOfDomainsLinkingToDomainUpperBound = 0;
  var domainAuthorityUpperBound = 0;

  // Create nodes for each unique source and target.
  links.forEach(function(link) {
    var s = link.Source;
    var t = link.Target;
    if (!(s in nodesByName)){
      nodesByName[s] = {'name': s, 'domain authority': link['Domain Authority'], 'number of domains linking to this page': link['Number of Domains Linking to this Page']}
      if (link['Number of Domains Linking to this Page'] > numberOfDomainsLinkingToDomainUpperBound){
        numberOfDomainsLinkingToDomainUpperBound = link['Number of Domains Linking to this Page'];
      }
      if (link['Domain Authority'] > domainAuthorityUpperBound){
        domainAuthorityUpperBound = link['Domain Authority'];
      }
    }
    if (!(t in nodesByName)){
      nodesByName[t] = {'name': t}
    }
    link.source = nodesByName[s];
    link.target = nodesByName[t];
  });

  numberOfDomainsLinkingToDomainUpperBound = Math.ceil(numberOfDomainsLinkingToDomainUpperBound / 10) * 10;
  domainAuthorityUpperBound = Math.ceil(domainAuthorityUpperBound / 10) * 10;

  var colorScale = d3.scale.quantile()
      .domain([0, domainAuthorityUpperBound])
      .range(colors);

  var sizeScale = d3.scale.linear()
    .domain([0, numberOfDomainsLinkingToDomainUpperBound])
    .range([3, 100])
    .clamp(true);

  // Extract the array of nodes from the map by name.
  var nodes = d3.values(nodesByName);

  // Create the link lines.
  var link = svg.selectAll(".link")
      .data(links)
    .enter().append("line")
      .attr("class", "link");

  // Drag
  var drag = force.drag()
      .on("dragstart", dragstarted)

  function dragstarted(d) {
    d3.event.sourceEvent.stopPropagation();
  }

  // Tooltips
  tip = d3.tip()
    .attr('class', 'd3-tip')
    .offset([-10, 0])
    .html(function(d) {
      return "<span style='color:red'>" + d.name + "</span>";
    })

  svg.call(tip);

  // Create the node circles.
  var node = svg.selectAll(".node")
      .data(nodes)
    .enter().append("circle")
      .attr("class", "node")
      .attr("r", function(d) {
        if (d.hasOwnProperty('number of domains linking to this page')){
          return sizeScale(d['number of domains linking to this page']);
        }
        else{
          return 5;
        }
      })
      .attr('fill', function(d){
        if (d.hasOwnProperty('domain authority')){
          return colorScale(d['domain authority']);
        }
        else{
          return 'green';
        }
      })
      .call(drag)
      .on('mouseover', tip.show)
      .on('mouseout', tip.hide);

  // Start the force layout.
  force
      .nodes(nodes)
      .links(links)
      .on("tick", tick)
      .start();

  function tick() {
    link.attr("x1", function(d) { return d.source.x; })
        .attr("y1", function(d) { return d.source.y; })
        .attr("x2", function(d) { return d.target.x; })
        .attr("y2", function(d) { return d.target.y; });

    node.attr("cx", function(d) { return d.x; })
        .attr("cy", function(d) { return d.y; });
  }

  function nodeByName(name) {
    return nodesByName[name] || (nodesByName[name] = {name: name});
  }
});

// SVG Download
$('#btn-download').on('click', function(){
    // var e = document.createElement('script');
    // e.setAttribute('src', 'https://nytimes.github.io/svg-crowbar/svg-crowbar.js');
    // e.setAttribute('class', 'svg-crowbar');
    // document.body.appendChild(e);
    window.location = '/export/linkscape.html';
});
