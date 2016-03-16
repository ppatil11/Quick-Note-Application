/**
 * Created by ppati on 3/9/2016.
 */

(function($){

    $(document).ready(function(){
        $('[data-toggle="tooltip"]').tooltip();
    });

    var dbase;
    //Send an open request to the indexedDB
    var openRequest = indexedDB.open("notelist", 1);
        openRequest.onupgradeneeded = function(e) {
        console.log("Upgrading Database...");
        var thisDB = e.target.result;
        //If the object store doesn't contain a list store then create one
        if(!thisDB.objectStoreNames.contains("noteliststore")) {
            thisDB.createObjectStore("noteliststore", { autoIncrement : true });
        }
    };
    //OnSuccess
    openRequest.onsuccess = function(e) {
        console.log("Open Success!");
        dbase = e.target.result;
        $('#addNote').click(function(){
            $("#noteWrapper").slideToggle("slow");
        });



        $('#submit').click(function(){
            //Get Name , Subject and Text
           // var name = $('#name').value;
            var name    =  document.getElementById('name').value;
            var subj    =  document.getElementById('sub').value;
            var msgg    =  document.getElementById('tNote').value;
            console.log(name + subj + msgg);

             var NoteObject = new getNoteObject( name, subj, msgg);

            if (!NoteObject.name.trim() || !NoteObject.subject.trim() || !NoteObject.message.trim()) {
                alert("Please enter a value");
            } else {
                addNote(NoteObject.name , NoteObject.subject , NoteObject.message);
            }

        });
        renderList();
    };

    function getNoteObject(nam , sub , msg){
        this.name = nam;
        this.subject = sub;
        this.message = msg;
        return name ;
        return subject;
        return message;
    }
    openRequest.onerror = function(e) {
        console.log("Open Error!");
        console.dir(e);
    };

    function addNote(name, subject , note) {
        console.log('adding note with' + subject);
        var transaction = dbase.transaction(["noteliststore"],"readwrite");
        var store = transaction.objectStore("noteliststore");

        //Process Data ; Remove JS injection
        var $name = name.replace(/</g, " ").replace(/>/g, " ");
        var $subj = subject.replace(/</g, " ").replace(/>/g, " ");
        var $mesg = note.replace(/</g, " ").replace(/>/g, " ");

        //Get date
        var date = new Date();
        var n = date.toLocaleString();

        //Store data into indexedDB
        var request = store.add({kname: $name , ksub: $subj , ktext: $mesg , kdate: n});

        request.onerror = function(e) {
            console.log("Error",e.target.error.name);
            //some type of error handler
        };
        request.onsuccess = function(e) {
            console.log("note with subject:" +subject+ "added ");
            renderList();
            //Clear the form
            document.getElementById('name').value = '';
            document.getElementById('sub').value = '';
            document.getElementById('tNote').value = '';

        };
    }

    function renderList(){
        $('.listWrapper').empty();

        //Count all Objects
        var transaction = dbase.transaction(['noteliststore'], 'readonly');
        var store = transaction.objectStore('noteliststore');

        //Get the count of Notes in DB
        var countRequest = store.count();
        countRequest.onsuccess = function() {
            console.log(countRequest.result);
            $('#noOfNotes').html('<h4>'+"Total no. of note: " + countRequest.result     + '</h4>');
        };
        $('.listWrapper').html('<table id="noteTable"><tr><th>Notes</th><th>No. of Char</th>' +
                                                     '<th>Date/Time</th></tr></table>');

// Get all Objects
        var objectStore = dbase.transaction("noteliststore").objectStore("noteliststore");
        objectStore.openCursor().onsuccess = function(event) {
            var cursor = event.target.result;
            if (cursor) {
                var $link = $('<a href="#" data-key="' + cursor.key + '">'
                                                       + cursor.value.ksub.substr(0 , 20)  + '</a>');
                console.log($link);
                //Display the text when a note in list view is clicked
                $link.click(function(){
                    loadTextByKey(parseInt($(this).attr('data-key')));
                });

                var $n = cursor.value.kdate;
//Get text;remove all spaces;count characters
                var $char = cursor.value.ktext.replace(/\s+/g, '');
                var $charCount = $char.length;
                var $row = $('<tr>');
                var $textCell1 = $('<td id="textCol"></td>').append($link);
                var $textCell2 = $('<td id="charCol"></td>').append($charCount);
                var $textCell3 = $('<td id="dateCol" align="left"></td>').append($n);

                $row.append($textCell1);
                $row.append($textCell2);
                $row.append($textCell3);
                $('.listWrapper table').append($row);
                cursor.continue();
            }
            else {
                //no more entries
            }
        };
    }
    function loadTextByKey(key){
        var transaction = dbase.transaction(['noteliststore'], 'readonly');
        var store = transaction.objectStore('noteliststore');
        var request = store.get(key);
        request.onerror = function(event) {
            // Handle errors!
        };
        request.onsuccess = function(event) {
            // Do something with the request.result!
            $('#displayWrapper').html(
                '<div><label id="displayLabels">' + "Name: " +'</label>'+
                '<p>'  + request.result.kname + '</p>' +
                '<label id="displayLabels">' + "Subject: " +'</label>'+
                '<p>'  + request.result.ksub  + '</p>' +
                '<label id="displayLabels">' + "Text: " +'</label>'+
                '<p>'  + request.result.ktext + '</p></div>');
            //Add delete button
            var $div = $('<div id="btnDiv"></div>');
            var $divider = $('<div id="divider"></div>');
            var $delBtn = $('<button class="btn btn-Default" type="submit"' +
                'data-toggle="tooltip" data-placement="bottom" title="Click to delete">Delete Note</button>');
            var $closBtn = $('<button class="btn btn-Default" type="submit"' +
                'data-toggle="tooltip" data-placement="right" title="Click to close">Close</button>');
            $delBtn.click(function(){
                console.log('Delete ' + key);
                var $confirm = confirm("Are you sure you want to delete this note?");
                if (!$confirm){
                    //go back
                }else {
                    deleteWord(key);
                }
            });
            $closBtn.click(function(){
                $('#displayWrapper').empty();
            })
            $('#displayWrapper').append($div);
            $('#btnDiv').append($delBtn);
            $('#btnDiv').append($divider);
            $('#btnDiv').append($closBtn);
        };
    }
    function deleteWord(key) {
        var transaction = dbase.transaction(['noteliststore'], 'readwrite');
        var store = transaction.objectStore('noteliststore');
        var request = store.delete(key);
        request.onsuccess = function(evt){
            renderList();
            $('#displayWrapper').empty();
        };
    }
})(jQuery);
