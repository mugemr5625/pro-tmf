import { Button, Form, Input, Select, notification, Divider, Space } from "antd";
import Loader from "components/Common/Loader";
import PAYMENT_MODES_OPTIONS from "constants/payment_modes";
import { POST, PUT } from "helpers/api_helper";
import { getDetails, getList } from "helpers/getters";
import { ADD_BRANCH, INVESTMENT, LINE, USERS } from "helpers/url_helper";
import { ERROR_MESSAGES, SUCCESS_MESSAGES, NOTIFICATION_TITLES } from "helpers/errorMessages";
import { Fragment, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import { 
  UserOutlined, 
  BankOutlined, 
  ApartmentOutlined, 
  DollarOutlined,
  CreditCardOutlined,
  CalendarOutlined,
  WalletOutlined
} from '@ant-design/icons';
import InputWithAddon from "components/Common/InputWithAddon";
import SelectWithAddon from "components/Common/SelectWithAddon";
import "./AddInvestment.css";

const { Option } = Select;

const AddInvestment = () => {
  const [form] = Form.useForm();
  
  const navigate = useNavigate();
  const params = useParams();

  const [loading, setLoading] = useState(true);
  const [userList, setUserList] = useState(null);
  const [branchList, setBranchList] = useState(null);
  const [lineList, setLineList] = useState(null);
  const [investment, setInvestment] = useState(null);
  const [selectedBranchId, setSelectedBranchId] = useState(null);

  useEffect(() => {
    const storedBranchName = localStorage.getItem('selected_branch_name');
    if (storedBranchName && branchList) {
      const matchedBranch = branchList.find(
        branch => branch.branch_name === storedBranchName
      );
      if (matchedBranch) {
        setSelectedBranchId(matchedBranch.id);
      }
    }
  }, [branchList]);

  useEffect(() => {
    if (params.id)
      getDetails(INVESTMENT, params.id).then(res => setInvestment(res));
  }, [params.id, form]);

  useEffect(() => { getList(ADD_BRANCH).then(res => setBranchList(res)) }, []);

  useEffect(() => { getList(USERS).then(res => setUserList(res)) }, []);

  useEffect(() => { getList(LINE).then(res => setLineList(res)) }, []);

  useEffect(() => {
    if (
      userList != null &&
      branchList != null &&
      lineList != null &&
      (params.id == null || investment != null)
    ) {
      setLoading(false);
      
      if (investment) {
        form.setFieldsValue(investment);
      }
      
      if (!params.id && selectedBranchId) {
        form.setFieldsValue({ branch: selectedBranchId });
      }
    }
  }, [userList, branchList, lineList, params.id, investment, form, selectedBranchId]);

  const onFinish = async (values) => {
    setLoading(true);
    try {
      let response;
      if (params.id) {
        response = await PUT(`${INVESTMENT}${params.id}/`, values);
      } else {
        response = await POST(INVESTMENT, values);
      }
      if (response?.status === 200 || response?.status === 201) {
        notification.success({
          message: `${values.investment_title.toUpperCase()} ${NOTIFICATION_TITLES.INVESTMENT} ${
            params.id ? "updated" : "added"
          }!`,
          description: params.id 
            ? SUCCESS_MESSAGES.INVESTMENT.UPDATED 
            : SUCCESS_MESSAGES.INVESTMENT.CREATED,
        });
        navigate("/investment");
      } else {
        notification.error({
          message: params.id 
            ? ERROR_MESSAGES.INVESTMENT.UPDATE_FAILED 
            : ERROR_MESSAGES.INVESTMENT.ADD_FAILED,
        });
      }
    } catch (error) {
      console.log(error);
      notification.error({
        message: ERROR_MESSAGES.INVESTMENT.OPERATION_ERROR,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Fragment>
      {loading && <Loader />}

      <div className="add-investment-page-content">
        <div className="add-investment-container-fluid">
          <div className="row">
            <div className="col-md-12">
              <div className="add-investment-header">
                <h2 className="add-investment-title">
                  {params.id ? "Edit Investment" : "Add Investment"}
                </h2>
              </div>

              <Form
                form={form}
                layout="vertical"
                onFinish={onFinish}
                className="add-investment-form"
              >
                <div className="container add-investment-form-container">
                  
                  {/* Investment Title and User */}
                  <div className="row mb-2">
                    <div className="col-md-6">
                      <Form.Item
                        label="Investment Title"
                        name="investment_title"
                        rules={[
                          {
                            required: true,
                            message: ERROR_MESSAGES.INVESTMENT.TITLE_REQUIRED,
                          },
                          {
                            pattern: /^[A-Za-z][A-Za-z0-9-_ ]*$/,
                            message: ERROR_MESSAGES.INVESTMENT.TITLE_PATTERN,
                          },
                        ]}
                      >
                        <InputWithAddon 
                          icon={<DollarOutlined />}
                          placeholder="Enter Investment Title" 
                          size="large" 
                        />
                      </Form.Item>
                    </div>
                    <div className="col-md-6">
                      <Form.Item
                        label="Full Name | User Name"
                        name="user"
                        rules={[
                          { 
                            required: true, 
                            message: ERROR_MESSAGES.INVESTMENT.USER_REQUIRED 
                          },
                        ]}
                      >
                        <SelectWithAddon
                          icon={<UserOutlined />}
                          placeholder="Select User" 
                          allowClear
                          showSearch
                          size="large"
                        >
                          {userList?.map((user) => (
                            <Option key={user.id} value={user.id}>
                              {user.full_name && `${user.full_name} | `}{user.username}
                            </Option>
                          ))}
                        </SelectWithAddon>
                      </Form.Item>
                    </div>
                  </div>

                  {/* Branch and Line */}
                  <div className="row mb-2">
                    <div className="col-md-6">
                      <Form.Item
                        label="Branch Name"
                        name="branch"
                        rules={[
                          { 
                            required: true, 
                            message: ERROR_MESSAGES.INVESTMENT.BRANCH_REQUIRED 
                          },
                        ]}
                      >
                        <SelectWithAddon
                          icon={<BankOutlined />}
                          placeholder="Select Branch" 
                          disabled
                          showSearch
                          size="large"
                        >
                          {branchList?.map((branch) => (
                            <Option key={branch.id} value={branch.id}>
                              {branch.branch_name}
                            </Option>
                          ))}
                        </SelectWithAddon>
                      </Form.Item>
                    </div>
                    <div className="col-md-6">
                      <Form.Item
                        label="Line Name"
                        name="line"
                        rules={[
                          { 
                            required: true, 
                            message: ERROR_MESSAGES.INVESTMENT.LINE_REQUIRED 
                          },
                        ]}
                      >
                        <SelectWithAddon
                          icon={<ApartmentOutlined />}
                          placeholder="Select Line" 
                          allowClear
                          showSearch
                          size="large"
                        >
                          {lineList?.map((line) => {
                            const branchId = form.getFieldValue("branch") || selectedBranchId;
                            if (branchId === line?.branch) {
                              return (
                                <Option key={line.id} value={line.id}>
                                  {line.lineName}
                                </Option>
                              );
                            }
                            return null;
                          })}
                        </SelectWithAddon>
                      </Form.Item>
                    </div>
                  </div>

                  {/* Investment Amount and Payment Mode */}
                  <div className="row mb-2">
                    <div className="col-md-6">
                      <Form.Item
                        label="Investment Amount"
                        name="investment_amount"
                        rules={[
                          { 
                            required: true, 
                            message: ERROR_MESSAGES.INVESTMENT.AMOUNT_REQUIRED 
                          },
                          {
                            type: "number",
                            min: 1,
                            message: ERROR_MESSAGES.INVESTMENT.AMOUNT_MIN,
                            transform: (value) => Number(value),
                          },
                        ]}
                      >
                        <InputWithAddon
                          icon={<WalletOutlined />}
                          type="number"
                          placeholder="Enter Investment Amount"
                          size="large"
                        />
                      </Form.Item>
                    </div>
                    <div className="col-md-6">
                      <Form.Item
                        label="Payment Mode"
                        name="payment_mode"
                        rules={[
                          {
                            required: true,
                            message: ERROR_MESSAGES.INVESTMENT.PAYMENT_MODE_REQUIRED,
                          },
                        ]}
                      >
                        <SelectWithAddon
                          icon={<CreditCardOutlined />}
                          placeholder="Select Payment Mode" 
                          allowClear
                          size="large"
                        >
                          {PAYMENT_MODES_OPTIONS.map((mode) => (
                            <Option key={mode.value} value={mode.value}>
                              {mode.label}
                            </Option>
                          ))}
                        </SelectWithAddon>
                      </Form.Item>
                    </div>
                  </div>

                  {/* Date and Comment */}
                  <div className="row mb-2">
                    <div className="col-md-6">
                      <Form.Item
                        label="Date of Investment"
                        name="investment_date"
                        rules={[
                          { 
                            required: true, 
                            message: ERROR_MESSAGES.INVESTMENT.DATE_REQUIRED 
                          },
                        ]}
                      >
                        <InputWithAddon
                          icon={<CalendarOutlined />}
                          type="date" 
                          size="large" 
                        />
                      </Form.Item>
                    </div>
                    <div className="col-md-6">
                      <Form.Item label="Comment" name="comments">
                        <Input.TextArea 
                          placeholder="Enter Comment" 
                          size="large"
                          autoSize={{ minRows: 2, maxRows: 6 }}
                          allowClear
                        />
                      </Form.Item>
                    </div>
                  </div>

                 

                  {/* Buttons */}
                  <div className="text-center mt-4">
                    <Space size="large">
                      <Button type="primary" htmlType="submit" size="large">
                        {params.id ? "Update Investment" : "Add Investment"}
                      </Button>
                      <Button
                        size="large"
                        onClick={() => navigate("/investment")}
                      >
                        Cancel
                      </Button>
                    </Space>
                  </div>
                </div>
              </Form>
            </div>
          </div>
        </div>
        <ToastContainer />
      </div>
    </Fragment>
  );
};

export default AddInvestment;