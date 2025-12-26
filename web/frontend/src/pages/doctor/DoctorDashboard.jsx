// FILE: src/pages/doctor/DoctorDashboard.jsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../Lib/api';
import DashboardLayout from '../../layouts/DashboardLayout';
import {
  FaCalendarCheck,
  FaPrescription,
  FaEnvelopeOpenText,
  FaUserInjured,
  FaCheckCircle,
  FaArrowRight,
  FaVideo,
} from 'react-icons/fa';

export default function DoctorDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalAppointments: 0,
    completedAppointments: 0,
    pendingAppointments: 0,
    totalPrescriptions: 0,
    totalMessages: 0,
    activePatients: 0,
  });

  const doctorId = localStorage.getItem('userId');
  const userName =
    localStorage.getItem('userName') ||
    localStorage.getItem('name') ||
    'Doctor';

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get(`/doctor/stats`, { params: { doctorId } });
        if (res?.data) setStats(res.data);
      } catch (err) {
        console.error('Error fetching doctor stats:', err);
      }
    };
    if (doctorId) fetchStats();
  }, [doctorId]);

  return (
    <DashboardLayout role="DOCTOR">
      <div className="space-y-8 h-full">
        {/* Compact Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-[10px] font-black text-[var(--brand-orange)] uppercase tracking-[0.3em] mb-1">
              Clinical Desk
            </h2>
            <h1 className="text-3xl lg:text-4xl font-black text-[var(--text-main)] tracking-tighter leading-none">
              Welcome, Dr. {userName.split(' ')[0]}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="px-4 py-2 rounded-2xl glass border-green-500/20 flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-[var(--text-soft)]">
              <FaCheckCircle className="text-[var(--brand-green)]" />
              Active Services
            </div>
            <button
              onClick={() => navigate('/doctor/video-consultation')}
              className="btn btn-primary !py-3 !px-6 shadow-green-500/30"
            >
              <FaVideo /> Lobby
            </button>
          </div>
        </div>

        {/* Dense Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Appointments"
            value={stats.totalAppointments}
            icon={<FaCalendarCheck />}
            color="--brand-green"
            subtext={`${stats.pendingAppointments} new`}
            onClick={() => navigate('/doctor/appointments')}
          />
          <StatCard
            title="Scripts"
            value={stats.totalPrescriptions}
            icon={<FaPrescription />}
            color="--brand-blue"
            subtext="Medical records"
            onClick={() => navigate('/doctor/prescriptions')}
          />
          <StatCard
            title="Inbox"
            value={stats.totalMessages}
            icon={<FaEnvelopeOpenText />}
            color="--brand-orange"
            subtext="Community"
            onClick={() => navigate('/doctor/messages/inbox')}
          />
          <StatCard
            title="Clinic Pool"
            value={stats.activePatients}
            icon={<FaUserInjured />}
            color="--brand-green"
            subtext="Patients"
            onClick={() => navigate('/doctor/patients')}
          />
        </div>

        {/* Integrated Action Panels */}
        <div className="grid lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 space-y-4">
            <div className="card !p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-sm font-black text-[var(--text-main)] flex items-center gap-3 uppercase tracking-widest">
                  <div className="h-1.5 w-1.5 rounded-full bg-[var(--brand-green)]"></div>
                  Live Operations History
                </h3>
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                <ActivityItem
                  icon={
                    <FaCalendarCheck className="text-[var(--brand-green)]" />
                  }
                  label="Scheduled"
                  value={`${stats.totalAppointments} events today`}
                />
                <ActivityItem
                  icon={<FaPrescription className="text-[var(--brand-blue)]" />}
                  label="Audit Trail"
                  value={`${stats.totalPrescriptions} prescriptions active`}
                />
              </div>
            </div>
          </div>

          <div className="lg:col-span-4">
            <div className="card !bg-[var(--brand-blue)] text-[var(--text-main)] !p-8 h-full flex flex-col justify-between border-0 shadow-blue-500/20">
              <div className="space-y-4">
                <div className="h-12 w-12 rounded-2xl bg-white/20 flex items-center justify-center text-2xl shadow-inner">
                  <FaVideo />
                </div>
                <div>
                  <h4 className="font-black text-lg tracking-tight">
                    Virtual Care
                  </h4>
                  <p className="text-xs font-bold text-[var(--text-main)]/70 leading-relaxed italic">
                    "Technology is bridge to efficient healthcare."
                  </p>
                </div>
              </div>
              <button
                onClick={() => navigate('/doctor/video-consultation')}
                className="w-full bg-white text-[var(--brand-blue)] font-black uppercase tracking-widest text-[10px] py-4 rounded-2xl hover:bg-gray-100 transition-all mt-6 shadow-xl"
              >
                Connect Session
              </button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

function StatCard({ title, value, icon, color, subtext, onClick }) {
  return (
    <div
      onClick={onClick}
      className="card !p-6 group hover:-translate-y-1 transition-all cursor-pointer border-l-4 relative overflow-hidden"
      style={{ borderLeftColor: `var(${color})` }}
    >
      <div className="flex justify-between items-start">
        <div className="space-y-1">
          <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">
            {title}
          </p>
          <p className="text-3xl font-black text-[var(--text-main)] tracking-tighter">
            {value}
          </p>
        </div>
        <div
          className="h-10 w-10 rounded-xl flex items-center justify-center text-xl shadow-inner bg-[var(--bg-main)]"
          style={{ color: `var(${color})` }}
        >
          {icon}
        </div>
      </div>
      <div className="flex items-center justify-between mt-4">
        <span className="text-[10px] font-bold text-[var(--text-soft)]">
          {subtext}
        </span>
        <FaArrowRight className="text-[10px] text-[var(--text-muted)] group-hover:text-[var(--brand-green)] group-hover:translate-x-1 transition-all" />
      </div>
      <div
        className="absolute -top-12 -right-12 h-24 w-24 rounded-full blur-3xl opacity-10 pointer-events-none"
        style={{ backgroundColor: `var(${color})` }}
      ></div>
    </div>
  );
}

function ActivityItem({ icon, label, value }) {
  return (
    <div className="flex items-center gap-4 p-4 rounded-2xl bg-[var(--bg-main)]/50 border border-[var(--border)] group hover:bg-[var(--bg-card)] transition-all">
      <div className="h-10 w-10 rounded-xl bg-[var(--bg-card)] flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <div className="overflow-hidden">
        <p className="text-[9px] font-black uppercase tracking-widest text-[var(--text-muted)] mb-0.5">
          {label}
        </p>
        <p className="text-xs font-bold text-[var(--text-main)] truncate">
          {value}
        </p>
      </div>
    </div>
  );
}
