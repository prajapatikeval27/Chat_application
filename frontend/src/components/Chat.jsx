import React, { useEffect, useState } from 'react';
import api from '../api';
import { ACCESS_TOKEN } from "../constraints";
import Message from './Message';
import {jwtDecode} from 'jwt-decode';

function Chat({ chatDetail }) {
    const [message, setMessage] = useState([])
    const [messages, setMessages] = useState([])
    const [isConnected, setIsConnected] = useState(false)
    const [isSenderMe, setIsSenderMe] = useState(true)
    const [userId, setUserId] = useState(null);
    const { id, displayName, email, ...otherProperties } = chatDetail;
    

    const ws = new WebSocket(`ws://127.0.0.1:8000/ws/chats/${id}/`)
    useEffect(() => {
        const access_token = localStorage.getItem(ACCESS_TOKEN);
        if (access_token){
            const decoded_token = jwtDecode(access_token)
            setUserId(decoded_token.user_id);
        }


        ws.onopen = (event) =>{
            ws.send(JSON.stringify({
                'message_type': "onopen",
                'token': localStorage.getItem(ACCESS_TOKEN),
                'chat_id': id,
                }))
            setIsConnected(true);
            console.log("Connected")
        }
        ws.onmessage = function(event) {
            const data = JSON.parse(event.data);
            console.log(data)
            if (data.type == "initial_messages"){
                const { messages } = data;
                const messagesList = Array.isArray(messages) ? messages : [];
                setMessages(messagesList);
                console.log(messagesList)
            }
            else{
                setMessages(prevMessages => [...prevMessages, data]);
            }
        }
        ws.onclose = (event) =>{
            setIsConnected(false);
            console.log("Web socket Closed")
        }
    }, [])

    const sendMessage = (e) => {
        e.preventDefault()
        console.log("clicked")
        ws.send(JSON.stringify({
            'chat_id': id,
            'token': localStorage.getItem(ACCESS_TOKEN),
            'message': message,
        }))
        e.target.reset()
    }

    return (
        <>
            <div  className='flex flex-col h-full justify-between'>
                <div className='bg-gray-100 px-3 py-4'>
                    <div className='font-semibold'>
                        {displayName}
                    </div>
                </div>
                <div>
                    <div className='flex flex-col gap-2 m-3'>
                        {messages.length > 0 ? (
                            messages.map((message, index) => (
                                <div key={index} className={` 
                                                    p-1 
                                                    flex 
                                                    ${message.user_id == userId ? 'justify-end' : 'justify-start'}`}>
                                    <Message sender={message.sender} message={message.message} isSenderMe={message.user_id == userId}/>
                                </div>
                            ))
                        ) : (
                            <p>No messages yet.</p>
                        )}
                        
                    </div>
                    <div className='w-full px-4 pb-3'>
                        <form className="flex gap-3" onSubmit={sendMessage}>
                        <input type="text" className='bg-gray-100 w-full px-3 py-3' placeholder='Send'
                                onChange={(e) => setMessage(e.target.value)}
                                required
                                />
                            <input className="bg-blue-900 text-white font-medium px-8 py-3 rounded-sm"  type="submit" value="Send"/>
                        </form>
                    </div>
                </div>
            </div>
        </>
    );
}

export default Chat;
