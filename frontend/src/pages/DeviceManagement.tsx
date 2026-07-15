/**
 * 设备管理页 — 8类设备的统一管理界面
 * 支持注册/列表/筛选/编辑/删除/指令下发
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  Table, Tag, Button, Modal, Form, Input, Select, Space, App, Typography,
  Tooltip, Descriptions, Row, Col, Card, Statistic, Badge,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  PlusOutlined, ReloadOutlined, EditOutlined, DeleteOutlined,
  ApiOutlined, ControlOutlined,
} from '@ant-design/icons';
import {
  getDeviceList, getDeviceCategories, registerDevice,
  updateDevice, deleteDevice, getDeviceStats, sendDeviceCommand, getElderlyList,
} from '@/services/api';
import type { DeviceGeneric, DeviceCategory, DeviceStatsSummary } from '@/types';

const { Text } = Typography;

const categoryStatusMap: Record<string, { color: string; label: string }> = {
  radar_fall: { color: 'blue', label: '跌倒雷达' },
  radar_bedside: { color: 'geekblue', label: '心率雷达' },
  infrared: { color: 'purple', label: '红外探测器' },
  door_magnet: { color: 'cyan', label: '门磁' },
  camera: { color: 'green', label: '摄像头' },
  sos_button: { color: 'red', label: '呼叫按钮' },
  smoke_detector: { color: 'orange', label: '烟雾报警' },
  gas_detector: { color: 'volcano', label: '煤气报警' },
};

const DeviceManagement: React.FC = () => {
  const { message: appMessage, modal } = App.useApp();
  const [list, setList] = useState<DeviceGeneric[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [categoryFilter, setCategoryFilter] = useState<string | undefined>();
  const [categories, setCategories] = useState<DeviceCategory[]>([]);
  const [stats, setStats] = useState<DeviceStatsSummary | null>(null);
  const [elderlyOptions, setElderlyOptions] = useState<{ value: number; label: string }[]>([]);

  // 注册/编辑弹窗
  const [modalOpen, setModalOpen] = useState(false);
  const [editingDevice, setEditingDevice] = useState<DeviceGeneric | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();

  const fetchCategories = useCallback(async () => {
    try {
      const res = await getDeviceCategories();
      setCategories(res.data);
    } catch { /* ignore */ }
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      const res = await getDeviceStats();
      setStats(res.data);
    } catch { /* ignore */ }
  }, []);

  const fetchElderly = useCallback(async () => {
    try {
      const res = await getElderlyList({ page: 1, pageSize: 200 });
      setElderlyOptions(
        (res.data.list || []).map((e) => ({ value: e.id, label: `${e.name} - ${e.roomNo}` }))
      );
    } catch { /* ignore */ }
  }, []);

  const fetchList = useCallback(async () => {
    setLoading(true);
    try {
      const params: { page: number; pageSize: number; category?: string } = { page, pageSize };
      if (categoryFilter) params.category = categoryFilter;
      const res = await getDeviceList(params);
      setList(res.data.list);
      setTotal(res.data.total);
    } catch { /* ignore */ } finally {
      setLoading(false);
    }
  }, [page, pageSize, categoryFilter]);

  useEffect(() => {
    fetchCategories();
    fetchElderly();
  }, [fetchCategories, fetchElderly]);

  useEffect(() => {
    fetchList();
    fetchStats();
  }, [fetchList, fetchStats]);

  const handleOpenAdd = () => {
    setEditingDevice(null);
    form.resetFields();
    form.setFieldsValue({ deviceCategory: 'radar_fall' });
    setModalOpen(true);
  };

  const handleOpenEdit = (record: DeviceGeneric) => {
    setEditingDevice(record);
    form.setFieldsValue({ ...record });
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);
      if (editingDevice) {
        await updateDevice(editingDevice.id, values);
        appMessage.success('设备更新成功');
      } else {
        await registerDevice(values);
        appMessage.success('设备注册成功');
      }
      setModalOpen(false);
      fetchList();
      fetchStats();
    } catch (err) {
      if (err && typeof err === 'object' && 'errorFields' in err) return;
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (record: DeviceGeneric) => {
    modal.confirm({
      title: '确认删除',
      content: `确定删除设备「${record.deviceName || record.deviceSn}」吗？`,
      okText: '确认删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        await deleteDevice(record.id);
        appMessage.success('设备已删除');
        fetchList();
        fetchStats();
      },
    });
  };

  const handleSendCommand = (record: DeviceGeneric, command: Record<string, unknown>) => {
    modal.confirm({
      title: '确认操作',
      content: `确定向设备「${record.deviceName}」下发指令「${JSON.stringify(command)}」吗？`,
      onOk: async () => {
        await sendDeviceCommand(record.id, command);
        appMessage.success('指令已下发');
      },
    });
  };

  const columns: ColumnsType<DeviceGeneric> = [
    {
      title: '设备名称',
      dataIndex: 'deviceName',
      key: 'deviceName',
      width: 160,
      ellipsis: true,
    },
    {
      title: '序列号',
      dataIndex: 'deviceSn',
      key: 'deviceSn',
      width: 140,
      render: (val: string) => <Text code>{val}</Text>,
    },
    {
      title: '类型',
      dataIndex: 'deviceCategory',
      key: 'deviceCategory',
      width: 100,
      render: (val: string) => {
        const info = categoryStatusMap[val] || { color: 'default', label: val };
        return <Tag color={info.color}>{info.label}</Tag>;
      },
    },
    {
      title: '房间',
      dataIndex: 'roomNo',
      key: 'roomNo',
      width: 80,
    },
    {
      title: '关联老人',
      dataIndex: 'elderName',
      key: 'elderName',
      width: 80,
      render: (val: string) => val || <Text type="secondary">未绑定</Text>,
    },
    {
      title: '在线',
      dataIndex: 'onlineStatus',
      key: 'onlineStatus',
      width: 60,
      align: 'center',
      render: (val: number) => <Badge status={val === 1 ? 'success' : 'error'} text="" />,
    },
    {
      title: '电量',
      dataIndex: 'batteryLevel',
      key: 'batteryLevel',
      width: 70,
      align: 'center',
      render: (val: number | null) =>
        val !== null ? (
          <span style={{ color: val < 20 ? '#f5222d' : '#52c41a' }}>{val}%</span>
        ) : '-',
    },
    {
      title: '信号',
      dataIndex: 'signalStrength',
      key: 'signalStrength',
      width: 70,
      align: 'center',
      render: (val: number | null) => (val !== null ? `${val} dBm` : '-'),
    },
    {
      title: '最后心跳',
      dataIndex: 'lastHeartbeat',
      key: 'lastHeartbeat',
      width: 150,
      render: (val: string | null) =>
        val ? new Date(val).toLocaleString('zh-CN') : <Text type="secondary">从未</Text>,
    },
    {
      title: '操作',
      key: 'action',
      width: 180,
      fixed: 'right',
      render: (_: unknown, record: DeviceGeneric) => (
        <Space size="small">
          <Tooltip title="编辑">
            <Button size="small" icon={<EditOutlined />} onClick={() => handleOpenEdit(record)} />
          </Tooltip>
          {record.deviceCategory === 'gas_detector' && (
            <Tooltip title="关阀">
              <Button
                size="small"
                danger
                icon={<ControlOutlined />}
                onClick={() => handleSendCommand(record, { action: 'close_valve' })}
              />
            </Tooltip>
          )}
          <Tooltip title="删除">
            <Button
              size="small"
              danger
              icon={<DeleteOutlined />}
              onClick={() => handleDelete(record)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div className="page-container">
      <div className="page-header">
        <h2 className="page-title">设备管理</h2>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={() => { fetchList(); fetchStats(); }}>
            刷新
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleOpenAdd}>
            注册设备
          </Button>
        </Space>
      </div>

      {/* 设备统计卡片 */}
      {stats && (
        <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
          <Col xs={8} sm={8} md={4}>
            <Card size="small" style={{ textAlign: 'center' }}>
              <Statistic title="设备总数" value={stats.totalDevices} suffix="台" />
            </Card>
          </Col>
          <Col xs={8} sm={8} md={4}>
            <Card size="small" style={{ textAlign: 'center' }}>
              <Statistic
                title="在线"
                value={stats.onlineDevices}
                suffix="台"
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col xs={8} sm={8} md={4}>
            <Card size="small" style={{ textAlign: 'center' }}>
              <Statistic
                title="离线"
                value={stats.offlineDevices}
                suffix="台"
                valueStyle={{ color: '#f5222d' }}
              />
            </Card>
          </Col>
          {(stats.byCategory || []).slice(0, 5).map((cat) => (
            <Col xs={8} sm={8} md={2} key={cat.category}>
              <Card size="small" style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 11, color: '#999' }}>{cat.icon} {cat.label}</div>
                <div style={{ fontSize: 16, fontWeight: 700 }}>
                  <span style={{ color: '#52c41a' }}>{cat.online}</span>
                  <span style={{ color: '#d9d9d9', margin: '0 4px' }}>/</span>
                  <span>{cat.total}</span>
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      )}

      {/* 筛选 */}
      <div className="section-card" style={{ marginBottom: 12 }}>
        <Space wrap>
          <Select
            value={categoryFilter}
            onChange={(val) => { setCategoryFilter(val); setPage(1); }}
            allowClear
            placeholder="设备类型"
            style={{ width: 160 }}
            options={[
              { label: '全部类型', value: undefined },
              ...categories.map((c) => ({ label: `${c.icon} ${c.label}`, value: c.value })),
            ]}
          />
          <Button
            onClick={() => { setCategoryFilter(undefined); setPage(1); }}
          >
            重置
          </Button>
        </Space>
      </div>

      {/* 设备列表 */}
      <div className="section-card" style={{ padding: 0 }}>
        <Table
          columns={columns}
          dataSource={list}
          rowKey="id"
          loading={loading}
          scroll={{ x: 1200 }}
          pagination={{
            current: page,
            pageSize,
            total,
            showSizeChanger: true,
            showTotal: (t) => `共 ${t} 台设备`,
            onChange: (p, ps) => { setPage(p); setPageSize(ps); },
          }}
        />
      </div>

      {/* 注册/编辑弹窗 */}
      <Modal
        title={editingDevice ? '编辑设备' : '注册新设备'}
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => setModalOpen(false)}
        confirmLoading={submitting}
        okText="保存"
        cancelText="取消"
        width={560}
        destroyOnClose
      >
        <Form form={form} layout="vertical" style={{ marginTop: 8 }}>
          <Form.Item name="deviceSn" label="设备序列号"
            rules={[{ required: true, message: '请输入设备序列号' }]}>
            <Input placeholder="设备唯一序列号" disabled={!!editingDevice} />
          </Form.Item>
          <Form.Item name="deviceCategory" label="设备类型"
            rules={[{ required: true, message: '请选择设备类型' }]}>
            <Select
              disabled={!!editingDevice}
              options={categories.map((c) => ({ label: `${c.icon} ${c.label}`, value: c.value }))}
            />
          </Form.Item>
          <Form.Item name="deviceName" label="设备名称">
            <Input placeholder="给设备起个名字" />
          </Form.Item>
          <Form.Item name="deviceBrand" label="品牌">
            <Input placeholder="如: 萤石 / 海康" />
          </Form.Item>
          <Form.Item name="deviceModel" label="型号">
            <Input placeholder="如: CS-C6P" />
          </Form.Item>
          <Form.Item name="roomNo" label="安装房间">
            <Input placeholder="如: 101" />
          </Form.Item>
          <Form.Item name="elderId" label="关联老人">
            <Select
              allowClear
              showSearch
              filterOption={(input, option) =>
                (option?.label as string)?.toLowerCase().includes(input.toLowerCase())
              }
              placeholder="选择关联老人"
              options={elderlyOptions}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default DeviceManagement;
