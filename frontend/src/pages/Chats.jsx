import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Chat from '../components/Chat'
import api from '../api';
import { ACCESS_TOKEN } from "../constraints";
import {jwtDecode} from 'jwt-decode';
import { Scrollbar } from 'react-scrollbars-custom';
import AIChat from '../components/AIChat';

const Chats = () => {

    const [chats, setChats] = useState([])
    const [ai, setAi] = useState([])
    const [searchusers, setSearchUsers] = useState([]);
    const [userDetail, setUserDetail] = useState(null);
    const [aiDetail, setAIDetail] = useState(null);
    const [userId, setUserId] = useState('')
    const [isLoading, setIsLoading] = useState(false);
    // Use a flag to track WebSocket connection status
    const [isConnected, setIsConnected] = useState(true)
    const [searchTerm, setSearchTerm] = useState('');

    const fetchAI = async () => {
        try{
            const res = await api.get("api/ai/");
            setAi(res.data)
            setAIDetail(res.data[0])
        } catch{
            console.log("error")
        }
    }

    const fetchUsers = async (user_id) => {
        setIsLoading(true);
        try{
            const response = await api.get("api/chats/");
            const chatData = response.data
            const chatsWithUsername = chatData.map((chat)=> {
                const participants = chat.participants;
                let displayName = ''
                participants.map((participant) => {
                    if(participant.id != user_id){
                        displayName = participant.username
                    }
                })
                return {
                    ...chat,
                    displayName 
                }
            })
            setChats(chatsWithUsername)
        } catch(err){
            alert(err)
        } finally{
            setIsLoading(false)
        }
    }

    useEffect(() => {
        const access_token = localStorage.getItem(ACCESS_TOKEN);
        if (access_token){
            const decoded_token = jwtDecode(access_token)
            const user_id = decoded_token.user_id
            setUserId(decoded_token.user_id);
            fetchUsers(user_id);
        }
        fetchAI()

    }, [searchusers])


    const handleUserClick = (user, userdata) => {
        if (userdata =="ai"){
            setAIDetail({
                id: user.id,
                user_for: user.user_for,
                ai_name: user.ai_name
            })
            setUserDetail(null)
        }else{
            setUserDetail({
                id: user.id,
                displayName: user.displayName,
                email: user.email,
            })
            setAIDetail(null)
        }
    };
    const fetchSearchUsers = async (searchTerm = '') => {
        try {
            if (searchTerm === ''){
                setSearchUsers([])
            }else{
                const response = await api.get(`api/profiles/?search=${searchTerm}`);
                setSearchUsers(response.data);
            }
        } catch (err) {
            alert(err);
        }
    };


    const handleSearchChange = (event) => {
        setSearchTerm(event.target.value);
        fetchSearchUsers(event.target.value); // Call fetchUsers with search term
    };
    const createChat = async (selectedUserId) => {
        try {
            const response = await api.post('api/chats/', { participant_id: selectedUserId }); // Send both IDs as an array
        } catch (err) {
            console.error('Error creating chat:', err);
        }
    }

    const deleteChat = (id) => {
        api
            .delete(`api/chats/${id}/`)
            .then((res) => {
                if (res.status === 204){
                    setUserDetail(null)
                    fetchUsers()
                } else{
                    console.log("none")
                }
            })
            .catch((err) => console.log(err))
    }

    return (
        <>
            <Navbar />
            
            {!isConnected && <div>Connecting to WebSocket...</div>}
            {isConnected && 
                <div className='flex h-[90vh] overflow-hidden'>
                    <div className='w-1/4'>
                        <input type="text" className='p-3 bg-white w-full h-[63px] rounded-lg border-[2px] border-indigo-300 font-bold' value={searchTerm} onChange={handleSearchChange} placeholder="Search users..." />
                        {searchusers.length > 0 && (
                            <ul>
                                {searchusers.map((user) => (
                                    <li key={user.id}>
                                        <div key={user.id} 
                                        className='py-3 px-4 flex gap-1
                                        border border-slate-200 hover:bg-slate-100 cursor-pointer'
                                        onClick={() => createChat(user.id)}  >
                                            <p>{user.username}</p>
                                            
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                        <Scrollbar style={{ width: '100%', height: '95%' }} className='bg-white'>
                            {ai.map((ai) =>
                                <div key={ai.id}
                                onClick={() => handleUserClick(ai, "ai")}
                                className='py-3 px-4 flex gap-1
                                border border-slate-200 hover:bg-slate-100 cursor-pointer'
                                >   
                                    <p>{ai.ai_name || 'No Name'}</p>
                                </div>
                            )}
                            {chats.map((user) =>
                                <div key={user.id}
                                onClick={() => handleUserClick(user, "chats")}
                                className='py-3 px-4 flex gap-1
                                border border-slate-200 hover:bg-slate-100 cursor-pointer'
                                >
                                    <p>{user.displayName ? user.displayName : user.chat_name || 'No Name'}</p>
                                </div>
                            )}
                        </Scrollbar>
                    </div>
                    <div className='w-full border-l'>
                        {aiDetail && <AIChat aiChatDetail={aiDetail} deleteChat={deleteChat}/>}
                        {userDetail && <Chat chatDetail={userDetail} deleteChat={deleteChat}/>}
                    </div>
                </div>
            }
        </>
    );
};

export default Chats;
