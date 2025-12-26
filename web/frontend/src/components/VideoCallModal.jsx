import { useEffect, useState } from "react";
import Video from "twilio-video";
import { FaVideoSlash, FaVideo, FaMicrophone, FaMicrophoneSlash, FaPhoneSlash } from "react-icons/fa";

export default function VideoCallModal({ onClose }) {
  const [room, setRoom] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);

  const token = localStorage.getItem("videoRoomToken");
  const roomName = localStorage.getItem("videoRoomName");

  useEffect(() => {
    if (!token || !roomName) {
      alert("Missing video session details.");
      onClose();
      return;
    }

    // ✅ Connect to Twilio Room
    Video.connect(token, {
      name: roomName,
      audio: true,
      video: { width: 640 },
    })
      .then((connectedRoom) => {
        setRoom(connectedRoom);
        console.log("✅ Connected to Twilio room:", roomName);

        const localContainer = document.getElementById("local-video");
        const remoteContainer = document.getElementById("remote-video");

        // Attach local tracks
        connectedRoom.localParticipant.tracks.forEach((publication) => {
          if (publication.track) localContainer.appendChild(publication.track.attach());
        });

        // Handle new remote participants
        connectedRoom.on("participantConnected", (participant) => {
          console.log(`👤 ${participant.identity} connected`);
          participant.tracks.forEach((publication) => {
            if (publication.isSubscribed) {
              remoteContainer.appendChild(publication.track.attach());
            }
          });
          participant.on("trackSubscribed", (track) => {
            remoteContainer.appendChild(track.attach());
          });
        });

        // Handle participant disconnection
        connectedRoom.on("participantDisconnected", (participant) => {
          console.log(`👋 ${participant.identity} left`);
        });
      })
      .catch((err) => {
        console.error("❌ Error connecting to Twilio room:", err);
        alert("Failed to connect to the video room.");
        onClose();
      });

    // Cleanup on modal close
    return () => {
      if (room) {
        room.localParticipant.tracks.forEach((publication) => {
          publication.track.stop();
          publication.track.detach().forEach((el) => el.remove());
        });
        room.disconnect();
      }
    };
  }, [token, roomName]);

  /** 🎙️ Toggle Mic */
  const toggleMic = () => {
    if (!room) return;
    room.localParticipant.audioTracks.forEach((pub) => {
      const track = pub.track;
      if (isMuted) track.enable();
      else track.disable();
    });
    setIsMuted(!isMuted);
  };

  /** 📷 Toggle Camera */
  const toggleCamera = () => {
    if (!room) return;
    room.localParticipant.videoTracks.forEach((pub) => {
      const track = pub.track;
      if (isVideoOff) track.enable();
      else track.disable();
    });
    setIsVideoOff(!isVideoOff);
  };

  /** 📞 End Call */
  const handleEndCall = () => {
    if (room) {
      room.disconnect();
      localStorage.removeItem("videoRoomToken");
      localStorage.removeItem("videoRoomName");
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/90 flex flex-col items-center justify-center z-50">
      {/* Header */}
      <div className="absolute top-4 left-6 text-white text-lg font-semibold">
        Live Video Consultation
      </div>
      <button
        onClick={handleEndCall}
        className="absolute top-4 right-6 text-red-500 text-xl hover:scale-110 transition"
        title="End Call"
      >
        ✖
      </button>

      {/* Video Containers */}
      <div className="flex gap-4 w-full h-[75vh] justify-center px-6">
        <div
          id="local-video"
          className="bg-gray-800 w-1/3 h-full rounded-xl overflow-hidden flex items-center justify-center text-gray-400"
        >
          Local Video
        </div>
        <div
          id="remote-video"
          className="bg-gray-900 w-2/3 h-full rounded-xl overflow-hidden flex items-center justify-center text-gray-400"
        >
          Waiting for remote participant...
        </div>
      </div>

      {/* Controls */}
      <div className="mt-8 flex gap-6">
        <button
          onClick={toggleMic}
          className={`p-4 rounded-full text-white ${
            isMuted ? "bg-red-600" : "bg-green-600"
          } hover:scale-110 transition`}
          title={isMuted ? "Unmute" : "Mute"}
        >
          {isMuted ? <FaMicrophoneSlash /> : <FaMicrophone />}
        </button>

        <button
          onClick={toggleCamera}
          className={`p-4 rounded-full text-white ${
            isVideoOff ? "bg-red-600" : "bg-green-600"
          } hover:scale-110 transition`}
          title={isVideoOff ? "Turn Camera On" : "Turn Camera Off"}
        >
          {isVideoOff ? <FaVideoSlash /> : <FaVideo />}
        </button>

        <button
          onClick={handleEndCall}
          className="p-4 rounded-full bg-red-700 text-white hover:scale-110 transition"
          title="End Call"
        >
          <FaPhoneSlash />
        </button>
      </div>
    </div>
  );
}
