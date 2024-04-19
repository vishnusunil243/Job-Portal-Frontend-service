import React, { useEffect, useRef,useState } from "react";
import { useParams,useNavigate } from "react-router-dom";

const Room = () => {
  const userVideo = useRef();
  const userStream = useRef();
  const partnerVideo = useRef();
  const peerRef = useRef();
  const webSocketRef = useRef();
  const navigate=useNavigate();
  const [audioEnabled,setAudioEnabled]=useState(true);
  const [joinRequest,setJoinRequest]=useState(false);
  const [screenShareActive, setScreenShareActive] = useState(false);
  const [videoEnabled,setVideoEnabled]=useState(true);
 


  const { roomid } = useParams();

  const openCamera = async () => {
    const allDevices = await navigator.mediaDevices.enumerateDevices();
    const cameras = allDevices.filter((device) => device.kind === "videoinput");

    const constraints = {
      audio: true,
      video: {
        deviceId: cameras[0].deviceId,
      },
    };
   

    try {
      return await navigator.mediaDevices.getUserMedia(constraints);
    } catch (err) {
      console.log(err);
    }
  };
 

  useEffect(() => {
    openCamera().then((stream) => {
      console.log(stream.getAudioTracks())
      userVideo.current.srcObject = stream;
      userStream.current = stream;

      webSocketRef.current = new WebSocket(
        `wss://pcforu.online/join?roomId=${roomid}`
      );

      webSocketRef.current.addEventListener("open", () => {
        webSocketRef.current.send(JSON.stringify({ join: true }));
      });

      webSocketRef.current.addEventListener("message", async (e) => {
        const message = JSON.parse(e.data);
        console.log({ message });
        if (message.joinRequest){
          setJoinRequest(true);
        }
        if (message.join) {
          callUser();
        }

        if (message.offer) {
          handleOffer(message.offer);
        }

        if (message.answer) {
          console.log("Receiving Answer");
          peerRef.current.setRemoteDescription(
            new RTCSessionDescription(message.answer)
          );
        }

        if (message.iceCandidate) {
          console.log("Receiving and Adding ICE Candidate");
          try {
            await peerRef.current.addIceCandidate(message.iceCandidate);
          } catch (err) {
            console.log("Error Receiving ICE Candidate", err);
          }
        }
      });
    });
  },[]);

  const handleOffer = async (offer) => {
    console.log("Received Offer, Creating Answer");
    peerRef.current = createPeer();
    await peerRef.current.setRemoteDescription(
      new RTCSessionDescription(offer)
    );
    userStream.current.getTracks().forEach((track) => {
      peerRef.current.addTrack(track, userStream.current);
    });
    const answer = await peerRef.current.createAnswer();
    await peerRef.current.setLocalDescription(answer);
    webSocketRef.current.send(
      JSON.stringify({ answer: peerRef.current.localDescription })
    );
  };

  const callUser = () => {
    console.log("Calling Other User");
    peerRef.current = createPeer();
    userStream.current.getTracks().forEach((track) => {
      peerRef.current.addTrack(track, userStream.current);
    });
  };

  const createPeer = () => {
    console.log("Creating Peer Connection");
    const peer = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });

    peer.onnegotiationneeded = handleNegotiationNeeded;
    peer.onicecandidate = handleIceCandidateEvent;
    peer.ontrack = handleTrackEvent;

    return peer;
  };

  const handleNegotiationNeeded = async () => {
    console.log("Creating Offer");

    try {
      const myOffer = await peerRef.current.createOffer();
      await peerRef.current.setLocalDescription(myOffer);
      webSocketRef.current.send(
        JSON.stringify({ offer: peerRef.current.localDescription })
      );
    } catch (err) {}
  };

  const handleIceCandidateEvent = (e) => {
    console.log("Found Ice Candidate");
    if (e.candidate) {
      console.log(e.candidate);
      webSocketRef.current.send(JSON.stringify({ iceCandidate: e.candidate }));
    }
  };
  const leaveCall=()=>{
    webSocketRef.current.close();
    userStream.current.getTracks().forEach((track)=>{
      track.stop();
    })
    userVideo.current.srcObject=null;
    navigate('/')
  }
  const toggleAudio = () => {
    const tracks = userStream.current.getTracks().filter((track) => track.kind === 'audio');
    tracks.forEach((track) => (track.enabled = !audioEnabled));
    setAudioEnabled(!audioEnabled);
  };
  const toggleVideo=()=>{
    const tracks=userStream.current.getTracks().filter((track)=>track.kind==='video');
    tracks.forEach((track)=>(track.enabled=!videoEnabled));
    setVideoEnabled(!videoEnabled);
  }
  const toggleScreenShare = () => {
    if (!screenShareActive) {
      navigator.mediaDevices
        .getDisplayMedia({ video: true, audio: false })
        .then((stream) => {
          setScreenShareActive(true);
          const videoTrack = stream.getVideoTracks()[0];
          const sender = peerRef.current.getSenders().find((s) => s.track.kind === "video");
          if (sender) {
            sender.replaceTrack(videoTrack);
          } else {
            console.error("No video sender found");
          }
          userStream.current = stream;
          userVideo.current.srcObject = stream;
        })
        .catch((err) => {
          console.error("Error sharing screen:", err);
        });
    } else {
      setScreenShareActive(false);
      openCamera().then((stream) => {
        const videoTrack = stream.getVideoTracks()[0];
        const sender = peerRef.current.getSenders().find((s) => s.track.kind === "video");
        if (sender) {
          sender.replaceTrack(videoTrack);
        } else {
          console.error("No video sender found");
        }
        userStream.current = stream;
        userVideo.current.srcObject = stream;
      });
    }
  };
  const handleTrackEvent = (e) => {
    console.log("Received Tracks");
    partnerVideo.current.srcObject = e.streams[0];
  };

;

  return (
    <>
    <div>
  {joinRequest && (
    <div className="absolute top-0 left-0 w-full h-full flex justify-center items-center bg-gray-900 bg-opacity-50">
      <div className="bg-white p-5 rounded-lg">
        <p>Allow the other user to join?</p>
        <div className="flex justify-center mt-3">
          <button
            className="btn mr-3"
            onClick={() => {
              // Allow the other user to join
              webSocketRef.current.send(JSON.stringify({ allowJoin: false }));
              setJoinRequest(false);
            }}
          >
            Allow
          </button>
          <button
            className="btn"
            onClick={() => {
              // Deny the other user from joining
              webSocketRef.current.send(JSON.stringify({ allowJoin: false }));
              setJoinRequest(true);
            }}
          >
            Deny
          </button>
        </div>
      </div>
    </div>
  )}
</div>
    <div>
      <section>
        <div className="bg-black p-5 m-[45px]">
          <div className="grid lg:grid-cols-2 grid-cols-1 justify-center items-center gap-5 mt-5">
            <video  className="w-full mt-3 rounded-lg" autoPlay  ref={userVideo}></video>
            <video className="w-full mt-3 rounded-lg" autoPlay  ref={partnerVideo}></video>
          </div>
          <div className="flex justify-center items-center gap-5 flex-wrap">
          <button className="btn" onClick={leaveCall}>Leave</button>
          <button className="btn" onClick={toggleAudio}>{audioEnabled ? "Mute" : "Unmute"}</button>
<button className="btn" onClick={toggleScreenShare}>{screenShareActive ? "Stop Sharing" : "Screen Share"}</button>
<button className="btn" onClick={toggleVideo}>{videoEnabled ? "Mute Video" : "Unmute Video"}</button>

          </div>
        </div>
      </section>
    </div>
    </>
  );
};

export default Room;
