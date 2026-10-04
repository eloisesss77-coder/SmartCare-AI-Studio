import React, { useState, useEffect, useCallback } from 'react';
import {
  Table,
  Button,
  Input,
  Space,
  Tag,
  Modal,
  Form,
  App,
  Empty,
  Spin,
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
import { get{Name}List, create{Name}, update{Name}, delete{Name} } from '@/services/api';
import type { {Name}Record } from '@/types';
import { useAuth } from '@/contexts/AuthContext';

const { TextArea } = Input;

/**
 * {模块中文名}管理页面
 *
 * @description 提供{模块}的列表展示、新增、编辑、删除功能
 * 包含 loading / error / empty 三态处理
 *
 * @example 在 App.tsx 路由中注册：
 *   <Route path="/{path}" element={<ProtectedRoute><{Name}Page /></ProtectedRoute>} />
 */
const {Name}Page: React.FC = () => {
  const navigate = useNavigate();
  const { message: appMessage } = App.useApp();
  const { isAdmin } = useAuth();

  // ---- 列表状态 ----
  const [list, setList] = useState<{Name}Record[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [keyword, setKeyword] = useState('');
  const [searchTrigger, setSearchTrigger] = useState(0);

  // ---- 弹窗状态 ----
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();

  // ============================================================
  // 数据获取
  // ============================================================

  /** 拉取列表数据 */
  const fetchList = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await get{Name}List({ page, pageSize, keyword });
      setList(res.data.list);
      setTotal(res.data.total);
    } catch (err: any) {
      setError(err?.message || '加载失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, keyword]);

  useEffect(() => {
    fetchList();
  }, [fetchList, searchTrigger]);

  // ============================================================
  // 事件处理
  // ============================================================

  /** 打开新增弹窗 */
  const handleAdd = () => {
    setEditingId(null);
    form.resetFields();
    setModalOpen(true);
  };

  /** 打开编辑弹窗 */
  const handleEdit = (record: {Name}Record) => {
    setEditingId(record.id);
    form.setFieldsValue(record);
    setModalOpen(true);
  };

  /** 提交表单 */
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);
      if (editingId) {
        await update{Name}(editingId, values);
        appMessage.success('更新成功');
      } else {
        await create{Name}(values);
        appMessage.success('创建成功');
      }
      setModalOpen(false);
      setSearchTrigger((v) => v + 1);
    } catch (err: any) {
      // 表单校验失败不提示
      if (err?.errorFields) return;
    } finally {
      setSubmitting(false);
    }
  };

  /** 删除记录 */
  const handleDelete = async (id: number) => {
    await delete{Name}(id);
    appMessage.success('删除成功');
    setSearchTrigger((v) => v + 1);
  };

  // ============================================================
  // 表格列定义
  // ============================================================
  const columns: ColumnsType<{Name}Record> = [
    {
      title: 'ID',
      dataIndex: 'id',
      width: 80,
    },
    {
      title: '名称',
      dataIndex: 'name',
      width: 150,
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      render: (status: number) => (
        <Tag color={status === 1 ? 'green' : 'red'}>
          {status === 1 ? '启用' : '禁用'}
        </Tag>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      width: 180,
    },
    {
      title: '操作',
      key: 'actions',
      width: 200,
      render: (_: any, record: {Name}Record) => (
        <Space>
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => navigate(`/{path}/${record.id}`)}
          >
            查看
          </Button>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确认删除？"
            onConfirm={() => handleDelete(record.id)}
          >
            <Button type="link" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // ============================================================
  // 渲染态：Error
  // ============================================================
  if (error && list.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: 80 }}>
        <Empty description={error}>
          <Button type="primary" onClick={() => setSearchTrigger((v) => v + 1)}>
            重试
          </Button>
        </Empty>
      </div>
    );
  }

  // ============================================================
  // 渲染态：Table（包含 Loading 和 Empty）
  // ============================================================
  return (
    <div>
      {/* 搜索栏 */}
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
        <Space>
          <Input
            placeholder="搜索关键词"
            prefix={<SearchOutlined />}
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onPressEnter={() => setSearchTrigger((v) => v + 1)}
            style={{ width: 240 }}
            allowClear
          />
          <Button type="primary" onClick={() => setSearchTrigger((v) => v + 1)}>
            搜索
          </Button>
        </Space>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          新增
        </Button>
      </div>

      {/* 表格 */}
      <Spin spinning={loading}>
        <Table
          columns={columns}
          dataSource={list}
          rowKey="id"
          pagination={{
            current: page,
            pageSize,
            total,
            showSizeChanger: true,
            showTotal: (t) => `共 ${t} 条`,
            onChange: (p, ps) => {
              setPage(p);
              setPageSize(ps);
            },
          }}
          locale={{
            emptyText: <Empty description="暂无数据" />,
          }}
        />
      </Spin>

      {/* 新增/编辑弹窗 */}
      <Modal
        title={editingId ? '编辑' : '新增'}
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => setModalOpen(false)}
        confirmLoading={submitting}
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label="名称"
            rules={[{ required: true, message: '请输入名称' }]}
          >
            <Input placeholder="请输入名称" maxLength={50} />
          </Form.Item>
          <Form.Item name="remark" label="备注">
            <TextArea rows={3} placeholder="选填" maxLength={500} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default {Name}Page;
