import React from "react";
import { Descriptions, Tag } from "antd";

const UserCollapseContent = ({ user }) => {
  if (!user) return null;

  // Helper function to group line allocations by branch
  const getLineAllocationsByBranch = (allocations) => {
    if (!allocations || allocations.length === 0) {
      return {};
    }
    
    const branchMap = {};
    
    allocations.forEach(allocation => {
      const branchName = allocation.branch_name || "Unknown Branch";
      const lineName = allocation.line_name || "Unknown Line";
      
      if (!branchMap[branchName]) {
        branchMap[branchName] = new Set();
      }
      branchMap[branchName].add(lineName);
    });
    
    // Convert Sets to Arrays
    Object.keys(branchMap).forEach(branch => {
      branchMap[branch] = Array.from(branchMap[branch]);
    });
    
    return branchMap;
  };

  // Helper function to get expense mappings with their actual branch and line
  const getExpenseMappings = (expenses) => {
    if (!expenses || expenses.length === 0) {
      return [];
    }
    
    // Map expenses using their own branch and line data
    return expenses.map(expense => {
      return {
        expenseId: expense.expense,
        expenseName: expense.expense_name || `Expense ID: ${expense.expense}`,
        branch: expense.expense_branch_name || "N/A",
        line: expense.expense_line_name || "N/A"
      };
    });
  };

  const lineAllocationsByBranch = getLineAllocationsByBranch(user.line_allocations);
  const expenseMappings = getExpenseMappings(user.user_expenses);

  // Helper function to extract unique areas
  const getAreas = (allocations) => {
    if (!allocations || allocations.length === 0) return [];
    return [...new Set(allocations.map(a => a.area_name).filter(Boolean))];
  };

  const areas = getAreas(user.line_allocations);

  return (
    <div style={{ background: "#fff", padding: "0px 0px" }}>
      <Descriptions
        bordered
        size="small"
        column={{ xs: 1, sm: 2, md: 3 }}
        labelStyle={{
          fontWeight: 700,
          background: "#e5e4e4ff",
          width: "140px",
        }}
      >
        <Descriptions.Item label="User ID">
          {user.id || "N/A"}
        </Descriptions.Item>
        <Descriptions.Item label="Username">
          {user.username || "N/A"}
        </Descriptions.Item>
        <Descriptions.Item label="Full Name">
          {user.full_name || "N/A"}
        </Descriptions.Item>
        <Descriptions.Item label="Email">
          {user.email || "N/A"}
        </Descriptions.Item>
        <Descriptions.Item label="Mobile">
          {user.mobile_number || "N/A"}
        </Descriptions.Item>
        <Descriptions.Item label="Role">
          {user.role?.toUpperCase() || "N/A"}
        </Descriptions.Item>
        
        <Descriptions.Item label="Line Mapping" span={3}>
          {Object.keys(lineAllocationsByBranch).length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {Object.entries(lineAllocationsByBranch).map(([branch, lines]) => (
                <div key={branch}>
                  <Tag color="blue" style={{ marginRight: '8px', minWidth: '120px' }}>
                    {branch}  <span> : {lines.join(", ")}</span>
                  </Tag>
                 
                </div>
              ))}
            </div>
          ) : (
            "N/A"
          )}
        </Descriptions.Item>

        <Descriptions.Item label="Area(s)" span={3}>
          {areas.length > 0 ? areas.join(", ") : "N/A"}
        </Descriptions.Item>

        <Descriptions.Item label="Base Branch">
          {user.line_allocations?.[0]?.base_branch_name || "N/A"}
        </Descriptions.Item>
        <Descriptions.Item label="Base Line" span={2}>
          {user.line_allocations?.[0]?.base_line_name || "N/A"}
        </Descriptions.Item>
        
        <Descriptions.Item label="Expense Mapping" span={3}>
          {expenseMappings.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px'}}>
              {expenseMappings.map((mapping, index) => (
                <div key={index} style={{ fontSize: '13px', overflow: "auto" }}>
                  <span style={{ fontWeight: 600 }}><Tag color="blue" style={{ marginRight: '8px', minWidth: '120px', wordBreak: "break-word"}}>
                  {/* {mapping.branch} : {mapping.line} : {mapping.expenseName} */}
                  Sholinganallur new : Shollss : Petrol
                  </Tag></span>
                  {/* <span style={{ marginLeft: '8px' }}>{mapping.expenseName}</span> */}
                </div>
              ))}
            </div>
          ) : (
            "N/A"
          )}
        </Descriptions.Item>

        <Descriptions.Item label="Address" span={2}>
          {user.address || "N/A"}
        </Descriptions.Item>
        <Descriptions.Item label="Pin Code">
          {user.pin_code || "N/A"}
        </Descriptions.Item>
        <Descriptions.Item label="Allow Old Transaction">
          {user.allow_old_transaction ? "Yes" : "No"}
        </Descriptions.Item>
        <Descriptions.Item label="Created" span={2}>
          {user.created_ts ? new Date(user.created_ts).toLocaleString() : "N/A"}
        </Descriptions.Item>
      </Descriptions>
    </div>
  );
};

export default UserCollapseContent;