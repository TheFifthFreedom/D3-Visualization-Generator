d3.csv('user_data/modified.csv', function(d){
    return d;
}, function(error, data){
    if (!error){
        var chart = c3.generate({
            bindto: '#chart',
            data: {
                json: data.slice(0, 10),
                type: 'line',
                keys: {
                    x: 'Position',
                    value: ['CTR']
                }
            },
            padding: {
                top: 40,
                left: 100,
                right: 40
            },
            axis: {
                x: {
                    label: {
                        text: 'Avg. Position',
                        position: 'inner-right'
                    },
                    tick: {
                        fit: false
                    }
                },
                y: {
                    label: {
                        text: 'Avg. CTR',
                        position: 'outer-middle'
                    },
                    tick: {
                        format: d3.format(".2%")
                    }
                }
            }
        });
    }
});

// SVG Download
$('#btn-download').on('click', function(){
    // var e = document.createElement('script');
    // e.setAttribute('src', 'https://nytimes.github.io/svg-crowbar/svg-crowbar.js');
    // e.setAttribute('class', 'svg-crowbar');
    // document.body.appendChild(e);
    window.location = 'user_data/modified.csv';
});
