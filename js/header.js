$(document).on('change', '.btn-file :file', function() {
    var input = $(this),
        numFiles = input.get(0).files ? input.get(0).files.length : 1,
        label = input.val().replace(/\\/g, '/').replace(/.*\//, '');
    input.trigger('fileselect', [numFiles, label]);
});

$('#btn-download').popover({
    trigger: 'hover',
    placement: 'right',
    content: 'Only works in Chrome!',
});

$('select').on('change', function(){
    var filename = $('.btn-file > input').val();
    var visualization = $('select').val();

    if (filename && visualization) {
        $('#btn-submit').removeAttr('disabled');
    }
    else {
        $('#btn-submit').attr('disabled', 'disabled');
    }

    $('select').popover({
        html: true,
        trigger: 'focus',
        placement: 'bottom',
        title: function(){return $(this).children('option:selected').attr("data-title");},
        content: function(){return '<img src="images/' + $(this).children('option:selected').attr('value') + '_thumbnail.png" alt="thumbnail" height="200" width="200" style="margin-left:22px"><br>' + $(this).children('option:selected').attr("data-content") + "<br><a href='/download/" + $(this).children('option:selected').attr('value') + "_sample.csv' download>Download sample</a>";} //this
    }).popover('show');
});

$('.btn-file > input').on('change', function(){
  var filename = $('.btn-file > input').val();
  var visualization = $('select').val();

  if (filename && visualization) {
      $('#btn-submit').removeAttr('disabled');
  }
  else {
      $('#btn-submit').attr('disabled', 'disabled');
  }
});

$('.btn-file :file').on('fileselect', function(event, numFiles, label) {

    var input = $(this).parents('.input-group').find(':text'),
        log = numFiles > 1 ? numFiles + ' files selected' : label;

    if( input.length ) {
        input.val(log);
    } else {
        if( log ) alert(log);
    }

});

$('#btn-download').on('click', function(){
    var e = document.createElement('script');
    e.setAttribute('src', 'https://nytimes.github.io/svg-crowbar/svg-crowbar.js');
    e.setAttribute('class', 'svg-crowbar');
    document.body.appendChild(e);
});

$(document.body).on('click', '.svg-crowbar > .svg-crowbar > button', function(){
    d3.selectAll(".svg-crowbar").remove();
});
