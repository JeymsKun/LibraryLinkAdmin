import React, { useEffect, useState } from "react";
import {
  Box,
  Button,
  TextField,
  Snackbar,
  Divider,
  Typography,
  Tabs,
  Tab,
  IconButton,
  InputAdornment,
} from "@mui/material";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { supabase } from "../supabase/client";
import bcrypt from "bcryptjs";

const User = ({ onGoBack }) => {
  const [selectedRole, setSelectedRole] = useState("Admin");
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState("");
  const [formValues, setFormValues] = useState({
    email: "",
    password: "",
    first_name: "",
    middle_name: "",
    last_name: "",
    age: "",
    birthday: "",
    address: "",
  });
  const [submittedInfo, setSubmittedInfo] = useState(null);
  const [adminHistory, setAdminHistory] = useState([]);
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleTabChange = (event, newValue) => {
    setSelectedRole(newValue);
    setFormValues({
      email: "",
      password: "",
      confirmPassword: "",
      first_name: "",
      middle_name: "",
      last_name: "",
      age: "",
      birthday: "",
      address: "",
    });
    setSubmittedInfo(null);
  };

  useEffect(() => {
    const fetchAdminHistory = async () => {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        console.error("Unable to fetch user info:", userError);
        return;
      }

      const { data: adminData, error: adminError } = await supabase
        .from("admin")
        .select("admin_uuid")
        .eq("email", user.email)
        .single();

      if (adminError || !adminData) {
        console.error("Admin UUID not found:", adminError);
        return;
      }

      const { data, error } = await supabase
        .from("admin_history")
        .select("*")
        .eq("admin_uuid", adminData.admin_uuid)
        .order("registered_at", { ascending: false });

      if (!error) {
        setAdminHistory(data);
      } else {
        console.error("Failed to fetch admin history:", error);
      }
    };

    fetchAdminHistory();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleDownloadFile = (email, password) => {
    const blob = new Blob([`Email: ${email}\nPassword: ${password}`], {
      type: "text/plain",
    });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "credentials.txt";
    link.click();
  };

  const handleRegister = async () => {
    try {
      if (!formValues.password) {
        alert("Password is required.");
        return;
      }

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) throw new Error("No logged-in user found");

      const { data: currentAdminData, error: currentAdminError } =
        await supabase
          .from("admin")
          .select("admin_uuid")
          .eq("email", user.email)
          .single();

      if (currentAdminError || !currentAdminData) throw currentAdminError;

      const currentAdminUuid = currentAdminData.admin_uuid;

      const hashedPassword = await bcrypt.hash(formValues.password, 12);

      const { error: authError } = await supabase.auth.signUp({
        email: formValues.email,
        password: formValues.password,
      });

      if (authError) throw authError;

      handleDownloadFile(formValues.email, formValues.password);

      const table = selectedRole.toLowerCase();

      const newRecord = {
        email: formValues.email,
        password: hashedPassword,
        first_name: formValues.first_name,
        middle_name: formValues.middle_name,
        last_name: formValues.last_name,
        age: parseInt(formValues.age, 10),
        birthday: formValues.birthday,
        address: formValues.address,
      };

      if (selectedRole === "Staff") {
        const year = new Date().getFullYear();
        const randomSixDigits = Math.floor(100000 + Math.random() * 900000);
        newRecord.staff_id = parseInt(`${year}${randomSixDigits}`, 10);
      }

      const { error: dbError } = await supabase
        .from(table)
        .insert(newRecord)
        .select();

      if (dbError) throw dbError;

      if (selectedRole === "Admin" || selectedRole === "Staff") {
        const philippinesDate = new Date().toLocaleString("en-US", {
          timeZone: "Asia/Manila",
        });

        const { error: historyError } = await supabase
          .from("admin_history")
          .insert({
            admin_uuid: currentAdminUuid,
            first_name: formValues.first_name,
            role: selectedRole,
            registered_at: philippinesDate,
          });

        if (historyError) throw historyError;
      }

      setSubmittedInfo({
        first_name: formValues.first_name,
        role: selectedRole,
        registered_at: new Date().toLocaleString("en-US", {
          timeZone: "Asia/Manila",
        }),
      });

      setNotificationMessage(`${selectedRole} registered successfully!`);
      setNotificationOpen(true);
    } catch (err) {
      console.error(err);
      alert("Registration failed: " + err.message);
    }
  };

  return (
    <Box sx={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      {/* Fixed Header */}
      <Box
        sx={{
          position: "sticky",
          top: 0,
          zIndex: 1000,
          backgroundColor: "white",
          boxShadow: "0px 2px 4px rgba(0, 0, 0, 0.1)",
          padding: "16px 24px",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Button
            variant="outlined"
            onClick={onGoBack}
            startIcon={<ArrowBackIcon />}
          >
            Go Back
          </Button>
        </Box>
        <Divider sx={{ mt: 2 }} />
      </Box>

      {/* Main Content */}
      <Box
        sx={{
          flex: 1,
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          alignItems: "center",
          justifyContent: "center",
          p: 4,
          gap: 10,
        }}
      >
        {/* Left Side: Form */}
        <Box
          sx={{
            width: { xs: "100%", md: "50%" },
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <Tabs
            value={selectedRole}
            onChange={handleTabChange}
            textColor="primary"
            indicatorColor="primary"
            sx={{ mb: 5 }}
          >
            <Tab label="Create Admin" value="Admin" />
            <Tab label="Create Staff" value="Staff" />
          </Tabs>

          <Box
            sx={{
              p: 3,
              backgroundColor: "#f9f9f9",
              borderRadius: 2,
              boxShadow: "0px 2px 4px rgba(0, 0, 0, 0.1)",
              width: "100%",
              maxWidth: 400,
            }}
          >
            <Typography variant="h6" gutterBottom sx={{ textAlign: "center" }}>
              {selectedRole} Form
            </Typography>
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                gap: 2,
              }}
            >
              {/* Input fields */}
              <TextField
                label="Email Address"
                name="email"
                value={formValues.email}
                onChange={handleChange}
              />
              <TextField
                label="Password"
                name="password"
                type={showPassword ? "text" : "password"}
                value={formValues.password}
                onChange={handleChange}
                slotProps={{
                  input: {
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowPassword(!showPassword)}
                          edge="end"
                        >
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  },
                }}
              />
              <TextField
                label="Confirm Password"
                name="confirm_password"
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                error={
                  !!confirmPassword && confirmPassword !== formValues.password
                }
                slotProps={{
                  input: {
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() =>
                            setShowConfirmPassword(!showConfirmPassword)
                          }
                          edge="end"
                        >
                          {showConfirmPassword ? (
                            <VisibilityOff />
                          ) : (
                            <Visibility />
                          )}
                        </IconButton>
                      </InputAdornment>
                    ),
                  },
                }}
              />
              <TextField
                label="First Name"
                name="first_name"
                value={formValues.first_name}
                onChange={handleChange}
              />
              <TextField
                label="Middle Name"
                name="middle_name"
                value={formValues.middle_name}
                onChange={handleChange}
              />
              <TextField
                label="Last Name"
                name="last_name"
                value={formValues.last_name}
                onChange={handleChange}
              />
              <TextField
                label="Age"
                name="age"
                type="number"
                value={formValues.age}
                onChange={handleChange}
              />
              <TextField
                label="Birthday"
                name="birthday"
                type="date"
                slotProps={{
                  inputLabel: {
                    shrink: true,
                  },
                }}
                value={formValues.birthday}
                onChange={handleChange}
              />
              <TextField
                label="Address"
                name="address"
                value={formValues.address}
                onChange={handleChange}
              />

              <Box sx={{ display: "flex", gap: 2, justifyContent: "center" }}>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleRegister}
                >
                  Register
                </Button>
                <Button
                  variant="outlined"
                  onClick={() =>
                    setFormValues({
                      email: "",
                      password: "",
                      first_name: "",
                      middle_name: "",
                      last_name: "",
                      age: "",
                      birthday: "",
                      address: "",
                    })
                  }
                >
                  Clear
                </Button>
              </Box>
            </Box>
          </Box>
        </Box>

        {/* Right Side: Information */}
        <Box
          sx={{
            width: { xs: "100%", md: "50%" },
            minHeight: "500px",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Box
            sx={{
              mt: 5,
              p: 3,
              width: "100%",
              maxWidth: 500,
              minHeight: "700px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
            }}
          >
            {submittedInfo ? (
              <Box>
                <Typography
                  variant="h6"
                  gutterBottom
                  sx={{ textAlign: "center", p: 2, mb: 3 }}
                >
                  Registration Summary
                </Typography>
                <Typography>
                  <strong>Email:</strong> {formValues.email}
                </Typography>
                <Typography>
                  <strong>First Name:</strong> {formValues.first_name}
                </Typography>
                <Typography>
                  <strong>Middle Name:</strong> {formValues.middle_name}
                </Typography>
                <Typography>
                  <strong>Last Name:</strong> {formValues.last_name}
                </Typography>
                <Typography>
                  <strong>Age:</strong> {formValues.age}
                </Typography>
                <Typography>
                  <strong>Birthday:</strong> {formValues.birthday}
                </Typography>
                <Typography>
                  <strong>Address:</strong> {formValues.address}
                </Typography>
                <Typography>
                  <strong>Role:</strong> {submittedInfo.role}
                </Typography>
                <Typography>
                  <strong>Registered At:</strong> {submittedInfo.registered_at}
                </Typography>
              </Box>
            ) : (
              <Box
                sx={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  alignItems: "center",
                  borderRadius: 1,
                  border: "1px solid #ddd",
                }}
              >
                <Typography
                  variant="h6"
                  gutterBottom
                  sx={{ fontWeight: "bold" }}
                >
                  No Registration Info
                </Typography>
                <Typography>No registration information available.</Typography>
              </Box>
            )}

            <Box
              sx={{
                mt: 2,
                flexGrow: 1,
                overflowY: "auto",
                textAlign: "left",
                backgroundColor: "#fff",
                p: 2,
                borderRadius: 1,
                border: "1px solid #ddd",
                minHeight: 150,
                maxHeight: 300,
              }}
            >
              <Typography
                variant="subtitle1"
                gutterBottom
                sx={{ textAlign: "center" }}
              >
                Admin Registration History
              </Typography>
              <Divider sx={{ mb: 2 }} />

              {adminHistory.length === 0 ? (
                <Typography variant="body2">No records found.</Typography>
              ) : (
                adminHistory.map((entry) => (
                  <Box
                    key={entry.history_id}
                    sx={{
                      mb: 1,
                      p: 1,
                      backgroundColor: "#f5f5f5",
                      minHeight: "500px",
                      borderRadius: 1,
                    }}
                  >
                    <Typography variant="body2">
                      You registered <strong>{entry.first_name}</strong> as{" "}
                      <strong>{entry.role}</strong> on{" "}
                      <strong>
                        {new Date(entry.registered_at).toLocaleString("en-PH", {
                          timeZone: "Asia/Manila",
                        })}
                      </strong>
                    </Typography>
                  </Box>
                ))
              )}
            </Box>
          </Box>
        </Box>
      </Box>

      <Snackbar
        open={notificationOpen}
        autoHideDuration={3000}
        onClose={() => setNotificationOpen(false)}
        message={notificationMessage}
      />
    </Box>
  );
};

export default User;
