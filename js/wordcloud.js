d3.text("user_data/uploadedFile.csv", function(text){

    var domainCeiling = 0;

    var data = d3.csv.parseRows(text).map(function(row){
        return row.map(function(value){
            if (isNaN(value)){return value;}
            else{
                if (+value > domainCeiling){domainCeiling = +value}
                return +value; // Converting numbers back to integers
            }
        });
    });

    // var fill = d3.scale.category20();
    var colors = ['#d9d9d9','#bdbdbd','#969696','#636363'];
    var colorScale = d3.scale.ordinal().range(colors);
    var fontSize = d3.scale.linear()
        .domain([0, domainCeiling])
        .range([10, 100]);
    var width = 810 - 10;
    var height = 578 - 78;

    d3.layout.cloud().size([width, height])
        .words(data)
        .text(function(d){ return d[0]; })
        // .padding(5)
        .rotate(function() { return 0; })
        .font("emoji")
        .fontSize(function(d) { return fontSize(d[1]); })
        .on("end", draw)
        .start();

    function draw(words) {
      d3.select("#main").append("svg")
          .attr("width", width)
          .attr("height", height)
        .append("g")
          .attr("transform", "translate(" + width/2 + "," + height/2 + ")")
        .selectAll("text")
          .data(words)
        .enter().append("text")
          .style("font-size", function(d) { return d.size + "px"; })
          .style("font-family", "emoji")
          .style("fill", function(d, i) { return colorScale(i); })
          .attr("text-anchor", "middle")
          .attr("transform", function(d) {
            return "translate(" + [d.x, d.y] + ")rotate(" + d.rotate + ")";
          })
          .text(function(d) { return d.text; });
    }
});

// SVG Download
$('#btn-download').on('click', function(){
    var e = document.createElement('script');
    e.setAttribute('src', 'https://nytimes.github.io/svg-crowbar/svg-crowbar.js');
    e.setAttribute('class', 'svg-crowbar');
    document.body.appendChild(e);
});
