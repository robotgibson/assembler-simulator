app.service('memory', [function () {
    var memory = {
        data: Array(256),
        lastAccess: -1,
        load: function (address) {
            if (address < 0 || address >= this.data.length) {
                throw "Memory access violation at " + address;
            }
            this.lastAccess = address;
            return this.data[address];
        },
        store: function (address, value) {
            if (address < 0 || address >= this.data.length) {
                throw "Memory access violation at " + address;
            }
            this.lastAccess = address;
            this.data[address] = value;
        },
        resize: function (size) {
            this.data = new Array(size);
            this.reset();
        },
        reset: function () {
            this.lastAccess = -1;
            for (var i = 0, l = this.data.length; i < l; i++) {
                this.data[i] = 0;
            }
        }
    };
    memory.reset();
    return memory;
}]);
