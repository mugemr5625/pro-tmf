import { Input, Space } from "antd";
import { EyeInvisibleOutlined, EyeTwoTone } from "@ant-design/icons";
import { useState } from "react";

const InputWithAddon = ({ icon, placeholder, value, size = "large", type, onChange, ...rest }) => {
  const [passwordVisible, setPasswordVisible] = useState(false);

  if (type === "password") {
    return (
      <Space.Compact style={{ width: "100%" }}>
        <Input
          size={size}
          type={passwordVisible ? "text" : "password"}
          value={value}
          onChange={onChange}
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
          addonAfter={
            <span
              onClick={() => setPasswordVisible(!passwordVisible)}
              style={{
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
              }}
            >
              {passwordVisible ? <EyeTwoTone /> : <EyeInvisibleOutlined />}
            </span>
          }
          placeholder={placeholder}
          {...rest}
        />
      </Space.Compact>
    );
  }

  return (
    <Space.Compact style={{ width: "100%" }}>
      <Input
        size={size}
        value={value}
        onChange={onChange}
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