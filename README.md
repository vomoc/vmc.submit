# vmcSubmit
vmcSubmit 是一款用于收集表单信息的JQuery插件。提供字段验证接口，使用回调方法进行流程控制。解决非表单控件元素（如图片预览）、联动菜单、页面对象等重置问题，完美实现表单重置与局部界面回滚。为Ajax表单提交提供良好支持。

## 使用
```
var submit = $.vmcSubmit();

// 设置字段
submit.setData('age', 16);

// 注册字段
submit.reg({
    group: 'page',
    name: 'username',
    // value: 'abc',
    get: function(name) {
        return $('#username').val();
    },
    set: function(name, value, data) {
        $('#username').val(value);
    },
    rule: function(name, value) {
        if ($.trim(value) == '') {
            console.log(name + ' error');
            return false;
        } else {
            return true;
        }

    }
});

// 自定义回调
submit.extend(function(data) {
    if (data['username'] !== 'admin') {
        console.log('username error');
        this.stop();
    } else {
        this.run();
    }
});

// 定义成功回调
submit.success = function(data) {
    // TODO
    console.log('成功');
    console.log(data);
};

// 定义失败回调
submit.failure = function(data) {
    // TODO
    console.log('失败');
    console.log(data);
}

// 提交表单
$('#submit').on('click', function() {
    submit.execute();
});

// 重置表单
$('#reset').on('click', function() {
    submit.reset();
});
```