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
  App,
  Popconfirm,
} from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  EditOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { getUserList, createUser, updateUser, updateUserStatus } from '@/services/api';
import type { UserRecord } from '@/types';

const roleOptions = [
  { label: '管理员', value: 'admin' },
  { label: '操作员', value: 'operator' },
  { label: '观察员', value: 'viewer' },
];

const roleTagColors: Record<string, string> = {
  admin: 'red',
  super_admin: 'red',
  operator: 'blue',
  viewer: 'green',
};

const UserManagement: React.FC = () => {
  const { message: appMessage } = App.useApp();
  const [list, setList] = useState<UserRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [keyword, setKeyword] = useState('');
  const [roleFilter, setRoleFilter] = useState<string | undefined>(undefined);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  const fetchList = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getUserList({ page, pageSize, keyword });
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

  const handleEdit = (record: UserRecord) => {
    setEditingId(record.id);
    form.setFieldsValue({
      username: record.username,
      displayName: record.displayName,
      role: record.role,
      phone: record.phone,
    });
    setModalOpen(true);
  };

  const handleToggleStatus = async (record: UserRecord) => {
    const newStatus = record.status === 1 ? 0 : 1;
    try {
      await updateUserStatus(record.id, newStatus);
      appMessage.success(record.status === 1 ? '已禁用' : '已启用');
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
        await updateUser(editingId, values);
        appMessage.success('更新成功');
      } else {
        await createUser(values);
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

  const columns: ColumnsType<UserRecord> = [
    {
      title: '用户名',
      dataIndex: 'username',
      key: 'username',
      width: 120,
    },
    {
      title: '姓名',
      dataIndex: 'displayName',
      key: 'displayName',
      width: 100,
    },
    {
      title: '角色',
      dataIndex: 'role',
      key: 'role',
      width: 90,
      render: (val: string) => (
        <Tag color={roleTagColors[val] || 'default'}>{val}</Tag>
      ),
    },
    {
      title: '电话',
      dataIndex: 'phone',
      key: 'phone',
      width: 140,
      render: (val: string) => val || '-',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 80,
      align: 'center',
      render: (val: number) =>
        val === 1 ? <Tag color="success">启用</Tag> : <Tag color="error">禁用</Tag>,
    },
    {
      title: '老人数量',
      dataIndex: 'elderlyIds',
      key: 'elderlyCount',
      width: 80,
      align: 'center',
      render: (val: number[]) => val?.length || 0,
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 170,
      render: (val: string) => val || '-',
    },
    {
      title: '操作',
      key: 'action',
      width: 180,
      align: 'center',
      render: (_: unknown, record: UserRecord) => (
        <Space>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title={record.status === 1 ? '确认禁用该用户？' : '确认启用该用户？'}
            onConfirm={() => handleToggleStatus(record)}
            okText="确认"
            cancelText="取消"
          >
            <Button
              type="link"
              size="small"
              danger={record.status === 1}
            >
              {record.status === 1 ? '禁用' : '启用'}
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const filteredList = roleFilter
    ? list.filter((item) => item.role === roleFilter)
    : list;

  return (
    <div className="page-container">
      <div className="page-header">
        <h2 className="page-title">用户管理</h2>
      </div>

      <div className="toolbar">
        <Space wrap>
          <Input
            placeholder="搜索用户名/姓名"
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
            placeholder="角色筛选"
            value={roleFilter}
            onChange={(val) => setRoleFilter(val)}
            allowClear
            style={{ width: 120 }}
            options={[
              { label: '全部角色', value: undefined },
              ...roleOptions,
            ]}
          />
        </Space>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          新建用户
        </Button>
      </div>

      <div className="section-card" style={{ padding: 0 }}>
        <Table
          columns={columns}
          dataSource={filteredList}
          rowKey="id"
          loading={loading}
          pagination={{
            current: page,
            pageSize,
            total: roleFilter ? filteredList.length : total,
            showSizeChanger: true,
            showTotal: (t) => `共 ${t} 条`,
            onChange: (p, ps) => {
              setPage(p);
              setPageSize(ps);
            },
          }}
        />
      </div>

      <Modal
        title={editingId ? '编辑用户' : '新建用户'}
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => setModalOpen(false)}
        confirmLoading={submitting}
        width={520}
        destroyOnClose
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item
            name="username"
            label="用户名"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input placeholder="请输入用户名" maxLength={20} disabled={!!editingId} />
          </Form.Item>
          <Form.Item
            name="displayName"
            label="姓名"
            rules={[{ required: true, message: '请输入姓名' }]}
          >
            <Input placeholder="请输入姓名" maxLength={20} />
          </Form.Item>
          {!editingId && (
            <Form.Item
              name="password"
              label="密码"
              rules={[{ required: true, message: '请输入密码' }, { min: 6, message: '密码至少6位' }]}
            >
              <Input.Password placeholder="请输入密码" />
            </Form.Item>
          )}
          <Form.Item
            name="role"
            label="角色"
            rules={[{ required: true, message: '请选择角色' }]}
          >
            <Select placeholder="请选择角色" options={roleOptions} />
          </Form.Item>
          <Form.Item name="phone" label="电话">
            <Input placeholder="请输入电话号码" maxLength={20} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default UserManagement;
