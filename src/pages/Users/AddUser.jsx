import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Select, Form, Input, Button, Switch, message, Divider, Space } from "antd";
import {
  BankOutlined,
  ApartmentOutlined,
  DollarOutlined,
  PlusOutlined,
  MinusOutlined,
  UserOutlined, PhoneOutlined, MailOutlined,
  
} from "@ant-design/icons";
import {
  USERS,
  EXPANSE_AUTOCOMPLETE,
  AREA, 
  EXPENSE_TYPES, // <-- ADDED: Assuming this is the endpoint for fetching all expense types
} from "helpers/url_helper";
import { GET, POST, PUT } from "helpers/api_helper";
import Loader from "components/Common/Loader";
import InputWithAddon from "components/Common/InputWithAddon";
// import { debounce } from "lodash";

const { Option } = Select;

const AddUser = () => {
  const [loading, setLoading] = useState(false);
  const [branchLoader, setBranchLoader] = useState(false);
  const [lineLoader, setLineLoader] = useState(false);
  const [areaData, setAreaData] = useState([]); // Store all area data
  const [branchList, setBranchList] = useState([]);
  const [lineList, setLineList] = useState([]); // All lines
  const [filteredLineList, setFilteredLineList] = useState([]); // Lines filtered by selected branches
  const [baseLineList, setBaseLineList] = useState([]); // Lines filtered by base branch
  const [isEditMode, setIsEditMode] = useState(false);
  const [initialValues, setInitialValues] = useState({});
  // [MODIFIED] expenseTypes stores the full, active list of expenses
  const [expenseTypes, setExpenseTypes] = useState([]); 
  // const [expenseOptions, setExpenseOptions] = useState([]); // <-- REMOVED: Replaced by expenseTypes
  const [expenseLoading, setExpenseLoading] = useState(false);
  const [userRole, setUserRole] = useState("");
  const [selectedRole, setSelectedRole] = useState("");
  const [expenseMappings, setExpenseMappings] = useState([{ id: Date.now(), lineId: null, expanses: [] }]);
  const [currentUsername, setCurrentUsername] = useState("");
  const [selectedBranches, setSelectedBranches] = useState([]); // Track selected branches (using IDs internally)
  const [selectedBaseBranch, setSelectedBaseBranch] = useState(null); // Track selected base branch

  const navigate = useNavigate();
  const params = useParams();
  const userId = params.id;
  const [form] = Form.useForm();

  // Get logged-in user role and username from localStorage
  useEffect(() => {
    const role = localStorage.getItem("user_role");
    const username = localStorage.getItem("username") || localStorage.getItem("user_name");
    if (role) {
      setUserRole(role);
    }
    if (username) {
      setCurrentUsername(username);
    }
  }, []);

  // [REMOVED] The original debouncedSearch is removed as it conflicts with line-level filtering. 
  // debouncedSearch is not used in the provided context
  

  // [NEW] Function to fetch all active expense types
  const getExpenseTypesList = useCallback(async () => {
    setExpenseLoading(true);
    try {
      // Use the EXPENSE_TYPES endpoint to get the full list
      const response = await GET(EXPENSE_TYPES); 
      if (response?.status === 200) {
        // Filter for active records only
        const allActiveExpenses = response.data.filter(exp => exp.status === 'active');
        setExpenseTypes(allActiveExpenses); 
      } else {
        message.error("Failed to fetch expenses");
        setExpenseTypes([]);
      }
    } catch (error) {
      console.error("Error fetching expense types:", error);
      message.error("Error fetching expense types");
      setExpenseTypes([]);
    } finally {
      setExpenseLoading(false);
    }
  }, []);

  // Fetch area data (which contains branch and line information) AND expense types
  useEffect(() => {
    const fetchAreaData = async () => {
      try {
        setBranchLoader(true);
        setLineLoader(true);
        // [MODIFIED] Removed GET(EXPANSE_AUTOCOMPLETE) from Promise.all
        const areaResponse = await GET(AREA); 

        if (areaResponse?.status === 200) {
          const areas = areaResponse.data;
          setAreaData(areas);

          // FIX: Extract unique branches with ACTUAL IDs from area data
          const branchMap = new Map();
          areas.forEach(item => {
            const branchId = item.branch_id || item.branch;
            if (branchId && !branchMap.has(branchId)) {
              branchMap.set(branchId, {
                id: branchId, 
                branch_name: item.branch_name,
              });
            }
          });
          const branches = Array.from(branchMap.values());
          setBranchList(branches);

          // FIX: Extract unique lines with ACTUAL IDs from area data
          const lineMap = new Map();
          areas.forEach(item => {
            const lineId = item.line_id || item.line;
            if (lineId && !lineMap.has(lineId)) {
              lineMap.set(lineId, {
                id: lineId, 
                lineName: item.line_name,
                branch_id: item.branch_id || item.branch, 
              });
            }
          });
          const lines = Array.from(lineMap.values());
          setLineList(lines);
          setFilteredLineList(lines); 
          setBaseLineList([]);
        }

        // [REMOVED] Removed old expense fetch logic

      } catch (error) {
        console.error("Error fetching area data:", error);
        message.error("Failed to load area data");
        setBranchList([]);
        setLineList([]);
        setAreaData([]);
      } finally {
        setBranchLoader(false);
        setLineLoader(false);
      }
    };

    fetchAreaData();
    // Fetch all expense types
    getExpenseTypesList(); 
  }, [getExpenseTypesList]); // Dependency added

  
  // ... (existing handleBranchChange function - no change needed here)
  const handleBranchChange = (selectedBranchIds) => {
    // Determine if the input is IDs (number) or Names (string)
    const isInputNames = selectedBranchIds.length > 0 && typeof selectedBranchIds[0] === 'string';

    const branchIdsForFiltering = isInputNames 
      ? branchList
          .filter(branch => selectedBranchIds.includes(branch.branch_name))
          .map(branch => branch.id)
      : selectedBranchIds;

    setSelectedBranches(branchIdsForFiltering);
    
    if (!branchIdsForFiltering || branchIdsForFiltering.length === 0) {
      setFilteredLineList([]);
      return;
    }

    // Get branch names from selected IDs (which are the actual IDs, or we find them from names)
    const selectedBranchNames = branchList
      .filter(branch => branchIdsForFiltering.includes(branch.id))
      .map(branch => branch.branch_name);

    // Filter area data by selected branches
    const filteredAreas = areaData.filter(area => 
      selectedBranchNames.includes(area.branch_name)
    );

    // Extract unique lines from filtered areas
    const uniqueLineNames = [...new Set(filteredAreas.map(item => item.line_name))];
    const filteredLines = lineList.filter(line => 
      uniqueLineNames.includes(line.lineName)
    );

    setFilteredLineList(filteredLines);

    // Clear line selections that are no longer valid (must check against IDs)
    const currentLineIds = form.getFieldValue('lineId') || [];
    if (currentLineIds.length > 0 && typeof currentLineIds[0] === 'number') {
      const validLineIds = currentLineIds.filter(lineId => 
        filteredLines.some(line => line.id === lineId)
      );
      
      if (validLineIds.length !== currentLineIds.length) {
        form.setFieldsValue({ lineId: validLineIds });
      }

      // Update expense mappings to remove invalid lines
      const updatedMappings = expenseMappings.map(mapping => {
        if (mapping.lineId && !filteredLines.some(line => line.id === mapping.lineId)) {
          return { ...mapping, lineId: null, expanses: [] };
          
        }
        return mapping;
      });
      setExpenseMappings(updatedMappings);
    }
  };
  
  // ... (existing handleBaseBranchChange function - no change needed here)
  const handleBaseBranchChange = (selectedBranchId) => {
    setSelectedBaseBranch(selectedBranchId);
    
    if (selectedBranchId === null || selectedBranchId === undefined) {
      setBaseLineList([]);
      form.setFieldsValue({ baseLineId: null });
      return;
    }

    // Get branch name from selected ID
    const selectedBranch = branchList.find(branch => branch.id === selectedBranchId);
    
    if (!selectedBranch) {
      setBaseLineList([]);
      form.setFieldsValue({ baseLineId: null });
      return;
    }

    // Filter area data by selected base branch (case-insensitive and trim whitespace)
    const filteredAreas = areaData.filter(area => {
      const areaBranchName = area.branch_name?.toString().trim().toLowerCase();
      const selectedBranchName = selectedBranch.branch_name?.toString().trim().toLowerCase();
      return areaBranchName === selectedBranchName;
    });


    if (filteredAreas.length === 0) {
      setBaseLineList([]);
      form.setFieldsValue({ baseLineId: null });
      return;
    }

    // Extract unique line names from filtered areas
    const uniqueLineNames = [...new Set(
      filteredAreas
        .map(item => item.line_name)
        .filter(Boolean)
        .map(name => name.toString().trim())
    )];

    // Filter lines based on the unique line names found
    const filteredLines = lineList.filter(line => {
      const lineName = line.lineName?.toString().trim().toLowerCase();
      return uniqueLineNames.some(uniqueName => 
        uniqueName.toLowerCase() === lineName
      );
    });

    setBaseLineList(filteredLines);

    // Clear base line selection if it's no longer valid
    const currentBaseLineId = form.getFieldValue('baseLineId');
    if (currentBaseLineId && !filteredLines.some(line => line.id === currentBaseLineId)) {
      form.setFieldsValue({ baseLineId: null });
    }
  };

  useEffect(() => {
    if (userId) {
      const fetchUserData = async () => {
        try {
          setLoading(true);
          const response = await GET(`${USERS}${userId}`);
          if (response) {
            const userData = response.data;
            
            // Wait for area data and expense types to be loaded
            let currentAreaData = areaData;
            let currentBranchList = branchList;
            let currentLineList = lineList;
            
            if (currentAreaData.length === 0 || currentBranchList.length === 0 || expenseTypes.length === 0) {
              await new Promise(resolve => setTimeout(resolve, 500));
              currentAreaData = areaData;
              currentBranchList = branchList;
              currentLineList = lineList;
            }
            
            // Extract branch IDs and line IDs from line_allocations
            const branchIds = userData.line_allocations 
              ? [...new Set(userData.line_allocations.map(allocation => allocation.branch))]
              : [];
            
            const lineIds = userData.line_allocations 
              ? [...new Set(userData.line_allocations.map(allocation => allocation.line))]
              : [];

            // Get base branch ID and base line ID from NAMES
            let baseBranchId = null;
            let baseLineId = null;
            
            if (userData.base_branch) {
              const baseBranch = currentBranchList.find(
                b => b.branch_name === userData.base_branch
              );
              baseBranchId = baseBranch ? baseBranch.id : null;
            }
            
            if (userData.base_line) {
              const baseLine = currentLineList.find(
                l => l.lineName === userData.base_line
              );
              baseLineId = baseLine ? baseLine.id : null;
            }

            // Set form values with IDs
            form.setFieldsValue({
              full_name: userData.full_name,
              username: userData.username,
              mobile_number: userData.mobile_number,
              email: userData.email,
              address: userData.address,
              pin_code: userData.pin_code,
              role: userData.role,
              baseBranchId: baseBranchId,
              baseLineId: baseLineId,
              branchId: branchIds, // Use actual IDs from API
              lineId: lineIds, // Use actual IDs from API
              allowTransaction: userData.allow_old_transaction,
            });
            
            setInitialValues(userData);
            setSelectedRole(userData.role);
            setSelectedBranches(branchIds); // Use actual IDs
            setSelectedBaseBranch(baseBranchId);
            setIsEditMode(true); // <--- Key: Set edit mode

            // Filter lines based on selected branches for edit mode
            if (branchIds.length > 0) {
              handleBranchChange(branchIds);
            }

            // Filter base lines based on selected base branch for edit mode
            if (baseBranchId) {
              handleBaseBranchChange(baseBranchId);
            }

            // Transform user_expenses into expenseMappings format
            if (userData.user_expenses && userData.user_expenses.length > 0) {
              // Group expenses by line (using null for global expenses where line ID is not present)
              const expensesByLine = new Map();
              
              userData.user_expenses.forEach(exp => {
                // Use null for global expenses (where line ID is not present)
                const lineId = exp.expense_line_id || null; 
                if (!expensesByLine.has(lineId)) {
                  expensesByLine.set(lineId, []);
                }
                expensesByLine.get(lineId).push(exp.expense);
              });
              
              // Create expense mappings
              const mappings = [];
              expensesByLine.forEach((expenses, lineId) => {
                mappings.push({
                  id: Date.now() + Math.random(),
                  lineId: lineId,
                  expanses: [...new Set(expenses)], // Remove duplicates
                });
              });
              
              setExpenseMappings(mappings.length > 0 ? mappings : [{ id: Date.now(), lineId: null, expanses: [] }]);
            } else {
              setExpenseMappings([{ id: Date.now(), lineId: null, expanses: [] }]);
            }
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
          message.error("Failed to load user data");
        } finally {
          setLoading(false);
        }
      };
      fetchUserData();
    }
  }, [userId, form, areaData, branchList, lineList, expenseTypes.length]); // Added expenseTypes.length dependency

  

  const handleBack = useCallback(() => {
    if (form.isFieldsTouched()) {
      if (
        window.confirm(
          "You have unsaved changes. Are you sure you want to leave?"
        )
      ) {
        navigate("/user/list");
      }
    } else {
      navigate("/user/list");
    }
  }, [navigate, form]);

  // Handle role change to show/hide fields
  const handleRoleChange = (value) => {
    setSelectedRole(value);
    if (value === "owner" || value === "manager") {
      // Clear line field when it's hidden for non-agent roles
      form.setFieldsValue({ lineId: undefined });
    }
  };

  // Add new expense mapping
  const addExpenseMapping = () => {
    setExpenseMappings([...expenseMappings, { id: Date.now(), lineId: null, expanses: [] }]);
  };

  // Remove expense mapping
  const removeExpenseMapping = (index) => {
    if (expenseMappings.length > 1) {
      setExpenseMappings(expenseMappings.filter((_, i) => i !== index));
    } else {
      message.warning("At least one expense mapping is required");
    }
  };

  // [MODIFIED] Update expense mapping: Clear expanses if lineId changes.
  const updateExpenseMapping = (id, field, value) => {
   setExpenseMappings(prevMappings => {
   
    return prevMappings.map(mapping => 
      mapping.id === id 
        ? { ...mapping, [field]: value } 
        : mapping
    );
  });
};
  
  const getFilteredExpenseOptions = useCallback((lineId) => {
    // 1. Get all active expenses from the state
    console.log("Line id selected",lineId)
    const activeExpenses = expenseTypes;
    console.log(expenseTypes)

    // 2. If lineId is null or undefined (Global Mapping)
    if (lineId === null || lineId === undefined) {
      // Show only global expenses (where both branch_id and line_id are null)
      return activeExpenses
        .filter(exp => exp.branch_id === null && exp.line_id === null)
        .map(item => ({ value: item.id, label: item.name, name: item.name }));
    }

    // 3. If a specific lineId is selected
    // Show ONLY expenses that match the lineId (removing the global fallback)
    return activeExpenses
      .filter(exp => exp.line_id === lineId) 
      .map(item => ({ value: item.id, label: item.name, name: item.name }));
  }, [expenseTypes]);


  // Handle form submission
  const onFinish = async (values) => {
    
    // Validate expense mappings only if in Edit Mode (where the block is visible)
    if (isEditMode) {
      const hasInvalidMapping = expenseMappings.some(
        mapping => (mapping.lineId !== null && mapping.expanses.length === 0)
      );
      
      if (hasInvalidMapping) {
        message.error("Please ensure all specific line mappings have at least one expense selected.");
        return;
      }
      
      // Additional check for global mapping:
       const hasGlobalMapping = expenseMappings.some(mapping => mapping.lineId === null);
       // Only validate global mapping if it exists AND the user is not an Agent
       if (hasGlobalMapping && (selectedRole === 'owner' || selectedRole === 'manager') && expenseMappings.find(mapping => mapping.lineId === null)?.expanses.length === 0) {
            message.error("Please ensure the Global expense mapping has at least one expense selected.");
            return;
        }
    }


    setLoading(true);

    try {
      // Get selected branch IDs (they should already be IDs, not names)
      const branchIds = Array.isArray(values.branchId) ? values.branchId : [];
      
      // Get selected line IDs (they should already be IDs, not names)
      const lineIds = Array.isArray(values.lineId) ? values.lineId : [];

      // BUILD line_allocations array (logic remains the same)
      const lineAllocations = [];
      
      if (values.role === 'agent' && lineIds.length > 0) {
        // For agents: create line_allocations from selected lines
        lineIds.forEach(lineId => {
          const lineData = lineList.find(l => l.id === lineId);
          if (lineData) {
            // Find the branch for this line from areaData
            const areaItem = areaData.find(a => 
              (a.line_id || a.line) === lineId
            );
            
            if (areaItem) {
              lineAllocations.push({
                branch: areaItem.branch_id || areaItem.branch,
                line: lineId,
                branch_name: areaItem.branch_name,
                line_name: lineData.lineName,
              });
            }
          }
        });
      } else if (values.role === 'owner' || values.role === 'manager') {
        // For owner/manager: create line_allocations from all lines under selected branches
        branchIds.forEach(branchId => {
          const branchData = branchList.find(b => b.id === branchId);
          if (branchData) {
            // Get all lines under this branch
            const branchAreas = areaData.filter(a => 
              (a.branch_id || a.branch) === branchId
            );
            
            // Get unique lines for this branch
            const uniqueLines = new Map();
            branchAreas.forEach(area => {
              const lineId = area.line_id || area.line;
              if (lineId && !uniqueLines.has(lineId)) {
                uniqueLines.set(lineId, {
                  branch: branchId,
                  line: lineId,
                  branch_name: area.branch_name,
                  line_name: area.line_name,
                });
              }
            });
            
            // Add all lines from this branch to line_allocations
            uniqueLines.forEach(lineAllocation => {
              lineAllocations.push(lineAllocation);
            });
          }
        });
      }


      // BUILD user_expenses array (Only use expenseMappings in edit mode)
      const userExpenses = [];
      
      if (isEditMode) {
        expenseMappings.forEach(mapping => {
          if (mapping.expanses && mapping.expanses.length > 0) {
            mapping.expanses.forEach(expenseId => {
              if (mapping.lineId) {
                // Expense mapped to specific line
                const lineData = lineList.find(l => l.id === mapping.lineId);
                const areaItem = areaData.find(a => 
                  (a.line_id || a.line) === mapping.lineId
                );
                
                if (lineData && areaItem) {
                  userExpenses.push({
                    expense: expenseId,
                    expense_branch_id: areaItem.branch_id || areaItem.branch,
                    expense_branch_name: areaItem.branch_name,
                    expense_line_id: mapping.lineId,
                    expense_line_name: lineData.lineName,
                  });
                }
              } else {
                // Global expense (no specific line)
                // Add expense for each branch-line combination in line_allocations
                lineAllocations.forEach(allocation => {
                  userExpenses.push({
                    expense: expenseId,
                    expense_branch_id: allocation.branch,
                    expense_branch_name: allocation.branch_name,
                    expense_line_id: allocation.line,
                    expense_line_name: allocation.line_name,
                  });
                });
              }
            });
          }
        });
      }

      // Get base branch and line NAMES (not IDs)
      let baseBranchName = null;
      let baseLineName = null;
      
      if (values.baseBranchId) {
        const baseBranch = branchList.find(b => b.id === values.baseBranchId);
        baseBranchName = baseBranch ? baseBranch.branch_name : null;
      }
      
      if (values.baseLineId) {
        const baseLine = lineList.find(l => l.id === values.baseLineId);
        baseLineName = baseLine ? baseLine.lineName : null;
      }

      // BUILD the final payload
      const payload = {
        username: values.username,
        full_name: values.full_name,
        mobile_number: values.mobile_number,
        email: values.email || "",
        address: values.address || null,
        pin_code: values.pin_code || null,
        role: values.role,
        allow_old_transaction: values.allowTransaction || false,
        base_branch: baseBranchName, // Send NAME, not ID
        base_line: baseLineName, // Send NAME, not ID
        line_allocations: lineAllocations,
        user_expenses: isEditMode ? userExpenses : [], // Only send user_expenses in edit mode
      };

      // Add password only if provided
      if (values.password) {
        payload.password = values.password;
      }


      let response;
      if (isEditMode) {
        response = await PUT(`${USERS}${userId}/`, payload);
        if (response) {
          message.success("User updated successfully");
          navigate("/user/list");
        }
      } else {
        response = await POST(USERS, payload);

        if (response?.status === 200 || response?.status === 201) {
          message.success("User added successfully");
          form.resetFields();
          setExpenseMappings([{ id: Date.now(), lineId: null, expanses: [] }]);
          navigate("/user/list");
        } else if (response?.status === 400) {
          const errorMessage =
            response?.data?.mobile_number ||
            response?.data?.email ||
            "User not created";
          message.error(errorMessage);
        }
      }
    } catch (error) {
      console.error("Error adding/updating user:", error);
      message.error(error?.response?.data?.message || "Failed to add/update user");
    } finally {
      setLoading(false);
    }
  };
  return (
    <>
      {loading && <Loader />}
      <div className="add-user-page-content">
        <div className="add-user-container-fluid">
          <div className="row">
            <div className="col-md-12">
              <div className="add-user-header">
                <h2 className="add-user-title">
                  {isEditMode ? "Edit User" : "Add User"}
                </h2>
              </div>

              <Form
                layout="vertical"
                onFinish={onFinish}
                form={form}
                initialValues={initialValues}
                className="add-user-form"
              >
                <div className="container add-user-form-container">
                  {/* Full Name and User Name */}
                  <div className="row mb-2">
                    <div className="col-md-6">
                      <Form.Item
                        label="Full Name"
                        name="full_name"
                        rules={[
                          {
                            required: true,
                            message: "Please enter the full name",
                          },
                        ]}
                      >
                        <InputWithAddon
  icon={<UserOutlined />}
  placeholder="Enter full name"
/>

                      </Form.Item>
                    </div>
                    <div className="col-md-6">
                      <Form.Item
                        label="User Name"
                        name="username"
                        rules={[
                          {
                            required: true,
                            message: "Please enter the user name",
                          },
                        ]}
                      >
                       <InputWithAddon
  icon={<UserOutlined />}
  placeholder="Enter user name"
/>

                      </Form.Item>
                    </div>
                  </div>
                       
                  {/* Password and Confirm Password */}
                   {!isEditMode &&(
                  <div className="row mb-2">
                    <div className="col-md-6">
                      <Form.Item
                        label="Password"
                        name="password"
                        rules={[
                          {
                            required: !isEditMode,
                            message: "Please enter the password",
                          },
                        ]}
                      >
                        <Input.Password
                          placeholder="Enter password"
                          size="large"
                        />
                      </Form.Item>
                    </div>
                    <div className="col-md-6">
                      <Form.Item
                        label="Confirm Password"
                        name="confirmPassword"
                        dependencies={["password"]}
                        rules={[
                          {
                            required: !isEditMode,
                            message: "Please confirm the password",
                          },
                          ({ getFieldValue }) => ({
                            validator(_, value) {
                              return !value ||
                                getFieldValue("password") === value
                                ? Promise.resolve()
                                : Promise.reject(
                                    new Error("Passwords do not match!")
                                  );
                            },
                          }),
                        ]}
                      >
                        <Input.Password
                          placeholder="Confirm password"
                          size="large"
                        />
                      </Form.Item>
                    </div>
                  </div>
                        )}

                  {/* Mobile Number and Email */}
                  <div className="row mb-2">
                    <div className="col-md-6">
                      <Form.Item
                        label="Mobile Number"
                        name="mobile_number"
                        rules={[
                          {
                            required: true,
                            message: "Please enter the mobile number",
                          },
                          {
                            pattern: /^\d{10}$/,
                            message: "Mobile number must be 10 digits!",
                          },
                        ]}
                      >
                       <InputWithAddon
  icon={<PhoneOutlined />}
  placeholder="Enter mobile number"
/>

                      </Form.Item>
                    </div>
                    <div className="col-md-6">
                      <Form.Item
                        label="Email ID"
                        name="email"
                        rules={[
                          {
                            type: "email",
                            message: "Please enter a valid email",
                          },
                        ]}
                      >
                      <InputWithAddon
  icon={<MailOutlined />}
  placeholder="Enter email ID"
/>

                      </Form.Item>
                    </div>
                  </div>

                  {/* Address and Pincode */}
                  <div className="row mb-2">
                    <div className="col-md-6">
                      <Form.Item label="Address" name="address">
                        <Input.TextArea
                          autoSize={{ minRows: 2, maxRows: 6 }}
                          placeholder="Enter the address"
                          size="large"
                          allowClear
                        />
                      </Form.Item>
                    </div>
                    <div className="col-md-6">
                      <Form.Item
                        label="Pincode"
                        name="pin_code"
                        rules={[
                          {
                            pattern: /^\d{6}$/,
                            message: "Pincode must be 6 digits!",
                          },
                        ]}
                      >
                        <Input placeholder="Enter the pincode" size="large"  />
                      </Form.Item>
                    </div>
                  </div>

                  <Divider style={{ borderTop: "2px solid #d9d9d9" }} />

                  {/* Base Branch and Base Line Section */}
                  <Divider orientation="center">Base Assignment</Divider>
                  
                  <div className="row mb-2">
                    <div className="col-md-6">
                      <Form.Item
                        label="Base Branch"
                        name="baseBranchId"
                        rules={[
                          { required: true, message: "Please select a base branch" },
                        ]}
                      >
                        <Select
                          placeholder="Select base branch"
                          showSearch
                          size="large"
                          loading={branchLoader}
                          prefix={<BankOutlined />}
                          onChange={handleBaseBranchChange}
                        >
                          {branchList?.map((branch) => (
                            <Option key={branch.id} value={branch.id}>
                              {branch.branch_name}
                            </Option>
                          ))}
                        </Select>
                      </Form.Item>
                    </div>
                    <div className="col-md-6">
                      <Form.Item
                        label="Base Line"
                        name="baseLineId"
                        rules={[
                          { required: true, message: "Please select a base line" },
                        ]}
                      >
                        <Select
                          placeholder={selectedBaseBranch ? "Select base line" : "Select base branch first"}
                          showSearch
                          size="large"
                          loading={lineLoader}
                          prefix={<ApartmentOutlined />}
                         disabled={selectedBaseBranch === null || selectedBaseBranch === undefined}
                        >
                          {baseLineList.map((option) => (
                            <Option key={option.id} value={option.id}>
                              {option.lineName}
                            </Option>
                          ))}
                        </Select>
                      </Form.Item>
                    </div>
                  </div>

                  <Divider style={{ borderTop: "2px solid #d9d9d9" }} />

                  {/* User Role & Assignment Section */}
                  <Divider orientation="center">User Role & Assignment</Divider>
                  
                  <div className="row mb-2">
                    <div className="col-md-6">
                      <Form.Item
                        label="Role"
                        name="role"
                        rules={[
                          { required: true, message: "Please select a role" },
                        ]}
                      >
                        <Select
                          placeholder="Choose User Role"
                          showSearch
                          size="large"
                          onChange={handleRoleChange}
                          prefix={<UserOutlined/>}
                        
                        >
                          <Option value="owner">Owner</Option>
                          <Option value="manager">Manager</Option>
                          <Option value="agent">Agent</Option>
                        </Select>
                      </Form.Item>
                    </div>
                    <div className="col-md-6">
                      <Form.Item
                        label="Branch"
                        name="branchId"
                        rules={[
                          { required: true, message: "Please select a branch" },
                        ]}
                      >
                        <Select
                          placeholder="Select branch"
                          showSearch
                          size="large"
                          loading={branchLoader}
                          mode="multiple"
                          prefix={<BankOutlined />}
                          allowClear
                          onChange={handleBranchChange} 
                        >
                          {branchList?.map((branch) => (
                            <Option key={branch.id} value={branch.id}>
                              {branch.branch_name}
                            </Option>
                          ))}
                        </Select>
                      </Form.Item>
                    </div>
                  </div>

                  {selectedRole && selectedRole === "agent" && (
                    <div className="row mb-2">
                      <div className="col-md-6">
                        <Form.Item
                          label="Line"
                          name="lineId"
                          rules={[
                            { required: true, message: "Please select a line" },
                          ]}
                        >
                          <Select
                            placeholder={selectedBranches.length > 0 ? "Select Line" : "Select branches first"}
                            showSearch
                            size="large"
                            loading={lineLoader}
                            mode="multiple"
                            prefix={<ApartmentOutlined />}
                            disabled={!selectedBranches || selectedBranches.length === 0}
                          >
                            {filteredLineList.map((option) => (
                              <Option key={option.id} value={option.id}>
                                {option.lineName}
                              </Option>
                            ))}
                          </Select>
                        </Form.Item>
                      </div>
                      <div className="col-md-6">
                        <Form.Item
                          label="Allow to see old Transaction?"
                          name="allowTransaction"
                          valuePropName="checked"
                        >
                          <Switch
                            checkedChildren="Yes"
                            unCheckedChildren="No"
                            defaultChecked
                          />
                        </Form.Item>
                      </div>
                    </div>
                  )}

                  {selectedRole && (selectedRole === "owner" || selectedRole === "manager") && (
                    <div className="row mb-2">
                      <div className="col-md-6">
                        <Form.Item
                          label="Allow to see old Transaction?"
                          name="allowTransaction"
                          valuePropName="checked"
                        >
                          <Switch
                            checkedChildren="Yes"
                            unCheckedChildren="No"
                            defaultChecked
                          />
                        </Form.Item>
                      </div>
                    </div>
                  )}

                  <Divider style={{ borderTop: "2px solid #d9d9d9" }} />

                  {/* User Expense Mapping Section */}
                  <Divider orientation="center">User Expense Mapping</Divider>
                  
                  {expenseMappings.map((mapping, index) => (
                    <div key={mapping.id} className="row mb-4">
                      {expenseMappings.length > 1 && (
                        <Divider orientation="center">
                          {`Expense Mapping ${index + 1}`}
                        </Divider>
                      )}
                      
                      {/* Line Name field */}
                      <div className="col-md-6">
                        <Form.Item
                          label="Line Name"
                          // We enforce that expenses must be selected, so making line optional only for Owner/Manager when global mapping is available.
                          rules={
                            (selectedRole === 'agent' || mapping.lineId !== null)
                            ? [{ required: true, message: "Please select a line" }]
                            : []
                          }
                        > 
                          <Select
                            placeholder={
                              (selectedBranches.length > 0)
                                ? "Select Line (Filtered by Branch)"
                                : "Select branches first"
                            }
                            showSearch
                            size="large"
                            loading={lineLoader}
                            value={mapping.lineId}
                            onChange={(value) => updateExpenseMapping(mapping.id, 'lineId', value)}
                            prefix={<ApartmentOutlined />}
                            // The select is disabled if no branches are selected
                            disabled={!selectedBranches || selectedBranches.length === 0}
                          >
                             {/* Option for global mapping (only for Owner/Manager) */}
                            {(selectedRole === "owner" || selectedRole === "manager") && (
                              <Option key="global" value={null}>
                                Global (Applies to all assigned lines)
                              </Option>
                            )}
                            
                            {/* Show lines filtered by selected branches for ALL roles */}
                            {filteredLineList.map((option) => (
                              <Option key={option.id} value={option.id}>
                                {option.lineName}
                              </Option>
                            ))}
                          </Select>
                        </Form.Item>
                      </div>
                      
                      {/* User Expense Type field [MODIFIED: Uses filtering function & Disabled logic] */}
                      <div className="col-md-6">
                        <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
                          <Form.Item
                            label="User Expense Type"
                            required
                            style={{ flexGrow: 1 }}
                          >
                           <Select
  mode="multiple"
  placeholder="Search and select expenses"
  value={mapping.expanses}
  onChange={(value) =>{
    console.log("Selected value:", value);
    console.log("Current mapping.expanses:", mapping.expanses);
     updateExpenseMapping(mapping.id, 'expanses', value)}}
  // [FIXED] Improved filterOption to handle all cases properly
  filterOption={(input, option) => {
    // If no search input, show all options
    if (!input) return true;
    
    // Get the searchable text from option.name prop or children
    const searchText = option.name || (typeof option.children === 'string' ? option.children : '');
    return searchText.toLowerCase().includes(input.toLowerCase());
  }}
  loading={expenseLoading}
  showSearch
  allowClear
  size="large"
  prefix={<DollarOutlined />}
  notFoundContent={
    expenseLoading ? "Loading..." : "No expenses found"
  }
>
  {getFilteredExpenseOptions(mapping.lineId).map((option) => (
    <Option key={option.value} value={option.value} name={option.name}>
      {option.label}
    </Option>
  ))}
</Select>
                          </Form.Item>

                          {/* Minus Button (remains unchanged) */}
                          {expenseMappings.length > 1 && (
                            <Button
                              type="primary"
                              danger
                              shape="circle"
                              icon={<MinusOutlined />}
                              onClick={() => removeExpenseMapping(index)}
                              style={{
                                width: 33,
                                height: 33,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                backgroundColor: "#ff4d4f",
                                borderColor: "#ff4d4f",
                                color: "#fff",
                                marginTop: "30px",
                                flexShrink: 0
                              }}
                            />
                          )}
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Add button at the bottom */}
                  <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "-15px" }}>
                    <Button
                      type="primary"
                      shape="circle"
                      icon={<PlusOutlined />}
                      onClick={addExpenseMapping}
                      style={{
                        width: 35,
                        height: 35,
                        backgroundColor: "#28a745",
                        borderColor: "#28a745",
                        color: "#fff",
                      }}
                    />
                  </div>

                  <Divider style={{ borderTop: "2px solid #d9d9d9" }} />

                  {/* Form Actions */}
                  <div className="text-center mt-4">
                    <Space size="large">
                      <Button type="primary" htmlType="submit" loading={loading} size="large">
                        {isEditMode ? "Update User" : "Add User"}
                      </Button>
                      <Button
                        size="large"
                        onClick={handleBack}
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
      </div>
    </>
  );
};

export default AddUser;