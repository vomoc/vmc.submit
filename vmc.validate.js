/**
 * Vmc Validate v1.0.0 数据验证回滚
 * 维米客网页工作室
 * http://www.vomoc.com/vmc/validate/
 * vomoc@qq.com
 * 2015/07/31
 **/
 ;
(function($, undefined) {
	$.vmc = $.vmc || {};
	$.vmc.validate = function(options) {
		if (typeof(options) === 'boolean') {
			options = {
				rollback: options
			};
		}
		return new validate(options);
	};
	var validate = function(options) {
		// 更新选项
		this.options = $.extend({}, this.options, options);
		// 有效数据
		this.data = {};
		// 重置数据,初始化数据
		this.initData = {};
		// 备份数据，最后一次有效数据的备份
		this.tempData = {};
		// 安全数据，用于界面回滚，包括全部数据
		this.safeData = {};
		// 字段集合
		this.fields = {};
		// 验证成功后调用方法
		this.success = function(data) {};
		// 验证失败后调用方法
		this.failure = function(data) {};
		// 自定义回调索引
		this.index = 0;
		// 自定义回调集合
		this.custom = new Array();
	};
	// 默认选项
	validate.prototype.options = {
		rollback: false
	};
	// 设置有效数据
	// checked 是否绝对有效
	validate.prototype.setData = function(key, value, checked) {
		this.data[key] = value;
		if (true === checked) {
			this.tempData[key] = value;
			this.initData[key] = value;
			//this.safeData[key] = value;
		}
	};
	// 获取有效数据
	validate.prototype.getData = function(key) {
		if (key) {
			return this.data[key];
		} else {
			return this.data;
		}
	};
	// 注册字段
	validate.prototype.reg = function() {
		var opts = {
			// 组别
			group: 'default',
			// 名称,必须
			name: '',
			// 标题
			value: null,
			// 取值方法
			get: function(name) {
				return $.trim($('#' + name).val());
			},
			// 设置方法，回滚方法
			set: function(name, data) {
				$('#' + name).val(data[name]);
			},
			// 验证方法
			rule: function(name, value) {
				return true;
			}
		};
		for (var i = 0; i < arguments.length; i++) {
			var options = typeof(arguments[i]) === 'string' ? {
				name: arguments[i]
			} : arguments[i];
			if (!options.name) {
				throw new Error('注册字段名称必填！');
			}
			options = $.extend({}, opts, this.fields[options.name], options);
			this.fields[options.name] = options;
			this.initData[options.name] = options.value ? options.value : options.get.call(this, options.name);
			//	this.safeData[options.name] = this.initData[options.name];
		}
	};
	// 采集数据，不设置组采集全部，组可为字符串或者数组
	// group 必须是数组
	validate.prototype._gather = function(group) {
		for (var n in this.fields) {
			var field = this.fields[n];
			if (group.length <= 0 || $.inArray(field.group, group) >= 0) {
				this.data[n] = field.get.call(this, n);
			}
		}
	};
	// 验证数据
	validate.prototype._check = function(group) {
		for (var n in this.fields) {
			var field = this.fields[n];
			// 当未指定组或者指定组包含当前字段组时验证
			if (group.length <= 0 || $.inArray(field.group, group) >= 0) {
				if (false === field.rule.call(this, n, this.data[n])) {
					return false;
				}
			}
		}
		return true;
	};
	// 采集并验证
	// 参数 argu1,argu2,argu3 或者 []
	validate.prototype.execute = function() {
		var group = new Array();
		for (var i = 0; i < arguments.length; i++) {
			if (typeof(arguments[i]) === 'string') {
				group.push(arguments[i]);
			} else if (true === $.isArray(arguments[i])) {
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
	// 扩展验证器
	validate.prototype.extend = function(func) {
		// func(data)
		this.custom.push(func);
	};
	// 执行验证，当验证通过时需要执行该方法
	validate.prototype.run = function() {
		if (this.index >= this.custom.length) {
			// 验证成功
			// 验证计数器还原
			this.index = 0;
			// 备份临时数据
			this.tempData = $.extend({}, this.data);
			// 更新安全数据，安全数据包括未采集的数据(如字段默认值)，其取值区间大于data，区别于备份数据
			//this.safeData = $.extend({}, this.safeData, this.data);
			this.safeData = $.extend({}, this.initData, this.data);
			//	console.log(this.data);
			//	console.log(this.safeData);
			// 同步安全数据到界面
			if (true === this.options.rollback) {
				for (var n in this.fields) {
					var obj = this.fields[n];
					obj.set.call(this, n, this.safeData);
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
	// 当验证不通过时需要调用该方法
	validate.prototype.stop = function() {
		// 验证计数器还原
		this.index = 0;
		// 数据回滚
		this.data = $.extend({}, this.tempData);
		// 执行验证失败后续方法	
		this.failure.call(this, this.data);
	};
	// 重置表单
	validate.prototype.reset = function() {
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
				this.data[field.name] = this.initData[field.name];
				this.tempData[field.name] = this.initData[field.name];
				//	this.safeData[field.name] = this.initData[field.name];
				field.set.call(this, n, this.initData);
			}
		}
		afterReset.call(this);
	};
	validate.prototype.regex = function(str, rule) {
		var rules = {
			'require': /.+/,
			'space': /^\S*$/,
			'email': /^\w+([-+.]\w+)*@\w+([-.]\w+)*\.\w+([-.]\w+)*$/,
			'url': /^http(s?):\/\/(?:[A-za-z0-9-]+\.)+[A-za-z]{2,4}(?:[\/\?#][\/=\?%\-&~`@[\]\':+!#\w]*)?$/,
			'currency': /^\d+(\.\d+)?$/,
			'number': /^\d+$/,
			'zip': /^\d{6}$/,
			'integer': /^[-\+]?\d+$/,
			'double': /^[-\+]?\d+(\.\d+)?$/,
			'english': /^[A-Za-z]+$/,
			'mobile': /^1\d{10}$/,
			'date': /\d{4}-\d{1,2}-\d{1,2}/,
			'numeng': /^[A-Za-z0-9]+$/,
			'digits': /^[1-9]\d*$/,
			'nint': /^-[1-9]\d*$/
		};
		var re = typeof(rule) === 'object' ? rule : rules[rule];
		return re.test(str);
	};
	validate.prototype.rules = {
		byteRange: function(value, min, max) {
			var length = value.length;
			for (var i = 0; i < value.length; i++) {
				if (value.charCodeAt(i) > 127) {
					length++;
				}
			}
			if (length >= min && length <= max) {
				return true;
			} else {
				return false;
			}
		},
		range: function(value, min, max) {
			if (value.length >= min && value.length <= max) {
				return true;
			} else {
				return false;
			}
		},
		username: function(value) {
			var re = /\s+|^c:\\con\\con|[%,\*\"\s\<\>\&]|\xA1\xA1|\xAC\xA3|^Guest|^\xD3\xCE\xBF\xCD|\xB9\x43\xAB\xC8/gi;
			if (re.exec(value)) {
				return false;
			}
			if (false === this.byteRange(value, 4, 20)) {
				return false;
			}
			return true;
		},
		password: function(value) {
			var re = /^[a-zA-Z0-9\`\~\!\@\#\$\%\^\&\*\(\)\-\_\=\+\\\|\{\}\[\]\:\;\"\'\<\>\,\.\?\/]*$/;
			if (false === re.test(value)) {
				return false;
			}
			if (false === this.range(value, 6, 16)) {
				return false;
			}
			return true;
		},
		checkcode: function(value) {
			var re = /^[ABCDEFGHIJKMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789]*$/;
			if (false === re.test(value)) {
				return false;
			}
			if (value.length !== 4) {
				return false;
			}
			return true;
		}
	};
})(jQuery);