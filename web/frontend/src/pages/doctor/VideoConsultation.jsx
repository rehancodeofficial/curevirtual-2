// FILE: src/pages/doctor/VideoConsultation.jsx
import { useState, useEffect, useCallback } from "react";
import api from "../../Lib/api";
import Sidebar from "../../components/Sidebar";
import Topbar from "../../components/Topbar";
import VideoCallModal from "./VideoCallModal";
import {
  FaPlusCircle,
  FaVideo,
  FaTimesCircle,
  FaCheckCircle,
} from "react-icons/fa";

/* ------------------- Tiny toast (success/error) ------------------- */
function Toast({ text, onClose }) {
  if (!text) return null;
  return (
    <div
      className="fixed top-6 right-6 bg-[#027906] text-[var(--text-main)] px-5 py-3 rounded-lg shadow-lg z-50"
      style={{ animation: "fadeInOut 3s ease forwards" }}
      onAnimationEnd={onClose}
    >
      {text}
    </div>
  );
}

/* -- Inject keyframes once (safe no-op if already added) ----------- */
if (typeof document !== "undefined" && !document.getElementById("cv-fade-styles")) {
  const style = document.createElement("style");
  style.id = "cv-fade-styles";
  style.innerHTML = `
  @keyframes fadeInOut {
    0% { opacity: 0; transform: translateY(-10px); }
    10% { opacity: 1; transform: translateY(0); }
    90% { opacity: 1; transform: translateY(0); }
    100% { opacity: 0; transform: translateY(-10px); }
  }`;
  document.head.appendChild(style);
}

/* ------------------- Status pill component ------------------------ */
const StatusPill = ({ status }) => {
  const s = (status || "").toUpperCase();
  const styles =
    s === "SCHEDULED"
      ? "bg-[#E67514] text-black"
      : s === "ONGOING"
      ? "bg-blue-600 text-white"
      : s === "COMPLETED"
      ? "bg-[#027906] text-white"
      : "bg-red-600 text-white";
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${styles}`}>
      {s}
    </span>
  );
};

export default function VideoConsultation() {
  const role = localStorage.getItem("role") || "DOCTOR";
  const doctorUserId = localStorage.getItem("userId");
  const userName =
    localStorage.getItem("userName") ||
    localStorage.getItem("name") ||
    "Doctor";

  const [consultations, setConsultations] = useState([]);
  const [patients, setPatients] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [callModalOpen, setCallModalOpen] = useState(false);
  const [selectedConsultation, setSelectedConsultation] = useState(null);

  const [toastText, setToastText] = useState("");

  // Confirm cancel dialog
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingCancelId, setPendingCancelId] = useState(null);
  const [confirmLoading, setConfirmLoading] = useState(false);

  const [form, setForm] = useState({
    patientId: "",
    scheduledAt: "",
    durationMins: 30,
  });

  /* ---------------------- Load my patients (requires doctorUserId) ------- */
  const loadMyPatients = useCallback(async () => {
    try {
      const res = await api.get("/doctor/patients", { params: { doctorUserId } });
      setPatients(res.data?.data || res.data || []);
    } catch (err) {
      console.error("Error fetching patients:", err);
      setError("Failed to load your patients.");
    }
  }, [doctorUserId]);

  /* ---------------------- Load my consultations -------------------------- */
  const fetchConsultations = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get(`/videocall/list`, {
        params: { userId: doctorUserId, role: "DOCTOR" },
      });
      const data = res.data?.data || res.data || [];
      setConsultations(Array.isArray(data) ? data : []);
      setError("");
    } catch (err) {
      console.error("❌ Error fetching consultations:", err);
      setError("Failed to load consultations. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [doctorUserId]);

  useEffect(() => {
    fetchConsultations();
    loadMyPatients();
  }, [fetchConsultations, loadMyPatients]);

  /* ---------------------- Schedule new consultation ---------------------- */
  const handleSchedule = async (e) => {
    e.preventDefault();
    if (!form.patientId || !form.scheduledAt) {
      setToastText("❗ Please fill all required fields.");
      return;
    }

    try {
      await api.post("/videocall/create", {
        doctorId: doctorUserId,        // send User.id, backend resolves DoctorProfile
        patientId: form.patientId,     // PatientProfile.id from dropdown
        scheduledAt: form.scheduledAt,
        durationMins: form.durationMins,
      });

      setToastText("✅ Consultation scheduled successfully!");
      setModalOpen(false);
      setForm({ patientId: "", scheduledAt: "", durationMins: 30 });
      fetchConsultations();
    } catch (err) {
      console.error("Error scheduling consultation:", err);
      setToastText(err?.response?.data?.error || "❌ Failed to schedule consultation.");
    }
  };

  /* ---------------------- Cancel consultation (confirm) ------------------ */
  const requestCancel = (id) => {
    setPendingCancelId(id);
    setConfirmOpen(true);
  };

  const confirmCancel = async () => {
    if (!pendingCancelId) return;
    try {
      setConfirmLoading(true);
      await api.put(`/videocall/status/${pendingCancelId}`, {
        status: "CANCELLED",
      });
      setToastText("🛑 Consultation cancelled");
      setConfirmOpen(false);
      setPendingCancelId(null);
      fetchConsultations();
    } catch (err) {
      console.error("Error cancelling consultation:", err);
      setToastText("❌ Failed to cancel consultation.");
    } finally {
      setConfirmLoading(false);
    }
  };

  const cancelConfirmDialog = () => {
    if (confirmLoading) return;
    setConfirmOpen(false);
    setPendingCancelId(null);
  };

  /* ---------------------- Join consultation ------------------------------ */
  const handleJoin = (consultation) => {
    setSelectedConsultation(consultation);
    setCallModalOpen(true);
  };

  return (
    <div className="flex bg-[#000000]/90 text-[var(--text-main)] min-h-screen">
      <Sidebar role={role} />
      <div className="flex-1 min-h-screen">
        <Topbar userName={userName} />

        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <img
              src="/images/logo/Asset2.png"
              alt="CureVirtual"
              style={{ width: 120, height: "auto" }}
              onError={(e) => {
                try { e.currentTarget.src = PLACEHOLDER_LOGO; } catch {}
              }}
            />
            <h1 className="text-3xl font-bold text-[var(--text-main)] flex items-center gap-2">
              <FaVideo className="text-blue-400" /> Video Consultations
            </h1>
            <button
              onClick={() => setModalOpen(true)}
              className="flex items-center gap-2 bg-[#027906] hover:bg-[#190366] text-[var(--text-main)] px-4 py-2 rounded-md transition"
            >
              <FaPlusCircle /> Schedule New
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-600/20 text-red-200 border border-red-400/30 rounded">
              {error}
            </div>
          )}

          {loading ? (
            <p className="text-[var(--text-soft)]">Loading consultations...</p>
          ) : consultations.length === 0 ? (
            <p className="text-[var(--text-muted)]">No consultations scheduled yet.</p>
          ) : (
            <div className="bg-[var(--bg-glass)] backdrop-blur-md rounded-2xl p-6 shadow-lg">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-[var(--border)]">
                    <th className="p-3">Patient</th>
                    <th className="p-3">Date</th>
                    <th className="p-3">Duration</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {consultations.map((c) => (
                    <tr
                      key={c.id}
                      className="border-b border-[var(--border)] hover:bg-[var(--bg-glass)] transition"
                    >
                      <td className="p-3">
                        {c.patient?.user?.name || c.patient?.user?.fullName || "N/A"}
                      </td>
                      <td className="p-3">
                        {c.scheduledAt ? new Date(c.scheduledAt).toLocaleString('en-GB', {
                          year: 'numeric',
                          month: '2-digit',
                          day: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                          hour12: false
                        }) : "—"}
                      </td>
                      <td className="p-3">{c.durationMins || 30} mins</td>
                      <td className="p-3">
                        <StatusPill status={c.status} />
                      </td>
                      <td className="p-3 flex justify-center gap-4">
                        {c.status === "SCHEDULED" && (
                          <>
                            <button
                              onClick={() => handleJoin(c)}
                              className="hover:scale-110 transition"
                              title="Join Now"
                            >
                              <FaVideo className="text-blue-400" />
                            </button>
                            <button
                              onClick={() => requestCancel(c.id)}
                              className="hover:scale-110 transition"
                              title="Cancel"
                            >
                              <FaTimesCircle className="text-red-400" />
                            </button>
                          </>
                        )}
                        {c.status === "COMPLETED" && (
                          <FaCheckCircle className="text-green-400" title="Completed" />
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ✅ Toast */}
      <Toast text={toastText} onClose={() => setToastText("")} />

      {/* ✅ Cancel Confirm Dialog */}
      {confirmOpen && (
        <div className="fixed inset-0 bg-[var(--bg-main)]/95 flex items-center justify-center z-[60]">
          <div className="bg-[var(--bg-card)] text-[var(--text-main)] w-full max-w-md rounded-2xl shadow-xl p-6 relative">
            <h3 className="text-xl font-semibold mb-2">Cancel Consultation?</h3>
            <p className="text-[var(--text-soft)] mb-6">
              This will set the consultation status to CANCELLED.
            </p>

            <div className="flex justify-end gap-3">
              <button
                onClick={cancelConfirmDialog}
                className="px-4 py-2 rounded border border-[var(--border)] hover:bg-[var(--bg-glass)] disabled:opacity-50"
                disabled={confirmLoading}
              >
                Keep
              </button>
              <button
                onClick={confirmCancel}
                className="px-4 py-2 rounded bg-red-600 hover:bg-red-700 text-[var(--text-main)] disabled:opacity-50"
                disabled={confirmLoading}
              >
                {confirmLoading ? "Processing..." : "Cancel Consultation"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ✅ Schedule Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-[var(--bg-main)]/95 flex items-center justify-center z-50">
          <div className="bg-[var(--bg-card)] p-8 rounded-2xl shadow-xl w-full max-w-lg relative">
            <button
              onClick={() => setModalOpen(false)}
              className="absolute top-3 right-4 text-[var(--text-soft)] text-xl"
            >
              ✖
            </button>

            <h2 className="text-2xl font-semibold mb-6 text-[var(--text-main)]">
              Schedule Consultation
            </h2>

            <form onSubmit={handleSchedule} className="space-y-4">
              <div>
                <label className="block mb-1 text-[var(--text-soft)]">Patient</label>
                <select
                  className="w-full p-2 rounded bg-gray-200 text-black border border-[var(--border)]"
                  value={form.patientId}
                  onChange={(e) => setForm({ ...form, patientId: e.target.value })}
                  required
                >
                  <option value="">-- Select Patient --</option>
                  {patients.map((p) => (
                    <option key={p.id} value={p.id} style={{ color: "#000" }}>
                      {p.user?.name || p.name || p.user?.email || "Unnamed Patient"}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block mb-1 text-[var(--text-soft)]">Date & Time</label>
                <input
                  type="datetime-local"
                  className="w-full p-2 rounded bg-[var(--bg-glass)] border border-[var(--border)] text-[var(--text-main)]"
                  value={form.scheduledAt}
                  onChange={(e) => {
                    setForm({ ...form, scheduledAt: e.target.value });
                    e.target.blur();
                  }}
                  required
                />
              </div>

              <div>
                <label className="block mb-1 text-[var(--text-soft)]">Duration (minutes)</label>
                <input
                  type="number"
                  min="15"
                  className="w-full p-2 rounded bg-[var(--bg-glass)] border border-[var(--border)] text-[var(--text-main)]"
                  value={form.durationMins}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      durationMins: parseInt(e.target.value) || 30,
                    })
                  }
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full bg-[#027906] hover:bg-[#190366] py-2 rounded text-[var(--text-main)] font-semibold"
              >
                Schedule
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 🎥 Twilio/LiveKit Call Modal */}
      {callModalOpen && selectedConsultation && (
        <VideoCallModal
          consultation={selectedConsultation}
          onClose={() => setCallModalOpen(false)}
        />
      )}
    </div>
  );
}
