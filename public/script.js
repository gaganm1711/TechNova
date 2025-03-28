const socket = io();
let localStream;
let remoteStream;
let peerConnection;

const localVideo = document.getElementById("localVideo");
const remoteVideo = document.getElementById("remoteVideo");
const roomInput = document.getElementById("roomInput");
const joinBtn = document.getElementById("joinBtn");
const endCallBtn = document.getElementById("endCallBtn");

const iceServers = {
    iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
};

// Join Room
joinBtn.addEventListener("click", async () => {
    const room = roomInput.value;
    if (!room) {
        alert("Enter a room code!");
        return;
    }
    socket.emit("join-room", room);
    await startCall();
    joinBtn.style.display = "none";
    endCallBtn.style.display = "block";
});

// Handle Room Joined
socket.on("room-joined", async () => {
    console.log("Room joined. Waiting for connection...");
});

// Handle Offer from Peer
socket.on("offer", async (offer) => {
    console.log("Received offer:", offer);
    if (!peerConnection) {
        peerConnection = createPeerConnection();
    }
    await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);
    socket.emit("answer", answer);
});

// Handle Answer from Peer
socket.on("answer", async (answer) => {
    console.log("Received answer:", answer);
    if (peerConnection) {
        await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
    }
});

// Handle ICE Candidates
socket.on("iceCandidate", async (candidate) => {
    console.log("Received ICE candidate:", candidate);
    if (peerConnection) {
        await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
    }
});

// Start Call & Capture Video
async function startCall() {
    try {
        localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        localVideo.srcObject = localStream;

        peerConnection = createPeerConnection();
        localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));

        const offer = await peerConnection.createOffer();
        await peerConnection.setLocalDescription(offer);
        socket.emit("offer", offer);
    } catch (err) {
        console.error("Error accessing media devices:", err);
    }
}

// Create Peer Connection
function createPeerConnection() {
    const pc = new RTCPeerConnection(iceServers);

    pc.onicecandidate = (event) => {
        if (event.candidate) {
            console.log("Sending ICE candidate:", event.candidate);
            socket.emit("iceCandidate", event.candidate);
        }
    };

    pc.ontrack = (event) => {
        console.log("Received remote track:", event.streams);
        if (!remoteStream) {
            remoteStream = new MediaStream();
            remoteVideo.srcObject = remoteStream;
        }
        remoteStream.addTrack(event.track);
    };

    return pc;
}

// End Call
endCallBtn.addEventListener("click", () => {
    if (peerConnection) {
        peerConnection.close();
        peerConnection = null;
    }
    if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
    }
    localVideo.srcObject = null;
    remoteVideo.srcObject = null;
    alert("Call ended!");
    joinBtn.style.display = "block";
    endCallBtn.style.display = "none";
});
