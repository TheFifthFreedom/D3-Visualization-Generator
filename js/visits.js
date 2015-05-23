// Get the visits data
d3.csv("user_data/uploadedFile.csv", function(error, inputData){

    // Parse the date / time
    var parseDate = d3.time.format("%d-%b-%y").parse;
    var trafficDates = [];
    var trafficData = {};
    var numberOfRows = 0;

    inputData.forEach(function(d){
        trafficDates.push(d.Date);
        trafficData[d.Date] = parseInt(d.Visits.replace(",", ""));
        d.date = parseDate(d.Date);
        d.visits = parseInt(d.Visits.replace(",", ""));
        numberOfRows += 1;
    });

    // Get the algorithm data
    d3.csv("sample_data/visits_algorithms.csv", function(error, algoData) {
        algoData.forEach(function(d) {
            d.date = parseDate(d.Date);
            d.close = d.Close;
        });
        algoData.sort(function(a, b){
            return b.date - a.date;
        });

        // Set the dimensions of the canvas / graph
        var margin = {top: 30, right: 20, bottom: 70, left: 70},
            width = $(document).width() - margin.left - margin.right,
            height = 300 - margin.top - margin.bottom;

        var max = Math.ceil(numberOfRows / 1000)*20;

        // Set the ranges
        var x = d3.time.scale().range([0, width*max]);
        var y = d3.scale.linear().range([height, 0]);

        // Define the axes
        var xAxis = d3.svg.axis().scale(x)
            .orient("bottom").ticks(d3.time.day, 1).tickFormat(d3.time.format("%d-%b-%y"));

        var yAxis = d3.svg.axis().scale(y)
            .orient("left").ticks(5);

        // Define the line
        var valueline = d3.svg.line()
            .x(function(d) { return x(d.date); })
            .y(function(d) { return y(d.visits); });

        // Adds the svg canvas
        var graphPanel = d3.select("body").append("div").attr("class", "panel panel-primary"),
            graphPanelHeading = graphPanel.append("div").attr("class", "panel-heading").text("Trend View: Google SEO Traffic and Algorithm Changes")

        var svg = graphPanel
            .append("svg")
                .attr("width", width + margin.left)
                .attr("height", height + margin.top + margin.bottom)
            .append("g")
                .attr("transform",
                      "translate(" + margin.left + "," + margin.top + ")");

        // Scale the range of the data
        x.domain(d3.extent(inputData, function(d) { return d.date; }));
        y.domain([0, d3.max(inputData, function(d) { return d.visits; })]);

        // Add the valueline path.
        svg.append("path")
            .attr("class", "line")
            .attr("d", valueline(inputData))
            .attr("clip-path", "url(#clip)");

        // Add the algorithm bars
        svg.selectAll(".bar")
                .data(algoData)
            .enter().append("rect")
                .attr("class", "bar")
                .attr("x", function(d) { return x(d.date) - 0.5; })
                .attr("width", 1)
                .attr("y", function(d) { return 0; })
                .attr("height", function(d) { return 200; })
                .attr("clip-path", "url(#clip)")
                .text("hello");

        // Add the algorithm bar text
        svg.append("g")
                .attr("clip-path", "url(#clip)")
            .selectAll(".bartext")
                    .data(algoData)
                .enter().append("text")
                    .attr("class", "bartext")
                    .attr("text-anchor", "end")
                    .attr("transform", function(d) { return "translate(" + (x(d.date)-3) + ",0)rotate(-90)"; })
                    .text(function(d){ return d.Algorithm; });

        // Add the X Axis
        svg.append("g")
            .attr("class", "x axis")
            .attr("transform", "translate(0," + height + ")")
            .call(xAxis)
            .selectAll("text")
            .style("text-anchor", "end")
                .attr("dx", "-.8em")
                .attr("dy", ".15em")
                .attr("transform", function(d) {
                    return "rotate(-65)"
                });

        // Add the Y Axis
        svg.append("g")
            .attr("class", "y axis")
            .call(yAxis);

        // Pan
        var zoom = d3.behavior.zoom()
            .scaleExtent([1, 1])
            .x(x)
            .on('zoom', function() {
                var t = zoom.translate(),
                    tx = t[0],
                    ty = t[1];

                tx = Math.min(tx, 0);
                tx = Math.max(tx, width - width*max);
                zoom.translate([tx, ty]);

                svg.select('.line').attr('d', valueline(inputData));
                svg.selectAll('.bar').attr("x", function(d) { return x(d.date) - 0.5; });
                svg.selectAll('.bartext').attr("transform", function(d) { return "translate(" + (x(d.date)-3) + ",0)rotate(-90)"; })
                svg.select('.x.axis').call(xAxis)
                    .selectAll("text")
                    .style("text-anchor", "end")
                        .attr("dx", "-.8em")
                        .attr("dy", ".15em")
                        .attr("transform", function(d) { return "rotate(-65)"; });
            });

        // Pan-able area
        svg.append('rect')
            .attr('width', width + margin.left)
            .attr('height', height + margin.top + margin.bottom)
            .attr('fill', 'none')
            .attr('pointer-events', 'all')
            .attr("transform",
                  "translate(-" + margin.left + ", -" + margin.top + ")")
            .attr('cursor', 'ew-resize')
            .on("mousewheel.zoom", null)
            .on("DOMMouseScroll.zoom", null)
            .call(zoom);

        svg.append("defs").append("clipPath")
            .attr("id", "clip")
            .append("rect")
            .attr("id", "clip-rect")
            .attr("x", "0")
            .attr("y", "0")
            .attr("width", width)
            .attr("height", height);

        // The table generation function
        function tabulate(data, columns) {
            var tablePanel = d3.select("body").append("div").attr("class", "panel panel-primary"),
                tablePanelHeading = tablePanel.append("div").attr("class", "panel-heading").text("Average Google SEO Traffic: Pre vs Post comparison after Google Algorithm changes")
            var table = tablePanel.append("table").attr("class", "table table-condensed"),
                thead = table.append("thead"),
                tbody = table.append("tbody");

            // append the header row
            thead.append("tr")
                .selectAll("th")
                .data(columns)
                .enter()
                .append("th")
                .attr("style", "font: bold 10px Verdana")
                .style("text-align", "center")
                    .text(function(column) { return column; });

            // create a row for each object in the data
            var rows = tbody.selectAll("tr")
                .data(data)
                .enter()
                .append("tr");

            var currentDate,
                currentDateIndex,
                currentPriorDataPoint,
                currentPostDataPoint;

            // create a cell in each row for each column
            var cells = rows.selectAll("td")
                .data(function(row) {
                    return columns.map(function(column) {
                        return {column: column, value: row[column]};
                    });
                })
                .enter()
                .append("td")
                .attr("style", "font: 10px Verdana; text-align: center") // sets the font style
                    .html(function(d) {
                        if (d.column == 'Date'){
                            currentDate = d.value;
                            currentDateIndex = trafficDates.indexOf(currentDate);
                            return d.value;
                        }
                        else if (d.column == 'Algorithm'){
                            return d.value;
                        }
                        else if (d.column == 'Change'){
                            var diff = Math.round(((currentPostDataPoint - currentPriorDataPoint) / currentPriorDataPoint)*100);
                            if (diff > 0){
                                d.value = diff;
                                return '+' + diff + '%';
                            }
                            else if (diff <= 0){
                                d.value = diff;
                                return diff + '%';
                            }
                            else{
                                return undefined;
                            }
                        }
                        else if (currentDateIndex != -1 && d.column == 'Day Before'){
                            currentPriorDataPoint = trafficData[trafficDates[currentDateIndex - 1]];
                            if (currentPriorDataPoint) {d.value = currentPriorDataPoint; return currentPriorDataPoint;}
                            else {return undefined;}
                        }
                        else if (currentDateIndex != -1 && d.column == 'Day After'){
                            currentPostDataPoint = trafficData[trafficDates[currentDateIndex + 1]];
                            if (currentPostDataPoint) {d.value = currentPostDataPoint; return currentPostDataPoint;}
                            else {return undefined;}
                        }
                        else if (currentDateIndex != -1 && d.column == '4 day prior'){
                            if (trafficData[trafficDates[currentDateIndex - 4]]){
                                currentPriorDataPoint = 0;
                                for (var i = 1; i < 5; i++){
                                    currentPriorDataPoint += trafficData[trafficDates[currentDateIndex - i]];
                                }
                                currentPriorDataPoint = Math.round(currentPriorDataPoint / 4);
                                d.value = currentPriorDataPoint;
                                return currentPriorDataPoint;
                            }
                            else {
                                return currentPriorDataPoint = undefined;
                            }
                        }
                        else if (currentDateIndex != -1 && d.column == '4 day post'){
                            if (trafficData[trafficDates[currentDateIndex + 4]]){
                                currentPostDataPoint = 0;
                                for (var i = 1; i < 5; i++){
                                    currentPostDataPoint += trafficData[trafficDates[currentDateIndex + i]];
                                }
                                currentPostDataPoint = Math.round(currentPostDataPoint / 4);
                                d.value = currentPostDataPoint;
                                return currentPostDataPoint;
                            }
                            else {
                                return currentPostDataPoint = undefined;
                            }
                        }
                        else if (currentDateIndex != -1 && d.column == '9 day prior'){
                            if (trafficData[trafficDates[currentDateIndex - 9]]){
                                currentPriorDataPoint = 0;
                                for (var i = 1; i < 10; i++){
                                    currentPriorDataPoint += trafficData[trafficDates[currentDateIndex - i]];
                                }
                                currentPriorDataPoint = Math.round(currentPriorDataPoint / 9);
                                d.value = currentPriorDataPoint;
                                return currentPriorDataPoint;
                            }
                            else {
                                return currentPriorDataPoint = undefined;
                            }
                        }
                        else if (currentDateIndex != -1 && d.column == '9 day post'){
                            if (trafficData[trafficDates[currentDateIndex + 9]]){
                                currentPostDataPoint = 0;
                                for (var i = 1; i < 10; i++){
                                    currentPostDataPoint += trafficData[trafficDates[currentDateIndex + i]];
                                }
                                currentPostDataPoint = Math.round(currentPostDataPoint / 9);
                                d.value = currentPostDataPoint;
                                return currentPostDataPoint;
                            }
                            else {
                                return currentPostDataPoint = undefined;
                            }
                        }
                        else if (currentDateIndex != -1 && d.column == '20 day prior'){
                            if (trafficData[trafficDates[currentDateIndex - 20]]){
                                currentPriorDataPoint = 0;
                                for (var i = 1; i < 21; i++){
                                    currentPriorDataPoint += trafficData[trafficDates[currentDateIndex - i]];
                                }
                                currentPriorDataPoint = Math.round(currentPriorDataPoint / 20);
                                d.value = currentPriorDataPoint;
                                return currentPriorDataPoint;
                            }
                            else{
                                return currentPriorDataPoint = undefined;
                            }
                        }
                        else if (currentDateIndex != -1 && d.column == '20 day post'){
                            if (trafficData[trafficDates[currentDateIndex + 20]]){
                                currentPostDataPoint = 0;
                                for (var i = 1; i < 21; i++){
                                    currentPostDataPoint += trafficData[trafficDates[currentDateIndex + i]];
                                }
                                currentPostDataPoint = Math.round(currentPostDataPoint / 20);
                                d.value = currentPostDataPoint;
                                return currentPostDataPoint;
                            }
                            else{
                                return currentPostDataPoint = undefined;
                            }
                        }
                        else {return undefined;}
                    });

            // color positive changes green
            rows.selectAll("td").filter(function(d){
                if (d.column == "Change" && d.value > 0){return true;}
                else {return false;}
            }).attr("class", "success");

            // color negative changes red
            rows.selectAll("td").filter(function(d){
                if (d.column == "Change" && d.value < 0){return true;}
                else {return false;}
            }).attr("class", "danger");

            // color neutral changes grey
            rows.selectAll("td").filter(function(d){
                if (d.column == "Change" && d.value == 0){return true;}
                else {return false;}
            }).attr("class", "active");

            return table;
        }
        // render the table
        var peopleTable = tabulate(algoData, ["Date", "Algorithm", "Day Before", "Day After", "Change", "4 day prior", "4 day post", "Change", "9 day prior", "9 day post", "Change", "20 day prior", "20 day post", "Change"]);
    });
});
