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

    var fill = d3.scale.category20();
    var fontSize = d3.scale.linear()
        .domain([0, domainCeiling])
        .range([10, 100]);
    var width = $(window).width() - 10;
    var height = $(window).height() - 78;

    d3.layout.cloud().size([width, height])
        .words(data)
        .text(function(d){ return d[0]; })
        // .padding(5)
        .rotate(function() { return ~~(Math.random() * 2) * 90; })
        .font("Impact")
        .fontSize(function(d) { return fontSize(d[1]); })
        .on("end", draw)
        .start();

    function draw(words) {
      d3.select("body").append("svg")
          .attr("width", width)
          .attr("height", height)
        .append("g")
          .attr("transform", "translate(" + width/2 + "," + height/2 + ")")
        .selectAll("text")
          .data(words)
        .enter().append("text")
          .style("font-size", function(d) { return d.size + "px"; })
          .style("font-family", "Impact")
          .style("fill", function(d, i) { return fill(i); })
          .attr("text-anchor", "middle")
          .attr("transform", function(d) {
            return "translate(" + [d.x, d.y] + ")rotate(" + d.rotate + ")";
          })
          .text(function(d) { return d.text; });
    }
});
