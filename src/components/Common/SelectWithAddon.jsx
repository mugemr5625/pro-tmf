// SelectWithAddon.jsx
import { Select } from "antd";

const SelectWithAddon = ({ icon, children, ...rest }) => {
  return (
    <div style={{ display: 'flex', border: '1px solid #d9d9d9', borderRadius: '6px',overflow: 'hidden' }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '38px',
        backgroundColor: '#fafafa',
        borderRight: '1px solid #d9d9d9'
      }}>
        {icon}
      </div>
      <Select
        bordered={false}
        listHeight={32 * 5}    
        style={{ flex: 1 }}
        {...rest}
      >
        {children}
      </Select>
    </div>
  );
};

export default SelectWithAddon;