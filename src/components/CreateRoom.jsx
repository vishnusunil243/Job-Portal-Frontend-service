import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const CreateRoom = () => {
  const navigate = useNavigate();
  const [roomId, setRoomId] = useState('');
  const create=async(e)=>{
    e.preventDefault();
    const resp=await fetch("http://apigateway:8080/call/create");
    const {room_id}=await resp.json();
    navigate(`/room/${room_id}`)
}
  const handleJoin = async (e) => {
    e.preventDefault();
    // Assuming a successful response, navigate to the room
    navigate(`/room/${roomId}`);
  };

  return <>
   <nav className="bg-white border-b border-solid border-b-primaryColor m-5 text-center">
        <div className="flex flex-wrap justify-between items-center mx-auto max-w-screen-xl p-4">
          <h1
            className="flex items-center space-x-3 rtl:space-x-reverse"
          >
            <span className="heading text-primaryColor">Job Portal</span>
          </h1>
        </div>
      </nav>
      <section>
      <div className="container text-center">
        <h2 className='heading text-center'>Join A Room</h2>
        <div>
          <form 
           onSubmit={handleJoin}
           className='max-w-[570px] mt-[30px] mx-auto bg-[#0066ff2c] rounded-md flex items-center justify-between' >
          <input  
           value={roomId}
           onChange={(e)=>setRoomId(e.target.value)}
           type="text"
           className='py-4 pl-4 pr-2 bg-transparent w-full focus:outline-none cursor-pointer placeholder:text-textColor'
            placeholder='Enter Room Id' 
          />
          <button className='btn mt-0 rounded-[0px] rounded-r-md'>Join</button>
          </form>
          <button className='btn mt-10 rounded-md  w-1/6' onClick={create}>Create Room</button>
        </div>
      </div>
    </section>
  </>
};

export default CreateRoom;