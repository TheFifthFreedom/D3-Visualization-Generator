$(document).ready(function(){

  // Disabling submit button until all fields have been populated
  $('#regularLogin input').keyup(function() {
        var empty = false;
        $('#regularLogin input').each(function() {
            if ($(this).val() == '') {
                empty = true;
            }
        });

        if (empty) {
            $('#laddaButton').attr('disabled', 'disabled'); // updated according to http://stackoverflow.com/questions/7637790/how-to-remove-disabled-attribute-with-jquery-ie
        } else {
            $('#laddaButton').removeAttr('disabled'); // updated according to http://stackoverflow.com/questions/7637790/how-to-remove-disabled-attribute-with-jquery-ie
        }
    });
    $('#specialLogin input').keyup(function() {
          var empty = false;
          $('#specialLogin input').each(function() {
              if ($(this).val() == '') {
                  empty = true;
              }
          });

          if (empty) {
              $('#laddaButton2').attr('disabled', 'disabled'); // updated according to http://stackoverflow.com/questions/7637790/how-to-remove-disabled-attribute-with-jquery-ie
          } else {
              $('#laddaButton2').removeAttr('disabled'); // updated according to http://stackoverflow.com/questions/7637790/how-to-remove-disabled-attribute-with-jquery-ie
          }
      });

    // Form submission
    $("#regularLogin").submit(function(){
        //Button spniwheel
        var l = Ladda.create(document.getElementById('laddaButton'));
        l.start();

        //AJAX call
        var postdata = {pid: $("#pid").val(), pmName: $("#pmName").val(), userName: $("#userName").val()};
        $.post("/authenticate", postdata, function(data){
            jsonData = JSON.parse(data);
            // First clear all previous validation states
            if ($('.pid').hasClass('has-success')){$('.pid').removeClass('has-success');}
            else if ($('.pid').hasClass('has-error')){$('.pid').removeClass('has-error');}
            $('#pidHelp').text('');

            if ($('.pmName').hasClass('has-success')){$('.pmName').removeClass('has-success');}
            else if ($('.pmName').hasClass('has-error')){$('.pmName').removeClass('has-error');}
            $('#pmHelp').text('');

            if ($('.userName').hasClass('has-success')){$('.userName').removeClass('has-success');}
            else if ($('.userName').hasClass('has-error')){$('.userName').removeClass('has-error');}
            $('#userHelp').text('');

            // Then check the data and establish new ones if needed
            // Test PID
            if (jsonData['pid']){
                $('.pid').addClass('has-success');
            }
            else{
                $('.pid').addClass('has-error');
                $('#pidHelp').text('Invalid PID');
            }
            //Test PM
            if (jsonData['pmName']){
                $('.pmName').addClass('has-success');
            }
            else{
                $('.pmName').addClass('has-error');
                $('#pmHelp').text('That\'s not a PM');
            }
            // Test User
            if (jsonData['userName']){
                $('.userName').addClass('has-success');
            }
            else{
                $('.userName').addClass('has-error');
                $('#userHelp').text('That\'s not a Sapient employee');
            }

            // Reload page if everything checks out
            if (jsonData['pid'] && jsonData['pmName'] && jsonData['userName']){
                location.reload(true);
            }
        }).always(function() { l.stop(); });
        return false;
    });
    $("#specialLogin").submit(function(){
        //Button spniwheel
        var l = Ladda.create(document.getElementById('laddaButton'));
        l.start();

        var postdata = {password: $("#master").val()};
        $.post("/master_authenticate", postdata, function(data){
            jsonData = JSON.parse(data);
            // First clear all previous validation states
            if ($('.master').hasClass('has-success')){$('.master').removeClass('has-success');}
            else if ($('.master').hasClass('has-error')){$('.master').removeClass('has-error');}
            $('#masterHelp').text('');

            // Then check the data and establish new ones if needed
            if (jsonData['password']){
                $('.master').addClass('has-success');
                location.reload(true);
            }
            else{
                $('.master').addClass('has-error');
                $('#masterHelp').text('Wrong password');
            }
        }).always(function() { l.stop(); });
        return false;
    });
});
