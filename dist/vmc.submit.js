/**
 * Vmc vmcSubmit v1.0.1 Ajax表单提交
 * 维米客网页工作室
 * http://www.vomoc.com/vmc/vmcSubmit/
 * vomoc@qq.com
 * 2017/11/21
 **/
;(function ($, undefined) {
    $.vmcSubmit = function () {
        return new vmcSubmit()
    };
    var vmcSubmit = function () {
        this.data = {};
        this.initData = {};
        this.tempData = {};
        this.safeData = {};
        this.fields = {};
        this.success = function (data) {
        };
        this.failure = function (data) {
        };
        this.index = 0;
        this.custom = []
    };
    vmcSubmit.prototype.setData = function (key, value) {
        this.data[key] = value
    };
    vmcSubmit.prototype.reg = function (field) {
        if (typeof(field.name) !== "string" || field.name === "") {
            throw new Error('未指定字段名');
        }
        if (typeof(field.get) !== "function") {
            throw new Error('未指定取值方法');
        }
        if (typeof(field.set) !== "function") {
            throw new Error('未指定设置方法');
        }
        field.group = typeof(field.group) === "string" && field.group !== "" ? field.group : "default";
        field.value = typeof(field.value) === "undefined" ? field.get.call(this, field.name) : field.value;
        this.fields[field.name] = field;
        this.initData[field.name] = field.value
    };
    vmcSubmit.prototype._gather = function (group) {
        for (var n in this.fields) {
            var field = this.fields[n];
            if (group.length <= 0 || $.inArray(field.group, group) >= 0) {
                this.data[n] = field.get.call(this, n)
            }
        }
    };
    vmcSubmit.prototype._check = function (group) {
        for (var n in this.fields) {
            var field = this.fields[n];
            if (group.length <= 0 || $.inArray(field.group, group) >= 0) {
                if (typeof(field.rule) === "function" && false === field.rule.call(this, n, this.data[n])) {
                    return false
                }
            }
        }
        return true
    };
    vmcSubmit.prototype.execute = function () {
        var group = [];
        for (var i = 0; i < arguments.length; i++) {
            if (typeof(arguments[i]) === "string") {
                group.push(arguments[i])
            } else if ($.isArray(arguments[i])) {
                $.merge(group, arguments[i])
            }
        }
        this._gather(group);
        if (false === this._check(group)) {
            this.stop()
        } else {
            this.run()
        }
    };
    vmcSubmit.prototype.extend = function (func) {
        this.custom.push(func)
    };
    vmcSubmit.prototype.run = function () {
        if (this.index >= this.custom.length) {
            this.index = 0;
            this.tempData = $.extend({}, this.data);
            this.safeData = $.extend({}, this.initData, this.data);
            for (var n in this.fields) {
                var obj = this.fields[n];
                obj.set.call(this, n, this.safeData[n], this.safeData)
            }
            this.success.call(this, this.data)
        } else {
            var index = this.index;
            this.index++;
            this.custom[index].call(this, this.data)
        }
    };
    vmcSubmit.prototype.stop = function () {
        this.index = 0;
        this.data = $.extend({}, this.tempData);
        this.failure.call(this, this.data)
    };
    vmcSubmit.prototype.reset = function () {
        var group = [], afterReset = function () {
        };
        for (var i = 0; i < arguments.length; i++) {
            if (typeof(arguments[i]) === "function") {
                afterReset = arguments[i]
            } else if (typeof(arguments[i]) === "string") {
                group.push(arguments[i])
            } else if (true === $.isArray(arguments[i])) {
                $.merge(group, arguments[i])
            }
        }
        for (var n in this.fields) {
            var field = this.fields[n];
            if (group.length <= 0 || $.inArray(field.group, group) >= 0) {
                field.set.call(this, n, this.initData[n], this.initData)
            }
        }
        afterReset.call(this)
    }
})(jQuery);