/**
 * Vmc vmcSubmit v1.0.0 Ajax表单提交
 * 维米客网页工作室
 * http://www.vomoc.com/vmc/vmcSubmit/
 * vomoc@qq.com
 * 2015/12/06
 **/
;
(function($, undefined) {
    $.vmcSubmit = function(options) {
        if (typeof(options) === 'boolean') {
            options = {
                rollback: options
            };
        }
        return new vmcSubmit(options);
    };
    /**
     * vmcSubmit 插件
     */
    var vmcSubmit = function(options) {
        // 更新选项
        this.options = $.extend({}, this.options, options);
        // 提交数据
        this.data = {};
        // 重置数据,初始化数据
        this.initData = {};
        // 备份数据，最后一次有效数据的备份
        this.tempData = {};
        // 安全数据，用于界面回滚，包括全部数据
        this.safeData = {};
        // 字段集合
        this.fields = {};
        // 验证成功后调用方法 参数 data 提交数据
        this.success = function(data) {};
        // 验证失败后调用方法 参数 data 提交数据
        this.failure = function(data) {};
        // 自定义回调索引
        this.index = 0;
        // 自定义回调集合
        this.custom = new Array();
    };
    /**
     * 默认选项
     * @type {Object}
     * @access private
     */
    vmcSubmit.prototype.options = {
        rollback: false
    };
    /**
     * 设置提交数据
     * @access public
     * @param {string} key     字段名
     * @param {string} value   值
     */
    vmcSubmit.prototype.setData = function(key, value) {
        this.data[key] = value;
        // 保证在回滚数据时保留
        this.tempData[key] = value;
    };
    /**
     * 注册字段
     * @param  {objcet} field [注册字段选项]
     * @access public
     * @example
     * {
     *     group : 'default', // 分组名称 string 非必填
     *     name : 'name', // 字段名称 string 必填
     *     value : 'yourname', // 字段默认值 mix 非必填
     *     get : function(name) {}, // 获取字段值方法 function 必填 返回字段值 参数 name 字段名
     *     set : function(name, value, data) {}, // 设置字段值方法 function 必填 无返回值 参数 name 字段名 value 字段最后一次正确值 data 最后一次正确数据集
     *     rule : function(name, value) {} // 字段验证方法 function 非必填 返回值 true|false 参数 name 字段名 value 字段当前值
     * }
     */
    vmcSubmit.prototype.reg = function(field) {
        // 验证参数有效
        if ($.type(field.name) !== 'string' || field.name === '' || $.type(field.get) !== 'function' || $.type(field.get()) === 'undefined' || $.type(field.set) !== 'function') {
            throw new Error('注册字段选项错误！');
        }
        // 分组名称
        // 如果没有设置分组名称，则指定分组名称为'default'
        field.group = $.type(field.group) === 'string' && field.group !== '' ? field.group : 'default';
        // 字段默认值
        // 如果没有设置字段默认值，则通过获取字段值的方法设置默认值
        field.value = $.type(field.value) === 'undefined' ? field.get.call(this, field.name) : field.value;
        // 注册字段对象
        this.fields[field.name] = field;
        // 注册字段默认值
        this.initData[field.name] = field.value;
    };
    /**
     * 采集字段，通过每个字段的采集方法（get）更新结果数据对应字段值
     * @param  {array} group [分组，必填，为空数组时采集全部已注册字段，否则采集该数组指定分组中字段]
     */
    vmcSubmit.prototype._gather = function(group) {
        for (var n in this.fields) {
            var field = this.fields[n];
            if (group.length <= 0 || $.inArray(field.group, group) >= 0) {
                this.data[n] = field.get.call(this, n);
            }
        }
    };
    /**
     * 验证数组
     * @param  {array} group [分组，必填，为空时验证全部已注册字段，否则验证该数组中指定分组字段]
     * @return {boolean}       [字段是否有效]
     */
    vmcSubmit.prototype._check = function(group) {
        for (var n in this.fields) {
            var field = this.fields[n];
            // 当未指定组或者指定组包含当前字段组时验证
            if (group.length <= 0 || $.inArray(field.group, group) >= 0) {
                if ($.type(field.rule) === 'function' && false === field.rule.call(this, n, this.data[n])) {
                    return false;
                }
            }
        }
        return true;
    };
    // 采集并验证
    // 参数 argu1,argu2,argu3 或者 []
    /**
     * 采集并验证字段
     * @param {string|array}  [分组名，可在数组中，或者多个参数传入, 不传分组则采集全部字段]
     * @example 'group1','group2',['group3', 'group4']
     */
    vmcSubmit.prototype.execute = function() {
        // 将传入参数整理成为数组
        var group = new Array();
        for (var i = 0; i < arguments.length; i++) {
            if (typeof(arguments[i]) === 'string') {
                group.push(arguments[i]);
            } else if ($.isArray(arguments[i])) {
                $.merge(group, arguments[i]);
            }
        }
        // 采集
        this._gather(group);
        // 验证
        if (false === this._check(group)) {
            this.stop();
        } else {
            this.run();
        }
    };
    /**
     * 扩展验证器
     * @param  {function} func [验证函数]
     */
    vmcSubmit.prototype.extend = function(func) {
        // 将验证函数注册到对象
        this.custom.push(func);
    };
    // 
    /**
     * 执行验证，当验证通过时需要执行该方法
     */
    vmcSubmit.prototype.run = function() {
        if (this.index >= this.custom.length) {
            // 验证成功
            // 验证计数器还原
            this.index = 0;
            // 备份临时数据
            this.tempData = $.extend({}, this.data);
            // 更新安全数据，安全数据包括未采集的数据(如字段默认值)，其取值区间大于data，区别于备份数据
            this.safeData = $.extend({}, this.initData, this.data);
            // 同步安全数据到界面
            if (true === this.options.rollback) {
                for (var n in this.fields) {
                    var obj = this.fields[n];
                    obj.set.call(this, n, this.safeData[n], this.safeData);
                }
            }
            // 执行验证成功回调
            this.success.call(this, this.data);
        } else {
            // 继续验证
            var index = this.index;
            // 验证计数器递增
            this.index++;
            // 执行验证方法
            this.custom[index].call(this, this.data);
        }
    };
    /**
     * 当验证不通过时需要调用该方法
     * @return {[type]} [description]
     */
    vmcSubmit.prototype.stop = function() {
        // 验证计数器还原
        this.index = 0;
        // 数据回滚
        this.data = $.extend({}, this.tempData);
        // 执行验证失败后续方法   
        this.failure.call(this, this.data);
    };
    // 重置表单
    vmcSubmit.prototype.reset = function() {
        var group = new Array(),
            afterReset = function() {};
        for (var i = 0; i < arguments.length; i++) {
            if (typeof(arguments[i]) === 'function') {
                afterReset = arguments[i];
            } else if (typeof(arguments[i]) === 'string') {
                group.push(arguments[i]);
            } else if (true === $.isArray(arguments[i])) {
                $.merge(group, arguments[i]);
            }
        }
        for (var n in this.fields) {
            var field = this.fields[n];
            if (group.length <= 0 || $.inArray(field.group, group) >= 0) {
                field.set.call(this, n, this.initData[n], this.initData);
            }
        }
        afterReset.call(this);
    };
})(jQuery);
