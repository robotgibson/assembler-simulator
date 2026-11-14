app.filter('flag', function() {
    return function(input) {
        // convert flag to uppercase
        var str = input.toString().toUpperCase();
        
        // pad with unicode nbsp to stop the flag value from change length
        var l = str.length;
        if(l < 5){
          for(i=0;i<5-l;i++) str += '\u00A0';
        }
        return str;
    };
});
;app.filter('number', function() {
    return function(input, isHex) {
        if (isHex) {
            var hex = input.toString(16).toUpperCase();
            return hex.length == 1 ? "0" + hex: hex;
        } else {
            return input.toString(10);
        }
    };
});
;// Source: http://lostsource.com/2012/11/30/selecting-textarea-line.html
app.directive('selectLine', [function () {
    return {
        restrict: 'A',
        link: function (scope, element, attrs, controller) {
            scope.$watch('selectedLine', function () {
                if (scope.selectedLine >= 0) {
                    var lines = element[0].value.split("\n");

                    // Calculate start/end
                    var startPos = 0;
                    for (var x = 0; x < lines.length; x++) {
                        if (x == scope.selectedLine) {
                            break;
                        }
                        startPos += (lines[x].length + 1);
                    }

                    var endPos = lines[scope.selectedLine].length + startPos;

                    // Chrome / Firefox
                    if (typeof(element[0].selectionStart) != "undefined") {
                        element[0].focus();
                        element[0].selectionStart = startPos;
                        element[0].selectionEnd = endPos;
                    }

                    // IE
                    if (document.selection && document.selection.createRange) {
                        element[0].focus();
                        element[0].select();
                        var range = document.selection.createRange();
                        range.collapse(true);
                        range.moveEnd("character", endPos);
                        range.moveStart("character", startPos);
                        range.select();
                    }
                }
            });
        }
    };
}]);
;app.filter('startFrom', function() {
    return function(input, start) {
        start = +start; //parse to int
        return input.slice(start);
    };
});
;app.directive('tabSupport', [function () {
    return {
        restrict: 'A',
        link: function (scope, element, attrs, controller) {
            element.bind("keydown", function (e) {
                if (e.keyCode === 9) {
                    var val = this.value;
                    var start = this.selectionStart;
                    var end = this.selectionEnd;

                    this.value = val.substring(0, start) + '\t' + val.substring(end);
                    this.selectionStart = this.selectionEnd = start + 1;

                    e.preventDefault();
                    return false;
                }
            });
        }
    };

}]);

