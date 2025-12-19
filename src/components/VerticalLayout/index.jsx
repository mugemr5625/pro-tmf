import {
  BankOutlined,
  DollarOutlined,
  EnvironmentOutlined,
  FileOutlined,
  HomeOutlined,
  LineChartOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  SettingOutlined,
  UserOutlined,
  LockOutlined,
} from '@ant-design/icons';
import { Button, Drawer, Layout, Menu, theme, Tag } from 'antd';
import { useEffect, useState, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import NotificationDropdown from "../CommonForBoth/TopbarDropdown/NotificationDropdown";
import ProfileMenu from "../CommonForBoth/TopbarDropdown/ProfileMenu";

import logoLarge from "../../assets/images/logo-large-tmf.png";
import logoLight from "../../assets/images/logolighttmf.png";
import lineIcon from "../../assets/icons/grow-up.png"
import organizationIcon from "../../assets/icons/government.png"
import branchIcon from "../../assets/icons/bank.png"
import areaIcon from "../../assets/icons/map.png"
import customerIcon from "../../assets/icons/user.png"
import investmentIcon from "../../assets/icons/profits (1).png"
import expenseTransactionIcon from "../../assets/icons/money-currency.png"
import expenseTypeIcon from "../../assets/icons/clipboard-list.png"
import userIcon from "../../assets/icons/user (2).png"
import resetIcon from "../../assets/icons/password (1).png"
import loanIcon from "../../assets/icons/loan-approved.png"
import "./VerticalLayout.css";

const { Header, Sider, Content, Footer } = Layout;

const VerticalLayout = (props) => {
  // Initialize collapsed state from sessionStorage, default to false (expanded) for desktop
  const [collapsed, setCollapsed] = useState(() => {
    const saved = sessionStorage.getItem('sidebarCollapsed');
    return saved !== null ? JSON.parse(saved) : false;
  });
  const [selectedKeys, setSelectedKeys] = useState([]);
  const [openKeys, setOpenKeys] = useState([]);
  const [mobileDrawerVisible, setMobileDrawerVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [branchName, setBranchName] = useState("");
  
  const location = useLocation();
  const navigate = useNavigate();
  
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  // Load branch name from localStorage
  useEffect(() => {
    console.log('=== VerticalLayout Component Mounted ===');
    
    // Get branch name from localStorage on component mount
    const selectedBranch = localStorage.getItem('selected_branch_name');
    console.log('localStorage value for selected_branch_name:', selectedBranch);
    
    if (selectedBranch) {
      setBranchName(selectedBranch);
      console.log('✅ Branch name set to:', selectedBranch);
    } else {
      console.log('❌ No branch name found in localStorage');
    }

    // Listen for custom events (when branch is changed in same tab)
    const handleBranchChange = (e) => {
      console.log('🔔 branchChanged event received:', e.detail);
      if (e.detail && e.detail.branchName) {
        setBranchName(e.detail.branchName);
        console.log('✅ Branch updated via event to:', e.detail.branchName);
      }
    };

    // Listen for storage changes (when branch is changed in another tab)
    const handleStorageChange = (e) => {
      console.log('💾 Storage change detected:', e.key, e.newValue);
      if (e.key === 'selected_branch_name' && e.newValue) {
        setBranchName(e.newValue);
        console.log('✅ Branch updated via storage to:', e.newValue);
      }
    };

    window.addEventListener('branchChanged', handleBranchChange);
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('branchChanged', handleBranchChange);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const menuItems = useMemo(() => [
    { key: '/home', icon: <HomeOutlined />, label: 'Home' },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: 'Settings',
      children: [
        { key: '/view', 
          icon: <img src={organizationIcon} width={18} height={18}  
          style={{ filter: 'invert(1)'}}/>, 
          label: 'Organization' },
        { key: '/branch/list', icon: <img src={branchIcon} width={18} height={18} 
         style={{filter: 'invert(1)',}} />, label: 'Branch' },
        { key: '/line', icon: <img src={lineIcon} width={18} height={18} 
         style={{filter: 'invert(1)',}} />,
          label: 'Line' },
        { key: '/area', icon: <img src={areaIcon} width={18} height={18} 
         style={{filter: 'invert(1)',}} />, label: 'Area' },
        { key: '/expense/list', icon:<img src={expenseTypeIcon} width={18} height={18} 
         style={{filter: 'invert(1)',}} />, label: 'Expense Type' },
        { key: '/investment',icon: <img src={investmentIcon} width={20} height={20} 
         style={{filter: 'invert(1)',}} />, label: 'Investments' },
        { key: '/expense-transaction', icon: <img src={expenseTransactionIcon} width={18} height={18} 
         style={{filter: 'invert(1)',}} />,  label: 'Expense Transactions' },
        { key: '/user/list', icon: <img src={userIcon} width={18} height={18} 
         style={{filter: 'invert(1)',}} />, label: 'Users' },
        {key: '/location-list', icon: <UserOutlined />, label: 'Location' }
      ],
    },
    // {
    //   key: 'loan',
    //   icon: <DollarOutlined />,
    //   label: 'Loan',
    //   children: [
    //     { key: '/disburse-loan', icon: <DollarOutlined />, label: 'Loan Disbursement' },
    //   ],
    // },
    { key: '/reset-password', icon:<img src={resetIcon} width={18} height={18} 
         style={{filter: 'invert(1)',}} />, label: 'Reset Password' },
    { key: '/view-customer', icon: <img src={customerIcon} width={18} height={18} 
         style={{filter: 'invert(1)',}} />, label: 'Customer' },
  ], []);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleMenuClick = (e) => {
    if (e.key.startsWith('/')) {
      navigate(e.key);
      
      if (isMobile) {
        setMobileDrawerVisible(false);
      }
    }
  };

  const handleOpenChange = (keys) => {
    if (!collapsed) {
      setOpenKeys(keys);
    }
  };

  useEffect(() => {
    const currentPath = location.pathname;
    setSelectedKeys([currentPath]);
    
    if (!collapsed) {
      const findParentKey = () => {
        for (const item of menuItems) {
          if (item.children) {
            const found = item.children.find(child => child.key === currentPath);
            if (found) return item.key;
          }
        }
        return null;
      };
      
      const parentKey = findParentKey();
      if (parentKey) {
        setOpenKeys([parentKey]);
      }
    }
  }, [location.pathname, collapsed, menuItems]);

  useEffect(() => {
    if (collapsed) {
      setOpenKeys([]);
    }
  }, [collapsed]);

  useEffect(() => {
    const updateSidebarWidth = () => {
      const sider = document.querySelector('.ant-layout-sider');
      if (sider && !collapsed && !isMobile) {
        const siderWidth = sider.offsetWidth;
        document.documentElement.style.setProperty('--sidebar-width', `${siderWidth}px`);
      } else if (collapsed || isMobile) {
        document.documentElement.style.setProperty('--sidebar-width', '80px');
      }
    };

    const timer1 = setTimeout(updateSidebarWidth, 50);
    const timer2 = setTimeout(updateSidebarWidth, 200);
    const timer3 = setTimeout(updateSidebarWidth, 500);
    
    let resizeObserver;
    
    const setupObserver = () => {
      const sider = document.querySelector('.ant-layout-sider');
      if (sider && window.ResizeObserver) {
        resizeObserver = new ResizeObserver(() => {
          updateSidebarWidth();
        });
        resizeObserver.observe(sider);
      }
    };
    
    setTimeout(setupObserver, 100);
    
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
    };
  }, [collapsed, isMobile, menuItems]);

  const mobileDrawerContent = (
    <div style={{ padding: 0, height: "100%", display: "flex", flexDirection: "column" }}>
      <div style={{ 
        padding: "12px 16px", 
        borderBottom: "1px solid #f0f0f0", 
        marginBottom: "8px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexShrink: 0
      }}>
        <img src={logoLarge} alt="Logo" height="28" style={{ marginLeft: "4px" }} />
        <Button 
          type="text" 
          icon={<MenuFoldOutlined />} 
          onClick={() => setMobileDrawerVisible(false)}
          style={{ 
            fontSize: "16px",
            padding: "4px",
            minWidth: "32px",
            height: "32px"
          }}
        />
      </div>
      
      {/* Scrollable menu area with bottom padding */}
      <div style={{ 
        flex: 1, 
        overflowY: "auto", 
        overflowX: "hidden",
        paddingBottom: branchName ? "80px" : "16px" // Add padding when branch name exists
      }}>
        <div style={{ padding: "0 4px" }}>
          <Menu
            mode="inline"
            selectedKeys={selectedKeys}
            openKeys={openKeys}
            onOpenChange={handleOpenChange}
            onClick={handleMenuClick}
            items={menuItems}
            style={{ 
              border: "none",
              background: "transparent",
            }}
          />
        </div>
      </div>
      
      {/* Branch name in mobile drawer - fixed at bottom */}
      {branchName && (
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          padding: '12px 16px',
          background: '#f0f5ff',
          borderTop: '1px solid #d9d9d9',
          textAlign: 'center',
          zIndex: 10,
        }}>
          <div style={{ 
            fontSize: '10px', 
            color: '#666', 
            marginBottom: '4px',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            fontWeight: 600
          }}>
            Current Branch
          </div>
          <div style={{ 
            fontSize: '13px', 
            fontWeight: 600,
            color: '#1890ff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px'
          }}>
            <BankOutlined style={{ fontSize: '14px' }} />
            <span style={{
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              maxWidth: '180px'
            }}>
              {branchName}
            </span>
          </div>
        </div>
      )}
    </div>
  );

  // Debug log
  console.log('Render - branchName state:', branchName);

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider 
        trigger={null} 
        collapsible 
        collapsed={collapsed}
        width={250}
        collapsedWidth={80}
        style={{
          overflow: 'auto',
          height: '100vh',
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
          display: isMobile ? 'none' : 'block',
        }}
      >
        <div style={{ 
          height: '64px', 
          margin: '16px', 
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <img 
            src={collapsed ? logoLight : logoLarge} 
            alt="Logo" 
            style={{ 
              height: collapsed ? '32px' : '40px',
              transition: 'all 0.2s',
            }} 
          />
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={selectedKeys}
          openKeys={collapsed ? [] : openKeys}
          onOpenChange={collapsed ? () => {} : handleOpenChange}
          onClick={handleMenuClick}
          items={menuItems}
          style={{
            height: 'calc(100vh - 160px)',
            overflowY: 'auto',
            overflowX: 'hidden',
            border: 'none',
          }}
        />
        {/* Branch name section */}
        {branchName && (
          <div style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            padding: collapsed ? '8px 4px' : '12px 16px',
            background: 'rgba(255, 255, 255, 0.1)',
            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
            textAlign: 'center',
            transition: 'all 0.2s',
          }}>
            {!collapsed ? (
              <>
                <div style={{ 
                  fontSize: '10px', 
                  color: 'rgba(255, 255, 255, 0.65)', 
                  marginBottom: '4px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  Current Branch
                </div>
                <div style={{ 
                  fontSize: '13px', 
                  fontWeight: 500,
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}>
                  <BankOutlined style={{ fontSize: '12px' }} />
                  <span style={{ 
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>
                    {branchName}
                  </span>
                </div>
              </>
            ) : (
              <div style={{ 
                fontSize: '10px', 
                fontWeight: 500,
                color: '#fff',
                lineHeight: 1.2,
                wordBreak: 'break-word'
              }}>
                <BankOutlined style={{ fontSize: '14px', marginBottom: '2px' }} />
              </div>
            )}
          </div>
        )}
      </Sider>

      <Layout 
        className={`main-layout ${collapsed ? 'sidebar-collapsed' : 'sidebar-expanded'} ${isMobile ? 'mobile-view' : 'desktop-view'}`}
        style={{ 
          marginLeft: isMobile ? 0 : (collapsed ? 80 : 'var(--sidebar-width, 250px)'),
          transition: 'margin-left 0.3s ease',
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <Header
          className={`main-header ${collapsed ? 'sidebar-collapsed' : 'sidebar-expanded'} ${isMobile ? 'mobile-view' : 'desktop-view'}`}
          style={{
            padding: '0 16px',
            background: colorBgContainer,
            position: 'fixed',
            zIndex: 1000,
            width: isMobile ? '100%' : `calc(100% - ${collapsed ? '80px' : 'var(--sidebar-width, 250px)'})`,
            left: isMobile ? 0 : (collapsed ? '80px' : 'var(--sidebar-width, 250px)'),
            top: 0,
            display: 'flex',
            alignItems: 'center',
            transition: 'left 0.3s ease, width 0.3s ease',
            height: '64px',
          }}
        >
          <Button
            type="text"
            icon={isMobile ? <MenuUnfoldOutlined /> : (collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />)}
            onClick={() => {
              if (isMobile) {
                setMobileDrawerVisible(true);
              } else {
                const newCollapsed = !collapsed;
                setCollapsed(newCollapsed);
                sessionStorage.setItem('sidebarCollapsed', JSON.stringify(newCollapsed));
              }
            }}
            style={{
              fontSize: '16px',
              width: 64,
              height: 64,
              marginLeft: '-12px',
            }}
          />
          <div style={{ 
            flex: 1, 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
          
          }}>
            {/* Title and Branch Name Section */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              lineHeight: 1.2
            }}>
             
              {branchName && (
                <div style={{
                  
                  fontSize: '16px',
                  color: '#666',
                  fontWeight: 500,
                  display: 'flex',
                  alignItems: 'center',
                  marginLeft: '-15px'
                }}>
                  <span style={{
                    
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    maxWidth: isMobile ? '120px' : '200px'
                  }}>
                    {branchName}
                  </span>
                </div>
              )}
            </div>

            {/* Right side icons */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0px',
              marginRight: '-10px'
            }}>
              <NotificationDropdown />
              <ProfileMenu />
            </div>
          </div>
        </Header>

        <Content
          style={{
            margin: '64px 0 0',
            overflow: 'initial',
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div
            style={{
              flex: 1,
              background: colorBgContainer,
              borderRadius: borderRadiusLG,
              padding: '16px',
            }}
          >
            {props.children}
          </div>
        </Content>

        <Footer style={{ 
          textAlign: 'center', 
          padding: '24px 16px',
          marginTop: 'auto',
          flexShrink: 0
        }}>
          © {new Date().getFullYear()} - THINKTANK
        </Footer>
      </Layout>
      
      <Drawer
        title=""
        placement="left"
        onClose={() => setMobileDrawerVisible(false)}
        open={mobileDrawerVisible}
        width={260}
        bodyStyle={{ padding: 0 }}
        headerStyle={{ display: "none" }}
        style={{ display: isMobile ? 'block' : 'none' }}
      >
        {mobileDrawerContent}
      </Drawer>
    </Layout>
  );
};

export default VerticalLayout;