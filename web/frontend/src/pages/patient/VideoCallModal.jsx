// FILE: src/pages/patient/VideoCallModal.jsx
import { useEffect, useRef, useState } from 'react';
import Video from 'twilio-video';
import {
  FaMicrophone,
  FaMicrophoneSlash,
  FaVideo,
  FaVideoSlash,
  FaPhoneSlash,
  FaClock,
} from 'react-icons/fa';
import api from '../../Lib/api';

export default function VideoCallModal({ consultation, onClose }) {
  const [room, setRoom] = useState(null);
  const [muted, setMuted] = useState(false);
  const [cameraOff, setCameraOff] = useState(false);
  const [statusMsg, setStatusMsg] = useState('Establishing Neural Link...');
  const [errorMsg, setErrorMsg] = useState('');
  const [activeSpeaker, setActiveSpeaker] = useState(null);
  const [callTime, setCallTime] = useState(0);
  const [showEndWarning, setShowEndWarning] = useState(false);

  const localRef = useRef(null);
  const remoteRef = useRef(null);
  const timerRef = useRef(null);
  const endTimeoutRef = useRef(null);

  const userId = localStorage.getItem('userId');
  const role = 'PATIENT';
  const { id, roomName, durationMins = 30 } = consultation || {};

  const formatTime = (seconds) => {
    const m = String(Math.floor((seconds % 3600) / 60)).padStart(2, '0');
    const s = String(seconds % 60).padStart(2, '0');
    return `${m}:${s}`;
  };

  useEffect(() => {
    let activeRoom;

    const join = async () => {
      try {
        const identity = `${role.toLowerCase()}-${userId}`;
        const activeRoomName = roomName || `consult_${id}`;

        const res = await api.post('/videocall/token', {
          identity,
          roomName: activeRoomName,
        });
        const { token } = res.data;
        if (!token) throw new Error('Missing token');

        const localTracks = await Video.createLocalTracks({
          audio: true,
          video: { width: 1280, height: 720 },
        });

        const localTrack = localTracks.find((t) => t.kind === 'video');
        if (localRef.current && localTrack) {
          localRef.current.innerHTML = '';
          const el = localTrack.attach();
          el.style.transform = 'scaleX(-1)';
          el.style.borderRadius = '24px';
          el.style.objectFit = 'cover';
          el.style.width = '100%';
          el.style.height = '100%';
          localRef.current.appendChild(el);
        }

        activeRoom = await Video.connect(token, {
          name: activeRoomName,
          tracks: localTracks,
        });
        setRoom(activeRoom);
        setStatusMsg('Connection Secure — Syncing with Specialist...');

        activeRoom.participants.forEach((p) => attachParticipant(p));
        activeRoom.on('participantConnected', attachParticipant);
        activeRoom.on('participantDisconnected', detachParticipant);
        activeRoom.on('dominantSpeakerChanged', (participant) => {
          setActiveSpeaker(participant?.identity || null);
        });

        startTimer();

        const endMs = durationMins * 60 * 1000;
        endTimeoutRef.current = setTimeout(() => {
          setShowEndWarning(true);
          setTimeout(() => endCall(true), 60000);
        }, endMs - 60000);
      } catch (err) {
        setErrorMsg('Uplink failed. Retrying protocol...');
      }
    };

    const attachParticipant = (participant) => {
      if (participant.identity === `${role.toLowerCase()}-${userId}`) return;
      participant.tracks.forEach((pub) => {
        if (pub.isSubscribed && pub.track.kind === 'video')
          renderRemote(pub.track);
      });
      participant.on('trackSubscribed', (track) => {
        if (track.kind === 'video') renderRemote(track);
      });
      setStatusMsg('Specialist Onsite — Protocol Active.');
    };

    const renderRemote = (track) => {
      const el = track.attach();
      el.style.borderRadius = '24px';
      el.style.transform = 'scaleX(1)';
      el.style.objectFit = 'cover';
      el.style.width = '100%';
      el.style.height = '100%';
      if (remoteRef.current) {
        remoteRef.current.innerHTML = '';
        remoteRef.current.appendChild(el);
      }
    };

    const detachParticipant = () => {
      if (remoteRef.current) remoteRef.current.innerHTML = '';
      setStatusMsg('Specialist Offline — Waiting for Reconnect.');
    };

    const startTimer = () => {
      setCallTime(0);
      timerRef.current = setInterval(() => {
        setCallTime((t) => t + 1);
      }, 1000);
    };

    join();

    return () => {
      clearInterval(timerRef.current);
      clearTimeout(endTimeoutRef.current);
      if (activeRoom) {
        activeRoom.localParticipant.tracks.forEach((pub) => pub.track.stop());
        activeRoom.disconnect();
      }
      if (localRef.current) localRef.current.innerHTML = '';
      if (remoteRef.current) remoteRef.current.innerHTML = '';
    };
  }, [id, roomName, userId, durationMins]);

  const toggleMute = () => {
    if (!room) return;
    room.localParticipant.audioTracks.forEach((pub) => {
      pub.track.isEnabled = !pub.track.isEnabled;
      setMuted(!pub.track.isEnabled);
    });
  };

  const toggleCamera = () => {
    if (!room) return;
    room.localParticipant.videoTracks.forEach((pub) => {
      pub.track.isEnabled = !pub.track.isEnabled;
      setCameraOff(!pub.track.isEnabled);
    });
  };

  const endCall = async (auto = false) => {
    try {
      clearInterval(timerRef.current);
      clearTimeout(endTimeoutRef.current);
      if (room) {
        room.localParticipant.tracks.forEach((pub) => pub.track.stop());
        room.disconnect();
      }
      await api.put(`/videocall/status/${id}`, { status: 'COMPLETED' });
    } catch (e) {
      console.error(e);
    } finally {
      onClose?.();
    }
  };

  const isActivePatient = activeSpeaker === `${role.toLowerCase()}-${userId}`;

  return (
    <div className="fixed inset-0 bg-[var(--bg-main)]/95 backdrop-blur-xl flex justify-center items-center z-[200] animate-in fade-in duration-500">
      <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-[3rem] w-full max-w-6xl h-[85vh] flex flex-col overflow-hidden relative shadow-2xl">
        <button
          onClick={() => endCall(false)}
          className="absolute top-6 right-6 text-[var(--text-muted)] hover:text-[var(--text-main)] text-xl z-50 p-2 hover:rotate-90 transition-all"
        >
          ✖
        </button>

        {/* Status Bar */}
        <div className="flex items-center justify-between px-8 py-4 bg-[var(--bg-main)]/50 border-b border-[var(--border)]">
          <div className="flex items-center gap-3">
            <div
              className={`h-2 w-2 rounded-full ${
                room
                  ? 'bg-[var(--brand-green)] animate-pulse'
                  : 'bg-orange-500 animate-bounce'
              }`}
            ></div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-main)]">
              {statusMsg}
            </p>
          </div>
          {room && (
            <div className="flex items-center gap-2 bg-[var(--bg-card)] px-4 py-1.5 rounded-full border border-[var(--border)]">
              <FaClock className="text-[var(--brand-blue)] text-xs" />
              <span className="font-mono text-xs font-black text-[var(--brand-blue)]">
                {formatTime(callTime)}
              </span>
            </div>
          )}
        </div>

        {errorMsg && (
          <div className="bg-red-500/20 text-red-500 text-[10px] font-black uppercase tracking-widest text-center py-2 border-b border-red-500/30">
            {errorMsg}
          </div>
        )}

        {showEndWarning && (
          <div className="absolute top-20 left-1/2 -translate-x-1/2 bg-[var(--brand-orange)] text-[var(--text-main)] px-6 py-2 rounded-full shadow-lg z-50 animate-bounce text-[10px] font-black uppercase tracking-widest">
            Protocol termination in 60s
          </div>
        )}

        {/* Video Hub */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 p-6 relative">
          <div
            ref={remoteRef}
            className={`rounded-[2rem] bg-[var(--bg-main)] border border-[var(--border)] flex items-center justify-center overflow-hidden transition-all duration-700 relative ${
              !isActivePatient
                ? 'ring-4 ring-[var(--brand-blue)]/30 scale-[1.02]'
                : 'opacity-80'
            }`}
          >
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] opacity-30">
                Specialist Feed
              </p>
            </div>
          </div>

          <div
            ref={localRef}
            className={`rounded-[2rem] bg-[var(--bg-main)] border border-[var(--border)] flex items-center justify-center overflow-hidden transition-all duration-700 relative ${
              isActivePatient
                ? 'ring-4 ring-[var(--brand-green)]/30 scale-[1.02]'
                : 'opacity-80'
            }`}
          >
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] opacity-30">
                Local Feed
              </p>
            </div>
          </div>
        </div>

        {/* Neural Controls */}
        <div className="flex justify-center items-center gap-8 py-8 bg-[var(--bg-main)]/50 border-t border-[var(--border)]">
          <button
            onClick={toggleMute}
            className={`h-14 w-14 rounded-2xl flex items-center justify-center transition-all ${
              muted
                ? 'bg-red-500 text-white shadow-lg shadow-red-500/30'
                : 'bg-[var(--bg-card)] border border-[var(--border)] text-[var(--brand-green)] hover:border-[var(--brand-green)]'
            }`}
          >
            {muted ? (
              <FaMicrophoneSlash size={20} />
            ) : (
              <FaMicrophone size={20} />
            )}
          </button>

          <button
            onClick={() => endCall(false)}
            className="h-16 w-16 bg-red-600 text-[var(--text-main)] rounded-3xl flex items-center justify-center shadow-2xl shadow-red-600/40 hover:scale-110 active:scale-95 transition-all"
          >
            <FaPhoneSlash size={24} />
          </button>

          <button
            onClick={toggleCamera}
            className={`h-14 w-14 rounded-2xl flex items-center justify-center transition-all ${
              cameraOff
                ? 'bg-red-500 text-white shadow-lg shadow-red-500/30'
                : 'bg-[var(--bg-card)] border border-[var(--border)] text-[var(--brand-blue)] hover:border-[var(--brand-blue)]'
            }`}
          >
            {cameraOff ? <FaVideoSlash size={20} /> : <FaVideo size={20} />}
          </button>
        </div>
      </div>
    </div>
  );
}
