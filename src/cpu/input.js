app.service('input', ['memory', function (memory) {
    var input = {
        data: Array(16),
        sync: function () {
            var byte = 0;
            for (var i = 0; i < 8; ++i) {
                if (this.data[i]) {
                    byte += Math.pow(2, i);
                }
            }
            memory.store(memory.data.length - 1, byte);
            byte = 0;
            for (; i < 16; ++i) {
                if (this.data[i]) {
                    byte += Math.pow(2, i - 8);
                }
            }
            memory.store(memory.data.length - 2, byte);
        },
        reset: function () {
            this.data.fill(false);
        },
        setBit: function (bit) {
            if (bit >= this.data.length) {
                throw "Input access error: " + bit;
            }
            this.data[bit] = !this.data[bit];
            this.sync();
        }
    };
    input.reset();
    return input;
}]);
