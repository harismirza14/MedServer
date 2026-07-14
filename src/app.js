require("dotenv").config();
const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/authRoutes");
const patientRoutes = require("./routes/patientRoutes");
const prescriptionRoutes = require("./routes/prescriptionRoutes");
const masterDataRoutes = require("./routes/masterDataRoutes");
const prescriberRoutes = require("./routes/prescriberRoutes");
const careTeamRoutes = require("./routes/careTeamRoutes");
const availabilityRoutes = require("./routes/availabilityRoutes");
const appointmentRoutes = require("./routes/appointmentRoutes");
const authenticate = require("./middlewares/auth");
const app = express();

app.use(cors());
app.use(express.json());
app.use("/api", authRoutes);
app.use(authenticate);
app.use("/api", patientRoutes);
app.use("/api", prescriptionRoutes);
app.use("/api", masterDataRoutes);
app.use("/api", prescriberRoutes);
app.use("/api", careTeamRoutes);
app.use("/api", availabilityRoutes);
app.use("/api", appointmentRoutes);

module.exports = app;