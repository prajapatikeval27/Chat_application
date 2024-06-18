import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Chat from '../components/Chat'
import api from '../api';
import { ACCESS_TOKEN } from "../constraints";
import {jwtDecode} from 'jwt-decode';

const Chats = () => {

    const [chats, setChats] = useState([])
    const [searchusers, setSearchUsers] = useState([]);
    const [userDetail, setUserDetail] = useState(null);
    const [userId, setUserId] = useState('')
    const [isLoading, setIsLoading] = useState(false);
    // Use a flag to track WebSocket connection status
    const [isConnected, setIsConnected] = useState(true)
    const [searchTerm, setSearchTerm] = useState('');

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
                console.log('chatData', chatData)  
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
        console.log("calling")
    }, [searchusers])

    const handleUserClick = (user) => {
        setUserDetail({
            id: user.id,
            displayName: user.displayName,
            email: user.email,
        })
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
            console.log('Chat created:', response.data);
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
                <div className='flex h-[90vh]'>
                    <div className='w-1/4'>
                        <input type="text" value={searchTerm} onChange={handleSearchChange} placeholder="Search users..." />
                        {searchusers.length > 0 && (
                            <ul>
                                {searchusers.map((user) => (
                                    <li key={user.id}>
                                        <div key={user.id} 
                                        className='py-2 px-4 bg-green-100 flex 
                                        border border-slate-300 hover:border-red-400'
                                        onClick={() => createChat(user.id)}  >
                                            <p>{user.username}</p>
                                            
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                        {console.log(chats)}
                        {chats.map((user) =>
                            <div key={user.id} 
                            className='py-2 px-4 bg-green-100 flex gap-1
                            border border-slate-300 hover:border-red-400'
                            >
                                <p>{user.displayName ? user.displayName : user.chat_name || 'No Name'}</p>
                                <button className='bg-red-500 px-1 py-1 rounded text-white' onClick={() => handleUserClick(user)}>Chat</button>
                                <button className='bg-green-500 px-1 py-1 rounded text-white' onClick={() => deleteChat(user.id)}>Delete</button>
                            </div>
                        )}
                    </div>
                    <div className='w-full'>
                        {userDetail && <Chat chatDetail={userDetail} />}
                    </div>
                </div>
            }
        </>
    );
};

export default Chats;
