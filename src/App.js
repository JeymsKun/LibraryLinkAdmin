import React from "react";
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './admin/Login';
import Dashboard from './pages/Dashboard';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate replace to="/Login/" />} />
        <Route path="/Login/" element={<Login />} />
        <Route path="/Dashboard/*" element={<Dashboard />} />
      </Routes>
    </Router>
  );
}

export default App;