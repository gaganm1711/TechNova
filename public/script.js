const socket = io();
const localVideo = document.getElementById("localVideo");
const remoteVideo = document.getElementById("remoteVideo");
const startCallBtn = document.getElementById("startCall");

let localStream;
let peerConnection;
const config = {
    iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
};

// 🔹 Get User Media (Access Camera)
async function startCall() {
    try {
        localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        localVideo.srcObject = localStream;

        peerConnection = new RTCPeerConnection(config);

        // Add local stream tracks to peer connection
        localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));

        peerConnection.ontrack = event => {
            remoteVideo.srcObject = event.streams[0]; // Show remote video
        };

        peerConnection.onicecandidate = event => {
            if (event.candidate) {
                socket.emit("ice-candidate", event.candidate);
            }
        };

        // Create Offer and Send to Peer
        const offer = await peerConnection.createOffer();
        await peerConnection.setLocalDescription(offer);
        socket.emit("offer", offer);
    } catch (error) {
        console.error("Error accessing camera:", error);
    }
}

// Handle Offer from Peer
socket.on("offer", async offer => {
    peerConnection = new RTCPeerConnection(config);

    peerConnection.ontrack = event => {
        remoteVideo.srcObject = event.streams[0]; // Show remote video
    };

    peerConnection.onicecandidate = event => {
        if (event.candidate) {
            socket.emit("ice-candidate", event.candidate);
        }
    };

    localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    localVideo.srcObject = localStream;

    localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));

    await peerConnection.setRemoteDescription(offer);
    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);
    socket.emit("answer", answer);
});

// Handle Answer from Peer
socket.on("answer", answer => {
    peerConnection.setRemoteDescription(answer);
});

// Handle ICE Candidates
socket.on("ice-candidate", candidate => {
    peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
});

startCallBtn.addEventListener("click", startCall);
