import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { notification, Form, Input, Button, Select, Space } from "antd";
import { ToastContainer } from "react-toastify";
import Loader from "components/Common/Loader";
import { GET, POST, PUT } from "helpers/api_helper";
import { EXPENSE_TYPE_DETAIL, EXPENSE_TYPES, AREA } from "helpers/url_helper";

const { Option } = Select;

const AddExpense = () => {
    const [loading, setLoading] = useState(false);
    const [form] = Form.useForm();
    const navigate = useNavigate();
    const { id } = useParams();
    const [isEditMode, setIsEditMode] = useState(false);
    const [branches, setBranches] = useState([]);
    const [lines, setLines] = useState([]);
    const [selectedBranch, setSelectedBranch] = useState(null);
    const [allAreaData, setAllAreaData] = useState([]);

    // Fetch area data (branches and lines)
    const fetchAreaData = useCallback(async () => {
        try {
            const response = await GET(AREA);
            if (response.status === 200) {
                setAllAreaData(response.data || []);
                
                // Extract unique branches
                const uniqueBranches = [];
                const branchMap = new Map();
                
                response.data.forEach(area => {
                    if (area.branch_id && !branchMap.has(area.branch_id)) {
                        branchMap.set(area.branch_id, {
                            id: area.branch_id,
                            branch_name: area.branch_name
                        });
                        uniqueBranches.push({
                            id: area.branch_id,
                            branch_name: area.branch_name
                        });
                    }
                });
                
                setBranches(uniqueBranches);
            }
        } catch (error) {
            notification.error({
                message: "Error",
                description: "Failed to load area data.",
            });
        }
    }, []);

    // Get lines for selected branch from area data
    const getLinesForBranch = useCallback((branchId) => {
        const branchLines = allAreaData
            .filter(area => area.branch_id === branchId && area.line_id)
            .map(area => ({
                id: area.line_id,
                line_name: area.line_name
            }));
        
        // Remove duplicates based on line_id
        const uniqueLines = Array.from(
            new Map(branchLines.map(line => [line.id, line])).values()
        );
        
        setLines(uniqueLines);
    }, [allAreaData]);

    // Fetch expense data for editing
    const fetchExpenseData = useCallback(async (expenseId) => {
        setLoading(true);
        try {
            const response = await GET(EXPENSE_TYPE_DETAIL(expenseId));
            if (response.status === 200) {
                const { data } = response;
                form.setFieldsValue({
                    name: data.name,
                    branch_id: data.branch_id,
                    line_id: data.line_id,
                    status: data.status,
                });
                
                // Set selected branch and get lines
                if (data.branch_id) {
                    setSelectedBranch(data.branch_id);
                    getLinesForBranch(data.branch_id);
                }
            } else {
                notification.error({
                    message: "Error",
                    description: "Failed to load expense data.",
                });
            }
        } catch (error) {
            notification.error({
                message: "Error",
                description: "Failed to load expense data.",
            });
        } finally {
            setLoading(false);
        }
    }, [form, getLinesForBranch]);

    useEffect(() => {
        fetchAreaData();
    }, [fetchAreaData]);

    useEffect(() => {
        if (id && allAreaData.length > 0) {
            setIsEditMode(true);
            fetchExpenseData(id);
        }
    }, [id, allAreaData, fetchExpenseData]);

    // Handle branch selection change
    const handleBranchChange = (branchId) => {
        setSelectedBranch(branchId);
        form.setFieldsValue({ line_id: undefined }); // Reset line selection
        setLines([]); // Clear lines
        if (branchId) {
            getLinesForBranch(branchId);
        }
    };

    const onFinish = async (values) => {
        setLoading(true);
        try {
            const expenseData = {
                name: values.name,
                branch_id: values.branch_id,
                line_id: values.line_id,
                status: values.status,
            };

            if (isEditMode) {
                const existingExpense = await GET(EXPENSE_TYPE_DETAIL(id));

                if (existingExpense.status === 200) {
                    // Check if there are any changes
                    if (
                        existingExpense.data.name === values.name &&
                        existingExpense.data.branch_id === values.branch_id &&
                        existingExpense.data.line_id === values.line_id &&
                        existingExpense.data.status === values.status
                    ) {
                        notification.warning({
                            message: "No Changes",
                            description: "No changes detected, update not required.",
                        });
                        setLoading(false);
                        return;
                    }

                    const response = await PUT(EXPENSE_TYPE_DETAIL(id), expenseData);
                    if (response.status === 200) {
                        notification.success({
                            message: "Expense Type Updated!",
                            description: "The expense type has been updated successfully",
                            duration: 2,
                        });
                        navigate("/expense/list");
                    } else {
                        throw new Error("Failed to update expense");
                    }
                } else {
                    throw new Error("Error fetching existing expense data");
                }
            } else {
                const response = await POST(EXPENSE_TYPES, expenseData);
                if (response.status === 200 || response.status === 201) {
                    notification.success({
                        message: "Expense Type Added!",
                        description: "The expense type has been added successfully",
                        duration: 2,
                    });
                    navigate("/expense/list");
                } else {
                    throw new Error("Failed to add expense");
                }
            }
        } catch (error) {
            console.error(error);
            if (error.response?.data?.name?.[0]) {
                notification.error({
                    message: "Duplicate Name",
                    description: error.response.data.name[0],
                });
            } else {
                notification.error({
                    message: "Error",
                    description: error.message || "An error occurred while processing your request.",
                });
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            {loading && <Loader />}

            <div className="page-content" style={{
                marginRight: "10px",
                marginLeft: "-10px",
                maxWidth: "100%"
            }}>
                <div className="container-fluid" style={{
                    marginTop: -100,
                    padding: 0,
                }}>
                    <div className="row">
                        <div className="col-md-12">
                            <h2 style={{ margin: 0, fontSize: "24px", fontWeight: 600 }}>
                                {isEditMode ? "Edit Expense Type" : "Add Expense Type"}
                            </h2>

                            <Form
                                form={form}
                                layout="vertical"
                                onFinish={onFinish}
                                style={{ padding: 0, marginRight: "-20px", marginBottom: "-30px" }}
                            >

                                {/* Branch and Line Selection */}
                                    <div className="row mb-3">
                                        <div className="col-md-6">
                                            <Form.Item
                                                label="Branch Name"
                                                name="branch_id"
                                                rules={[{ required: true, message: "Please select a branch" }]}
                                            >
                                                <Select
                                                    placeholder="Select branch"
                                                    size="large"
                                                    onChange={handleBranchChange}
                                                    showSearch
                                                    filterOption={(input, option) =>
                                                        option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                                                    }
                                                >
                                                    {branches.map((branch) => (
                                                        <Option key={branch.id} value={branch.id}>
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
                                                rules={[{ required: true, message: "Please select a line" }]}
                                            >
                                                <Select
                                                    placeholder={selectedBranch ? "Select line" : "First select a branch"}
                                                    size="large"
                                                    disabled={!selectedBranch}
                                                    showSearch
                                                    filterOption={(input, option) =>
                                                        option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                                                    }
                                                >
                                                    {lines.map((line) => (
                                                        <Option key={line.id} value={line.id}>
                                                            {line.line_name}
                                                        </Option>
                                                    ))}
                                                </Select>
                                            </Form.Item>
                                        </div>
                                    </div>
                                <div className="container" style={{ padding: 0 }}>
                                    {/* Expense Details */}
                                    <div className="row mb-1 mt-2">
                                        <div className="col-md-6">
                                            <Form.Item
                                                label="Expense Name"
                                                name="name"
                                                rules={[{ required: true, message: "Please enter expense name" }]}
                                            >
                                                <Input placeholder="Enter expense name" size="large" />
                                            </Form.Item>
                                        </div>
                                        <div className="col-md-6">
                                            <Form.Item
                                                label="Status"
                                                name="status"
                                                rules={[{ required: true, message: "Please select a status" }]}
                                            >
                                                <Select placeholder="Select status" size="large">
                                                    <Option value="active">Active</Option>
                                                    <Option value="inactive">Inactive</Option>
                                                </Select>
                                            </Form.Item>
                                        </div>
                                    </div>

                                  

                                    {/* Submit & Cancel Buttons */}
                                    <div className="text-center mt-4">
                                        <Space size="large">
                                            <Button
                                                type="primary"
                                                htmlType="submit"
                                                size="large"
                                                loading={loading}
                                            >
                                                {isEditMode ? "Update Expense Type" : "Add Expense Type"}
                                            </Button>
                                            <Button
                                                size="large"
                                                onClick={() => navigate("/expense/list")}
                                                disabled={loading}
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

export default AddExpense;