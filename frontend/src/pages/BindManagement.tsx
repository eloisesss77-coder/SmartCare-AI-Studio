/**
 * 家属绑定管理页 — 为老人生成绑定码，供家属小程序扫码绑定
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  Table, Tag, Button, Modal, Form, Select, Input, Space, App, Typography, Descriptions,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { PlusOutlined, ReloadOutlined, CopyOutlined, QrcodeOutlined } from '@ant-design/icons';
import { generateBindCode, getElderlyList, getBindCodes } from '@/services/api';
import type { BindCodeResponse, Elderly } from '@/types';

const { Text, Title } = Typography;

const BindManagement: React.FC = () => {
  const { message: appMessage } = App.useApp();
  const [elderlyList, setElderlyList] = useState<Elderly[]>([]);
  const [generatedCodes, setGeneratedCodes] = useState<BindCodeResponse[]>([]);

  // 生成弹窗
  const [genModalOpen, setGenModalOpen] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [genForm] = Form.useForm();

  // 结果弹窗
  const [resultModalOpen, setResultModalOpen] = useState(false);
  const [currentResult, setCurrentResult] = useState<BindCodeResponse | null>(null);

  const fetchElderly = useCallback(async () => {
    try {
      const res = await getElderlyList({ page: 1, pageSize: 200 });
      setElderlyList(res.data.list || []);
    } catch { /* ignore */ }
  }, []);

  const fetchBindCodes = useCallback(async () => {
    try {
      const res = await getBindCodes();
      setGeneratedCodes(res.data || []);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    fetchElderly();
    fetchBindCodes();
  }, [fetchElderly, fetchBindCodes]);

  const handleOpenGenerate = () => {
    genForm.resetFields();
    setGenModalOpen(true);
  };

  const handleGenerate = async () => {
    try {
      const values = await genForm.validateFields();
      setGenerating(true);
      const res = await generateBindCode(values);
      setCurrentResult(res.data);
      setGeneratedCodes((prev) => [res.data, ...prev]);
      setGenModalOpen(false);
      setResultModalOpen(true);
      genForm.resetFields();
      appMessage.success('绑定码生成成功');
    } catch (err) {
      if (err && typeof err === 'object' && 'errorFields' in err) return;
    } finally {
      setGenerating(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(
      () => appMessage.success('已复制到剪贴板'),
      () => appMessage.error('复制失败，请手动复制'),
    );
  };

  const codeColumns: ColumnsType<BindCodeResponse> = [
    {
      title: '绑定码',
      dataIndex: 'bindCode',
      key: 'bindCode',
      width: 120,
      render: (val: string) => (
        <Text
          strong
          copyable
          style={{ fontSize: 18, fontFamily: 'monospace', letterSpacing: 4, color: '#1890ff' }}
        >
          {val}
        </Text>
      ),
    },
    {
      title: '老人',
      dataIndex: 'elderlyName',
      key: 'elderlyName',
      width: 90,
    },
    {
      title: '房间',
      dataIndex: 'roomNo',
      key: 'roomNo',
      width: 80,
    },
    {
      title: '关系',
      dataIndex: 'relation',
      key: 'relation',
      width: 80,
    },
    {
      title: '有效期至',
      dataIndex: 'expireAt',
      key: 'expireAt',
      width: 170,
      render: (val: string) => new Date(val).toLocaleString('zh-CN'),
    },
    {
      title: '操作',
      key: 'action',
      width: 80,
      render: (_: unknown, record: BindCodeResponse) => (
        <Button
          size="small"
          icon={<CopyOutlined />}
          onClick={() => copyToClipboard(record.bindCode)}
        >
          复制
        </Button>
      ),
    },
  ];

  return (
    <div className="page-container">
      <div className="page-header">
        <h2 className="page-title">家属绑定</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleOpenGenerate}>
          生成绑定码
        </Button>
      </div>

      {/* 操作说明 */}
      <div className="section-card" style={{ marginBottom: 16, background: '#e6f7ff', border: '1px solid #91d5ff' }}>
        <Title level={5} style={{ margin: 0, color: '#1890ff' }}>
          <QrcodeOutlined /> 家属绑定流程
        </Title>
        <div style={{ marginTop: 8, lineHeight: 2 }}>
          <Text>1. 点击「生成绑定码」→ 选择老人和关系 → 生成6位绑定码</Text><br />
          <Text>2. 将绑定码告知家属（电话/微信/打印二维码等任意方式）</Text><br />
          <Text>3. 家属在 <Text strong>安伴 Guardian 小程序</Text> 中登录后 → 输入绑定码 → 自动完成绑定</Text><br />
          <Text type="secondary">绑定码有效期24小时，过期需重新生成。</Text>
        </div>
      </div>

      {/* 已生成的绑定码 */}
      <div className="section-card" style={{ padding: 0 }}>
        <div className="section-title" style={{ padding: '12px 16px', margin: 0 }}>
          已生成绑定码
          <Button
            size="small"
            style={{ marginLeft: 8 }}
            icon={<ReloadOutlined />}
            onClick={fetchElderly}
          />
        </div>
        {generatedCodes.length === 0 ? (
          <div style={{ padding: '40px 0', textAlign: 'center' }}>
            <Text type="secondary">暂无绑定码，点击上方按钮生成</Text>
          </div>
        ) : (
          <Table
            columns={codeColumns}
            dataSource={generatedCodes}
            rowKey="id"
            size="small"
            pagination={{ pageSize: 10, showTotal: (t) => `共 ${t} 条` }}
          />
        )}
      </div>

      {/* 生成弹窗 */}
      <Modal
        title="生成家属绑定码"
        open={genModalOpen}
        onOk={handleGenerate}
        onCancel={() => setGenModalOpen(false)}
        confirmLoading={generating}
        okText="生成"
        cancelText="取消"
      >
        <Form form={genForm} layout="vertical" style={{ marginTop: 8 }}>
          <Form.Item name="elderlyId" label="选择老人"
            rules={[{ required: true, message: '请选择老人' }]}>
            <Select
              showSearch
              filterOption={(input, option) =>
                (option?.label as string)?.toLowerCase().includes(input.toLowerCase())
              }
              placeholder="搜索并选择老人"
              options={elderlyList.map((e) => ({ label: `${e.name} - ${e.roomNo}`, value: e.id }))}
            />
          </Form.Item>
          <Form.Item name="relation" label="家属关系" initialValue="子女">
            <Select
              options={[
                { label: '子女', value: '子女' },
                { label: '配偶', value: '配偶' },
                { label: '亲属', value: '亲属' },
                { label: '其他', value: '其他' },
              ]}
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* 结果弹窗 */}
      <Modal
        title="绑定码已生成"
        open={resultModalOpen}
        onCancel={() => setResultModalOpen(false)}
        footer={
          <Button type="primary" onClick={() => setResultModalOpen(false)}>
            关闭
          </Button>
        }
        width={400}
      >
        {currentResult && (
          <Descriptions column={1} size="small">
            <Descriptions.Item label="绑定码">
              <Text
                strong
                copyable
                style={{ fontSize: 24, fontFamily: 'monospace', letterSpacing: 6, color: '#1890ff' }}
              >
                {currentResult.bindCode}
              </Text>
            </Descriptions.Item>
            <Descriptions.Item label="老人">
              {currentResult.elderlyName}（{currentResult.roomNo}）
            </Descriptions.Item>
            <Descriptions.Item label="关系">{currentResult.relation}</Descriptions.Item>
            <Descriptions.Item label="有效期至">
              {new Date(currentResult.expireAt).toLocaleString('zh-CN')}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </div>
  );
};

export default BindManagement;
