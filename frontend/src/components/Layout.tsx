import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { Layout as AntLayout, Menu, Typography, Dropdown, Tag, App, Modal, Input, Form } from 'antd';
import type { MenuProps } from 'antd';
import {
  DashboardOutlined,
  TeamOutlined,
  AlertOutlined,
  UserOutlined,
  ApiOutlined,
  LinkOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { useAuth } from '@/contexts/AuthContext';
import { changePassword } from '@/services/api';

const { Header, Sider, Content } = AntLayout;
const { Text } = Typography;

const AppLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [currentTime, setCurrentTime] = useState(dayjs().format('YYYY-MM-DD HH:mm:ss'));
  const { user, logout, isAdmin } = useAuth();
  const { message: appMessage } = App.useApp();

  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [passwordForm] = Form.useForm();
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(dayjs().format('YYYY-MM-DD HH:mm:ss'));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const selectedKey = location.pathname === '/' ? '/' : `/${location.pathname.split('/')[1]}`;

  const handleMenuClick = (info: { key: string }) => {
    navigate(info.key);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleChangePassword = async () => {
    try {
      const values = await passwordForm.validateFields();
      setChangingPassword(true);
      await changePassword(values);
      appMessage.success('密码修改成功');
      setPasswordModalOpen(false);
      passwordForm.resetFields();
    } catch (err) {
      if (err && typeof err === 'object' && 'errorFields' in err) return;
    } finally {
      setChangingPassword(false);
    }
  };

  const menuItems: MenuProps['items'] = [
    {
      key: '/',
      icon: <DashboardOutlined />,
      label: '监控大屏',
    },
    {
      key: '/elderly',
      icon: <TeamOutlined />,
      label: '老人管理',
    },
    {
      key: '/devices',
      icon: <ApiOutlined />,
      label: '设备管理',
    },
    {
      key: '/alerts',
      icon: <AlertOutlined />,
      label: '告警中心',
    },
    {
      key: '/bind',
      icon: <LinkOutlined />,
      label: '家属绑定',
    },
    ...(isAdmin
      ? [
          {
            key: '/users',
            icon: <UserOutlined />,
            label: '用户管理',
          },
        ]
      : []),
  ];

  const dropdownItems: MenuProps['items'] = [
    {
      key: 'change-password',
      label: '修改密码',
      onClick: () => setPasswordModalOpen(true),
    },
    { type: 'divider' },
    {
      key: 'logout',
      label: '退出登录',
      danger: true,
      onClick: handleLogout,
    },
  ];

  const roleLabelMap: Record<string, string> = {
    admin: '管理员',
    super_admin: '超级管理员',
    operator: '操作员',
    viewer: '观察员',
  };

  return (
    <AntLayout style={{ minHeight: '100vh' }}>
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        width={220}
        style={{
          background: '#001529',
          overflow: 'auto',
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
          zIndex: 100,
        }}
      >
        <div
          style={{
            height: 64,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderBottom: '1px solid rgba(255,255,255,0.1)',
          }}
        >
          {collapsed ? (
            <DashboardOutlined style={{ fontSize: 24, color: '#1890ff' }} />
          ) : (
            <Text
              strong
              style={{
                color: '#fff',
                fontSize: 16,
                letterSpacing: 2,
              }}
            >
              SmartCare 智慧养老
            </Text>
          )}
        </div>

        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[selectedKey]}
          items={menuItems}
          onClick={handleMenuClick}
          style={{ marginTop: 8 }}
        />

        <div
          style={{
            position: 'absolute',
            bottom: 24,
            left: 0,
            right: 0,
            textAlign: 'center',
            color: 'rgba(255,255,255,0.45)',
            fontSize: 12,
          }}
        >
          {!collapsed && <div>{currentTime}</div>}
        </div>
      </Sider>

      <AntLayout style={{ marginLeft: collapsed ? 80 : 220, transition: 'margin-left 0.2s' }}>
        <Header
          style={{
            background: '#fff',
            padding: '0 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
            position: 'sticky',
            top: 0,
            zIndex: 50,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Tag color="blue">{roleLabelMap[user?.role || ''] || user?.role || '未知角色'}</Tag>
            <Dropdown menu={{ items: dropdownItems }} placement="bottomRight">
              <Text style={{ cursor: 'pointer', userSelect: 'none' }}>
                <UserOutlined style={{ marginRight: 6, color: '#1890ff' }} />
                {user?.displayName || '用户'} ▼
              </Text>
            </Dropdown>
          </div>
        </Header>

        <Content style={{ margin: 16, minHeight: 280 }}>
          <Outlet />
        </Content>
      </AntLayout>

      <Modal
        title="修改密码"
        open={passwordModalOpen}
        onOk={handleChangePassword}
        onCancel={() => {
          setPasswordModalOpen(false);
          passwordForm.resetFields();
        }}
        confirmLoading={changingPassword}
        okText="确认修改"
        cancelText="取消"
        destroyOnClose
      >
        <Form form={passwordForm} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item
            name="oldPassword"
            label="原密码"
            rules={[{ required: true, message: '请输入原密码' }]}
          >
            <Input.Password placeholder="请输入原密码" />
          </Form.Item>
          <Form.Item
            name="newPassword"
            label="新密码"
            rules={[
              { required: true, message: '请输入新密码' },
              { min: 6, message: '密码至少6位' },
            ]}
          >
            <Input.Password placeholder="请输入新密码" />
          </Form.Item>
        </Form>
      </Modal>
    </AntLayout>
  );
};

export default AppLayout;
