import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Card,
  Table,
  Button,
  Modal,
  Form,
  Pagination,
  Badge,
  Spinner,
  Alert,
  Row,
  Col,
} from "react-bootstrap";
import {
  fetchUsers,
  updateUserRoles,
  setPage,
  createUser,
  deleteUser,
  disableUser,
} from "../../store/adminSlice";
import {
  FaEdit,
  FaSearch,
  FaUserPlus,
  FaInfoCircle,
  FaBan,
  FaCheck,
} from "react-icons/fa";

const AdminUsersPage = () => {
  const dispatch = useDispatch();
  const { users, loading, error, totalCount, currentPage, pageSize } =
    useSelector((state) => state.admin);

  // Local state
  const [searchTerm, setSearchTerm] = useState("");
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDisableModal, setShowDisableModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [disableAction, setDisableAction] = useState(true); // true = disable, false = enable
  const [selectedRoles, setSelectedRoles] = useState([]);
  const [filterRole, setFilterRole] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Create user form state
  const [createUserForm, setCreateUserForm] = useState({
    username: "",
    email: "",
    password: "",
    firstName: "",
    lastName: "",
    roles: ["User"],
  });

  // Available roles
  const availableRoles = ["User", "Admin", "Editor", "Moderator"];

  // Calculate total pages
  const totalPages = Math.ceil(totalCount / pageSize);

  useEffect(() => {
    loadUsers();
  }, [dispatch, currentPage, pageSize, filterRole]);

  // Clear success message after 5 seconds
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage("");
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  const loadUsers = () => {
    // Prepare filter params
    const params = {
      page: currentPage,
      pageSize,
      searchTerm: searchTerm || undefined,
      role: filterRole || undefined,
    };

    dispatch(fetchUsers(params));
  };

  const handleSearch = (e) => {
    e.preventDefault();
    dispatch(setPage(1)); // Reset to first page on new search
    loadUsers();
  };

  const handlePageChange = (page) => {
    dispatch(setPage(page));
  };

  const handleFilterChange = (role) => {
    setFilterRole(role);
    dispatch(setPage(1)); // Reset to first page on filter change
  };

  const handleEditUser = (user) => {
    setSelectedUser(user);
    setSelectedRoles(user.roles || []);
    setShowEditModal(true);
  };

  const handleDisableUserModal = (user, disable = true) => {
    setSelectedUser(user);
    setDisableAction(disable);
    setShowDisableModal(true);
  };

  const handleDisableUser = () => {
    if (selectedUser) {
      dispatch(disableUser({ userId: selectedUser.id, disable: disableAction }))
        .unwrap()
        .then(() => {
          setShowDisableModal(false);
          const action = disableAction ? "disabled" : "enabled";
          setSuccessMessage(`User ${selectedUser.username} has been ${action}.`);
          setSelectedUser(null);
        })
        .catch((error) => {
          console.error("Failed to update user status:", error);
        });
    }
  };

  const handleRoleChange = (role) => {
    if (selectedRoles.includes(role)) {
      setSelectedRoles(selectedRoles.filter((r) => r !== role));
    } else {
      setSelectedRoles([...selectedRoles, role]);
    }
  };

  const handleCreateRoleChange = (role) => {
    const currentRoles = [...createUserForm.roles];
    if (currentRoles.includes(role)) {
      setCreateUserForm({
        ...createUserForm,
        roles: currentRoles.filter((r) => r !== role),
      });
    } else {
      setCreateUserForm({
        ...createUserForm,
        roles: [...currentRoles, role],
      });
    }
  };

  const handleSaveRoles = () => {
    if (selectedUser) {
      dispatch(
        updateUserRoles({
          userId: selectedUser.id,
          roles: selectedRoles,
        })
      )
        .unwrap()
        .then(() => {
          setShowEditModal(false);
          setSuccessMessage(
            `Roles for ${selectedUser.username} have been updated.`
          );
        })
        .catch((error) => {
          console.error("Failed to update roles:", error);
        });
    }
  };

  const handleCreateUser = (e) => {
    e.preventDefault();

    dispatch(createUser(createUserForm))
      .unwrap()
      .then(() => {
        setShowCreateModal(false);
        setSuccessMessage(`User ${createUserForm.username} has been created.`);
        // Reset form
        setCreateUserForm({
          username: "",
          email: "",
          password: "",
          firstName: "",
          lastName: "",
          roles: ["User"],
        });
      })
      .catch((error) => {
        console.error("Failed to create user:", error);
      });
  };

  const handleCreateUserInputChange = (e) => {
    const { name, value } = e.target;
    setCreateUserForm({
      ...createUserForm,
      [name]: value,
    });
  };

  // Generate pagination items
  const paginationItems = [];
  for (let i = 1; i <= totalPages; i++) {
    paginationItems.push(
      <Pagination.Item
        key={i}
        active={i === currentPage}
        onClick={() => handlePageChange(i)}
      >
        {i}
      </Pagination.Item>
    );
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>User Management</h1>
        <Button variant="success" onClick={() => setShowCreateModal(true)}>
          <FaUserPlus className="me-2" />
          Create User
        </Button>
      </div>

      {error && (
        <Alert variant="danger" className="mb-4">
          {error}
        </Alert>
      )}

      {successMessage && (
        <Alert
          variant="success"
          className="mb-4"
          dismissible
          onClose={() => setSuccessMessage("")}
        >
          {successMessage}
        </Alert>
      )}

      <Card className="mb-4 bg-dark text-light">
        <Card.Body>
          <div className="d-flex justify-content-between align-items-center mb-4">
            <Form
              onSubmit={handleSearch}
              className="d-flex"
              style={{ width: "300px" }}
            >
              <Form.Control
                type="text"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-secondary text-light"
              />
              <Button type="submit" variant="primary" className="ms-2">
                <FaSearch />
              </Button>
            </Form>

            <div>
              <Button
                variant={filterRole === "" ? "primary" : "outline-primary"}
                className="me-2"
                onClick={() => handleFilterChange("")}
              >
                All
              </Button>
              {availableRoles.map((role) => (
                <Button
                  key={role}
                  variant={filterRole === role ? "primary" : "outline-primary"}
                  className="me-2"
                  onClick={() => handleFilterChange(role)}
                >
                  {role}s
                </Button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="text-center py-4">
              <Spinner animation="border" role="status">
                <span className="visually-hidden">Loading...</span>
              </Spinner>
            </div>
          ) : (
            <>
              <Table responsive hover variant="dark">
                <thead>
                  <tr className="text-primary">
                    <th>User ID</th>
                    <th>Username</th>
                    <th>Email</th>
                    <th>Roles</th>
                    <th>Status</th>
                    <th>Created Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users && users.length > 0 ? (
                    users.map((user) => (
                      <tr key={user.id}>
                        <td className="text-light">{user.id}</td>
                        <td className="text-light">{user.username}</td>
                        <td className="text-light">{user.email}</td>
                        <td>
                          {user.roles && user.roles.length > 0 ? (
                            user.roles.map((role) => (
                              <Badge
                                key={role}
                                bg={
                                  role === "Admin"
                                    ? "danger"
                                    : role === "Moderator"
                                    ? "warning"
                                    : "primary"
                                }
                                className="me-1"
                              >
                                {role}
                              </Badge>
                            ))
                          ) : (
                            <Badge bg="secondary">User</Badge>
                          )}
                        </td>
                        <td>
                          <Badge bg={user.isDisabled ? "danger" : "success"}>
                            {user.isDisabled ? "Disabled" : "Active"}
                          </Badge>
                        </td>
                        <td className="text-light">
                          {new Date(user.registrationDate).toLocaleDateString()}
                        </td>
                        <td>
                          <Button
                            variant="outline-primary"
                            size="sm"
                            className="me-2"
                            onClick={() => handleEditUser(user)}
                          >
                            <FaEdit /> Edit Roles
                          </Button>
                          {/* Show Enable/Disable based on current user status */}
                          {user.isDisabled ? (
                            <Button
                              variant="outline-success"
                              size="sm"
                              onClick={() => handleDisableUserModal(user, false)}
                              title="Enable User"
                            >
                              <FaCheck /> Enable
                            </Button>
                          ) : (
                            <Button
                              variant="outline-warning"
                              size="sm"
                              onClick={() => handleDisableUserModal(user, true)}
                              disabled={
                                user.roles && user.roles.includes("Admin")
                              }
                              title="Disable User"
                            >
                              <FaBan /> Disable
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="7" className="text-center">
                        No users found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </Table>

              {totalPages > 1 && (
                <div className="d-flex justify-content-center mt-4">
                  <Pagination>
                    <Pagination.First
                      onClick={() => handlePageChange(1)}
                      disabled={currentPage === 1}
                    />
                    <Pagination.Prev
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                    />
                    {paginationItems}
                    <Pagination.Next
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    />
                    <Pagination.Last
                      onClick={() => handlePageChange(totalPages)}
                      disabled={currentPage === totalPages}
                    />
                  </Pagination>
                </div>
              )}
            </>
          )}
        </Card.Body>
      </Card>

      {/* Edit User Modal */}
      <Modal
        show={showEditModal}
        onHide={() => setShowEditModal(false)}
        className="admin-content"
        contentClassName="bg-dark text-light"
      >
        <Modal.Header closeButton className="border-dark">
          <Modal.Title className="text-primary">Edit User Roles</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedUser && (
            <>
              <p>
                <strong className="text-primary">Username:</strong>{" "}
                <span className="text-light">{selectedUser.username}</span>
                <br />
                <strong className="text-primary">Email:</strong>{" "}
                <span className="text-light">{selectedUser.email}</span>
              </p>

              <Form>
                <Form.Group>
                  <Form.Label className="text-primary">Roles</Form.Label>
                  {availableRoles.map((role) => (
                    <Form.Check
                      key={role}
                      type="checkbox"
                      id={`role-${role}`}
                      label={role}
                      checked={selectedRoles.includes(role)}
                      onChange={() => handleRoleChange(role)}
                      className="mb-2 text-light"
                    />
                  ))}
                </Form.Group>
              </Form>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowEditModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSaveRoles}>
            Save Changes
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Create User Modal */}
      <Modal
        show={showCreateModal}
        onHide={() => setShowCreateModal(false)}
        className="admin-content"
        contentClassName="bg-dark text-light"
      >
        <Modal.Header closeButton className="border-dark">
          <Modal.Title className="text-primary">Create User</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleCreateUser}>
            <Form.Group className="mb-3">
              <Form.Label className="text-primary">Username</Form.Label>
              <Form.Control
                type="text"
                name="username"
                value={createUserForm.username}
                onChange={handleCreateUserInputChange}
                required
                className="bg-secondary text-light"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label className="text-primary">Email</Form.Label>
              <Form.Control
                type="email"
                name="email"
                value={createUserForm.email}
                onChange={handleCreateUserInputChange}
                required
                className="bg-secondary text-light"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label className="text-primary">Password</Form.Label>
              <Form.Control
                type="password"
                name="password"
                value={createUserForm.password}
                onChange={handleCreateUserInputChange}
                required
                className="bg-secondary text-light"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label className="text-primary">First Name</Form.Label>
              <Form.Control
                type="text"
                name="firstName"
                value={createUserForm.firstName}
                onChange={handleCreateUserInputChange}
                className="bg-secondary text-light"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label className="text-primary">Last Name</Form.Label>
              <Form.Control
                type="text"
                name="lastName"
                value={createUserForm.lastName}
                onChange={handleCreateUserInputChange}
                className="bg-secondary text-light"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label className="text-primary">Roles</Form.Label>
              {availableRoles.map((role) => (
                <Form.Check
                  key={role}
                  type="checkbox"
                  id={`create-role-${role}`}
                  label={role}
                  checked={createUserForm.roles.includes(role)}
                  onChange={() => handleCreateRoleChange(role)}
                  className="mb-2 text-light"
                />
              ))}
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowCreateModal(false)}>
            Cancel
          </Button>
          <Button variant="success" onClick={handleCreateUser}>
            Create User
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Disable/Enable User Modal */}
      <Modal
        show={showDisableModal}
        onHide={() => setShowDisableModal(false)}
        className="admin-content"
        contentClassName="bg-dark text-light"
      >
        <Modal.Header closeButton className="border-dark">
          <Modal.Title className="text-primary">
            {disableAction ? "Disable User" : "Enable User"}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedUser && (
            <p>
              Are you sure you want to {disableAction ? "disable" : "enable"} user{" "}
              <strong className="text-warning">{selectedUser.username}</strong>?
              {disableAction && (
                <span className="d-block mt-2 text-muted">
                  <small>The user will not be able to log in when disabled.</small>
                </span>
              )}
            </p>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDisableModal(false)}>
            Cancel
          </Button>
          <Button 
            variant={disableAction ? "warning" : "success"} 
            onClick={handleDisableUser}
          >
            {disableAction ? "Disable User" : "Enable User"}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default AdminUsersPage;
