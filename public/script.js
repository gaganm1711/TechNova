const socket = io();
let localStream;
let peerConnection;
const roomInput = document.getElementById("roomInput");
const joinBtn = document.getElementById("joinBtn");
const localVideo = document.getElementById("localVideo");
const remoteVideo = document.getElementById("remoteVideo");

const config = {
    iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
};

joinBtn.addEventListener("click", async () => {
    const roomId = roomInput.value.trim();
    if (!roomId) {
        alert("Enter a valid room code!");
        return;
    }
    
    socket.emit("join-room", roomId);

    localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    localVideo.srcObject = localStream;

    peerConnection = new RTCPeerConnection(config);
    localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));

    peerConnection.ontrack = event => {
        remoteVideo.srcObject = event.streams[0];
    };

    peerConnection.onicecandidate = event => {
        if (event.candidate) {
            socket.emit("ice-candidate", { roomId, candidate: event.candidate });
        }
    };

    socket.on("offer", async ({ offer }) => {
        await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);
        socket.emit("answer", { roomId, answer });
    });

    socket.on("answer", async ({ answer }) => {
        await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
    });

    socket.on("ice-candidate", ({ candidate }) => {
        peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
    });

    if (!peerConnection.remoteDescription) {
        const offer = await peerConnection.createOffer();
        await peerConnection.setLocalDescription(offer);
        socket.emit("offer", { roomId, offer });
    }
});
