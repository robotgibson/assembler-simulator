window.CPU_DOCS = window.CPU_DOCS || {};

document.addEventListener('DOMContentLoaded', function () {
    var ids = Object.keys(window.CPU_DOCS);
    var tabsEl = document.getElementById('cpu-tabs');
    var bodyEl = document.getElementById('cpu-doc-body');
    if (!ids.length) {
        bodyEl.innerHTML = '<p class="text-muted">No CPU instruction modules enabled.</p>';
        return;
    }

    var params = new URLSearchParams(window.location.search);
    var active = window.CPU_DOCS[params.get('cpu')] ? params.get('cpu') : ids.at(0);

    function render(id) {
        active = id;
        tabsEl.innerHTML = ids.map(function (k) {
            var cls = (k === active) ? ' class="active"' : '';
            return '<li' + cls + '><a href="?cpu=' + k + '" data-cpu="' + k + '">' + window.CPU_DOCS[k].title + '</a></li>';
        }).join('');

        var doc = window.CPU_DOCS[active];
        var html = '<p style="margin-top:15px;">' + doc.summary + '</p>';
        html += '<div class="well well-sm"><strong>Registers &amp; Flags:</strong> ' + doc.registers + '<br><strong>Syntax &amp; Literals:</strong> <code>' + doc.syntax + '</code></div>';

        doc.groups.forEach(function (g) {
            html += '<h4>' + g.name + '</h4><table class="table table-condensed table-striped table-bordered"><thead><tr><th style="width:28%">Instruction</th><th style="width:22%">Operands</th><th>Description</th></tr></thead><tbody>';
            g.rows.forEach(function (r) {
                html += '<tr><td><code>' + r.at(0) + '</code></td><td>' + r.at(1) + '</td><td>' + r.at(2) + '</td></tr>';
            });
            html += '</tbody></table>';
        });

        html += '<p class="text-muted"><small><strong>Memory-Mapped I/O (256B default):</strong> Console output at <code>0xE8–0xFF</code>; 16 switch inputs at <code>0xFF</code> (bits 0–7) and <code>0xFE</code> (bits 8–15).</small></p>';
        bodyEl.innerHTML = html;
    }

    tabsEl.addEventListener('click', function (e) {
        var cpu = e.target && e.target.getAttribute('data-cpu');
        if (cpu && window.CPU_DOCS[cpu]) {
            e.preventDefault();
            history.replaceState(null, '', '?cpu=' + cpu);
            render(cpu);
        }
    });

    render(active);
});
