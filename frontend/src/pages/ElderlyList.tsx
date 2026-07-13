import React, { useState, useEffect, useCallback } from 'react';
import {
  Table,
  Button,
  Input,
  Select,
  Space,
  Tag,
  Modal,
  Form,
  InputNumber,
  App,
  Popconfirm,
} from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { useNavigate } from 'react-router-dom';
import { getElderlyList, createElderly, updateElderly, deleteElderly } from '@/services/api';
import type { Elderly } from '@/types';
import { useAuth } from '@/contexts/AuthContext';

const { TextArea } = Input;

const ElderlyList: React.FC = () => {
  const navigate = useNavigate();
  const { message: appMessage } = App.useApp();
  const { isAdmin } = useAuth();
  const [list, setList] = useState<Elderly[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState<number | undefined>(undefined);

  // 弹窗相关
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  const fetchList = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getElderlyList({ page, pageSize, keyword });
      setList(res.data.list);
      setTotal(res.data.total);
    } catch {
      // 错误已处理
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, keyword]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  const handleSearch = () => {
    setPage(1);
    fetchList();
  };

  const handleAdd = () => {
    setEditingId(null);
    form.resetFields();
    setModalOpen(true);
  };

  const handleEdit = (record: Elderly) => {
    setEditingId(record.id);
    form.setFieldsValue({
      name: record.name,
      age: record.age,
      gender: record.gender,
      roomNo: record.roomNo,
      medicalHistory: record.medicalHistory,
      emergencyContact: record.emergencyContact,
      emergencyPhone: record.emergencyPhone,
    });
    setModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteElderly(id);
      appMessage.success('删除成功');
      fetchList();
    } catch {
      // 错误已处理
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);
      if (editingId) {
        await updateElderly(editingId, values);
        appMessage.success('更新成功');
      } else {
        await createElderly(values);
        appMessage.success('创建成功');
      }
      setModalOpen(false);
      fetchList();
    } catch (err) {
      if (err && typeof err === 'object' && 'errorFields' in err) return;
    } finally {
      setSubmitting(false);
    }
  };

  const columns: ColumnsType<Elderly> = [
    {
      title: '姓名',
      dataIndex: 'name',
      key: 'name',
      width: 100,
      render: (text: string, record: Elderly) => (
        <a onClick={() => navigate(`/elderly/${record.id}`)}>{text}</a>
      ),
    },
    {
      title: '年龄',
      dataIndex: 'age',
      key: 'age',
      width: 60,
      align: 'center',
    },
    {
      title: '性别',
      dataIndex: 'gender',
      key: 'gender',
      width: 60,
      align: 'center',
      render: (val: number) => {
        const map: Record<number, { color: string; text: string }> = {
          0: { color: 'default', text: '未知' },
          1: { color: 'blue', text: '男' },
          2: { color: 'pink', text: '女' },
        };
        return <Tag color={map[val]?.color}>{map[val]?.text}</Tag>;
      },
    },
    {
      title: '房间号',
      dataIndex: 'roomNo',
      key: 'roomNo',
      width: 90,
    },
    {
      title: '绑定雷达',
      dataIndex: 'radarDeviceSn',
      key: 'radarDeviceSn',
      width: 160,
      ellipsis: true,
      render: (val: string) =>
        val ? <Tag color="blue">{val}</Tag> : <Tag color="default">未绑定</Tag>,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 70,
      align: 'center',
      render: (val: number) =>
        val === 1 ? <Tag color="success">正常</Tag> : <Tag color="error">异常</Tag>,
    },
    {
      title: '操作',
      key: 'action',
      width: 180,
      align: 'center',
      render: (_: unknown, record: Elderly) => (
        <Space>
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => navigate(`/elderly/${record.id}`)}
          >
            查看
          </Button>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          {isAdmin && (
            <Popconfirm
              title="确认删除"
              description="确定要删除该老人信息吗？"
              onConfirm={() => handleDelete(record.id)}
              okText="确认"
              cancelText="取消"
            >
              <Button type="link" size="small" danger icon={<DeleteOutlined />}>
                删除
              </Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  const filteredList = statusFilter !== undefined
    ? list.filter((item) => item.status === statusFilter)
    : list;

  return (
    <div className="page-container">
      <div className="page-header">
        <h2 className="page-title">老人管理</h2>
      </div>

      {/* 工具栏 */}
      <div className="toolbar">
        <Space wrap>
          <Input
            placeholder="搜索姓名/房间号"
            prefix={<SearchOutlined />}
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onPressEnter={handleSearch}
            style={{ width: 220 }}
            allowClear
          />
          <Button type="primary" onClick={handleSearch}>
            搜索
          </Button>
          <Select
            placeholder="状态筛选"
            value={statusFilter}
            onChange={(val) => setStatusFilter(val)}
            allowClear
            style={{ width: 120 }}
            options={[
              { label: '全部', value: undefined },
              { label: '正常', value: 1 },
              { label: '异常', value: 0 },
            ]}
          />
        </Space>
        {isAdmin && (
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            新建老人
          </Button>
        )}
      </div>

      {/* 列表 */}
      <div className="section-card" style={{ padding: 0 }}>
        <Table
          columns={columns}
          dataSource={filteredList}
          rowKey="id"
          loading={loading}
          pagination={{
            current: page,
            pageSize,
            total: statusFilter !== undefined ? filteredList.length : total,
            showSizeChanger: true,
            showTotal: (t) => `共 ${t} 条`,
            onChange: (p, ps) => {
              setPage(p);
              setPageSize(ps);
            },
          }}
        />
      </div>

      {/* 新建/编辑弹窗 */}
      <Modal
        title={editingId ? '编辑老人信息' : '新建老人'}
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => setModalOpen(false)}
        confirmLoading={submitting}
        width={560}
        destroyOnClose
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item
            name="name"
            label="姓名"
            rules={[{ required: true, message: '请输入姓名' }]}
          >
            <Input placeholder="请输入姓名" maxLength={20} />
          </Form.Item>
          <Space style={{ display: 'flex' }} align="start">
            <Form.Item
              name="age"
              label="年龄"
              rules={[{ required: true, message: '请输入年龄' }]}
            >
              <InputNumber placeholder="年龄" min={0} max={150} style={{ width: 140 }} />
            </Form.Item>
            <Form.Item
              name="gender"
              label="性别"
              rules={[{ required: true, message: '请选择性别' }]}
              style={{ width: 140 }}
            >
              <Select
                placeholder="请选择"
                options={[
                  { label: '男', value: 1 },
                  { label: '女', value: 2 },
                  { label: '未知', value: 0 },
                ]}
              />
            </Form.Item>
            <Form.Item
              name="roomNo"
              label="房间号"
              rules={[{ required: true, message: '请输入房间号' }]}
              style={{ flex: 1 }}
            >
              <Input placeholder="如：A101" />
            </Form.Item>
          </Space>
          <Form.Item name="medicalHistory" label="病史">
            <TextArea rows={3} placeholder="请输入病史信息" />
          </Form.Item>
          <Space style={{ display: 'flex' }} align="start">
            <Form.Item name="emergencyContact" label="紧急联系人" style={{ flex: 1 }}>
              <Input placeholder="紧急联系人姓名" />
            </Form.Item>
            <Form.Item name="emergencyPhone" label="紧急电话" style={{ flex: 1 }}>
              <Input placeholder="紧急联系电话" />
            </Form.Item>
          </Space>
        </Form>
      </Modal>
    </div>
  );
};

export default ElderlyList;
