import { useState, useEffect, useCallback } from 'react';
import {
  Card, Table, Button, Space, Tag, Switch, Popconfirm, Modal, Form,
  Input, Select, InputNumber, App
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { getAlertRules, createAlertRule, updateAlertRule, deleteAlertRule, getElderlyList } from '@/services/api';
import type { AlertRule, Elderly } from '@/types';

const RULE_TYPE_MAP: Record<string, { label: string; color: string }> = {
  fall:        { label: '跌倒检测', color: 'red' },
  heart_rate:  { label: '心率异常', color: 'orange' },
  breath_rate: { label: '呼吸异常', color: 'blue' },
  out_of_bed:  { label: '离床超时', color: 'purple' },
  inactivity:  { label: '久未活动', color: 'cyan' },
};

const SEVERITY_MAP: Record<string, { label: string; color: string }> = {
  info:      { label: '提示', color: 'blue' },
  warning:   { label: '一般', color: 'gold' },
  critical:  { label: '重要', color: 'orange' },
  emergency: { label: '紧急', color: 'red' },
};

const NOTIFY_OPTIONS = [
  { label: '钉钉', value: 'dingtalk' },
  { label: '企业微信', value: 'wecom' },
  { label: '短信', value: 'sms' },
  { label: '微信订阅', value: 'wechat' },
];

function parseThreshold(type: string, jsonStr: string): Record<string, number> {
  try { return JSON.parse(jsonStr); } catch { return {}; }
}

function formatThreshold(type: string, jsonStr: string): string {
  const t = parseThreshold(type, jsonStr);
  if (type === 'fall') return '跌倒=1';
  if (type === 'heart_rate') return `${t.min || '?'} - ${t.max || '?'} bpm`;
  if (type === 'breath_rate') return `${t.min || '?'} - ${t.max || '?'} 次/分`;
  if (type === 'out_of_bed' || type === 'inactivity') return `> ${t.max_minutes || '?'} 分钟`;
  return jsonStr;
}

const AlertRules: React.FC = () => {
  const { message } = App.useApp();
  const [rules, setRules] = useState<AlertRule[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<AlertRule | null>(null);
  const [saving, setSaving] = useState(false);
  const [elderlyList, setElderlyList] = useState<Elderly[]>([]);
  const [form] = Form.useForm();

  const fetchRules = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getAlertRules({ page: 1, pageSize: 100 });
      setRules(res.data.list || []);
    } catch { /* 全局拦截 */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchRules(); }, [fetchRules]);

  const openCreate = async () => {
    setEditingRule(null);
    form.resetFields();
    try {
      const res = await getElderlyList({ page: 1, pageSize: 200 });
      setElderlyList(res.data.list || []);
    } catch { /* ignore */ }
    setModalOpen(true);
  };

  const openEdit = async (rule: AlertRule) => {
    setEditingRule(rule);
    try {
      const res = await getElderlyList({ page: 1, pageSize: 200 });
      setElderlyList(res.data.list || []);
    } catch { /* ignore */ }
    const th = parseThreshold(rule.ruleType, rule.thresholdValue);
    form.setFieldsValue({
      ruleName: rule.ruleName,
      ruleType: rule.ruleType,
      elderId: rule.elderId ?? undefined,
      severity: rule.severity,
      notifyChannels: rule.notifyChannels ? rule.notifyChannels.split(',').filter(Boolean) : [],
      ...th,
    });
    setModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteAlertRule(id);
      message.success('已删除');
      fetchRules();
    } catch { /* ignore */ }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);
      const { ruleType, ruleName, elderId, severity, notifyChannels, ...rest } = values;

      let thresholdValue = '{}';
      if (ruleType === 'fall') {
        thresholdValue = JSON.stringify({ fall_status: rest.fall_status ?? 1 });
      } else if (ruleType === 'heart_rate' || ruleType === 'breath_rate') {
        thresholdValue = JSON.stringify({ min: rest.min ?? 0, max: rest.max ?? 999 });
      } else if (ruleType === 'out_of_bed' || ruleType === 'inactivity') {
        thresholdValue = JSON.stringify({ max_minutes: rest.max_minutes ?? 30 });
      }

      const payload = {
        ruleName,
        ruleType,
        elderId: elderId || null,
        thresholdValue,
        severity: severity || 'warning',
        notifyChannels: (notifyChannels || []).join(','),
      };

      if (editingRule) {
        await updateAlertRule(editingRule.id, payload);
        message.success('更新成功');
      } else {
        await createAlertRule(payload);
        message.success('创建成功');
      }
      setModalOpen(false);
      fetchRules();
    } catch (err) {
      if (err && typeof err === 'object' && 'errorFields' in err) return;
    } finally {
      setSaving(false);
    }
  };

  const ruleTypeWatch = Form.useWatch('ruleType', form);

  const columns: ColumnsType<AlertRule> = [
    {
      title: '规则名称', dataIndex: 'ruleName', width: 160,
      render: (v: string) => <strong>{v}</strong>,
    },
    {
      title: '规则类型', dataIndex: 'ruleType', width: 110,
      render: (v: string) => {
        const m = RULE_TYPE_MAP[v];
        return m ? <Tag color={m.color}>{m.label}</Tag> : v;
      },
    },
    {
      title: '适用老人', dataIndex: 'elderId', width: 120,
      render: (v: number | null) => v ? `老人ID: ${v}` : <Tag color="green">全局规则</Tag>,
    },
    {
      title: '阈值', dataIndex: 'thresholdValue', width: 160,
      render: (v: string, r: AlertRule) => <code>{formatThreshold(r.ruleType, v)}</code>,
    },
    {
      title: '级别', dataIndex: 'severity', width: 80,
      render: (v: string) => {
        const m = SEVERITY_MAP[v];
        return m ? <Tag color={m.color}>{m.label}</Tag> : v;
      },
    },
    {
      title: '通知渠道', dataIndex: 'notifyChannels', width: 140,
      render: (v: string) => {
        if (!v) return <Tag>无</Tag>;
        return v.split(',').map((ch) => {
          const opt = NOTIFY_OPTIONS.find((o) => o.value === ch);
          return <Tag key={ch} color="geekblue">{opt?.label || ch}</Tag>;
        });
      },
    },
    {
      title: '启用', dataIndex: 'enabled', width: 70,
      render: (v: number, record: AlertRule) => (
        <Switch
          checked={v === 1}
          size="small"
          onChange={async (checked) => {
            const rule = record;
            if (!rule) return;
            try {
              await updateAlertRule(rule.id, { enabled: checked ? 1 : 0 });
              fetchRules();
            } catch { /* ignore */ }
          }}
        />
      ),
    },
    {
      title: '操作', width: 120, fixed: 'right',
      render: (_: unknown, record: AlertRule) => (
        <Space>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => openEdit(record)}>编辑</Button>
          <Popconfirm
            title="确认删除此规则？"
            icon={<ExclamationCircleOutlined style={{ color: 'red' }} />}
            onConfirm={() => handleDelete(record.id)}
            okText="删除" cancelText="取消"
          >
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <>
      <Card
        title="告警规则管理"
        extra={<Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>新增规则</Button>}
      >
        <Table
          rowKey="id"
          columns={columns}
          dataSource={rules}
          loading={loading}
          pagination={false}
          scroll={{ x: 960 }}
        />
      </Card>

      <Modal
        title={editingRule ? '编辑告警规则' : '新增告警规则'}
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => { setModalOpen(false); form.resetFields(); }}
        confirmLoading={saving}
        okText="保存"
        cancelText="取消"
        destroyOnClose
        width={560}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 12 }}>
          <Form.Item name="ruleName" label="规则名称" rules={[{ required: true, message: '请输入规则名称' }]}>
            <Input placeholder="如: 心率过高告警" />
          </Form.Item>

          <Form.Item name="ruleType" label="规则类型" rules={[{ required: true, message: '请选择规则类型' }]}>
            <Select
              placeholder="选择规则类型"
              options={Object.entries(RULE_TYPE_MAP).map(([v, m]) => ({ value: v, label: m.label }))}
              onChange={() => {
                // 切换类型时重置阈值相关字段
                form.setFieldsValue({ min: undefined, max: undefined, max_minutes: undefined, fall_status: undefined });
              }}
            />
          </Form.Item>

          <Form.Item name="elderId" label="适用老人（留空=全局）">
            <Select
              allowClear
              showSearch
              placeholder="全局规则（所有老人适用）"
              optionFilterProp="label"
              options={elderlyList.map((e) => ({ value: e.id, label: `${e.name} (${e.roomNo || '未分配房间'})` }))}
            />
          </Form.Item>

          {/* 动态阈值 */}
          {ruleTypeWatch === 'fall' && (
            <Form.Item name="fall_status" label="跌倒状态" initialValue={1}>
              <Select options={[{ value: 1, label: '跌倒=1（检测到跌倒即告警）' }]} />
            </Form.Item>
          )}
          {(ruleTypeWatch === 'heart_rate' || ruleTypeWatch === 'breath_rate') && (
            <Space size="middle">
              <Form.Item name="min" label="最小值" rules={[{ required: true, message: '必填' }]}>
                <InputNumber placeholder="如: 50" min={0} style={{ width: 120 }} />
              </Form.Item>
              <Form.Item name="max" label="最大值" rules={[{ required: true, message: '必填' }]}>
                <InputNumber placeholder="如: 100" min={0} style={{ width: 120 }} />
              </Form.Item>
            </Space>
          )}
          {(ruleTypeWatch === 'out_of_bed' || ruleTypeWatch === 'inactivity') && (
            <Form.Item name="max_minutes" label="超时阈值（分钟）" rules={[{ required: true, message: '必填' }]}>
              <InputNumber placeholder="如: 30" min={1} style={{ width: 160 }} addonAfter="分钟" />
            </Form.Item>
          )}

          <Form.Item name="severity" label="告警级别" initialValue="warning">
            <Select
              options={Object.entries(SEVERITY_MAP).map(([v, m]) => ({ value: v, label: m.label }))}
            />
          </Form.Item>

          <Form.Item name="notifyChannels" label="通知渠道" initialValue={[]}>
            <Select mode="multiple" placeholder="选择通知渠道" options={NOTIFY_OPTIONS} />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default AlertRules;
