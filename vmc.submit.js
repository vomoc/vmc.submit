/**
 * Vmc vmcSubmit v1.0.1 Ajax表单提交
 * 维米客网页工作室
 * http://www.vomoc.com/vmc/vmcSubmit/
 * vomoc@qq.com
 * 2017/11/21
 **/
;(function ($, undefined) {

    /**
     * 扩展Jquery
     * @returns {vmcSubmit}
     */
    $.vmcSubmit = function () {

        return new vmcSubmit();

    };

    /**
     * vmcSubmit 插件
     */
    var vmcSubmit = function () {

        /**
         * 提交数据，最终有效数据集合
         * @type {object}
         */
        this.data = {};

        /**
         * 初始化数据，用于类似form表单重置
         * @type {object}
         */
        this.initData = {};

        /**
         * 备份数据，最后一次有效数据的备份
         * @type {object}
         */
        this.tempData = {};

        /**
         * 安全数据，用于界面回滚，包括全部数据
         * @type {object}
         */
        this.safeData = {};

        /**
         * 字段集合
         * @type {object}
         */
        this.fields = {};

        /**
         * 完成字段采集并验证成功后回调方法
         * @param {function} data 提交的数据集
         */
        this.success = function (data) {
        };

        /**
         * 完成字段采集并验证失败后回调方法
         * @param {function} data 提交的数据集
         */
        this.failure = function (data) {
        };

        /**
         * 当前要执行的自定义回调方法索引
         * @type {number}
         */
        this.index = 0;

        /**
         * 自定义回调方法集合
         * 可用于创建询问对话窗，批量验证等任务
         * @type {Array}
         */
        this.custom = [];

    };

    /**
     * 设置提交数据
     * @access public
     * @param {string} key 字段名
     * @param {number|string|Array|object} value 值
     */
    vmcSubmit.prototype.setData = function (key, value) {

        /**
         * 设置提交数据集
         * @type {number|string|Array|Object}
         */
        this.data[key] = value;

    };

    /**
     * 注册字段
     * @param  {object} field [注册字段选项]
     * @access public
     * @example
     * {
     *     group : 'default', // 分组名称 {string} 非必填
     *     name : 'name', // 字段名称 {string} 必填
     *     value : 'yourname', // 默认值 {number|string|Array|object} 非必填
     *     get : function(name) {}, // 获取字段值方法 {function} 必填 返回字段值 参数 name 字段名
     *     set : function(name, value, data) {}, // 设置字段值方法 {function} 必填 无返回值 参数 name 字段名 value 字段最后一次正确值 data 最后一次正确数据集
     *     rule : function(name, value) {} // 字段验证方法 {function} 非必填 返回值 true|false 参数 name 字段名 value 字段当前值
     * }
     */
    vmcSubmit.prototype.reg = function (field) {

        /**
         * 验证注册的字段名
         * 字段名必须为字符串，且不能为空
         */
        if (typeof (field.name) !== "string" || field.name === "") {
            throw new Error('未指定字段名');
        }

        /**
         * 验证注册的取值方法
         * 取值方法必须为匿名函数
         */
        if (typeof (field.get) !== "function") {
            throw new Error('未指定取值方法');
        }

        /**
         * 验证注册的设置方法
         * 设置方法必须为匿名函数
         */
        if (typeof (field.set) !== "function") {
            throw new Error('未指定设置方法');
        }

        /**
         * 注册字段的分组名称
         * 分组名称必须为字符串，默认值为"default"
         * @type {string}
         */
        field.group = typeof (field.group) === "string" && field.group !== "" ? field.group : "default";

        /**
         * 注册字段的默认值
         * 如果没有设置字段的默认值，注册字段时会使用取值方法设置默认值
         * @type {number|string|Array|object}
         */
        field.value = typeof (field.value) === "undefined" ? field.get.call(this, field.name) : field.value;

        /**
         * 将注册字段信息以字段名为键记录在fields对象
         * @type {object}
         */
        this.fields[field.name] = field;

        /**
         * 将注册字段默认值以字段名为建记录在iniData对象
         * @type {number|string|Array|object}
         */
        this.initData[field.name] = field.value;
    };

    /**
     * 采集字段，通过每个字段的采集方法[get]更新结果数据对应字段值
     * @param  {Array} group 分组，必填，为空数组时采集全部已注册字段，否则采集该数组指定分组中字段
     */
    vmcSubmit.prototype._gather = function (group) {

        for (var n in this.fields) {
            var field = this.fields[n];
            if (group.length <= 0 || $.inArray(field.group, group) >= 0) {
                this.data[n] = field.get.call(this, n);
            }
        }

    };

    /**
     * 验证数组
     * @param  {Array} group 分组，必填，为空时验证全部已注册字段，否则验证该数组中指定分组字段
     * @return {boolean} 字段是否有效
     */
    vmcSubmit.prototype._check = function (group) {

        for (var n in this.fields) {
            var field = this.fields[n];
            // 当未指定组或者指定组包含当前字段组时验证
            if (group.length <= 0 || $.inArray(field.group, group) >= 0) {
                if (typeof (field.rule) === "function" && false === field.rule.call(this, n, this.data[n])) {
                    return false;
                }
            }
        }
        return true;

    };

    /**
     * 采集并验证字段
     * @param {string|Array}  分组名，可在数组中，或者多个参数传入, 不传分组则采集全部字段
     * @example 'group1','group2',['group3', 'group4']
     */
    vmcSubmit.prototype.execute = function () {

        /**
         * 将传入参数整理成为数组
         * @type {Array}
         */
        var group = [];
        for (var i = 0; i < arguments.length; i++) {
            if (typeof(arguments[i]) === "string") {
                group.push(arguments[i]);
            } else if ($.isArray(arguments[i])) {
                $.merge(group, arguments[i]);
            }
        }

        /**
         * 采集
         */
        this._gather(group);

        /**
         * 验证
         */
        if (false === this._check(group)) {
            this.stop();
        } else {
            this.run();
        }

    };

    /**
     * 扩展自定义回调
     * @param  {function} func 回调方法
     */
    vmcSubmit.prototype.extend = function (func) {

        /**
         * 将验证函数注册到对象
         */
        this.custom.push(func);

    };

    /**
     * 执行验证
     * 当验证通过时需要执行该方法
     */
    vmcSubmit.prototype.run = function () {

        if (this.index >= this.custom.length) {

            /**
             * 自定义回调方法完成并通过
             */

            /**
             * 还原自定义回调方法计数索引
             * @type {number}
             */
            this.index = 0;

            /**
             * 备份临时数据
             * 用于下次执行时验证不通过情况，将提交数据还原到最后一次可正常执行状态
             * @type {object}
             */
            this.tempData = $.extend({}, this.data);

            /**
             * 更新安全数据
             * 安全数据包括未采集的数据(如字段默认值)，其取值区间大于data，区别于备份数据
             * @type {object}
             */
            this.safeData = $.extend({}, this.initData, this.data);

            /**
             * 同步安全数据到界面
             */
            if (true === this.options.rollback) {
                for (var n in this.fields) {
                    var obj = this.fields[n];
                    obj.set.call(this, n, this.safeData[n], this.safeData);
                }
            }

            /**
             * 执行验证成功回调
             */
            this.success.call(this, this.data);

        } else {

            /**
             * 自定义回调方法未全部执行完毕，继续执行
             */

            /**
             * 当前要执行的回调索引
             * @type {number}
             */
            var index = this.index;

            /**
             * 验证计数器递增
             */
            this.index++;

            /**
             * 执行自定义回调方法
             */
            this.custom[index].call(this, this.data);

        }

    };

    /**
     * 当验证不通过时需要调用该方法
     */
    vmcSubmit.prototype.stop = function () {

        /**
         * 还原自定义回调方法计数索引
         * @type {number}
         */
        this.index = 0;

        /**
         * 提交数据回滚至最后一次有效状态
         */
        this.data = $.extend({}, this.tempData);

        /**
         * 执行验证失败回调方法
         */
        this.failure.call(this, this.data);


    };

    /**
     * 重置表单
     * 参数如果是{function}用于重置回调
     * 参数如果是字符串或者是数组，用于指定需要回滚的字段分组
     * 如果未指定重置字段分组，则重置全部
     */
    vmcSubmit.prototype.reset = function () {

        var group = [],
            afterReset = function () {
            };

        for (var i = 0; i < arguments.length; i++) {
            if (typeof(arguments[i]) === "function") {
                afterReset = arguments[i];
            } else if (typeof(arguments[i]) === "string") {
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
