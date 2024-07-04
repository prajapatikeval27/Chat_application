import React, { useEffect, useState, useRef } from 'react';
import api from '../api';
import { ACCESS_TOKEN } from "../constraints";
import Message from './Message';
import {jwtDecode} from 'jwt-decode';
import { Scrollbar } from 'react-scrollbars-custom';

function Chat({ chatDetail, deleteChat }) {
    const [message, setMessage] = useState('');
    const [messageId, setMessageId] = useState('');
    const [oldMessage, setOldMessage] = useState('');
    const [messages, setMessages] = useState([]);
    const [isEditMessage, setIsEditMessage] = useState(false);
    const [userId, setUserId] = useState(null);
    const [dropdown, setDropdown] = useState(false)
    const [ws, setWs] = useState(null);
    const scrollbarsRef = useRef(null);
    const { id, displayName, email, ...otherProperties } = chatDetail;

    const newWs = new WebSocket(`ws://127.0.0.1:8000/ws/chats/${id}/`)
    useEffect(() => {
        // Checking if previous websocket is open or not if open than close it
        if (ws){
            ws.close()
        }
        setWs(newWs)

        const access_token = localStorage.getItem(ACCESS_TOKEN);
        if (access_token){
            const decoded_token = jwtDecode(access_token)
            setUserId(decoded_token.user_id);
        }

        newWs.onopen = (event) =>{
            newWs.send(JSON.stringify({
                'message_type': "onopen",
                'token': localStorage.getItem(ACCESS_TOKEN),
                'chat_id': id,
                }))
            console.log("Connected")
        }
        newWs.onmessage = function(event) {
            const data = JSON.parse(event.data);
            if (data.type == "initial_messages"){
                const { messages } = data;
                const messagesList = Array.isArray(messages) ? messages : [];
                setMessages(messagesList);
            }
            else{
                setMessages(prevMessages => [...prevMessages, data]);
            }
        }
        newWs.onclose = (event) =>{
            console.log("Web socket Closed")
        }

        // Delaying the scrollBottom function so can it can get scroll ref
        setTimeout(() => {
            scrollBottom();
        }, 100); 
    }, [chatDetail])

    const sendMessage = (e) => {
        e.preventDefault()
        setOldMessage('')
        newWs.send(JSON.stringify({
            'chat_id': id,
            'token': localStorage.getItem(ACCESS_TOKEN),
            'message': message,
        }))
        setMessage('')
        // Delaying the scrollBottom function so can it can get scroll ref
        setTimeout(() => {
            scrollBottom();
        }, 100); 
        e.target.reset()
    }

    const deleteMessage = (message_id) => {
        newWs.send(JSON.stringify({
            'message_type': 'message_modification',
            'chat_id': id,
            'type':'delete',
            'message_id': message_id
        }))
    }

    const sendEditedMessage = (e) => {
        e.preventDefault()
        newWs.send(JSON.stringify({
            'message_type': 'message_modification',
            'chat_id': id,
            'type':'edit',
            'message_id': messageId,
            'message': message,
        }))
        setMessage('')
        setOldMessage('')
        e.target.reset()
        setTimeout(() => {
            scrollBottom();
        }, 100); 
        setIsEditMessage(false)
    }

    const editMessage = (message_id, oldmessage) => {
        setOldMessage(oldmessage)
        setMessage(oldmessage)
        setMessageId(message_id)
        setIsEditMessage(true)
        setTimeout(() => {
            scrollBottom();
        }, 100); 
    }

    const scrollBottom = () => {
        if (scrollbarsRef.current) {
            scrollbarsRef.current.scrollToBottom();
        }
    };
    
    const setDropdownMenu = () => {
        if (dropdown){
            setDropdown(false)
        } else{
            setDropdown(true)
        }
    }

    const EditMessageToFalse = () => {
        setIsEditMessage(false)
        // Delaying the scrollBottom function so can it can get scroll ref
        setTimeout(() => {
            scrollBottom();
        }, 100); 
    }

    return (
        <>
            <div className='flex flex-col h-[100%] justify-between'>
                <div className='bg-gray-100 px-3 py-4 flex justify-between items-center'>
                    <div className='text-center'>
                        <a href="#" className="text-lg font-serif text-black">{displayName}</a>
                    </div>
                    {isEditMessage ? 
                        <div>
                            <button onClick={() => EditMessageToFalse()} className='bg-gray-300 text-white font-medium px-8 py-3 rounded-sm'>Cancel Edit</button>
                        </div>
                        :
                        <div>
                            <button id="dropdownMenuIconButton" onClick={() => setDropdownMenu()} data-dropdown-toggle="dropdownDots" className="inline-flex mr-3 items-center rounded-[5px] p-2 text-sm font-sans bg-white text-right bg-gray dark:text-black" type="button">
                                    <svg className="w-5 h-4 font-bold" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 4 15">
                                        <path d="M3.5 1.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Zm0 6.041a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Zm0 5.959a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Z"/>
                                    </svg>
                                </button>
                                
                                <div id="dropdownDots" className={`absolute ${dropdown ? '' : 'hidden'} min-w-48 z-10 -translate-x-40 translate-y-1 bg-white divide-y text-black rounded shadow dark:bg-white`}>
                                    <ul className="py-2 text-sm text-right text-gray-700 dark:text-gray-200" aria-labelledby="dropdownMenuIconButton">
                                        <li>
                                            <a href="#" onClick={() => deleteChat(id)} className="block px-3 py-1 text-black  hover:bg-red-400">Delete Chat</a>
                                        </li>
                                    </ul>
                                </div>
                        </div>    
                    }
                </div>
                {isEditMessage ? 
                    <div className='h-full justify-end'>
                        <div className='flex flex-col h-[70%] absolute z-10 overflow-hidden'>
                            <div className='flex flex-col gap-2 m-3 justify-end'>
                                <div className='p-1 flex justify-end'>
                                    <Message message={oldMessage} isEditMessage={isEditMessage}/>
                                </div>
                            </div>
                        </div>
                        <Scrollbar className='overflow-auto pointer-events-none' style={{ width: '100%', height: '90%' }} ref={scrollbarsRef}>
                            <div className='flex flex-col gap-2 m-3 select-none pointer-events-none blur-[6px]'>
                                {messages.length > 0 ? (
                                    messages.map((message, index) => (
                                        <div key={index} className={` 
                                                            p-1 
                                                            flex 
                                                            ${message.user_id == userId ? 'justify-end' : 'justify-start'}`}>
                                            <Message message={message} isSenderMe={message.user_id == userId} deleteMessage={deleteMessage}
                                                editMessage={editMessage}/>
                                            
                                        </div>
                                        
                                    ))
                                ) : (
                                    <p>No messages yet.</p>
                                )}
                            </div>
                        </Scrollbar>
                        <div className='px-4 pb-3 mt-1'>
                            <form className="flex gap-3" onSubmit={sendEditedMessage}>
                                <input type="text" className='bg-gray-100 w-full px-3 py-3' placeholder='Send'
                                        onChange={(e) => setMessage(e.target.value)}
                                        required
                                        />
                                <input className="bg-blue-900 cursor-pointer text-white font-medium px-8 py-3 rounded-sm"  type="submit" value="Update"/>
                            </form>
                        </div>
                    </div>
                    :
                    <div className='h-full'>
                        <Scrollbar style={{ width: '100%', height: '90%' }} ref={scrollbarsRef}>
                        <div className='flex flex-col gap-2 m-3 pb-10 overflow-y-auto'>
                            {messages.length > 0 ? (
                                messages.map((message, index) => (
                                    <div key={index} className={` 
                                                        p-1 
                                                        flex 
                                                        ${message.user_id == userId ? 'justify-end' : 'justify-start'}`}>
                                        <Message message={message} isSenderMe={message.user_id == userId} deleteMessage={deleteMessage}
                                            editMessage={editMessage}/>
                                        
                                    </div>
                                    
                                ))
                            ) : (
                                <p>No messages yet.</p>
                            )}
                            
                        </div>
                        </Scrollbar>
                        <div className='w-full px-4 pb-3'>
                            <form className="flex gap-3" onSubmit={sendMessage}>
                            <input type="text" className='bg-gray-100 border rounded-[3px] focus:border-gray-400 border-gray-500 w-full px-3 py-3' placeholder='Send'
                                    onChange={(e) => setMessage(e.target.value)}
                                    required
                                    />
                                <input className="bg-blue-900 cursor-pointer text-white font-medium px-8 py-3 rounded-sm"  type="submit" value="Send"/>
                            </form>
                        </div>
                    </div>
                }
            </div>
        </>
    );
}

export default Chat;
