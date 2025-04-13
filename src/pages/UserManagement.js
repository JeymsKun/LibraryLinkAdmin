import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Button,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Avatar,
  IconButton,
  Menu,
  MenuItem,
  Tooltip,
} from "@mui/material";
import { MoreVert as MoreVertIcon } from "@mui/icons-material";
import { supabase } from "../supabase/client";
import "../css/UserManagement.css";

const UserManagement = ({ onAddUserClick }) => {
  const [admins, setAdmins] = useState([]);
  const [staffs, setStaffs] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewType, setViewType] = useState("Admin");
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  useEffect(() => {
    const fetchUsers = async () => {
      const { data: adminData, error: adminError } = await supabase
        .from("admin")
        .select("*");

      const { data: staffData, error: staffError } = await supabase
        .from("staff")
        .select("*");

      if (adminError || staffError) {
        console.error("Error fetching users:", adminError || staffError);
      } else {
        setAdmins(adminData);
        setStaffs(staffData);
      }
    };

    fetchUsers();
  }, []);

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "numeric",
      hour12: true,
    }).format(date);
  };

  const handleMenuClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = (type) => {
    if (type) setViewType(type);
    setAnchorEl(null);
  };

  const getFilteredData = () => {
    const data = viewType === "Admin" ? admins : staffs;

    return data.filter((user) => {
      const name =
        viewType === "Admin"
          ? `${user.first_name} ${user.last_name}`
          : user.full_name;

      return (
        user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    });
  };

  const filteredUsers = getFilteredData();

  return (
    <Box sx={{ p: { xs: 2, sm: 4 } }}>
      <Typography variant="h5" gutterBottom>
        User Management
      </Typography>

      <Box
        className="search-add-container"
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 2,
        }}
      >
        <TextField
          label="Search by Name or Email"
          variant="outlined"
          value={searchQuery}
          onChange={handleSearchChange}
          className="search-bar"
        />
        <Box sx={{ display: "flex", gap: 1 }}>
          <Button
            variant="contained"
            color="primary"
            onClick={onAddUserClick}
            className="add-user-button"
          >
            Add User
          </Button>

          <Tooltip title="Switch View">
            <IconButton onClick={handleMenuClick}>
              <MoreVertIcon />
            </IconButton>
          </Tooltip>

          <Menu
            anchorEl={anchorEl}
            open={open}
            onClose={() => handleMenuClose()}
          >
            <MenuItem onClick={() => handleMenuClose("Admin")}>Admin</MenuItem>
            <MenuItem onClick={() => handleMenuClose("Staff")}>Staff</MenuItem>
          </Menu>
        </Box>
      </Box>

      <Typography variant="subtitle1" gutterBottom>
        Viewing: {viewType}
      </Typography>

      <TableContainer component={Paper} className="responsive-table-container">
        <Table aria-label="user table">
          <TableHead>
            <TableRow>
              {viewType === "Admin" ? (
                <>
                  <TableCell sx={{ fontWeight: "bold" }}>Admin Name</TableCell>
                  <TableCell sx={{ fontWeight: "bold" }}>Email</TableCell>
                  <TableCell sx={{ fontWeight: "bold" }}>
                    Created Date
                  </TableCell>
                  <TableCell sx={{ fontWeight: "bold" }}>Status</TableCell>
                </>
              ) : (
                <>
                  <TableCell sx={{ fontWeight: "bold" }}>Staff ID</TableCell>
                  <TableCell sx={{ fontWeight: "bold" }}>Staff Name</TableCell>
                  <TableCell sx={{ fontWeight: "bold" }}>Email</TableCell>
                  <TableCell sx={{ fontWeight: "bold" }}>
                    Created Date
                  </TableCell>
                  <TableCell sx={{ fontWeight: "bold" }}>Status</TableCell>
                </>
              )}
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredUsers.length > 0 ? (
              filteredUsers.map((user) => {
                const fullName =
                  viewType === "Admin"
                    ? `${user.first_name} ${user.last_name}`
                    : `${user.first_name} ${user.middle_name || ""} ${
                        user.last_name
                      }`.trim();
                const initials = fullName
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase()
                  .slice(0, 2);

                return (
                  <TableRow key={user.id || user.staff_id}>
                    {viewType === "Admin" ? (
                      <>
                        <TableCell>
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1,
                            }}
                          >
                            <Avatar>{initials}</Avatar>
                            {fullName}
                          </Box>
                        </TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>{formatDate(user.created_at)}</TableCell>
                        <TableCell>{user.status || "Active"}</TableCell>
                      </>
                    ) : (
                      <>
                        <TableCell>{user.staff_id}</TableCell>
                        <TableCell>
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1,
                            }}
                          >
                            {fullName}
                          </Box>
                        </TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>{formatDate(user.created_at)}</TableCell>
                        <TableCell>{user.status || "Active"}</TableCell>
                      </>
                    )}
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell
                  colSpan={viewType === "Admin" ? 4 : 5}
                  align="center"
                >
                  No results found for your search.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default UserManagement;
