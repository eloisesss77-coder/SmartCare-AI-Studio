import React, { useState, useEffect, useCallback } from 'react';
import {
  Table,
  Select,
  DatePicker,
  Tag,
  Space,
  Modal,
  Input,
  Button,
  App,
  Typography,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { FilterOutlined, ExclamationCircleFilled } from '@ant-design/icons';
import dayjs from 'dayjs';
import type { Dayjs } from 'dayjs';
import { getAlertList, handleAlert as handleAlertApi } from '@/services/api';
import type { AlertRecord } from '@/types';
import { useAuth } from '@/contexts/AuthContext';

const { Text } = Typography;
const { RangePicker } = DatePicker;
const { TextArea } = Input;

const alertLevelColors: Record<string, string> = {
  info: 'blue',
  warning: 'gold',
  critical: 'orange',
  emergency: 'red',
};

const alertLevelLabels: Record<string, string> = {
  info: '提示',
  warning: '一般',
  critical: '重要',
  emergency: '紧急',
};

const alertTypeLabels: Record<string, string> = {
  fall: '跌倒',
  heart_rate: '心率异常',
  breath_rate: '呼吸异常',
  inactivity: '久未活动',
  offline: '设备离线',
  manual_sos: '手动求救',
  smoke_alarm: '烟雾报警',
  gas_leak: '煤气泄漏',
  door_open_long: '门未关',
};

const alertTypeColors: Record<string, string> = {
  fall: 'red',
  heart_rate: 'orange',
  breath_rate: 'gold',
  inactivity: 'blue',
  offline: 'default',
  manual_sos: 'magenta',
  smoke_alarm: 'volcano',
  gas_leak: '#f5222d',
  door_open_long: 'cyan',
};

const statusOptions = [
  { label: '全部状态', value: undefined },
  { label: '未处理', value: 0 },
  { label: '处理中', value: 1 },
  { label: '已处理', value: 2 },
];

const levelOptions = [
  { label: '全部等级', value: undefined },
  { label: '紧急', value: 'emergency' },
  { label: '重要', value: 'critical' },
  { label: '一般', value: 'warning' },
  { label: '提示', value: 'info' },
];

const AlertCenter: React.FC = () => {
  const { message: appMessage } = App.useApp();
  const { user } = useAuth();
  const [list, setList] = useState<AlertRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [levelFilter, setLevelFilter] = useState<string | undefined>(undefined);
  const [statusFilter, setStatusFilter] = useState<number | undefined>(undefined);
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs] | null>(null);

  // 处理弹窗
  const [handleModalOpen, setHandleModalOpen] = useState(false);
  const [handlingId, setHandlingId] = useState<number | null>(null);
  const [remark, setRemark] = useState('');
  const [handling, setHandling] = useState(false);

  const fetchList = useCallback(async () => {
    setLoading(true);
    try {
      const params: {
        page: number;
        pageSize: number;
        alertLevel?: string;
        handledStatus?: number;
        start?: string;
        end?: string;
      } = {
        page,
        pageSize,
      };
      if (levelFilter !== undefined) params.alertLevel = levelFilter;
      if (statusFilter !== undefined) params.handledStatus = statusFilter;
      if (dateRange) {
        params.start = dateRange[0].format('YYYY-MM-DD HH:mm:ss');
        params.end = dateRange[1].format('YYYY-MM-DD HH:mm:ss');
      }
      const res = await getAlertList(params);
      setList(res.data.list);
      setTotal(res.data.total);
    } catch {
      // 错误已处理
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, levelFilter, statusFilter, dateRange]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  const handleOpenHandleModal = (record: AlertRecord) => {
    setHandlingId(record.id);
    setRemark('');
    setHandleModalOpen(true);
  };

  const handleSubmitHandle = async () => {
    if (!handlingId) return;
    setHandling(true);
    try {
      await handleAlertApi(handlingId, {
        handledStatus: 2,
        handledBy: user?.displayName || '管理员',
        handleRemark: remark,
      });
      appMessage.success('处理成功');
      setHandleModalOpen(false);
      fetchList();
    } catch {
      // 错误已处理
    } finally {
      setHandling(false);
    }
  };

  const columns: ColumnsType<AlertRecord> = [
    {
      title: '时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 170,
      sorter: (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      defaultSortOrder: 'descend',
      render: (val: string) => dayjs(val).format('YYYY-MM-DD HH:mm:ss'),
    },
    {
      title: '老人',
      dataIndex: 'elderName',
      key: 'elderName',
      width: 90,
    },
    {
      title: '房间',
      dataIndex: 'roomNo',
      key: 'roomNo',
      width: 80,
    },
    {
      title: '告警类型',
      dataIndex: 'alertType',
      key: 'alertType',
      width: 100,
      render: (val: string) => (
        <Tag color={alertTypeColors[val] || 'default'}>
          {alertTypeLabels[val] || val}
        </Tag>
      ),
    },
    {
      title: '告警等级',
      dataIndex: 'alertLevel',
      key: 'alertLevel',
      width: 80,
      align: 'center',
      sorter: (a, b) => a.alertLevel.localeCompare(b.alertLevel),
      render: (val: string) => (
        <Tag color={alertLevelColors[val] || 'default'}>{alertLevelLabels[val] || val}</Tag>
      ),
    },
    {
      title: '触发值',
      dataIndex: 'triggerValue',
      key: 'triggerValue',
      width: 100,
      render: (val: string) => (val ? <Text code>{val}</Text> : '-'),
    },
    {
      title: '告警信息',
      dataIndex: 'alertMessage',
      key: 'alertMessage',
      width: 180,
      ellipsis: true,
    },
    {
      title: '处理状态',
      dataIndex: 'handledStatus',
      key: 'handledStatus',
      width: 90,
      align: 'center',
      render: (val: number) => {
        const statusMap: Record<number, { color: string; text: string }> = {
          0: { color: 'error', text: '未处理' },
          1: { color: 'processing', text: '处理中' },
          2: { color: 'success', text: '已处理' },
        };
        const status = statusMap[val];
        return <Tag color={status?.color}>{status?.text}</Tag>;
      },
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      align: 'center',
      fixed: 'right',
      render: (_: unknown, record: AlertRecord) =>
        record.handledStatus !== 2 ? (
          <Button
            type="primary"
            size="small"
            icon={<ExclamationCircleFilled />}
            onClick={() => handleOpenHandleModal(record)}
          >
            处理
          </Button>
        ) : (
          <Text type="secondary">{record.handledBy || '-'}</Text>
        ),
    },
  ];

  return (
    <div className="page-container">
      <div className="page-header">
        <h2 className="page-title">告警中心</h2>
      </div>

      {/* 筛选栏 */}
      <div className="section-card">
        <Space wrap size="middle">
          <FilterOutlined style={{ color: '#1890ff' }} />
          <Select
            value={levelFilter}
            onChange={(val) => {
              setLevelFilter(val);
              setPage(1);
            }}
            options={levelOptions}
            style={{ width: 120 }}
            placeholder="告警等级"
          />
          <Select
            value={statusFilter}
            onChange={(val) => {
              setStatusFilter(val);
              setPage(1);
            }}
            options={statusOptions}
            style={{ width: 120 }}
            placeholder="处理状态"
          />
          <RangePicker
            value={dateRange}
            onChange={(dates) => {
              setDateRange(dates as [Dayjs, Dayjs] | null);
              setPage(1);
            }}
            showTime
            placeholder={['开始时间', '结束时间']}
          />
          <Button
            onClick={() => {
              setLevelFilter(undefined);
              setStatusFilter(undefined);
              setDateRange(null);
              setPage(1);
            }}
          >
            重置
          </Button>
        </Space>
      </div>

      {/* 告警列表 */}
      <div className="section-card" style={{ padding: 0 }}>
        <Table
          columns={columns}
          dataSource={list}
          rowKey="id"
          loading={loading}
          scroll={{ x: 1000 }}
          pagination={{
            current: page,
            pageSize,
            total,
            showSizeChanger: true,
            showTotal: (t) => `共 ${t} 条告警`,
            onChange: (p, ps) => {
              setPage(p);
              setPageSize(ps);
            },
          }}
        />
      </div>

      {/* 处理弹窗 */}
      <Modal
        title="处理告警"
        open={handleModalOpen}
        onOk={handleSubmitHandle}
        onCancel={() => setHandleModalOpen(false)}
        confirmLoading={handling}
        okText="确认处理"
        cancelText="取消"
      >
        <div style={{ marginTop: 8 }}>
          <Text type="secondary">请填写处理备注：</Text>
          <TextArea
            value={remark}
            onChange={(e) => setRemark(e.target.value)}
            rows={4}
            placeholder="请输入处理备注信息..."
            style={{ marginTop: 8 }}
          />
        </div>
      </Modal>
    </div>
  );
};

export default AlertCenter;
