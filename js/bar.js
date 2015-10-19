var top10 = []
var columns = [['Domains'], ['Clicks'], ['Positions']]

d3.csv('user_data/modified.csv', function(d){
    return d;

}, function(error, data){
    if (!error){
        top10 = data.sort(compare)
        console.log(top10)
        top10 = top10.slice(0, 10)
        for (i = 0; i < top10.length; i++){
            columns[0].push(top10[i]['Domain']);
            columns[1].push(top10[i]['Sum of Estimated Clicks']);
            columns[2].push(top10[i]['Position']);
        }
    }

    var chart = c3.generate({
        bindto: '#chart',
        data: {
            columns: columns,
            x: 'Domains',
            axes: {
                Clicks: 'y',
                Positions: 'y2'
            },
            types:{
                Clicks: 'bar',
                Positions: 'line'
            }
        },
        padding: {
            top: 20,
            left: 100,
            right: 100
        },
        axis: {
            x: {
                type: 'category',
                tick:{
                    rotate: 60,
                    multiline: false
                }
            },
            y: {
                label: {
                    text: 'Estimated number of clicks',
                    position: 'outer-middle'
                }
            },
            y2: {
                show: true,
                label: {
                    text: 'Average position',
                    position: 'outer-middle'
                }
            }
        },
        legend: {
            position: 'inset'
        }
    });
});

function compare(a, b){
    if (parseFloat(a['Sum of Estimated Clicks']) < parseFloat(b['Sum of Estimated Clicks'])){
        return 1;
    }
    else if (parseFloat(a['Sum of Estimated Clicks']) > parseFloat(b['Sum of Estimated Clicks'])){
        return -1;
    }
    else{
      return 0;
    }
}

// SVG Download
$('#btn-download').on('click', function(){
    // var e = document.createElement('script');
    // e.setAttribute('src', 'https://nytimes.github.io/svg-crowbar/svg-crowbar.js');
    // e.setAttribute('class', 'svg-crowbar');
    // document.body.appendChild(e);
    window.location = 'user_data/modified.csv';
});
