import React, { useState } from 'react';
import { CgUnavailable } from "react-icons/cg";
import { LiaCheckDoubleSolid,LiaCheckSolid } from "react-icons/lia";

function Message({message, isSenderMe, deleteMessage, editMessage, isEditMessage=false, is_ai_chat=false }) {
    const [dropdown, setDropdown] = useState(false)

    const setDropdownMenu = () => {
        if (dropdown){
            setDropdown(false)
        } else{
            setDropdown(true)
        }
    }
    return (
        <>
            {isEditMessage ? 
                <div className='message flex flex-col 
                        rounded-lg p-2 max-w-[600px] min-w-[70px] bg-blue-400 text-black justify-end animate-pulse'>
                    <p className="text-xs font-bold">Me</p>
                    <p className="text-sm font-light break-words ">{message}</p>
                </div>
                :
                <div className={`message flex flex-col 
                        rounded-lg p-2 max-w-[600px] min-w-[100px] ${isSenderMe ? 'bg-blue-200':'bg-gray-200'}  text-black justify-end `}>
            
                    <div className='flex justify-between text-center'>
                        <p className="text-xs font-bold">{isSenderMe ? 'Me' : message.sender}</p>
                        {isSenderMe && message.is_deleted == false && is_ai_chat == false ?
                            <div>
                                <button id="dropdownMenuIconButton" onClick={() => setDropdownMenu()} data-dropdown-toggle="dropdownDots" className="inline-flex -translate-y-1 items-center rounded-full text-sm font-sans text-right bg-gray dark:text-black" type="button">
                                    <svg className="w-3 h-[0.62rem] font-bold" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 4 15">
                                        <path d="M3.5 1.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Zm0 6.041a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Zm0 5.959a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Z"/>
                                    </svg>
                                </button>
                                
                                    <div id="dropdownDots" className={`absolute ${dropdown ? '' : 'hidden'} z-10 -translate-x-12 translate-y-1 bg-white divide-y text-black rounded-lg shadow dark:bg-white`}>
                                        <ul className="py-2 text-sm text-right text-gray-700 dark:text-gray-200" aria-labelledby="dropdownMenuIconButton">
                                            <li>
                                                <a href="#" onClick={() => editMessage(message.id, message.message)} className="block px-3 py-1 text-black  hover:bg-gray-100 dark:hover:bg-gray-300">Edit</a>
                                            </li>
                                            <hr />
                                            <li>
                                                <a href="#" onClick={() => deleteMessage(message.id)} className="block px-3 py-1 text-black hover:bg-red-400">Delete</a>
                                            </li>
                                        </ul>
                                    </div>
                            </div> : <div></div>
                        }
                    </div>
                    {message.is_deleted ? 
                        <p className="text-sm font-light break-words text-gray-600 italic flex items-center"><CgUnavailable className='text-lg text-gray-600'/>{message.message}</p>
                        :
                        <p className="text-sm font-light break-words ">{message.message}</p>
                    }
                
                        <span className={`pt-1 flex ${message.is_edited ? 'justify-between' : 'justify-end' } items-center`}>
                            <p className='text-xs italic text-gray-500'>{message.is_edited ? 'Edited' : ''}</p>
                    {isSenderMe && is_ai_chat == false && (
                        message.is_read ? 
                            <LiaCheckDoubleSolid className='text-blue-500 text-lg font-extrabold'/>
                            :
                            <LiaCheckDoubleSolid className='text-gray-500 text-lg font-extrabold'/>
                        )}
                        </span>
                </div>
            }
        </>
    );
}

export default Message;
