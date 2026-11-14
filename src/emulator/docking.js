;app.directive('dockZone', [function () {
    return {
        restrict: 'A',
        link: function (scope, elem, attrs) {
            var el = elem.get(0);
            el.addEventListener('dragover', function (e) {
                e.preventDefault();
                el.classList.add('dock-over');
            });
            el.addEventListener('dragleave', function (e) {
                if (!el.contains(e.relatedTarget)) {
                    el.classList.remove('dock-over');
                }
            });
            el.addEventListener('drop', function (e) {
                e.preventDefault();
                el.classList.remove('dock-over');
                var pid = e.dataTransfer.getData('text/plain');
                if (!pid) { return; }
                var card = document.querySelector('[data-panel-id="' + pid + '"]');
                if (!card) { return; }
                var target = e.target.closest('[data-panel-id]');
                if (target && target !== card && target.parentNode === el) {
                    var rect = target.getBoundingClientRect();
                    var after = (e.clientY - rect.top) > (rect.height / 2);
                    el.insertBefore(card, after ? target.nextSibling : target);
                } else {
                    el.appendChild(card);
                }
                scope.$apply(function () { scope.saveDockLayout(); });
            });
        }
    };
}]);

app.directive('dockPanel', [function () {
    return {
        restrict: 'A',
        link: function (scope, elem, attrs) {
            var el = elem.get(0);
            var pid = attrs.panelId;
            var hdr = el.querySelector('.panel-heading');
            if (!hdr) { return; }
            hdr.setAttribute('draggable', 'true');
            hdr.addEventListener('dragstart', function (e) {
                if (e.target.tagName === 'SELECT' || e.target.tagName === 'BUTTON' || e.target.tagName === 'A') {
                    e.preventDefault();
                    return;
                }
                e.dataTransfer.setData('text/plain', pid);
                el.classList.add('dock-dragging');
            });
            hdr.addEventListener('dragend', function () {
                el.classList.remove('dock-dragging');
                var overs = document.querySelectorAll('.dock-over');
                for (var i = 0; i < overs.length; i++) { overs.item(i).classList.remove('dock-over'); }
            });
        }
    };
}]);
