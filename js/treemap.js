var supportsForeignObject = Modernizr.svgforeignobject;
var chartWidth = $(document).width() - 10;
var chartHeight = $(document).height() - 78;
var xscale = d3.scale.linear().range([0, chartWidth]);
var yscale = d3.scale.linear().range([0, chartHeight]);
var colors = ['rgb(26,152,80)', 'rgb(102,189,99)', 'rgb(166,217,106)', 'rgb(217,239,139)', 'rgb(254,224,139)', 'rgb(253,174,97)', 'rgb(244,109,67)', 'rgb(215,48,39)'];
var headerHeight = 20;
var headerColor = "#555555";
var transitionDuration = 500;
var root;
var node;

var treemap = d3.layout.treemap()
    .round(false)
    .size([chartWidth, chartHeight])
    .sticky(true)
    .value(function(d) {
        return d.volume;
    });

var svg = d3.select("#body")
    .append("svg:svg")
    .attr("width", chartWidth)
    .attr("height", chartHeight);

var chart = svg.append("svg:g");

var defs = svg.append("defs");

var filter = defs.append("svg:filter")
    .attr("id", "outerDropShadow")
    .attr("x", "-20%")
    .attr("y", "-20%")
    .attr("width", "140%")
    .attr("height", "140%");

filter.append("svg:feOffset")
    .attr("result", "offOut")
    .attr("in", "SourceGraphic")
    .attr("dx", "1")
    .attr("dy", "1");

filter.append("svg:feColorMatrix")
    .attr("result", "matrixOut")
    .attr("in", "offOut")
    .attr("type", "matrix")
    .attr("values", "1 0 0 0 0 0 0.1 0 0 0 0 0 0.1 0 0 0 0 0 .5 0");

filter.append("svg:feGaussianBlur")
    .attr("result", "blurOut")
    .attr("in", "matrixOut")
    .attr("stdDeviation", "3");

filter.append("svg:feBlend")
    .attr("in", "SourceGraphic")
    .attr("in2", "blurOut")
    .attr("mode", "normal");

var colorScale = d3.scale.quantile()
    .domain([0, 1]) // competition
    .range(colors);

d3.csv('user_data/uploadedFile.csv', function(rows){
    var tree = new TreeModel(),
        treeRoot,
        count = 1;

    rows.forEach(function(row){
        // That's the root
        if (row.Name == 'Keyword') {
            treeRoot = tree.parse({ id: count, name: row.Name, children: [] });
            count = count + 1;
        }
        // That's a leaf
        // (We're populating the categories as we go through the leaves' parents)
        else if (row.Parent != 'Keyword'){
            // Looking for the parent in the tree
            var existingCategory = treeRoot.first(function (node) {
                return node.model.name === row.Parent;
            });
            // There's already a parent category in the tree for that leaf,
            // we can simply add the leaf to it
            if (existingCategory){
                var newLeaf = tree.parse({ id: count, name: row.Name, volume: parseInt(row.Primary), competition: parseFloat(row.Secondary) });
                existingCategory.addChild(newLeaf);
                count = count + 1;
            }
            // That parent category is not present in the tree yet, so we must
            // first add it before we can add the leaf to it
            else{
                var newCategory = tree.parse({ id: count, name: row.Parent, children: [] }),
                    newLeaf = tree.parse({ id: count+1, name: row.Name, volume: parseInt(row.Primary), competition: parseFloat(row.Secondary) });
                newCategory.addChild(newLeaf);
                treeRoot.addChild(newCategory);
                count = count + 2;
            }
        }
        // We've alreay found our categories, no need to account for them
        // once they come up at the end of the CSV
    });

    node = root = treeRoot.model;
    var nodes = treemap.nodes(root);

    var children = nodes.filter(function(d) {
        return !d.children;
    });
    var parents = nodes.filter(function(d) {
        return d.children;
    });

    // create parent cells
    var parentCells = chart.selectAll("g.cell.parent")
        .data(parents, function(d) {
            return "p-" + d.id;
        });
    var parentEnterTransition = parentCells.enter()
        .append("g")
        .attr("class", "cell parent")
        .on("click", function(d) {
            zoom(d);
        });
    parentEnterTransition.append("rect")
        .attr("width", function(d) {
            return Math.max(0.01, d.dx);
        })
        .attr("height", headerHeight)
        .style("fill", headerColor);
    parentEnterTransition.append('foreignObject')
        .attr("class", "foreignObject")
        .append("xhtml:body")
        .attr("class", "labelbody")
        .append("div")
        .attr("class", "labeltext");
    // update transition
    var parentUpdateTransition = parentCells.transition().duration(transitionDuration);
    parentUpdateTransition.select(".cell")
        .attr("transform", function(d) {
            return "translate(" + d.dx + "," + d.y + ")";
        });
    parentUpdateTransition.select("rect")
        .attr("width", function(d) {
            return Math.max(0.01, d.dx);
        })
        .attr("height", headerHeight)
        .style("fill", headerColor);
    parentUpdateTransition.select(".foreignObject")
        .attr("width", function(d) {
            return Math.max(0.01, d.dx);
        })
        .attr("height", headerHeight)
        .select(".labelbody .labeltext")
        .text(function(d) {
            return d.name;
        });
    // remove transition
    parentCells.exit()
        .remove();

    // create children cells
    var childrenCells = chart.selectAll("g.cell.child")
        .data(children, function(d) {
            return "c-" + d.id;
        });
    // enter transition
    var childEnterTransition = childrenCells.enter()
        .append("g")
        .attr("class", "cell child")
        .on("click", function(d) {
            zoom(node === d.parent ? root : d.parent);
        })
        .on("mouseover", function() {
            this.parentNode.appendChild(this); // workaround for bringing elements to the front (ie z-index)
            d3.select(this)
                .attr("filter", "url(#outerDropShadow)")
                .select(".background")
                .style("stroke", "#000000");
        })
        .on("mouseout", function() {
            d3.select(this)
                .attr("filter", "")
                .select(".background")
                .style("stroke", "#FFFFFF");
        });
    childEnterTransition.append("rect")
        .classed("background", true)
        .style("fill", function(d) {
            return colorScale(d.competition);
        });
    childEnterTransition.append('foreignObject')
        .attr("class", "foreignObject")
        .attr("width", function(d) {
            return Math.max(0.01, d.dx);
        })
        .attr("height", function(d) {
            return Math.max(0.01, d.dy);
        })
        .append("xhtml:body")
        .attr("class", "labelbody")
        .append("div")
        .attr("class", "labeltext")
        .text(function(d) {
            return d.name;
        });

    if (supportsForeignObject) {
        childEnterTransition.selectAll(".foreignObject")
            // .style("display", "none")
            .style("color", function(d) {
                return idealTextColor(colorScale(d.competition));
            });
    } else {
        childEnterTransition.selectAll(".foreignObject .labelbody .labeltext")
            // .style("display", "none")
            .style("color", function(d) {
                return idealTextColor(colorScale(d.competition));
            });
    }

    // update transition
    var childUpdateTransition = childrenCells.transition().duration(transitionDuration);
    childUpdateTransition.select(".cell")
        .attr("transform", function(d) {
            return "translate(" + d.x  + "," + d.y + ")";
        });
    childUpdateTransition.select("rect")
        .attr("width", function(d) {
            return Math.max(0.01, d.dx);
        })
        .attr("height", function(d) {
            return d.dy;
        })
        .style("fill", function(d) {
            return colorScale(d.competition);
        });
    childUpdateTransition.select(".foreignObject")
        .attr("width", function(d) {
            return Math.max(0.01, d.dx);
        })
        .attr("height", function(d) {
            return Math.max(0.01, d.dy);
        })
        .select(".labelbody .labeltext")
        .text(function(d) {
            return d.name;
        });
    // exit transition
    childrenCells.exit()
        .remove();

    // d3.select("select").on("change", function() {
    //     console.log("select zoom(node)");
    //     treemap.value(this.value == "size" ? size : count)
    //         .nodes(root);
    //     zoom(node);
    // });

    zoom(node);
});

//and another one
function textHeight(d) {
    var ky = chartHeight / d.dy;
    yscale.domain([d.y, d.y + d.dy]);
    return (ky * d.dy) / headerHeight;
}


function getRGBComponents (color) {
    var r = color.substring(1, 3);
    var g = color.substring(3, 5);
    var b = color.substring(5, 7);
    return {
        R: parseInt(r, 16),
        G: parseInt(g, 16),
        B: parseInt(b, 16)
    };
}


function idealTextColor (bgColor) {
    var nThreshold = 105;
    var components = getRGBComponents(bgColor);
    var bgDelta = (components.R * 0.299) + (components.G * 0.587) + (components.B * 0.114);
    return ((255 - bgDelta) < nThreshold) ? "#000000" : "#ffffff";
}


function zoom(d) {
    this.treemap
        .padding([headerHeight/(chartHeight/d.dy), 0, 0, 0])
        .nodes(d);

    // moving the next two lines above treemap layout messes up padding of zoom result
    var kx = chartWidth  / d.dx;
    var ky = chartHeight / d.dy;
    var level = d;

    xscale.domain([d.x, d.x + d.dx]);
    yscale.domain([d.y, d.y + d.dy]);

    // if (node != level) {
    //     if (supportsForeignObject) {
    //         chart.selectAll(".cell.child .foreignObject")
    //             .style("display", "none");
    //     } else {
    //         chart.selectAll(".cell.child .foreignObject .labelbody .labeltext")
    //             .style("display", "none");
    //     }
    // }

    var zoomTransition = chart.selectAll("g.cell").transition().duration(transitionDuration)
        .attr("transform", function(d) {
            return "translate(" + xscale(d.x) + "," + yscale(d.y) + ")";
        })
        .each("end", function(d, i) {
            if (!i && (level !== self.root)) {
                chart.selectAll(".cell.child")
                    .filter(function(d) {
                        return d.parent === self.node; // only get the children for selected group
                    })
                    .select(".foreignObject .labelbody .labeltext")
                    .style("color", function(d) {
                        return idealTextColor(colorScale(d.competition));
                    });

                // if (supportsForeignObject) {
                //     chart.selectAll(".cell.child")
                //         .filter(function(d) {
                //             return d.parent === self.node; // only get the children for selected group
                //         })
                //         .select(".foreignObject")
                //         .style("display", "")
                // } else {
                //     chart.selectAll(".cell.child")
                //         .filter(function(d) {
                //             return d.parent === self.node; // only get the children for selected group
                //         })
                //         .select(".foreignObject .labelbody .labeltext")
                //         .style("display", "")
                // }
            }
        });

    zoomTransition.select(".foreignObject")
        .attr("width", function(d) {
            return Math.max(0.01, kx * d.dx);
        })
        .attr("height", function(d) {
            return d.children ? headerHeight: Math.max(0.01, ky * d.dy);
        })
        .select(".labelbody .labeltext")
        .text(function(d) {
            return d.name;
        });

    // update the width/height of the rects
    zoomTransition.select("rect")
        .attr("width", function(d) {
            return Math.max(0.01, kx * d.dx);
        })
        .attr("height", function(d) {
            return d.children ? headerHeight : Math.max(0.01, ky * d.dy);
        })
        .style("fill", function(d) {
            return d.children ? headerColor : colorScale(d.competition);
        });

    node = d;

    if (d3.event) {
        d3.event.stopPropagation();
    }
}

// SVG Download
$('#btn-download').on('click', function(){
    var e = document.createElement('script');
    e.setAttribute('src', 'https://nytimes.github.io/svg-crowbar/svg-crowbar.js');
    e.setAttribute('class', 'svg-crowbar');
    document.body.appendChild(e);
});
