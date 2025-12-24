/* eslint-disable no-unused-vars */
import React, { useState, useEffect, useCallback } from "react";
import { Button, notification, FloatButton, Form, Input, Modal, Image, Menu, Dropdown, Popconfirm, Tag } from "antd";
import { PlusOutlined, ReloadOutlined, SearchOutlined, ExclamationCircleOutlined, DeleteFilled, EllipsisOutlined } from "@ant-design/icons";
import { GET_BRANCHES, DELETE, GET } from "helpers/api_helper";
import { ADD_BRANCH } from "helpers/url_helper";
import Loader from "components/Common/Loader";
import BranchCollapseContent from "components/Common/BranchCollapseContent";
import "./ListBranch.css";
import { useNavigate } from "react-router-dom";
import branchIcon from "../../../assets/icons/bank.png";
import SwipeablePanel from "components/Common/SwipeablePanel";
import BranchNameModal from "components/Common/BranchNameModal";

const ListBranch = () => {
  const [loading, setLoading] = useState(false);
  const [branches, setBranches] = useState([]);
  const [deleteLoader, setDeleteLoader] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [branchDetails, setBranchDetails] = useState({});
  const [searchModalVisible, setSearchModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [searchTerm, setSearchTerm] = useState("");
  const [allBranches, setAllBranches] = useState([]);
  const [isMobile, setIsMobile] = useState(false);
  const [openSwipeId, setOpenSwipeId] = useState(null);
  const navigate = useNavigate();
  
  const [branchModalVisible, setBranchModalVisible] = useState(false);
  const [selectedBranchName, setSelectedBranchName] = useState("");
  const [selectedBranchId, setSelectedBranchId] = useState(null); // New state for branch ID
  const [isInitialized, setIsInitialized] = useState(false);
  const [hasBranchSelected, setHasBranchSelected] = useState(false);

  useEffect(() => {
    const savedBranch = localStorage.getItem("selected_branch_name");
    const savedBranchId = localStorage.getItem("selected_branch_id"); // Get saved ID
    
    if (savedBranch && savedBranchId) {
      setSelectedBranchName(savedBranch);
      setSelectedBranchId(savedBranchId);
      setHasBranchSelected(true);
      setIsInitialized(true);
    } else {
      const checkToken = () => {
        const token = localStorage.getItem("access_token");
        if (token) {
          setIsInitialized(true);
          setBranchModalVisible(true);
        } else {
          setTimeout(checkToken, 300);
        }
      };
      checkToken();
    }
  }, []);

  const handleSaveBranchName = (name, id) => {
    // Now accepts both name and id as parameters
    localStorage.setItem("selected_branch_name", name);
    localStorage.setItem("selected_branch_id", id); // Save the ID
    setSelectedBranchName(name);
    setSelectedBranchId(id);
    setHasBranchSelected(true);
    setBranchModalVisible(false);
    window.location.reload();
  };

  const handleCancelBranchModal = () => {
    notification.warning({
      message: "Branch Name Required",
      description: "Please select a branch name to continue",
    });
  };

  const onDelete = async (record) => {
    try {
      setDeleteLoader(true);
      const response = await DELETE(`${ADD_BRANCH}${record.id}`);

      if (response?.status === 200) {
        setBranches((prev) => prev.filter((item) => item.id !== record.id));
        setAllBranches((prev) => prev.filter((item) => item.id !== record.id));
        
        // If the deleted branch is the currently selected one, clear selection
        if (record.id === selectedBranchId) {
          localStorage.removeItem("selected_branch_name");
          localStorage.removeItem("selected_branch_id");
          setSelectedBranchName("");
          setSelectedBranchId(null);
          setHasBranchSelected(false);
          setBranchModalVisible(true);
        }
        
        notification.success({
          message: `${record.branch_name?.toUpperCase()} Branch Deleted!`,
          description: "The branch has been deleted successfully.",
          duration: 2,
        });
      } else {
        notification.error({
          message: "Delete Failed",
          description: "The branch could not be deleted.",
        });
      }
    } catch (error) {
      console.error("Error deleting branch:", error);
      notification.error({
        message: "Error",
        description: "An error occurred while deleting the branch.",
      });
    } finally {
      setDeleteLoader(false);
      setShowConfirm(false);
      setOpenSwipeId(null);
    }
  };

  const fetchBranchDetails = useCallback(async (branchId) => {
    setBranchDetails((prev) => {
      if (prev[branchId]) {
        return prev;
      }
      
      (async () => {
        try {
          const response = await GET(`/api/branch/${branchId}/`);
          if (response?.status === 200) {
            setBranchDetails((current) => ({
              ...current,
              [branchId]: response.data,
            }));
          }
        } catch (error) {
          console.error("Error fetching branch details:", error);
        }
      })();
      
      return prev;
    });
  }, []);

  const getBranchesList = useCallback(async () => {
    if (!hasBranchSelected) {
      return;
    }

    setLoading(true);
    try {
      const response = await GET_BRANCHES(ADD_BRANCH);
      if (response?.status === 200) {
        const allBranchesData = response.data;
        setBranches(allBranchesData);
        
        const savedBranchName = localStorage.getItem("selected_branch_name");
        const savedBranchId = localStorage.getItem("selected_branch_id");
        
        if (savedBranchName && savedBranchId) {
          // Filter by both name and ID for extra safety
          const filtered = allBranchesData.filter(
            (branch) => branch.branch_name === savedBranchName && branch.id === parseInt(savedBranchId)
          );
          
          // If no match found, the saved branch might have been deleted
          if (filtered.length === 0) {
            notification.warning({
              message: "Branch Not Found",
              description: "The previously selected branch no longer exists. Please select a new branch.",
            });
            localStorage.removeItem("selected_branch_name");
            localStorage.removeItem("selected_branch_id");
            setHasBranchSelected(false);
            setBranchModalVisible(true);
            setLoading(false);
            return;
          }
          
          setAllBranches(filtered);
          
          filtered.forEach(branch => {
            fetchBranchDetails(branch.id);
          });
        } else {
          setAllBranches(allBranchesData);
          
          allBranchesData.forEach(branch => {
            fetchBranchDetails(branch.id);
          });
        }
      }
    } catch (error) {
      console.error("Error fetching branches:", error);
    } finally {
      setLoading(false);
    }
  }, [fetchBranchDetails, hasBranchSelected]);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (token && hasBranchSelected) {
      getBranchesList();
    } else if (token && !hasBranchSelected) {
      setTimeout(() => {
        const retryToken = localStorage.getItem("access_token");
        const savedBranch = localStorage.getItem("selected_branch_name");
        const savedBranchId = localStorage.getItem("selected_branch_id");
        if (retryToken && savedBranch && savedBranchId) {
          getBranchesList();
        }
      }, 300);
    }
  }, [getBranchesList, hasBranchSelected]);

  const showSearchModal = () => setSearchModalVisible(true);
  const handleCancel = () => setSearchModalVisible(false);
  
  const handleSearch = () => {
    const { branchName } = form.getFieldsValue();
    if (!branchName) {
      notification.warning({
        message: "No Input",
        description: "Please enter a branch name to search.",
      });
      return;
    }

    const searchValue = branchName.toLowerCase().trim();
    setSearchTerm(searchValue);

    const savedBranchName = localStorage.getItem("selected_branch_name");
    const baseFiltered = savedBranchName 
      ? branches.filter(b => b.branch_name === savedBranchName)
      : branches;

    const filtered = baseFiltered.filter(
      (b) => b.branch_name?.toLowerCase().includes(searchValue)
    );

    if (filtered.length === 0) {
      notification.warning({
        message: "No Results",
        description: "No branches found matching your search.",
      });
    }

    setAllBranches(filtered);
    
    filtered.forEach(branch => {
      fetchBranchDetails(branch.id);
    });
    
    setSearchModalVisible(false);
  };

  const handleReset = () => {
    form.resetFields();
    setSearchTerm("");
    
    const savedBranchName = localStorage.getItem("selected_branch_name");
    if (savedBranchName) {
      const filtered = branches.filter(
        (branch) => branch.branch_name === savedBranchName
      );
      setAllBranches(filtered);
      
      filtered.forEach(branch => {
        fetchBranchDetails(branch.id);
      });
    } else {
      setAllBranches(branches);
      
      branches.forEach(branch => {
        fetchBranchDetails(branch.id);
      });
    }
    setOpenSwipeId(null);
  };

  const handleSwipeStateChange = (branchId, isOpen) => {
    if (isOpen) {
      setOpenSwipeId(branchId);
    } else if (openSwipeId === branchId) {
      setOpenSwipeId(null);
    }
  };

  const renderMenu = (branch) => (
    <Menu>
      <Menu.Item
        key="edit"
        onClick={(e) => {
          e.domEvent.stopPropagation();
          navigate(`/branch/edit/${branch.id}`);
        }}
      >
        <div className="d-flex align-items-center gap-1">
          <span className="mdi mdi-pencil text-secondary mb-0"></span>
          <span>Edit</span>
        </div>
      </Menu.Item>

      <Menu.Item key="delete">
        <Popconfirm
          title={`Delete branch ${branch.branch_name}?`}
          description="Are you sure you want to delete?"
          icon={<ExclamationCircleOutlined style={{ color: "red" }} />}
          onConfirm={(e) => {
            e.stopPropagation();
            onDelete(branch);
          }}
          okText="Delete"
          cancelText="Cancel"
          okButtonProps={{ danger: true, type: "primary" }}
          cancelButtonProps={{ type: "default" }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="d-flex align-items-center gap-1" style={{ color: "red" }}>
            <DeleteFilled style={{ color: "red" }} />
            <span>Delete</span>
          </div>
        </Popconfirm>
      </Menu.Item>
    </Menu>
  );

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleEditBranch = (branch) => {
    setOpenSwipeId(null);
    navigate(`/branch/edit/${branch.id}`);
  };

  const handleDeleteBranch = (branch) => {
    setOpenSwipeId(null);
    onDelete(branch);
  };

  if (!hasBranchSelected) {
    return (
      <div className="list-branch-page-content">
        {isInitialized && (
          <BranchNameModal
            visible={branchModalVisible}
            onSave={handleSaveBranchName}
            onCancel={handleCancelBranchModal}
          />
        )}
      </div>
    );
  }

  return (
    <div className="list-branch-page-content">
      {loading && <Loader />}

      <div className="list-branch-header">
        <h2 className="list-branch-title">Branch List</h2>
      </div>

      <div className="list-branch-scrollable-div">
        {searchTerm && (
          <div className="list-branch-search-results">
            <Tag color="blue" style={{ fontSize: 14, padding: "2px 8px" }}>
              Pattern: {searchTerm}
            </Tag>
          </div>
        )}
        
        {allBranches.length === 0 ? (
          <div className="list-branch-no-data">
            <p style={{ fontSize: "16px", marginBottom: "8px" }}>No branches found</p>
            <p style={{ fontSize: "14px" }}>Try adjusting your search or filters</p>
          </div>
        ) : (
          allBranches.map((branch, index) => {
            const details = branchDetails[branch.id];

            return (
              <div key={branch.id} className="list-branch-item-wrapper">
                {isMobile ? (
                  <div>
                    <SwipeablePanel
                      item={branch}
                      icon={branchIcon}
                      index={index}
                      titleKey="branch_name"
                      name="branch"
                      showIndex={false}
                      onSwipeRight={() => handleEditBranch(branch)}
                      onSwipeLeft={() => handleDeleteBranch(branch)}
                      isExpanded={false}
                      isSwipeOpen={openSwipeId === branch.id}
                      onSwipeStateChange={(isOpen) => handleSwipeStateChange(branch.id, isOpen)}
                    />
                    <div >
                      <BranchCollapseContent branch={branch} details={details} />
                    </div>
                  </div>
                ) : (
                  <div className="list-branch-accordion-container">
                    <div className="list-branch-accordion-header list-branch-accordion-header-expanded">
                      <div className="list-branch-accordion-title-container">
                        <Image src={branchIcon} width={30} height={30} preview={false}  />
                        <span className="list-branch-accordion-title">{branch.branch_name}</span>
                      </div>
                      <div className="list-branch-accordion-actions">
                        <Dropdown overlay={renderMenu(branch)} trigger={["click"]}>
                          <EllipsisOutlined
                            className="list-branch-ellipsis-icon"
                            onClick={(e) => e.stopPropagation()}
                          />
                        </Dropdown>
                      </div>
                    </div>

                    <div className="list-branch-accordion-content">
                      <BranchCollapseContent branch={branch} details={details} />
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      <Modal
        title={<div className="list-branch-modal-title">Search Branches</div>}
        open={searchModalVisible}
        onOk={handleSearch}
        onCancel={handleCancel}
        okText="Search"
        cancelText="Cancel"
        width={500}
      >
        <Form form={form} layout="vertical">
          <Form.Item label="Branch Name" name="branchName">
            <Input
              placeholder="Enter branch name to search"
              allowClear
              onChange={(e) => {
                const value = e.target.value.trim();
                if (value === "") {
                  getBranchesList();
                }
              }}
            />
          </Form.Item>
        </Form>
      </Modal>

      <FloatButton
        icon={<PlusOutlined />}
        type="primary"
        className="list-branch-float-button"
        onClick={() => (window.location.href = "/branch/add")}
      />

      {isInitialized && (
        <BranchNameModal
          visible={branchModalVisible}
          onSave={handleSaveBranchName}
          onCancel={handleCancelBranchModal}
        />
      )}
    </div>
  );
};

export default ListBranch;