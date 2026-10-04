// SmartCare Zabbix Webhook - 正确使用 value
// Zabbix 6.4 的 Webhook 参数通过 JSON 字符串 `value` 传入

try {
    var p = JSON.parse(value);
    Zabbix.log(4, '[SmartCare] 参数: ' + value);
    Zabbix.log(4, '[SmartCare] api_url=' + p.api_url);

    if (!p.api_url || String(p.api_url).trim() === '') {
        throw 'api_url 为空';
    }

    var apiUrl = String(p.api_url).trim();
    var subject = String(p.alert_subject || '');
    var message = String(p.alert_message || '');
    var severity = String(p.alert_severity || '1');
    var hostName = String(p.host_name || '');

    // 从 host_name 提取 elder_id (格式: Elder-{id})
    var elderId = '';
    if (hostName.indexOf('Elder-') === 0) {
        elderId = hostName.substring(6);
    }

    var payload = JSON.stringify({
        source: 'zabbix',
        host_name: hostName,
        elder_id: elderId,
        alert_type: 'zabbix_trigger',
        alert_level: severity,
        alert_message: subject + ': ' + message
    });

    Zabbix.log(4, '[SmartCare] 发送: ' + payload);

    var req = new HttpRequest();
    req.addHeader('Content-Type: application/json');
    var resp = req.post(apiUrl, payload);
    var code = req.getStatus();

    Zabbix.log(4, '[SmartCare] 响应: ' + code);
    if (code >= 200 && code < 300) {
        return 'OK';
    }
    throw '后端返回 ' + code;

} catch (e) {
    Zabbix.log(3, '[SmartCare] 失败: ' + String(e));
    throw '失败: ' + String(e);
}
