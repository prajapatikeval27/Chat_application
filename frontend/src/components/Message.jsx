// import React from 'react'
// import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
// import { faCheckDouble } from '@fortawesome/free-solid-svg-icons';

// function Message({sender, message, isSenderMe, is_read}) {
//     return (
//         <div className='bg-red-400 rounded flex flex-col gap-1 w-fit px-1 py-1'>
//             <div className='flex justify-start px-1'><h6 className='text-[10px] font-medium'>{isSenderMe ? 'Me' : sender}</h6></div>
//             <div className='px-2'>
//                 <div className='text-[13px] w-full  px-2 font-light'>
//                     {message}
//                     {isSenderMe && ( // Render checkmarks only for sender messages
//                         <span>
//                             <FontAwesomeIcon icon={faCheckDouble} className={`${is_read ? 'text-blue-900' : 'text-gray-400'}`} />
//                         </span>
//                     )}
//                 </div>
//                 {/* {is_read && ( // Conditionally render checkmark only for read messages
//                     <FontAwesomeIcon icon={faCheck} className={`text-gray-400 ${isSenderMe ? '' : ''}`} />
//                 )} */}
//             </div>
//         </div>
//     )
// }

// export default Message
import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheckDouble } from '@fortawesome/free-solid-svg-icons';

function Message({ sender, message, isSenderMe, is_read }) {
    return (
        <div
        className='message flex flex-col rounded-lg p-2 max-w-[600px] min-w-[70px] bg-gray-200 text-black justify-end '>
        {/* {isSenderMe && ( // Only show sender name for outgoing messages
            <p className="text-sm font-bold mb-1">{sender}</p>
        )} */}
        <p className="text-xs font-bold">{isSenderMe ? 'Me' : sender}</p>
        <p className="text-sm font-light break-words ">{message}</p>
        {isSenderMe && ( // Render checkmarks only for sender messages
            <span className="flex justify-end items-center">
            <FontAwesomeIcon
                icon={faCheckDouble}
                className={is_read ? 'text-blue-500' : 'text-gray-400'}
            />
            </span>
        )}
        </div>
    );
}

export default Message;
