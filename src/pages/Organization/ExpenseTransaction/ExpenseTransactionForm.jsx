import ReloadOutlined from "@ant-design/icons/lib/icons/ReloadOutlined";
import { Button, Form, Input, Select, notification, Divider, Space } from "antd";
import Loader from "components/Common/Loader";
import PAYMENT_MODES_OPTIONS from "constants/payment_modes";
import { POST, PUT, GET } from "helpers/api_helper";
import { getDetails } from "helpers/getters";
import {
  EXPENSE_TRANSACTION,
  EXPENSE_TYPES,
  AREA,
} from "helpers/url_helper";
import { useEffect, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "./ExpenseTransactionForm.css";

const { Option } = Select;

const ExpenseTransactionForm = () => {
  const [form] = Form.useForm();

  const navigate = useNavigate();
  const params = useParams();

  const [loading, setLoading] = useState(false);
  const [areaList, setAreaList] = useState([]);
  const [expenseTypeList, setExpenseTypeList] = useState([]);
  const [expenseTransaction, setExpenseTransaction] = useState(null);
  const [areaLoader, setAreaLoader] = useState(false);
  const [expenseTypeLoader, setExpenseTypeLoader] = useState(false);
  const [selectedBranchName, setSelectedBranchName] = useState(null);
  const [selectedBranchId, setSelectedBranchId] = useState(null);

  // Get unique branches from area list
  const getBranchList = () => {
    const uniqueBranches = [];
    const branchMap = new Map();
    
    areaList.forEach((area) => {
      if (area.branch_name && !branchMap.has(area.branch_name)) {
        branchMap.set(area.branch_name, {
          branch_name: area.branch_name,
          branch_id: area.branch_id || area.id,
        });
        uniqueBranches.push({
          branch_name: area.branch_name,
          branch_id: area.branch_id || area.id,
        });
      }
    });
    
    return uniqueBranches;
  };

  // Get lines filtered by selected branch (unique lines only)
  const getFilteredLines = () => {
    if (!selectedBranchName) return [];
    
    const filteredAreas = areaList.filter((area) => area.branch_name === selectedBranchName);
    
    // Remove duplicates based on line_id
    const uniqueLines = [];
    const lineMap = new Map();
    
    filteredAreas.forEach((area) => {
      const lineId = area.line_id;
      const lineName = area.lineName || area.line_name || area.name;
      
      if (lineId && lineName && !lineMap.has(lineId)) {
        lineMap.set(lineId, true);
        uniqueLines.push({
          line_id: lineId,
          lineName: lineName
        });
      }
    });
    
    return uniqueLines;
  };

  const getAreaList = async () => {
    try {
      setAreaLoader(true);
      const response = await GET(AREA);
      if (response?.status === 200) {
        setAreaList(response.data);
      } else {
        setAreaList([]);
      }
      setAreaLoader(false);
    } catch (error) {
      setAreaList([]);
      setAreaLoader(false);
      console.log(error);
    }
  };

  const getExpenseTypeList = async () => {
    try {
      setExpenseTypeLoader(true);
      const response = await GET(EXPENSE_TYPES);
      if (response?.status === 200) {
        setExpenseTypeList(response?.data);
      } else {
        setExpenseTypeList([]);
      }
      setExpenseTypeLoader(false);
    } catch (error) {
      setExpenseTypeList([]);
      setExpenseTypeLoader(false);
      console.log(error);
    }
  };

  const getExpenseTransactionDetails = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getDetails(EXPENSE_TRANSACTION, params.id);
      if (response) {
        setExpenseTransaction(response);
        form.setFieldsValue(response);
        
        // Set selected branch if editing
        const area = areaList.find((a) => a.line_id === response.line_id);
        if (area) {
          setSelectedBranchName(area.branch_name);
          setSelectedBranchId(area.branch_id);
        }
      }
      setLoading(false);
    } catch (error) {
      setLoading(false);
      console.log(error);
    }
  }, [params.id, form, areaList]);

  useEffect(() => {
    getAreaList();
    getExpenseTypeList();
  }, []);

  useEffect(() => {
    if (params.id && areaList.length > 0) {
      getExpenseTransactionDetails();
    }
  }, [params.id, areaList, getExpenseTransactionDetails]);

  const onFinish = async (values) => {
    setLoading(true);
    try {
      let response;
      if (params.id) {
        response = await PUT(`${EXPENSE_TRANSACTION}${params.id}/`, values);
      } else {
        response = await POST(EXPENSE_TRANSACTION, values);
      }
      if (response?.status === 200 || response?.status === 201) {
        const selectedExpenseType = expenseTypeList?.find(
          (type) => type.id === values.EXPNS_TYPE_ID
        );
        notification.success({
          message: `${selectedExpenseType?.name?.toUpperCase()} Expense Transaction ${
            params.id ? "Updated" : "Created"
          }!`,
          description: `Expense transaction has been ${
            params.id ? "updated" : "added"
          } successfully`,
          duration: 0,
        });
        navigate("/expense-transaction");
      } else {
        notification.error({
          message: `Failed to ${params.id ? "update" : "add"} expense transaction`,
          duration: 0,
        });
      }
    } catch (error) {
      console.log(error);
      notification.error({
        message: "An error occurred",
        description: "Failed to process expense transaction",
        duration: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  const onValuesChange = (changedValues) => {
    if (changedValues.branch_id !== undefined) {
      const selectedBranch = branchList.find(b => b.branch_id === changedValues.branch_id);
      if (selectedBranch) {
        setSelectedBranchName(selectedBranch.branch_name);
        setSelectedBranchId(selectedBranch.branch_id);
      }
      // Reset line selection when branch changes
      form.setFieldsValue({ line_id: undefined });
    }
  };

  const branchList = getBranchList();
  const filteredLines = getFilteredLines();

  return (
    <>
      {loading && <Loader />}

      <div className="expense-transaction-page-content">
        <div className="expense-transaction-container-fluid">
          <div className="row">
            <div className="col-md-12">
              <div className="expense-transaction-header">
                <h2 className="expense-transaction-title">
                  {params.id ? "Edit Expense Transaction" : "Add Expense Transaction"}
                </h2>
              </div>

              <Form
                form={form}
                layout="vertical"
                onFinish={onFinish}
                onValuesChange={onValuesChange}
                className="expense-transaction-form"
              >
                <div className="container expense-transaction-form-container">
                  {/* Branch and Line Name */}
                  <div className="row mb-2">
                    <div className="col-md-6">
                      <Form.Item
                        label="Branch Name"
                        name="branch_id"
                        rules={[
                          { required: true, message: "Please select a branch" },
                        ]}
                      >
                        <Select
                          placeholder="Select Branch"
                          allowClear
                          showSearch
                          size="large"
                          loading={areaLoader}
                          optionFilterProp="children"
                        >
                          {branchList.map((branch, index) => (
                            <Option key={index} value={branch.branch_id}>
                              {branch.branch_name}
                            </Option>
                          ))}
                        </Select>
                      </Form.Item>
                    </div>

                    <div className="col-md-6">
                      <Form.Item
                        label="Line Name"
                        name="line_id"
                        rules={[
                          { required: true, message: "Please select a line" },
                        ]}
                      >
                        <Select
                          placeholder="Select Line"
                          allowClear
                          showSearch
                          size="large"
                          disabled={!selectedBranchName}
                          optionFilterProp="children"
                        >
                          {filteredLines.map((line) => (
                            <Option key={line.line_id} value={line.line_id}>
                              {line.lineName}
                            </Option>
                          ))}
                        </Select>
                      </Form.Item>
                    </div>
                  </div>

                  {/* Expense Type and Date */}
                  <div className="row mb-2">
                    <div className="col-md-6">
                      <Form.Item
                        label="Expense Type Name"
                        name="EXPNS_TYPE_ID"
                        rules={[
                          {
                            required: true,
                            message: "Please select an expense type",
                          },
                        ]}
                      >
                        <Select
                          placeholder="Select Expense Type"
                          allowClear
                          showSearch
                          size="large"
                          loading={expenseTypeLoader}
                          optionFilterProp="children"
                        >
                          {expenseTypeList?.map((type) => (
                            <Option key={type.id} value={type.id}>
                              {type.name}
                            </Option>
                          ))}
                        </Select>
                      </Form.Item>
                    </div>

                    <div className="col-md-6">
                      <Form.Item
                        label="Date of Expense Transaction"
                        name="EXPNS_TRNSCTN_DT"
                        rules={[
                          { required: true, message: "Please select a date" },
                        ]}
                      >
                        <Input type="date" size="large" />
                      </Form.Item>
                    </div>
                  </div>

                  {/* Amount and Payment Mode */}
                  <div className="row mb-2">
                    <div className="col-md-6">
                      <Form.Item
                        label="Expense Amount"
                        name="EXPNS_TRNSCTN_AMNT"
                        rules={[
                          { required: true, message: "Please enter an amount" },
                          {
                            pattern: /^[0-9]+(\.[0-9]{1,2})?$/,
                            message: "Enter a valid amount",
                          },
                        ]}
                      >
                        <Input
                          placeholder="Enter Expense Amount"
                          type="text"
                          inputMode="decimal"
                          size="large"
                          autoComplete="off"
                        />
                      </Form.Item>
                    </div>

                    <div className="col-md-6">
                      <Form.Item
                        label="Payment Mode"
                        name="EXPNS_TRNSCTN_MODE"
                        rules={[
                          {
                            required: true,
                            message: "Please select a payment mode",
                          },
                        ]}
                      >
                        <Select 
                          placeholder="Select Payment Mode" 
                          allowClear
                          size="large"
                        >
                          {PAYMENT_MODES_OPTIONS.map((mode) => (
                            <Option key={mode.value} value={mode.value}>
                              {mode.label}
                            </Option>
                          ))}
                        </Select>
                      </Form.Item>
                    </div>
                  </div>

                  {/* Remarks */}
                  <div className="row mb-2">
                    <div className="col-md-12">
                      <Form.Item
                        label="Remarks / Comments"
                        name="EXPNS_TRNSCTN_RMRK"
                      >
                        <Input.TextArea 
                          placeholder="Enter remarks or comments" 
                          rows={4}
                          size="large"
                        />
                      </Form.Item>
                    </div>
                  </div>

                  {/* <Divider className="expense-transaction-divider" /> */}

                  {/* Buttons */}
                  <div className="text-center mt-4">
                    <Space size="large">
                      <Button type="primary" htmlType="submit" size="large">
                        {params.id ? "Update Transaction" : "Add Transaction"}
                      </Button>

                      {/* {!params.id && (
                        <Button
                          size="large"
                          onClick={() => {
                            form.resetFields();
                            setSelectedBranchName(null);
                            setSelectedBranchId(null);
                          }}
                          icon={<ReloadOutlined />}
                        >
                          Reset
                        </Button>
                      )} */}

                      <Button
                        size="large"
                        onClick={() => navigate("/expense-transaction")}
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
    </>
  );
};

export default ExpenseTransactionForm;