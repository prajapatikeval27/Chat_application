import React, { useEffect, useState } from 'react'
import Navbar from './Navbar'
import api from '../api';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function UserProfile() {
    const [id, setId] = useState('')
    const [email, setEmail] = useState('')
    const [username, setUsername] = useState('')
    const [first_name, setFirstName] = useState('')
    const [last_name, setLastName] = useState('')
    const [bio, setBio] = useState('')
    
    const fetchProfile = async () => {
        const response = await api.get("api/individual_profile/");
        setId(response.data[0].id)
        setEmail(response.data[0].email)
        setUsername(response.data[0].username)
        setFirstName(response.data[0].first_name)
        setLastName(response.data[0].last_name)
        setBio(response.data[0].bio)
    }

    const updateProfile = async (e) => {
        e.preventDefault();
        try{
            const url = `api/profiles/${id}/`
            const response = await api.patch(url, {
                email,
                username,
                first_name,
                last_name,
                bio
            })
            setId(response.data.id)
            setEmail(response.data.email)
            setUsername(response.data.username)
            setFirstName(response.data.first_name)
            setLastName(response.data.last_name)
            setBio(response.data.bio)
            toast.success("Profile Updated")
            } catch(err){
                alert(err)
                toast.error(err)
        }
    }

    useEffect(() => {
        fetchProfile()
    }, [])
    return (
        <>
            <Navbar />
            <div className='pt-10'>
                <ToastContainer />
                <form className="form-container" onSubmit={updateProfile}>
                    <div>
                        <h1 className='font-medium'>Profile</h1>
                    </div>
                    <div className="input-div">
                        <input
                            className="form-input" 
                            type="email" 
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Username"
                            />
                        <input
                            className="form-input" 
                            type="text" 
                            value={username || ''}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="Username"
                            />
                        <input
                            className="form-input" 
                            type="text" 
                            value={first_name || ''}
                            onChange={(e) => setFirstName(e.target.value)}
                            placeholder="First Name"
                            />
                        <input
                            className="form-input" 
                            type="text" 
                            value={last_name || ''}
                            onChange={(e) => setLastName(e.target.value)}
                            placeholder="Last Name"
                            />
                        <input
                            className="form-input" 
                            type="text" 
                            value={bio || ''}
                            onChange={(e) => setBio(e.target.value)}
                            placeholder="Bio"
                            />
                    </div>
                    <div className="submit-div">
                        <button className="form-button" type="submit">Update</button>
                    </div>
                </form>
            </div>
        </>
    )
}

export default UserProfile