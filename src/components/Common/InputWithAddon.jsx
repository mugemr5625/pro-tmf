import { Input, Space } from "antd";


const InputWithAddon = ({ icon, placeholder, size = "large", ...rest }) => {
  return (
    <Space.Compact style={{ width: "100%" }}>
      <Input
        size={size}
        addonBefore={
          <span
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            {icon}
           
          </span>
        }
        placeholder={placeholder}
        {...rest}
      />
    </Space.Compact>
  );
};

export default InputWithAddon;
